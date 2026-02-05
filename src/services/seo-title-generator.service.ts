/**
 * SEO TITLE GENERATOR SERVICE
 * ============================
 * Generates SEO-optimized product titles using a UNIFIED FORMULA:
 * 
 * SIZE + BRAND + STYLE + CATEGORY + COLOR + MODEL NUMBER
 * 
 * Size = Common measurement for that product type:
 * - Refrigerators, Ranges, Dishwashers: Width
 * - Bathtubs: Length  
 * - Showers, Sinks: Width/Diameter
 * - Chandeliers, Pendants: Width/Diameter
 * - Sconces, Mirrors: Height
 * - Faucets: Height (spout height)
 * - Toilets: Height (bowl height)
 * - TVs, Monitors: Diagonal (screen size)
 * 
 * Example outputs:
 * - "36" GE French Door Refrigerator Stainless Steel - GFE28GYNFS"
 * - "60" Kohler Freestanding Bathtub Biscuit - K-1490"
 * - "24" Minka Lavery Modern Chandelier Brushed Nickel - 4106-84"
 * - "RIOBEL Rain Head Showers Matte Black - 356BK"
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
 * PRIMARY SIZE BY CATEGORY TYPE
 * Maps category keywords to which dimension is the "common" measurement
 */
type SizeType = 'width' | 'height' | 'depth' | 'diameter' | 'length' | 'capacity' | 'none';

const CATEGORY_PRIMARY_SIZE: Record<string, SizeType> = {
  // Appliances - Width is standard
  'refrigerator': 'width',
  'range': 'width',
  'oven': 'width',
  'dishwasher': 'width',
  'microwave': 'width',
  'washer': 'width',
  'dryer': 'width',
  'freezer': 'capacity',
  'cooktop': 'width',
  'hood': 'width',
  
  // Bathtubs - Length is standard
  'bathtub': 'length',
  'tub': 'length',
  'soaking tub': 'length',
  'freestanding tub': 'length',
  
  // Showers - Diameter/Width for showerheads
  'shower': 'width',
  'showerhead': 'diameter',
  'rain head': 'diameter',
  'shower system': 'none',
  
  // Sinks - Width
  'sink': 'width',
  'kitchen sink': 'width',
  'bathroom sink': 'width',
  'vessel sink': 'diameter',
  
  // Faucets - Height (spout height is key differentiator)
  'faucet': 'height',
  'kitchen faucet': 'height',
  'bathroom faucet': 'height',
  
  // Toilets - Height (comfort height vs standard)
  'toilet': 'height',
  
  // Lighting - Width/Diameter
  'chandelier': 'width',
  'pendant': 'width',
  'flush mount': 'width',
  'ceiling fan': 'width',
  'sconce': 'height',
  'wall sconce': 'height',
  'vanity light': 'width',
  'mirror': 'width',
  'lantern': 'height',
  
  // HVAC - Capacity
  'air conditioner': 'capacity',
  'heater': 'capacity',
  'water heater': 'capacity',
  
  // Furniture
  'cabinet': 'width',
  'vanity': 'width',
};

/**
 * Get the primary size for a product based on its category
 * Returns formatted string like '36"' or null if not applicable
 */
function getPrimarySize(input: SEOTitleInput): string | null {
  const categoryLower = (input.category + ' ' + (input.subCategory || '')).toLowerCase();
  
  // Find matching category
  let sizeType: SizeType = 'none';
  for (const [key, type] of Object.entries(CATEGORY_PRIMARY_SIZE)) {
    if (categoryLower.includes(key)) {
      sizeType = type;
      break;
    }
  }
  
  if (sizeType === 'none') return null;
  
  let value: number | null = null;
  
  switch (sizeType) {
    case 'width':
    case 'diameter':
      if (input.width) value = parseFloat(String(input.width));
      break;
    case 'height':
      if (input.height) value = parseFloat(String(input.height));
      break;
    case 'depth':
    case 'length':
      if (input.depth) value = parseFloat(String(input.depth));
      // For bathtubs, length is often in width field
      if (!value && input.width) value = parseFloat(String(input.width));
      break;
    case 'capacity':
      if (input.totalCapacity) {
        const cap = parseFloat(String(input.totalCapacity));
        if (!isNaN(cap) && cap > 0) {
          return `${cap} Cu.Ft.`;
        }
      }
      return null;
  }
  
  if (value && !isNaN(value) && value > 0) {
    // Format as X" (inches with quote mark)
    return `${Math.round(value)}"`;
  }
  
  return null;
}

/**
 * UNIFIED SEO TITLE FORMULA:
 * SIZE + BRAND + STYLE + CATEGORY + COLOR + MODEL NUMBER
 * 
 * Example: '36" GE French Door Refrigerator Stainless Steel - GFE28GYNFS'
 * Example: 'RIOBEL Rain Head Showers Matte Black - 356BK'
 */
export function generateSEOTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  // 1. SIZE (common measurement for this product type)
  const size = getPrimarySize(input);
  if (size) parts.push(size);
  
  // 2. BRAND
  if (input.brand) parts.push(input.brand);
  
  // 3. STYLE (product style/type)
  if (input.style && input.style.toLowerCase() !== 'not found') {
    parts.push(input.style);
  } else if (input.type && input.type.toLowerCase() !== 'not found') {
    parts.push(input.type);
  } else if (input.configuration && input.configuration.toLowerCase() !== 'not found') {
    parts.push(input.configuration);
  }
  
  // 4. CATEGORY
  parts.push(cleanCategory(input.category));
  
  // 5. COLOR (or Finish if no color)
  const colorFinish = getColorOrFinish(input);
  if (colorFinish) parts.push(colorFinish);
  
  // 6. MODEL NUMBER
  if (input.modelNumber) parts.push(`- ${input.modelNumber}`);
  
  let title = parts.join(' ');
  
  // Clean up extra spaces and trailing dashes
  title = title.replace(/\s+/g, ' ').replace(/\s*-\s*$/, '').trim();
  
  logger.debug('Generated SEO title (unified formula)', {
    formula: 'SIZE + BRAND + STYLE + CATEGORY + COLOR + MODEL',
    size,
    brand: input.brand,
    style: input.style,
    category: input.category,
    color: colorFinish,
    modelNumber: input.modelNumber,
    generatedTitle: title
  });
  
  return title;
}

/**
 * Get color or finish for title
 */
function getColorOrFinish(input: SEOTitleInput): string | null {
  // Prefer color over finish
  if (input.color && input.color.toLowerCase() !== 'not found' && input.color.toLowerCase() !== 'n/a') {
    return input.color;
  }
  if (input.finish && input.finish.toLowerCase() !== 'not found' && input.finish.toLowerCase() !== 'n/a') {
    return input.finish;
  }
  // Some materials can act as finish (Stainless Steel, Chrome, etc.)
  if (input.material && ['stainless steel', 'chrome', 'brass', 'bronze', 'copper', 'nickel'].some(m => 
    input.material!.toLowerCase().includes(m)
  )) {
    return input.material;
  }
  return null;
}

// === HELPER FUNCTIONS ===

function cleanCategory(category: string): string {
  return category
    .replace(/ #$/, '')           // Remove trailing " #"
    .replace(/\s+/g, ' ')         // Normalize spaces
    .trim();
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
