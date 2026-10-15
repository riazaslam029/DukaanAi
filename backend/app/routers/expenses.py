from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


@router.get("", response_model=ExpenseListResponse)
def get_expenses(
    category: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    items, total, total_amount, today_expense, categories, breakdown = ExpenseService.get_expenses(
        db, category=category, start_date=start_date, end_date=end_date, skip=skip, limit=limit
    )
    return ExpenseListResponse(
        items=[ExpenseResponse.model_validate(e) for e in items],
        total=total,
        total_amount=total_amount,
        today_expense_amount=today_expense,
        categories=categories,
        category_breakdown=breakdown
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = ExpenseService.get_expense_by_id(db, expense_id)
    return ExpenseResponse.model_validate(expense)


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(expense_in: ExpenseCreate, db: Session = Depends(get_db)):
    expense = ExpenseService.create_expense(db, expense_in)
    return ExpenseResponse.model_validate(expense)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense_in: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = ExpenseService.update_expense(db, expense_id, expense_in)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    ExpenseService.delete_expense(db, expense_id)
    return {"message": f"Expense {expense_id} deleted successfully."}
