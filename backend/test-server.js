import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';

async function runTests() {
  console.log('🧪 Starting MarketPulse MERN Backend Integration Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
      if (err.response?.data) {
        console.error('   Server Response:', JSON.stringify(err.response.data));
      }
      failed++;
    }
  }

  // 1. Health check
  await test('GET /health returns healthy status', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.data.status !== 'healthy') throw new Error(`Unexpected status: ${res.data.status}`);
  });

  // 2. Indices
  await test('GET /api/market/indices returns major indices', async () => {
    const res = await axios.get(`${BASE_URL}/api/market/indices`);
    if (res.data.status !== 'success' || !Array.isArray(res.data.data)) throw new Error('Invalid response structure');
    if (res.data.data.length < 3) throw new Error(`Expected at least 3 indices, got ${res.data.data.length}`);
  });

  // 3. VIX Outlook
  await test('GET /api/market/vix-outlook returns expected range and bounds', async () => {
    const res = await axios.get(`${BASE_URL}/api/market/vix-outlook`);
    if (res.data.status !== 'success') throw new Error('Status not success');
    const { vix, nifty_level, lower_bound, upper_bound } = res.data.data;
    if (!vix || !nifty_level || !lower_bound || !upper_bound) throw new Error('Missing VIX calculation fields');
    if (lower_bound >= upper_bound) throw new Error(`Invalid bounds: ${lower_bound} >= ${upper_bound}`);
  });

  // 4. Movers
  await test('GET /api/market/movers returns gainers and losers', async () => {
    const res = await axios.get(`${BASE_URL}/api/market/movers`);
    if (res.data.status !== 'success' || !res.data.data.gainers || !res.data.data.losers) {
      throw new Error('Missing gainers or losers in movers response');
    }
  });

  // 5. Quote
  await test('GET /api/market/quote/RELIANCE returns quote data', async () => {
    const res = await axios.get(`${BASE_URL}/api/market/quote/RELIANCE`);
    if (res.data.status !== 'success' || !res.data.data.current_price) {
      throw new Error('Missing price in quote');
    }
  });

  // 6. Search
  await test('GET /api/search?q=INFY finds Infosys', async () => {
    const res = await axios.get(`${BASE_URL}/api/search?q=INFY`);
    if (res.data.status !== 'success' || !Array.isArray(res.data.results) || res.data.results.length === 0) {
      throw new Error('Search failed to return results');
    }
    const match = res.data.results.find(r => r.symbol === 'INFY');
    if (!match) throw new Error('INFY not found in search results');
  });

  // 7. News
  await test('GET /api/news/latest returns financial news headlines', async () => {
    const res = await axios.get(`${BASE_URL}/api/news/latest`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('No news returned');
    if (!res.data[0].title) throw new Error('News item missing title');
  });

  // 8. Corporate actions stock
  await test('GET /api/corporate-actions/stock/INFY returns dividends and buybacks', async () => {
    const res = await axios.get(`${BASE_URL}/api/corporate-actions/stock/INFY`);
    if (!res.data.symbol || typeof res.data.dividends_count !== 'number') {
      throw new Error('Invalid corporate actions payload');
    }
  });

  // 9. IPOs
  await test('GET /api/corporate-actions/ipos returns mainline and SME IPOs', async () => {
    const res = await axios.get(`${BASE_URL}/api/corporate-actions/ipos`);
    if (!res.data.mainline || !res.data.sme || !res.data.summary) {
      throw new Error('Invalid IPO structure');
    }
  });

  // 10. Authentication flow
  const testEmail = `mern_user_${Date.now()}@example.com`;
  let authToken = null;
  let authUserId = null;

  await test('POST /api/auth/register creates new account and returns token', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'MERN Test User',
      email: testEmail,
      password: 'password123',
      confirm_password: 'password123'
    });
    if (res.data.status !== 'success' || !res.data.data.token) {
      throw new Error('Registration failed to return token');
    }
    authToken = res.data.data.token;
    authUserId = res.data.data.user.id;
  });

  await test('POST /api/auth/register prevents duplicate email', async () => {
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        name: 'Duplicate',
        email: testEmail,
        password: 'password123',
        confirm_password: 'password123'
      });
      throw new Error('Should have rejected duplicate email');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await test('POST /api/auth/login authenticates registered user', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    if (res.data.status !== 'success' || !res.data.data.token) {
      throw new Error('Login failed to return token');
    }
    authToken = res.data.data.token;
  });

  await test('GET /api/auth/me returns current user profile with token', async () => {
    const res = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.data.status !== 'success' || res.data.data.email !== testEmail) {
      throw new Error('Failed to retrieve current user');
    }
  });

  // 11. User Watchlist persistence
  await test('GET /api/watchlist returns user persistent watchlist', async () => {
    const res = await axios.get(`${BASE_URL}/api/watchlist`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.data.status !== 'success' || !Array.isArray(res.data.data)) {
      throw new Error('Watchlist not returned as array');
    }
  });

  await test('POST /api/watchlist adds ticker to persistent watchlist', async () => {
    const res = await axios.post(`${BASE_URL}/api/watchlist`, { ticker: 'ZOMATO' }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.data.data.includes('ZOMATO')) {
      throw new Error('ZOMATO was not found in returned watchlist');
    }
  });

  await test('DELETE /api/watchlist/ZOMATO removes ticker from watchlist', async () => {
    const res = await axios.delete(`${BASE_URL}/api/watchlist/ZOMATO`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.data.data.includes('ZOMATO')) {
      throw new Error('ZOMATO was not removed from watchlist');
    }
  });

  // 12. User Preferences persistence
  await test('PUT /api/user/preferences updates user settings', async () => {
    const res = await axios.put(`${BASE_URL}/api/user/preferences`, {
      settings: { theme: 'dark', chartInterval: '1wk', autoRefresh: false }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.data.data.chartInterval !== '1wk') {
      throw new Error('Preference update failed');
    }
  });

  // 13. LLM 5-day chart analysis
  await test('POST /api/llm/analyze-5day-chart calculates next-day pivot and range', async () => {
    const res = await axios.post(`${BASE_URL}/api/llm/analyze-5day-chart`, {
      ticker: 'TCS',
      user_query: 'Forecast next day'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.data.status !== 'success') throw new Error('Analysis status not success');
    const d = res.data.data;
    if (!d.tentative_next_day_value || !d.tentative_next_day_range) {
      throw new Error('Missing next day forecast values');
    }
  });

  // 14. LLM Quarterly results comparison
  await test('POST /api/llm/analyze-results handles quarterly comparison query', async () => {
    const res = await axios.post(`${BASE_URL}/api/llm/analyze-results`, {
      ticker: 'RELIANCE',
      results_details: 'compare q1 results of 2025 and 2026'
    });
    if (res.data.status !== 'success' || !res.data.data.exact_table) {
      throw new Error('Failed to return exact quarterly comparison table');
    }
  });

  // 15. Portfolio Simulate
  await test('POST /api/market/portfolio-simulate calculates sector allocations and stress tests', async () => {
    const res = await axios.post(`${BASE_URL}/api/market/portfolio-simulate`, {
      holdings: [
        { ticker: 'TCS', quantity: 10 },
        { ticker: 'INFY', quantity: 15 },
        { ticker: 'HDFCBANK', quantity: 20 }
      ]
    });
    if (res.data.status !== 'success' || !res.data.data.stress_tests) {
      throw new Error('Failed to simulate portfolio');
    }
    if (res.data.data.stress_tests.length < 3) {
      throw new Error('Expected at least 3 stress test scenarios');
    }
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
