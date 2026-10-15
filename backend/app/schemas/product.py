from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Product title")
    sku: Optional[str] = Field(None, max_length=50, description="Optional stock keeping unit")
    barcode: Optional[str] = Field(None, max_length=100, description="Optional barcode / EAN")
    category: str = Field(..., min_length=2, max_length=100, description="Product category")
    description: Optional[str] = Field(None, max_length=500)
    purchase_price: float = Field(..., ge=0, description="Purchase cost in PKR")
    selling_price: float = Field(..., ge=0, description="Selling retail price in PKR")
    stock_quantity: int = Field(default=0, ge=0, description="Available stock units")
    min_stock_threshold: int = Field(default=5, ge=0, description="Low stock warning threshold")
    unit: str = Field(default="piece", description="Unit of measurement e.g. piece, kg, pack")
    is_active: bool = Field(default=True)

    @field_validator("selling_price")
    @classmethod
    def validate_selling_price(cls, v, values):
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    min_stock_threshold: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = None
    is_active: Optional[bool] = None


class StockAdjustRequest(BaseModel):
    product_id: int
    adjustment: int = Field(..., description="Positive to add stock, negative to reduce")
    reason: Optional[str] = Field(default="Manual Adjustment", description="Reason for stock change")


class ProductResponse(ProductBase):
    id: int
    is_low_stock: bool
    profit_margin: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    low_stock_count: int
    categories: List[str]
    total_stock_value: float
