from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import List
from app.database import get_db
from app.models.sale import Sale
from app.models.expense import Expense
from app.models.product import Product
from app.schemas.dashboard import DashboardSummary, DailyTrend
from app.schemas.sale import SaleResponse
from app.schemas.product import ProductResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Today's sales
    today_sales_row = (
        db.query(
            func.coalesce(func.sum(Sale.net_amount), 0.0),
            func.coalesce(func.sum(Sale.gross_profit), 0.0),
            func.count(Sale.id)
        )
        .filter(Sale.created_at >= today_start)
        .first()
    )
    today_sales = float(today_sales_row[0]) if today_sales_row else 0.0
    today_gross_profit = float(today_sales_row[1]) if today_sales_row else 0.0
    today_count = int(today_sales_row[2]) if today_sales_row else 0

    # Today's expenses
    today_expense_val = (
        db.query(func.coalesce(func.sum(Expense.amount), 0.0))
        .filter(Expense.date >= today_start)
        .scalar()
    )
    today_expenses = float(today_expense_val or 0.0)

    # Today's estimated net profit = gross profit - expenses
    today_net_profit = round(today_gross_profit - today_expenses, 2)

    # Inventory metrics
    total_products = db.query(Product).filter(Product.is_active == True).count()
    low_stock_count = (
        db.query(Product)
        .filter(Product.is_active == True, Product.stock_quantity <= Product.min_stock_threshold)
        .count()
    )
    total_inventory_value = float(
        db.query(func.coalesce(func.sum(Product.stock_quantity * Product.purchase_price), 0.0))
        .filter(Product.is_active == True)
        .scalar() or 0.0
    )

    # Recent sales (last 8)
    recent_sales_models = db.query(Sale).order_by(Sale.created_at.desc()).limit(8).all()
    recent_sales = [SaleResponse.model_validate(s) for s in recent_sales_models]

    # Low stock items (top 6 needing attention)
    low_stock_models = ProductService.get_low_stock_products(db, limit=6)
    low_stock_items = [ProductResponse.model_validate(p) for p in low_stock_models]

    # Weekly trend (last 7 days)
    seven_days_ago = today_start - timedelta(days=6)
    daily_sales = (
        db.query(
            func.strftime("%Y-%m-%d", Sale.created_at).label("day"),
            func.sum(Sale.net_amount).label("sales_sum"),
            func.sum(Sale.gross_profit).label("profit_sum")
        )
        .filter(Sale.created_at >= seven_days_ago)
        .group_by("day")
        .all()
    )
    sales_by_day = {row.day: (float(row.sales_sum), float(row.profit_sum)) for row in daily_sales}

    daily_expenses = (
        db.query(
            func.strftime("%Y-%m-%d", Expense.date).label("day"),
            func.sum(Expense.amount).label("exp_sum")
        )
        .filter(Expense.date >= seven_days_ago)
        .group_by("day")
        .all()
    )
    expenses_by_day = {row.day: float(row.exp_sum) for row in daily_expenses}

    weekly_trend: List[DailyTrend] = []
    curr = seven_days_ago
    while curr <= now:
        d_str = curr.strftime("%Y-%m-%d")
        s_val, gp_val = sales_by_day.get(d_str, (0.0, 0.0))
        e_val = expenses_by_day.get(d_str, 0.0)
        net_val = round(gp_val - e_val, 2)
        weekly_trend.append(DailyTrend(
            date=d_str,
            sales=round(s_val, 2),
            expenses=round(e_val, 2),
            profit=net_val
        ))
        curr += timedelta(days=1)

    return DashboardSummary(
        today_sales=round(today_sales, 2),
        today_expenses=round(today_expenses, 2),
        today_profit=today_net_profit,
        today_transactions_count=today_count,
        total_products=total_products,
        low_stock_count=low_stock_count,
        total_inventory_value=round(total_inventory_value, 2),
        recent_sales=recent_sales,
        low_stock_items=low_stock_items,
        weekly_trend=weekly_trend
    )
