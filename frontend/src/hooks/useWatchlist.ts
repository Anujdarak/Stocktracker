import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_KEY = 'marketpulse_watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WATCHLIST_KEY && e.newValue) {
        setWatchlist(JSON.parse(e.newValue));
      }
    };

    // Listen for cross-tab changes
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab changes
    const handleLocalChange = () => {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    };
    window.addEventListener('watchlist_updated', handleLocalChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('watchlist_updated', handleLocalChange);
    };
  }, []);

  const addStock = useCallback((ticker: string) => {
    setWatchlist((prev) => {
      if (prev.includes(ticker)) return prev;
      const updated = [...prev, ticker];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('watchlist_updated'));
      return updated;
    });
  }, []);

  const removeStock = useCallback((ticker: string) => {
    setWatchlist((prev) => {
      if (!prev.includes(ticker)) return prev;
      const updated = prev.filter((t) => t !== ticker);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('watchlist_updated'));
      return updated;
    });
  }, []);

  const isInWatchlist = useCallback((ticker: string) => {
    return watchlist.includes(ticker);
  }, [watchlist]);

  return {
    watchlist,
    addStock,
    removeStock,
    isInWatchlist
  };
}