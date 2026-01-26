/**
 * Picklist Matcher Service
 * Matches AI responses to exact Salesforce picklist values
 */

import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';
import { PicklistMismatch, IPicklistMismatch } from '../models/picklist-mismatch.model';

/**
 * PRIMARY ATTRIBUTE NAMES AND KEYS
 * These are STATIC attributes that apply to ALL products and have dedicated fields.
 * They should NEVER be requested as missing from the SF attributes picklist
 * because they are handled separately in the primary attributes section.
 */
const PRIMARY_ATTRIBUTE_NAMES = new Set([
  // Exact names from PRIMARY_ATTRIBUTES
  'brand', 'brand (verified)',
  'category', 'category / subcategory', 'category / subcategory (verified)',
  'product family', 'product family (verified)',
  'product style', 'product style (verified)', 'product style (verified) (category specific)',
  'depth', 'length', 'depth / length', 'depth / length (verified)',
  'width', 'width (verified)',
  'height', 'height (verified)',
  'weight', 'weight (verified)',
  'msrp', 'msrp (verified)',
  'market value',
  'description',
  'product title', 'product title (verified)',
  'details',
  'features', 'features list',
  'upc', 'gtin', 'upc / gtin', 'upc / gtin (verified)',
  'model number', 'model number (verified)',
  'model number alias', 'model number alias (symbols removed)',
  'model parent',
  'model variant', 'model variant number',
  'total model variants', 'total model variants (list all variant models)',
]);

const PRIMARY_ATTRIBUTE_FIELD_KEYS = new Set([
  'brand_verified', 'brand',
  'category_subcategory_verified', 'category_subcategory', 'category',
  'product_family_verified', 'product_family',
  'product_style_verified', 'product_style', 'style',
  'depth_length_verified', 'depth_length', 'depth', 'length',
  'width_verified', 'width',
  'height_verified', 'height',
  'weight_verified', 'weight',
  'msrp_verified', 'msrp',
  'market_value',
  'description',
  'product_title_verified', 'product_title', 'title',
  'details',
  'features_list', 'features',
  'upc_gtin_verified', 'upc_gtin', 'upc', 'gtin',
  'model_number_verified', 'model_number',
  'model_number_alias',
  'model_parent',
  'model_variant_number', 'model_variant',
  'total_model_variants',
]);

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

/**
 * SEMANTIC ATTRIBUTE ALIASES
 * Maps equivalent attribute names that should be treated as the same
 * Format: 'ai_term': 'salesforce_term'
 */
const ATTRIBUTE_ALIASES: Record<string, string> = {
  // Position/Placement equivalents
  'drain position': 'drain placement',
  'drain location': 'drain placement',
  // Width/Depth equivalents  
  'overall width': 'width',
  'overall depth': 'depth',
  'nominal width': 'width',
  'nominal depth': 'depth',
  'nominal length': 'length',
  'width / diameter': 'width',
  'width/diameter': 'width',
  // Height equivalents
  'overall height': 'height',
  'fixture height': 'height',
  'height (fixture)': 'height',
  'total height': 'height',
  'hanging height': 'height',
  // Mount type equivalents
  'installation type': 'mount type',
  'mounting type': 'mount type',
  'mount style': 'mount type',
  // Bowl equivalents
  'number of basins': 'number of bowls',
  'basin count': 'number of bowls',
  // Material equivalents
  'sink material': 'material',
  'faucet material': 'material',
  'construction material': 'material',
  'body material': 'material',
  'frame material': 'material',
  // Size equivalents
  'minimum cabinet size': 'cabinet size',
  'cabinet width': 'cabinet size',
  // Lighting-specific equivalents
  'light count': 'number of lights',
  'lights': 'number of lights',
  'bulb count': 'number of lights',
  'number of bulbs': 'number of lights',
  'lamp type': 'bulb type',
  'light type': 'bulb type',
  'bulb base': 'bulb type',
  'base type': 'bulb type',
  'color temperature': 'adjustable color temperature',
  'max wattage': 'maximum wattage',
  'wattage': 'maximum wattage',
  'total wattage': 'maximum wattage',
  'chain length': 'cord/chain length',
  'cord length': 'cord/chain length',
  'cable length': 'cord/chain length',
  'wire length': 'cord/chain length',
  'adjustable': 'adjustable height',
  'height adjustable': 'adjustable height',
  'adjustable hanging': 'adjustable height',
  'sloped ceiling': 'sloped ceiling compatible',
  'angled ceiling': 'sloped ceiling compatible',
  'vaulted ceiling': 'sloped ceiling compatible',
  'bulbs included': 'bulb(s) included',
  'lamp included': 'bulb(s) included',
  'dry rated': 'dry/damp rated',
  'damp rated': 'dry/damp rated',
  'wet rated': 'dry/damp rated',
  'location rating': 'dry/damp rated',
  'ul listed': 'etl/ul listed',
  'etl listed': 'etl/ul listed',
  'certifications': 'etl/ul listed',
  'certification': 'etl/ul listed',
  'safety listing': 'etl/ul listed',
  // Finish equivalents
  'color': 'finish',
  'finish color': 'finish',
  'finish/color': 'finish',
  // Shade equivalents
  'shade': 'shade material',
  'glass type': 'shade material',
  'diffuser material': 'shade material',
  'shade type': 'shade material',
  'globe material': 'shade material',
  // Crystal equivalents
  'crystal style': 'crystal type',
  'crystal cut': 'crystal type',
  // Canopy equivalents
  'canopy diameter': 'canopy size',
  'canopy dimensions': 'canopy size',
  'ceiling plate': 'canopy size',
  // Warranty equivalents
  'warranty': 'manufacturer warranty',
  'warranty period': 'warranty',
};

