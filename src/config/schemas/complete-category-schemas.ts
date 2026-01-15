/**
 * Complete Category Schemas
 * 
 * This file contains schemas for ALL categories that were missing coverage.
 * These schemas ensure every category in the system has complete attribute definitions.
 */

import { CategoryAttributeConfig } from '../category-attributes';

// ============================================
// PLUMBING & BATH - ADDITIONAL SCHEMAS
// ============================================

export const BIDET_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bidets #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Type (Standalone, Bidet Seat, Bidet Attachment)',
    'Style (Floor Mount, Wall Mount)',
    'Material (Vitreous China, Porcelain)',
    'Heated Seat',
    'Water Temperature Control',
    'Spray Adjustability',
    'Air Dryer',
    'Night Light',
    'Remote Control',
    'Self-Cleaning Nozzle',
    'Soft Close Seat',
    'Width',
    'Depth',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Style', 'Material',
    'Width', 'Depth', 'Height', 'Features', 'Color',
    'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Bathroom',
    tier3: 'Bidets'
  }
};

export const DRAIN_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Drains #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Type (Floor, Shower, Sink, Linear)',
    'Size (Diameter)',
    'Material (Brass, Stainless Steel, PVC, ABS)',
    'Finish',
    'Drain Style (Pop-Up, Grid, Push-Button)',
    'Overflow',
    'Hair Catcher',
    'Flow Rate (GPM)',
    'Installation Type (Drop-In, Tile-In)',
    'Strainer Type',
    'Trap Included',
    'Linear Length',
    'Grate Pattern',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Size', 'Material',
    'Finish', 'Flow Rate', 'Trap Type', 'Installation',
    'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Plumbing Parts',
    tier3: 'Drains'
  }
};

export const DRAINAGE_WASTE_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Drainage & Waste #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Type (P-Trap, Waste Arm, Tailpiece, Coupling)',
    'Size (Diameter)',
    'Material (PVC, ABS, Chrome Brass)',
    'Connection Type (Slip Joint, Solvent Weld, Threaded)',
    'Length',
    'Wall/Floor Connection',
    'Includes Escutcheon',
    'Finish',
    'For Sink Type (Bathroom, Kitchen, Utility)',
    'Code Compliant',
    'Lead-Free',
    'Low Profile',
    'Easy Install',
    'Universal Fit'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Size', 'Material',
    'Length', 'Connection', 'Finish', 'For Use With',
    'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Plumbing Parts',
    tier3: 'Drainage & Waste'
  }
};

export const ROUGH_IN_VALVE_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Rough-In Valves #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Valve Type (Pressure Balance, Thermostatic, Transfer)',
    'Number of Functions',
    'Inlet Size',
    'Outlet Size',
    'Connection Type (Threaded, Sweat, PEX, CPVC)',
    'Integral Stops',
    'Check Valves Included',
    'Volume Control',
    'Max Flow Rate (GPM)',
    'For Use With (Shower, Tub, Tub/Shower)',
    'Cold Expansion PEX Compatible',
    'Universal Fit',
    'Code Compliant',
    'Lead-Free'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Valve Type', 'Functions',
    'Inlet', 'Outlet', 'Connection', 'Flow Rate',
    'Certification', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Plumbing Parts',
    tier3: 'Rough-In Valves'
  }
};

export const GARBAGE_DISPOSAL_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Garbage Disposals #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Horsepower (HP)',
    'Feed Type (Continuous, Batch)',
    'Motor Type (Induction, Permanent Magnet)',
    'Grinding System (Stainless Steel, Galvanized)',
    'Noise Level (dB)',
    'Sound Insulation',
    'Auto-Reverse/Jam-Sensor',
    'Dishwasher Connection',
    'Power Cord Included',
    'Mounting Type',
    'Warranty (Years)',
    'Septic Safe',
    'Reset Button',
    'Splash Guard Included'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Horsepower', 'Feed Type',
    'Motor Type', 'Chamber Capacity', 'RPM',
    'Noise Level', 'Mounting', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Kitchen Plumbing',
    tier3: 'Garbage Disposals'
  }
};

export const WATER_HEATER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Water Heaters #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Type (Tank, Tankless, Heat Pump, Solar)',
    'Fuel Type (Electric, Gas, Propane)',
    'Tank Capacity (Gallons)',
    'First Hour Rating (FHR)',
    'Energy Factor (UEF)',
    'GPM (for Tankless)',
    'BTU Input',
    'Recovery Rate (GPH)',
    'Dimensions (H x W x D)',
    'Venting Type (Direct, Power, Atmospheric)',
    'Wi-Fi/Smart Enabled',
    'Warranty (Tank/Parts)',
    'Energy Star Certified',
    'Installation Type (Residential, Commercial)'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Fuel', 'Capacity',
    'FHR', 'UEF', 'BTU', 'Dimensions', 'Venting',
    'Voltage', 'Phase', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Water Heating',
    tier3: 'Water Heaters'
  }
};

