/**
 * PRODUCT TITLE SCHEMA BY CATEGORY
 * =================================
 * Auto-generated from Product_Title_Schema_by_Category_REVISED.json
 * Generated: 2026-02-06T19:06:01.398Z
 * 
 * Formula: BRAND + SPEC + TYPE + CATEGORY + FINISH - MODEL
 * 
 * Rules:
 * 1. Brand Always First - highest-value keyword for branded search
 * 2. Primary Spec Second - varies by category (Cu.Ft., Width, BTU, etc.)
 * 3. Configuration/Type Third - French Door, Gas, Pull-Down, etc.
 * 4. Installation Type Fourth - Built-In, Freestanding, Wall-Mount
 * 5. Category Name Fifth - exact category for Google Shopping taxonomy
 * 6. Finish/Color Sixth - most specific term (Brushed Nickel, Stainless Steel)
 * 7. Model Number Last - appended after dash
 * 
 * Max title length: 60-80 chars target, 150 max
 * NO FEATURES in parentheses - features removed for cleaner SEO titles
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
export const TITLE_ATTRIBUTE_WHITELIST: string[] = [
  "AC Rating",
  "Aperture (Inches)",
  "Application",
  "BTU",
  "BTU/Watts",
  "Blade Span (Inches)",
  "Bowl Config",
  "Bowl Shape",
  "Brand",
  "Bulb Type",
  "CFM",
  "Capacity (Cu. Ft.)",
  "Capacity (Gallons)",
  "Capacity (Pints)",
  "Capacity/Size",
  "Category",
  "Collection",
  "Collection/Style",
  "Color",
  "Color Temp",
  "Color/Finish",
  "Color/Pattern",
  "Compatibility",
  "Configuration",
  "Connection Size",
  "Construction",
  "Diameter (Inches)",
  "Diameter/Width",
  "Dimensions",
  "Dimensions (W×H)",
  "Feed Type",
  "Filtration Level",
  "Finish",
  "Finish/Color",
  "Flush Type",
  "Fuel Type",
  "Function",
  "GPM/BTU",
  "Glazing",
  "Grade",
  "Height (Inches)",
  "Hole Config",
  "Horsepower",
  "Included Items",
  "Installation Type",
  "Length (Feet)",
  "Length (Inches)",
  "Light Count",
  "MERV Rating",
  "Material",
  "Mount",
  "Mount Type",
  "Piece Count",
  "Plank Width (Inches)",
  "Power (kW)",
  "Production (lbs/day)",
  "Shape",
  "Size",
  "Size (Inches)",
  "Size (L×W×D)",
  "Size (W×L)",
  "Size/Volume",
  "Species/Look",
  "Style",
  "Tile Size",
  "Tonnage/BTU",
  "Top Material",
  "Track Length (Feet)",
  "Type",
  "Type/Size",
  "Wattage",
  "Wattage Equivalent",
  "Wear Layer (mil)",
  "Width (Inches)",
  "Width (Inches)*",
  "Width/Length",
  "Width×Height",
  "Zone Config",
  "dBA Level"
];

/**
 * Formatting rules for different spec types
 */
