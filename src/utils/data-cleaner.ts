import _ from 'lodash';
import { RawProduct, CleanedProduct, RawProductAttribute } from '../types/product.types';
import { verifiedFieldNames } from '../config/verified-fields';
import logger from './logger';

/**
 * Data Cleaner Utility
 * Handles normalization and cleaning of raw product data
 */

/**
 * Clean and normalize a single product
 */
export function cleanProduct(rawProduct: RawProduct): CleanedProduct {
  logger.debug(`Cleaning product: ${rawProduct.id}`);

  // Extract and normalize primary fields
  const cleanedProduct: CleanedProduct = {
    originalId: rawProduct.id,
    ProductName: normalizeString(rawProduct.name) || '',
    SKU: normalizeString(rawProduct.sku) || generateSKU(rawProduct),
    Price: normalizeNumber(rawProduct.price) || 0,
    Description: normalizeString(rawProduct.description) || '',
    PrimaryCategory: normalizeString(rawProduct.category) || 'Uncategorized',
    Brand: normalizeString(rawProduct.brand),
    Quantity: normalizeNumber(rawProduct.quantity),
    Status: normalizeStatus(rawProduct.status),
    ImageURL: normalizeUrl(rawProduct.imageUrl),
    Weight: normalizeNumber(rawProduct.weight),
    additionalAttributes: {},
    rawData: rawProduct,
  };

  // Extract additional attributes that don't match verified fields
  cleanedProduct.additionalAttributes = extractAdditionalAttributes(rawProduct);

  return cleanedProduct;
}

/**
 * Clean multiple products in batch
 */
export function cleanProducts(rawProducts: RawProduct[]): CleanedProduct[] {
  logger.info(`Cleaning batch of ${rawProducts.length} products`);
  return rawProducts.map(product => cleanProduct(product));
}

/**
 * Normalize a string value
 */
export function normalizeString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  
  const str = String(value).trim();
  
  if (str.length === 0) {
    return undefined;
  }

  // Remove excessive whitespace
  return str.replace(/\s+/g, ' ');
}

/**
 * Normalize a number value
 */
export function normalizeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  // Handle string numbers
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$€£¥,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? undefined : value;
  }

  return undefined;
}

/**
 * Normalize product status
 */
export function normalizeStatus(value: unknown): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    available: 'active',
    in_stock: 'active',
    enabled: 'active',
    inactive: 'inactive',
    disabled: 'inactive',
    discontinued: 'discontinued',
    out_of_stock: 'out_of_stock',
    oos: 'out_of_stock',
    sold_out: 'out_of_stock',
  };

  const normalized = normalizeString(value)?.toLowerCase().replace(/[\s-]/g, '_');
  return normalized ? statusMap[normalized] || 'inactive' : 'inactive';
}

/**
 * Normalize URL
 */
export function normalizeUrl(value: unknown): string | undefined {
  const str = normalizeString(value);
  if (!str) return undefined;

  // Basic URL validation
  try {
    new URL(str);
    return str;
  } catch {
    // Try adding https:// prefix
    try {
      const withProtocol = `https://${str}`;
      new URL(withProtocol);
      return withProtocol;
    } catch {
      return undefined;
    }
  }
}

/**
 * Generate a SKU if not provided
 */
export function generateSKU(product: RawProduct): string {
  const prefix = (product.category || 'GEN').substring(0, 3).toUpperCase();
  const idPart = product.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${idPart}-${timestamp}`;
}

/**
 * Extract attributes that don't match verified fields
 */
export function extractAdditionalAttributes(rawProduct: RawProduct): RawProductAttribute {
  const additional: RawProductAttribute = {};
  const verifiedLower = verifiedFieldNames.map(f => f.toLowerCase());
  
  // Reserved keys that are handled separately
  const reservedKeys = ['id', 'name', 'description', 'category', 'price', 'sku', 
                        'brand', 'quantity', 'status', 'imageurl', 'weight', 'rawData'];

  // Process direct product properties
  for (const [key, value] of Object.entries(rawProduct)) {
    const keyLower = key.toLowerCase();
    if (!reservedKeys.includes(keyLower) && 
        !verifiedLower.includes(keyLower) && 
        value !== null && 
        value !== undefined) {
      additional[key] = value as string | number | boolean;
    }
  }

  // Process nested attributes object
  if (rawProduct.attributes && typeof rawProduct.attributes === 'object') {
    for (const [key, value] of Object.entries(rawProduct.attributes)) {
      const keyLower = key.toLowerCase();
      if (!verifiedLower.includes(keyLower) && value !== null && value !== undefined) {
        additional[key] = value;
      }
    }
  }

  return additional;
}

/**
 * Convert weight between units
 */
export function convertWeight(value: number, fromUnit: string, toUnit: string): number {
  const toKg: Record<string, number> = {
    kg: 1,
    g: 0.001,
    lb: 0.453592,
    oz: 0.0283495,
  };

  const fromKgValue = value * (toKg[fromUnit.toLowerCase()] || 1);
  return fromKgValue / (toKg[toUnit.toLowerCase()] || 1);
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  cleanProduct,
  cleanProducts,
  normalizeString,
  normalizeNumber,
  normalizeStatus,
  normalizeUrl,
  generateSKU,
  extractAdditionalAttributes,
  convertWeight,
  sanitizeHtml,
};
