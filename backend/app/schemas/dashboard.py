from pydantic import BaseModel
from typing import List
from app.schemas.sale import SaleResponse
from app.schemas.product import ProductResponse


class DailyTrend(BaseModel):
    date: str
    sales: float
    expenses: float
    profit: float


class DashboardSummary(BaseModel):
    # Today's metrics
    today_sales: float
    today_expenses: float
    today_profit: float
    today_transactions_count: int

    # Overall inventory metrics
    total_products: int
    low_stock_count: int
    total_inventory_value: float

    # Recent activity
    recent_sales: List[SaleResponse]
    low_stock_items: List[ProductResponse]
    
    # 7-day trend for charts
    weekly_trend: List[DailyTrend]
