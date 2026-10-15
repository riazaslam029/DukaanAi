from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.routers import (
    products,
    sales,
    expenses,
    dashboard,
    reports,
    settings as settings_router,
    ai
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite schema
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial demo data if database is fresh
    db = SessionLocal()
    try:
        seed_database(db, force_reset=False)
    finally:
        db.close()
    
    yield


app = FastAPI(
    title=f"{settings.APP_NAME} — Retail Intelligence API",
    description="Backend API for DukaanAI: Inventory, Sales, Expenses, and Financial Analytics for Pakistani Retailers.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(expenses.router)
app.include_router(reports.router)
app.include_router(settings_router.router)
app.include_router(ai.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
        "currency": settings.DEFAULT_CURRENCY,
        "currency_symbol": settings.DEFAULT_CURRENCY_SYMBOL
    }


@app.get("/", tags=["Health"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API!",
        "documentation": "/docs",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
