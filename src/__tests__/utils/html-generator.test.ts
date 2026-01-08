import {
  generateAttributeTable,
  formatAttributeName,
  formatAttributeValue,
} from '../../utils/html-generator';

describe('HTML Generator Utility', () => {
  describe('formatAttributeName', () => {
    it('should convert camelCase to Title Case', () => {
      expect(formatAttributeName('productName')).toBe('Product Name');
    });

    it('should convert snake_case to Title Case', () => {
      expect(formatAttributeName('product_name')).toBe('Product Name');
    });

    it('should convert kebab-case to Title Case', () => {
      expect(formatAttributeName('product-name')).toBe('Product Name');
    });

    it('should capitalize single words', () => {
      expect(formatAttributeName('color')).toBe('Color');
    });
  });

  describe('formatAttributeValue', () => {
    it('should format boolean values', () => {
      expect(formatAttributeValue(true)).toBe('Yes');
      expect(formatAttributeValue(false)).toBe('No');
    });

    it('should format numbers with locale', () => {
      expect(formatAttributeValue(1000)).toBe('1,000');
    });

    it('should format arrays', () => {
      expect(formatAttributeValue(['a', 'b', 'c'])).toBe('a, b, c');
    });

    it('should return dash for null/undefined', () => {
      expect(formatAttributeValue(null)).toBe('-');
      expect(formatAttributeValue(undefined)).toBe('-');
    });

    it('should stringify objects', () => {
      const result = formatAttributeValue({ key: 'value' });
      expect(result).toBe('{"key":"value"}');
    });
  });

  describe('generateAttributeTable', () => {
    it('should generate valid HTML table', () => {
      const attributes = {
        color: 'red',
        size: 'medium',
      };

      const html = generateAttributeTable(attributes);

      expect(html).toContain('<table');
      expect(html).toContain('</table>');
      expect(html).toContain('Color');
      expect(html).toContain('red');
      expect(html).toContain('Size');
      expect(html).toContain('medium');
    });

    it('should include styles by default', () => {
      const html = generateAttributeTable({ color: 'red' });
      expect(html).toContain('<style>');
    });

    it('should exclude styles when disabled', () => {
      const html = generateAttributeTable({ color: 'red' }, { includeStyles: false });
      expect(html).not.toContain('<style>');
    });

    it('should show empty message for empty attributes', () => {
      const html = generateAttributeTable({});
      expect(html).toContain('No additional attributes');
    });

    it('should filter out null/undefined values', () => {
      const attributes = {
        color: 'red',
        size: null,
        weight: undefined,
        material: '',
      };

      const html = generateAttributeTable(attributes);

      expect(html).toContain('Color');
      expect(html).not.toContain('Size');
      expect(html).not.toContain('Weight');
      expect(html).not.toContain('Material');
    });

    it('should use custom table class', () => {
      const html = generateAttributeTable(
        { color: 'red' },
        { tableClass: 'custom-table', includeStyles: false }
      );
      expect(html).toContain('class="custom-table"');
    });
  });
});
