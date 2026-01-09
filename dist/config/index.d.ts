export interface Config {
    env: string;
    port: number;
    apiBaseUrl: string;
    mongodb: {
        uri: string;
        dbName: string;
    };
    openai: {
        apiKey: string;
        model: string;
        maxTokens: number;
    };
    xai: {
        apiKey: string;
        apiUrl: string;
        model: string;
    };
    salesforce: {
        loginUrl: string;
        clientId: string;
        clientSecret: string;
        username: string;
        password: string;
        securityToken: string;
    };
    aiConsensus: {
        threshold: number;
        maxRetries: number;
        retryDelayMs: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    batch: {
        size: number;
        delayMs: number;
    };
    logging: {
        level: string;
        filePath: string;
    };
    security: {
        apiKeyHeader: string;
        webhookSecret: string;
    };
}
declare const config: Config;
export default config;
export * from './master-category-attributes';
//# sourceMappingURL=index.d.ts.map