export const FORMATTING_RULES = {
  // Dimensions: Always use 'X-Inch' format with hyphen
  dimension: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)}-Inch`;
  },
  
  // Capacity: Use 'XX Cu. Ft.' with period after Cu
  capacity: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    // Round to 1 decimal if needed, otherwise whole number
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
    return `${formatted} Cu. Ft.`;
  },
  
  // BTU: Use comma separator
  btu: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${num.toLocaleString()} BTU`;
  },
  
  // GPM: Decimal format
  gpm: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${num.toFixed(1)} GPM`;
  },
  
  // CFM: Plain number with unit
  cfm: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)} CFM`;
  },
  
  // dBA: Plain number with unit
  dba: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)} dBA`;
  },
  
  // Wattage: Use 'W' abbreviation
  wattage: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)}W`;
  },
  
  // kW: Decimal format
  kw: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${num} kW`;
  },
  
  // MERV: Use 'MERV XX' format
  merv: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `MERV ${Math.round(num)}`;
  },
  
  // Feet: Use 'X-Foot' for track/barn door
  feet: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)}-Foot`;
  },
  
  // Light count: X-Light format
  lightCount: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)}-Light`;
  },
  
  // Horsepower: X HP format
  horsepower: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    // Show decimal if not whole number
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
    return `${formatted} HP`;
  },
  
  // Production lbs/day
  production: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)} lbs/Day`;
  },
  
  // Dimensions W×H format
  dimensionsWxH: (width: number | string, height: number | string): string => {
    const w = typeof width === 'string' ? parseFloat(width) : width;
    const h = typeof height === 'string' ? parseFloat(height) : height;
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return '';
    return `${Math.round(w)}×${Math.round(h)}-Inch`;
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

/**
 * Title schemas by category
 * Key: category name (lowercase, trimmed) - for duplicates, we use categoryId
 * Also indexed by category_id for direct lookup
 */
export const CATEGORY_TITLE_SCHEMAS: Record<string, CategoryTitleSchema> = {
  'refrigerator': {
      "categoryId": "a01Hu000010Q5EpIAK",
      "categoryName": "Refrigerator",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Cu. Ft.)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Configuration",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Installation Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Cu. Ft.)} {Configuration} {Installation Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Samsung 28 Cu. Ft. French Door Counter-Depth Refrigerator Stainless Steel ",
      "seoNotes": "Lead with capacity — shoppers search by Cu. Ft. Width is secondary. Configuration = door style."
  },
  'freezer': {
      "categoryId": "a01Hu000010Q5EkIAK",
      "categoryName": "Freezer",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Cu. Ft.)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Configuration",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Cu. Ft.)} {Configuration} {Category} {Finish} - {Model Number}",
      "exampleTitle": "GE 21 Cu. Ft. Upright Freezer White ",
      "seoNotes": "Configuration = Upright, Chest, Column. Capacity is the key differentiator."
  },
  'range': {
      "categoryId": "a01Hu000010Q5EnIAK",
      "categoryName": "Range",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Installation Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Fuel Type} {Installation Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Wolf 48-Inch Dual Fuel Slide-In Range Stainless Steel ",
      "seoNotes": "Width + Fuel Type are the top 2 search modifiers. Burner count is high-value feature."
  },
  'oven': {
      "categoryId": "a01Hu000010Q5EmIAK",
      "categoryName": "Oven",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Configuration",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Installation Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Configuration} {Installation Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Bosch 30-Inch Double Wall Built-In Oven Stainless Steel ",
      "seoNotes": "Configuration = Single, Double, Combo. Installation = Wall, Built-In. Always include both."
  },
  'cooktop': {
      "categoryId": "a01Hu000010Q5EhIAK",
      "categoryName": "Cooktop",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Installation Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Fuel Type} {Installation Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Thermador 36-Inch Gas Built-In Cooktop Stainless Steel ",
      "seoNotes": "Width + Fuel Type are essential. Burner count is key feature for gas cooktops."
  },
  'microwave': {
      "categoryId": "a01Hu000010Q5ElIAK",
      "categoryName": "Microwave",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Cu. Ft.)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Cu. Ft.)} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "KitchenAid 2.0 Cu. Ft. Over-the-Range Microwave Stainless Steel ",
      "seoNotes": "Type = Over-the-Range, Countertop, Built-In, Drawer. Capacity in Cu. Ft., not watts."
  },
  'dishwasher': {
      "categoryId": "a01Hu000010Q5EiIAK",
      "categoryName": "Dishwasher",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)*",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "dBA Level",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)*} {Type} {Category} {Finish} {dBA Level} - {Model Number}",
      "exampleTitle": "Miele 24-Inch Built-In Dishwasher Stainless Steel 44 dBA ",
      "seoNotes": "*Only include width if non-standard (18\"). dBA is a top search qualifier for dishwashers."
  },
  'range hood': {
      "categoryId": "a01Hu000010Q5EoIAK",
      "categoryName": "Range Hood",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "CFM",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Type} {Category} {Finish} {CFM} - {Model Number}",
      "exampleTitle": "Zephyr 36-Inch Wall Mount Range Hood Stainless Steel 600 CFM ",
      "seoNotes": "Type = Under-Cabinet, Wall Mount, Island, Insert, Downdraft. CFM is key spec."
  },
  'icemaker': {
      "categoryId": "a01Hu000011kFRfIAM",
      "categoryName": "Icemaker",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Production (lbs/day)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Production (lbs/day)} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Scotsman 80 lbs/Day Undercounter Icemaker Stainless Steel ",
      "seoNotes": "Type = Undercounter, Freestanding, Portable, Built-In. Daily production is the key spec."
  },
  'barbeques': {
      "categoryId": "a01Hu000011kgEqIAI",
      "categoryName": "Barbeques",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Fuel Type} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Weber 36-Inch Gas Built-In Grill Stainless Steel ",
      "seoNotes": "Type = Built-In, Freestanding, Portable, Cart. Width + Fuel + Type all matter for grills."
  },
  'coffee maker': {
      "categoryId": "a01Hu000011kmDGIAY",
      "categoryName": "Coffee Maker",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Miele Built-In Coffee Maker Stainless Steel ",
      "seoNotes": "Type = Built-In, Countertop, Espresso Machine. No size needed unless built-in."
  },
  'pizza oven': {
      "categoryId": "a01aZ00000KJFrCQAX",
      "categoryName": "Pizza Oven",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Fuel Type} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Ooni Gas Countertop Pizza Oven Stainless Steel ",
      "seoNotes": "Type = Countertop, Built-In, Outdoor. Fuel Type = Gas, Wood, Multi-Fuel."
  },
  'kitchen appliances': {
      "categoryId": "a01Hu000010Q5EcIAK",
      "categoryName": "Kitchen Appliances",
      "department": "Appliances",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type/Size",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type/Size} {Category} {Finish} - {Model Number}",
      "exampleTitle": "KitchenAid Countertop Kitchen Appliance Stainless Steel",
      "seoNotes": "Generic parent category. Use the most specific subcategory when possible."
  },
  'washer': {
      "categoryId": "a01Hu000010Q5EsIAK",
      "categoryName": "Washer",
      "department": "Appliances",
      "family": "Laundry",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Cu. Ft.)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Configuration",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Cu. Ft.)} {Configuration} {Category} {Finish} - {Model Number}",
      "exampleTitle": "LG 5.0 Cu. Ft. Front Load Washer White ",
      "seoNotes": "Configuration = Front Load, Top Load. Capacity is the #1 search term for washers."
  },
  'dryer': {
      "categoryId": "a01Hu000010Q5EjIAK",
      "categoryName": "Dryer",
      "department": "Appliances",
      "family": "Laundry",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Cu. Ft.)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Configuration",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Cu. Ft.)} {Fuel Type} {Configuration} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Samsung 7.5 Cu. Ft. Electric Front Load Dryer Platinum ",
      "seoNotes": "Fuel Type = Electric, Gas. Always include — it's a critical purchase filter."
  },
  'all in one washer / dryer': {
      "categoryId": "a01Hu000010Q5EqIAK",
      "categoryName": "All in One Washer / Dryer",
      "department": "Appliances",
      "family": "Laundry",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Cu. Ft.)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Configuration",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Cu. Ft.)} {Configuration} {Category} {Finish} - {Model Number}",
      "exampleTitle": "LG 4.5 Cu. Ft. Front Load All-in-One Washer/Dryer White ",
      "seoNotes": "Ventless/Vented is a key feature. Capacity matters for combo unit shoppers."
  },
  'standalone pedestal': {
      "categoryId": "a01Hu000010Q5ErIAK",
      "categoryName": "Standalone Pedestal",
      "department": "Appliances",
      "family": "Laundry",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Compatibility",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Category} {Finish} {Compatibility} - {Model Number}",
      "exampleTitle": "Samsung 27-Inch Laundry Pedestal Platinum ",
      "seoNotes": "Width must match washer/dryer. Compatibility is a key purchase factor."
  },
  'laundry appliances': {
      "categoryId": "a01Hu000010Q5EdIAK",
      "categoryName": "Laundry Appliances",
      "department": "Appliances",
      "family": "Laundry",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "LG Front Load Laundry Appliance White",
      "seoNotes": "Generic parent. Use Washer, Dryer, or All-in-One subcategories when possible."
  },
  'bathroom faucets': {
      "categoryId": "a01aZ00000dC5DeQAK",
      "categoryName": "Bathroom Faucets",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Collection/Style",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Hole Config",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Collection/Style} {Type} {Hole Config} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Delta Trinsic Single-Handle Widespread 3-Hole Bathroom Faucet Matte Black ",
      "seoNotes": "Type = Single-Handle, Widespread, Centerset, Wall-Mount, Vessel. Hole config is essential."
  },
  'kitchen faucets': {
      "categoryId": "a01aZ00000dC5E9QAK",
      "categoryName": "Kitchen Faucets",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Collection/Style",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Collection/Style} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Moen Arbor Pull-Down Kitchen Faucet Spot Resist Stainless ",
      "seoNotes": "Type = Pull-Down, Pull-Out, Bridge, Wall-Mount, Bar/Prep, Pot Filler."
  },
  'kitchen sinks': {
      "categoryId": "a01aZ00000dC5EDQA0",
      "categoryName": "Kitchen Sinks",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Mount Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Bowl Config",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Finish",
              "required": false
          },
          {
              "position": 8,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Material} {Mount Type} {Bowl Config} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kraus 33-Inch Stainless Steel Undermount Double Bowl Kitchen Sink Satin",
      "seoNotes": "Mount Type = Undermount, Drop-In, Farmhouse/Apron. Bowl = Single, Double, 60/40."
  },
  'bar & prep sinks': {
      "categoryId": "a01aZ00000dC5E2QAK",
      "categoryName": "Bar & Prep Sinks",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Mount Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Material} {Mount Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Blanco 18-Inch Stainless Steel Undermount Bar & Prep Sink Satin",
      "seoNotes": "Smaller than kitchen sinks. Same mount types apply."
  },
  'bathroom sinks': {
      "categoryId": "a01aZ00000dC5DiQAK",
      "categoryName": "Bathroom Sinks",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Type} {Material} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kohler 24-Inch Vessel Vitreous China Bathroom Sink White",
      "seoNotes": "Type = Vessel, Undermount, Drop-In, Pedestal, Wall-Mount, Console."
  },
  'bathroom vanities': {
      "categoryId": "a01aZ00000dC5DjQAK",
      "categoryName": "Bathroom Vanities",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Top Material",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Type} {Category} {Finish} {Top Material} - {Model Number}",
      "exampleTitle": "James Martin 60-Inch Freestanding Bathroom Vanity Espresso ",
      "seoNotes": "Width is the #1 filter. Type = Freestanding, Wall-Mount, Floating. Top material is high-value."
  },
  'medicine cabinets': {
      "categoryId": "a01aZ00000dC5DqQAK",
      "categoryName": "Medicine Cabinets",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Mount Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Mount Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Robern 30-Inch Recessed Medicine Cabinet Mirrored ",
      "seoNotes": "Mount Type = Recessed, Surface-Mount. LED and defogger are premium features."
  },
  'toilets': {
      "categoryId": "a01aZ00000dC5DyQAK",
      "categoryName": "Toilets",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Bowl Shape",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Flush Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Bowl Shape} {Flush Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "TOTO Elongated One-Piece Dual Flush Toilet Cotton White ",
      "seoNotes": "Type = One-Piece, Two-Piece, Wall-Hung. Bowl = Elongated, Round. GPF is key spec."
  },
  'toilet seats': {
      "categoryId": "a01aZ00000dC5DxQAK",
      "categoryName": "Toilet Seats",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Shape",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Shape} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "TOTO Elongated SoftClose Toilet Seat Cotton White ",
      "seoNotes": "Shape = Elongated, Round. Type = Standard, Slow-Close, Heated, Bidet."
  },
  'bidets': {
      "categoryId": "a01aZ00000dC5DoQAK",
      "categoryName": "Bidets",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "TOTO Floor-Mount Bidet Cotton White ",
      "seoNotes": "Type = Floor-Mount, Wall-Hung. Simpler title structure than electronic bidets."
  },
  'bidet seats': {
      "categoryId": "a01aZ00000dC5DnQAK",
      "categoryName": "Bidet Seats",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Shape",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Shape} {Category} {Finish} - {Model Number}",
      "exampleTitle": "TOTO Elongated Bidet Seat Cotton White ",
      "seoNotes": "Shape must match toilet. Features are the key differentiator for electronic seats."
  },
  'urinals': {
      "categoryId": "a01aZ00000dC5E0QAK",
      "categoryName": "Urinals",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Flush Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Flush Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kohler Wall-Mount Waterless Urinal White ",
      "seoNotes": "Type = Wall-Mount. Flush = Waterless, Manual, Touchless."
  },
  'bathtubs': {
      "categoryId": "a01aZ00000dC5DlQAK",
      "categoryName": "Bathtubs",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Length (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Length (Inches)} {Type} {Material} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kohler 60-Inch Freestanding Acrylic Bathtub White ",
      "seoNotes": "Type = Freestanding, Alcove, Drop-In, Corner, Walk-In. Length is primary dimension."
  },
  'showers': {
      "categoryId": "a01aZ00000dC5DuQAK",
      "categoryName": "Showers",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Hansgrohe Raindance Shower System Chrome ",
      "seoNotes": "Type = Shower System, Shower Head, Shower Panel, Hand Shower, Shower Column."
  },
  'steam showers': {
      "categoryId": "a01aZ00000dC5DvQAK",
      "categoryName": "Steam Showers",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Power (kW)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Power (kW)} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Mr. Steam 12 kW Steam Shower Generator Chrome ",
      "seoNotes": "Power (kW) is the primary sizing spec. Features drive purchase decisions."
  },
  'rough-in valves': {
      "categoryId": "a01aZ00000dC5DrQAK",
      "categoryName": "Rough-In Valves",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Connection Size",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Connection Size} {Category} {Material} - {Model Number}",
      "exampleTitle": "Moen M-CORE 1/2-Inch Rough-In Valve Brass",
      "seoNotes": "Type = Pressure Balance, Thermostatic, Diverter. Connection size in inches."
  },
  'bath fans': {
      "categoryId": "a01aZ00000dC5DcQAK",
      "categoryName": "Bath Fans",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "CFM",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {CFM} {Type} {Category} - {Model Number}",
      "exampleTitle": "Panasonic 110 CFM Ceiling Mount Bath Fan ",
      "seoNotes": "CFM is the #1 spec. Type = Ceiling, Wall. Sones/noise level is key feature."
  },
  'bathroom hardware and accessories': {
      "categoryId": "a01aZ00000dC5DfQAK",
      "categoryName": "Bathroom Hardware and Accessories",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Collection",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Collection} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Moen Align Towel Bar Bathroom Accessory Matte Black",
      "seoNotes": "Type = Towel Bar, Towel Ring, Robe Hook, TP Holder, Shelf. Collection name aids search."
  },
  'bathroom cabinet hardware': {
      "categoryId": "a01aZ00000dC5DdQAK",
      "categoryName": "Bathroom Cabinet Hardware",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (Inches)} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Amerock 5-Inch Bar Pull Bathroom Cabinet Hardware Brushed Nickel",
      "seoNotes": "Type = Pull, Knob, Handle, Bar Pull. Center-to-center measurement is standard."
  },
  'bathroom lighting': {
      "categoryId": "a01aZ00000dC5DgQAK",
      "categoryName": "Bathroom Lighting",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width/Length",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Light Count",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width/Length} {Light Count} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kichler 24-Inch 3-Light Vanity Bathroom Lighting Brushed Nickel",
      "seoNotes": "Type = Vanity Bar, Sconce, Flush Mount. Light count and width both matter."
  },
  'bathroom mirrors': {
      "categoryId": "a01aZ00000dC5DhQAK",
      "categoryName": "Bathroom Mirrors",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Dimensions (W×H)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Dimensions (W×H)} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kohler 24×36-Inch Framed Bathroom Mirror Brushed Nickel ",
      "seoNotes": "Dimensions in W×H format. Type = Framed, Frameless, LED, Pivot, Tilt."
  },
  'garbage disposals': {
      "categoryId": "a01aZ00000dC5E6QAK",
      "categoryName": "Garbage Disposals",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Horsepower",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Feed Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Horsepower} {Category} {Feed Type} - {Model Number}",
      "exampleTitle": "InSinkErator 1 HP Garbage Disposal Continuous Feed ",
      "seoNotes": "HP is the key spec. Feed Type = Continuous, Batch."
  },
  'hot & cold water dispensers': {
      "categoryId": "a01aZ00000dC5E7QAK",
      "categoryName": "Hot & Cold Water Dispensers",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "InSinkErator Instant Hot Water Dispenser Chrome ",
      "seoNotes": "Type = Instant Hot, Filtered, Chilled, Combo."
  },
  'water filtration': {
      "categoryId": "a01aZ00000dC5EJQA0",
      "categoryName": "Water Filtration",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Filtration Level",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Filtration Level} - {Model Number}",
      "exampleTitle": "APEC Under-Sink Water Filtration System 5-Stage ",
      "seoNotes": "Type = Under-Sink, Whole-House, Countertop, Faucet-Mount."
  },
  'tankless water heaters': {
      "categoryId": "a01aZ00000dC5DwQAK",
      "categoryName": "Tankless Water Heaters",
      "department": "Plumbing & Bath",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "GPM/BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {GPM/BTU} {Fuel Type} {Type} {Category} - {Model Number}",
      "exampleTitle": "Rinnai 9.8 GPM Gas Indoor Tankless Water Heater ",
      "seoNotes": "GPM for gas, kW for electric. Type = Indoor, Outdoor. Fuel Type critical."
  },
  'cabinet hardware': {
      "categoryId": "a01aZ00000dC5E4QAK",
      "categoryName": "Cabinet Hardware",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (Inches)} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Top Knobs 6-Inch Bar Pull Cabinet Hardware Polished Nickel",
      "seoNotes": "Type = Pull, Knob, Handle, Bar Pull. Size = center-to-center."
  },
  'backsplash kitchen tile': {
      "categoryId": "a01aZ00000dC5E1QAK",
      "categoryName": "Backsplash Kitchen Tile",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Tile Size",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Tile Size} {Material} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "MSI 3×6-Inch Subway Glass Backsplash Kitchen Tile White",
      "seoNotes": "Material = Ceramic, Porcelain, Glass, Natural Stone, Mosaic."
  },
  'kitchen tile': {
      "categoryId": "a01aZ00000dC5EFQA0",
      "categoryName": "Kitchen Tile",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Tile Size",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Tile Size} {Material} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "Daltile 12×12-Inch Porcelain Kitchen Tile Gray",
      "seoNotes": "Similar to backsplash tile. Size and material are top search terms."
  },
  'kitchen accessories': {
      "categoryId": "a01aZ00000dC5E8QAK",
      "categoryName": "Kitchen Accessories",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Franke Soap Dispenser Kitchen Accessory Stainless Steel",
      "seoNotes": "Type = Soap Dispenser, Cutting Board, Drying Rack, Drain. Simpler title."
  },
  'kitchen furniture and decor': {
      "categoryId": "a01aZ00000dC5EAQA0",
      "categoryName": "Kitchen Furniture and Decor",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish/Color",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Style} {Category} {Finish/Color} - {Model Number}",
      "exampleTitle": "Winsome Wood Transitional Kitchen Cart Natural",
      "seoNotes": "Type = Cart, Island, Shelf, Rack. Style = Modern, Transitional, Traditional."
  },
  'kitchen storage & organization': {
      "categoryId": "a01aZ00000dC5EEQA0",
      "categoryName": "Kitchen Storage & Organization",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Size} {Category} {Material} - {Model Number}",
      "exampleTitle": "Rev-A-Shelf Pull-Out 21-Inch Kitchen Storage & Organization Wood",
      "seoNotes": "Type = Pull-Out, Lazy Susan, Drawer Insert, Shelf."
  },
  'luxury kitchen': {
      "categoryId": "a01aZ00000dC5EGQA0",
      "categoryName": "Luxury Kitchen",
      "department": "Plumbing & Bath",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Sub-Zero Integrated Luxury Kitchen Refrigerator Panel Ready",
      "seoNotes": "Premium/luxury parent category. Should use specific subcategory titles when possible."
  },
  'chandeliers': {
      "categoryId": "a01aZ00000dC5ELQA0",
      "categoryName": "Chandeliers",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Diameter (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Light Count",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Diameter (Inches)} {Light Count} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Visual Comfort 36-Inch 12-Light Transitional Chandelier Antique Brass",
      "seoNotes": "Diameter + light count are the top filters. Style = Modern, Traditional, Transitional."
  },
  'ceiling lights': {
      "categoryId": "a01aZ00000dC5EKQA0",
      "categoryName": "Ceiling Lights",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Diameter (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Diameter (Inches)} {Type} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Hinkley 14-Inch Semi-Flush Mount Modern Ceiling Light Brushed Nickel",
      "seoNotes": "Type = Flush Mount, Semi-Flush. Style is the key differentiator."
  },
  'pendants': {
      "categoryId": "a01aZ00000dC5EXQA0",
      "categoryName": "Pendants",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Diameter (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Diameter (Inches)} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Rejuvenation 12-Inch Industrial Pendant Light Matte Black ",
      "seoNotes": "Single pendants. Diameter + style drive search. Mini-pendants are a common subtype."
  },
  'island lighting': {
      "categoryId": "a01aZ00000dC5EOQA0",
      "categoryName": "Island Lighting",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Light Count",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Light Count} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kichler 42-Inch 5-Light Linear Island Lighting Bronze",
      "seoNotes": "Width/length of fixture is key (must fit island). Multi-light or linear are common types."
  },
  'wall sconces': {
      "categoryId": "a01aZ00000dC5EeQAK",
      "categoryName": "Wall Sconces",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Style} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Hudson Valley Modern Swing-Arm Wall Sconce Polished Nickel",
      "seoNotes": "Type = Fixed, Swing-Arm, Up/Down. Simpler title — style + type are key."
  },
  'vanity lighting': {
      "categoryId": "a01aZ00000dC5EdQAK",
      "categoryName": "Vanity Lighting",
      "department": "Lighting & Electrical",
      "family": "Bath",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Light Count",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Light Count} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kichler 24-Inch 3-Light Vanity Lighting Brushed Nickel ",
      "seoNotes": "Width must match vanity/mirror. Light count is a top filter."
  },
  'recessed lighting': {
      "categoryId": "a01aZ00000dC5EZQA0",
      "categoryName": "Recessed Lighting",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Aperture (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Aperture (Inches)} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "WAC Lighting 4-Inch New Construction Recessed Lighting White ",
      "seoNotes": "Aperture size (4\", 5\", 6\") is the #1 search term. Type = New Construction, Remodel, Trim."
  },
  'under cabinet lights': {
      "categoryId": "a01aZ00000dC5EcQAK",
      "categoryName": "Under Cabinet Lights",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Length (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color Temp",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Length (Inches)} {Type} {Category} {Color Temp} - {Model Number}",
      "exampleTitle": "WAC Lighting 24-Inch LED Under Cabinet Light 3000K ",
      "seoNotes": "Type = LED Bar, Puck, Tape/Strip. Length and color temp are key specs."
  },
  'track and rail lighting': {
      "categoryId": "a01aZ00000dC5EbQAK",
      "categoryName": "Track and Rail Lighting",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Length (Feet)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Light Count",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Length (Feet)} {Type} {Light Count} {Category} {Finish} - {Model Number}",
      "exampleTitle": "WAC Lighting 8-Foot Monorail 4-Light Track and Rail Lighting Brushed Nickel",
      "seoNotes": "Type = Track, Monorail, Cable. Length and number of heads matter."
  },
  'led lighting': {
      "categoryId": "a01aZ00000dC5ERQA0",
      "categoryName": "LED Lighting",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color Temp",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Size} {Category} {Color Temp} - {Model Number}",
      "exampleTitle": "Philips Hue LED Strip 80-Inch LED Lighting 2700K ",
      "seoNotes": "Broad category — Type = Strip, Panel, Bulb, Downlight. Smart features are key."
  },
  'kitchen lighting': {
      "categoryId": "a01aZ00000dC5EBQA0",
      "categoryName": "Kitchen Lighting",
      "department": "Lighting & Electrical",
      "family": "Kitchen",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Progress Lighting Flush Mount Modern Kitchen Lighting Brushed Nickel",
      "seoNotes": "Use specific subcategory (Pendant, Island, Under Cabinet) when possible."
  },
  'outdoor lighting': {
      "categoryId": "a01aZ00000dC5EWQA0",
      "categoryName": "Outdoor Lighting",
      "department": "Lighting & Electrical",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Hinkley Wall Lantern Traditional Outdoor Lighting Bronze ",
      "seoNotes": "Type = Wall Lantern, Path Light, Flood, Post. Dark Sky and LED are premium features."
  },
  'landscape lighting': {
      "categoryId": "a01aZ00000dC5EQQA0",
      "categoryName": "Landscape Lighting",
      "department": "Lighting & Electrical",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kichler LED Path Light Landscape Lighting Bronze ",
      "seoNotes": "Type = Path, Spot, Well, Step, Deck. Low voltage vs line voltage is key."
  },
  'post lights': {
      "categoryId": "a01aZ00000dC5EYQA0",
      "categoryName": "Post Lights",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Height (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Height (Inches)} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Hinkley 22-Inch Traditional Post Light Bronze ",
      "seoNotes": "Height is important for code compliance. Style drives the aesthetic choice."
  },
  'step lighting': {
      "categoryId": "a01aZ00000dC5EaQAK",
      "categoryName": "Step Lighting",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "WAC Lighting LED Recessed Step Lighting Bronze ",
      "seoNotes": "Type = Recessed, Surface. IP rating matters for outdoor use."
  },
  'lamps': {
      "categoryId": "a01aZ00000dC5EPQA0",
      "categoryName": "Lamps",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Height (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Height (Inches)} {Type} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Visual Comfort 28-Inch Table Modern Lamp Antique Brass",
      "seoNotes": "Type = Table, Floor, Desk, Buffet. Height is the key dimension."
  },
  'light bulbs': {
      "categoryId": "a01aZ00000dC5ESQA0",
      "categoryName": "Light Bulbs",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Wattage Equivalent",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Bulb Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Color Temp",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Wattage Equivalent} {Bulb Type} {Color Temp} {Category} - {Model Number}",
      "exampleTitle": "Philips 60W Equivalent A19 3000K Light Bulb",
      "seoNotes": "Bulb Type = A19, BR30, GU10, E12, PAR38. Color Temp in Kelvin. No finish needed."
  },
  'light switches & dimmers': {
      "categoryId": "a01aZ00000dC5ETQA0",
      "categoryName": "Light Switches & Dimmers",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Lutron Caseta Dimmer Switch Light Switch White ",
      "seoNotes": "Type = Dimmer, Toggle, Rocker, Smart Switch. Gang count can be a feature."
  },
  'lighting accessories': {
      "categoryId": "a01aZ00000dC5EVQA0",
      "categoryName": "Lighting Accessories",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Progress Lighting Canopy Kit Lighting Accessory Brushed Nickel",
      "seoNotes": "Type = Canopy, Cord, Chain, Adapter. Simple title structure."
  },
  'commercial lighting': {
      "categoryId": "a01aZ00000dC5EMQA0",
      "categoryName": "Commercial Lighting",
      "department": "Industrial & Commercial",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Wattage",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Wattage} {Category} - {Model Number}",
      "exampleTitle": "Lithonia LED Troffer 40W Commercial Lighting ",
      "seoNotes": "Type = Troffer, High Bay, Panel, Strip. Wattage and certifications matter."
  },
  'ceiling fans': {
      "categoryId": "a01aZ00000dC5EjQAK",
      "categoryName": "Ceiling Fans",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Blade Span (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Blade Span (Inches)} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Hunter 52-Inch Modern Ceiling Fan Matte Black ",
      "seoNotes": "Blade span is the #1 search term. LED light kit and remote are top features."
  },
  'ceiling fan accessories': {
      "categoryId": "a01aZ00000dC5EiQAK",
      "categoryName": "Ceiling Fan Accessories",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Hunter Remote Control Ceiling Fan Accessory White",
      "seoNotes": "Type = Remote, Light Kit, Blades, Downrod. Simple title."
  },
  'wall mounted fans': {
      "categoryId": "a01aZ00000dC5F0QAK",
      "categoryName": "Wall Mounted Fans",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Blade Span (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Blade Span (Inches)} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Matthews 16-Inch Wall Mounted Fan Brushed Nickel ",
      "seoNotes": "Blade span + oscillating are key features."
  },
  'air circulators': {
      "categoryId": "a01aZ00000dC5EfQAK",
      "categoryName": "Air Circulators",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Size} {Category} - {Model Number}",
      "exampleTitle": "Vornado Tower Medium Air Circulator ",
      "seoNotes": "Type = Tower, Pedestal, Personal, Box. Airflow/CFM can be a feature."
  },
  'attic fans': {
      "categoryId": "a01aZ00000dC5EgQAK",
      "categoryName": "Attic Fans",
      "department": "Lighting & Electrical",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "CFM",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {CFM} {Type} {Category} - {Model Number}",
      "exampleTitle": "QuietCool 3013 CFM Solar-Powered Attic Fan ",
      "seoNotes": "CFM is the primary spec. Type = Solar, Electric, Gable, Roof-Mount."
  },
  'air conditioners': {
      "categoryId": "a01aZ00000dCek0QAC",
      "categoryName": "Air Conditioners",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU} {Type} {Category} - {Model Number}",
      "exampleTitle": "Frigidaire 12,000 BTU Window Air Conditioner ",
      "seoNotes": "Type = Window, Portable, Central, Through-Wall. BTU is the #1 search term."
  },
  'mini split air conditioners': {
      "categoryId": "a01aZ00000dCekBQAS",
      "categoryName": "Mini Split Air Conditioners",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Zone Config",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU} {Zone Config} {Type} {Category} - {Model Number}",
      "exampleTitle": "Mitsubishi 24,000 BTU Single Zone Ductless Mini Split Air Conditioner ",
      "seoNotes": "BTU + zone count (single/multi) are the top filters. Heat pump capability is key."
  },
  'dehumidifiers': {
      "categoryId": "a01aZ00000dCek3QAC",
      "categoryName": "Dehumidifiers",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Pints)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Pints)} {Type} {Category} - {Model Number}",
      "exampleTitle": "hOmeLabs 50-Pint Portable Dehumidifier ",
      "seoNotes": "Pint capacity is the sizing standard. Type = Portable, Whole-Home, Crawl Space."
  },
  'water heaters': {
      "categoryId": "a01aZ00000bI2srQAC",
      "categoryName": "Water Heaters",
      "department": "Heating & Cooling",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Gallons)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Gallons)} {Fuel Type} {Type} {Category} - {Model Number}",
      "exampleTitle": "Rheem 50-Gallon Electric Hybrid Water Heater ",
      "seoNotes": "Capacity + Fuel Type are the 2 essential search terms. Type = Tank, Hybrid, Heat Pump."
  },
  'room heater': {
      "categoryId": "a01aZ00000eEFl0QAG",
      "categoryName": "Room Heater",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU/Watts",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU/Watts} {Fuel Type} {Type} {Category} - {Model Number}",
      "exampleTitle": "Dyna-Glo 30,000 BTU Gas Wall-Mount Room Heater ",
      "seoNotes": "Type = Wall-Mount, Portable, Baseboard, Infrared. BTU for gas, Watts for electric."
  },
  'indoor heating': {
      "categoryId": "a01aZ00000dCekAQAS",
      "categoryName": "Indoor Heating",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU/Watts",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU/Watts} {Fuel Type} {Type} {Category} - {Model Number}",
      "exampleTitle": "Cadet 1500W Electric Baseboard Indoor Heating Unit ",
      "seoNotes": "Type = Baseboard, Wall, Cove, Radiant Panel. Similar to Room Heater but broader."
  },
  'stoves and fireplaces': {
      "categoryId": "a01aZ00000dCekFQAS",
      "categoryName": "Stoves and Fireplaces",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Napoleon 50,000 BTU Gas Direct Vent Fireplace Black ",
      "seoNotes": "Type = Insert, Freestanding Stove, Linear, See-Through. BTU + Fuel + Vent type matter."
  },
  'patio heaters': {
      "categoryId": "a01aZ00000dCekCQAS",
      "categoryName": "Patio Heaters",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Bromic 44,000 BTU Gas Freestanding Patio Heater Stainless Steel",
      "seoNotes": "Type = Freestanding, Wall-Mount, Ceiling, Tabletop. BTU + Fuel are key."
  },
  'evaporative coolers': {
      "categoryId": "a01aZ00000dCek5QAC",
      "categoryName": "Evaporative Coolers",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "CFM",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {CFM} {Type} {Category} - {Model Number}",
      "exampleTitle": "Hessaire 3,100 CFM Portable Evaporative Cooler ",
      "seoNotes": "CFM is the primary sizing spec. Type = Portable, Window, Whole-House."
  },
  'thermostats': {
      "categoryId": "a01aZ00000dCekGQAS",
      "categoryName": "Thermostats",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Ecobee Smart Thermostat Premium White ",
      "seoNotes": "Type = Smart, Programmable, Non-Programmable, Line Voltage. Smart features are key."
  },
  'exhaust fans': {
      "categoryId": "a01aZ00000dCek6QAC",
      "categoryName": "Exhaust Fans",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "CFM",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {CFM} {Type} {Category} - {Model Number}",
      "exampleTitle": "Broan 110 CFM Ceiling Exhaust Fan ",
      "seoNotes": "CFM is the sizing spec. Type = Ceiling, Inline, Wall. Sones level is key."
  },
  'stove and chimney pipe': {
      "categoryId": "a01aZ00000dCekEQAS",
      "categoryName": "Stove and Chimney Pipe",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Diameter (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Diameter (Inches)} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "DuraVent 6-Inch Double Wall Stove and Chimney Pipe Stainless Steel",
      "seoNotes": "Diameter + Wall type (Single, Double, Triple) are the key specs."
  },
  'skylights': {
      "categoryId": "a01aZ00000dCekDQAS",
      "categoryName": "Skylights",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (W×L)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Glazing",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (W×L)} {Type} {Category} {Glazing} - {Model Number}",
      "exampleTitle": "VELUX 22×46-Inch Fixed Skylight Low-E Glass ",
      "seoNotes": "Size in W×L. Type = Fixed, Venting, Tubular. Glazing type matters for energy."
  },
  'air filters': {
      "categoryId": "a01aZ00000dCek1QAC",
      "categoryName": "Air Filters",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (L×W×D)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "MERV Rating",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (L×W×D)} {MERV Rating} {Category} {Type} - {Model Number}",
      "exampleTitle": "Honeywell 20×25×4-Inch MERV 11 Air Filter Pleated",
      "seoNotes": "Exact dimensions required — this IS the product identity. MERV rating is key spec."
  },
  'ducting': {
      "categoryId": "a01aZ00000dCek4QAC",
      "categoryName": "Ducting",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Diameter (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Diameter (Inches)} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "DuraVent 6-Inch Flexible Ducting Aluminum",
      "seoNotes": "Type = Flexible, Rigid, Insulated. Diameter is primary spec."
  },
  'commercial hvac': {
      "categoryId": "a01aZ00000dCek2QAC",
      "categoryName": "Commercial HVAC",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Tonnage/BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Tonnage/BTU} {Type} {Category} - {Model Number}",
      "exampleTitle": "Carrier 5-Ton Rooftop Package Commercial HVAC Unit ",
      "seoNotes": "Tonnage for cooling, BTU for heating. Type = Rooftop, Split, AHU, Chiller."
  },
  'heating': {
      "categoryId": "a01aZ00000dCek9QAC",
      "categoryName": "Heating",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} - {Model Number}",
      "exampleTitle": "Rinnai 98,000 BTU Gas Condensing Heating Boiler ",
      "seoNotes": "Generic heating parent. Use specific subcategory (Room Heater, Boiler) when possible."
  },
  'hvac accessories': {
      "categoryId": "a01aZ00000fKN2RQAW",
      "categoryName": "HVAC Accessories",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Size} - {Model Number}",
      "exampleTitle": "Honeywell Humidifier Pad HVAC Accessory 10×13-Inch",
      "seoNotes": "Type = Humidifier Pad, Refrigerant, Line Set, Condensate Pump. Simple title."
  },
  'fire pits': {
      "categoryId": "a01aZ00000dCek7QAC",
      "categoryName": "Fire Pits",
      "department": "Heating & Cooling",
      "family": "HVAC",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Diameter/Width",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Diameter/Width} {Fuel Type} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Solo Stove 27-Inch Wood Portable Fire Pit Stainless Steel ",
      "seoNotes": "Shared with Outdoor. Fuel Type + Type (Portable, Built-In) are key."
  },
  'hardwood flooring': {
      "categoryId": "a01aZ00000dCekSQAS",
      "categoryName": "Hardwood Flooring",
      "department": "Flooring",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Plank Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Species/Look",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Construction",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color/Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Plank Width (Inches)} {Species/Look} {Construction} {Category} {Color/Finish} - {Model Number}",
      "exampleTitle": "Shaw 5-Inch White Oak Engineered Hardwood Flooring Natural",
      "seoNotes": "Construction = Solid, Engineered. Species/look + width are top search terms."
  },
  'luxury vinyl flooring': {
      "categoryId": "a01aZ00000dCekRQAS",
      "categoryName": "Luxury Vinyl Flooring",
      "department": "Flooring",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Plank Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Wear Layer (mil)",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Plank Width (Inches)} {Wear Layer (mil)} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "COREtec 7-Inch 20 mil Luxury Vinyl Flooring Gray Oak ",
      "seoNotes": "Wear layer thickness differentiates quality tiers. Waterproof is a key feature."
  },
  'laminate flooring': {
      "categoryId": "a01aZ00000dCekTQAS",
      "categoryName": "Laminate Flooring",
      "department": "Flooring",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Plank Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "AC Rating",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Plank Width (Inches)} {AC Rating} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "Pergo 7-Inch AC4 Laminate Flooring Rustic Oak ",
      "seoNotes": "AC rating (AC3-AC5) indicates durability class. Width and waterproofing matter."
  },
  'waterproof flooring': {
      "categoryId": "a01aZ00000dCekWQAS",
      "categoryName": "Waterproof Flooring",
      "department": "Flooring",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Plank Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Plank Width (Inches)} {Material} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "LifeProof 7-Inch Rigid Core Waterproof Flooring Sterling Oak ",
      "seoNotes": "Material = Rigid Core, WPC, SPC. Waterproof is already in category name."
  },
  'tile': {
      "categoryId": "a01aZ00000dCekQQAS",
      "categoryName": "Tile",
      "department": "Flooring",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Tile Size",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Tile Size} {Material} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "Daltile 12×24-Inch Porcelain Tile Carrara White",
      "seoNotes": "Material = Porcelain, Ceramic, Natural Stone, Mosaic. Size format: L×W."
  },
  'carpet tile': {
      "categoryId": "a01aZ00000dCekVQAS",
      "categoryName": "Carpet Tile",
      "department": "Flooring",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Tile Size",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Tile Size} {Material} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "Shaw 24×24-Inch Nylon Carpet Tile Charcoal ",
      "seoNotes": "Tile size (usually 24×24) + material + commercial-grade are key."
  },
  'hardscaping': {
      "categoryId": "a01aZ00000dCekUQAS",
      "categoryName": "Hardscaping",
      "department": "Flooring",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size} {Material} {Type} {Category} {Color} - {Model Number}",
      "exampleTitle": "Belgard 12×12-Inch Concrete Paver Hardscaping Gray",
      "seoNotes": "Type = Paver, Retaining Wall, Edging, Stepping Stone."
  },
  'cabinet hardware (hardware)': {
      "categoryId": "a01aZ00000dC5F2QAK",
      "categoryName": "Cabinet Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (Inches)} {Type} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Top Knobs 5-Inch Bar Pull Modern Cabinet Hardware Polished Chrome",
      "seoNotes": "Size = center-to-center. Type = Pull, Knob, Handle, Backplate."
  },
  'handlesets': {
      "categoryId": "a01aZ00000dCejEQAS",
      "categoryName": "Handlesets",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Collection",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Collection} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Schlage Plymouth Traditional Handleset Aged Bronze",
      "seoNotes": "Collection name + style drive search. Finish is the top aesthetic filter."
  },
  'deadbolts': {
      "categoryId": "a01aZ00000dC5F5QAK",
      "categoryName": "Deadbolts",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Grade",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Grade} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Schlage Smart Electronic Grade 1 Deadbolt Matte Black ",
      "seoNotes": "Type = Keyed, Electronic, Smart. ANSI Grade (1-3) indicates security level."
  },
  'keyless entry': {
      "categoryId": "a01aZ00000dCejHQAS",
      "categoryName": "Keyless Entry",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Yale Assure Lock Keyless Entry Satin Nickel ",
      "seoNotes": "Type = Keypad, Touchscreen, Fingerprint, Bluetooth. Smart features drive purchase."
  },
  'keyed hardware': {
      "categoryId": "a01aZ00000dCejGQAS",
      "categoryName": "Keyed Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Collection",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Function",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Collection} {Function} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Kwikset Juno Entry Keyed Hardware Satin Nickel",
      "seoNotes": "Function = Entry, Privacy, Passage, Dummy."
  },
  'mortise locks': {
      "categoryId": "a01aZ00000dCejJQAS",
      "categoryName": "Mortise Locks",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Collection",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Collection} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Emtek Arts & Crafts Mortise Lock Oil-Rubbed Bronze ",
      "seoNotes": "Premium hardware. Collection and finish are the key differentiators."
  },
  'lock combo packs': {
      "categoryId": "a01aZ00000dCejIQAS",
      "categoryName": "Lock Combo Packs",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Included Items",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Included Items} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Schlage Deadbolt + Lever Lock Combo Pack Matte Black",
      "seoNotes": "Included Items (e.g., Deadbolt + Lever, Deadbolt + Knob). Value-driven purchase."
  },
  'multi point door hardware': {
      "categoryId": "a01aZ00000dCejKQAS",
      "categoryName": "Multi Point Door Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Hoppe Contemporary Multi Point Door Hardware Stainless Steel",
      "seoNotes": "Niche category. Style and finish are the differentiators."
  },
  'barn door hardware': {
      "categoryId": "a01aZ00000dC5F1QAK",
      "categoryName": "Barn Door Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Track Length (Feet)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Track Length (Feet)} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Everbilt 8-Foot Modern Barn Door Hardware Matte Black",
      "seoNotes": "Track length must match door. Style = Modern, Rustic, Classic."
  },
  'closet and pocket door hardware': {
      "categoryId": "a01aZ00000dC5F3QAK",
      "categoryName": "Closet and Pocket Door Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Emtek Privacy Closet and Pocket Door Hardware Satin Brass",
      "seoNotes": "Type = Privacy, Passage, Pull, Flush Pull."
  },
  'sliding door hardware': {
      "categoryId": "a01aZ00000dCejOQAS",
      "categoryName": "Sliding Door Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Emtek Privacy Sliding Door Hardware Flat Black",
      "seoNotes": "Type = Privacy, Passage, Hook Lock."
  },
  'door hinges': {
      "categoryId": "a01aZ00000dC5FAQA0",
      "categoryName": "Door Hinges",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (Inches)} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Baldwin 4.5-Inch Ball Bearing Door Hinge Satin Nickel",
      "seoNotes": "Size in inches. Type = Ball Bearing, Plain, Spring, Self-Closing."
  },
  'door hardware parts': {
      "categoryId": "a01aZ00000dC5F8QAK",
      "categoryName": "Door Hardware Parts",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Schlage Lever Trim Door Hardware Parts Satin Nickel",
      "seoNotes": "Type = Trim, Strike Plate, Rose, Latch. Replacement parts category."
  },
  'screen and storm door hardware': {
      "categoryId": "a01aZ00000dCejNQAS",
      "categoryName": "Screen and Storm Door Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Wright Products Pneumatic Closer Screen and Storm Door Hardware Aluminum",
      "seoNotes": "Type = Closer, Handle, Latch, Hinge. Functional hardware."
  },
  'doors': {
      "categoryId": "a01aZ00000dCejDQAS",
      "categoryName": "Doors",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width×Height",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width×Height} {Material} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Masonite 36×80-Inch Fiberglass Entry Door Primed ",
      "seoNotes": "Width×Height in inches. Type = Entry, Interior, Patio, French. Material is key for exterior."
  },
  'commercial door hardware': {
      "categoryId": "a01aZ00000dC5F4QAK",
      "categoryName": "Commercial Door Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Function",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Function} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Sargent Mortise Lock Classroom Commercial Door Hardware Satin Chrome",
      "seoNotes": "Function = Classroom, Storeroom, Office, Exit. Grade and ADA compliance matter."
  },
  'home hardware': {
      "categoryId": "a01aZ00000dCejFQAS",
      "categoryName": "Home Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Liberty Hook Home Hardware Satin Nickel",
      "seoNotes": "Catch-all. Type = Hook, Number, Kick Plate, Mail Slot. Simple title."
  },
  'safes, locks and lock boxes': {
      "categoryId": "a01aZ00000dCejLQAS",
      "categoryName": "Safes, Locks and Lock Boxes",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity/Size",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity/Size} {Type} {Category} - {Model Number}",
      "exampleTitle": "SentrySafe 1.2 Cu. Ft. Fire-Rated Safes, Locks and Lock Boxes ",
      "seoNotes": "Type = Safe, Lock Box, Key Cabinet. Capacity and fire rating are key."
  },
  'safety & security': {
      "categoryId": "a01aZ00000dCejMQAS",
      "categoryName": "Safety & Security",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} - {Model Number}",
      "exampleTitle": "Ring Video Doorbell Safety & Security ",
      "seoNotes": "Type = Doorbell Camera, Security Camera, Smoke Detector, CO Detector."
  },
  'designer hardware': {
      "categoryId": "a01aZ00000dC5F6QAK",
      "categoryName": "Designer Hardware",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Collection",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Collection} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Emtek Select T-Bar Knurled Designer Hardware Satin Brass",
      "seoNotes": "Premium/decorative. Collection name carries significant brand value."
  },
  'storage and organization': {
      "categoryId": "a01aZ00000dCejPQAS",
      "categoryName": "Storage and Organization",
      "department": "Hardware",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Size} {Category} {Material} - {Model Number}",
      "exampleTitle": "ClosetMaid Shelf 72-Inch Storage and Organization Wire White",
      "seoNotes": "Type = Shelf, Rack, Hook System, Basket. Size matters for fit."
  },
  'furniture': {
      "categoryId": "a01aZ00000dCekIQAS",
      "categoryName": "Furniture",
      "department": "Home Décor & Furniture",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color/Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Style} {Category} {Material} {Color/Finish} - {Model Number}",
      "exampleTitle": "West Elm Sofa Mid-Century Modern Furniture Wood Walnut",
      "seoNotes": "Type = Sofa, Bed, Dresser, Table, Desk. Style + material drive search."
  },
  'chairs': {
      "categoryId": "a01aZ00000XYWwyQAH",
      "categoryName": "Chairs",
      "department": "Home Décor & Furniture",
      "family": "Furniture",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color/Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Style} {Category} {Material} {Color/Finish} - {Model Number}",
      "exampleTitle": "Herman Miller Task Modern Chair Mesh Black",
      "seoNotes": "Type = Task/Office, Dining, Lounge, Accent, Bar Stool."
  },
  'outdoor and patio furniture': {
      "categoryId": "a01aZ00000dCekPQAS",
      "categoryName": "Outdoor and Patio Furniture",
      "department": "Home Décor & Furniture",
      "family": "Furniture",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Piece Count",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Piece Count} {Material} {Category} {Color} - {Model Number}",
      "exampleTitle": "Polywood 5-Piece Adirondack Recycled Lumber Outdoor and Patio Furniture White",
      "seoNotes": "Type = Seating Set, Dining Set, Adirondack, Lounger. Piece count for sets."
  },
  'mirrors': {
      "categoryId": "a01aZ00000dCekJQAS",
      "categoryName": "Mirrors",
      "department": "Home Décor & Furniture",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Dimensions (W×H)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Dimensions (W×H)} {Type} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Uttermost 30×40-Inch Framed Transitional Mirror Gold",
      "seoNotes": "Type = Framed, Frameless, Full-Length, Round. Dimensions in W×H."
  },
  'rugs': {
      "categoryId": "a01aZ00000dCekNQAS",
      "categoryName": "Rugs",
      "department": "Home Décor & Furniture",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (W×L)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (W×L)} {Material} {Style} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "Safavieh 8×10-Foot Wool Traditional Rug Ivory/Blue",
      "seoNotes": "Size in W×L feet. Material = Wool, Synthetic, Jute, Silk. Style drives aesthetics."
  },
  'lamps (home décor & furniture)': {
      "categoryId": "a01aZ00000dCekOQAS",
      "categoryName": "Lamps",
      "department": "Home Décor & Furniture",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Height (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Height (Inches)} {Type} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Visual Comfort 28-Inch Table Modern Lamp Antique Brass",
      "seoNotes": "Same as Lighting > Lamps. Type = Table, Floor, Desk. Height is key."
  },
  'wall decor': {
      "categoryId": "a01aZ00000dCekKQAS",
      "categoryName": "Wall Decor",
      "department": "Home Décor & Furniture",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Dimensions",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Dimensions} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Uttermost Metal Sculpture 36×24-Inch Modern Wall Decor Gold",
      "seoNotes": "Type = Art, Sculpture, Clock, Shelving. Dimensions help buyers gauge scale."
  },
  'home accents': {
      "categoryId": "a01aZ00000dCekMQAS",
      "categoryName": "Home Accents",
      "department": "Home Décor & Furniture",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Style} {Category} {Material} {Color} - {Model Number}",
      "exampleTitle": "Global Views Vase Contemporary Home Accent Ceramic Blue",
      "seoNotes": "Type = Vase, Candle Holder, Bookend, Tray, Figurine. Very diverse."
  },
  'home organization': {
      "categoryId": "a01aZ00000dCekLQAS",
      "categoryName": "Home Organization",
      "department": "Home Décor & Furniture",
      "family": "Home Improvement",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Size} {Category} {Material} - {Model Number}",
      "exampleTitle": "Container Store Shelf 36-Inch Home Organization Bamboo",
      "seoNotes": "Type = Shelf, Bin, Basket, Hook, Hanger. Functional products."
  },
  'outdoor kitchens': {
      "categoryId": "a01aZ00000dCejuQAC",
      "categoryName": "Outdoor Kitchens",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Lynx 42-Inch Built-In Outdoor Kitchen Island Stainless Steel ",
      "seoNotes": "Type = Island, Cart, Grill, Sink, Refrigerator. Width for built-in configurations."
  },
  'fire pits (outdoor)': {
      "categoryId": "a01aZ00000dCejmQAC",
      "categoryName": "Fire Pits",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Diameter/Width",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Diameter/Width} {Fuel Type} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Solo Stove 27-Inch Wood Portable Fire Pit Stainless Steel ",
      "seoNotes": "Same schema as HVAC Fire Pits. Fuel + Type + Material are top filters."
  },
  'fire pit accessories': {
      "categoryId": "a01aZ00000dCejlQAC",
      "categoryName": "Fire Pit Accessories",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Size} {Category} {Material} - {Model Number}",
      "exampleTitle": "Solo Stove Fire Screen 27-Inch Fire Pit Accessory Stainless Steel",
      "seoNotes": "Type = Cover, Screen, Grate, Stand. Size must match fire pit."
  },
  'outdoor fireplaces': {
      "categoryId": "a01aZ00000dCejsQAC",
      "categoryName": "Outdoor Fireplaces",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Napoleon 55,000 BTU Gas Wall-Mount Outdoor Fireplace Stainless Steel",
      "seoNotes": "Type = Wall-Mount, Freestanding. BTU + Fuel are the key specs."
  },
  'outdoor heating': {
      "categoryId": "a01aZ00000dCejtQAC",
      "categoryName": "Outdoor Heating",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Bromic 44,000 BTU Gas Ceiling-Mount Outdoor Heating Stainless Steel",
      "seoNotes": "Type = Ceiling-Mount, Wall-Mount, Freestanding, Tabletop."
  },
  'patio heaters (outdoor)': {
      "categoryId": "a01aZ00000dCejxQAC",
      "categoryName": "Patio Heaters",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "BTU",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Fire Sense 46,000 BTU Propane Freestanding Patio Heater Stainless Steel",
      "seoNotes": "Same as HVAC Patio Heaters. BTU + Fuel + Type drive purchase."
  },
  'exterior doors': {
      "categoryId": "a01aZ00000dCejkQAC",
      "categoryName": "Exterior Doors",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width×Height",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width×Height} {Material} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Therma-Tru 36×80-Inch Fiberglass Single Exterior Door Primed ",
      "seoNotes": "Type = Single, Double, Sidelite, Patio, French. Material is critical for weather."
  },
  'entry sets': {
      "categoryId": "a01aZ00000dCejjQAC",
      "categoryName": "Entry Sets",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Emtek Arts & Crafts Entry Set Oil-Rubbed Bronze",
      "seoNotes": "Simpler title. Style + finish are the differentiators."
  },
  'outdoor shower faucets': {
      "categoryId": "a01aZ00000dCejwQAC",
      "categoryName": "Outdoor Shower Faucets",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Grohe Wall-Mount Outdoor Shower Faucet Stainless Steel ",
      "seoNotes": "Type = Wall-Mount, Freestanding, Portable. Thermostatic is a premium feature."
  },
  'generators': {
      "categoryId": "a01aZ00000dCejoQAC",
      "categoryName": "Generators",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Wattage",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Fuel Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Wattage} {Fuel Type} {Type} {Category} - {Model Number}",
      "exampleTitle": "Generac 7,500W Gas Portable Generator ",
      "seoNotes": "Wattage (starting/running) is the primary spec. Type = Portable, Standby, Inverter."
  },
  'garden decor': {
      "categoryId": "a01aZ00000dCejnQAC",
      "categoryName": "Garden Decor",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Style} {Category} {Material} {Color} - {Model Number}",
      "exampleTitle": "Campania Planter Traditional Garden Decor Cast Stone Gray",
      "seoNotes": "Type = Planter, Fountain, Statue, Trellis, Birdbath."
  },
  'hardscaping (outdoor)': {
      "categoryId": "a01aZ00000dCejpQAC",
      "categoryName": "Hardscaping",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size} {Material} {Type} {Category} {Color} - {Model Number}",
      "exampleTitle": "Belgard 4×8-Inch Concrete Paver Hardscaping Charcoal",
      "seoNotes": "Same as Flooring Hardscaping. Type = Paver, Wall Block, Cap, Edging."
  },
  'mail boxes': {
      "categoryId": "a01aZ00000dCejqQAC",
      "categoryName": "Mail Boxes",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Finish",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Style} {Category} {Finish} - {Model Number}",
      "exampleTitle": "Architectural Mailboxes Wall-Mount Modern Mail Box Black",
      "seoNotes": "Type = Wall-Mount, Post-Mount, Locking, Cluster."
  },
  'rugs (outdoor)': {
      "categoryId": "a01aZ00000dCejyQAC",
      "categoryName": "Rugs",
      "department": "Outdoor",
      "family": "Outdoor",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (W×L)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Style",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Color/Pattern",
              "required": true
          },
          {
              "position": 7,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (W×L)} {Material} {Style} {Category} {Color/Pattern} - {Model Number}",
      "exampleTitle": "Safavieh 5×8-Foot Polypropylene Indoor/Outdoor Rug Blue Stripe",
      "seoNotes": "Must emphasize outdoor/weather-resistant material."
  },
  'storage drawers/doors': {
      "categoryId": "a01aZ00000dEXvOQAW",
      "categoryName": "Storage Drawers/Doors",
      "department": "Outdoor",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Width (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Width (Inches)} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Bull 30-Inch Double Drawer Storage Drawers/Doors Stainless Steel",
      "seoNotes": "Type = Drawer, Door, Combo. For outdoor kitchen islands."
  },
  'water fountain': {
      "categoryId": "a01aZ00000dBtNpQAK",
      "categoryName": "Water Fountain",
      "department": "Industrial & Commercial",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Mount",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Mount} {Material} - {Model Number}",
      "exampleTitle": "Elkay Wall-Mount Water Fountain Stainless Steel ",
      "seoNotes": "Type = Wall-Mount, Freestanding, Bottle Filler. ADA compliance is critical."
  },
  'commercial restroom': {
      "categoryId": "a01aZ00000dC5DpQAK",
      "categoryName": "Commercial Restroom",
      "department": "Industrial & Commercial",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Bradley Touchless Lavatory System Commercial Restroom Stainless Steel ",
      "seoNotes": "Type = Lavatory, Hand Dryer, Partition, Dispenser. ADA + touchless are key features."
  },
  'industrial strainers': {
      "categoryId": "a01aZ00000dDRGuQAO",
      "categoryName": "Industrial Strainers",
      "department": "Industrial & Commercial",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (Inches)} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Watts 4-Inch Y-Pattern Industrial Strainer Cast Iron",
      "seoNotes": "Size = pipe diameter. Type = Y-Pattern, Basket, Duplex. Material matters."
  },
  'chemicals & compounds': {
      "categoryId": "a01aZ00000dF7KTQA0",
      "categoryName": "Chemicals & Compounds",
      "department": "Industrial & Commercial",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Size/Volume",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Application",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Size/Volume} {Category} {Application} - {Model Number}",
      "exampleTitle": "Oatey 16 oz Pipe Cement Chemicals & Compounds PVC",
      "seoNotes": "Type = Cement, Flux, Sealant, Cleaner. Application (PVC, Copper, etc.) is key."
  },
  'hydronic expansion tanks': {
      "categoryId": "a01aZ00000dFPfcQAG",
      "categoryName": "Hydronic Expansion Tanks",
      "department": "Industrial & Commercial",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Capacity (Gallons)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Connection Size",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Capacity (Gallons)} {Type} {Category} {Connection Size} - {Model Number}",
      "exampleTitle": "Watts 4.5-Gallon In-Line Hydronic Expansion Tank 3/4-Inch",
      "seoNotes": "Capacity + connection size are the primary specs."
  },
  'drainage & waste': {
      "categoryId": "a01aZ00000dhf6HQAQ",
      "categoryName": "Drainage & Waste",
      "department": "Industrial & Commercial",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (Inches)} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "Zurn 4-Inch Floor Drain Drainage & Waste Cast Iron",
      "seoNotes": "Type = Floor Drain, Cleanout, Trap Primer, Interceptor. Size = pipe diameter."
  },
  'pipe fittings': {
      "categoryId": "a01aZ00000eF8O3QAK",
      "categoryName": "Pipe Fittings",
      "department": "Plumbing & Bath",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Size (Inches)",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 5,
              "attribute": "Material",
              "required": true
          },
          {
              "position": 6,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Size (Inches)} {Type} {Category} {Material} - {Model Number}",
      "exampleTitle": "SharkBite 1/2-Inch Push-to-Connect Pipe Fitting Brass",
      "seoNotes": "Size + Type + Material are the 3 essential specs. Type = Coupling, Elbow, Tee, Adapter."
  },
  'home electronics': {
      "categoryId": "a01aZ00000XaZKQQA3",
      "categoryName": "Home Electronics",
      "department": "Electronics",
      "family": "General",
      "slots": [
          {
              "position": 1,
              "attribute": "Brand",
              "required": true
          },
          {
              "position": 2,
              "attribute": "Type",
              "required": true
          },
          {
              "position": 3,
              "attribute": "Category",
              "required": true
          },
          {
              "position": 4,
              "attribute": "Model Number",
              "required": true
          }
      ],
      "template": "{Brand} {Type} {Category} - {Model Number}",
      "exampleTitle": "Sonos Wireless Speaker Home Electronics ",
      "seoNotes": "Broad category. Type = Speaker, Smart Display, Hub, Streaming Device."
  },
};

