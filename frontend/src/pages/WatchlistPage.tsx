import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { marketService, userDataService } from '../services/api';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../context/AuthContext';
import { 
  Trash2, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Cloud, 
  CloudOff, 
  History, 
  BarChart2, 
  LogIn, 
  Clock
} from 'lucide-react';

interface QuoteData {
  ticker: string;
  shortName?: string;
  current_price?: number;
  change?: number;
  change_percent?: number;
}

interface AnalysisRecord {
  id: string;
  ticker: string;
  analysis_type: string;
  technical_bias: string;
  plain_language_explanation: string;
  current_price: string;
  base_support: string;
  base_resistance: string;
  high_resistance: string;
  model_used: string;
  created_at: string;
}

const WatchlistPage: React.FC = () => {
    const { watchlist, removeStock } = useWatchlist();
    const { isAuthenticated, openAuthModal, user } = useAuth();

    const [activeTab, setActiveTab] = useState<'watchlist' | 'history'>('watchlist');
    const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<boolean>(false);

    // Analysis History State
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchQuotes = async () => {
            if (watchlist.length === 0) {
                if (isMounted) setLoading(false);
                return;
            }

            setLoading(true);
            setFetchError(false);
            try {
                const results = await Promise.all(
                    watchlist.map(async (ticker) => {
                        try {
                            const data = await marketService.getQuote(ticker);
                            return { ...data, ticker };
                        } catch (error) {
                            console.error(`Error fetching quote for ${ticker}`, error);
                            return { ticker, current_price: 0, change: 0, change_percent: 0, shortName: ticker };
                        }
                    })
                );

                if (isMounted) {
                    const quotesMap: Record<string, QuoteData> = {};
                    results.forEach(q => {
                        quotesMap[q.ticker] = q;
                    });
                    setQuotes(quotesMap);
                }
            } catch (error) {
                console.error("Failed to fetch watchlist quotes", error);
                if (isMounted) setFetchError(true);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchQuotes();

        return () => { isMounted = false; };
    }, [watchlist]);

    // Fetch analysis history when tab is clicked
    useEffect(() => {
        if (activeTab === 'history' && isAuthenticated) {
            setHistoryLoading(true);
            userDataService.getAnalysisHistory()
                .then(data => setHistory(data))
                .catch(err => console.error("Error fetching analysis history:", err))
                .finally(() => setHistoryLoading(false));
        }
    }, [activeTab, isAuthenticated]);

    const handleDeleteHistory = async (recordId: string) => {
        try {
            await userDataService.deleteAnalysisRecord(recordId);
            setHistory(prev => prev.filter(r => r.id !== recordId));
        } catch (err) {
            console.error("Failed to delete history record:", err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>Personal Dashboard</span>
                        {isAuthenticated ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Cloud size={12} /> MongoDB Synced
                            </span>
                        ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                <CloudOff size={12} /> Local Session
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        {isAuthenticated 
                            ? `Logged in as ${user?.name || user?.email}. Your watchlists and AI chart analyses are saved persistently.`
                            : 'Tracking stocks locally. Sign in to sync your data across all your devices.'}
                    </p>
                </div>

                {/* Tab switch */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold self-start sm:self-auto">
                    <button
                        onClick={() => setActiveTab('watchlist')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            activeTab === 'watchlist' 
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        My Watchlist ({watchlist.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                            activeTab === 'history' 
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <History size={13} />
                        AI Analysis History
                    </button>
                </div>
            </div>

            {/* Unauthenticated Sync Banner */}
            {!isAuthenticated && (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-800/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                            <Cloud size={14} className="text-indigo-400" />
                            <span>Save your data to MongoDB Atlas</span>
                        </div>
                        <p className="text-slate-400 mt-0.5">
                            Create a free account to permanently save your watchlists, preferences, and AI chart readers across devices.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => openAuthModal('login')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors flex items-center gap-1"
                        >
                            <LogIn size={13} /> Sign In
                        </button>
                        <button
                            onClick={() => openAuthModal('register')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-xs"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 1: WATCHLIST */}
            {activeTab === 'watchlist' && (
                <>
                    {fetchError && (
                        <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-xl text-xs">
                            Failed to fetch current stock prices. Some data might be missing.
                        </div>
                    )}

                    {watchlist.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center min-h-[45vh] text-center bg-slate-900/60 rounded-2xl border border-slate-800">
                            <div className="bg-slate-800 p-6 rounded-full mb-4 border border-slate-700">
                                <Search className="w-10 h-10 text-slate-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Watchlist is empty</h2>
                            <p className="text-slate-400 max-w-md text-xs">
                                Search for stocks and add them to your watchlist to monitor prices, percent moves, and key levels here.
                            </p>
                            <Link to="/" className="mt-5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md">
                                Discover Stocks
                            </Link>
                        </div>
                    ) : loading ? (
                        <div className="animate-pulse space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-slate-900 rounded-xl flex items-center p-4 border border-slate-800">
                                    <div className="w-10 h-10 bg-slate-800 rounded-full mr-4"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-800 rounded w-1/4"></div>
                                        <div className="h-3 bg-slate-800 rounded w-1/3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 overflow-hidden hover-lift">
                            <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-slate-400 border-b border-slate-800 text-xs uppercase tracking-wider bg-slate-950">
                                <div className="col-span-5 md:col-span-4">Symbol</div>
                                <div className="col-span-4 md:col-span-3 text-right">Price</div>
                                <div className="col-span-3 md:col-span-4 text-right">Change</div>
                                <div className="col-span-12 md:col-span-1 hidden md:block"></div>
                            </div>

                            <div className="divide-y divide-slate-800/80">
                                {watchlist.map(ticker => {
                                    const quote = quotes[ticker];
                                    if (!quote) return null;

                                    const isUp = (quote.change || 0) > 0;
                                    const isDown = (quote.change || 0) < 0;

                                    return (
                                        <div key={ticker} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/60 transition-colors group">
                                            <div className="col-span-5 md:col-span-4">
                                                <Link to={`/stock/${ticker}`} className="block">
                                                    <div className="font-bold text-white group-hover:text-emerald-300 transition-colors">{ticker}</div>
                                                    <div className="text-xs text-slate-400 truncate">{quote.shortName || ticker}</div>
                                                </Link>
                                            </div>

                                            <div className="col-span-4 md:col-span-3 text-right font-mono font-bold text-white text-sm">
                                                {quote.current_price ? `₹${quote.current_price.toLocaleString('en-IN')}` : '—'}
                                            </div>

                                            <div className={`col-span-3 md:col-span-4 flex items-center justify-end font-medium ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'}`}>
                                                <div className="flex items-center gap-1 font-mono text-xs sm:text-sm">
                                                    {isUp ? <ArrowUpRight size={16} /> : isDown ? <ArrowDownRight size={16} /> : null}
                                                    <div className="flex flex-col md:flex-row md:gap-1 text-right items-end md:items-center">
                                                        <span>{isUp ? '+' : ''}{quote.change?.toFixed(2) || '0.00'}</span>
                                                        <span className="text-xs text-slate-400">
                                                            ({quote.change_percent?.toFixed(2) || '0.00'}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center mt-2 md:mt-0 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        removeStock(ticker);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
                                                    title="Remove from Watchlist"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* TAB 2: AI ANALYSIS HISTORY */}
            {activeTab === 'history' && (
                <div>
                    {!isAuthenticated ? (
                        <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] text-center bg-slate-900/60 rounded-2xl border border-slate-800">
                            <BarChart2 className="w-10 h-10 text-slate-500 mb-3" />
                            <h2 className="text-lg font-bold text-white mb-1">Sign In to View Analysis History</h2>
                            <p className="text-xs text-slate-400 max-w-sm mb-4">
                                Log in to automatically save and review your Groq AI chart readings, tentative price targets, and support/resistance corridors.
                            </p>
                            <button
                                onClick={() => openAuthModal('login')}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                            >
                                Sign In Now
                            </button>
                        </div>
                    ) : historyLoading ? (
                        <div className="animate-pulse space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-900 rounded-xl p-4 border border-slate-800"></div>
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] text-center bg-slate-900/60 rounded-2xl border border-slate-800">
                            <Clock className="w-10 h-10 text-slate-500 mb-3" />
                            <h2 className="text-lg font-bold text-white mb-1">No Saved Analyses Yet</h2>
                            <p className="text-xs text-slate-400 max-w-sm mb-4">
                                Run a 5-day candlestick analysis or upload a chart screenshot in the AI Chart Reader, and it will be saved here automatically.
                            </p>
                            <Link
                                to="/ai-chart-reader"
                                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md"
                            >
                                Open AI Chart Reader
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map(record => (
                                <div key={record.id} className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm">{record.ticker}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold uppercase">
                                                {record.analysis_type === '5day_chart' ? '5-Day Candlestick' : 'Screenshot Analysis'}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                                {record.technical_bias}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] text-slate-500">
                                                {record.created_at ? new Date(record.created_at).toLocaleDateString() : ''}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteHistory(record.id)}
                                                className="text-slate-500 hover:text-rose-400 transition-colors"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {record.plain_language_explanation}
                                    </p>

                                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                                        <div>
                                            <span className="text-slate-500">Base Floor: </span>
                                            <span className="font-mono font-semibold text-white">{record.base_support || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Immediate Ceiling: </span>
                                            <span className="font-mono font-semibold text-white">{record.base_resistance || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Major Barrier: </span>
                                            <span className="font-mono font-semibold text-white">{record.high_resistance || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WatchlistPage;