export const BATHTUB_WASTE_OVERFLOW_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bathtub Waste & Overflow #',
  department: 'Plumbing & Bath',
  top15FilterAttributes: [
    'Brand',
    'Type (Cable Driven, Lift & Turn, Push-Pull, Toe-Tap)',
    'Finish',
    'Material (Brass, PVC, ABS)',
    'Drain Size',
    'Drain Length',
    'Overflow Style (Traditional, Contemporary)',
    'Adjustable',
    'For Bathtub Type (Alcove, Freestanding, Drop-In)',
    'Test Kit Included',
    'Hair Catcher',
    'Lead-Free',
    'Code Compliant',
    'Easy Install',
    'Universal Fit'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Finish', 'Material',
    'Drain Size', 'For Tub Type', 'Certification', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Plumbing & Bath',
    tier2: 'Plumbing Parts',
    tier3: 'Bathtub Waste & Overflow'
  }
};

// ============================================
// HARDWARE SCHEMAS
// ============================================

export const CABINET_HARDWARE_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Cabinet Hardware #',
  department: 'Home Decor',
  top15FilterAttributes: [
    'Brand',
    'Type (Knob, Pull, Handle, Cup Pull)',
    'Style (Modern, Traditional, Transitional, Farmhouse)',
    'Finish (Brass, Nickel, Chrome, Bronze, Black)',
    'Material (Zinc, Steel, Brass, Aluminum)',
    'Length/Diameter',
    'Center-to-Center (for Pulls)',
    'Projection',
    'Width',
    'Mounting Hardware Included',
    'For Cabinet Type (Kitchen, Bath, Furniture)',
    'Set Quantity',
    'Soft-Close Compatible',
    'Weight Capacity',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Style', 'Finish',
    'Material', 'Length', 'Center-to-Center', 'Projection',
    'Quantity', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Home Decor',
    tier2: 'Hardware',
    tier3: 'Cabinet Hardware'
  }
};

export const DOOR_HARDWARE_PARTS_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Door Hardware Parts #',
  department: 'Home Decor',
  top15FilterAttributes: [
    'Brand',
    'Type (Hinge, Strike Plate, Latch, Deadbolt)',
    'Style',
    'Finish (Brass, Nickel, Chrome, Bronze, Black)',
    'Material (Steel, Brass, Stainless)',
    'Size',
    'Handing (Left, Right, Universal)',
    'Fire Rated',
    'For Door Type (Interior, Exterior, Commercial)',
    'For Door Thickness',
    'Security Grade (1, 2, 3)',
    'Ball Bearing',
    'Self-Closing',
    'Quantity in Pack',
    'Screw Pattern'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Finish', 'Material',
    'Size', 'For Door Type', 'Fire Rating', 'Grade',
    'Quantity', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Home Decor',
    tier2: 'Hardware',
    tier3: 'Door Hardware Parts'
  }
};

// ============================================
// LIGHTING - ADDITIONAL SCHEMAS
// ============================================

export const BATHROOM_LIGHTING_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bathroom Lighting #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Type (Vanity Light, Bath Bar, Sconce)',
    'Style (Modern, Traditional, Transitional)',
    'Width',
    'Height',
    'Extension from Wall',
    'Number of Lights',
    'Bulb Type (LED, Incandescent, Halogen)',
    'Max Wattage',
    'Finish (Chrome, Nickel, Bronze, Brass)',
    'Shade Material (Glass, Acrylic, Opal)',
    'Shade Direction (Up, Down, Up/Down)',
    'Dimmable',
    'Damp/Wet Rated',
    'ADA Compliant'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Style', 'Width', 'Height',
    'Number of Lights', 'Bulb Type', 'Max Wattage',
    'Finish', 'Shade', 'Rating', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Indoor Lighting',
    tier3: 'Bathroom Lighting'
  }
};

