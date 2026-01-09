import { Request, Response, NextFunction } from 'express';
/**
 * Custom API Error Class
 */
export declare class ApiError extends Error {
    statusCode: number;
    code: string;
    details?: unknown;
    constructor(statusCode: number, code: string, message: string, details?: unknown);
}
/**
 * Error Handler Middleware
 */
export declare function errorHandler(error: Error | ApiError, req: Request, res: Response, _next: NextFunction): void;
/**
 * Not Found Handler
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    errorHandler: typeof errorHandler;
    notFoundHandler: typeof notFoundHandler;
    asyncHandler: typeof asyncHandler;
    ApiError: typeof ApiError;
};
export default _default;
//# sourceMappingURL=error.middleware.d.ts.map