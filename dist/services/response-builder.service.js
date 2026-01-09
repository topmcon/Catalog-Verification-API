"use strict";
/**
 * Salesforce Response Builder Service
 * Transforms verified product data into the structured Salesforce return format
 *
 * OUTPUT STRUCTURE:
 * 1. Primary Attributes (Global - applies to ALL products)
 * 2. Top 15 Filter Attributes (Category-specific)
 * 3. Additional Attributes HTML Table (everything else)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrimaryAttributes = buildPrimaryAttributes;
exports.buildTopFilterAttributes = buildTopFilterAttributes;
exports.buildAdditionalAttributesHTML = buildAdditionalAttributesHTML;
exports.buildPriceAnalysis = buildPriceAnalysis;
exports.buildVerificationResponse = buildVerificationResponse;
const html_generator_1 = require("../utils/html-generator");
const category_attributes_1 = require("../config/category-attributes");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Category Schema Lookup
 */
const CATEGORY_SCHEMA_MAP = {
    'Range': category_attributes_1.RANGE_SCHEMA,
    'GAS RANGES': category_attributes_1.RANGE_SCHEMA,
    'ELECTRIC RANGES': category_attributes_1.RANGE_SCHEMA,
    'DUAL FUEL RANGES': category_attributes_1.RANGE_SCHEMA,
    'SLIDE IN GAS RANGE': category_attributes_1.RANGE_SCHEMA,
    'SLIDE IN ELECTRIC RANGE': category_attributes_1.RANGE_SCHEMA,
    'Refrigerator': category_attributes_1.REFRIGERATOR_SCHEMA,
    'REFRIGERATORS': category_attributes_1.REFRIGERATOR_SCHEMA,
    'Dishwasher': category_attributes_1.DISHWASHER_SCHEMA,
    'DISHWASHERS': category_attributes_1.DISHWASHER_SCHEMA,
    'Oven': category_attributes_1.OVEN_SCHEMA,
    'WALL OVENS': category_attributes_1.OVEN_SCHEMA,
    'Cooktop': category_attributes_1.COOKTOP_SCHEMA,
    'COOKTOPS': category_attributes_1.COOKTOP_SCHEMA,
    'Microwave': category_attributes_1.MICROWAVE_SCHEMA,
    'MICROWAVES': category_attributes_1.MICROWAVE_SCHEMA,
    'Range Hood': category_attributes_1.RANGE_HOOD_SCHEMA,
    'RANGE HOODS': category_attributes_1.RANGE_HOOD_SCHEMA,
    'Washer': category_attributes_1.WASHER_SCHEMA,
    'WASHERS': category_attributes_1.WASHER_SCHEMA,
    'Dryer': category_attributes_1.DRYER_SCHEMA,
    'DRYERS': category_attributes_1.DRYER_SCHEMA,
};
/**
 * Build Primary Display Attributes (Global - applies to ALL products)
 */
