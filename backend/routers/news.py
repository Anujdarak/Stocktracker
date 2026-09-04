from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any

try:
    from services.news import NewsService
except ImportError:
    from backend.services.news import NewsService

router = APIRouter(prefix="/api/news", tags=["news"])

@router.get("/latest", response_model=List[Dict[str, Any]])
async def get_latest_news():
    """Get the latest aggregated news from all RSS feeds."""
    try:
        news = await NewsService.get_latest_news()
        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_news(query: str = Query(..., min_length=1, description="Company or sector to search for")):
    """Get news filtered by a specific keyword."""
    try:
        news = await NewsService.search_news(query)
        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
