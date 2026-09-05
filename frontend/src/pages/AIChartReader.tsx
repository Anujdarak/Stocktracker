import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { llmService, searchService } from '../services/api';
import {
  Upload,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Bot,
  Search,
  Key,
  Calendar,
  Target,
  LineChart
} from 'lucide-react';

interface AnalysisResult {
  technical_bias: string;
  plain_language_explanation: string;
  confidence: string;
  key_levels: string[];
  model_used?: string;
  trader_jargon?: {
    trend_bias?: string;
    support_level?: string;
    resistance_level?: string;
    technical_pattern?: string;
    pivot_level?: string;
  };
  quick_5day_analysis?: string;
  tentative_next_day_value?: number;
  tentative_next_day_range?: {
    lower: number;
    upper: number;
  };
  tentative_next_day_explanation?: string;
  five_day_candles?: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  ticker?: string;
  latest_close?: number;
  five_day_return_pct?: number;
}

const POPULAR_PROMPTS = [
  "I want last analysis of the next day",
  "Expected next-day trading range & key levels",
  "Is the 5-day trend building momentum?"
];

const AIChartReader: React.FC = () => {
  const location = useLocation();
  const defaultTicker = (location.state as any)?.defaultTicker || '';

  const [activeMode, setActiveMode] = useState<'5day' | 'screenshot'>('5day');
  const [ticker, setTicker] = useState(defaultTicker);
  const [tickerSearchQuery, setTickerSearchQuery] = useState(defaultTicker);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // User question / prompt for 5-day next day analysis
  const [userQuery, setUserQuery] = useState('I want last analysis of the next day');

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Engine selection: 'deepseek' or 'gemini'
  const [provider, setProvider] = useState<'deepseek' | 'gemini'>('deepseek');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search debounce for ticker
  useEffect(() => {
    if (tickerSearchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      const data = await searchService.searchEquities(tickerSearchQuery);
      setSearchResults(data.slice(0, 6));
      setShowDropdown(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [tickerSearchQuery]);

  const selectStock = (sym: string, name: string) => {
    setTicker(sym);
    setTickerSearchQuery(`${sym} (${name})`);
    setShowDropdown(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (activeMode === 'screenshot' && !selectedImage) {
      setError("Please upload a chart screenshot first.");
      return;
    }
    if (activeMode === '5day' && !ticker.trim()) {
      setError("Please type or select an NSE stock ticker (e.g. RELIANCE, TCS, ZOMATO).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (activeMode === '5day') {
        const cleanTicker = ticker.split(' ')[0].trim().toUpperCase();
        const response = await llmService.analyzeFiveDayChart({
          ticker: cleanTicker,
          user_query: userQuery.trim() || "I want last analysis of the next day",
          provider,
          api_key: customApiKey.trim() || undefined
        });

        setResult({
          technical_bias: response.technical_bias || 'Settling in a steady range',
          plain_language_explanation: response.quick_5day_analysis || response.plain_language_explanation || 'No plain explanation provided.',
          confidence: response.confidence || 'Medium',
          key_levels: Array.isArray(response.key_levels) ? response.key_levels : [response.key_levels].filter(Boolean),
          model_used: response.model_used || (provider === 'deepseek' ? 'DeepSeek (V3/R1 Real-time Analysis)' : 'Google Gemini 2.5 Flash'),
          trader_jargon: response.trader_jargon || {},
          quick_5day_analysis: response.quick_5day_analysis,
          tentative_next_day_value: response.tentative_next_day_value,
          tentative_next_day_range: response.tentative_next_day_range,
          tentative_next_day_explanation: response.tentative_next_day_explanation,
          five_day_candles: response.five_day_candles,
          ticker: response.ticker || cleanTicker,
          latest_close: response.latest_close,
          five_day_return_pct: response.five_day_return_pct
        });
      } else {
        const formData = new FormData();
        formData.append('image', selectedImage!);
        if (ticker) {
          formData.append('ticker', ticker.toUpperCase());
        }
        formData.append('provider', provider);
        if (customApiKey.trim()) {
          formData.append('api_key', customApiKey.trim());
        }

        const response = await llmService.analyzeChart(formData);

        setResult({
          technical_bias: response.technical_bias || 'Settling in a steady range',
          plain_language_explanation: response.plain_language_explanation || 'No plain explanation provided.',
          confidence: response.confidence || 'Medium',
          key_levels: Array.isArray(response.key_levels) ? response.key_levels : [response.key_levels].filter(Boolean),
          model_used: response.model_used || (provider === 'deepseek' ? 'DeepSeek (V3/R1 Real-time Analysis)' : 'Google Gemini 2.5 Flash'),
          trader_jargon: response.trader_jargon || {}
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || err.message || "An error occurred during chart inference.");
    } finally {
      setLoading(false);
    }
  };

  const getBiasBadge = (bias: string) => {
    const b = (bias || '').toLowerCase();
    if (b.includes('up') || b.includes('bull')) {
      return {
        label: 'Generally Moving Upward',
        icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        className: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
      };
    } else if (b.includes('down') || b.includes('bear')) {
      return {
        label: 'Generally Moving Downward',
        icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
        className: 'bg-rose-950/60 text-rose-300 border-rose-500/40'
      };
    } else {
      return {
        label: 'Settling in a Steady Range',
        icon: <Minus className="w-4 h-4 text-indigo-400" />,
        className: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
      };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Chart Reader & Next-Day Outlook
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Type any stock ticker for a 5-day candlestick analysis with tentative next-day value projections, or upload a chart screenshot.
          </p>
        </div>

        {/* Model Selector Pill */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 self-start md:self-auto flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">AI Engine</span>
          <div className="flex bg-slate-900 p-1 rounded-lg text-xs font-semibold gap-1">
            <button
              onClick={() => setProvider('deepseek')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                provider === 'deepseek'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot size={14} /> DeepSeek (V3/R1)
            </button>
            <button
              onClick={() => setProvider('gemini')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                provider === 'gemini'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} /> Gemini 2.5 Flash
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Mode Toggle & Inputs (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 p-6 space-y-5 hover-lift">

          {/* Mode Switcher Tabs */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Analysis Mode
            </label>
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => { setActiveMode('5day'); setError(null); }}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeMode === '5day'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar size={14} />
                <span className="truncate">5-Day & Next-Day</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveMode('screenshot'); setError(null); }}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeMode === 'screenshot'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload size={14} />
                <span className="truncate">Upload Screenshot</span>
              </button>
            </div>
          </div>

          {/* Stock Ticker Search Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Stock Ticker / Company Name (NSE) {activeMode === '5day' && <span className="text-emerald-400">*</span>}
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={tickerSearchQuery}
                onChange={(e) => {
                  setTickerSearchQuery(e.target.value);
                  setTicker(e.target.value.split(' ')[0]);
                }}
                placeholder="e.g. ZOMATO, RELIANCE, TCS, TITAN..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950/90 border border-slate-700/80 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-slate-400"
              />
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800">
                {searchResults.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectStock(item.symbol, item.name)}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-white">{item.symbol}</span>
                      <span className="text-slate-400 block truncate max-w-[200px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-bold">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode 1: 5-Day Analysis Request Prompt */}
          {activeMode === '5day' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Analysis Request
                </label>
                <textarea
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  rows={2}
                  placeholder="e.g. I want last analysis of the next day"
                  className="w-full p-3 text-sm bg-slate-950/90 border border-slate-700/80 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-slate-400 resize-none"
                />
              </div>

              {/* Quick suggestion chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Prompts:</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_PROMPTS.map((promptText, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setUserQuery(promptText)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                        userQuery === promptText
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[11px] text-slate-300 leading-relaxed">
                💡 <strong className="text-indigo-300 font-semibold">How it works:</strong> Fetches the last 5 trading days of daily OHLCV candlestick data directly from NSE, identifies momentum patterns, and calculates tentative next-day pivot values and expected trading ranges.
              </div>
            </div>
          ) : (
            /* Mode 2: Screenshot Upload Zone */
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Chart Screenshot <span className="text-blue-400">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 min-h-[190px] flex flex-col items-center justify-center p-4 bg-slate-950/70 hover:bg-slate-800/40 hover:border-slate-600 ${
                  imagePreview ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-slate-800'
                }`}
              >
                {imagePreview ? (
                  <div className="w-full relative">
                    <img src={imagePreview} alt="Chart preview" className="w-full max-h-48 object-contain rounded-lg mx-auto" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg backdrop-blur-xs">
                      <p className="text-white text-xs font-bold flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700">
                        <Upload size={14} /> Click to Replace Screenshot
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-slate-900 rounded-full shadow-xs border border-slate-800 flex items-center justify-center mx-auto text-slate-400 group-hover:text-emerald-400 transition-colors">
                      <ImageIcon size={22} />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">Click or drop a chart screenshot</p>
                    <p className="text-[11px] text-slate-400">PNG, JPG, or WebP from TradingView, Zerodha, etc.</p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Optional API Key Input */}
          <div className="pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-semibold transition-colors"
            >
              <Key size={13} /> {showKeyInput ? 'Hide' : 'Use Custom'} DeepSeek API Key (Optional)
              {showKeyInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showKeyInput && (
              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <input
                  type="password"
                  placeholder="sk-..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                />
                <p className="text-[10px] text-slate-400 leading-tight">
                  Leave blank to use the pre-configured system key. Your key is not saved to disk.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || (activeMode === 'screenshot' && !selectedImage) || (activeMode === '5day' && !ticker.trim())}
            className={`w-full py-3 px-4 rounded-xl text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              loading || (activeMode === 'screenshot' && !selectedImage) || (activeMode === '5day' && !ticker.trim())
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700'
                : 'bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] shadow-emerald-500/20'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-slate-950" />
                {activeMode === '5day' ? 'Analyzing 5-Day Chart & Projecting...' : 'Reading Pattern via AI...'}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {activeMode === '5day' ? 'Analyze Last 5 Days & Next-Day Value' : 'Generate Plain-Language Read'}
              </>
            )}
          </button>

        </div>

        {/* Right Column: Visual Report Card (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {result ? (
            <div className="bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 overflow-hidden animate-in fade-in duration-300 hover-lift">

              {/* Report Header */}
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-extrabold text-white">
                      {result.ticker ? `${result.ticker} Analysis Readout` : 'Analyst Pattern Readout'}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>Model: <strong className="text-slate-200">{result.model_used}</strong></span>
                    <span>•</span>
                    <span>Confidence: <strong className="text-slate-200">{result.confidence}</strong></span>
                  </div>
                </div>

                {/* Bias Badge */}
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 self-start sm:self-auto ${getBiasBadge(result.technical_bias).className}`}>
                  {getBiasBadge(result.technical_bias).icon}
                  {getBiasBadge(result.technical_bias).label}
                </div>
              </div>

              <div className="p-6 space-y-5">

                {/* Tentative Next Day Value (Prominently Highlighted) */}
                {result.tentative_next_day_value !== undefined && (
                  <div className="bg-gradient-to-br from-indigo-950/70 via-slate-950 to-emerald-950/30 rounded-xl p-4 sm:p-5 border border-indigo-500/30 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        <Target size={16} className="text-emerald-400" />
                        <span>Tentative Next Day Value</span>
                      </div>
                      {result.five_day_return_pct !== undefined && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${result.five_day_return_pct >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          5-Day Net: {result.five_day_return_pct >= 0 ? '+' : ''}{result.five_day_return_pct}%
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                          ₹{result.tentative_next_day_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-slate-400">Estimated median pivot target for next trading session</span>
                      </div>
                      {result.tentative_next_day_range && (
                        <div className="sm:text-right bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Expected Next-Day Range</span>
                          <span className="font-mono text-xs font-bold text-emerald-300">
                            ₹{result.tentative_next_day_range.lower.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                            {' — '}
                            ₹{result.tentative_next_day_range.upper.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>

                    {result.tentative_next_day_explanation && (
                      <p className="text-xs text-slate-200 leading-relaxed pt-1 font-medium">
                        {result.tentative_next_day_explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Quick Last 5 Days Chart Analysis (Prominently Highlighted with explicit heading) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <LineChart size={15} className="text-blue-400" />
                      Quick Last 5 Days Chart Analysis
                    </span>
                    {result.latest_close && (
                      <span className="text-xs text-slate-400">
                        Latest Close: <strong className="text-white font-mono">₹{result.latest_close.toLocaleString('en-IN')}</strong>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed font-medium bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    "{result.quick_5day_analysis || result.plain_language_explanation}"
                  </p>
                </div>

                {/* 5-Day Session Candlestick OHLCV Data Table */}
                {result.five_day_candles && result.five_day_candles.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      5-Day Session Summary (NSE Daily OHLCV)
                    </span>
                    <div className="overflow-x-auto bg-slate-950/60 rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[10px] uppercase text-slate-400 bg-slate-950 border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-2.5">Open</th>
                            <th className="py-2 px-2.5">High</th>
                            <th className="py-2 px-2.5">Low</th>
                            <th className="py-2 px-2.5">Close</th>
                            <th className="py-2 px-3 text-right">Volume</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {result.five_day_candles.map((c, idx) => {
                            const isUp = c.close >= c.open;
                            return (
                              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 px-3 text-slate-300 font-sans">{c.date}</td>
                                <td className="py-2 px-2.5 text-slate-400">₹{c.open}</td>
                                <td className="py-2 px-2.5 text-emerald-400">₹{c.high}</td>
                                <td className="py-2 px-2.5 text-rose-400">₹{c.low}</td>
                                <td className={`py-2 px-2.5 font-bold ${isUp ? 'text-emerald-300' : 'text-rose-300'}`}>
                                  ₹{c.close}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-400 font-sans">{c.volume.toLocaleString('en-IN')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Key Price Levels */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Observed Price Boundaries
                  </span>
                  <div className="space-y-2">
                    {result.key_levels.map((lvl, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                        <span>{lvl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trader Jargon Toggle */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="w-full py-2.5 px-3 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-between rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span>Show Technical Details (Trader Jargon)</span>
                    {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showTechnicalDetails && (
                    <div className="mt-2 p-4 bg-slate-950 text-slate-200 rounded-xl space-y-2 text-xs font-mono border border-slate-800 animate-in fade-in duration-200">
                      <div className="text-slate-400 uppercase tracking-widest text-[10px] mb-2 font-sans font-bold">
                        Internal Technical Metrics
                      </div>
                      <div>• Trend Bias: <span className="text-emerald-400">{result.trader_jargon?.trend_bias || result.technical_bias}</span></div>
                      {result.trader_jargon?.pivot_level && (
                        <div>• Pivot Level: <span className="text-indigo-300">{result.trader_jargon.pivot_level}</span></div>
                      )}
                      <div>• Support Floor: <span className="text-cyan-400">{result.trader_jargon?.support_level || 'N/A'}</span></div>
                      <div>• Resistance Ceiling: <span className="text-rose-400">{result.trader_jargon?.resistance_level || 'N/A'}</span></div>
                      <div>• Technical Structure: <span className="text-amber-400">{result.trader_jargon?.technical_pattern || '5-Day Trend Progression'}</span></div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 p-12 flex flex-col items-center justify-center text-center space-y-3 min-h-[380px]">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-xs">
                {activeMode === '5day' ? <Target size={28} /> : <Bot size={28} />}
              </div>
              <h3 className="font-bold text-white text-base">
                {activeMode === '5day' ? 'Awaiting 5-Day Analysis Request' : 'Awaiting Chart Upload'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                {activeMode === '5day'
                  ? 'Type an NSE stock ticker above and submit your request to generate the quick last 5 days chart analysis and tentative next-day value.'
                  : 'Upload a chart screenshot and select a stock ticker to produce an AI-grounded, plain-spoken pattern readout.'
                }
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AIChartReader;