import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// In-memory fallback collections if MongoDB Atlas is not yet connected or configured
const _inMemoryDb = {
  users: new Map(),
  watchlists: new Map(),
  userPreferences: new Map(),
  analysisHistory: new Map()
};

let isConnected = false;
let usingMemoryFallback = false;
let lastConnectionError = null;
let isConnecting = false;
let reconnectTimer = null;

// Configure connection event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  usingMemoryFallback = false;
  lastConnectionError = null;
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
  console.log(`✅ Successfully connected to MongoDB Atlas (database: ${mongoose.connection.name})`);
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  lastConnectionError = err.message;
  console.error(`❌ MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ MongoDB connection disconnected.');
});

export async function connectDB() {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri || !rawUri.trim()) {
    console.log('ℹ️ MONGODB_URI is not set. Operating with persistent in-memory MongoDB-compatible store.');
    usingMemoryFallback = true;
    return;
  }

  // Already connected or in the process of connecting
  if (mongoose.connection.readyState === 1 || isConnecting || mongoose.connection.readyState === 2) {
    return;
  }

  isConnecting = true;
  // Strip accidental enclosing single or double quotes
  const uri = rawUri.trim().replace(/^["']|["']$/g, '');

  try {
    const dbName = process.env.MONGODB_DB_NAME?.trim() || 'stocktracker';

    // Connect to MongoDB Atlas
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });

    isConnected = true;
    usingMemoryFallback = false;
    lastConnectionError = null;
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
  } catch (err) {
    lastConnectionError = err.message;
    console.error(`⚠️ MongoDB Atlas connection error: ${err.message}`);

    if (err.message.includes('buffering timed out') ||
        err.message.includes('serverSelectionTimeoutMS') ||
        err.message.includes('ETIMEDOUT') ||
        err.message.includes('Could not connect to any servers')) {
      console.error('\n' + '='.repeat(70));
      console.error('🚨 [ACTION REQUIRED FOR RENDER & MONGODB ATLAS]');
      console.error('Render instances have dynamic IPs that change on every deploy and reboot.');
      console.error('To allow Render (and your current network) to access MongoDB Atlas:');
      console.error('  1. Open MongoDB Atlas Dashboard -> Network Access');
      console.error('  2. Click "+ ADD IP ADDRESS"');
      console.error('  3. Click "ALLOW ACCESS FROM ANYWHERE" (IP: 0.0.0.0/0)');
      console.error('  4. Save changes (takes ~1 minute to apply in Atlas)');
      console.error('='.repeat(70) + '\n');
    } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('\n' + '='.repeat(70));
      console.error('🚨 [MONGODB AUTHENTICATION ERROR]');
      console.error('Check your MONGODB_URI username and password in Render Environment Variables.');
      console.error('If your password contains special characters (@, :, #, %, /), URL-encode them.');
      console.error('='.repeat(70) + '\n');
    }

    console.warn('⚡ Operating with in-memory store fallback so HTTP endpoints remain active.');
    usingMemoryFallback = true;

    // Schedule background retry every 10 seconds if not already scheduled
    if (!reconnectTimer) {
      reconnectTimer = setInterval(async () => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(reconnectTimer);
          reconnectTimer = null;
        } else {
          console.log('🔄 Retrying MongoDB Atlas connection in background...');
          await connectDB();
        }
      }, 10000);
    }
  } finally {
    isConnecting = false;
  }
}

export function isUsingMemoryFallback() {
  // If Mongoose is actively connected, always prioritize MongoDB
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return false;
  }
  return usingMemoryFallback;
}

export function getMemoryDB() {
  return _inMemoryDb;
}

export function getDbStatus() {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isMongoReady = readyState === 1;

  return {
    connected: isMongoReady,
    mode: isMongoReady ? 'mongodb' : (isUsingMemoryFallback() ? 'in-memory fallback' : 'disconnected'),
    state: states[readyState] || 'unknown',
    readyState,
    databaseName: isMongoReady ? mongoose.connection.name : (process.env.MONGODB_DB_NAME || 'stocktracker'),
    lastError: isMongoReady ? null : lastConnectionError,
    uriConfigured: Boolean(process.env.MONGODB_URI?.trim())
  };
}
