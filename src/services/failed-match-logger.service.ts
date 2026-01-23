/**
 * Failed Match Logger Service
 * 
 * Centralized service for logging all failed attribute/brand/category/style matches
 * during verification for later auditing and improvement analysis.
 * 
 * Usage:
 *   import { failedMatchLogger } from './services/failed-match-logger.service';
 *   
 *   // Log a failed attribute match
 *   await failedMatchLogger.logFailedMatch({
 *     matchType: 'attribute',
 *     attemptedValue: 'Royal Cut',
 *     similarity: 0.45,
 *     closestMatches: [{ value: 'Cut Type', similarity: 0.45 }],
 *     source: 'ai_analysis',
 *     productContext: { sf_catalog_id: '123', session_id: 'sess_456' },
 *   });
 */

import { FailedMatchLog, IFailedMatchLog, MatchType, MatchSource } from '../models/failed-match-log.model';
import logger from '../utils/logger';

export interface FailedMatchInput {
  matchType: MatchType;
  attemptedValue: string;
  similarity: number;
  closestMatches: Array<{
    value: string;
    id?: string;
    similarity: number;
  }>;
  matchThreshold?: number;
  source: MatchSource;
  fieldKey?: string;
  productContext: {
    sf_catalog_id: string;
    sf_catalog_name?: string | null;
    model_number?: string | null;
    brand?: string | null;
    category?: string | null;
    session_id: string;
  };
  aiContext?: {
    openai_value?: string | null;
    xai_value?: string | null;
    consensus_value?: string | null;
    confidence?: number;
  };
  rawDataContext?: {
    web_retailer_value?: string | null;
    ferguson_value?: string | null;
    original_attribute_name?: string | null;
  };
  requestGenerated?: boolean;
  requestDetails?: {
    attribute_name: string;
    requested_for_category: string;
    reason: string;
  };
}

export interface FailedMatchQuery {
  matchType?: MatchType;
  source?: MatchSource;
  resolved?: boolean;
  category?: string;
  minOccurrences?: number;
  minSimilarity?: number;
  maxSimilarity?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
  sortBy?: 'occurrenceCount' | 'lastSeen' | 'similarity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface FailedMatchStats {
  total: number;
  unresolved: number;
  resolved: number;
  byType: Record<MatchType, number>;
  bySource: Record<MatchSource, number>;
  topUnresolvedByOccurrence: Array<{
    attemptedValue: string;
    matchType: MatchType;
    occurrenceCount: number;
    similarity: number;
    closestMatch?: string;
  }>;
  nearMisses: Array<{
    attemptedValue: string;
    matchType: MatchType;
    similarity: number;
    closestMatch: string;
  }>;
}

