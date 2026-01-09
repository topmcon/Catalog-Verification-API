/**
 * Connect to MongoDB
 */
export declare function connect(): Promise<void>;
/**
 * Disconnect from MongoDB
 */
export declare function disconnect(): Promise<void>;
/**
 * Check MongoDB connection health
 */
export declare function healthCheck(): Promise<{
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
}>;
/**
 * Get connection status
 */
export declare function isConnectedToDatabase(): boolean;
/**
 * Get MongoDB stats
 */
export declare function getStats(): Promise<{
    collections: number;
    documents: Record<string, number>;
}>;
declare const _default: {
    connect: typeof connect;
    disconnect: typeof disconnect;
    healthCheck: typeof healthCheck;
    isConnectedToDatabase: typeof isConnectedToDatabase;
    getStats: typeof getStats;
};
export default _default;
//# sourceMappingURL=database.service.d.ts.map