function buildPrimaryAttributes(incoming, corrections) {
    // Helper to get corrected value or original
    const getCorrected = (field, original) => {
        const correction = corrections.find(c => c.field === field);
        return correction ? String(correction.corrected_value) : original;
    };
    // Parse dimensions - prefer Ferguson for verified dimensions, fall back to Web Retailer
    const depth = parseDimension(incoming.Ferguson_Depth) || parseDimension(incoming.Depth_Web_Retailer);
    const width = parseDimension(incoming.Ferguson_Width) || parseDimension(incoming.Width_Web_Retailer);
    const height = parseDimension(incoming.Ferguson_Height) || parseDimension(incoming.Height_Web_Retailer);
    // Determine verified category
    const verifiedCategory = mapToVerifiedCategory(incoming.Web_Retailer_Category, incoming.Ferguson_Base_Category);
    const verifiedSubCategory = mapToVerifiedSubCategory(incoming.Web_Retailer_SubCategory, incoming.Ferguson_Product_Type);
    // Build model number alias (remove symbols)
    const modelNumberAlias = incoming.Model_Number_Web_Retailer
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
    return {
        Brand_Verified: getCorrected('brand', incoming.Ferguson_Brand || incoming.Brand_Web_Retailer),
        Category_Verified: verifiedCategory,
        SubCategory_Verified: verifiedSubCategory,
        Product_Family_Verified: determineProductFamily(verifiedCategory, verifiedSubCategory),
        Product_Style_Verified: determineProductStyle(incoming),
        Depth_Verified: depth,
        Width_Verified: width,
        Height_Verified: height,
        Weight_Verified: incoming.Weight_Web_Retailer || getAttributeValue(incoming.Ferguson_Attributes, 'Product Weight'),
        MSRP_Verified: incoming.MSRP_Web_Retailer,
        Market_Value: incoming.Ferguson_Price,
        Market_Value_Min: incoming.Ferguson_Min_Price,
        Market_Value_Max: incoming.Ferguson_Max_Price,
        Description_Verified: getCorrected('description', cleanDescription(incoming.Product_Description_Web_Retailer)),
        Product_Title_Verified: getCorrected('title', buildVerifiedTitle(incoming)),
        Details_Verified: extractDetails(incoming),
        Features_List_HTML: buildFeaturesListHTML(incoming),
        UPC_GTIN_Verified: getAttributeValue(incoming.Ferguson_Attributes, 'UPC') || '',
        Model_Number_Verified: incoming.Model_Number_Web_Retailer,
        Model_Number_Alias: modelNumberAlias,
        Model_Parent: extractModelParent(incoming.Model_Number_Web_Retailer),
        Model_Variant_Number: extractModelVariant(incoming.Model_Number_Web_Retailer),
        Total_Model_Variants: '', // Would need catalog lookup
    };
}
/**
 * Build Top 15 Filter Attributes (Category-Specific)
 */
function buildTopFilterAttributes(incoming, category) {
    const schema = CATEGORY_SCHEMA_MAP[category] || CATEGORY_SCHEMA_MAP[incoming.Web_Retailer_Category];
    if (!schema) {
        logger_1.default.warn(`No schema found for category: ${category}`);
        return {};
    }
    const filterAttrs = {};
    const allSourceAttrs = mergeAttributes(incoming);
    // Map top 15 filter attributes from schema
    for (const attrName of schema.top15FilterAttributes) {
        const value = findAttributeValue(allSourceAttrs, attrName);
        if (value !== null && value !== undefined && value !== '') {
            const normalizedKey = normalizeAttributeKey(attrName);
            filterAttrs[normalizedKey] = value;
        }
    }
    // Add category-specific logic
    switch (schema.categoryName) {
        case 'Range':
            return buildRangeFilterAttributes(incoming, filterAttrs);
        case 'Refrigerator':
            return buildRefrigeratorFilterAttributes(incoming, filterAttrs);
        case 'Dishwasher':
            return buildDishwasherFilterAttributes(incoming, filterAttrs);
        default:
            return filterAttrs;
    }
}
/**
 * Build Additional Attributes HTML Table
 * Contains all attributes NOT in Primary or Top 15
 */
function buildAdditionalAttributesHTML(incoming, _category, primaryAttrs, topFilterAttrs) {
    const allSourceAttrs = mergeAttributes(incoming);
    // Get list of attributes already used
    const usedPrimaryKeys = Object.keys(primaryAttrs).map(k => k.toLowerCase().replace(/_/g, ' '));
    const usedFilterKeys = Object.keys(topFilterAttrs).map(k => k.toLowerCase().replace(/_/g, ' '));
    const usedKeys = new Set([...usedPrimaryKeys, ...usedFilterKeys]);
    // Filter to additional attributes only
    const additionalAttrs = {};
    for (const [key, value] of Object.entries(allSourceAttrs)) {
        const normalizedKey = key.toLowerCase().replace(/[_-]/g, ' ');
        if (!usedKeys.has(normalizedKey) && value && String(value).trim() !== '') {
            // Use the htmlTableAttributes order if schema exists
            additionalAttrs[formatAttributeDisplayName(key)] = String(value);
        }
    }
    // Generate HTML table with styling
    return (0, html_generator_1.generateAttributeTable)(additionalAttrs, {
        includeStyles: true,
        tableClass: 'sf-additional-attributes',
        headerClass: 'sf-attr-header',
        cellClass: 'sf-attr-cell',
        alternateRowClass: 'sf-attr-alt',
    });
}
/**
 * Build Price Analysis
 */
