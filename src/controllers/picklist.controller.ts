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
   * Get logged mismatches for review
   */
  async getMismatches(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mismatches = picklistMatcher.getMismatches();
      res.json({ success: true, count: mismatches.length, data: mismatches });
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
}

export const picklistController = new PicklistController();
export default picklistController;
