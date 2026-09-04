import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { marketService } from '../services/api';
import { useWatchlist } from '../hooks/useWatchlist';
import { Trash2, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface QuoteData {
  ticker: string;
  shortName?: string;
  current_price?: number;
  change?: number;
  change_percent?: number;
}

const WatchlistPage: React.FC = () => {
    const { watchlist, removeStock } = useWatchlist();
    const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<boolean>(false);

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
                            // Return empty state for failed tickers
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

    if (watchlist.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center bg-slate-900/60 rounded-2xl border border-slate-800">
                <div className="bg-slate-800 p-6 rounded-full mb-4 border border-slate-700">
                    <Search className="w-12 h-12 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Watchlist is empty</h2>
                <p className="text-slate-400 max-w-md text-sm">
                    Search for stocks and add them to your watchlist to keep track of their performance here.
                </p>
                <Link to="/" className="mt-6 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md">
                    Find Stocks
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0">
            <h1 className="text-2xl font-bold text-white mb-6">My Watchlist</h1>

            {fetchError && (
                <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-xl text-xs">
                    Failed to fetch current stock prices. Some data might be missing.
                </div>
            )}

            {loading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                         <div key={i} className="h-20 bg-slate-900 rounded-xl flex items-center p-4 border border-slate-800">
                             <div className="w-12 h-12 bg-slate-800 rounded-full mr-4"></div>
                             <div className="flex-1 space-y-3">
                                 <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                                 <div className="h-4 bg-slate-800 rounded w-1/3"></div>
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

                                    <div className="col-span-4 md:col-span-3 text-right font-mono font-bold text-white">
                                        {quote.current_price ? `₹${quote.current_price.toLocaleString('en-IN')}` : '—'}
                                    </div>

                                    <div className={`col-span-3 md:col-span-4 flex items-center justify-end font-medium ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'}`}>
                                        <div className="flex items-center gap-1 font-mono">
                                            {isUp ? <ArrowUpRight size={16} /> : isDown ? <ArrowDownRight size={16} /> : null}
                                            <div className="flex flex-col md:flex-row md:gap-1 text-right items-end md:items-center">
                                                <span>{isUp ? '+' : ''}{quote.change?.toFixed(2) || '0.00'}</span>
                                                <span className="text-xs md:text-sm text-slate-400">
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
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                                            title="Remove from Watchlist"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatchlistPage;