from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.settings import StoreSettingsUpdate, StoreSettingsResponse
from app.services.settings_service import SettingsService
from app.seed import seed_database

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=StoreSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings_obj = SettingsService.get_settings(db)
    return StoreSettingsResponse.model_validate(settings_obj)


@router.put("", response_model=StoreSettingsResponse)
def update_settings(settings_in: StoreSettingsUpdate, db: Session = Depends(get_db)):
    updated = SettingsService.update_settings(db, settings_in)
    return StoreSettingsResponse.model_validate(updated)


@router.post("/reset-demo", status_code=status.HTTP_200_OK)
def reset_demo_data(db: Session = Depends(get_db)):
    seed_database(db, force_reset=True)
    return {"message": "DukaanAI database re-seeded successfully with authentic Pakistani retail demo data!"}
