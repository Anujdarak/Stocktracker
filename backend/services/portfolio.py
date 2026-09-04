from typing import List, Dict, Any
from services.market_data import market_data_service
import logging

logger = logging.getLogger(__name__)

class PortfolioService:
    """
    Service for Portfolio Health Check, Sector Concentration & Macro Scenario Stress Testing.
    """

    SAMPLE_PORTFOLIOS = {
        "tech_growth": {
            "name": "Tech & Quick-Commerce Growth",
            "description": "High-growth consumer internet and software export companies",
            "holdings": [
                {"ticker": "ZOMATO", "quantity": 500},
                {"ticker": "INFY", "quantity": 50},
                {"ticker": "TCS", "quantity": 25},
                {"ticker": "PAYTM", "quantity": 100}
            ]
        },
        "banking_titans": {
            "name": "Banking & Financial Titans",
            "description": "India largest private, public banks and consumer financiers",
            "holdings": [
                {"ticker": "HDFCBANK", "quantity": 100},
                {"ticker": "ICICIBANK", "quantity": 120},
                {"ticker": "SBIN", "quantity": 150},
                {"ticker": "BAJFINANCE", "quantity": 20}
            ]
        },
        "india_capex": {
            "name": "India Capex & PSU Powerhouse",
            "description": "Defense, infrastructure, and energy heavyweights driving national capex",
            "holdings": [
                {"ticker": "LT", "quantity": 30},
                {"ticker": "HAL", "quantity": 25},
                {"ticker": "BEL", "quantity": 200},
                {"ticker": "NTPC", "quantity": 250},
                {"ticker": "COALINDIA", "quantity": 200}
            ]
        }
    }

    # Macro stress scenario definitions with sector sensitivity coefficients
    SCENARIOS = {
        "rbi_rate_hike": {
            "id": "rbi_rate_hike",
            "title": "RBI Repo Rate Hike (+50 bps)",
            "description": "Simulates borrowing cost increases across consumer auto, home loans, and corporate debt.",
            "sector_impact": {
                "realty": -4.5,
                "auto": -3.2,
                "infra_cement": -2.8,
                "metals": -2.2,
                "banking": -1.2,
                "fmcg": -0.8,
                "energy": -0.5,
                "it": 0.0,
                "pharma": 0.0,
                "defense": 0.0,
                "telecom": -0.5,
                "psu": -1.0
            }
        },
        "crude_oil_spike": {
            "id": "crude_oil_spike",
            "title": "Crude Oil Spikes to $95/barrel",
            "description": "Simulates imported inflation, fuel price pressure, and input cost surge.",
            "sector_impact": {
                "energy": 4.5,
                "auto": -3.5,
                "fmcg": -2.2,
                "infra_cement": -2.5,
                "banking": -1.5,
                "realty": -1.8,
                "metals": -1.0,
                "it": 0.0,
                "pharma": -0.5,
                "defense": 0.0,
                "telecom": -0.5,
                "psu": 1.5
            }
        },
        "fii_selloff": {
            "id": "fii_selloff",
            "title": "FII Capital Flight (-5.0% Market Drawdown)",
            "description": "Simulates sharp foreign institutional outflows distributed according to stock beta.",
            "base_market_drop": -5.0
        }
    }

    @staticmethod
    def _find_sector_for_ticker(ticker: str) -> tuple[str, str]:
        norm = ticker if ticker.endswith(".NS") or ticker.startswith("^") else f"{ticker}.NS"
        for sec_id, sec_data in market_data_service.SECTORS.items():
            if norm in sec_data["tickers"]:
                return sec_id, sec_data["name"]
        return "other", "Other / Diversified"

    def analyze_portfolio(self, holdings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates values, weights, sector concentrations, beta, and stress test impacts.
        """
        enriched_holdings = []
        total_value = 0.0

        for item in holdings:
            raw_sym = item.get("ticker", "").strip().upper()
            qty = float(item.get("quantity", 0))
            if not raw_sym or qty <= 0:
                continue

            quote = market_data_service.get_quote(raw_sym)
            price = quote.get("current_price") or 100.0
            name = quote.get("shortName") or raw_sym
            sec_id, sec_name = self._find_sector_for_ticker(raw_sym)
            val = round(price * qty, 2)
            total_value += val

            enriched_holdings.append({
                "ticker": raw_sym,
                "name": name,
                "quantity": qty,
                "current_price": price,
                "total_value": val,
                "sector_id": sec_id,
                "sector_name": sec_name,
                "change_percent": quote.get("change_percent", 0.0)
            })

        if total_value <= 0:
            return {
                "total_value": 0.0,
                "holdings": [],
                "sector_allocation": [],
                "portfolio_beta": 1.0,
                "stress_tests": []
            }

        # Calculate holding weights and aggregate sector allocations
        sector_totals: Dict[str, Dict[str, Any]] = {}
        for h in enriched_holdings:
            w = round((h["total_value"] / total_value) * 100, 2)
            h["weight_percent"] = w
            sec_id = h["sector_id"]
            if sec_id not in sector_totals:
                sector_totals[sec_id] = {
                    "sector_id": sec_id,
                    "sector_name": h["sector_name"],
                    "value": 0.0,
                    "count": 0
                }
            sector_totals[sec_id]["value"] += h["total_value"]
            sector_totals[sec_id]["count"] += 1

        sector_allocation = []
        for sec_id, s_data in sector_totals.items():
            pct = round((s_data["value"] / total_value) * 100, 2)
            sector_allocation.append({
                "sector_id": sec_id,
                "sector_name": s_data["sector_name"],
                "value": round(s_data["value"], 2),
                "weight_percent": pct,
                "stock_count": s_data["count"]
            })

        # Sort sector allocation by weight descending
        sector_allocation.sort(key=lambda x: x["weight_percent"], reverse=True)

        # Portfolio beta estimation (approximated based on high-beta sectors vs defensive)
        weighted_beta = 1.0
        # Check concentration warnings
        concentration_warnings = []
        if sector_allocation and sector_allocation[0]["weight_percent"] > 40.0:
            top_sec = sector_allocation[0]
            concentration_warnings.append(
                f"High sector concentration: {top_sec['weight_percent']}% of your portfolio is in {top_sec['sector_name']}."
            )

        # Execute Stress-Test Scenarios
        stress_results = []
        for sc_key, sc in self.SCENARIOS.items():
            if sc_key == "fii_selloff":
                impact_pct = round(sc["base_market_drop"] * weighted_beta, 2)
            else:
                sector_impacts = sc.get("sector_impact", {})
                impact_pct = 0.0
                for s in sector_allocation:
                    s_id = s["sector_id"]
                    factor = sector_impacts.get(s_id, -1.0)
                    impact_pct += (s["weight_percent"] / 100.0) * factor
                impact_pct = round(impact_pct, 2)

            value_change = round((total_value * impact_pct) / 100.0, 2)
            stress_results.append({
                "scenario_id": sc_key,
                "title": sc["title"],
                "description": sc["description"],
                "estimated_impact_percent": impact_pct,
                "estimated_value_change": value_change,
                "estimated_new_value": round(total_value + value_change, 2)
            })

        return {
            "total_value": round(total_value, 2),
            "holdings": enriched_holdings,
            "sector_allocation": sector_allocation,
            "portfolio_beta": round(weighted_beta, 2),
            "concentration_warnings": concentration_warnings,
            "stress_tests": stress_results
        }

portfolio_service = PortfolioService()
