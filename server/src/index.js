import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import marketRouter from './routes/market.js';
import searchRouter from './routes/search.js';
import newsRouter from './routes/news.js';
import corporateActionsRouter from './routes/corporateActions.js';
import llmRouter from './routes/llm.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory, fallback to root or backend if needed
const envPaths = [
  path.resolve(__dirname, '../../server/.env'),
  path.resolve(__dirname, '../../backend/.env'),
  path.resolve(__dirname, '../../.env')
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health and Root
app.get(['/', '/api'], (req, res) => {
  res.json({ message: 'Welcome to MarketPulse API', status: 'online' });
});

app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'healthy', service: 'MarketPulse API' });
});

// Mount Routers
app.use('/api/market', marketRouter);
app.use('/api/search', searchRouter);
app.use('/api/news', newsRouter);
app.use('/api/corporate-actions', corporateActionsRouter);
app.use('/api/llm', llmRouter);
app.use('/api/auth', authRouter);
app.use('/api', userRouter);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Start Server
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 MarketPulse Node/Express Server running on http://127.0.0.1:${PORT}`);
  });
}

startServer();
