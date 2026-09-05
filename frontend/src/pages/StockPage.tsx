import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marketService, newsService } from '../services/api';
import PriceChart from '../components/charts/PriceChart';
import NewsImpactWidget from '../components/NewsImpactWidget';
import CorporateActionsWidget from '../components/CorporateActionsWidget';
import { useWatchlist } from '../hooks/useWatchlist';
import {
  Activity,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  BarChart2,
  GitCompare
} from 'lucide-react';

const TIMEFRAMES = [
  { label: '1W', interval: '1d', period: '5d' },
  { label: '1M', interval: '1d', period: '1mo' },
  { label: '3M', interval: '1d', period: '3mo' },
  { label: '6M', interval: '1d', period: '6mo' },
  { label: '1Y', interval: '1wk', period: '1y' },
];

const StockPage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [quote, setQuote] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  const [selectedTf, setSelectedTf] = useState(TIMEFRAMES[1]); // default 1M
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isInWatchlist, addStock, removeStock } = useWatchlist();
  const inWatchlist = ticker ? isInWatchlist(ticker.toUpperCase()) : false;

  // Main fetch on ticker change
  useEffect(() => {
    if (!ticker) return;

    let isMounted = true;
    const fetchStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [quoteData, historyData, newsData, peerData] = await Promise.all([
          marketService.getQuote(ticker).catch(() => null),
          marketService.getHistory(ticker, selectedTf.interval, selectedTf.period).catch(() => []),
          newsService.searchNews(ticker).catch(() => []),
          marketService.getPeers(ticker).catch(() => [])
        ]);

        if (!isMounted) return;

        if (!quoteData) {
          setError(`No data found for '${ticker}'. Please verify the NSE symbol.`);
          setLoading(false);
          return;
        }

        setQuote(quoteData);

        const formattedHistory = (historyData || [])
          .filter((candle: any) => candle && candle.date && candle.open != null && candle.close != null)
          .map((candle: any) => ({
            time: String(candle.date).split('T')[0],
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
            volume: candle.volume != null ? Number(candle.volume) : undefined,
          }));
        setHistory(formattedHistory);

        // Fallback current_price and change if quote was limited but candles exist
        if (quoteData && quoteData.current_price == null && formattedHistory.length > 0) {
          const lastCandle = formattedHistory[formattedHistory.length - 1];
          quoteData.current_price = lastCandle.close;
          if (formattedHistory.length > 1) {
            const prevCandle = formattedHistory[formattedHistory.length - 2];
            quoteData.previous_close = prevCandle.close;
            quoteData.change = Number((lastCandle.close - prevCandle.close).toFixed(2));
            quoteData.change_percent = Number(((quoteData.change / prevCandle.close) * 100).toFixed(2));
          }
        }

        setQuote(quoteData);

        setNews(newsData || []);
        setPeers(peerData || []);
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to fetch stock technical data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStockData();
    return () => { isMounted = false; };
  }, [ticker]);

  // Handle timeframe tab change
  const handleTimeframeChange = async (tf: typeof TIMEFRAMES[0]) => {
    if (!ticker || tf.label === selectedTf.label) return;
    setSelectedTf(tf);
    setChartLoading(true);
    try {
      const historyData = await marketService.getHistory(ticker, tf.interval, tf.period);
      const formatted = (historyData || [])
        .filter((candle: any) => candle && candle.date && candle.open != null && candle.close != null)
        .map((candle: any) => ({
          time: String(candle.date).split('T')[0],
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
          volume: candle.volume != null ? Number(candle.volume) : undefined,
        }));
      setHistory(formatted);
    } catch (err) {
      console.error("Failed to load chart for timeframe:", err);
    } finally {
      setChartLoading(false);
    }
  };

  const toggleWatchlist = () => {
    if (!ticker) return;
    const clean = ticker.toUpperCase();
    if (inWatchlist) {
      removeStock(clean);
    } else {
      addStock(clean);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium animate-pulse space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Loading technicals and market metrics for {ticker}...</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-rose-900">Stock Data Unavailable</h2>
        <p className="text-sm text-rose-700">{error || 'This ticker could not be retrieved from free Yahoo Finance feeds.'}</p>
        <Link to="/" className="inline-block px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800">
          Back to Search
        </Link>
      </div>
    );
  }

  const isLimited = (quote.status === 'limited_data' || quote.current_price === null) && history.length === 0;
  const isUp = (quote.change || 0) >= 0;
  const colorClass = isUp ? 'text-emerald-600' : 'text-rose-600';

  // Fallbacks for key stats from historical candles if quote fields are null
  const fallbackHigh = history.length > 0 ? Math.max(...history.map(c => c.high)) : null;
  const fallbackLow = history.length > 0 ? Math.min(...history.map(c => c.low)) : null;
  const fallbackVolume = history.length > 0 ? history[history.length - 1]?.volume : null;

  const display52High = quote['52_week_high'] ?? fallbackHigh;
  const display52Low = quote['52_week_low'] ?? fallbackLow;
  const displayVolume = quote.volume ?? fallbackVolume;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Limited Data Notice if applicable */}
      {isLimited && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 text-sm">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <span>
            {quote.message || 'Limited historical trading data available for this illiquid or obscure NSE security.'}
          </span>
        </div>
      )}

      {/* Main Stock Header Card */}
      <div className="bg-slate-900/90 p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover-lift">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase border border-slate-700">
              NSE Equity
            </span>
            <span className="bg-emerald-500/10 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-semibold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> NSE Live Feed
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {quote.shortName || ticker}
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-0.5">{quote.symbol || ticker}</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 justify-between md:justify-end">
          <div className="text-left md:text-right">
            <div className="text-3xl font-black font-mono text-white">
              {quote.current_price ? `₹${quote.current_price.toLocaleString('en-IN')}` : '—'}
            </div>
            <div className={`text-sm font-bold flex items-center md:justify-end gap-1 ${colorClass}`}>
              {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isUp ? '+' : ''}{quote.change?.toFixed(2)} ({isUp ? '+' : ''}{quote.change_percent?.toFixed(2)}%)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleWatchlist}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-xs ${
                inWatchlist
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {inWatchlist ? (
                <>
                  <BookmarkCheck size={16} className="text-emerald-400" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark size={16} />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>

            <Link
              to={`/compare`}
              className="p-2.5 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 rounded-xl border border-purple-500/30 transition-colors"
              title="Side-by-Side Stock Battle"
            >
              <GitCompare size={17} />
            </Link>

            <Link
              to={`/ai-chart-reader`}
              state={{ defaultTicker: ticker }}
              className="p-2.5 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 rounded-xl border border-violet-500/30 transition-colors"
              title="Analyze in AI Chart Reader"
            >
              <BarChart2 size={17} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Key Stats (Left 65%) vs AI & News (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Chart + Stats + Peers) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Interactive Candlestick Chart */}
          <div className="bg-slate-900/90 p-6 rounded-2xl shadow-md border border-slate-800 hover-lift">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                <h2 className="text-base font-bold text-white">Interactive Technical Chart</h2>
              </div>

              {/* Timeframe Toggles */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.label}
                    onClick={() => handleTimeframeChange(tf)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      selectedTf.label === tf.label
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {chartLoading ? (
              <div className="h-80 flex items-center justify-center bg-slate-950 text-slate-400 text-sm animate-pulse rounded-lg border border-slate-800">
                Updating chart candles...
              </div>
            ) : history.length > 0 ? (
              <PriceChart data={history} backgroundColor="#090d16" textColor="#94a3b8" />
            ) : (
              <div className="h-80 flex flex-col items-center justify-center bg-slate-950 text-slate-400 rounded-lg border border-slate-800 p-6 text-center">
                <BarChart2 size={36} className="text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">Chart data unavailable</p>
                <p className="text-xs text-slate-500 mt-1">Free feeds have no daily candles for this symbol.</p>
              </div>
            )}
          </div>

          {/* Key Statistics Grid */}
          <div className="bg-slate-900/90 p-6 rounded-2xl shadow-md border border-slate-800 hover-lift">
            <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
              Key Fundamental & Market Statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Market Capitalization</span>
                <p className="font-mono font-bold text-base text-white mt-0.5">
                  {quote.market_cap ? `₹${(quote.market_cap / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr` : '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">P/E Ratio</span>
                <p className="font-mono font-bold text-base text-white mt-0.5">
                  {quote.pe_ratio ? quote.pe_ratio.toFixed(2) : '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Trading Volume</span>
                <p className="font-mono font-bold text-base text-white mt-0.5">
                  {displayVolume ? Number(displayVolume).toLocaleString('en-IN') : '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">52-Week High</span>
                <p className="font-mono font-bold text-base text-emerald-400 mt-0.5">
                  {display52High ? `₹${display52High.toLocaleString('en-IN')}` : '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">52-Week Low</span>
                <p className="font-mono font-bold text-base text-rose-400 mt-0.5">
                  {display52Low ? `₹${display52Low.toLocaleString('en-IN')}` : '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Price to Book (P/B)</span>
                <p className="font-mono font-bold text-base text-white mt-0.5">
                  {quote.pb_ratio ? quote.pb_ratio.toFixed(2) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Corporate Actions Tracker (Dividends & Buybacks) */}
          <CorporateActionsWidget ticker={ticker || ""} />

          {/* Peer Comparison Table */}
          <div className="bg-slate-900/90 p-6 rounded-2xl shadow-md border border-slate-800 hover-lift">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <Users size={18} className="text-blue-400" />
              <h2 className="text-base font-bold text-white">Sector Peer Comparison</h2>
            </div>

            {peers.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No peer comparisons found in this sectoral basket.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-2">Company</th>
                      <th className="pb-2 text-right">Price (₹)</th>
                      <th className="pb-2 text-right">Day Move</th>
                      <th className="pb-2 text-right">P/E Ratio</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {peers.map((peer, idx) => {
                      const peerUp = (peer.change || 0) >= 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3">
                            <div className="font-bold text-slate-200">{peer.shortName}</div>
                            <div className="text-xs text-slate-400">{peer.symbol.replace('.NS', '')}</div>
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-white">
                            ₹{peer.current_price?.toLocaleString('en-IN') || '—'}
                          </td>
                          <td className={`py-3 text-right font-mono font-bold ${peerUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {peerUp ? '+' : ''}{peer.change_percent?.toFixed(2)}%
                          </td>
                          <td className="py-3 text-right font-mono text-slate-400">
                            {peer.pe_ratio ? peer.pe_ratio.toFixed(1) : '—'}
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              to={`/stock/${peer.symbol}`}
                              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (AI News Impact & Live Feed) */}
        <div className="space-y-6">

          {/* AI News Impact Card */}
          <NewsImpactWidget ticker={ticker || ""} />

          {/* Stock Specific News Feed */}
          <div className="bg-slate-900/90 p-6 rounded-2xl shadow-md border border-slate-800 hover-lift">
            <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
              News Wire for {ticker}
            </h2>

            {news.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No recent news found mentioning this specific ticker.</p>
            ) : (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {news.slice(0, 8).map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40 transition-colors group"
                  >
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 leading-snug line-clamp-2 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span className="text-emerald-400/80 font-medium">{item.source || 'Financial News'}</span>
                      <span>{item.published ? item.published.slice(0, 16) : ''}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default StockPage;