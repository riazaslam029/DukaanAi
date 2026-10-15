from pydantic import BaseModel
from typing import List, Optional


class ProductSalesStat(BaseModel):
    product_name: str
    quantity_sold: int
    total_revenue: float
    total_profit: float


class PaymentMethodStat(BaseModel):
    method: str
    count: int
    total_amount: float
    percentage: float


class ExpenseCategoryStat(BaseModel):
    category: str
    amount: float
    percentage: float


class DailyReportPoint(BaseModel):
    date: str
    sales: float
    expenses: float
    cogs: float
    gross_profit: float
    net_profit: float


class FinancialReportSummary(BaseModel):
    period_label: str
    start_date: str
    end_date: str
    
    total_sales: float
    total_cogs: float
    gross_profit: float
    total_expenses: float
    net_profit: float
    profit_margin_pct: float
    
    total_orders: int
    average_order_value: float

    daily_chart: List[DailyReportPoint]
    top_products: List[ProductSalesStat]
    expenses_by_category: List[ExpenseCategoryStat]
    sales_by_payment_method: List[PaymentMethodStat]
