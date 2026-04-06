/**
 * PayloadHealthCheck — Validates the raw Salesforce payload before any processing.
 *
 * Detects:
 * - Missing critical identifiers
 * - Brand collisions (different brands from different sources → possible data collision)
 * - MISC/MISCELLANEOUS categories (treated as absent)
 * - Legacy-only payloads (no web retailer or Ferguson data)
 * - Ferguson data availability (raw vs flat vs none)
 * - Media presence
 */

import { SalesforceIncomingProduct } from '../../../types/salesforce.types';
import {
  PayloadSeverity,
  PayloadHealthSection,
  HealthEntry,
} from '../DebugReport';

const MISC_VALUES = ['misc', 'miscellaneous', 'other', 'general', 'unclassified'];

export function isMiscCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  return MISC_VALUES.includes(category.toLowerCase().trim());
}

/**
 * Brand collision: the two sources name completely different brands.
 * Ignores case/spacing differences — only flags when the normalised root word differs.
 */
export function detectBrandCollision(payload: SalesforceIncomingProduct): boolean {
  const webBrand = payload.Brand_Web_Retailer?.trim().toLowerCase();
  const fergBrand = ((payload as any).Ferguson_Brand as string | undefined)?.trim().toLowerCase();

  if (!webBrand || !fergBrand) return false;

  // Identical after lowercasing → no collision
  if (webBrand === fergBrand) return false;

  // One contains the other (e.g. "GE" vs "GE Appliances") → no collision
  if (webBrand.includes(fergBrand) || fergBrand.includes(webBrand)) return false;

  return true;
}

function isLegacyOnly(payload: SalesforceIncomingProduct): boolean {
  const hasWebRetailer = !!(
    payload.Brand_Web_Retailer ||
    payload.Product_Title_Web_Retailer ||
    payload.Web_Retailer_Category
  );
  const hasFerguson = !!(
    (payload as any).Ferguson_Brand ||
    (payload as any).Ferguson_Title ||
    (payload as any).Ferguson_Raw_Data
  );
  return !hasWebRetailer && !hasFerguson;
}

export function runPayloadHealthCheck(payload: SalesforceIncomingProduct): PayloadHealthSection {
  const entries: HealthEntry[] = [];
  let brandCollision = false;
  let miscCategory = false;

  // ── Identifiers ──
  if (payload.SF_Catalog_Id) {
    entries.push({ severity: PayloadSeverity.OK, message: 'SF_Catalog_Id present' });
  } else {
    entries.push({ severity: PayloadSeverity.CRITICAL, message: 'SF_Catalog_Id MISSING' });
  }

  // ── Ferguson data source ──
  if ((payload as any).Ferguson_Raw_Data) {
    entries.push({ severity: PayloadSeverity.OK, message: 'Ferguson_Raw_Data present (Phase 0.1A will extract)' });
  } else if ((payload as any).Ferguson_Brand || (payload as any).Ferguson_Title) {
    entries.push({ severity: PayloadSeverity.OK, message: 'Ferguson flat fields present (pre-populated by SF)' });
  } else if (payload.Ferguson_URL) {
    entries.push({ severity: PayloadSeverity.WARNING, message: 'Ferguson_URL present but no Ferguson data — scrape needed' });
  } else {
    entries.push({ severity: PayloadSeverity.WARNING, message: 'No Ferguson data at all' });
  }

  // ── Web Retailer Category ──
  if (isMiscCategory(payload.Web_Retailer_Category)) {
    miscCategory = true;
    entries.push({
      severity: PayloadSeverity.WARNING,
      message: `Web_Retailer_Category: "${payload.Web_Retailer_Category}" — treated as absent`,
    });
  } else if (payload.Web_Retailer_Category) {
    entries.push({ severity: PayloadSeverity.OK, message: `Web_Retailer_Category: "${payload.Web_Retailer_Category}"` });
  } else {
    entries.push({ severity: PayloadSeverity.WARNING, message: 'Web_Retailer_Category absent' });
  }

  // ── Brand collision ──
  if (detectBrandCollision(payload)) {
    brandCollision = true;
    entries.push({
      severity: PayloadSeverity.CRITICAL,
      message: `BRAND COLLISION: Brand_Web_Retailer="${payload.Brand_Web_Retailer}" vs Ferguson_Brand="${(payload as any).Ferguson_Brand}"\n     → This may be a data collision (two different products on same record)`,
    });
  }

  // ── Media ──
  const imgCount = payload.Stock_Images?.length ?? 0;
  entries.push({
    severity: imgCount > 0 ? PayloadSeverity.OK : PayloadSeverity.WARNING,
    message: `Stock_Images: ${imgCount} item${imgCount !== 1 ? 's' : ''}`,
  });

  if (payload.Reference_URL) {
    entries.push({ severity: PayloadSeverity.OK, message: 'Reference_URL present' });
  }

  // ── Legacy-only ──
  const legacyOnly = isLegacyOnly(payload);
  if (legacyOnly) {
    entries.push({
      severity: PayloadSeverity.CRITICAL,
      message: 'LEGACY-ONLY PAYLOAD: No web retailer or Ferguson data — only legacy fields present',
    });
  }

  return { entries, brandCollision, miscCategory, legacyOnly };
}
