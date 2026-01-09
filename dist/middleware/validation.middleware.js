"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionStatusSchema = exports.exportRequestSchema = exports.webhookPayloadSchema = exports.verificationRequestSchema = void 0;
exports.validate = validate;
const joi_1 = __importDefault(require("joi"));
const error_middleware_1 = require("./error.middleware");
/**
 * Validation Schemas
 */
// Product validation schema
const productSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
    name: joi_1.default.string().required(),
    description: joi_1.default.string().allow('', null),
    attributes: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.any()),
    category: joi_1.default.string().allow('', null),
    price: joi_1.default.number().min(0),
    sku: joi_1.default.string(),
    brand: joi_1.default.string().allow('', null),
    quantity: joi_1.default.number().integer().min(0),
    status: joi_1.default.string(),
    imageUrl: joi_1.default.string().uri().allow('', null),
    weight: joi_1.default.number().min(0),
}).unknown(true); // Allow additional fields
// Verification request schema
exports.verificationRequestSchema = joi_1.default.object({
    products: joi_1.default.array().items(productSchema).min(1).required(),
    options: joi_1.default.object({
        skipConsensus: joi_1.default.boolean().default(false),
        forceRevalidation: joi_1.default.boolean().default(false),
        batchSize: joi_1.default.number().integer().min(1).max(500).default(100),
    }),
});
// Salesforce webhook payload schema
exports.webhookPayloadSchema = joi_1.default.object({
    products: joi_1.default.array().items(productSchema).min(1).required(),
    metadata: joi_1.default.object({
        batchId: joi_1.default.string(),
        timestamp: joi_1.default.string().isoDate(),
        source: joi_1.default.string(),
    }),
});
// Export request schema
exports.exportRequestSchema = joi_1.default.object({
    sessionId: joi_1.default.string().required(),
    productIds: joi_1.default.array().items(joi_1.default.string()),
});
// Query params schema for session status
exports.sessionStatusSchema = joi_1.default.object({
    sessionId: joi_1.default.string().required(),
});
/**
 * Validation Middleware Factory
 */
function validate(schema, source = 'body') {
    return (req, _res, next) => {
        const dataToValidate = source === 'body' ? req.body :
            source === 'query' ? req.query : req.params;
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: false,
        });
        if (error) {
            const details = error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message,
            }));
            throw new error_middleware_1.ApiError(400, 'VALIDATION_ERROR', 'Request validation failed', details);
        }
        // Replace with validated (and potentially transformed) value
        if (source === 'body') {
            req.body = value;
        }
        else if (source === 'query') {
            req.query = value;
        }
        else {
            req.params = value;
        }
        next();
    };
}
exports.default = {
    validate,
    verificationRequestSchema: exports.verificationRequestSchema,
    webhookPayloadSchema: exports.webhookPayloadSchema,
    exportRequestSchema: exports.exportRequestSchema,
    sessionStatusSchema: exports.sessionStatusSchema,
};
//# sourceMappingURL=validation.middleware.js.map