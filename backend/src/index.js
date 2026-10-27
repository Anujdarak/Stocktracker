import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { connectDB, getDbStatus } from './config/db.js';
import marketRouter from './routes/market.js';
import searchRouter from './routes/search.js';
import newsRouter from './routes/news.js';
import corporateActionsRouter from './routes/corporateActions.js';
import llmRouter from './routes/llm.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend, root, or process.cwd()
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../backend/.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env')
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

const app = express();
const PORT = process.env.PORT || 8000;

// Production-ready CORS configuration:
// Reflect origin so that Vercel frontends (e.g. *.vercel.app), preview deployments,
// and localhost can make authenticated requests without triggering browser wildcard CORS errors.
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins (including non-browser tools with undefined origin)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Preflight handler
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health and Root
app.get(['/', '/api'], (req, res) => {
  res.json({
    message: 'Welcome to Proximity MarketPulse API',
    status: 'online',
    database: getDbStatus()
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    connectDB().catch(() => {});
  }
  const db = getDbStatus();
  res.json({
    status: 'healthy',
    service: 'Proximity MarketPulse API',
    environment: process.env.NODE_ENV || 'development',
    database: db,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
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
  // Connect to MongoDB Atlas (or fallback to in-memory store) before opening port
  await connectDB();

  // Explicitly bind to '0.0.0.0' for compatibility with Render, Docker, and Linux cloud hosts
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proximity Node/Express Server running on port ${PORT} (0.0.0.0:${PORT})`);
  });

  // Graceful shutdown on cloud redeploy/termination signals
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Closing HTTP server and database connections...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
