/**
 * SEO TITLE GENERATOR SERVICE (v2.1)
 * ===================================
 * Generates SEO-optimized product titles using category-specific schemas.
 * 
 * FORMULA: BRAND + PRIMARY_SPEC + CONFIG/TYPE + INSTALL + CATEGORY + FINISH - MODEL
 * 
 * Key changes from v1:
 * - Brand is ALWAYS first (highest SEO value)
 * - Model number included at END with dash prefix (e.g., "- K30-100-SL")
 * - Features REMOVED from title (no parenthetical features)
 * - Category-specific slot ordering from schema
 * - Proper formatting (30-Inch, 28 Cu. Ft., 50,000 BTU)
 * 
 * Example outputs:
 * - "Samsung 28 Cu. Ft. French Door Counter-Depth Refrigerator Stainless Steel - RF28T5001SR"
 * - "Wolf 48-Inch Dual Fuel Slide-In Range Stainless Steel - DF48450G"
 * - "Kohler 60-Inch Freestanding Bathtub White - K-700"
 * - "Moen Arbor Pull-Down Kitchen Faucet Spot Resist Stainless - 7594SRS"
 */

import logger from '../utils/logger';
import {
  getCategoryTitleSchema,
  FORMATTING_RULES,
  ATTRIBUTE_FORMATTERS,
  CategoryTitleSchema,
  TitleSlot
} from '../config/title-schema-by-category';

// Re-export types for backward compatibility
export { CategoryTitleSchema, TitleSlot };

/**
 * Input interface for SEO title generation
 */
export interface SEOTitleInput {
  brand?: string;
  modelNumber?: string; // Used at END of title with dash prefix (e.g., "- K30-100-SL")
  category: string;
  subCategory?: string;
  
  // Collection/Style
  collection?: string;
  style?: string;
  
  // Dimensions
  width?: string | number;
  height?: string | number;
  depth?: string | number;
  length?: string | number;
  diameter?: string | number;
  
  // Specs
  totalCapacity?: string | number;
  btu?: string | number;
  cfm?: string | number;
  gpm?: string | number;
  wattage?: string | number;
  powerKw?: string | number;
  horsepower?: string | number;
  production?: string | number; // lbs/day for icemakers
  dbaLevel?: string | number;
  mervRating?: string | number;
  bladeSpan?: string | number;
  aperture?: string | number;
  lightCount?: string | number;
  numberOfLights?: string | number; // Alias for lightCount
  numberOfBurners?: string | number; // For ranges/cooktops
  burnerCount?: string | number; // Alias for numberOfBurners
  placeSettings?: string | number; // For dishwashers
  
  // Type/Configuration
  type?: string;
  configuration?: string;
  installationType?: string;
  depthType?: string; // Counter-Depth for freestanding refrigerators (omit for built-in or standard depth)
  panelReady?: string; // For panel-ready dishwashers/refrigerators
  controlType?: string; // For dishwashers (Top Control, Front Control)
  basinCount?: string; // For sinks (Single Basin, Double Basin)
  sinkShape?: string; // For sinks (Rectangular, Round, Oval, etc.)
  shape?: string; // Generic shape (Rectangular, Round, Oval, Arch, Square) — for mirrors, etc.
  function?: string; // For Showerheads & Accessories: Thermostatic, Pressure-Balance, Diverter (distinct from 'type')
  mountType?: string;
  holeConfig?: string;
  bowlConfig?: string;
  bowlShape?: string;
  flushType?: string;
  feedType?: string;
  fuelType?: string;
  connectionSize?: string;
  filtrationLevel?: string;
  
  // Appearance
  finish?: string;
  color?: string;
  colorPattern?: string;
  material?: string;
  topMaterial?: string;
  
  // Additional
  colorTemp?: string;
  bulbType?: string;
  wattageEquivalent?: string | number;
  compatibility?: string;
  tileSize?: string;
  
  // Features (array of feature strings)
  features?: string[];
  
  // Raw title for accessory subtype extraction and fallback
  rawTitle?: string;
}

/**
 * Attribute name to input field mapping
 * Maps schema attribute names to SEOTitleInput field names
 */
const ATTRIBUTE_TO_FIELD: Record<string, keyof SEOTitleInput | string> = {
  'Brand': 'brand',
  'Category': 'category',
  'Collection': 'collection',
  'Collection/Style': 'collection',
  'Style': 'style',
  
  // Dimensions
  'Width': 'width',
  'Width (Inches)': 'width',
  'Width (Inches)*': 'width',
  'Height (Inches)': 'height',
  'Length (Inches)': 'length',
  'Diameter (Inches)': 'diameter',
  'Aperture (Inches)': 'aperture',
  'Size (Inches)': 'width', // Default to width
  'Blade Span (Inches)': 'bladeSpan',
  'Width/Length': 'width',
  'Length (Feet)': 'length',
  'Track Length (Feet)': 'length',
  'Dimensions (W×H)': 'dimensionsWxH', // Special handling
  'Width×Height': 'dimensionsWxH', // Special handling (Medicine Cabinet)
  
  // Specs
  'Capacity (Cu. Ft.)': 'totalCapacity',
  'BTU': 'btu',
  'BTU/Watts': 'btu',
  'Tonnage/BTU': 'btu',
  'CFM': 'cfm',
  'GPM': 'gpm',
  'GPM/BTU': 'gpm',
  'dBA Level': 'dbaLevel',
  'Wattage': 'wattage',
  'Power (kW)': 'powerKw',
  'MERV Rating': 'mervRating',
  'Light Count': 'lightCount',
  'Number of Lights': 'numberOfLights',
  'Horsepower': 'horsepower',
  'Production (lbs/day)': 'production',
  'Wattage Equivalent': 'wattageEquivalent',
  'Place Settings': 'placeSettings',
  'Burner Count': 'burnerCount',
  'Number of Burners': 'numberOfBurners',
  
  // Type/Configuration
  'Type': 'type',
  'Type/Size': 'type',
  'Function': 'function',
  'Configuration': 'configuration',
  'Installation Type': 'installationType',
  'Mount': 'mountType',
  'Mount Type': 'mountType',
  'Hole Config': 'holeConfig',
  'Bowl Config': 'bowlConfig',
  'Bowl Shape': 'bowlShape',
  'Sink Shape': 'sinkShape',
  'Flush Type': 'flushType',
  'Feed Type': 'feedType',
  'Fuel Type': 'fuelType',
  'Connection Size': 'connectionSize',
  'Filtration Level': 'filtrationLevel',
  'Shape': 'shape',          // Generic shape → mirrors, etc.
  'Mirror Shape': 'shape',   // Explicit mirror alias
  'Control Type': 'controlType',
  'Basin Count': 'basinCount',
  'Panel Ready': 'panelReady',
  'Depth Type': 'depthType',
  
  // Appearance
  'Finish': 'finish',
  'Finish/Color': 'finish',
  'Color': 'color',
  'Color/Finish': 'color',
  'Color/Pattern': 'colorPattern',
  'Material': 'material',
  'Top Material': 'topMaterial',
  'Color Temp': 'colorTemp',
  'Bulb Type': 'bulbType',
  
  // Other
  'Compatibility': 'compatibility',
  'Tile Size': 'tileSize',
  'Features': 'features',
  'Size': 'width',
  'Capacity/Size': 'totalCapacity',
  'Size/Volume': 'totalCapacity',
  'Diameter/Width': 'diameter',
  'Model Number': 'modelNumber',
};

