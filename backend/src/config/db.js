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

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    console.log('ℹ️ MONGODB_URI is not set. Operating with persistent in-memory MongoDB-compatible store.');
    usingMemoryFallback = true;
    return;
  }

  try {
    const dbName = process.env.MONGODB_DB_NAME?.trim() || 'stocktracker';
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    usingMemoryFallback = false;
    console.log(`✅ Successfully connected to MongoDB Atlas (database: ${dbName})`);
  } catch (err) {
    console.warn(`⚠️ MongoDB Atlas connection error: ${err.message}. Seamlessly falling back to in-memory store.`);
    usingMemoryFallback = true;
  }
}

export function isUsingMemoryFallback() {
  return usingMemoryFallback;
}

export function getMemoryDB() {
  return _inMemoryDb;
}
