"use strict";
/**
 * Product Enrichment Service
 * Core service that orchestrates the data enrichment workflow:
 * 1. Match product to category
 * 2. Get required attributes for category
 * 3. Use source data FIRST
 * 4. AI fills gaps
 * 5. Generate standardized title/description
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichProduct = enrichProduct;
const category_matcher_service_1 = require("./category-matcher.service");
const title_generator_service_1 = require("./title-generator.service");
const description_generator_service_1 = require("./description-generator.service");
const category_schema_1 = require("../config/category-schema");
const category_attributes_1 = require("../config/category-attributes");
const openai_1 = __importDefault(require("openai"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Main enrichment function
 */
async function enrichProduct(rawData) {
    try {
        // Step 1: Match to category
        const categoryMatch = (0, category_matcher_service_1.matchCategory)(rawData);
        if (!categoryMatch) {
            return {
                success: false,
                error: 'Could not determine product category from provided data'
            };
        }
        logger_1.default.info(`Matched product to category: ${categoryMatch.categoryName} (${categoryMatch.confidence}% confidence)`);
        // Step 1b: Get category-specific schema
        const categorySchema = (0, category_attributes_1.getCategorySchema)(categoryMatch.categoryName);
        const requiredAttrs = categorySchema
            ? (0, category_attributes_1.getRequiredAttributes)(categoryMatch.categoryName)
            : [...category_schema_1.GLOBAL_PRIMARY_ATTRIBUTES];
        // Step 2: Extract attributes from source data
        const { attributes, usedFields, missingFields } = extractSourceAttributes(rawData, requiredAttrs);
        // Step 3: Use AI to fill gaps only if needed
        let aiGeneratedFields = [];
        if (missingFields.length > 0) {
            const aiFilledAttributes = await fillWithAI(rawData, categoryMatch.categoryName, missingFields);
            Object.assign(attributes, aiFilledAttributes.attributes);
            aiGeneratedFields = aiFilledAttributes.filledFields;
        }
        // Step 4: Generate standardized title
        const titleInput = {
            brand: attributes.brand || rawData.brand,
            category: categoryMatch.categoryName,
            width: attributes.width || rawData.width,
            height: attributes.height || rawData.height,
            depth: attributes.depth || rawData.depth,
            style: attributes.style || rawData.style,
            type: attributes.type || rawData.type || rawData.productType,
            installationType: attributes.installationType || rawData.installationType,
            finish: attributes.finish || rawData.finish,
            color: attributes.color || rawData.color,
            material: attributes.material || rawData.material,
            fuelType: attributes.fuelType || rawData.fuelType,
            features: attributes.features || rawData.features,
            totalCapacity: attributes.totalCapacity || rawData.totalCapacity,
            configuration: attributes.configuration || rawData.configuration,
        };
        const title = (0, title_generator_service_1.generateTitle)(titleInput);
        // Step 5: Generate professional description
        const descInput = {
            ...titleInput,
            modelNumber: attributes.modelNumber || rawData.modelNumber || rawData.sku,
            existingDescription: rawData.description,
        };
        const description = (0, description_generator_service_1.generateDescription)(descInput);
        // Calculate overall confidence
        const sourceFieldCount = usedFields.length;
        const totalFieldCount = sourceFieldCount + aiGeneratedFields.length + missingFields.filter(f => !aiGeneratedFields.includes(f)).length;
        const confidence = totalFieldCount > 0 ? Math.round((sourceFieldCount / totalFieldCount) * 100) : 0;
        return {
            success: true,
            product: {
                category: categoryMatch,
                categorySchema: categorySchema || undefined,
                title,
                description,
                attributes,
                missingAttributes: missingFields.filter(f => !aiGeneratedFields.includes(f)),
                aiGenerated: aiGeneratedFields,
                sourceDataUsed: usedFields,
                confidence: Math.max(confidence, categoryMatch.confidence),
                taxonomyTiers: categorySchema?.taxonomyTiers,
            }
        };
    }
    catch (error) {
        logger_1.default.error('Product enrichment failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown enrichment error'
        };
    }
}
/**
 * Extract attributes from source data - USE SOURCE FIRST
 */
