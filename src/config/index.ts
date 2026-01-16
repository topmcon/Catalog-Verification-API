import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
    visionModel: string; // For image analysis
  };
  xai: {
    apiKey: string;
    apiUrl: string;
    model: string;
  };
  research: {
    enabled: boolean;
    enableWebFetch: boolean;
    enablePdfExtract: boolean;
    enableImageAnalysis: boolean;
    maxDocuments: number;
    maxImages: number;
    requestTimeout: number;
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

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification',
    dbName: process.env.MONGODB_DB_NAME || 'catalog-verification',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
    visionModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
  },

  xai: {
    apiKey: process.env.XAI_API_KEY || '',
    apiUrl: process.env.XAI_API_URL || 'https://api.x.ai/v1',
    model: process.env.XAI_MODEL || 'grok-beta',
  },

  research: {
    enabled: process.env.RESEARCH_ENABLED !== 'false', // Enabled by default
    enableWebFetch: process.env.RESEARCH_WEB_FETCH !== 'false',
    enablePdfExtract: process.env.RESEARCH_PDF_EXTRACT !== 'false',
    enableImageAnalysis: process.env.RESEARCH_IMAGE_ANALYSIS !== 'false',
    maxDocuments: parseInt(process.env.RESEARCH_MAX_DOCUMENTS || '3', 10),
    maxImages: parseInt(process.env.RESEARCH_MAX_IMAGES || '2', 10),
    requestTimeout: parseInt(process.env.RESEARCH_TIMEOUT || '15000', 10),
  },

  salesforce: {
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
    clientId: process.env.SALESFORCE_CLIENT_ID || '',
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    username: process.env.SALESFORCE_USERNAME || '',
    password: process.env.SALESFORCE_PASSWORD || '',
    securityToken: process.env.SALESFORCE_SECURITY_TOKEN || '',
  },

  aiConsensus: {
    threshold: parseFloat(process.env.AI_CONSENSUS_THRESHOLD || '0.9'),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  batch: {
    size: parseInt(process.env.BATCH_SIZE || '100', 10),
    delayMs: parseInt(process.env.BATCH_DELAY_MS || '500', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  security: {
    apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
    webhookSecret: process.env.WEBHOOK_SECRET || '',
  },
};

export default config;

// ============================================
// RE-EXPORTS (Original)
// ============================================

// Re-export master category attributes (original)
export * from './master-category-attributes';

// Re-export category aliases (original)
export * from './category-aliases';

// ============================================
// NEW CONSOLIDATED MODULES
// ============================================

// Export types (no conflicts - these are new)
export {
  CategoryAttributeConfig,
  AICategorySchema,
  AIFilterAttributeDefinition,
  TitleComponents,
  DescriptionContext,
  isCategoryAttributeConfig,
  isAICategorySchema,
} from './types';

// Export constants (avoid duplicates with master-category-attributes)
export {
  PREMIUM_BRANDS,
  MID_TIER_BRANDS,
  VALUE_BRANDS,
  PREMIUM_FEATURE_KEYWORDS,
  CATEGORY_NAME_ALIASES,
  AI_CATEGORY_ALIASES,
  DEPARTMENTS,
  AI_FALLBACK_ATTRIBUTES,
  isPremiumBrand,
  isMidTierBrand,
  getBrandTier,
  hasPremiumFeatures,
} from './constants';

// Export lookup functions
export {
  getResponseBuilderSchema,
  getCategoryConfig,
  getAllResponseBuilderCategories,
  getUniqueSchemaCount,
  getAISchema,
  resolveAICategoryAlias,
  getCategoryAliases,
  getTop15Attributes,
  categoryExists,
  normalizeCategoryName,
  findBestCategoryMatch,
  getSystemCoverage,
  getCategoryCoverage,
} from './lookups';
