/**
 * Picklist Matcher Service
 * Matches AI responses to exact Salesforce picklist values
 */

import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';
import { PicklistMismatch, IPicklistMismatch } from '../models/picklist-mismatch.model';

// Picklist data types
interface Brand {
  brand_id: string;
  brand_name: string;
}

interface Category {
  category_id: string;
  category_name: string;
  department: string;
  family: string;
}

interface Style {
  style_id: string;
  style_name: string;
}

interface Attribute {
  attribute_id: string;
  attribute_name: string;
}

interface MatchResult<T> {
  matched: boolean;
  original: string;
  matchedValue: T | null;
  similarity: number;
  suggestions?: T[];
}

interface MismatchLog {
  type: 'brand' | 'category' | 'style' | 'attribute';
  originalValue: string;
  timestamp: Date;
  productContext?: {
    sf_catalog_id?: string;
    sf_catalog_name?: string;
    session_id?: string;
  };
  closestMatches: string[];
  similarity?: number;
}

class PicklistMatcherService {
  private brands: Brand[] = [];
  private categories: Category[] = [];
  private styles: Style[] = [];
  private attributes: Attribute[] = [];
  private mismatches: MismatchLog[] = [];
  private initialized = false;

  constructor() {
    this.loadPicklists();
  }

  private loadPicklists(): void {
    try {
      // Use path relative to project root (works for both src and dist)
      const projectRoot = path.resolve(__dirname, '../../');
      const picklistDir = path.join(projectRoot, 'src/config/salesforce-picklists');
      
      this.brands = JSON.parse(fs.readFileSync(path.join(picklistDir, 'brands.json'), 'utf-8'));
      this.categories = JSON.parse(fs.readFileSync(path.join(picklistDir, 'categories.json'), 'utf-8'));
      this.styles = JSON.parse(fs.readFileSync(path.join(picklistDir, 'styles.json'), 'utf-8'));
      this.attributes = JSON.parse(fs.readFileSync(path.join(picklistDir, 'attributes.json'), 'utf-8'));
      
      this.initialized = true;
      logger.info('Picklists loaded successfully', {
        brands: this.brands.length,
        categories: this.categories.length,
        styles: this.styles.length,
        attributes: this.attributes.length
      });
    } catch (error) {
      logger.error('Failed to load picklists', { error });
      this.initialized = false;
    }
  }

  /**
   * Calculate similarity between two strings (case-insensitive)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.9;
    }
    
    // Levenshtein distance-based similarity
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - (distance / maxLen);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  /**
   * Match a brand name to SF picklist
   */
  matchBrand(brandName: string): MatchResult<Brand> {
    if (!brandName || !this.initialized) {
      return { matched: false, original: brandName, matchedValue: null, similarity: 0 };
    }

    const normalized = brandName.toUpperCase().trim();
    
    // Try exact match first
    const exactMatch = this.brands.find(b => 
      b.brand_name.toUpperCase() === normalized
    );
    
    if (exactMatch) {
      return { matched: true, original: brandName, matchedValue: exactMatch, similarity: 1.0 };
    }

    // Find closest matches
    const scored = this.brands.map(b => ({
      brand: b,
      similarity: this.calculateSimilarity(brandName, b.brand_name)
    })).sort((a, b) => b.similarity - a.similarity);

    const best = scored[0];
    if (best && best.similarity >= 0.8) {
      return { 
        matched: true, 
        original: brandName, 
        matchedValue: best.brand, 
        similarity: best.similarity,
        suggestions: scored.slice(1, 4).map(s => s.brand)
      };
    }

    // Log mismatch for review (async, don't await)
    this.logMismatch('brand', brandName, scored.slice(0, 3).map(s => s.brand.brand_name), best?.similarity);
    
    return { 
      matched: false, 
      original: brandName, 
      matchedValue: null, 
      similarity: best?.similarity || 0,
      suggestions: scored.slice(0, 3).map(s => s.brand)
    };
  }