export const KITCHEN_LIGHTING_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Kitchen Lighting #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Type (Island Pendant, Under Cabinet, Chandelier, Flush)',
    'Style (Modern, Traditional, Farmhouse, Industrial)',
    'Width/Length',
    'Height',
    'Number of Lights',
    'Bulb Type (LED, Incandescent)',
    'Max Wattage',
    'Finish',
    'Material (Glass, Metal, Wood)',
    'Adjustable Height',
    'Dimmable',
    'Integrated LED',
    'Color Temperature',
    'Lumens'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Style', 'Width', 'Height',
    'Adjustable Length', 'Number of Lights', 'Bulb Type',
    'Finish', 'Dimmable', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Indoor Lighting',
    tier3: 'Kitchen Lighting'
  }
};

export const COMMERCIAL_LIGHTING_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Commercial Lighting #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Type (Troffer, Panel, High Bay, Strip)',
    'Size (2x2, 2x4, 1x4)',
    'Wattage',
    'Lumens',
    'Color Temperature (K)',
    'CRI (Color Rendering Index)',
    'Voltage',
    'Mounting Type (Recessed, Surface, Pendant)',
    'Lens Type (Prismatic, Flat, Parabolic)',
    'DLC Listed',
    'Dimmable (0-10V)',
    'Emergency Battery Backup',
    'Motion Sensor Compatible',
    'Warranty (Years)'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Size', 'Wattage',
    'Lumens', 'Color Temperature', 'CRI', 'Voltage',
    'Mounting', 'DLC', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Commercial Lighting',
    tier3: 'Commercial Fixtures'
  }
};

export const LAMP_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Lamps #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Type (Table, Floor, Desk, Buffet, Torchiere)',
    'Style (Modern, Traditional, Transitional, Industrial)',
    'Height',
    'Width/Diameter',
    'Base Material (Metal, Ceramic, Glass, Wood)',
    'Shade Material (Fabric, Glass, Metal)',
    'Shade Color',
    'Number of Lights',
    'Bulb Type',
    'Max Wattage',
    'Switch Type (On/Off, 3-Way, Touch, Dimmer)',
    'Cord Length',
    'USB Port/Outlet',
    'Adjustable'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Style', 'Height',
    'Width', 'Base Material', 'Shade Material', 'Shade Color',
    'Bulb Type', 'Switch Type', 'Features', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Portable Lighting',
    tier3: 'Lamps'
  }
};

export const TRACK_RAIL_LIGHTING_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Track and Rail Lighting #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Type (Track Kit, Track Head, Rail System, Monorail)',
    'Track System (H, J, L, Proprietary)',
    'Track Length',
    'Number of Heads',
    'Style (Modern, Industrial, Contemporary)',
    'Bulb Type (LED, Halogen, PAR)',
    'Max Wattage per Head',
    'Finish',
    'Adjustable/Pivoting',
    'Dimmable',
    'Connector Type',
    'Ceiling Mount Type',
    'Voltage (120V, 12V)',
    'Flexible/Rigid'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'System', 'Length',
    'Number of Heads', 'Bulb Type', 'Finish',
    'Dimmable', 'Voltage', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Indoor Lighting',
    tier3: 'Track and Rail Lighting'
  }
};

export const LIGHTING_ACCESSORIES_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Lighting Accessories #',
  department: 'Lighting',
  top15FilterAttributes: [
    'Brand',
    'Type (Shade, Bulb, Dimmer, Canopy, Chain)',
    'For Fixture Type',
    'Material',
    'Size/Dimensions',
    'Color/Finish',
    'Compatibility',
    'Bulb Base Type (E26, E12, GU10, etc.)',
    'Wattage',
    'Voltage',
    'Dimmable',
    'Smart Home Compatible',
    'Chain Length',
    'Universal Fit',
    'Energy Star'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'For Use With',
    'Material', 'Size', 'Color', 'Specifications',
    'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Lighting',
    tier2: 'Accessories',
    tier3: 'Lighting Accessories'
  }
};

// ============================================
// HOME DECOR SCHEMAS
// ============================================

export const MIRROR_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Mirrors #',
  department: 'Home Decor',
  top15FilterAttributes: [
    'Brand',
    'Type (Wall, Floor, Vanity, Medicine Cabinet)',
    'Shape (Rectangular, Round, Oval, Arch)',
    'Style (Modern, Traditional, Farmhouse, Industrial)',
    'Width',
    'Height',
    'Frame Material (Wood, Metal, Resin, Frameless)',
    'Frame Finish',
    'Mirror Type (Standard, Beveled, Antiqued)',
    'Lighted',
    'Magnification',
    'Mounting Hardware Included',
    'Orientation (Horizontal, Vertical, Both)',
    'Fog-Free',
    'Smart Features'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Shape', 'Style',
    'Width', 'Height', 'Frame', 'Mirror Type',
    'Lighted', 'Mounting', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Home Decor',
    tier2: 'Wall Decor',
    tier3: 'Mirrors'
  }
};

