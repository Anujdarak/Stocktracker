import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  BarChart2,
  Eye,
  Menu,
  X,
  FileText,
  Activity,
  GitCompare,
  SlidersHorizontal,
  Coins,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import ProximityLogo from './ProximityLogo';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-black/95 text-white shadow-xl backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50 transition-all">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <ProximityLogo size={22} />
            <span className="text-xl font-black tracking-tight">Proxi<span className="text-emerald-400">mity</span></span>
          </Link>

          {/* Center Search */}
          <div className="hidden xl:block flex-1 max-w-md mx-6">
            <GlobalSearch />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-semibold">
            <NavLink to="/" className={({isActive}) => `px-2.5 py-1.5 rounded-lg transition-all ${isActive ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>Markets</NavLink>
            <NavLink to="/sectors" className={({isActive}) => `px-2.5 py-1.5 rounded-lg transition-all ${isActive ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}>Sectors</NavLink>
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

            {/* User Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </span>
                  <span className="text-slate-200 font-medium max-w-[90px] truncate" title={user?.email}>
                    {user?.name ? user.name.split(' ')[0] : user?.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Search (visible only on small screens) */}
        <div className="md:hidden pb-3">
          <GlobalSearch />
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800 space-y-2 text-sm font-semibold animate-in slide-in-from-top-2">
            <NavLink 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900"
            >
              Markets
            </NavLink>
            <NavLink 
              to="/sectors" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900"
            >
              Sectors
            </NavLink>
            <NavLink 
              to="/watchlist" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900"
            >
              Watchlist
            </NavLink>
            <NavLink 
              to="/ai-chart-reader" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-violet-400 hover:bg-slate-900"
            >
              AI Chart Reader
            </NavLink>

            <div className="pt-2 border-t border-slate-800">
              {isAuthenticated ? (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-xl">
                  <div className="flex items-center gap-2">
                    <UserIcon size={16} className="text-emerald-400" />
                    <span className="text-xs text-slate-200">{user?.name || user?.email}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="text-xs text-rose-400 font-bold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => { openAuthModal('login'); setMobileMenuOpen(false); }}
                    className="py-2 text-center text-xs font-bold rounded-lg bg-slate-900 text-white"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { openAuthModal('register'); setMobileMenuOpen(false); }}
                    className="py-2 text-center text-xs font-bold rounded-lg bg-emerald-500 text-slate-950"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
