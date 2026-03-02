/**
 * PRODUCT TITLE SCHEMA BY CATEGORY - COMPREHENSIVE
 * =================================
 * Generated: 2026-02-17T14:39:12.256Z
 * 
 * Formula (Option A): Brand - [PRIMARY_SPEC] - [SECONDARY_SPEC] - Category - Finish - Model
 * 
 * Rules:
 * 1. Brand Always First - highest-value keyword for branded search
 * 2. PRIMARY_SPEC - Measurement (if exists) OR Type (if no measurement)
 * 3. SECONDARY_SPEC - Additional Type/Configuration/Installation (if applicable)
 * 4. Category Name - exact category for Google Shopping taxonomy
 * 5. Finish/Color - appearance descriptor (if applicable)
 * 6. Model Number - appended after dash
 * 
 * Max title length: 60-80 chars target, 150 max
 */

export interface TitleSlot {
  position: number;
  attribute: string;
  required: boolean;
  format?: string; // Optional format template, e.g., "{value} CFM" or "{value}-Inch"
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
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
    return `${formatted} Cu. Ft.`;
  },
  
  // BTU: Use comma separator
  btu: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${num.toLocaleString()} BTU`;
  },
  
  // CFM
  cfm: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)} CFM`;
  },
  
  // GPM
  gpm: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${num.toFixed(1)} GPM`;
  },
  
  // dBA Level
  dba: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)} dBA`;
  },
  
  // kW
  kw: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${num} kW`;
  },
  
  // Light Count
  lightCount: (value: number | string): string => {
    const num = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${num}-Light`;
  },
  
  // Dimensions W×H format
  dimensionsWxH: (width: number | string, height: number | string): string => {
    const w = parseFloat(String(width));
    const h = parseFloat(String(height));
    if (isNaN(w) || isNaN(h)) return '';
    return `${Math.round(w)}×${Math.round(h)}`;
  },
  
  // Tile Size format
  tileSize: (value: string): string => {
    // Expected format: "12x24" or "12×24" -> "12"×24""
    const match = value.match(/(d+)s*[x×]s*(d+)/i);
    if (match) {
      return `${match[1]}"×${match[2]}"`;
    }
    return value;
  }
};

/**
 * Attribute-to-formatter mapping
 */
export const ATTRIBUTE_FORMATTERS: Record<string, keyof typeof FORMATTING_RULES> = {
  'Width (Inches)': 'dimension',
  'Width (Inches)*': 'dimension',
  'Height (Inches)': 'dimension',
  'Length (Inches)': 'dimension',
  'Diameter (Inches)': 'dimension',
  'Aperture (Inches)': 'dimension',
  'Blade Span (Inches)': 'dimension',
  'Plank Width (Inches)': 'dimension',
  'Capacity (Cu. Ft.)': 'capacity',
  'BTU': 'btu',
  'BTU/Watts': 'btu',
  'Tonnage/BTU': 'btu',
  'CFM': 'cfm',
  'GPM/BTU': 'gpm',
  'dBA Level': 'dba',
  'Power (kW)': 'kw',
  'Light Count': 'lightCount',
  'Dimensions (W×H)': 'dimensionsWxH',
  'Tile Size': 'tileSize'
};

/**
 * Category title schemas (all 177 categories)
 */
