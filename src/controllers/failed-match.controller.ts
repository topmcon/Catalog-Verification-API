/**
 * Failed Match Log Controller
 * 
 * API endpoints for querying and managing failed attribute match logs
 * for auditing and improvement analysis.
 */

import { Request, Response } from 'express';
import { failedMatchLogger, FailedMatchQuery } from '../services/failed-match-logger.service';
import { FailedMatchLog, MatchType, MatchSource } from '../models/failed-match-log.model';
import logger from '../utils/logger';

/**
 * Get failed match statistics
 */
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await failedMatchLogger.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get failed match stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
    });
  }
};

/**
 * Query failed matches with filtering
 */
export const queryFailedMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: FailedMatchQuery = {
      matchType: req.query.type as MatchType,
      source: req.query.source as MatchSource,
      resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
      category: req.query.category as string,
      minOccurrences: req.query.minOccurrences ? parseInt(req.query.minOccurrences as string) : undefined,
      minSimilarity: req.query.minSimilarity ? parseFloat(req.query.minSimilarity as string) : undefined,
      maxSimilarity: req.query.maxSimilarity ? parseFloat(req.query.maxSimilarity as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
      sortBy: (req.query.sortBy as any) || 'occurrenceCount',
      sortOrder: (req.query.sortOrder as any) || 'desc',
    };

    const matches = await failedMatchLogger.queryFailedMatches(query);
    const total = await FailedMatchLog.countDocuments(buildFilterFromQuery(query));

    res.json({
      success: true,
      data: matches,
      pagination: {
        total,
        limit: query.limit,
        skip: query.skip,
        hasMore: (query.skip || 0) + matches.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to query failed matches', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to query failed matches',
    });
  }
};

/**
 * Get failed matches for a specific product
 */
export const getByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sf_catalog_id } = req.params;
    const matches = await failedMatchLogger.getFailedMatchesForProduct(sf_catalog_id);

    res.json({
      success: true,
      data: matches,
      count: matches.length,
    });
  } catch (error) {
    logger.error('Failed to get failed matches for product', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve failed matches for product',
    });
  }
};

/**
 * Get failed matches for a specific session
 */
export const getBySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id } = req.params;
    const matches = await failedMatchLogger.getFailedMatchesForSession(session_id);

    res.json({
      success: true,
      data: matches,
      count: matches.length,
    });
  } catch (error) {
    logger.error('Failed to get failed matches for session', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve failed matches for session',
    });
  }
};

/**
 * Resolve a failed match
 */
export const resolveMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchType, attemptedValue, source } = req.params;
    const { action, resolvedValue, resolvedTo, notes, resolvedBy } = req.body;

    if (!action) {
      res.status(400).json({
        success: false,
        error: 'Resolution action is required',
      });
      return;
    }

    const result = await failedMatchLogger.resolveFailedMatch(
      matchType as MatchType,
      attemptedValue,
      source as MatchSource,
      { action, resolvedValue, resolvedTo, notes, resolvedBy }
    );

    if (result) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Failed match not found',
      });
    }
  } catch (error) {
    logger.error('Failed to resolve failed match', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to resolve match',
    });
  }
};

/**
 * Bulk resolve failed matches
 */
export const bulkResolve = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, action, resolvedValue, notes, resolvedBy } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Array of IDs is required',
      });
      return;
    }

    if (!action) {
      res.status(400).json({
        success: false,
        error: 'Resolution action is required',
      });
      return;
    }

    const count = await failedMatchLogger.bulkResolve(ids, { action, resolvedValue, notes, resolvedBy });

    res.json({
      success: true,
      resolvedCount: count,
    });
  } catch (error) {
    logger.error('Failed to bulk resolve failed matches', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to bulk resolve matches',
    });
  }
};

/**
 * Export failed matches for external analysis
 */
export const exportMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: FailedMatchQuery = {
      matchType: req.query.type as MatchType,
      source: req.query.source as MatchSource,
      resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 1000,
    };

    const data = await failedMatchLogger.exportForAnalysis(query);

    res.json({
      success: true,
      data,
      count: data.length,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to export failed matches', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to export matches',
    });
  }
};

/**
 * Get near-miss matches (high similarity but below threshold)
 * These are good candidates for adding aliases
 */
export const getNearMisses = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const matches = await FailedMatchLog.find({
      resolved: false,
      similarity: { $gte: 0.4, $lt: 0.6 },
    })
      .sort({ similarity: -1, occurrenceCount: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: matches.map(m => ({
        id: m._id,
        type: m.matchType,
        attemptedValue: m.attemptedValue,
        similarity: m.similarity,
        closestMatch: m.closestMatches[0]?.value,
        occurrenceCount: m.occurrenceCount,
        category: m.productContext.category,
        source: m.source,
      })),
      count: matches.length,
      description: 'Near-miss matches with 40-60% similarity - good candidates for aliasing',
    });
  } catch (error) {
    logger.error('Failed to get near-miss matches', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get near-miss matches',
    });
  }
};

/**
 * Get top unresolved failures by occurrence count
 */
export const getTopUnresolved = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const type = req.query.type as MatchType;
    
    const filter: any = { resolved: false };
    if (type) filter.matchType = type;

    const matches = await FailedMatchLog.find(filter)
      .sort({ occurrenceCount: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: matches.map(m => ({
        id: m._id,
        type: m.matchType,
        attemptedValue: m.attemptedValue,
        similarity: m.similarity,
        closestMatch: m.closestMatches[0]?.value,
        occurrenceCount: m.occurrenceCount,
        category: m.productContext.category,
        source: m.source,
        firstSeen: m.firstSeen,
        lastSeen: m.lastSeen,
      })),
      count: matches.length,
    });
  } catch (error) {
    logger.error('Failed to get top unresolved', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get top unresolved failures',
    });
  }
};

// Helper function to build MongoDB filter from query
function buildFilterFromQuery(query: FailedMatchQuery): any {
  const filter: any = {};
  if (query.matchType) filter.matchType = query.matchType;
  if (query.source) filter.source = query.source;
  if (typeof query.resolved === 'boolean') filter.resolved = query.resolved;
  if (query.category) filter['productContext.category'] = query.category;
  if (query.minOccurrences) filter.occurrenceCount = { $gte: query.minOccurrences };
  return filter;
}
