from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    @staticmethod
    def get_products(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        low_stock_only: bool = False,
        is_active: Optional[bool] = True,
        skip: int = 0,
        limit: int = 200
    ) -> Tuple[List[Product], int, int, List[str], float]:
        query = db.query(Product)

        if is_active is not None:
            query = query.filter(Product.is_active == is_active)

        if category and category.lower() != "all":
            query = query.filter(Product.category == category)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.sku.ilike(search_pattern),
                    Product.barcode.ilike(search_pattern),
                    Product.category.ilike(search_pattern)
                )
            )

        if low_stock_only:
            query = query.filter(Product.stock_quantity <= Product.min_stock_threshold)

        total = query.count()
        items = query.order_by(Product.name.asc()).offset(skip).limit(limit).all()

        # Low stock count across active items
        low_stock_count = db.query(Product).filter(
            Product.is_active == True,
            Product.stock_quantity <= Product.min_stock_threshold
        ).count()

        # Available categories
        categories_query = db.query(Product.category).filter(Product.is_active == True).distinct().all()
        categories = sorted([c[0] for c in categories_query if c[0]])

        # Total stock value (stock_quantity * purchase_price)
        total_value = db.query(
            func.coalesce(func.sum(Product.stock_quantity * Product.purchase_price), 0.0)
        ).filter(Product.is_active == True).scalar()

        return items, total, low_stock_count, categories, round(float(total_value), 2)

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found."
            )
        return product

    @staticmethod
    def create_product(db: Session, product_in: ProductCreate) -> Product:
        # Check SKU uniqueness if provided
        if product_in.sku:
            existing = db.query(Product).filter(Product.sku == product_in.sku.strip()).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A product with SKU '{product_in.sku}' already exists."
                )

        product = Product(
            name=product_in.name.strip(),
            sku=product_in.sku.strip() if product_in.sku else None,
            barcode=product_in.barcode.strip() if product_in.barcode else None,
            category=product_in.category.strip(),
            description=product_in.description.strip() if product_in.description else None,
            purchase_price=product_in.purchase_price,
            selling_price=product_in.selling_price,
            stock_quantity=product_in.stock_quantity,
            min_stock_threshold=product_in.min_stock_threshold,
            unit=product_in.unit.strip() if product_in.unit else "piece",
            is_active=product_in.is_active
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update_product(db: Session, product_id: int, product_in: ProductUpdate) -> Product:
        product = ProductService.get_product_by_id(db, product_id)

        update_data = product_in.model_dump(exclude_unset=True)

        if "sku" in update_data and update_data["sku"]:
            existing = db.query(Product).filter(
                Product.sku == update_data["sku"].strip(),
                Product.id != product_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A product with SKU '{update_data['sku']}' already exists."
                )

        for field, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(product, field, value)

        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        product = ProductService.get_product_by_id(db, product_id)
        # Soft delete to preserve sales history references
        product.is_active = False
        db.commit()
        return True

    @staticmethod
    def adjust_stock(db: Session, product_id: int, adjustment: int, reason: str = "Manual Adjustment") -> Product:
        product = ProductService.get_product_by_id(db, product_id)
        new_quantity = product.stock_quantity + adjustment
        if new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reduce stock by {abs(adjustment)}. Current stock is {product.stock_quantity}."
            )
        product.stock_quantity = new_quantity
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def get_low_stock_products(db: Session, limit: int = 10) -> List[Product]:
        return db.query(Product).filter(
            Product.is_active == True,
            Product.stock_quantity <= Product.min_stock_threshold
        ).order_by(Product.stock_quantity.asc()).limit(limit).all()
