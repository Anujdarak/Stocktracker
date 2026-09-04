import { NavLink, Link } from 'react-router-dom';
import {
  TrendingUp,
  BarChart2,
  Eye,
  Menu,
  FileText,
  Calculator,
  Activity,
  GitCompare,
  SlidersHorizontal,
  Coins
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const Navbar = () => {
  return (
    <header className="bg-black/95 text-white shadow-xl backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50 transition-all">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-tr from-emerald-600 to-emerald-400 p-2 rounded-xl group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300">
              <TrendingUp size={20} className="text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black tracking-tight">Market<span className="text-emerald-400">Pulse</span></span>
          </Link>

          {/* Center Search */}
          <div className="hidden xl:block flex-1 max-w-md mx-6">
            <GlobalSearch />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-semibold">
            <NavLink to="/" className={({isActive}) => `px-2.5 py-1.5 rounded-lg transition-all ${isActive ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>Markets</NavLink>
            <NavLink to="/sectors" className={({isActive}) => `px-2.5 py-1.5 rounded-lg transition-all ${isActive ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>Sectors</NavLink>
            <NavLink to="/valuation" className={({isActive}) => `px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isActive ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>
              <Calculator size={14} className="text-emerald-400" />
              DCF
            </NavLink>
            <NavLink to="/portfolio-health" className={({isActive}) => `px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isActive ? 'bg-slate-900 text-blue-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>
              <Activity size={14} className="text-blue-400" />
              Risk
            </NavLink>
            <NavLink to="/compare" className={({isActive}) => `px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isActive ? 'bg-slate-900 text-purple-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>
              <GitCompare size={14} className="text-purple-400" />
              Compare
            </NavLink>
            <NavLink to="/screener" className={({isActive}) => `px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isActive ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>
              <SlidersHorizontal size={14} className="text-amber-400" />
              Screener
            </NavLink>
            <NavLink to="/news-results" className={({isActive}) => `px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isActive ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>
              <FileText size={14} />
              News
            </NavLink>
            <NavLink to="/corporate-actions" className={({isActive}) => `px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isActive ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>
              <Coins size={14} className="text-emerald-400" />
              Actions
            </NavLink>
            <NavLink to="/ai-chart-reader" className={({isActive}) => `flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-950/40 border border-violet-500/40 text-violet-300 hover:border-violet-400 hover:bg-violet-900/50 hover:scale-105 transition-all shadow-xs ${isActive ? 'text-violet-300 border-violet-400 bg-violet-900/60' : ''}`}>
              <BarChart2 size={14} className="text-violet-400" />
              AI Chart
            </NavLink>
            <NavLink to="/watchlist" className={({isActive}) => `px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isActive ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>
              <Eye size={14} />
              Watchlist
            </NavLink>
          </nav>

          {/* Mobile menu button */}
          <button className="lg:hidden p-2 text-slate-300 hover:text-white">
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Search (visible only on small screens) */}
        <div className="md:hidden pb-3">
          <GlobalSearch />
        </div>
      </div>
    </header>
  );
};

export default Navbar;