/**
 * Get the raw value from input for a given attribute
 */
function getInputValue(input: SEOTitleInput, attribute: string): string | number | string[] | undefined {
  const fieldName = ATTRIBUTE_TO_FIELD[attribute];
  if (!fieldName) return undefined;
  
  // Special case for Category - use the category name, not category_id
  if (attribute === 'Category') {
    return input.category;
  }
  
  // Special case for Collection/Style - try collection first, then style
  if (attribute === 'Collection/Style') {
    return input.collection || input.style;
  }
  
  // Special case for Configuration - try configuration first, then fall back to type
  // This handles cases where Type matching populated input.type but AI didn't populate input.configuration
  // Example: Refrigerator Type="French Door" should appear in Configuration slot
  if (attribute === 'Configuration') {
    return input.configuration || input.type;
  }
  
  // Special case for Burner Count - try burnerCount first, then numberOfBurners
  // finalSeoTitleInput populates numberOfBurners, but the schema attribute maps to burnerCount
  if (attribute === 'Burner Count' || attribute === 'Number of Burners') {
    return input.burnerCount || input.numberOfBurners;
  }
  
  const value = (input as unknown as Record<string, unknown>)[fieldName] as string | number | string[] | undefined;
  
  // Debug logging for Width attribute
  if (attribute === 'Width (Inches)') {
    logger.info('[DEBUG] getInputValue for Width (Inches)', {
      attribute,
      fieldName,
      retrievedValue: value || 'UNDEFINED',
      inputWidthField: input.width || 'NOT SET IN INPUT',
      inputKeys: Object.keys(input)
    });
  }
  
  return value;
}

/**
 * Format a value according to its attribute type
 */
function formatValue(attribute: string, value: string | number | string[] | undefined, input?: SEOTitleInput): string {
  // Handle composite dimension attributes FIRST (before undefined check)
  // These compose from separate width + height fields, not a single value
  if ((attribute === 'Dimensions (W×H)' || attribute === 'Width×Height') && input) {
    const width = input.width;
    const height = input.height;
    if (width && height) {
      return FORMATTING_RULES.dimensionsWxH(width, height);
    }
    return '';
  }

  if (value === undefined || value === null) {
    // Debug logging for Width
    if (attribute === 'Width (Inches)') {
      logger.info('[DEBUG] formatValue - Width value is undefined/null', {
        attribute,
        value: value === undefined ? 'UNDEFINED' : 'NULL'
      });
    }
    return '';
  }
  
  // Debug logging for Width before processing
  if (attribute === 'Width (Inches)') {
    logger.info('[DEBUG] formatValue - Processing Width', {
      attribute,
      rawValue: value,
      rawValueType: typeof value
    });
  }
  
  // Handle features array specially
  if (attribute === 'Features' && Array.isArray(value)) {
    // Take max 3 features
    const filtered = value
      .filter(f => f && typeof f === 'string' && f.toLowerCase() !== 'not found')
      .slice(0, 3);
    return filtered.length > 0 ? `(${filtered.join(', ')})` : '';
  }
  
  // Handle Tile Size specially
  if (attribute === 'Tile Size' && typeof value === 'string') {
    return FORMATTING_RULES.tileSize(value);
  }
  
  // Handle Model Number specially - prefix with dash
  if (attribute === 'Model Number') {
    const strValue = String(value).trim();
    if (strValue && strValue.toLowerCase() !== 'not found' && strValue.toLowerCase() !== 'n/a' && strValue.toLowerCase() !== 'not applicable') {
      return `- ${strValue}`;
    }
    return '';
  }
  
  // Check for formatter
  const formatterKey = ATTRIBUTE_FORMATTERS[attribute];
  if (formatterKey && FORMATTING_RULES[formatterKey]) {
    // 🔥 SIZE CLASS INTEGRATION: Pass category and installationType for dimension formatter
    // This enables smart rounding (e.g., 47.25" → "48-Inch" for refrigerators)
    let formattedResult: string;
    if (formatterKey === 'dimension' && input) {
      // dimension() requires category and installationType for size class lookup
      const formatter = FORMATTING_RULES[formatterKey] as (v: number | string, cat?: string, inst?: string) => string;
      formattedResult = formatter(value as number | string, input.category, input.installationType);
    } else {
      // Other formatters only need the value
      const formatter = FORMATTING_RULES[formatterKey] as (v: number | string) => string;
      formattedResult = formatter(value as number | string);
    }
    
    // Debug logging for Width
    if (attribute === 'Width (Inches)') {
      logger.info('[DEBUG] formatValue - Width formatted', {
        attribute,
        formatterKey,
        inputValue: value,
        category: input?.category || 'NOT PROVIDED',
        installationType: input?.installationType || 'NOT PROVIDED',
        formattedResult: formattedResult || 'EMPTY STRING'
      });
    }
    
    return formattedResult;
  }
  
  // For string values, just convert and clean
  const strValue = String(value).trim();
  
  // Skip invalid values
  const lowerValue = strValue.toLowerCase();
  if (lowerValue === 'not found' || 
      lowerValue === 'n/a' ||
      lowerValue === 'not applicable' ||
      lowerValue.startsWith('not specified') ||
      strValue === '' ||
      strValue === 'undefined' ||
      lowerValue === 'yes' ||
      lowerValue === 'no' ||
      lowerValue === 'true' ||
      lowerValue === 'false') {
    return '';
  }
  
  return strValue;
}