/**
 * Mapping from category_id to lookup key
 */
export const CATEGORY_ID_TO_KEY: Record<string, string> = {
  'a01Hu000010Q5EpIAK': 'refrigerator',
  'a01Hu000010Q5EkIAK': 'freezer',
  'a01Hu000010Q5EnIAK': 'range',
  'a01Hu000010Q5EmIAK': 'oven',
  'a01Hu000010Q5EhIAK': 'cooktop',
  'a01Hu000010Q5ElIAK': 'microwave',
  'a01Hu000010Q5EiIAK': 'dishwasher',
  'a01Hu000010Q5EoIAK': 'range hood',
  'a01Hu000011kFRfIAM': 'icemaker',
  'a01Hu000011kgEqIAI': 'barbeques',
  'a01Hu000011kmDGIAY': 'coffee maker',
  'a01aZ00000KJFrCQAX': 'pizza oven',
  'a01Hu000010Q5EcIAK': 'kitchen appliances',
  'a01Hu000010Q5EsIAK': 'washer',
  'a01Hu000010Q5EjIAK': 'dryer',
  'a01Hu000010Q5EqIAK': 'all in one washer / dryer',
  'a01Hu000010Q5ErIAK': 'standalone pedestal',
  'a01Hu000010Q5EdIAK': 'laundry appliances',
  'a01aZ00000dC5DeQAK': 'bathroom faucets',
  'a01aZ00000dC5E9QAK': 'kitchen faucets',
  'a01aZ00000dC5EDQA0': 'kitchen sinks',
  'a01aZ00000dC5E2QAK': 'bar & prep sinks',
  'a01aZ00000dC5DiQAK': 'bathroom sinks',
  'a01aZ00000dC5DjQAK': 'bathroom vanities',
  'a01aZ00000dC5DqQAK': 'medicine cabinets',
  'a01aZ00000dC5DyQAK': 'toilets',
  'a01aZ00000dC5DxQAK': 'toilet seats',
  'a01aZ00000dC5DoQAK': 'bidets',
  'a01aZ00000dC5DnQAK': 'bidet seats',
  'a01aZ00000dC5E0QAK': 'urinals',
  'a01aZ00000dC5DlQAK': 'bathtubs',
  'a01aZ00000dC5DuQAK': 'showers',
  'a01aZ00000dC5DvQAK': 'steam showers',
  'a01aZ00000dC5DrQAK': 'rough-in valves',
  'a01aZ00000dC5DcQAK': 'bath fans',
  'a01aZ00000dC5DfQAK': 'bathroom hardware and accessories',
  'a01aZ00000dC5DdQAK': 'bathroom cabinet hardware',
  'a01aZ00000dC5DgQAK': 'bathroom lighting',
  'a01aZ00000dC5DhQAK': 'bathroom mirrors',
  'a01aZ00000dC5E6QAK': 'garbage disposals',
  'a01aZ00000dC5E7QAK': 'hot & cold water dispensers',
  'a01aZ00000dC5EJQA0': 'water filtration',
  'a01aZ00000dC5DwQAK': 'tankless water heaters',
  'a01aZ00000dC5E4QAK': 'cabinet hardware',
  'a01aZ00000dC5E1QAK': 'backsplash kitchen tile',
  'a01aZ00000dC5EFQA0': 'kitchen tile',
  'a01aZ00000dC5E8QAK': 'kitchen accessories',
  'a01aZ00000dC5EAQA0': 'kitchen furniture and decor',
  'a01aZ00000dC5EEQA0': 'kitchen storage & organization',
  'a01aZ00000dC5EGQA0': 'luxury kitchen',
  'a01aZ00000dC5ELQA0': 'chandeliers',
  'a01aZ00000dC5EKQA0': 'ceiling lights',
  'a01aZ00000dC5EXQA0': 'pendants',
  'a01aZ00000dC5EOQA0': 'island lighting',
  'a01aZ00000dC5EeQAK': 'wall sconces',
  'a01aZ00000dC5EdQAK': 'vanity lighting',
  'a01aZ00000dC5EZQA0': 'recessed lighting',
  'a01aZ00000dC5EcQAK': 'under cabinet lights',
  'a01aZ00000dC5EbQAK': 'track and rail lighting',
  'a01aZ00000dC5ERQA0': 'led lighting',
  'a01aZ00000dC5EBQA0': 'kitchen lighting',
  'a01aZ00000dC5EWQA0': 'outdoor lighting',
  'a01aZ00000dC5EQQA0': 'landscape lighting',
  'a01aZ00000dC5EYQA0': 'post lights',
  'a01aZ00000dC5EaQAK': 'step lighting',
  'a01aZ00000dC5EPQA0': 'lamps',
  'a01aZ00000dC5ESQA0': 'light bulbs',
  'a01aZ00000dC5ETQA0': 'light switches & dimmers',
  'a01aZ00000dC5EVQA0': 'lighting accessories',
  'a01aZ00000dC5EMQA0': 'commercial lighting',
  'a01aZ00000dC5EjQAK': 'ceiling fans',
  'a01aZ00000dC5EiQAK': 'ceiling fan accessories',
  'a01aZ00000dC5F0QAK': 'wall mounted fans',
  'a01aZ00000dC5EfQAK': 'air circulators',
  'a01aZ00000dC5EgQAK': 'attic fans',
  'a01aZ00000dCek0QAC': 'air conditioners',
  'a01aZ00000dCekBQAS': 'mini split air conditioners',
  'a01aZ00000dCek3QAC': 'dehumidifiers',
  'a01aZ00000bI2srQAC': 'water heaters',
  'a01aZ00000eEFl0QAG': 'room heater',
  'a01aZ00000dCekAQAS': 'indoor heating',
  'a01aZ00000dCekFQAS': 'stoves and fireplaces',
  'a01aZ00000dCekCQAS': 'patio heaters',
  'a01aZ00000dCek5QAC': 'evaporative coolers',
  'a01aZ00000dCekGQAS': 'thermostats',
  'a01aZ00000dCek6QAC': 'exhaust fans',
  'a01aZ00000dCekEQAS': 'stove and chimney pipe',
  'a01aZ00000dCekDQAS': 'skylights',
  'a01aZ00000dCek1QAC': 'air filters',
  'a01aZ00000dCek4QAC': 'ducting',
  'a01aZ00000dCek2QAC': 'commercial hvac',
  'a01aZ00000dCek9QAC': 'heating',
  'a01aZ00000fKN2RQAW': 'hvac accessories',
  'a01aZ00000dCek7QAC': 'fire pits',
  'a01aZ00000dCekSQAS': 'hardwood flooring',
  'a01aZ00000dCekRQAS': 'luxury vinyl flooring',
  'a01aZ00000dCekTQAS': 'laminate flooring',
  'a01aZ00000dCekWQAS': 'waterproof flooring',
  'a01aZ00000dCekQQAS': 'tile',
  'a01aZ00000dCekVQAS': 'carpet tile',
  'a01aZ00000dCekUQAS': 'hardscaping',
  'a01aZ00000dC5F2QAK': 'cabinet hardware (hardware)',
  'a01aZ00000dCejEQAS': 'handlesets',
  'a01aZ00000dC5F5QAK': 'deadbolts',
  'a01aZ00000dCejHQAS': 'keyless entry',
  'a01aZ00000dCejGQAS': 'keyed hardware',
  'a01aZ00000dCejJQAS': 'mortise locks',
  'a01aZ00000dCejIQAS': 'lock combo packs',
  'a01aZ00000dCejKQAS': 'multi point door hardware',
  'a01aZ00000dC5F1QAK': 'barn door hardware',
  'a01aZ00000dC5F3QAK': 'closet and pocket door hardware',
  'a01aZ00000dCejOQAS': 'sliding door hardware',
  'a01aZ00000dC5FAQA0': 'door hinges',
  'a01aZ00000dC5F8QAK': 'door hardware parts',
  'a01aZ00000dCejNQAS': 'screen and storm door hardware',
  'a01aZ00000dCejDQAS': 'doors',
  'a01aZ00000dC5F4QAK': 'commercial door hardware',
  'a01aZ00000dCejFQAS': 'home hardware',
  'a01aZ00000dCejLQAS': 'safes, locks and lock boxes',
  'a01aZ00000dCejMQAS': 'safety & security',
  'a01aZ00000dC5F6QAK': 'designer hardware',
  'a01aZ00000dCejPQAS': 'storage and organization',
  'a01aZ00000dCekIQAS': 'furniture',
  'a01aZ00000XYWwyQAH': 'chairs',
  'a01aZ00000dCekPQAS': 'outdoor and patio furniture',
  'a01aZ00000dCekJQAS': 'mirrors',
  'a01aZ00000dCekNQAS': 'rugs',
  'a01aZ00000dCekOQAS': 'lamps (home décor & furniture)',
  'a01aZ00000dCekKQAS': 'wall decor',
  'a01aZ00000dCekMQAS': 'home accents',
  'a01aZ00000dCekLQAS': 'home organization',
  'a01aZ00000dCejuQAC': 'outdoor kitchens',
  'a01aZ00000dCejmQAC': 'fire pits (outdoor)',
  'a01aZ00000dCejlQAC': 'fire pit accessories',
  'a01aZ00000dCejsQAC': 'outdoor fireplaces',
  'a01aZ00000dCejtQAC': 'outdoor heating',
  'a01aZ00000dCejxQAC': 'patio heaters (outdoor)',
  'a01aZ00000dCejkQAC': 'exterior doors',
  'a01aZ00000dCejjQAC': 'entry sets',
  'a01aZ00000dCejwQAC': 'outdoor shower faucets',
  'a01aZ00000dCejoQAC': 'generators',
  'a01aZ00000dCejnQAC': 'garden decor',
  'a01aZ00000dCejpQAC': 'hardscaping (outdoor)',
  'a01aZ00000dCejqQAC': 'mail boxes',
  'a01aZ00000dCejyQAC': 'rugs (outdoor)',
  'a01aZ00000dEXvOQAW': 'storage drawers/doors',
  'a01aZ00000dBtNpQAK': 'water fountain',
  'a01aZ00000dC5DpQAK': 'commercial restroom',
  'a01aZ00000dDRGuQAO': 'industrial strainers',
  'a01aZ00000dF7KTQA0': 'chemicals & compounds',
  'a01aZ00000dFPfcQAG': 'hydronic expansion tanks',
  'a01aZ00000dhf6HQAQ': 'drainage & waste',
  'a01aZ00000eF8O3QAK': 'pipe fittings',
  'a01aZ00000XaZKQQA3': 'home electronics',
};

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
