import express from 'express';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  syncWatchlist,
  getUserPreferences,
  updateUserPreferences,
  getAnalysisHistory,
  deleteAnalysisRecord
} from '../services/userDataService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ==================== WATCHLIST ====================

// GET /api/watchlist & /api/user/watchlist
const handleGetWatchlist = async (req, res) => {
  try {
    const tickers = await getWatchlist(req.user.id);
    return res.json({ status: 'success', data: tickers });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
router.get('/watchlist', authenticate, handleGetWatchlist);
router.get('/user/watchlist', authenticate, handleGetWatchlist);

// POST /api/watchlist & /api/user/watchlist
const handleAddWatchlist = async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) {
      return res.status(400).json({ status: 'error', message: 'Ticker is required.' });
    }
    const tickers = await addToWatchlist(req.user.id, ticker);
    return res.json({
      status: 'success',
      message: `Added ${ticker.toUpperCase()} to watchlist.`,
      data: tickers
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
router.post('/watchlist', authenticate, handleAddWatchlist);
router.post('/user/watchlist', authenticate, handleAddWatchlist);

// DELETE /api/watchlist/:ticker & /api/user/watchlist/:ticker
const handleRemoveWatchlist = async (req, res) => {
  try {
    const { ticker } = req.params;
    const tickers = await removeFromWatchlist(req.user.id, ticker);
    return res.json({
      status: 'success',
      message: `Removed ${ticker.toUpperCase()} from watchlist.`,
      data: tickers
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
router.delete('/watchlist/:ticker', authenticate, handleRemoveWatchlist);
router.delete('/user/watchlist/:ticker', authenticate, handleRemoveWatchlist);

// POST /api/user/watchlist/sync
router.post('/user/watchlist/sync', authenticate, async (req, res) => {
  try {
    const { tickers } = req.body;
    if (!Array.isArray(tickers)) {
      return res.status(400).json({ status: 'error', message: 'Tickers must be an array.' });
    }
    const synced = await syncWatchlist(req.user.id, tickers);
    return res.json({
      status: 'success',
      message: 'Watchlist synced successfully.',
      data: synced
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ==================== PREFERENCES ====================

// GET /api/user/preferences
router.get('/user/preferences', authenticate, async (req, res) => {
  try {
    const prefs = await getUserPreferences(req.user.id);
    return res.json({ status: 'success', data: prefs });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT /api/user/preferences
router.put('/user/preferences', authenticate, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ status: 'error', message: 'Settings object is required.' });
    }
    const updated = await updateUserPreferences(req.user.id, settings);
    return res.json({
      status: 'success',
      message: 'Preferences saved successfully.',
      data: updated
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ==================== ANALYSIS HISTORY ====================

// GET /api/user/analysis-history
router.get('/user/analysis-history', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const history = await getAnalysisHistory(req.user.id, limit);
    return res.json({ status: 'success', data: history });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/user/analysis-history/:recordId
router.delete('/user/analysis-history/:recordId', authenticate, async (req, res) => {
  try {
    const { recordId } = req.params;
    const deleted = await deleteAnalysisRecord(req.user.id, recordId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Record not found.' });
    }
    return res.json({ status: 'success', message: 'Record deleted.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
