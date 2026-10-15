from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseCategoryBreakdown


DEFAULT_CATEGORIES = [
    "Shop Rent",
    "Electricity / Utilities",
    "Staff Wages",
    "Chai & Refreshments",
    "Transport & Carriage",
    "Packaging & Bags",
    "Repairs & Maintenance",
    "Miscellaneous"
]


class ExpenseService:
    @staticmethod
    def get_expenses(
        db: Session,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Expense], int, float, float, List[str], List[ExpenseCategoryBreakdown]]:
        query = db.query(Expense)

        if category and category.lower() != "all":
            query = query.filter(Expense.category == category)
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)

        total = query.count()
        items = query.order_by(Expense.date.desc(), Expense.id.desc()).offset(skip).limit(limit).all()

        total_amount = db.query(func.coalesce(func.sum(Expense.amount), 0.0))
        if start_date:
            total_amount = total_amount.filter(Expense.date >= start_date)
        if end_date:
            total_amount = total_amount.filter(Expense.date <= end_date)
        total_sum = float(total_amount.scalar() or 0.0)

        # Today's expense
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_sum = float(
            db.query(func.coalesce(func.sum(Expense.amount), 0.0))
            .filter(Expense.date >= today_start)
            .scalar() or 0.0
        )

        # Category breakdown
        breakdown_rows = (
            db.query(
                Expense.category,
                func.sum(Expense.amount).label("cat_total"),
                func.count(Expense.id).label("cat_count")
            )
            .group_by(Expense.category)
            .all()
        )

        overall_total = sum(float(r.cat_total) for r in breakdown_rows) or 1.0
        breakdowns = [
            ExpenseCategoryBreakdown(
                category=r.category,
                total_amount=round(float(r.cat_total), 2),
                count=int(r.cat_count),
                percentage=round((float(r.cat_total) / overall_total) * 100, 1)
            )
            for r in breakdown_rows
        ]
        breakdowns.sort(key=lambda x: x.total_amount, reverse=True)

        # Distinct categories
        existing_categories = [r.category for r in breakdown_rows]
        all_categories = sorted(list(set(DEFAULT_CATEGORIES + existing_categories)))

        return items, total, round(total_sum, 2), round(today_sum, 2), all_categories, breakdowns

    @staticmethod
    def get_expense_by_id(db: Session, expense_id: int) -> Expense:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found."
            )
        return expense

    @staticmethod
    def create_expense(db: Session, expense_in: ExpenseCreate) -> Expense:
        expense = Expense(
            title=expense_in.title.strip(),
            category=expense_in.category.strip(),
            amount=round(expense_in.amount, 2),
            payment_method=expense_in.payment_method,
            date=expense_in.date if expense_in.date else datetime.now(timezone.utc),
            notes=expense_in.notes.strip() if expense_in.notes else None
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def update_expense(db: Session, expense_id: int, expense_in: ExpenseUpdate) -> Expense:
        expense = ExpenseService.get_expense_by_id(db, expense_id)
        update_data = expense_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            elif field == "amount" and value is not None:
                value = round(value, 2)
            setattr(expense, field, value)

        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def delete_expense(db: Session, expense_id: int) -> bool:
        expense = ExpenseService.get_expense_by_id(db, expense_id)
        db.delete(expense)
        db.commit()
        return True
