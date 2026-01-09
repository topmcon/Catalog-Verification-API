/**
 * MASTER CATEGORY ATTRIBUTES CONFIGURATION
 * ==========================================
 * This is the STATIC backend definition of ALL categories and their attributes.
 * These are FIXED - the AI must map incoming data to these exact fields.
 * 
 * STRUCTURE:
 * 1. PRIMARY ATTRIBUTES - Same 20 fields for ALL products (universal)
 * 2. TOP 15 FILTER ATTRIBUTES - Category-specific filter attributes
 * 3. ADDITIONAL ATTRIBUTES - Everything else → rendered as HTML spec table
 */

/**
 * ============================================
 * PRIMARY ATTRIBUTES (UNIVERSAL - ALL PRODUCTS)
 * ============================================
 * These 20 fields apply to EVERY product regardless of category
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
 * Primary attribute field definitions with types and descriptions
 */
export interface PrimaryAttributeDefinition {
  name: PrimaryAttributeName;
  fieldKey: string;  // For mapping to/from Salesforce
  type: 'string' | 'number' | 'currency' | 'dimension' | 'html' | 'list';
  required: boolean;
  description: string;
}

export const PRIMARY_ATTRIBUTE_DEFINITIONS: PrimaryAttributeDefinition[] = [
  { name: 'Brand (Verified)', fieldKey: 'brand_verified', type: 'string', required: true, description: 'Manufacturer brand name' },
  { name: 'Category / Subcategory (Verified)', fieldKey: 'category_subcategory_verified', type: 'string', required: true, description: 'Product category and subcategory' },
  { name: 'Product Family (Verified)', fieldKey: 'product_family_verified', type: 'string', required: true, description: 'Product family grouping' },
  { name: 'Product Style (Verified) (Category Specific)', fieldKey: 'product_style_verified', type: 'string', required: false, description: 'Style specific to the category' },
  { name: 'Depth / Length (Verified)', fieldKey: 'depth_length_verified', type: 'dimension', required: false, description: 'Product depth or length in inches' },
  { name: 'Width (Verified)', fieldKey: 'width_verified', type: 'dimension', required: false, description: 'Product width in inches' },
  { name: 'Height (Verified)', fieldKey: 'height_verified', type: 'dimension', required: false, description: 'Product height in inches' },
  { name: 'Weight (Verified)', fieldKey: 'weight_verified', type: 'dimension', required: false, description: 'Product weight in lbs' },
  { name: 'MSRP (Verified)', fieldKey: 'msrp_verified', type: 'currency', required: true, description: 'Manufacturer suggested retail price' },
  { name: 'Market Value', fieldKey: 'market_value', type: 'currency', required: false, description: 'Current market value from Ferguson' },
  { name: 'Description', fieldKey: 'description', type: 'string', required: true, description: 'Product description' },
  { name: 'Product Title (Verified)', fieldKey: 'product_title_verified', type: 'string', required: true, description: 'Standardized product title' },
  { name: 'Details', fieldKey: 'details', type: 'string', required: false, description: 'Additional product details' },
  { name: 'Features List', fieldKey: 'features_list', type: 'html', required: false, description: 'HTML formatted feature list' },
  { name: 'UPC / GTIN (Verified)', fieldKey: 'upc_gtin_verified', type: 'string', required: false, description: 'Universal Product Code or Global Trade Item Number' },
  { name: 'Model Number (Verified)', fieldKey: 'model_number_verified', type: 'string', required: true, description: 'Manufacturer model number' },
  { name: 'Model Number Alias (Symbols Removed)', fieldKey: 'model_number_alias', type: 'string', required: false, description: 'Model number with special characters removed' },
  { name: 'Model Parent', fieldKey: 'model_parent', type: 'string', required: false, description: 'Parent model number for variants' },
  { name: 'Model Variant Number', fieldKey: 'model_variant_number', type: 'string', required: false, description: 'Specific variant identifier' },
  { name: 'Total Model Variants (List all variant models)', fieldKey: 'total_model_variants', type: 'list', required: false, description: 'Comma-separated list of all model variants' }
];

/**
 * ============================================
 * CATEGORY SCHEMA DEFINITION
 * ============================================
 */
export interface CategorySchema {
  categoryId: string;
  categoryName: string;
  department: string;
  aliases: string[];  // Alternative names AI might identify
  top15FilterAttributes: FilterAttributeDefinition[];
}

export interface FilterAttributeDefinition {
  name: string;
  fieldKey: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  unit?: string;
  allowedValues?: string[];
  description: string;
}

/**
 * ============================================
 * APPLIANCE CATEGORIES - TOP 15 FILTER ATTRIBUTES
 * ============================================
 */

