import { Request, Response } from 'express';
/**
 * Health Controller
 * Handles health check endpoints
 */
/**
 * Basic health check
 */
export declare function healthCheck(_req: Request, res: Response): Promise<void>;
/**
 * Detailed health check with service status
 */
export declare function detailedHealthCheck(_req: Request, res: Response): Promise<void>;
/**
 * Readiness check (for Kubernetes)
 */
export declare function readinessCheck(_req: Request, res: Response): Promise<void>;
/**
 * Liveness check (for Kubernetes)
 */
export declare function livenessCheck(_req: Request, res: Response): void;
/**
 * Get application info
 */
export declare function getInfo(_req: Request, res: Response): void;
declare const _default: {
    healthCheck: typeof healthCheck;
    detailedHealthCheck: typeof detailedHealthCheck;
    readinessCheck: typeof readinessCheck;
    livenessCheck: typeof livenessCheck;
    getInfo: typeof getInfo;
};
export default _default;
//# sourceMappingURL=health.controller.d.ts.map