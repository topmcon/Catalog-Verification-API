/**
 * CATEGORY CONFIGURATION CONSTANTS
 * =================================
 * All static constants used across the category system.
 * Single source of truth for brand lists, attribute names, and feature keywords.
 */

// ============================================
// PRIMARY ATTRIBUTES (Universal - All Products)
// ============================================

/**
 * The 20 primary attributes that apply to EVERY product regardless of category
 */
export const PRIMARY_ATTRIBUTES = [
  'Brand (Verified)',
  'Category / Subcategory (Verified)',
  'Product Family (Verified)',
  'Product Style (Verified) (Category Specific)',
  'Depth / Length (Verified)',
  'Width (Verified)',
  'Height (Verified)',
  'Weight (Verified)',
  'MSRP (Verified)',
  'Market Value',
  'Description',
  'Product Title (Verified)',
  'Details',
  'Features List',
  'UPC / GTIN (Verified)',
  'Model Number (Verified)',
  'Model Number Alias (Symbols Removed)',
  'Model Parent',
  'Model Variant Number',
  'Total Model Variants (List all variant models)'
] as const;

export type PrimaryAttributeName = typeof PRIMARY_ATTRIBUTES[number];

/**
 * Global Primary Display Attributes (alias for backwards compatibility)
 */
export const GLOBAL_PRIMARY_ATTRIBUTES = PRIMARY_ATTRIBUTES;

// ============================================
// BRAND TIERS
// ============================================

/**
 * Premium/Luxury brands - highest tier
 */
export const PREMIUM_BRANDS = [
  'Sub-Zero', 'Wolf', 'Thermador', 'Viking', 'Miele', 
  'Gaggenau', 'La Cornue', 'Dacor', 'Monogram', 'BlueStar',
  'Hestan', 'JennAir', 'Café', 'Fisher & Paykel', 'Liebherr',
  'Bertazzoni', 'ZLINE', 'Lynx', 'Kalamazoo', 'Alfresco',
  'Cove', 'True Residential', 'Big Chill', 'AGA', 'Lacanche',
  'Ilve', 'Capital', 'American Range', 'DCS', 'Perlick'
] as const;

/**
 * Mid-tier brands - quality mainstream
 */
export const MID_TIER_BRANDS = [
  'KitchenAid', 'Bosch', 'Samsung', 'LG', 'GE Profile',
  'Electrolux', 'Frigidaire Gallery', 'Whirlpool', 'Maytag',
  'GE', 'Broan', 'Zephyr', 'Sharp', 'Beko', 'Haier',
  'GE Appliances', 'LG Studio', 'Samsung Chef', 'Speed Queen'
] as const;

/**
 * Value brands - budget-friendly
 */
export const VALUE_BRANDS = [
  'Frigidaire', 'Amana', 'Hotpoint', 'Roper', 'Crosley',
  'Magic Chef', 'Avanti', 'Danby', 'Insignia', 'Vissani',
  'Summit', 'Galanz', 'Midea', 'Hisense'
] as const;

// ============================================
// FEATURE KEYWORDS
// ============================================

/**
 * Premium feature keywords for title/description highlighting
 */
export const PREMIUM_FEATURE_KEYWORDS = [
  'Built-In',
  'Built In',
  'Panel Ready',
  'Counter Depth',
  'Professional',
  'Commercial Grade',
  'Smart Home',
  'WiFi',
  'Connected',
  'Luxury',
  'Premium',
  'High-End',
  'Custom',
  'Designer',
  'Pro Series',
  'Signature',
  'Elite',
  'Platinum',
  'Gold',
  'Stainless Steel',
  'Fingerprint Resistant',
  'Energy Star',
  'ADA Compliant',
  'Sabbath Mode',
  'Steam',
  'Convection',
  'Induction',
  'Dual Fuel',
  'Self-Cleaning'
] as const;

// ============================================
// CATEGORY NAME VARIATIONS
// ============================================

/**
 * Known aliases for category names
 * Used for fuzzy matching in lookups
 */