/**
 * KNOWN ATTRIBUTE VALUES (not attribute names)
 * These are VALUES that AI might incorrectly return as field keys
 * If we see these, we should NOT request them as missing attributes
 */
const KNOWN_ATTRIBUTE_VALUES = new Set([
  // Configuration values
  'single bowl', 'double bowl', 'triple bowl', 'single basin', 'double basin',
  // Mount type values
  'undermount', 'drop-in', 'undermount/drop-in', 'farmhouse', 'apron', 'vessel', 'wall mount',
  // Material values
  'stainless steel', 'fireclay', 'granite composite', 'cast iron', 'porcelain', 'copper',
  // Finish values
  'brushed nickel', 'chrome', 'matte black', 'polished chrome', 'oil rubbed bronze',
  // Boolean-like values
  'yes', 'no', 'true', 'false', 'included', 'not included',
  // Style values for appliances
  'french door', 'side-by-side', 'top freezer', 'bottom freezer',
  'front load', 'top load', 'gas', 'electric', 'induction',
]);

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
   * Normalize string by removing accents/diacritics
   */
  private normalizeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Match a brand name to SF picklist
   */
  matchBrand(brandName: string): MatchResult<Brand> {
    if (!brandName || !this.initialized) {
      return { matched: false, original: brandName, matchedValue: null, similarity: 0 };
    }

    const normalized = this.normalizeAccents(brandName.toUpperCase().trim());
    
    // Try exact match first (with accent normalization)
    const exactMatch = this.brands.find(b => 
      this.normalizeAccents(b.brand_name.toUpperCase()) === normalized
    );
    
    if (exactMatch) {
      return { matched: true, original: brandName, matchedValue: exactMatch, similarity: 1.0 };
    }

    // Find closest matches (with accent normalization in similarity)
    const scored = this.brands.map(b => ({
      brand: b,
      similarity: this.calculateSimilarity(
        this.normalizeAccents(brandName), 
        this.normalizeAccents(b.brand_name)
      )
    })).sort((a, b) => b.similarity - a.similarity);

    const best = scored[0];
    // Lowered threshold from 0.8 to 0.7 for more flexible matching
    if (best && best.similarity >= 0.7) {
      return { 
        matched: true, 
        original: brandName, 
        matchedValue: best.brand, 
        similarity: best.similarity,
        suggestions: scored.slice(1, 4).map(s => s.brand)
      };
    }
    
    // Additional fallback: partial match (one contains the other)
    const partialMatch = this.brands.find(b =>
      b.brand_name.toLowerCase().includes(brandName.toLowerCase()) ||
      brandName.toLowerCase().includes(b.brand_name.toLowerCase())
    );
    if (partialMatch) {
      return {
        matched: true,
        original: brandName,
        matchedValue: partialMatch,
        similarity: 0.65,
        suggestions: scored.slice(0, 3).map(s => s.brand)
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
    // Lowered threshold from 0.75 to 0.7 for more flexible matching
    if (best && best.similarity >= 0.7) {
      return { 
        matched: true, 
        original: categoryName, 
        matchedValue: best.category, 
        similarity: best.similarity,
        suggestions: scored.slice(1, 4).map(s => s.category)
      };
    }
    
    // Additional fallback: partial match
    const partialMatch = this.categories.find(c =>
      c.category_name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(c.category_name.toLowerCase())
    );
    if (partialMatch) {
      return {
        matched: true,
        original: categoryName,
        matchedValue: partialMatch,
        similarity: 0.65,
        suggestions: scored.slice(0, 3).map(s => s.category)
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
    // Lowered threshold from 0.8 to 0.7 for more flexible matching
    if (best && best.similarity >= 0.7) {
      return { 
        matched: true, 
        original: styleName, 
        matchedValue: best.style, 
        similarity: best.similarity,
        suggestions: scored.slice(1, 4).map(s => s.style)
      };
    }
    
    // Additional fallback: partial match
    const partialMatch = this.styles.find(s =>
      s.style_name.toLowerCase().includes(styleName.toLowerCase()) ||
      styleName.toLowerCase().includes(s.style_name.toLowerCase())
    );
    if (partialMatch) {
      return {
        matched: true,
        original: styleName,
        matchedValue: partialMatch,
        similarity: 0.65,
        suggestions: scored.slice(0, 3).map(s => s.style)
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
   * Check if an attribute is a PRIMARY ATTRIBUTE
   * Primary attributes are static, apply to ALL products, and have dedicated fields.
   * They should NOT be requested as missing from the SF attributes picklist.
   */
  isPrimaryAttribute(str: string): boolean {
    const normalized = str.toLowerCase().trim();
    
    // Direct match against primary attribute names
    if (PRIMARY_ATTRIBUTE_NAMES.has(normalized)) {
      return true;
    }
    
    // Check against field keys (snake_case)
    const snakeCased = normalized.replace(/\s+/g, '_').replace(/[()]/g, '');
    if (PRIMARY_ATTRIBUTE_FIELD_KEYS.has(snakeCased)) {
      return true;
    }
    
    // Check for partial matches on core dimension fields
    const coreTerms = ['width', 'height', 'depth', 'length', 'weight', 'msrp', 'brand', 'category', 'description', 'title', 'model', 'upc', 'gtin', 'features'];
    if (coreTerms.some(term => normalized === term || snakeCased === term)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a string looks like an attribute VALUE rather than an attribute NAME
   */
  isAttributeValue(str: string): boolean {
    const normalized = str.toLowerCase().trim();
    
    // Check against known values
    if (KNOWN_ATTRIBUTE_VALUES.has(normalized)) {
      return true;
    }
    
    // Looks like a dimension value (number + unit)
    if (/^\d+(\.\d+)?\s*(inches?|in|ft|cm|mm|lbs?|oz|gallons?|gal|cu\.?\s*ft)?$/i.test(str)) {
      return true;
    }
    
    // Looks like a boolean
    if (/^(yes|no|true|false|included|not included|n\/a)$/i.test(normalized)) {
      return true;
    }
    
    // Contains slash suggesting it's a value option (e.g., "Undermount/Drop-In")
    if (normalized.includes('/') && !normalized.includes('certified') && !normalized.includes('compliant')) {
      // Check if both parts look like known values
      const parts = normalized.split('/');
      if (parts.every(p => KNOWN_ATTRIBUTE_VALUES.has(p.trim()))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Match an attribute name to SF picklist
   */
  /**
   * Match an attribute name to SF picklist
   * @param attributeName - The attribute name to match
   * @param options - Optional settings
   * @param options.forceIdLookup - When true, bypasses isPrimaryAttribute check to always look up attribute_id
   *                                Use this for Top_Filter_Attribute_Ids where we need the ID even for primary attrs
   */
  matchAttribute(attributeName: string, options?: { forceIdLookup?: boolean }): MatchResult<Attribute> {
    if (!attributeName || !this.initialized) {
      return { matched: false, original: attributeName, matchedValue: null, similarity: 0 };
    }

    const normalized = attributeName.toLowerCase().trim();
    const forceIdLookup = options?.forceIdLookup ?? false;
    
    // Check if this is a PRIMARY ATTRIBUTE - these have dedicated fields and don't need picklist matching
    // UNLESS forceIdLookup is true (for Top_Filter_Attribute_Ids we still want the attribute_id)
    if (!forceIdLookup && this.isPrimaryAttribute(attributeName)) {
      logger.debug('Skipping attribute match - is a PRIMARY ATTRIBUTE with dedicated field', { attributeName });
      return { matched: true, original: attributeName, matchedValue: null, similarity: 1.0, isPrimaryAttribute: true } as any;
    }
    
    // Check if this looks like a VALUE, not an attribute name (skip this check when forcing ID lookup)
    if (!forceIdLookup && this.isAttributeValue(attributeName)) {
      logger.debug('Skipping attribute match - looks like a value not a name', { attributeName });
      return { matched: false, original: attributeName, matchedValue: null, similarity: 0, isValue: true } as any;
    }
    
    // First, check for semantic alias
    const aliasTarget = ATTRIBUTE_ALIASES[normalized];
    const searchTerm = aliasTarget || normalized;
    
    if (aliasTarget) {
      logger.info('Using attribute alias mapping', { original: normalized, mappedTo: aliasTarget });
    }
    
    // Try exact match (with alias)
    const exactMatch = this.attributes.find(a => 
      a.attribute_name.toLowerCase() === searchTerm
    );
    
    if (exactMatch) {
      return { matched: true, original: attributeName, matchedValue: exactMatch, similarity: 1.0 };
    }

    // Score all attributes against the search term
    const scored = this.attributes.map(a => ({
      attribute: a,
      similarity: this.calculateSimilarity(searchTerm, a.attribute_name)
    })).sort((a, b) => b.similarity - a.similarity);

    const best = scored[0];
    // Threshold of 0.6 (60%) for flexible matching
    if (best && best.similarity >= 0.6) {
      logger.info('Attribute matched via similarity', { 
        original: attributeName, 
        matched: best.attribute.attribute_name,
        similarity: best.similarity 
      });
      return { 
        matched: true, 
        original: attributeName, 
        matchedValue: best.attribute, 
        similarity: best.similarity,
        suggestions: scored.slice(1, 4).map(s => s.attribute)
      };
    }
    
    // Additional fallback: partial match (one contains the other)
    const partialMatch = this.attributes.find(a =>
      a.attribute_name.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(a.attribute_name.toLowerCase())
    );
    if (partialMatch) {
      return {
        matched: true,
        original: attributeName,
        matchedValue: partialMatch,
        similarity: 0.55,
        suggestions: scored.slice(0, 3).map(s => s.attribute)
      };
    }
    
    // Word-based fallback: match if all significant words match
    const searchWords = searchTerm.split(/[\s\-_\/]+/).filter(w => w.length > 2);
    if (searchWords.length > 0) {
      const wordMatch = this.attributes.find(a => {
        const attrWords = a.attribute_name.toLowerCase().split(/[\s\-_\/]+/).filter(w => w.length > 2);
        // Check if search term's words are a subset of attribute words or vice versa
        const searchInAttr = searchWords.every(sw => attrWords.some(aw => aw.includes(sw) || sw.includes(aw)));
        const attrInSearch = attrWords.every(aw => searchWords.some(sw => sw.includes(aw) || aw.includes(sw)));
        return searchInAttr || attrInSearch;
      });
      if (wordMatch) {
        logger.info('Attribute matched via word-based fallback', {
          original: attributeName,
          matched: wordMatch.attribute_name
        });
        return {
          matched: true,
          original: attributeName,
          matchedValue: wordMatch,
          similarity: 0.5,
          suggestions: scored.slice(0, 3).map(s => s.attribute)
        };
      }
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

  /**
   * Validate picklist data quality before sync
   * Returns validation errors if data is suspicious/corrupted
   */
  private validatePicklistData(
    type: 'attributes' | 'brands' | 'categories' | 'styles',
    newData: any[]
  ): string[] {
    const errors: string[] = [];

    // Rule 1: Check for corruption patterns (field names embedded in values)
    const corruptionPatterns = ['brand_id', 'attribute_id', 'category_id', 'style_id', 'brand_name'];
    
    for (const item of newData) {
      if (type === 'brands' && item.brand_name) {
        for (const pattern of corruptionPatterns) {
          if (item.brand_name.includes(pattern)) {
            errors.push(
              `Detected corruption in ${type}: "${item.brand_name}" contains "${pattern}" - data appears corrupted`
            );
            break;
          }
        }
      }
      if (type === 'attributes' && item.attribute_name) {
        for (const pattern of corruptionPatterns) {
          if (item.attribute_name.includes(pattern)) {
            errors.push(
              `Detected corruption in ${type}: "${item.attribute_name}" contains "${pattern}" - data appears corrupted`
            );
            break;
          }
        }
      }
      if (type === 'categories' && item.category_name) {
        for (const pattern of corruptionPatterns) {
          if (item.category_name.includes(pattern)) {
            errors.push(
              `Detected corruption in ${type}: "${item.category_name}" contains "${pattern}" - data appears corrupted`
            );
            break;
          }
        }
      }
      if (type === 'styles' && item.style_name) {
        for (const pattern of corruptionPatterns) {
          if (item.style_name.includes(pattern)) {
            errors.push(
              `Detected corruption in ${type}: "${item.style_name}" contains "${pattern}" - data appears corrupted`
            );
            break;
          }
        }
      }
      if (errors.length >= 3) break; // Only report first 3 corruption examples
    }

    return errors;
  }

  /**
   * Bulk sync picklists from Salesforce - INCREMENTAL ADD/UPDATE STRATEGY
   * This ADDS new items or UPDATES existing items, but NEVER deletes
   * SF sends only the items they want to add/update, not the full list
   */
  async syncPicklists(data: {
    attributes?: Attribute[];
    brands?: Brand[];
    categories?: Category[];
    styles?: Style[];
    category_filter_attributes?: any; // JSON object mapping categories to filter attributes
  }): Promise<{
    success: boolean;
    updated: { type: string; previous: number; current: number; added: number; updated: number }[];
    errors: string[];
  }> {
    const updated: { type: string; previous: number; current: number; added: number; updated: number }[] = [];
    const errors: string[] = [];
    const projectRoot = path.resolve(__dirname, '../../');
    const picklistDir = path.join(projectRoot, 'src/config/salesforce-picklists');

    // Sync attributes - INCREMENTAL ADD/UPDATE
    if (data.attributes && Array.isArray(data.attributes)) {
      try {
        const prevCount = this.attributes.length;
        
        // Validate data quality before sync
        const validationErrors = this.validatePicklistData('attributes', data.attributes!);
        if (validationErrors.length > 0) {
          validationErrors.forEach(err => {
            errors.push(err);
            logger.error('Attribute sync validation failed', { error: err, incoming: data.attributes!.length });
          });
          logger.warn('Skipping corrupted attributes', { count: data.attributes!.length });
        } else {
          // Create a map of existing attributes by ID
          const existingMap = new Map(this.attributes.map(attr => [attr.attribute_id, attr]));
          let addedCount = 0;
          let updatedCount = 0;

          // Add or update each incoming attribute
          for (const incomingAttr of data.attributes) {
            if (existingMap.has(incomingAttr.attribute_id)) {
              // Update existing
              const existing = existingMap.get(incomingAttr.attribute_id);
              if (JSON.stringify(existing) !== JSON.stringify(incomingAttr)) {
                existingMap.set(incomingAttr.attribute_id, incomingAttr);
                updatedCount++;
              }
            } else {
              // Add new
              existingMap.set(incomingAttr.attribute_id, incomingAttr);
              addedCount++;
            }
          }

          // Convert map back to array
          const mergedAttributes = Array.from(existingMap.values());
          
          // Save to file and update cache
          const filePath = path.join(picklistDir, 'attributes.json');
          fs.writeFileSync(filePath, JSON.stringify(mergedAttributes, null, 2));
          this.attributes = mergedAttributes;
          
          updated.push({
            type: 'attributes',
            previous: prevCount,
            current: mergedAttributes.length,
            added: addedCount,
            updated: updatedCount
          });
          
          logger.info('Attributes synced successfully (incremental)', { 
            previous: prevCount, 
            current: mergedAttributes.length,
            added: addedCount,
            updated: updatedCount
          });
        }
      } catch (error: any) {
        errors.push(`Failed to sync attributes: ${error.message}`);
        logger.error('Failed to sync attributes', { error });
      }
    }

    // Sync brands - INCREMENTAL ADD/UPDATE
    if (data.brands && Array.isArray(data.brands)) {
      try {
        const prevCount = this.brands.length;
        
        // Validate data quality before sync
        const validationErrors = this.validatePicklistData('brands', data.brands!);
        if (validationErrors.length > 0) {
          validationErrors.forEach(err => {
            errors.push(err);
            logger.error('Brand sync validation failed', { error: err, incoming: data.brands!.length });
          });
          logger.warn('Skipping corrupted brands', { count: data.brands!.length });
        } else {
          // Create a map of existing brands by ID
          const existingMap = new Map(this.brands.map(brand => [brand.brand_id, brand]));
          let addedCount = 0;
          let updatedCount = 0;

          // Add or update each incoming brand
          for (const incomingBrand of data.brands) {
            if (existingMap.has(incomingBrand.brand_id)) {
              // Update existing
              const existing = existingMap.get(incomingBrand.brand_id);
              if (JSON.stringify(existing) !== JSON.stringify(incomingBrand)) {
                existingMap.set(incomingBrand.brand_id, incomingBrand);
                updatedCount++;
              }
            } else {
              // Add new
              existingMap.set(incomingBrand.brand_id, incomingBrand);
              addedCount++;
            }
          }

          // Convert map back to array
          const mergedBrands = Array.from(existingMap.values());
          
          // Save to file and update cache
          const filePath = path.join(picklistDir, 'brands.json');
          fs.writeFileSync(filePath, JSON.stringify(mergedBrands, null, 2));
          this.brands = mergedBrands;
          
          updated.push({
            type: 'brands',
            previous: prevCount,
            current: mergedBrands.length,
            added: addedCount,
            updated: updatedCount
          });
          
          logger.info('Brands synced successfully (incremental)', { 
            previous: prevCount, 
            current: mergedBrands.length,
            added: addedCount,
            updated: updatedCount
          });
        }
      } catch (error: any) {
        errors.push(`Failed to sync brands: ${error.message}`);
        logger.error('Failed to sync brands', { error });
      }
    }

    // Sync categories - INCREMENTAL ADD/UPDATE
    if (data.categories && Array.isArray(data.categories)) {
      try {
        const prevCount = this.categories.length;
        
        // Validate data quality before sync
        const validationErrors = this.validatePicklistData('categories', data.categories!);
        if (validationErrors.length > 0) {
          validationErrors.forEach(err => {
            errors.push(err);
            logger.error('Category sync validation failed', { error: err, incoming: data.categories!.length });
          });
          logger.warn('Skipping corrupted categories', { count: data.categories!.length });
        } else {
          // Create a map of existing categories by ID
          const existingMap = new Map(this.categories.map(cat => [cat.category_id, cat]));
          let addedCount = 0;
          let updatedCount = 0;

          // Add or update each incoming category
          for (const incomingCat of data.categories) {
            if (existingMap.has(incomingCat.category_id)) {
              // Update existing
              const existing = existingMap.get(incomingCat.category_id);
              if (JSON.stringify(existing) !== JSON.stringify(incomingCat)) {
                existingMap.set(incomingCat.category_id, incomingCat);
                updatedCount++;
              }
            } else {
              // Add new
              existingMap.set(incomingCat.category_id, incomingCat);
              addedCount++;
            }
          }

          // Convert map back to array
          const mergedCategories = Array.from(existingMap.values());
          
          // Save to file and update cache
          const filePath = path.join(picklistDir, 'categories.json');
          fs.writeFileSync(filePath, JSON.stringify(mergedCategories, null, 2));
          this.categories = mergedCategories;
          
          updated.push({
            type: 'categories',
            previous: prevCount,
            current: mergedCategories.length,
            added: addedCount,
            updated: updatedCount
          });
          
          logger.info('Categories synced successfully (incremental)', { 
            previous: prevCount, 
            current: mergedCategories.length,
            added: addedCount,
            updated: updatedCount
          });
        }
      } catch (error: any) {
        errors.push(`Failed to sync categories: ${error.message}`);
        logger.error('Failed to sync categories', { error });
      }
    }

    // Sync styles - INCREMENTAL ADD/UPDATE
    if (data.styles && Array.isArray(data.styles)) {
      try {
        const prevCount = this.styles.length;
        
        // Validate data quality before sync
        const validationErrors = this.validatePicklistData('styles', data.styles!);
        if (validationErrors.length > 0) {
          validationErrors.forEach(err => {
            errors.push(err);
            logger.error('Style sync validation failed', { error: err, incoming: data.styles!.length });
          });
          logger.warn('Skipping corrupted styles', { count: data.styles!.length });
        } else {
          // Create a map of existing styles by ID
          const existingMap = new Map(this.styles.map(style => [style.style_id, style]));
          let addedCount = 0;
          let updatedCount = 0;

          // Add or update each incoming style
          for (const incomingStyle of data.styles) {
            if (existingMap.has(incomingStyle.style_id)) {
              // Update existing
              const existing = existingMap.get(incomingStyle.style_id);
              if (JSON.stringify(existing) !== JSON.stringify(incomingStyle)) {
                existingMap.set(incomingStyle.style_id, incomingStyle);
                updatedCount++;
              }
            } else {
              // Add new
              existingMap.set(incomingStyle.style_id, incomingStyle);
              addedCount++;
            }
          }

          // Convert map back to array
          const mergedStyles = Array.from(existingMap.values());
          
          // Save to file and update cache
          const filePath = path.join(picklistDir, 'styles.json');
          fs.writeFileSync(filePath, JSON.stringify(mergedStyles, null, 2));
          this.styles = mergedStyles;
          
          updated.push({
            type: 'styles',
            previous: prevCount,
            current: mergedStyles.length,
            added: addedCount,
            updated: updatedCount
          });
          
          logger.info('Styles synced successfully (incremental)', { 
            previous: prevCount, 
            current: mergedStyles.length,
            added: addedCount,
            updated: updatedCount
          });
        }
      } catch (error: any) {
        errors.push(`Failed to sync styles: ${error.message}`);
        logger.error('Failed to sync styles', { error });
      }
    }

    // Sync category filter attributes - INCREMENTAL ADD/UPDATE
    if (data.category_filter_attributes && typeof data.category_filter_attributes === 'object') {
      try {
        const filePath = path.join(picklistDir, 'category-filter-attributes.json');
        
        // Load existing data
        let existingData: any = {};
        let prevCount = 0;
        try {
          existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          prevCount = Object.keys(existingData).length;
        } catch {
          prevCount = 0;
        }
        
        // Merge incoming data with existing (adds new categories or updates existing)
        const mergedData = { ...existingData, ...data.category_filter_attributes };
        const newCount = Object.keys(mergedData).length;
        const addedCount = newCount - prevCount;
        
        // Write merged data
        fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));
        
        updated.push({
          type: 'category_filter_attributes',
          previous: prevCount,
          current: newCount,
          added: addedCount,
          updated: Object.keys(data.category_filter_attributes).length - addedCount
        });
        
        logger.info('Category filter attributes synced successfully (incremental)', { 
          previous: prevCount, 
          current: newCount,
          added: addedCount,
          updated: Object.keys(data.category_filter_attributes).length - addedCount
        });
      } catch (error: any) {
        errors.push(`Failed to sync category filter attributes: ${error.message}`);
        logger.error('Failed to sync category filter attributes', { error });
      }
    }

    return {
      success: errors.length === 0,
      updated,
      errors
    };
  }
}

// Export singleton instance
export const picklistMatcher = new PicklistMatcherService();
export default picklistMatcher;
