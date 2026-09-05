import React, { useState, useEffect } from 'react';
import { llmService, newsService, searchService } from '../services/api';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckCircle2,
  Zap,
  Upload,
  Table,
  Calendar
} from 'lucide-react';

const SAMPLE_QUERIES = [
  "compare q1 results of 2026 and 2027",
  "q1 results of 2027",
  "compare q4 2025 and q4 2026",
  "compare q3 2025 and q3 2026"
];

const POPULAR_COMPANIES = [
  { symbol: 'RELIANCE', name: 'Reliance' },
  { symbol: 'TCS', name: 'TCS' },
  { symbol: 'TITAN', name: 'Titan' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' }
];

const NewsResultsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'results' | 'news'>('results');
  const [ticker, setTicker] = useState('RELIANCE');
  const [tickerSearchQuery, setTickerSearchQuery] = useState('RELIANCE (Reliance Industries)');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [detailsText, setDetailsText] = useState('compare q1 results of 2026 and 2027');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Live News Tab state
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [newsFilter, setNewsFilter] = useState('');
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    setLoadingNews(true);
    newsService.getLatest()
      .then((data) => setLiveNews(data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingNews(false));
  }, []);

  const handleAnalyze = async () => {
    if (!detailsText.trim()) {
      setError('Please provide earnings results details to analyze.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const data = await llmService.analyzeResults(ticker.toUpperCase(), detailsText);
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to process AI results impact.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setDetailsText(text.slice(0, 5000));
          setAnalysisResult(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleNewsSearch = async () => {
    if (!newsFilter.trim()) {
      const all = await newsService.getLatest();
      setLiveNews(all);
      return;
    }
    setLoadingNews(true);
    try {
      const filtered = await newsService.searchNews(newsFilter);
      setLiveNews(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNews(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    const s = (sentiment || '').toLowerCase();
    if (s.includes('pos') || s.includes('strong')) {
      return {
        label: 'Strong / Positive Impact',
        icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
        className: 'bg-emerald-50 text-emerald-800 border-emerald-300'
      };
    } else if (s.includes('neg') || s.includes('weak')) {
      return {
        label: 'Weak / Cautionary Impact',
        icon: <TrendingDown className="w-4 h-4 text-rose-600" />,
        className: 'bg-rose-50 text-rose-800 border-rose-300'
      };
    } else {
      return {
        label: 'Mixed / Balanced Impact',
        icon: <Minus className="w-4 h-4 text-amber-600" />,
        className: 'bg-amber-50 text-amber-800 border-amber-300'
      };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            News & Results Impact Analyzer
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Evaluate corporate earnings releases, quarterly financial growth, and real-time market news headlines translated into clear, simple takeaway summaries.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700 self-start md:self-auto text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('results');
              setTicker('RELIANCE');
              setDetailsText(SAMPLE_QUERIES[0]);
              setAnalysisResult(null);
            }}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'results' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={14} /> Quarterly Results
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'news' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={14} /> Live News Wire
          </button>
        </div>
      </div>

      {activeTab !== 'news' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Input and Presets (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 p-6 space-y-5 hover-lift">
            
            {/* Stock Autocomplete Search */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Stock Symbol / Company (NSE)
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={tickerSearchQuery}
                  onChange={(e) => {
                    setTickerSearchQuery(e.target.value);
                    setTicker(e.target.value.split(' ')[0]);
                  }}
                  placeholder="Search stock e.g. RELIANCE, TCS, TITAN..."
                  className="w-full pl-9 pr-3.5 py-2 text-sm font-mono font-bold bg-slate-950/90 border border-slate-700/80 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800">
                  {searchResults.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectStock(item.symbol, item.name)}
                      className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-slate-800/80 flex items-center justify-between transition-colors"
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

              {/* Popular Company Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_COMPANIES.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectStock(c.symbol, c.name)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      ticker === c.symbol
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Natural Query or Numbers Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quarterly Query or YoY Numbers
                </label>
                <label className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors">
                  <Upload size={12} />
                  <span>Upload text</span>
                  <input
                    type="file"
                    accept=".txt,.csv,.json,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={4}
                value={detailsText}
                onChange={(e) => setDetailsText(e.target.value)}
                placeholder="e.g. compare q1 results of 2026 and 2027, or q1 results of 2027, or paste earnings release..."
                className="w-full p-3.5 text-xs text-slate-200 bg-slate-950/90 border border-slate-700/80 rounded-xl focus:outline-none focus:border-emerald-500 leading-relaxed placeholder-slate-500 font-mono"
              ></textarea>
              <p className="text-[11px] text-slate-500 mt-1">
                Type natural comparison requests like <strong className="text-slate-400">"compare q1 results of 2026 and 2027"</strong> to fetch exact reported figures.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] shadow-indigo-600/20"
            >
              {analyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Fetching Exact Numbers & Analyzing...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Fetch & Compare Exact Results
                </>
              )}
            </button>
          </div>

          {/* Right Column: AI Output (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">

            {analysisResult ? (
              analysisResult.is_quarterly_query ? (
                /* Exact Quarterly Comparison Card */
                <div className="bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 overflow-hidden animate-in fade-in duration-300 hover-lift">
                  
                  {/* Header */}
                  <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Table className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-extrabold text-white">
                          {analysisResult.comparison_title}
                        </h2>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Ticker: <strong className="text-emerald-400 font-mono">{ticker}</strong></span>
                        <span>•</span>
                        <span>Exact Reported Figures</span>
                      </div>
                    </div>

                    {/* Sentiment Badge */}
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 self-start sm:self-auto ${getSentimentBadge(analysisResult.sentiment).className}`}>
                      {getSentimentBadge(analysisResult.sentiment).icon}
                      {getSentimentBadge(analysisResult.sentiment).label}
                    </div>
                  </div>

                  {/* Top Key Metrics Banner (Cards) */}
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {analysisResult.exact_table?.slice(0, 4).map((row: any, idx: number) => (
                        <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                            {row.metric}
                          </span>
                          <div className="mt-2">
                            <span className="text-sm sm:text-base font-black text-white block">
                              {row.period_2_val !== '-' ? row.period_2_val : row.period_1_val}
                            </span>
                            {row.change !== '-' && (
                              <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 mt-0.5 ${
                                row.status === 'positive' ? 'text-emerald-400' : (row.status === 'negative' ? 'text-rose-400' : 'text-slate-400')
                              }`}>
                                {row.status === 'positive' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {row.change}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Exact Side-by-Side Comparison Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-4 font-bold">Financial Metric</th>
                            <th className="py-2.5 px-4 font-bold">{analysisResult.period_1_label}</th>
                            {analysisResult.period_2_label && (
                              <th className="py-2.5 px-4 font-bold">{analysisResult.period_2_label}</th>
                            )}
                            {analysisResult.period_2_label && (
                              <th className="py-2.5 px-4 font-bold text-right">Variance</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono">
                          {analysisResult.exact_table?.map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2.5 px-4 font-sans font-semibold text-slate-200">{row.metric}</td>
                              <td className="py-2.5 px-4 text-slate-300">{row.period_1_val}</td>
                              {analysisResult.period_2_label && (
                                <td className="py-2.5 px-4 font-bold text-white">{row.period_2_val}</td>
                              )}
                              {analysisResult.period_2_label && (
                                <td className="py-2.5 px-4 text-right">
                                  <span className={`px-2 py-0.5 rounded font-bold ${
                                    row.status === 'positive' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : (row.status === 'negative' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400')
                                  }`}>
                                    {row.change}
                                  </span>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Plain Language Summary */}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        AI Performance Verdict
                      </span>
                      <p className="text-sm text-slate-100 leading-relaxed font-medium bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        "{analysisResult.plain_language_verdict || analysisResult.plain_language_explanation}"
                      </p>
                    </div>

                    {/* Available Quarters on File */}
                    {analysisResult.available_quarters?.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
                          <Calendar size={13} className="text-indigo-400" />
                          Other Quarters on File for {ticker} (Click to compare):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.available_quarters.map((q: string, i: number) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setDetailsText(`compare ${analysisResult.period_1_label} and ${q}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-950 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-700/50 rounded-lg transition-all"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Standard Event Impact Assessment */
                <div className="bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 overflow-hidden animate-in fade-in duration-300 hover-lift">

                  {/* Header */}
                  <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-extrabold text-white">
                          Event Impact Assessment
                        </h2>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Event: <strong className="text-slate-200">{analysisResult.event_type}</strong></span>
                        <span>•</span>
                        <span>Ticker: <strong className="text-slate-200 font-mono">{ticker}</strong></span>
                      </div>
                    </div>

                    {/* Sentiment Badge */}
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 self-start sm:self-auto ${getSentimentBadge(analysisResult.sentiment).className}`}>
                      {getSentimentBadge(analysisResult.sentiment).icon}
                      {getSentimentBadge(analysisResult.sentiment).label}
                    </div>
                  </div>

                  {/* Severity Meter & Explanation */}
                  <div className="p-6 space-y-5">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                          Estimated Market Severity
                        </span>
                        <span className="text-xs text-slate-500">Likelihood of shifting near-term sentiment</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`w-7 h-3 rounded-full transition-all ${
                              lvl <= (analysisResult.severity || 3)
                                ? (analysisResult.sentiment === 'positive'
                                    ? 'bg-emerald-500'
                                    : analysisResult.sentiment === 'negative'
                                      ? 'bg-rose-500'
                                      : 'bg-amber-500')
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-slate-200 ml-1.5 font-mono">
                          {analysisResult.severity || 3}/5
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Plain-Language Summary
                      </span>
                      <p className="text-base text-slate-100 leading-relaxed font-medium bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                        "{analysisResult.plain_language_explanation}"
                      </p>
                    </div>
                  </div>

                </div>
              )
            ) : (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px] shadow-sm">
                <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-xs">
                  <Sparkles size={26} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Impact Analysis Output</h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-1">
                    Select a stock or type a query like <strong className="text-indigo-400">"compare q1 results of 2026 and 2027"</strong> on the left, then click <strong className="text-indigo-400">"Fetch & Compare Exact Results"</strong>.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* Live News Feed View */
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md space-y-5 hover-lift">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Live Indian Market News Feeds</h2>
              <p className="text-xs text-slate-400">Curated feeds from Moneycontrol, Economic Times, and Livemint</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-80">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={newsFilter}
                  onChange={(e) => setNewsFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNewsSearch()}
                  placeholder="Filter by stock or topic..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleNewsSearch}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {loadingNews ? (
            <div className="space-y-3 py-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-slate-800 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : liveNews.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No news headlines matching your query.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveNews.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40 transition-all flex flex-col justify-between group hover-lift"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider">{item.source}</span>
                      <span>{item.published ? item.published.slice(0, 16) : ''}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-200 group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.snippet && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.snippet}</p>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 mt-3 self-end transition-colors">
                    Read article <ExternalLink size={12} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default NewsResultsPage;
