import mongoose from 'mongoose';

const AnalysisHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    ticker: {
      type: String,
      default: 'GENERAL'
    },
    analysisType: {
      type: String,
      default: 'chart_screenshot'
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const AnalysisHistory = mongoose.model('AnalysisHistory', AnalysisHistorySchema);
