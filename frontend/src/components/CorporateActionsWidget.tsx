import React, { useState, useEffect } from 'react';
import { corporateActionsService } from '../services/api';
import {
  Coins,
  RefreshCw,
  Info,
  Calendar,
  Tag,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

interface CorporateActionsWidgetProps {
  ticker: string;
}

export const CorporateActionsWidget: React.FC<CorporateActionsWidgetProps> = ({ ticker }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dividends' | 'buybacks'>('dividends');
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchActions = async () => {
      if (!ticker) return;
      setLoading(true);
      try {
        const res = await corporateActionsService.getStockActions(ticker);
        if (isMounted) setData(res);
      } catch (err) {
        console.error("Failed to load corporate actions:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActions();
    return () => { isMounted = false; };
  }, [ticker]);

  const dividends = data?.dividends || [];
  const buybacks = data?.buybacks || [];

  return (
    <div className="bg-slate-900/90 p-6 rounded-2xl shadow-md border border-slate-800 hover-lift space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Coins size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Corporate Actions Tracker</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                Direct NSE Feed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified dividends and buyback disclosures for {ticker.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Tab Selector & Explainer Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
              showExplainer 
                ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/50' 
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Understanding Ex-Date vs Record Date"
          >
            <HelpCircle size={14} />
            <span className="hidden md:inline">Date Guide</span>
          </button>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dividends')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'dividends'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dividends ({dividends.length})
            </button>
            <button
              onClick={() => setActiveTab('buybacks')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'buybacks'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buybacks ({buybacks.length})
            </button>
          </div>
        </div>
      </div>

      {/* Educational Explainer Banner */}
      <div className={`p-4 rounded-xl border transition-all ${
        showExplainer
          ? 'bg-indigo-950/40 border-indigo-800/70 text-indigo-200'
          : 'bg-slate-950/50 border-slate-800/60 text-slate-400 text-xs'
      }`}>
        <div className="flex items-start gap-2.5">
          <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p>
              <strong className="text-white font-semibold">Ex-dividend date:</strong> Usually the date the stock's market price adjusts downward by the dividend amount. Buying on or after this date means you will <strong className="text-rose-400 underline">not</strong> receive the dividend.
            </p>
            <p>
              <strong className="text-white font-semibold">Record date:</strong> The official cutoff date on which you must already be recorded in the company's registrar as a shareholder to be eligible.
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
          <RefreshCw size={20} className="animate-spin text-emerald-400" />
          <span>Fetching official NSE corporate actions...</span>
        </div>
      ) : !data || (!data.has_data && dividends.length === 0 && buybacks.length === 0) ? (
        /* Graceful Empty State */
        <div className="py-8 px-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
          <AlertCircle size={28} className="mx-auto text-slate-600" />
          <p className="text-sm font-bold text-slate-300">No recent corporate action data available</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No active dividend declarations or buyback windows were published on the National Stock Exchange for {ticker.toUpperCase()} within the current reporting cycle.
          </p>
        </div>
      ) : activeTab === 'dividends' ? (
        /* DIVIDENDS TABLE */
        dividends.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
            No dividend payouts recorded for {ticker.toUpperCase()} on NSE.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">Dividend Type</th>
                  <th className="py-3 px-4 font-bold">Amount / Share</th>
                  <th className="py-3 px-4 font-bold">
                    <span className="text-emerald-400">Ex-Dividend Date</span>
                  </th>
                  <th className="py-3 px-4 font-bold">Record Date</th>
                  <th className="py-3 px-4 font-bold">Announced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {dividends.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        item.dividend_type === 'Special'
                          ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                          : item.dividend_type === 'Interim'
                          ? 'bg-blue-950/70 text-blue-300 border-blue-800'
                          : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                      }`}>
                        <Tag size={10} />
                        {item.dividend_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-extrabold text-white">
                        {item.amount_formatted}
                      </span>
                      {item.amount_breakdown && (
                        <span className="text-[10px] text-slate-400 block font-sans">
                          (Special + Regular)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <Calendar size={13} className="text-emerald-400" />
                        <span>{item.ex_date}</span>
                        {item.is_upcoming && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-sans">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.record_date}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.announcement_date !== '-' ? item.announcement_date : 'Filed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* BUYBACKS TABLE */
        buybacks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
            No buyback offers filed for {ticker.toUpperCase()} on NSE.
          </div>
        ) : (
          <div className="space-y-3">
            {buybacks.map((bb: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 bg-blue-950/60 border border-blue-800/80 rounded-md">
                      {bb.method}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{bb.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      bb.status === 'Active'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {bb.status}
                    </span>
                  </div>
                </div>

                {/* 4-Metric Buyback Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Buyback Price</span>
                    <span className="text-sm font-black font-mono text-white mt-0.5 block">
                      {bb.buyback_price_formatted}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Issue Size</span>
                    <span className="text-sm font-black font-mono text-emerald-400 mt-0.5 block">
                      {bb.buyback_size_formatted}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Record Cutoff Date</span>
                    <span className="text-sm font-semibold font-mono text-slate-200 mt-0.5 block">
                      {bb.record_date}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tender Window</span>
                    <span className="text-xs font-semibold font-mono text-indigo-300 mt-0.5 block flex items-center gap-1">
                      <Clock size={12} />
                      {bb.tender_window}
                    </span>
                  </div>
                </div>

                {bb.details && (
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {bb.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
};

export default CorporateActionsWidget;
