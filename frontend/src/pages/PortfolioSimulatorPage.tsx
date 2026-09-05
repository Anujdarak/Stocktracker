import React, { useState, useEffect } from 'react';
import { portfolioService, llmService, searchService } from '../services/api';
import {
  PieChart,
  Sparkles,
  Bot,
  Plus,
  Trash2,
  AlertTriangle,
  Flame,
  Clock
} from 'lucide-react';

export const PortfolioSimulatorPage: React.FC = () => {
  const [samples, setSamples] = useState<Record<string, any>>({});
  const [holdings, setHoldings] = useState<Array<{ ticker: string; quantity: number }>>([
    { ticker: 'ITC', quantity: 500 },
    { ticker: 'INFY', quantity: 50 },
    { ticker: 'TCS', quantity: 25 },
    { ticker: 'PAYTM', quantity: 100 }
  ]);

  // Input states for adding new holding
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [inputQty, setInputQty] = useState<number>(10);

  // Simulation Data
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // AI Diagnostic
  const [aiProvider, setAiProvider] = useState<'deepseek' | 'gemini'>('deepseek');
  const [aiDiagnostic, setAiDiagnostic] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load sample presets
  useEffect(() => {
    const fetchSamples = async () => {
      const data = await portfolioService.getSamples();
      setSamples(data);
    };
    fetchSamples();
  }, []);

  // Search autocomplete
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchService.search(searchQuery);
        setSearchResults(results.slice(0, 5));
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Run simulation whenever holdings change
  useEffect(() => {
    if (holdings.length === 0) {
      setPortfolioData(null);
      return;
    }
    runSimulation(holdings);
  }, [holdings]);

  const runSimulation = async (currentHoldings: Array<{ ticker: string; quantity: number }>) => {
    setLoading(true);
    try {
      const res = await portfolioService.simulate(currentHoldings);
      setPortfolioData(res);
      // Auto-trigger AI diagnostic
      if (res && res.total_value > 0) {
        loadAiDiagnostic(res);
      }
    } catch (e) {
      console.error("Simulation error", e);
    } finally {
      setLoading(false);
    }
  };

  const loadAiDiagnostic = async (data: any) => {
    setAiLoading(true);
    try {
      const diag = await llmService.getPortfolioDiagnostic(data, aiProvider);
      setAiDiagnostic(diag);
    } catch {
      setAiDiagnostic(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddHolding = () => {
    const sym = selectedTicker || searchQuery.trim().toUpperCase();
    if (!sym || inputQty <= 0) return;

    // Check if already in holdings
    const existingIdx = holdings.findIndex(h => h.ticker === sym);
    if (existingIdx >= 0) {
      const updated = [...holdings];
      updated[existingIdx].quantity += inputQty;
      setHoldings(updated);
    } else {
      setHoldings([...holdings, { ticker: sym, quantity: inputQty }]);
    }

    setSelectedTicker('');
    setSearchQuery('');
    setInputQty(10);
  };

  const handleRemoveHolding = (sym: string) => {
    setHoldings(holdings.filter(h => h.ticker !== sym));
  };

  const loadPreset = (presetKey: string) => {
    const preset = samples[presetKey];
    if (preset && preset.holdings) {
      setHoldings(preset.holdings);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Portfolio Health Check & Macro Stress-Test
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Evaluate your stock holdings for sector concentration vulnerabilities, calculate weighted portfolio beta against Nifty 50, and simulate the exact portfolio drawdown under real-world Indian macro shocks.
        </p>

        {/* Preset Selector */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          {Object.entries(samples).map(([key, item]: [string, any]) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Holdings & Add Stock (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Stock Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Add Stock to Simulation Basket
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7 relative">
                <label className="block text-xs font-medium text-slate-400 mb-1">Stock Ticker (NSE)</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedTicker('');
                  }}
                  placeholder="e.g. RELIANCE, TITAN, HAL..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden divide-y divide-slate-800">
                    {searchResults.map((r) => (
                      <button
                        key={r.symbol}
                        onClick={() => {
                          setSelectedTicker(r.symbol);
                          setSearchQuery(`${r.symbol} - ${r.name}`);
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex justify-between items-center"
                      >
                        <span className="font-semibold text-white">{r.symbol}</span>
                        <span className="text-slate-400 truncate max-w-[160px]">{r.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Shares Qty</label>
                <input
                  type="number"
                  min="1"
                  value={inputQty}
                  onChange={(e) => setInputQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  onClick={handleAddHolding}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">Current Basket Holdings</span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  {holdings.length} stocks
                </span>
              </div>
              {portfolioData && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Total Value:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{portfolioData.total_value?.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-3 py-3">Sector</th>
                    <th className="px-3 py-3 text-right">Shares</th>
                    <th className="px-3 py-3 text-right">Price (₹)</th>
                    <th className="px-3 py-3 text-right">Value (₹)</th>
                    <th className="px-3 py-3 text-right">Weight</th>
                    <th className="px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {portfolioData?.holdings?.map((h: any) => (
                    <tr key={h.ticker} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        {h.ticker}
                        <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[120px]">{h.name}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{h.sector_name}</td>
                      <td className="px-3 py-3 text-right font-mono text-slate-200">{h.quantity}</td>
                      <td className="px-3 py-3 text-right font-mono text-white">₹{h.current_price?.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-white">₹{h.total_value?.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-3 text-right font-mono text-blue-400 font-semibold">{h.weight_percent}%</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleRemoveHolding(h.ticker)}
                          className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                          title="Remove holding"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sector Concentration Bar Breakdown */}
          {portfolioData?.sector_allocation && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-400" />
                  Sector Concentration Breakdown
                </h3>
                <span className="text-xs text-slate-400">
                  {portfolioData.sector_allocation.length} sectors represented
                </span>
              </div>

              {/* Concentration Warnings */}
              {portfolioData.concentration_warnings?.length > 0 && (
                <div className="space-y-2">
                  {portfolioData.concentration_warnings.map((w: string, i: number) => (
                    <div key={i} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sector Bars */}
              <div className="space-y-3 pt-2">
                {portfolioData.sector_allocation.map((sec: any) => (
                  <div key={sec.sector_id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{sec.sector_name} ({sec.stock_count} stocks)</span>
                      <span className="font-mono text-white font-semibold">{sec.weight_percent}% (₹{sec.value.toLocaleString('en-IN')})</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sec.weight_percent > 40
                            ? 'bg-amber-500'
                            : sec.weight_percent > 25
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, sec.weight_percent)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Macro Stress-Test Cards & AI Diagnostic (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Macro Stress-Test Simulations */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold uppercase mb-1.5">
                <Flame className="w-3 h-3" />
                Macro Shocks
              </div>
              <h3 className="text-lg font-bold text-white">Stress-Test Simulations</h3>
              <p className="text-xs text-slate-400">Simulated portfolio drawdown under historic macro events</p>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Running stress models...</div>
            ) : portfolioData?.stress_tests ? (
              <div className="space-y-3">
                {portfolioData.stress_tests.map((sc: any) => (
                  <div key={sc.scenario_id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-white block">{sc.title}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">{sc.description}</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-mono font-bold shrink-0 ${
                        sc.estimated_impact_percent >= 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {sc.estimated_impact_percent >= 0 ? `+${sc.estimated_impact_percent}%` : `${sc.estimated_impact_percent}%`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-900 text-slate-400 font-mono">
                      <span>Simulated Value Change:</span>
                      <span className={sc.estimated_value_change >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {sc.estimated_value_change >= 0 ? `+₹${sc.estimated_value_change.toLocaleString('en-IN')}` : `-₹${Math.abs(sc.estimated_value_change).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* AI Educational Diagnostic Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Health Diagnostic</h3>
                  <p className="text-[11px] text-slate-400">Educational risk & diversification summary</p>
                </div>
              </div>

              {/* Provider Selector */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                <button
                  onClick={() => {
                    setAiProvider('deepseek');
                    if (portfolioData) loadAiDiagnostic(portfolioData);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    aiProvider === 'deepseek' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  DeepSeek
                </button>
                <button
                  onClick={() => {
                    setAiProvider('gemini');
                    if (portfolioData) loadAiDiagnostic(portfolioData);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    aiProvider === 'gemini' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Gemini
                </button>
              </div>
            </div>

            {aiLoading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400 mt-2">Evaluating portfolio diversification...</p>
              </div>
            ) : aiDiagnostic ? (
              <div className="space-y-3.5 text-xs">
                {/* Diversification Grade */}
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-semibold">Diversification Grade:</span>
                  <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-sm ${
                    aiDiagnostic.diversification_grade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                    aiDiagnostic.diversification_grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                    aiDiagnostic.diversification_grade === 'C' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    Grade {aiDiagnostic.diversification_grade}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Health Overview:</span>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    {aiDiagnostic.plain_language_health_summary}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Top Vulnerability:</span>
                  <p className="text-amber-300/90 leading-relaxed bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    ⚠️ {aiDiagnostic.top_vulnerability}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Educational Insight:</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    💡 {aiDiagnostic.actionable_insight}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No diagnostic generated yet.</p>
            )}

            <button
              onClick={() => portfolioData && loadAiDiagnostic(portfolioData)}
              disabled={aiLoading || !portfolioData}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              Re-analyze Portfolio Risk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
