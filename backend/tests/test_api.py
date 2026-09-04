from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

client = TestClient(app)

def test_health():
    res = client.get("/")
    assert res.status_code == 200
    assert "MarketPulse" in res.json().get("message", "")

def test_search_zomato_and_titan():
    res = client.get("/api/search/?q=zomato")
    assert res.status_code == 200
    results = res.json().get("results", [])
    assert any(r["symbol"] == "ZOMATO" for r in results)

    res2 = client.get("/api/search/?q=titan")
    assert res2.status_code == 200
    results2 = res2.json().get("results", [])
    assert any(r["symbol"] == "TITAN" for r in results2)

def test_search_20microns():
    res = client.get("/api/search/?q=20microns")
    assert res.status_code == 200
    results = res.json().get("results", [])
    assert any(r["symbol"] == "20MICRONS" for r in results)

def test_indices():
    res = client.get("/api/market/indices")
    assert res.status_code == 200
    data = res.json().get("data", [])
    assert len(data) >= 3

def test_quote_reliance():
    res = client.get("/api/market/quote/RELIANCE")
    assert res.status_code == 200
    data = res.json().get("data", {})
    assert "RELIANCE" in data.get("symbol", "")
    assert data.get("current_price") is not None

def test_movers():
    res = client.get("/api/market/movers")
    assert res.status_code == 200
    data = res.json().get("data", {})
    assert "gainers" in data
    assert "losers" in data

def test_sectors():
    res = client.get("/api/market/sectors")
    assert res.status_code == 200
    data = res.json().get("data", [])
    assert len(data) == 12

def test_peers():
    res = client.get("/api/market/peers/RELIANCE")
    assert res.status_code == 200
    data = res.json().get("data", [])
    assert len(data) > 0

def test_analyze_results():
    res = client.post("/api/llm/analyze-results", json={
        "ticker": "ZOMATO",
        "results_details": "Revenue surged 68% YoY to Rs 4,799 Cr. Net profit rose 389% YoY."
    })
    assert res.status_code == 200
    data = res.json().get("data", {})
    assert "sentiment" in data
    assert "plain_language_explanation" in data

def test_quarterly_comparison_query():
    res = client.post("/api/llm/analyze-results", json={
        "ticker": "RELIANCE",
        "results_details": "compare q1 results of 2026 and 2027"
    })
    assert res.status_code == 200
    data = res.json().get("data", {})
    assert data.get("is_quarterly_query") is True
    assert "exact_table" in data
    assert len(data["exact_table"]) >= 4
    assert "plain_language_verdict" in data

def test_valuation_dcf():
    res = client.get("/api/market/valuation/RELIANCE")
    assert res.status_code == 200
    scenarios = res.json().get("data", {}).get("scenarios", {})
    assert "base" in scenarios
    assert "bull" in scenarios
    assert "bear" in scenarios
    assert scenarios["base"].get("fair_value") is not None

def test_portfolio_simulate():
    res = client.post("/api/market/portfolio-simulate", json={
        "holdings": [
            {"ticker": "ZOMATO", "quantity": 100},
            {"ticker": "INFY", "quantity": 10}
        ]
    })
    assert res.status_code == 200
    data = res.json().get("data", {})
    assert data.get("total_value") > 0
    assert len(data.get("stress_tests", [])) >= 3

def test_compare_stocks():
    res = client.get("/api/market/compare?tickers=TCS,INFY")
    assert res.status_code == 200
    data = res.json().get("data", [])
    assert len(data) == 2

def test_screener():
    res = client.get("/api/market/screener?filter_type=near_52w_high")
    assert res.status_code == 200
    data = res.json().get("data", [])
    assert len(data) > 0

def test_valuation_verdict_llm():
    res = client.post("/api/llm/valuation-verdict", json={
        "ticker": "RELIANCE",
        "dcf_inputs": {"growth_rate": 12.0, "discount_rate": 12.5, "terminal_growth": 4.5},
        "dcf_output": {"current_price": 2850.0, "fair_value": 3100.0, "discount_percentage": 8.8, "valuation_verdict": "Fairly Valued"},
        "provider": "gemini"
    })
    assert res.status_code == 200
    data = res.json().get("data", {})
    assert "plain_language_verdict" in data

def test_portfolio_diagnostic_llm():
    res = client.post("/api/llm/portfolio-diagnostic", json={
        "portfolio_data": {
            "total_value": 150000.0,
            "portfolio_beta": 1.1,
            "sector_allocation": [{"sector_id": "it", "sector_name": "IT & Tech", "weight_percent": 65.0}],
            "stress_tests": [{"title": "RBI Rate Hike", "estimated_impact_percent": -1.2}],
            "concentration_warnings": ["65% concentration in IT"]
        },
        "provider": "gemini"
    })
    assert res.status_code == 200
    data = res.json().get("data", {})
def test_vix_volatility_outlook():
    res = client.get("/api/market/vix-outlook")
    assert res.status_code == 200
    data = res.json().get("data", {})
    assert "vix" in data
    assert "nifty_level" in data
    assert "expected_daily_move_pct" in data
    assert "lower_bound" in data
    assert "upper_bound" in data
    assert data["upper_bound"] > data["lower_bound"]
    assert "expected range, NOT direction" in data.get("explanation", "")

def test_corporate_actions_stock():
    response = client.get("/api/corporate-actions/stock/TCS")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "TCS"
    assert "dividends" in data
    assert "buybacks" in data
    assert "explainer" in data


def test_corporate_actions_upcoming():
    response = client.get("/api/corporate-actions/upcoming")
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert "dividends" in data
    assert "buybacks" in data


def test_ipo_tracker():
    response = client.get("/api/corporate-actions/ipos")
    assert response.status_code == 200
    data = response.json()
    assert "mainline" in data
    assert "sme" in data
    assert "summary" in data
    assert len(data["mainline"]) > 0
    assert len(data["sme"]) > 0
    # Verify mandatory GMP disclaimer presence
    assert "Unofficial grey market indicator" in data["mainline"][0]["gmp"]["disclaimer"]


if __name__ == "__main__":
    tests = [
        test_health,
        test_search_zomato_and_titan,
        test_search_20microns,
        test_indices,
        test_quote_reliance,
        test_movers,
        test_sectors,
        test_peers,
        test_analyze_results,
        test_valuation_dcf,
        test_portfolio_simulate,
        test_compare_stocks,
        test_screener,
        test_valuation_verdict_llm,
        test_portfolio_diagnostic_llm,
        test_vix_volatility_outlook,
        test_corporate_actions_stock,
        test_corporate_actions_upcoming,
        test_ipo_tracker
    ]
    passed = 0
    for t in tests:
        try:
            print(f"Running {t.__name__}...", end=" ", flush=True)
            t()
            print("PASSED [OK]")
            passed += 1
        except Exception as e:
            print(f"FAILED [X] ({e})")

    print(f"\nSummary: {passed}/{len(tests)} tests passed successfully!")


