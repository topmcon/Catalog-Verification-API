// Use the manual mock at __mocks__/utils/logger.ts
jest.mock('../../utils/logger');

import {
  cleanProduct,
  cleanProducts,
  normalizeString,
  normalizeNumber,
  normalizeStatus,
  normalizeUrl,
  generateSKU,
  extractAdditionalAttributes,
} from '../../utils/data-cleaner';
import { RawProduct } from '../../types/product.types';

describe('Data Cleaner Utility', () => {
  describe('normalizeString', () => {
    it('should trim whitespace', () => {
      expect(normalizeString('  hello world  ')).toBe('hello world');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeString('hello    world')).toBe('hello world');
    });

    it('should return undefined for null/undefined', () => {
      expect(normalizeString(null)).toBeUndefined();
      expect(normalizeString(undefined)).toBeUndefined();
    });

    it('should return undefined for empty strings', () => {
      expect(normalizeString('')).toBeUndefined();
      expect(normalizeString('   ')).toBeUndefined();
    });

    it('should convert numbers to strings', () => {
      expect(normalizeString(123)).toBe('123');
    });
  });

  describe('normalizeNumber', () => {
    it('should return numbers as-is', () => {
      expect(normalizeNumber(123.45)).toBe(123.45);
    });

    it('should parse string numbers', () => {
      expect(normalizeNumber('123.45')).toBe(123.45);
    });

    it('should handle currency symbols', () => {
      expect(normalizeNumber('$99.99')).toBe(99.99);
      // European format with comma - our simple parser treats comma as thousands separator
      expect(normalizeNumber('€50.00')).toBe(50);
    });

    it('should return undefined for invalid values', () => {
      expect(normalizeNumber('abc')).toBeUndefined();
      expect(normalizeNumber(null)).toBeUndefined();
      expect(normalizeNumber(undefined)).toBeUndefined();
    });

    it('should handle NaN', () => {
      expect(normalizeNumber(NaN)).toBeUndefined();
    });
  });

  describe('normalizeStatus', () => {
    it('should normalize active statuses', () => {
      expect(normalizeStatus('active')).toBe('active');
      expect(normalizeStatus('Active')).toBe('active');
      expect(normalizeStatus('available')).toBe('active');
      expect(normalizeStatus('enabled')).toBe('active');
      expect(normalizeStatus('in_stock')).toBe('active');
    });

    it('should normalize inactive statuses', () => {
      expect(normalizeStatus('inactive')).toBe('inactive');
      expect(normalizeStatus('disabled')).toBe('inactive');
    });

    it('should normalize discontinued status', () => {
      expect(normalizeStatus('discontinued')).toBe('discontinued');
    });

    it('should normalize out of stock statuses', () => {
      expect(normalizeStatus('out_of_stock')).toBe('out_of_stock');
      expect(normalizeStatus('oos')).toBe('out_of_stock');
      expect(normalizeStatus('sold_out')).toBe('out_of_stock');
    });

    it('should default to inactive for unknown statuses', () => {
      expect(normalizeStatus('unknown')).toBe('inactive');
      expect(normalizeStatus(null)).toBe('inactive');
    });
  });

  describe('normalizeUrl', () => {
    it('should return valid URLs as-is', () => {
      expect(normalizeUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    });

    it('should add https:// prefix if missing', () => {
      expect(normalizeUrl('example.com/image.jpg')).toBe('https://example.com/image.jpg');
    });

    it('should return undefined for invalid URLs', () => {
      expect(normalizeUrl('')).toBeUndefined();
      expect(normalizeUrl(null)).toBeUndefined();
    });
  });

  describe('generateSKU', () => {
    it('should generate a valid SKU', () => {
      const product: RawProduct = {
        id: 'test123',
        name: 'Test Product',
        category: 'Electronics',
      };
      const sku = generateSKU(product);
      expect(sku).toMatch(/^ELE-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it('should use GEN prefix when no category', () => {
      const product: RawProduct = {
        id: 'test123',
        name: 'Test Product',
      };
      const sku = generateSKU(product);
      expect(sku).toMatch(/^GEN-/);
    });
  });

  describe('extractAdditionalAttributes', () => {
    it('should extract non-primary attributes', () => {
      const product: RawProduct = {
        id: 'test123',
        name: 'Test Product',
        attributes: {
          color: 'red',
          size: 'medium',
          material: 'plastic',
        },
      };
      const additional = extractAdditionalAttributes(product);
      expect(additional).toHaveProperty('color', 'red');
      expect(additional).toHaveProperty('size', 'medium');
      expect(additional).toHaveProperty('material', 'plastic');
    });

    it('should not include reserved keys', () => {
      const product: RawProduct = {
        id: 'test123',
        name: 'Test Product',
        description: 'Test description',
      };
      const additional = extractAdditionalAttributes(product);
      expect(additional).not.toHaveProperty('id');
      expect(additional).not.toHaveProperty('name');
      expect(additional).not.toHaveProperty('description');
    });
  });

  describe('cleanProduct', () => {
    it('should clean a raw product', () => {
      const raw: RawProduct = {
        id: 'prod123',
        name: '  Widget X  ',
        description: 'A high-quality widget.',
        category: 'Electronics',
        price: 99.99,
        sku: 'WID-001',
        status: 'active',
        attributes: {
          color: 'red',
        },
      };

      const cleaned = cleanProduct(raw);

      expect(cleaned.originalId).toBe('prod123');
      expect(cleaned.ProductName).toBe('Widget X');
      expect(cleaned.Description).toBe('A high-quality widget.');
      expect(cleaned.PrimaryCategory).toBe('Electronics');
      expect(cleaned.Price).toBe(99.99);
      expect(cleaned.SKU).toBe('WID-001');
      expect(cleaned.Status).toBe('active');
      expect(cleaned.additionalAttributes).toHaveProperty('color', 'red');
    });

    it('should generate SKU if not provided', () => {
      const raw: RawProduct = {
        id: 'prod123',
        name: 'Widget X',
      };

      const cleaned = cleanProduct(raw);
      expect(cleaned.SKU).toBeTruthy();
      expect(cleaned.SKU.length).toBeGreaterThan(0);
    });
  });

  describe('cleanProducts', () => {
    it('should clean multiple products', () => {
      const raw: RawProduct[] = [
        { id: 'prod1', name: 'Product 1' },
        { id: 'prod2', name: 'Product 2' },
      ];

      const cleaned = cleanProducts(raw);

      expect(cleaned).toHaveLength(2);
      expect(cleaned[0].originalId).toBe('prod1');
      expect(cleaned[1].originalId).toBe('prod2');
    });
  });
});
