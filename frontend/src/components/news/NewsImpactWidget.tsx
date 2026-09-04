import React, { useState } from 'react';
import { llmService } from '../../services/api';
import { AlertCircle, TrendingUp, TrendingDown, Minus, Loader2, Newspaper } from 'lucide-react';

interface NewsImpactWidgetProps {
  ticker: string;
  headlines: string[];
}

interface ImpactAnalysis {
  impact: 'positive' | 'negative' | 'neutral';
  analysis: string;
}

const NewsImpactWidget: React.FC<NewsImpactWidgetProps> = ({ ticker, headlines }) => {
  const [analysis, setAnalysis] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeNews = async () => {
    if (headlines.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const result = await llmService.analyzeNews(ticker, headlines);
      setAnalysis({
        impact: result.sentiment?.toLowerCase() || 'neutral',
        analysis: result.summary || result.analysis || 'No detailed analysis provided.'
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to analyze news impact");
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40';
      case 'negative': return 'text-rose-300 bg-rose-950/40 border-rose-500/40';
      default: return 'text-slate-300 bg-slate-950/60 border-slate-800';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'negative': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Minus className="w-5 h-5 text-slate-600" />;
    }
  };

  if (headlines.length === 0) return null;

  return (
    <div className="bg-slate-900/90 rounded-2xl shadow-md border border-slate-800 p-6 flex flex-col gap-4 hover-lift">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Newspaper className="text-emerald-400 w-5 h-5" />
          AI Sentiment Analysis
        </h3>
      </div>

      {!analysis && !loading && !error && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-3">Analyze recent headlines to gauge market sentiment for {ticker}.</p>
          <button
            onClick={analyzeNews}
            className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-colors text-xs font-bold shadow-md"
          >
            Analyze {headlines.length} Headlines
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <p className="text-xs font-medium text-slate-400">Reading recent news mapping sentiment...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className={`border rounded-xl p-4 ${getImpactColor(analysis.impact)}`}>
           <div className="flex items-center gap-2 mb-2">
             {getImpactIcon(analysis.impact)}
             <span className="font-semibold uppercase tracking-wider text-xs">{analysis.impact} Sentiment</span>
           </div>
           <p className="text-xs leading-relaxed text-slate-200 bg-slate-950/70 p-3 rounded-lg border border-slate-800">{analysis.analysis}</p>
        </div>
      )}
    </div>
  );
};

export default NewsImpactWidget;