from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.database import Base


class StoreSettings(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String(200), nullable=False, default="Bismillah Kiryana & General Store")
    owner_name = Column(String(150), nullable=False, default="Haji Muhammad Aslam")
    phone = Column(String(50), nullable=False, default="0300-1234567")
    address = Column(String(300), nullable=False, default="Shop #4, Main Market, Gulberg III")
    city = Column(String(100), nullable=False, default="Lahore")
    currency = Column(String(10), nullable=False, default="PKR")
    currency_symbol = Column(String(10), nullable=False, default="Rs.")
    default_low_stock_threshold = Column(Integer, nullable=False, default=5)
    receipt_footer = Column(String(300), nullable=False, default="JazakAllah Khair for your purchase! Please visit again.")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
