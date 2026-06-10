/**
 * G2 unit tests for findInSpecificationTable — the first pipeline-logic tests (CON-06 starter).
 *
 * Per the 5-Test Contract (PLATFORM-AUDIT-GUIDE §6.0): fixtures are REAL stored payloads from the
 * committed golden set (audit-results/golden-set/payloads/), not mocks. T1 = true positives per
 * HTML format; T2 = passthrough/negative — including the exact Finding #078 Bug A regression
 * (adjacent spec rows must never bleed into the extracted value).
 */
import * as fs from 'fs';
import * as path from 'path';
import { findInSpecificationTable } from '../../utils/spec-table-extractor';

const PAYLOAD_DIR = path.join(__dirname, '../../../audit-results/golden-set/payloads');

function loadSpecTable(sku: string): string {
  const file = path.join(PAYLOAD_DIR, `${sku}.json`);
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  return doc.rawPayload.Specification_Table as string;
}

describe('findInSpecificationTable', () => {
  describe('T1 — true positives on real stored payloads', () => {
    it('Format A (table cells, Bosch B18IF70NSP): Color → Stainless Steel', () => {
      const spec = loadSpecTable('B18IF70NSP');
      expect(findInSpecificationTable(spec, ['Color'])).toBe('Stainless Steel');
    });

    it('Format C (alternating <li>, Insignia NS-CZ14WH2): Color Finish → White', () => {
      const spec = loadSpecTable('NS-CZ14WH2');
      expect(findInSpecificationTable(spec, ['Color Finish'])).toBe('White');
    });

    it('Format C (alternating <li>, Insignia NS-CZ70WH26L): Color Finish → White', () => {
      const spec = loadSpecTable('NS-CZ70WH26L');
      expect(findInSpecificationTable(spec, ['Color Finish'])).toBe('White');
    });

    it('first matching attribute name in the list wins', () => {
      const spec = loadSpecTable('NS-CZ14WH2');
      expect(findInSpecificationTable(spec, ['Nonexistent', 'Color Finish'])).toBe('White');
    });

    // Formats B and D use synthetic fixtures mirroring exact production HTML shapes
    // (documented in Finding #078; no SKU with these formats landed in the golden export).
    it('Format B (<li>Key - Value</li>, Best Buy single-item style)', () => {
      const spec = '<ul><li>Color Finish - Stainless steel look</li><li>Product Height - 56 1/8 inches</li></ul>';
      expect(findInSpecificationTable(spec, ['Color Finish'])).toBe('Stainless steel look');
    });

    it('Format D (<p>Key: Value</p>, Best Buy paragraph style)', () => {
      const spec = '<p>Color: White</p><p>Color Finish: White</p><p>Product Width: 43 15/16 inches</p>';
      expect(findInSpecificationTable(spec, ['Color'])).toBe('White');
    });
  });

  describe('T2 — passthrough / negative (the #078 Bug A regression guards)', () => {
    it('NEVER bleeds adjacent spec rows into the value (NS-CZ70WH26L produced "White Product Height 33.5 inches…" pre-fix)', () => {
      const spec = loadSpecTable('NS-CZ70WH26L');
      const val = findInSpecificationTable(spec, ['Color Finish']);
      expect(val).not.toMatch(/height|width|inch/i);
      expect((val || '').length).toBeLessThanOrEqual(30);
    });

    it('returns null when the attribute is absent', () => {
      const spec = loadSpecTable('NS-CZ14WH2');
      expect(findInSpecificationTable(spec, ['Totally Absent Attribute'])).toBeNull();
    });

    it('returns null for empty/undefined/null input', () => {
      expect(findInSpecificationTable(null, ['Color'])).toBeNull();
      expect(findInSpecificationTable(undefined, ['Color'])).toBeNull();
      expect(findInSpecificationTable('', ['Color'])).toBeNull();
    });

    it('rejects over-long captures (>80 chars) instead of returning garbage', () => {
      const long = 'X'.repeat(120);
      const spec = `<p>Color: ${long}</p>`;
      expect(findInSpecificationTable(spec, ['Color'])).toBeNull();
    });

    it('regex metacharacters in attribute names are escaped, not executed', () => {
      const spec = '<p>Size (W x H): 30 x 40</p>';
      expect(findInSpecificationTable(spec, ['Size (W x H)'])).toBe('30 x 40');
    });
  });
});
