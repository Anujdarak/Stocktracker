import React, { useEffect, useState } from 'react';
import { marketService } from '../services/api';
import { Activity, Info, ArrowLeftRight, Waves } from 'lucide-react';

interface VixData {
  vix: number;
  vix_30d_avg: number;
  vix_level: 'low' | 'moderate' | 'high';
  trading_condition: 'calm' | 'normal' | 'volatile';
  condition_badge: string;
  nifty_level: number;
  expected_daily_move_pct: number;
  expected_range_points: number;
  lower_bound: number;
  upper_bound: number;
  expected_weekly_move_pct: number;
  weekly_range_points: number;
  context_line: string;
  explanation: string;
  disclaimer: string;
}

export const VolatilityOutlookWidget: React.FC = () => {
  const [data, setData] = useState<VixData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchVix = async () => {
      try {
        const res = await marketService.getVixOutlook();
        if (isMounted && res) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load VIX outlook", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchVix();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 animate-pulse">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          <Activity className="w-4 h-4 text-purple-400 animate-spin" />
          Calculating India VIX Expected Range...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const badgeColor =
    data.vix_level === 'low'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : data.vix_level === 'high'
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-md transition-all space-y-5">
      {/* Header with Title & VIX Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Market Volatility Outlook
              </h2>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                India VIX: {data.vix}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Statistically expected next-session trading range for Nifty 50
            </p>
          </div>
        </div>

        {/* Dynamic Condition Badge */}
        <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto ${badgeColor}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
          <span>{data.condition_badge}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium">India VIX</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-extrabold font-mono text-white">{data.vix}</span>
            <span className="text-[10px] text-slate-500 font-mono">30d: {data.vix_30d_avg}</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium">Nifty 50 Level</span>
          <span className="text-lg font-extrabold font-mono text-white mt-0.5 block">
            {data.nifty_level.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium">Expected Daily Move</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-extrabold font-mono text-purple-300">±{data.expected_daily_move_pct}%</span>
            <span className="text-[10px] text-slate-400 font-mono">±{data.expected_range_points} pts</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium">Expected Weekly Move</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-extrabold font-mono text-indigo-300">±{data.expected_weekly_move_pct}%</span>
            <span className="text-[10px] text-slate-400 font-mono">±{data.weekly_range_points} pts</span>
          </div>
        </div>
      </div>

      {/* Visual Range Gauge */}
      <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
            Next Session Statistical Range (VIX / √252)
          </span>
          <span className="text-slate-400 font-mono">
            Band Width: <strong className="text-white">{(data.expected_range_points * 2).toFixed(1)} pts</strong>
          </span>
        </div>

        {/* Range Bar Graphic */}
        <div className="space-y-2">
          <div className="relative pt-6 pb-2">
            {/* Visual Span Track */}
            <div className="h-3 w-full bg-slate-800 rounded-full relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-emerald-500/40 via-purple-500/50 to-emerald-500/40 rounded-full"></div>
            </div>

            {/* Center Line Marker (Current Nifty) */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-[10px] font-mono text-purple-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-purple-500/40 whitespace-nowrap">
                Current: {data.nifty_level.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
              <div className="w-0.5 h-full bg-purple-400 mt-0.5"></div>
            </div>
          </div>

          {/* Bound Callouts */}
          <div className="flex justify-between items-center text-xs font-mono">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Lower Boundary (-{data.expected_daily_move_pct}%)</span>
              <span className="text-sm font-bold text-slate-200">
                {data.lower_bound.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
            </div>

            <div className="text-center px-3 py-1 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-sans">
              <span className="text-purple-400 font-semibold font-mono">±{data.expected_range_points} pts</span> expected movement
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Upper Boundary (+{data.expected_daily_move_pct}%)</span>
              <span className="text-sm font-bold text-slate-200">
                {data.upper_bound.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Plain Language Interpretation & Context */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-slate-200 leading-relaxed font-medium">
              {data.explanation}
            </p>
            <p className="text-slate-400 leading-relaxed">
              💡 {data.context_line}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
