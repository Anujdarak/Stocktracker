import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { valuationService, llmService, searchService } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Bot,
  Search,
  Sliders,
  BarChart3
} from 'lucide-react';

export const ValuationPage: React.FC = () => {
  const { ticker: urlTicker } = useParams<{ ticker?: string }>();
  const navigate = useNavigate();

  const [activeTicker, setActiveTicker] = useState<string>(urlTicker?.toUpperCase() || 'RELIANCE');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [valuationData, setValuationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive slider parameters
  const [growthRate, setGrowthRate] = useState<number>(12.0);
  const [discountRate, setDiscountRate] = useState<number>(12.5);
  const [terminalGrowth, setTerminalGrowth] = useState<number>(4.5);
  const [activeScenario, setActiveScenario] = useState<'base' | 'bull' | 'bear' | 'custom'>('base');

  // Calculated DCF Output
  const [dcfOutput, setDcfOutput] = useState<any>(null);

  // AI Interpretation
  const [aiProvider, setAiProvider] = useState<'deepseek' | 'gemini'>('deepseek');
  const [aiVerdict, setAiVerdict] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load valuation inputs when activeTicker changes
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await valuationService.getValuation(activeTicker);
        if (!isMounted) return;
        setValuationData(data);
        const defaults = data.inputs.defaults;
        setGrowthRate(defaults.base_growth_rate);
        setDiscountRate(defaults.discount_rate);
        setTerminalGrowth(defaults.terminal_growth_rate);
        setDcfOutput(data.scenarios.base);
        setActiveScenario('base');

        // Automatically trigger AI interpretation
        loadAiVerdict(activeTicker, {
          growth_rate: defaults.base_growth_rate,
          discount_rate: defaults.discount_rate,
          terminal_growth: defaults.terminal_growth_rate
        }, data.scenarios.base);

      } catch (err: any) {
        if (isMounted) setError("Unable to load valuation data for this ticker. Please try another symbol.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [activeTicker]);

  // Handle Search Autocomplete
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchService.search(searchQuery);
        setSearchResults(results.slice(0, 6));
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Recalculate DCF when sliders change
  const handleRecalculate = async (g: number, d: number, tg: number) => {
    if (!valuationData) return;
    try {
      const inputs = valuationData.inputs;
      const res = await valuationService.calculateCustomDcf({
        current_price: inputs.current_price,
        base_eps: inputs.trailing_eps,
        growth_rate: g,
        discount_rate: d,
        terminal_growth: tg,
        years: 5
      });
      setDcfOutput(res);
    } catch (e) {
      console.error(e);
    }
  };

  const applyScenario = (sc: 'base' | 'bull' | 'bear') => {
    if (!valuationData) return;
    const defaults = valuationData.inputs.defaults;
    let g = defaults.base_growth_rate;
    if (sc === 'bull') g = defaults.bull_growth_rate;
    if (sc === 'bear') g = defaults.bear_growth_rate;
    setGrowthRate(g);
    setDiscountRate(defaults.discount_rate);
    setTerminalGrowth(defaults.terminal_growth_rate);
    setActiveScenario(sc);
    const scenarioOutput = valuationData.scenarios[sc];
    setDcfOutput(scenarioOutput);
  };

  const loadAiVerdict = async (ticker: string, inputs: any, output: any) => {
    setAiLoading(true);
    try {
      const res = await llmService.getValuationVerdict(ticker, inputs, output, aiProvider);
      setAiVerdict(res);
    } catch {
      setAiVerdict(null);
    } finally {
      setAiLoading(false);
    }
  };

  const selectStock = (sym: string) => {
    setActiveTicker(sym);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/valuation/${sym}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Discounted Cash Flow (DCF) Valuation Modeler
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Model the intrinsic fair value of Indian equities using 5-year cash flow projections, India-specific cost of capital (WACC), and AI-generated plain-language market expectations.
            </p>
          </div>

          {/* Quick Search Selector */}
          <div className="relative min-w-[280px]">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Any NSE Stock</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol (e.g. TCS, TITAN)..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800">
                {searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => selectStock(item.symbol)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white text-sm">{item.symbol}</span>
                      <span className="text-xs text-slate-400 ml-2 truncate max-w-[150px] inline-block">{item.name}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono">Select →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm mt-4">Building financial model for {activeTicker}...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400">
          {error}
        </div>
      ) : valuationData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive DCF Assumptions & Sliders (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Stock Snapshot Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {valuationData.inputs.symbol.replace('.NS', '')}
                    <span className="text-xs font-normal text-slate-400">({valuationData.inputs.shortName})</span>
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Current Price:</span>
                    <span className="text-white font-semibold font-mono text-sm">₹{valuationData.inputs.current_price?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex gap-4 text-xs">
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Trailing EPS</span>
                    <span className="font-mono text-white font-semibold">₹{valuationData.inputs.trailing_eps}</span>
                  </div>
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">P/E Ratio</span>
                    <span className="font-mono text-white font-semibold">{valuationData.inputs.pe_ratio ? `${valuationData.inputs.pe_ratio}x` : 'N/A'}</span>
                  </div>
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Stock Beta</span>
                    <span className="font-mono text-white font-semibold">{valuationData.inputs.beta}</span>
                  </div>
                </div>
              </div>

              {/* Scenario Quick-Toggle Pills */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    Growth Scenarios
                  </span>
                  <span className="text-xs text-slate-500">Pick a preset or adjust sliders below</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => applyScenario('bull')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                      activeScenario === 'bull'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🚀 Bull Case (+{valuationData.inputs.defaults.bull_growth_rate}%)
                  </button>
                  <button
                    onClick={() => applyScenario('base')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                      activeScenario === 'base'
                        ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    ⚖️ Base Case (+{valuationData.inputs.defaults.base_growth_rate}%)
                  </button>
                  <button
                    onClick={() => applyScenario('bear')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                      activeScenario === 'bear'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🛡️ Bear Case (+{valuationData.inputs.defaults.bear_growth_rate}%)
                  </button>
                </div>
              </div>

              {/* Interactive Sliders */}
              <div className="mt-6 space-y-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {/* 1. Growth Rate */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">5-Year Expected Annual Growth</span>
                    <span className="text-emerald-400 font-mono font-semibold text-sm">{growthRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="35"
                    step="0.5"
                    value={growthRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setGrowthRate(val);
                      setActiveScenario('custom');
                      handleRecalculate(val, discountRate, terminalGrowth);
                    }}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>2% (Conservative)</span>
                    <span>15% (Healthy)</span>
                    <span>35% (Hyper-growth)</span>
                  </div>
                </div>

                {/* 2. Discount Rate (WACC) */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Discount Rate (Cost of Capital / WACC)</span>
                    <span className="text-teal-400 font-mono font-semibold text-sm">{discountRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="18"
                    step="0.5"
                    value={discountRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setDiscountRate(val);
                      setActiveScenario('custom');
                      handleRecalculate(growthRate, val, terminalGrowth);
                    }}
                    className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>8% (Low Risk)</span>
                    <span>12.5% (India Standard)</span>
                    <span>18% (High Risk)</span>
                  </div>
                </div>

                {/* 3. Terminal Growth */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Perpetual Terminal Growth Rate</span>
                    <span className="text-cyan-400 font-mono font-semibold text-sm">{terminalGrowth}%</span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="6.0"
                    step="0.2"
                    value={terminalGrowth}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTerminalGrowth(val);
                      setActiveScenario('custom');
                      handleRecalculate(growthRate, discountRate, val);
                    }}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>3.0% (Inflation floor)</span>
                    <span>4.5% (India Long-term GDP)</span>
                    <span>6.0% (Upper bound)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Year Projected Cash Flow Breakdown */}
            {dcfOutput?.projected_eps_series && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    5-Year Projected Earnings Stream (₹/share)
                  </h3>
                  <span className="text-xs text-slate-400">PV of Projections: ₹{dcfOutput.pv_of_projections}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {dcfOutput.projected_eps_series.map((val: number, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">Year {idx + 1}</span>
                      <span className="text-sm font-mono font-bold text-white mt-0.5 block">₹{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Intrinsic Value Gauge & AI Plain-Language Verdict (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Intrinsic Value Meter Card */}
            {dcfOutput && (
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Estimated Intrinsic Fair Value
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold font-mono text-white">
                    ₹{dcfOutput.fair_value?.toLocaleString('en-IN')}
                  </span>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    dcfOutput.discount_percentage >= 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {dcfOutput.discount_percentage >= 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{dcfOutput.discount_percentage}% (Discount)
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3.5 h-3.5" />
                        {dcfOutput.discount_percentage}% (Premium)
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Current Market Price:</span>
                    <span className="font-mono text-white font-medium">₹{dcfOutput.current_price?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Present Value (5-Yr Projections):</span>
                    <span className="font-mono text-white">₹{dcfOutput.pv_of_projections}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Present Value (Terminal Value):</span>
                    <span className="font-mono text-white">₹{dcfOutput.pv_of_terminal_value}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-semibold pt-1 border-t border-slate-800">
                    <span>Valuation Assessment:</span>
                    <span className={dcfOutput.discount_percentage >= 15 ? 'text-emerald-400' : dcfOutput.discount_percentage <= -15 ? 'text-rose-400' : 'text-amber-400'}>
                      {dcfOutput.valuation_verdict}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Plain-Language Expectations Verdict */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Valuation Interpretation</h3>
                    <p className="text-[11px] text-slate-400">Plain language translation of market expectations</p>
                  </div>
                </div>

                {/* AI Provider Toggle */}
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                  <button
                    onClick={() => {
                      setAiProvider('deepseek');
                      loadAiVerdict(activeTicker, { growth_rate: growthRate, discount_rate: discountRate, terminal_growth: terminalGrowth }, dcfOutput);
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
                      loadAiVerdict(activeTicker, { growth_rate: growthRate, discount_rate: discountRate, terminal_growth: terminalGrowth }, dcfOutput);
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
                  <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-400 mt-2">Translating valuation model...</p>
                </div>
              ) : aiVerdict ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Plain Language Summary:</span>
                    <p className="text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                      {aiVerdict.plain_language_verdict}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">What the Market Assumes:</span>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                      {aiVerdict.market_expectations}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Key Assumption Sensitivity:</span>
                    <p className="text-amber-300/90 leading-relaxed bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                      ⚠️ {aiVerdict.key_risk_factor}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No AI interpretation available.</p>
              )}

              {/* Refresh AI Button */}
              <button
                onClick={() => loadAiVerdict(activeTicker, { growth_rate: growthRate, discount_rate: discountRate, terminal_growth: terminalGrowth }, dcfOutput)}
                disabled={aiLoading}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                Refresh AI Analysis with Current Sliders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
