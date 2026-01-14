/**
 * Picklist Controller
 * Handles SF picklist CRUD operations and mismatch reporting
 */

import { Request, Response, NextFunction } from 'express';
import picklistMatcher from '../services/picklist-matcher.service';
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
}

export const picklistController = new PicklistController();
export default picklistController;
