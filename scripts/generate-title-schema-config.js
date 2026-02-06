#!/usr/bin/env node
/**
 * Generate TypeScript config from Product_Title_Schema_by_Category_REVISED.json
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../audit-results/Product_Title_Schema_by_Category_REVISED.json');
const outputPath = path.join(__dirname, '../src/config/title-schema-by-category.ts');

const json = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// Generate TypeScript
let ts = `/**
 * PRODUCT TITLE SCHEMA BY CATEGORY
 * =================================
 * Auto-generated from Product_Title_Schema_by_Category_REVISED.json
 * Generated: ${new Date().toISOString()}
 * 
 * Formula: BRAND + PRIMARY_SPEC + CONFIG/TYPE + INSTALL + CATEGORY + FINISH + (FEATURES)
 * 
 * Rules:
 * 1. Brand Always First - highest-value keyword for branded search
 * 2. Primary Spec Second - varies by category (Cu.Ft., Width, BTU, etc.)
 * 3. Configuration/Type Third - French Door, Gas, Pull-Down, etc.
 * 4. Installation Type Fourth - Built-In, Freestanding, Wall-Mount
 * 5. Category Name Fifth - exact category for Google Shopping taxonomy
 * 6. Finish/Color Sixth - most specific term (Brushed Nickel, Stainless Steel)
 * 7. Features Last (Parenthetical) - max 2-3 high-value features
 * 
 * Max title length: 60-80 chars target, 150 max
 */

export interface TitleSlot {
  position: number;
  attribute: string;
  required: boolean;
}

export interface CategoryTitleSchema {
  categoryId: string;
  categoryName: string;
  department: string;
  family: string;
  slots: TitleSlot[];
  template: string;
  exampleTitle: string;
  seoNotes: string;
}

/**
 * Attribute whitelist - only these attributes can appear in titles
 */
export const TITLE_ATTRIBUTE_WHITELIST: string[] = ${JSON.stringify(json.attribute_whitelist, null, 2)};

/**
 * Formatting rules for different spec types
 */
export const FORMATTING_RULES = {
  // Dimensions: Always use 'X-Inch' format with hyphen
  dimension: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)}-Inch\`;
  },
  
  // Capacity: Use 'XX Cu. Ft.' with period after Cu
  capacity: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    // Round to 1 decimal if needed, otherwise whole number
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
    return \`\${formatted} Cu. Ft.\`;
  },
  
  // BTU: Use comma separator
  btu: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${num.toLocaleString()} BTU\`;
  },
  
  // GPM: Decimal format
  gpm: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${num.toFixed(1)} GPM\`;
  },
  
  // CFM: Plain number with unit
  cfm: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)} CFM\`;
  },
  
  // dBA: Plain number with unit
  dba: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)} dBA\`;
  },
  
  // Wattage: Use 'W' abbreviation
  wattage: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)}W\`;
  },
  
  // kW: Decimal format
  kw: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${num} kW\`;
  },
  
  // MERV: Use 'MERV XX' format
  merv: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`MERV \${Math.round(num)}\`;
  },
  
  // Feet: Use 'X-Foot' for track/barn door
  feet: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)}-Foot\`;
  },
  
  // Light count: X-Light format
  lightCount: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)}-Light\`;
  },
  
  // Horsepower: X HP format
  horsepower: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    // Show decimal if not whole number
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
    return \`\${formatted} HP\`;
  },
  
  // Production lbs/day
  production: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)} lbs/Day\`;
  },
  
  // Dimensions W×H format
  dimensionsWxH: (width: number | string, height: number | string): string => {
    const w = typeof width === 'string' ? parseFloat(width) : width;
    const h = typeof height === 'string' ? parseFloat(height) : height;
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return '';
    return \`\${Math.round(w)}×\${Math.round(h)}-Inch\`;
  },
  
  // Tile size format
  tileSize: (value: string): string => {
    if (!value) return '';
    // Already formatted like "3×6-Inch" or "12×12"
    if (value.includes('×') || value.includes('x')) {
      return value.replace(/x/gi, '×').replace(/inch(es)?/gi, '').trim() + '-Inch';
    }
    return value;
  }
};

/**
 * Map attribute names to their formatters
 */
export const ATTRIBUTE_FORMATTERS: Record<string, keyof typeof FORMATTING_RULES | null> = {
  'Width (Inches)': 'dimension',
  'Width (Inches)*': 'dimension',
  'Height (Inches)': 'dimension',
  'Length (Inches)': 'dimension',
  'Diameter (Inches)': 'dimension',
  'Aperture (Inches)': 'dimension',
  'Size (Inches)': 'dimension',
  'Blade Span (Inches)': 'dimension',
  'Width/Length': 'dimension',
  'Capacity (Cu. Ft.)': 'capacity',
  'BTU': 'btu',
  'BTU/Watts': 'btu',
  'Tonnage/BTU': 'btu',
  'GPM/BTU': 'gpm',
  'CFM': 'cfm',
  'dBA Level': 'dba',
  'Wattage': 'wattage',
  'Power (kW)': 'kw',
  'MERV Rating': 'merv',
  'Length (Feet)': 'feet',
  'Track Length (Feet)': 'feet',
  'Light Count': 'lightCount',
  'Horsepower': 'horsepower',
  'Production (lbs/day)': 'production',
  'Dimensions (W×H)': null, // Special handling
  'Tile Size': null, // Special handling
};

`;