export const BATHROOM_MIRROR_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Bathroom Mirrors #',
  department: 'Home Decor',
  top15FilterAttributes: [
    'Brand',
    'Type (Vanity Mirror, Medicine Cabinet, Lighted Mirror)',
    'Shape (Rectangular, Round, Oval, Arch)',
    'Style (Modern, Traditional, Transitional)',
    'Width',
    'Height',
    'Frame Material',
    'Frame Finish',
    'Lighted (LED, Backlit, Front-Lit)',
    'Color Temperature',
    'Dimmable',
    'Anti-Fog/Defogger',
    'Magnification Section',
    'Touch Controls',
    'Outlet/USB Included'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Shape', 'Width', 'Height',
    'Frame', 'Lighting', 'Color Temperature', 'Defogger',
    'Controls', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Home Decor',
    tier2: 'Bathroom',
    tier3: 'Bathroom Mirrors'
  }
};

export const FURNITURE_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Furniture #',
  department: 'Home Decor',
  top15FilterAttributes: [
    'Brand',
    'Type (Table, Chair, Sofa, Cabinet, Shelf)',
    'Style (Modern, Traditional, Mid-Century, Farmhouse)',
    'Room (Living, Bedroom, Dining, Office)',
    'Material (Wood, Metal, Upholstered, Glass)',
    'Width',
    'Height',
    'Depth',
    'Color/Finish',
    'Number of Pieces',
    'Assembly Required',
    'Weight Capacity',
    'Storage Features',
    'Indoor/Outdoor',
    'Warranty'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Style', 'Room',
    'Material', 'Dimensions', 'Color', 'Assembly',
    'Weight Capacity', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Home Decor',
    tier2: 'Furniture',
    tier3: 'General Furniture'
  }
};

export const KITCHEN_ACCESSORIES_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Kitchen Accessories #',
  department: 'Home Decor',
  top15FilterAttributes: [
    'Brand',
    'Type (Soap Dispenser, Paper Towel Holder, Utensil Holder)',
    'Material (Stainless Steel, Ceramic, Plastic)',
    'Finish',
    'Color',
    'Style (Modern, Traditional, Farmhouse)',
    'Dimensions',
    'Capacity',
    'Mounting Type (Countertop, Wall, Under Cabinet)',
    'Dishwasher Safe',
    'BPA Free',
    'Matching Set Available',
    'Refillable',
    'Rust Resistant',
    'Non-Slip Base'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Material', 'Finish',
    'Dimensions', 'Capacity', 'Mounting', 'Care',
    'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Home Decor',
    tier2: 'Kitchen',
    tier3: 'Kitchen Accessories'
  }
};

// ============================================
// OUTDOOR / FIREPLACE SCHEMAS
// ============================================

export const OUTDOOR_FIREPLACE_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Outdoor Fireplaces #',
  department: 'Outdoor',
  top15FilterAttributes: [
    'Brand',
    'Type (Fire Pit, Fire Table, Outdoor Fireplace, Chiminea)',
    'Fuel Type (Propane, Natural Gas, Wood, Gel)',
    'Style (Modern, Traditional, Rustic)',
    'Shape (Round, Square, Rectangular, Bowl)',
    'Material (Steel, Stone, Concrete, Cast Iron)',
    'Width/Diameter',
    'Height',
    'BTU Output',
    'Ignition Type (Match-Lit, Electronic)',
    'Includes Cover',
    'Includes Glass Beads/Lava Rocks',
    'CSA Certified',
    'Wind Guard Included',
    'Table Height'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Fuel', 'Style',
    'Material', 'Dimensions', 'BTU', 'Ignition',
    'Certifications', 'Accessories', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Outdoor',
    tier2: 'Outdoor Heating',
    tier3: 'Outdoor Fireplaces'
  }
};

// ============================================
// HVAC SCHEMAS
// ============================================

export const HYDRONIC_EXPANSION_TANK_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Hydronic Expansion Tanks #',
  department: 'HVAC',
  top15FilterAttributes: [
    'Brand',
    'Type (Diaphragm, Bladder)',
    'Tank Capacity (Gallons)',
    'System Type (Potable Water, Hydronic Heating)',
    'Max Working Pressure (PSI)',
    'Pre-Charge Pressure (PSI)',
    'Connection Size',
    'Connection Type (NPT, Threaded)',
    'Material (Steel, Stainless)',
    'Max Temperature (°F)',
    'Mounting Position (Vertical, Horizontal)',
    'Dimensions (H x D)',
    'NSF/ANSI Certified',
    'Lead-Free',
    'Warranty (Years)'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Capacity',
    'Max Pressure', 'Pre-Charge', 'Connection',
    'Material', 'Dimensions', 'Certification', 'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'HVAC',
    tier2: 'Hydronic',
    tier3: 'Expansion Tanks'
  }
};

