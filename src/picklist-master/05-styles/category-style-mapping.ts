/**
 * Category-Type-Style Mapping
 * 
 * AUTO-GENERATED from category-type-style-mapping.json
 * Generated: 2026-02-05
 * Total Categories: 186
 * Existing Styles: undefined
 * New Styles Needed: undefined
 * 
 * Purpose: Maps each product category to its valid style/type values
 * Approach: One filter per category based on how customers search
 * 
 * ⚠️ DO NOT EDIT DIRECTLY - Edit the JSON file and run:
 *    node scripts/regenerate-category-style-mapping.js
 */

export interface StyleValue {
  name: string;
  style_id: string | null;
  status: 'existing' | 'new_needed';
}

export interface CategoryStyleMapping {
  department: string;
  category_name: string;
  label: string;
  logic: string;
  values: StyleValue[];
}

/**
 * Universal design/aesthetic styles - used as fallback when no category-specific styles apply
 */
export const UNIVERSAL_DESIGN_STYLES = [
  'Modern',
  'Contemporary', 
  'Traditional',
  'Transitional',
  'Industrial',
  'Farmhouse',
  'Rustic',
  'Coastal',
  'Minimalist',
  'Mid-Century Modern',
  'Bohemian',
  'Scandinavian',
  'Art Deco',
  'Victorian',
  'Mediterranean'
];

/**
 * Complete category-to-style mapping with Salesforce style_ids
 */
