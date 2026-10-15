from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.ai import AIStatusResponse, AIQueryRequest, AIQueryResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["AI Integration (Phase 2 Gemma Ready)"])


@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    return await AIService.check_ollama_status()


@router.post("/query", response_model=AIQueryResponse)
async def query_ai(req: AIQueryRequest, db: Session = Depends(get_db)):
    return await AIService.query_assistant(db, prompt=req.prompt, context_type=req.context_type or "general")
