/**
 * CATEGORY SIZE CLASSES CONFIGURATION
 * ====================================
 * 
 * Industry-standard measurement classes for product categories.
 * Used by title generation to round dimensions to standard sizes.
 * 
 * Created: 2026-03-03
 * Purpose: Fix dimension rounding (e.g., 47.25" refrigerator → "48-Inch" title)
 * 
 * ROUNDING STRATEGY:
 * - Dimensions (Width, Height): Round to NEAREST standard size
 * - Performance Ratings (CFM, BTU, GPM): Use EXACT value (manufacturer spec)
 * - Capacities (Gallons, Cu Ft): Round to NEAREST
 * 
 * STORAGE vs DISPLAY:
 * - Store EXACT measurements in database (47.25")
 * - Round ONLY when generating titles ("48-Inch")
 */

export interface CategorySizeClass {
  category_name: string;
  category_id: string;
  department: string;
  has_measurement_class: boolean;
  measurement_dimension: string | null;  // "Width", "Height", "CFM", etc.
  measurement_unit: string | null;       // "inches", "CFM", "gallons", etc.
  classes: string[];                     // Standard size values (can include fractions)
  rounding_method: 'NEAREST' | 'EXACT';  // NEAREST = round to closest, EXACT = use as-is
  installation_dependent?: boolean;       // If true, Built-In may round differently
  notes: string;
}

/**
 * ⚠️ PERFORMANCE RATINGS (CFM, BTU, GPM) - USER DECISION NEEDED
 * 
 * Currently set to 'EXACT' to preserve manufacturer specs:
 * - Example: 385 CFM stays "385 CFM" (not rounded to 400)
 * - Rationale: Customers compare exact performance numbers
 * 
 * If you want rounding (385 → 400), change rounding_method to 'NEAREST'
 */

/**
 * Master size class configuration by department
 */
