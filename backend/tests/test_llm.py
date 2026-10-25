import os
import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

# Import the FastAPI app
try:
    from backend.main import app
    from backend.services.llm import LLMService, llm_service
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from main import app
    from services.llm import LLMService, llm_service

client = TestClient(app)

def create_dummy_image() -> bytes:
    """Create a simple dummy image for testing."""
    img = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()

def test_groq_service_defaults():
    """Verify Groq vision and text model configurations."""
    service = LLMService()
    assert service.vision_model_name == "qwen/qwen3.8-27b"
    assert service.text_model_name == "llama-3.3-70b-versatile"

def test_extract_json():
    """Verify JSON extraction handles plain and markdown JSON cleanly."""
    service = LLMService()
    raw_md = '```json\n{"status": "ok", "bias": "Moving upward"}\n```'
    parsed = service._extract_json(raw_md)
    assert parsed["status"] == "ok"
    assert parsed["bias"] == "Moving upward"

def test_analyze_news_impact_fallback():
    """Test news analysis runs and returns valid schema with autonomous fallback when no API key."""
    payload = {
        "ticker": "RELIANCE.NS",
        "headlines": [
            "Reliance Jio announces major 5G expansion",
            "Analysts upgrade Reliance Industries stock price target",
            "Retail division shows 20% YoY growth"
        ]
    }

    response = client.post("/api/llm/analyze-news", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"
    result = data["data"]
    assert "event_type" in result
    assert "sentiment" in result
    assert "severity" in result
    assert "plain_language_explanation" in result
    assert result["sentiment"] in ["positive", "negative", "neutral"]

def test_analyze_chart_fallback():
    """Test chart analysis endpoint handles image and produces grounded levels with fallback."""
    image_bytes = create_dummy_image()
    files = {
        'image': ('test_chart.png', image_bytes, 'image/png')
    }
    data = {
        'ticker': 'TCS',
        'context_text': 'Consolidating near support zone.'
    }

    response = client.post("/api/llm/analyze-chart", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    result = res_data["data"]
    assert "detected_ticker" in result
    assert "current_price" in result
    assert "base_support" in result
    assert "base_resistance" in result
    assert "high_resistance" in result
    assert "technical_bias" in result
    assert "plain_language_explanation" in result
    assert "key_levels" in result
    assert len(result["key_levels"]) == 3

@pytest.mark.skipif(not os.getenv("GROQ_API_KEY"), reason="Requires GROQ_API_KEY")
def test_real_analyze_news_impact():
    """Test the actual Groq news analysis endpoint with real payload."""
    payload = {
        "ticker": "RELIANCE.NS",
        "headlines": [
            "Reliance Jio announces major 5G expansion",
            "Analysts upgrade Reliance Industries stock price target",
            "Retail division shows 20% YoY growth"
        ]
    }

    response = client.post("/api/llm/analyze-news", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"

    result = data["data"]
    assert "event_type" in result
    assert "sentiment" in result
    assert "severity" in result
    assert "plain_language_explanation" in result
    assert result["sentiment"] in ["positive", "negative", "neutral"]

@pytest.mark.skipif(not os.getenv("GROQ_API_KEY"), reason="Requires GROQ_API_KEY")
def test_real_analyze_chart():
    """Test the actual Groq vision analysis endpoint with a real image."""
    image_bytes = create_dummy_image()
    files = {
        'image': ('test_chart.png', image_bytes, 'image/png')
    }
    data = {
        'context_text': 'The stock broke out of a critical resistance level with heavy volume.'
    }

    response = client.post("/api/llm/analyze-chart", files=files, data=data)
    assert response.status_code == 200

    response_data = response.json()
    assert response_data["status"] == "success"

    result = response_data["data"]
    assert "technical_bias" in result
    assert "plain_language_explanation" in result
    assert "key_levels" in result
    assert "confidence" in result
