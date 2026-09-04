from fastapi import APIRouter, Query
from typing import Optional
from services.corporate_actions import CorporateActionsService
from services.ipo import IPOService

router = APIRouter(prefix="/api/corporate-actions", tags=["Corporate Actions"])


@router.get("/stock/{symbol}")
def get_stock_actions(symbol: str):
    """
    Fetches official corporate actions (dividends and buybacks) directly from NSE for a specific stock.
    """
    return CorporateActionsService.get_stock_corporate_actions(symbol)


@router.get("/upcoming")
def get_upcoming_actions(
    from_date: Optional[str] = Query(None, description="Start date in DD-MM-YYYY format"),
    to_date: Optional[str] = Query(None, description="End date in DD-MM-YYYY format")
):
    """
    Fetches calendar-style upcoming corporate actions across all NSE equities.
    """
    return CorporateActionsService.get_upcoming_corporate_actions(from_date=from_date, to_date=to_date)


@router.get("/ipos")
def get_all_ipos():
    """
    Fetches Mainline and SME IPOs (upcoming, active, closed, and listed) with GMP and prospectus financials.
    """
    return IPOService.get_all_ipos()
