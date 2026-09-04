import React, { useState, useEffect, useMemo } from 'react';
import { corporateActionsService } from '../services/api';
import {
  Sparkles,
  Tag,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Layers,
  Building2,
  PieChart,
  ArrowUpRight
} from 'lucide-react';

export const IPOTracker: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeBoard, setActiveBoard] = useState<'mainline' | 'sme'>('mainline');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchIPOs = async () => {
    setLoading(true);
    try {
      const res = await corporateActionsService.getIPOs();
      setData(res);
    } catch (err) {
      console.error("Failed to load IPOs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPOs();
  }, []);

  const currentList = useMemo(() => {
    if (!data) return [];
    return activeBoard === 'mainline' ? (data.mainline || []) : (data.sme || []);
  }, [data, activeBoard]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: currentList.length,
      'Open Now': 0,
      'Upcoming': 0,
      'Closed (Awaiting Allotment)': 0,
      'Listed': 0
    };
    currentList.forEach((ipo: any) => {
      if (counts[ipo.status] !== undefined) {
        counts[ipo.status]++;
      } else if (ipo.status?.includes('Closed')) {
        counts['Closed (Awaiting Allotment)']++;
      }
    });
    return counts;
  }, [currentList]);

  const filteredIPOs = useMemo(() => {
    return currentList.filter((ipo: any) => {
      // Status filter
      if (statusFilter !== 'all' && ipo.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (ipo.company_name || '').toLowerCase();
        const sym = (ipo.symbol || '').toLowerCase();
        return name.includes(q) || sym.includes(q);
      }
      return true;
    });
  }, [currentList, statusFilter, searchQuery]);

  const summary = data?.summary || {};

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">

      {/* Board Selector Tabs (Mainline vs SME) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">NSE & BSE IPO Boards</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Live September 2026 Feed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Active bidding & forthcoming issues filed on the National Stock Exchange & BSE
            </p>
          </div>
        </div>

        {/* Segment Toggles */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold gap-1 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => { setActiveBoard('mainline'); setStatusFilter('all'); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeBoard === 'mainline'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={15} />
            <span>Mainline IPOs</span>
            <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-mono">
              {summary.mainline_count || 0}
            </span>
          </button>

          <button
            onClick={() => { setActiveBoard('sme'); setStatusFilter('all'); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeBoard === 'sme'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={15} />
            <span>SME IPOs (Emerge)</span>
            <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-mono">
              {summary.sme_count || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Segment Identifier Banner */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs leading-relaxed ${
        activeBoard === 'mainline'
          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
          : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${activeBoard === 'mainline' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {activeBoard === 'mainline' ? <Building2 size={16} /> : <Sparkles size={16} />}
          </div>
          <div>
            <strong className="text-white text-sm font-bold block">
              {activeBoard === 'mainline' ? 'Mainline Public Issues' : 'SME Platform Issues (NSE Emerge / BSE SME)'}
            </strong>
            <span className="opacity-90">
              {activeBoard === 'mainline'
                ? 'Large & mid-cap equity offerings with standard retail lot ticket sizes (typically ~₹14,000 - ₹15,000) listed on the primary exchange.'
                : 'High-growth small and medium enterprises with minimum application lot sizes mandated by SEBI at ₹1,00,000 to ₹1,40,000.'}
            </span>
          </div>
        </div>

        <button
          onClick={fetchIPOs}
          disabled={loading}
          className="shrink-0 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-400' : ''} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeBoard === 'mainline' ? 'Mainline' : 'SME'} IPOs...`}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-mono font-medium bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold gap-1 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'Open Now', label: 'Open Now', isLive: true },
            { id: 'Upcoming', label: 'Upcoming' },
            { id: 'Closed (Awaiting Allotment)', label: 'Closed / Allotment' },
            { id: 'Listed', label: 'Recently Listed (Aug 2026)' },
          ].map((tab) => {
            const count = statusCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.isLive && count > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  statusFilter === tab.id ? 'bg-black/40 text-emerald-400 font-bold' : 'bg-slate-900 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* IPO Cards Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <RefreshCw size={24} className="animate-spin text-emerald-400" />
          <span className="text-sm">Fetching live Mainline and SME public issues...</span>
        </div>
      ) : filteredIPOs.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Info size={32} className="mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No {activeBoard.toUpperCase()} IPOs match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredIPOs.map((ipo: any) => {
            const isExpanded = expandedId === ipo.id;
            const isListed = ipo.status === 'Listed';
            const isOpen = ipo.status === 'Open Now';

            return (
              <div
                key={ipo.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 shadow-md transition-all overflow-hidden flex flex-col justify-between hover-lift"
              >
                <div className="p-5 space-y-4">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                          ipo.category === 'Mainline'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {ipo.category}
                        </span>
                        {ipo.symbol && (
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {ipo.symbol}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-1.5 leading-snug">
                        {ipo.company_name}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 flex items-center gap-1.5 ${
                      isOpen
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 animate-pulse'
                        : isListed
                        ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                        : ipo.status.includes('Closed')
                        ? 'bg-purple-950/80 text-purple-300 border-purple-700'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isOpen ? 'bg-emerald-400' : isListed ? 'bg-blue-400' : 'bg-slate-400'
                      }`}></span>
                      {ipo.status}
                    </span>
                  </div>

                  {/* Core Metrics 4-Column Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">Price Band</span>
                      <span className="text-sm font-bold text-white mt-0.5 block truncate">
                        {ipo.price_band}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">Lot Size</span>
                      <span className="text-sm font-bold text-white mt-0.5 block truncate">
                        {ipo.lot_size ? `${ipo.lot_size} shares` : 'TBD'}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">Issue Size</span>
                      <span className="text-sm font-bold text-emerald-400 mt-0.5 block truncate">
                        {ipo.issue_size_cr ? `₹${ipo.issue_size_cr.toLocaleString('en-IN')} Cr` : 'TBD'}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">Min Retail Lot</span>
                      <span className="text-sm font-bold text-slate-200 mt-0.5 block truncate">
                        {ipo.min_investment || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Key Dates Timeline */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Issue Open</span>
                      <span className="font-mono text-slate-200 font-medium">{ipo.open_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Issue Close</span>
                      <span className="font-mono text-slate-200 font-medium">{ipo.close_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Allotment</span>
                      <span className="font-mono text-slate-200 font-medium">{ipo.allotment_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Listing Date</span>
                      <span className="font-mono text-emerald-300 font-bold">{ipo.listing_date}</span>
                    </div>
                  </div>

                  {/* Subscription & Fresh vs OFS split */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Subscription:</span>
                      <span className="font-mono font-extrabold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {ipo.subscription?.overall || 'Awaiting'}
                      </span>
                      {ipo.subscription?.qib !== '—' && ipo.subscription?.qib !== 'Active' && (
                        <span className="text-[10px] text-slate-500">
                          (QIB: {ipo.subscription?.qib}, Retail: {ipo.subscription?.retail})
                        </span>
                      )}
                    </div>

                    {(ipo.fresh_issue_cr > 0 || ipo.ofs_cr > 0) && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        <span>Fresh: ₹{ipo.fresh_issue_cr} Cr</span>
                        {ipo.ofs_cr > 0 && <span> • OFS: ₹{ipo.ofs_cr} Cr</span>}
                      </div>
                    )}
                  </div>

                  {/* Prominent GMP Section */}
                  {ipo.gmp && (
                    <div className="p-3.5 rounded-xl border border-indigo-900/60 bg-indigo-950/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag size={14} className="text-indigo-400" />
                          <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                            Grey Market Premium (GMP)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-emerald-400">
                            +₹{ipo.gmp.gmp_inr}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                            +{ipo.gmp.implied_listing_gain_pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Post-Listing Performance Section (For Already-Listed IPOs) */}
                  {isListed && ipo.listing_performance && (
                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        Post-Listing Exchange Performance
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                        <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">Listing Day Open</span>
                          <span className="font-bold text-white">₹{ipo.listing_performance.listing_price}</span>
                        </div>
                        <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">Listing Day Gain</span>
                          <span className={`font-bold flex items-center gap-0.5 ${
                            ipo.listing_performance.listing_gain_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {ipo.listing_performance.listing_gain_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {ipo.listing_performance.listing_gain_pct > 0 ? '+' : ''}{ipo.listing_performance.listing_gain_pct}%
                          </span>
                        </div>
                        <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">Current Price</span>
                          <span className="font-bold text-white">₹{ipo.listing_performance.current_price}</span>
                        </div>
                        <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">Return Since IPO</span>
                          <span className={`font-bold flex items-center gap-0.5 ${
                            ipo.listing_performance.current_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {ipo.listing_performance.current_return_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {ipo.listing_performance.current_return_pct > 0 ? '+' : ''}{ipo.listing_performance.current_return_pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expandable Prospectus Financials & About */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
                      
                      {/* Financials Table */}
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
                          <PieChart size={13} className="text-emerald-400" />
                          Prospectus Financial Snapshot (SEBI RHP)
                        </span>

                        {ipo.financials && ipo.financials.length > 0 ? (
                          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80">
                            <table className="w-full text-xs text-left font-mono">
                              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                                <tr>
                                  <th className="py-2 px-3">Period</th>
                                  <th className="py-2 px-3">Revenue (₹ Cr)</th>
                                  <th className="py-2 px-3">Net Profit / PAT (₹ Cr)</th>
                                  <th className="py-2 px-3">YoY PAT Growth</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {ipo.financials.map((fin: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-900/40">
                                    <td className="py-2 px-3 text-white font-bold">{fin.year}</td>
                                    <td className="py-2 px-3 text-slate-200">₹{fin.revenue_cr.toLocaleString('en-IN')} Cr</td>
                                    <td className="py-2 px-3 text-emerald-300">₹{fin.pat_cr.toLocaleString('en-IN')} Cr</td>
                                    <td className="py-2 px-3 font-semibold text-indigo-300">{fin.yoy_pat_growth}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 italic">
                            Detailed financials not available from preliminary exchange filing.
                          </div>
                        )}
                      </div>

                      {/* About Business */}
                      {ipo.about && (
                        <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                          <strong className="text-slate-300 block mb-0.5">Business Overview:</strong>
                          {ipo.about}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(ipo.id)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Financial Details & RHP'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isListed && ipo.symbol && (
                    <a
                      href={`/stock/${ipo.symbol}`}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Analyze Stock</span>
                      <ArrowUpRight size={13} />
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Compliance Footer Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-400 leading-relaxed">
        <p>
          <strong className="text-slate-300">Compliance & Regulatory Disclaimer:</strong> This IPO Tracker is provided solely for informational and research purposes. It does not constitute investment advice, endorsement, or a recommendation to subscribe to or avoid any public issue. Grey market premiums are completely unregulated and informal. Please review the official Red Herring Prospectus (RHP) filed with SEBI before making any investment decisions.
        </p>
      </div>

    </div>
  );
};

export default IPOTracker;
