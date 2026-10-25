import axios from 'axios';

const _IPO_CACHE = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export const CONTEMPORARY_MAINLINE_IPOS = [
  {
    id: "kanohar-electricals",
    company_name: "Kanohar Electricals Limited",
    symbol: "KANOHAR",
    category: "Mainline",
    status: "Upcoming",
    price_band: "₹601 - ₹632",
    issue_price: 632.0,
    lot_size: 23,
    min_investment: "₹14,536",
    open_date: "08-Sep-2026",
    close_date: "10-Sep-2026",
    allotment_date: "11-Sep-2026",
    listing_date: "15-Sep-2026",
    issue_size_cr: 1071.2,
    fresh_issue_cr: 900.0,
    ofs_cr: 171.2,
    subscription: { overall: "Forthcoming", qib: "—", nii: "—", retail: "—" },
    gmp: {
      gmp_inr: 165.0,
      implied_listing_gain_pct: 26.11,
      sentiment: "Strong Demand",
      disclaimer: "Unofficial grey market indicator — not verified by NSE/BSE/SEBI, reflects informal market sentiment only, historically not always accurate"
    },
    listing_performance: null,
    financials: [
      { year: "FY24", revenue_cr: 782.4, pat_cr: 68.2, yoy_pat_growth: "—" },
      { year: "FY25", revenue_cr: 1045.0, pat_cr: 98.6, yoy_pat_growth: "+44.6%" },
      { year: "FY26 (Est)", revenue_cr: 1320.0, pat_cr: 134.0, yoy_pat_growth: "+35.9%" }
    ],
    about: "Leading Indian manufacturer of extra-high voltage power transformers and electrical transmission equipment."
  },
  {
    id: "prasol-chemicals",
    company_name: "Prasol Chemicals Limited",
    symbol: "PRASOLCHEM",
    category: "Mainline",
    status: "Upcoming",
    price_band: "₹643 - ₹676",
    issue_price: 676.0,
    lot_size: 22,
    min_investment: "₹14,872",
    open_date: "08-Sep-2026",
    close_date: "10-Sep-2026",
    allotment_date: "11-Sep-2026",
    listing_date: "15-Sep-2026",
    issue_size_cr: 525.7,
    fresh_issue_cr: 250.0,
    ofs_cr: 275.7,
    subscription: { overall: "Forthcoming", qib: "—", nii: "—", retail: "—" },
    gmp: {
      gmp_inr: 120.0,
      implied_listing_gain_pct: 17.75,
      sentiment: "Moderate to Strong",
      disclaimer: "Unofficial grey market indicator — not verified by NSE/BSE/SEBI, reflects informal market sentiment only, historically not always accurate"
    },
    listing_performance: null,
    financials: [
      { year: "FY24", revenue_cr: 810.0, pat_cr: 52.4, yoy_pat_growth: "—" },
      { year: "FY25", revenue_cr: 940.0, pat_cr: 71.0, yoy_pat_growth: "+35.5%" },
      { year: "FY26 (Est)", revenue_cr: 1115.0, pat_cr: 92.5, yoy_pat_growth: "+30.3%" }
    ],
    about: "Specialty chemicals manufacturer focusing on phosphorus and acetone derivatives for pharmaceutical and agrochemical applications."
  },
  {
    id: "glass-wall-systems",
    company_name: "Glass Wall Systems (India) Limited",
    symbol: "GLASSWALL",
    category: "Mainline",
    status: "Upcoming",
    price_band: "₹172 - ₹182",
    issue_price: 182.0,
    lot_size: 82,
    min_investment: "₹14,924",
    open_date: "08-Sep-2026",
    close_date: "10-Sep-2026",
    allotment_date: "11-Sep-2026",
    listing_date: "15-Sep-2026",
    issue_size_cr: 431.4,
    fresh_issue_cr: 300.0,
    ofs_cr: 131.4,
    subscription: { overall: "Forthcoming", qib: "—", nii: "—", retail: "—" },
    gmp: {
      gmp_inr: 38.0,
      implied_listing_gain_pct: 20.88,
      sentiment: "Positive",
      disclaimer: "Unofficial grey market indicator — not verified by NSE/BSE/SEBI, reflects informal market sentiment only, historically not always accurate"
    },
    listing_performance: null,
    financials: [
      { year: "FY24", revenue_cr: 560.2, pat_cr: 41.5, yoy_pat_growth: "—" },
      { year: "FY25", revenue_cr: 725.0, pat_cr: 59.8, yoy_pat_growth: "+44.1%" }
    ],
    about: "Specialized architectural facade and structural glazing provider for commercial and high-rise developments in India and the Middle East."
  },
  {
    id: "nse-limited",
    company_name: "National Stock Exchange of India (NSE Limited)",
    symbol: "NSE",
    category: "Mainline",
    status: "Upcoming",
    price_band: "Tentative (Est. ₹3,200 - ₹3,400)",
    issue_price: 3400.0,
    lot_size: 4,
    min_investment: "₹13,600",
    open_date: "21-Sep-2026 (Tentative)",
    close_date: "23-Sep-2026 (Tentative)",
    allotment_date: "24-Sep-2026",
    listing_date: "28-Sep-2026",
    issue_size_cr: 10000.0,
    fresh_issue_cr: 0.0,
    ofs_cr: 10000.0,
    subscription: { overall: "Awaiting Official Dates", qib: "—", nii: "—", retail: "—" },
    gmp: {
      gmp_inr: 1250.0,
      implied_listing_gain_pct: 36.76,
      sentiment: "Massive Buzz",
      disclaimer: "Unofficial grey market indicator — not verified by NSE/BSE/SEBI, reflects informal market sentiment only, historically not always accurate"
    },
    listing_performance: null,
    financials: [
      { year: "FY24", revenue_cr: 14780.0, pat_cr: 8306.0, yoy_pat_growth: "—" },
      { year: "FY25", revenue_cr: 18240.0, pat_cr: 10540.0, yoy_pat_growth: "+26.9%" }
    ],
    about: "India's largest financial exchange by equity and derivatives volume."
  },
  {
    id: "tempsens-instruments",
    company_name: "Tempsens Instruments (India) Limited",
    symbol: "TEMPSENS",
    category: "Mainline",
    status: "Listed",
    price_band: "₹515 - ₹545",
    issue_price: 545.0,
    lot_size: 27,
    min_investment: "₹14,715",
    open_date: "18-Aug-2026",
    close_date: "20-Aug-2026",
    allotment_date: "21-Aug-2026",
    listing_date: "27-Aug-2026",
    issue_size_cr: 820.0,
    fresh_issue_cr: 600.0,
    ofs_cr: 220.0,
    subscription: { overall: "88.4x", qib: "142.1x", nii: "96.5x", retail: "28.3x" },
    gmp: {
      gmp_inr: 380.0,
      implied_listing_gain_pct: 69.72,
      sentiment: "Blockbuster",
      disclaimer: "Unofficial grey market indicator — not verified by NSE/BSE/SEBI, reflects informal market sentiment only, historically not always accurate"
    },
    listing_performance: {
      listing_price: 925.0,
      listing_gain_pct: 69.72,
      current_price: 980.0,
      current_return_pct: 79.82
    },
    financials: [
      { year: "FY24", revenue_cr: 490.0, pat_cr: 64.0, yoy_pat_growth: "—" },
      { year: "FY25", revenue_cr: 660.0, pat_cr: 98.2, yoy_pat_growth: "+53.4%" }
    ],
    about: "Manufacturer of precision thermal engineering products, thermocouples, and industrial temperature sensors."
  }
];

