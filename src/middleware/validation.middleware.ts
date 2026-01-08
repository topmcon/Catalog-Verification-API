import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error.middleware';

/**
 * Validation Schemas
 */

// Product validation schema
const productSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  attributes: Joi.object().pattern(Joi.string(), Joi.any()),
  category: Joi.string().allow('', null),
  price: Joi.number().min(0),
  sku: Joi.string(),
  brand: Joi.string().allow('', null),
  quantity: Joi.number().integer().min(0),
  status: Joi.string(),
  imageUrl: Joi.string().uri().allow('', null),
  weight: Joi.number().min(0),
}).unknown(true); // Allow additional fields

// Verification request schema
export const verificationRequestSchema = Joi.object({
  products: Joi.array().items(productSchema).min(1).required(),
  options: Joi.object({
    skipConsensus: Joi.boolean().default(false),
    forceRevalidation: Joi.boolean().default(false),
    batchSize: Joi.number().integer().min(1).max(500).default(100),
  }),
});

// Salesforce webhook payload schema
export const webhookPayloadSchema = Joi.object({
  products: Joi.array().items(productSchema).min(1).required(),
  metadata: Joi.object({
    batchId: Joi.string(),
    timestamp: Joi.string().isoDate(),
    source: Joi.string(),
  }),
});

// Export request schema
export const exportRequestSchema = Joi.object({
  sessionId: Joi.string().required(),
  productIds: Joi.array().items(Joi.string()),
});

// Query params schema for session status
export const sessionStatusSchema = Joi.object({
  sessionId: Joi.string().required(),
});

/**
 * Validation Middleware Factory
 */
export function validate(schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
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

      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'Request validation failed',
        details
      );
    }

    // Replace with validated (and potentially transformed) value
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else {
      req.params = value;
    }

    next();
  };
}

export default {
  validate,
  verificationRequestSchema,
  webhookPayloadSchema,
  exportRequestSchema,
  sessionStatusSchema,
};
