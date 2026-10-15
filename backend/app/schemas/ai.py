from pydantic import BaseModel, Field
from typing import Optional, List


class AIStatusResponse(BaseModel):
    is_available: bool
    ollama_url: str
    model_name: str
    status: str
    message: str
    phase: str = "Phase 2 Ready"


class AIQueryRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=1000)
    context_type: Optional[str] = Field(default="general", description="general, inventory, low_stock, sales_summary")


class AIQueryResponse(BaseModel):
    answer: str
    source: str
    suggested_actions: List[str] = []
    model: str