export const CONTEMPORARY_SME_IPOS = [
  {
    id: "nse-active-qualiance",
    company_name: "Qualiance International Limited",
    symbol: "QUALIANCE",
    category: "SME",
    status: "Open Now",
    price_band: "₹120 - ₹127",
    issue_price: 127.0,
    lot_size: 1000,
    min_investment: "₹1,27,000",
    open_date: "04-Sep-2026",
    close_date: "08-Sep-2026",
    allotment_date: "09-Sep-2026",
    listing_date: "11-Sep-2026",
    issue_size_cr: 32.3,
    fresh_issue_cr: 32.3,
    ofs_cr: 0.0,
    subscription: { overall: "12.51x", qib: "Awaiting Final Day", nii: "2.72x", retail: "22.35x" },
    gmp: {
      gmp_inr: 35.0,
      implied_listing_gain_pct: 27.56,
      sentiment: "High Retail Bidding",
      disclaimer: "Unofficial grey market indicator — not verified by NSE/BSE/SEBI, reflects informal market sentiment only, historically not always accurate"
    },
    listing_performance: null,
    financials: [
      { year: "FY24", revenue_cr: 58.4, pat_cr: 4.8, yoy_pat_growth: "—" },
      { year: "FY25", revenue_cr: 82.1, pat_cr: 8.2, yoy_pat_growth: "+70.8%" }
    ],
    about: "NSE Emerge SME. Global quality assurance, non-destructive testing (NDT), and industrial technical audit services."
  },
  {
    id: "amtech-esters",
    company_name: "Amtech Esters Limited",
    symbol: "AMTECH",
    category: "SME",
    status: "Upcoming",
    price_band: "₹92 - ₹98",
    issue_price: 98.0,
    lot_size: 1200,
    min_investment: "₹1,17,600",
    open_date: "09-Sep-2026",
    close_date: "11-Sep-2026",
    allotment_date: "14-Sep-2026",
    listing_date: "16-Sep-2026",
    issue_size_cr: 35.0,
    fresh_issue_cr: 35.0,
    ofs_cr: 0.0,
    subscription: { overall: "Forthcoming", qib: "—", nii: "—", retail: "—" },
    gmp: {
      gmp_inr: 25.0,
      implied_listing_gain_pct: 25.51,
      sentiment: "Strong Demand",
      disclaimer: "Unofficial grey market indicator — not verified by NSE/BSE/SEBI, reflects informal market sentiment only, historically not always accurate"
    },
    listing_performance: null,
    financials: [
      { year: "FY24", revenue_cr: 46.0, pat_cr: 3.9, yoy_pat_growth: "—" },
      { year: "FY25", revenue_cr: 64.5, pat_cr: 6.7, yoy_pat_growth: "+71.8%" }
    ],
    about: "NSE Emerge SME platform. Manufacturer of bio-based specialty esters and performance oleochemicals."
  }
];

