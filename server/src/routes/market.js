import express from 'express';
import { marketDataService, SECTORS, CURATED_SHORTLIST } from '../services/marketDataService.js';
import { portfolioService, SAMPLE_PORTFOLIOS } from '../services/portfolioService.js';

const router = express.Router();

// GET /api/market/indices
router.get('/indices', async (req, res) => {
  try {
    const data = await marketDataService.getAllIndices();
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/movers
router.get('/movers', async (req, res) => {
  try {
    const data = await marketDataService.getCuratedMovers();
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/sectors
router.get('/sectors', async (req, res) => {
  try {
    const data = await marketDataService.getSectorSummary();
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/sectors/:sector_id
router.get('/sectors/:sector_id', async (req, res) => {
  try {
    const { sector_id } = req.params;
    const sec = SECTORS[sector_id];
    if (!sec) {
      return res.status(404).json({ status: 'error', message: `Sector '${sector_id}' not found` });
    }

    const quotes = [];
    for (const t of sec.tickers) {
      const q = await marketDataService.getQuote(t);
      if (q) quotes.push(q);
    }

    return res.json({
      status: 'success',
      sector: sec.name,
      data: quotes
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/peers/:ticker
router.get('/peers/:ticker', async (req, res) => {
  try {
    const data = await marketDataService.getPeers(req.params.ticker);
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/index/:index_name
router.get('/index/:index_name', async (req, res) => {
  try {
    const data = await marketDataService.getIndexData(req.params.index_name);
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/quote/:ticker
router.get('/quote/:ticker', async (req, res) => {
  try {
    const data = await marketDataService.getQuote(req.params.ticker);
    if (!data) {
      return res.status(404).json({ status: 'error', message: 'Ticker not found or data unavailable' });
    }
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/history/:ticker
router.get('/history/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const interval = req.query.interval || '1d';
    const period = req.query.period || '1mo';
    const data = await marketDataService.getHistoricalData(ticker, interval, period);
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/portfolio/samples
router.get('/portfolio/samples', (req, res) => {
  return res.json({ status: 'success', data: SAMPLE_PORTFOLIOS });
});

// POST /api/market/portfolio-simulate
router.post('/portfolio-simulate', async (req, res) => {
  try {
    const { holdings } = req.body;
    if (!Array.isArray(holdings)) {
      return res.status(400).json({ status: 'error', message: 'Holdings must be an array' });
    }
    const result = await portfolioService.analyzePortfolio(holdings);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/compare
router.get('/compare', async (req, res) => {
  try {
    const tickers = req.query.tickers;
    if (!tickers) {
      return res.status(400).json({ status: 'error', message: 'No tickers provided' });
    }

    const tickerList = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
    const quotes = [];

    for (const t of tickerList.slice(0, 4)) {
      const q = await marketDataService.getQuote(t);
      if (q) {
        const hist = await marketDataService.getHistoricalData(t, '1d', '1mo');
        const firstClose = hist.length > 0 ? hist[0].close : (q.current_price || 100.0);
        const normSeries = hist.map(pt => {
          const rawPct = firstClose ? ((pt.close - firstClose) / firstClose) * 100 : 0.0;
          return {
            time: pt.time || pt.date,
            value: Math.round(rawPct * 100) / 100
          };
        });

        const cp = q.current_price || firstClose;
        const retPct = firstClose ? Math.round(((cp - firstClose) / firstClose) * 10000) / 100 : 0.0;

        quotes.push({
          quote: q,
          return_1mo_percent: retPct,
          normalized_series: normSeries
        });
      }
    }

    return res.json({ status: 'success', data: quotes });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/screener
router.get('/screener', async (req, res) => {
  try {
    const filterType = req.query.filter_type || 'near_52w_high';
    const rawMovers = await marketDataService.getCuratedMovers();
    const allQuotes = [...(rawMovers.gainers || []), ...(rawMovers.losers || [])].filter(
      q => q && q.current_price && q.status !== 'limited_data'
    );

    for (const t of CURATED_SHORTLIST.slice(0, 18)) {
      const q = await marketDataService.getQuote(t);
      if (q && q.current_price && q.status !== 'limited_data' && !allQuotes.some(x => x.symbol === q.symbol)) {
        allQuotes.push(q);
      }
    }

    const filtered = [];
    for (const q of allQuotes) {
      const cp = q.current_price || 0.0;
      const h52 = q["52_week_high"] || 0.0;
      const l52 = q["52_week_low"] || 0.0;
      const pe = q.pe_ratio || 0.0;
      const vol = q.volume || 0;

      if (filterType === 'near_52w_high') {
        if (h52 > 0 && cp >= h52 * 0.93) {
          filtered.push({
            ...q,
            criterion_note: `Trading within ${Math.round(((h52 - cp) / h52) * 1000) / 10}% of 52-Week High (₹${h52})`
          });
        }
      } else if (filterType === 'oversold') {
        if (l52 > 0 && cp <= l52 * 1.15) {
          filtered.push({
            ...q,
            criterion_note: `Near 52-Week Low support (₹${l52})`
          });
        }
      } else if (filterType === 'value_largecap') {
        if (pe > 0 && pe < 25 && cp > 0) {
          filtered.push({
            ...q,
            criterion_note: `Attractive P/E valuation of ${pe}x`
          });
        }
      } else if (filterType === 'volume_surge') {
        filtered.push({
          ...q,
          criterion_note: `High trading volume: ${vol.toLocaleString('en-IN')} shares`
        });
      }
    }

    const result = filtered.length > 0 ? filtered : allQuotes.slice(0, 8);

    return res.json({
      status: 'success',
      filter_type: filterType,
      count: result.length,
      data: result.slice(0, 12)
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/market/vix-outlook
router.get('/vix-outlook', async (req, res) => {
  try {
    const data = await marketDataService.getVixVolatilityOutlook();
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
