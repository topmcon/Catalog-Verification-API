/**
 * Category-Specific Attribute Schemas
 * Contains the required/optional attributes for each product category
 * Based on the provided category schema JSON
 */

export interface CategoryAttributeConfig {
  categoryName: string;
  department: string;
  rowCount?: number;
  attributeCount?: number;
  top15FilterAttributes: string[];
  htmlTableAttributes: string[];
  taxonomyTiers: {
    tier1: string;
    tier2: string;
    tier3: string;
    tier4?: string;
  };
}

/**
 * APPLIANCES DEPARTMENT
 */
export const REFRIGERATOR_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Refrigerator',
  department: 'Appliances',
  rowCount: 581,
  attributeCount: 118,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Configuration (French Door, Side-by-Side, Top Freezer, Bottom Freezer)',
    'Installation Type (Built-In, Freestanding, Counter-Depth)',
    'Total Capacity (Cu. Ft.)',
    'Refrigerator Capacity (Cu. Ft.)',
    'Freezer Capacity (Cu. Ft.)',
    'Finish/Color',
    'Ice Maker',
    'Water Dispenser',
    'Panel Ready',
    'Depth (inches)',
    'Height (inches)',
    'Number of Doors',
    'Energy Star Certified'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Configuration', 'Installation Type', 'Total Capacity',
    'Refrigerator Capacity', 'Freezer Capacity', 'Finish',
    'Ice Maker', 'Water Dispenser', 'Panel Ready',
    'Number of Doors', 'Shelves', 'Door Bins', 'Crisper Drawers',
    'Temperature Zones', 'Smart Features', 'WiFi Enabled',
    'Energy Star', 'Annual Energy Cost', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Refrigeration',
    tier3: 'Refrigerators',
    tier4: 'Full-Size Refrigerators'
  }
};

export const DISHWASHER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Dishwasher',
  department: 'Appliances',
  rowCount: 224,
  attributeCount: 63,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Installation Type (Built-In, Portable, Drawer)',
    'Control Location (Top, Front)',
    'Tub Material (Stainless Steel, Plastic)',
    'Decibel Level (dB)',
    'Number of Place Settings',
    'Number of Wash Cycles',
    'Finish/Color',
    'Panel Ready',
    'Third Rack',
    'Adjustable Upper Rack',
    'Soil Sensor',
    'Energy Star Certified',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Installation Type', 'Control Location', 'Tub Material',
    'Decibel Level', 'Place Settings', 'Wash Cycles',
    'Dry System', 'Third Rack', 'Adjustable Racks',
    'Finish', 'Panel Ready', 'WiFi Enabled', 'Smart Features',
    'Energy Star', 'Water Usage', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen Appliances',
    tier3: 'Dishwashers'
  }
};

export const RANGE_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Range',
  department: 'Appliances',
  rowCount: 157,
  attributeCount: 132,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Fuel Type (Gas, Electric, Dual Fuel, Induction)',
    'Installation Type (Freestanding, Slide-In, Drop-In)',
    'Number of Burners',
    'Oven Capacity (Cu. Ft.)',
    'Convection',
    'Self-Cleaning',
    'Finish/Color',
    'Continuous Grates',
    'Double Oven',
    'Griddle',
    'Warming Drawer',
    'BTU Output (Highest Burner)',
    'Smart Features'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Fuel Type', 'Installation Type', 'Number of Burners',
    'Burner Configuration', 'BTU Range', 'Oven Capacity',
    'Convection Type', 'Self-Cleaning', 'Finish',
    'Continuous Grates', 'Griddle', 'Double Oven',
    'Warming Drawer', 'Smart Features', 'WiFi Enabled',
    'Sabbath Mode', 'Voltage', 'Gas Connection', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen Appliances',
    tier3: 'Ranges',
    tier4: 'Freestanding Ranges'
  }
};

