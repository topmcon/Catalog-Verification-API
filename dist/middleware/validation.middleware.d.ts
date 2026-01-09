import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
export declare const verificationRequestSchema: Joi.ObjectSchema<any>;
export declare const webhookPayloadSchema: Joi.ObjectSchema<any>;
export declare const exportRequestSchema: Joi.ObjectSchema<any>;
export declare const sessionStatusSchema: Joi.ObjectSchema<any>;
/**
 * Validation Middleware Factory
 */
export declare function validate(schema: Joi.ObjectSchema, source?: 'body' | 'query' | 'params'): (req: Request, _res: Response, next: NextFunction) => void;
declare const _default: {
    validate: typeof validate;
    verificationRequestSchema: Joi.ObjectSchema<any>;
    webhookPayloadSchema: Joi.ObjectSchema<any>;
    exportRequestSchema: Joi.ObjectSchema<any>;
    sessionStatusSchema: Joi.ObjectSchema<any>;
};
export default _default;
//# sourceMappingURL=validation.middleware.d.ts.map