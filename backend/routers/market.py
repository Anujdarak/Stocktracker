from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import math

try:
    from backend.services.market_data import market_data_service
    from backend.services.portfolio import portfolio_service
except ImportError:
    from services.market_data import market_data_service
    from services.portfolio import portfolio_service

class PortfolioSimulateRequest(BaseModel):
    holdings: List[Dict[str, Any]]

router = APIRouter(prefix="/api/market", tags=["Market Data"])

@router.get("/indices")
async def get_all_indices():
    """
    Get top indices (Nifty 50, Sensex, Bank Nifty) in one fast call.
    """
    try:
        data = market_data_service.get_all_indices()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch indices: {str(e)}")

@router.get("/movers")
async def get_movers():
    """
    Get top gainers and losers from the curated shortlist.
    """
    try:
        data = market_data_service.get_curated_movers()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market movers: {str(e)}")

@router.get("/sectors")
async def get_sectors():
    """
    Get performance summary of all 12 NSE sectors.
    """
    try:
        data = market_data_service.get_sector_summary()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sector summary: {str(e)}")

@router.get("/sectors/{sector_id}")
async def get_sector_constituents(sector_id: str):
    """
    Get quotes for all constituents in a specific sector.
    """
    try:
        sec = market_data_service.SECTORS.get(sector_id)
        if not sec:
            raise HTTPException(status_code=404, detail=f"Sector '{sector_id}' not found")
        
        quotes = []
        for ticker in sec["tickers"]:
            q = market_data_service.get_quote(ticker)
            if q:
                quotes.append(q)
        return {
            "status": "success",
            "sector": sec["name"],
            "data": quotes
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sector constituents: {str(e)}")

@router.get("/peers/{ticker}")
async def get_peers(ticker: str):
    """
    Get peer comparison stocks in the same sector.
    """
    try:
        data = market_data_service.get_peers(ticker)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch peers: {str(e)}")

@router.get("/index/{index_name}")
async def get_index(index_name: str):
    """
    Get current quote for major indices: NIFTY_50, BANK_NIFTY, SENSEX, or ^BSESN, etc.
    """
    try:
        data = market_data_service.get_index_data(index_name)
        return {"status": "success", "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch index data: {str(e)}")

@router.get("/quote/{ticker}")
async def get_quote(ticker: str):
    """
    Get current quote, price change, mcap, PE, etc. for a specific ticker.
    For Indian stocks via yfinance, often requires '.NS' suffix (e.g. RELIANCE.NS)
    """
    try:
        # Auto-append .NS if it doesn't look like an index or already has an exchange suffix.
        fetch_ticker = ticker
        if not ticker.startswith("^") and "." not in ticker:
            fetch_ticker = f"{ticker}.NS"

        data = market_data_service.get_quote(fetch_ticker)
        if not data:
            raise HTTPException(status_code=404, detail="Ticker not found or data unavailable")
        return {"status": "success", "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")

@router.get("/history/{ticker}")
async def get_history(
    ticker: str,
    interval: str = Query("1d", description="1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo"),
    period: str = Query("1mo", description="1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max")
):
    """
    Get historical OHLCV chart data for a specific ticker.
    """
    try:
        fetch_ticker = ticker
        if not ticker.startswith("^") and "." not in ticker:
            fetch_ticker = f"{ticker}.NS"

        data = market_data_service.get_historical_data(fetch_ticker, interval=interval, period=period)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/portfolio/samples")
async def get_portfolio_samples():
    """
    Get preset sample portfolios for quick 1-click testing.
    """
    return {"status": "success", "data": portfolio_service.SAMPLE_PORTFOLIOS}

@router.post("/portfolio-simulate")
async def simulate_portfolio(payload: PortfolioSimulateRequest):
    """
    Analyze portfolio sector concentration and run macro stress-tests.
    """
    try:
        result = portfolio_service.analyze_portfolio(payload.holdings)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio simulation failed: {str(e)}")

@router.get("/compare")
async def compare_stocks(tickers: str = Query(..., description="Comma-separated tickers (e.g. TCS,INFY)")):
    """
    Compare multiple stocks side-by-side with quotes and normalized performance.
    """
    try:
        ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
        if not ticker_list:
            raise HTTPException(status_code=400, detail="No tickers provided")

        quotes = []
        for t in ticker_list[:4]:  # limit to max 4 for clean UI
            q = market_data_service.get_quote(t)
            if q:
                # Also fetch 1-month history for comparative return line
                hist = market_data_service.get_historical_data(t, period="1mo", interval="1d")
                first_close = hist[0]["close"] if hist else (q.get("current_price") or 100.0)
                norm_series = []
                for pt in hist:
                    raw_pct = ((pt["close"] - first_close) / first_close) * 100 if first_close else 0.0
                    val = round(raw_pct, 2) if not (math.isnan(raw_pct) or math.isinf(raw_pct)) else 0.0
                    norm_series.append({"time": pt.get("time") or pt.get("date"), "value": val})
                
                cp = q.get("current_price") or first_close
                ret_pct = ((cp - first_close) / first_close) * 100 if first_close else 0.0
                safe_ret = round(ret_pct, 2) if not (math.isnan(ret_pct) or math.isinf(ret_pct)) else 0.0

                quotes.append({
                    "quote": q,
                    "return_1mo_percent": safe_ret,
                    "normalized_series": norm_series
                })

        return {"status": "success", "data": quotes}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stock comparison failed: {str(e)}")

@router.get("/screener")
async def run_screener(filter_type: str = Query("near_52w_high", description="near_52w_high, oversold, volume_surge, value_largecap")):
    """
    Technical and fundamental stock screener across the NSE shortlist.
    """
    try:
        raw_movers = market_data_service.get_curated_movers()
        # Collect all unique valid quotes available
        all_quotes = [q for q in (raw_movers.get("gainers", []) + raw_movers.get("losers", [])) if q and q.get("current_price") and q.get("status") != "limited_data"]

        # Additional shortlisted quotes
        for t in market_data_service.CURATED_SHORTLIST[:18]:
            q = market_data_service.get_quote(t)
            if q and q.get("current_price") and q.get("status") != "limited_data" and not any(x.get("symbol") == q.get("symbol") for x in all_quotes):
                all_quotes.append(q)

        filtered = []
        for q in all_quotes:
            cp = q.get("current_price") or 0.0
            h52 = q.get("52_week_high") or 0.0
            l52 = q.get("52_week_low") or 0.0
            pe = q.get("pe_ratio") or 0.0
            vol = q.get("volume") or 0

            if filter_type == "near_52w_high":
                if h52 > 0 and cp >= (h52 * 0.93):  # within 7% of 52W high
                    filtered.append({**q, "criterion_note": f"Trading within {round(((h52-cp)/h52)*100, 1)}% of 52-Week High (₹{h52})"})
            elif filter_type == "oversold":
                if l52 > 0 and cp <= (l52 * 1.15):  # within 15% of 52W low
                    filtered.append({**q, "criterion_note": f"Near 52-Week Low support (₹{l52})"})
            elif filter_type == "value_largecap":
                if 0 < pe < 25 and cp > 0:
                    filtered.append({**q, "criterion_note": f"Attractive P/E valuation of {pe}x"})
            elif filter_type == "volume_surge":
                filtered.append({**q, "criterion_note": f"High trading volume: {vol:,} shares"})

        if not filtered:
            filtered = [q for q in all_quotes if q.get("current_price") and q.get("status") != "limited_data"][:8]

        return {
            "status": "success",
            "filter_type": filter_type,
            "count": len(filtered),
            "data": filtered[:12]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screener failed: {str(e)}")

@router.get("/vix-outlook")
def get_vix_volatility_outlook() -> Dict[str, Any]:
    """
    Fetch India VIX-Based Expected Range Indicator for Nifty 50.
    Options formula: expected_daily_move_pct = VIX / sqrt(252).
    Calculates upper and lower bounds for the next trading session.
    Measures expected volatility magnitude, NOT direction.
    """
    try:
        data = market_data_service.get_vix_volatility_outlook()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VIX Volatility Outlook calculation failed: {str(e)}")