export const CATEGORY_NAME_ALIASES: Record<string, string[]> = {
  'Refrigerator': ['Fridge', 'Refrigerators', 'Frig'],
  'Dishwasher': ['Dishwashers', 'Dish Washer'],
  'Range': ['Stove', 'Ranges', 'Cooking Range', 'Gas Range', 'Electric Range'],
  'Cooktop': ['Cooktops', 'Cook Top', 'Stovetop'],
  'Oven': ['Ovens', 'Wall Oven', 'Wall Ovens'],
  'Microwave': ['Microwaves', 'Microwave Oven'],
  'Range Hood': ['Hood', 'Vent Hood', 'Ventilation', 'Range Hoods'],
  'Washer': ['Washing Machine', 'Washers'],
  'Dryer': ['Dryers', 'Clothes Dryer'],
  'Freezer': ['Freezers', 'Chest Freezer', 'Upright Freezer'],
  'Icemaker': ['Ice Maker', 'Ice Machine'],
  'All in One Washer / Dryer': ['Washer Dryer Combo', 'Combo Washer Dryer', 'Laundry Center'],
  'Bathroom Sinks': ['Bath Sink', 'Lavatory', 'Lav Sink'],
  'Kitchen Sinks': ['Kitchen Sink', 'Undermount Sink'],
  'Toilets': ['Toilet', 'Commode', 'Water Closet'],
  'Bathtubs': ['Bathtub', 'Tub', 'Soaking Tub'],
  'Chandeliers': ['Chandelier', 'Crystal Chandelier'],
  'Pendants': ['Pendant', 'Pendant Light', 'Hanging Light'],
};

/**
 * AI System Category Aliases
 * Maps variations to canonical category IDs used in AI schema lookup
 */
export const AI_CATEGORY_ALIASES: Record<string, string> = {
  'gas range': 'range',
  'gas ranges': 'range',
  'electric range': 'range',
  'electric ranges': 'range',
  'dual fuel range': 'range',
  'dual fuel ranges': 'range',
  'induction range': 'range',
  'freestanding range': 'range',
  'slide in range': 'range',
  'french door refrigerator': 'refrigerator',
  'side by side refrigerator': 'refrigerator',
  'bottom freezer refrigerator': 'refrigerator',
  'top freezer refrigerator': 'refrigerator',
  'wall oven': 'oven',
  'double wall oven': 'oven',
  'single wall oven': 'oven',
  'gas cooktop': 'cooktop',
  'electric cooktop': 'cooktop',
  'induction cooktop': 'cooktop',
  'over the range microwave': 'microwave',
  'countertop microwave': 'microwave',
  'built in microwave': 'microwave',
  'upright freezer': 'freezer',
  'chest freezer': 'freezer',
  'front load washer': 'washer',
  'top load washer': 'washer',
  'gas dryer': 'dryer',
  'electric dryer': 'dryer',
  'pedestal sink': 'bathroom_sinks',
  'vessel sink': 'bathroom_sinks',
  'undermount sink': 'bathroom_sinks',
  'drop in sink': 'bathroom_sinks',
  'freestanding bathtub': 'bathtubs',
  'alcove bathtub': 'bathtubs',
  'soaking tub': 'bathtubs',
  'whirlpool tub': 'bathtubs',
  'pull down faucet': 'kitchen_faucets',
  'pull out faucet': 'kitchen_faucets',
  'touchless faucet': 'kitchen_faucets',
  'single handle faucet': 'bathroom_faucets',
  'widespread faucet': 'bathroom_faucets',
  'one piece toilet': 'toilets',
  'two piece toilet': 'toilets',
  'comfort height toilet': 'toilets',
  'bidet toilet': 'toilets',
};

// ============================================
// DEPARTMENT DEFINITIONS
// ============================================

/**
 * Department names
 */
export const DEPARTMENTS = [
  'Appliances',
  'Plumbing & Bath',
  'Lighting',
  'Home Decor',
  'HVAC',
  'Outdoor',
  'Other / Needs Review'
] as const;

export type DepartmentName = typeof DEPARTMENTS[number];

// ============================================
// ATTRIBUTE FALLBACKS
// ============================================

/**
 * Fallback attributes for AI schema when JSON data is incomplete
 * Maps normalized category ID to array of attribute names
 * IMPORTANT: These names MUST match Salesforce picklist field names exactly!
 */
