import express from 'express';
import { NewsService } from '../services/newsService.js';

const router = express.Router();

// GET /api/news/latest
router.get('/latest', async (req, res) => {
  try {
    const news = await NewsService.getLatestNews();
    return res.json(news);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/news/search
router.get('/search', async (req, res) => {
  try {
    const q = req.query.query || '';
    const news = await NewsService.searchNews(q);
    return res.json(news);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
