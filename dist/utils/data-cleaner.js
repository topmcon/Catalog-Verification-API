"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanProduct = cleanProduct;
exports.cleanProducts = cleanProducts;
exports.normalizeString = normalizeString;
exports.normalizeNumber = normalizeNumber;
exports.normalizeStatus = normalizeStatus;
exports.normalizeUrl = normalizeUrl;
exports.generateSKU = generateSKU;
exports.extractAdditionalAttributes = extractAdditionalAttributes;
exports.convertWeight = convertWeight;
exports.sanitizeHtml = sanitizeHtml;
const verified_fields_1 = require("../config/verified-fields");
const logger_1 = __importDefault(require("./logger"));
/**
 * Data Cleaner Utility
 * Handles normalization and cleaning of raw product data
 */
/**
 * Clean and normalize a single product
 */
function cleanProduct(rawProduct) {
    logger_1.default.debug(`Cleaning product: ${rawProduct.id}`);
    // Extract and normalize primary fields
    const cleanedProduct = {
        originalId: rawProduct.id,
        ProductName: normalizeString(rawProduct.name) || '',
        SKU: normalizeString(rawProduct.sku) || generateSKU(rawProduct),
        Price: normalizeNumber(rawProduct.price) || 0,
        Description: normalizeString(rawProduct.description) || '',
        PrimaryCategory: normalizeString(rawProduct.category) || 'Uncategorized',
        Brand: normalizeString(rawProduct.brand),
        Quantity: normalizeNumber(rawProduct.quantity),
        Status: normalizeStatus(rawProduct.status),
        ImageURL: normalizeUrl(rawProduct.imageUrl),
        Weight: normalizeNumber(rawProduct.weight),
        additionalAttributes: {},
        rawData: rawProduct,
    };
    // Extract additional attributes that don't match verified fields
    cleanedProduct.additionalAttributes = extractAdditionalAttributes(rawProduct);
    return cleanedProduct;
}
/**
 * Clean multiple products in batch
 */
function cleanProducts(rawProducts) {
    logger_1.default.info(`Cleaning batch of ${rawProducts.length} products`);
    return rawProducts.map(product => cleanProduct(product));
}
/**
 * Normalize a string value
 */
function normalizeString(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    const str = String(value).trim();
    if (str.length === 0) {
        return undefined;
    }
    // Remove excessive whitespace
    return str.replace(/\s+/g, ' ');
}
/**
 * Normalize a number value
 */
function normalizeNumber(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    // Handle string numbers
    if (typeof value === 'string') {
        // Remove currency symbols and commas
        const cleaned = value.replace(/[$€£¥,]/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? undefined : num;
    }
    if (typeof value === 'number') {
        return isNaN(value) ? undefined : value;
    }
    return undefined;
}
/**
 * Normalize product status
 */
function normalizeStatus(value) {
    const statusMap = {
        active: 'active',
        available: 'active',
        in_stock: 'active',
        enabled: 'active',
        inactive: 'inactive',
        disabled: 'inactive',
        discontinued: 'discontinued',
        out_of_stock: 'out_of_stock',
        oos: 'out_of_stock',
        sold_out: 'out_of_stock',
    };
    const normalized = normalizeString(value)?.toLowerCase().replace(/[\s-]/g, '_');
    return normalized ? statusMap[normalized] || 'inactive' : 'inactive';
}
/**
 * Normalize URL
 */
function normalizeUrl(value) {
    const str = normalizeString(value);
    if (!str)
        return undefined;
    // Basic URL validation
    try {
        new URL(str);
        return str;
    }
    catch {
        // Try adding https:// prefix
        try {
            const withProtocol = `https://${str}`;
            new URL(withProtocol);
            return withProtocol;
        }
        catch {
            return undefined;
        }
    }
}
/**
 * Generate a SKU if not provided
 */
function generateSKU(product) {
    const prefix = (product.category || 'GEN').substring(0, 3).toUpperCase();
    const idPart = product.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${idPart}-${timestamp}`;
}
/**
 * Extract attributes that don't match verified fields
 */
function extractAdditionalAttributes(rawProduct) {
    const additional = {};
    const verifiedLower = verified_fields_1.verifiedFieldNames.map(f => f.toLowerCase());
    // Reserved keys that are handled separately
    const reservedKeys = ['id', 'name', 'description', 'category', 'price', 'sku',
        'brand', 'quantity', 'status', 'imageurl', 'weight', 'rawData'];
    // Process direct product properties
    for (const [key, value] of Object.entries(rawProduct)) {
        const keyLower = key.toLowerCase();
        if (!reservedKeys.includes(keyLower) &&
            !verifiedLower.includes(keyLower) &&
            value !== null &&
            value !== undefined) {
            additional[key] = value;
        }
    }
    // Process nested attributes object
    if (rawProduct.attributes && typeof rawProduct.attributes === 'object') {
        for (const [key, value] of Object.entries(rawProduct.attributes)) {
            const keyLower = key.toLowerCase();
            if (!verifiedLower.includes(keyLower) && value !== null && value !== undefined) {
                additional[key] = value;
            }
        }
    }
    return additional;
}
/**
 * Convert weight between units
 */
function convertWeight(value, fromUnit, toUnit) {
    const toKg = {
        kg: 1,
        g: 0.001,
        lb: 0.453592,
        oz: 0.0283495,
    };
    const fromKgValue = value * (toKg[fromUnit.toLowerCase()] || 1);
    return fromKgValue / (toKg[toUnit.toLowerCase()] || 1);
}
/**
 * Sanitize HTML content
 */
function sanitizeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
exports.default = {
    cleanProduct,
    cleanProducts,
    normalizeString,
    normalizeNumber,
    normalizeStatus,
    normalizeUrl,
    generateSKU,
    extractAdditionalAttributes,
    convertWeight,
    sanitizeHtml,
};
//# sourceMappingURL=data-cleaner.js.map