"use strict";
/**
 * Category Schema Memory Bank
 *
 * This module stores the complete category attribute schema for product data enrichment.
 * When product data is received, we:
 * 1. Match it to a category
 * 2. Pull the relevant attribute schema
 * 3. Use source data FIRST, then AI to fill gaps
 * 4. Generate standardized titles and descriptions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_ALIASES = exports.MID_TIER_BRANDS = exports.PREMIUM_BRANDS = exports.PREMIUM_FEATURE_KEYWORDS = exports.GLOBAL_PRIMARY_ATTRIBUTES = void 0;
exports.getCategorySchema = getCategorySchema;
exports.getAllCategorySchemas = getAllCategorySchemas;
// Global Primary Display Attributes - Apply to ALL products
exports.GLOBAL_PRIMARY_ATTRIBUTES = [
    "Brand (Verified)",
    "Category / Subcategory (Verified)",
    "Product Family (Verified)",
    "Product Style (Verified) (Category Specific)",
    "Depth / length (Verified)",
    "Width (Verified)",
    "Height (Verified)",
    "Weight (Verified)",
    "MSRP (Verified)",
    "Market Value",
    "Description",
    "Product Title (Verified)",
    "Details",
    "Features list",
    "UPC / GTIN (Verified)",
    "Model Number (Verified)",
    "Model Number Alias (Symbols Removed)",
    "Model Parent",
    "Model Varient Number",
    "Total Model Varients (List all varient models)"
];
// Special Feature Keywords (for title and description highlighting)
exports.PREMIUM_FEATURE_KEYWORDS = [
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
];
// Premium Brand Tiers
exports.PREMIUM_BRANDS = [
    'Sub-Zero', 'Wolf', 'Thermador', 'Viking', 'Miele',
    'Gaggenau', 'La Cornue', 'Dacor', 'Monogram', 'BlueStar',
    'Hestan', 'JennAir', 'Café', 'Fisher & Paykel', 'Liebherr',
    'Bertazzoni', 'DERA', 'Lynx', 'Kalamazoo', 'Alfresco'
];
exports.MID_TIER_BRANDS = [
    'KitchenAid', 'Bosch', 'Samsung', 'LG', 'GE Profile',
    'Electrolux', 'Frigidaire Gallery', 'Whirlpool', 'Maytag',
    'GE', 'Broan', 'Zephyr', 'DERA', 'Sharp'
];
// Category Name Variations (for matching)
exports.CATEGORY_ALIASES = {
    'Refrigerator': ['Fridge', 'Refrigerators', 'Frig'],
    'Dishwasher': ['Dishwashers', 'Dish Washer'],
    'Range': ['Stove', 'Ranges', 'Cooking Range'],
    'Cooktop': ['Cooktops', 'Cook Top', 'Stovetop'],
    'Oven': ['Ovens', 'Wall Oven', 'Wall Ovens'],
    'Microwave': ['Microwaves', 'Microwave Oven'],
    'Range Hood': ['Hood', 'Vent Hood', 'Ventilation', 'Range Hoods'],
    'Washer': ['Washing Machine', 'Washers'],
    'Dryer': ['Dryers', 'Clothes Dryer'],
    'Freezer': ['Freezers', 'Chest Freezer', 'Upright Freezer'],
    'Icemaker': ['Ice Maker', 'Ice Machine'],
    'All in One Washer / Dryer': ['Washer Dryer Combo', 'Combo Washer Dryer', 'Laundry Center']
};
// Import category schemas
const category_attributes_1 = require("./category-attributes");
// Category Schema Lookup Map
const CATEGORY_SCHEMA_MAP = {
    // Exact matches
    'Refrigerator': category_attributes_1.REFRIGERATOR_SCHEMA,
    'Dishwasher': category_attributes_1.DISHWASHER_SCHEMA,
    'Range': category_attributes_1.RANGE_SCHEMA,
    'Oven': category_attributes_1.OVEN_SCHEMA,
    'Cooktop': category_attributes_1.COOKTOP_SCHEMA,
    'Microwave': category_attributes_1.MICROWAVE_SCHEMA,
    'Range Hood': category_attributes_1.RANGE_HOOD_SCHEMA,
    'Washer': category_attributes_1.WASHER_SCHEMA,
    'Dryer': category_attributes_1.DRYER_SCHEMA,
    'Freezer': category_attributes_1.FREEZER_SCHEMA,
    // Web Retailer category variations
    'REFRIGERATORS': category_attributes_1.REFRIGERATOR_SCHEMA,
    'GAS RANGES': category_attributes_1.RANGE_SCHEMA,
    'ELECTRIC RANGES': category_attributes_1.RANGE_SCHEMA,
    'DUAL FUEL RANGES': category_attributes_1.RANGE_SCHEMA,
    'SLIDE IN GAS RANGE': category_attributes_1.RANGE_SCHEMA,
    'SLIDE IN ELECTRIC RANGE': category_attributes_1.RANGE_SCHEMA,
    'FREESTANDING GAS RANGE': category_attributes_1.RANGE_SCHEMA,
    'FREESTANDING ELECTRIC RANGE': category_attributes_1.RANGE_SCHEMA,
    'DISHWASHERS': category_attributes_1.DISHWASHER_SCHEMA,
    'WALL OVENS': category_attributes_1.OVEN_SCHEMA,
    'COOKTOPS': category_attributes_1.COOKTOP_SCHEMA,
    'MICROWAVES': category_attributes_1.MICROWAVE_SCHEMA,
    'RANGE HOODS': category_attributes_1.RANGE_HOOD_SCHEMA,
    'VENTILATION': category_attributes_1.RANGE_HOOD_SCHEMA,
    'WASHERS': category_attributes_1.WASHER_SCHEMA,
    'DRYERS': category_attributes_1.DRYER_SCHEMA,
    'FREEZERS': category_attributes_1.FREEZER_SCHEMA,
    // Ferguson category variations
    'Cooking Appliances': category_attributes_1.RANGE_SCHEMA,
    'Ovens Ranges Cooktops': category_attributes_1.RANGE_SCHEMA,
    'Range with Single Oven': category_attributes_1.RANGE_SCHEMA,
};
/**
 * Get the category schema for a given category name
 * Returns the appropriate schema with attributes for verification
 */
