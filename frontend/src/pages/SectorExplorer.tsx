import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketService } from '../services/api';
import {
  Briefcase,
  Monitor,
  Shield,
  Car,
  Pill,
  ShoppingBag,
  Zap,
  Hammer,
  Building,
  Radio,
  Landmark,
  Home,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Search,
  ArrowUpDown
} from 'lucide-react';

const SECTOR_METADATA = [
  {
    id: 'banking',
    name: 'Banking & Financial Services',
    icon: Briefcase,
    description: 'India’s leading private & public sector banks, NBFCs, and financial institutions.',
    tickers: [
      'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
      'INDUSINDBK.NS', 'BANKBARODA.NS', 'PNB.NS', 'FEDERALBNK.NS', 'IDFCFIRSTB.NS',
      'BAJFINANCE.NS', 'BAJAJFINSV.NS'
    ]
  },
  {
    id: 'it',
    name: 'IT & Technology',
    icon: Monitor,
    description: 'Global tech consultants, SaaS pioneers, and software engineering giants.',
    tickers: [
      'TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS',
      'LTIM.NS', 'PERSISTENT.NS', 'COFORGE.NS', 'MPHASIS.NS', 'LTTS.NS'
    ]
  },
  {
    id: 'defense',
    name: 'Defense & Aerospace',
    icon: Shield,
    description: 'Aerospace manufacturing, naval shipyards, defense electronics, and ammunition.',
    tickers: [
      'HAL.NS', 'BEL.NS', 'BEML.NS', 'MAZDOCK.NS', 'BDL.NS',
      'COCHINSHIP.NS', 'DATAPATTNS.NS', 'PARAS.NS', 'MTARTECH.NS', 'SOLARINDS.NS'
    ]
  },
  {
    id: 'auto',
    name: 'Auto & Auto Components',
    icon: Car,
    description: 'Passenger vehicle makers, commercial trucks, 2-wheelers, and precision component suppliers.',
    tickers: [
      'MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS',
      'HEROMOTOCO.NS', 'TVSMOTOR.NS', 'BHARATFORG.NS', 'ASHOKLEY.NS', 'BOSCHLTD.NS'
    ]
  },
  {
    id: 'pharma',
    name: 'Pharma & Healthcare',
    icon: Pill,
    description: 'Formulations, API exporters, hospitals, and domestic diagnostics leaders.',
    tickers: [
      'SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'APOLLOHOSP.NS',
      'LUPIN.NS', 'AUROPHARMA.NS', 'TORNTPHARM.NS', 'MANKIND.NS', 'ZYDUSLIFE.NS'
    ]
  },
  {
    id: 'fmcg',
    name: 'FMCG (Consumer Goods)',
    icon: ShoppingBag,
    description: 'Essential everyday foods, beverages, homecare, and personal hygiene leaders.',
    tickers: [
      'HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS',
      'GODREJCP.NS', 'MARICO.NS', 'TATACONSUM.NS', 'COLPAL.NS', 'VBL.NS'
    ]
  },
  {
    id: 'energy',
    name: 'Energy & Oil/Gas',
    icon: Zap,
    description: 'Refineries, power generators, green energy innovators, and gas utilities.',
    tickers: [
      'RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'BPCL.NS',
      'IOC.NS', 'GAIL.NS', 'TATAPOWER.NS', 'ADANIGREEN.NS', 'OIL.NS'
    ]
  },
  {
    id: 'metals',
    name: 'Metals & Mining',
    icon: Hammer,
    description: 'Steel producers, aluminum smelters, mineral extractors, and tube manufacturers.',
    tickers: [
      'TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'VEDL.NS', 'COALINDIA.NS',
      'JINDALSTEL.NS', 'NMDC.NS', 'NATIONALUM.NS', 'SAIL.NS', 'APLAPOLLO.NS'
    ]
  },
  {
    id: 'infra',
    name: 'Infrastructure & Cement',
    icon: Building,
    description: 'Mega engineering contractors, highway developers, and cement manufacturers.',
    tickers: [
      'LT.NS', 'ULTRACEMCO.NS', 'GRASIM.NS', 'SHREECEM.NS', 'AMBUJACEM.NS',
      'ACC.NS', 'DALBHARAT.NS', 'GMRINFRA.NS', 'IRB.NS', 'NBCC.NS'
    ]
  },
  {
    id: 'telecom',
    name: 'Telecom & Connectivity',
    icon: Radio,
    description: 'Cellular network providers, optical telecom infrastructure, and optical gear developers.',
    tickers: [
      'BHARTIARTL.NS', 'IDEA.NS', 'TATACOMM.NS', 'INDUSTOWER.NS', 'HFCL.NS',
      'TEJASNET.NS', 'RAILTEL.NS'
    ]
  },
  {
    id: 'psu',
    name: 'PSU (Public Sector Enterprises)',
    icon: Landmark,
    description: 'Sovereign-backed public sector undertakings across banking, energy, and defense.',
    tickers: [
      'SBIN.NS', 'ONGC.NS', 'NTPC.NS', 'COALINDIA.NS', 'BPCL.NS',
      'IOC.NS', 'POWERGRID.NS', 'HAL.NS', 'BEL.NS', 'BANKBARODA.NS'
    ]
  },
  {
    id: 'realty',
    name: 'Realty & Real Estate',
    icon: Home,
    description: 'Residential township developers, commercial office realtors, and mall operators.',
    tickers: [
      'DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'PHOENIXLTD.NS', 'BRIGADE.NS',
      'PRESTIGE.NS', 'SOBHA.NS', 'LODHA.NS', 'SUNTECK.NS'
    ]
  }
];

