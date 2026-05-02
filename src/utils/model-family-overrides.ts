/**
 * MODEL-FAMILY OVERRIDES
 * ======================
 * Brand+model-prefix-based corrections for products where AI consensus
 * consistently misclassifies a known product family.
 *
 * Use sparingly. Only add entries when:
 *  1. Both AIs reliably agree on the WRONG value for a specific family
 *  2. The correct value is well-documented (manufacturer datasheet)
 *  3. The pattern affects multiple SKUs (or a high-visibility single SKU)
 *
 * Loaded lazily; failures are non-fatal (returns empty override).
 */

import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

export interface ModelFamilyOverride {
  type?: string;
  configuration?: string;
  subcategory?: string;
  style?: string;
}

interface OverrideTable {
  [brand: string]: {
    [modelPrefix: string]: ModelFamilyOverride & { _note?: string };
  };
}

let cachedTable: OverrideTable | null = null;

function loadTable(): OverrideTable {
  if (cachedTable) return cachedTable;
  try {
    const filePath = path.join(__dirname, '../config/model-family-overrides.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    delete parsed._documentation;
    cachedTable = parsed as OverrideTable;
    return cachedTable;
  } catch (err) {
    logger.warn('Failed to load model-family-overrides.json', {
      error: err instanceof Error ? err.message : String(err)
    });
    cachedTable = {};
    return cachedTable;
  }
}

/**
 * Look up overrides for a given brand + model number.
 * Returns the longest matching prefix entry, or empty object if none.
 */
export function getModelFamilyOverride(
  brand: string | undefined | null,
  modelNumber: string | undefined | null
): ModelFamilyOverride {
  if (!brand || !modelNumber) return {};
  const table = loadTable();
  const brandKey = Object.keys(table).find(k => k.toUpperCase() === brand.toUpperCase());
  if (!brandKey) return {};
  const families = table[brandKey];
  const modelUpper = String(modelNumber).toUpperCase().trim();
  // Sort prefixes by length DESC so longest match wins (FAB32 over FAB)
  const sortedPrefixes = Object.keys(families).sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (modelUpper.startsWith(prefix.toUpperCase())) {
      const entry = families[prefix];
      // Strip metadata (_note, _comment etc.)
      const cleaned: ModelFamilyOverride = {};
      if (entry.type) cleaned.type = entry.type;
      if (entry.configuration !== undefined) cleaned.configuration = entry.configuration;
      if (entry.subcategory) cleaned.subcategory = entry.subcategory;
      if (entry.style) cleaned.style = entry.style;
      return cleaned;
    }
  }
  return {};
}
