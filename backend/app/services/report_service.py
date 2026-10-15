from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
import io
import csv
from app.models.sale import Sale, SaleItem
from app.models.expense import Expense
from app.models.product import Product
from app.schemas.reports import (
    FinancialReportSummary,
    DailyReportPoint,
    ProductSalesStat,
    PaymentMethodStat,
    ExpenseCategoryStat
)


class ReportService:
    @staticmethod
    def get_date_range(period: str, custom_start: Optional[datetime] = None, custom_end: Optional[datetime] = None):
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        if period == "today":
            start = today_start
            end = now
            label = "Today"
        elif period == "yesterday":
            start = today_start - timedelta(days=1)
            end = today_start - timedelta(seconds=1)
            label = "Yesterday"
        elif period == "last_7_days":
            start = today_start - timedelta(days=6)
            end = now
            label = "Last 7 Days"
        elif period == "last_30_days":
            start = today_start - timedelta(days=29)
            end = now
            label = "Last 30 Days"
        elif period == "this_month":
            start = today_start.replace(day=1)
            end = now
            label = "This Month"
        elif period == "custom" and custom_start and custom_end:
            start = custom_start
            end = custom_end
            label = f"{start.strftime('%d %b %Y')} - {end.strftime('%d %b %Y')}"
        else:
            # Default to last 7 days
            start = today_start - timedelta(days=6)
            end = now
            label = "Last 7 Days"

        return start, end, label

    @staticmethod
    def get_financial_summary(
        db: Session,
        period: str = "last_7_days",
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None
    ) -> FinancialReportSummary:
        start_date, end_date, label = ReportService.get_date_range(period, custom_start, custom_end)

        # Sales aggregation
        sales_data = db.query(
            func.coalesce(func.sum(Sale.net_amount), 0.0),
            func.coalesce(func.sum(Sale.total_cost), 0.0),
            func.coalesce(func.sum(Sale.gross_profit), 0.0),
            func.count(Sale.id)
        ).filter(Sale.created_at >= start_date, Sale.created_at <= end_date).first()

        total_sales = float(sales_data[0]) if sales_data else 0.0
        total_cogs = float(sales_data[1]) if sales_data else 0.0
        gross_profit = float(sales_data[2]) if sales_data else 0.0
        total_orders = int(sales_data[3]) if sales_data else 0

        # Expenses aggregation
        expense_data = db.query(
            func.coalesce(func.sum(Expense.amount), 0.0)
        ).filter(Expense.date >= start_date, Expense.date <= end_date).scalar()
        total_expenses = float(expense_data or 0.0)

        net_profit = gross_profit - total_expenses
        profit_margin_pct = round((net_profit / total_sales * 100), 2) if total_sales > 0 else 0.0
        avg_order = round(total_sales / total_orders, 2) if total_orders > 0 else 0.0

        # Daily chart datapoints
        daily_points: Dict[str, Dict[str, float]] = {}
        # Prepopulate days in range
        curr = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        while curr <= end_date:
            date_key = curr.strftime("%Y-%m-%d")
            daily_points[date_key] = {
                "sales": 0.0,
                "expenses": 0.0,
                "cogs": 0.0,
                "gross_profit": 0.0,
                "net_profit": 0.0
            }
            curr += timedelta(days=1)

        # Fill sales
        sales_list = db.query(Sale).filter(Sale.created_at >= start_date, Sale.created_at <= end_date).all()
        for s in sales_list:
            d_key = s.created_at.strftime("%Y-%m-%d")
            if d_key in daily_points:
                daily_points[d_key]["sales"] += s.net_amount
                daily_points[d_key]["cogs"] += s.total_cost
                daily_points[d_key]["gross_profit"] += s.gross_profit

        # Fill expenses
        expenses_list = db.query(Expense).filter(Expense.date >= start_date, Expense.date <= end_date).all()
        for e in expenses_list:
            d_key = e.date.strftime("%Y-%m-%d")
            if d_key in daily_points:
                daily_points[d_key]["expenses"] += e.amount

        # Compute net profit per day
        daily_chart: List[DailyReportPoint] = []
        for d_key, vals in sorted(daily_points.items()):
            net_d = round(vals["gross_profit"] - vals["expenses"], 2)
            daily_chart.append(DailyReportPoint(
                date=d_key,
                sales=round(vals["sales"], 2),
                expenses=round(vals["expenses"], 2),
                cogs=round(vals["cogs"], 2),
                gross_profit=round(vals["gross_profit"], 2),
                net_profit=net_d
            ))

        # Top selling products in this period
        top_items = (
            db.query(
                SaleItem.product_name,
                func.sum(SaleItem.quantity).label("total_qty"),
                func.sum(SaleItem.subtotal).label("total_rev"),
                func.sum(SaleItem.profit).label("total_pft")
            )
            .join(Sale, SaleItem.sale_id == Sale.id)
            .filter(Sale.created_at >= start_date, Sale.created_at <= end_date)
            .group_by(SaleItem.product_name)
            .order_by(func.sum(SaleItem.subtotal).desc())
            .limit(10)
            .all()
        )

        top_products = [
            ProductSalesStat(
                product_name=item.product_name,
                quantity_sold=int(item.total_qty),
                total_revenue=round(float(item.total_rev), 2),
                total_profit=round(float(item.total_pft), 2)
            )
            for item in top_items
        ]

        # Expense category breakdown
        cat_expenses = (
            db.query(
                Expense.category,
                func.sum(Expense.amount).label("cat_amt")
            )
            .filter(Expense.date >= start_date, Expense.date <= end_date)
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
            .all()
        )

        expenses_by_category = [
            ExpenseCategoryStat(
                category=c.category,
                amount=round(float(c.cat_amt), 2),
                percentage=round((float(c.cat_amt) / (total_expenses or 1.0)) * 100, 1)
            )
            for c in cat_expenses
        ]

        # Payment methods breakdown
        pm_sales = (
            db.query(
                Sale.payment_method,
                func.count(Sale.id).label("pm_count"),
                func.sum(Sale.net_amount).label("pm_amount")
            )
            .filter(Sale.created_at >= start_date, Sale.created_at <= end_date)
            .group_by(Sale.payment_method)
            .order_by(func.sum(Sale.net_amount).desc())
            .all()
        )

        sales_by_payment_method = [
            PaymentMethodStat(
                method=pm.payment_method,
                count=int(pm.pm_count),
                total_amount=round(float(pm.pm_amount), 2),
                percentage=round((float(pm.pm_amount) / (total_sales or 1.0)) * 100, 1)
            )
            for pm in pm_sales
        ]

        return FinancialReportSummary(
            period_label=label,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            total_sales=round(total_sales, 2),
            total_cogs=round(total_cogs, 2),
            gross_profit=round(gross_profit, 2),
            total_expenses=round(total_expenses, 2),
            net_profit=round(net_profit, 2),
            profit_margin_pct=profit_margin_pct,
            total_orders=total_orders,
            average_order_value=avg_order,
            daily_chart=daily_chart,
            top_products=top_products,
            expenses_by_category=expenses_by_category,
            sales_by_payment_method=sales_by_payment_method
        )

    @staticmethod
    def export_sales_csv(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> io.StringIO:
        query = db.query(Sale)
        if start_date:
            query = query.filter(Sale.created_at >= start_date)
        if end_date:
            query = query.filter(Sale.created_at <= end_date)
        sales = query.order_by(Sale.created_at.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Invoice #",
            "Date",
            "Customer Name",
            "Customer Phone",
            "Payment Method",
            "Items Count",
            "Total Amount (PKR)",
            "Discount (PKR)",
            "Net Amount (PKR)",
            "Cost (PKR)",
            "Profit (PKR)"
        ])

        for s in sales:
            writer.writerow([
                s.invoice_number,
                s.created_at.strftime("%Y-%m-%d %H:%M"),
                s.customer_name or "Walk-in Customer",
                s.customer_phone or "-",
                s.payment_method,
                len(s.items),
                f"{s.total_amount:.2f}",
                f"{s.discount_amount:.2f}",
                f"{s.net_amount:.2f}",
                f"{s.total_cost:.2f}",
                f"{s.gross_profit:.2f}"
            ])

        output.seek(0)
        return output

    @staticmethod
    def export_expenses_csv(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> io.StringIO:
        query = db.query(Expense)
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)
        expenses = query.order_by(Expense.date.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID",
            "Date",
            "Title",
            "Category",
            "Amount (PKR)",
            "Payment Method",
            "Notes"
        ])

        for e in expenses:
            writer.writerow([
                e.id,
                e.date.strftime("%Y-%m-%d %H:%M"),
                e.title,
                e.category,
                f"{e.amount:.2f}",
                e.payment_method,
                e.notes or "-"
            ])

        output.seek(0)
        return output

    @staticmethod
    def export_inventory_csv(db: Session) -> io.StringIO:
        products = db.query(Product).order_by(Product.category.asc(), Product.name.asc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID",
            "Product Name",
            "Category",
            "SKU",
            "Barcode",
            "Stock Quantity",
            "Unit",
            "Min Threshold",
            "Purchase Price (PKR)",
            "Selling Price (PKR)",
            "Stock Value (PKR)",
            "Profit Margin %",
            "Low Stock Status"
        ])

        for p in products:
            val = p.stock_quantity * p.purchase_price
            writer.writerow([
                p.id,
                p.name,
                p.category,
                p.sku or "-",
                p.barcode or "-",
                p.stock_quantity,
                p.unit,
                p.min_stock_threshold,
                f"{p.purchase_price:.2f}",
                f"{p.selling_price:.2f}",
                f"{val:.2f}",
                f"{p.profit_margin:.1f}%",
                "LOW STOCK" if p.is_low_stock else "Normal"
            ])

        output.seek(0)
        return output
