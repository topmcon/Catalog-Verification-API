export { Product, IProduct } from './product.model';
export { VerificationSession, IVerificationSession } from './session.model';
export { AuditLog, IAuditLog, AuditAction } from './audit-log.model';
export { 
  APITracker, 
  IAPITracker, 
  IncomingRequestData, 
  AIProcessingResult, 
  ConsensusData, 
  OutgoingResponseData, 
  IssueFlag 
} from './api-tracker.model';

// Picklist Mismatch Model
export { PicklistMismatch, IPicklistMismatch } from './picklist-mismatch.model';

// Field Analytics Model
export { FieldAnalytics, IFieldAnalytics } from './field-analytics.model';

// Category Confusion Matrix Model
export { CategoryConfusion, ICategoryConfusion } from './category-confusion.model';

// Verification Analytics Models
export {
  VerificationResult,
  IVerificationResult,
  FieldMetrics,
  IFieldMetrics,
  CategoryMetrics,
  ICategoryMetrics,
  AIProviderMetrics,
  IAIProviderMetrics,
  DailySnapshot,
  IDailySnapshot,
  TrainingExample,
  ITrainingExample
} from './verification-analytics.model';

// Picklist Sync Audit Log
export { 
  PicklistSyncLog, 
  IPicklistSyncLog, 
  IPicklistChange, 
  IPicklistTypeSummary 
} from './picklist-sync-log.model';

// Catalog Intelligence Index Models
export {
  CategoryIndex,
  ICategoryIndex,
  StyleIndex,
  IStyleIndex,
  HierarchyIndex,
  IHierarchyIndex,
  AttributeIndex,
  IAttributeIndex,
  BrandCategoryIndex,
  IBrandCategoryIndex,
  VerificationHistory,
  IVerificationHistory
} from './catalog-index.model';

// AI Usage Tracking Model
export {
  AIUsage,
  IAIUsage,
  AIProvider,
  TaskType,
  TaskOutcome,
  MODEL_PRICING,
  calculateCost
} from './ai-usage.model';

// Failed Match Log Model (for auditing failed attribute matches)
export {
  FailedMatchLog,
  IFailedMatchLog,
  MatchType,
  MatchSource
} from './failed-match-log.model';