export const CATEGORY_TITLE_SCHEMAS: Record<string, CategoryTitleSchema> = {
  "barbeque": {
    "categoryId": "a01Hu000011kgEqIAI",
    "categoryName": "Barbeque",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "BTU",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Type",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch 50,000 BTU Barbeque Finish - Model",
    "seoNotes": "Width for space, BTU for power. Fuel = Gas, Charcoal, Electric, Pellet."
  },
  "beverage_center": {
    "categoryId": "NEEDS_NEW_ID",
    "categoryName": "Beverage Center",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Capacity (Bottles)",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Category} {Finish} {Capacity (Bottles)} {Model Number}",
    "exampleTitle": "Brand 30-Inch Built-In Beverage Center Finish 28-Bottle - Model",
    "seoNotes": "Width for fit, type for installation. Capacity at end."
  },
  "coffee_maker": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Capacity (Cups)",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Capacity (Cups)} {Model Number}",
    "exampleTitle": "Brand Countertop Coffee Maker Finish 12-Cup - Model",
    "seoNotes": "Type = Built-In, Countertop, Espresso, Pod. Capacity at end."
  },
  "cooking": {
    "categoryId": "a01aZ00000Hm4voQAB",
    "categoryName": "Cooking",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cooking Finish - Model",
    "seoNotes": "Type = Cookware, Bakeware, Utensils, Gadgets."
  },
  "cooktop": {
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
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 3,
        "attribute": "Burner Count",
        "required": false,
        "format": "{value}-Burner"
      },
      {
        "position": 4,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Burner Count} {Fuel Type} {Category} {Finish} - {Model Number}",
    "exampleTitle": "GE 36-Inch 5-Burner Gas Cooktop Stainless Steel - PGP966SETSS",
    "seoNotes": "UPDATED v2.4: Removed Installation Type (all cooktops are built-in). Brand, width (30\"/36\" common), burner count (4/5/6), fuel type (Gas/Electric/Induction) CRITICAL. Model number at END per requirements."
  },
  "dishwasher": {
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
        "attribute": "Width (Inches)",
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Panel Ready",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Panel Ready} {Category} {Finish} - {Model Number}",
    "exampleTitle": "BOSCH 24-Inch Top Control Panel Ready Dishwasher - SHV9PT63UC",
    "seoNotes": "UPDATED v2.7: Added Panel Ready slot before Category. For panel-ready/integrated/fully integrated dishwashers. Brand, width, type, panel ready (if applicable), category, finish, model."
  },
  "drawer": {
    "categoryId": "a01Hu000011kpC2IAI",
    "categoryName": "Drawer",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Category} {Finish} - {Model Number}",
    "exampleTitle": "GAGGENAU 24-Inch Warming Drawer Stainless Steel - WS261710",
    "seoNotes": "Type = Warming, Storage. Width for fit."
  },
  "freezer": {
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
        "attribute": "Width (Inches)",
        "required": true,
        "format": "{value}-Inch"
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
        "attribute": "Capacity (Cu. Ft.)",
        "required": true
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": true
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Category} {Finish} {Capacity (Cu. Ft.)} {Model Number}",
    "exampleTitle": "GE 36-Inch Upright Freezer Stainless Steel 28 Cu. Ft. - Model",
    "seoNotes": "Type = Upright, Chest, Column, Undercounter, Compact. Capacity at end."
  },
  "icemaker": {
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
        "attribute": "Width",
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width} {Type} {Category} {Finish} - {Model Number}",
    "exampleTitle": "U-LINE 15-Inch Undercounter Icemaker Stainless Steel - UACP115-IS01A",
    "seoNotes": "Width is key sizing spec for undercounter icemakers. Type = Built-In, Undercounter, Freestanding, Portable."
  },
  "microwave": {
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
        "attribute": "Width (Inches)",
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Capacity (Cu. Ft.)",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Category} {Finish} {Capacity (Cu. Ft.)} {Model Number}",
    "exampleTitle": "Brand 30-Inch Over-the-Range Microwave Finish 2.0 Cu. Ft. - Model",
    "seoNotes": "Width for fit (30\" or 36\" for OTR models to match range). Type = Over-the-Range, Countertop, Built-In, Drawer. Capacity at end."
  },
  "oven": {
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
    "template": "{Brand} {Width (Inches)} {Fuel Type} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "GE 30-Inch Electric Double Wall Oven Stainless Steel - JTS3000SNSS",
    "seoNotes": "Type = Single, Double Wall, Microwave Combo, Steam, Convection, Speed Oven. Fuel Type = Gas, Electric."
  },
  "pizza_oven": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Fuel Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Pizza Oven Finish - Model",
    "seoNotes": "Type = Built-In, Countertop, Outdoor. Fuel = Gas, Wood, Electric."
  },
  "range": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Installation Type",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Fuel Type} {Installation Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Wolf 48-Inch Pro-Style Dual Fuel Slide-In Range Stainless Steel - DF48450G",
    "seoNotes": "Type = Pro-Style, Front Control, Rear Control. Fuel Type = Gas, Electric, Dual Fuel, Induction. Installation Type = Slide-In, Freestanding, Drop-In."
  },
  "range_hood": {
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
        "attribute": "CFM",
        "required": false,
        "format": "{value} CFM"
      },
      {
        "position": 3,
        "attribute": "Width (Inches)",
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {CFM} {Width (Inches)} {Type} {Category} {Finish} - {Model Number}",
    "exampleTitle": "THERMADOR 600 CFM 36-Inch Wall Mount Range Hood - Stainless Steel - VTI1190B",
    "seoNotes": "UPDATED v2.4: Brand first for consistency with other appliances, then CFM (critical spec), width, mount type (Under-Cabinet/Wall Mount/Island/Insert). Model number at END per requirements."
  },
  "refrigerator": {
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
        "attribute": "Width (Inches)",
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Installation Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Configuration",
        "required": false
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
        "attribute": "Capacity (Cu. Ft.)",
        "required": false
      },
      {
        "position": 9,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Installation Type} {Configuration} {Category} {Finish} {Capacity (Cu. Ft.)} {Model Number}",
    "exampleTitle": "Brand 36-Inch Built-In French Door Refrigerator Stainless Steel 28 Cu. Ft. - Model",
    "seoNotes": "Width first for space planning. Type = product type (Accessory extracts subtype like Panel Kit, Installation Kit). Installation = Built-In, Counter-Depth, Freestanding. Configuration = door style (French Door, Side-by-Side, Column). Capacity at end."
  },
  "wine_cooler": {
    "categoryId": "NEEDS_NEW_ID",
    "categoryName": "Wine Cooler",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Zone Config",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Capacity (Bottles)",
        "required": false
      },
      {
        "position": 8,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Zone Config} {Category} {Finish} {Capacity (Bottles)} {Model Number}",
    "exampleTitle": "Brand 30-Inch Built-In Dual Zone Wine Cooler Finish 28-Bottle - Model",
    "seoNotes": "Width for fit. Type and Zone for features. Capacity at end."
  },
  "all_in_one_washer_dryer": {
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
        "attribute": "Width (Inches)",
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Capacity (Cu. Ft.)",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Fuel Type} {Category} {Capacity (Cu. Ft.)} {Model Number}",
    "exampleTitle": "Brand 27-Inch Unitized Electric All in One Washer / Dryer 4.5 Cu. Ft. - Model",
    "seoNotes": "Width for space planning. Type = Unitized, Front Load, Top Load. Fuel Type = Gas, Electric. Capacity at end."
  },
  "dryer": {
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
        "attribute": "Width (Inches)",
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Capacity (Cu. Ft.)",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Fuel Type} {Category} {Capacity (Cu. Ft.)} {Model Number}",
    "exampleTitle": "GE 27-Inch Front Load Electric Dryer 7.5 Cu. Ft. - GTD75ECSLWS",
    "seoNotes": "Width for space planning. Type = Front Load, Top Load, Unitized. Fuel Type = Electric, Gas. Capacity at end."
  },
  "standalone_pedestal": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Height (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Height (Inches)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Standalone Pedestal Finish - Model",
    "seoNotes": "Type = Sink Pedestal, Pedestal Leg. Height for sink."
  },
  "washer": {
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
        "attribute": "Width (Inches)",
        "required": false,
        "format": "{value}-Inch"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Capacity (Cu. Ft.)",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Category} {Capacity (Cu. Ft.)} {Model Number}",
    "exampleTitle": "Brand 27-Inch Front Load Washer 5.0 Cu. Ft. - Model",
    "seoNotes": "Width for space planning. Type = Front Load, Top Load, Unitized. Capacity at end."
  },
  "home_electronics": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Home Electronics Finish - Model",
    "seoNotes": "Type = Doorbell, Camera, Smart Device, Security System."
  },
  "carpet": {
    "categoryId": "a01aZ00000dCekVQAS",
    "categoryName": "Carpet",
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Width (Feet)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Width (Feet)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Carpet Finish - Model",
    "seoNotes": "Type = Berber, Plush, Frieze, Looped. Width = roll width or tile size."
  },
  "hardwood_flooring": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 2,
        "attribute": "Plank Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Species/Look",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Plank Width (Inches)} {Species/Look} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Hardwood Flooring Finish - Model",
    "seoNotes": "Width = 3\", 5\", 7\"+. Species = Oak, Maple, Hickory, etc."
  },
  "laminate_flooring": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 2,
        "attribute": "Plank Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Species/Look",
        "required": false
      },
      {
        "position": 4,
        "attribute": "AC Rating",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Plank Width (Inches)} {Species/Look} {AC Rating} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Laminate Flooring Finish - Model",
    "seoNotes": "AC Rating for durability. Species look for aesthetics."
  },
  "luxury_vinyl_flooring": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Wear Layer (mil)",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Plank Width (Inches)} {Type} {Wear Layer (mil)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Luxury Vinyl Flooring Finish - Model",
    "seoNotes": "Type = Plank, Tile. Wear Layer determines durability."
  },
  "tile": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Material",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Tile Size} {Material} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Tile Finish - Model",
    "seoNotes": "Tile Size = 12×24, 6×36, etc. Material = Porcelain, Ceramic, Stone."
  },
  "waterproof_flooring": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Plank Width (Inches)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Waterproof Flooring Finish - Model",
    "seoNotes": "Type = LVP, WPC, SPC. Width for aesthetics."
  },
  "kitchen_tile": {
    "categoryId": "a01aZ00000dC5EFQA0",
    "categoryName": "Kitchen Tile",
    "department": "Flooring",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Material",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Tile Size} {Material} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Kitchen Tile Finish - Model",
    "seoNotes": "Same as Tile, kitchen-specific."
  },
  "bathroom_cabinet_hardware": {
    "categoryId": "a01aZ00000dC5DdQAK",
    "categoryName": "Bathroom Cabinet Hardware",
    "department": "Hardware",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Length/Diameter",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Length/Diameter} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Bathroom Cabinet Hardware Finish - Model",
    "seoNotes": "Same as cabinet hardware, bath finishes."
  },
  "appliance_pull": {
    "categoryId": "a01aZ00000dCejSQAS",
    "categoryName": "Appliance Pull",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Length (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Length (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Appliance Pull Finish - Model",
    "seoNotes": "Longer pulls (12\"+) for appliances."
  },
  "backplate": {
    "categoryId": "a01aZ00000dCejTQAS",
    "categoryName": "Backplate",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Backplate Finish - Model",
    "seoNotes": "Decorative plate behind knob/lever."
  },
  "barn_door_hardware": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 2,
        "attribute": "Track Length (Feet)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Track Length (Feet)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Barn Door Hardware Finish - Model",
    "seoNotes": "Track length for door width. Style = Modern, Rustic, Industrial."
  },
  "cabinet_catch_and_latch": {
    "categoryId": "a01aZ00000dCejUQAS",
    "categoryName": "Cabinet Catch and Latch",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cabinet Catch and Latch Finish - Model",
    "seoNotes": "Type = Magnetic, Roller, Touch, Bullet."
  },
  "cabinet_finishing": {
    "categoryId": "a01aZ00000dCejVQAS",
    "categoryName": "Cabinet Finishing",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cabinet Finishing Finish - Model",
    "seoNotes": "Type = Bumpers, Felt Pads, Plugs, Covers."
  },
  "cabinet_hardware": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Length/Diameter",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Length/Diameter} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cabinet Hardware Finish - Model",
    "seoNotes": "Type = Knob, Pull, Bin Pull, Cup Pull, Drop Pull."
  },
  "cabinet_hardware_bulk_pack": {
    "categoryId": "a01aZ00000dCejWQAS",
    "categoryName": "Cabinet Hardware Bulk Pack",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Piece Count",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Piece Count} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cabinet Hardware Bulk Pack Finish - Model",
    "seoNotes": "Type + quantity. Usually 10-pack or 25-pack."
  },
  "cabinet_hardware_mounting_template": {
    "categoryId": "a01aZ00000dCejXQAS",
    "categoryName": "Cabinet Hardware Mounting Template",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cabinet Hardware Mounting Template Finish - Model",
    "seoNotes": "Type = Universal, Specific Spacing."
  },
  "cabinet_hinge": {
    "categoryId": "a01aZ00000dCejYQAS",
    "categoryName": "Cabinet Hinge",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cabinet Hinge Finish - Model",
    "seoNotes": "Type = Concealed, Surface-Mount, Overlay, Inset."
  },
  "cabinet_knob": {
    "categoryId": "a01aZ00000dCejZQAS",
    "categoryName": "Cabinet Knob",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Diameter (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Diameter (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Cabinet Knob Finish - Model",
    "seoNotes": "Diameter typically 1.25\" to 1.5\". Style drives selection."
  },
  "cabinet_lock": {
    "categoryId": "a01aZ00000dCejaQAC",
    "categoryName": "Cabinet Lock",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cabinet Lock Finish - Model",
    "seoNotes": "Type = Cam Lock, Drawer Lock, Magnetic, Keyed."
  },
  "cabinet_organization_and_storage": {
    "categoryId": "a01aZ00000dCejbQAC",
    "categoryName": "Cabinet Organization and Storage",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Dimensions",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Cabinet Organization and Storage Finish - Model",
    "seoNotes": "Type = Pull-Out Shelf, Lazy Susan, Drawer Organizer, Trash Can."
  },
  "cabinet_pull": {
    "categoryId": "a01aZ00000dCejcQAC",
    "categoryName": "Cabinet Pull",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Length (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Length (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Cabinet Pull Finish - Model",
    "seoNotes": "Length = center-to-center spacing. Common: 3\", 4\", 5\", 6\"."
  },
  "closet_and_pocket_door_hardware": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Track Length (Feet)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Track Length (Feet)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Closet and Pocket Door Hardware Finish - Model",
    "seoNotes": "Type = Pocket, Bifold, Bypass. Track length for fit."
  },
  "commercial_door_hardware": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Commercial Door Hardware Finish - Model",
    "seoNotes": "Type = Exit Device, Panic Bar, Closer, Mortise Lock."
  },
  "deadbolt": {
    "categoryId": "a01aZ00000dC5F5QAK",
    "categoryName": "Deadbolt",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Deadbolt Finish - Model",
    "seoNotes": "Type = Single Cylinder, Double Cylinder, Keyless, Smart."
  },
  "designer_cabinet_hardware": {
    "categoryId": "a01aZ00000dCejdQAC",
    "categoryName": "Designer Cabinet Hardware",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Collection",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Collection} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Designer Cabinet Hardware Finish - Model",
    "seoNotes": "Premium segment. Collection-driven."
  },
  "designer_hardware": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Collection",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Collection} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Designer Hardware Finish - Model",
    "seoNotes": "Premium segment. Collection-driven."
  },
  "door": {
    "categoryId": "a01aZ00000dCejDQAS",
    "categoryName": "Door",
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
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Height (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Material",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Height (Inches)} {Type} {Material} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch 30-Inch Door Finish - Model",
    "seoNotes": "Width × Height for opening. Type = Interior, Exterior, Bifold, Sliding."
  },
  "door_entry_set": {
    "categoryId": "a01aZ00000dC5F7QAK",
    "categoryName": "Door Entry Set",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Door Entry Set Finish - Model",
    "seoNotes": "Same as Entry Set."
  },
  "door_hardware_part": {
    "categoryId": "a01aZ00000dC5F8QAK",
    "categoryName": "Door Hardware Part",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Door Hardware Part Finish - Model",
    "seoNotes": "Type = Strike Plate, Latchbolt, Spindle, Rosette."
  },
  "door_hardware:_knob_and_lever": {
    "categoryId": "a01aZ00000dC5F9QAK",
    "categoryName": "Door Hardware: Knob and Lever",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Door Hardware: Knob and Lever Finish - Model",
    "seoNotes": "Combined category. Type + function."
  },
  "door_hinge": {
    "categoryId": "a01aZ00000dC5FAQA0",
    "categoryName": "Door Hinge",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Size (Inches)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Door Hinge Finish - Model",
    "seoNotes": "Size = 3.5\", 4\", 4.5\". Type = Full Mortise, Half Mortise, Surface."
  },
  "door_knob": {
    "categoryId": "a01aZ00000dCejBQAS",
    "categoryName": "Door Knob",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Door Knob Finish - Model",
    "seoNotes": "Type = Passage, Privacy, Dummy, Keyed. Function critical."
  },
  "door_lever": {
    "categoryId": "a01aZ00000dCejCQAS",
    "categoryName": "Door Lever",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Door Lever Finish - Model",
    "seoNotes": "Type = Passage, Privacy, Dummy, Keyed. Function critical."
  },
  "drawer_slide_and_accessory": {
    "categoryId": "a01aZ00000dCejeQAC",
    "categoryName": "Drawer Slide and Accessory",
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
        "attribute": "Length (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Length (Inches)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Drawer Slide and Accessory Finish - Model",
    "seoNotes": "Length determines extension. Type = Side-Mount, Under-Mount, Center-Mount."
  },
  "handleset": {
    "categoryId": "a01aZ00000dCejEQAS",
    "categoryName": "Handleset",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Handleset Finish - Model",
    "seoNotes": "Type = Entry, Dummy. Includes exterior grip + interior lever/knob."
  },
  "home_hardware": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Home Hardware Finish - Model",
    "seoNotes": "Type = Utility Hook, Bracket, Fastener, Anchor."
  },
  "keyed_hardware": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Keyed Hardware Finish - Model",
    "seoNotes": "Type = Keyed Entry, Keyed Knob, Keyed Lever."
  },
  "keyless_entry": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Keyless Entry Finish - Model",
    "seoNotes": "Type = Keypad, Smart Lock, Biometric, RFID."
  },
  "lock_combo_pack": {
    "categoryId": "a01aZ00000dCejIQAS",
    "categoryName": "Lock Combo Pack",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Piece Count",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Piece Count} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Lock Combo Pack Finish - Model",
    "seoNotes": "Multiple locks in package. Type + count."
  },
  "luxury_cabinet_knob": {
    "categoryId": "a01aZ00000dCejfQAC",
    "categoryName": "Luxury Cabinet Knob",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Diameter (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Collection",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Style",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Diameter (Inches)} {Collection} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Luxury Cabinet Knob Finish - Model",
    "seoNotes": "Premium segment. Diameter + collection/style."
  },
  "luxury_cabinet_pull": {
    "categoryId": "a01aZ00000dCejgQAC",
    "categoryName": "Luxury Cabinet Pull",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Length (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Collection",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Style",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Length (Inches)} {Collection} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Luxury Cabinet Pull Finish - Model",
    "seoNotes": "Premium segment. Length + collection/style."
  },
  "mortise_lock": {
    "categoryId": "a01aZ00000dCejJQAS",
    "categoryName": "Mortise Lock",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Mortise Lock Finish - Model",
    "seoNotes": "Commercial-grade. Type = Entry, Privacy, Passage."
  },
  "multi_point_door_hardware": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Length (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Length (Inches)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Multi Point Door Hardware Finish - Model",
    "seoNotes": "Type = Active, Passive, Multipoint Lock. Height for tall doors."
  },
  "safe,_lock_and_lock_box": {
    "categoryId": "a01aZ00000dCejLQAS",
    "categoryName": "Safe, Lock and Lock Box",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Size (L×W×D)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Size (L×W×D)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Safe, Lock and Lock Box Finish - Model",
    "seoNotes": "Type = Floor Safe, Wall Safe, Lock Box, Gun Safe."
  },
  "safety_security": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Safety & Security Finish - Model",
    "seoNotes": "Type = Alarm, Camera, Lock, Safe, Fire Extinguisher."
  },
  "screen_and_storm_door_hardware": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Screen and Storm Door Hardware Finish - Model",
    "seoNotes": "Type = Closer, Latch, Handle, Hinge."
  },
  "sliding_door_hardware": {
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
        "attribute": "Track Length (Feet)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Track Length (Feet)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Sliding Door Hardware Finish - Model",
    "seoNotes": "Type = Barn, Pocket, Bypass, Telescoping."
  },
  "storage_and_organization": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Dimensions",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Storage and Organization Finish - Model",
    "seoNotes": "Type = Shelf, Bin, Basket, Rack, Organizer."
  },
  "vanity_cabinet_hardware": {
    "categoryId": "a01aZ00000dCejhQAC",
    "categoryName": "Vanity Cabinet Hardware",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Length/Diameter",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Length/Diameter} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Vanity Cabinet Hardware Finish - Model",
    "seoNotes": "Type = Knob, Pull. Bath finishes common."
  },
  "tankless_water_heater": {
    "categoryId": "a01aZ00000dC5DwQAK",
    "categoryName": "Tankless Water Heater",
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 2,
        "attribute": "GPM/BTU",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {GPM/BTU} {Fuel Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Tankless Water Heater Finish - Model",
    "seoNotes": "GPM determines flow rate. Fuel = Gas, Electric."
  },
  "water_heater": {
    "categoryId": "a01aZ00000bI2srQAC",
    "categoryName": "Water Heater",
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Capacity (Gallons)",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Fuel Type} {Category} {Finish} {Capacity (Gallons)} {Model Number}",
    "exampleTitle": "Brand Gas Water Heater Finish 50-Gallon - Model",
    "seoNotes": "Fuel type primary. Capacity at end."
  },
  "air_conditioner": {
    "categoryId": "a01aZ00000dCek0QAC",
    "categoryName": "Air Conditioner",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Tonnage/BTU} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Air Conditioner Finish - Model",
    "seoNotes": "BTU/Tonnage for room size. Type = Window, Portable, Mini Split, Central."
  },
  "air_filter": {
    "categoryId": "a01aZ00000dCek1QAC",
    "categoryName": "Air Filter",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "MERV Rating",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Size (W×H)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {MERV Rating} {Size (W×H)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Air Filter Finish - Model",
    "seoNotes": "MERV rating determines filtration level. Size must match system."
  },
  "commercial_hvac": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Tonnage/BTU} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Commercial HVAC Finish - Model",
    "seoNotes": "Type = Rooftop Unit, Split System, VRF, Chiller."
  },
  "dehumidifier": {
    "categoryId": "a01aZ00000dCek3QAC",
    "categoryName": "Dehumidifier",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Capacity (Pints)",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Capacity (Pints)} {Model Number}",
    "exampleTitle": "Brand Portable Dehumidifier Finish 50-Pint - Model",
    "seoNotes": "Type = Portable, Whole-House. Capacity (pints/day) at end."
  },
  "ducting": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Length (Feet)",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Diameter (Inches)} {Type} {Length (Feet)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Ducting Finish - Model",
    "seoNotes": "Diameter matches system. Type = Rigid, Flexible, Insulated."
  },
  "evaporative_cooler": {
    "categoryId": "a01aZ00000dCek5QAC",
    "categoryName": "Evaporative Cooler",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {CFM} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 400 CFM Evaporative Cooler Finish - Model",
    "seoNotes": "CFM for area coverage. Type = Portable, Window, Ducted."
  },
  "exhaust_fan": {
    "categoryId": "a01aZ00000dCek6QAC",
    "categoryName": "Exhaust Fan",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {CFM} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 400 CFM Exhaust Fan Finish - Model",
    "seoNotes": "CFM determines air movement. Type = Wall, Ceiling, Inline."
  },
  "heating": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Heating Finish - Model",
    "seoNotes": "BTU for heat output. Fuel = Gas, Electric, Oil, Propane. Type = Furnace, Boiler, Heat Pump."
  },
  "hvac_accessory": {
    "categoryId": "a01aZ00000fKN2RQAW",
    "categoryName": "HVAC Accessory",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue HVAC Accessory Finish - Model",
    "seoNotes": "Type = Grille, Register, Diffuser, Humidistat, Control."
  },
  "indoor_heating": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {BTU/Watts} {Type} {Fuel Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Indoor Heating Finish - Model",
    "seoNotes": "Type = Space Heater, Wall Heater, Baseboard, Radiant."
  },
  "mini_split_air_conditioner": {
    "categoryId": "a01aZ00000dCekBQAS",
    "categoryName": "Mini Split Air Conditioner",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Tonnage/BTU",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Zone Config",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Tonnage/BTU} {Zone Config} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Mini Split Air Conditioner Finish - Model",
    "seoNotes": "BTU for capacity. Zone = Single, Multi (2-zone, 3-zone, etc.)."
  },
  "room_heater": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {BTU/Watts} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Room Heater Finish - Model",
    "seoNotes": "Type = Electric, Gas, Propane, Kerosene. Portable or fixed."
  },
  "skylight": {
    "categoryId": "a01aZ00000dCekDQAS",
    "categoryName": "Skylight",
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
        "attribute": "Dimensions (W×H)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Glazing",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Dimensions (W×H)} {Type} {Glazing} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Skylight Finish - Model",
    "seoNotes": "Dimensions for fit. Type = Fixed, Venting, Tubular."
  },
  "stove_and_chimney_pipe": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Diameter (Inches)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Stove and Chimney Pipe Finish - Model",
    "seoNotes": "Type = Single Wall, Double Wall, Insulated. Diameter for stove."
  },
  "stove_and_fireplace": {
    "categoryId": "a01aZ00000dCekFQAS",
    "categoryName": "Stove and Fireplace",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Stove and Fireplace Finish - Model",
    "seoNotes": "Type = Wood Stove, Pellet Stove, Gas Fireplace, Electric Fireplace."
  },
  "thermostat": {
    "categoryId": "a01aZ00000dCekGQAS",
    "categoryName": "Thermostat",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Thermostat Finish - Model",
    "seoNotes": "Type = Programmable, Smart, Non-Programmable, Manual."
  },
  "patio_heater": {
    "categoryId": "a01aZ00000dCejxQAC",
    "categoryName": "Patio Heater",
    "department": "Heating & Cooling",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Patio Heater Finish - Model",
    "seoNotes": "BTU for heat output. Type = Freestanding, Tabletop, Wall-Mount, Ceiling-Mount."
  },
  "chair": {
    "categoryId": "a01aZ00000XYWwyQAH",
    "categoryName": "Chair",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Chair Finish - Model",
    "seoNotes": "Type = Dining, Accent, Office, Bar Stool, Rocking."
  },
  "outdoor_and_patio_furniture": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Material",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Material} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Outdoor and Patio Furniture Finish - Model",
    "seoNotes": "Type = Dining Set, Lounge, Chair, Table. Material = Metal, Wicker, Wood."
  },
  "home_organization": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Dimensions",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Home Organization Finish - Model",
    "seoNotes": "Type = Closet Organizer, Shelf, Hook, Basket."
  },
  "mirror": {
    "categoryId": "a01aZ00000dCekJQAS",
    "categoryName": "Mirror",
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
        "attribute": "Width×Height",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width×Height} {Type} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Mirror Finish - Model",
    "seoNotes": "Dimensions for space. Type = Wall, Floor, Vanity."
  },
  "rug": {
    "categoryId": "a01aZ00000dCekNQAS",
    "categoryName": "Rug",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Size (W×L)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Material",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Size (W×L)} {Style} {Material} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Rug Finish - Model",
    "seoNotes": "Size critical for room fit. Common: 5×7, 8×10, 9×12."
  },
  "wall_decor": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Dimensions",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Wall Decor Finish - Model",
    "seoNotes": "Type = Art, Mirror, Shelf, Clock."
  },
  "chemicals_compounds": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Size/Volume",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Size/Volume} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Chemicals & Compounds Finish - Model",
    "seoNotes": "Type = Cleaner, Adhesive, Sealant, Paint."
  },
  "commercial_restroom": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Commercial Restroom Finish - Model",
    "seoNotes": "Type = Toilet, Urinal, Sink, Faucet, Partition, Dispenser."
  },
  "hydronic_expansion_tank": {
    "categoryId": "a01aZ00000dFPfcQAG",
    "categoryName": "Hydronic Expansion Tank",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "AC Rating",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Capacity (Gallons)",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {AC Rating} {Category} {Finish} {Capacity (Gallons)} {Model Number}",
    "exampleTitle": "Brand Hydronic Expansion Tank Finish 10-Gallon - Model",
    "seoNotes": "AC rating for compatibility. Capacity at end."
  },
  "industrial_strainer": {
    "categoryId": "a01aZ00000dDRGuQAO",
    "categoryName": "Industrial Strainer",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Connection Size",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Connection Size} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Industrial Strainer Finish - Model",
    "seoNotes": "Type = Floor, Sink, Basket. Connection matches drain."
  },
  "water_fountain": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Water Fountain Finish - Model",
    "seoNotes": "Type = Wall-Mount, Floor-Standing, Bottle-Filler."
  },
  "bathroom_lighting": {
    "categoryId": "a01aZ00000dC5DgQAK",
    "categoryName": "Bathroom Lighting",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Light Count",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Style",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Light Count} {Type} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch SpecValue Bathroom Lighting Finish - Model",
    "seoNotes": "Type = Vanity, Sconce, Ceiling. Width for vanity lights."
  },
  "vanity_lighting": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 2,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Light Count",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Light Count} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch SpecValue Vanity Lighting Finish - Model",
    "seoNotes": "Width matches vanity. Light count for coverage."
  },
  "air_circulator": {
    "categoryId": "a01aZ00000dC5EfQAK",
    "categoryName": "Air Circulator",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {CFM} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 400 CFM Air Circulator Finish - Model",
    "seoNotes": "CFM determines air movement. Type = Pedestal, Tower, Box."
  },
  "attic_fan": {
    "categoryId": "a01aZ00000dC5EgQAK",
    "categoryName": "Attic Fan",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {CFM} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 400 CFM Attic Fan Finish - Model",
    "seoNotes": "CFM for attic ventilation. Type = Powered, Solar, Wind-Driven."
  },
  "ceiling_fan": {
    "categoryId": "a01aZ00000dC5EjQAK",
    "categoryName": "Ceiling Fan",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Blade Span (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Blade Span (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Ceiling Fan Finish - Model",
    "seoNotes": "Blade span determines room size coverage. 52\" most common."
  },
  "chandelier": {
    "categoryId": "a01aZ00000dC5ELQA0",
    "categoryName": "Chandelier",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Diameter (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Light Count",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Diameter (Inches)} {Light Count} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch SpecValue Chandelier Finish - Model",
    "seoNotes": "Diameter + light count are top filters. Style = Modern, Traditional, Transitional."
  },
  "commercial_lighting": {
    "categoryId": "a01aZ00000dC5EMQA0",
    "categoryName": "Commercial Lighting",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Wattage",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Light Count",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Wattage} {Light Count} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Commercial Lighting Finish - Model",
    "seoNotes": "Type = High Bay, Troffer, Panel, Strip. Wattage for brightness."
  },
  "led_lighting": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Wattage",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Color Temp",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Wattage} {Color Temp} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue LED Lighting Finish - Model",
    "seoNotes": "Type determines application. Color Temp = 2700K, 3000K, 4000K, 5000K."
  },
  "light_bulbs": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Wattage Equivalent",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Bulb Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Color Temp",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Wattage Equivalent} {Bulb Type} {Color Temp} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue SpecValue Light Bulbs Finish - Model",
    "seoNotes": "Type = LED, CFL, Incandescent, Halogen. Wattage Equivalent for brightness."
  },
  "light_switches_dimmers": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Light Switches & Dimmers Finish - Model",
    "seoNotes": "Type = Standard, Dimmer, Smart, Motion-Sensor, Timer."
  },
  "lighting_accessory": {
    "categoryId": "a01aZ00000dC5EVQA0",
    "categoryName": "Lighting Accessory",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Lighting Accessory Finish - Model",
    "seoNotes": "Type = Shade, Bulb, Dimmer, Transformer, Mounting Hardware."
  },
  "outdoor_lighting": {
    "categoryId": "a01aZ00000dC5EWQA0",
    "categoryName": "Outdoor Lighting",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Height (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Height (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Outdoor Lighting Finish - Model",
    "seoNotes": "Type = Wall, Post, Hanging, Flood, Spot."
  },
  "post_light": {
    "categoryId": "a01aZ00000dC5EYQA0",
    "categoryName": "Post Light",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Height (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Height (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Post Light Finish - Model",
    "seoNotes": "Height determines visibility. Style for matching."
  },
  "recessed_lighting": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Aperture (Inches)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Recessed Lighting Finish - Model",
    "seoNotes": "Aperture = 4\", 6\", 8\". Type = New Construction, Remodel."
  },
  "step_lighting": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Width (Inches)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Step Lighting Finish - Model",
    "seoNotes": "Type = Wall-Mount, Recessed. For stairs/walkways."
  },
  "track_and_rail_lighting": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 2,
        "attribute": "Track Length (Feet)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Track Length (Feet)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Track and Rail Lighting Finish - Model",
    "seoNotes": "Track length determines coverage."
  },
  "under_cabinet_light": {
    "categoryId": "a01aZ00000dC5EcQAK",
    "categoryName": "Under Cabinet Light",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Length (Inches)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Under Cabinet Light Finish - Model",
    "seoNotes": "Length matches cabinet. Type = LED Strip, Puck, Bar."
  },
  "wall_sconce": {
    "categoryId": "a01aZ00000dC5EeQAK",
    "categoryName": "Wall Sconce",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Style} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Wall Sconce Finish - Model",
    "seoNotes": "Type = Fixed, Swing-Arm, Up/Down. Style + type key."
  },
  "lamp": {
    "categoryId": "a01aZ00000dCekOQAS",
    "categoryName": "Lamp",
    "department": "Lighting & Electrical",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Height (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Height (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Lamp Finish - Model",
    "seoNotes": "Type = Table, Floor, Desk, Buffet."
  },
  "ceiling_light": {
    "categoryId": "a01aZ00000dC5EKQA0",
    "categoryName": "Ceiling Light",
    "department": "Lighting & Electrical",
    "family": "Indoor Lighting",
    "slots": [
      {
        "position": 1,
        "attribute": "Brand",
        "required": true
      },
      {
        "position": 2,
        "attribute": "Diameter (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Diameter (Inches)} {Type} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Ceiling Light Finish - Model",
    "seoNotes": "Type = Flush Mount, Semi-Flush. Style key differentiator."
  },
  "flush_and_semi-flush": {
    "categoryId": "a01aZ00000dC5ENQA0",
    "categoryName": "Flush and Semi-Flush",
    "department": "Lighting & Electrical",
    "family": "Indoor Lighting",
    "slots": [
      {
        "position": 1,
        "attribute": "Brand",
        "required": true
      },
      {
        "position": 2,
        "attribute": "Diameter (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Diameter (Inches)} {Type} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Flush and Semi-Flush Finish - Model",
    "seoNotes": "Type = Flush, Semi-Flush. Diameter for room size."
  },
  "island_lighting": {
    "categoryId": "a01aZ00000dC5EOQA0",
    "categoryName": "Island Lighting",
    "department": "Lighting & Electrical",
    "family": "Indoor Lighting",
    "slots": [
      {
        "position": 1,
        "attribute": "Brand",
        "required": true
      },
      {
        "position": 2,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 2,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Light Count",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Light Count} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch SpecValue Island Lighting Finish - Model",
    "seoNotes": "Width/length must fit island. Multi-light or linear common."
  },
  "pendant": {
    "categoryId": "a01aZ00000dC5EXQA0",
    "categoryName": "Pendant",
    "department": "Lighting & Electrical",
    "family": "Indoor Lighting",
    "slots": [
      {
        "position": 1,
        "attribute": "Brand",
        "required": true
      },
      {
        "position": 2,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 2,
        "attribute": "Diameter (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Diameter (Inches)} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Pendant Finish - Model",
    "seoNotes": "Diameter + style drive search. Mini-pendants common."
  },
  "kitchen_lighting": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Light Count",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Width (Inches)} {Light Count} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Kitchen Lighting Finish - Model",
    "seoNotes": "Type = Island, Pendant, Under Cabinet, Ceiling."
  },
  "landscape_lighting": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Wattage",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Light Count",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Wattage} {Light Count} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Landscape Lighting Finish - Model",
    "seoNotes": "Type = Path, Spot, Flood, Bollard, Well."
  },
  "storage_drawer_door": {
    "categoryId": "a01aZ00000dEXvOQAW",
    "categoryName": "Storage Drawer/Door",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Storage Drawer/Door Finish - Model",
    "seoNotes": "Type = Drawer, Door, Panel. Width for fit."
  },
  "entry_set": {
    "categoryId": "a01aZ00000dCejjQAC",
    "categoryName": "Entry Set",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Entry Set Finish - Model",
    "seoNotes": "Type = Grip Set, Thumblatch Set, Lever Set. Complete entry hardware."
  },
  "exterior_door": {
    "categoryId": "a01aZ00000dCejkQAC",
    "categoryName": "Exterior Door",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Height (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Material",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Height (Inches)} {Type} {Material} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch 30-Inch Exterior Door Finish - Model",
    "seoNotes": "Type = Entry, Patio, Storm, Screen. Material = Wood, Fiberglass, Steel."
  },
  "fire_pit": {
    "categoryId": "a01aZ00000dCejmQAC",
    "categoryName": "Fire Pit",
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
        "attribute": "Diameter (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "BTU",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Type",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Diameter (Inches)} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch 50,000 BTU Fire Pit Finish - Model",
    "seoNotes": "Diameter for size. BTU for heat. Fuel = Gas, Propane, Wood."
  },
  "fire_pit_accessory": {
    "categoryId": "a01aZ00000dCejlQAC",
    "categoryName": "Fire Pit Accessory",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Fire Pit Accessory Finish - Model",
    "seoNotes": "Type = Cover, Screen, Tool Set, Log Holder."
  },
  "garden_decor": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Garden Decor Finish - Model",
    "seoNotes": "Type = Statue, Fountain, Planter, Birdbath, Wind Chime."
  },
  "generator": {
    "categoryId": "a01aZ00000dCejoQAC",
    "categoryName": "Generator",
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
        "attribute": "Power (kW)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Power (kW)} {Fuel Type} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Generator Finish - Model",
    "seoNotes": "kW for capacity. Fuel = Gas, Diesel, Propane. Type = Portable, Standby."
  },
  "hardscaping": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Dimensions",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Hardscaping Finish - Model",
    "seoNotes": "Type = Paver, Retaining Wall, Edging, Stepping Stone."
  },
  "mail_box": {
    "categoryId": "a01aZ00000dCejqQAC",
    "categoryName": "Mail Box",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Mail Box Finish - Model",
    "seoNotes": "Type = Wall-Mount, Post-Mount, Recessed, Locking."
  },
  "outdoor_fireplace": {
    "categoryId": "a01aZ00000dCejsQAC",
    "categoryName": "Outdoor Fireplace",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Fuel Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 50,000 BTU Outdoor Fireplace Finish - Model",
    "seoNotes": "Type = Built-In, Freestanding, Chiminea. Fuel = Gas, Wood."
  },
  "outdoor_kitchen": {
    "categoryId": "a01aZ00000dCejuQAC",
    "categoryName": "Outdoor Kitchen",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Width (Inches)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Outdoor Kitchen Finish - Model",
    "seoNotes": "Type = Island, Cabinet, Cart, Grill Station."
  },
  "outdoor_shower_faucet": {
    "categoryId": "a01aZ00000dCejwQAC",
    "categoryName": "Outdoor Shower Faucet",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Mount",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Mount} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Outdoor Shower Faucet Finish - Model",
    "seoNotes": "Type = Wall-Mount, Post-Mount, Freestanding."
  },
  "bath_fan": {
    "categoryId": "a01aZ00000dC5DcQAK",
    "categoryName": "Bath Fan",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "CFM",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {CFM} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 400 CFM Bath Fan Finish - Model",
    "seoNotes": "CFM for room size ventilation. Sones (noise) also important."
  },
  "bathroom_faucet": {
    "categoryId": "a01aZ00000dC5DeQAK",
    "categoryName": "Bathroom Faucet",
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
        "attribute": "GPM",
        "required": false,
        "format": "{value} GPM"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Hole Config",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Mount",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Hole Config} {Mount} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Bathroom Faucet Finish - Model",
    "seoNotes": "Type = Single-Handle, Widespread, Centerset, Wall-Mount. Hole = Single, 3-Hole, 4-Hole."
  },
  "bathroom_hardware_and_accessories": {
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Bathroom Hardware and Accessories Finish - Model",
    "seoNotes": "Type = Towel Bar, Robe Hook, Paper Holder, Grab Bar, Shelf."
  },
  "bathroom_lighting_(bathroom)": {
    "categoryId": "a01aZ00000hFKH6QAO",
    "categoryName": "Bathroom Lighting (Bathroom)",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Light Count",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Style",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Light Count} {Type} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch SpecValue Bathroom Lighting (Bathroom) Finish - Model",
    "seoNotes": "Duplicate of Bathroom Lighting."
  },
  "bathroom_mirror": {
    "categoryId": "a01aZ00000dC5DhQAK",
    "categoryName": "Bathroom Mirror",
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
        "attribute": "Width×Height",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Style",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width×Height} {Type} {Style} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Bathroom Mirror Finish - Model",
    "seoNotes": "Dimensions for fit. Type = Framed, Frameless, Medicine Cabinet."
  },
  "bathroom_sink": {
    "categoryId": "a01aZ00000dC5DiQAK",
    "categoryName": "Bathroom Sink",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Bowl Config",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Bowl Config} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Bathroom Sink Finish - Model",
    "seoNotes": "Type = Undermount, Vessel, Drop-In, Wall-Mount, Pedestal."
  },
  "bathroom_vanity": {
    "categoryId": "a01aZ00000dC5DjQAK",
    "categoryName": "Bathroom Vanity",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Bathroom Vanity Finish - Model",
    "seoNotes": "Width for bathroom fit. Type = Single Sink, Double Sink, Freestanding, Wall-Mount."
  },
  "bathtub": {
    "categoryId": "a01aZ00000dC5DlQAK",
    "categoryName": "Bathtub",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Material",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Length (Inches)} {Type} {Material} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Bathtub Finish - Model",
    "seoNotes": "Length is primary dimension. Type = Freestanding, Alcove, Drop-In, Corner, Walk-In."
  },
  "bathtub_waste_overflow": {
    "categoryId": "a01aZ00000dC5DkQAK",
    "categoryName": "Bathtub Waste & Overflow",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Bathtub Waste & Overflow Finish - Model",
    "seoNotes": "Type = Standard, Cable-Operated, Push-Button."
  },
  "bidet": {
    "categoryId": "a01aZ00000dC5DoQAK",
    "categoryName": "Bidet",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Bidet Finish - Model",
    "seoNotes": "Type = Floor-Mount, Wall-Hung."
  },
  "bidet_faucet": {
    "categoryId": "a01aZ00000dC5DmQAK",
    "categoryName": "Bidet Faucet",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Hole Config",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Hole Config} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Bidet Faucet Finish - Model",
    "seoNotes": "Type = Wall-Mount, Deck-Mount. Hole = Single, Widespread."
  },
  "bidet_seat": {
    "categoryId": "a01aZ00000dC5DnQAK",
    "categoryName": "Bidet Seat",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Shape} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Bidet Seat Finish - Model",
    "seoNotes": "Shape must match toilet. Type = Electric, Non-Electric."
  },
  "medicine_cabinet": {
    "categoryId": "a01aZ00000dC5DqQAK",
    "categoryName": "Medicine Cabinet",
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
        "attribute": "Width×Height",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width×Height} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Medicine Cabinet Finish - Model",
    "seoNotes": "Type = Recessed, Surface-Mount. Dimensions for bathroom fit."
  },
  "rough-in_valve": {
    "categoryId": "a01aZ00000dC5DrQAK",
    "categoryName": "Rough-In Valve",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Connection Size",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Connection Size} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Rough-In Valve Finish - Model",
    "seoNotes": "Type = Shower, Tub/Shower, Thermostatic. Connection = 1/2\", 3/4\"."
  },
  "shower": {
    "categoryId": "a01aZ00000dC5DuQAK",
    "categoryName": "Shower",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Shower Finish - Model",
    "seoNotes": "Type = Shower System, Shower Head, Shower Panel, Hand Shower, Shower Column, Body Spray."
  },
  "shower_faucet": {
    "categoryId": "a01aZ00000dC5DtQAK",
    "categoryName": "Shower Faucet",
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
        "attribute": "GPM",
        "required": false,
        "format": "{value} GPM"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Function",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Function} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Shower Faucet Finish - Model",
    "seoNotes": "Type = Valve, Trim Kit, Complete System. Function = Thermostatic, Pressure-Balance, Diverter."
  },
  "steam_shower": {
    "categoryId": "a01aZ00000dC5DvQAK",
    "categoryName": "Steam Shower",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Power (kW)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Power (kW)} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Steam Shower Finish - Model",
    "seoNotes": "Power determines room size coverage."
  },
  "toilet": {
    "categoryId": "a01aZ00000dC5DyQAK",
    "categoryName": "Toilet",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Bowl Shape",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Flush Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Bowl Shape} {Flush Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue SpecValue Toilet Finish - Model",
    "seoNotes": "Type = One-Piece, Two-Piece, Wall-Hung. Bowl = Elongated, Round. Flush = Dual, Single."
  },
  "toilet_seat": {
    "categoryId": "a01aZ00000dC5DxQAK",
    "categoryName": "Toilet Seat",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Shape} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue TypeValue Toilet Seat Finish - Model",
    "seoNotes": "Shape = Elongated, Round. Type = Standard, Slow-Close, Heated, Bidet."
  },
  "tub_faucet": {
    "categoryId": "a01aZ00000dC5DzQAK",
    "categoryName": "Tub Faucet",
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
        "attribute": "GPM",
        "required": false,
        "format": "{value} GPM"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Mount",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Mount} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Tub Faucet Finish - Model",
    "seoNotes": "Type = Roman Tub, Deck-Mount, Floor-Mount, Wall-Mount."
  },
  "urinal": {
    "categoryId": "a01aZ00000dC5E0QAK",
    "categoryName": "Urinal",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Flush Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Flush Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Urinal Finish - Model",
    "seoNotes": "Type = Wall-Mount, Floor-Mount. Flush = Waterless, Manual, Touchless."
  },
  "drainage_waste": {
    "categoryId": "a01aZ00000dhf6HQAQ",
    "categoryName": "Drainage & Waste",
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Connection Size",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Connection Size} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Drainage & Waste Finish - Model",
    "seoNotes": "Type = P-Trap, S-Trap, Drain Assembly, Strainer."
  },
  "pipe_fitting": {
    "categoryId": "a01aZ00000eF8O3QAK",
    "categoryName": "Pipe Fitting",
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
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Connection Size",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Connection Size} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Pipe Fitting Finish - Model",
    "seoNotes": "Type = Elbow, Tee, Coupling, Adapter. Connection = 1/2\", 3/4\", 1\"."
  },
  "backsplash_kitchen_tile": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Material",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Tile Size} {Material} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Backsplash Kitchen Tile Finish - Model",
    "seoNotes": "Smaller format tiles common. Material = Glass, Ceramic, Stone."
  },
  "bar_prep_sink": {
    "categoryId": "a01aZ00000dC5E2QAK",
    "categoryName": "Bar & Prep Sink",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Bowl Config",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Material",
        "required": false
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
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Width (Inches)} {Bowl Config} {Material} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Bar & Prep Sink Finish - Model",
    "seoNotes": "Smaller than kitchen sink. Bowl = Single, Double."
  },
  "bar_faucet": {
    "categoryId": "a01aZ00000dC5E3QAK",
    "categoryName": "Bar Faucet",
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
        "attribute": "GPM",
        "required": false,
        "format": "{value} GPM"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Hole Config",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Hole Config} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Bar Faucet Finish - Model",
    "seoNotes": "Type = Single-Handle, Pull-Down. Usually single-hole."
  },
  "food_service_faucet": {
    "categoryId": "a01aZ00000dC5E5QAK",
    "categoryName": "Food Service Faucet",
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
        "attribute": "GPM",
        "required": false,
        "format": "{value} GPM"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Mount",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Mount} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Food Service Faucet Finish - Model",
    "seoNotes": "Type = Pot Filler, Pre-Rinse, Commercial. Mount = Deck, Wall."
  },
  "garbage_disposal": {
    "categoryId": "a01aZ00000dC5E6QAK",
    "categoryName": "Garbage Disposal",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Horsepower",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Feed Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Horsepower} {Feed Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Garbage Disposal Finish - Model",
    "seoNotes": "HP determines grinding power. Feed Type = Continuous, Batch."
  },
  "hot_cold_water_dispenser": {
    "categoryId": "a01aZ00000dC5E7QAK",
    "categoryName": "Hot & Cold Water Dispenser",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Capacity (Gallons)",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Capacity (Gallons)} {Model Number}",
    "exampleTitle": "Brand Countertop Hot & Cold Water Dispenser Finish 5-Gallon - Model",
    "seoNotes": "Type = Countertop, Under-Sink, Built-In. Capacity at end."
  },
  "kitchen_accessory": {
    "categoryId": "a01aZ00000dC5E8QAK",
    "categoryName": "Kitchen Accessory",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Kitchen Accessory Finish - Model",
    "seoNotes": "Type = Sink Grid, Cutting Board, Colander, Soap Dispenser."
  },
  "kitchen_faucet": {
    "categoryId": "a01aZ00000dC5E9QAK",
    "categoryName": "Kitchen Faucet",
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
        "attribute": "GPM",
        "required": false,
        "format": "{value} GPM"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Hole Config",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Hole Config} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Kitchen Faucet Finish - Model",
    "seoNotes": "Type = Pull-Down, Pull-Out, High-Arc, Commercial, Bridge. Hole = Single, 3-Hole, Widespread."
  },
  "kitchen_furniture_and_decor": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Dimensions",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Kitchen Furniture and Decor Finish - Model",
    "seoNotes": "Type = Island, Cart, Table, Bar Stool."
  },
  "kitchen_sink": {
    "categoryId": "a01aZ00000dC5EDQA0",
    "categoryName": "Kitchen Sink",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Bowl Config",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Material",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Bowl Config} {Material} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Kitchen Sink Finish - Model",
    "seoNotes": "Width for fit. Bowl = Single, Double, Triple. Material = Stainless, Cast Iron, Composite."
  },
  "kitchen_sink_combo": {
    "categoryId": "a01aZ00000dC5ECQA0",
    "categoryName": "Kitchen Sink Combo",
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
        "required": false
      },
      {
        "position": 2,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Bowl Config",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Bowl Config} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Kitchen Sink Combo Finish - Model",
    "seoNotes": "Sink + faucet combo. Width and bowl config critical."
  },
  "kitchen_storage_organization": {
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Dimensions",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Kitchen Storage & Organization Finish - Model",
    "seoNotes": "Type = Pot Rack, Spice Rack, Utensil Holder, Drawer Organizer."
  },
  "pot_filler_faucet": {
    "categoryId": "a01aZ00000dC5EHQA0",
    "categoryName": "Pot Filler Faucet",
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
        "attribute": "GPM",
        "required": false,
        "format": "{value} GPM"
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Mount",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Mount} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Pot Filler Faucet Finish - Model",
    "seoNotes": "Type = Deck-Mount, Wall-Mount. Always near range."
  },
  "water_filtration": {
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
        "attribute": "Filtration Level",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 5,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 6,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Filtration Level} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand SpecValue Water Filtration Finish - Model",
    "seoNotes": "Filtration = Micron rating. Type = Under-Sink, Faucet-Mount, Whole-House, RO."
  },
  "laundry_sink": {
    "categoryId": "a01aZ00000dC5ESQA0",
    "categoryName": "Laundry Sink",
    "department": "Plumbing & Bath",
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
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Bowl Config",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Bowl Config} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Laundry Sink Finish - Model",
    "seoNotes": "Type = Drop-In, Undermount, Freestanding. Bowl = Single, Double."
  },
  "utility_sink": {
    "categoryId": "a01aZ00000dC5EXQA0",
    "categoryName": "Utility Sink",
    "department": "Plumbing & Bath",
    "family": "Utility",
    "slots": [
      {
        "position": 1,
        "attribute": "Brand",
        "required": true
      },
      {
        "position": 2,
        "attribute": "Width (Inches)",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 4,
        "attribute": "Material",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 6,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 7,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Width (Inches)} {Type} {Material} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand 30-Inch Utility Sink Finish - Model",
    "seoNotes": "Type = Wall-Mount, Freestanding, Drop-In."
  },
  "home_accents": {
    "categoryId": "a01aZ00000dCekMQAS",
    "categoryName": "Home Accents",
    "department": "Home Decor",
    "family": "Decor",
    "slots": [
      {
        "position": 1,
        "attribute": "Brand",
        "required": true
      },
      {
        "position": 2,
        "attribute": "Type",
        "required": false
      },
      {
        "position": 3,
        "attribute": "Category",
        "required": true
      },
      {
        "position": 4,
        "attribute": "Finish",
        "required": false
      },
      {
        "position": 5,
        "attribute": "Model Number",
        "required": false
      }
    ],
    "template": "{Brand} {Type} {Category} {Finish} {Model Number}",
    "exampleTitle": "Brand TypeValue Home Accents Finish - Model",
    "seoNotes": "Type = Vase, Candle Holder, Decorative Bowl, Sculpture."
  }
};

/**
 * Get title schema for a category (case-insensitive lookup)
 */
export function getCategoryTitleSchema(categoryName: string): CategoryTitleSchema | null {
  const normalized = categoryName.toLowerCase().replace(/\s+/g, '_').replace(/[/&]/g, '_').replace(/__+/g, '_');
  return CATEGORY_TITLE_SCHEMAS[normalized] || null;
}

export default {
  CATEGORY_TITLE_SCHEMAS,
  getCategoryTitleSchema,
  FORMATTING_RULES,
  ATTRIBUTE_FORMATTERS
};