export const OVEN_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Oven',
  department: 'Appliances',
  rowCount: 244,
  attributeCount: 80,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Fuel Type (Gas, Electric)',
    'Installation Type (Single Wall, Double Wall, Combination)',
    'Oven Configuration (Single, Double, Microwave Combo)',
    'Oven Capacity (Cu. Ft.)',
    'Convection',
    'Self-Cleaning',
    'Finish/Color',
    'Steam Cooking',
    'Air Fry',
    'Sabbath Mode',
    'Touch Controls',
    'Smart Features',
    'WiFi Enabled'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Fuel Type', 'Installation Type', 'Configuration',
    'Total Capacity', 'Upper Oven Capacity', 'Lower Oven Capacity',
    'Convection Type', 'Self-Cleaning', 'Steam Function',
    'Air Fry', 'Finish', 'Control Type', 'Smart Features',
    'WiFi Enabled', 'Sabbath Mode', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen Appliances',
    tier3: 'Ovens',
    tier4: 'Wall Ovens'
  }
};

export const COOKTOP_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Cooktop',
  department: 'Appliances',
  rowCount: 178,
  attributeCount: 72,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Fuel Type (Gas, Electric, Induction)',
    'Number of Burners/Elements',
    'Installation Type (Drop-In, Slide-In)',
    'Control Location (Top, Front, Knobs)',
    'BTU Output (Highest Burner)',
    'Finish/Color',
    'Continuous Grates',
    'Downdraft',
    'Griddle',
    'Bridge Element',
    'Power Boost',
    'Simmer Burner',
    'Child Lock'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Depth',
    'Fuel Type', 'Number of Burners', 'Burner Sizes',
    'BTU Range', 'Control Location', 'Finish',
    'Continuous Grates', 'Downdraft', 'Griddle',
    'Bridge Element', 'WiFi Enabled', 'Voltage',
    'Gas Connection Type', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen Appliances',
    tier3: 'Cooktops'
  }
};

export const MICROWAVE_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Microwave',
  department: 'Appliances',
  rowCount: 156,
  attributeCount: 58,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Installation Type (Over-the-Range, Built-In, Countertop, Drawer)',
    'Capacity (Cu. Ft.)',
    'Wattage',
    'Finish/Color',
    'Convection',
    'Sensor Cooking',
    'Ventilation CFM',
    'Turntable',
    'Interior Light',
    'Child Lock',
    'Smart Features',
    'WiFi Enabled',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Installation Type', 'Capacity', 'Wattage',
    'Ventilation CFM', 'Convection', 'Sensor Cooking',
    'Finish', 'Turntable Size', 'Smart Features',
    'WiFi Enabled', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen Appliances',
    tier3: 'Microwaves'
  }
};

export const RANGE_HOOD_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Range Hood',
  department: 'Appliances',
  rowCount: 312,
  attributeCount: 65,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Hood Type (Wall Mount, Island, Under Cabinet, Insert/Liner)',
    'CFM (Airflow)',
    'Ducted/Ductless',
    'Number of Speeds',
    'Finish/Color',
    'Material',
    'Noise Level (Sones)',
    'Lighting Type',
    'Heat Lamp',
    'Baffle Filters',
    'Dishwasher Safe Filters',
    'Remote Control',
    'Auto Shutoff'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Hood Type', 'CFM', 'Ducted/Ductless', 'Duct Size',
    'Number of Speeds', 'Noise Level', 'Finish', 'Material',
    'Lighting', 'Filter Type', 'Remote Control',
    'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen Appliances',
    tier3: 'Range Hoods & Ventilation'
  }
};

export const WASHER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Washer',
  department: 'Appliances',
  rowCount: 189,
  attributeCount: 78,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Configuration (Front Load, Top Load)',
    'Capacity (Cu. Ft.)',
    'Number of Wash Cycles',
    'Finish/Color',
    'Steam Function',
    'Stackable',
    'Pedestal Compatible',
    'Smart Features',
    'WiFi Enabled',
    'Energy Star Certified',
    'ADA Compliant',
    'Vibration Reduction',
    'Internal Heater'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Configuration', 'Capacity', 'Wash Cycles', 'Spin Speed',
    'Steam Function', 'Finish', 'Stackable', 'Pedestal Compatible',
    'Smart Features', 'WiFi Enabled', 'Energy Star',
    'Water Usage', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Laundry',
    tier3: 'Washers'
  }
};

