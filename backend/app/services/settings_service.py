from sqlalchemy.orm import Session
from app.models.settings import StoreSettings
from app.schemas.settings import StoreSettingsUpdate
from app.config import settings as app_settings


class SettingsService:
    @staticmethod
    def get_settings(db: Session) -> StoreSettings:
        store_settings = db.query(StoreSettings).first()
        if not store_settings:
            store_settings = StoreSettings(
                store_name=app_settings.DEFAULT_STORE_NAME,
                owner_name=app_settings.DEFAULT_OWNER_NAME,
                phone=app_settings.DEFAULT_PHONE,
                address=app_settings.DEFAULT_ADDRESS,
                city=app_settings.DEFAULT_CITY,
                currency=app_settings.DEFAULT_CURRENCY,
                currency_symbol=app_settings.DEFAULT_CURRENCY_SYMBOL,
                default_low_stock_threshold=app_settings.DEFAULT_LOW_STOCK_THRESHOLD,
                receipt_footer="JazakAllah Khair for your purchase! Please visit again."
            )
            db.add(store_settings)
            db.commit()
            db.refresh(store_settings)
        return store_settings

    @staticmethod
    def update_settings(db: Session, settings_in: StoreSettingsUpdate) -> StoreSettings:
        store_settings = SettingsService.get_settings(db)
        update_data = settings_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(store_settings, field, value)

        db.commit()
        db.refresh(store_settings)
        return store_settings