  /**
   * Match a category name to SF picklist
   */
  matchCategory(categoryName: string): MatchResult<Category> {
    if (!categoryName || !this.initialized) {
      return { matched: false, original: categoryName, matchedValue: null, similarity: 0 };
    }

    const normalized = categoryName.toLowerCase().trim();
    
    // Try exact match first
    const exactMatch = this.categories.find(c => 
      c.category_name.toLowerCase() === normalized
    );
    
    if (exactMatch) {
      return { matched: true, original: categoryName, matchedValue: exactMatch, similarity: 1.0 };
    }

    // Find closest matches
    const scored = this.categories.map(c => ({
      category: c,
      similarity: this.calculateSimilarity(categoryName, c.category_name)
    })).sort((a, b) => b.similarity - a.similarity);

    const best = scored[0];
    if (best && best.similarity >= 0.75) {
      return { 
        matched: true, 
        original: categoryName, 
        matchedValue: best.category, 
        similarity: best.similarity,
        suggestions: scored.slice(1, 4).map(s => s.category)
      };
    }

    this.logMismatch('category', categoryName, scored.slice(0, 3).map(s => s.category.category_name), best?.similarity);
    
    return { 
      matched: false, 
      original: categoryName, 
      matchedValue: null, 
      similarity: best?.similarity || 0,
      suggestions: scored.slice(0, 3).map(s => s.category)
    };
  }

  /**
   * Match a style name to SF picklist
   */
  matchStyle(styleName: string): MatchResult<Style> {
    if (!styleName || !this.initialized) {
      return { matched: false, original: styleName, matchedValue: null, similarity: 0 };
    }

    const normalized = styleName.toLowerCase().trim();
    
    const exactMatch = this.styles.find(s => 
      s.style_name.toLowerCase() === normalized
    );
    
    if (exactMatch) {
      return { matched: true, original: styleName, matchedValue: exactMatch, similarity: 1.0 };
    }

    const scored = this.styles.map(s => ({
      style: s,
      similarity: this.calculateSimilarity(styleName, s.style_name)
    })).sort((a, b) => b.similarity - a.similarity);

    const best = scored[0];
    if (best && best.similarity >= 0.75) {
      return { 
        matched: true, 
        original: styleName, 
        matchedValue: best.style, 
        similarity: best.similarity,
        suggestions: scored.slice(1, 4).map(s => s.style)
      };
    }

    this.logMismatch('style', styleName, scored.slice(0, 3).map(s => s.style.style_name), best?.similarity);
    
    return { 
      matched: false, 
      original: styleName, 
      matchedValue: null, 
      similarity: best?.similarity || 0,
      suggestions: scored.slice(0, 3).map(s => s.style)
    };
  }

  /**
   * Match an attribute name to SF picklist
   */
  matchAttribute(attributeName: string): MatchResult<Attribute> {
    if (!attributeName || !this.initialized) {
      return { matched: false, original: attributeName, matchedValue: null, similarity: 0 };
    }

    const normalized = attributeName.toLowerCase().trim();
    
    const exactMatch = this.attributes.find(a => 
      a.attribute_name.toLowerCase() === normalized
    );
    
    if (exactMatch) {
      return { matched: true, original: attributeName, matchedValue: exactMatch, similarity: 1.0 };
    }

    const scored = this.attributes.map(a => ({
      attribute: a,
      similarity: this.calculateSimilarity(attributeName, a.attribute_name)
    })).sort((a, b) => b.similarity - a.similarity);

    const best = scored[0];
    if (best && best.similarity >= 0.8) {
      return { 
        matched: true, 
        original: attributeName, 
        matchedValue: best.attribute, 
        similarity: best.similarity,
        suggestions: scored.slice(1, 4).map(s => s.attribute)
      };
    }

    this.logMismatch('attribute', attributeName, scored.slice(0, 3).map(s => s.attribute.attribute_name), best?.similarity);
    
    return { 
      matched: false, 
      original: attributeName, 
      matchedValue: null, 
      similarity: best?.similarity || 0,
      suggestions: scored.slice(0, 3).map(s => s.attribute)
    };
  }

