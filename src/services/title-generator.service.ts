/**
 * Title Generator Service
 * Generates standardized product titles following the format:
 * Brand + Size Class + Configuration + Installation Type + Category + Finish/Color + Special Features
 * 
 * IMPORTANT DISTINCTIONS:
 * - Configuration/Style: French Door, Side-by-Side, Top Freezer, Bottom Freezer (door arrangement)
 * - Installation Type: Built-In, Freestanding, Counter-Depth, Under-Counter (how it's installed)
 */

import { PREMIUM_BRANDS } from '../config/category-schema';

// Refrigerator configurations (door styles)
const REFRIGERATOR_CONFIGURATIONS = [
  'French Door', 'Side-by-Side', 'Side by Side',
  'Top Freezer', 'Bottom Freezer', 'Top Mount', 'Bottom Mount',
  'Single Door', 'Column', 'All Refrigerator', 'All Freezer'
];

// Installation types (how appliance is installed)
const INSTALLATION_TYPES = [
  'Built-In', 'Built In', 'Freestanding', 'Counter-Depth', 'Counter Depth',
  'Under-Counter', 'Under Counter', 'Slide-In', 'Drop-In', 'Wall Mount'
];

export interface TitleInput {
  brand?: string;
  modelNumber?: string;
  category: string;
  width?: string | number;
  height?: string | number;
  depth?: string | number;
  style?: string;
  type?: string;
  configuration?: string;       // Door configuration: French Door, Side-by-Side, etc.
  installationType?: string;    // Built-In, Freestanding, Counter-Depth
  finish?: string;
  color?: string;
  material?: string;
  fuelType?: string;
  features?: string[];
  // Category-specific
  totalCapacity?: string | number;
  numberOfBurners?: string | number;
}

/**
 * Generate a standardized product title
 * Format: Brand + Size + Configuration/FuelType + Installation Type + Category + Finish + (Features)
 */
