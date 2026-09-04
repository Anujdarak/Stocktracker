import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { corporateActionsService } from '../services/api';
import { IPOTracker } from '../components/IPOTracker';
import {
  Calendar,
  Coins,
  Search,
  RefreshCw,
  Info,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Gift,
  HelpCircle,
  Tag,
  AlertCircle,
  Rocket
} from 'lucide-react';

export const CorporateActionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'ipo' ? 'ipo' : 'actions';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dividend' | 'buyback'>('all');
  const [showExplainer, setShowExplainer] = useState(true);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await corporateActionsService.getUpcomingActions();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch corporate actions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const allItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items;
  }, [data]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item: any) => {
      // Type filter
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sym = (item.symbol || '').toLowerCase();
        const comp = (item.company || '').toLowerCase();
        const sub = (item.subject || '').toLowerCase();
        return sym.includes(q) || comp.includes(q) || sub.includes(q);
      }
      return true;
    });
  }, [allItems, filterType, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      
      {/* Top Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'actions'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Coins size={16} />
            <span>Dividends & Buybacks</span>
            {data?.total_count ? (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'actions' ? 'bg-black/20 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                {data.total_count}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'ipo' })}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'ipo'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Rocket size={16} className={activeTab === 'ipo' ? 'text-white' : 'text-indigo-400'} />
            <span>IPO Tracker (Mainline & SME)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              activeTab === 'ipo' ? 'bg-indigo-700/80 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              Live GMP
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-2 hidden sm:block">
          Official Exchange Filings & Analytics
        </div>
      </div>

      {activeTab === 'ipo' ? (
        <IPOTracker />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
              <Sparkles size={12} />
              National Stock Exchange Data
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Corporate Actions Tracker
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Live official calendar of upcoming ex-dividend dates, cash payouts, and share buybacks filed directly on the NSE.
          </p>
        </div>

        <button
          onClick={fetchActions}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto shadow-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
          <span>Refresh NSE Feed</span>
        </button>
      </div>

      {/* Top 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 hover-lift flex flex-col justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-400">Total Upcoming Actions</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white">
              {data?.total_count || 0}
            </span>
            <Calendar size={18} className="text-slate-600" />
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 hover-lift flex flex-col justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-400">Upcoming Dividends</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {data?.upcoming_dividends_count || 0}
            </span>
            <Coins size={18} className="text-emerald-500/60" />
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 hover-lift flex flex-col justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-400">Highest Dividend Payout</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-purple-300">
              {data?.highest_dividend_formatted || '—'}
            </span>
            <Gift size={18} className="text-purple-400/60" />
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 hover-lift flex flex-col justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-400">Buyback Windows</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-blue-400">
              {data?.upcoming_buybacks_count || 0}
            </span>
            <Tag size={18} className="text-blue-500/60" />
          </div>
        </div>
      </div>

      {/* Date Guide & Educational Banner */}
      <div className={`p-4 rounded-xl border transition-all ${
        showExplainer
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-slate-950/40 border-slate-800/60'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 mt-0.5">
              <Info size={16} />
            </div>
            <div className="text-xs leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Crucial Distinction: Ex-Date vs Record Date
                </span>
              </div>
              <p className="text-slate-300">
                <strong className="text-emerald-400 font-semibold">Ex-dividend date:</strong> Usually the date the stock price adjusts down to reflect the dividend being paid out — <span className="text-rose-400 font-bold underline">buying on or after this date means you won't receive that dividend</span>.
              </p>
              <p className="text-slate-400">
                <strong className="text-slate-200 font-semibold">Record date:</strong> The cutoff date established by the exchange and company registrar where you must already be an existing shareholder of record.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
        
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock symbol e.g. COALINDIA, TCS..."
            className="w-full pl-9 pr-3.5 py-2 text-xs font-mono font-medium bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md transition-all ${
              filterType === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({allItems.length})
          </button>
          <button
            onClick={() => setFilterType('dividend')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md transition-all ${
              filterType === 'dividend'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dividends ({data?.upcoming_dividends_count || 0})
          </button>
          <button
            onClick={() => setFilterType('buyback')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md transition-all ${
              filterType === 'buyback'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Buybacks ({data?.upcoming_buybacks_count || 0})
          </button>
        </div>
      </div>

      {/* Main Calendar / Action List Table */}
      <div className="bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 overflow-hidden hover-lift">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-emerald-400" />
            <span className="text-sm">Retrieving real-time corporate announcements from NSE...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <AlertCircle size={32} className="mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No corporate actions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching dividends or buybacks match your current search query or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">Company / Ticker</th>
                  <th className="py-3 px-4 font-bold">Action Type</th>
                  <th className="py-3 px-4 font-bold">Details / Amount</th>
                  <th className="py-3 px-4 font-bold">
                    <span className="text-emerald-400">Ex-Date / Tender Window</span>
                  </th>
                  <th className="py-3 px-4 font-bold">Record Date</th>
                  <th className="py-3 px-4 font-bold text-right">Stock Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredItems.map((item: any, idx: number) => {
                  const isDividend = item.type === 'dividend';
                  const isBuyback = item.type === 'buyback';

                  return (
                    <tr key={idx} className="hover:bg-slate-950/60 transition-colors">
                      
                      {/* Company & Ticker */}
                      <td className="py-3 px-4">
                        <div className="font-sans">
                          <Link
                            to={`/stock/${item.symbol}`}
                            className="font-bold text-sm text-white hover:text-emerald-400 flex items-center gap-1 transition-colors"
                          >
                            <span>{item.symbol}</span>
                            <ArrowUpRight size={13} className="text-slate-500" />
                          </Link>
                          <span className="text-slate-400 text-xs truncate max-w-[220px] block mt-0.5">
                            {item.company}
                          </span>
                        </div>
                      </td>

                      {/* Action Type Badge */}
                      <td className="py-3 px-4 font-sans">
                        {isDividend ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            item.dividend_type === 'Special'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : item.dividend_type === 'Interim'
                              ? 'bg-blue-950 text-blue-300 border-blue-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}>
                            <Coins size={11} />
                            {item.dividend_type} Dividend
                          </span>
                        ) : isBuyback ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            <Tag size={11} />
                            Buyback ({item.method})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-slate-300 border border-slate-800">
                            Corporate Action
                          </span>
                        )}
                      </td>

                      {/* Details / Amount */}
                      <td className="py-3 px-4">
                        {isDividend ? (
                          <div>
                            <span className="text-sm font-extrabold text-white block">
                              {item.amount_formatted}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              per equity share
                            </span>
                          </div>
                        ) : isBuyback ? (
                          <div>
                            <span className="text-sm font-extrabold text-white block">
                              {item.buyback_price_formatted}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-sans">
                              Size: {item.buyback_size_formatted}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 font-sans line-clamp-1">
                            {item.subject}
                          </span>
                        )}
                      </td>

                      {/* Ex-Date / Window */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <Calendar size={13} className="text-emerald-400 shrink-0" />
                          <span>{item.ex_date !== '-' ? item.ex_date : (item.tender_window || '-')}</span>
                          {item.is_upcoming && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-sans">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Record Date */}
                      <td className="py-3 px-4 text-slate-300">
                        {item.record_date}
                      </td>

                      {/* Link to Stock */}
                      <td className="py-3 px-4 text-right font-sans">
                        <Link
                          to={`/stock/${item.symbol}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/50 transition-all font-semibold text-xs"
                        >
                          <span>Analyze</span>
                          <ChevronRight size={13} />
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
        </>
      )}

    </div>
  );
};

export default CorporateActionsPage;
