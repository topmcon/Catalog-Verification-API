/**
 * Plumbing & Bath Category Schemas
 * Complete attribute definitions for plumbing fixtures
 */

import { CategoryAttributeConfig } from '../category-attributes';

export const BATHROOM_SINK_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bathroom Sinks #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Depth',
    'Style (Pedestal, Vessel, Undermount, Drop-In, Wall-Mount)',
    'Material (Vitreous China, Porcelain, Stone, Glass)',
    'Shape (Rectangular, Oval, Round, Square)',
    'Faucet Holes (Single, Widespread, None)',
    'Overflow',
    'Finish/Color',
    'ADA Compliant',
    'Commercial Grade',
    'Drain Included',
    'Console Legs Included',
    'Semi-Recessed',
    'Integrated Countertop'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Depth', 'Height',
    'Style', 'Material', 'Shape', 'Faucet Holes',
    'Overflow', 'Finish', 'Drain Size', 'ADA Compliant',
    'Weight', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Bathroom Sinks'
  }
};

export const BATHROOM_VANITY_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bathroom Vanities #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Style (Modern, Traditional, Transitional, Farmhouse)',
    'Configuration (Single Sink, Double Sink)',
    'Cabinet Material (Wood, MDF, Plywood)',
    'Countertop Material (Marble, Quartz, Granite, Cultured Marble)',
    'Sink Included',
    'Faucet Included',
    'Number of Drawers',
    'Number of Doors',
    'Soft-Close Hardware',
    'Finish/Color',
    'Mirror Included',
    'Backsplash Included',
    'Assembly Required'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Depth', 'Height',
    'Style', 'Configuration', 'Cabinet Material', 'Countertop Material',
    'Sink Type', 'Faucet Holes', 'Drawers', 'Doors',
    'Finish', 'Hardware Finish', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Bathroom Vanities'
  }
};

export const SHOWER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Showers #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Type (Shower System, Shower Head, Hand Shower, Body Sprays)',
    'Style (Rain, Waterfall, Multi-Function)',
    'Finish',
    'Material (Stainless Steel, Brass, Plastic)',
    'Spray Patterns',
    'Flow Rate (GPM)',
    'Shower Head Size',
    'Wall Mount / Ceiling Mount',
    'Thermostatic',
    'Pressure Balance',
    'Diverter Included',
    'Valve Included',
    'Water Sense Certified',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Style', 'Finish',
    'Material', 'Spray Patterns', 'Flow Rate', 'Head Size',
    'Mount Type', 'Thermostatic', 'Valve Included',
    'WaterSense', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Showers'
  }
};

export const TUB_FAUCET_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Tub Faucets #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Style (Freestanding, Wall Mount, Deck Mount, Roman)',
    'Finish',
    'Number of Handles',
    'Hand Shower Included',
    'Material',
    'Spout Reach',
    'Spout Height',
    'Flow Rate (GPM)',
    'Ceramic Disc Valve',
    'Diverter',
    'Supply Lines Included',
    'Rough-In Valve Included',
    'ADA Compliant',
    'Commercial Grade'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Style', 'Finish', 'Material',
    'Handles', 'Hand Shower', 'Spout Reach', 'Spout Height',
    'Flow Rate', 'Valve Type', 'Diverter', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Tub Faucets'
  }
};

export const BAR_PREP_SINK_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bar & Prep Sinks #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Depth',
    'Material (Stainless Steel, Copper, Fireclay)',
    'Mount Type (Undermount, Drop-In)',
    'Number of Bowls',
    'Bowl Depth',
    'Faucet Holes',
    'Drain Location',
    'Finish/Color',
    'Gauge (Stainless)',
    'Sound Dampening',
    'Grid Included',
    'Accessories Included',
    'Commercial Grade'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Depth', 'Material',
    'Mount Type', 'Bowls', 'Bowl Depth', 'Faucet Holes',
    'Drain Size', 'Finish', 'Gauge', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Kitchen',
    tier3: 'Bar & Prep Sinks'
  }
};

export const BAR_FAUCET_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bar Faucets #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Style (Pull-Down, Standard, Prep)',
    'Finish',
    'Number of Handles',
    'Spout Height',
    'Spout Reach',
    'Spray Function',
    'Material',
    'Installation Type (Single Hole)',
    'Ceramic Disc Valve',
    'Swivel Spout',
    'Water Sense Certified',
    'Deck Plate Included',
    'Lead-Free',
    'Commercial Grade'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Style', 'Finish', 'Material',
    'Handles', 'Spout Height', 'Spout Reach', 'Spray Functions',
    'Installation', 'Flow Rate', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Kitchen',
    tier3: 'Bar Faucets'
  }
};

export const BATHROOM_HARDWARE_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bathroom Hardware and Accessories #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Type (Towel Bar, Towel Ring, Robe Hook, TP Holder, Shelf)',
    'Finish',
    'Material (Brass, Stainless Steel, Zinc)',
    'Length/Size',
    'Mounting Type (Wall Mount, Surface Mount)',
    'Style (Modern, Traditional, Transitional)',
    'Hardware Included',
    'Collection Name',
    'ADA Compliant',
    'Rust Resistant',
    'Weight Capacity',
    'Number of Hooks',
    'Set Pieces',
    'Concealed Mounting'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Finish', 'Material',
    'Size', 'Mounting', 'Style', 'Collection',
    'Hardware Included', 'Weight Capacity', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Bathroom Accessories'
  }
};

export const PLUMBING_SCHEMAS = {
  'Bathroom Sinks #': BATHROOM_SINK_SCHEMA,
  'Bathroom Vanities #': BATHROOM_VANITY_SCHEMA,
  'Showers #': SHOWER_SCHEMA,
  'Tub Faucets #': TUB_FAUCET_SCHEMA,
  'Bar & Prep Sinks #': BAR_PREP_SINK_SCHEMA,
  'Bar Faucets #': BAR_FAUCET_SCHEMA,
  'Bathroom Hardware and Accessories #': BATHROOM_HARDWARE_SCHEMA,
};
