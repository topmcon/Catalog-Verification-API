/**
 * Picklist Controller
 * Handles SF picklist CRUD operations, mismatch reporting, and sync from Salesforce
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import picklistMatcher from '../services/picklist-matcher.service';
import { PicklistSyncLog, IPicklistTypeSummary, IPicklistChange } from '../models/picklist-sync-log.model';
import logger from '../utils/logger';

export class PicklistController {
  /**
   * GET /api/picklists/stats
   * Get picklist statistics
   */
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = picklistMatcher.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/picklists/brands
   * Get all brands
   */
  async getBrands(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = picklistMatcher.getBrands();
      res.json({ success: true, count: brands.length, data: brands });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/picklists/categories
   * Get all categories
   */
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = picklistMatcher.getCategories();
      res.json({ success: true, count: categories.length, data: categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/picklists/styles
   * Get all styles
   */
  async getStyles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const styles = picklistMatcher.getStyles();
      res.json({ success: true, count: styles.length, data: styles });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/picklists/attributes
   * Get all attributes
   */
  async getAttributes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attributes = picklistMatcher.getAttributes();
      res.json({ success: true, count: attributes.length, data: attributes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/match/brand
   * Test brand matching
   */
  async matchBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { brand } = req.body;
      if (!brand) {
        res.status(400).json({ success: false, error: 'brand is required' });
        return;
      }
      const result = picklistMatcher.matchBrand(brand);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/match/category
   * Test category matching
   */
  async matchCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.body;
      if (!category) {
        res.status(400).json({ success: false, error: 'category is required' });
        return;
      }
      const result = picklistMatcher.matchCategory(category);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/picklists/mismatches
   * Get logged mismatches for review (from MongoDB)
   */
  async getMismatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, resolved, limit } = req.query;
      
      const mismatches = await picklistMatcher.getPersistedMismatches({
        type: type as 'brand' | 'category' | 'style' | 'attribute' | undefined,
        resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : 100
      });
      
      res.json({ success: true, count: mismatches.length, data: mismatches });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/picklists/mismatches/stats
   * Get mismatch statistics
   */
  async getMismatchStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await picklistMatcher.getMismatchStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/mismatches/:type/:value/resolve
   * Resolve a mismatch
   */
  async resolveMismatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, value } = req.params;
      const { action, resolvedValue, resolvedBy } = req.body;
      
      if (!['added_to_picklist', 'mapped_to_existing', 'ignored'].includes(action)) {
        res.status(400).json({ 
          success: false, 
          error: 'action must be one of: added_to_picklist, mapped_to_existing, ignored' 
        });
        return;
      }
      
      const result = await picklistMatcher.resolveMismatch(type, decodeURIComponent(value), {
        action,
        resolvedValue,
        resolvedBy: resolvedBy || 'api'
      });
      
      if (!result) {
        res.status(404).json({ success: false, error: 'Mismatch not found' });
        return;
      }
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/reload
   * Reload picklists from disk (after SF updates files)
   */
  async reloadPicklists(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      picklistMatcher.reload();
      const stats = picklistMatcher.getStats();
      logger.info('Picklists reloaded', stats);
      res.json({ success: true, message: 'Picklists reloaded', data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/picklists/brands/:id
   * Get a brand by ID
   */
  async getBrandById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const brand = picklistMatcher.getBrandById(id);
      
      if (!brand) {
        res.status(404).json({ success: false, error: 'Brand not found' });
        return;
      }
      
      res.json({ success: true, data: brand });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/picklists/categories/:id
   * Get a category by ID
   */
  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = picklistMatcher.getCategoryById(id);
      
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found' });
        return;
      }
      
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/brands
   * Add a new brand to the picklist
   */
  async addBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { brand_id, brand_name } = req.body;
      
      if (!brand_id || !brand_name) {
        res.status(400).json({ 
          success: false, 
          error: 'brand_id and brand_name are required' 
        });
        return;
      }
      
      const result = await picklistMatcher.addBrand({ brand_id, brand_name });
      
      if (!result.success) {
        res.status(409).json({ 
          success: false, 
          error: result.message,
          existing: result.brand
        });
        return;
      }
      
      res.status(201).json({ success: true, data: result.brand, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/categories
   * Add a new category to the picklist
   */
  async addCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category_id, category_name, department, family } = req.body;
      
      if (!category_id || !category_name || !department || !family) {
        res.status(400).json({ 
          success: false, 
          error: 'category_id, category_name, department, and family are required' 
        });
        return;
      }
      
      const result = await picklistMatcher.addCategory({ 
        category_id, 
        category_name, 
        department, 
        family 
      });
      
      if (!result.success) {
        res.status(409).json({ 
          success: false, 
          error: result.message,
          existing: result.category
        });
        return;
      }
      
      res.status(201).json({ success: true, data: result.category, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/styles
   * Add a new style to the picklist
   */
  async addStyle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { style_id, style_name } = req.body;
      
      if (!style_id || !style_name) {
        res.status(400).json({ 
          success: false, 
          error: 'style_id and style_name are required' 
        });
        return;
      }
      
      const result = await picklistMatcher.addStyle({ style_id, style_name });
      
      if (!result.success) {
        res.status(409).json({ 
          success: false, 
          error: result.message,
          existing: result.style
        });
        return;
      }
      
      res.status(201).json({ success: true, data: result.style, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/attributes
   * Add a new attribute to the picklist
   */
  async addAttribute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attribute_id, attribute_name } = req.body;
      
      if (!attribute_id || !attribute_name) {
        res.status(400).json({ 
          success: false, 
          error: 'attribute_id and attribute_name are required' 
        });
        return;
      }
      
      const result = await picklistMatcher.addAttribute({ attribute_id, attribute_name });
      
      if (!result.success) {
        res.status(409).json({ 
          success: false, 
          error: result.message,
          existing: result.attribute
        });
        return;
      }
      
      res.status(201).json({ success: true, data: result.attribute, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/picklists/sync
   * Bulk sync picklists from Salesforce
   * 
   * This endpoint allows Salesforce to send updated picklist data after
   * adding new options (in response to our *_Requests arrays).
   * 
   * Request body can include any combination of:
   * - attributes: Array of { attribute_id, attribute_name }
   * - brands: Array of { brand_id, brand_name }
   * - categories: Array of { category_id, category_name, department, family }
   * - styles: Array of { style_id, style_name }
   * 
   * Each array completely replaces the existing data for that type.
   * Only include the picklist types you want to update.
   */
  async syncPicklists(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const syncId = uuidv4();
    const { attributes, brands, categories, styles } = req.body;
    
    // Capture current state BEFORE sync for comparison
    const beforeState = {
      attributes: picklistMatcher.getAttributes(),
      brands: picklistMatcher.getBrands(),
      categories: picklistMatcher.getCategories(),
      styles: picklistMatcher.getStyles()
    };
    
    try {
      // Validate that at least one picklist type is provided
      if (!attributes && !brands && !categories && !styles) {
        res.status(400).json({ 
          success: false, 
          error: 'At least one picklist type (attributes, brands, categories, styles) must be provided',
          expected_format: {
            attributes: [{ attribute_id: 'string', attribute_name: 'string' }],
            brands: [{ brand_id: 'string', brand_name: 'string' }],
            categories: [{ category_id: 'string', category_name: 'string', department: 'string', family: 'string' }],
            styles: [{ style_id: 'string', style_name: 'string' }]
          }
        });
        return;
      }
      
      // Validate array formats if provided
      const validationErrors: string[] = [];
      
      if (attributes && !Array.isArray(attributes)) {
        validationErrors.push('attributes must be an array');
      } else if (attributes) {
        const invalidAttrs = attributes.filter((a: any) => !a.attribute_id || !a.attribute_name);
        if (invalidAttrs.length > 0) {
          validationErrors.push(`${invalidAttrs.length} attributes missing required fields (attribute_id, attribute_name)`);
        }
      }
      
      if (brands && !Array.isArray(brands)) {
        validationErrors.push('brands must be an array');
      } else if (brands) {
        const invalidBrands = brands.filter((b: any) => !b.brand_id || !b.brand_name);
        if (invalidBrands.length > 0) {
          validationErrors.push(`${invalidBrands.length} brands missing required fields (brand_id, brand_name)`);
        }
      }
      
      if (categories && !Array.isArray(categories)) {
        validationErrors.push('categories must be an array');
      } else if (categories) {
        const invalidCats = categories.filter((c: any) => 
          !c.category_id || !c.category_name || !c.department || !c.family
        );
        if (invalidCats.length > 0) {
          validationErrors.push(`${invalidCats.length} categories missing required fields (category_id, category_name, department, family)`);
        }
      }
      
      if (styles && !Array.isArray(styles)) {
        validationErrors.push('styles must be an array');
      } else if (styles) {
        const invalidStyles = styles.filter((s: any) => !s.style_id || !s.style_name);
        if (invalidStyles.length > 0) {
          validationErrors.push(`${invalidStyles.length} styles missing required fields (style_id, style_name)`);
        }
      }
      
      if (validationErrors.length > 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Validation failed',
          validation_errors: validationErrors
        });
        return;
      }
      
      // Log the sync request
      logger.info('Picklist sync request received from Salesforce', {
        sync_id: syncId,
        attributes_count: attributes?.length || 0,
        brands_count: brands?.length || 0,
        categories_count: categories?.length || 0,
        styles_count: styles?.length || 0,
        source_ip: req.ip
      });
      
      // Perform the sync
      const result = await picklistMatcher.syncPicklists({
        attributes,
        brands,
        categories,
        styles
      });
      
      // Get updated stats
      const stats = picklistMatcher.getStats();
      const processingTime = Date.now() - startTime;
      
      // Calculate detailed changes for audit log
      const summaries: IPicklistTypeSummary[] = [];
      const detailedChanges: {
        attributes?: IPicklistChange[];
        brands?: IPicklistChange[];
        categories?: IPicklistChange[];
        styles?: IPicklistChange[];
      } = {};
      
      // Compare attributes
      if (attributes) {
        const { added, removed } = this.comparePicklists(
          beforeState.attributes, 
          attributes, 
          'attribute_id', 
          'attribute_name'
        );
        summaries.push({
          type: 'attributes',
          previous_count: beforeState.attributes.length,
          new_count: attributes.length,
          items_added: added.length,
          items_removed: removed.length,
          added_items: added.map(a => a.attribute_name),
          removed_items: removed.map(a => a.attribute_name)
        });
        detailedChanges.attributes = [
          ...added.map(a => ({ type: 'added' as const, item_id: a.attribute_id, item_name: a.attribute_name, new_value: a })),
          ...removed.map(a => ({ type: 'removed' as const, item_id: a.attribute_id, item_name: a.attribute_name, old_value: a }))
        ];
      }
      
      // Compare brands
      if (brands) {
        const { added, removed } = this.comparePicklists(
          beforeState.brands, 
          brands, 
          'brand_id', 
          'brand_name'
        );
        summaries.push({
          type: 'brands',
          previous_count: beforeState.brands.length,
          new_count: brands.length,
          items_added: added.length,
          items_removed: removed.length,
          added_items: added.map(b => b.brand_name),
          removed_items: removed.map(b => b.brand_name)
        });
        detailedChanges.brands = [
          ...added.map(b => ({ type: 'added' as const, item_id: b.brand_id, item_name: b.brand_name, new_value: b })),
          ...removed.map(b => ({ type: 'removed' as const, item_id: b.brand_id, item_name: b.brand_name, old_value: b }))
        ];
      }
      
      // Compare categories
      if (categories) {
        const { added, removed } = this.comparePicklists(
          beforeState.categories, 
          categories, 
          'category_id', 
          'category_name'
        );
        summaries.push({
          type: 'categories',
          previous_count: beforeState.categories.length,
          new_count: categories.length,
          items_added: added.length,
          items_removed: removed.length,
          added_items: added.map(c => c.category_name),
          removed_items: removed.map(c => c.category_name)
        });
        detailedChanges.categories = [
          ...added.map(c => ({ type: 'added' as const, item_id: c.category_id, item_name: c.category_name, new_value: c })),
          ...removed.map(c => ({ type: 'removed' as const, item_id: c.category_id, item_name: c.category_name, old_value: c }))
        ];
      }
      
      // Compare styles
      if (styles) {
        const { added, removed } = this.comparePicklists(
          beforeState.styles, 
          styles, 
          'style_id', 
          'style_name'
        );
        summaries.push({
          type: 'styles',
          previous_count: beforeState.styles.length,
          new_count: styles.length,
          items_added: added.length,
          items_removed: removed.length,
          added_items: added.map(s => s.style_name),
          removed_items: removed.map(s => s.style_name)
        });
        detailedChanges.styles = [
          ...added.map(s => ({ type: 'added' as const, item_id: s.style_id, item_name: s.style_name, new_value: s })),
          ...removed.map(s => ({ type: 'removed' as const, item_id: s.style_id, item_name: s.style_name, old_value: s }))
        ];
      }
      
      // Create audit log entry
      const apiKeyHeader = req.header('x-api-key') || '';
      const syncLog = new PicklistSyncLog({
        sync_id: syncId,
        timestamp: new Date(),
        source_ip: req.ip || 'unknown',
        user_agent: req.header('user-agent'),
        api_key_hint: apiKeyHeader.length > 4 ? `...${apiKeyHeader.slice(-4)}` : '****',
        request_body_size: JSON.stringify(req.body).length,
        picklist_types_included: [
          attributes ? 'attributes' : null,
          brands ? 'brands' : null,
          categories ? 'categories' : null,
          styles ? 'styles' : null
        ].filter(Boolean) as string[],
        success: result.success,
        sync_errors: result.errors,
        summaries,
        detailed_changes: detailedChanges,
        processing_time_ms: processingTime,
        snapshots: {
          attributes_before: attributes ? beforeState.attributes : undefined,
          brands_before: brands ? beforeState.brands : undefined,
          categories_before: categories ? beforeState.categories : undefined,
          styles_before: styles ? beforeState.styles : undefined
        }
      });
      
      // Save audit log (async, don't await)
      syncLog.save().catch(err => {
        logger.error('Failed to save picklist sync log', { sync_id: syncId, error: err });
      });
      
      // Log summary to console
      logger.info('Picklist sync completed', {
        sync_id: syncId,
        success: result.success,
        processing_time_ms: processingTime,
        changes: summaries.map(s => ({
          type: s.type,
          added: s.items_added,
          removed: s.items_removed
        }))
      });
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Picklists synced successfully',
          sync_id: syncId,
          updated: result.updated,
          changes: summaries,
          current_stats: stats,
          processing_time_ms: processingTime
        });
      } else {
        res.status(207).json({ 
          success: false, 
          message: 'Some picklists failed to sync',
          sync_id: syncId,
          updated: result.updated,
          errors: result.errors,
          changes: summaries,
          current_stats: stats,
          processing_time_ms: processingTime
        });
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Picklist sync failed', { sync_id: syncId, error, processing_time_ms: processingTime });
      
      // Log failed sync attempt
      const syncLog = new PicklistSyncLog({
        sync_id: syncId,
        timestamp: new Date(),
        source_ip: req.ip || 'unknown',
        user_agent: req.header('user-agent'),
        request_body_size: JSON.stringify(req.body || {}).length,
        picklist_types_included: [],
        success: false,
        sync_errors: [(error as Error).message],
        summaries: [],
        processing_time_ms: processingTime
      });
      syncLog.save().catch(() => {});
      
      next(error);
    }
  }
  
  /**
   * Helper: Compare old vs new picklist data to find added/removed items
   */
  private comparePicklists<T extends Record<string, any>>(
    oldItems: T[],
    newItems: T[],
    idField: keyof T,
    _nameField: keyof T  // Used by caller for display purposes
  ): { added: T[]; removed: T[] } {
    const oldIds = new Set(oldItems.map(item => item[idField]));
    const newIds = new Set(newItems.map(item => item[idField]));
    
    const added = newItems.filter(item => !oldIds.has(item[idField]));
    const removed = oldItems.filter(item => !newIds.has(item[idField]));
    
    return { added, removed };
  }
  
  /**
   * GET /api/picklists/sync/logs
   * Get sync audit logs
   */
  async getSyncLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, success, type } = req.query;
      
      const query: any = {};
      if (success !== undefined) {
        query.success = success === 'true';
      }
      if (type) {
        query.picklist_types_included = type;
      }
      
      const logs = await PicklistSyncLog.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string) || 50)
        .select('-snapshots -detailed_changes')
        .lean();
      
      res.json({ 
        success: true, 
        count: logs.length,
        data: logs 
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/picklists/sync/logs/:syncId
   * Get detailed sync log by ID (includes snapshots for rollback)
   */
  async getSyncLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { syncId } = req.params;
      
      const log = await PicklistSyncLog.findOne({ sync_id: syncId }).lean();
      
      if (!log) {
        res.status(404).json({ success: false, error: 'Sync log not found' });
        return;
      }
      
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }
}

export const picklistController = new PicklistController();
export default picklistController;
