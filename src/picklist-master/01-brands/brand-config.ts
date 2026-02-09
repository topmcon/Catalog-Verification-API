/**
 * Brand Configuration - Centralized Brand Data
 * 
 * SOURCE PICKLIST: src/config/salesforce-picklists/brands.json
 * WHEN TO UPDATE: When brands.json receives new brands from Salesforce
 * 
 * This file contains brand tier classifications used throughout the system.
 * Re-exported through src/config/index.ts for backward compatibility.
 */

export const PREMIUM_BRANDS = [
  'Sub-Zero', 'Wolf', 'Thermador', 'Viking', 'Miele', 
  'Gaggenau', 'La Cornue', 'Dacor', 'Monogram', 'BlueStar',
  'Hestan', 'JennAir', 'CAFE', 'Fisher & Paykel', 'Liebherr',
  'Bertazzoni', 'ZLINE', 'Lynx', 'Kalamazoo', 'Alfresco',
  'Cove', 'True Residential', 'Big Chill', 'AGA', 'Lacanche',
  'Ilve', 'Capital', 'American Range', 'DCS Appliances', 'Perlick'
] as const;

export const MID_TIER_BRANDS = [
  'KitchenAid', 'Bosch', 'Samsung', 'LG', 'GE Profile',
  'Electrolux', 'Frigidaire Gallery', 'Whirlpool', 'Maytag',
  'GE', 'Broan', 'Zephyr', 'Sharp', 'Beko', 'Haier',
  'GE Appliances', 'LG Studio', 'Samsung Chef', 'Speed Queen'
] as const;

export const VALUE_BRANDS = [
  'Frigidaire', 'Amana', 'Hotpoint', 'Roper', 'Crosley',
  'Magic Chef', 'Avanti', 'Danby', 'Insignia', 'Vissani',
  'Summit', 'Galanz', 'Midea', 'Hisense'
] as const;

export function isPremiumBrand(brand: string): boolean {
  return PREMIUM_BRANDS.some(b => b.toLowerCase() === brand.toLowerCase());
}

export function isMidTierBrand(brand: string): boolean {
  return MID_TIER_BRANDS.some(b => b.toLowerCase() === brand.toLowerCase());
}

export function isValueBrand(brand: string): boolean {
  return VALUE_BRANDS.some(b => b.toLowerCase() === brand.toLowerCase());
}

export function getBrandTier(brand: string): 'premium' | 'mid-tier' | 'value' | 'unknown' {
  if (isPremiumBrand(brand)) return 'premium';
  if (isMidTierBrand(brand)) return 'mid-tier';
  if (isValueBrand(brand)) return 'value';
  return 'unknown';
}
