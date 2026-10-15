from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.schemas.sale import SaleCreate, SaleResponse, SaleListResponse
from app.services.sale_service import SaleService

router = APIRouter(prefix="/api/sales", tags=["Sales"])


@router.get("", response_model=SaleListResponse)
def get_sales(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    payment_method: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    items, total, today_amount, today_count = SaleService.get_sales(
        db, start_date=start_date, end_date=end_date, payment_method=payment_method, skip=skip, limit=limit
    )
    return SaleListResponse(
        items=[SaleResponse.model_validate(s) for s in items],
        total=total,
        today_sales_amount=today_amount,
        today_transactions_count=today_count
    )


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = SaleService.get_sale_by_id(db, sale_id)
    return SaleResponse.model_validate(sale)


@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(sale_in: SaleCreate, db: Session = Depends(get_db)):
    sale = SaleService.create_sale(db, sale_in)
    return SaleResponse.model_validate(sale)