// Generate category schemas
ts += `/**
 * Title schemas by category
 * Key: category name (lowercase, trimmed) - for duplicates, we use categoryId
 * Also indexed by category_id for direct lookup
 */
export const CATEGORY_TITLE_SCHEMAS: Record<string, CategoryTitleSchema> = {\n`;

const seenKeys = new Set();

for (const cat of json.categories) {
  if (!cat.title_schema || !cat.title_schema.slots) continue;
  
  let key = cat.category_name.toLowerCase().trim();
  // Handle duplicates by appending department
  if (seenKeys.has(key)) {
    key = `${key} (${cat.department.toLowerCase()})`;
  }
  seenKeys.add(key);
  
  const schema = {
    categoryId: cat.category_id,
    categoryName: cat.category_name,
    department: cat.department,
    family: cat.family,
    slots: cat.title_schema.slots.map(s => ({
      position: s.position,
      attribute: s.attribute,
      required: s.required
    })),
    template: cat.title_schema.template || '',
    exampleTitle: cat.title_schema.example_title || '',
    seoNotes: cat.title_schema.seo_notes || ''
  };
  
  ts += `  '${key}': ${JSON.stringify(schema, null, 4).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')},\n`;
}

// Add category ID to name mapping
ts += `};

/**
 * Mapping from category_id to lookup key
 */
export const CATEGORY_ID_TO_KEY: Record<string, string> = {\n`;

seenKeys.clear();
for (const cat of json.categories) {
  if (!cat.title_schema || !cat.title_schema.slots) continue;
  
  let key = cat.category_name.toLowerCase().trim();
  if (seenKeys.has(key)) {
    key = `${key} (${cat.department.toLowerCase()})`;
  }
  seenKeys.add(key);
  
  ts += `  '${cat.category_id}': '${key}',\n`;
}

ts += `};

/**
 * Get title schema for a category (by name or ID)
 * Returns schema if found, null otherwise
 */
export function getCategoryTitleSchema(categoryNameOrId: string): CategoryTitleSchema | null {
  let key = categoryNameOrId.toLowerCase().trim();
  
  // Check if it's a Salesforce ID
  if (categoryNameOrId.startsWith('a01')) {
    const mappedKey = CATEGORY_ID_TO_KEY[categoryNameOrId];
    if (mappedKey) {
      key = mappedKey;
    }
  }
  
  return CATEGORY_TITLE_SCHEMAS[key] || null;
}

/**
 * Get all category names that have title schemas
 */
export function getAllSchemaCategoryNames(): string[] {
  return Object.values(CATEGORY_TITLE_SCHEMAS).map(s => s.categoryName);
}

/**
 * Check if an attribute is in the whitelist
 */
export function isWhitelistedAttribute(attribute: string): boolean {
  return TITLE_ATTRIBUTE_WHITELIST.includes(attribute);
}

export default {
  CATEGORY_TITLE_SCHEMAS,
  TITLE_ATTRIBUTE_WHITELIST,
  FORMATTING_RULES,
  ATTRIBUTE_FORMATTERS,
  getCategoryTitleSchema,
  getAllSchemaCategoryNames,
  isWhitelistedAttribute
};
`;

// Write the file
fs.writeFileSync(outputPath, ts);
console.log(`Generated ${outputPath}`);
console.log(`Total categories: ${Object.keys(json.categories).length}`);
console.log(`Categories with schemas: ${json.categories.filter(c => c.title_schema && c.title_schema.slots).length}`);
