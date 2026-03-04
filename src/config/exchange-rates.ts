/**
 * Exchange Rates Configuration
 * =============================
 * Static exchange rates for converting Canadian product data to US standards
 * 
 * UPDATE SCHEDULE:
 * - Review quarterly (every 3 months)
 * - Update if CAD/USD rate changes by ±5% or more
 * - Check: https://www.xe.com/currencyconverter/convert/?From=CAD&To=USD
 * 
 * USAGE:
 * When Web_Retailer_Key starts with "CA_", product data is from Canadian sources:
 * - MSRP is in CAD → Convert to USD
 * - Weight is in kg → Convert to lbs
 */

export const EXCHANGE_RATES = {
  /**
   * Canadian Dollar to US Dollar conversion rate
   * Current rate: 1 CAD = 0.73 USD
   * Last verified: March 4, 2026
   */
  CAD_TO_USD: 0.73,
  
  /**
   * Date this config was last updated
   * Format: YYYY-MM-DD
   */
  LAST_UPDATED: '2026-03-04',
  
  /**
   * Acceptable staleness in days before warning should be logged
   * Recommended: 90 days (quarterly review)
   */
  STALENESS_WARNING_DAYS: 90
} as const;

/**
 * Unit Conversion Constants
 * =========================
 */
export const UNIT_CONVERSIONS = {
  /**
   * Kilograms to Pounds conversion
   * 1 kg = 2.20462 lbs (exact)
   */
  KG_TO_LBS: 2.20462,
  
  /**
   * Pounds to Kilograms conversion (reverse)
   * 1 lb = 0.453592 kg (exact)
   */
  LBS_TO_KG: 0.453592
} as const;

/**
 * Canadian Retailer Domains
 * ==========================
 * List of known Canadian retail domains to detect Canadian sources
 * Used in Phase 6 web search to identify Canadian product pages
 */
export const CANADIAN_RETAILER_DOMAINS = [
  'homedepot.ca',
  'lowes.ca',
  'bestbuy.ca',
  'thebrick.com',
  'leons.ca',
  'costco.ca',
  'amazon.ca',
  'wayfair.ca',
  'walmart.ca',
  'canadiantire.ca',
  'rona.ca',
  '.ca/'  // Generic .ca domain catch-all
] as const;

/**
 * Check if exchange rate config is stale (needs updating)
 * @returns Object with isStale flag and days since last update
 */
export function checkExchangeRateStaleness(): { isStale: boolean; daysSinceUpdate: number; lastUpdated: string } {
  const lastUpdated = new Date(EXCHANGE_RATES.LAST_UPDATED);
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceUpdate > EXCHANGE_RATES.STALENESS_WARNING_DAYS;
  
  return {
    isStale,
    daysSinceUpdate,
    lastUpdated: EXCHANGE_RATES.LAST_UPDATED
  };
}

/**
 * Convert CAD to USD
 * @param cad Amount in Canadian Dollars
 * @returns Amount in US Dollars (rounded to 2 decimals)
 */
export function convertCADtoUSD(cad: number): number {
  return Math.round(cad * EXCHANGE_RATES.CAD_TO_USD * 100) / 100;
}

/**
 * Convert kilograms to pounds
 * @param kg Weight in kilograms
 * @returns Weight in pounds (rounded to 2 decimals)
 */
export function convertKGtoLBS(kg: number): number {
  return Math.round(kg * UNIT_CONVERSIONS.KG_TO_LBS * 100) / 100;
}

/**
 * Check if a URL is from a Canadian retailer
 * @param url URL to check
 * @returns true if URL is from a known Canadian domain
 */
export function isCanadianRetailerURL(url: string): boolean {
  const urlLower = url.toLowerCase();
  return CANADIAN_RETAILER_DOMAINS.some(domain => urlLower.includes(domain));
}