function getCategorySchema(categoryName) {
    // Try exact match first
    if (CATEGORY_SCHEMA_MAP[categoryName]) {
        return CATEGORY_SCHEMA_MAP[categoryName];
    }
    // Try case-insensitive match
    const upperName = categoryName.toUpperCase();
    for (const [key, schema] of Object.entries(CATEGORY_SCHEMA_MAP)) {
        if (key.toUpperCase() === upperName) {
            return schema;
        }
    }
    // Try partial match
    const lowerName = categoryName.toLowerCase();
    for (const [key, schema] of Object.entries(CATEGORY_SCHEMA_MAP)) {
        if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
            return schema;
        }
    }
    return null;
}
/**
 * Get all available category schemas
 */
function getAllCategorySchemas() {
    return [
        category_attributes_1.REFRIGERATOR_SCHEMA,
        category_attributes_1.DISHWASHER_SCHEMA,
        category_attributes_1.RANGE_SCHEMA,
        category_attributes_1.OVEN_SCHEMA,
        category_attributes_1.COOKTOP_SCHEMA,
        category_attributes_1.MICROWAVE_SCHEMA,
        category_attributes_1.RANGE_HOOD_SCHEMA,
        category_attributes_1.WASHER_SCHEMA,
        category_attributes_1.DRYER_SCHEMA,
        category_attributes_1.FREEZER_SCHEMA
    ];
}
exports.default = {
    GLOBAL_PRIMARY_ATTRIBUTES: exports.GLOBAL_PRIMARY_ATTRIBUTES,
    PREMIUM_FEATURE_KEYWORDS: exports.PREMIUM_FEATURE_KEYWORDS,
    PREMIUM_BRANDS: exports.PREMIUM_BRANDS,
    MID_TIER_BRANDS: exports.MID_TIER_BRANDS,
    CATEGORY_ALIASES: exports.CATEGORY_ALIASES,
    getCategorySchema,
    getAllCategorySchemas
};
//# sourceMappingURL=category-schema.js.map