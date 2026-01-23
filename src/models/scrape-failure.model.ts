/**
 * Scrape Failure Model
 * 
 * Tracks web scraping failures for learning and improvement.
 * Helps identify:
 * - Domains that consistently block our scraper
 * - Patterns in failures (time of day, frequency, etc.)
 * - URLs that need special handling (headless browser, proxy, etc.)
 * 
 * This data enables continuous improvement of the research service.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type ScrapeErrorType = 'ACCESS_DENIED' | 'TIMEOUT' | 'NETWORK_ERROR' | 'MINIMAL_CONTENT' | 'PARSE_ERROR' | 'UNKNOWN';

export interface IScrapeFailure extends Document {
  url: string;
  hostname: string;
  errorType: ScrapeErrorType;
  errorMessage: string;
  contentLength: number;
  
  // Domain classification
  isAntiBotDomain: boolean;
  
  // Tracking
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  
  // Context from the verification attempt
  context?: {
    sf_catalog_id?: string;
    model_number?: string;
    brand?: string;
    session_id?: string;
  };
  
  // Resolution tracking
  resolved: boolean;
  resolution?: {
    action: 'added_to_blocklist' | 'proxy_added' | 'browser_automation' | 'manual_data' | 'ignored';
    notes?: string;
    resolvedAt?: Date;
  };
}

// Interface for static methods
interface IScrapeFailureModel extends Model<IScrapeFailure> {
  logFailure(
    url: string,
    errorType: ScrapeErrorType,
    errorMessage: string,
    contentLength: number,
    isAntiBotDomain: boolean,
    context?: IScrapeFailure['context']
  ): Promise<IScrapeFailure>;
  getStats(): Promise<{
    topFailingDomains: any[];
    totalUnresolved: number;
    antiBotDomains: string[];
  }>;
}

const ScrapeFailureSchema = new Schema<IScrapeFailure>({
  url: { type: String, required: true },
  hostname: { type: String, required: true, index: true },
  errorType: { 
    type: String, 
    enum: ['ACCESS_DENIED', 'TIMEOUT', 'NETWORK_ERROR', 'MINIMAL_CONTENT', 'PARSE_ERROR', 'UNKNOWN'],
    required: true 
  },
  errorMessage: { type: String, required: true },
  contentLength: { type: Number, default: 0 },
  
  isAntiBotDomain: { type: Boolean, default: false },
  
  occurrenceCount: { type: Number, default: 1 },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  
  context: {
    sf_catalog_id: String,
    model_number: String,
    brand: String,
    session_id: String
  },
  
  resolved: { type: Boolean, default: false, index: true },
  resolution: {
    action: { 
      type: String, 
      enum: ['added_to_blocklist', 'proxy_added', 'browser_automation', 'manual_data', 'ignored'] 
    },
    notes: String,
    resolvedAt: Date
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
ScrapeFailureSchema.index({ hostname: 1, errorType: 1 });
ScrapeFailureSchema.index({ lastSeen: -1 });
ScrapeFailureSchema.index({ occurrenceCount: -1 });

// Static method to log a failure (upsert pattern)
ScrapeFailureSchema.statics.logFailure = async function(
  url: string,
  errorType: IScrapeFailure['errorType'],
  errorMessage: string,
  contentLength: number,
  isAntiBotDomain: boolean,
  context?: IScrapeFailure['context']
) {
  const hostname = new URL(url).hostname;
  
  return this.findOneAndUpdate(
    { hostname, errorType },
    {
      $set: {
        url,
        hostname,
        errorType,
        errorMessage,
        contentLength,
        isAntiBotDomain,
        context,
        lastSeen: new Date()
      },
      $inc: { occurrenceCount: 1 },
      $setOnInsert: { firstSeen: new Date() }
    },
    { upsert: true, new: true }
  );
};

// Static method to get failure statistics
ScrapeFailureSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$hostname',
        totalFailures: { $sum: '$occurrenceCount' },
        errorTypes: { $addToSet: '$errorType' },
        lastSeen: { $max: '$lastSeen' },
        isAntiBotDomain: { $first: '$isAntiBotDomain' }
      }
    },
    { $sort: { totalFailures: -1 } },
    { $limit: 20 }
  ]);
  
  return {
    topFailingDomains: stats,
    totalUnresolved: await this.countDocuments({ resolved: false }),
    antiBotDomains: await this.distinct('hostname', { isAntiBotDomain: true })
  };
};

export const ScrapeFailure = mongoose.model<IScrapeFailure, IScrapeFailureModel>('ScrapeFailure', ScrapeFailureSchema);