function normalizeModelNumber(modelNumber?: string): string {
  if (!modelNumber) return '';
  const value = modelNumber.trim();
  if (!value) return '';

  const invalid = ['not found', 'n/a', 'not applicable', 'undefined', 'null'];
  if (invalid.includes(value.toLowerCase())) return '';

  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function enforceModelAtEnd(title: string, modelNumber?: string): string {
  const model = normalizeModelNumber(modelNumber);
  if (!model) return title;

  // Remove any trailing model appearance so we can append exactly once at the end
  const escaped = escapeRegExp(model);
  title = title
    .replace(new RegExp(`\\s*-\\s*${escaped}\\s*$`, 'i'), '')
    .replace(new RegExp(`\\s+${escaped}\\s*$`, 'i'), '')
    .trim();

  const suffix = `- ${model}`;

  // Reserve room for suffix and keep overall max length at 150
  const maxLength = 150;
  const maxBaseLength = Math.max(0, maxLength - suffix.length - 1);
  if (title.length > maxBaseLength) {
    title = title.substring(0, maxBaseLength).replace(/\s+$/, '').replace(/[\-.,;:]+$/, '').trim();
  }

  if (!title) return model;
  return `${title} ${suffix}`.trim();
}

/**
 * Round fractional and decimal dimensions in a title string.
 * Converts "15-1/2" → "16", "39-3/8" → "39", "23.5×29.5" → "24×30", etc.
 * Only targets dimension patterns — does NOT touch performance specs like "1.5 GPM".
 */
function roundDimensionsInTitle(title: string): string {
  // Round fraction notation: "15-1/2" → "16", "39-3/8" → "39"
  title = title.replace(/(\d+)-(\d+)\/(\d+)/g, (_match, whole, num, den) => {
    const value = parseInt(whole) + parseInt(num) / parseInt(den);
    return String(Math.round(value));
  });

  // Round decimal dimensions near dimension separators (× or x)
  // "23.5×29.5" → "24×30"
  title = title.replace(/(\d+\.\d+)(\s*[×x]\s*)/gi, (_match, num, sep) => {
    return String(Math.round(parseFloat(num))) + sep;
  });
  title = title.replace(/([×x]\s*)(\d+\.\d+)/gi, (_match, sep, num) => {
    return sep + String(Math.round(parseFloat(num)));
  });

  // Round decimal dimensions followed by dimension indicators
  // "23.5-Inch" → "24-Inch", "23.5 in." → "24 in."
  title = title.replace(/(\d+\.\d+)(-Inch|"\s|\s+in\.)/gi, (_match, num, suffix) => {
    return String(Math.round(parseFloat(num))) + suffix;
  });

  return title;
}

/**
 * MAIN FUNCTION: Generate SEO-optimized product title
 * 
 * Uses category-specific schema to determine slot order and formatting.
 * Falls back to generic formula if no schema exists.
 */
/**
 * Convert string to Title Case with smart handling of special cases
 * 
 * Rules:
 * - First letter of each word capitalized
 * - Small words (and, of, for, in, with, the) lowercase unless first/last word
 * - All-caps short words (2-5 letters) preserved as acronyms (KWC, DXV, GPM, CFM, BTU)
 * - Model numbers with special characters preserved as-is
 * - Brand names: first letter capitalized, rest lowercase (DELTA → Delta)
 * 
 * Examples:
 * - "DELTA Kitchen Faucet" → "Delta Kitchen Faucet"
 * - "KWC Wall Mount Faucet" → "KWC Wall Mount Faucet" (acronym preserved)
 * - "hansgrohe 1.2 GPM Faucet" → "Hansgrohe 1.2 GPM Faucet"
 * - "Product For The Kitchen" → "Product for the Kitchen"
 */
function toTitleCase(str: string): string {
  if (!str) return '';

  // Small words that should be lowercase (unless first/last word)
  const smallWords = new Set(['and', 'or', 'but', 'for', 'in', 'of', 'on', 'the', 'to', 'with', 'a', 'an']);
  
  // Words that LOOK like acronyms (all caps, 2-5 letters) but are actually normal words.
  // These should be title-cased, NOT preserved as all-caps.
  const notAcronyms = new Set(['BRASS', 'DERA', 'FLUSH', 'STONE', 'CHINA', 'PEARL', 'CRAFT', 'SHORE', 'STEEL', 'BLACK', 'WHITE', 'VALVE', 'DRAIN']);
  
  // Split on spaces and process each word
  const words = str.split(/\s+/);
  
  return words.map((word, index) => {
    if (!word) return word;
    
    // Preserve model numbers with special characters or numbers at start
    // Examples: "K-304-SL", "71734821", "G-6810-LM47B-PN"
    if (/^[\dA-Z][-\dA-Z.#]+$/i.test(word) && (word.includes('-') || word.includes('.') || word.includes('#') || /^\d/.test(word))) {
      return word;
    }
    
    // Preserve all-caps acronyms (2-5 letters, all uppercase)
    // Examples: "KWC", "DXV", "GPM", "CFM", "BTU", "BTU/H"
    // But NOT brand-related words like "BRASS" which should be title-cased.
    if (/^[A-Z]{2,5}(\/[A-Z]+)?$/.test(word) && !notAcronyms.has(word)) {
      return word;
    }
    
    // Convert word to lowercase first
    const lowerWord = word.toLowerCase();
    
    // Small words: lowercase unless first or last word
    if (index !== 0 && index !== words.length - 1 && smallWords.has(lowerWord)) {
      return lowerWord;
    }
    
    // Standard title case: capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

export function generateSEOTitle(input: SEOTitleInput): string {
  const categoryName = input.category || '';
  const schema = getCategoryTitleSchema(categoryName);
  
  let title: string;
  
  if (schema) {
    title = generateFromSchema(input, schema);
  } else {
    title = generateFallbackTitle(input);
  }
  
  // Clean up: normalize spaces, remove trailing punctuation
  title = title
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*$/, '')
    .replace(/\s*\(\s*\)\s*$/, '') // Remove empty parentheses
    .trim();
  
  // Apply title case formatting to entire title
  // This ensures consistent capitalization: "DELTA" → "Delta", "hansgrohe" → "Hansgrohe"
  title = toTitleCase(title);
  
  // Round any fractional/decimal dimensions in the title (title-only, not verified data)
  // "15-1/2 x 39-3/8" → "16 x 39", "23.5-Inch" → "24-Inch"
  title = roundDimensionsInTitle(title);
  
  // Enforce max length (150 chars absolute max)
  if (title.length > 150) {
    // Try to cut at a sensible point (before features)
    const parenIndex = title.lastIndexOf('(');
    if (parenIndex > 50) {
      title = title.substring(0, parenIndex).trim();
    } else {
      title = title.substring(0, 147) + '...';
    }
  }

  // Hard guarantee: model number is always at end when available
  title = enforceModelAtEnd(title, input.modelNumber);
  
  logger.debug('Generated SEO title (v2)', {
    category: categoryName,
    hasSchema: !!schema,
    brand: input.brand,
    generatedTitle: title,
    titleLength: title.length
  });
  
  return title;
}

/**
 * Generate title using category-specific schema
 */
/**
 * Extract specific accessory subtype from raw title/description for better title clarity
 * Example: "Sub-Zero Installation Kit for Model 7003411" → "Installation Kit"
 * Example: "Coyote 32" Single Storage Drawer" → "Storage Drawer"
 * Example: "Monogram Unification Trim Kit" → "Trim Kit"
 * 
 * CRITICAL: Patterns are ordered from MOST SPECIFIC to LEAST SPECIFIC
 * to ensure we capture multi-word descriptors like "Storage Drawer" before just "Drawer"
 */
function extractAccessorySubtype(input: SEOTitleInput): string | undefined {
  const rawTitle = input.rawTitle?.toLowerCase() || '';
  
  // Patterns ordered from MOST SPECIFIC (longer phrases) to LEAST SPECIFIC (single words)
  // This ensures "Storage Drawer" matches before "Drawer"
  const patterns: Array<{ pattern: RegExp; displayName: string }> = [
    // --- MULTI-WORD SPECIFIC PHRASES (match these first) ---
    // Kits (including comma-separated variants like "Kit,Installation")
    { pattern: /kit[,\s]+installation/i, displayName: 'Installation Kit' },
    { pattern: /installation\s+kit/i, displayName: 'Installation Kit' },
    { pattern: /dual\s+installation\s+kit/i, displayName: 'Installation Kit' },
    { pattern: /unification\s+kit/i, displayName: 'Unification Kit' },
    { pattern: /unification\s+trim\s+kit/i, displayName: 'Trim Kit' },
    { pattern: /panel\s+kit/i, displayName: 'Panel Kit' },
    { pattern: /trim\s+kit/i, displayName: 'Trim Kit' },
    { pattern: /conversion\s+kit/i, displayName: 'Conversion Kit' },
    { pattern: /heater\s+kit/i, displayName: 'Heater Kit' },
    { pattern: /heating\s+kit/i, displayName: 'Heating Kit' },
    { pattern: /vent\s+kit/i, displayName: 'Vent Kit' },
    { pattern: /duct\s+kit/i, displayName: 'Duct Kit' },
    { pattern: /stacking\s+kit/i, displayName: 'Stacking Kit' },
    { pattern: /mounting\s+kit/i, displayName: 'Mounting Kit' },
    { pattern: /hardware\s+kit/i, displayName: 'Hardware Kit' },
    { pattern: /door\s+panel\s+kit/i, displayName: 'Door Panel Kit' },
    
    // Panels  
    { pattern: /refrigerator\s+panel/i, displayName: 'Refrigerator Panel' },
    { pattern: /door\s+panel/i, displayName: 'Door Panel' },
    { pattern: /custom\s+panel/i, displayName: 'Custom Panel' },
    { pattern: /front\s+panel/i, displayName: 'Front Panel' },
    { pattern: /side\s+panel/i, displayName: 'Side Panel' },
    { pattern: /decorative\s+panel/i, displayName: 'Decorative Panel' },
    { pattern: /stainless\s+(?:steel\s+)?panel/i, displayName: 'Stainless Steel Panel' },
    { pattern: /flat\s+(?:stainless\s+)?(?:steel\s+)?panel/i, displayName: 'Panel' },
    
    // Drawers
    { pattern: /storage\s+drawer/i, displayName: 'Storage Drawer' },
    { pattern: /warming\s+drawer/i, displayName: 'Warming Drawer' },
    { pattern: /utility\s+drawer/i, displayName: 'Utility Drawer' },
    { pattern: /pull-?\s*out\s+drawer/i, displayName: 'Pull-Out Drawer' },
    { pattern: /single\s+drawer/i, displayName: 'Storage Drawer' },
    { pattern: /double\s+drawer/i, displayName: 'Double Drawer' },
    { pattern: /triple\s+drawer/i, displayName: 'Triple Drawer' },
    
    // Carts & Stands
    { pattern: /grill\s+cart/i, displayName: 'Grill Cart' },
    { pattern: /flat\s+top\s+(?:grill\s+)?cart/i, displayName: 'Grill Cart' },
    { pattern: /island\s+cart/i, displayName: 'Island Cart' },
    { pattern: /cart/i, displayName: 'Cart' },
    { pattern: /\bstand\b/i, displayName: 'Stand' },
    
    // Covers
    { pattern: /duct\s+cover\s*(?:extension|kit)?/i, displayName: 'Duct Cover' },
    { pattern: /chimney\s+(?:hood\s+)?(?:island\s+)?(?:duct\s+)?cover/i, displayName: 'Duct Cover' },
    { pattern: /flue\s+(?:cover|extension)/i, displayName: 'Flue Extension' },
    { pattern: /ducted\s+flue/i, displayName: 'Flue Extension' },
    { pattern: /ceiling\s+duct\s+cover/i, displayName: 'Duct Cover' },
    { pattern: /grill\s+cover/i, displayName: 'Grill Cover' },
    { pattern: /built-?\s*in\s+cover/i, displayName: 'Built-In Cover' },
    { pattern: /smoker\s+cover/i, displayName: 'Smoker Cover' },
    
    // Range Hood specific accessories
    { pattern: /external\s+blower/i, displayName: 'External Blower' },
    { pattern: /remote\s+blower/i, displayName: 'Remote Blower' },
    { pattern: /in-?\s*line\s+blower/i, displayName: 'Inline Blower' },
    { pattern: /blower\s+(?:kit|assembly|motor)/i, displayName: 'Blower' },
    { pattern: /(?:\d+\s*cfm|cfm)\s+(?:external\s+)?blower/i, displayName: 'External Blower' },
    { pattern: /baffle\s+filter/i, displayName: 'Baffle Filter' },
    { pattern: /recirculation\s+(?:kit|filter)/i, displayName: 'Recirculation Kit' },
    { pattern: /recirc(?:ulating)?\s+kit/i, displayName: 'Recirculation Kit' },
    { pattern: /make-?\s*up\s+air\s+(?:kit|damper)/i, displayName: 'Make-Up Air Kit' },
    { pattern: /damper/i, displayName: 'Damper' },
    { pattern: /backsplash\s*(?:panel)?/i, displayName: 'Backsplash' },
    { pattern: /wall\s+flue/i, displayName: 'Wall Flue' },
    { pattern: /flue/i, displayName: 'Flue Extension' },
    { pattern: /blower/i, displayName: 'Blower' },
    
    // Toilet / Plumbing specific
    { pattern: /toilet\s+seat\s+cover\s+dispenser/i, displayName: 'Toilet Seat Cover Dispenser' },
    { pattern: /toilet\s+seat\s+cover/i, displayName: 'Toilet Seat Cover' },
    { pattern: /toilet\s+seat/i, displayName: 'Toilet Seat' },
    { pattern: /toilet\s+tank\s+(?:trip\s+)?lever/i, displayName: 'Toilet Tank Lever' },
    { pattern: /tank\s+trip\s+lever/i, displayName: 'Toilet Tank Lever' },
    { pattern: /trip\s+lever/i, displayName: 'Trip Lever' },
    { pattern: /toilet\s+tank\s+only/i, displayName: 'Toilet Tank' },
    { pattern: /tank\s+only/i, displayName: 'Toilet Tank' },
    { pattern: /toilet\s+tank\s+lid/i, displayName: 'Toilet Tank Lid' },
    { pattern: /toilet\s+tank/i, displayName: 'Toilet Tank' },
    { pattern: /toilet\s+bowl\s+only/i, displayName: 'Toilet Bowl' },
    { pattern: /toilet\s+lid/i, displayName: 'Toilet Lid' },
    { pattern: /toilet\s+paper\s+holder/i, displayName: 'Toilet Paper Holder' },
    { pattern: /toilet\s+brush/i, displayName: 'Toilet Brush' },
    { pattern: /bidet\s+seat/i, displayName: 'Bidet Seat' },
    { pattern: /flush\s+valve/i, displayName: 'Flush Valve' },
    { pattern: /fill\s+valve/i, displayName: 'Fill Valve' },
    { pattern: /wax\s+ring/i, displayName: 'Wax Ring' },
    { pattern: /flapper/i, displayName: 'Flapper' },
    { pattern: /supply\s+line/i, displayName: 'Supply Line' },
    { pattern: /seat\s+cover\s+dispenser/i, displayName: 'Seat Cover Dispenser' },
    
    // Shower / Bath specific
    { pattern: /ceiling[\s-]*(?:mounted\s+)?shower\s*arm/i, displayName: 'Ceiling Shower Arm' },
    { pattern: /wall[\s-]*(?:mounted\s+)?shower\s*arm/i, displayName: 'Wall Shower Arm' },
    { pattern: /shower\s*arm/i, displayName: 'Shower Arm' },
    { pattern: /shower\s*door\s*handle/i, displayName: 'Shower Door Handle' },
    { pattern: /hand\s*shower\s*holder/i, displayName: 'Hand Shower Holder' },
    { pattern: /handshower\s*(?:set|kit)/i, displayName: 'Handshower Kit' },
    { pattern: /slide\s*bar\s*(?:hand\s*shower|kit)/i, displayName: 'Slide Bar Kit' },
    { pattern: /slide\s*bar/i, displayName: 'Slide Bar' },
    { pattern: /hand\s*shower\s*(?:set|kit)/i, displayName: 'Hand Shower Kit' },
    { pattern: /shower\s*hose/i, displayName: 'Shower Hose' },
    { pattern: /shower\s*flange/i, displayName: 'Shower Flange' },
    { pattern: /supply\s*elbow/i, displayName: 'Supply Elbow' },
    { pattern: /wall\s*(?:supply\s+)?(?:elbow|bracket)/i, displayName: 'Wall Bracket' },
    { pattern: /valve\s+extension\s+kit/i, displayName: 'Valve Extension Kit' },
    { pattern: /shower\s*(?:outlet|diverter)/i, displayName: 'Shower Diverter' },
    { pattern: /volume\s+control/i, displayName: 'Volume Control' },
    { pattern: /transfer\s+(?:valve|handle|trim)/i, displayName: 'Transfer Valve' },
    { pattern: /linear\s*drain/i, displayName: 'Linear Drain' },
    { pattern: /shower\s*drain/i, displayName: 'Shower Drain' },
    { pattern: /shower\s*base/i, displayName: 'Shower Base' },
    { pattern: /shower\s*pan/i, displayName: 'Shower Pan' },
    { pattern: /steam\s+(?:shower\s+)?controller/i, displayName: 'Steam Controller' },
    { pattern: /steam\s+(?:shower\s+)?generator/i, displayName: 'Steam Generator' },
    
    // Outdoor appliance components (previously Outdoor Kitchen specific)
    { pattern: /access\s+door/i, displayName: 'Access Door' },
    { pattern: /trash\s+(?:drawer|chute|door)/i, displayName: 'Trash Drawer' },
    { pattern: /paper\s+towel\s+(?:holder|dispenser)/i, displayName: 'Paper Towel Holder' },
    { pattern: /propane\s+tank\s+(?:drawer|door)/i, displayName: 'Propane Tank Drawer' },
    { pattern: /combo\s+(?:access\s+)?drawer/i, displayName: 'Combo Drawer' },
    
    // Trims & Surrounds
    { pattern: /trim\s+strip/i, displayName: 'Trim Strip' },
    { pattern: /filler\s+strip/i, displayName: 'Filler Strip' },
    { pattern: /surround\s+(?:kit|frame|panel)?/i, displayName: 'Surround' },
    { pattern: /filler/i, displayName: 'Filler' },
    
    // Shelves & Racks
    { pattern: /wine\s+shelf/i, displayName: 'Wine Shelf' },
    { pattern: /glass\s+shelf/i, displayName: 'Glass Shelf' },
    { pattern: /drying\s+rack/i, displayName: 'Drying Rack' },
    { pattern: /wine\s+rack/i, displayName: 'Wine Rack' },
    { pattern: /spice\s+rack/i, displayName: 'Spice Rack' },
    { pattern: /shelf/i, displayName: 'Shelf' },
    { pattern: /shelving/i, displayName: 'Shelving' },
    { pattern: /rack/i, displayName: 'Rack' },
    
    // Kitchen accessories
    { pattern: /sink\s+grid/i, displayName: 'Sink Grid' },
    { pattern: /cutting\s+board/i, displayName: 'Cutting Board' },
    { pattern: /drainboard/i, displayName: 'Drainboard' },
    { pattern: /drain\s+board/i, displayName: 'Drain Board' },
    { pattern: /colander/i, displayName: 'Colander' },
    { pattern: /soap\s+dispenser/i, displayName: 'Soap Dispenser' },
    { pattern: /roll\s+tray/i, displayName: 'Roll Tray' },
    { pattern: /rollout\s+tray/i, displayName: 'Rollout Tray' },
    { pattern: /roll-?\s*out\s+tray/i, displayName: 'Rollout Tray' },
    
    // Handles & Hardware
    { pattern: /door\s+handle/i, displayName: 'Door Handle' },
    { pattern: /handle\s+kit/i, displayName: 'Handle Kit' },
    { pattern: /handle/i, displayName: 'Handle' },
    { pattern: /knob/i, displayName: 'Knob' },
    { pattern: /hardware/i, displayName: 'Hardware' },
    
    // Bins & Baskets
    { pattern: /vegetable\s+bin/i, displayName: 'Vegetable Bin' },
    { pattern: /crisper\s+(?:bin|drawer)/i, displayName: 'Crisper Drawer' },
    { pattern: /storage\s+bin/i, displayName: 'Storage Bin' },
    { pattern: /bin/i, displayName: 'Bin' },
    { pattern: /basket/i, displayName: 'Basket' },
    
    // Filters & Maintenance
    { pattern: /water\s+filter/i, displayName: 'Water Filter' },
    { pattern: /air\s+filter/i, displayName: 'Air Filter' },
    { pattern: /grease\s+filter/i, displayName: 'Grease Filter' },
    { pattern: /charcoal\s+filter/i, displayName: 'Charcoal Filter' },
    { pattern: /filter/i, displayName: 'Filter' },
    
    // Appliance-specific
    { pattern: /ice\s+maker/i, displayName: 'Ice Maker' },
    { pattern: /icemaker/i, displayName: 'Ice Maker' },
    { pattern: /rotisserie/i, displayName: 'Rotisserie' },
    { pattern: /warming\s+tray/i, displayName: 'Warming Tray' },
    { pattern: /lid/i, displayName: 'Lid' },
    { pattern: /cover/i, displayName: 'Cover' },
    
    // Generic fallbacks (LAST - least specific)
    { pattern: /panel/i, displayName: 'Panel' },
    { pattern: /drawer/i, displayName: 'Drawer' },
    { pattern: /door/i, displayName: 'Door' },
    { pattern: /kit/i, displayName: 'Kit' },
    { pattern: /tray/i, displayName: 'Tray' },
  ];
  
  // Try each pattern in order (most specific first)
  for (const { pattern, displayName } of patterns) {
    if (pattern.test(rawTitle)) {
      logger.info('Extracted accessory subtype from raw title', {
        rawTitle: input.rawTitle,
        pattern: pattern.toString(),
        extractedSubtype: displayName
      });
      return displayName;
    }
  }
  
  // Fallback: Try to extract the main noun phrase from the title
  // Pattern: Look for "Brand X <DESCRIPTOR> - Model" or similar structures
  const descriptorMatch = rawTitle.match(/(?:inch|wide|tall|deep|\d+["'″])\s+([\w\s-]+?)(?:\s+[-–—]|\s+(?:for|with|in)\s|$)/i);
  if (descriptorMatch && descriptorMatch[1]) {
    const descriptor = descriptorMatch[1].trim();
    // Ensure it's not just a single common word and looks like a descriptor
    const words = descriptor.split(/\s+/);
    if (words.length >= 1 && words.length <= 4 && descriptor.length > 3) {
      const formatted = descriptor
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      logger.info('Extracted accessory subtype via fallback pattern', {
        rawTitle: input.rawTitle,
        extractedSubtype: formatted
      });
      return formatted;
    }
  }
  
  logger.warn('Could not extract accessory subtype from title', {
    rawTitle: input.rawTitle
  });
  return undefined;
}

function generateFromSchema(input: SEOTitleInput, schema: CategoryTitleSchema): string {
  const parts: string[] = [];
  
  // Sort slots by position
  let sortedSlots = [...schema.slots].sort((a, b) => a.position - b.position);
  
  // ACCESSORY TITLE FIX: For accessory products, reorder slots for natural flow
  // Desired order: "{Brand} {Width/Size} {Category} {Finish} {Type/Subtype} - {Model}"
  // Example: "JENNAIR 18-Inch Refrigerator Stainless Steel Panel Kit - JKCPR181GL"
  const isAccessory = input.type?.toLowerCase() === 'accessory';
  if (isAccessory) {
    // Define priority order for accessories (UNIVERSAL - works for all categories)
    // This list includes common attributes; only those present in the schema will be used
    const accessoryPriorityOrder = [
      'Brand',                    // Always first
      'Width (Inches)',           // Size attributes (if category has them)
      'Width',
      'Wattage',
      'Diameter (Inches)',
      'Height (Inches)',
      'GPM',
      'BTU',
      'Category',                 // Category name
      'Finish',                   // Color/finish
      'Color',
      'Type',                     // Accessory subtype (will be extracted)
      'Model Number',             // Always last
      'Model'
    ];
    
    // Create new sorted array based on priority order
    const reorderedSlots: typeof sortedSlots = [];
    const remainingSlots: typeof sortedSlots = [...sortedSlots];
    
    // Add slots in priority order (only if they exist in schema)
    for (const attrName of accessoryPriorityOrder) {
      const idx = remainingSlots.findIndex(s => s.attribute === attrName);
      if (idx >= 0) {
        reorderedSlots.push(remainingSlots[idx]);
        remainingSlots.splice(idx, 1);
      }
    }
    
    // Skip any remaining slots not in priority list (Installation Type, Configuration, etc.)
    // These are typically not relevant for accessories
    sortedSlots = reorderedSlots;
    
    logger.info('Reordered slots for accessory title (universal)', {
      category: schema.categoryName,
      type: input.type,
      originalSlots: schema.slots.map(s => s.attribute).join(' → '),
      reorderedSlots: sortedSlots.map(s => s.attribute).join(' → ')
    });
  }
  
  // Debug logging for dishwashers
  if (schema.categoryName === 'Dishwasher') {
    logger.info('[DEBUG] Generating dishwasher title from schema', {
      inputWidth: input.width || 'NOT SET',
      inputPlaceSettings: input.placeSettings || 'NOT SET',
      inputInstallationType: input.installationType || 'NOT SET',
      slotCount: sortedSlots.length
    });
  }
  
  for (const slot of sortedSlots) {
    // CHANGE 1: Skip "Freestanding" installation type for refrigerators and freezers
    if (slot.attribute === 'Installation Type' && 
        (schema.categoryName === 'Refrigerator' || schema.categoryName === 'Freezer') && 
        input.installationType?.toLowerCase() === 'freestanding') {
      logger.info('Skipping Freestanding installation type (implied default)', {
        category: schema.categoryName,
        installationType: input.installationType
      });
      continue;
    }
    
    // CHANGE 1b: Skip "Built-In" type for icemakers (not a valid Icemaker type - valid types: Undercounter, Portable, Outdoor, Accessory)
    if (slot.attribute === 'Type' && 
        schema.categoryName === 'Icemaker' && 
        input.type?.toLowerCase() === 'built-in') {
      logger.info('Skipping Built-In type for icemaker (invalid type, Panel Ready implies built-in installation)', {
        category: schema.categoryName,
        type: input.type,
        panelReady: input.panelReady || 'not set'
      });
      continue;
    }
    
    // CHANGE 2: Skip "Built-In" for Beverage Center, Undercounter types, and Undercounter Freezers
    if (slot.attribute === 'Installation Type' && 
        input.installationType?.toLowerCase() === 'built-in' &&
        (input.type?.toLowerCase() === 'beverage center' || 
         input.type?.toLowerCase() === 'undercounter' ||
         (schema.categoryName === 'Freezer' && input.type?.toLowerCase() === 'undercounter'))) {
      logger.info('Skipping Built-In installation type for inherently built-in product', {
        category: schema.categoryName,
        type: input.type,
        installationType: input.installationType
      });
      continue;
    }
    
    // DIMENSION SWAP: For Bathroom Lighting / Vanity Lighting sconces, use height
    // instead of width when the product is a tall/slim wall-mounted sconce.
    // Width gives misleading tiny values like "3-Inch" when height is 13".
    let effectiveAttribute = slot.attribute;
    if (slot.attribute === 'Width (Inches)' && input.height && input.width) {
      const w = parseFloat(String(input.width));
      const h = parseFloat(String(input.height));
      const catLower = (input.category || '').toLowerCase();
      const typeLower = (input.type || '').toLowerCase();
      const isSconceLike = typeLower === 'sconce' || typeLower === 'wall sconce';
      const isLightingCat = catLower.includes('bathroom lighting') || catLower.includes('vanity lighting');
      // If height is at least 2x width and it's a sconce-type product, prefer height
      if (isLightingCat && isSconceLike && !isNaN(w) && !isNaN(h) && h > w * 2) {
        effectiveAttribute = 'Height (Inches)';
        logger.info('📐 DIMENSION SWAP: Using height instead of width for sconce title', {
          category: input.category,
          type: input.type,
          width: w,
          height: h,
          reason: 'Sconce is taller than wide — height is the primary dimension'
        });
      }
    }
    
    const rawValue = getInputValue(input, effectiveAttribute);
    let formattedValue = formatValue(effectiveAttribute, rawValue, input);
    
    // CHANGE 4: For Accessory type, use specific subtype instead of generic "Accessory"
    if (slot.attribute === 'Type' && rawValue?.toString().toLowerCase() === 'accessory') {
      const subtype = extractAccessorySubtype(input);
      if (subtype) {
        formattedValue = subtype;
        logger.info('Using accessory subtype for title', {
          originalType: 'Accessory',
          extractedSubtype: subtype,
          rawTitle: input.rawTitle
        });
      }
    }
    
    // ACCESSORY TITLE FIX: Never include the word "Accessory" in titles
    // Skip any slot where value is "Accessory" (Type slot already handled above with subtype)
    if (formattedValue?.toString().toLowerCase() === 'accessory') {
      logger.info('Skipping slot with "Accessory" value - word should not appear in title', {
        slotAttribute: slot.attribute,
        value: formattedValue,
        category: schema.categoryName
      });
      continue;
    }
    
    // TITLE-FRIENDLY TYPE NAMES: Some SF picklist types have consumer-unfriendly names.
    // Replace for titles only (verified data fields keep the SF picklist value).
    if (slot.attribute === 'Type' && formattedValue) {
      const typeDisplayMap: Record<string, string> = {
        'Trench Drain': 'Linear Drain',   // "Trench Drain" is industry jargon; "Linear Drain" is SEO-friendly  
        'Shower Rod': 'Slide Bar',         // "Shower Rod" is SF type; "Slide Bar" is what consumers search
      };
      if (typeDisplayMap[formattedValue]) {
        formattedValue = typeDisplayMap[formattedValue];
      }
    }
    
    // Apply slot format template if specified AND no ATTRIBUTE_FORMATTERS entry exists
    // (if ATTRIBUTE_FORMATTERS exists, formatValue already applied formatting)
    // Examples: "{value} Place Setting", "{value} CFM"
    const hasAttributeFormatter = !!ATTRIBUTE_FORMATTERS[slot.attribute];
    if (formattedValue && slot.format && slot.format.includes('{value}') && !hasAttributeFormatter) {
      formattedValue = slot.format.replace('{value}', formattedValue);
    }
    
    // Debug logging for dishwasher width slot
    if (schema.categoryName === 'Dishwasher' && slot.attribute === 'Width (Inches)') {
      logger.info('[DEBUG] Processing dishwasher width slot', {
        slotAttribute: slot.attribute,
        slotPosition: slot.position,
        rawValue: rawValue || 'NONE',
        formattedValue: formattedValue || 'EMPTY',
        inputWidthField: input.width || 'NOT SET'
      });
    }
    
    // FINDING #017 FIX: Skip redundant Type if it's a substring of Category
    // Example: Type="Storage Drawer" + Category="Storage Drawer/Door" → Skip Type
    // FINDING #046: Applies to Laundry Pedestal types (Storage, Functional, Riser, Accessory)
    if (formattedValue && slot.attribute === 'Type') {
      const categorySlot = sortedSlots.find(s => s.attribute === 'Category');
      if (categorySlot) {
        const categoryValue = getInputValue(input, categorySlot.attribute);
        const formattedCategory = formatValue(categorySlot.attribute, categoryValue, input);
        
        if (formattedCategory && 
            formattedCategory.toLowerCase().includes(formattedValue.toLowerCase())) {
          logger.info('Skipping redundant Type slot - value is substring of Category', {
            type: formattedValue,
            category: formattedCategory,
            reason: 'Type text already present in Category name'
          });
          continue; // Skip this slot entirely
        }
      }
    }
    
    // Handle "Bathroom Mirror" category + Type containing "Mirror":
    //   Instead of skipping Category entirely (losing the word "Bathroom"), merge
    //   "Bathroom" into the Type value.  E.g. Type="Wall Mirror" + Category="Bathroom Mirror"
    //   → output "Bathroom Wall Mirror" ("Bathroom" prefixed onto Type, Category slot skipped).
    // For plain "Mirror" category, skip entirely to avoid "Wall Mirror Mirror".
    if (formattedValue && slot.attribute === 'Category') {
      // Use titleDisplayName for categories with long names (e.g., "Showerheads & Accessories" → "Shower")
      if (schema.titleDisplayName) {
        formattedValue = schema.titleDisplayName;
      }
      const typeVal = (input.type || '').toLowerCase();
      if (typeVal.includes('mirror') && formattedValue.toLowerCase().includes('mirror')) {
        const isBathroomMirror = formattedValue.toLowerCase().includes('bathroom');
        if (isBathroomMirror) {
          // Inject "Bathroom" before the Type part that contains "mirror"
          const typeIndex = parts.findIndex(p => p.toLowerCase().includes('mirror'));
          if (typeIndex >= 0 && !parts[typeIndex].toLowerCase().startsWith('bathroom')) {
            parts[typeIndex] = `Bathroom ${parts[typeIndex]}`;
            logger.info('Merged "Bathroom" into Type for Bathroom Mirror title', {
              type: input.type,
              category: formattedValue,
              mergedPart: parts[typeIndex]
            });
          } else if (typeIndex < 0) {
            // Type with Mirror not found in parts — push full category
            parts.push(formattedValue);
          }
        } else {
          logger.info('Skipping redundant Category slot - Type already contains Mirror', {
            type: input.type,
            category: formattedValue,
            reason: 'Type already includes Mirror keyword'
          });
        }
        continue;
      }

      // Skip redundant Category when Type already contains the category keyword "Shower"
      // Examples: Type="Shower Arm" + Category="Shower" → just "Shower Arm"
      //           Type="Showerhead" + Category="Showerheads & Accessories" → just "Showerhead"
      //           Type="Hand Shower" + Category="Shower" → just "Hand Shower"
      //           Type="Steam Generator" + Category="Steam Shower" → just "Steam Generator"  
      // Non-matches kept: Type="Thermostatic" + Category="Shower" → "Thermostatic Shower"
      if (typeVal.includes('shower') && formattedValue.toLowerCase().includes('shower')) {
        logger.info('Skipping redundant Category slot - Type already contains Shower keyword', {
          type: input.type,
          category: formattedValue,
          reason: 'Type already includes Shower keyword'
        });
        continue;
      }
      // Cross-slot Steam deduplication: when Type has "Steam" (e.g., "Steam Generator"),
      // drop "Steam" from Category to avoid "Steam Generator Steam Shower".
      // Result: "MR. STEAM Steam Generator Shower Chrome" instead of 3x "Steam".
      if (typeVal.includes('steam') && formattedValue.toLowerCase().includes('steam')) {
        formattedValue = formattedValue.replace(/\bSteam\s*/i, '').trim();
        logger.info('Removed redundant "Steam" from Category - already in Type', {
          type: input.type,
          originalCategory: input.category,
          displayCategory: formattedValue
        });
        if (!formattedValue) continue; // skip if nothing left
      }

      // Cross-slot word-level deduplication for Tub Faucet:
      // Prevents "Roman Tub Tub Faucet" → "Roman Tub Faucet"
      // Prevents "Floor Mounted Tub Filler Tub Faucet" → "Floor Mounted Tub Filler"
      // Logic: When Category slot contains words already in preceding parts, remove them.
      if (schema.categoryName === 'Tub Faucet' && formattedValue) {
        const existingWords = parts.join(' ').toLowerCase().split(/\s+/);
        const categoryWords = formattedValue.split(/\s+/);
        const dedupedWords = categoryWords.filter(
          word => !existingWords.includes(word.toLowerCase())
        );
        if (dedupedWords.length < categoryWords.length) {
          const original = formattedValue;
          formattedValue = dedupedWords.join(' ').trim();
          logger.info('Removed redundant words from Tub Faucet Category slot', {
            original,
            deduped: formattedValue || '(all words removed)',
            existingParts: parts.join(' ')
          });
          if (!formattedValue) continue; // all words already present
        }
      }
    }

    // Skip if value already exists in parts (prevents duplicates like "Undercounter Undercounter")
    // Example: type="Undercounter" and installationType="Undercounter" should only appear once
    if (formattedValue && !parts.includes(formattedValue)) {
      parts.push(formattedValue);
    }
  }
  
  // Debug logging for dishwashers
  if (schema.categoryName === 'Dishwasher') {
    logger.info('[DEBUG] Dishwasher title parts assembled', {
      partsCount: parts.length,
      parts: parts.join(' | '),
      finalTitle: parts.join(' ')
    });
  }
  
  return parts.join(' ');
}

/**
 * Fallback title generation when no schema exists
 * Uses generic formula: Brand + Type + Category + Finish
 */
function generateFallbackTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  // 1. Brand (always first)
  if (input.brand) parts.push(input.brand);
  
  // 2. Type or Style
  const typeValue = input.type || input.style || input.configuration;
  if (typeValue && isValidValue(typeValue)) {
    parts.push(String(typeValue));
  }
  
  // 3. Category
  if (input.category) parts.push(input.category);
  
  // 4. Finish or Color
  const appearance = input.finish || input.color;
  if (appearance && isValidValue(appearance)) {
    parts.push(String(appearance));
  }
  
  // Features intentionally NOT included in title (v2.1 change)
  
  return parts.join(' ');
}

/**
 * Check if a value is valid (not empty, not "not found", not "n/a", not "not applicable")
 */
function isValidValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const str = String(value).toLowerCase().trim();
  // Exclude invalid placeholders
  if (str === '' || str === 'not found' || str === 'n/a' || str === 'not applicable' || str === 'undefined' || str.startsWith('not specified')) {
    return false;
  }
  // Exclude values that look like variant lists (e.g., "Available in multiple finishes...")
  if (str.startsWith('available in') || str.includes('multiple finishes') || str.includes('multiple colors')) {
    return false;
  }
  // Exclude values that are too long (likely descriptions, not attributes)
  if (str.length > 50) {
    return false;
  }
  return true;
}

/**
 * Detect if a field value contains variant information
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

/**
 * Get SEO keywords for a category (for AI prompt enhancement)
 */
export function getSEOKeywordsForCategory(category: string): string[] {
  const CATEGORY_SEO_KEYWORDS: Record<string, string[]> = {
    // Appliances
    'refrigerator': ['Energy Star', 'Smart', 'Counter Depth', 'French Door', 'Stainless Steel'],
    'range': ['Gas', 'Electric', 'Dual Fuel', 'Convection', 'Self-Cleaning'],
    'oven': ['Wall Oven', 'Smart', 'Double'],
    'dishwasher': ['Quiet', 'Energy Star', 'Third Rack', 'Built-In', 'Smart'],
    'microwave': ['Over-the-Range', 'Countertop', 'Built-In', 'Convection', 'Smart'],
    'washer': ['Front Load', 'Top Load', 'Steam', 'Smart', 'Large Capacity'],
    'dryer': ['Front Load', 'Top Load', 'Heat Pump', 'Steam', 'Ventless'],
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
    
    // HVAC
    'air conditioner': ['Portable', 'Window', 'Mini Split', 'Smart', 'Energy Star'],
    'heater': ['Tankless', 'Electric', 'Gas', 'Radiant', 'Smart'],
    'fan': ['Ceiling', 'Exhaust', 'Bathroom', 'Quiet', 'Energy Star'],
  };
  
  const lower = category.toLowerCase();
  return CATEGORY_SEO_KEYWORDS[lower] || [];
}

/**
 * Get the primary category group for title generation
 */
function getCategoryGroup(category: string): string {
  const lower = category.toLowerCase();
  
  if (['refrigerator', 'range', 'oven', 'dishwasher', 'microwave', 'washer', 'dryer', 'freezer', 'cooktop', 'hood'].some(c => lower.includes(c))) {
    return 'appliance';
  }
  
  if (['chandelier', 'pendant', 'sconce', 'flush mount', 'ceiling fan', 'vanity light', 'lantern', 'lamp', 'track', 'recessed'].some(c => lower.includes(c))) {
    return 'lighting';
  }
  
  if (['faucet', 'toilet', 'sink', 'shower', 'bathtub', 'tub', 'valve', 'drain'].some(c => lower.includes(c))) {
    return 'plumbing';
  }
  
  if (['air conditioner', 'heater', 'furnace', 'thermostat', 'ventilation', 'exhaust'].some(c => lower.includes(c))) {
    return 'hvac';
  }
  
  if (['mirror', 'cabinet', 'vanity', 'shelf', 'storage'].some(c => lower.includes(c))) {
    return 'furniture';
  }
  
  return 'general';
}

export default {
  generateSEOTitle,
  detectVariantData,
  getSEOKeywordsForCategory,
  getCategoryGroup
};
