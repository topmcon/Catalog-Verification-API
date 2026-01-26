export { default as openaiService } from './openai.service';
export { default as xaiService } from './xai.service';
export { default as consensusService } from './consensus.service';
export { default as salesforceService } from './salesforce.service';
export { default as databaseService } from './database.service';
export { default as enrichmentService } from './enrichment.service';
export { default as titleGeneratorService } from './title-generator.service';
export { default as descriptionGeneratorService } from './description-generator.service';
export { default as categoryMatcherService } from './category-matcher.service';
export { default as salesforceVerificationService } from './salesforce-verification.service';
export { default as aiPromptBuilderService } from './ai-prompt-builder.service';
export { default as dualAIVerificationService } from './dual-ai-verification.service';
export { default as trackingService } from './tracking.service';
export { default as analyticsService } from './analytics.service';
export { default as alertingService } from './alerting.service';
export { default as aiUsageTracker } from './ai-usage-tracking.service';
export { errorMonitor } from './error-monitor.service';

// Async Verification Services
export { default as webhookService } from './webhook.service';
export { default as asyncVerificationProcessor } from './async-verification-processor.service';

// Named exports with explicit naming to avoid conflicts
export { validateProduct as openaiValidateProduct, validateProducts as openaiValidateProducts, healthCheck as openaiHealthCheck } from './openai.service';
export { validateProduct as xaiValidateProduct, validateProducts as xaiValidateProducts, healthCheck as xaiHealthCheck } from './xai.service';
export { processProducts, buildConsensus } from './consensus.service';
export { exportProducts, updateProducts, queryProducts, disconnect as salesforceDisconnect, healthCheck as salesforceHealthCheck } from './salesforce.service';
export { connect as dbConnect, disconnect as dbDisconnect, healthCheck as dbHealthCheck } from './database.service';
export { enrichProduct } from './enrichment.service';
export { matchCategory, getAllCategories } from './category-matcher.service';
export { generateTitle } from './title-generator.service';
export { generateDescription, enhanceDescription } from './description-generator.service';
export { verifyProduct } from './salesforce-verification.service';
export { buildVerificationPrompt, buildResearchPrompt } from './ai-prompt-builder.service';
export { verifyProductWithDualAI, dualAIVerificationService as dualAIService } from './dual-ai-verification.service';

// Verification Analytics Service
export { verificationAnalyticsService, VerificationAnalyticsService } from './verification-analytics.service';

// Alerting Service
export * as alertingServiceFull from './alerting.service';

// Tracking and Analytics exports
export * as trackingServiceFull from './tracking.service';
export * as analyticsServiceFull from './analytics.service';
export * as aiUsageTrackerFull from './ai-usage-tracking.service';
