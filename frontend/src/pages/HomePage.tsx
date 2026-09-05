import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { marketService, newsService } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  ArrowRight,
  BarChart3,
  Newspaper,
  ShieldCheck,
  ArrowDown
} from 'lucide-react';
import { VolatilityOutlookWidget } from '../components/VolatilityOutlookWidget';
import UpcomingActionsPreview from '../components/UpcomingActionsPreview';

const TRENDING_STOCKS = [
  { symbol: 'ZOMATO', name: 'Zomato' },
  { symbol: 'RELIANCE', name: 'Reliance' },
  { symbol: 'TATASTEEL', name: 'Tata Steel' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'TITAN', name: 'Titan' },
  { symbol: 'HAL', name: 'HAL' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'SUZLON', name: 'Suzlon' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'JIOFIN', name: 'Jio Financial' }
];

const HomePage: React.FC = () => {
  const [indices, setIndices] = useState<any[]>([]);
  const [movers, setMovers] = useState<{ gainers: any[]; losers: any[] }>({ gainers: [], losers: [] });
  const [sectors, setSectors] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [loadingMovers, setLoadingMovers] = useState(true);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [activeMoverTab, setActiveMoverTab] = useState<'gainers' | 'losers'>('gainers');

  useEffect(() => {
    // 1. Fetch Indices
    marketService.getIndices()
      .then((data) => setIndices(data))
      .catch((err) => console.error("Indices load error:", err))
      .finally(() => setLoadingIndices(false));

    // 2. Fetch Curated Movers
    marketService.getMovers()
      .then((data) => setMovers(data))
      .catch((err) => console.error("Movers load error:", err))
      .finally(() => setLoadingMovers(false));

    // 3. Fetch Sectors
    marketService.getSectors()
      .then((data) => setSectors(data))
      .catch((err) => console.error("Sectors load error:", err))
      .finally(() => setLoadingSectors(false));

    // 4. Fetch Latest News
    newsService.getLatest()
      .then((data) => setNews(data.slice(0, 10)))
      .catch((err) => console.error("News load error:", err))
      .finally(() => setLoadingNews(false));
  }, []);

  const getHeatmapColor = (changePct: number) => {
    if (changePct >= 2.0) return 'bg-emerald-600/80 text-white border-emerald-400/50';
    if (changePct >= 0.8) return 'bg-emerald-700/70 text-white border-emerald-500/40';
    if (changePct > 0) return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    if (changePct <= -2.0) return 'bg-rose-600/80 text-white border-rose-400/50';
    if (changePct <= -0.8) return 'bg-rose-700/70 text-white border-rose-500/40';
    if (changePct < 0) return 'bg-rose-950/60 text-rose-300 border-rose-500/30';
    return 'bg-slate-950/60 text-slate-300 border-slate-800';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Hero / Intro Section: "Confused About the Stock Market?" */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-emerald-950/30 border border-indigo-500/25 shadow-xl p-6 sm:p-8">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Headline */}
          <h1 className="hero-animate-title text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Confused About the Stock Market? <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">You're Not Alone.</span>
          </h1>

          {/* Subheadline / Body */}
          <p className="hero-animate-subtext text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mb-7 font-normal">
            Already invested but not sure when to exit? Thinking about investing but don't know where to start? Can't make sense of a stock chart? <strong className="text-white font-medium">Proximity</strong> is built to help — explore the sections below and see how.
          </p>

          {/* 4 Preview Cards (Staggered Entrance Animation) */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7 text-left">
            {/* Card 1 */}
            <Link
              to="/ai-chart-reader"
              className="hero-animate-card-1 group bg-slate-950/70 hover:bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-xl p-3.5 transition-colors block"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-105 transition-transform duration-150">
                  <BarChart3 size={18} />
                </span>
                <h3 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                  Understand any chart
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pl-0.5">
                Upload a screenshot, get a plain-English read.
              </p>
            </Link>

            {/* Card 2 */}
            <Link
              to="/news-results"
              className="hero-animate-card-2 group bg-slate-950/70 hover:bg-slate-900/90 border border-slate-800/90 hover:border-blue-500/40 rounded-xl p-3.5 transition-colors block"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="p-2 rounded-lg bg-blue-500/15 text-blue-400 group-hover:scale-105 transition-transform duration-150">
                  <Newspaper size={18} />
                </span>
                <h3 className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                  Know what news means
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pl-0.5">
                Plain-language market impact analysis.
              </p>
            </Link>

            {/* Card 3 */}
            <Link
              to="/sectors"
              className="hero-animate-card-3 group bg-slate-950/70 hover:bg-slate-900/90 border border-slate-800/90 hover:border-violet-500/40 rounded-xl p-3.5 transition-colors block"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="p-2 rounded-lg bg-violet-500/15 text-violet-400 group-hover:scale-105 transition-transform duration-150">
                  <Layers size={18} />
                </span>
                <h3 className="text-xs font-bold text-slate-100 group-hover:text-violet-300 transition-colors">
                  Explore by sector
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pl-0.5">
                Defense, IT, Banking, Auto, and more.
              </p>
            </Link>

            {/* Card 4 */}
            <div className="hero-animate-card-4 bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 block">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                  <ShieldCheck size={18} />
                </span>
                <h3 className="text-xs font-bold text-slate-100">
                  100% Free forever
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pl-0.5">
                Built for genuine learning, not gatekeeping.
              </p>
            </div>
          </div>

          {/* CTA Button ("Explore the Market") */}
          <div className="hero-animate-cta">
            <button
              onClick={() => {
                const target = document.getElementById('market-snapshot');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] hover:scale-[1.02] text-slate-950 font-bold rounded-xl text-sm transition-transform duration-150 shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <span>Explore the Market</span>
              <ArrowDown size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Top Market Snapshot Strip */}
      <div id="market-snapshot" className="bg-slate-900 text-white rounded-xl p-3 sm:p-4 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 scroll-mt-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b md:border-b-0 md:border-r border-slate-800 pb-2 md:pb-0 md:pr-4">
          <Clock size={14} className="text-emerald-400" />
          <span>Market Snapshot</span>
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Market Feed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          {loadingIndices ? (
            <div className="col-span-3 text-slate-400 text-xs py-1 animate-pulse">
              Fetching live index quotes (Nifty 50, Sensex, Bank Nifty)...
            </div>
          ) : indices.length > 0 ? (
            indices.map((idx, i) => {
              const isUp = (idx.change || 0) >= 0;
              return (
                <div key={i} className="flex items-center justify-between sm:justify-start sm:gap-3 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <span className="font-semibold text-sm text-slate-200">{idx.displayName || idx.shortName}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono font-bold text-sm">₹{idx.current_price?.toLocaleString('en-IN') || '—'}</span>
                    <span className={`text-xs font-medium flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '+' : ''}{idx.change?.toFixed(2)} ({isUp ? '+' : ''}{idx.change_percent?.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-slate-400 text-xs py-1">
              Index feeds temporarily updating.
            </div>
          )}
        </div>
      </div>

      {/* Trending Stocks Quick Bar */}
      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 shadow-md flex items-center gap-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide shrink-0">
          <Flame size={16} />
          <span>Trending:</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {TRENDING_STOCKS.map((stk) => (
            <Link
              key={stk.symbol}
              to={`/stock/${stk.symbol}`}
              className="px-3 py-1 bg-slate-950/80 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-800/80 rounded-lg text-xs font-semibold text-slate-300 transition-all hover:scale-105"
            >
              {stk.name}
            </Link>
          ))}
        </div>
      </div>

      {/* India VIX-Based Expected Range Volatility Outlook */}
      <VolatilityOutlookWidget />

      {/* Hero / Callouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Stock Market Technicals, <span className="text-emerald-400">Translated Simply</span>.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Upload any chart screenshot or pick from 2,500+ NSE stocks. Get instant, plain-language pattern reads without confusing trader jargon.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/ai-chart-reader"
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
              >
                <BarChart3 size={16} /> Try AI Chart Reader
              </Link>
              <Link
                to="/sectors"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-sm transition-colors border border-slate-700 flex items-center gap-2"
              >
                Explore 12 Sectors <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
            <BarChart3 size={280} />
          </div>
        </div>

        {/* Top Gainers / Losers Widget */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between hover-lift">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" />
                Market Movers
              </h2>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setActiveMoverTab('gainers')}
                  className={`px-3 py-1 rounded-md transition-all ${activeMoverTab === 'gainers' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Gainers
                </button>
                <button
                  onClick={() => setActiveMoverTab('losers')}
                  className={`px-3 py-1 rounded-md transition-all ${activeMoverTab === 'losers' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Losers
                </button>
              </div>
            </div>

            {loadingMovers ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-slate-800 animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {(activeMoverTab === 'gainers' ? movers.gainers : movers.losers).map((stock, i) => {
                  const isUp = (stock.change_percent || 0) >= 0;
                  return (
                    <li key={i} className="py-2 flex items-center justify-between hover:bg-slate-800/60 px-1 rounded transition-colors">
                      <Link to={`/stock/${stock.symbol}`} className="block group">
                        <span className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors">{stock.symbol.replace('.NS', '')}</span>
                        <span className="block text-[11px] text-slate-400 truncate max-w-[120px]">{stock.shortName}</span>
                      </Link>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-white">₹{stock.current_price?.toLocaleString('en-IN')}</div>
                        <div className={`text-xs font-bold flex items-center justify-end gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {isUp ? '+' : ''}{stock.change_percent?.toFixed(2)}%
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>Curated ~30 NSE leaders</span>
            <span className="text-emerald-400 font-medium">Live Feed</span>
          </div>
        </div>
      </div>

      {/* Upcoming Corporate Actions Preview (Dividends & Buybacks) */}
      <UpcomingActionsPreview />

      {/* Sector Performance Snapshot Heatmap (Page 1 requirement) */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md space-y-4 hover-lift">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-indigo-400" />
              Sector Performance Heatmap
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time average day move across NSE sectoral groups</p>
          </div>
          <Link to="/sectors" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
            View All Sectors <ArrowRight size={14} />
          </Link>
        </div>

        {loadingSectors ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 py-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-800 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sectors.map((sec) => {
              const isUp = sec.avg_change_percent >= 0;
              return (
                <Link
                  key={sec.id}
                  to={`/sectors`}
                  className={`p-3.5 rounded-xl border transition-all hover:scale-[1.02] shadow-xs flex flex-col justify-between ${getHeatmapColor(sec.avg_change_percent)}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs leading-snug line-clamp-2">{sec.name}</span>
                    <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded font-mono ${isUp ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300'}`}>
                      {isUp ? '+' : ''}{sec.avg_change_percent?.toFixed(2)}%
                    </span>
                  </div>
                  {sec.top_mover && (
                    <div className="text-[11px] opacity-90 mt-2 truncate font-medium">
                      Top: <span className="font-bold">{sec.top_mover.symbol.replace('.NS', '')}</span> ({sec.top_mover.change_percent > 0 ? '+' : ''}{sec.top_mover.change_percent?.toFixed(1)}%)
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Latest Financial News Section (India-Focused) */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md space-y-4 hover-lift">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            India Financial News Wire
          </h2>
          <span className="text-xs text-slate-400">Moneycontrol • Economic Times • Livemint</span>
        </div>

        {loadingNews ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-800 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40 transition-all hover-lift flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span className="font-semibold text-emerald-400 uppercase tracking-wider">{item.source}</span>
                    <span>{item.published ? item.published.slice(0, 16) : ''}</span>
                  </div>
                  <h3 className="font-semibold text-slate-200 text-sm group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.snippet && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.snippet}</p>
                  )}
                </div>
                <div className="text-[11px] font-medium text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 mt-2.5 self-end transition-colors">
                  Read source <ExternalLink size={12} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default HomePage;