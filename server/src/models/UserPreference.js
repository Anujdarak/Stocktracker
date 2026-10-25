import mongoose from 'mongoose';

const UserPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        theme: 'dark',
        chartInterval: '1d',
        autoRefresh: true,
        currency: 'INR'
      })
    }
  },
  {
    timestamps: true
  }
);

export const UserPreference = mongoose.model('UserPreference', UserPreferenceSchema);
