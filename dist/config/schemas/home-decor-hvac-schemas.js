"use strict";
/**
 * Home Decor & Fixtures and HVAC Category Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOME_DECOR_HVAC_SCHEMAS = exports.PEDESTAL_SCHEMA = exports.DRAWER_SCHEMA = exports.RANGE_HOOD_LINER_SCHEMA = exports.AIR_CONDITIONER_SCHEMA = exports.CABINET_ORGANIZATION_SCHEMA = exports.STORAGE_DRAWERS_SCHEMA = void 0;
// HOME DECOR & FIXTURES
exports.STORAGE_DRAWERS_SCHEMA = {
    categoryName: 'Storage Drawers/Doors #',
    department: 'Home Decor & Fixtures',
    top15FilterAttributes: [
        'Brand',
        'Type (Drawer, Door, Pull-Out)',
        'Width',
        'Height',
        'Depth',
        'Material (Wood, MDF, Plywood)',
        'Finish/Color',
        'Style (Shaker, Flat Panel, Raised Panel)',
        'Soft-Close',
        'Full Extension',
        'Overlay (Full, Partial)',
        'Hardware Included',
        'Ready to Assemble',
        'Number in Pack',
        'Load Capacity'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Type', 'Width', 'Height', 'Depth',
        'Material', 'Finish', 'Style', 'Soft-Close',
        'Extension', 'Overlay', 'Hardware', 'Load Capacity', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Home Decor & Fixtures',
        tier2: 'Storage & Organization',
        tier3: 'Cabinet Components'
    }
};
exports.CABINET_ORGANIZATION_SCHEMA = {
    categoryName: 'Cabinet Organization and Storage #',
    department: 'Home Decor & Fixtures',
    top15FilterAttributes: [
        'Brand',
        'Type (Lazy Susan, Pull-Out, Tray Divider, Spice Rack)',
        'Cabinet Size/Width',
        'Material (Wire, Wood, Plastic)',
        'Finish/Color',
        'Adjustable',
        'Load Capacity',
        'Number of Tiers/Shelves',
        'Soft-Close',
        'Full Extension',
        'Door Mount/Base Mount',
        'Installation Type',
        'Hardware Included',
        'D-Shape/Kidney Shape',
        'Dimensions'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Type', 'Cabinet Size',
        'Material', 'Finish', 'Tiers', 'Load Capacity',
        'Adjustable', 'Soft-Close', 'Mount Type', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Home Decor & Fixtures',
        tier2: 'Storage & Organization',
        tier3: 'Cabinet Organizers'
    }
};
// HVAC
exports.AIR_CONDITIONER_SCHEMA = {
    categoryName: 'Air Conditioners #',
    department: 'HVAC',
    top15FilterAttributes: [
        'Brand',
        'Type (Window, Portable, Mini Split, Central)',
        'BTU',
        'Cooling Area (sq ft)',
        'SEER Rating',
        'Energy Star Certified',
        'WiFi/Smart Features',
        'Dehumidifier Function',
        'Heating Function',
        'Number of Speeds',
        'Noise Level (dB)',
        'Finish/Color',
        'Remote Control',
        'Timer',
        'Voltage (115V/230V)'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Type', 'BTU', 'Cooling Area',
        'SEER', 'Energy Star', 'WiFi', 'Dehumidifier',
        'Heat', 'Speeds', 'Noise', 'Finish', 'Voltage', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'HVAC',
        tier2: 'Cooling',
        tier3: 'Air Conditioners'
    }
};
exports.RANGE_HOOD_LINER_SCHEMA = {
    categoryName: 'Range Hood Insert/Liner',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Width',
        'Depth',
        'CFM (Airflow)',
        'Number of Speeds',
        'Noise Level (Sones)',
        'Ducted/Ductless',
        'Duct Size',
        'Lighting Type',
        'Light Bulbs Included',
        'Filter Type (Baffle, Mesh)',
        'Dishwasher Safe Filters',
        'Heat Sensor',
        'Delay Shut-Off',
        'Variable Speed'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Width', 'Depth', 'CFM',
        'Speeds', 'Noise Level', 'Duct Size', 'Lighting',
        'Filter Type', 'Dishwasher Safe', 'Voltage', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Kitchen Appliances',
        tier3: 'Range Hoods & Ventilation',
        tier4: 'Range Hood Inserts'
    }
};
// OTHER / NEEDS REVIEW
exports.DRAWER_SCHEMA = {
    categoryName: 'Drawer',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Type (Refrigerator Drawer, Freezer Drawer, Microwave Drawer)',
        'Width',
        'Installation Type (Built-In, Under Counter)',
        'Capacity',
        'Temperature Range',
        'Panel Ready',
        'Finish/Color',
        'Soft-Close',
        'Touch Controls',
        'Interior Lighting',
        'Auto Open',
        'Lock',
        'Smart Features',
        'ADA Compliant'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Type', 'Width', 'Height', 'Depth',
        'Capacity', 'Temp Range', 'Panel Ready', 'Finish',
        'Controls', 'Lighting', 'Voltage', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Kitchen Appliances',
        tier3: 'Specialty Drawers'
    }
};
exports.PEDESTAL_SCHEMA = {
    categoryName: 'Standalone Pedestal',
    department: 'Appliances',
    top15FilterAttributes: [
        'Brand',
        'Compatible Models',
        'Width',
        'Height',
        'Finish/Color',
        'Storage Drawer',
        'Load Capacity',
        'Vibration Reduction',
        'Leveling Legs',
        'Hardware Included',
        'Material',
        'Style',
        'Anti-Tip',
        'Stackable',
        'Universal Fit'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Compatible With', 'Width', 'Height',
        'Finish', 'Storage', 'Load Capacity', 'Material', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Appliances',
        tier2: 'Laundry',
        tier3: 'Laundry Accessories',
        tier4: 'Pedestals'
    }
};
exports.HOME_DECOR_HVAC_SCHEMAS = {
    'Storage Drawers/Doors #': exports.STORAGE_DRAWERS_SCHEMA,
    'Cabinet Organization and Storage #': exports.CABINET_ORGANIZATION_SCHEMA,
    'Air Conditioners #': exports.AIR_CONDITIONER_SCHEMA,
    'Range Hood Insert/Liner': exports.RANGE_HOOD_LINER_SCHEMA,
    'Drawer': exports.DRAWER_SCHEMA,
    'Standalone Pedestal': exports.PEDESTAL_SCHEMA,
};
//# sourceMappingURL=home-decor-hvac-schemas.js.map