import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userDataService } from '../services/api.js';

const AuthContext = createContext(undefined);

export const TOKEN_KEY = 'marketpulse_token';
export const USER_KEY = 'marketpulse_user';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Verify session on app mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      } catch (err) {
        // Session invalid / expired
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();

    // Trigger watchlist sync with any existing local watchlist
    try {
      const localWatchlistStr = localStorage.getItem('marketpulse_watchlist');
      if (localWatchlistStr) {
        const localList = JSON.parse(localWatchlistStr);
        if (Array.isArray(localList) && localList.length > 0) {
          await userDataService.syncWatchlist(localList);
        }
      }
    } catch {
      // Non-fatal sync
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    const data = await authService.register({
      name,
      email,
      password,
      confirm_password: confirmPassword
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();

    // Trigger watchlist sync
    try {
      const localWatchlistStr = localStorage.getItem('marketpulse_watchlist');
      if (localWatchlistStr) {
        const localList = JSON.parse(localWatchlistStr);
        if (Array.isArray(localList) && localList.length > 0) {
          await userDataService.syncWatchlist(localList);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('auth_logged_out'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        logout,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