export const CATEGORY_SIZE_CLASSES_BY_DEPARTMENT = [
  {
    "department": "Appliances",
    "categories": [
      {
        "category_name": "Barbeque",
        "category_id": "a01Hu000011kgEqIAI",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "30", "36", "42", "48", "54"],
        "rounding_method": "NEAREST" as const,
        "notes": "Grill body width; industry standard for built-in and freestanding"
      },
      {
        "category_name": "Coffee Maker",
        "category_id": "a01Hu000011kmDGIAY",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Cup Capacity",
        "measurement_unit": "cups",
        "classes": ["4", "6", "8", "10", "12", "14"],
        "rounding_method": "NEAREST" as const,
        "notes": "Standard carafe sizes; also consider single-serve as its own class"
      },
      {
        "category_name": "Cooktop",
        "category_id": "a01Hu000010Q5EhIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["12", "15", "24", "30", "36", "42", "48"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "Cutout/counter width; 30 and 36 are the most common residential"
      },
      {
        "category_name": "Dishwasher",
        "category_id": "a01Hu000010Q5EiIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["18", "24"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "18\" compact, 24\" standard; nearly all residential are 24\""
      },
      {
        "category_name": "Drawer",
        "category_id": "a01Hu000011kpC2IAI",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "30", "36"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "Undercounter drawer width; matches cabinetry openings"
      },
      {
        "category_name": "Freezer",
        "category_id": "a01Hu000010Q5EkIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["18", "24", "30", "36"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "Standalone/column freezer width"
      },
      {
        "category_name": "Icemaker",
        "category_id": "a01Hu000011kFRfIAM",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["15", "18", "24"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "Undercounter ice maker width"
      },
      {
        "category_name": "Microwave",
        "category_id": "a01Hu000010Q5ElIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "27", "30"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "Over-the-range and built-in width; 30\" is most common"
      },
      {
        "category_name": "Oven",
        "category_id": "a01Hu000010Q5EmIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "27", "30", "36", "48"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "Wall oven cutout width; single and double configurations"
      },
      {
        "category_name": "Pizza Oven",
        "category_id": "a01aZ00000KJFrCQAX",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Cooking Surface",
        "measurement_unit": "inches",
        "classes": ["12", "16", "20", "24"],
        "rounding_method": "NEAREST" as const,
        "notes": "Interior cooking surface diameter/width"
      },
      {
        "category_name": "Range",
        "category_id": "a01Hu000010Q5EnIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["20", "24", "30", "36", "48", "60"],
        "rounding_method": "NEAREST" as const,
        "notes": "Freestanding/slide-in total width; 30\" is standard residential"
      },
      {
        "category_name": "Range Hood",
        "category_id": "a01Hu000010Q5EoIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "30", "36", "42", "48", "54", "60"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "Should match or exceed cooktop/range width"
      },
      {
        "category_name": "Refrigerator",
        "category_id": "a01Hu000010Q5EpIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "28", "30", "33", "36", "42", "48"],
        "rounding_method": "NEAREST" as const,
        "installation_dependent": true,
        "notes": "Overall width; 36\" is standard full-size, 42/48 are built-in/pro"
      },
      {
        "category_name": "All in One Washer / Dryer",
        "category_id": "a01Hu000010Q5EqIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "27"],
        "rounding_method": "NEAREST" as const,
        "notes": "24\" compact/ventless, 27\" standard"
      },
      {
        "category_name": "Dryer",
        "category_id": "a01Hu000010Q5EjIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "27", "29"],
        "rounding_method": "NEAREST" as const,
        "notes": "24\" compact, 27\" standard, 29\" large capacity"
      },
      {
        "category_name": "Standalone Pedestal",
        "category_id": "a01Hu000010Q5ErIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["27", "29"],
        "rounding_method": "NEAREST" as const,
        "notes": "Must match washer/dryer width"
      },
      {
        "category_name": "Washer",
        "category_id": "a01Hu000010Q5EsIAK",
        "department": "Appliances",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["24", "27", "29"],
        "rounding_method": "NEAREST" as const,
        "notes": "24\" compact, 27\" standard, 29\" large capacity"
      }
    ]
  },
  {
    "department": "Flooring",
    "categories": [
      {
        "category_name": "Hardwood Flooring",
        "category_id": "a01aZ00000dCekSQAS",
        "department": "Flooring",
        "has_measurement_class": true,
        "measurement_dimension": "Plank Width",
        "measurement_unit": "inches",
        "classes": ["2-1/4", "3-1/4", "4", "5", "6", "7", "8"],
        "rounding_method": "NEAREST" as const,
        "notes": "Strip (≤3\") vs plank (>3\"); wide plank is trending"
      },
      {
        "category_name": "Laminate Flooring",
        "category_id": "a01aZ00000dCekTQAS",
        "department": "Flooring",
        "has_measurement_class": true,
        "measurement_dimension": "Plank Width",
        "measurement_unit": "inches",
        "classes": ["5", "6", "7", "8", "10", "12"],
        "rounding_method": "NEAREST" as const,
        "notes": "Modern laminate trends wider; also comes in tile-look dimensions"
      },
      {
        "category_name": "Luxury Vinyl Flooring",
        "category_id": "a01aZ00000dCekRQAS",
        "department": "Flooring",
        "has_measurement_class": true,
        "measurement_dimension": "Plank Width",
        "measurement_unit": "inches",
        "classes": ["6", "7", "8", "9", "12"],
        "rounding_method": "NEAREST" as const,
        "notes": "LVP plank width; LVT tiles use separate tile size classes"
      },
      {
        "category_name": "Tile",
        "category_id": "a01aZ00000dCekQQAS",
        "department": "Flooring",
        "has_measurement_class": true,
        "measurement_dimension": "Tile Size",
        "measurement_unit": "inches",
        "classes": ["1x1", "2x2", "3x6", "4x4", "4x12", "6x6", "6x24", "6x36", "8x8", "12x12", "12x24", "16x16", "18x18", "24x24", "24x48"],
        "rounding_method": "NEAREST" as const,
        "notes": "Format is WxL; mosaics (≤2x2), subway, standard, large format (≥24x24)"
      },
      {
        "category_name": "Waterproof Flooring",
        "category_id": "a01aZ00000dCekWQAS",
        "department": "Flooring",
        "has_measurement_class": true,
        "measurement_dimension": "Plank Width",
        "measurement_unit": "inches",
        "classes": ["6", "7", "8", "9", "12"],
        "rounding_method": "NEAREST" as const,
        "notes": "Typically SPC/WPC; similar classes to LVP"
      },
      {
        "category_name": "Kitchen Tile",
        "category_id": "a01aZ00000dC5EFQA0",
        "department": "Flooring",
        "has_measurement_class": true,
        "measurement_dimension": "Tile Size",
        "measurement_unit": "inches",
        "classes": ["1x1", "2x2", "3x6", "4x4", "4x12", "6x6", "6x24", "8x8", "12x12", "12x24", "16x16", "18x18", "24x24"],
        "rounding_method": "NEAREST" as const,
        "notes": "Same tile size classes; kitchen floors trend toward larger formats"
      },
      {
        "category_name": "Carpet",
        "category_id": "NEEDS_SF_ID",
        "department": "Flooring",
        "has_measurement_class": true,
        "measurement_dimension": "Roll Width",
        "measurement_unit": "feet",
        "classes": ["12", "13.5", "15"],
        "rounding_method": "NEAREST" as const,
        "notes": "Standard broadloom roll widths; also consider carpet tile (18x18, 24x24)"
      }
    ]
  },
  {
    "department": "Heating & Cooling",
    "categories": [
      {
        "category_name": "Bath Fan",
        "category_id": "a01aZ00000dC5DcQAK",
        "department": "Heating & Cooling",
        "has_measurement_class": true,
        "measurement_dimension": "CFM",
        "measurement_unit": "CFM",
        "classes": ["50", "80", "100", "110", "150", "200", "250", "300"],
        "rounding_method": "EXACT" as const,
        "notes": "Code minimum ~1 CFM per sq ft of bathroom; USE EXACT manufacturer rating"
      },
      {
        "category_name": "Exhaust Fan",
        "category_id": "a01aZ00000dCek6QAC",
        "department": "Heating & Cooling",
        "has_measurement_class": true,
        "measurement_dimension": "CFM",
        "measurement_unit": "CFM",
        "classes": ["50", "80", "100", "110", "150", "200", "250", "300"],
        "rounding_method": "EXACT" as const,
        "notes": "Ventilation capacity; USE EXACT manufacturer rating"
      },
      {
        "category_name": "Range Hood",
        "category_id": "a01Hu000010Q5EoIAK",
        "department": "Heating & Cooling",
        "has_measurement_class": true,
        "measurement_dimension": "CFM",
        "measurement_unit": "CFM",
        "classes": ["300", "400", "600", "900", "1200"],
        "rounding_method": "EXACT" as const,
        "notes": "Airflow capacity; USE EXACT manufacturer rating"
      },
      {
        "category_name": "Tankless Water Heater",
        "category_id": "a01aZ00000dC5DwQAK",
        "department": "Heating & Cooling",
        "has_measurement_class": true,
        "measurement_dimension": "Flow Rate",
        "measurement_unit": "GPM",
        "classes": ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
        "rounding_method": "EXACT" as const,
        "notes": "Gallons per minute at specified temp rise; USE EXACT manufacturer rating"
      },
      {
        "category_name": "Water Heater",
        "category_id": "a01aZ00000bI2srQAC",
        "department": "Heating & Cooling",
        "has_measurement_class": true,
        "measurement_dimension": "Tank Capacity",
        "measurement_unit": "gallons",
        "classes": ["20", "30", "38", "40", "50", "55", "65", "75", "80", "100"],
        "rounding_method": "NEAREST" as const,
        "notes": "Standard tank sizes; 40 and 50 gal are most common residential"
      }
    ]
  },
  {
    "department": "Plumbing & Bath",
    "categories": [
      {
        "category_name": "Kitchen Faucet",
        "category_id": "a01aZ00000dC5E9QAK",
        "department": "Plumbing & Bath",
        "has_measurement_class": true,
        "measurement_dimension": "GPM",
        "measurement_unit": "GPM",
        "classes": ["1.5", "1.8", "2.2"],
        "rounding_method": "EXACT" as const,
        "notes": "Flow rate; WaterSense regulated; USE EXACT manufacturer rating"
      },
      {
        "category_name": "Bathroom Faucet",
        "category_id": "a01aZ00000dC5DeQAK",
        "department": "Plumbing & Bath",
        "has_measurement_class": true,
        "measurement_dimension": "GPM",
        "measurement_unit": "GPM",
        "classes": ["1.2", "1.5", "2.2"],
        "rounding_method": "EXACT" as const,
        "notes": "Flow rate; WaterSense regulated; USE EXACT manufacturer rating"
      },
      {
        "category_name": "Bathroom Vanity",
        "category_id": "a01aZ00000dC5DjQAK",
        "department": "Plumbing & Bath",
        "has_measurement_class": true,
        "measurement_dimension": "Width",
        "measurement_unit": "inches",
        "classes": ["18", "20", "24", "30", "36", "42", "48", "60", "72", "80", "84", "96"],
        "rounding_method": "NEAREST" as const,
        "notes": "Cabinet width; single sink ≤48\", double sink 60\"+"
      },
      {
        "category_name": "Bathtub",
        "category_id": "a01aZ00000dC5DlQAK",
        "department": "Plumbing & Bath",
        "has_measurement_class": true,
        "measurement_dimension": "Length",
        "measurement_unit": "inches",
        "classes": ["48", "54", "60", "66", "67", "70", "72", "73", "74", "75", "76", "78"],
        "rounding_method": "NEAREST" as const,
        "notes": "Alcove standard is 60\"; freestanding ranges 54-78\"; common sizes: 60, 66, 67, 70, 72, 73, 74, 75, 76, 78"
      }
    ]
  }
];

