import express from 'express';
import { searchService } from '../services/searchService.js';

const router = express.Router();

// GET /api/search/
router.get('/', (req, res) => {
  const q = req.query.q || '';
  const limit = parseInt(req.query.limit, 10) || 10;

  if (!q.trim()) {
    return res.status(400).json({ status: 'error', message: 'Query parameter q is required.' });
  }

  const results = searchService.search(q, limit);
  return res.json({
    status: 'success',
    query: q,
    results
  });
});

export default router;
