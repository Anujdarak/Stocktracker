import React from 'react';
import { TrendingUp } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 py-6 mt-auto shadow-inner">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span className="text-slate-200 font-bold tracking-wide text-base">MarketPulse</span>
        </div>

        <div className="text-xs text-slate-500">
          India Equities Technical Analysis & AI Financial Modelling Platform
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          &copy; {new Date().getFullYear()} MarketPulse. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;