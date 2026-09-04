from fastapi import APIRouter, Query
from typing import List, Dict
from backend.services.search import search_service

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("/")
async def search_equities(
    q: str = Query(..., min_length=1, description="Search query for ticker symbol or company name"),
    limit: int = Query(10, description="Maximum number of results to return")
):
    """
    Search for NSE equities by symbol or company name.
    """
    results = search_service.search(query=q, limit=limit)
    return {
        "status": "success",
        "query": q,
        "results": results
    }