  /**
   * Log a mismatch for analytics review - persists to MongoDB
   */
  private async logMismatch(
    type: MismatchLog['type'], 
    originalValue: string, 
    closestMatches: string[],
    similarity?: number,
    productContext?: MismatchLog['productContext']
  ): Promise<void> {
    const mismatch: MismatchLog = {
      type,
      originalValue,
      timestamp: new Date(),
      closestMatches,
      similarity,
      productContext
    };
    this.mismatches.push(mismatch);
    
    logger.warn('Picklist mismatch detected', {
      type,
      originalValue,
      closestMatches,
      similarity
    });

    // Persist to MongoDB (upsert - increment count if exists)
    try {
      await PicklistMismatch.findOneAndUpdate(
        { type, originalValue: originalValue.trim() },
        {
          $set: {
            closestMatches,
            similarity: similarity || 0,
            lastSeen: new Date(),
            ...(productContext && { productContext })
          },
          $inc: { occurrenceCount: 1 },
          $setOnInsert: {
            firstSeen: new Date(),
            resolved: false
          }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error('Failed to persist picklist mismatch', { type, originalValue, error });
    }
  }

  /**
   * Log mismatch with context (for use during verification)
   */
  async logMismatchWithContext(
    type: MismatchLog['type'],
    originalValue: string,
    closestMatches: string[],
    similarity: number,
    context: { sf_catalog_id?: string; sf_catalog_name?: string; session_id?: string }
  ): Promise<void> {
    await this.logMismatch(type, originalValue, closestMatches, similarity, context);
  }

  /**
   * Get all logged mismatches (in-memory)
   */
  getMismatches(): MismatchLog[] {
    return [...this.mismatches];
  }

  /**
   * Get persisted mismatches from MongoDB
   */
  async getPersistedMismatches(options?: {
    type?: 'brand' | 'category' | 'style' | 'attribute';
    resolved?: boolean;
    limit?: number;
    sortBy?: 'occurrenceCount' | 'lastSeen' | 'firstSeen';
  }): Promise<any[]> {
    const query: any = {};
    if (options?.type) query.type = options.type;
    if (typeof options?.resolved === 'boolean') query.resolved = options.resolved;

    const sortField = options?.sortBy || 'occurrenceCount';
    const sort: any = { [sortField]: -1 };

    return PicklistMismatch.find(query)
      .sort(sort)
      .limit(options?.limit || 100)
      .lean();
  }

  /**
   * Resolve a mismatch (mark as handled)
   */
  async resolveMismatch(
    type: string,
    originalValue: string,
    resolution: {
      action: 'added_to_picklist' | 'mapped_to_existing' | 'ignored';
      resolvedValue?: string;
      resolvedBy?: string;
    }
  ): Promise<IPicklistMismatch | null> {
    return PicklistMismatch.findOneAndUpdate(
      { type, originalValue },
      {
        $set: {
          resolved: true,
          resolution: {
            ...resolution,
            resolvedAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  /**
   * Get mismatch statistics
   */
  async getMismatchStats(): Promise<{
    total: number;
    unresolved: number;
    byType: { type: string; count: number; unresolvedCount: number }[];
    topUnresolved: any[];
  }> {
    const [total, unresolved, byType, topUnresolved] = await Promise.all([
      PicklistMismatch.countDocuments(),
      PicklistMismatch.countDocuments({ resolved: false }),
      PicklistMismatch.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unresolvedCount: { $sum: { $cond: ['$resolved', 0, 1] } }
          }
        },
        { $project: { type: '$_id', count: 1, unresolvedCount: 1, _id: 0 } }
      ]),
      PicklistMismatch.find({ resolved: false })
        .sort({ occurrenceCount: -1 })
        .limit(10)
        .lean()
    ]);

    return { total, unresolved, byType, topUnresolved };
  }

  /**
   * Clear mismatches (after saving to DB)
   */
  clearMismatches(): void {
    this.mismatches = [];
  }

  /**
   * Get picklist stats
   */
  getStats() {
    return {
      brands: this.brands.length,
      categories: this.categories.length,
      styles: this.styles.length,
      attributes: this.attributes.length,
      pendingMismatches: this.mismatches.length,
      initialized: this.initialized
    };
  }

  /**
   * Reload picklists from disk
   */
  reload(): void {
    this.loadPicklists();
  }

  // Getters for raw data (for API endpoints)
  getBrands(): Brand[] { return [...this.brands]; }
  getCategories(): Category[] { return [...this.categories]; }
  getStyles(): Style[] { return [...this.styles]; }
  getAttributes(): Attribute[] { return [...this.attributes]; }

  /**
   * Get brand by ID
   */
  getBrandById(brandId: string): Brand | null {
    return this.brands.find(b => b.brand_id === brandId) || null;
  }

  /**
   * Get category by ID
   */
  getCategoryById(categoryId: string): Category | null {
    return this.categories.find(c => c.category_id === categoryId) || null;
  }

  /**
   * Add a new brand to the picklist
   */
  async addBrand(brand: Brand): Promise<{ success: boolean; brand: Brand; message: string }> {
    // Check for duplicate ID
    const existingById = this.brands.find(b => b.brand_id === brand.brand_id);
    if (existingById) {
      return { success: false, brand: existingById, message: 'Brand ID already exists' };
    }

    // Check for duplicate name
    const existingByName = this.brands.find(b => 
      b.brand_name.toUpperCase() === brand.brand_name.toUpperCase()
    );
    if (existingByName) {
      return { success: false, brand: existingByName, message: 'Brand name already exists' };
    }

    // Normalize brand name to uppercase
    const normalizedBrand: Brand = {
      brand_id: brand.brand_id,
      brand_name: brand.brand_name.toUpperCase()
    };

    // Add to memory
    this.brands.push(normalizedBrand);

    // Persist to JSON file
    try {
      const projectRoot = path.resolve(__dirname, '../../');
      const filePath = path.join(projectRoot, 'src/config/salesforce-picklists/brands.json');
      fs.writeFileSync(filePath, JSON.stringify(this.brands, null, 2));
      logger.info('Brand added successfully', { brand: normalizedBrand });
      return { success: true, brand: normalizedBrand, message: 'Brand added successfully' };
    } catch (error) {
      // Rollback memory change
      this.brands = this.brands.filter(b => b.brand_id !== normalizedBrand.brand_id);
      logger.error('Failed to persist brand', { brand: normalizedBrand, error });
      throw new Error('Failed to save brand to picklist file');
    }
  }

  /**
   * Add a new category to the picklist
   */
  async addCategory(category: Category): Promise<{ success: boolean; category: Category; message: string }> {
    // Check for duplicate ID
    const existingById = this.categories.find(c => c.category_id === category.category_id);
    if (existingById) {
      return { success: false, category: existingById, message: 'Category ID already exists' };
    }

    // Check for duplicate name within same department
    const existingByName = this.categories.find(c => 
      c.category_name.toLowerCase() === category.category_name.toLowerCase() &&
      c.department === category.department
    );
    if (existingByName) {
      return { success: false, category: existingByName, message: 'Category name already exists in this department' };
    }

    // Add to memory
    this.categories.push(category);

    // Persist to JSON file
    try {
      const projectRoot = path.resolve(__dirname, '../../');
      const filePath = path.join(projectRoot, 'src/config/salesforce-picklists/categories.json');
      fs.writeFileSync(filePath, JSON.stringify(this.categories, null, 2));
      logger.info('Category added successfully', { category });
      return { success: true, category, message: 'Category added successfully' };
    } catch (error) {
      // Rollback memory change
      this.categories = this.categories.filter(c => c.category_id !== category.category_id);
      logger.error('Failed to persist category', { category, error });
      throw new Error('Failed to save category to picklist file');
    }
  }

  /**
   * Add a new style to the picklist
   */
  async addStyle(style: Style): Promise<{ success: boolean; style: Style; message: string }> {
    const existingById = this.styles.find(s => s.style_id === style.style_id);
    if (existingById) {
      return { success: false, style: existingById, message: 'Style ID already exists' };
    }

    const existingByName = this.styles.find(s => 
      s.style_name.toLowerCase() === style.style_name.toLowerCase()
    );
    if (existingByName) {
      return { success: false, style: existingByName, message: 'Style name already exists' };
    }

    this.styles.push(style);

    try {
      const projectRoot = path.resolve(__dirname, '../../');
      const filePath = path.join(projectRoot, 'src/config/salesforce-picklists/styles.json');
      fs.writeFileSync(filePath, JSON.stringify(this.styles, null, 2));
      logger.info('Style added successfully', { style });
      return { success: true, style, message: 'Style added successfully' };
    } catch (error) {
      this.styles = this.styles.filter(s => s.style_id !== style.style_id);
      logger.error('Failed to persist style', { style, error });
      throw new Error('Failed to save style to picklist file');
    }
  }

  /**
   * Add a new attribute to the picklist
   */
  async addAttribute(attribute: Attribute): Promise<{ success: boolean; attribute: Attribute; message: string }> {
    const existingById = this.attributes.find(a => a.attribute_id === attribute.attribute_id);
    if (existingById) {
      return { success: false, attribute: existingById, message: 'Attribute ID already exists' };
    }

    const existingByName = this.attributes.find(a => 
      a.attribute_name.toLowerCase() === attribute.attribute_name.toLowerCase()
    );
    if (existingByName) {
      return { success: false, attribute: existingByName, message: 'Attribute name already exists' };
    }

    this.attributes.push(attribute);

    try {
      const projectRoot = path.resolve(__dirname, '../../');
      const filePath = path.join(projectRoot, 'src/config/salesforce-picklists/attributes.json');
      fs.writeFileSync(filePath, JSON.stringify(this.attributes, null, 2));
      logger.info('Attribute added successfully', { attribute });
      return { success: true, attribute, message: 'Attribute added successfully' };
    } catch (error) {
      this.attributes = this.attributes.filter(a => a.attribute_id !== attribute.attribute_id);
      logger.error('Failed to persist attribute', { attribute, error });
      throw new Error('Failed to save attribute to picklist file');
    }
  }
}

// Export singleton instance
export const picklistMatcher = new PicklistMatcherService();
export default picklistMatcher;
