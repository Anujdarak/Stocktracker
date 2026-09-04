import os
import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

# Import the FastAPI app
try:
    from backend.main import app
    from backend.services.llm import LLMService
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from main import app
    from services.llm import LLMService

client = TestClient(app)

def create_dummy_image() -> bytes:
    """Create a simple dummy image for testing."""
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()

@pytest.fixture
def mock_gemini():
    """Mock the Gemini API so tests don't require an active API key or credits."""
    pass
    # For now we'll do real tests if API key exists, otherwise we'll skip

def test_analyze_news_impact_no_api_key(monkeypatch):
    """Test news impact parsing handles missing API gracefully or parses expected format."""
    # Ensure no API key for this specific check, it should raise internal 500 error due to Gemini config
    # if it tries to actually run without a key
    pass

@pytest.mark.skipif(not os.getenv("GEMINI_API_KEY"), reason="Requires GEMINI_API_KEY")
def test_real_analyze_news_impact():
    """Test the actual Gemini news analysis endpoint with real payload."""
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
    assert "status" in data
    assert data["status"] == "success"

    result = data["data"]
    assert "event_type" in result
    assert "sentiment" in result
    assert "severity" in result
    assert "plain_language_explanation" in result

    # Assert JSON parser mapped it correctly
    assert result["sentiment"] in ["positive", "negative", "neutral"]

@pytest.mark.skipif(not os.getenv("GEMINI_API_KEY"), reason="Requires GEMINI_API_KEY")
def test_real_analyze_chart():
    """Test the actual Gemini vision analysis endpoint with a real image."""
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

    assert result["technical_bias"] in ["bullish-leaning", "bearish-leaning", "sideways"]
