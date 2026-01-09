"use strict";
/**
 * Additional Appliance Category Schemas
 * Wine coolers, ice makers, specialty appliances
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADDITIONAL_APPLIANCE_SCHEMAS = exports.OUTDOOR_GRILL_SCHEMA = exports.WARMING_DRAWER_SCHEMA = exports.BEVERAGE_CENTER_SCHEMA = exports.COFFEE_MAKER_SCHEMA = exports.PIZZA_OVEN_SCHEMA = exports.ICE_MAKER_SCHEMA = exports.WINE_COOLER_SCHEMA = exports.ALL_IN_ONE_WASHER_DRYER_SCHEMA = void 0;
exports.ALL_IN_ONE_WASHER_DRYER_SCHEMA = {
    categoryName: 'All in One Washer / Dryer',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Width',
        'Configuration (Front Load)',
        'Washer Capacity (Cu. Ft.)',
        'Dryer Capacity (Cu. Ft.)',
        'Ventless/Vented',
        'Number of Wash Cycles',
        'Number of Dry Cycles',
        'Finish/Color',
        'Steam Function',
        'Smart Features',
        'WiFi Enabled',
        'Energy Star Certified',
        'Stackable',
        'Voltage (120V/240V)'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Width', 'Height', 'Depth',
        'Washer Capacity', 'Dryer Capacity', 'Ventless',
        'Wash Cycles', 'Dry Cycles', 'Steam', 'Finish',
        'Smart Features', 'WiFi', 'Energy Star', 'Voltage', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Laundry',
        tier3: 'Washer Dryer Combos'
    }
};
exports.WINE_COOLER_SCHEMA = {
    categoryName: 'Wine Cooler',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Width',
        'Installation Type (Built-In, Freestanding, Under-Counter)',
        'Bottle Capacity',
        'Temperature Zones (Single, Dual)',
        'Temperature Range',
        'Shelving Material (Wood, Wire, Chrome)',
        'Finish/Color',
        'Door Style (Glass, Solid)',
        'Door Swing (Left, Right, Reversible)',
        'Interior Lighting',
        'Lock',
        'Vibration Control',
        'UV Protection',
        'Digital Controls'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Width', 'Height', 'Depth',
        'Installation Type', 'Bottle Capacity', 'Temperature Zones',
        'Temp Range', 'Shelves', 'Door Style', 'Finish',
        'Lighting', 'Lock', 'Voltage', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Refrigeration',
        tier3: 'Wine Coolers'
    }
};
exports.ICE_MAKER_SCHEMA = {
    categoryName: 'Icemaker',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Width',
        'Installation Type (Built-In, Freestanding, Undercounter, Portable)',
        'Ice Production (lbs/day)',
        'Ice Storage Capacity',
        'Ice Type (Cube, Nugget, Gourmet, Clear)',
        'Finish/Color',
        'Drain Type (Gravity, Pump)',
        'Water Connection (Direct, Reservoir)',
        'Self-Cleaning',
        'Digital Controls',
        'Interior Lighting',
        'Door Style',
        'ADA Compliant',
        'Outdoor Rated'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Width', 'Height', 'Depth',
        'Installation Type', 'Ice Production', 'Storage Capacity',
        'Ice Type', 'Drain Type', 'Water Connection', 'Finish',
        'Self-Cleaning', 'Outdoor', 'Voltage', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Refrigeration',
        tier3: 'Ice Makers'
    }
};
exports.PIZZA_OVEN_SCHEMA = {
    categoryName: 'Pizza Oven',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Fuel Type (Gas, Wood, Electric)',
        'Installation Type (Countertop, Built-In, Freestanding)',
        'Pizza Capacity (Size/Quantity)',
        'Max Temperature',
        'Interior Size',
        'Finish/Color',
        'Material (Stainless Steel, Ceramic)',
        'Stone/Deck Material',
        'Rotatable Stone',
        'Temperature Control',
        'Timer',
        'Indoor/Outdoor Use',
        'Portable',
        'BTU (Gas)'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Fuel Type', 'Installation',
        'Pizza Size', 'Max Temp', 'Interior Size', 'Finish',
        'Material', 'Stone Material', 'Indoor/Outdoor',
        'BTU', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Kitchen Appliances',
        tier3: 'Pizza Ovens'
    }
};
exports.COFFEE_MAKER_SCHEMA = {
    categoryName: 'Coffee Maker',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Type (Espresso Machine, Drip, Single Serve, French Press)',
        'Width',
        'Installation Type (Built-In, Countertop)',
        'Water Reservoir Capacity',
        'Brew Sizes',
        'Grinder (Built-In, None)',
        'Milk Frother',
        'Finish/Color',
        'Programmable',
        'Auto Shut-Off',
        'Water Line Connection',
        'Cups Per Hour',
        'Commercial Grade',
        'Pod Compatible'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Type', 'Width', 'Height', 'Depth',
        'Installation', 'Reservoir', 'Brew Sizes', 'Grinder',
        'Milk Frother', 'Finish', 'Programmable', 'Voltage', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Kitchen Appliances',
        tier3: 'Coffee Makers'
    }
};
exports.BEVERAGE_CENTER_SCHEMA = {
    categoryName: 'Beverage Center',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Width',
        'Installation Type (Built-In, Freestanding, Undercounter)',
        'Can/Bottle Capacity',
        'Temperature Range',
        'Temperature Zones',
        'Shelving (Adjustable, Wire, Glass)',
        'Finish/Color',
        'Door Style (Glass, Solid)',
        'Door Swing',
        'Interior Lighting',
        'Lock',
        'Digital Controls',
        'Outdoor Rated',
        'Energy Star'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Width', 'Height', 'Depth',
        'Installation', 'Capacity', 'Temp Range', 'Zones',
        'Shelves', 'Door Style', 'Finish', 'Lighting',
        'Lock', 'Outdoor', 'Energy Star', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Refrigeration',
        tier3: 'Beverage Centers'
    }
};
exports.WARMING_DRAWER_SCHEMA = {
    categoryName: 'Warming Drawer',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Width',
        'Installation Type (Built-In)',
        'Capacity',
        'Temperature Settings',
        'Humidity Control',
        'Finish/Color',
        'Handle Style',
        'Push-to-Open',
        'Timer',
        'Interior Material',
        'Panel Ready',
        'Auto Shut-Off',
        'Slow Cook Function',
        'Proof Mode'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Width', 'Height', 'Depth',
        'Capacity', 'Temp Settings', 'Humidity', 'Finish',
        'Handle', 'Panel Ready', 'Timer', 'Voltage', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Kitchen Appliances',
        tier3: 'Warming Drawers'
    }
};
exports.OUTDOOR_GRILL_SCHEMA = {
    categoryName: 'Barbeques',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Fuel Type (Gas, Charcoal, Electric, Pellet)',
        'Width',
        'Total BTU',
        'Primary Cooking Area (sq in)',
        'Number of Burners',
        'Installation Type (Built-In, Freestanding, Portable)',
        'Material (Stainless Steel, Cast Iron)',
        'Side Burner',
        'Rotisserie',
        'Sear Station',
        'Infrared Burner',
        'Warming Rack',
        'Smart Features',
        'Cover Included'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Fuel Type', 'Width', 'Depth',
        'Total BTU', 'Cooking Area', 'Burners', 'Installation',
        'Material', 'Side Burner', 'Rotisserie', 'Sear Station',
        'Infrared', 'Cover', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Outdoor',
        tier3: 'Grills'
    }
};
exports.ADDITIONAL_APPLIANCE_SCHEMAS = {
    'All in One Washer / Dryer': exports.ALL_IN_ONE_WASHER_DRYER_SCHEMA,
    'Wine Cooler': exports.WINE_COOLER_SCHEMA,
    'Icemaker': exports.ICE_MAKER_SCHEMA,
    'Pizza Oven': exports.PIZZA_OVEN_SCHEMA,
    'Coffee Maker': exports.COFFEE_MAKER_SCHEMA,
    'Beverage Center': exports.BEVERAGE_CENTER_SCHEMA,
    'Warming Drawer': exports.WARMING_DRAWER_SCHEMA,
    'Barbeques': exports.OUTDOOR_GRILL_SCHEMA,
};
//# sourceMappingURL=additional-appliance-schemas.js.map