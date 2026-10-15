from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200, description="Expense title or description")
    category: str = Field(..., min_length=2, max_length=100, description="Category (Rent, Utilities, Chai/Food, etc.)")
    amount: float = Field(..., gt=0, description="Expense amount in PKR")
    payment_method: str = Field(default="Cash", description="Cash, JazzCash, EasyPaisa, Bank Transfer")
    date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    category: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    payment_method: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseCategoryBreakdown(BaseModel):
    category: str
    total_amount: float
    count: int
    percentage: float


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    total_amount: float
    today_expense_amount: float
    categories: List[str]
    category_breakdown: List[ExpenseCategoryBreakdown]
