import { marketDataService, SECTORS } from './marketDataService.js';

export const SAMPLE_PORTFOLIOS = {
  tech_growth: {
    name: "Tech & Enterprise Growth",
    description: "High-growth consumer and software export companies",
    holdings: [
      { ticker: "ITC", quantity: 500 },
      { ticker: "INFY", quantity: 50 },
      { ticker: "TCS", quantity: 25 },
      { ticker: "PAYTM", quantity: 100 }
    ]
  },
  banking_titans: {
    name: "Banking & Financial Titans",
    description: "India largest private, public banks and consumer financiers",
    holdings: [
      { ticker: "HDFCBANK", quantity: 100 },
      { ticker: "ICICIBANK", quantity: 120 },
      { ticker: "SBIN", quantity: 150 },
      { ticker: "BAJFINANCE", quantity: 20 }
    ]
  },
  india_capex: {
    name: "India Capex & PSU Powerhouse",
    description: "Defense, infrastructure, and energy heavyweights driving national capex",
    holdings: [
      { ticker: "LT", quantity: 30 },
      { ticker: "HAL", quantity: 25 },
      { ticker: "BEL", quantity: 200 },
      { ticker: "NTPC", quantity: 250 },
      { ticker: "COALINDIA", quantity: 200 }
    ]
  }
};

export const SCENARIOS = {
  rbi_rate_hike: {
    id: "rbi_rate_hike",
    title: "RBI Repo Rate Hike (+50 bps)",
    description: "Simulates borrowing cost increases across consumer auto, home loans, and corporate debt.",
    sector_impact: {
      realty: -4.5,
      auto: -3.2,
      infra: -2.8,
      metals: -2.2,
      banking: -1.2,
      fmcg: -0.8,
      energy: -0.5,
      it: 0.0,
      pharma: 0.0,
      defense: 0.0,
      telecom: -0.5,
      psu: -1.0
    }
  },
  crude_oil_spike: {
    id: "crude_oil_spike",
    title: "Crude Oil Spikes to $95/barrel",
    description: "Simulates imported inflation, fuel price pressure, and input cost surge.",
    sector_impact: {
      energy: 4.5,
      auto: -3.5,
      fmcg: -2.2,
      infra: -2.5,
      banking: -1.5,
      realty: -1.8,
      metals: -1.0,
      it: 0.0,
      pharma: -0.5,
      defense: 0.0,
      telecom: -0.5,
      psu: 1.5
    }
  },
  fii_selloff: {
    id: "fii_selloff",
    title: "FII Capital Flight (-5.0% Market Drawdown)",
    description: "Simulates sharp foreign institutional outflows distributed according to stock beta.",
    base_market_drop: -5.0
  }
};

export class PortfolioService {
  findSectorForTicker(ticker) {
    const norm = marketDataService.normalizeTicker(ticker);
    for (const [secId, secData] of Object.entries(SECTORS)) {
      if (secData.tickers.includes(norm)) {
        return [secId, secData.name];
      }
    }
    return ["other", "Other / Diversified"];
  }

  async analyzePortfolio(holdings) {
    const enrichedHoldings = [];
    let totalValue = 0.0;

    for (const item of holdings || []) {
      const rawSym = (item.ticker || '').trim().toUpperCase();
      const qty = parseFloat(item.quantity) || 0;
      if (!rawSym || qty <= 0) continue;

      const quote = await marketDataService.getQuote(rawSym);
      const price = quote.current_price || 100.0;
      const name = quote.shortName || rawSym;
      const [secId, secName] = this.findSectorForTicker(rawSym);
      const val = Math.round(price * qty * 100) / 100;
      totalValue += val;

      enrichedHoldings.append ? null : enrichedHoldings.push({
        ticker: rawSym,
        name,
        quantity: qty,
        current_price: price,
        total_value: val,
        sector_id: secId,
        sector_name: secName,
        change_percent: quote.change_percent || 0.0
      });
    }

    if (totalValue <= 0) {
      return {
        total_value: 0.0,
        holdings: [],
        sector_allocation: [],
        portfolio_beta: 1.0,
        stress_tests: []
      };
    }

    const sectorTotals = {};
    for (const h of enrichedHoldings) {
      const w = Math.round((h.total_value / totalValue) * 10000) / 100;
      h.weight_percent = w;
      const secId = h.sector_id;
      if (!sectorTotals[secId]) {
        sectorTotals[secId] = {
          sector_id: secId,
          sector_name: h.sector_name,
          value: 0.0,
          count: 0
        };
      }
      sectorTotals[secId].value += h.total_value;
      sectorTotals[secId].count += 1;
    }

    const sectorAllocation = [];
    for (const [sId, sData] of Object.entries(sectorTotals)) {
      const pct = Math.round((sData.value / totalValue) * 10000) / 100;
      sectorAllocation.push({
        sector_id: sId,
        sector_name: sData.sector_name,
        value: Math.round(sData.value * 100) / 100,
        weight_percent: pct,
        stock_count: sData.count
      });
    }

    sectorAllocation.sort((a, b) => b.weight_percent - a.weight_percent);

    const weightedBeta = 1.0;
    const concentrationWarnings = [];
    if (sectorAllocation.length > 0 && sectorAllocation[0].weight_percent > 40.0) {
      const topSec = sectorAllocation[0];
      concentrationWarnings.push(
        `High sector concentration: ${topSec.weight_percent}% of your portfolio is in ${topSec.sector_name}.`
      );
    }

    const stressResults = [];
    for (const [scKey, sc] of Object.entries(SCENARIOS)) {
      let impactPct = 0.0;
      if (scKey === 'fii_selloff') {
        impactPct = Math.round(sc.base_market_drop * weightedBeta * 100) / 100;
      } else {
        const sectorImpacts = sc.sector_impact || {};
        for (const s of sectorAllocation) {
          const factor = sectorImpacts[s.sector_id] ?? -1.0;
          impactPct += (s.weight_percent / 100.0) * factor;
        }
        impactPct = Math.round(impactPct * 100) / 100;
      }

      const valueChange = Math.round(((totalValue * impactPct) / 100.0) * 100) / 100;
      stressResults.push({
        scenario_id: scKey,
        title: sc.title,
        description: sc.description,
        estimated_impact_percent: impactPct,
        estimated_value_change: valueChange,
        estimated_new_value: Math.round((totalValue + valueChange) * 100) / 100
      });
    }

    return {
      total_value: Math.round(totalValue * 100) / 100,
      holdings: enrichedHoldings,
      sector_allocation: sectorAllocation,
      portfolio_beta: Math.round(weightedBeta * 100) / 100,
      concentration_warnings: concentrationWarnings,
      stress_tests: stressResults
    };
  }
}

export const portfolioService = new PortfolioService();