export function generateTitle(input: TitleInput): string {
  const parts: string[] = [];
  
  // 1. Brand (always first if available)
  if (input.brand) {
    parts.push(input.brand);
  }
  
  // 2. Size Class (width is most common identifier)
  const sizeClass = getSizeClass(input);
  if (sizeClass) {
    parts.push(sizeClass);
  }
  
  // 3. Configuration (French Door, Side-by-Side, etc.) OR Fuel Type (for ranges/ovens)
  const config = getConfiguration(input);
  if (config) {
    parts.push(config);
  }
  
  // 3b. Fuel Type for cooking appliances (if not already shown in config)
  const fuelType = getFuelType(input, config);
  if (fuelType) {
    parts.push(fuelType);
  }
  
  // 4. Installation Type (Built-In, Freestanding, etc.) - if different from config
  const installType = getInstallationType(input, config);
  if (installType) {
    parts.push(installType);
  }
  
  // 5. Category (cleaned)
  const cleanCategory = input.category.replace(/ #$/, '');
  parts.push(cleanCategory);
  
  // 6. Finish/Color
  const finishColor = getFinishColor(input);
  if (finishColor) {
    parts.push(finishColor);
  }
  
  // 7. Special Features (limited to 2-3 most important, excluding what's already shown)
  const specialFeatures = getSpecialFeatures(input, config, installType);
  if (specialFeatures.length > 0) {
    parts.push(`(${specialFeatures.join(', ')})`);
  }
  
  return parts.join(' ');
}

/**
 * Get fuel type for cooking appliances (Range, Oven, Cooktop)
 */
function getFuelType(input: TitleInput, alreadyShown: string | null): string | null {
  const cookingCategories = ['range', 'oven', 'cooktop'];
  const categoryLower = input.category.toLowerCase();
  
  // Only apply to cooking appliances
  if (!cookingCategories.some(c => categoryLower.includes(c))) {
    return null;
  }
  
  if (!input.fuelType) return null;
  
  const lower = input.fuelType.toLowerCase();
  let normalized: string | null = null;
  
  if (lower.includes('dual')) normalized = 'Dual Fuel';
  else if (lower.includes('gas')) normalized = 'Gas';
  else if (lower.includes('induction')) normalized = 'Induction';
  else if (lower.includes('electric')) normalized = 'Electric';
  else normalized = input.fuelType;
  
  // Don't duplicate if same as config
  if (alreadyShown && normalized.toLowerCase() === alreadyShown.toLowerCase()) {
    return null;
  }
  
  return normalized;
}

/**
 * Get size class string (e.g., "30-Inch", "24-Inch")
 */
function getSizeClass(input: TitleInput): string | null {
  // Prefer width for most appliances
  if (input.width) {
    const width = parseFloat(String(input.width));
    if (!isNaN(width) && width > 0) {
      // Round to common sizes
      const rounded = Math.round(width);
      return `${rounded}-Inch`;
    }
  }
  
  // For capacity-based products (refrigerators, washers)
  if (input.totalCapacity) {
    const cap = parseFloat(String(input.totalCapacity));
    if (!isNaN(cap) && cap > 0) {
      return `${cap} Cu. Ft.`;
    }
  }
  
  return null;
}

/**
 * Get configuration (door style for refrigerators, burner config for ranges, etc.)
 * This is SEPARATE from installation type
 */
function getConfiguration(input: TitleInput): string | null {
  // Check explicit configuration field first
  if (input.configuration) {
    return normalizeConfiguration(input.configuration);
  }
  
  // Check style field for configuration keywords
  if (input.style) {
    const normalized = normalizeConfiguration(input.style);
    if (normalized) return normalized;
  }
  
  // Check type field
  if (input.type) {
    const normalized = normalizeConfiguration(input.type);
    if (normalized) return normalized;
  }
  
  return null;
}

/**
 * Normalize configuration strings to standard format
 */
function normalizeConfiguration(value: string): string | null {
  const lower = value.toLowerCase();
  
  // === REFRIGERATOR CONFIGURATIONS ===
  // French Door variations
  if (lower.includes('french') && lower.includes('door')) return 'French Door';
  
  // Side-by-Side variations  
  if (lower.includes('side') && (lower.includes('by') || lower.includes('-'))) return 'Side-by-Side';
  
  // Top Freezer variations
  if ((lower.includes('top') && lower.includes('freez')) || lower.includes('top mount')) return 'Top Freezer';
  
  // Bottom Freezer variations
  if ((lower.includes('bottom') && lower.includes('freez')) || lower.includes('bottom mount')) return 'Bottom Freezer';
  
  // Column refrigerators
  if (lower.includes('column')) return 'Column';
  
  // All-Refrigerator / All-Freezer
  if (lower.includes('all refrigerator') || lower.includes('all-refrigerator')) return 'All Refrigerator';
  if (lower.includes('all freezer') || lower.includes('all-freezer')) return 'All Freezer';
  
  // Single door
  if (lower.includes('single door')) return 'Single Door';
  
  // === OVEN CONFIGURATIONS ===
  // Double Wall Oven
  if (lower.includes('double') && lower.includes('wall')) return 'Double Wall';
  if (lower.includes('double') && lower.includes('oven')) return 'Double';
  
  // Single Wall Oven
  if (lower.includes('single') && lower.includes('wall')) return 'Single Wall';
  
  // Combination / Microwave Combo
  if (lower.includes('combo') || lower.includes('combination')) return 'Combination';
  if (lower.includes('microwave') && lower.includes('oven')) return 'Microwave Combo';
  
  // Speed Oven
  if (lower.includes('speed')) return 'Speed';
  
  // Steam Oven
  if (lower.includes('steam') && lower.includes('oven')) return 'Steam';
  
  // === WASHER/DRYER CONFIGURATIONS ===
  // Front Load
  if (lower.includes('front') && lower.includes('load')) return 'Front Load';
  
  // Top Load
  if (lower.includes('top') && lower.includes('load')) return 'Top Load';
  
  // === FREEZER CONFIGURATIONS ===
  // Upright
  if (lower.includes('upright')) return 'Upright';
  
  // Chest
  if (lower.includes('chest')) return 'Chest';
  
  return null;
}

/**
 * Get installation type (Built-In, Freestanding, Counter-Depth, etc.)
 * Only return if it adds value (not already shown in config)
 */
function getInstallationType(input: TitleInput, alreadyShownConfig: string | null): string | null {
  const installType = input.installationType;
  if (!installType) return null;
  
  const lower = installType.toLowerCase();
  
  // Normalize the installation type
  let normalized: string | null = null;
  if (lower.includes('built')) normalized = 'Built-In';
  else if (lower.includes('freestanding')) normalized = 'Freestanding';
  else if (lower.includes('counter') && lower.includes('depth')) normalized = 'Counter-Depth';
  else if (lower.includes('under') && lower.includes('counter')) normalized = 'Under-Counter';
  else if (lower.includes('slide')) normalized = 'Slide-In';
  else if (lower.includes('drop')) normalized = 'Drop-In';
  else normalized = installType;
  
  // Don't duplicate if same as config
  if (alreadyShownConfig && normalized.toLowerCase() === alreadyShownConfig.toLowerCase()) {
    return null;
  }
  
  return normalized;
}

/**
 * Get style or type descriptor (LEGACY - for non-refrigerator categories)
 */
function getStyleType(input: TitleInput): string | null {
  const candidates: string[] = [];
  
  if (input.configuration) candidates.push(input.configuration);
  if (input.style) candidates.push(input.style);
  if (input.type) candidates.push(input.type);
  if (input.fuelType && ['Gas', 'Electric', 'Induction', 'Dual Fuel'].includes(input.fuelType)) {
    candidates.push(input.fuelType);
  }
  
  // Return first valid one (most specific)
  for (const c of candidates) {
    if (c && c.trim().length > 0) {
      return c.trim();
    }
  }
  
  return null;
}

/**
 * Get finish/color descriptor
 */
function getFinishColor(input: TitleInput): string | null {
  if (input.finish) return input.finish;
  if (input.color) return input.color;
  if (input.material && ['Stainless Steel', 'Black Stainless', 'White', 'Black'].includes(input.material)) {
    return input.material;
  }
  return null;
}

/**
 * Get special features for title (limited to most important)
 * Excludes features already shown in config or installation type
 */
function getSpecialFeatures(input: TitleInput, shownConfig: string | null, shownInstallType: string | null): string[] {
  const features: string[] = [];
  const maxFeatures = 2;
  
  // Track what's already shown to avoid duplication
  const alreadyShown = new Set<string>();
  if (shownConfig) alreadyShown.add(shownConfig.toLowerCase());
  if (shownInstallType) alreadyShown.add(shownInstallType.toLowerCase());
  
  // Priority features (excluding installation types already shown)
  const priorityOrder = [
    'Panel Ready', 'Smart', 'WiFi', 'Pro', 'Professional', 
    'Commercial', 'Ice Maker', 'Water Dispenser'
  ];
  
  if (input.features) {
    for (const priority of priorityOrder) {
      if (features.length >= maxFeatures) break;
      for (const feat of input.features) {
        const featLower = feat.toLowerCase();
        if (featLower.includes(priority.toLowerCase()) && 
            !features.includes(feat) &&
            !alreadyShown.has(featLower)) {
          features.push(feat);
          break;
        }
      }
    }
  }
  
  return features;
}

/**
 * Check if brand is premium tier
 */
export function isPremiumBrand(brand: string): boolean {
  const normalizedBrand = brand.toLowerCase().trim();
  return PREMIUM_BRANDS.some(pb => 
    normalizedBrand.includes(pb.toLowerCase())
  );
}

export default { generateTitle, isPremiumBrand };