export const DRYER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Dryer',
  department: 'Appliances',
  rowCount: 175,
  attributeCount: 68,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Fuel Type (Gas, Electric)',
    'Configuration (Front Load, Top Load)',
    'Capacity (Cu. Ft.)',
    'Number of Dry Cycles',
    'Finish/Color',
    'Steam Function',
    'Stackable',
    'Pedestal Compatible',
    'Moisture Sensor',
    'Smart Features',
    'WiFi Enabled',
    'Energy Star Certified',
    'Reversible Door'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Fuel Type', 'Configuration', 'Capacity', 'Dry Cycles',
    'Steam Function', 'Finish', 'Stackable', 'Pedestal Compatible',
    'Moisture Sensor', 'Smart Features', 'WiFi Enabled',
    'Exhaust Type', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Laundry',
    tier3: 'Dryers'
  }
};

export const FREEZER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Freezer',
  department: 'Appliances',
  rowCount: 98,
  attributeCount: 52,
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Configuration (Upright, Chest)',
    'Installation Type (Built-In, Freestanding)',
    'Capacity (Cu. Ft.)',
    'Finish/Color',
    'Defrost Type (Manual, Frost-Free)',
    'Interior Lighting',
    'Door Alarm',
    'Temperature Alarm',
    'Adjustable Shelves',
    'Lock',
    'Energy Star Certified',
    'Garage Ready',
    'Convertible (Freezer to Refrigerator)'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Configuration', 'Installation Type', 'Capacity',
    'Defrost Type', 'Finish', 'Shelves', 'Baskets',
    'Interior Light', 'Lock', 'Temperature Control',
    'Energy Star', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Refrigeration',
    tier3: 'Freezers'
  }
};

/**
 * PLUMBING & BATH DEPARTMENT
 */
export const KITCHEN_SINK_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Kitchen Sinks #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Depth',
    'Material (Stainless Steel, Fireclay, Granite Composite, Cast Iron)',
    'Configuration (Single Bowl, Double Bowl, Triple Bowl)',
    'Mount Type (Undermount, Drop-In, Farmhouse/Apron)',
    'Number of Faucet Holes',
    'Bowl Depth',
    'Drain Location',
    'Finish/Color',
    'Sound Dampening',
    'Accessories Included',
    'Gauge (Stainless)',
    'Grid Included',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Overall Width', 'Overall Depth',
    'Material', 'Configuration', 'Mount Type', 'Bowl Dimensions',
    'Bowl Depth', 'Faucet Holes', 'Drain Size', 'Finish',
    'Sound Dampening', 'Gauge', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Kitchen',
    tier3: 'Kitchen Sinks'
  }
};

export const KITCHEN_FAUCET_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Kitchen Faucets #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Style (Pull-Down, Pull-Out, Bridge, Pot Filler, Standard)',
    'Finish',
    'Number of Handles (Single, Double)',
    'Spout Height',
    'Spout Reach',
    'Spray Function (Stream, Spray, Pause)',
    'Touchless/Motion Sensor',
    'Material',
    'Deck Plate Included',
    'Installation Type (Single Hole, 3-Hole)',
    'Ceramic Disc Valve',
    'Water Sense Certified',
    'Soap Dispenser Included',
    'Side Sprayer Included'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Style', 'Finish', 'Material',
    'Number of Handles', 'Spout Height', 'Spout Reach',
    'Spray Functions', 'Touchless', 'Installation Type',
    'Valve Type', 'Flow Rate', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Kitchen',
    tier3: 'Kitchen Faucets'
  }
};

export const BATHROOM_FAUCET_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bathroom Faucets #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Style (Widespread, Centerset, Single Hole, Wall Mount)',
    'Finish',
    'Number of Handles',
    'Spout Height',
    'Spout Reach',
    'Drain Assembly Included',
    'Material',
    'Hole Spacing',
    'Touchless/Motion Sensor',
    'Water Sense Certified',
    'ADA Compliant',
    'Commercial Grade',
    'Ceramic Disc Valve',
    'Lead-Free'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Style', 'Finish', 'Material',
    'Number of Handles', 'Spout Height', 'Spout Reach',
    'Hole Spacing', 'Drain Included', 'Valve Type',
    'Flow Rate', 'ADA Compliant', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Bathroom Faucets'
  }
};

