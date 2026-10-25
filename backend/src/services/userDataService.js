import { Watchlist } from '../models/Watchlist.js';
import { UserPreference } from '../models/UserPreference.js';
import { AnalysisHistory } from '../models/AnalysisHistory.js';
import { isUsingMemoryFallback, getMemoryDB } from '../config/db.js';
import crypto from 'crypto';

const DEFAULT_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC', 'TATAMOTORS', 'SBIN'];

export async function getWatchlist(userId) {
  if (isUsingMemoryFallback()) {
    const memDb = getMemoryDB();
    if (!memDb.watchlists.has(userId)) {
      memDb.watchlists.set(userId, [...DEFAULT_WATCHLIST]);
    }
    return memDb.watchlists.get(userId);
  }

  let doc = await Watchlist.findOne({ userId });
  if (!doc) {
    doc = await Watchlist.create({ userId, tickers: DEFAULT_WATCHLIST });
  }
  return doc.tickers;
}

export async function addToWatchlist(userId, ticker) {
  const clean = ticker.trim().toUpperCase().replace('.NS', '');
  if (!clean) return getWatchlist(userId);

  if (isUsingMemoryFallback()) {
    const current = await getWatchlist(userId);
    if (!current.includes(clean)) {
      current.push(clean);
      getMemoryDB().watchlists.set(userId, current);
    }
    return current;
  }

  let doc = await Watchlist.findOne({ userId });
  if (!doc) {
    doc = await Watchlist.create({ userId, tickers: [...DEFAULT_WATCHLIST] });
  }
  if (!doc.tickers.includes(clean)) {
    doc.tickers.push(clean);
    await doc.save();
  }
  return doc.tickers;
}

export async function removeFromWatchlist(userId, ticker) {
  const clean = ticker.trim().toUpperCase().replace('.NS', '');

  if (isUsingMemoryFallback()) {
    let current = await getWatchlist(userId);
    current = current.filter(t => t !== clean);
    getMemoryDB().watchlists.set(userId, current);
    return current;
  }

  let doc = await Watchlist.findOne({ userId });
  if (doc) {
    doc.tickers = doc.tickers.filter(t => t !== clean);
    await doc.save();
    return doc.tickers;
  }
  return [];
}

export async function syncWatchlist(userId, tickers) {
  const cleanList = Array.from(new Set(tickers.map(t => t.trim().toUpperCase().replace('.NS', '')).filter(Boolean)));

  if (isUsingMemoryFallback()) {
    getMemoryDB().watchlists.set(userId, cleanList);
    return cleanList;
  }

  const doc = await Watchlist.findOneAndUpdate(
    { userId },
    { tickers: cleanList },
    { upsert: true, new: true }
  );
  return doc.tickers;
}

export async function getUserPreferences(userId) {
  const defaultPrefs = {
    theme: 'dark',
    chartInterval: '1d',
    autoRefresh: true,
    currency: 'INR'
  };

  if (isUsingMemoryFallback()) {
    const memDb = getMemoryDB();
    if (!memDb.userPreferences.has(userId)) {
      memDb.userPreferences.set(userId, { ...defaultPrefs });
    }
    return memDb.userPreferences.get(userId);
  }

  let doc = await UserPreference.findOne({ userId });
  if (!doc) {
    doc = await UserPreference.create({ userId, settings: defaultPrefs });
  }
  return doc.settings || defaultPrefs;
}

export async function updateUserPreferences(userId, newSettings) {
  const current = await getUserPreferences(userId);
  const merged = { ...current, ...newSettings };

  if (isUsingMemoryFallback()) {
    getMemoryDB().userPreferences.set(userId, merged);
    return merged;
  }

  const doc = await UserPreference.findOneAndUpdate(
    { userId },
    { settings: merged },
    { upsert: true, new: true }
  );
  return doc.settings;
}

export async function saveAnalysisHistory(userId, { ticker, analysisType, data }) {
  const cleanTicker = (ticker || 'GENERAL').toUpperCase();
  const type = analysisType || 'chart_screenshot';

  if (isUsingMemoryFallback()) {
    const memDb = getMemoryDB();
    if (!memDb.analysisHistory.has(userId)) {
      memDb.analysisHistory.set(userId, []);
    }
    const record = {
      id: crypto.randomUUID(),
      userId,
      ticker: cleanTicker,
      analysisType: type,
      data,
      createdAt: new Date().toISOString()
    };
    const list = memDb.analysisHistory.get(userId);
    list.unshift(record);
    if (list.length > 50) list.pop();
    return record;
  }

  const doc = await AnalysisHistory.create({
    userId,
    ticker: cleanTicker,
    analysisType: type,
    data
  });
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    ticker: doc.ticker,
    analysisType: doc.analysisType,
    data: doc.data,
    createdAt: doc.createdAt
  };
}

export async function getAnalysisHistory(userId, limit = 20) {
  if (isUsingMemoryFallback()) {
    const list = getMemoryDB().analysisHistory.get(userId) || [];
    return list.slice(0, limit);
  }

  const docs = await AnalysisHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return docs.map(doc => ({
    id: doc._id.toString(),
    userId: doc.userId,
    ticker: doc.ticker,
    analysisType: doc.analysisType,
    data: doc.data,
    createdAt: doc.createdAt
  }));
}

export async function deleteAnalysisRecord(userId, recordId) {
  if (isUsingMemoryFallback()) {
    const list = getMemoryDB().analysisHistory.get(userId) || [];
    const initialLen = list.length;
    const filtered = list.filter(r => r.id !== recordId);
    getMemoryDB().analysisHistory.set(userId, filtered);
    return filtered.length < initialLen;
  }

  const res = await AnalysisHistory.findOneAndDelete({ _id: recordId, userId });
  return !!res;
}
