from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime, timezone
from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    payment_method = Column(String(50), nullable=False, default="Cash")  # Cash, JazzCash, EasyPaisa, Bank Transfer
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
