from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import shutil
import os
import uuid

try:
    from services.llm import llm_service
    from services.quarterly import quarterly_service
except ImportError:
    from backend.services.llm import llm_service
    from backend.services.quarterly import quarterly_service

router = APIRouter(prefix="/api/llm", tags=["LLM AI Features"])

# Ensure temp directory exists for uploads
os.makedirs("temp_uploads", exist_ok=True)

class NewsImpactRequest(BaseModel):
    ticker: str
    headlines: List[str]

class ResultsImpactRequest(BaseModel):
    ticker: str
    results_details: str

@router.post("/analyze-chart")
async def analyze_chart(
    image: UploadFile = File(...),
    ticker: Optional[str] = Form(None),
    context_text: Optional[str] = Form(""),
    provider: str = Form("deepseek"),
    api_key: Optional[str] = Form(None)
):
    """
    Endpoint for AI Chart Reader using DeepSeek API or Gemini Vision.
    Provide the chart screenshot, optional ticker, and optional user context.
    """
    temp_file_path = f"temp_uploads/{uuid.uuid4()}_{image.filename}"

    try:
        # Save uploaded file temporarily for image processing
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        result = llm_service.analyze_chart(
            image_path=temp_file_path,
            context_text=context_text or "",
            ticker=ticker,
            provider=provider,
            api_key=api_key
        )
        return {"status": "success", "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI inference failed: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

class FiveDayAnalysisRequest(BaseModel):
    ticker: str
    user_query: Optional[str] = "I want last analysis of the next day"
    provider: Optional[str] = "deepseek"
    api_key: Optional[str] = None

@router.post("/analyze-5day-chart")
async def analyze_5day_chart(payload: FiveDayAnalysisRequest):
    """
    Endpoint for 5-Day Chart Analysis & Next-Day Tentative Value projection.
    Analyzes historical 5-day candlestick trends, price patterns, and forecasts next-day range.
    """
    try:
        result = llm_service.analyze_five_day_chart(
            ticker=payload.ticker,
            user_query=payload.user_query or "I want last analysis of the next day",
            provider=payload.provider or "deepseek",
            api_key=payload.api_key
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"5-day chart analysis failed: {str(e)}")

@router.post("/analyze-news")
async def analyze_news_impact(payload: NewsImpactRequest):
    """
    Endpoint for News Sentiment & Impact analysis using LLM abstraction.
    Classify headlines and evaluate sentiment/severity for a specific stock in plain language.
    """
    try:
        result = llm_service.analyze_news_impact(payload.headlines, payload.ticker)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM news analysis failed: {str(e)}")

@router.post("/analyze-results")
async def analyze_results_impact(payload: ResultsImpactRequest):
    """
    Endpoint for Quarterly Results tracker.
    Checks if query is asking for exact quarterly numbers/comparison (e.g. 'compare q1 results of 2026 and 2027').
    If yes, fetches exact numbers from yfinance/consensus and returns structured variance table.
    """
    try:
        # 1. Check if user typed a quarterly comparison / lookup query
        quarterly_match = quarterly_service.parse_and_process_query(payload.ticker, payload.results_details)
        if quarterly_match:
            return {"status": "success", "data": quarterly_match}

        # 2. Standard plain-language text analysis
        raw = llm_service.analyze_quarterly_results(payload.ticker, payload.results_details)
        classification = (raw.get("result_classification") or "mixed").lower()
        sentiment = "positive" if classification == "strong" else ("negative" if classification == "weak" else "mixed")
        severity = 5 if classification in ["strong", "weak"] else 3
        
        result = {
            "is_quarterly_query": False,
            "event_type": "Quarterly Earnings & Corporate Event",
            "sentiment": sentiment,
            "severity": severity,
            "plain_language_explanation": raw.get("plain_language_verdict") or raw.get("plain_language_explanation", ""),
            "result_classification": classification,
            "yoy_revenue_growth": raw.get("yoy_revenue_growth", ""),
            "yoy_profit_growth": raw.get("yoy_profit_growth", ""),
            "key_highlights": raw.get("key_highlights", []),
            "historical_context": raw.get("historical_context", "")
        }
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM results analysis failed: {str(e)}")

class ValuationVerdictRequest(BaseModel):
    ticker: str
    dcf_inputs: Dict[str, Any]
    dcf_output: Dict[str, Any]
    provider: Optional[str] = "deepseek"
    api_key: Optional[str] = None

class PortfolioDiagnosticRequest(BaseModel):
    portfolio_data: Dict[str, Any]
    provider: Optional[str] = "deepseek"
    api_key: Optional[str] = None

@router.post("/valuation-verdict")
async def analyze_valuation_verdict(payload: ValuationVerdictRequest):
    """
    Translates DCF valuation model outputs into plain-language market expectations.
    """
    try:
        result = llm_service.analyze_valuation_verdict(
            ticker=payload.ticker,
            dcf_inputs=payload.dcf_inputs,
            dcf_output=payload.dcf_output,
            provider=payload.provider or "deepseek",
            api_key=payload.api_key
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Valuation verdict generation failed: {str(e)}")

@router.post("/portfolio-diagnostic")
async def analyze_portfolio_diagnostic(payload: PortfolioDiagnosticRequest):
    """
    Generates plain-language portfolio risk and diversification health check.
    """
    try:
        result = llm_service.analyze_portfolio_health(
            portfolio_data=payload.portfolio_data,
            provider=payload.provider or "deepseek",
            api_key=payload.api_key
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio diagnostic failed: {str(e)}")