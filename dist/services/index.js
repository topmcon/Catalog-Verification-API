"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsServiceFull = exports.trackingServiceFull = exports.dualAIService = exports.verifyProductWithDualAI = exports.buildResearchPrompt = exports.buildVerificationPrompt = exports.verifyProduct = exports.enhanceDescription = exports.generateDescription = exports.generateTitle = exports.getAllCategories = exports.matchCategory = exports.enrichProduct = exports.dbHealthCheck = exports.dbDisconnect = exports.dbConnect = exports.salesforceHealthCheck = exports.salesforceDisconnect = exports.queryProducts = exports.updateProducts = exports.exportProducts = exports.buildConsensus = exports.processProducts = exports.xaiHealthCheck = exports.xaiValidateProducts = exports.xaiValidateProduct = exports.openaiHealthCheck = exports.openaiValidateProducts = exports.openaiValidateProduct = exports.analyticsService = exports.trackingService = exports.dualAIVerificationService = exports.aiPromptBuilderService = exports.salesforceVerificationService = exports.categoryMatcherService = exports.descriptionGeneratorService = exports.titleGeneratorService = exports.enrichmentService = exports.databaseService = exports.salesforceService = exports.consensusService = exports.xaiService = exports.openaiService = void 0;
var openai_service_1 = require("./openai.service");
Object.defineProperty(exports, "openaiService", { enumerable: true, get: function () { return __importDefault(openai_service_1).default; } });
var xai_service_1 = require("./xai.service");
Object.defineProperty(exports, "xaiService", { enumerable: true, get: function () { return __importDefault(xai_service_1).default; } });
var consensus_service_1 = require("./consensus.service");
Object.defineProperty(exports, "consensusService", { enumerable: true, get: function () { return __importDefault(consensus_service_1).default; } });
var salesforce_service_1 = require("./salesforce.service");
Object.defineProperty(exports, "salesforceService", { enumerable: true, get: function () { return __importDefault(salesforce_service_1).default; } });
var database_service_1 = require("./database.service");
Object.defineProperty(exports, "databaseService", { enumerable: true, get: function () { return __importDefault(database_service_1).default; } });
var enrichment_service_1 = require("./enrichment.service");
Object.defineProperty(exports, "enrichmentService", { enumerable: true, get: function () { return __importDefault(enrichment_service_1).default; } });
var title_generator_service_1 = require("./title-generator.service");
Object.defineProperty(exports, "titleGeneratorService", { enumerable: true, get: function () { return __importDefault(title_generator_service_1).default; } });
var description_generator_service_1 = require("./description-generator.service");
Object.defineProperty(exports, "descriptionGeneratorService", { enumerable: true, get: function () { return __importDefault(description_generator_service_1).default; } });
var category_matcher_service_1 = require("./category-matcher.service");
Object.defineProperty(exports, "categoryMatcherService", { enumerable: true, get: function () { return __importDefault(category_matcher_service_1).default; } });
var salesforce_verification_service_1 = require("./salesforce-verification.service");
Object.defineProperty(exports, "salesforceVerificationService", { enumerable: true, get: function () { return __importDefault(salesforce_verification_service_1).default; } });
var ai_prompt_builder_service_1 = require("./ai-prompt-builder.service");
Object.defineProperty(exports, "aiPromptBuilderService", { enumerable: true, get: function () { return __importDefault(ai_prompt_builder_service_1).default; } });
var dual_ai_verification_service_1 = require("./dual-ai-verification.service");
Object.defineProperty(exports, "dualAIVerificationService", { enumerable: true, get: function () { return __importDefault(dual_ai_verification_service_1).default; } });
var tracking_service_1 = require("./tracking.service");
Object.defineProperty(exports, "trackingService", { enumerable: true, get: function () { return __importDefault(tracking_service_1).default; } });
var analytics_service_1 = require("./analytics.service");
Object.defineProperty(exports, "analyticsService", { enumerable: true, get: function () { return __importDefault(analytics_service_1).default; } });
// Named exports with explicit naming to avoid conflicts
var openai_service_2 = require("./openai.service");
Object.defineProperty(exports, "openaiValidateProduct", { enumerable: true, get: function () { return openai_service_2.validateProduct; } });
Object.defineProperty(exports, "openaiValidateProducts", { enumerable: true, get: function () { return openai_service_2.validateProducts; } });
Object.defineProperty(exports, "openaiHealthCheck", { enumerable: true, get: function () { return openai_service_2.healthCheck; } });
var xai_service_2 = require("./xai.service");
Object.defineProperty(exports, "xaiValidateProduct", { enumerable: true, get: function () { return xai_service_2.validateProduct; } });
Object.defineProperty(exports, "xaiValidateProducts", { enumerable: true, get: function () { return xai_service_2.validateProducts; } });
Object.defineProperty(exports, "xaiHealthCheck", { enumerable: true, get: function () { return xai_service_2.healthCheck; } });
var consensus_service_2 = require("./consensus.service");
Object.defineProperty(exports, "processProducts", { enumerable: true, get: function () { return consensus_service_2.processProducts; } });
Object.defineProperty(exports, "buildConsensus", { enumerable: true, get: function () { return consensus_service_2.buildConsensus; } });
var salesforce_service_2 = require("./salesforce.service");
Object.defineProperty(exports, "exportProducts", { enumerable: true, get: function () { return salesforce_service_2.exportProducts; } });
Object.defineProperty(exports, "updateProducts", { enumerable: true, get: function () { return salesforce_service_2.updateProducts; } });
Object.defineProperty(exports, "queryProducts", { enumerable: true, get: function () { return salesforce_service_2.queryProducts; } });
Object.defineProperty(exports, "salesforceDisconnect", { enumerable: true, get: function () { return salesforce_service_2.disconnect; } });
Object.defineProperty(exports, "salesforceHealthCheck", { enumerable: true, get: function () { return salesforce_service_2.healthCheck; } });
var database_service_2 = require("./database.service");
Object.defineProperty(exports, "dbConnect", { enumerable: true, get: function () { return database_service_2.connect; } });
Object.defineProperty(exports, "dbDisconnect", { enumerable: true, get: function () { return database_service_2.disconnect; } });
Object.defineProperty(exports, "dbHealthCheck", { enumerable: true, get: function () { return database_service_2.healthCheck; } });
var enrichment_service_2 = require("./enrichment.service");
Object.defineProperty(exports, "enrichProduct", { enumerable: true, get: function () { return enrichment_service_2.enrichProduct; } });
var category_matcher_service_2 = require("./category-matcher.service");
Object.defineProperty(exports, "matchCategory", { enumerable: true, get: function () { return category_matcher_service_2.matchCategory; } });
Object.defineProperty(exports, "getAllCategories", { enumerable: true, get: function () { return category_matcher_service_2.getAllCategories; } });
var title_generator_service_2 = require("./title-generator.service");
Object.defineProperty(exports, "generateTitle", { enumerable: true, get: function () { return title_generator_service_2.generateTitle; } });
var description_generator_service_2 = require("./description-generator.service");
Object.defineProperty(exports, "generateDescription", { enumerable: true, get: function () { return description_generator_service_2.generateDescription; } });
Object.defineProperty(exports, "enhanceDescription", { enumerable: true, get: function () { return description_generator_service_2.enhanceDescription; } });
var salesforce_verification_service_2 = require("./salesforce-verification.service");
Object.defineProperty(exports, "verifyProduct", { enumerable: true, get: function () { return salesforce_verification_service_2.verifyProduct; } });
var ai_prompt_builder_service_2 = require("./ai-prompt-builder.service");
Object.defineProperty(exports, "buildVerificationPrompt", { enumerable: true, get: function () { return ai_prompt_builder_service_2.buildVerificationPrompt; } });
Object.defineProperty(exports, "buildResearchPrompt", { enumerable: true, get: function () { return ai_prompt_builder_service_2.buildResearchPrompt; } });
var dual_ai_verification_service_2 = require("./dual-ai-verification.service");
Object.defineProperty(exports, "verifyProductWithDualAI", { enumerable: true, get: function () { return dual_ai_verification_service_2.verifyProductWithDualAI; } });
Object.defineProperty(exports, "dualAIService", { enumerable: true, get: function () { return dual_ai_verification_service_2.dualAIVerificationService; } });
// Tracking and Analytics exports
exports.trackingServiceFull = __importStar(require("./tracking.service"));
exports.analyticsServiceFull = __importStar(require("./analytics.service"));
//# sourceMappingURL=index.js.map