/**
 * Flattened lookup by category name (case-insensitive)
 */
export const CATEGORY_SIZE_CLASSES: Record<string, CategorySizeClass> = {};

// Build the lookup map
CATEGORY_SIZE_CLASSES_BY_DEPARTMENT.forEach(dept => {
  dept.categories.forEach(cat => {
    const key = cat.category_name.toLowerCase();
    CATEGORY_SIZE_CLASSES[key] = cat as CategorySizeClass;
  });
});

/**
 * Flattened lookup by category ID
 */
export const CATEGORY_SIZE_CLASSES_BY_ID: Record<string, CategorySizeClass> = {};

// Build the ID lookup map
CATEGORY_SIZE_CLASSES_BY_DEPARTMENT.forEach(dept => {
  dept.categories.forEach(cat => {
    CATEGORY_SIZE_CLASSES_BY_ID[cat.category_id] = cat as CategorySizeClass;
  });
});

/**
 * Get size class configuration by category ID or name
 * @param categoryIdOrName - Category ID (e.g., "a01Hu000010Q5EpIAK") or name (e.g., "Refrigerator")
 * @returns Size class configuration or null if not found
 */
export function getSizeClassConfig(categoryIdOrName: string): CategorySizeClass | null {
  if (!categoryIdOrName) return null;
  
  // Try by ID first
  if (CATEGORY_SIZE_CLASSES_BY_ID[categoryIdOrName]) {
    return CATEGORY_SIZE_CLASSES_BY_ID[categoryIdOrName];
  }
  
  // Try by name (case-insensitive)
  const key = categoryIdOrName.toLowerCase();
  return CATEGORY_SIZE_CLASSES[key] || null;
}

/**
 * Get size classes array for a category
 * @param categoryIdOrName - Category ID or name
 * @returns Array of standard size values, or null if no size classes
 */
export function getSizeClasses(categoryIdOrName: string): string[] | null {
  const config = getSizeClassConfig(categoryIdOrName);
  if (!config || !config.has_measurement_class) {
    return null;
  }
  return config.classes;
}

/**
 * Check if a category has size classes
 */
export function hasSizeClasses(categoryIdOrName: string): boolean {
  const config = getSizeClassConfig(categoryIdOrName);
  return config?.has_measurement_class ?? false;
}

/**
 * Get all categories with size classes (for validation/auditing)
 */
export function getAllCategoriesWithSizeClasses(): CategorySizeClass[] {
  return Object.values(CATEGORY_SIZE_CLASSES).filter(c => c.has_measurement_class);
}
