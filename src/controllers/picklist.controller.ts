/**
 * Picklist Controller
 * Handles SF picklist CRUD operations, mismatch reporting, and sync from Salesforce
 * 
 * IMPORTANT: Picklist syncs from Salesforce are now HELD for manual review.
 * Syncs are NOT applied automatically to prevent accidental overwrites of
 * custom fields (subcategory, styles_apply, etc.) that exist in our system.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import picklistMatcher from '../services/picklist-matcher.service';
import { picklistReconciliation } from '../services/picklist-reconciliation.service';
import { pendingCreationRequestService } from '../services/pending-creation-request.service';
import { PicklistSyncLog } from '../models/picklist-sync-log.model';
import { PendingPicklistSync, IPendingChange, IImpactAssessment } from '../models/pending-picklist-sync.model';
import { catalogIndexService } from '../services/catalog-index.service';
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

  async getTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = picklistMatcher.getTypes();
      res.json({ success: true, count: types.length, data: types });
    } catch (error) {
      next(error);
    }
  }

  async getDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = picklistMatcher.getDepartments();
      res.json({ success: true, count: departments.length, data: departments });
    } catch (error) {
      next(error);
    }
  }

  async getFamilies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const families = picklistMatcher.getFamilies();
      res.json({ success: true, count: families.length, data: families });
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
   * deduplication and cleanup. FULL REPLACEMENT MODE by default.
   * 
   * Request body can include any combination of:
   * - attributes: Array of { attribute_id, attribute_name }
   * - brands: Array of { brand_id, brand_name }
   * - categories: Array of { category_id, category_name, department, family }
   * - styles: Array of { style_id, style_name }
   * - replace_mode: boolean (default: true) - set to false for incremental mode
   * 
   * Each array COMPLETELY REPLACES the existing data for that type (SF sends deduplicated lists).
   * Only include the picklist types you want to update.
   */
  async syncPicklists(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const syncId = uuidv4();
    const { attributes, brands, categories, styles, types, departments, families, category_filter_attributes, replace_mode = true } = req.body;
    
    // Capture current state BEFORE sync for comparison
    const beforeState = {
      attributes: picklistMatcher.getAttributes(),
      brands: picklistMatcher.getBrands(),
      categories: picklistMatcher.getCategories(),
      styles: picklistMatcher.getStyles(),
      types: picklistMatcher.getTypes(),
      departments: picklistMatcher.getDepartments(),
      families: picklistMatcher.getFamilies()
    };
    
    try {
      // Validate that at least one picklist type is provided
      if (!attributes && !brands && !categories && !styles && !types && !departments && !families && !category_filter_attributes) {
        res.status(400).json({ 
          success: false, 
          error: 'At least one picklist type (attributes, brands, categories, styles, types, departments, families, category_filter_attributes) must be provided',
          expected_format: {
            attributes: [{ attribute_id: 'string', attribute_name: 'string' }],
            brands: [{ brand_id: 'string', brand_name: 'string' }],
            categories: [{ category_id: 'string', category_name: 'string', department: 'string', family: 'string' }],
            styles: [{ style_id: 'string', style_name: 'string' }],
            types: [{ type_id: 'string', type_name: 'string' }],
            departments: [{ department_id: 'string', department_name: 'string' }],
            families: [{ family_id: 'string', family_name: 'string', department_id: 'string' }],
            category_filter_attributes: { 'CategoryName': { department: 'string', category_id: 'string', attributes: [] } },
            replace_mode: 'boolean (optional, default: true) - set to false for incremental mode instead of full replacement'
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
      
      if (types && !Array.isArray(types)) {
        validationErrors.push('types must be an array');
      } else if (types) {
        const invalidTypes = types.filter((t: any) => !t.type_id || !t.type_name);
        if (invalidTypes.length > 0) {
          validationErrors.push(`${invalidTypes.length} types missing required fields (type_id, type_name)`);
        }
      }
      
      if (departments && !Array.isArray(departments)) {
        validationErrors.push('departments must be an array');
      } else if (departments) {
        const invalidDepts = departments.filter((d: any) => !d.department_id || !d.department_name);
        if (invalidDepts.length > 0) {
          validationErrors.push(`${invalidDepts.length} departments missing required fields (department_id, department_name)`);
        }
      }
      
      if (families && !Array.isArray(families)) {
        validationErrors.push('families must be an array');
      } else if (families) {
        const invalidFamilies = families.filter((f: any) => !f.family_id || !f.family_name || !f.department_id);
        if (invalidFamilies.length > 0) {
          validationErrors.push(`${invalidFamilies.length} families missing required fields (family_id, family_name, department_id)`);
        }
      }
      
      if (category_filter_attributes && typeof category_filter_attributes !== 'object') {
        validationErrors.push('category_filter_attributes must be an object');
      } else if (category_filter_attributes && !Array.isArray(category_filter_attributes)) {
        // Validate structure: each category should have department, category_id, and attributes array
        for (const [categoryName, config] of Object.entries(category_filter_attributes)) {
          const catConfig = config as any;
          if (!catConfig.department || !catConfig.category_id || !Array.isArray(catConfig.attributes)) {
            validationErrors.push(`Category "${categoryName}" missing required fields (department, category_id, attributes)`);
          }
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
      logger.info('Picklist sync request received from Salesforce - HOLDING FOR REVIEW', {
        pending_id: syncId,
        replace_mode,
        attributes_count: attributes?.length || 0,
        brands_count: brands?.length || 0,
        categories_count: categories?.length || 0,
        styles_count: styles?.length || 0,
        types_count: types?.length || 0,
        departments_count: departments?.length || 0,
        families_count: families?.length || 0,
        category_filter_attributes_count: category_filter_attributes ? Object.keys(category_filter_attributes).length : 0,
        source_ip: req.ip
      });
      
      // ============================================================
      // HOLD BUCKET SYSTEM: Do NOT auto-apply syncs
      // Instead, save for manual review to prevent accidental overwrites
      // of custom fields like subcategory, styles_apply, etc.
      // ============================================================
      
      // Calculate what would change (without applying)
      const pendingChanges: IPendingChange[] = [];
      const warnings: string[] = [];
      let totalAdditions = 0;
      let totalRemovals = 0;
      let customFieldsAtRisk = 0;
      
      // Analyze attributes changes
      if (attributes) {
        const current = beforeState.attributes;
        const currentIds = new Set(current.map((a: any) => a.attribute_id));
        const incomingIds = new Set(attributes.map((a: any) => a.attribute_id));
        
        const toAdd = attributes.filter((a: any) => !currentIds.has(a.attribute_id)).map((a: any) => a.attribute_name);
        const toRemove = current.filter((a: any) => !incomingIds.has(a.attribute_id)).map((a: any) => a.attribute_name);
        
        totalAdditions += toAdd.length;
        totalRemovals += toRemove.length;
        
        pendingChanges.push({
          type: 'attributes',
          current_count: current.length,
          incoming_count: attributes.length,
          items_to_add: toAdd.slice(0, 20),  // Limit to first 20 for readability
          items_to_remove: toRemove.slice(0, 20),
          custom_fields_at_risk: []
        });
      }
      
      // Analyze brands changes
      if (brands) {
        const current = beforeState.brands;
        const currentIds = new Set(current.map((b: any) => b.brand_id));
        const incomingIds = new Set(brands.map((b: any) => b.brand_id));
        
        const toAdd = brands.filter((b: any) => !currentIds.has(b.brand_id)).map((b: any) => b.brand_name);
        const toRemove = current.filter((b: any) => !incomingIds.has(b.brand_id)).map((b: any) => b.brand_name);
        
        totalAdditions += toAdd.length;
        totalRemovals += toRemove.length;
        
        pendingChanges.push({
          type: 'brands',
          current_count: current.length,
          incoming_count: brands.length,
          items_to_add: toAdd.slice(0, 20),
          items_to_remove: toRemove.slice(0, 20),
          custom_fields_at_risk: []
        });
      }
      
      // Analyze categories changes - CRITICAL: Check for custom field loss
      if (categories) {
        const current = beforeState.categories;
        const currentIds = new Set(current.map((c: any) => c.category_id));
        const incomingIds = new Set(categories.map((c: any) => c.category_id));
        
        const toAdd = categories.filter((c: any) => !currentIds.has(c.category_id)).map((c: any) => c.category_name);
        const toRemove = current.filter((c: any) => !incomingIds.has(c.category_id)).map((c: any) => c.category_name);
        
        // Check for custom fields that would be lost
        const customFieldsLost: string[] = [];
        const categoriesWithCustomFields = current.filter((c: any) => c.subcategory || c.styles_apply !== undefined);
        if (categoriesWithCustomFields.length > 0) {
          // SF data doesn't have these fields, so they would be wiped
          const incomingHasSubcategory = categories.some((c: any) => c.subcategory);
          const incomingHasStylesApply = categories.some((c: any) => c.styles_apply !== undefined);
          
          if (!incomingHasSubcategory && categoriesWithCustomFields.some((c: any) => c.subcategory)) {
            customFieldsLost.push('subcategory');
            customFieldsAtRisk += categoriesWithCustomFields.filter((c: any) => c.subcategory).length;
            warnings.push(`⚠️ CRITICAL: ${categoriesWithCustomFields.filter((c: any) => c.subcategory).length} categories have 'subcategory' field that would be LOST`);
          }
          if (!incomingHasStylesApply && categoriesWithCustomFields.some((c: any) => c.styles_apply !== undefined)) {
            customFieldsLost.push('styles_apply');
            customFieldsAtRisk += categoriesWithCustomFields.filter((c: any) => c.styles_apply !== undefined).length;
            warnings.push(`⚠️ CRITICAL: ${categoriesWithCustomFields.filter((c: any) => c.styles_apply !== undefined).length} categories have 'styles_apply' field that would be LOST`);
          }
        }
        
        totalAdditions += toAdd.length;
        totalRemovals += toRemove.length;
        
        pendingChanges.push({
          type: 'categories',
          current_count: current.length,
          incoming_count: categories.length,
          items_to_add: toAdd.slice(0, 20),
          items_to_remove: toRemove.slice(0, 20),
          custom_fields_at_risk: customFieldsLost
        });
      }
      
      // Analyze styles changes
      if (styles) {
        const current = beforeState.styles;
        const currentIds = new Set(current.map((s: any) => s.style_id));
        const incomingIds = new Set(styles.map((s: any) => s.style_id));
        
        const toAdd = styles.filter((s: any) => !currentIds.has(s.style_id)).map((s: any) => s.style_name);
        const toRemove = current.filter((s: any) => !incomingIds.has(s.style_id)).map((s: any) => s.style_name);
        
        totalAdditions += toAdd.length;
        totalRemovals += toRemove.length;
        
        pendingChanges.push({
          type: 'styles',
          current_count: current.length,
          incoming_count: styles.length,
          items_to_add: toAdd.slice(0, 20),
          items_to_remove: toRemove.slice(0, 20),
          custom_fields_at_risk: []
        });
      }
      
      // Analyze types changes
      if (types) {
        const current = beforeState.types;
        const currentIds = new Set(current.map((t: any) => t.type_id));
        const incomingIds = new Set(types.map((t: any) => t.type_id));
        
        const toAdd = types.filter((t: any) => !currentIds.has(t.type_id)).map((t: any) => t.type_name);
        const toRemove = current.filter((t: any) => !incomingIds.has(t.type_id)).map((t: any) => t.type_name);
        
        totalAdditions += toAdd.length;
        totalRemovals += toRemove.length;
        
        pendingChanges.push({
          type: 'types',
          current_count: current.length,
          incoming_count: types.length,
          items_to_add: toAdd.slice(0, 20),
          items_to_remove: toRemove.slice(0, 20),
          custom_fields_at_risk: []
        });
      }
      
      // Analyze departments changes
      if (departments) {
        const current = beforeState.departments;
        const currentIds = new Set(current.map((d: any) => d.department_id));
        const incomingIds = new Set(departments.map((d: any) => d.department_id));
        
        const toAdd = departments.filter((d: any) => !currentIds.has(d.department_id)).map((d: any) => d.department_name);
        const toRemove = current.filter((d: any) => !incomingIds.has(d.department_id)).map((d: any) => d.department_name);
        
        totalAdditions += toAdd.length;
        totalRemovals += toRemove.length;
        
        pendingChanges.push({
          type: 'departments',
          current_count: current.length,
          incoming_count: departments.length,
          items_to_add: toAdd.slice(0, 20),
          items_to_remove: toRemove.slice(0, 20),
          custom_fields_at_risk: []
        });
      }
      
      // Analyze families changes
      if (families) {
        const current = beforeState.families;
        const currentIds = new Set(current.map((f: any) => f.family_id));
        const incomingIds = new Set(families.map((f: any) => f.family_id));
        
        const toAdd = families.filter((f: any) => !currentIds.has(f.family_id)).map((f: any) => f.family_name);
        const toRemove = current.filter((f: any) => !incomingIds.has(f.family_id)).map((f: any) => f.family_name);
        
        totalAdditions += toAdd.length;
        totalRemovals += toRemove.length;
        
        pendingChanges.push({
          type: 'families',
          current_count: current.length,
          incoming_count: families.length,
          items_to_add: toAdd.slice(0, 20),
          items_to_remove: toRemove.slice(0, 20),
          custom_fields_at_risk: []
        });
      }
      
      // Determine severity
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let reason = 'Minor additions only';
      
      if (customFieldsAtRisk > 0) {
        severity = 'critical';
        reason = `Custom fields at risk of being overwritten (${customFieldsAtRisk} items with subcategory/styles_apply)`;
      } else if (totalRemovals > 20) {
        severity = 'high';
        reason = `Large number of removals (${totalRemovals} items)`;
      } else if (totalRemovals > 5) {
        severity = 'medium';
        reason = `Some removals detected (${totalRemovals} items)`;
      } else if (totalAdditions > 0 && totalRemovals === 0) {
        severity = 'low';
        reason = `Additions only (${totalAdditions} items)`;
      }
      
      const impactAssessment: IImpactAssessment = {
        severity,
        reason,
        total_additions: totalAdditions,
        total_removals: totalRemovals,
        custom_fields_at_risk: customFieldsAtRisk,
        warnings
      };
      
      // Calculate expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Save to pending syncs
      const pendingSync = new PendingPicklistSync({
        pending_id: syncId,
        created_at: new Date(),
        expires_at: expiresAt,
        source_ip: req.ip || 'unknown',
        user_agent: req.header('user-agent'),
        api_key_hint: (req.header('x-api-key') || '').slice(-4) || '****',
        incoming_data: {
          attributes,
          brands,
          categories,
          styles,
          types,
          departments,
          families,
          category_filter_attributes,
          replace_mode
        },
        pending_changes: pendingChanges,
        impact_assessment: impactAssessment,
        current_state_snapshot: {
          attributes_count: beforeState.attributes.length,
          brands_count: beforeState.brands.length,
          categories_count: beforeState.categories.length,
          styles_count: beforeState.styles.length,
          types_count: beforeState.types.length,
          departments_count: beforeState.departments.length,
          families_count: beforeState.families.length
        },
        status: 'pending'
      });
      
      await pendingSync.save();
      
      // ============================================================
      // PENDING CREATION REQUEST FULFILLMENT (ID-only, no file writes)
      // Even though the full sync is held, we can still match SF IDs
      // against our pending creation requests. This only updates the
      // request status in MongoDB — no picklist files are modified.
      // ============================================================
      let totalRequestsFulfilled = 0;
      const fulfilledSummary: Array<{ type: string; items: string[] }> = [];
      
      try {
        const fulfillmentChecks: Array<{ type: 'attribute' | 'brand' | 'category' | 'style' | 'type'; data: any[] | undefined; nameField: string; idField: string }> = [
          { type: 'attribute', data: attributes, nameField: 'attribute_name', idField: 'attribute_id' },
          { type: 'brand', data: brands, nameField: 'brand_name', idField: 'brand_id' },
          { type: 'category', data: categories, nameField: 'category_name', idField: 'category_id' },
          { type: 'style', data: styles, nameField: 'style_name', idField: 'style_id' },
          { type: 'type', data: types, nameField: 'type_name', idField: 'type_id' }
        ];
        
        for (const check of fulfillmentChecks) {
          if (check.data && Array.isArray(check.data) && check.data.length > 0) {
            const items = check.data.map((item: any) => ({
              name: item[check.nameField] || '',
              id: item[check.idField] || ''
            })).filter(item => item.name && item.id);
            
            const result = await pendingCreationRequestService.tryFulfillFromSync(check.type, items);
            if (result.fulfilled > 0) {
              totalRequestsFulfilled += result.fulfilled;
              fulfilledSummary.push({ type: check.type, items: result.items });
            }
          }
        }
        
        if (totalRequestsFulfilled > 0) {
          logger.info('Pending creation requests fulfilled from held sync (ID-only, no file changes)', {
            pending_id: syncId,
            total_fulfilled: totalRequestsFulfilled,
            details: fulfilledSummary
          });
        }
      } catch (fulfillError) {
        logger.warn('Failed to check pending creation requests against held sync', {
          pending_id: syncId,
          error: fulfillError instanceof Error ? fulfillError.message : String(fulfillError)
        });
      }
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Picklist sync HELD for review', {
        pending_id: syncId,
        severity,
        total_additions: totalAdditions,
        total_removals: totalRemovals,
        custom_fields_at_risk: customFieldsAtRisk,
        requests_fulfilled: totalRequestsFulfilled,
        processing_time_ms: processingTime
      });
      
      // Return 202 Accepted - sync is pending review
      res.status(202).json({
        success: true,
        message: 'Picklist sync received and HELD FOR REVIEW. Changes will NOT be applied automatically.',
        pending_id: syncId,
        status: 'pending_review',
        expires_at: expiresAt.toISOString(),
        impact_assessment: impactAssessment,
        pending_changes: pendingChanges,
        creation_requests_fulfilled: totalRequestsFulfilled > 0 ? {
          total: totalRequestsFulfilled,
          details: fulfilledSummary,
          note: 'These pending creation requests were matched by SF ID only — no picklist files were modified.'
        } : undefined,
        review_url: `/api/picklists/sync/pending/${syncId}`,
        approve_url: `/api/picklists/sync/pending/${syncId}/approve`,
        reject_url: `/api/picklists/sync/pending/${syncId}/reject`,
        processing_time_ms: processingTime,
        note: 'To apply these changes, call the approve endpoint or use the review script during "Establish Connection".'
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Picklist sync hold failed', { pending_id: syncId, error, processing_time_ms: processingTime });
      next(error);
    }
  }
  
  // ============================================================
  // PENDING SYNC REVIEW ENDPOINTS
  // ============================================================
  
  /**
   * GET /api/picklists/sync/pending
   * List all pending picklist syncs awaiting review
   */
  async getPendingSyncs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status = 'pending', limit = 20 } = req.query;
      
      const query: any = {};
      if (status !== 'all') {
        query.status = status;
      }
      
      const pendingSyncs = await PendingPicklistSync.find(query)
        .sort({ created_at: -1 })
        .limit(Number(limit))
        .lean();
      
      // Count by status
      const counts = {
        pending: await PendingPicklistSync.countDocuments({ status: 'pending' }),
        approved: await PendingPicklistSync.countDocuments({ status: 'approved' }),
        rejected: await PendingPicklistSync.countDocuments({ status: 'rejected' }),
        expired: await PendingPicklistSync.countDocuments({ status: 'expired' })
      };
      
      res.json({
        success: true,
        counts,
        data: pendingSyncs
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/picklists/sync/pending/:pendingId
   * Get a specific pending sync with full details
   */
  async getPendingSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pendingId } = req.params;
      
      const pendingSync = await PendingPicklistSync.findOne({ pending_id: pendingId }).lean();
      
      if (!pendingSync) {
        res.status(404).json({
          success: false,
          error: 'Pending sync not found',
          pending_id: pendingId
        });
        return;
      }
      
      res.json({
        success: true,
        data: pendingSync
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * POST /api/picklists/sync/pending/:pendingId/approve
   * Approve and apply a pending picklist sync
   */
  async approvePendingSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const { pendingId } = req.params;
    const { reviewed_by = 'copilot-session', notes } = req.body;
    
    try {
      // Find the pending sync
      const pendingSync = await PendingPicklistSync.findOne({ pending_id: pendingId });
      
      if (!pendingSync) {
        res.status(404).json({
          success: false,
          error: 'Pending sync not found',
          pending_id: pendingId
        });
        return;
      }
      
      if (pendingSync.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: `Sync is not pending (status: ${pendingSync.status})`,
          pending_id: pendingId
        });
        return;
      }
      
      // Check if expired
      if (new Date() > pendingSync.expires_at) {
        pendingSync.status = 'expired';
        await pendingSync.save();
        
        res.status(400).json({
          success: false,
          error: 'Pending sync has expired',
          pending_id: pendingId,
          expired_at: pendingSync.expires_at
        });
        return;
      }
      
      // Apply reconciliation logic instead of full replacement
      const { attributes, categories } = pendingSync.incoming_data;
      
      const reconciliationResults = [];
      let totalExistingUpdated = 0;
      let totalPendingAdded = 0;
      let totalNewAdded = 0;
      let totalDuplicatesRejected = 0;
      let totalRequestsFulfilled = 0;
      const reconciliationErrors: string[] = [];
      
      // Reconcile attributes (main focus - adds new, updates existing, marks requests fulfilled)
      if (attributes && Array.isArray(attributes) && attributes.length > 0) {
        const attrResult = await picklistReconciliation.reconcileAttributes(attributes);
        reconciliationResults.push(attrResult);
        totalExistingUpdated += attrResult.existing_updated;
        totalPendingAdded += attrResult.pending_added;
        totalNewAdded += attrResult.new_added;
        totalDuplicatesRejected += attrResult.duplicates_rejected;
        totalRequestsFulfilled += attrResult.requests_fulfilled;
        reconciliationErrors.push(...attrResult.errors);
        
        logger.info('Attributes reconciled', {
          existing_updated: attrResult.existing_updated,
          pending_added: attrResult.pending_added,
          new_added: attrResult.new_added,
          duplicates_rejected: attrResult.duplicates_rejected,
          requests_fulfilled: attrResult.requests_fulfilled
        });
      }
      
      // Reconcile categories (ID-only updates, preserves custom fields)
      if (categories && Array.isArray(categories) && categories.length > 0) {
        const catResult = await picklistReconciliation.reconcileCategories(categories);
        reconciliationResults.push(catResult);
        totalExistingUpdated += catResult.existing_updated;
        reconciliationErrors.push(...catResult.errors);
        
        logger.info('Categories reconciled', {
          existing_updated: catResult.existing_updated
        });
      }
      
      // Reload picklists in memory after file updates
      picklistMatcher.reload();
      
      const syncId = uuidv4();
      const processingTime = Date.now() - startTime;
      
      const result = {
        success: reconciliationErrors.length === 0,
        errors: reconciliationErrors,
        reconciliation_summary: {
          existing_updated: totalExistingUpdated,
          pending_added: totalPendingAdded,
          new_added: totalNewAdded,
          duplicates_rejected: totalDuplicatesRejected,
          requests_fulfilled: totalRequestsFulfilled
        }
      };
      
      // Update pending sync status
      pendingSync.status = 'approved';
      pendingSync.reviewed_at = new Date();
      pendingSync.reviewed_by = reviewed_by;
      pendingSync.review_notes = notes;
      pendingSync.applied_sync_id = syncId;
      await pendingSync.save();
      
      // Create sync log for audit trail
      const syncLog = new PicklistSyncLog({
        sync_id: syncId,
        timestamp: new Date(),
        source_ip: 'approved-from-pending',
        user_agent: `approved by ${reviewed_by}`,
        api_key_hint: 'manual',
        request_body_size: JSON.stringify(pendingSync.incoming_data).length,
        picklist_types_included: pendingSync.pending_changes.map(c => c.type),
        success: result.success,
        sync_errors: result.errors || [],
        summaries: pendingSync.pending_changes.map(c => ({
          type: c.type,
          previous_count: c.current_count,
          new_count: c.incoming_count,
          items_added: c.items_to_add.length,
          items_removed: c.items_to_remove.length,
          added_items: c.items_to_add,
          removed_items: c.items_to_remove
        })),
        processing_time_ms: processingTime
      });
      await syncLog.save();
      
      // Update catalog index for categories if included
      let catalogIndexUpdate = { categories_synced: 0 };
      try {
        const { categories } = pendingSync.incoming_data;
        if (categories && Array.isArray(categories) && categories.length > 0) {
          const catResult = await catalogIndexService.syncSalesforceCategories(categories);
          catalogIndexUpdate.categories_synced = catResult.updated;
        }
      } catch (indexError) {
        logger.error('Failed to update catalog index after approval', { pending_id: pendingId, error: indexError });
      }
      
      logger.info('Pending picklist sync APPROVED and applied', {
        pending_id: pendingId,
        sync_id: syncId,
        reviewed_by,
        reconciliation_summary: result.reconciliation_summary,
        processing_time_ms: processingTime
      });
      
      res.json({
        success: true,
        message: 'Pending sync approved and applied via reconciliation',
        pending_id: pendingId,
        sync_id: syncId,
        reviewed_by,
        reconciliation: result.reconciliation_summary,
        catalog_index_update: catalogIndexUpdate,
        processing_time_ms: processingTime
      });
      
    } catch (error) {
      logger.error('Failed to approve pending sync', { pending_id: pendingId, error });
      next(error);
    }
  }
  
  /**
   * POST /api/picklists/sync/pending/:pendingId/reject
   * Reject a pending picklist sync (discard without applying)
   */
  async rejectPendingSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { pendingId } = req.params;
    const { reviewed_by = 'copilot-session', notes } = req.body;
    
    try {
      const pendingSync = await PendingPicklistSync.findOne({ pending_id: pendingId });
      
      if (!pendingSync) {
        res.status(404).json({
          success: false,
          error: 'Pending sync not found',
          pending_id: pendingId
        });
        return;
      }
      
      if (pendingSync.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: `Sync is not pending (status: ${pendingSync.status})`,
          pending_id: pendingId
        });
        return;
      }
      
      // Update status to rejected
      pendingSync.status = 'rejected';
      pendingSync.reviewed_at = new Date();
      pendingSync.reviewed_by = reviewed_by;
      pendingSync.review_notes = notes || 'Rejected to prevent overwrite of custom fields';
      await pendingSync.save();
      
      logger.info('Pending picklist sync REJECTED', {
        pending_id: pendingId,
        reviewed_by,
        notes
      });
      
      res.json({
        success: true,
        message: 'Pending sync rejected and discarded',
        pending_id: pendingId,
        reviewed_by,
        rejected_changes: pendingSync.pending_changes
      });
      
    } catch (error) {
      logger.error('Failed to reject pending sync', { pending_id: pendingId, error });
      next(error);
    }
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
