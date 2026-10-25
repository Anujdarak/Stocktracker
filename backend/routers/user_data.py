from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

try:
    from backend.services.auth import get_current_user
    from backend.services.user_data import (
        get_watchlist,
        add_to_watchlist,
        remove_from_watchlist,
        sync_watchlist,
        get_user_preferences,
        update_user_preferences,
        get_analysis_history,
        delete_analysis_record
    )
except ImportError:
    from services.auth import get_current_user
    from services.user_data import (
        get_watchlist,
        add_to_watchlist,
        remove_from_watchlist,
        sync_watchlist,
        get_user_preferences,
        update_user_preferences,
        get_analysis_history,
        delete_analysis_record
    )

router = APIRouter(tags=["User Data Persistence"])


class WatchlistAddRequest(BaseModel):
    ticker: str


class WatchlistSyncRequest(BaseModel):
    tickers: List[str]


class PreferencesUpdateRequest(BaseModel):
    settings: Dict[str, Any]


# ==================== WATCHLIST ENDPOINTS ====================

@router.get("/api/watchlist")
@router.get("/api/user/watchlist")
def fetch_user_watchlist(current_user: dict = Depends(get_current_user)):
    """Fetch the authenticated user's persistent watchlist from MongoDB."""
    tickers = get_watchlist(current_user["id"])
    return {
        "status": "success",
        "data": tickers
    }


@router.post("/api/watchlist")
@router.post("/api/user/watchlist")
def add_ticker_to_watchlist(
    payload: WatchlistAddRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a stock ticker to the user's persistent watchlist in MongoDB."""
    tickers = add_to_watchlist(current_user["id"], payload.ticker)
    return {
        "status": "success",
        "message": f"Added {payload.ticker.upper()} to watchlist.",
        "data": tickers
    }


@router.delete("/api/watchlist/{ticker}")
@router.delete("/api/user/watchlist/{ticker}")
def remove_ticker_from_watchlist(
    ticker: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a stock ticker from the user's persistent watchlist in MongoDB."""
    tickers = remove_from_watchlist(current_user["id"], ticker)
    return {
        "status": "success",
        "message": f"Removed {ticker.upper()} from watchlist.",
        "data": tickers
    }


@router.post("/api/user/watchlist/sync")
def sync_user_watchlist(
    payload: WatchlistSyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """Bulk synchronize / merge tickers into user's MongoDB watchlist."""
    tickers = sync_watchlist(current_user["id"], payload.tickers)
    return {
        "status": "success",
        "message": "Watchlist synced successfully.",
        "data": tickers
    }


# ==================== PREFERENCES ENDPOINTS ====================

@router.get("/api/user/preferences")
def fetch_user_preferences(current_user: dict = Depends(get_current_user)):
    """Retrieve saved user preferences from MongoDB."""
    prefs = get_user_preferences(current_user["id"])
    return {
        "status": "success",
        "data": prefs
    }


@router.put("/api/user/preferences")
def save_user_preferences(
    payload: PreferencesUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save user preferences in MongoDB."""
    prefs = update_user_preferences(current_user["id"], payload.settings)
    return {
        "status": "success",
        "message": "Preferences saved successfully.",
        "data": prefs
    }


# ==================== ANALYSIS HISTORY ENDPOINTS ====================

@router.get("/api/user/analysis-history")
def fetch_analysis_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve the user's recent saved AI chart analysis history from MongoDB."""
    history = get_analysis_history(current_user["id"], limit=limit)
    return {
        "status": "success",
        "data": history
    }


@router.delete("/api/user/analysis-history/{record_id}")
def delete_history_item(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a saved analysis history record owned by the user."""
    deleted = delete_analysis_record(current_user["id"], record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return {
        "status": "success",
        "message": "Analysis history record deleted."
    }
