import yfinance as yf
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor
import math
import time
import logging

logger = logging.getLogger(__name__)

class MarketDataService:
    INDICES = {
        "NIFTY_50": "^NSEI",
        "BANK_NIFTY": "^NSEBANK",
        "SENSEX": "^BSESN",
        "^NSEI": "^NSEI",
        "^NSEBANK": "^NSEBANK",
        "^BSESN": "^BSESN"
    }

    INDEX_DISPLAY_NAMES = {
        "^NSEI": "NIFTY 50",
        "^NSEBANK": "BANK NIFTY",
        "^BSESN": "SENSEX",
        "NIFTY_50": "NIFTY 50",
        "BANK_NIFTY": "BANK NIFTY",
        "SENSEX": "SENSEX"
    }

    # Curated ~28 stock shortlist for homepage widgets and top movers
    CURATED_SHORTLIST = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS",
        "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS", "LT.NS",
        "AXISBANK.NS", "HINDUNILVR.NS", "NESTLEIND.NS", "MARUTI.NS", "SUNPHARMA.NS",
        "BAJFINANCE.NS", "TITAN.NS", "TATASTEEL.NS", "NTPC.NS", "POWERGRID.NS",
        "ONGC.NS", "M&M.NS", "ADANIENT.NS", "COALINDIA.NS", "WIPRO.NS",
        "HCLTECH.NS", "HAL.NS", "BEL.NS", "TATACONSUM.NS"
    ]

    # 12 Official NSE Sectoral categories with 10-15 recognizable constituents each
    SECTORS = {
        "banking": {
            "id": "banking",
            "name": "Banking & Financial Services",
            "tickers": [
                "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS",
                "INDUSINDBK.NS", "BANKBARODA.NS", "PNB.NS", "FEDERALBNK.NS", "IDFCFIRSTB.NS",
                "BAJFINANCE.NS", "BAJAJFINSV.NS"
            ]
        },
        "it": {
            "id": "it",
            "name": "IT & Technology",
            "tickers": [
                "TCS.NS", "INFY.NS", "HCLTECH.NS", "WIPRO.NS", "TECHM.NS",
                "LTIM.NS", "PERSISTENT.NS", "COFORGE.NS", "MPHASIS.NS", "LTTS.NS"
            ]
        },
        "defense": {
            "id": "defense",
            "name": "Defense & Aerospace",
            "tickers": [
                "HAL.NS", "BEL.NS", "BEML.NS", "MAZDOCK.NS", "BDL.NS",
                "COCHINSHIP.NS", "DATAPATTNS.NS", "PARAS.NS", "MTARTECH.NS", "SOLARINDS.NS"
            ]
        },
        "auto": {
            "id": "auto",
            "name": "Auto & Auto Components",
            "tickers": [
                "MARUTI.NS", "HEROMOTOCO.NS", "M&M.NS", "BAJAJ-AUTO.NS", "EICHERMOT.NS",
                "TVSMOTOR.NS", "BHARATFORG.NS", "ASHOKLEY.NS", "BOSCHLTD.NS"
            ]
        },
        "pharma": {
            "id": "pharma",
            "name": "Pharma & Healthcare",
            "tickers": [
                "SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS",
                "LUPIN.NS", "AUROPHARMA.NS", "TORNTPHARM.NS", "MANKIND.NS", "ZYDUSLIFE.NS"
            ]
        },
        "fmcg": {
            "id": "fmcg",
            "name": "FMCG",
            "tickers": [
                "HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS",
                "GODREJCP.NS", "MARICO.NS", "TATACONSUM.NS", "COLPAL.NS", "VBL.NS"
            ]
        },
        "energy": {
            "id": "energy",
            "name": "Energy & Oil/Gas",
            "tickers": [
                "RELIANCE.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS", "BPCL.NS",
                "IOC.NS", "GAIL.NS", "TATAPOWER.NS", "ADANIGREEN.NS", "OIL.NS"
            ]
        },
        "metals": {
            "id": "metals",
            "name": "Metals & Mining",
            "tickers": [
                "TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS", "VEDL.NS", "COALINDIA.NS",
                "JINDALSTEL.NS", "NMDC.NS", "NATIONALUM.NS", "SAIL.NS", "APLAPOLLO.NS"
            ]
        },
        "infra": {
            "id": "infra",
            "name": "Infrastructure & Cement",
            "tickers": [
                "LT.NS", "ULTRACEMCO.NS", "GRASIM.NS", "SHREECEM.NS", "AMBUJACEM.NS",
                "ACC.NS", "DALBHARAT.NS", "GMRINFRA.NS", "IRB.NS", "NBCC.NS"
            ]
        },
        "telecom": {
            "id": "telecom",
            "name": "Telecom",
            "tickers": [
                "BHARTIARTL.NS", "IDEA.NS", "TATACOMM.NS", "INDUSTOWER.NS", "HFCL.NS",
                "TEJASNET.NS", "RAILTEL.NS"
            ]
        },
        "psu": {
            "id": "psu",
            "name": "PSU (Public Sector)",
            "tickers": [
                "SBIN.NS", "ONGC.NS", "NTPC.NS", "COALINDIA.NS", "BPCL.NS",
                "IOC.NS", "POWERGRID.NS", "HAL.NS", "BEL.NS", "BANKBARODA.NS"
            ]
        },
        "realty": {
            "id": "realty",
            "name": "Realty",
            "tickers": [
                "DLF.NS", "GODREJPROP.NS", "OBEROIRLTY.NS", "PHOENIXLTD.NS", "BRIGADE.NS",
                "PRESTIGE.NS", "SOBHA.NS", "LODHA.NS", "SUNTECK.NS"
            ]
        }
    }

    def __init__(self):
        # In-memory quote cache: { ticker: (timestamp, data) }
        self._quote_cache: Dict[str, tuple[float, Dict[str, Any]]] = {}
        self._cache_ttl = 60  # seconds
        self._movers_cache: Optional[Dict[str, Any]] = None
        self._movers_ts: float = 0
        self._sectors_cache: Optional[List[Dict[str, Any]]] = None
        self._sectors_ts: float = 0
        self._vix_cache: Optional[Dict[str, Any]] = None
        self._vix_ts: float = 0

    def _get_cached_quote(self, ticker: str) -> Optional[Dict[str, Any]]:
        cached = self._quote_cache.get(ticker)
        if cached:
            ts, data = cached
            if time.time() - ts < self._cache_ttl:
                return data
        return None

    def _set_cached_quote(self, ticker: str, data: Dict[str, Any]):
        self._quote_cache[ticker] = (time.time(), data)

    def get_index_data(self, index_name: str) -> Dict[str, Any]:
        """Fetch basic current market status for a given index."""
        target_key = index_name.upper().replace(" ", "_")
        ticker = self.INDICES.get(target_key) or self.INDICES.get(index_name)
        if not ticker:
            if index_name.startswith("^"):
                ticker = index_name
            else:
                raise ValueError(f"Unknown index {index_name}")

        quote = self.get_quote(ticker)
        if quote:
            quote["displayName"] = self.INDEX_DISPLAY_NAMES.get(ticker, quote.get("shortName", ticker))
        return quote

    def get_all_indices(self) -> List[Dict[str, Any]]:
        """Fetch quotes for NIFTY 50, SENSEX, and BANK NIFTY."""
        indices = ["^NSEI", "^BSESN", "^NSEBANK"]
        results = []
        for symbol in indices:
            try:
                data = self.get_quote(symbol)
                if data:
                    data["displayName"] = self.INDEX_DISPLAY_NAMES.get(symbol, symbol)
                    data["key"] = symbol
                    results.append(data)
            except Exception as e:
                logger.error(f"Error fetching index {symbol}: {e}")
        return results

    def get_vix_volatility_outlook(self) -> Dict[str, Any]:
        """
        Calculates the India VIX-Based Expected Range for Nifty 50.
        Uses the standard options-market volatility formula:
            expected_daily_move_pct = VIX / sqrt(252)
            expected_range_points = nifty_level * (expected_daily_move_pct / 100)
            upper_bound = nifty_level + expected_range_points
            lower_bound = nifty_level - expected_range_points
        Compares current VIX against its 30-day average to determine calm/normal/volatile conditions.
        NOTE: India VIX measures expected volatility magnitude, NOT market direction.
        """
        now = time.time()
        if self._vix_cache and (now - self._vix_ts < 300):
            return self._vix_cache

        try:
            # 1. Fetch current VIX and 30-day history
            vix_ticker = yf.Ticker("^INDIAVIX")
            vix_hist = vix_ticker.history(period="1mo")
            if not vix_hist.empty:
                current_vix = float(vix_hist['Close'].iloc[-1])
                avg_30d_vix = float(vix_hist['Close'].mean())
            else:
                current_vix = 12.0
                avg_30d_vix = 12.0

            # 2. Fetch current Nifty 50 level
            nifty_ticker = yf.Ticker("^NSEI")
            nifty_hist = nifty_ticker.history(period="5d")
            if not nifty_hist.empty:
                nifty_level = float(nifty_hist['Close'].iloc[-1])
            else:
                nifty_quote = self.get_quote("^NSEI")
                nifty_level = float(nifty_quote.get("current_price", 24000.0))

            # 3. Standard options formula: daily move % = VIX / sqrt(252)
            expected_daily_move_pct = round(current_vix / math.sqrt(252), 2)
            expected_range_points = round(nifty_level * (expected_daily_move_pct / 100.0), 1)
            upper_bound = round(nifty_level + expected_range_points, 1)
            lower_bound = round(nifty_level - expected_range_points, 1)

            # Weekly expected range for additional context
            expected_weekly_move_pct = round(current_vix / math.sqrt(52), 2)
            weekly_range_points = round(nifty_level * (expected_weekly_move_pct / 100.0), 1)

            # 4. Compare current VIX with recent 30-day average
            pct_diff = ((current_vix - avg_30d_vix) / avg_30d_vix) * 100 if avg_30d_vix else 0.0

            if current_vix < 13.0 or pct_diff < -10.0:
                vix_level = "low"
                trading_condition = "calm"
                condition_badge = "Calm / Low Volatility"
            elif current_vix > 18.0 or pct_diff > 15.0:
                vix_level = "high"
                trading_condition = "volatile"
                condition_badge = "Elevated Volatility"
            else:
                vix_level = "moderate"
                trading_condition = "normal"
                condition_badge = "Moderate Volatility"

            context_line = f"VIX is currently {vix_level} compared to recent levels, suggesting the market expects {trading_condition} trading conditions."
            explanation = (
                f"Based on current India VIX ({current_vix:.2f}), Nifty's next-day movement is statistically "
                f"expected to stay within roughly {lower_bound:,.1f} – {upper_bound:,.1f}, reflecting current market volatility. "
                f"This shows expected range, NOT direction — the market could move up or down within this range."
            )

            result = {
                "vix": round(current_vix, 2),
                "vix_30d_avg": round(avg_30d_vix, 2),
                "vix_level": vix_level,
                "trading_condition": trading_condition,
                "condition_badge": condition_badge,
                "nifty_level": round(nifty_level, 2),
                "expected_daily_move_pct": expected_daily_move_pct,
                "expected_range_points": expected_range_points,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "expected_weekly_move_pct": expected_weekly_move_pct,
                "weekly_range_points": weekly_range_points,
                "context_line": context_line,
                "explanation": explanation,
                "disclaimer": "India VIX measures expected volatility magnitude, NOT market direction. Calculations are mathematical options-pricing formulas for educational and statistical purposes only."
            }

            self._vix_cache = result
            self._vix_ts = now
            return result

        except Exception as e:
            logger.error(f"Error computing VIX volatility outlook: {e}")
            fallback_nifty = 24000.0
            fallback_vix = 12.0
            move_pct = round(fallback_vix / math.sqrt(252), 2)
            pts = round(fallback_nifty * (move_pct / 100), 1)
            return {
                "vix": fallback_vix,
                "vix_30d_avg": 12.0,
                "vix_level": "moderate",
                "trading_condition": "normal",
                "condition_badge": "Moderate Volatility",
                "nifty_level": fallback_nifty,
                "expected_daily_move_pct": move_pct,
                "expected_range_points": pts,
                "lower_bound": round(fallback_nifty - pts, 1),
                "upper_bound": round(fallback_nifty + pts, 1),
                "expected_weekly_move_pct": round(fallback_vix / math.sqrt(52), 2),
                "weekly_range_points": round(fallback_nifty * (round(fallback_vix / math.sqrt(52), 2) / 100), 1),
                "context_line": "VIX is currently moderate compared to recent levels, suggesting the market expects normal trading conditions.",
                "explanation": f"Based on current India VIX ({fallback_vix}), Nifty's next-day movement is statistically expected to stay within roughly {fallback_nifty - pts:,.1f} – {fallback_nifty + pts:,.1f}, reflecting current market volatility. This shows expected range, NOT direction — the market could move up or down within this range.",
                "disclaimer": "India VIX measures expected volatility magnitude, NOT market direction."
            }

    def get_quote(self, ticker: str) -> Dict[str, Any]:
        """Fetch a single stock quote given a ticker symbol (e.g., RELIANCE.NS or ^NSEI)."""
        clean_ticker = ticker.strip().upper()
        if not clean_ticker.startswith("^") and "." not in clean_ticker:
            clean_ticker = f"{clean_ticker}.NS"

        cached = self._get_cached_quote(clean_ticker)
        if cached:
            return cached

        try:
            stock = yf.Ticker(clean_ticker)
            info = {}
            try:
                info = stock.info or {}
            except Exception:
                info = {}

            # Handle yfinance missing info or empty response via history fallback
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            prev_close = info.get('previousClose')

            if current_price is None or prev_close is None:
                hist = stock.history(period="5d")
                if not hist.empty:
                    last_quote = hist.iloc[-1]
                    prev_quote = hist.iloc[-2] if len(hist) > 1 else last_quote
                    current_price = float(last_quote['Close'])
                    prev_close = float(prev_quote['Close'])
                else:
                    # Obscure or illiquid stock with no recent data
                    fallback_data = {
                        "symbol": clean_ticker,
                        "shortName": info.get('shortName') or clean_ticker.replace('.NS', ''),
                        "current_price": None,
                        "previous_close": None,
                        "change": 0.0,
                        "change_percent": 0.0,
                        "status": "limited_data",
                        "message": "Limited trading data available for this security on free feeds."
                    }
                    self._set_cached_quote(clean_ticker, fallback_data)
                    return fallback_data

            change = current_price - prev_close if current_price and prev_close else 0.0
            change_pct = (change / prev_close * 100) if prev_close else 0.0

            def safe_float(val):
                if val is None or math.isnan(val) or math.isinf(val):
                    return None
                return round(float(val), 2)

            data = {
                "symbol": clean_ticker,
                "shortName": info.get('shortName') or info.get('longName') or clean_ticker.replace('.NS', ''),
                "current_price": safe_float(current_price),
                "previous_close": safe_float(prev_close),
                "change": safe_float(change),
                "change_percent": safe_float(change_pct),
                "market_cap": info.get('marketCap'),
                "pe_ratio": safe_float(info.get('trailingPE')),
                "pb_ratio": safe_float(info.get('priceToBook')),
                "dividend_yield": safe_float(info.get('dividendYield')),
                "52_week_high": safe_float(info.get('fiftyTwoWeekHigh')),
                "52_week_low": safe_float(info.get('fiftyTwoWeekLow')),
                "volume": info.get('volume') or info.get('regularMarketVolume'),
                "status": "success"
            }

            def sanitize_val(v):
                if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                    return None
                return v

            clean_data = {k: sanitize_val(v) for k, v in data.items()}
            self._set_cached_quote(clean_ticker, clean_data)
            return clean_data

        except Exception as e:
            logger.error(f"Failed to fetch quote for {clean_ticker}: {e}")
            return {
                "symbol": clean_ticker,
                "shortName": clean_ticker.replace('.NS', ''),
                "current_price": None,
                "status": "limited_data",
                "message": f"Unable to retrieve data: {str(e)}"
            }

    def get_curated_movers(self) -> Dict[str, List[Dict[str, Any]]]:
        """Return top gainers and losers from the curated shortlist with caching and parallel fetch."""
        if self._movers_cache and (time.time() - self._movers_ts < self._cache_ttl):
            return self._movers_cache

        quotes = []
        with ThreadPoolExecutor(max_workers=8) as executor:
            results = list(executor.map(lambda t: self.get_quote(t), self.CURATED_SHORTLIST))

        for q in results:
            if q and q.get("current_price") is not None:
                quotes.append(q)

        # Sort by change percent
        sorted_by_gain = sorted(quotes, key=lambda x: x.get("change_percent") or 0.0, reverse=True)
        gainers = sorted_by_gain[:5]
        losers = sorted_by_gain[-5:][::-1]

        movers_result = {
            "gainers": gainers,
            "losers": losers
        }
        self._movers_cache = movers_result
        self._movers_ts = time.time()
        return movers_result

    def get_sector_summary(self) -> List[Dict[str, Any]]:
        """Calculate day's average % move and top movers for all 12 sectors with caching and parallel fetch."""
        if self._sectors_cache and (time.time() - self._sectors_ts < 120):
            return self._sectors_cache

        # Gather unique tickers from the first 4 stocks of each sector
        sample_tickers = []
        for sec_data in self.SECTORS.values():
            sample_tickers.extend(sec_data["tickers"][:4])
        unique_tickers = list(set(sample_tickers))

        with ThreadPoolExecutor(max_workers=10) as executor:
            executor.map(lambda t: self.get_quote(t), unique_tickers)

        summary = []
        for sector_id, sec_data in self.SECTORS.items():
            tickers = sec_data["tickers"]
            sector_quotes = []
            for t in tickers[:4]:
                q = self.get_quote(t)
                if q and q.get("current_price") is not None:
                    sector_quotes.append(q)

            if sector_quotes:
                avg_move = sum(q.get("change_percent", 0.0) for q in sector_quotes) / len(sector_quotes)
                top_stock = max(sector_quotes, key=lambda x: x.get("change_percent", -999.0))
            else:
                avg_move = 0.0
                top_stock = None

            summary.append({
                "id": sector_id,
                "name": sec_data["name"],
                "stock_count": len(tickers),
                "avg_change_percent": round(avg_move, 2),
                "top_mover": {
                    "symbol": top_stock.get("symbol") if top_stock else tickers[0],
                    "shortName": top_stock.get("shortName") if top_stock else tickers[0].replace('.NS', ''),
                    "change_percent": top_stock.get("change_percent", 0.0) if top_stock else 0.0
                } if top_stock else None
            })

        self._sectors_cache = summary
        self._sectors_ts = time.time()
        return summary

    def get_peers(self, ticker: str) -> List[Dict[str, Any]]:
        """Find peers for a given ticker from the sectoral constituents."""
        norm_ticker = ticker if ticker.endswith(".NS") or ticker.startswith("^") else f"{ticker}.NS"

        # Find which sector contains this ticker
        found_sector = None
        for sec_id, sec in self.SECTORS.items():
            if norm_ticker in sec["tickers"]:
                found_sector = sec
                break

        # Fallback to banking if not found
        if not found_sector:
            found_sector = self.SECTORS["banking"]

        peer_tickers = [t for t in found_sector["tickers"] if t != norm_ticker][:4]
        peers = []
        for pt in peer_tickers:
            q = self.get_quote(pt)
            if q and q.get("current_price") is not None:
                peers.append(q)

        return peers

    @staticmethod
    def get_historical_data(ticker: str, interval: str = "1d", period: str = "1mo") -> List[Dict[str, Any]]:
        """
        Fetch historical chart data for a ticker.
        interval: 1d, 1wk, 1mo, etc.
        period: 1mo, 3mo, 1y, 5y, max, etc.
        """
        clean_ticker = ticker.strip().upper()
        if not clean_ticker.startswith("^") and "." not in clean_ticker:
            clean_ticker = f"{clean_ticker}.NS"

        stock = yf.Ticker(clean_ticker)
        hist = stock.history(interval=interval, period=period)

        if hist.empty:
            return []

        hist = hist.reset_index()
        data = []
        for _, row in hist.iterrows():
            date_col = 'Date' if 'Date' in row else 'Datetime'
            date_val = row[date_col]
            date_str = date_val.strftime('%Y-%m-%d') if hasattr(date_val, 'strftime') else str(date_val).split('T')[0]
            data.append({
                "date": date_str,
                "open": round(float(row['Open']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "close": round(float(row['Close']), 2),
                "volume": int(row['Volume'])
            })

        return data

market_data_service = MarketDataService()

