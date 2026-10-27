import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { llmService } from '../services/llmService.js';
import { QuarterlyResultsService } from '../services/quarterlyService.js';
import { optionalAuthenticate } from '../middleware/auth.js';
import { saveAnalysisHistory } from '../services/userDataService.js';

const router = express.Router();

const uploadDir = path.join(os.tmpdir(), 'marketpulse_uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/llm/analyze-chart
router.post('/analyze-chart', optionalAuthenticate, upload.single('image'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!filePath) {
      return res.status(400).json({ status: 'error', message: 'No image file uploaded.' });
    }

    const ticker = req.body.ticker || null;
    const contextText = req.body.context_text || '';
    const provider = req.body.provider || 'groq';
    const apiKey = req.body.api_key || null;

    const result = await llmService.analyzeChart(filePath, contextText, ticker, provider, apiKey);

    // Save to user history in MongoDB if logged in
    if (req.user?.id) {
      try {
        await saveAnalysisHistory(req.user.id, {
          ticker: result.detected_ticker || ticker,
          analysisType: 'chart_screenshot',
          data: result
        });
      } catch (err) {
        console.warn('Failed to save analysis history:', err.message);
      }
    }

    return res.json({ status: 'success', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: `AI inference failed: ${err.message}` });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  }
});

// POST /api/llm/analyze-5day-chart
router.post('/analyze-5day-chart', optionalAuthenticate, async (req, res) => {
  try {
    const { ticker, user_query, provider, api_key } = req.body;
    if (!ticker) {
      return res.status(400).json({ status: 'error', message: 'Ticker is required.' });
    }

    const result = await llmService.analyzeFiveDayChart(
      ticker,
      user_query || 'I want last analysis of the next day',
      provider || 'groq',
      api_key || null
    );

    // Save to user history in MongoDB if logged in
    if (req.user?.id) {
      try {
        await saveAnalysisHistory(req.user.id, {
          ticker,
          analysisType: '5day_chart',
          data: result
        });
      } catch (err) {
        console.warn('Failed to save 5-day history:', err.message);
      }
    }

    return res.json({ status: 'success', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: `5-day chart analysis failed: ${err.message}` });
  }
});

// POST /api/llm/analyze-news
router.post('/analyze-news', async (req, res) => {
  try {
    const { ticker, headlines } = req.body;
    if (!ticker) {
      return res.status(400).json({ status: 'error', message: 'Ticker is required.' });
    }
    const result = await llmService.analyzeNewsImpact(headlines || [], ticker);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: `News analysis failed: ${err.message}` });
  }
});

// POST /api/llm/analyze-results
router.post('/analyze-results', async (req, res) => {
  try {
    const { ticker, results_details } = req.body;
    if (!ticker) {
      return res.status(400).json({ status: 'error', message: 'Ticker is required.' });
    }

    // 1. Check if user typed a quarterly comparison / lookup query
    const quarterlyMatch = QuarterlyResultsService.parseAndProcessQuery(ticker, results_details || '');
    if (quarterlyMatch) {
      return res.json({ status: 'success', data: quarterlyMatch });
    }

    // 2. Standard plain-language text analysis
    const raw = await llmService.analyzeQuarterlyResults(ticker, results_details || '');
    const classification = (raw.result_classification || 'mixed').toLowerCase();
    const sentiment = classification === 'strong' ? 'positive' : (classification === 'weak' ? 'negative' : 'mixed');
    const severity = classification === 'mixed' ? 3 : 5;

    const result = {
      is_quarterly_query: false,
      event_type: "Quarterly Earnings & Corporate Event",
      sentiment,
      severity,
      plain_language_explanation: raw.plain_language_verdict || raw.plain_language_explanation || "",
      result_classification: classification,
      yoy_revenue_growth: raw.yoy_revenue_growth || "",
      yoy_profit_growth: raw.yoy_profit_growth || "",
      key_highlights: raw.key_highlights || [],
      historical_context: raw.historical_context || ""
    };

    return res.json({ status: 'success', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: `Results analysis failed: ${err.message}` });
  }
});

// POST /api/llm/portfolio-diagnostic
router.post('/portfolio-diagnostic', async (req, res) => {
  try {
    const { portfolio_data, provider, api_key } = req.body;
    if (!portfolio_data) {
      return res.status(400).json({ status: 'error', message: 'portfolio_data is required.' });
    }

    const result = await llmService.analyzePortfolioHealth(
      portfolio_data,
      provider || 'groq',
      api_key || null
    );
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: `Portfolio diagnostic failed: ${err.message}` });
  }
});

export default router;