export const CATEGORY_STYLE_MAP: Record<string, CategoryStyleMapping> = {
  'Refrigerator': {
    department: 'Appliances',
    category_name: 'Refrigerator',
    label: 'Refrigerator Type',
    logic: 'Door configuration/form factor',
    values: [
      { name: 'French Door', style_id: 'a1IaZ000000YiMnUAK', status: 'existing' },
      { name: 'Side-by-Side', style_id: 'a1IaZ0000019mODUAY', status: 'existing' },
      { name: 'Top Freezer', style_id: 'a1IaZ000000YiTPUA0', status: 'existing' },
      { name: 'Bottom Freezer', style_id: 'a1IaZ000000YiTeUAK', status: 'existing' },
      { name: 'Counter Depth', style_id: 'a1IaZ000001SRSvUAO', status: 'existing' },
      { name: 'Column', style_id: 'a1IaZ000000a1FJUAY', status: 'existing' },
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' },
      { name: 'Undercounter', style_id: 'a1IaZ0000019zrhUAA', status: 'existing' },
      { name: '4-Door Flex', style_id: 'a1IaZ000001SX5JUAW', status: 'existing' },
      { name: 'Compact', style_id: null, status: 'new_needed' }
    ]
  },
  'Freezer': {
    department: 'Appliances',
    category_name: 'Freezer',
    label: 'Freezer Type',
    logic: 'Form factor',
    values: [
      { name: 'Upright', style_id: 'a1IaZ000000ZVovUAG', status: 'existing' },
      { name: 'Chest', style_id: 'a1IaZ000000YiTKUA0', status: 'existing' },
      { name: 'Column', style_id: 'a1IaZ000000a1FJUAY', status: 'existing' },
      { name: 'Undercounter', style_id: 'a1IaZ0000019zrhUAA', status: 'existing' },
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' },
      { name: 'Compact', style_id: null, status: 'new_needed' }
    ]
  },
  'Icemaker': {
    department: 'Appliances',
    category_name: 'Icemaker',
    label: 'Icemaker Type',
    logic: 'Installation type',
    values: [
      { name: 'Undercounter', style_id: 'a1IaZ0000019zrhUAA', status: 'existing' },
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' },
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Portable', style_id: null, status: 'new_needed' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' }
    ]
  },
  'Range': {
    department: 'Appliances',
    category_name: 'Range',
    label: 'Range Type',
    logic: 'Fuel type or installation style',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' },
      { name: 'Induction', style_id: 'a1IaZ0000019mb7UAA', status: 'existing' },
      { name: 'Dual Fuel', style_id: null, status: 'new_needed' },
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Slide-In', style_id: null, status: 'new_needed' },
      { name: 'Pro-Style', style_id: null, status: 'new_needed' }
    ]
  },
  'Cooktop': {
    department: 'Appliances',
    category_name: 'Cooktop',
    label: 'Cooktop Type',
    logic: 'Heat source',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' },
      { name: 'Induction', style_id: 'a1IaZ0000019mb7UAA', status: 'existing' },
      { name: 'Radiant', style_id: null, status: 'new_needed' },
      { name: 'Downdraft', style_id: null, status: 'new_needed' }
    ]
  },
  'Oven': {
    department: 'Appliances',
    category_name: 'Oven',
    label: 'Oven Type',
    logic: 'Configuration or cooking method',
    values: [
      { name: 'Single Wall', style_id: null, status: 'new_needed' },
      { name: 'Double Wall', style_id: 'a1IaZ0000019zenUAA', status: 'existing' },
      { name: 'Microwave Combo', style_id: 'a1IaZ000000YiTLUA0', status: 'existing' },
      { name: 'Steam', style_id: 'a1IaZ000001S92fUAC', status: 'existing' },
      { name: 'Convection', style_id: null, status: 'new_needed' },
      { name: 'Speed Oven', style_id: null, status: 'new_needed' }
    ]
  },
  'Microwave': {
    department: 'Appliances',
    category_name: 'Microwave',
    label: 'Microwave Type',
    logic: 'Installation location',
    values: [
      { name: 'Over-the-Range', style_id: 'a1IaZ000000YiTOUA0', status: 'existing' },
      { name: 'Countertop', style_id: 'a1IaZ000000YiTSUA0', status: 'existing' },
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' },
      { name: 'Drawer', style_id: 'a1IaZ0000018i9lUAA', status: 'existing' },
      { name: 'Under Cabinet', style_id: 'a1IaZ000001S91TUAS', status: 'existing' }
    ]
  },
  'Range Hood': {
    department: 'Appliances',
    category_name: 'Range Hood',
    label: 'Range Hood Type',
    logic: 'Mounting/installation type',
    values: [
      { name: 'Wall-Mounted', style_id: 'a1IaZ000000nyELUAY', status: 'existing' },
      { name: 'Under Cabinet', style_id: 'a1IaZ000001S91TUAS', status: 'existing' },
      { name: 'Island Mount', style_id: 'a1IaZ0000019z6vUAA', status: 'existing' },
      { name: 'Insert', style_id: 'a1IaZ0000019z3hUAA', status: 'existing' },
      { name: 'Downdraft', style_id: null, status: 'new_needed' },
      { name: 'Pro-Style', style_id: null, status: 'new_needed' }
    ]
  },
  'Dishwasher': {
    department: 'Appliances',
    category_name: 'Dishwasher',
    label: 'Dishwasher Type',
    logic: 'Control location or installation type',
    values: [
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' },
      { name: 'Top Control', style_id: 'a1IaZ000001SdaXUAS', status: 'existing' },
      { name: 'Front Control', style_id: null, status: 'new_needed' },
      { name: 'Drawer', style_id: 'a1IaZ0000018i9lUAA', status: 'existing' },
      { name: 'Countertop', style_id: 'a1IaZ000000YiTSUA0', status: 'existing' },
      { name: 'Portable', style_id: null, status: 'new_needed' },
      { name: 'Panel-Ready', style_id: null, status: 'new_needed' }
    ]
  },
  'Washer': {
    department: 'Appliances',
    category_name: 'Washer',
    label: 'Washer Type',
    logic: 'Loading configuration',
    values: [
      { name: 'Front Load', style_id: 'a1IaZ000000ZVH3UAO', status: 'existing' },
      { name: 'Top Load', style_id: 'a1IaZ000000YiTZUA0', status: 'existing' },
      { name: 'Stackable', style_id: 'a1IaZ000001SAwjUAG', status: 'existing' },
      { name: 'Compact', style_id: null, status: 'new_needed' }
    ]
  },
  'Dryer': {
    department: 'Appliances',
    category_name: 'Dryer',
    label: 'Dryer Type',
    logic: 'Fuel type or venting',
    values: [
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' },
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Stackable', style_id: 'a1IaZ000001SAwjUAG', status: 'existing' },
      { name: 'Heat Pump', style_id: null, status: 'new_needed' },
      { name: 'Ventless', style_id: null, status: 'new_needed' },
      { name: 'Compact', style_id: null, status: 'new_needed' }
    ]
  },
  'All in One Washer / Dryer': {
    department: 'Appliances',
    category_name: 'All in One Washer / Dryer',
    label: 'Combo Type',
    logic: 'Configuration',
    values: [
      { name: 'Unitized', style_id: 'a1IaZ0000019m85UAA', status: 'existing' },
      { name: 'Front Load', style_id: 'a1IaZ000000ZVH3UAO', status: 'existing' },
      { name: 'Ventless', style_id: null, status: 'new_needed' }
    ]
  },
  'Standalone Pedestal': {
    department: 'Appliances',
    category_name: 'Standalone Pedestal',
    label: 'Pedestal Type',
    logic: 'Primarily for matching washer/dryer',
    values: [
      { name: 'Standalone', style_id: 'a1IaZ000001S93MUAS', status: 'existing' },
      { name: 'Storage Pedestal', style_id: null, status: 'new_needed' }
    ]
  },
  'Drawer': {
    department: 'Appliances',
    category_name: 'Drawer',
    label: 'Drawer Type',
    logic: 'Function',
    values: [
      { name: 'Warming', style_id: 'a1IaZ000001S90AUAS', status: 'existing' },
      { name: 'Storage', style_id: 'a1IaZ000001S90RUAS', status: 'existing' },
      { name: 'Refrigerator Drawer', style_id: null, status: 'new_needed' }
    ]
  },
  'Barbeque': {
    department: 'Appliances',
    category_name: 'Barbeque',
    label: 'Grill Type',
    logic: 'Fuel type or installation',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Charcoal', style_id: null, status: 'new_needed' },
      { name: 'Pellet', style_id: null, status: 'new_needed' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' },
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' },
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Portable', style_id: null, status: 'new_needed' },
      { name: 'Kamado', style_id: null, status: 'new_needed' }
    ]
  },
  'Pizza Oven': {
    department: 'Appliances',
    category_name: 'Pizza Oven',
    label: 'Pizza Oven Type',
    logic: 'Fuel type',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' },
      { name: 'Wood-Fired', style_id: null, status: 'new_needed' },
      { name: 'Multi-Fuel', style_id: null, status: 'new_needed' },
      { name: 'Countertop', style_id: 'a1IaZ000000YiTSUA0', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' }
    ]
  },
  'Coffee Maker': {
    department: 'Appliances',
    category_name: 'Coffee Maker',
    label: 'Coffee Maker Type',
    logic: 'Brewing method',
    values: [
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' },
      { name: 'Countertop', style_id: 'a1IaZ000000YiTSUA0', status: 'existing' },
      { name: 'Drip', style_id: null, status: 'new_needed' },
      { name: 'Espresso', style_id: null, status: 'new_needed' },
      { name: 'Single Serve', style_id: null, status: 'new_needed' },
      { name: 'Cold Brew', style_id: null, status: 'new_needed' }
    ]
  },
  'Kitchen Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Kitchen Faucet',
    label: 'Faucet Type',
    logic: 'Spray function',
    values: [
      { name: 'Pull-Down', style_id: 'a1IaZ000001S92CUAS', status: 'existing' },
      { name: 'Pull-Out', style_id: 'a1IaZ000001S92DUAS', status: 'existing' },
      { name: 'Bridge', style_id: 'a1IaZ000001S92EUAS', status: 'existing' },
      { name: 'Pot Filler', style_id: 'a1IaZ000001S92FUAS', status: 'existing' },
      { name: 'Commercial', style_id: 'a1IaZ000001S92GUAS', status: 'existing' },
      { name: 'Bar/Prep', style_id: 'a1IaZ000001S93TUAS', status: 'existing' },
      { name: 'Touchless', style_id: 'a1IaZ000001S92HUAS', status: 'existing' },
      { name: 'Standard', style_id: null, status: 'new_needed' }
    ]
  },
  'Bathroom Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Bathroom Faucet',
    label: 'Faucet Type',
    logic: 'Mounting/hole configuration',
    values: [
      { name: 'Single Hole', style_id: 'a1IaZ000001S924UAC', status: 'existing' },
      { name: 'Widespread', style_id: 'a1IaZ000001S925UAC', status: 'existing' },
      { name: 'Centerset', style_id: 'a1IaZ000001S926UAC', status: 'existing' },
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Vessel', style_id: 'a1IaZ000001S92rUAC', status: 'existing' }
    ]
  },
  'Tub Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Tub Faucet',
    label: 'Tub Faucet Type',
    logic: 'Mounting type',
    values: [
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Deck Mounted', style_id: 'a1IaZ000001S92JUAS', status: 'existing' },
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Roman Tub', style_id: 'a1IaZ000001S92LUAS', status: 'existing' }
    ]
  },
  'Shower Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Shower Faucet',
    label: 'Shower Faucet Type',
    logic: 'Valve type',
    values: [
      { name: 'Pressure Balance', style_id: 'a1IaZ000001S92RUAS', status: 'existing' },
      { name: 'Thermostatic', style_id: 'a1IaZ000001S92QUAS', status: 'existing' },
      { name: 'Diverter', style_id: 'a1IaZ000001S90EUAS', status: 'existing' },
      { name: 'Volume Control', style_id: 'a1IaZ000001S90FUAS', status: 'existing' },
      { name: 'Transfer', style_id: 'a1IaZ000001S90GUAS', status: 'existing' },
      { name: 'Trim Only', style_id: null, status: 'new_needed' },
      { name: 'Complete System', style_id: null, status: 'new_needed' }
    ]
  },
  'Bar Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Bar Faucet',
    label: 'Bar Faucet Type',
    logic: 'Spray function',
    values: [
      { name: 'Pull-Down', style_id: 'a1IaZ000001S92CUAS', status: 'existing' },
      { name: 'Pull-Out', style_id: 'a1IaZ000001S92DUAS', status: 'existing' },
      { name: 'Standard', style_id: null, status: 'new_needed' },
      { name: 'Touchless', style_id: 'a1IaZ000001S92HUAS', status: 'existing' }
    ]
  },
  'Pot Filler Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Pot Filler Faucet',
    label: 'Pot Filler Type',
    logic: 'Mounting type',
    values: [
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Deck Mounted', style_id: 'a1IaZ000001S92JUAS', status: 'existing' }
    ]
  },
  'Bidet Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Bidet Faucet',
    label: 'Bidet Faucet Type',
    logic: 'Mounting type',
    values: [
      { name: 'Single Hole', style_id: 'a1IaZ000001S924UAC', status: 'existing' },
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Deck Mounted', style_id: 'a1IaZ000001S92JUAS', status: 'existing' }
    ]
  },
  'Food Service Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Food Service Faucet',
    label: 'Faucet Type',
    logic: 'Commercial/professional applications',
    values: [
      { name: 'Pre-Rinse', style_id: null, status: 'new_needed' },
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Deck Mounted', style_id: 'a1IaZ000001S92JUAS', status: 'existing' },
      { name: 'Pot Filler', style_id: 'a1IaZ000001S92FUAS', status: 'existing' },
      { name: 'Utility', style_id: null, status: 'new_needed' }
    ]
  },
  'Outdoor Shower Faucet': {
    department: 'Plumbing & Bath',
    category_name: 'Outdoor Shower Faucet',
    label: 'Outdoor Shower Type',
    logic: 'Mounting type',
    values: [
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Post Mount', style_id: null, status: 'new_needed' }
    ]
  },
  'Hot & Cold Water Dispenser': {
    department: 'Plumbing & Bath',
    category_name: 'Hot & Cold Water Dispenser',
    label: 'Dispenser Type',
    logic: 'Temperature/function',
    values: [
      { name: 'Instant Hot Only', style_id: null, status: 'new_needed' },
      { name: 'Hot and Cold', style_id: null, status: 'new_needed' },
      { name: 'Filtered', style_id: null, status: 'new_needed' },
      { name: 'Under Sink', style_id: null, status: 'new_needed' }
    ]
  },
  'Kitchen Sink': {
    department: 'Plumbing & Bath',
    category_name: 'Kitchen Sink',
    label: 'Sink Type',
    logic: 'Installation type',
    values: [
      { name: 'Undermount', style_id: 'a1IaZ000001S93PUAS', status: 'existing' },
      { name: 'Drop-In', style_id: 'a1IaZ000001S93QUAS', status: 'existing' },
      { name: 'Farmhouse', style_id: 'a1IaZ000001S93RUAS', status: 'existing' },
      { name: 'Apron Front', style_id: 'a1IaZ000001S93SUAS', status: 'existing' },
      { name: 'Workstation', style_id: 'a1IaZ000001S93WUAS', status: 'existing' }
    ]
  },
  'Bar & Prep Sink': {
    department: 'Plumbing & Bath',
    category_name: 'Bar & Prep Sink',
    label: 'Sink Type',
    logic: 'Smaller secondary sink options',
    values: [
      { name: 'Undermount', style_id: 'a1IaZ000001S93PUAS', status: 'existing' },
      { name: 'Drop-In', style_id: 'a1IaZ000001S93QUAS', status: 'existing' },
      { name: 'Bar/Prep', style_id: 'a1IaZ000001S93TUAS', status: 'existing' }
    ]
  },
  'Kitchen Sink Combo': {
    department: 'Plumbing & Bath',
    category_name: 'Kitchen Sink Combo',
    label: 'Combo Type',
    logic: 'Sink + faucet bundles by installation type',
    values: [
      { name: 'Undermount', style_id: 'a1IaZ000001S93PUAS', status: 'existing' },
      { name: 'Drop-In', style_id: 'a1IaZ000001S93QUAS', status: 'existing' },
      { name: 'Farmhouse', style_id: 'a1IaZ000001S93RUAS', status: 'existing' },
      { name: 'Workstation', style_id: 'a1IaZ000001S93WUAS', status: 'existing' }
    ]
  },
  'Bathroom Sink': {
    department: 'Plumbing & Bath',
    category_name: 'Bathroom Sink',
    label: 'Sink Type',
    logic: 'Installation type',
    values: [
      { name: 'Undermount', style_id: 'a1IaZ000001S93PUAS', status: 'existing' },
      { name: 'Drop-In', style_id: 'a1IaZ000001S93QUAS', status: 'existing' },
      { name: 'Vessel', style_id: 'a1IaZ000001S92rUAC', status: 'existing' },
      { name: 'Pedestal', style_id: 'a1IaZ000001S92sUAC', status: 'existing' },
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Console', style_id: 'a1IaZ000001S92uUAC', status: 'existing' },
      { name: 'Semi-Recessed', style_id: 'a1IaZ000001S92vUAC', status: 'existing' }
    ]
  },
  'Bathtub': {
    department: 'Plumbing & Bath',
    category_name: 'Bathtub',
    label: 'Bathtub Type',
    logic: 'Installation type',
    values: [
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Alcove', style_id: 'a1IaZ000001S92cUAC', status: 'existing' },
      { name: 'Drop-In', style_id: 'a1IaZ000001S93QUAS', status: 'existing' },
      { name: 'Undermount', style_id: 'a1IaZ000001S93PUAS', status: 'existing' },
      { name: 'Corner', style_id: 'a1IaZ000001S931UAC', status: 'existing' },
      { name: 'Walk-In', style_id: 'a1IaZ000001S92eUAC', status: 'existing' },
      { name: 'Clawfoot', style_id: 'a1IaZ000001S92YUAS', status: 'existing' }
    ]
  },
  'Bathtub Waste & Overflow': {
    department: 'Plumbing & Bath',
    category_name: 'Bathtub Waste & Overflow',
    label: 'Drain Type',
    logic: 'Drain operation type',
    values: [
      { name: 'Toe-Touch', style_id: null, status: 'new_needed' },
      { name: 'Push-Pull', style_id: null, status: 'new_needed' },
      { name: 'Lift & Turn', style_id: null, status: 'new_needed' },
      { name: 'Trip Lever', style_id: null, status: 'new_needed' },
      { name: 'Cable Operated', style_id: null, status: 'new_needed' }
    ]
  },
  'Shower': {
    department: 'Plumbing & Bath',
    category_name: 'Shower',
    label: 'Shower Type',
    logic: 'Showerhead/system type',
    values: [
      { name: 'Showerhead', style_id: null, status: 'new_needed' },
      { name: 'Rain Head', style_id: 'a1IaZ000001S92jUAC', status: 'existing' },
      { name: 'Handheld', style_id: 'a1IaZ000001S92kUAC', status: 'existing' },
      { name: 'Shower System', style_id: 'a1IaZ000001S92mUAC', status: 'existing' },
      { name: 'Dual', style_id: 'a1IaZ000001S92PUAS', status: 'existing' },
      { name: 'Body Spray', style_id: 'a1IaZ000001S92lUAC', status: 'existing' },
      { name: 'Shower Panel', style_id: null, status: 'new_needed' }
    ]
  },
  'Shower Accessory': {
    department: 'Plumbing & Bath',
    category_name: 'Shower Accessory',
    label: 'Accessory Type',
    logic: 'Accessory type',
    values: [
      { name: 'Shelf', style_id: 'a1IaZ000001S93CUAS', status: 'existing' },
      { name: 'Seat', style_id: 'a1IaZ000001S92oUAC', status: 'existing' },
      { name: 'Grab Bar', style_id: null, status: 'new_needed' },
      { name: 'Soap Dish', style_id: null, status: 'new_needed' },
      { name: 'Niche', style_id: null, status: 'new_needed' },
      { name: 'Shower Rod', style_id: null, status: 'new_needed' },
      { name: 'Shower Door', style_id: null, status: 'new_needed' }
    ]
  },
  'Steam Shower': {
    department: 'Plumbing & Bath',
    category_name: 'Steam Shower',
    label: 'Steam Shower Type',
    logic: 'Component or complete system',
    values: [
      { name: 'Steam Generator', style_id: null, status: 'new_needed' },
      { name: 'Steam Head', style_id: null, status: 'new_needed' },
      { name: 'Control Panel', style_id: null, status: 'new_needed' },
      { name: 'Complete System', style_id: null, status: 'new_needed' }
    ]
  },
  'Tub and Shower Accessory': {
    department: 'Plumbing & Bath',
    category_name: 'Tub and Shower Accessory',
    label: 'Accessory Type',
    logic: 'Accessory type',
    values: [
      { name: 'Shower Rod', style_id: null, status: 'new_needed' },
      { name: 'Bath Mat', style_id: null, status: 'new_needed' },
      { name: 'Tub Tray', style_id: null, status: 'new_needed' },
      { name: 'Drain Cover', style_id: null, status: 'new_needed' }
    ]
  },
  'Toilet': {
    department: 'Plumbing & Bath',
    category_name: 'Toilet',
    label: 'Toilet Type',
    logic: 'Configuration',
    values: [
      { name: 'Two-Piece', style_id: 'a1IaZ000001S93FUAS', status: 'existing' },
      { name: 'One-Piece', style_id: 'a1IaZ000001S93EUAS', status: 'existing' },
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Smart', style_id: 'a1IaZ000001S93HUAS', status: 'existing' },
      { name: 'Compact', style_id: null, status: 'new_needed' }
    ]
  },
  'Toilet Seat': {
    department: 'Plumbing & Bath',
    category_name: 'Toilet Seat',
    label: 'Seat Type',
    logic: 'Bowl shape compatibility',
    values: [
      { name: 'Elongated', style_id: 'a1IaZ000001S93JUAS', status: 'existing' },
      { name: 'Round', style_id: 'a1IaZ000001S93KUAS', status: 'existing' },
      { name: 'Bidet Seat', style_id: 'a1IaZ000001S93NUAS', status: 'existing' }
    ]
  },
  'Bidet': {
    department: 'Plumbing & Bath',
    category_name: 'Bidet',
    label: 'Bidet Type',
    logic: 'Product type',
    values: [
      { name: 'Bidet Seat', style_id: 'a1IaZ000001S93NUAS', status: 'existing' },
      { name: 'Standalone', style_id: 'a1IaZ000001S93MUAS', status: 'existing' },
      { name: 'Bidet Attachment', style_id: null, status: 'new_needed' },
      { name: 'Handheld Sprayer', style_id: null, status: 'new_needed' }
    ]
  },
  'Bidet Seat': {
    department: 'Plumbing & Bath',
    category_name: 'Bidet Seat',
    label: 'Bidet Seat Type',
    logic: 'Bowl shape or power type',
    values: [
      { name: 'Elongated', style_id: 'a1IaZ000001S93JUAS', status: 'existing' },
      { name: 'Round', style_id: 'a1IaZ000001S93KUAS', status: 'existing' },
      { name: 'Electronic', style_id: null, status: 'new_needed' },
      { name: 'Non-Electric', style_id: null, status: 'new_needed' }
    ]
  },
  'Urinal': {
    department: 'Plumbing & Bath',
    category_name: 'Urinal',
    label: 'Urinal Type',
    logic: 'Flush type',
    values: [
      { name: 'Wall Mounted', style_id: 'a1IaZ000001S93GUAS', status: 'existing' },
      { name: 'Touchless', style_id: 'a1IaZ000001S92HUAS', status: 'existing' },
      { name: 'Waterless', style_id: null, status: 'new_needed' }
    ]
  },
  'Bathroom Vanity': {
    department: 'Plumbing & Bath',
    category_name: 'Bathroom Vanity',
    label: 'Vanity Type',
    logic: 'Configuration',
    values: [
      { name: 'Single Sink', style_id: 'a1IaZ000001S92wUAC', status: 'existing' },
      { name: 'Double Sink', style_id: 'a1IaZ000001S92xUAC', status: 'existing' },
      { name: 'Floating', style_id: 'a1IaZ000001S92yUAC', status: 'existing' },
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Corner', style_id: 'a1IaZ000001S931UAC', status: 'existing' }
    ]
  },
  'Bathroom Mirror': {
    department: 'Plumbing & Bath',
    category_name: 'Bathroom Mirror',
    label: 'Mirror Type',
    logic: 'Mirror type/features',
    values: [
      { name: 'Framed', style_id: 'a1IaZ000001S932UAC', status: 'existing' },
      { name: 'Frameless', style_id: 'a1IaZ000001S933UAC', status: 'existing' },
      { name: 'Lighted', style_id: 'a1IaZ000001S934UAC', status: 'existing' },
      { name: 'Medicine Cabinet', style_id: 'a1IaZ000001S935UAC', status: 'existing' },
      { name: 'Pivot', style_id: 'a1IaZ000001S936UAC', status: 'existing' },
      { name: 'Magnifying', style_id: 'a1IaZ000001S937UAC', status: 'existing' }
    ]
  },
  'Medicine Cabinet': {
    department: 'Plumbing & Bath',
    category_name: 'Medicine Cabinet',
    label: 'Cabinet Type',
    logic: 'Installation type',
    values: [
      { name: 'Recessed', style_id: 'a1IaZ000001Si2LUAS', status: 'existing' },
      { name: 'Surface Mount', style_id: null, status: 'new_needed' },
      { name: 'Lighted', style_id: 'a1IaZ000001S934UAC', status: 'existing' },
      { name: 'Framed', style_id: 'a1IaZ000001S932UAC', status: 'existing' },
      { name: 'Frameless', style_id: 'a1IaZ000001S933UAC', status: 'existing' }
    ]
  },
  'Bathroom Hardware and Accessories': {
    department: 'Plumbing & Bath',
    category_name: 'Bathroom Hardware and Accessories',
    label: 'Accessory Type',
    logic: 'Accessory type',
    values: [
      { name: 'Towel Bar', style_id: 'a1IaZ000001S938UAC', status: 'existing' },
      { name: 'Towel Ring', style_id: 'a1IaZ000001S939UAC', status: 'existing' },
      { name: 'Robe Hook', style_id: 'a1IaZ000001S93AUAS', status: 'existing' },
      { name: 'Toilet Paper Holder', style_id: 'a1IaZ000001S93BUAS', status: 'existing' },
      { name: 'Shelf', style_id: 'a1IaZ000001S93CUAS', status: 'existing' },
      { name: 'Grab Bar', style_id: null, status: 'new_needed' },
      { name: 'Set', style_id: 'a1IaZ000001S93DUAS', status: 'existing' }
    ]
  },
  'Bathroom Cabinet Hardware': {
    department: 'Plumbing & Bath',
    category_name: 'Bathroom Cabinet Hardware',
    label: 'Hardware Type',
    logic: 'Hardware shape',
    values: [
      { name: 'Knob', style_id: 'a1IaZ000001S93dUAC', status: 'existing' },
      { name: 'Pull', style_id: null, status: 'new_needed' },
      { name: 'Handle', style_id: null, status: 'new_needed' }
    ]
  },
  'Bath Fan': {
    department: 'Plumbing & Bath',
    category_name: 'Bath Fan',
    label: 'Bath Fan Type',
    logic: 'Features/configuration',
    values: [
      { name: 'Standard', style_id: null, status: 'new_needed' },
      { name: 'With Light', style_id: null, status: 'new_needed' },
      { name: 'With Heater', style_id: null, status: 'new_needed' },
      { name: 'With Light and Heater', style_id: null, status: 'new_needed' },
      { name: 'Humidity Sensing', style_id: null, status: 'new_needed' },
      { name: 'Inline', style_id: null, status: 'new_needed' }
    ]
  },
  'Rough-In Valve': {
    department: 'Plumbing & Bath',
    category_name: 'Rough-In Valve',
    label: 'Valve Type',
    logic: 'Valve function',
    values: [
      { name: 'Pressure Balance', style_id: 'a1IaZ000001S92RUAS', status: 'existing' },
      { name: 'Thermostatic', style_id: 'a1IaZ000001S92QUAS', status: 'existing' },
      { name: 'Diverter', style_id: 'a1IaZ000001S90EUAS', status: 'existing' },
      { name: 'Volume Control', style_id: 'a1IaZ000001S90FUAS', status: 'existing' },
      { name: 'Transfer', style_id: 'a1IaZ000001S90GUAS', status: 'existing' }
    ]
  },
  'Garbage Disposal': {
    department: 'Plumbing & Bath',
    category_name: 'Garbage Disposal',
    label: 'Disposal Type',
    logic: 'Feed type',
    values: [
      { name: 'Continuous Feed', style_id: 'a1IaZ000001Sz3BUAS', status: 'existing' },
      { name: 'Batch Feed', style_id: null, status: 'new_needed' },
      { name: 'Compact', style_id: null, status: 'new_needed' }
    ]
  },
  'Water Filtration': {
    department: 'Plumbing & Bath',
    category_name: 'Water Filtration',
    label: 'Filter Type',
    logic: 'Installation type',
    values: [
      { name: 'Under Sink', style_id: null, status: 'new_needed' },
      { name: 'Whole House', style_id: null, status: 'new_needed' },
      { name: 'Countertop', style_id: 'a1IaZ000000YiTSUA0', status: 'existing' },
      { name: 'Faucet Mount', style_id: null, status: 'new_needed' },
      { name: 'Reverse Osmosis', style_id: null, status: 'new_needed' },
      { name: 'Replacement Filter', style_id: null, status: 'new_needed' }
    ]
  },
  'Kitchen Accessory': {
    department: 'Plumbing & Bath',
    category_name: 'Kitchen Accessory',
    label: 'Accessory Type',
    logic: 'Accessory type',
    values: [
      { name: 'Soap Dispenser', style_id: null, status: 'new_needed' },
      { name: 'Sink Grid', style_id: null, status: 'new_needed' },
      { name: 'Cutting Board', style_id: null, status: 'new_needed' },
      { name: 'Colander', style_id: null, status: 'new_needed' },
      { name: 'Strainer', style_id: null, status: 'new_needed' },
      { name: 'Air Gap', style_id: null, status: 'new_needed' }
    ]
  },
  'Kitchen Storage & Organization': {
    department: 'Plumbing & Bath',
    category_name: 'Kitchen Storage & Organization',
    label: 'Storage Type',
    logic: 'Storage solution',
    values: [
      { name: 'Pull-Out Shelf', style_id: null, status: 'new_needed' },
      { name: 'Lazy Susan', style_id: null, status: 'new_needed' },
      { name: 'Drawer Organizer', style_id: null, status: 'new_needed' },
      { name: 'Spice Rack', style_id: null, status: 'new_needed' },
      { name: 'Pot Rack', style_id: null, status: 'new_needed' },
      { name: 'Trash Pull-Out', style_id: null, status: 'new_needed' }
    ]
  },
  'Kitchen Furniture and Decor': {
    department: 'Plumbing & Bath',
    category_name: 'Kitchen Furniture and Decor',
    label: 'Furniture Type',
    logic: 'Furniture type',
    values: [
      { name: 'Kitchen Island', style_id: null, status: 'new_needed' },
      { name: 'Kitchen Cart', style_id: null, status: 'new_needed' },
      { name: 'Bar Stool', style_id: null, status: 'new_needed' },
      { name: 'Bakers Rack', style_id: null, status: 'new_needed' },
      { name: 'Wine Rack', style_id: null, status: 'new_needed' },
      { name: 'Buffet', style_id: null, status: 'new_needed' }
    ]
  },
  'Kitchen Tile': {
    department: 'Plumbing & Bath',
    category_name: 'Kitchen Tile',
    label: 'Tile Type',
    logic: 'Material or pattern',
    values: [
      { name: 'Ceramic', style_id: null, status: 'new_needed' },
      { name: 'Porcelain', style_id: null, status: 'new_needed' },
      { name: 'Glass', style_id: null, status: 'new_needed' },
      { name: 'Stone', style_id: null, status: 'new_needed' },
      { name: 'Mosaic', style_id: null, status: 'new_needed' },
      { name: 'Subway', style_id: null, status: 'new_needed' }
    ]
  },
  'Backsplash Kitchen Tile': {
    department: 'Plumbing & Bath',
    category_name: 'Backsplash Kitchen Tile',
    label: 'Backsplash Type',
    logic: 'Material or pattern',
    values: [
      { name: 'Ceramic', style_id: null, status: 'new_needed' },
      { name: 'Porcelain', style_id: null, status: 'new_needed' },
      { name: 'Glass', style_id: null, status: 'new_needed' },
      { name: 'Stone', style_id: null, status: 'new_needed' },
      { name: 'Mosaic', style_id: null, status: 'new_needed' },
      { name: 'Subway', style_id: null, status: 'new_needed' },
      { name: 'Peel and Stick', style_id: null, status: 'new_needed' }
    ]
  },
  'Pipe Fittings': {
    department: 'Plumbing & Bath',
    category_name: 'Pipe Fittings',
    label: 'Fitting Type',
    logic: 'Fitting shape/function',
    values: [
      { name: 'Elbow', style_id: null, status: 'new_needed' },
      { name: 'Tee', style_id: null, status: 'new_needed' },
      { name: 'Coupling', style_id: null, status: 'new_needed' },
      { name: 'Adapter', style_id: null, status: 'new_needed' },
      { name: 'Cap', style_id: null, status: 'new_needed' },
      { name: 'Union', style_id: null, status: 'new_needed' },
      { name: 'Nipple', style_id: 'a1IaZ000001TW3xUAG', status: 'existing' }
    ]
  },
  'Ceiling Fan': {
    department: 'Lighting & Electrical',
    category_name: 'Ceiling Fan',
    label: 'Ceiling Fan Type',
    logic: 'Location or light configuration',
    values: [
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'With Light', style_id: null, status: 'new_needed' },
      { name: 'Without Light', style_id: null, status: 'new_needed' },
      { name: 'Hugger', style_id: null, status: 'new_needed' },
      { name: 'Smart', style_id: 'a1IaZ000001S93HUAS', status: 'existing' }
    ]
  },
  'Ceiling Fans with Light': {
    department: 'Lighting & Electrical',
    category_name: 'Ceiling Fans with Light',
    label: 'Fan Type',
    logic: 'Location or features',
    values: [
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'Hugger', style_id: null, status: 'new_needed' },
      { name: 'LED', style_id: 'a1IaZ000001TeazUAC', status: 'existing' },
      { name: 'Smart', style_id: 'a1IaZ000001S93HUAS', status: 'existing' }
    ]
  },
  'Ceiling Fans without Light': {
    department: 'Lighting & Electrical',
    category_name: 'Ceiling Fans without Light',
    label: 'Fan Type',
    logic: 'Location',
    values: [
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'Hugger', style_id: null, status: 'new_needed' },
      { name: 'Smart', style_id: 'a1IaZ000001S93HUAS', status: 'existing' }
    ]
  },
  'Outdoor Ceiling Fan': {
    department: 'Lighting & Electrical',
    category_name: 'Outdoor Ceiling Fan',
    label: 'Fan Type',
    logic: 'Light or rating',
    values: [
      { name: 'With Light', style_id: null, status: 'new_needed' },
      { name: 'Without Light', style_id: null, status: 'new_needed' },
      { name: 'Hugger', style_id: null, status: 'new_needed' },
      { name: 'Damp Rated', style_id: null, status: 'new_needed' },
      { name: 'Wet Rated', style_id: null, status: 'new_needed' }
    ]
  },
  'Hugger Fans': {
    department: 'Lighting & Electrical',
    category_name: 'Hugger Fans',
    label: 'Fan Type',
    logic: 'Location or light',
    values: [
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'With Light', style_id: null, status: 'new_needed' },
      { name: 'Without Light', style_id: null, status: 'new_needed' }
    ]
  },
  'Fandelier Ceiling Fans': {
    department: 'Lighting & Electrical',
    category_name: 'Fandelier Ceiling Fans',
    label: 'Fandelier Type',
    logic: 'Chandelier style',
    values: [
      { name: 'Crystal', style_id: 'a1IaZ000001S91qUAC', status: 'existing' },
      { name: 'Drum', style_id: 'a1IaZ000001S91zUAC', status: 'existing' },
      { name: 'Candle', style_id: 'a1IaZ000001S91rUAC', status: 'existing' },
      { name: 'Globe', style_id: 'a1IaZ000001S920UAC', status: 'existing' }
    ]
  },
  'Large Ceiling Fans': {
    department: 'Lighting & Electrical',
    category_name: 'Large Ceiling Fans',
    label: 'Fan Type',
    logic: 'Location or style',
    values: [
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'With Light', style_id: null, status: 'new_needed' },
      { name: 'Without Light', style_id: null, status: 'new_needed' },
      { name: 'Industrial', style_id: 'a1IaZ000001Sjb7UAC', status: 'existing' }
    ]
  },
  'Small Ceiling Fans': {
    department: 'Lighting & Electrical',
    category_name: 'Small Ceiling Fans',
    label: 'Fan Type',
    logic: 'Location or light',
    values: [
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'With Light', style_id: null, status: 'new_needed' },
      { name: 'Without Light', style_id: null, status: 'new_needed' }
    ]
  },
  'Smart Home Fans': {
    department: 'Lighting & Electrical',
    category_name: 'Smart Home Fans',
    label: 'Fan Type',
    logic: 'Location or light',
    values: [
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'With Light', style_id: null, status: 'new_needed' },
      { name: 'Without Light', style_id: null, status: 'new_needed' }
    ]
  },
  'Ceiling Fan Accessory': {
    department: 'Lighting & Electrical',
    category_name: 'Ceiling Fan Accessory',
    label: 'Accessory Type',
    logic: 'Accessory type',
    values: [
      { name: 'Downrod', style_id: null, status: 'new_needed' },
      { name: 'Remote', style_id: null, status: 'new_needed' },
      { name: 'Light Kit', style_id: null, status: 'new_needed' },
      { name: 'Blade', style_id: null, status: 'new_needed' },
      { name: 'Wall Control', style_id: null, status: 'new_needed' }
    ]
  },
  'Wall Mounted Fans': {
    department: 'Lighting & Electrical',
    category_name: 'Wall Mounted Fans',
    label: 'Fan Type',
    logic: 'Location or movement',
    values: [
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'Oscillating', style_id: null, status: 'new_needed' },
      { name: 'Fixed', style_id: null, status: 'new_needed' }
    ]
  },
  'Air Circulator': {
    department: 'Lighting & Electrical',
    category_name: 'Air Circulator',
    label: 'Circulator Type',
    logic: 'Placement',
    values: [
      { name: 'Floor', style_id: null, status: 'new_needed' },
      { name: 'Table', style_id: 'a1IaZ000001S90TUAS', status: 'existing' },
      { name: 'Wall Mount', style_id: null, status: 'new_needed' },
      { name: 'Whole Room', style_id: null, status: 'new_needed' }
    ]
  },
  'Attic Fan': {
    department: 'Lighting & Electrical',
    category_name: 'Attic Fan',
    label: 'Attic Fan Type',
    logic: 'Installation or power type',
    values: [
      { name: 'Roof Mount', style_id: null, status: 'new_needed' },
      { name: 'Gable Mount', style_id: null, status: 'new_needed' },
      { name: 'Solar', style_id: null, status: 'new_needed' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' }
    ]
  },
  'Chandelier': {
    department: 'Lighting & Electrical',
    category_name: 'Chandelier',
    label: 'Chandelier Type',
    logic: 'Shape/form',
    values: [
      { name: 'Crystal', style_id: 'a1IaZ000001S91qUAC', status: 'existing' },
      { name: 'Candle', style_id: 'a1IaZ000001S91rUAC', status: 'existing' },
      { name: 'Drum', style_id: 'a1IaZ000001S91zUAC', status: 'existing' },
      { name: 'Globe', style_id: 'a1IaZ000001S920UAC', status: 'existing' },
      { name: 'Sputnik', style_id: 'a1IaZ000001S91uUAC', status: 'existing' },
      { name: 'Tiered', style_id: 'a1IaZ000001S91vUAC', status: 'existing' },
      { name: 'Linear', style_id: 'a1IaZ000001S922UAC', status: 'existing' },
      { name: 'Lantern', style_id: null, status: 'new_needed' },
      { name: 'Empire', style_id: null, status: 'new_needed' }
    ]
  },
  'Pendant': {
    department: 'Lighting & Electrical',
    category_name: 'Pendant',
    label: 'Pendant Type',
    logic: 'Shape',
    values: [
      { name: 'Mini', style_id: 'a1IaZ000001S91xUAC', status: 'existing' },
      { name: 'Multi-Light', style_id: 'a1IaZ000001S91yUAC', status: 'existing' },
      { name: 'Drum', style_id: 'a1IaZ000001S91zUAC', status: 'existing' },
      { name: 'Globe', style_id: 'a1IaZ000001S920UAC', status: 'existing' },
      { name: 'Cone', style_id: 'a1IaZ000001S921UAC', status: 'existing' },
      { name: 'Linear', style_id: 'a1IaZ000001S922UAC', status: 'existing' },
      { name: 'Cluster', style_id: 'a1IaZ000001S923UAC', status: 'existing' },
      { name: 'Lantern', style_id: null, status: 'new_needed' },
      { name: 'Schoolhouse', style_id: null, status: 'new_needed' }
    ]
  },
  'Ceiling Light': {
    department: 'Lighting & Electrical',
    category_name: 'Ceiling Light',
    label: 'Ceiling Light Type',
    logic: 'Fixture type',
    values: [
      { name: 'Flush Mount', style_id: 'a1IaZ000001S91gUAC', status: 'existing' },
      { name: 'Semi-Flush', style_id: 'a1IaZ000001S91hUAC', status: 'existing' },
      { name: 'Recessed', style_id: 'a1IaZ000001Si2LUAS', status: 'existing' },
      { name: 'Track', style_id: 'a1IaZ000001S91jUAC', status: 'existing' },
      { name: 'Linear', style_id: 'a1IaZ000001S922UAC', status: 'existing' }
    ]
  },
  'Flush and Semi-Flush': {
    department: 'Lighting & Electrical',
    category_name: 'Flush and Semi-Flush',
    label: 'Mount Type',
    logic: 'Mount type or shape',
    values: [
      { name: 'Flush Mount', style_id: 'a1IaZ000001S91gUAC', status: 'existing' },
      { name: 'Semi-Flush', style_id: 'a1IaZ000001S91hUAC', status: 'existing' },
      { name: 'Drum', style_id: 'a1IaZ000001S91zUAC', status: 'existing' },
      { name: 'Globe', style_id: 'a1IaZ000001S920UAC', status: 'existing' }
    ]
  },
  'Wall Sconce': {
    department: 'Lighting & Electrical',
    category_name: 'Wall Sconce',
    label: 'Sconce Type',
    logic: 'Light direction or style',
    values: [
      { name: 'Up Light', style_id: 'a1IaZ000001S91lUAC', status: 'existing' },
      { name: 'Down Light', style_id: 'a1IaZ000001S91mUAC', status: 'existing' },
      { name: 'Swing Arm', style_id: 'a1IaZ000001S91nUAC', status: 'existing' },
      { name: 'Picture Light', style_id: 'a1IaZ000001S91oUAC', status: 'existing' },
      { name: 'Torch', style_id: 'a1IaZ000001S91pUAC', status: 'existing' },
      { name: 'Candle', style_id: 'a1IaZ000001S91rUAC', status: 'existing' }
    ]
  },
  'Vanity Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Vanity Lighting',
    label: 'Vanity Light Type',
    logic: 'Fixture type',
    values: [
      { name: 'Vanity', style_id: 'a1IaZ000001S91NUAS', status: 'existing' },
      { name: 'Bath Bar', style_id: 'a1IaZ000001S91OUAS', status: 'existing' },
      { name: 'Sconce', style_id: 'a1IaZ000001S91PUAS', status: 'existing' },
      { name: 'Globe', style_id: 'a1IaZ000001S920UAC', status: 'existing' }
    ]
  },
  'Bathroom Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Bathroom Lighting',
    label: 'Bathroom Light Type',
    logic: 'Fixture type',
    values: [
      { name: 'Vanity', style_id: 'a1IaZ000001S91NUAS', status: 'existing' },
      { name: 'Bath Bar', style_id: 'a1IaZ000001S91OUAS', status: 'existing' },
      { name: 'Sconce', style_id: 'a1IaZ000001S91PUAS', status: 'existing' },
      { name: 'Flush Mount', style_id: 'a1IaZ000001S91gUAC', status: 'existing' },
      { name: 'Pendant', style_id: 'a1IaZ000001S91SUAS', status: 'existing' }
    ]
  },
  'Kitchen Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Kitchen Lighting',
    label: 'Kitchen Light Type',
    logic: 'Fixture type or location',
    values: [
      { name: 'Pendant', style_id: 'a1IaZ000001S91SUAS', status: 'existing' },
      { name: 'Island', style_id: 'a1IaZ000001S91UUAS', status: 'existing' },
      { name: 'Under Cabinet', style_id: 'a1IaZ000001S91TUAS', status: 'existing' },
      { name: 'Track', style_id: 'a1IaZ000001S91jUAC', status: 'existing' },
      { name: 'Flush Mount', style_id: 'a1IaZ000001S91gUAC', status: 'existing' },
      { name: 'Recessed', style_id: 'a1IaZ000001Si2LUAS', status: 'existing' },
      { name: 'Linear', style_id: 'a1IaZ000001S922UAC', status: 'existing' }
    ]
  },
  'Island Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Island Lighting',
    label: 'Island Light Type',
    logic: 'Fixture form',
    values: [
      { name: 'Linear', style_id: 'a1IaZ000001S922UAC', status: 'existing' },
      { name: 'Multi-Light', style_id: 'a1IaZ000001S91yUAC', status: 'existing' },
      { name: 'Pendant', style_id: 'a1IaZ000001S91SUAS', status: 'existing' },
      { name: 'Chandelier', style_id: null, status: 'new_needed' }
    ]
  },
  'Outdoor Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Outdoor Lighting',
    label: 'Outdoor Light Type',
    logic: 'Fixture type/application',
    values: [
      { name: 'Wall Lantern', style_id: 'a1IaZ000001S91ZUAS', status: 'existing' },
      { name: 'Post Light', style_id: 'a1IaZ000001S91aUAC', status: 'existing' },
      { name: 'Path Light', style_id: 'a1IaZ000001S91bUAC', status: 'existing' },
      { name: 'Flood Light', style_id: 'a1IaZ000001S91cUAC', status: 'existing' },
      { name: 'Landscape', style_id: 'a1IaZ000001S91dUAC', status: 'existing' },
      { name: 'Security', style_id: 'a1IaZ000001S91eUAC', status: 'existing' },
      { name: 'Deck', style_id: 'a1IaZ000001S91fUAC', status: 'existing' },
      { name: 'Ceiling Mounted', style_id: 'a1IaZ000001SfSgUAK', status: 'existing' }
    ]
  },
  'Landscape Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Landscape Lighting',
    label: 'Landscape Light Type',
    logic: 'Fixture type',
    values: [
      { name: 'Path Light', style_id: 'a1IaZ000001S91bUAC', status: 'existing' },
      { name: 'Spotlight', style_id: null, status: 'new_needed' },
      { name: 'Flood Light', style_id: 'a1IaZ000001S91cUAC', status: 'existing' },
      { name: 'Well Light', style_id: null, status: 'new_needed' },
      { name: 'Deck', style_id: 'a1IaZ000001S91fUAC', status: 'existing' },
      { name: 'Bollard', style_id: null, status: 'new_needed' }
    ]
  },
  'Post Light': {
    department: 'Lighting & Electrical',
    category_name: 'Post Light',
    label: 'Post Light Type',
    logic: 'Mount type or power',
    values: [
      { name: 'Post Light', style_id: 'a1IaZ000001S91aUAC', status: 'existing' },
      { name: 'Pier Mount', style_id: null, status: 'new_needed' },
      { name: 'Solar', style_id: null, status: 'new_needed' },
      { name: 'LED', style_id: 'a1IaZ000001TeazUAC', status: 'existing' }
    ]
  },
  'Recessed Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Recessed Lighting',
    label: 'Recessed Light Type',
    logic: 'Installation type or component',
    values: [
      { name: 'New Construction', style_id: null, status: 'new_needed' },
      { name: 'Remodel', style_id: null, status: 'new_needed' },
      { name: 'Canless', style_id: null, status: 'new_needed' },
      { name: 'LED', style_id: 'a1IaZ000001TeazUAC', status: 'existing' },
      { name: 'Trim', style_id: null, status: 'new_needed' },
      { name: 'Housing', style_id: null, status: 'new_needed' }
    ]
  },
  'Step Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Step Lighting',
    label: 'Step Light Type',
    logic: 'Installation type',
    values: [
      { name: 'Recessed', style_id: 'a1IaZ000001Si2LUAS', status: 'existing' },
      { name: 'Surface Mount', style_id: null, status: 'new_needed' },
      { name: 'Solar', style_id: null, status: 'new_needed' },
      { name: 'LED', style_id: 'a1IaZ000001TeazUAC', status: 'existing' }
    ]
  },
  'Track and Rail Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'Track and Rail Lighting',
    label: 'Track Light Type',
    logic: 'Component type',
    values: [
      { name: 'Track', style_id: 'a1IaZ000001S91jUAC', status: 'existing' },
      { name: 'Track Head', style_id: null, status: 'new_needed' },
      { name: 'Monorail', style_id: null, status: 'new_needed' },
      { name: 'Connector', style_id: null, status: 'new_needed' },
      { name: 'LED', style_id: 'a1IaZ000001TeazUAC', status: 'existing' }
    ]
  },
  'Under Cabinet Light': {
    department: 'Lighting & Electrical',
    category_name: 'Under Cabinet Light',
    label: 'Under Cabinet Light Type',
    logic: 'Fixture form',
    values: [
      { name: 'LED Strip', style_id: null, status: 'new_needed' },
      { name: 'Puck Light', style_id: null, status: 'new_needed' },
      { name: 'Light Bar', style_id: null, status: 'new_needed' },
      { name: 'Tape Light', style_id: null, status: 'new_needed' }
    ]
  },
  'Lamp': {
    department: 'Lighting & Electrical',
    category_name: 'Lamp',
    label: 'Lamp Type',
    logic: 'Lamp form',
    values: [
      { name: 'Table Lamp', style_id: null, status: 'new_needed' },
      { name: 'Floor Lamp', style_id: null, status: 'new_needed' },
      { name: 'Desk Lamp', style_id: null, status: 'new_needed' },
      { name: 'Buffet Lamp', style_id: null, status: 'new_needed' },
      { name: 'Arc Lamp', style_id: null, status: 'new_needed' },
      { name: 'Torchiere', style_id: null, status: 'new_needed' }
    ]
  },
  'LED Lighting': {
    department: 'Lighting & Electrical',
    category_name: 'LED Lighting',
    label: 'LED Light Type',
    logic: 'LED product type',
    values: [
      { name: 'LED Strip', style_id: null, status: 'new_needed' },
      { name: 'LED Panel', style_id: null, status: 'new_needed' },
      { name: 'LED Retrofit', style_id: null, status: 'new_needed' },
      { name: 'LED Tube', style_id: null, status: 'new_needed' }
    ]
  },
  'Light Bulbs': {
    department: 'Lighting & Electrical',
    category_name: 'Light Bulbs',
    label: 'Bulb Type',
    logic: 'Bulb technology',
    values: [
      { name: 'LED', style_id: 'a1IaZ000001TeazUAC', status: 'existing' },
      { name: 'Incandescent', style_id: null, status: 'new_needed' },
      { name: 'CFL', style_id: null, status: 'new_needed' },
      { name: 'Halogen', style_id: null, status: 'new_needed' },
      { name: 'Smart Bulb', style_id: null, status: 'new_needed' },
      { name: 'Vintage', style_id: 'a1IaZ000001TW2LUAW', status: 'existing' }
    ]
  },
  'Light Switches & Dimmers': {
    department: 'Lighting & Electrical',
    category_name: 'Light Switches & Dimmers',
    label: 'Switch Type',
    logic: 'Switch function',
    values: [
      { name: 'Standard Switch', style_id: null, status: 'new_needed' },
      { name: 'Dimmer', style_id: null, status: 'new_needed' },
      { name: 'Smart Switch', style_id: null, status: 'new_needed' },
      { name: 'Motion Sensor', style_id: 'a1IaZ000001TZY5UAO', status: 'existing' },
      { name: 'Timer', style_id: null, status: 'new_needed' },
      { name: 'Fan Control', style_id: null, status: 'new_needed' }
    ]
  },
  'Lighting Accessory': {
    department: 'Lighting & Electrical',
    category_name: 'Lighting Accessory',
    label: 'Accessory Type',
    logic: 'Accessory type',
    values: [
      { name: 'Shade', style_id: null, status: 'new_needed' },
      { name: 'Chain', style_id: null, status: 'new_needed' },
      { name: 'Canopy', style_id: null, status: 'new_needed' },
      { name: 'Glass', style_id: null, status: 'new_needed' },
      { name: 'Socket', style_id: null, status: 'new_needed' }
    ]
  },
  'Cabinet Hardware': {
    department: 'Hardware',
    category_name: 'Cabinet Hardware',
    label: 'Hardware Type',
    logic: 'Hardware type',
    values: [
      { name: 'Knob', style_id: 'a1IaZ000001S93dUAC', status: 'existing' },
      { name: 'Pull', style_id: null, status: 'new_needed' },
      { name: 'Handle', style_id: null, status: 'new_needed' },
      { name: 'Hinge', style_id: 'a1IaZ000001S93fUAC', status: 'existing' },
      { name: 'Catch', style_id: null, status: 'new_needed' }
    ]
  },
  'Cabinet Knob': {
    department: 'Hardware',
    category_name: 'Cabinet Knob',
    label: 'Knob Shape',
    logic: 'Shape',
    values: [
      { name: 'Round', style_id: 'a1IaZ000001S93KUAS', status: 'existing' },
      { name: 'Square', style_id: null, status: 'new_needed' },
      { name: 'Oval', style_id: null, status: 'new_needed' },
      { name: 'Mushroom', style_id: null, status: 'new_needed' },
      { name: 'Crystal', style_id: 'a1IaZ000001S91qUAC', status: 'existing' },
      { name: 'Ceramic', style_id: null, status: 'new_needed' }
    ]
  },
  'Cabinet Pull': {
    department: 'Hardware',
    category_name: 'Cabinet Pull',
    label: 'Pull Type',
    logic: 'Pull style',
    values: [
      { name: 'Bar Pull', style_id: null, status: 'new_needed' },
      { name: 'Cup Pull', style_id: null, status: 'new_needed' },
      { name: 'Bin Pull', style_id: null, status: 'new_needed' },
      { name: 'Finger Pull', style_id: null, status: 'new_needed' },
      { name: 'Ring Pull', style_id: null, status: 'new_needed' },
      { name: 'Arch Pull', style_id: null, status: 'new_needed' }
    ]
  },
  'Affordable Cabinet Knob': {
    department: 'Hardware',
    category_name: 'Affordable Cabinet Knob',
    label: 'Knob Shape',
    logic: 'Shape',
    values: [
      { name: 'Round', style_id: 'a1IaZ000001S93KUAS', status: 'existing' },
      { name: 'Square', style_id: null, status: 'new_needed' },
      { name: 'Oval', style_id: null, status: 'new_needed' },
      { name: 'Mushroom', style_id: null, status: 'new_needed' }
    ]
  },
  'Affordable Cabinet Pull': {
    department: 'Hardware',
    category_name: 'Affordable Cabinet Pull',
    label: 'Pull Type',
    logic: 'Pull style',
    values: [
      { name: 'Bar Pull', style_id: null, status: 'new_needed' },
      { name: 'Cup Pull', style_id: null, status: 'new_needed' },
      { name: 'Bin Pull', style_id: null, status: 'new_needed' },
      { name: 'Wire Pull', style_id: null, status: 'new_needed' }
    ]
  },
  'Luxury Cabinet Knob': {
    department: 'Hardware',
    category_name: 'Luxury Cabinet Knob',
    label: 'Knob Type',
    logic: 'Material/style',
    values: [
      { name: 'Crystal', style_id: 'a1IaZ000001S91qUAC', status: 'existing' },
      { name: 'Glass', style_id: null, status: 'new_needed' },
      { name: 'Ceramic', style_id: null, status: 'new_needed' },
      { name: 'Metal', style_id: null, status: 'new_needed' },
      { name: 'Jeweled', style_id: null, status: 'new_needed' }
    ]
  },
  'Luxury Cabinet Pull': {
    department: 'Hardware',
    category_name: 'Luxury Cabinet Pull',
    label: 'Pull Type',
    logic: 'Pull style',
    values: [
      { name: 'Appliance Pull', style_id: null, status: 'new_needed' },
      { name: 'Designer Pull', style_id: null, status: 'new_needed' },
      { name: 'Crystal Pull', style_id: null, status: 'new_needed' },
      { name: 'Art Pull', style_id: null, status: 'new_needed' }
    ]
  },
  'Appliance Pull': {
    department: 'Hardware',
    category_name: 'Appliance Pull',
    label: 'Pull Type',
    logic: 'Appliance type',
    values: [
      { name: 'Refrigerator Pull', style_id: null, status: 'new_needed' },
      { name: 'Oven Pull', style_id: null, status: 'new_needed' },
      { name: 'Dishwasher Pull', style_id: null, status: 'new_needed' },
      { name: 'Professional Pull', style_id: null, status: 'new_needed' }
    ]
  },
  'Designer Cabinet Hardware': {
    department: 'Hardware',
    category_name: 'Designer Cabinet Hardware',
    label: 'Hardware Type',
    logic: 'Hardware type',
    values: [
      { name: 'Designer Knob', style_id: null, status: 'new_needed' },
      { name: 'Designer Pull', style_id: null, status: 'new_needed' },
      { name: 'Designer Handle', style_id: null, status: 'new_needed' }
    ]
  },
  'Cabinet Hinge': {
    department: 'Hardware',
    category_name: 'Cabinet Hinge',
    label: 'Hinge Type',
    logic: 'Visibility/function',
    values: [
      { name: 'Concealed', style_id: null, status: 'new_needed' },
      { name: 'Semi-Concealed', style_id: null, status: 'new_needed' },
      { name: 'Exposed', style_id: null, status: 'new_needed' },
      { name: 'Soft Close', style_id: null, status: 'new_needed' },
      { name: 'Overlay', style_id: null, status: 'new_needed' },
      { name: 'Inset', style_id: null, status: 'new_needed' }
    ]
  },
  'Cabinet Catch and Latch': {
    department: 'Hardware',
    category_name: 'Cabinet Catch and Latch',
    label: 'Catch Type',
    logic: 'Mechanism',
    values: [
      { name: 'Magnetic', style_id: null, status: 'new_needed' },
      { name: 'Roller', style_id: null, status: 'new_needed' },
      { name: 'Touch Latch', style_id: null, status: 'new_needed' },
      { name: 'Push to Open', style_id: null, status: 'new_needed' },
      { name: 'Ball Catch', style_id: null, status: 'new_needed' }
    ]
  },
  'Cabinet Lock': {
    department: 'Hardware',
    category_name: 'Cabinet Lock',
    label: 'Lock Type',
    logic: 'Lock type',
    values: [
      { name: 'Cam Lock', style_id: null, status: 'new_needed' },
      { name: 'Drawer Lock', style_id: null, status: 'new_needed' },
      { name: 'Glass Door Lock', style_id: null, status: 'new_needed' },
      { name: 'Push Lock', style_id: null, status: 'new_needed' },
      { name: 'Keyed Lock', style_id: null, status: 'new_needed' }
    ]
  },
  'Cabinet Finishing': {
    department: 'Hardware',
    category_name: 'Cabinet Finishing',
    label: 'Finishing Type',
    logic: 'Finishing component',
    values: [
      { name: 'Edge Banding', style_id: null, status: 'new_needed' },
      { name: 'Molding', style_id: null, status: 'new_needed' },
      { name: 'Toe Kick', style_id: null, status: 'new_needed' },
      { name: 'End Panel', style_id: null, status: 'new_needed' },
      { name: 'Crown Molding', style_id: null, status: 'new_needed' }
    ]
  },
  'Cabinet Organization and Storage': {
    department: 'Hardware',
    category_name: 'Cabinet Organization and Storage',
    label: 'Organizer Type',
    logic: 'Organizer type',
    values: [
      { name: 'Pull-Out Shelf', style_id: null, status: 'new_needed' },
      { name: 'Lazy Susan', style_id: null, status: 'new_needed' },
      { name: 'Drawer Insert', style_id: null, status: 'new_needed' },
      { name: 'Door Organizer', style_id: null, status: 'new_needed' },
      { name: 'Trash Pull-Out', style_id: null, status: 'new_needed' }
    ]
  },
  'Drawer Slide and Accessory': {
    department: 'Hardware',
    category_name: 'Drawer Slide and Accessory',
    label: 'Slide Type',
    logic: 'Slide type',
    values: [
      { name: 'Ball Bearing', style_id: null, status: 'new_needed' },
      { name: 'Soft Close', style_id: null, status: 'new_needed' },
      { name: 'Undermount', style_id: 'a1IaZ000001S93PUAS', status: 'existing' },
      { name: 'Side Mount', style_id: null, status: 'new_needed' },
      { name: 'Center Mount', style_id: null, status: 'new_needed' }
    ]
  },
  'Vanity Cabinet Hardware': {
    department: 'Hardware',
    category_name: 'Vanity Cabinet Hardware',
    label: 'Hardware Type',
    logic: 'Hardware type',
    values: [
      { name: 'Knob', style_id: 'a1IaZ000001S93dUAC', status: 'existing' },
      { name: 'Pull', style_id: null, status: 'new_needed' },
      { name: 'Handle', style_id: null, status: 'new_needed' }
    ]
  },
  'Backplate': {
    department: 'Hardware',
    category_name: 'Backplate',
    label: 'Backplate Shape',
    logic: 'Shape',
    values: [
      { name: 'Round', style_id: 'a1IaZ000001S93KUAS', status: 'existing' },
      { name: 'Oval', style_id: null, status: 'new_needed' },
      { name: 'Rectangular', style_id: null, status: 'new_needed' },
      { name: 'Square', style_id: null, status: 'new_needed' }
    ]
  },
  'Door Hardware: Knobs and Levers': {
    department: 'Hardware',
    category_name: 'Door Hardware: Knobs and Levers',
    label: 'Hardware Type',
    logic: 'Hardware type',
    values: [
      { name: 'Knob', style_id: 'a1IaZ000001S93dUAC', status: 'existing' },
      { name: 'Lever', style_id: 'a1IaZ000001S93cUAC', status: 'existing' }
    ]
  },
  'Door Knob': {
    department: 'Hardware',
    category_name: 'Door Knob',
    label: 'Function',
    logic: 'Door function',
    values: [
      { name: 'Keyed Entry', style_id: 'a1IaZ000001S93XUAS', status: 'existing' },
      { name: 'Privacy', style_id: 'a1IaZ000001S93YUAS', status: 'existing' },
      { name: 'Passage', style_id: 'a1IaZ000001S93ZUAS', status: 'existing' },
      { name: 'Dummy', style_id: 'a1IaZ000001S93aUAC', status: 'existing' }
    ]
  },
  'Door Lever': {
    department: 'Hardware',
    category_name: 'Door Lever',
    label: 'Function',
    logic: 'Door function',
    values: [
      { name: 'Keyed Entry', style_id: 'a1IaZ000001S93XUAS', status: 'existing' },
      { name: 'Privacy', style_id: 'a1IaZ000001S93YUAS', status: 'existing' },
      { name: 'Passage', style_id: 'a1IaZ000001S93ZUAS', status: 'existing' },
      { name: 'Dummy', style_id: 'a1IaZ000001S93aUAC', status: 'existing' }
    ]
  },
  'Deadbolt': {
    department: 'Hardware',
    category_name: 'Deadbolt',
    label: 'Deadbolt Type',
    logic: 'Lock type',
    values: [
      { name: 'Single Cylinder', style_id: null, status: 'new_needed' },
      { name: 'Double Cylinder', style_id: null, status: 'new_needed' },
      { name: 'Smart', style_id: 'a1IaZ000001S93HUAS', status: 'existing' },
      { name: 'Keyless', style_id: null, status: 'new_needed' }
    ]
  },
  'Handleset': {
    department: 'Hardware',
    category_name: 'Handleset',
    label: 'Handleset Type',
    logic: 'Lock configuration',
    values: [
      { name: 'Single Cylinder', style_id: null, status: 'new_needed' },
      { name: 'Double Cylinder', style_id: null, status: 'new_needed' },
      { name: 'Full Dummy', style_id: null, status: 'new_needed' },
      { name: 'Sectional', style_id: null, status: 'new_needed' }
    ]
  },
  'Door Entry Sets': {
    department: 'Hardware',
    category_name: 'Door Entry Sets',
    label: 'Entry Set Type',
    logic: 'Handle type',
    values: [
      { name: 'Knob Entry', style_id: null, status: 'new_needed' },
      { name: 'Lever Entry', style_id: null, status: 'new_needed' },
      { name: 'Handleset', style_id: null, status: 'new_needed' },
      { name: 'Mortise', style_id: null, status: 'new_needed' }
    ]
  },
  'Keyless Entry': {
    department: 'Hardware',
    category_name: 'Keyless Entry',
    label: 'Keyless Type',
    logic: 'Access method',
    values: [
      { name: 'Keypad', style_id: null, status: 'new_needed' },
      { name: 'Touchscreen', style_id: null, status: 'new_needed' },
      { name: 'Smart Lock', style_id: null, status: 'new_needed' },
      { name: 'Biometric', style_id: null, status: 'new_needed' },
      { name: 'Bluetooth', style_id: null, status: 'new_needed' }
    ]
  },
  'Keyed Hardware': {
    department: 'Hardware',
    category_name: 'Keyed Hardware',
    label: 'Hardware Type',
    logic: 'Hardware type',
    values: [
      { name: 'Knob', style_id: 'a1IaZ000001S93dUAC', status: 'existing' },
      { name: 'Lever', style_id: 'a1IaZ000001S93cUAC', status: 'existing' },
      { name: 'Deadbolt', style_id: 'a1IaZ000001S93bUAC', status: 'existing' },
      { name: 'Handleset', style_id: null, status: 'new_needed' }
    ]
  },
  'Door Hardware Parts': {
    department: 'Hardware',
    category_name: 'Door Hardware Parts',
    label: 'Part Type',
    logic: 'Part type',
    values: [
      { name: 'Lever', style_id: 'a1IaZ000001S93cUAC', status: 'existing' },
      { name: 'Knob', style_id: 'a1IaZ000001S93dUAC', status: 'existing' },
      { name: 'Handle Set', style_id: 'a1IaZ000001S93eUAC', status: 'existing' },
      { name: 'Hinge', style_id: 'a1IaZ000001S93fUAC', status: 'existing' },
      { name: 'Strike Plate', style_id: 'a1IaZ000001S93gUAC', status: 'existing' },
      { name: 'Deadbolt', style_id: 'a1IaZ000001S93bUAC', status: 'existing' },
      { name: 'Cylinder', style_id: null, status: 'new_needed' }
    ]
  },
  'Door Hinge': {
    department: 'Hardware',
    category_name: 'Door Hinge',
    label: 'Hinge Type',
    logic: 'Hinge type',
    values: [
      { name: 'Butt Hinge', style_id: null, status: 'new_needed' },
      { name: 'Ball Bearing', style_id: null, status: 'new_needed' },
      { name: 'Spring Hinge', style_id: null, status: 'new_needed' },
      { name: 'Piano Hinge', style_id: null, status: 'new_needed' },
      { name: 'Strap Hinge', style_id: null, status: 'new_needed' }
    ]
  },
  'Mortise Lock': {
    department: 'Hardware',
    category_name: 'Mortise Lock',
    label: 'Mortise Type',
    logic: 'Function',
    values: [
      { name: 'Entry', style_id: null, status: 'new_needed' },
      { name: 'Privacy', style_id: 'a1IaZ000001S93YUAS', status: 'existing' },
      { name: 'Passage', style_id: 'a1IaZ000001S93ZUAS', status: 'existing' },
      { name: 'Classroom', style_id: null, status: 'new_needed' },
      { name: 'Storeroom', style_id: null, status: 'new_needed' }
    ]
  },
  'Lock Combo Pack': {
    department: 'Hardware',
    category_name: 'Lock Combo Pack',
    label: 'Combo Type',
    logic: 'Combination',
    values: [
      { name: 'Knob + Deadbolt', style_id: null, status: 'new_needed' },
      { name: 'Lever + Deadbolt', style_id: null, status: 'new_needed' },
      { name: 'Handleset + Deadbolt', style_id: null, status: 'new_needed' }
    ]
  },
  'Barn Door Hardware': {
    department: 'Hardware',
    category_name: 'Barn Door Hardware',
    label: 'Hardware Type',
    logic: 'Component type',
    values: [
      { name: 'Track Kit', style_id: null, status: 'new_needed' },
      { name: 'Hanger', style_id: null, status: 'new_needed' },
      { name: 'Rail', style_id: null, status: 'new_needed' },
      { name: 'Floor Guide', style_id: null, status: 'new_needed' },
      { name: 'Handle', style_id: null, status: 'new_needed' }
    ]
  },
  'Closet and Pocket Door Hardware': {
    department: 'Hardware',
    category_name: 'Closet and Pocket Door Hardware',
    label: 'Hardware Type',
    logic: 'Hardware type',
    values: [
      { name: 'Pocket Door Kit', style_id: null, status: 'new_needed' },
      { name: 'Closet Rod', style_id: null, status: 'new_needed' },
      { name: 'Track', style_id: 'a1IaZ000001S91jUAC', status: 'existing' },
      { name: 'Pull', style_id: null, status: 'new_needed' },
      { name: 'Lock', style_id: null, status: 'new_needed' }
    ]
  },
  'Sliding Door Hardware': {
    department: 'Hardware',
    category_name: 'Sliding Door Hardware',
    label: 'Hardware Type',
    logic: 'Component type',
    values: [
      { name: 'Track', style_id: 'a1IaZ000001S91jUAC', status: 'existing' },
      { name: 'Roller', style_id: null, status: 'new_needed' },
      { name: 'Handle', style_id: null, status: 'new_needed' },
      { name: 'Lock', style_id: null, status: 'new_needed' },
      { name: 'Floor Guide', style_id: null, status: 'new_needed' }
    ]
  },
  'Screen and Storm Door Hardware': {
    department: 'Hardware',
    category_name: 'Screen and Storm Door Hardware',
    label: 'Hardware Type',
    logic: 'Hardware type',
    values: [
      { name: 'Handle Set', style_id: 'a1IaZ000001S93eUAC', status: 'existing' },
      { name: 'Closer', style_id: null, status: 'new_needed' },
      { name: 'Hinge', style_id: 'a1IaZ000001S93fUAC', status: 'existing' },
      { name: 'Latch', style_id: null, status: 'new_needed' },
      { name: 'Push Bar', style_id: null, status: 'new_needed' }
    ]
  },
  'Commercial Door Hardware': {
    department: 'Hardware',
    category_name: 'Commercial Door Hardware',
    label: 'Hardware Type',
    logic: 'Hardware type',
    values: [
      { name: 'Exit Device', style_id: null, status: 'new_needed' },
      { name: 'Door Closer', style_id: null, status: 'new_needed' },
      { name: 'Push/Pull', style_id: null, status: 'new_needed' },
      { name: 'Kick Plate', style_id: null, status: 'new_needed' },
      { name: 'Mortise Lock', style_id: null, status: 'new_needed' }
    ]
  },
  'Multi Point Door Hardware': {
    department: 'Hardware',
    category_name: 'Multi Point Door Hardware',
    label: 'Hardware Type',
    logic: 'Component type',
    values: [
      { name: 'Handleset', style_id: null, status: 'new_needed' },
      { name: 'Lock', style_id: null, status: 'new_needed' },
      { name: 'Strike', style_id: null, status: 'new_needed' },
      { name: 'Gear', style_id: null, status: 'new_needed' }
    ]
  },
  'Door': {
    department: 'Hardware',
    category_name: 'Door',
    label: 'Door Type',
    logic: 'Door type',
    values: [
      { name: 'Interior', style_id: null, status: 'new_needed' },
      { name: 'Exterior', style_id: null, status: 'new_needed' },
      { name: 'Barn', style_id: null, status: 'new_needed' },
      { name: 'Pocket', style_id: null, status: 'new_needed' },
      { name: 'French', style_id: null, status: 'new_needed' },
      { name: 'Bi-Fold', style_id: null, status: 'new_needed' }
    ]
  },
  'Safes, Locks and Lock Boxes': {
    department: 'Hardware',
    category_name: 'Safes, Locks and Lock Boxes',
    label: 'Product Type',
    logic: 'Product type',
    values: [
      { name: 'Safe', style_id: null, status: 'new_needed' },
      { name: 'Lock Box', style_id: null, status: 'new_needed' },
      { name: 'Padlock', style_id: null, status: 'new_needed' },
      { name: 'Key Cabinet', style_id: null, status: 'new_needed' },
      { name: 'Cash Box', style_id: null, status: 'new_needed' }
    ]
  },
  'Storage and Organization': {
    department: 'Hardware',
    category_name: 'Storage and Organization',
    label: 'Storage Type',
    logic: 'Storage type',
    values: [
      { name: 'Shelf', style_id: 'a1IaZ000001S93CUAS', status: 'existing' },
      { name: 'Hook', style_id: null, status: 'new_needed' },
      { name: 'Rack', style_id: null, status: 'new_needed' },
      { name: 'Bin', style_id: null, status: 'new_needed' },
      { name: 'Cabinet', style_id: null, status: 'new_needed' }
    ]
  },
  'Water Heater': {
    department: 'Heating & Cooling',
    category_name: 'Water Heater',
    label: 'Water Heater Type',
    logic: 'Heating technology',
    values: [
      { name: 'Tank', style_id: null, status: 'new_needed' },
      { name: 'Tankless', style_id: null, status: 'new_needed' },
      { name: 'Heat Pump', style_id: null, status: 'new_needed' },
      { name: 'Solar', style_id: null, status: 'new_needed' },
      { name: 'Point of Use', style_id: null, status: 'new_needed' }
    ]
  },
  'Tankless Water Heater': {
    department: 'Heating & Cooling',
    category_name: 'Tankless Water Heater',
    label: 'Tankless Type',
    logic: 'Fuel or installation',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' },
      { name: 'Indoor', style_id: 'a1IaZ000001SjMbUAK', status: 'existing' },
      { name: 'Condensing', style_id: null, status: 'new_needed' }
    ]
  },
  'Air Conditioner': {
    department: 'Heating & Cooling',
    category_name: 'Air Conditioner',
    label: 'AC Type',
    logic: 'Installation type',
    values: [
      { name: 'Window', style_id: null, status: 'new_needed' },
      { name: 'Portable', style_id: null, status: 'new_needed' },
      { name: 'Through-Wall', style_id: null, status: 'new_needed' },
      { name: 'Central', style_id: null, status: 'new_needed' },
      { name: 'Ductless', style_id: null, status: 'new_needed' }
    ]
  },
  'Mini Split Air Conditioner': {
    department: 'Heating & Cooling',
    category_name: 'Mini Split Air Conditioner',
    label: 'Mini Split Type',
    logic: 'Zone configuration',
    values: [
      { name: 'Single Zone', style_id: null, status: 'new_needed' },
      { name: 'Multi Zone', style_id: null, status: 'new_needed' },
      { name: 'Heat Pump', style_id: null, status: 'new_needed' },
      { name: 'Cooling Only', style_id: null, status: 'new_needed' }
    ]
  },
  'Dehumidifier': {
    department: 'Heating & Cooling',
    category_name: 'Dehumidifier',
    label: 'Dehumidifier Type',
    logic: 'Application',
    values: [
      { name: 'Portable', style_id: null, status: 'new_needed' },
      { name: 'Whole House', style_id: null, status: 'new_needed' },
      { name: 'Basement', style_id: null, status: 'new_needed' },
      { name: 'Crawl Space', style_id: null, status: 'new_needed' }
    ]
  },
  'Evaporative Cooler': {
    department: 'Heating & Cooling',
    category_name: 'Evaporative Cooler',
    label: 'Cooler Type',
    logic: 'Installation type',
    values: [
      { name: 'Portable', style_id: null, status: 'new_needed' },
      { name: 'Window', style_id: null, status: 'new_needed' },
      { name: 'Roof Mount', style_id: null, status: 'new_needed' },
      { name: 'Side Draft', style_id: null, status: 'new_needed' },
      { name: 'Down Draft', style_id: null, status: 'new_needed' }
    ]
  },
  'Exhaust Fan': {
    department: 'Heating & Cooling',
    category_name: 'Exhaust Fan',
    label: 'Exhaust Fan Type',
    logic: 'Application/mount',
    values: [
      { name: 'Bathroom', style_id: null, status: 'new_needed' },
      { name: 'Kitchen', style_id: null, status: 'new_needed' },
      { name: 'Inline', style_id: null, status: 'new_needed' },
      { name: 'Wall Mount', style_id: null, status: 'new_needed' },
      { name: 'Ceiling Mount', style_id: null, status: 'new_needed' }
    ]
  },
  'Room Heater': {
    department: 'Heating & Cooling',
    category_name: 'Room Heater',
    label: 'Heater Type',
    logic: 'Heating technology',
    values: [
      { name: 'Ceramic', style_id: null, status: 'new_needed' },
      { name: 'Infrared', style_id: null, status: 'new_needed' },
      { name: 'Oil Filled', style_id: null, status: 'new_needed' },
      { name: 'Fan Forced', style_id: null, status: 'new_needed' },
      { name: 'Radiant', style_id: null, status: 'new_needed' },
      { name: 'Convection', style_id: null, status: 'new_needed' }
    ]
  },
  'Indoor Heating': {
    department: 'Heating & Cooling',
    category_name: 'Indoor Heating',
    label: 'Heating Type',
    logic: 'Installation/type',
    values: [
      { name: 'Baseboard', style_id: null, status: 'new_needed' },
      { name: 'Wall Heater', style_id: null, status: 'new_needed' },
      { name: 'Floor Heater', style_id: null, status: 'new_needed' },
      { name: 'Fireplace Insert', style_id: null, status: 'new_needed' },
      { name: 'Space Heater', style_id: null, status: 'new_needed' }
    ]
  },
  'Patio Heater': {
    department: 'Heating & Cooling',
    category_name: 'Patio Heater',
    label: 'Patio Heater Type',
    logic: 'Fuel or mount type',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' },
      { name: 'Propane', style_id: null, status: 'new_needed' },
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Wall Mount', style_id: null, status: 'new_needed' },
      { name: 'Tabletop', style_id: null, status: 'new_needed' }
    ]
  },
  'Thermostat': {
    department: 'Heating & Cooling',
    category_name: 'Thermostat',
    label: 'Thermostat Type',
    logic: 'Technology/features',
    values: [
      { name: 'Smart', style_id: 'a1IaZ000001S93HUAS', status: 'existing' },
      { name: 'Programmable', style_id: null, status: 'new_needed' },
      { name: 'WiFi', style_id: null, status: 'new_needed' },
      { name: 'Manual', style_id: null, status: 'new_needed' },
      { name: 'Touchscreen', style_id: null, status: 'new_needed' }
    ]
  },
  'Air Filter': {
    department: 'Heating & Cooling',
    category_name: 'Air Filter',
    label: 'Filter Type',
    logic: 'Filter technology',
    values: [
      { name: 'HEPA', style_id: null, status: 'new_needed' },
      { name: 'Pleated', style_id: null, status: 'new_needed' },
      { name: 'Fiberglass', style_id: null, status: 'new_needed' },
      { name: 'Electrostatic', style_id: null, status: 'new_needed' },
      { name: 'Carbon', style_id: null, status: 'new_needed' }
    ]
  },
  'Ducting': {
    department: 'Heating & Cooling',
    category_name: 'Ducting',
    label: 'Duct Type',
    logic: 'Duct type',
    values: [
      { name: 'Flexible', style_id: null, status: 'new_needed' },
      { name: 'Rigid', style_id: null, status: 'new_needed' },
      { name: 'Insulated', style_id: null, status: 'new_needed' },
      { name: 'Connector', style_id: null, status: 'new_needed' },
      { name: 'Vent', style_id: null, status: 'new_needed' }
    ]
  },
  'Fire Pit': {
    department: 'Heating & Cooling',
    category_name: 'Fire Pit',
    label: 'Fire Pit Type',
    logic: 'Fuel type',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Wood Burning', style_id: null, status: 'new_needed' },
      { name: 'Propane', style_id: null, status: 'new_needed' },
      { name: 'Tabletop', style_id: null, status: 'new_needed' },
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' }
    ]
  },
  'Stove and Fireplace': {
    department: 'Heating & Cooling',
    category_name: 'Stove and Fireplace',
    label: 'Fireplace Type',
    logic: 'Fuel type',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' },
      { name: 'Wood Burning', style_id: null, status: 'new_needed' },
      { name: 'Pellet', style_id: null, status: 'new_needed' },
      { name: 'Ethanol', style_id: null, status: 'new_needed' },
      { name: 'Insert', style_id: 'a1IaZ0000019z3hUAA', status: 'existing' }
    ]
  },
  'Stove and Chimney Pipe': {
    department: 'Heating & Cooling',
    category_name: 'Stove and Chimney Pipe',
    label: 'Pipe Type',
    logic: 'Component type',
    values: [
      { name: 'Chimney Pipe', style_id: null, status: 'new_needed' },
      { name: 'Stove Pipe', style_id: null, status: 'new_needed' },
      { name: 'Connector', style_id: null, status: 'new_needed' },
      { name: 'Cap', style_id: null, status: 'new_needed' },
      { name: 'Flashing', style_id: null, status: 'new_needed' }
    ]
  },
  'Skylight': {
    department: 'Heating & Cooling',
    category_name: 'Skylight',
    label: 'Skylight Type',
    logic: 'Operation/mount type',
    values: [
      { name: 'Fixed', style_id: null, status: 'new_needed' },
      { name: 'Vented', style_id: null, status: 'new_needed' },
      { name: 'Tubular', style_id: null, status: 'new_needed' },
      { name: 'Curb Mount', style_id: null, status: 'new_needed' },
      { name: 'Deck Mount', style_id: null, status: 'new_needed' },
      { name: 'Solar', style_id: null, status: 'new_needed' }
    ]
  },
  'Generator': {
    department: 'Heating & Cooling',
    category_name: 'Generator',
    label: 'Generator Type',
    logic: 'Type or fuel',
    values: [
      { name: 'Portable', style_id: null, status: 'new_needed' },
      { name: 'Standby', style_id: null, status: 'new_needed' },
      { name: 'Inverter', style_id: null, status: 'new_needed' },
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Dual Fuel', style_id: null, status: 'new_needed' },
      { name: 'Solar', style_id: null, status: 'new_needed' }
    ]
  },
  'HVAC Accessories': {
    department: 'Heating & Cooling',
    category_name: 'HVAC Accessories',
    label: 'Accessory Type',
    logic: 'Accessory type',
    values: [
      { name: 'Vent Cover', style_id: null, status: 'new_needed' },
      { name: 'Register', style_id: null, status: 'new_needed' },
      { name: 'Grille', style_id: null, status: 'new_needed' },
      { name: 'Damper', style_id: null, status: 'new_needed' },
      { name: 'Humidifier', style_id: null, status: 'new_needed' }
    ]
  },
  'Commercial HVAC': {
    department: 'Heating & Cooling',
    category_name: 'Commercial HVAC',
    label: 'Commercial HVAC Type',
    logic: 'System type',
    values: [
      { name: 'Rooftop Unit', style_id: null, status: 'new_needed' },
      { name: 'Split System', style_id: null, status: 'new_needed' },
      { name: 'Package Unit', style_id: null, status: 'new_needed' },
      { name: 'Chiller', style_id: null, status: 'new_needed' },
      { name: 'Boiler', style_id: null, status: 'new_needed' }
    ]
  },
  'Furniture': {
    department: 'Home Décor & Furniture',
    category_name: 'Furniture',
    label: 'Furniture Type',
    logic: 'Furniture category',
    values: [
      { name: 'Accent', style_id: 'a1IaZ000001S90QUAS', status: 'existing' },
      { name: 'Storage', style_id: 'a1IaZ000001S90RUAS', status: 'existing' },
      { name: 'Seating', style_id: 'a1IaZ000001S90SUAS', status: 'existing' },
      { name: 'Table', style_id: 'a1IaZ000001S90TUAS', status: 'existing' },
      { name: 'Shelving', style_id: null, status: 'new_needed' }
    ]
  },
  'Chair': {
    department: 'Home Décor & Furniture',
    category_name: 'Chair',
    label: 'Chair Type',
    logic: 'Chair type',
    values: [
      { name: 'Dining', style_id: null, status: 'new_needed' },
      { name: 'Accent', style_id: 'a1IaZ000001S90QUAS', status: 'existing' },
      { name: 'Office', style_id: null, status: 'new_needed' },
      { name: 'Lounge', style_id: null, status: 'new_needed' },
      { name: 'Bar Stool', style_id: null, status: 'new_needed' },
      { name: 'Rocking', style_id: null, status: 'new_needed' }
    ]
  },
  'Outdoor and Patio Furniture': {
    department: 'Home Décor & Furniture',
    category_name: 'Outdoor and Patio Furniture',
    label: 'Outdoor Furniture Type',
    logic: 'Furniture type',
    values: [
      { name: 'Seating', style_id: 'a1IaZ000001S90SUAS', status: 'existing' },
      { name: 'Dining', style_id: null, status: 'new_needed' },
      { name: 'Lounge', style_id: null, status: 'new_needed' },
      { name: 'Umbrella', style_id: null, status: 'new_needed' },
      { name: 'Hammock', style_id: null, status: 'new_needed' }
    ]
  },
  'Mirror': {
    department: 'Home Décor & Furniture',
    category_name: 'Mirror',
    label: 'Mirror Type',
    logic: 'Mirror type',
    values: [
      { name: 'Wall Mirror', style_id: null, status: 'new_needed' },
      { name: 'Floor Mirror', style_id: null, status: 'new_needed' },
      { name: 'Decorative', style_id: 'a1IaZ000001S90UUAS', status: 'existing' },
      { name: 'Full Length', style_id: null, status: 'new_needed' },
      { name: 'Framed', style_id: 'a1IaZ000001S932UAC', status: 'existing' },
      { name: 'Frameless', style_id: 'a1IaZ000001S933UAC', status: 'existing' }
    ]
  },
  'Wall Decor': {
    department: 'Home Décor & Furniture',
    category_name: 'Wall Decor',
    label: 'Wall Decor Type',
    logic: 'Decor type',
    values: [
      { name: 'Wall Art', style_id: null, status: 'new_needed' },
      { name: 'Mirror', style_id: null, status: 'new_needed' },
      { name: 'Clock', style_id: null, status: 'new_needed' },
      { name: 'Shelf', style_id: 'a1IaZ000001S93CUAS', status: 'existing' },
      { name: 'Sconce', style_id: 'a1IaZ000001S91PUAS', status: 'existing' },
      { name: 'Tapestry', style_id: null, status: 'new_needed' }
    ]
  },
  'Home Accents': {
    department: 'Home Décor & Furniture',
    category_name: 'Home Accents',
    label: 'Accent Type',
    logic: 'Accent type',
    values: [
      { name: 'Vase', style_id: null, status: 'new_needed' },
      { name: 'Sculpture', style_id: null, status: 'new_needed' },
      { name: 'Frame', style_id: null, status: 'new_needed' },
      { name: 'Candle Holder', style_id: null, status: 'new_needed' },
      { name: 'Bowl', style_id: null, status: 'new_needed' },
      { name: 'Figurine', style_id: null, status: 'new_needed' },
      { name: 'Clock', style_id: null, status: 'new_needed' }
    ]
  },
  'Rug': {
    department: 'Home Décor & Furniture',
    category_name: 'Rug',
    label: 'Rug Style',
    logic: 'Design style',
    values: [
      { name: 'Modern', style_id: 'a1IaZ000001TWAPUA4', status: 'existing' },
      { name: 'Traditional', style_id: 'a1IaZ000001TLjdUAG', status: 'existing' },
      { name: 'Transitional', style_id: 'a1IaZ000001TVXhUAO', status: 'existing' },
      { name: 'Farmhouse', style_id: 'a1IaZ000001S93RUAS', status: 'existing' },
      { name: 'Bohemian', style_id: null, status: 'new_needed' },
      { name: 'Coastal', style_id: null, status: 'new_needed' },
      { name: 'Southwestern', style_id: null, status: 'new_needed' }
    ]
  },
  'Home Organization': {
    department: 'Home Décor & Furniture',
    category_name: 'Home Organization',
    label: 'Organization Type',
    logic: 'Organization type',
    values: [
      { name: 'Shelf', style_id: 'a1IaZ000001S93CUAS', status: 'existing' },
      { name: 'Basket', style_id: null, status: 'new_needed' },
      { name: 'Bin', style_id: null, status: 'new_needed' },
      { name: 'Rack', style_id: null, status: 'new_needed' },
      { name: 'Closet System', style_id: null, status: 'new_needed' },
      { name: 'Wall Organizer', style_id: null, status: 'new_needed' }
    ]
  },
  'Tile': {
    department: 'Flooring',
    category_name: 'Tile',
    label: 'Tile Type',
    logic: 'Material',
    values: [
      { name: 'Ceramic', style_id: null, status: 'new_needed' },
      { name: 'Porcelain', style_id: null, status: 'new_needed' },
      { name: 'Stone', style_id: null, status: 'new_needed' },
      { name: 'Glass', style_id: null, status: 'new_needed' },
      { name: 'Mosaic', style_id: null, status: 'new_needed' },
      { name: 'Cement', style_id: null, status: 'new_needed' }
    ]
  },
  'Luxury Vinyl Flooring': {
    department: 'Flooring',
    category_name: 'Luxury Vinyl Flooring',
    label: 'LVF Type',
    logic: 'Format/installation',
    values: [
      { name: 'Plank', style_id: null, status: 'new_needed' },
      { name: 'Tile', style_id: null, status: 'new_needed' },
      { name: 'Click Lock', style_id: null, status: 'new_needed' },
      { name: 'Glue Down', style_id: null, status: 'new_needed' },
      { name: 'Loose Lay', style_id: null, status: 'new_needed' }
    ]
  },
  'Hardwood Flooring': {
    department: 'Flooring',
    category_name: 'Hardwood Flooring',
    label: 'Hardwood Type',
    logic: 'Construction',
    values: [
      { name: 'Solid', style_id: null, status: 'new_needed' },
      { name: 'Engineered', style_id: null, status: 'new_needed' },
      { name: 'Prefinished', style_id: null, status: 'new_needed' },
      { name: 'Unfinished', style_id: null, status: 'new_needed' }
    ]
  },
  'Laminate Flooring': {
    department: 'Flooring',
    category_name: 'Laminate Flooring',
    label: 'Laminate Type',
    logic: 'Appearance',
    values: [
      { name: 'Wood Look', style_id: null, status: 'new_needed' },
      { name: 'Tile Look', style_id: null, status: 'new_needed' },
      { name: 'Stone Look', style_id: null, status: 'new_needed' },
      { name: 'Waterproof', style_id: null, status: 'new_needed' }
    ]
  },
  'Carpet Tile': {
    department: 'Flooring',
    category_name: 'Carpet Tile',
    label: 'Carpet Tile Type',
    logic: 'Application/installation',
    values: [
      { name: 'Peel and Stick', style_id: null, status: 'new_needed' },
      { name: 'Modular', style_id: 'a1IaZ000001S90NUAS', status: 'existing' },
      { name: 'Commercial', style_id: 'a1IaZ000001S92GUAS', status: 'existing' },
      { name: 'Residential', style_id: null, status: 'new_needed' }
    ]
  },
  'Waterproof Flooring': {
    department: 'Flooring',
    category_name: 'Waterproof Flooring',
    label: 'Waterproof Type',
    logic: 'Material',
    values: [
      { name: 'Vinyl Plank', style_id: null, status: 'new_needed' },
      { name: 'Vinyl Tile', style_id: null, status: 'new_needed' },
      { name: 'Laminate', style_id: null, status: 'new_needed' },
      { name: 'Engineered', style_id: null, status: 'new_needed' }
    ]
  },
  'Hardscaping': {
    department: 'Flooring',
    category_name: 'Hardscaping',
    label: 'Hardscape Type',
    logic: 'Material',
    values: [
      { name: 'Paver', style_id: null, status: 'new_needed' },
      { name: 'Flagstone', style_id: null, status: 'new_needed' },
      { name: 'Brick', style_id: null, status: 'new_needed' },
      { name: 'Gravel', style_id: null, status: 'new_needed' },
      { name: 'Stepping Stone', style_id: null, status: 'new_needed' }
    ]
  },
  'Outdoor Kitchens': {
    department: 'Outdoor',
    category_name: 'Outdoor Kitchens',
    label: 'Outdoor Kitchen Type',
    logic: 'Configuration',
    values: [
      { name: 'Built-In', style_id: 'a1IaZ000001S90MUAS', status: 'existing' },
      { name: 'Modular', style_id: 'a1IaZ000001S90NUAS', status: 'existing' },
      { name: 'Island', style_id: 'a1IaZ000001S91UUAS', status: 'existing' },
      { name: 'Cart', style_id: 'a1IaZ000001S90PUAS', status: 'existing' }
    ]
  },
  'Storage Drawers/Doors': {
    department: 'Outdoor',
    category_name: 'Storage Drawers/Doors',
    label: 'Storage Type',
    logic: 'Component type',
    values: [
      { name: 'Access Door', style_id: null, status: 'new_needed' },
      { name: 'Storage Drawer', style_id: null, status: 'new_needed' },
      { name: 'Trash Drawer', style_id: null, status: 'new_needed' },
      { name: 'Combo', style_id: null, status: 'new_needed' }
    ]
  },
  'Fire Pit Accessories': {
    department: 'Outdoor',
    category_name: 'Fire Pit Accessories',
    label: 'Accessory Type',
    logic: 'Accessory type',
    values: [
      { name: 'Cover', style_id: null, status: 'new_needed' },
      { name: 'Screen', style_id: null, status: 'new_needed' },
      { name: 'Log Set', style_id: null, status: 'new_needed' },
      { name: 'Fire Glass', style_id: null, status: 'new_needed' },
      { name: 'Grate', style_id: null, status: 'new_needed' }
    ]
  },
  'Outdoor Fireplaces': {
    department: 'Outdoor',
    category_name: 'Outdoor Fireplaces',
    label: 'Fireplace Type',
    logic: 'Fuel type',
    values: [
      { name: 'Gas', style_id: 'a1IaZ000000YiTaUAK', status: 'existing' },
      { name: 'Wood Burning', style_id: null, status: 'new_needed' },
      { name: 'Propane', style_id: null, status: 'new_needed' },
      { name: 'Electric', style_id: 'a1IaZ0000019ztJUAQ', status: 'existing' }
    ]
  },
  'Outdoor Heating': {
    department: 'Outdoor',
    category_name: 'Outdoor Heating',
    label: 'Heating Type',
    logic: 'Product type',
    values: [
      { name: 'Patio Heater', style_id: null, status: 'new_needed' },
      { name: 'Fire Pit', style_id: null, status: 'new_needed' },
      { name: 'Fire Table', style_id: null, status: 'new_needed' },
      { name: 'Infrared Heater', style_id: null, status: 'new_needed' }
    ]
  },
  'Garden Decor': {
    department: 'Outdoor',
    category_name: 'Garden Decor',
    label: 'Decor Type',
    logic: 'Decor type',
    values: [
      { name: 'Planter', style_id: null, status: 'new_needed' },
      { name: 'Statue', style_id: null, status: 'new_needed' },
      { name: 'Fountain', style_id: null, status: 'new_needed' },
      { name: 'Bird Bath', style_id: null, status: 'new_needed' },
      { name: 'Wind Chime', style_id: null, status: 'new_needed' },
      { name: 'Garden Stake', style_id: null, status: 'new_needed' }
    ]
  },
  'Mail Box': {
    department: 'Outdoor',
    category_name: 'Mail Box',
    label: 'Mailbox Type',
    logic: 'Mount type',
    values: [
      { name: 'Post Mount', style_id: null, status: 'new_needed' },
      { name: 'Wall Mount', style_id: null, status: 'new_needed' },
      { name: 'Column Mount', style_id: null, status: 'new_needed' },
      { name: 'Locking', style_id: null, status: 'new_needed' }
    ]
  },
  'Exterior Door': {
    department: 'Outdoor',
    category_name: 'Exterior Door',
    label: 'Door Type',
    logic: 'Door type',
    values: [
      { name: 'Entry', style_id: null, status: 'new_needed' },
      { name: 'Patio', style_id: null, status: 'new_needed' },
      { name: 'French', style_id: null, status: 'new_needed' },
      { name: 'Storm', style_id: null, status: 'new_needed' },
      { name: 'Screen', style_id: null, status: 'new_needed' }
    ]
  },
  'Entry Set': {
    department: 'Outdoor',
    category_name: 'Entry Set',
    label: 'Entry Set Type',
    logic: 'Handle type',
    values: [
      { name: 'Handleset', style_id: null, status: 'new_needed' },
      { name: 'Knob Entry', style_id: null, status: 'new_needed' },
      { name: 'Lever Entry', style_id: null, status: 'new_needed' }
    ]
  },
  'Commercial Restroom': {
    department: 'Industrial & Commercial',
    category_name: 'Commercial Restroom',
    label: 'Product Type',
    logic: 'Product type',
    values: [
      { name: 'Toilet', style_id: null, status: 'new_needed' },
      { name: 'Urinal', style_id: null, status: 'new_needed' },
      { name: 'Sink', style_id: null, status: 'new_needed' },
      { name: 'Hand Dryer', style_id: null, status: 'new_needed' },
      { name: 'Dispenser', style_id: null, status: 'new_needed' },
      { name: 'Partition', style_id: null, status: 'new_needed' }
    ]
  },
  'Commercial Lighting': {
    department: 'Industrial & Commercial',
    category_name: 'Commercial Lighting',
    label: 'Light Type',
    logic: 'Fixture type',
    values: [
      { name: 'Panel', style_id: null, status: 'new_needed' },
      { name: 'Troffer', style_id: null, status: 'new_needed' },
      { name: 'High Bay', style_id: null, status: 'new_needed' },
      { name: 'Low Bay', style_id: null, status: 'new_needed' },
      { name: 'Strip Light', style_id: null, status: 'new_needed' },
      { name: 'Exit Sign', style_id: null, status: 'new_needed' }
    ]
  },
  'Water Fountain': {
    department: 'Industrial & Commercial',
    category_name: 'Water Fountain',
    label: 'Fountain Type',
    logic: 'Mount/type',
    values: [
      { name: 'Wall Mount', style_id: null, status: 'new_needed' },
      { name: 'Freestanding', style_id: 'a1IaZ000001SWnZUAW', status: 'existing' },
      { name: 'Bottle Filler', style_id: null, status: 'new_needed' },
      { name: 'ADA Compliant', style_id: 'a1IaZ000001S93LUAS', status: 'existing' },
      { name: 'Outdoor', style_id: null, status: 'new_needed' }
    ]
  },
  'Drainage & Waste': {
    department: 'Industrial & Commercial',
    category_name: 'Drainage & Waste',
    label: 'Drainage Type',
    logic: 'Component type',
    values: [
      { name: 'Floor Drain', style_id: null, status: 'new_needed' },
      { name: 'Trench Drain', style_id: null, status: 'new_needed' },
      { name: 'Cleanout', style_id: null, status: 'new_needed' },
      { name: 'Interceptor', style_id: null, status: 'new_needed' },
      { name: 'Vent', style_id: null, status: 'new_needed' }
    ]
  },
  'Industrial Strainers': {
    department: 'Industrial & Commercial',
    category_name: 'Industrial Strainers',
    label: 'Strainer Type',
    logic: 'Strainer type',
    values: [
      { name: 'Y Strainer', style_id: null, status: 'new_needed' },
      { name: 'Basket Strainer', style_id: null, status: 'new_needed' },
      { name: 'Duplex Strainer', style_id: null, status: 'new_needed' },
      { name: 'Simplex Strainer', style_id: null, status: 'new_needed' }
    ]
  },
  'Chemicals & Compounds': {
    department: 'Industrial & Commercial',
    category_name: 'Chemicals & Compounds',
    label: 'Product Type',
    logic: 'Product type',
    values: [
      { name: 'Pipe Cement', style_id: null, status: 'new_needed' },
      { name: 'Primer', style_id: null, status: 'new_needed' },
      { name: 'Sealant', style_id: null, status: 'new_needed' },
      { name: 'Flux', style_id: null, status: 'new_needed' },
      { name: 'Thread Compound', style_id: null, status: 'new_needed' }
    ]
  },
  'Hydronic Expansion Tanks': {
    department: 'Industrial & Commercial',
    category_name: 'Hydronic Expansion Tanks',
    label: 'Tank Type',
    logic: 'Tank technology',
    values: [
      { name: 'Bladder', style_id: null, status: 'new_needed' },
      { name: 'Diaphragm', style_id: null, status: 'new_needed' },
      { name: 'Plain Steel', style_id: null, status: 'new_needed' }
    ]
  },
  'Home Electronics': {
    department: 'Electronics',
    category_name: 'Home Electronics',
    label: 'Electronics Type',
    logic: 'Product type',
    values: [
      { name: 'Smart Home Hub', style_id: null, status: 'new_needed' },
      { name: 'Smart Speaker', style_id: null, status: 'new_needed' },
      { name: 'Security Camera', style_id: null, status: 'new_needed' },
      { name: 'Video Doorbell', style_id: null, status: 'new_needed' },
      { name: 'Smart Display', style_id: null, status: 'new_needed' }
    ]
  }
};