export const RANGE_SCHEMA: CategorySchema = {
  categoryId: 'range',
  categoryName: 'Range',
  department: 'Appliances',
  aliases: ['Stove', 'Gas Range', 'Electric Range', 'Dual Fuel Range', 'Cooking Range', 'Kitchen Range'],
  top15FilterAttributes: [
    { name: 'Fuel Type', fieldKey: 'fuel_type', type: 'enum', allowedValues: ['Gas', 'Electric', 'Dual Fuel', 'Induction'], description: 'Primary fuel source' },
    { name: 'Configuration', fieldKey: 'configuration', type: 'enum', allowedValues: ['Freestanding', 'Slide-In', 'Drop-In'], description: 'Installation type' },
    { name: 'Range Width', fieldKey: 'range_width', type: 'number', unit: 'inches', description: 'Range width in inches' },
    { name: 'Number of Burners', fieldKey: 'number_of_burners', type: 'number', description: 'Total burner count' },
    { name: 'Oven Capacity', fieldKey: 'oven_capacity', type: 'number', unit: 'cu. ft.', description: 'Oven interior capacity' },
    { name: 'Convection', fieldKey: 'convection', type: 'boolean', description: 'Has convection cooking' },
    { name: 'Self-Cleaning', fieldKey: 'self_cleaning', type: 'enum', allowedValues: ['Steam Clean', 'Self-Clean', 'Manual', 'Both'], description: 'Cleaning method' },
    { name: 'Max Burner BTU', fieldKey: 'max_burner_btu', type: 'number', unit: 'BTU', description: 'Highest burner output' },
    { name: 'Griddle Included', fieldKey: 'griddle_included', type: 'boolean', description: 'Includes griddle accessory' },
    { name: 'Double Oven', fieldKey: 'double_oven', type: 'boolean', description: 'Has two oven cavities' },
    { name: 'Warming Drawer', fieldKey: 'warming_drawer', type: 'boolean', description: 'Includes warming drawer' },
    { name: 'Air Fry', fieldKey: 'air_fry', type: 'boolean', description: 'Has air fry capability' },
    { name: 'Smart/WiFi Connected', fieldKey: 'smart_wifi', type: 'boolean', description: 'WiFi or smart home connectivity' },
    { name: 'Continuous Grates', fieldKey: 'continuous_grates', type: 'boolean', description: 'Has continuous cast iron grates' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const REFRIGERATOR_SCHEMA: CategorySchema = {
  categoryId: 'refrigerator',
  categoryName: 'Refrigerator',
  department: 'Appliances',
  aliases: ['Fridge', 'French Door Refrigerator', 'Side by Side Refrigerator', 'Bottom Freezer', 'Top Freezer', 'Column Refrigerator'],
  top15FilterAttributes: [
    { name: 'Door Configuration', fieldKey: 'door_configuration', type: 'enum', allowedValues: ['French Door', 'Side-by-Side', 'Top Freezer', 'Bottom Freezer', 'Single Door', 'Column'], description: 'Door style/layout' },
    { name: 'Total Capacity', fieldKey: 'total_capacity', type: 'number', unit: 'cu. ft.', description: 'Total interior capacity' },
    { name: 'Refrigerator Width', fieldKey: 'refrigerator_width', type: 'number', unit: 'inches', description: 'Unit width' },
    { name: 'Counter Depth', fieldKey: 'counter_depth', type: 'boolean', description: 'Is counter depth' },
    { name: 'Ice Maker', fieldKey: 'ice_maker', type: 'enum', allowedValues: ['None', 'Standard', 'Craft Ice', 'Dual'], description: 'Ice maker type' },
    { name: 'Water Dispenser', fieldKey: 'water_dispenser', type: 'boolean', description: 'Has water dispenser' },
    { name: 'Freezer Capacity', fieldKey: 'freezer_capacity', type: 'number', unit: 'cu. ft.', description: 'Freezer compartment capacity' },
    { name: 'Refrigerator Capacity', fieldKey: 'refrigerator_capacity', type: 'number', unit: 'cu. ft.', description: 'Fresh food compartment capacity' },
    { name: 'Smart/WiFi Connected', fieldKey: 'smart_wifi', type: 'boolean', description: 'WiFi or smart home connectivity' },
    { name: 'Fingerprint Resistant', fieldKey: 'fingerprint_resistant', type: 'boolean', description: 'Has fingerprint resistant finish' },
    { name: 'Door-in-Door', fieldKey: 'door_in_door', type: 'boolean', description: 'Has door-in-door feature' },
    { name: 'Dual Cooling System', fieldKey: 'dual_cooling', type: 'boolean', description: 'Separate cooling systems' },
    { name: 'Interior Water Dispenser', fieldKey: 'interior_water_dispenser', type: 'boolean', description: 'Dispenser inside (not on door)' },
    { name: 'ENERGY STAR', fieldKey: 'energy_star', type: 'boolean', description: 'ENERGY STAR certified' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const DISHWASHER_SCHEMA: CategorySchema = {
  categoryId: 'dishwasher',
  categoryName: 'Dishwasher',
  department: 'Appliances',
  aliases: ['Dish Washer', 'Built-In Dishwasher', 'Portable Dishwasher', 'Drawer Dishwasher'],
  top15FilterAttributes: [
    { name: 'Installation Type', fieldKey: 'installation_type', type: 'enum', allowedValues: ['Built-In', 'Portable', 'Drawer', 'Countertop'], description: 'How dishwasher is installed' },
    { name: 'Tub Material', fieldKey: 'tub_material', type: 'enum', allowedValues: ['Stainless Steel', 'Plastic', 'Hybrid'], description: 'Interior tub material' },
    { name: 'Noise Level (dB)', fieldKey: 'noise_level_db', type: 'number', unit: 'dB', description: 'Operating noise level' },
    { name: 'Place Settings', fieldKey: 'place_settings', type: 'number', description: 'Capacity in place settings' },
    { name: 'Third Rack', fieldKey: 'third_rack', type: 'boolean', description: 'Has third rack' },
    { name: 'Number of Wash Cycles', fieldKey: 'wash_cycles', type: 'number', description: 'Total wash cycle options' },
    { name: 'Drying System', fieldKey: 'drying_system', type: 'enum', allowedValues: ['Heated Dry', 'Fan Dry', 'Condensation', 'AutoAir'], description: 'Drying method' },
    { name: 'Soil Sensor', fieldKey: 'soil_sensor', type: 'boolean', description: 'Has automatic soil sensing' },
    { name: 'Hard Food Disposer', fieldKey: 'hard_food_disposer', type: 'boolean', description: 'Has built-in disposer' },
    { name: 'Adjustable Racks', fieldKey: 'adjustable_racks', type: 'boolean', description: 'Has adjustable rack positions' },
    { name: 'Bottle Jets', fieldKey: 'bottle_jets', type: 'boolean', description: 'Has dedicated bottle washing' },
    { name: 'Steam PreWash', fieldKey: 'steam_prewash', type: 'boolean', description: 'Has steam cleaning' },
    { name: 'Smart/WiFi Connected', fieldKey: 'smart_wifi', type: 'boolean', description: 'WiFi or smart home connectivity' },
    { name: 'ENERGY STAR', fieldKey: 'energy_star', type: 'boolean', description: 'ENERGY STAR certified' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const WALL_OVEN_SCHEMA: CategorySchema = {
  categoryId: 'wall_oven',
  categoryName: 'Wall Oven',
  department: 'Appliances',
  aliases: ['Built-In Oven', 'Double Oven', 'Single Wall Oven', 'Convection Oven', 'Steam Oven', 'Oven'],
  top15FilterAttributes: [
    { name: 'Oven Type', fieldKey: 'oven_type', type: 'enum', allowedValues: ['Single', 'Double', 'Combination', 'Microwave Combo'], description: 'Single or double wall oven' },
    { name: 'Fuel Type', fieldKey: 'fuel_type', type: 'enum', allowedValues: ['Electric', 'Gas'], description: 'Power source' },
    { name: 'Oven Width', fieldKey: 'oven_width', type: 'number', unit: 'inches', description: 'Wall cutout width' },
    { name: 'Total Capacity', fieldKey: 'total_capacity', type: 'number', unit: 'cu. ft.', description: 'Combined oven capacity' },
    { name: 'Convection Type', fieldKey: 'convection_type', type: 'enum', allowedValues: ['None', 'Single Fan', 'True/European', 'Dual Fan'], description: 'Convection type' },
    { name: 'Self-Cleaning', fieldKey: 'self_cleaning', type: 'enum', allowedValues: ['Steam Clean', 'Self-Clean', 'Manual', 'Both'], description: 'Cleaning method' },
    { name: 'Air Fry', fieldKey: 'air_fry', type: 'boolean', description: 'Has air fry mode' },
    { name: 'Steam Cooking', fieldKey: 'steam_cooking', type: 'boolean', description: 'Has steam cooking' },
    { name: 'Smart/WiFi Connected', fieldKey: 'smart_wifi', type: 'boolean', description: 'WiFi connectivity' },
    { name: 'Temperature Probe', fieldKey: 'temperature_probe', type: 'boolean', description: 'Includes meat probe' },
    { name: 'Sabbath Mode', fieldKey: 'sabbath_mode', type: 'boolean', description: 'Has Sabbath mode' },
    { name: 'Door Style', fieldKey: 'door_style', type: 'enum', allowedValues: ['Drop Down', 'Side Swing', 'French Door'], description: 'How door opens' },
    { name: 'Gliding Rack', fieldKey: 'gliding_rack', type: 'boolean', description: 'Has smooth glide rack' },
    { name: 'Warming Drawer', fieldKey: 'warming_drawer', type: 'boolean', description: 'Includes warming drawer' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const COOKTOP_SCHEMA: CategorySchema = {
  categoryId: 'cooktop',
  categoryName: 'Cooktop',
  department: 'Appliances',
  aliases: ['Gas Cooktop', 'Electric Cooktop', 'Induction Cooktop', 'Rangetop', 'Cook Top'],
  top15FilterAttributes: [
    { name: 'Fuel Type', fieldKey: 'fuel_type', type: 'enum', allowedValues: ['Gas', 'Electric', 'Induction'], description: 'Cooking fuel type' },
    { name: 'Cooktop Width', fieldKey: 'cooktop_width', type: 'number', unit: 'inches', description: 'Cooktop width' },
    { name: 'Number of Burners/Elements', fieldKey: 'number_of_burners', type: 'number', description: 'Total cooking zones' },
    { name: 'Max Output (BTU/Watts)', fieldKey: 'max_output', type: 'number', description: 'Highest burner output' },
    { name: 'Installation Type', fieldKey: 'installation_type', type: 'enum', allowedValues: ['Drop-In', 'Rangetop'], description: 'How it installs' },
    { name: 'Continuous Grates', fieldKey: 'continuous_grates', type: 'boolean', description: 'Has continuous cast iron grates' },
    { name: 'Griddle', fieldKey: 'griddle', type: 'boolean', description: 'Has integrated griddle' },
    { name: 'Downdraft Ventilation', fieldKey: 'downdraft', type: 'boolean', description: 'Has built-in downdraft' },
    { name: 'Bridge Element', fieldKey: 'bridge_element', type: 'boolean', description: 'Has bridge zone for griddles' },
    { name: 'Hot Surface Indicator', fieldKey: 'hot_surface_indicator', type: 'boolean', description: 'Has indicator lights' },
    { name: 'Simmer Burner', fieldKey: 'simmer_burner', type: 'boolean', description: 'Has dedicated simmer' },
    { name: 'Wok Ring/Grate', fieldKey: 'wok_ring', type: 'boolean', description: 'Includes wok support' },
    { name: 'Control Type', fieldKey: 'control_type', type: 'enum', allowedValues: ['Knobs', 'Touch', 'Combination'], description: 'Control interface' },
    { name: 'Auto Re-ignition', fieldKey: 'auto_reignition', type: 'boolean', description: 'Automatically relights if flame goes out' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Surface color or finish' }
  ]
};

export const MICROWAVE_SCHEMA: CategorySchema = {
  categoryId: 'microwave',
  categoryName: 'Microwave',
  department: 'Appliances',
  aliases: ['Over the Range Microwave', 'OTR Microwave', 'Countertop Microwave', 'Built-In Microwave', 'Microwave Drawer'],
  top15FilterAttributes: [
    { name: 'Installation Type', fieldKey: 'installation_type', type: 'enum', allowedValues: ['Over-the-Range', 'Countertop', 'Built-In', 'Drawer'], description: 'How microwave is installed' },
    { name: 'Capacity', fieldKey: 'capacity', type: 'number', unit: 'cu. ft.', description: 'Interior capacity' },
    { name: 'Wattage', fieldKey: 'wattage', type: 'number', unit: 'watts', description: 'Cooking power' },
    { name: 'Microwave Width', fieldKey: 'microwave_width', type: 'number', unit: 'inches', description: 'Unit width' },
    { name: 'Ventilation CFM', fieldKey: 'ventilation_cfm', type: 'number', unit: 'CFM', description: 'Exhaust fan power (OTR only)' },
    { name: 'Convection', fieldKey: 'convection', type: 'boolean', description: 'Has convection cooking' },
    { name: 'Sensor Cooking', fieldKey: 'sensor_cooking', type: 'boolean', description: 'Has sensor cook modes' },
    { name: 'Turntable', fieldKey: 'turntable', type: 'boolean', description: 'Has rotating turntable' },
    { name: 'Smart/WiFi Connected', fieldKey: 'smart_wifi', type: 'boolean', description: 'WiFi connectivity' },
    { name: 'Steam Cooking', fieldKey: 'steam_cooking', type: 'boolean', description: 'Has steam cook function' },
    { name: 'Air Fry', fieldKey: 'air_fry', type: 'boolean', description: 'Has air fry mode' },
    { name: 'Charcoal Filter', fieldKey: 'charcoal_filter', type: 'boolean', description: 'Has charcoal odor filter' },
    { name: 'Auto Defrost', fieldKey: 'auto_defrost', type: 'boolean', description: 'Has automatic defrost' },
    { name: 'Preset Cook Options', fieldKey: 'preset_options', type: 'number', description: 'Number of preset programs' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const RANGE_HOOD_SCHEMA: CategorySchema = {
  categoryId: 'range_hood',
  categoryName: 'Range Hood',
  department: 'Appliances',
  aliases: ['Vent Hood', 'Exhaust Hood', 'Kitchen Hood', 'Under Cabinet Hood', 'Wall Mount Hood', 'Island Hood', 'Ventilation Hood'],
  top15FilterAttributes: [
    { name: 'Hood Type', fieldKey: 'hood_type', type: 'enum', allowedValues: ['Under Cabinet', 'Wall Mount', 'Island', 'Downdraft', 'Insert/Liner'], description: 'Installation style' },
    { name: 'Hood Width', fieldKey: 'hood_width', type: 'number', unit: 'inches', description: 'Hood width' },
    { name: 'CFM', fieldKey: 'cfm', type: 'number', unit: 'CFM', description: 'Air movement capacity' },
    { name: 'Noise Level (sones)', fieldKey: 'noise_level_sones', type: 'number', unit: 'sones', description: 'Operating noise' },
    { name: 'Venting Type', fieldKey: 'venting_type', type: 'enum', allowedValues: ['Ducted', 'Ductless', 'Convertible'], description: 'Ventilation method' },
    { name: 'Fan Speeds', fieldKey: 'fan_speeds', type: 'number', description: 'Number of speed settings' },
    { name: 'Lighting Type', fieldKey: 'lighting_type', type: 'enum', allowedValues: ['LED', 'Halogen', 'Incandescent', 'None'], description: 'Light type' },
    { name: 'Heat Sensor', fieldKey: 'heat_sensor', type: 'boolean', description: 'Auto adjusts based on heat' },
    { name: 'Delay Off', fieldKey: 'delay_off', type: 'boolean', description: 'Has auto-off timer' },
    { name: 'Filter Type', fieldKey: 'filter_type', type: 'enum', allowedValues: ['Baffle', 'Mesh', 'Charcoal', 'Combination'], description: 'Grease filter style' },
    { name: 'Dishwasher Safe Filters', fieldKey: 'dishwasher_safe_filters', type: 'boolean', description: 'Filters are dishwasher safe' },
    { name: 'Remote Control', fieldKey: 'remote_control', type: 'boolean', description: 'Includes remote' },
    { name: 'Touch Controls', fieldKey: 'touch_controls', type: 'boolean', description: 'Has touch control panel' },
    { name: 'Perimeter Suction', fieldKey: 'perimeter_suction', type: 'boolean', description: 'Has perimeter extraction' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const WASHER_SCHEMA: CategorySchema = {
  categoryId: 'washer',
  categoryName: 'Washer',
  department: 'Appliances',
  aliases: ['Washing Machine', 'Front Load Washer', 'Top Load Washer', 'Laundry Washer', 'Clothes Washer'],
  top15FilterAttributes: [
    { name: 'Load Type', fieldKey: 'load_type', type: 'enum', allowedValues: ['Front Load', 'Top Load'], description: 'Loading style' },
    { name: 'Capacity', fieldKey: 'capacity', type: 'number', unit: 'cu. ft.', description: 'Drum capacity' },
    { name: 'Washer Width', fieldKey: 'washer_width', type: 'number', unit: 'inches', description: 'Unit width' },
    { name: 'Steam', fieldKey: 'steam', type: 'boolean', description: 'Has steam cleaning' },
    { name: 'ENERGY STAR', fieldKey: 'energy_star', type: 'boolean', description: 'ENERGY STAR certified' },
    { name: 'Max Spin Speed (RPM)', fieldKey: 'max_spin_speed', type: 'number', unit: 'RPM', description: 'Highest spin speed' },
    { name: 'Agitator', fieldKey: 'agitator', type: 'boolean', description: 'Has center agitator (top load)' },
    { name: 'Smart/WiFi Connected', fieldKey: 'smart_wifi', type: 'boolean', description: 'WiFi connectivity' },
    { name: 'Number of Cycles', fieldKey: 'number_of_cycles', type: 'number', description: 'Total wash cycle options' },
    { name: 'Vibration Reduction', fieldKey: 'vibration_reduction', type: 'boolean', description: 'Has anti-vibration technology' },
    { name: 'Sanitize Cycle', fieldKey: 'sanitize_cycle', type: 'boolean', description: 'Has sanitize option' },
    { name: 'Allergen Cycle', fieldKey: 'allergen_cycle', type: 'boolean', description: 'Has allergen removal cycle' },
    { name: 'Auto Detergent Dispenser', fieldKey: 'auto_dispenser', type: 'boolean', description: 'Has automatic detergent dosing' },
    { name: 'Stackable', fieldKey: 'stackable', type: 'boolean', description: 'Can be stacked with dryer' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const DRYER_SCHEMA: CategorySchema = {
  categoryId: 'dryer',
  categoryName: 'Dryer',
  department: 'Appliances',
  aliases: ['Clothes Dryer', 'Electric Dryer', 'Gas Dryer', 'Heat Pump Dryer', 'Laundry Dryer'],
  top15FilterAttributes: [
    { name: 'Fuel Type', fieldKey: 'fuel_type', type: 'enum', allowedValues: ['Electric', 'Gas', 'Heat Pump'], description: 'Power source' },
    { name: 'Capacity', fieldKey: 'capacity', type: 'number', unit: 'cu. ft.', description: 'Drum capacity' },
    { name: 'Venting Type', fieldKey: 'venting_type', type: 'enum', allowedValues: ['Vented', 'Ventless'], description: 'Requires external vent or not' },
    { name: 'Dryer Width', fieldKey: 'dryer_width', type: 'number', unit: 'inches', description: 'Unit width' },
    { name: 'Steam', fieldKey: 'steam', type: 'boolean', description: 'Has steam refresh/dewrinkle' },
    { name: 'Sensor Dry', fieldKey: 'sensor_dry', type: 'boolean', description: 'Has moisture sensor' },
    { name: 'Smart/WiFi Connected', fieldKey: 'smart_wifi', type: 'boolean', description: 'WiFi connectivity' },
    { name: 'ENERGY STAR', fieldKey: 'energy_star', type: 'boolean', description: 'ENERGY STAR certified' },
    { name: 'Number of Cycles', fieldKey: 'number_of_cycles', type: 'number', description: 'Total dry cycle options' },
    { name: 'Sanitize Cycle', fieldKey: 'sanitize_cycle', type: 'boolean', description: 'Has sanitize option' },
    { name: 'Reversible Door', fieldKey: 'reversible_door', type: 'boolean', description: 'Door swing can be changed' },
    { name: 'Drum Light', fieldKey: 'drum_light', type: 'boolean', description: 'Has interior drum lighting' },
    { name: 'Lint Filter Indicator', fieldKey: 'lint_filter_indicator', type: 'boolean', description: 'Has lint filter alert' },
    { name: 'Wrinkle Prevent', fieldKey: 'wrinkle_prevent', type: 'boolean', description: 'Has tumble to prevent wrinkles' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const FREEZER_SCHEMA: CategorySchema = {
  categoryId: 'freezer',
  categoryName: 'Freezer',
  department: 'Appliances',
  aliases: ['Upright Freezer', 'Chest Freezer', 'Stand-Alone Freezer', 'Deep Freezer'],
  top15FilterAttributes: [
    { name: 'Freezer Type', fieldKey: 'freezer_type', type: 'enum', allowedValues: ['Upright', 'Chest', 'Drawer', 'Column'], description: 'Freezer style' },
    { name: 'Capacity', fieldKey: 'capacity', type: 'number', unit: 'cu. ft.', description: 'Total capacity' },
    { name: 'Freezer Width', fieldKey: 'freezer_width', type: 'number', unit: 'inches', description: 'Unit width' },
    { name: 'Defrost Type', fieldKey: 'defrost_type', type: 'enum', allowedValues: ['Frost-Free', 'Manual'], description: 'Auto or manual defrost' },
    { name: 'Garage Ready', fieldKey: 'garage_ready', type: 'boolean', description: 'Works in extreme temps' },
    { name: 'Temperature Alarm', fieldKey: 'temperature_alarm', type: 'boolean', description: 'Has high temp alert' },
    { name: 'Door Alarm', fieldKey: 'door_alarm', type: 'boolean', description: 'Has door ajar alarm' },
    { name: 'LED Lighting', fieldKey: 'led_lighting', type: 'boolean', description: 'Has LED interior lights' },
    { name: 'Power Indicator', fieldKey: 'power_indicator', type: 'boolean', description: 'Shows when running' },
    { name: 'Defrost Drain', fieldKey: 'defrost_drain', type: 'boolean', description: 'Has defrost drain' },
    { name: 'Lock', fieldKey: 'lock', type: 'boolean', description: 'Has keyed lock' },
    { name: 'Adjustable Shelves', fieldKey: 'adjustable_shelves', type: 'number', description: 'Number of adjustable shelves' },
    { name: 'Storage Baskets', fieldKey: 'storage_baskets', type: 'number', description: 'Number of wire baskets (chest)' },
    { name: 'ENERGY STAR', fieldKey: 'energy_star', type: 'boolean', description: 'ENERGY STAR certified' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const WINE_COOLER_SCHEMA: CategorySchema = {
  categoryId: 'wine_cooler',
  categoryName: 'Wine Cooler',
  department: 'Appliances',
  aliases: ['Wine Refrigerator', 'Wine Cellar', 'Beverage Cooler', 'Wine Storage'],
  top15FilterAttributes: [
    { name: 'Installation Type', fieldKey: 'installation_type', type: 'enum', allowedValues: ['Built-In', 'Freestanding', 'Under Counter'], description: 'How it installs' },
    { name: 'Bottle Capacity', fieldKey: 'bottle_capacity', type: 'number', description: 'Number of bottles' },
    { name: 'Temperature Zones', fieldKey: 'temperature_zones', type: 'enum', allowedValues: ['Single', 'Dual', 'Triple'], description: 'Number of cooling zones' },
    { name: 'Wine Cooler Width', fieldKey: 'wine_cooler_width', type: 'number', unit: 'inches', description: 'Unit width' },
    { name: 'Cooling Type', fieldKey: 'cooling_type', type: 'enum', allowedValues: ['Compressor', 'Thermoelectric'], description: 'Cooling technology' },
    { name: 'UV Protected Glass', fieldKey: 'uv_protected', type: 'boolean', description: 'Has UV protective door' },
    { name: 'Digital Controls', fieldKey: 'digital_controls', type: 'boolean', description: 'Has digital temperature control' },
    { name: 'Interior LED Lighting', fieldKey: 'led_lighting', type: 'boolean', description: 'Has LED interior lights' },
    { name: 'Vibration Dampening', fieldKey: 'vibration_dampening', type: 'boolean', description: 'Has anti-vibration system' },
    { name: 'Security Lock', fieldKey: 'security_lock', type: 'boolean', description: 'Has keyed lock' },
    { name: 'Reversible Door', fieldKey: 'reversible_door', type: 'boolean', description: 'Door swing can be changed' },
    { name: 'Shelf Material', fieldKey: 'shelf_material', type: 'enum', allowedValues: ['Wood', 'Wire', 'Chrome'], description: 'Wine rack material' },
    { name: 'Temperature Range Min', fieldKey: 'temp_range_min', type: 'number', unit: '°F', description: 'Minimum temperature' },
    { name: 'Temperature Range Max', fieldKey: 'temp_range_max', type: 'number', unit: '°F', description: 'Maximum temperature' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

export const ICE_MAKER_SCHEMA: CategorySchema = {
  categoryId: 'ice_maker',
  categoryName: 'Ice Maker',
  department: 'Appliances',
  aliases: ['Ice Machine', 'Portable Ice Maker', 'Built-In Ice Maker', 'Undercounter Ice Maker'],
  top15FilterAttributes: [
    { name: 'Installation Type', fieldKey: 'installation_type', type: 'enum', allowedValues: ['Built-In', 'Freestanding', 'Portable', 'Outdoor'], description: 'How it installs' },
    { name: 'Ice Production (lbs/day)', fieldKey: 'ice_production', type: 'number', unit: 'lbs/day', description: 'Daily ice production' },
    { name: 'Ice Storage Capacity', fieldKey: 'ice_storage', type: 'number', unit: 'lbs', description: 'Ice bin capacity' },
    { name: 'Ice Type', fieldKey: 'ice_type', type: 'enum', allowedValues: ['Cube', 'Nugget', 'Crescent', 'Gourmet', 'Bullet'], description: 'Shape of ice produced' },
    { name: 'Ice Maker Width', fieldKey: 'ice_maker_width', type: 'number', unit: 'inches', description: 'Unit width' },
    { name: 'Drain Required', fieldKey: 'drain_required', type: 'boolean', description: 'Needs drain connection' },
    { name: 'Water Line Required', fieldKey: 'water_line_required', type: 'boolean', description: 'Needs water line' },
    { name: 'Clear Ice', fieldKey: 'clear_ice', type: 'boolean', description: 'Produces clear/gourmet ice' },
    { name: 'Self-Cleaning', fieldKey: 'self_cleaning', type: 'boolean', description: 'Has automatic cleaning' },
    { name: 'Filter Indicator', fieldKey: 'filter_indicator', type: 'boolean', description: 'Has filter change alert' },
    { name: 'Pump Out Drain', fieldKey: 'pump_out_drain', type: 'boolean', description: 'Has gravity-free drain pump' },
    { name: 'LED Lighting', fieldKey: 'led_lighting', type: 'boolean', description: 'Has interior lighting' },
    { name: 'Door Alarm', fieldKey: 'door_alarm', type: 'boolean', description: 'Has door ajar alarm' },
    { name: 'ADA Compliant', fieldKey: 'ada_compliant', type: 'boolean', description: 'Meets ADA requirements' },
    { name: 'Color/Finish', fieldKey: 'color_finish', type: 'string', description: 'Exterior color or finish' }
  ]
};

/**
 * ============================================
 * MASTER CATEGORY MAP
 * ============================================
 */
export const MASTER_CATEGORIES: Record<string, CategorySchema> = {
  'range': RANGE_SCHEMA,
  'refrigerator': REFRIGERATOR_SCHEMA,
  'dishwasher': DISHWASHER_SCHEMA,
  'wall_oven': WALL_OVEN_SCHEMA,
  'oven': WALL_OVEN_SCHEMA,
  'cooktop': COOKTOP_SCHEMA,
  'microwave': MICROWAVE_SCHEMA,
  'range_hood': RANGE_HOOD_SCHEMA,
  'washer': WASHER_SCHEMA,
  'dryer': DRYER_SCHEMA,
  'freezer': FREEZER_SCHEMA,
  'wine_cooler': WINE_COOLER_SCHEMA,
  'ice_maker': ICE_MAKER_SCHEMA
};

/**
 * ============================================
 * UTILITY FUNCTIONS
 * ============================================
 */

/**
 * Get all available category names
 */
export function getAllCategoryNames(): string[] {
  return Object.values(MASTER_CATEGORIES).map(c => c.categoryName);
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): string[] {
  return Object.keys(MASTER_CATEGORIES);
}

/**
 * Get category schema by ID or name
 */
export function getCategorySchema(categoryIdOrName: string): CategorySchema | null {
  const normalized = categoryIdOrName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Direct match by ID
  if (MASTER_CATEGORIES[normalized]) {
    return MASTER_CATEGORIES[normalized];
  }
  
  // Search by name or alias
  for (const schema of Object.values(MASTER_CATEGORIES)) {
    if (schema.categoryName.toLowerCase() === categoryIdOrName.toLowerCase()) {
      return schema;
    }
    // Check aliases
    if (schema.aliases.some(a => a.toLowerCase() === categoryIdOrName.toLowerCase())) {
      return schema;
    }
  }
  
  return null;
}

/**
 * Get Primary Attributes list for AI prompt
 */
export function getPrimaryAttributesForPrompt(): string {
  return PRIMARY_ATTRIBUTES.map((attr, idx) => `${idx + 1}. ${attr}`).join('\n');
}

/**
 * Get formatted category list for AI prompt
 */
export function getCategoryListForPrompt(): string {
  const uniqueCategories = new Map<string, CategorySchema>();
  for (const schema of Object.values(MASTER_CATEGORIES)) {
    uniqueCategories.set(schema.categoryId, schema);
  }
  
  return Array.from(uniqueCategories.values())
    .map(c => `- ${c.categoryName} (${c.department}): ${c.aliases.slice(0, 3).join(', ')}`)
    .join('\n');
}

/**
 * Get Top 15 attributes for a category (for AI prompt)
 */
export function getTop15AttributesForPrompt(categoryId: string): string {
  const schema = getCategorySchema(categoryId);
  if (!schema) return 'Category not found';
  
  return schema.top15FilterAttributes
    .map((attr, idx) => `${idx + 1}. ${attr.name} (${attr.type}${attr.unit ? `, ${attr.unit}` : ''})`)
    .join('\n');
}

/**
 * Get all Top 15 attributes for all categories (for AI prompt)
 */
export function getAllCategoriesWithTop15ForPrompt(): string {
  const uniqueCategories = new Map<string, CategorySchema>();
  for (const schema of Object.values(MASTER_CATEGORIES)) {
    uniqueCategories.set(schema.categoryId, schema);
  }
  
  return Array.from(uniqueCategories.values())
    .map(c => {
      const attrs = c.top15FilterAttributes
        .map((attr, idx) => `   ${idx + 1}. ${attr.name}`)
        .join('\n');
      return `\n${c.categoryName}:\n${attrs}`;
    })
    .join('\n');
}
