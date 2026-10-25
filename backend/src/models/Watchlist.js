import mongoose from 'mongoose';

const WatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    tickers: {
      type: [String],
      default: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC', 'TATAMOTORS', 'SBIN']
    }
  },
  {
    timestamps: true
  }
);

export const Watchlist = mongoose.model('Watchlist', WatchlistSchema);