class FailedMatchLoggerService {
  private static instance: FailedMatchLoggerService;
  private inMemoryBuffer: FailedMatchInput[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 10000; // 10 seconds

  private constructor() {
    // Start buffer flush interval
    this.startBufferFlush();
  }

  static getInstance(): FailedMatchLoggerService {
    if (!FailedMatchLoggerService.instance) {
      FailedMatchLoggerService.instance = new FailedMatchLoggerService();
    }
    return FailedMatchLoggerService.instance;
  }

  /**
   * Log a failed match - buffers writes for efficiency
   */
  async logFailedMatch(input: FailedMatchInput): Promise<void> {
    // Normalize the attempted value for consistent grouping
    // (normalizedValue is used internally for deduplication)
    
    // Add to in-memory buffer
    this.inMemoryBuffer.push({
      ...input,
      matchThreshold: input.matchThreshold ?? 0.6,
    });

    // Log to console for immediate visibility
    logger.info('Failed match logged', {
      matchType: input.matchType,
      attemptedValue: input.attemptedValue,
      similarity: input.similarity,
      source: input.source,
      sf_catalog_id: input.productContext.sf_catalog_id,
      closestMatch: input.closestMatches[0]?.value,
    });

    // Flush if buffer is full
    if (this.inMemoryBuffer.length >= this.BUFFER_SIZE) {
      await this.flushBuffer();
    }
  }

  /**
   * Log multiple failed matches at once (batch operation)
   */
  async logFailedMatches(inputs: FailedMatchInput[]): Promise<void> {
    for (const input of inputs) {
      await this.logFailedMatch(input);
    }
  }

  /**
   * Force flush the buffer to MongoDB
   */
  async flushBuffer(): Promise<void> {
    if (this.inMemoryBuffer.length === 0) return;

    const toFlush = [...this.inMemoryBuffer];
    this.inMemoryBuffer = [];

    try {
      // Use bulk upsert for efficiency
      const bulkOps = toFlush.map(input => {
        const normalizedValue = this.normalizeValue(input.attemptedValue);
        
        return {
          updateOne: {
            filter: {
              matchType: input.matchType,
              normalizedValue,
              source: input.source,
            },
            update: {
              $set: {
                attemptedValue: input.attemptedValue,
                normalizedValue,
                similarity: input.similarity,
                closestMatches: input.closestMatches,
                matchThreshold: input.matchThreshold ?? 0.6,
                fieldKey: input.fieldKey,
                productContext: input.productContext,
                aiContext: input.aiContext,
                rawDataContext: input.rawDataContext,
                requestGenerated: input.requestGenerated ?? false,
                requestDetails: input.requestDetails,
                lastSeen: new Date(),
              },
              $inc: { occurrenceCount: 1 },
              $setOnInsert: {
                firstSeen: new Date(),
                resolved: false,
              },
            },
            upsert: true,
          },
        };
      });

      if (bulkOps.length > 0) {
        await FailedMatchLog.bulkWrite(bulkOps, { ordered: false });
        logger.debug('Flushed failed match buffer to MongoDB', { count: bulkOps.length });
      }
    } catch (error) {
      logger.error('Failed to flush failed match buffer', { error, count: toFlush.length });
      // Re-add to buffer on failure
      this.inMemoryBuffer.push(...toFlush);
    }
  }

  /**
   * Query failed matches with filtering
   */
  async queryFailedMatches(query: FailedMatchQuery = {}): Promise<IFailedMatchLog[]> {
    const filter: any = {};

    if (query.matchType) filter.matchType = query.matchType;
    if (query.source) filter.source = query.source;
    if (typeof query.resolved === 'boolean') filter.resolved = query.resolved;
    if (query.category) filter['productContext.category'] = query.category;
    if (query.minOccurrences) filter.occurrenceCount = { $gte: query.minOccurrences };
    
    if (query.minSimilarity !== undefined || query.maxSimilarity !== undefined) {
      filter.similarity = {};
      if (query.minSimilarity !== undefined) filter.similarity.$gte = query.minSimilarity;
      if (query.maxSimilarity !== undefined) filter.similarity.$lte = query.maxSimilarity;
    }

    if (query.startDate || query.endDate) {
      filter.lastSeen = {};
      if (query.startDate) filter.lastSeen.$gte = query.startDate;
      if (query.endDate) filter.lastSeen.$lte = query.endDate;
    }

    const sortField = query.sortBy || 'occurrenceCount';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    return FailedMatchLog.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(query.skip || 0)
      .limit(query.limit || 100)
      .lean() as unknown as Promise<IFailedMatchLog[]>;
  }

  /**
   * Get statistics about failed matches
   */
  async getStats(): Promise<FailedMatchStats> {
    // Ensure buffer is flushed before getting stats
    await this.flushBuffer();

    const [total, unresolved, byType, bySource, topUnresolved, nearMisses] = await Promise.all([
      FailedMatchLog.countDocuments(),
      FailedMatchLog.countDocuments({ resolved: false }),
      this.getCountByType(),
      this.getCountBySource(),
      this.getTopUnresolved(10),
      this.getNearMisses(10),
    ]);

    return {
      total,
      unresolved,
      resolved: total - unresolved,
      byType,
      bySource,
      topUnresolvedByOccurrence: topUnresolved,
      nearMisses,
    };
  }

  /**
   * Get unresolved failed matches grouped by type with occurrence counts
   */
  private async getCountByType(): Promise<Record<MatchType, number>> {
    const result = await FailedMatchLog.aggregate([
      { $match: { resolved: false } },
      { $group: { _id: '$matchType', count: { $sum: 1 } } },
    ]);

    const counts: Record<MatchType, number> = {
      brand: 0,
      category: 0,
      style: 0,
      attribute: 0,
    };

    for (const r of result) {
      counts[r._id as MatchType] = r.count;
    }

    return counts;
  }

  /**
   * Get failed match counts by source
   */
  private async getCountBySource(): Promise<Record<MatchSource, number>> {
    const result = await FailedMatchLog.aggregate([
      { $match: { resolved: false } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    const counts: Record<MatchSource, number> = {
      top_15_filter: 0,
      ai_analysis: 0,
      html_table: 0,
      raw_data: 0,
    };

    for (const r of result) {
      counts[r._id as MatchSource] = r.count;
    }

    return counts;
  }

  /**
   * Get top unresolved failed matches by occurrence count
   */
  private async getTopUnresolved(limit: number) {
    const results = await FailedMatchLog.find({ resolved: false })
      .sort({ occurrenceCount: -1 })
      .limit(limit)
      .lean();

    return results.map(r => ({
      attemptedValue: r.attemptedValue,
      matchType: r.matchType,
      occurrenceCount: r.occurrenceCount,
      similarity: r.similarity,
      closestMatch: r.closestMatches[0]?.value,
    }));
  }

  /**
   * Get "near misses" - failed matches with high similarity scores
   * These are good candidates for adding aliases or mapping
   */
  private async getNearMisses(limit: number) {
    const results = await FailedMatchLog.find({
      resolved: false,
      similarity: { $gte: 0.4, $lt: 0.6 }, // Near the threshold
    })
      .sort({ similarity: -1, occurrenceCount: -1 })
      .limit(limit)
      .lean();

    return results.map(r => ({
      attemptedValue: r.attemptedValue,
      matchType: r.matchType,
      similarity: r.similarity,
      closestMatch: r.closestMatches[0]?.value || 'none',
    }));
  }

  /**
   * Resolve a failed match (mark as handled)
   */
  async resolveFailedMatch(
    matchType: MatchType,
    attemptedValue: string,
    source: MatchSource,
    resolution: {
      action: 'added_to_picklist' | 'mapped_to_existing' | 'ignored' | 'value_corrected' | 'false_positive';
      resolvedValue?: string;
      resolvedTo?: string;
      notes?: string;
      resolvedBy?: string;
    }
  ): Promise<IFailedMatchLog | null> {
    const normalizedValue = this.normalizeValue(attemptedValue);

    return FailedMatchLog.findOneAndUpdate(
      { matchType, normalizedValue, source },
      {
        $set: {
          resolved: true,
          resolution: {
            ...resolution,
            resolvedAt: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  /**
   * Bulk resolve failed matches by IDs
   */
  async bulkResolve(
    ids: string[],
    resolution: {
      action: 'added_to_picklist' | 'mapped_to_existing' | 'ignored' | 'value_corrected' | 'false_positive';
      resolvedValue?: string;
      notes?: string;
      resolvedBy?: string;
    }
  ): Promise<number> {
    const result = await FailedMatchLog.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          resolved: true,
          resolution: {
            ...resolution,
            resolvedAt: new Date(),
          },
        },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Get failed matches for a specific product
   */
  async getFailedMatchesForProduct(sf_catalog_id: string): Promise<IFailedMatchLog[]> {
    return FailedMatchLog.find({ 'productContext.sf_catalog_id': sf_catalog_id })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<IFailedMatchLog[]>;
  }

  /**
   * Get failed matches for a specific session
   */
  async getFailedMatchesForSession(session_id: string): Promise<IFailedMatchLog[]> {
    return FailedMatchLog.find({ 'productContext.session_id': session_id })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<IFailedMatchLog[]>;
  }

  /**
   * Export failed matches for external analysis
   */
  async exportForAnalysis(query: FailedMatchQuery = {}): Promise<any[]> {
    const matches = await this.queryFailedMatches({
      ...query,
      limit: query.limit || 1000,
    });

    return matches.map(m => ({
      type: m.matchType,
      attempted_value: m.attemptedValue,
      normalized_value: m.normalizedValue,
      similarity: m.similarity,
      threshold: m.matchThreshold,
      closest_match: m.closestMatches[0]?.value,
      closest_match_similarity: m.closestMatches[0]?.similarity,
      source: m.source,
      field_key: m.fieldKey,
      category: m.productContext.category,
      sf_catalog_id: m.productContext.sf_catalog_id,
      model_number: m.productContext.model_number,
      occurrence_count: m.occurrenceCount,
      first_seen: m.firstSeen,
      last_seen: m.lastSeen,
      resolved: m.resolved,
      resolution_action: m.resolution?.action,
      resolution_notes: m.resolution?.notes,
    }));
  }

  /**
   * Normalize a value for consistent grouping
   */
  private normalizeValue(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '');
  }

  /**
   * Start the buffer flush interval
   */
  private startBufferFlush(): void {
    if (this.bufferFlushInterval) return;
    
    this.bufferFlushInterval = setInterval(async () => {
      await this.flushBuffer();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Stop the buffer flush interval (for graceful shutdown)
   */
  async shutdown(): Promise<void> {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }
    await this.flushBuffer();
  }
}

// Export singleton instance
export const failedMatchLogger = FailedMatchLoggerService.getInstance();
