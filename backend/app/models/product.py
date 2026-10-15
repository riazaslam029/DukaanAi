from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime, timezone
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    sku = Column(String(50), nullable=True, unique=True, index=True)
    barcode = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(500), nullable=True)
    
    purchase_price = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    stock_quantity = Column(Integer, nullable=False, default=0)
    min_stock_threshold = Column(Integer, nullable=False, default=5)
    unit = Column(String(30), nullable=False, default="piece")
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def is_low_stock(self) -> bool:
        return self.stock_quantity <= self.min_stock_threshold

    @property
    def profit_margin(self) -> float:
        if self.selling_price > 0:
            return round(((self.selling_price - self.purchase_price) / self.selling_price) * 100, 2)
        return 0.0
