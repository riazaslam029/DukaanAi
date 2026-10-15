from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.sale import SaleCreate


class SaleService:
    @staticmethod
    def generate_invoice_number(db: Session) -> str:
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        prefix = f"DUK-{today_str}-"
        
        # Count sales today to increment suffix
        latest_sale = db.query(Sale).filter(Sale.invoice_number.like(f"{prefix}%")).order_by(Sale.id.desc()).first()
        if latest_sale:
            try:
                last_seq = int(latest_sale.invoice_number.split("-")[-1])
                seq = last_seq + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
            
        return f"{prefix}{seq:04d}"

    @staticmethod
    def create_sale(db: Session, sale_in: SaleCreate) -> Sale:
        if not sale_in.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale must contain at least one product."
            )

        # Step 1: Pre-validation of stock for all items before modifying anything
        product_map = {}
        for item_in in sale_in.items:
            product = db.query(Product).filter(Product.id == item_in.product_id).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} was not found."
                )
            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is inactive and cannot be sold."
                )
            if product.stock_quantity < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity} {product.unit}, Requested: {item_in.quantity} {product.unit}."
                )
            product_map[item_in.product_id] = product

        # Step 2: Build items and calculate totals using strict backend business logic
        invoice_num = SaleService.generate_invoice_number(db)
        sale_items: List[SaleItem] = []
        running_total_amount = 0.0
        running_total_cost = 0.0

        for item_in in sale_in.items:
            product = product_map[item_in.product_id]
            qty = item_in.quantity
            unit_price = round(product.selling_price, 2)
            unit_cost = round(product.purchase_price, 2)
            subtotal = round(qty * unit_price, 2)
            cost_subtotal = round(qty * unit_cost, 2)
            profit = round(subtotal - cost_subtotal, 2)

            # Deduct stock atomically
            product.stock_quantity -= qty

            sale_item = SaleItem(
                product_id=product.id,
                product_name=product.name,
                quantity=qty,
                unit_purchase_price=unit_cost,
                unit_selling_price=unit_price,
                subtotal=subtotal,
                cost_subtotal=cost_subtotal,
                profit=profit
            )
            sale_items.append(sale_item)
            running_total_amount += subtotal
            running_total_cost += cost_subtotal

        discount = round(sale_in.discount_amount, 2)
        if discount > running_total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Discount (Rs. {discount:,.2f}) cannot exceed total sale amount (Rs. {running_total_amount:,.2f})."
            )

        net_amount = round(max(0.0, running_total_amount - discount), 2)
        gross_profit = round(net_amount - running_total_cost, 2)

        sale = Sale(
            invoice_number=invoice_num,
            total_amount=round(running_total_amount, 2),
            discount_amount=discount,
            net_amount=net_amount,
            total_cost=round(running_total_cost, 2),
            gross_profit=gross_profit,
            customer_name=sale_in.customer_name.strip() if sale_in.customer_name else None,
            customer_phone=sale_in.customer_phone.strip() if sale_in.customer_phone else None,
            payment_method=sale_in.payment_method,
            notes=sale_in.notes.strip() if sale_in.notes else None,
            created_at=datetime.now(timezone.utc),
            items=sale_items
        )

        db.add(sale)
        db.commit()
        db.refresh(sale)
        return sale

    @staticmethod
    def get_sales(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        payment_method: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Sale], int, float, int]:
        query = db.query(Sale)

        if start_date:
            query = query.filter(Sale.created_at >= start_date)
        if end_date:
            query = query.filter(Sale.created_at <= end_date)
        if payment_method and payment_method.lower() != "all":
            query = query.filter(Sale.payment_method == payment_method)

        total = query.count()
        items = query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()

        # Calculate today's sales metrics
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_query = db.query(
            func.coalesce(func.sum(Sale.net_amount), 0.0),
            func.count(Sale.id)
        ).filter(Sale.created_at >= today_start).first()

        today_amount = float(today_query[0]) if today_query else 0.0
        today_count = int(today_query[1]) if today_query else 0

        return items, total, round(today_amount, 2), today_count

    @staticmethod
    def get_sale_by_id(db: Session, sale_id: int) -> Sale:
        sale = db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sale with ID {sale_id} not found."
            )
        return sale