export const TOILET_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Toilets #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Configuration (One-Piece, Two-Piece, Wall-Hung)',
    'Bowl Shape (Elongated, Round, Compact Elongated)',
    'Flush Type (Single Flush, Dual Flush, Touchless)',
    'Gallons Per Flush',
    'Rough-In Size',
    'Height (Standard, Comfort/ADA)',
    'Finish/Color',
    'Seat Included',
    'Bidet Features',
    'Heated Seat',
    'Water Sense Certified',
    'ADA Compliant',
    'Trapway (Concealed, Exposed)',
    'Soft Close Seat'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Configuration', 'Bowl Shape',
    'Flush Type', 'GPF', 'Rough-In', 'Bowl Height',
    'Overall Height', 'Finish', 'Seat Included', 'Bidet Features',
    'WaterSense', 'ADA Compliant', 'MaP Score', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Toilets'
  }
};

export const BATHTUB_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bathtubs #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Style (Freestanding, Alcove, Drop-In, Corner, Walk-In)',
    'Material (Acrylic, Cast Iron, Fiberglass, Stone Resin)',
    'Length',
    'Width',
    'Depth',
    'Soaking Depth',
    'Finish/Color',
    'Drain Location (Left, Right, Center)',
    'Whirlpool Jets',
    'Air Jets',
    'Heated Surface',
    'Chromatherapy',
    'Overflow',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Style', 'Material',
    'Length', 'Width', 'Depth', 'Soaking Depth',
    'Drain Location', 'Finish', 'Whirlpool Jets', 'Air Jets',
    'Heater', 'Chromatherapy', 'Weight', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Bathtubs'
  }
};

/**
 * LIGHTING DEPARTMENT
 */
export const CHANDELIER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Chandeliers #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Style (Traditional, Modern, Transitional, Rustic, Crystal)',
    'Width/Diameter',
    'Height (Fixture)',
    'Adjustable Height',
    'Number of Lights',
    'Bulb Type (LED, Incandescent, Candelabra)',
    'Finish/Color',
    'Material (Crystal, Glass, Metal, Wood)',
    'Dimmable',
    'Chain/Cord Length',
    'Max Wattage',
    'Bulbs Included',
    'Dry/Damp/Wet Rated',
    'ETL/UL Listed'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Style', 'Width', 'Height',
    'Number of Lights', 'Bulb Type', 'Max Wattage',
    'Finish', 'Material', 'Dimmable', 'Chain Length',
    'Bulbs Included', 'Rating', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Indoor Lighting',
    tier3: 'Chandeliers'
  }
};

export const PENDANT_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Pendants #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Style (Modern, Industrial, Farmhouse, Globe, Drum)',
    'Width/Diameter',
    'Height (Fixture)',
    'Adjustable Height',
    'Number of Lights',
    'Bulb Type',
    'Finish/Color',
    'Shade Material (Glass, Metal, Fabric)',
    'Dimmable',
    'Cord/Chain Length',
    'Sloped Ceiling Compatible',
    'Bulbs Included',
    'Dry/Damp Rated',
    'ETL/UL Listed'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Style', 'Width', 'Height',
    'Number of Lights', 'Bulb Type', 'Max Wattage',
    'Finish', 'Shade Material', 'Dimmable', 'Cord Length',
    'Bulbs Included', 'Rating', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Indoor Lighting',
    tier3: 'Pendants'
  }
};

export const CEILING_FAN_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Ceiling Fans #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Blade Span',
    'Number of Blades',
    'Light Kit Included',
    'Style (Modern, Traditional, Tropical)',
    'Finish/Color',
    'Blade Material',
    'Motor Type (DC, AC)',
    'Number of Speeds',
    'Reversible Motor',
    'Remote Control Included',
    'Smart/WiFi Enabled',
    'Damp/Wet Rated',
    'CFM',
    'Noise Level'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Blade Span', 'Number of Blades',
    'Light Kit', 'Style', 'Finish', 'Blade Material',
    'Motor Type', 'Speeds', 'Reversible', 'Remote Included',
    'CFM', 'Rating', 'Energy Star', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Ceiling Fans',
    tier3: 'Ceiling Fans'
  }
};

