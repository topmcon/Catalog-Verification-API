/**
 * SEO TITLE GENERATOR SERVICE
 * ============================
 * Generates category-specific SEO-optimized product titles.
 * 
 * Each category has a specific formula designed for:
 * 1. Search engine optimization (keywords in right order)
 * 2. Human readability
 * 3. Key product differentiators visible upfront
 * 
 * FORMAT BY CATEGORY:
 * - Appliances: Brand + Size + Style/Config + Category + Color/Finish + Model
 * - Lighting: Brand + Style + Category + Size + Finish + Model  
 * - Plumbing: Brand + Category + Type + Finish + Model
 * - Furniture: Brand + Material + Style + Category + Dimensions
 * - HVAC: Brand + Capacity + Type + Category + Model
 */

import logger from '../utils/logger';

export interface SEOTitleInput {
  brand?: string;
  modelNumber?: string;
  category: string;
  subCategory?: string;
  
  // Dimensions
  width?: string | number;
  height?: string | number;
  depth?: string | number;
  weight?: string | number;
  
  // Style/Type
  style?: string;
  type?: string;
  configuration?: string;
  installationType?: string;
  
  // Appearance
  finish?: string;
  color?: string;
  material?: string;
  
  // Category-specific
  fuelType?: string;
  totalCapacity?: string | number;
  numberOfBurners?: string | number;
  numberOfLights?: string | number;
  chainLength?: string | number;
  lightDirection?: string;
  bulbType?: string;
  wattage?: string | number;
  voltage?: string | number;
  flowRate?: string | number;
  handleType?: string;
  mountType?: string;
  
  // Features
  features?: string[];
  
  // Raw title for fallback
  rawTitle?: string;
}

/**
 * Category-specific SEO keyword priorities
 * These are high-value search terms for each category
 */
const CATEGORY_SEO_KEYWORDS: Record<string, string[]> = {
  // Appliances
  'refrigerator': ['Energy Star', 'Smart', 'Counter Depth', 'French Door', 'Stainless Steel'],
  'range': ['Gas', 'Electric', 'Dual Fuel', 'Convection', 'Self-Cleaning'],
  'oven': ['Wall Oven', 'Convection', 'Smart', 'Double', 'Steam'],
  'dishwasher': ['Quiet', 'Energy Star', 'Third Rack', 'Built-In', 'Smart'],
  'microwave': ['Over-the-Range', 'Countertop', 'Built-In', 'Convection', 'Smart'],
  'washer': ['Front Load', 'Top Load', 'Steam', 'Smart', 'Large Capacity'],
  'dryer': ['Gas', 'Electric', 'Steam', 'Smart', 'Large Capacity'],
  'freezer': ['Upright', 'Chest', 'Frost Free', 'Energy Star'],
  
  // Lighting
  'chandelier': ['Crystal', 'Modern', 'Traditional', 'LED', 'Dimmable'],
  'pendant': ['Island', 'Mini', 'LED', 'Industrial', 'Modern'],
  'sconce': ['Wall Sconce', 'LED', 'Indoor', 'Outdoor', 'Dimmable'],
  'flush mount': ['LED', 'Low Profile', 'Modern', 'Dimmable'],
  'ceiling fan': ['Remote Control', 'LED', 'Outdoor', 'Quiet', 'Smart'],
  'vanity light': ['LED', 'Bathroom', 'Modern', 'Dimmable'],
  
  // Plumbing
  'faucet': ['Touchless', 'Pull-Down', 'Single Handle', 'High Arc', 'Commercial'],
  'toilet': ['Dual Flush', 'One Piece', 'Elongated', 'Comfort Height', 'Water Saving'],
  'sink': ['Undermount', 'Farmhouse', 'Double Bowl', 'Stainless Steel', 'Granite'],
  'shower': ['Rain', 'Handheld', 'Dual', 'Thermostatic', 'Body Spray'],
  'bathtub': ['Freestanding', 'Soaking', 'Whirlpool', 'Alcove', 'Drop-In'],
  
  // Furniture
  'mirror': ['Vanity', 'Full Length', 'Framed', 'LED', 'Beveled'],
  'cabinet': ['Wall Mount', 'Freestanding', 'Medicine', 'Storage'],
  
  // HVAC
  'air conditioner': ['Portable', 'Window', 'Mini Split', 'Smart', 'Energy Star'],
  'heater': ['Tankless', 'Electric', 'Gas', 'Radiant', 'Smart'],
  'fan': ['Ceiling', 'Exhaust', 'Bathroom', 'Quiet', 'Energy Star'],
};