function buildPriceAnalysis(incoming) {
    const msrp = parseFloat(incoming.MSRP_Web_Retailer) || 0;
    const marketValue = parseFloat(incoming.Ferguson_Price) || 0;
    const marketMin = parseFloat(incoming.Ferguson_Min_Price) || marketValue;
    const marketMax = parseFloat(incoming.Ferguson_Max_Price) || marketValue;
    const priceDiff = msrp - marketValue;
    const priceDiffPercent = marketValue > 0 ? ((priceDiff / marketValue) * 100) : 0;
    let pricePosition = 'at_market';
    if (priceDiffPercent > 5) {
        pricePosition = 'above_market';
    }
    else if (priceDiffPercent < -5) {
        pricePosition = 'below_market';
    }
    return {
        msrp_web_retailer: msrp,
        market_value_ferguson: marketValue,
        market_value_min: marketMin,
        market_value_max: marketMax,
        price_difference: priceDiff,
        price_difference_percent: Math.round(priceDiffPercent * 100) / 100,
        price_position: pricePosition,
    };
}
/**
 * Build Complete Verification Response
 */
function buildVerificationResponse(incoming, sessionId, corrections = [], dataSources = ['Web_Retailer', 'Ferguson']) {
    // Determine category
    const category = mapToVerifiedCategory(incoming.Web_Retailer_Category, incoming.Ferguson_Base_Category);
    // Build all sections
    const primaryAttrs = buildPrimaryAttributes(incoming, corrections);
    const topFilterAttrs = buildTopFilterAttributes(incoming, category);
    const additionalHTML = buildAdditionalAttributesHTML(incoming, category, primaryAttrs, topFilterAttrs);
    const priceAnalysis = buildPriceAnalysis(incoming);
    // Calculate verification score
    const verificationScore = calculateVerificationScore(incoming, primaryAttrs, topFilterAttrs);
    // Build verification metadata
    const verification = {
        verification_timestamp: new Date().toISOString(),
        verification_session_id: sessionId,
        verification_score: verificationScore,
        verification_status: verificationScore >= 80 ? 'verified' :
            verificationScore >= 50 ? 'enriched' : 'needs_review',
        data_sources_used: dataSources,
        corrections_made: corrections,
        missing_fields: findMissingFields(primaryAttrs, topFilterAttrs),
        confidence_scores: calculateConfidenceScores(incoming, primaryAttrs),
    };
    return {
        SF_Catalog_Id: incoming.SF_Catalog_Id,
        SF_Catalog_Name: incoming.SF_Catalog_Name,
        Primary_Attributes: primaryAttrs,
        Top_Filter_Attributes: topFilterAttrs,
        Additional_Attributes_HTML: additionalHTML,
        Price_Analysis: priceAnalysis,
        Verification: verification,
        Status: verification.verification_status === 'failed' ? 'failed' :
            verification.verification_status === 'needs_review' ? 'partial' : 'success',
    };
}
// ============================================
// HELPER FUNCTIONS
// ============================================
function parseDimension(value) {
    if (!value)
        return '';
    // Handle fractions like "29 1/2" or "29.5 in"
    const cleaned = value.replace(/\s*in\.?$/i, '').trim();
    // Convert fractions to decimals
    const fractionMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (fractionMatch) {
        const whole = parseInt(fractionMatch[1]);
        const num = parseInt(fractionMatch[2]);
        const denom = parseInt(fractionMatch[3]);
        return (whole + num / denom).toFixed(3);
    }
    return cleaned;
}
function mapToVerifiedCategory(webCategory, fergusonCategory) {
    const categoryMap = {
        'GAS RANGES': 'Range',
        'ELECTRIC RANGES': 'Range',
        'DUAL FUEL RANGES': 'Range',
        'SLIDE IN GAS RANGE': 'Range',
        'SLIDE IN ELECTRIC RANGE': 'Range',
        'Cooking Appliances': 'Range',
        'Ovens Ranges Cooktops': 'Range',
        // Add more mappings
    };
    return categoryMap[webCategory] ||
        categoryMap[fergusonCategory] ||
        webCategory ||
        fergusonCategory;
}
function mapToVerifiedSubCategory(webSubCategory, fergusonProductType) {
    const subCategoryMap = {
        'SLIDE IN GAS RANGE': 'Slide-In Gas Range',
        'SLIDE IN ELECTRIC RANGE': 'Slide-In Electric Range',
        'FREESTANDING GAS RANGE': 'Freestanding Gas Range',
        'Cooking Appliances': 'Gas Range',
    };
    return subCategoryMap[webSubCategory] ||
        subCategoryMap[fergusonProductType] ||
        webSubCategory ||
        fergusonProductType;
}
function determineProductFamily(category, _subCategory) {
    // Based on category, return product family
    const familyMap = {
        'Range': 'Cooking Appliances',
        'Oven': 'Cooking Appliances',
        'Cooktop': 'Cooking Appliances',
        'Microwave': 'Cooking Appliances',
        'Range Hood': 'Ventilation',
        'Refrigerator': 'Refrigeration',
        'Freezer': 'Refrigeration',
        'Dishwasher': 'Kitchen Cleanup',
        'Washer': 'Laundry',
        'Dryer': 'Laundry',
    };
    return familyMap[category] || 'Appliances';
}
function determineProductStyle(incoming) {
    // Extract style from subcategory or product type
    const productType = getAttributeValue(incoming.Web_Retailer_Specs, 'Product Type') ||
        getAttributeValue(incoming.Ferguson_Attributes, 'Installation Type');
    if (productType) {
        if (productType.toLowerCase().includes('slide-in'))
            return 'Slide-In';
        if (productType.toLowerCase().includes('freestanding'))
            return 'Freestanding';
        if (productType.toLowerCase().includes('drop-in'))
            return 'Drop-In';
        if (productType.toLowerCase().includes('built-in'))
            return 'Built-In';
    }
    return incoming.Web_Retailer_SubCategory || '';
}
function buildVerifiedTitle(incoming) {
    // Use Ferguson title if available as it's often cleaner, else use web retailer
    if (incoming.Ferguson_Title && incoming.Ferguson_Title.length > 20) {
        return incoming.Ferguson_Title;
    }
    // Build title from components
    const brand = incoming.Ferguson_Brand || incoming.Brand_Web_Retailer;
    const width = parseDimension(incoming.Width_Web_Retailer || incoming.Ferguson_Width);
    const capacity = incoming.Capacity_Web_Retailer;
    const style = determineProductStyle(incoming);
    const category = mapToVerifiedCategory(incoming.Web_Retailer_Category, incoming.Ferguson_Base_Category);
    const finish = incoming.Ferguson_Finish || incoming.Color_Finish_Web_Retailer;
    const parts = [brand];
    if (width)
        parts.push(`${width}"`);
    if (capacity)
        parts.push(`${capacity} Cu. Ft.`);
    if (style)
        parts.push(style);
    parts.push(category);
    if (finish)
        parts.push(`- ${finish}`);
    return parts.join(' ');
}
function cleanDescription(description) {
    if (!description)
        return '';
    // Remove excessive whitespace but keep content
    return description
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim()
        .substring(0, 5000); // Limit length
}
function extractDetails(incoming) {
    // Combine key details from both sources
    const details = [];
    const convection = getAttributeValue(incoming.Ferguson_Attributes, 'Convection');
    if (convection === 'Yes')
        details.push('Convection Cooking');
    const wifi = getAttributeValue(incoming.Ferguson_Attributes, 'WiFi Enabled') ||
        getAttributeValue(incoming.Ferguson_Attributes, 'Smart Home');
    if (wifi === 'Yes')
        details.push('WiFi/Smart Enabled');
    const selfClean = getAttributeValue(incoming.Ferguson_Attributes, 'Self Cleaning');
    if (selfClean === 'Yes')
        details.push('Self-Cleaning');
    return details.join(', ');
}
function buildFeaturesListHTML(incoming) {
    // If web retailer features exist and have content, use them
    if (incoming.Features_Web_Retailer &&
        incoming.Features_Web_Retailer !== '<ul></ul>' &&
        incoming.Features_Web_Retailer.includes('<li>')) {
        return incoming.Features_Web_Retailer;
    }
    // Build features list from attributes
    const features = [];
    // Extract key features from Ferguson attributes
    const featureAttrs = [
        'Convection', 'Self Cleaning', 'Smart Home', 'WiFi Enabled',
        'Air Fry', 'Griddle', 'Sabbath Mode', 'Continuous Grates'
    ];
    for (const attr of featureAttrs) {
        const value = getAttributeValue(incoming.Ferguson_Attributes, attr);
        if (value === 'Yes') {
            features.push(formatFeatureName(attr));
        }
    }
    if (features.length === 0) {
        return '<ul></ul>';
    }
    return '<ul>\n' + features.map(f => `  <li>${f}</li>`).join('\n') + '\n</ul>';
}
function formatFeatureName(attr) {
    const nameMap = {
        'Convection': 'True Convection Cooking',
        'Self Cleaning': 'Self-Cleaning Oven',
        'Smart Home': 'Smart Home Compatible',
        'WiFi Enabled': 'Built-In WiFi',
        'Air Fry': 'No-Preheat Air Fry',
        'Griddle': 'Included Cast Iron Griddle',
        'Sabbath Mode': 'Certified Sabbath Mode',
        'Continuous Grates': 'Edge-to-Edge Continuous Grates',
    };
    return nameMap[attr] || attr;
}
function getAttributeValue(attrs, name) {
    if (!attrs || !Array.isArray(attrs))
        return '';
    const attr = attrs.find(a => a.name.toLowerCase().replace(/[_-]/g, ' ') === name.toLowerCase().replace(/[_-]/g, ' '));
    return attr?.value || '';
}
function extractModelParent(modelNumber) {
    // Extract parent model (usually first part before variant suffix)
    const match = modelNumber.match(/^([A-Z]+\d+[A-Z]*)/i);
    return match ? match[1] : modelNumber;
}
function extractModelVariant(modelNumber) {
    // Extract variant suffix (usually last part)
    const match = modelNumber.match(/([A-Z0-9]+)$/i);
    return match ? match[1] : '';
}
function mergeAttributes(incoming) {
    const merged = {};
    // Add Ferguson attributes (preferred source for verification)
    if (incoming.Ferguson_Attributes) {
        for (const attr of incoming.Ferguson_Attributes) {
            merged[attr.name] = attr.value;
        }
    }
    // Add Web Retailer specs (fill gaps)
    if (incoming.Web_Retailer_Specs) {
        for (const attr of incoming.Web_Retailer_Specs) {
            if (!merged[attr.name]) {
                merged[attr.name] = attr.value;
            }
        }
    }
    return merged;
}
function findAttributeValue(attrs, searchName) {
    // Normalize search name
    const normalized = searchName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, value] of Object.entries(attrs)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedKey.includes(normalized) || normalized.includes(normalizedKey)) {
            return value;
        }
    }
    return '';
}
function normalizeAttributeKey(key) {
    return key
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/^_+|_+$/g, '');
}
function formatAttributeDisplayName(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase());
}
function buildRangeFilterAttributes(incoming, baseAttrs) {
    const attrs = incoming.Ferguson_Attributes || [];
    return {
        ...baseAttrs,
        Fuel_Type: getAttributeValue(attrs, 'Fuel Type') || 'Gas',
        Installation_Type: getAttributeValue(attrs, 'Installation Type') || 'Slide In',
        Width_Nominal: getAttributeValue(attrs, 'Nominal Width') || '30',
        Number_of_Burners: parseInt(getAttributeValue(attrs, 'Number Of Burners')) || 6,
        Oven_Capacity_CuFt: parseFloat(getAttributeValue(attrs, 'Total Capacity')) || 5.6,
        Convection: getAttributeValue(attrs, 'Convection') === 'Yes',
        Self_Cleaning: getAttributeValue(attrs, 'Self Cleaning') === 'Yes',
        Finish_Color: incoming.Ferguson_Finish || incoming.Color_Finish_Web_Retailer,
        Continuous_Grates: getAttributeValue(attrs, 'Continuous Grates') === 'Yes',
        Double_Oven: false, // Would need to check configuration
        Griddle: getAttributeValue(attrs, 'Griddle') === 'Yes',
        Warming_Drawer: getAttributeValue(attrs, 'Drawer Type')?.includes('Warming') || false,
        BTU_Highest_Burner: parseInt(getAttributeValue(attrs, 'Front Left Burner BTU')) || 21000,
        Smart_Features: getAttributeValue(attrs, 'Smart Home') === 'Yes',
        WiFi_Enabled: getAttributeValue(attrs, 'Wireless Communication')?.includes('WiFi') || false,
    };
}
function buildRefrigeratorFilterAttributes(incoming, baseAttrs) {
    const attrs = incoming.Ferguson_Attributes || [];
    return {
        ...baseAttrs,
        Configuration: getAttributeValue(attrs, 'Configuration') || '',
        Installation_Type: getAttributeValue(attrs, 'Installation Type') || '',
        Width_Nominal: getAttributeValue(attrs, 'Nominal Width') || '',
        Total_Capacity_CuFt: parseFloat(getAttributeValue(attrs, 'Total Capacity')) || 0,
        Refrigerator_Capacity_CuFt: parseFloat(getAttributeValue(attrs, 'Refrigerator Capacity')) || 0,
        Freezer_Capacity_CuFt: parseFloat(getAttributeValue(attrs, 'Freezer Capacity')) || 0,
        Finish_Color: incoming.Ferguson_Finish || '',
        Ice_Maker: getAttributeValue(attrs, 'Ice Maker') === 'Yes',
        Water_Dispenser: getAttributeValue(attrs, 'Water Dispenser') === 'Yes',
        Panel_Ready: getAttributeValue(attrs, 'Panel Ready') === 'Yes',
        Number_of_Doors: parseInt(getAttributeValue(attrs, 'Number of Doors')) || 0,
        Energy_Star: getAttributeValue(attrs, 'Energy Star') === 'Yes',
        Smart_Features: getAttributeValue(attrs, 'Smart Home') === 'Yes',
        WiFi_Enabled: getAttributeValue(attrs, 'WiFi') === 'Yes',
        Counter_Depth: getAttributeValue(attrs, 'Counter Depth') === 'Yes',
    };
}
function buildDishwasherFilterAttributes(incoming, baseAttrs) {
    const attrs = incoming.Ferguson_Attributes || [];
    return {
        ...baseAttrs,
        Installation_Type: getAttributeValue(attrs, 'Installation Type') || '',
        Width_Nominal: getAttributeValue(attrs, 'Nominal Width') || '',
        Control_Location: getAttributeValue(attrs, 'Control Location') || '',
        Tub_Material: getAttributeValue(attrs, 'Tub Material') || '',
        Decibel_Level: parseInt(getAttributeValue(attrs, 'Decibel Level')) || 0,
        Place_Settings: parseInt(getAttributeValue(attrs, 'Place Settings')) || 0,
        Number_of_Wash_Cycles: parseInt(getAttributeValue(attrs, 'Wash Cycles')) || 0,
        Finish_Color: incoming.Ferguson_Finish || '',
        Panel_Ready: getAttributeValue(attrs, 'Panel Ready') === 'Yes',
        Third_Rack: getAttributeValue(attrs, 'Third Rack') === 'Yes',
        Adjustable_Upper_Rack: getAttributeValue(attrs, 'Adjustable Rack') === 'Yes',
        Soil_Sensor: getAttributeValue(attrs, 'Soil Sensor') === 'Yes',
        Energy_Star: getAttributeValue(attrs, 'Energy Star') === 'Yes',
        ADA_Compliant: getAttributeValue(attrs, 'ADA') === 'Yes',
        Smart_Features: getAttributeValue(attrs, 'Smart Home') === 'Yes',
    };
}
function calculateVerificationScore(incoming, primaryAttrs, topFilterAttrs) {
    let score = 0;
    let total = 0;
    // Primary attributes scoring (60% weight)
    const primaryFields = [
        'Brand_Verified', 'Category_Verified', 'Model_Number_Verified',
        'Width_Verified', 'Height_Verified', 'Depth_Verified',
        'MSRP_Verified', 'Description_Verified', 'Product_Title_Verified'
    ];
    for (const field of primaryFields) {
        total += 60 / primaryFields.length;
        if (primaryAttrs[field]) {
            score += 60 / primaryFields.length;
        }
    }
    // Top filter attributes scoring (30% weight)
    const filterCount = Object.keys(topFilterAttrs).length;
    const expectedFilters = 15;
    score += (Math.min(filterCount, expectedFilters) / expectedFilters) * 30;
    total += 30;
    // Data source match scoring (10% weight)
    if (incoming.Ferguson_Model_Number === incoming.Model_Number_Web_Retailer) {
        score += 5;
    }
    if (incoming.Ferguson_Brand?.toLowerCase() === incoming.Brand_Web_Retailer?.toLowerCase()) {
        score += 5;
    }
    total += 10;
    return Math.round((score / total) * 100);
}
function findMissingFields(primaryAttrs, _topFilterAttrs) {
    const missing = [];
    // Check required primary fields
    const requiredPrimary = [
        'Brand_Verified', 'Category_Verified', 'Model_Number_Verified',
        'MSRP_Verified', 'Description_Verified', 'Product_Title_Verified'
    ];
    for (const field of requiredPrimary) {
        if (!primaryAttrs[field]) {
            missing.push(field);
        }
    }
    return missing;
}
function calculateConfidenceScores(incoming, _primaryAttrs) {
    const scores = {};
    // Brand confidence - high if sources match
    if (incoming.Ferguson_Brand && incoming.Brand_Web_Retailer) {
        scores['brand'] = incoming.Ferguson_Brand.toLowerCase() ===
            incoming.Brand_Web_Retailer.toLowerCase() ? 100 : 80;
    }
    else {
        scores['brand'] = incoming.Ferguson_Brand || incoming.Brand_Web_Retailer ? 70 : 0;
    }
    // Price confidence
    scores['price'] = incoming.MSRP_Web_Retailer ? 100 : 0;
    scores['market_value'] = incoming.Ferguson_Price ? 100 : 0;
    // Model confidence
    scores['model'] = incoming.Ferguson_Model_Number === incoming.Model_Number_Web_Retailer ? 100 :
        incoming.Model_Number_Web_Retailer ? 90 : 0;
    return scores;
}
exports.default = {
    buildPrimaryAttributes,
    buildTopFilterAttributes,
    buildAdditionalAttributesHTML,
    buildPriceAnalysis,
    buildVerificationResponse,
};
//# sourceMappingURL=response-builder.service.js.map