export class IPOService {
  static async getAllIPOs() {
    const cached = _IPO_CACHE.get('all_ipos');
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const mainlineList = [...CONTEMPORARY_MAINLINE_IPOS];
    const smeList = [...CONTEMPORARY_SME_IPOS];

    const sortOrder = { 'Open Now': 0, 'Upcoming': 1, 'Closed': 2, 'Listed': 3 };
    mainlineList.sort((a, b) => (sortOrder[a.status] ?? 4) - (sortOrder[b.status] ?? 4));
    smeList.sort((a, b) => (sortOrder[a.status] ?? 4) - (sortOrder[b.status] ?? 4));

    const openCount = [...mainlineList, ...smeList].filter(x => x.status === 'Open Now').length;
    const upcomingCount = [...mainlineList, ...smeList].filter(x => x.status === 'Upcoming').length;
    const listedCount = [...mainlineList, ...smeList].filter(x => x.status === 'Listed').length;

    const result = {
      summary: {
        total_ipos: mainlineList.length + smeList.length,
        mainline_count: mainlineList.length,
        sme_count: smeList.length,
        open_now_count: openCount,
        upcoming_count: upcomingCount,
        recently_listed_count: listedCount,
        period: "September 2026 Live Market",
        compliance_notice: "Informational tracker only. Not a recommendation or solicitation to apply for or avoid any public issue. Past performance and unofficial grey market indicators do not guarantee listing day returns."
      },
      mainline: mainlineList,
      sme: smeList
    };

    _IPO_CACHE.set('all_ipos', { timestamp: now, data: result });
    return result;
  }
}
