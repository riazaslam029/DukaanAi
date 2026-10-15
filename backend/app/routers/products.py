from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    StockAdjustRequest
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
def get_products(
    search: Optional[str] = Query(None, description="Search term across name, SKU, barcode, category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock_only: bool = Query(False, description="Filter only low stock items"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db)
):
    items, total, low_stock_count, categories, total_stock_value = ProductService.get_products(
        db, search=search, category=category, low_stock_only=low_stock_only, skip=skip, limit=limit
    )
    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in items],
        total=total,
        low_stock_count=low_stock_count,
        categories=categories,
        total_stock_value=total_stock_value
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = ProductService.get_product_by_id(db, product_id)
    return ProductResponse.model_validate(product)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    product = ProductService.create_product(db, product_in)
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    product = ProductService.update_product(db, product_id, product_in)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    ProductService.delete_product(db, product_id)
    return {"message": f"Product {product_id} deleted successfully."}


@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(product_id: int, req: StockAdjustRequest, db: Session = Depends(get_db)):
    product = ProductService.adjust_stock(db, product_id, req.adjustment, req.reason or "Manual Adjustment")
    return ProductResponse.model_validate(product)
