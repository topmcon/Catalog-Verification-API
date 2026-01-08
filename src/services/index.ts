export { default as openaiService } from './openai.service';
export { default as xaiService } from './xai.service';
export { default as consensusService } from './consensus.service';
export { default as salesforceService } from './salesforce.service';
export { default as databaseService } from './database.service';
export { default as enrichmentService } from './enrichment.service';
export { default as titleGeneratorService } from './title-generator.service';
export { default as descriptionGeneratorService } from './description-generator.service';
export { default as categoryMatcherService } from './category-matcher.service';

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
