from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StoreSettingsBase(BaseModel):
    store_name: str = Field(..., min_length=2, max_length=200)
    owner_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=5, max_length=50)
    address: str = Field(..., min_length=3, max_length=300)
    city: str = Field(..., min_length=2, max_length=100)
    currency: str = Field(default="PKR", max_length=10)
    currency_symbol: str = Field(default="Rs.", max_length=10)
    default_low_stock_threshold: int = Field(default=5, ge=1, le=1000)
    receipt_footer: str = Field(default="JazakAllah Khair for your purchase! Please visit again.", max_length=300)


class StoreSettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None
    default_low_stock_threshold: Optional[int] = Field(None, ge=1, le=1000)
    receipt_footer: Optional[str] = None


class StoreSettingsResponse(StoreSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
