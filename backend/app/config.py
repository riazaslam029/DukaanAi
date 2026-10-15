from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "DukaanAI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    DATABASE_URL: str = "sqlite:///./dukaan.db"

    DEFAULT_STORE_NAME: str = "Bismillah Kiryana & General Store"
    DEFAULT_OWNER_NAME: str = "Haji Muhammad Aslam"
    DEFAULT_PHONE: str = "0300-1234567"
    DEFAULT_ADDRESS: str = "Shop #4, Main Market, Gulberg III"
    DEFAULT_CITY: str = "Lahore"
    DEFAULT_CURRENCY: str = "PKR"
    DEFAULT_CURRENCY_SYMBOL: str = "Rs."
    DEFAULT_LOW_STOCK_THRESHOLD: int = 5

    # Gemma / Ollama AI Settings (Phase 2 readiness)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:1b"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
