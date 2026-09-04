import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchService } from '../services/api';

interface SearchResult {
  symbol: string;
  name: string;
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        const data = await searchService.searchEquities(query);
        setResults(data);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (symbol: string) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/stock/${symbol}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
          placeholder="Search stocks, companies (e.g. RELIANCE, TCS)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-slate-900/95 border border-slate-700/90 shadow-2xl rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-800/80 backdrop-blur-xl animate-fade-in">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="px-4 py-2.5 cursor-pointer hover:bg-slate-800/80 flex justify-between items-center text-sm transition-colors group"
              onMouseDown={() => handleSelect(result.symbol)}
            >
              <span className="font-medium text-slate-200 group-hover:text-white truncate mr-2">{result.name}</span>
              <span className="text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{result.symbol}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;