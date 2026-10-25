import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token automatically to all requests if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('marketpulse_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const searchService = {
  searchEquities: async (query) => {
    try {
      const { data } = await api.get(`/search/?q=${encodeURIComponent(query)}`);
      return data.results || [];
    } catch (error) {
      console.error("Search error", error);
      return [];
    }
  },
  search: async (query) => {
    return searchService.searchEquities(query);
  }
};

export const marketService = {
  getQuote: async (ticker) => {
    try {
      const { data } = await api.get(`/market/quote/${ticker}`);
      return data.data;
    } catch (error) {
      console.error("Quote fetch error", error);
      throw error;
    }
  },

  getHistory: async (ticker, interval = '1d', period = '1mo') => {
    try {
      const { data } = await api.get(`/market/history/${ticker}?interval=${interval}&period=${period}`);
      return data.data || [];
    } catch (error) {
      console.error("History fetch error", error);
      throw error;
    }
  },

  getIndex: async (indexName) => {
    try {
      const { data } = await api.get(`/market/index/${indexName}`);
      return data.data;
    } catch (error) {
      console.error(`Index ${indexName} fetch error`, error);
      throw error;
    }
  },

  getIndices: async () => {
    try {
      const { data } = await api.get('/market/indices');
      return data.data || [];
    } catch (error) {
      console.error("Indices fetch error", error);
      return [];
    }
  },

  getMovers: async () => {
    try {
      const { data } = await api.get('/market/movers');
      return data.data || { gainers: [], losers: [] };
    } catch (error) {
      console.error("Movers fetch error", error);
      return { gainers: [], losers: [] };
    }
  },

  getSectors: async () => {
    try {
      const { data } = await api.get('/market/sectors');
      return data.data || [];
    } catch (error) {
      console.error("Sectors fetch error", error);
      return [];
    }
  },

  getSectorConstituents: async (sectorId) => {
    try {
      const { data } = await api.get(`/market/sectors/${sectorId}`);
      return data.data || [];
    } catch (error) {
      console.error(`Sector ${sectorId} fetch error`, error);
      return [];
    }
  },

  getPeers: async (ticker) => {
    try {
      const { data } = await api.get(`/market/peers/${ticker}`);
      return data.data || [];
    } catch (error) {
      console.error(`Peers for ${ticker} fetch error`, error);
      return [];
    }
  },

  getVixOutlook: async () => {
    try {
      const { data } = await api.get('/market/vix-outlook');
      return data.data;
    } catch (error) {
      console.error("VIX outlook fetch error", error);
      return null;
    }
  }
};

export const newsService = {
  getLatest: async () => {
    try {
      const { data } = await api.get('/news/latest');
      return data || [];
    } catch (error) {
      console.error("News fetch error", error);
      return [];
    }
  },

  searchNews: async (query) => {
    try {
      const { data } = await api.get(`/news/search?query=${encodeURIComponent(query)}`);
      return data || [];
    } catch (error) {
      console.error("News search error", error);
      return [];
    }
  }
};

export const llmService = {
  analyzeChart: async (formData) => {
    try {
      const { data } = await api.post('/llm/analyze-chart', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data.data || data;
    } catch (error) {
      console.error("Chart analysis error", error);
      throw error;
    }
  },

  analyzeFiveDayChart: async (params) => {
    try {
      const { data } = await api.post('/llm/analyze-5day-chart', params);
      return data.data || data;
    } catch (error) {
      console.error("5-day chart analysis error", error);
      throw error;
    }
  },

  analyzeNews: async (ticker, headlines) => {
    try {
      const { data } = await api.post('/llm/analyze-news', { ticker, headlines });
      return data.data || data;
    } catch (error) {
      console.error("News analysis error", error);
      throw error;
    }
  },

  analyzeResults: async (ticker, resultsDetails) => {
    try {
      const { data } = await api.post('/llm/analyze-results', { ticker, results_details: resultsDetails });
      return data.data || data;
    } catch (error) {
      console.error("Results analysis error", error);
      throw error;
    }
  },

  getPortfolioDiagnostic: async (portfolioData, provider = "groq", apiKey) => {
    try {
      const { data } = await api.post('/llm/portfolio-diagnostic', {
        portfolio_data: portfolioData,
        provider,
        api_key: apiKey
      });
      return data.data || data;
    } catch (error) {
      console.error("Portfolio diagnostic error", error);
      throw error;
    }
  }
};

export const portfolioService = {
  getSamples: async () => {
    try {
      const { data } = await api.get('/market/portfolio/samples');
      return data.data || {};
    } catch (error) {
      console.error("Portfolio samples error", error);
      return {};
    }
  },

  simulate: async (holdings) => {
    try {
      const { data } = await api.post('/market/portfolio-simulate', { holdings });
      return data.data;
    } catch (error) {
      console.error("Portfolio simulation error", error);
      throw error;
    }
  }
};

export const compareService = {
  compare: async (tickers) => {
    try {
      const { data } = await api.get(`/market/compare?tickers=${encodeURIComponent(tickers.join(','))}`);
      return data.data || [];
    } catch (error) {
      console.error("Stock comparison error", error);
      throw error;
    }
  }
};

export const screenerService = {
  run: async (filterType) => {
    try {
      const { data } = await api.get(`/market/screener?filter_type=${encodeURIComponent(filterType)}`);
      return data.data || [];
    } catch (error) {
      console.error("Screener fetch error", error);
      return [];
    }
  }
};

export const corporateActionsService = {
  getStockActions: async (symbol) => {
    try {
      const { data } = await api.get(`/corporate-actions/stock/${encodeURIComponent(symbol)}`);
      return data;
    } catch (error) {
      console.error(`Corporate actions for ${symbol} fetch error`, error);
      return null;
    }
  },

  getUpcomingActions: async (fromDate, toDate) => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const { data } = await api.get(`/corporate-actions/upcoming${queryString}`);
      return data;
    } catch (error) {
      console.error("Upcoming corporate actions fetch error", error);
      return null;
    }
  },

  getIPOs: async () => {
    try {
      const { data } = await api.get('/corporate-actions/ipos');
      return data;
    } catch (error) {
      console.error("IPO tracker fetch error", error);
      return null;
    }
  }
};

export const authService = {
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },

  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return data.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.data;
  }
};

export const userDataService = {
  getWatchlist: async () => {
    const { data } = await api.get('/watchlist');
    return data.data || [];
  },

  addToWatchlist: async (ticker) => {
    const { data } = await api.post('/watchlist', { ticker });
    return data.data || [];
  },

  removeFromWatchlist: async (ticker) => {
    const { data } = await api.delete(`/watchlist/${encodeURIComponent(ticker)}`);
    return data.data || [];
  },

  syncWatchlist: async (tickers) => {
    const { data } = await api.post('/user/watchlist/sync', { tickers });
    return data.data || [];
  },

  getPreferences: async () => {
    const { data } = await api.get('/user/preferences');
    return data.data || {};
  },

  updatePreferences: async (settings) => {
    const { data } = await api.put('/user/preferences', { settings });
    return data.data || {};
  },

  getAnalysisHistory: async (limit = 20) => {
    const { data } = await api.get(`/user/analysis-history?limit=${limit}`);
    return data.data || [];
  },

  deleteAnalysisRecord: async (recordId) => {
    const { data } = await api.delete(`/user/analysis-history/${recordId}`);
    return data;
  }
};