/**
 * Get category mapping - keys match Salesforce singular format (e.g., "Kitchen Faucet")
 */
function getCategoryMapping(category: string): CategoryStyleMapping | undefined {
  return CATEGORY_STYLE_MAP[category];
}

/**
 * Get valid styles for a category
 */
export function getValidStylesForCategory(category: string): string[] {
  const mapping = getCategoryMapping(category);
  if (!mapping) return [];
  return mapping.values.map((v: StyleValue) => v.name);
}

/**
 * Get valid styles with IDs for a category
 */
export function getValidStylesWithIdsForCategory(category: string): StyleValue[] {
  const mapping = getCategoryMapping(category);
  if (!mapping) return [];
  return mapping.values;
}

/**
 * Get style ID for a category and style name
 */
export function getStyleIdForCategory(category: string, styleName: string): string | null {
  const mapping = getCategoryMapping(category);
  if (!mapping) return null;
  
  // Normalize for comparison
  const normalizeForComparison = (str: string): string => 
    str.toLowerCase().trim().replace(/[\s\-_]/g, '');
  
  const normalizedInput = normalizeForComparison(styleName);
  
  // PASS 1: Exact match
  const exactMatch = mapping.values.find((v: StyleValue) => v.name.toLowerCase() === styleName.toLowerCase());
  if (exactMatch) return exactMatch.style_id;
  
  // PASS 2: Normalized match
  const normalizedMatch = mapping.values.find((v: StyleValue) => 
    normalizeForComparison(v.name) === normalizedInput
  );
  if (normalizedMatch) return normalizedMatch.style_id;
  
  return null;
}

