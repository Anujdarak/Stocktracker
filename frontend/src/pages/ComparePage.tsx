import React, { useState, useEffect } from 'react';
import { compareService, searchService } from '../services/api';
import {
  GitCompare,
  X,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PRESET_BATTLES = [
  { name: 'IT Tech Giants', tickers: ['TCS', 'INFY', 'WIPRO'] },
  { name: 'Private Banking Titans', tickers: ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK'] },
  { name: 'Defense Heavyweights', tickers: ['HAL', 'BEL'] },
  { name: 'Retail & Consumer Giants', tickers: ['TITAN', 'TRENT'] }
];

export const ComparePage: React.FC = () => {
  const [activeTickers, setActiveTickers] = useState<string[]>(['TCS', 'INFY']);
  const [compareData, setCompareData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (activeTickers.length === 0) return;
    loadComparison(activeTickers);
  }, [activeTickers]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.search(searchQuery);
        setSearchResults(res.slice(0, 5));
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadComparison = async (tickers: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await compareService.compare(tickers);
      setCompareData(data);
    } catch {
      setError("Failed to fetch comparison data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicker = (sym: string) => {
    const clean = sym.trim().toUpperCase();
    if (!clean || activeTickers.includes(clean)) return;
    if (activeTickers.length >= 4) {
      alert("You can compare up to 4 stocks simultaneously.");
      return;
    }
    setActiveTickers([...activeTickers, clean]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveTicker = (sym: string) => {
    if (activeTickers.length <= 2) {
      alert("At least 2 stocks are required for comparison.");
      return;
    }
    setActiveTickers(activeTickers.filter(t => t !== sym));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-slate-900 border border-violet-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <GitCompare className="w-3.5 h-3.5" />
          Side-by-Side Stock Battle
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Multi-Stock Comparison Matrix
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Directly contrast valuation multiples, 1-month relative performance, and trading metrics of competing Indian equities side-by-side.
        </p>

        {/* Preset Battles */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-slate-400 font-medium">Popular Battles:</span>
          {PRESET_BATTLES.map((b) => (
            <button
              key={b.name}
              onClick={() => setActiveTickers(b.tickers)}
              className="px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              {b.name} ({b.tickers.join(' vs ')})
            </button>
          ))}
        </div>
      </div>

      {/* Ticker Management Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Active Ticker Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Comparing:</span>
          {activeTickers.map((t) => (
            <div
              key={t}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-white text-xs font-semibold"
            >
              <span>{t}</span>
              <button
                onClick={() => handleRemoveTicker(t)}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Ticker Search */}
        <div className="relative min-w-[240px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Add symbol (max 4)..."
              disabled={activeTickers.length >= 4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden divide-y divide-slate-800">
              {searchResults.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => handleAddTicker(r.symbol)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex justify-between items-center"
                >
                  <span className="font-semibold text-white">{r.symbol}</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400 mt-4">Comparing equities...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-sm">
          {error}
        </div>
      ) : compareData.length > 0 && (
        <div className="space-y-8">
          {/* Comparison Matrix Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Key Fundamentals & Multiples Comparison
              </h2>
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                NSE Market Feed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Financial Metric</th>
                    {compareData.map((item) => (
                      <th key={item.quote.symbol} className="px-5 py-3 text-right">
                        <span className="font-bold text-white text-sm block">{item.quote.symbol.replace('.NS', '')}</span>
                        <span className="text-[10px] text-slate-400 font-normal truncate max-w-[140px] block">
                          {item.quote.shortName}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* Current Price */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-300">Current Price (₹)</td>
                    {compareData.map((item) => (
                      <td key={item.quote.symbol} className="px-5 py-3.5 text-right font-bold text-white text-sm">
                        ₹{item.quote.current_price?.toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>

                  {/* Day Change % */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-300">Today's Move (%)</td>
                    {compareData.map((item) => {
                      const cp = item.quote.change_percent || 0.0;
                      return (
                        <td key={item.quote.symbol} className={`px-5 py-3.5 text-right font-bold ${
                          cp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {cp >= 0 ? `+${cp}%` : `${cp}%`}
                        </td>
                      );
                    })}
                  </tr>

                  {/* 1-Month Return % */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-300">1-Month Relative Move</td>
                    {compareData.map((item) => {
                      const ret = item.return_1mo_percent || 0.0;
                      return (
                        <td key={item.quote.symbol} className={`px-5 py-3.5 text-right font-bold ${
                          ret >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {ret >= 0 ? `+${ret}%` : `${ret}%`}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Market Cap */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-300">Market Cap (₹ Cr)</td>
                    {compareData.map((item) => {
                      const mc = item.quote.market_cap;
                      return (
                        <td key={item.quote.symbol} className="px-5 py-3.5 text-right text-slate-200">
                          {mc ? `₹${Math.round(mc / 10000000).toLocaleString('en-IN')} Cr` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* P/E Ratio */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-300">P/E Ratio (Price / Earnings)</td>
                    {compareData.map((item) => (
                      <td key={item.quote.symbol} className="px-5 py-3.5 text-right text-slate-200 font-bold">
                        {item.quote.pe_ratio ? `${item.quote.pe_ratio}x` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* P/B Ratio */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-300">P/B Ratio (Price / Book)</td>
                    {compareData.map((item) => (
                      <td key={item.quote.symbol} className="px-5 py-3.5 text-right text-slate-200">
                        {item.quote.pb_ratio ? `${item.quote.pb_ratio}x` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* 52-Week Range */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-300">52-Week High / Low</td>
                    {compareData.map((item) => (
                      <td key={item.quote.symbol} className="px-5 py-3.5 text-right text-slate-300 text-[11px]">
                        ₹{item.quote['52_week_high']} / ₹{item.quote['52_week_low']}
                      </td>
                    ))}
                  </tr>

                  {/* Quick Action Links */}
                  <tr>
                    <td className="px-5 py-4 font-sans font-medium text-slate-400">Deep Dive Tools</td>
                    {compareData.map((item) => {
                      const sym = item.quote.symbol.replace('.NS', '');
                      return (
                        <td key={item.quote.symbol} className="px-5 py-4 text-right space-y-1.5 font-sans">
                          <Link
                            to={`/stock/${sym}`}
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold block"
                          >
                            Technical View →
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
