import React, { useState, useEffect } from 'react';
import { screenerService } from '../services/api';
import {
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FILTER_TABS = [
  { id: 'near_52w_high', label: '52-Week High Breakouts', icon: TrendingUp, desc: 'Stocks trading within 7% of their 52-week peak' },
  { id: 'oversold', label: 'Oversold Support Zone', icon: TrendingDown, desc: 'Stocks trading near 52-week low support levels' },
  { id: 'volume_surge', label: 'Volume Surge Activity', icon: Zap, desc: 'Unusual institutional trading volumes' },
  { id: 'value_largecap', label: 'Quality Value Large-Caps', icon: BarChart2, desc: 'Attractive P/E valuation (< 25x)' }
];

export const ScreenerPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('near_52w_high');
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadScreener(activeFilter);
  }, [activeFilter]);

  const loadScreener = async (f: string) => {
    setLoading(true);
    try {
      const res = await screenerService.run(f);
      setStocks(res);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const activeTabMeta = FILTER_TABS.find(t => t.id === activeFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-slate-900 border border-amber-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Technical & Valuation Scanner
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          NSE Market Screener
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Scan and filter Indian equities by technical breakout setups, volume momentum, and fundamental value parameters across 12 NSE sectors.
        </p>

        {/* Filter Selection Tabs */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`p-3.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/50 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">{tab.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{tab.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {activeTabMeta?.label} ({stocks.length} candidates)
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            NSE Market Feed
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 mt-3">Scanning market candidates...</p>
          </div>
        ) : stocks.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No stocks matched this criteria in the current session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Symbol & Company</th>
                  <th className="px-3 py-3 text-right">Price (₹)</th>
                  <th className="px-3 py-3 text-right">Today Move</th>
                  <th className="px-4 py-3">Filter Criterion Match</th>
                  <th className="px-3 py-3 text-right">P/E</th>
                  <th className="px-3 py-3 text-right">52W Range</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stocks.map((item) => {
                  const sym = item.symbol.replace('.NS', '');
                  const cp = item.change_percent || 0.0;
                  return (
                    <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-sans">
                        <Link to={`/stock/${sym}`} className="font-bold text-white hover:text-amber-400 transition-colors">
                          {sym}
                        </Link>
                        <span className="block text-[11px] text-slate-400 font-normal truncate max-w-[180px]">
                          {item.shortName}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right font-bold text-white">
                        ₹{item.current_price?.toLocaleString('en-IN')}
                      </td>

                      <td className={`px-3 py-3 text-right font-bold ${
                        cp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {cp >= 0 ? `+${cp}%` : `${cp}%`}
                      </td>

                      <td className="px-4 py-3 font-sans text-amber-300/90 text-xs">
                        {item.criterion_note}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-300">
                        {item.pe_ratio ? `${item.pe_ratio}x` : 'N/A'}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-400 text-[11px]">
                        ₹{item['52_week_high']} / ₹{item['52_week_low']}
                      </td>

                      <td className="px-4 py-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <Link
                            to={`/stock/${sym}`}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                          >
                            Chart →
                          </Link>
                          <Link
                            to={`/valuation/${sym}`}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-md transition-colors"
                          >
                            DCF →
                          </Link>
                        </div>
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
  );
};