// ============================================
// ADDITIONAL APPLIANCE SCHEMAS (from AI system but missing)
// ============================================

export const COMPACTOR_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Compactor #',
  department: 'Appliances',
  top15FilterAttributes: [
    'Brand',
    'Width',
    'Height',
    'Type (Built-In, Freestanding)',
    'Compaction Force (lbs)',
    'Bag Capacity',
    'Control Type (Manual, Electronic)',
    'Anti-Jam',
    'Odor Control',
    'Tilt-Away Bin',
    'Sound Insulation',
    'Key Lock',
    'Finish',
    'Door Style (Drawer, Pull-Out)',
    'Energy Star'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Width', 'Height', 'Depth',
    'Type', 'Force', 'Controls', 'Finish', 'Voltage',
    'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen',
    tier3: 'Compactor'
  }
};

export const HOT_WATER_DISPENSER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Hot Water Dispensers #',
  department: 'Appliances',
  top15FilterAttributes: [
    'Brand',
    'Type (Instant Hot, Tank, Tankless)',
    'Finish (Chrome, Nickel, Bronze, Stainless)',
    'Spout Style',
    'Water Temperature Range',
    'Tank Capacity',
    'GPH Output',
    'Wattage',
    'Installation Type (Countertop, Under-Sink)',
    'Includes Faucet',
    'Adjustable Temperature',
    'Safety Lock',
    'Energy Saver Mode',
    'Filter Included',
    'Warranty'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Finish', 'Capacity',
    'Temperature Range', 'Wattage', 'Voltage', 'Installation',
    'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen',
    tier3: 'Hot Water Dispensers'
  }
};

export const WATER_FILTER_SCHEMA: CategoryAttributeConfig = {
  categoryName: 'Water Filters #',
  department: 'Appliances',
  top15FilterAttributes: [
    'Brand',
    'Type (Under Sink, Whole House, Countertop, Pitcher)',
    'Filtration Method (Carbon, RO, UV, Sediment)',
    'Stages',
    'Capacity (Gallons)',
    'Filter Life (Months/Gallons)',
    'Flow Rate (GPM)',
    'Contaminants Removed',
    'NSF Certification',
    'Installation Type',
    'Faucet Included',
    'Tank Size',
    'Dimensions',
    'Replacement Filter Model',
    'Warranty'
  ],
  htmlTableAttributes: [
    'Brand', 'Model Number', 'Type', 'Method', 'Stages',
    'Capacity', 'Flow Rate', 'NSF', 'Dimensions',
    'Warranty'
  ],
  taxonomyTiers: {
    tier1: 'Appliances',
    tier2: 'Kitchen',
    tier3: 'Water Filters'
  }
};

// Export all schemas
export default {
  // Plumbing
  BIDET_SCHEMA,
  DRAIN_SCHEMA,
  DRAINAGE_WASTE_SCHEMA,
  ROUGH_IN_VALVE_SCHEMA,
  GARBAGE_DISPOSAL_SCHEMA,
  WATER_HEATER_SCHEMA,
  BATHTUB_WASTE_OVERFLOW_SCHEMA,
  // Hardware
  CABINET_HARDWARE_SCHEMA,
  DOOR_HARDWARE_PARTS_SCHEMA,
  // Lighting
  BATHROOM_LIGHTING_SCHEMA,
  KITCHEN_LIGHTING_SCHEMA,
  COMMERCIAL_LIGHTING_SCHEMA,
  LAMP_SCHEMA,
  TRACK_RAIL_LIGHTING_SCHEMA,
  LIGHTING_ACCESSORIES_SCHEMA,
  // Home Decor
  MIRROR_SCHEMA,
  BATHROOM_MIRROR_SCHEMA,
  FURNITURE_SCHEMA,
  KITCHEN_ACCESSORIES_SCHEMA,
  // Outdoor
  OUTDOOR_FIREPLACE_SCHEMA,
  // HVAC
  HYDRONIC_EXPANSION_TANK_SCHEMA,
  // Additional Appliances
  COMPACTOR_SCHEMA,
  HOT_WATER_DISPENSER_SCHEMA,
  WATER_FILTER_SCHEMA,
};