const SectorExplorer: React.FC = () => {
  const [activeSector, setActiveSector] = useState(SECTOR_METADATA[0]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'price' | 'change'>('change');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSectorData = async () => {
      setLoading(true);
      setError(null);
      setSearchQuery('');

      try {
        const promises = activeSector.tickers.map(ticker =>
          marketService.getQuote(ticker).catch(() => null)
        );
        const results = await Promise.all(promises);

        if (isMounted) {
          setQuotes(results.filter(Boolean));
        }
      } catch (err) {
        console.error('Error fetching sector data:', err);
        if (isMounted) setError('Failed to load sector data. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSectorData();
    return () => { isMounted = false; };
  }, [activeSector]);

  // Filter & Sort
  const filteredQuotes = quotes.filter((q) => {
    const sym = (q.symbol || '').toLowerCase();
    const name = (q.shortName || '').toLowerCase();
    const term = searchQuery.toLowerCase();
    return sym.includes(term) || name.includes(term);
  });

  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (sortField === 'name') {
      return sortAsc
        ? (a.shortName || a.symbol).localeCompare(b.shortName || b.symbol)
        : (b.shortName || b.symbol).localeCompare(a.shortName || a.symbol);
    } else if (sortField === 'price') {
      valA = a.current_price || 0;
      valB = b.current_price || 0;
    } else {
      valA = a.change_percent || 0;
      valB = b.change_percent || 0;
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const avgChange = quotes.length > 0
    ? quotes.reduce((acc, q) => acc + (q.change_percent || 0), 0) / quotes.length
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 12 Official NSE Sector Baskets
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            NSE Sector Explorer
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Analyze recognizable constituents across India’s core economic sectors. Track industry strength and dive into individual stock technicals.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 self-start md:self-auto">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Selected Sector Average</span>
            <div className={`text-xl font-bold font-mono flex items-center gap-1 ${avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {avgChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Layout: Left Sidebar Sectors vs Right Constituents Table */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left: 12 Sectors Navigation Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-2">
          <div className="bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 overflow-hidden hover-lift">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">12 NSE Sectors</span>
              <span className="text-xs text-slate-500 font-semibold font-mono">{SECTOR_METADATA.length} Sectors</span>
            </div>

            <div className="divide-y divide-slate-800/70 max-h-[620px] overflow-y-auto">
              {SECTOR_METADATA.map((sector) => {
                const Icon = sector.icon;
                const isActive = activeSector.id === sector.id;

                return (
                  <button
                    key={sector.id}
                    onClick={() => setActiveSector(sector)}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left transition-all border-l-4 ${
                      isActive
                        ? 'border-emerald-400 bg-emerald-500/10 text-white font-semibold'
                        : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{sector.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{sector.tickers.length} Constituents</div>
                    </div>
                    {isActive && <ChevronRight size={16} className="text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Sector Constituents Table */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          <div className="bg-slate-900/90 p-6 rounded-2xl shadow-md border border-slate-800 hover-lift">

            {/* Sector Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <activeSector.icon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{activeSector.name}</h2>
                  <p className="text-xs text-slate-400">{activeSector.description}</p>
                </div>
              </div>

              {/* Search Within Sector */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter constituents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-slate-950"
                />
              </div>
            </div>

            {/* Content State */}
            {loading ? (
              <div className="space-y-3 py-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-800 animate-pulse rounded-xl"></div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-xl my-4">
                {error}
              </div>
            ) : sortedQuotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-xl my-4 border border-slate-800">
                No matching stocks found for "{searchQuery}".
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th
                        className="pb-3 cursor-pointer hover:text-white transition-colors"
                        onClick={() => { setSortField('name'); setSortAsc(!sortAsc); }}
                      >
                        <div className="flex items-center gap-1">Company <ArrowUpDown size={12} /></div>
                      </th>
                      <th
                        className="pb-3 text-right cursor-pointer hover:text-white transition-colors"
                        onClick={() => { setSortField('price'); setSortAsc(!sortAsc); }}
                      >
                        <div className="flex items-center justify-end gap-1">Price (₹) <ArrowUpDown size={12} /></div>
                      </th>
                      <th
                        className="pb-3 text-right cursor-pointer hover:text-white transition-colors"
                        onClick={() => { setSortField('change'); setSortAsc(!sortAsc); }}
                      >
                        <div className="flex items-center justify-end gap-1">Day Move <ArrowUpDown size={12} /></div>
                      </th>
                      <th className="pb-3 text-right">P/E</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {sortedQuotes.map((quote, idx) => {
                      const isUp = (quote.change || 0) >= 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/60 transition-colors group">
                          <td className="py-3.5">
                            <Link to={`/stock/${quote.symbol}`} className="block">
                              <div className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                                {quote.shortName || quote.symbol}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                {quote.symbol.replace('.NS', '')}
                              </div>
                            </Link>
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-white">
                            {quote.current_price ? `₹${quote.current_price.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-3.5 text-right">
                            <div className={`font-mono font-bold flex items-center justify-end gap-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              {isUp ? '+' : ''}{quote.change?.toFixed(2)} ({isUp ? '+' : ''}{quote.change_percent?.toFixed(2)}%)
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-mono text-slate-400 text-xs">
                            {quote.pe_ratio ? quote.pe_ratio.toFixed(1) : '—'}
                          </td>
                          <td className="py-3.5 text-right">
                            <Link
                              to={`/stock/${quote.symbol}`}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-slate-700 hover:border-emerald-500/30"
                            >
                              Chart <ChevronRight size={14} />
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

      </div>

    </div>
  );
};

export default SectorExplorer;