import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, Minus, Clock, ExternalLink } from 'lucide-react';
import { newsService, llmService } from '../services/api';

interface NewsImpactWidgetProps {
  ticker: string;
}

interface NewsItem {
  id?: string;
  title?: string;
  headline?: string;
  url?: string;
  publisher?: string;
  published_utc?: string;
  published_at?: string;
}

interface AnalysisResult {
  event_type: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  severity: number;
  plain_language_explanation: string;
}

const NewsImpactWidget: React.FC<NewsImpactWidgetProps> = ({ ticker }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAndAnalyze = async () => {
      if (!ticker) return;

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch recent news
        const newsData: NewsItem[] = await newsService.searchNews(ticker);

        if (isMounted) {
          setNews(newsData.slice(0, 5)); // Take top 5 for UI/analysis
        }

        // 2. Extract headlines
        const headlines = newsData
          .slice(0, 5)
          .map(item => item.title || item.headline || '')
          .filter(Boolean);

        if (headlines.length === 0) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // 3. Send to Gemini/LLM abstraction
        const analysisData = await llmService.analyzeNews(ticker, headlines);

        if (isMounted) {
          setAnalysis(analysisData);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching/analyzing news:', err);
        if (isMounted) {
          setError('Failed to analyze recent news impact.');
          setLoading(false);
        }
      }
    };

    fetchAndAnalyze();

    return () => {
      isMounted = false;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-800 rounded w-5/6 mb-6"></div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-950 rounded-xl w-full border border-slate-800"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/90 rounded-2xl border border-rose-900/40 p-6 shadow-md text-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <p className="text-rose-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!analysis || news.length === 0) {
    return (
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md text-center text-slate-400 text-xs">
        No recent news found for {ticker} to analyze.
      </div>
    );
  }

  const isPositive = analysis.sentiment === 'positive';
  const isNegative = analysis.sentiment === 'negative';

  const sentimentColor = isPositive
    ? 'text-emerald-400'
    : isNegative
      ? 'text-rose-400'
      : 'text-slate-400';

  const bgColor = isPositive
    ? 'bg-emerald-500/10 border border-emerald-500/30'
    : isNegative
      ? 'bg-rose-500/10 border border-rose-500/30'
      : 'bg-slate-800 border border-slate-700';

  const SentimentIcon = isPositive
    ? TrendingUp
    : isNegative
      ? TrendingDown
      : Minus;

  const severityBars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md hover-lift">
      <div className="flex items-start justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white mb-2">
            AI News Impact
          </h3>
          <div className="flex items-center gap-2.5 mt-2">
            <div className={`p-2 rounded-xl ${bgColor} ${sentimentColor}`}>
              <SentimentIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Event Type
              </p>
              <p className="font-semibold text-white text-sm">{analysis.event_type}</p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            Impact Severity
          </p>
          <div className="flex items-center gap-1 justify-end">
            {severityBars.map(level => (
              <div
                key={level}
                className={`h-2 w-5 rounded-full transition-all ${
                  level <= analysis.severity
                    ? (isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-amber-500')
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">{analysis.severity} / 5</p>
        </div>
      </div>

      <div className="bg-slate-950/70 rounded-xl p-4 mb-5 border border-slate-800/80">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">What this means:</h4>
        <p className="text-slate-200 leading-relaxed text-xs font-medium">
          {analysis.plain_language_explanation}
        </p>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          Recent Headlines Considered
        </h4>
        <ul className="space-y-2.5">
          {news.map((item, idx) => (
            <li key={item.id || idx} className="text-xs">
              <a
                href={item.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 text-slate-300 hover:text-emerald-300 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 group-hover:bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span className="leading-snug">
                  {item.title || item.headline || 'Untitled News'}
                  {item.publisher && <span className="text-slate-500 ml-2 font-mono">({item.publisher})</span>}
                </span>
                {item.url && <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NewsImpactWidget;