import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const searchService = {
  searchEquities: async (query: string) => {
    try {
      const { data } = await api.get(`/search/?q=${encodeURIComponent(query)}`);
      return data.results || [];
    } catch (error) {
      console.error("Search error", error);
      return [];
    }
  },
  search: async (query: string) => {
    return searchService.searchEquities(query);
  }
};

export const marketService = {
  getQuote: async (ticker: string) => {
    try {
      const { data } = await api.get(`/market/quote/${ticker}`);
      return data.data;
    } catch (error) {
      console.error("Quote fetch error", error);
      throw error;
    }
  },

  getHistory: async (ticker: string, interval: string = '1d', period: string = '1mo') => {
    try {
      const { data } = await api.get(`/market/history/${ticker}?interval=${interval}&period=${period}`);
      return data.data || [];
    } catch (error) {
      console.error("History fetch error", error);
      throw error;
    }
  },

  getIndex: async (indexName: string) => {
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

  getSectorConstituents: async (sectorId: string) => {
    try {
      const { data } = await api.get(`/market/sectors/${sectorId}`);
      return data.data || [];
    } catch (error) {
      console.error(`Sector ${sectorId} fetch error`, error);
      return [];
    }
  },

  getPeers: async (ticker: string) => {
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

  searchNews: async (query: string) => {
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
  analyzeChart: async (formData: FormData) => {
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

  analyzeFiveDayChart: async (params: { ticker: string; user_query?: string; provider?: string; api_key?: string }) => {
    try {
      const { data } = await api.post('/llm/analyze-5day-chart', params);
      return data.data || data;
    } catch (error) {
      console.error("5-day chart analysis error", error);
      throw error;
    }
  },

  analyzeNews: async (ticker: string, headlines: string[]) => {
    try {
      const { data } = await api.post('/llm/analyze-news', { ticker, headlines });
      return data.data || data;
    } catch (error) {
      console.error("News analysis error", error);
      throw error;
    }
  },

  analyzeResults: async (ticker: string, resultsDetails: string) => {
    try {
      const { data } = await api.post('/llm/analyze-results', { ticker, results_details: resultsDetails });
      return data.data || data;
    } catch (error) {
      console.error("Results analysis error", error);
      throw error;
    }
  },

  getPortfolioDiagnostic: async (portfolioData: any, provider = "deepseek", apiKey?: string) => {
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

  simulate: async (holdings: Array<{ ticker: string; quantity: number }>) => {
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
  compare: async (tickers: string[]) => {
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
  run: async (filterType: string) => {
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
  getStockActions: async (symbol: string) => {
    try {
      const { data } = await api.get(`/corporate-actions/stock/${encodeURIComponent(symbol)}`);
      return data;
    } catch (error) {
      console.error(`Corporate actions for ${symbol} fetch error`, error);
      return null;
    }
  },

  getUpcomingActions: async (fromDate?: string, toDate?: string) => {
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