/**
 * Get SEO keywords for a category
 * Used by title generators to inject high-value search terms when available
 */
export function getSEOKeywordsForCategory(category: string): string[] {
  const lower = category.toLowerCase();
  return CATEGORY_SEO_KEYWORDS[lower] || [];
}

/**
 * Get the primary category group for title generation
 */
function getCategoryGroup(category: string): string {
  const lower = category.toLowerCase();
  
  // Appliances
  if (['refrigerator', 'range', 'oven', 'dishwasher', 'microwave', 'washer', 'dryer', 'freezer', 'cooktop', 'hood'].some(c => lower.includes(c))) {
    return 'appliance';
  }
  
  // Lighting
  if (['chandelier', 'pendant', 'sconce', 'flush mount', 'ceiling fan', 'vanity light', 'lantern', 'lamp', 'track', 'recessed'].some(c => lower.includes(c))) {
    return 'lighting';
  }
  
  // Plumbing
  if (['faucet', 'toilet', 'sink', 'shower', 'bathtub', 'tub', 'valve', 'drain'].some(c => lower.includes(c))) {
    return 'plumbing';
  }
  
  // HVAC
  if (['air conditioner', 'heater', 'furnace', 'thermostat', 'ventilation', 'exhaust'].some(c => lower.includes(c))) {
    return 'hvac';
  }
  
  // Furniture/Decor
  if (['mirror', 'cabinet', 'vanity', 'shelf', 'storage'].some(c => lower.includes(c))) {
    return 'furniture';
  }
  
  return 'general';
}

/**
 * Generate SEO-optimized title based on category
 */
export function generateSEOTitle(input: SEOTitleInput): string {
  const categoryGroup = getCategoryGroup(input.category);
  
  let title: string;
  
  switch (categoryGroup) {
    case 'appliance':
      title = generateApplianceTitle(input);
      break;
    case 'lighting':
      title = generateLightingTitle(input);
      break;
    case 'plumbing':
      title = generatePlumbingTitle(input);
      break;
    case 'hvac':
      title = generateHVACTitle(input);
      break;
    case 'furniture':
      title = generateFurnitureTitle(input);
      break;
    default:
      title = generateGeneralTitle(input);
  }
  
  // Ensure model number is at the end if not already included
  if (input.modelNumber && !title.includes(input.modelNumber)) {
    title = `${title} - ${input.modelNumber}`;
  }
  
  // Clean up extra spaces and trailing dashes
  title = title.replace(/\s+/g, ' ').replace(/\s*-\s*$/, '').trim();
  
  logger.debug('Generated SEO title', {
    categoryGroup,
    originalCategory: input.category,
    generatedTitle: title,
    modelNumber: input.modelNumber
  });
  
  return title;
}

/**
 * APPLIANCE TITLE FORMAT:
 * Brand + Size + Style/Configuration + Category + Color/Finish + Model
 * Example: "GE 36-Inch French Door Refrigerator Stainless Steel - GFE28GYNFS"
 */
function generateApplianceTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  // 1. Brand (always first)
  if (input.brand) parts.push(input.brand);
  
  // 2. Size (width is primary for appliances)
  const size = getApplianceSize(input);
  if (size) parts.push(size);
  
  // 3. Configuration/Style (French Door, Gas, etc.)
  const config = getApplianceConfig(input);
  if (config) parts.push(config);
  
  // 4. Category
  parts.push(cleanCategory(input.category));
  
  // 5. Color/Finish
  const finish = getFinishColor(input);
  if (finish) parts.push(finish);
  
  // 6. Model Number
  if (input.modelNumber) parts.push(`- ${input.modelNumber}`);
  
  return parts.join(' ');
}

