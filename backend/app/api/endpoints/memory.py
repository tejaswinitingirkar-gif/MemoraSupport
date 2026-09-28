from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.models.models import User
from app.schemas.schemas import MemoryResponse
from app.api.deps import get_current_user
from app.services.hindsight_service import hindsight_service

router = APIRouter()

@router.get("", response_model=MemoryResponse)
def get_memories(current_user: User = Depends(get_current_user)):
    """
    Retrieve structured long-term customer memories from Hindsight memory bank.
    Includes customer memory isolation per authenticated customer ID.
    """
    memories_data = hindsight_service.get_customer_memories(current_user.id)
    return memories_data

@router.get("/search")
def search_memories(
    q: str = Query(..., min_length=1),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Recall memories matching search query using Hindsight multi-strategy retrieval,
    with explainable relevance reasons and category filtering.
    """
    target_categories = [category] if category else None
    results = hindsight_service.recall_memories(
        current_user.id, 
        query=q, 
        limit=10,
        target_categories=target_categories
    )
    return {
        "customer_id": current_user.id,
        "query": q,
        "category": category,
        "results": results
    }