function extractSourceAttributes(rawData, requiredAttrs = category_schema_1.GLOBAL_PRIMARY_ATTRIBUTES) {
    const attributes = {};
    const usedFields = [];
    const missingFields = [];
    // Map of common field aliases
    const fieldAliases = {
        brand: ['brand', 'manufacturer', 'mfr', 'brandName'],
        modelNumber: ['modelNumber', 'model', 'sku', 'mpn', 'itemNumber'],
        width: ['width', 'widthInches', 'productWidth'],
        height: ['height', 'heightInches', 'productHeight'],
        depth: ['depth', 'depthInches', 'productDepth'],
        color: ['color', 'colorFamily', 'primaryColor'],
        finish: ['finish', 'finishType', 'surfaceFinish'],
        material: ['material', 'primaryMaterial', 'constructionMaterial'],
        style: ['style', 'designStyle'],
        type: ['type', 'productType', 'subType'],
        installationType: ['installationType', 'installation', 'mountType'],
        totalCapacity: ['totalCapacity', 'capacity', 'capacityCuFt'],
        fuelType: ['fuelType', 'fuel', 'powerSource'],
        features: ['features', 'keyFeatures', 'productFeatures'],
    };
    // Check each required attribute (category-specific or global)
    for (const attr of requiredAttrs) {
        const attrKey = toCamelCase(attr);
        const aliases = fieldAliases[attrKey] || [attrKey, attr, attr.toLowerCase().replace(/\s+/g, '')];
        let found = false;
        for (const alias of aliases) {
            // Check exact match (case-insensitive)
            const matchKey = Object.keys(rawData).find(k => k.toLowerCase() === alias.toLowerCase());
            if (matchKey && rawData[matchKey] != null && rawData[matchKey] !== '') {
                attributes[attrKey] = rawData[matchKey];
                usedFields.push(attrKey);
                found = true;
                break;
            }
        }
        if (!found) {
            missingFields.push(attrKey);
        }
    }
    return { attributes, usedFields, missingFields };
}
/**
 * Use AI to fill missing attributes
 */
async function fillWithAI(rawData, category, missingFields) {
    // Only try to fill fields we can reasonably infer
    const inferrableFields = ['style', 'type', 'installationType', 'features'];
    const fieldsToFill = missingFields.filter(f => inferrableFields.includes(f));
    if (fieldsToFill.length === 0) {
        return { attributes: {}, filledFields: [] };
    }
    // Check if OpenAI is configured
    if (!config_1.default.openai.apiKey) {
        logger_1.default.warn('OpenAI API key not configured, skipping AI inference');
        return { attributes: {}, filledFields: [] };
    }
    const prompt = `Given this product data for a ${category}:
${JSON.stringify(rawData, null, 2)}

Infer values for these missing fields if possible: ${fieldsToFill.join(', ')}

Return ONLY a JSON object with the fields you can confidently infer.
Do not guess - only provide values you're confident about.
Example: {"style": "French Door", "installationType": "Built-In"}`;
    try {
        const openai = new openai_1.default({ apiKey: config_1.default.openai.apiKey });
        const completion = await openai.chat.completions.create({
            model: config_1.default.openai.model || 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: 'You are a product data enrichment assistant. Only return JSON.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 500,
        });
        const response = completion.choices[0]?.message?.content || '';
        // Parse AI response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const aiAttributes = JSON.parse(jsonMatch[0]);
            const filledFields = Object.keys(aiAttributes).filter(k => aiAttributes[k] != null && aiAttributes[k] !== '');
            return { attributes: aiAttributes, filledFields };
        }
    }
    catch (error) {
        logger_1.default.warn('AI attribute inference failed, continuing without:', error);
    }
    return { attributes: {}, filledFields: [] };
}
/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}
exports.default = { enrichProduct };
//# sourceMappingURL=enrichment.service.js.map