/**
 * Master category schema map
 */
export const CATEGORY_SCHEMAS: Record<string, CategoryAttributeConfig> = {
  // Appliances
  'Refrigerator': REFRIGERATOR_SCHEMA,
  'Dishwasher': DISHWASHER_SCHEMA,
  'Range': RANGE_SCHEMA,
  'Oven': OVEN_SCHEMA,
  'Cooktop': COOKTOP_SCHEMA,
  'Microwave': MICROWAVE_SCHEMA,
  'Range Hood': RANGE_HOOD_SCHEMA,
  'Washer': WASHER_SCHEMA,
  'Dryer': DRYER_SCHEMA,
  'Freezer': FREEZER_SCHEMA,
  
  // Plumbing & Bath
  'Kitchen Sinks #': KITCHEN_SINK_SCHEMA,
  'Kitchen Faucets #': KITCHEN_FAUCET_SCHEMA,
  'Bathroom Faucets #': BATHROOM_FAUCET_SCHEMA,
  'Toilets #': TOILET_SCHEMA,
  'Bathtubs #': BATHTUB_SCHEMA,
  
  // Lighting
  'Chandeliers #': CHANDELIER_SCHEMA,
  'Pendants #': PENDANT_SCHEMA,
  'Ceiling Fans #': CEILING_FAN_SCHEMA,
};

// Import additional schemas from separate files
import { PLUMBING_SCHEMAS } from './schemas/plumbing-schemas';
import { LIGHTING_SCHEMAS } from './schemas/lighting-schemas';
import { ADDITIONAL_APPLIANCE_SCHEMAS } from './schemas/additional-appliance-schemas';
import { HOME_DECOR_HVAC_SCHEMAS } from './schemas/home-decor-hvac-schemas';

// Merge all schemas
Object.assign(CATEGORY_SCHEMAS, PLUMBING_SCHEMAS);
Object.assign(CATEGORY_SCHEMAS, LIGHTING_SCHEMAS);
Object.assign(CATEGORY_SCHEMAS, ADDITIONAL_APPLIANCE_SCHEMAS);
Object.assign(CATEGORY_SCHEMAS, HOME_DECOR_HVAC_SCHEMAS);

/**
 * Get category schema by name
 */
export function getCategorySchema(categoryName: string): CategoryAttributeConfig | null {
  // Direct match
  if (CATEGORY_SCHEMAS[categoryName]) {
    return CATEGORY_SCHEMAS[categoryName];
  }
  
  // Try without # suffix
  const withoutHash = categoryName.replace(/ #$/, '');
  if (CATEGORY_SCHEMAS[withoutHash]) {
    return CATEGORY_SCHEMAS[withoutHash];
  }
  
  // Try with # suffix
  const withHash = categoryName + ' #';
  if (CATEGORY_SCHEMAS[withHash]) {
    return CATEGORY_SCHEMAS[withHash];
  }
  
  // Case-insensitive search
  const lowerName = categoryName.toLowerCase();
  for (const [key, schema] of Object.entries(CATEGORY_SCHEMAS)) {
    if (key.toLowerCase().replace(/ #$/, '') === lowerName.replace(/ #$/, '')) {
      return schema;
    }
  }
  
  return null;
}

/**
 * Get required attributes for a category
 */
export function getRequiredAttributes(categoryName: string): string[] {
  const schema = getCategorySchema(categoryName);
  if (!schema) return [];
  
  // Combine top15 filter and html table attributes (deduplicated)
  const allAttrs = new Set([
    ...schema.top15FilterAttributes,
    ...schema.htmlTableAttributes
  ]);
  
  return Array.from(allAttrs);
}

export default {
  CATEGORY_SCHEMAS,
  getCategorySchema,
  getRequiredAttributes,
};
