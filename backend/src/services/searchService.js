import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, '../../data/EQUITY_L.csv');

// Supplemental listings for popular or newly listed stocks
const SUPPLEMENTAL_EQUITIES = [
  { symbol: "ETERNAL", name: "Eternal Materials / Eternal Hospital Limited", isin: "INE000ETRNL1", series: "EQ" },
  { symbol: "ZOMATO", name: "Zomato Limited", isin: "INE758T01015", series: "EQ" },
  { symbol: "PAYTM", name: "One 97 Communications Limited (Paytm)", isin: "INE982J01020", series: "EQ" },
  { symbol: "JIOFIN", name: "Jio Financial Services Limited", isin: "INE758E01017", series: "EQ" },
  { symbol: "NYKAA", name: "FSN E-Commerce Ventures Limited (Nykaa)", isin: "INE388Y01029", series: "EQ" },
  { symbol: "SWIGGY", name: "Swiggy Limited", isin: "INE00H001014", series: "EQ" },
  { symbol: "TATASTEEL", name: "Tata Steel Limited", isin: "INE081A01020", series: "EQ" },
  { symbol: "RELIANCE", name: "Reliance Industries Limited", isin: "INE002A01018", series: "EQ" },
  { symbol: "TCS", name: "Tata Consultancy Services Limited", isin: "INE467B01029", series: "EQ" },
  { symbol: "INFY", name: "Infosys Limited", isin: "INE009A01021", series: "EQ" },
  { symbol: "HDFCBANK", name: "HDFC Bank Limited", isin: "INE040A01034", series: "EQ" },
  { symbol: "ICICIBANK", name: "ICICI Bank Limited", isin: "INE090A01021", series: "EQ" },
  { symbol: "SBIN", name: "State Bank of India", isin: "INE062A01020", series: "EQ" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Limited", isin: "INE296A01024", series: "EQ" },
  { symbol: "ITC", name: "ITC Limited", isin: "INE154A01025", series: "EQ" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Limited", isin: "INE030A01027", series: "EQ" },
  { symbol: "LT", name: "Larsen & Toubro Limited", isin: "INE018A01030", series: "EQ" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Limited", isin: "INE397D01024", series: "EQ" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Limited", isin: "INE237A01028", series: "EQ" },
  { symbol: "AXISBANK", name: "Axis Bank Limited", isin: "INE238A01034", series: "EQ" },
  { symbol: "TATAMOTORS", name: "Tata Motors Limited", isin: "INE155A01022", series: "EQ" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Limited", isin: "INE585B01010", series: "EQ" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Limited", isin: "INE044A01036", series: "EQ" },
  { symbol: "WIPRO", name: "Wipro Limited", isin: "INE075A01022", series: "EQ" },
  { symbol: "HCLTECH", name: "HCL Technologies Limited", isin: "INE860A01027", series: "EQ" },
  { symbol: "NTPC", name: "NTPC Limited", isin: "INE733E01010", series: "EQ" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Limited", isin: "INE752E01010", series: "EQ" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corporation Limited", isin: "INE213A01029", series: "EQ" },
  { symbol: "COALINDIA", name: "Coal India Limited", isin: "INE522F01014", series: "EQ" },
  { symbol: "HAL", name: "Hindustan Aeronautics Limited", isin: "INE066F01012", series: "EQ" },
  { symbol: "BEL", name: "Bharat Electronics Limited", isin: "INE263A01024", series: "EQ" }
];

class SearchService {
  constructor() {
    this.equities = [];
    this.loadEquities();
  }

  loadEquities() {
    const seen = new Set();
    const list = [];

    // Load CSV if exists
    if (fs.existsSync(CSV_PATH)) {
      try {
        const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
        const records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });

        for (const row of records) {
          const sym = (row['SYMBOL'] || '').trim().toUpperCase();
          const name = (row['NAME OF COMPANY'] || row['NAME'] || '').trim();
          const isin = (row['ISIN NUMBER'] || row['ISIN'] || '').trim();
          const series = (row['SERIES'] || 'EQ').trim();

          if (sym && !seen.has(sym)) {
            seen.add(sym);
            list.push({
              symbol: sym,
              name: name || sym,
              isin: isin || '',
              series
            });
          }
        }
      } catch (err) {
        console.warn(`Error reading EQUITY_L.csv: ${err.message}`);
      }
    }

    // Merge supplemental
    for (const sup of SUPPLEMENTAL_EQUITIES) {
      if (!seen.has(sup.symbol)) {
        seen.add(sup.symbol);
        list.push(sup);
      }
    }

    this.equities = list;
    console.log(`Loaded ${this.equities.length} equities for search index.`);
  }

  search(query, limit = 10) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toUpperCase();
    const scored = [];

    for (const eq of this.equities) {
      const sym = eq.symbol.toUpperCase();
      const name = eq.name.toUpperCase();
      let score = 0;

      if (sym === q) {
        score = 100;
      } else if (sym.startsWith(q)) {
        score = 80;
      } else {
        const nameWords = name.split(/\s+/);
        if (nameWords.some(w => w.startsWith(q))) {
          score = 60;
        } else if (name.startsWith(q)) {
          score = 50;
        } else if (sym.includes(q)) {
          score = 40;
        } else if (name.includes(q)) {
          score = 20;
        }
      }

      if (score > 0) {
        scored.push({
          score,
          symbol: eq.symbol,
          name: eq.name,
          exchange: 'NSE',
          isin: eq.isin
        });
      }
    }

    scored.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
    return scored.slice(0, limit).map(({ score, ...rest }) => rest);
  }
}

export const searchService = new SearchService();
