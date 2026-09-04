import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import SectorExplorer from './pages/SectorExplorer';
import AIChartReader from './pages/AIChartReader';
import WatchlistPage from './pages/WatchlistPage';
import NewsResultsPage from './pages/NewsResultsPage';
import { ValuationPage } from './pages/ValuationPage';
import { PortfolioSimulatorPage } from './pages/PortfolioSimulatorPage';
import { ComparePage } from './pages/ComparePage';
import { ScreenerPage } from './pages/ScreenerPage';
import CorporateActionsPage from './pages/CorporateActionsPage';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-slate-100 selection:bg-emerald-500/30">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/stock/:ticker" element={<StockPage />} />
          <Route path="/sectors" element={<SectorExplorer />} />
          <Route path="/ai-chart-reader" element={<AIChartReader />} />
          <Route path="/news-results" element={<NewsResultsPage />} />
          <Route path="/corporate-actions" element={<CorporateActionsPage />} />
          <Route path="/valuation" element={<ValuationPage />} />
          <Route path="/valuation/:ticker" element={<ValuationPage />} />
          <Route path="/portfolio-health" element={<PortfolioSimulatorPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/screener" element={<ScreenerPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;