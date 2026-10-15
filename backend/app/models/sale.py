from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    
    total_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    net_amount = Column(Float, nullable=False, default=0.0)
    total_cost = Column(Float, nullable=False, default=0.0)
    gross_profit = Column(Float, nullable=False, default=0.0)
    
    customer_name = Column(String(150), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    payment_method = Column(String(50), nullable=False, default="Cash")  # Cash, JazzCash, EasyPaisa, Bank Transfer, Udhaar/Credit
    notes = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    product_name = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_purchase_price = Column(Float, nullable=False, default=0.0)
    unit_selling_price = Column(Float, nullable=False, default=0.0)
    subtotal = Column(Float, nullable=False, default=0.0)
    cost_subtotal = Column(Float, nullable=False, default=0.0)
    profit = Column(Float, nullable=False, default=0.0)
    
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")
