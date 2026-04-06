/**
 * FergusonExtractCheck — Shows what Phase 0.1A extracted from Ferguson_Raw_Data.
 *
 * Compares the product before and after Phase 0.1A extraction so the debug
 * report can distinguish "Salesforce sent this" from "Phase 0.1A populated this".
 */

import { SalesforceIncomingProduct } from '../../../types/salesforce.types';
import { FergusonExtractSection } from '../DebugReport';

const FERGUSON_FLAT_FIELDS = [
  'Ferguson_Title',
  'Ferguson_Brand',
  'Ferguson_Model_Number',
  'Ferguson_URL',
  'Ferguson_Description',
  'Ferguson_Price',
  'Ferguson_Finish',
  'Ferguson_Color',
  'Ferguson_Base_Category',
  'Ferguson_Base_Type',
  'Ferguson_Product_Type',
  'Ferguson_Business_Category',
  'Ferguson_Width',
  'Ferguson_Height',
  'Ferguson_Depth',
  'Ferguson_Diameter',
  'Ferguson_Collection',
  'Ferguson_Certifications',
  'Ferguson_Manufacturer_Warranty',
  'Ferguson_Categories',
  'Ferguson_Related_Categories',
  'Ferguson_Min_Price',
  'Ferguson_Max_Price',
] as const;

/**
 * Take a snapshot of the flat Ferguson_ fields on the product object.
 * Call once BEFORE Phase 0.1A runs, and once AFTER — the diff is what was extracted.
 */
export function snapshotFergusonFields(product: SalesforceIncomingProduct): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const field of FERGUSON_FLAT_FIELDS) {
    const val = (product as any)[field];
    if (val && typeof val === 'string' && val.trim()) {
      snap[field] = val;
    }
  }
  return snap;
}

/**
 * Build the extraction check by diffing before/after snapshots.
 */
export function runFergusonExtractCheck(
  product: SalesforceIncomingProduct,
  before: Record<string, string>,
  after: Record<string, string>,
): FergusonExtractSection {
  const hasFRD = !!(product as any).Ferguson_Raw_Data;
  const hasFlatPre = Object.keys(before).length > 0;

  const source: FergusonExtractSection['source'] = hasFRD
    ? 'Ferguson_Raw_Data'
    : hasFlatPre
      ? 'flat-fields'
      : 'none';

  // Fields that appeared AFTER extraction (were absent before)
  const extracted: Record<string, string> = {};
  for (const [field, value] of Object.entries(after)) {
    if (!before[field]) {
      extracted[field] = value;
    }
  }

  // Critical fields still missing after extraction
  const criticalFields = [
    'Ferguson_Title',
    'Ferguson_Brand',
    'Ferguson_Base_Category',
    'Ferguson_Base_Type',
    'Ferguson_Finish',
    'Ferguson_Color',
  ];
  const missingAfterExtraction = criticalFields.filter(f => !after[f]);

  return { source, extracted, missingAfterExtraction };
}
