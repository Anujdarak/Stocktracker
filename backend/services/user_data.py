import datetime
from datetime import timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId

try:
    from backend.services.db import (
        get_watchlists_collection,
        get_preferences_collection,
        get_analysis_history_collection
    )
except ImportError:
    from services.db import (
        get_watchlists_collection,
        get_preferences_collection,
        get_analysis_history_collection
    )


def normalize_ticker(ticker: str) -> str:
    """Normalize stock ticker symbol."""
    return ticker.strip().upper() if ticker else ""


# ==================== WATCHLIST ====================

def get_watchlist(user_id: str) -> List[str]:
    """Retrieve the authenticated user's saved watchlist of tickers."""
    collection = get_watchlists_collection()
    doc = collection.find_one({"user_id": str(user_id)})
    if not doc:
        return []
    return doc.get("tickers", [])


def add_to_watchlist(user_id: str, ticker: str) -> List[str]:
    """Add a ticker to the user's watchlist in MongoDB."""
    clean_ticker = normalize_ticker(ticker)
    if not clean_ticker:
        return get_watchlist(user_id)

    collection = get_watchlists_collection()
    now_iso = datetime.datetime.now(timezone.utc).isoformat()

    collection.update_one(
        {"user_id": str(user_id)},
        {
            "$addToSet": {"tickers": clean_ticker},
            "$set": {"updated_at": now_iso}
        },
        upsert=True
    )
    return get_watchlist(user_id)


def remove_from_watchlist(user_id: str, ticker: str) -> List[str]:
    """Remove a ticker from the user's watchlist in MongoDB."""
    clean_ticker = normalize_ticker(ticker)
    if not clean_ticker:
        return get_watchlist(user_id)

    collection = get_watchlists_collection()
    now_iso = datetime.datetime.now(timezone.utc).isoformat()

    collection.update_one(
        {"user_id": str(user_id)},
        {
            "$pull": {"tickers": clean_ticker},
            "$set": {"updated_at": now_iso}
        }
    )
    return get_watchlist(user_id)


def sync_watchlist(user_id: str, tickers: List[str]) -> List[str]:
    """
    Synchronize/merge a full list of tickers for the user's watchlist in MongoDB.
    Useful for merging local guest watchlist upon login.
    """
    clean_tickers = list(dict.fromkeys(
        normalize_ticker(t) for t in tickers if normalize_ticker(t)
    ))
    collection = get_watchlists_collection()
    now_iso = datetime.datetime.now(timezone.utc).isoformat()

    collection.update_one(
        {"user_id": str(user_id)},
        {
            "$set": {
                "tickers": clean_tickers,
                "updated_at": now_iso
            }
        },
        upsert=True
    )
    return clean_tickers


# ==================== PREFERENCES ====================

DEFAULT_PREFERENCES = {
    "default_chart_mode": "5day",
    "theme": "dark",
    "favorite_sectors": [],
    "currency_symbol": "₹"
}


def get_user_preferences(user_id: str) -> Dict[str, Any]:
    """Retrieve saved settings/preferences for the user."""
    collection = get_preferences_collection()
    doc = collection.find_one({"user_id": str(user_id)})
    if not doc:
        return DEFAULT_PREFERENCES.copy()
    prefs = DEFAULT_PREFERENCES.copy()
    prefs.update(doc.get("settings", {}))
    return prefs


def update_user_preferences(user_id: str, settings: Dict[str, Any]) -> Dict[str, Any]:
    """Update settings/preferences for the user in MongoDB."""
    collection = get_preferences_collection()
    now_iso = datetime.datetime.now(timezone.utc).isoformat()

    collection.update_one(
        {"user_id": str(user_id)},
        {
            "$set": {
                "settings": settings,
                "updated_at": now_iso
            }
        },
        upsert=True
    )
    return get_user_preferences(user_id)


# ==================== ANALYSIS HISTORY ====================

def save_analysis_history(
    user_id: str,
    ticker: Optional[str],
    analysis_type: str,
    data: Dict[str, Any]
) -> dict:
    """Save an AI chart analysis record into MongoDB associated with user."""
    collection = get_analysis_history_collection()
    now_iso = datetime.datetime.now(timezone.utc).isoformat()

    record = {
        "user_id": str(user_id),
        "ticker": normalize_ticker(ticker or data.get("detected_ticker") or data.get("ticker") or "STOCK"),
        "analysis_type": analysis_type,  # 'chart_screenshot' or '5day_chart'
        "technical_bias": data.get("technical_bias", ""),
        "plain_language_explanation": data.get("plain_language_explanation") or data.get("quick_5day_analysis", ""),
        "current_price": data.get("current_price", ""),
        "base_support": data.get("base_support", ""),
        "base_resistance": data.get("base_resistance", ""),
        "high_resistance": data.get("high_resistance", ""),
        "model_used": data.get("model_used", ""),
        "confidence": data.get("confidence", "Medium"),
        "key_levels": data.get("key_levels", []),
        "created_at": now_iso
    }

    result = collection.insert_one(record)
    record["id"] = str(result.inserted_id)
    if "_id" in record:
        del record["_id"]
    return record


def get_analysis_history(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve recent chart analysis history records for the authenticated user."""
    collection = get_analysis_history_collection()
    cursor = collection.find({"user_id": str(user_id)}).sort("created_at", -1).limit(limit)

    results = []
    for doc in cursor:
        doc["id"] = str(doc.get("_id", ""))
        if "_id" in doc:
            del doc["_id"]
        results.append(doc)
    return results


def delete_analysis_record(user_id: str, record_id: str) -> bool:
    """Delete a specific analysis history record owned by the user."""
    collection = get_analysis_history_collection()
    try:
        oid = ObjectId(record_id) if ObjectId.is_valid(record_id) else record_id
        res = collection.delete_one({"_id": oid, "user_id": str(user_id)})
        return res.deleted_count > 0
    except Exception:
        res = collection.delete_one({"_id": record_id, "user_id": str(user_id)})
        return res.deleted_count > 0
