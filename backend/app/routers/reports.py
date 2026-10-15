from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.schemas.reports import FinancialReportSummary
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/summary", response_model=FinancialReportSummary)
def get_reports_summary(
    period: str = Query("last_7_days", description="today, yesterday, last_7_days, last_30_days, this_month, custom"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    return ReportService.get_financial_summary(
        db, period=period, custom_start=start_date, custom_end=end_date
    )


@router.get("/export/sales")
def export_sales_csv(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    csv_buffer = ReportService.export_sales_csv(db, start_date=start_date, end_date=end_date)
    filename = f"dukaan_sales_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/expenses")
def export_expenses_csv(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    csv_buffer = ReportService.export_expenses_csv(db, start_date=start_date, end_date=end_date)
    filename = f"dukaan_expenses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/inventory")
def export_inventory_csv(db: Session = Depends(get_db)):
    csv_buffer = ReportService.export_inventory_csv(db)
    filename = f"dukaan_inventory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