export const AI_FALLBACK_ATTRIBUTES: Record<string, string[]> = {
  // Appliances - Aligned with Salesforce picklist names
  'range': ['Fuel Type', 'Configuration', 'Number Of Burners', 'Oven Capacity', 'Convection', 'Self Cleaning', 'Double Oven', 'Air Fry', 'Smart Home', 'Induction', 'Energy Star', 'Continuous Grates', 'BTU Output', 'Griddle', 'Sabbath Mode'],
  'refrigerator': ['Configuration', 'Total Capacity', 'Counter Depth', 'Ice Maker', 'Fingerprint Resistant', 'Smart Home', 'Energy Star', 'Number Of Doors', 'Refrigerator Capacity', 'Freezer Capacity', 'Dispenser Features', 'Installation Type', 'Internal Ice Maker', 'Number of Zones', 'Glass Doors'],
  'dishwasher': ['Noise Level', 'Installation Type', 'Place Setting Capacity', 'Stainless Steel Interior', 'Number of Wash Cycles', 'Drying System', 'Control Type', 'Energy Star', 'Smart Home', 'ADA', 'Fingerprint Resistant', 'Panel Ready', 'Number Of Racks', 'Cutlery Tray', 'Dishwasher Type'],
  'wall_oven': ['Configuration', 'Fuel Type', 'Oven Capacity', 'Convection', 'Self Cleaning', 'Smart Home', 'Air Fry', 'Steam Cooking', 'Combination Oven', 'Door Type', 'Meat Thermometer', 'Sabbath Mode', 'Number Of Racks', 'Microwave Capacity', 'Control Type'],
  'cooktop': ['Fuel Type', 'Number Of Burners', 'Induction', 'Installation Type', 'BTU Output', 'Continuous Grates', 'Control Type', 'Griddle', 'Downdraft Ventilated', 'Bridge Element', 'Hot Surface Indicator Lights', 'Power Burner', 'Ignition Type', 'Smart Home', 'LP Conversion'],
  'microwave': ['Installation Type', 'Microwave Capacity', 'Wattage', 'CFM', 'Convection', 'Sensor Cooking', 'Turntable', 'Smart Home', 'Steam Cooking', 'Air Fry', 'Fingerprint Resistant', 'Control Type', 'Auto Shut Off', 'Automatic Defrost', 'Turntable Diameter'],
  'range_hood': ['Installation Type', 'CFM', 'Sones', 'Ductless', 'Fan Speeds', 'Filter Type', 'Light Included', 'LED', 'Convertible to Ductless', 'Blower', 'Includes Remote', 'Material', 'Duct Size', 'Control Type', 'CFM (High)'],
  'washer': ['Top Loading', 'Front Loading', 'Washer Capacity', 'Steam Technology', 'Energy Star', 'Smart Home', 'Agitator', 'Stackable', 'Pedestal Included', 'Number of Wash Cycles', 'Washer RPM', 'Sanitary Rinse', 'Drive Type', 'Detergent Dispenser', 'Noise Level'],
  'dryer': ['Fuel Type', 'Vent Type', 'Dryer Capacity', 'Steam Technology', 'Energy Star', 'Smart Home', 'Sensor Dry', 'Stackable', 'Pedestal Included', 'Number of Dry Cycles', 'Drum Material', 'Sanitary Rinse', 'Door Swing', 'Interior Light', 'Noise Level'],
  'freezer': ['Type', 'Capacity', 'Width', 'Defrost Type', 'Temperature Alarm', 'Door Lock', 'Interior Lighting', 'Baskets/Bins', 'Finish', 'Color', 'Energy Star', 'Reversible Door', 'External Controls', 'Temperature Display', 'Fast Freeze'],
  'all_in_one_washer_dryer': ['Capacity', 'Number of Cycles', 'Steam', 'Ventless', 'Energy Star', 'Smart Features', 'Color', 'Finish', 'Noise Level', 'Spin Speed', 'Sanitize', 'Delay Start', 'Child Lock', 'Drum Material', 'Dry Cycles'],
  'wine_cooler': ['Bottle Capacity', 'Temperature Zones', 'Width', 'Installation Type', 'Compressor Type', 'Shelving Material', 'UV Protection', 'Humidity Control', 'Interior Lighting', 'Door Style', 'Finish', 'Lock', 'Temperature Range', 'Reversible Door', 'Vibration Control'],
  'ice_maker': ['Ice Production', 'Ice Storage', 'Ice Type', 'Width', 'Installation Type', 'Drain Required', 'Water Line Required', 'Clear Ice', 'Self-Cleaning', 'Finish', 'LED Lighting', 'Filter Indicator', 'Door Alarm', 'ADA Compliant', 'Pump Drain'],
  
  // Plumbing & Bath - Aligned with Salesforce picklist names
  'bathroom_sinks': ['Style', 'Material', 'Width', 'Depth', 'Shape', 'Faucet Holes', 'Overflow', 'Finish', 'ADA', 'Drain Assembly Included', 'Commercial Grade', 'Console Legs', 'Semi-Recessed', 'Integrated Countertop', 'Weight'],
  'bathroom_vanities': ['Width', 'Style', 'Configuration', 'Cabinet Material', 'Countertop Material', 'Sink Included', 'Faucet Included', 'Number of Drawers', 'Number of Doors', 'Soft-Close', 'Finish', 'Mirror Included', 'Backsplash', 'Assembly Required', 'Hardware Finish'],
  'bathtubs': ['Installation Type', 'Material', 'Drain Placement', 'Nominal Length', 'Nominal Width', 'Number Of Bathers', 'Tub Shape', 'Capacity (Gallons)', 'Overflow', 'Drain Assembly Included', 'Water Depth', 'Accepts Deck Mount Faucet', 'ADA', 'Soaking', 'Number of Jets'],
  'toilets': ['Configuration', 'Bowl Shape', 'Flush Type', 'Gallons Per Flush', 'Bowl Height', 'Rough In', 'Seat Included', 'WaterSense Certified', 'ADA', 'Trapway', 'Bidet Seat Included', 'Flush Technology', 'Night Light', 'Mounting Type', 'Soft Close Hinges'],
  'kitchen_sinks': ['Configuration', 'Material', 'Width', 'Depth', 'Bowl Depth', 'Number of Bowls', 'Faucet Holes', 'Drain Position', 'Sound Dampening', 'Grid Included', 'Finish', 'Undermount/Drop-In', 'Strainer Included', 'Commercial Grade', 'Gauge'],
  'kitchen_faucets': ['Faucet Type', 'Number Of Handles', 'Spout Height', 'Spout Reach', 'Touchless Faucet', 'Voice Activated', 'Spray Settings', 'Faucet Holes', 'Flow Rate (GPM)', 'WaterSense Certified', 'Soap Dispenser Included', 'Magnetic Docking', 'Pre Rinse', 'Spout Style', 'Handle Style'],
  'bathroom_faucets': ['Faucet Mounting Type', 'Number Of Handles', 'Spout Height', 'Spout Reach', 'Faucet Holes', 'Drain Assembly Included', 'Flow Rate (GPM)', 'WaterSense Certified', 'ADA', 'Touchless Faucet', 'Handle Style', 'Spout Style', 'Vessel Faucet', 'Valve Type', 'Collection'],
  
  // Lighting - Aligned with Salesforce picklist names
  'chandeliers': ['Number Of Lights', 'Chandelier Type', 'Material', 'Bulb Type', 'Dimmable', 'Maximum Adjustable Height', 'Bulb Included', 'Location Rating', 'Sloped Ceiling Compatible', 'Crystal Type', 'Chain Length', 'Shade Material', 'Number of Tiers', 'Shape', 'LED'],
  'pendants': ['Style', 'Width/Diameter', 'Height', 'Adjustable Height', 'Number Of Lights', 'Bulb Type', 'Max Wattage', 'Finish', 'Shade Material', 'Dimmable', 'Mini/Standard', 'Cord/Chain', 'Canopy Size', 'Island/Single', 'UL Listed'],
  'ceiling_fans': ['Blade Span', 'Number of Blades', 'Light Kit Included', 'Motor Type', 'Location Rating', 'Fan Speeds', 'Includes Remote', 'Smart Home', 'Reversible Motor', 'Energy Star', 'CFM', 'Fan Blade Material', 'Downrod Included', 'Light Kit Compatible', 'Low Ceiling Adaptable'],
  'ceiling_lights': ['Style', 'Width/Diameter', 'Height', 'Number Of Lights', 'Bulb Type', 'Max Wattage', 'Finish', 'Material', 'Dimmable', 'Integrated LED', 'Color Temperature', 'Lumens', 'Dry/Damp/Wet Rated', 'UL Listed', 'Energy Star'],
  'wall_sconces': ['Style', 'Width', 'Height', 'Extension', 'Number Of Lights', 'Bulb Type', 'Max Wattage', 'Finish', 'Shade Material', 'Direction', 'Dimmable', 'Hardwired/Plug-In', 'Dry/Damp/Wet Rated', 'ADA', 'UL Listed'],
  'outdoor_lighting': ['Type', 'Style', 'Width', 'Height', 'Number Of Lights', 'Bulb Type', 'Max Wattage', 'Finish', 'Material', 'Weather Rating', 'Motion Sensor', 'Dusk to Dawn', 'Solar Powered', 'Dark Sky', 'UL Listed'],
  'recessed_lighting': ['Type', 'Size', 'Housing Type', 'Trim Style', 'Bulb Type', 'Wattage', 'Finish', 'Dimmable', 'Color Temperature', 'Lumens', 'Beam Angle', 'Airtight', 'Wet/Damp Rated', 'Title 24', 'IC Rated'],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a brand is premium tier
 */
export function isPremiumBrand(brand: string): boolean {
  return PREMIUM_BRANDS.some(b => b.toLowerCase() === brand.toLowerCase());
}

/**
 * Check if a brand is mid tier
 */
export function isMidTierBrand(brand: string): boolean {
  return MID_TIER_BRANDS.some(b => b.toLowerCase() === brand.toLowerCase());
}

/**
 * Get brand tier
 */
export function getBrandTier(brand: string): 'premium' | 'mid' | 'value' | 'unknown' {
  if (isPremiumBrand(brand)) return 'premium';
  if (isMidTierBrand(brand)) return 'mid';
  if (VALUE_BRANDS.some(b => b.toLowerCase() === brand.toLowerCase())) return 'value';
  return 'unknown';
}

/**
 * Check if text contains premium feature keywords
 */
export function hasPremiumFeatures(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PREMIUM_FEATURE_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
}