/**
 * Check if a style is valid for a category
 */
export function isValidStyleForCategory(category: string, styleName: string): boolean {
  const validStyles = getValidStylesForCategory(category);
  if (validStyles.length === 0) return false;
  
  const normalizeForComparison = (str: string): string => 
    str.toLowerCase().trim().replace(/[\s\-_]/g, '');
  
  const normalizedInput = normalizeForComparison(styleName);
  
  return validStyles.some(vs => {
    // Exact match
    if (vs.toLowerCase() === styleName.toLowerCase()) return true;
    // Normalized match
    if (normalizeForComparison(vs) === normalizedInput) return true;
    return false;
  });
}

/**
 * Normalize string for contextual comparison
 * Removes spaces, hyphens, underscores and converts to lowercase
 * Examples: "Shower Head" -> "showerhead", "Rain-Head" -> "rainhead"
 */
function normalizeForComparison(str: string): string {
  return str.toLowerCase().trim().replace(/[\s\-_]/g, '');
}

/**
 * Match a potential style to a valid style for a category
 * Uses two-pass matching: exact first, then normalized/contextual
 * @param category - The category name
 * @param potentialStyle - The style to match
 * @returns The matched style name if found, null otherwise
 */
export function matchStyleToCategory(category: string, potentialStyle: string): string | null {
  const validStyles = getValidStylesForCategory(category);
  
  if (validStyles.length === 0) {
    return null;
  }
  
  const normalized = potentialStyle.toLowerCase().trim();
  const contextual = normalizeForComparison(potentialStyle);
  
  // PASS 1: Exact match
  const exactMatch = validStyles.find(s => s.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;
  
  // PASS 2: Contextual/normalized match (handles "shower head" vs "showerhead")
  const contextualMatch = validStyles.find(s => normalizeForComparison(s) === contextual);
  if (contextualMatch) return contextualMatch;
  
  // PASS 3: Partial match (contains) - both exact and normalized
  const partialMatch = validStyles.find(s => 
    s.toLowerCase().includes(normalized) || normalized.includes(s.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  const contextualPartialMatch = validStyles.find(s => {
    const normS = normalizeForComparison(s);
    return normS.includes(contextual) || contextual.includes(normS);
  });
  if (contextualPartialMatch) return contextualPartialMatch;
  
  // Special case: extract style from subcategory
  if (category.toLowerCase() === 'oven' && normalized.includes('microwave')) {
    return 'Microwave Combo';
  }
  
  if (category.toLowerCase() === 'oven' && (normalized.includes('double') || normalized.includes('dual'))) {
    return 'Double Wall';
  }
  
  if (category.toLowerCase() === 'oven' && normalized.includes('single')) {
    return 'Single';
  }
  
  return null;
}

/**
 * Get all categories with their valid styles formatted for AI prompts
 * This ensures AI ONLY selects from the category-type-style list
 */
export function getAllCategoriesWithStylesForPrompt(): string {
  return Object.entries(CATEGORY_STYLE_MAP)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([categoryName, config]) => {
      const styles = config.values
        .map((v, idx) => `   ${idx + 1}. "${v.name}"`)
        .join('\n');
      return `\n${categoryName} (${config.label}):\n${styles}`;
    })
    .join('\n');
}

/**
 * Get all categories in a department
 */
export function getCategoriesInDepartment(department: string): string[] {
  return Object.keys(CATEGORY_STYLE_MAP).filter(cat => 
    CATEGORY_STYLE_MAP[cat].department.toLowerCase() === department.toLowerCase()
  );
}

/**
 * Get all departments
 */
export function getAllDepartments(): string[] {
  const depts = new Set<string>();
  Object.values(CATEGORY_STYLE_MAP).forEach(cat => {
    depts.add(cat.department);
  });
  return Array.from(depts).sort();
}

/**
 * Get all categories matching a keyword pattern
 * Used to dynamically find categories by name pattern (e.g., all "shower" categories)
 * @param keyword - Case-insensitive keyword to match in category names
 * @returns Array of category names that contain the keyword
 */
export function getCategoriesMatchingPattern(keyword: string): string[] {
  const lowerKeyword = keyword.toLowerCase();
  return Object.keys(CATEGORY_STYLE_MAP).filter(cat =>
    cat.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Check if a category name matches a keyword pattern
 * @param keyword - Case-insensitive keyword to match
 * @param categoryName - Category to check
 * @returns True if category contains the keyword
 */
export function isCategoryMatchingPattern(keyword: string, categoryName: string): boolean {
  return categoryName.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Pre-computed lighting categories (cached for performance)
 * Gets all categories in the "Lighting & Electrical" department from master mapping
 */
let _cachedLightingCategories: string[] | null = null;
export function getLightingCategories(): string[] {
  if (!_cachedLightingCategories) {
    _cachedLightingCategories = getCategoriesInDepartment('Lighting & Electrical');
  }
  return _cachedLightingCategories;
}

/**
 * Check if a category is a lighting category (from master mapping)
 * Uses department-based lookup from CATEGORY_STYLE_MAP
 */
export function isLightingCategoryFromMaster(categoryName: string): boolean {
  const lightingCategories = getLightingCategories();
  const normalizedCategory = categoryName.toLowerCase().trim();
  return lightingCategories.some(cat => 
    cat.toLowerCase() === normalizedCategory
  );
}

/**
 * Pre-computed shower/plumbing categories (cached for performance)
 * Gets all categories containing "shower" in the name from master mapping
 */
let _cachedShowerCategories: string[] | null = null;
export function getShowerCategories(): string[] {
  if (!_cachedShowerCategories) {
    _cachedShowerCategories = getCategoriesMatchingPattern('shower');
  }
  return _cachedShowerCategories;
}

/**
 * Check if a category is a shower-related category (from master mapping)
 * Uses pattern-based lookup for categories containing "shower"
 */
export function isShowerCategoryFromMaster(categoryName: string): boolean {
  const showerCategories = getShowerCategories();
  const normalizedCategory = categoryName.toLowerCase().trim();
  return showerCategories.some(cat => 
    cat.toLowerCase() === normalizedCategory
  );
}

/**
 * Get all valid styles for categories matching a keyword pattern
 * Used to dynamically get styles for related categories (e.g., all "shower" categories)
 * @param keyword - Case-insensitive keyword to match in category names
 * @returns Array of unique style names from all matching categories
 */
export function getStylesForCategoryPattern(keyword: string): string[] {
  const matchingCategories = Object.keys(CATEGORY_STYLE_MAP).filter(cat =>
    cat.toLowerCase().includes(keyword.toLowerCase())
  );
  
  const allStyles = new Set<string>();
  matchingCategories.forEach(cat => {
    getValidStylesForCategory(cat).forEach(style => allStyles.add(style));
  });
  
  return Array.from(allStyles);
}

/**
 * Get all valid styles with IDs for categories matching a keyword pattern
 * @param keyword - Case-insensitive keyword to match in category names
 * @returns Array of unique StyleValue objects from all matching categories
 */
export function getStylesWithIdsForCategoryPattern(keyword: string): StyleValue[] {
  const matchingCategories = Object.keys(CATEGORY_STYLE_MAP).filter(cat =>
    cat.toLowerCase().includes(keyword.toLowerCase())
  );
  
  const styleMap = new Map<string, StyleValue>();
  matchingCategories.forEach(cat => {
    getValidStylesWithIdsForCategory(cat).forEach(style => {
      if (!styleMap.has(style.name)) {
        styleMap.set(style.name, style);
      }
    });
  });
  
  return Array.from(styleMap.values());
}

/**
 * Check if a style is valid for any category matching a keyword pattern
 * @param keyword - Category pattern to match (e.g., "shower")
 * @param styleName - Style name to validate
 * @returns true if the style is valid for any matching category
 */
export function isValidStyleForCategoryPattern(keyword: string, styleName: string): boolean {
  const validStyles = getStylesForCategoryPattern(keyword);
  if (validStyles.length === 0) return false;
  
  const normalizeStr = (str: string): string => 
    str.toLowerCase().trim().replace(/[\s\-_]/g, '');
  
  const normalizedInput = normalizeStr(styleName);
  
  return validStyles.some(vs => {
    if (vs.toLowerCase() === styleName.toLowerCase()) return true;
    if (normalizeStr(vs) === normalizedInput) return true;
    // Containment check for partial matches
    const normalizedValid = normalizeStr(vs);
    if (normalizedInput.includes(normalizedValid) || normalizedValid.includes(normalizedInput)) {
      const shorter = Math.min(normalizedInput.length, normalizedValid.length);
      const longer = Math.max(normalizedInput.length, normalizedValid.length);
      return shorter / longer >= 0.6; // At least 60% overlap
    }
    return false;
  });
}

/**
 * Pre-computed shower styles from master mapping (cached for performance)
 * Includes styles from: Shower, Shower Faucet, Shower Accessory, Steam Shower, 
 * Outdoor Shower Faucet, Tub and Shower Accessory
 */
let _cachedShowerStyles: string[] | null = null;
export function getValidShowerStyles(): string[] {
  if (!_cachedShowerStyles) {
    _cachedShowerStyles = getStylesForCategoryPattern('shower');
  }
  return _cachedShowerStyles;
}

/**
 * Check if a style is valid for any shower-related category
 * This replaces the hardcoded VALID_SHOWER_STYLES array
 */
export function isValidShowerStyleFromMaster(styleName: string): boolean {
  return isValidStyleForCategoryPattern('shower', styleName);
}

export default {
  CATEGORY_STYLE_MAP,
  UNIVERSAL_DESIGN_STYLES,
  getValidStylesForCategory,
  getValidStylesWithIdsForCategory,
  getStyleIdForCategory,
  isValidStyleForCategory,
  matchStyleToCategory,
  getCategoriesInDepartment,
  getAllDepartments,
  getAllCategoriesWithStylesForPrompt,
  getCategoriesMatchingPattern,
  isCategoryMatchingPattern,
  getLightingCategories,
  isLightingCategoryFromMaster,
  getShowerCategories,
  isShowerCategoryFromMaster,
  getStylesForCategoryPattern,
  getStylesWithIdsForCategoryPattern,
  isValidStyleForCategoryPattern,
  getValidShowerStyles,
  isValidShowerStyleFromMaster
};
