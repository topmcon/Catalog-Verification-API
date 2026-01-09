/**
 * Application Entry Point
 * Build version: 2026-01-09-v3 (Vercel serverless compatible)
 *
 * Supports both:
 * - Vercel serverless: exports handler, lazy DB connection
 * - Traditional server: npm start runs main()
 */
declare const app: import("express").Application;
/**
 * Vercel Serverless Handler
 * Exported for Vercel to use as the request handler
 */
export default function handler(req: any, res: any): Promise<void>;
export { app };
//# sourceMappingURL=index.d.ts.map