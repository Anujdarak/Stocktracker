import yfinance as yf
import math
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ValuationService:
    """
    Financial Modeling Service for Intrinsic Value & Discounted Cash Flow (DCF).
    Tailored for Indian equities with standard India macro parameters:
    - Risk-free Rate (Rf): ~7.0% (RBI 10Y Government Bond yield)
    - India Equity Risk Premium (ERP): ~6.0%
    - Long-term Terminal Growth Rate: 4.5% - 5.0% (aligned with long-term real GDP + inflation)
    """

    @staticmethod
    def get_valuation_inputs(ticker: str) -> Dict[str, Any]:
        clean_ticker = ticker if ticker.endswith(".NS") or ticker.startswith("^") else f"{ticker}.NS"
        stock = yf.Ticker(clean_ticker)
        info = stock.info or {}

        current_price = info.get("currentPrice") or info.get("regularMarketPrice") or 0.0
        trailing_eps = info.get("trailingEps") or 0.0
        forward_eps = info.get("forwardEps") or trailing_eps
        shares_outstanding = info.get("sharesOutstanding") or 0
        market_cap = info.get("marketCap") or (current_price * shares_outstanding)
        book_value = info.get("bookValue") or 0.0
        pe_ratio = info.get("trailingPE") or info.get("forwardPE") or 0.0
        beta = info.get("beta") or 1.0

        # Estimate Free Cash Flow or Earnings Base
        # If shares outstanding or current price missing, fallback
        if current_price > 0 and trailing_eps > 0:
            base_eps = max(trailing_eps, 1.0)
        else:
            base_eps = max(current_price * 0.04, 10.0)  # estimated 4% earnings yield default

        # WACC calculation: Rf + Beta * ERP (Cost of equity proxy for retail DCF)
        rf = 7.0  # 7% RBI G-Sec
        erp = 6.0 # 6% India ERP
        calculated_wacc = round(rf + (max(0.6, min(2.0, beta)) * erp), 1)

        # Baseline expected 5-year growth based on sector and past performance
        if pe_ratio > 40:
            default_growth = 18.0
        elif pe_ratio > 25:
            default_growth = 14.0
        elif pe_ratio > 15:
            default_growth = 10.0
        else:
            default_growth = 8.0

        return {
            "symbol": clean_ticker,
            "shortName": info.get("shortName") or clean_ticker.replace(".NS", ""),
            "current_price": round(current_price, 2) if current_price else 0.0,
            "market_cap": market_cap,
            "trailing_eps": round(trailing_eps, 2) if trailing_eps else round(base_eps, 2),
            "pe_ratio": round(pe_ratio, 2) if pe_ratio else None,
            "beta": round(beta, 2),
            "book_value": round(book_value, 2) if book_value else None,
            "defaults": {
                "base_growth_rate": default_growth,
                "bull_growth_rate": round(default_growth * 1.35, 1),
                "bear_growth_rate": round(default_growth * 0.65, 1),
                "discount_rate": calculated_wacc,
                "terminal_growth_rate": 4.5,
                "projection_years": 5
            }
        }

    @staticmethod
    def calculate_dcf(
        current_price: float,
        base_eps: float,
        growth_rate: float,
        discount_rate: float,
        terminal_growth: float = 4.5,
        years: int = 5
    ) -> Dict[str, Any]:
        """
        Executes a multi-stage Discounted Earnings/Cash Flow model.
        """
        r = max(discount_rate / 100.0, 0.06)
        g = max(growth_rate / 100.0, -0.2)
        g_term = min(terminal_growth / 100.0, r - 0.01)  # Terminal growth must be < discount rate

        # 1. Project cash flows for N years
        projected_flows = []
        discounted_flows = []
        current_flow = base_eps

        for year in range(1, years + 1):
            current_flow = current_flow * (1 + g)
            pv = current_flow / math.pow(1 + r, year)
            projected_flows.append(round(current_flow, 2))
            discounted_flows.append(round(pv, 2))

        pv_projected = sum(discounted_flows)

        # 2. Terminal Value: Gordon Growth Model
        final_year_flow = projected_flows[-1]
        terminal_value = (final_year_flow * (1 + g_term)) / (r - g_term)
        pv_terminal = terminal_value / math.pow(1 + r, years)

        # 3. Fair Value Per Share
        fair_value = pv_projected + pv_terminal

        # 4. Margin of Safety / Discount vs Current Price
        if current_price and current_price > 0:
            diff = fair_value - current_price
            discount_pct = round((diff / current_price) * 100, 1)
        else:
            discount_pct = 0.0

        verdict = "Fairly Valued"
        if discount_pct >= 15.0:
            verdict = "Trading at a Discount"
        elif discount_pct <= -15.0:
            verdict = "Trading at a Premium"

        return {
            "fair_value": round(fair_value, 2),
            "current_price": current_price,
            "discount_percentage": discount_pct,
            "valuation_verdict": verdict,
            "pv_of_projections": round(pv_projected, 2),
            "pv_of_terminal_value": round(pv_terminal, 2),
            "projected_eps_series": projected_flows
        }

valuation_service = ValuationService()