/**
 * LIGHTING TITLE FORMAT:
 * Brand + Style + Size + Category + Finish + Light Count + Model
 * Example: "Minka Lavery Modern 24-Inch Chandelier Brushed Nickel 6-Light - 4106-84"
 */
function generateLightingTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  // 1. Brand
  if (input.brand) parts.push(input.brand);
  
  // 2. Style (Modern, Traditional, Industrial, etc.)
  if (input.style) parts.push(input.style);
  
  // 3. Size (diameter/width for chandeliers, height for sconces)
  const size = getLightingSize(input);
  if (size) parts.push(size);
  
  // 4. Category
  parts.push(cleanCategory(input.category));
  
  // 5. Finish
  const finish = getFinishColor(input);
  if (finish) parts.push(finish);
  
  // 6. Light count (if applicable)
  if (input.numberOfLights && Number(input.numberOfLights) > 1) {
    parts.push(`${input.numberOfLights}-Light`);
  }
  
  // 7. Model Number
  if (input.modelNumber) parts.push(`- ${input.modelNumber}`);
  
  return parts.join(' ');
}

/**
 * PLUMBING TITLE FORMAT:
 * Brand + Type + Category + Mount Style + Finish + Handle Type + Model
 * Example: "Kohler Touchless Pull-Down Kitchen Faucet Single Handle Chrome - K-560-CP"
 */
function generatePlumbingTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  // 1. Brand
  if (input.brand) parts.push(input.brand);
  
  // 2. Type/Feature (Touchless, Dual Flush, etc.)
  const type = getPlumbingType(input);
  if (type) parts.push(type);
  
  // 3. Sub-type/Mount (Pull-Down, Undermount, etc.)
  if (input.mountType) parts.push(input.mountType);
  
  // 4. Category
  parts.push(cleanCategory(input.category));
  
  // 5. Finish
  const finish = getFinishColor(input);
  if (finish) parts.push(finish);
  
  // 6. Model Number
  if (input.modelNumber) parts.push(`- ${input.modelNumber}`);
  
  return parts.join(' ');
}

/**
 * HVAC TITLE FORMAT:
 * Brand + Capacity + Type + Category + Efficiency + Model
 * Example: "Carrier 3-Ton Split System Air Conditioner SEER 16 - 24ACC636A003"
 */
function generateHVACTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  // 1. Brand
  if (input.brand) parts.push(input.brand);
  
  // 2. Capacity
  if (input.totalCapacity) parts.push(`${input.totalCapacity}`);
  
  // 3. Type
  if (input.type) parts.push(input.type);
  
  // 4. Category
  parts.push(cleanCategory(input.category));
  
  // 5. Model Number
  if (input.modelNumber) parts.push(`- ${input.modelNumber}`);
  
  return parts.join(' ');
}

/**
 * FURNITURE TITLE FORMAT:
 * Brand + Material + Style + Dimensions + Category + Finish + Model
 * Example: "Kohler Wood Traditional 36x24 Inch Mirror Espresso - K-99011"
 */
function generateFurnitureTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  // 1. Brand
  if (input.brand) parts.push(input.brand);
  
  // 2. Material
  if (input.material) parts.push(input.material);
  
  // 3. Style
  if (input.style) parts.push(input.style);
  
  // 4. Dimensions
  const dims = getDimensions(input);
  if (dims) parts.push(dims);
  
  // 5. Category
  parts.push(cleanCategory(input.category));
  
  // 6. Finish
  const finish = getFinishColor(input);
  if (finish) parts.push(finish);
  
  // 7. Model Number
  if (input.modelNumber) parts.push(`- ${input.modelNumber}`);
  
  return parts.join(' ');
}

/**
 * GENERAL TITLE FORMAT (fallback):
 * Brand + Style + Category + Size + Finish + Model
 */
function generateGeneralTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  if (input.brand) parts.push(input.brand);
  if (input.style) parts.push(input.style);
  parts.push(cleanCategory(input.category));
  
  const finish = getFinishColor(input);
  if (finish) parts.push(finish);
  
  if (input.modelNumber) parts.push(`- ${input.modelNumber}`);
  
  return parts.join(' ');
}

// === HELPER FUNCTIONS ===

function cleanCategory(category: string): string {
  return category
    .replace(/ #$/, '')           // Remove trailing " #"
    .replace(/\s+/g, ' ')         // Normalize spaces
    .trim();
}

function getApplianceSize(input: SEOTitleInput): string | null {
  if (input.width) {
    const w = parseFloat(String(input.width));
    if (!isNaN(w) && w > 0) {
      return `${Math.round(w)}-Inch`;
    }
  }
  if (input.totalCapacity) {
    return `${input.totalCapacity} Cu. Ft.`;
  }
  return null;
}

function getApplianceConfig(input: SEOTitleInput): string | null {
  // Priority: configuration > fuelType > installationType > type > style
  if (input.configuration) return input.configuration;
  if (input.fuelType) return input.fuelType;
  if (input.installationType) return input.installationType;
  if (input.type) return input.type;
  if (input.style) return input.style;
  return null;
}

function getLightingSize(input: SEOTitleInput): string | null {
  // For lighting, we typically use width/diameter
  if (input.width) {
    const w = parseFloat(String(input.width));
    if (!isNaN(w) && w > 0) {
      return `${Math.round(w)}-Inch`;
    }
  }
  return null;
}

function getPlumbingType(input: SEOTitleInput): string | null {
  // Check for key plumbing features
  if (input.features) {
    const priorityFeatures = ['Touchless', 'Dual Flush', 'One Piece', 'Single Handle', 'Pull-Down', 'Pull-Out'];
    for (const feat of priorityFeatures) {
      if (input.features.some(f => f.toLowerCase().includes(feat.toLowerCase()))) {
        return feat;
      }
    }
  }
  if (input.type) return input.type;
  return null;
}

function getFinishColor(input: SEOTitleInput): string | null {
  if (input.finish && input.finish.toLowerCase() !== 'not found') return input.finish;
  if (input.color && input.color.toLowerCase() !== 'not found') return input.color;
  if (input.material && ['Stainless Steel', 'Chrome', 'Brass', 'Bronze'].some(m => 
    input.material!.toLowerCase().includes(m.toLowerCase())
  )) {
    return input.material;
  }
  return null;
}

function getDimensions(input: SEOTitleInput): string | null {
  const w = input.width ? parseFloat(String(input.width)) : null;
  const h = input.height ? parseFloat(String(input.height)) : null;
  
  if (w && h && !isNaN(w) && !isNaN(h)) {
    return `${Math.round(w)}x${Math.round(h)} Inch`;
  }
  if (w && !isNaN(w)) {
    return `${Math.round(w)}-Inch`;
  }
  return null;
}

/**
 * Detect if a field value contains variant information that should be mapped to variant fields
 * Example: "Gallon (#10208), Quart (#10210), Pint (#10212)" -> should be variants
 */
export function detectVariantData(fieldName: string, value: string): {
  isVariantData: boolean;
  variants?: Array<{ name: string; modelNumber: string }>;
} {
  if (!value || typeof value !== 'string') {
    return { isVariantData: false };
  }
  
  // Pattern: "Name (#ModelNumber)" repeated with commas
  const variantPattern = /([^,()]+)\s*\(#?([A-Z0-9-]+)\)/gi;
  const matches = [...value.matchAll(variantPattern)];
  
  if (matches.length >= 2) {
    // Multiple variants detected
    const variants = matches.map(m => ({
      name: m[1].trim(),
      modelNumber: m[2].trim()
    }));
    
    logger.warn('Detected variant data in non-variant field', {
      fieldName,
      value,
      detectedVariants: variants.length
    });
    
    return {
      isVariantData: true,
      variants
    };
  }
  
  return { isVariantData: false };
}

export default {
  generateSEOTitle,
  detectVariantData,
  getCategoryGroup
};
