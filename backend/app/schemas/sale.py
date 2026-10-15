from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity to purchase (must be >= 1)")


class SaleCreate(BaseModel):
    items: List[SaleItemCreate] = Field(..., min_length=1, description="List of items in the sale")
    discount_amount: float = Field(default=0.0, ge=0.0, description="Discount given in PKR")
    customer_name: Optional[str] = Field(None, max_length=150)
    customer_phone: Optional[str] = Field(None, max_length=50)
    payment_method: str = Field(default="Cash", description="Cash, JazzCash, EasyPaisa, Bank Transfer, Udhaar/Credit")
    notes: Optional[str] = Field(None, max_length=500)


class SaleItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    quantity: int
    unit_purchase_price: float
    unit_selling_price: float
    subtotal: float
    cost_subtotal: float
    profit: float

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    total_amount: float
    discount_amount: float
    net_amount: float
    total_cost: float
    gross_profit: float
    customer_name: Optional[str]
    customer_phone: Optional[str]
    payment_method: str
    notes: Optional[str]
    created_at: datetime
    items: List[SaleItemResponse]

    class Config:
        from_attributes = True


class SaleListResponse(BaseModel):
    items: List[SaleResponse]
    total: int
    today_sales_amount: float
    today_transactions_count: int
