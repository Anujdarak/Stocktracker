import React from 'react';
import ProximityLogo from './ProximityLogo';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 py-6 mt-auto shadow-inner">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ProximityLogo size={18} variant="plain" />
          <span className="text-slate-200 font-bold tracking-wide text-base">Proximity</span>
        </div>

        <div className="text-xs text-slate-500">
          India Equities Technical Analysis & Market Intelligence Platform
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          &copy; {new Date().getFullYear()} Proximity. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;