import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { userDataService } from '../services/api.js';

const WATCHLIST_KEY = 'marketpulse_watchlist';

export function useWatchlist() {
  const { isAuthenticated, user } = useAuth();
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // When user logs in, load persistent watchlist from MongoDB
  useEffect(() => {
    let isMounted = true;

    const loadRemoteWatchlist = async () => {
      if (isAuthenticated) {
        try {
          const remoteList = await userDataService.getWatchlist();
          if (isMounted && Array.isArray(remoteList)) {
            setWatchlist(remoteList);
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(remoteList));
          }
        } catch (error) {
          console.warn("Could not fetch remote watchlist from MongoDB:", error);
        }
      }
    };

    loadRemoteWatchlist();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const handleStorageChange = (e) => {
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

  const addStock = useCallback(async (ticker) => {
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;

    setWatchlist((prev) => {
      if (prev.includes(clean)) return prev;
      const updated = [...prev, clean];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('watchlist_updated'));
      return updated;
    });

    // If authenticated, persist to MongoDB
    if (isAuthenticated) {
      try {
        const remoteUpdated = await userDataService.addToWatchlist(clean);
        if (Array.isArray(remoteUpdated)) {
          setWatchlist(remoteUpdated);
          localStorage.setItem(WATCHLIST_KEY, JSON.stringify(remoteUpdated));
        }
      } catch (err) {
        console.error("Failed to save stock to MongoDB watchlist:", err);
      }
    }
  }, [isAuthenticated]);

  const removeStock = useCallback(async (ticker) => {
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;

    setWatchlist((prev) => {
      if (!prev.includes(clean)) return prev;
      const updated = prev.filter((t) => t !== clean);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('watchlist_updated'));
      return updated;
    });

    // If authenticated, delete from MongoDB
    if (isAuthenticated) {
      try {
        const remoteUpdated = await userDataService.removeFromWatchlist(clean);
        if (Array.isArray(remoteUpdated)) {
          setWatchlist(remoteUpdated);
          localStorage.setItem(WATCHLIST_KEY, JSON.stringify(remoteUpdated));
        }
      } catch (err) {
        console.error("Failed to remove stock from MongoDB watchlist:", err);
      }
    }
  }, [isAuthenticated]);

  const isInWatchlist = useCallback((ticker) => {
    const clean = ticker.trim().toUpperCase();
    return watchlist.includes(clean);
  }, [watchlist]);

  return {
    watchlist,
    addStock,
    removeStock,
    isInWatchlist,
    isSynced: isAuthenticated
  };
}
