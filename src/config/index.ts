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
    searchModel: string; // For web search with gpt-4o-search-preview
  };
  xai: {
    apiKey: string;
    apiUrl: string;
    model: string;
    visionModel: string; // For vision (grok-3 is multimodal)
  };
  research: {
    enabled: boolean;
    enableWebFetch: boolean;
    enablePdfExtract: boolean;
    enableImageAnalysis: boolean;
    enableFinalWebSearch: boolean;
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
    webhookUrl: string; // Default webhook URL for Salesforce callbacks
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
  audit: {
    mode: 'off' | 'detect' | 'confirm'; // Server-side toggle (AUDIT_MODE). Routes inbound verification calls.
    enabled: boolean;  // convenience: mode !== 'off'
    sendToSf: boolean; // Send audit_mode webhooks to SF (default false — SF has no audit branch yet)
    model: string;     // Claude model used for the discriminative audit
    maxTokens: number;
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
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // Production default (ENV override in production)
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
    visionModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o', // Vision still needs gpt-4o
    searchModel: process.env.OPENAI_SEARCH_MODEL || 'gpt-4o-mini-search-preview', // For real web search
  },

  xai: {
    apiKey: process.env.XAI_API_KEY || '',
    apiUrl: process.env.XAI_API_URL || 'https://api.x.ai/v1',
    model: process.env.XAI_MODEL || 'grok-4-fast-non-reasoning', // Upgraded from grok-3
    visionModel: process.env.XAI_VISION_MODEL || 'grok-3', // Multimodal model (grok-2-vision-1212 deprecated)
  },

  research: {
    enabled: process.env.RESEARCH_ENABLED !== 'false', // Enabled by default
    enableWebFetch: process.env.RESEARCH_WEB_FETCH !== 'false',
    enablePdfExtract: process.env.RESEARCH_PDF_EXTRACT !== 'false',
    enableImageAnalysis: process.env.RESEARCH_IMAGE_ANALYSIS !== 'false',
    enableFinalWebSearch: process.env.RESEARCH_FINAL_WEB_SEARCH !== 'false', // Final targeted web search after AI analysis
    maxDocuments: parseInt(process.env.RESEARCH_MAX_DOCUMENTS || '2', 10), // Reduced from 3
    maxImages: parseInt(process.env.RESEARCH_MAX_IMAGES || '1', 10), // Reduced from 2
    requestTimeout: parseInt(process.env.RESEARCH_TIMEOUT || '10000', 10), // Reduced from 15000
  },

  salesforce: {
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
    clientId: process.env.SALESFORCE_CLIENT_ID || '',
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    username: process.env.SALESFORCE_USERNAME || '',
    password: process.env.SALESFORCE_PASSWORD || '',
    securityToken: process.env.SALESFORCE_SECURITY_TOKEN || '',
    webhookUrl: process.env.SALESFORCE_WEBHOOK_URL || 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/catalog_verification',
  },

  aiConsensus: {
    threshold: parseFloat(process.env.AI_CONSENSUS_THRESHOLD || '0.9'),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10), // Increased for Salesforce batch operations
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

  audit: (() => {
    // AUDIT_MODE: off | detect | confirm. Back-compat: AUDIT_MODE_ENABLED=true → detect.
    const raw = (process.env.AUDIT_MODE || (process.env.AUDIT_MODE_ENABLED === 'true' ? 'detect' : 'off')).toLowerCase();
    const mode: 'off' | 'detect' | 'confirm' =
      raw === 'detect' || raw === 'confirm' ? (raw as 'detect' | 'confirm') : 'off';
    return {
      mode,
      enabled: mode !== 'off',
      sendToSf: process.env.AUDIT_SEND_TO_SF === 'true', // default false: SF has no audit branch
      model: process.env.AUDIT_MODEL || 'claude-sonnet-4-6', // Same model family as Phase B review
      maxTokens: parseInt(process.env.AUDIT_MAX_TOKENS || '4000', 10),
    };
  })(),
};

export default config;

// ============================================
// RE-EXPORTS (Original)
// ============================================

// Re-export category configuration (NEW - replaces master-category-attributes)
export * from './category-config';

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

// Export constants from category configuration
export {
  PREMIUM_BRANDS,
  MID_TIER_BRANDS,
  VALUE_BRANDS,
  isPremiumBrand,
  isMidTierBrand,
  isValueBrand,
  getBrandTier,
} from '../picklist-master/01-brands/brand-config';

export {
  CATEGORY_NAME_ALIASES,
  AI_CATEGORY_ALIASES,
} from './constants';

// Export Type hierarchy functions
export {
  getTypesForCategory,
  getTypeById,
  getTypeByName,
  getCategoryTypeMapping,
  isValidTypeForCategory,
  getAllTypeNames,
  getPrimaryTypesForCategory,
  getTypeContext,
  TYPES,
  CATEGORY_TYPE_MAPPINGS,
} from '../picklist-master/03-types/type-config';

// Export Department and Family functions
export {
  getAllDepartmentNames,
  getAllFamilyNames,
  getFamiliesForDepartment,
  getDepartmentForFamily,
  isDepartment,
  isFamily,
  DEPARTMENTS,
  FAMILIES,
} from '../picklist-master/04-departments-families/department-family-config';

export {
  PRIMARY_ATTRIBUTES,
  GLOBAL_PRIMARY_ATTRIBUTES,
  type PrimaryAttributeName,
  AI_FALLBACK_ATTRIBUTES,
} from '../picklist-master/06-attributes/attribute-config';

export { PREMIUM_FEATURE_KEYWORDS, hasPremiumFeatures } from './constants';

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
  getOptimizedFilterAttributes,
  getOptimizedFilterAttributeIds,
  getCategoryDepartment,
  categoryExists,
  normalizeCategoryName,
  findBestCategoryMatch,
  getSystemCoverage,
  getCategoryCoverage,
} from '../picklist-master/07-category-filter-attributes/lookups';

// Export Type prompt generation functions
export {
  getAllCategoriesWithTypesForPrompt,
  getTypesForCategoryPrompt,
  getTypeHierarchyExplanation,
} from './type-prompts';
