import express from 'express';
import { CorporateActionsService } from '../services/corporateActionsService.js';
import { IPOService } from '../services/ipoService.js';

const router = express.Router();

// GET /api/corporate-actions/stock/:symbol
router.get('/stock/:symbol', async (req, res) => {
  try {
    const data = await CorporateActionsService.getStockCorporateActions(req.params.symbol);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/corporate-actions/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    const fromDate = req.query.from_date || null;
    const toDate = req.query.to_date || null;
    const data = await CorporateActionsService.getUpcomingCorporateActions(fromDate, toDate);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/corporate-actions/ipos
router.get('/ipos', async (req, res) => {
  try {
    const data = await IPOService.getAllIPOs();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
