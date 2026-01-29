/**
 * Research Attestation Types
 * 
 * Ensures "Procurement No Results" is only used after thorough research.
 * AI must complete ALL 8 mandatory checklist steps before using this status.
 */

/**
 * Research status codes for field values
 */
export type ResearchStatus = 
  | 'FOUND'           // Actual value found during research
  | 'FULLY_RESEARCHED' // All 8 steps completed, data not found → "Procurement No Results"
  | 'INCOMPLETE'      // Some steps skipped/failed → "Research Incomplete - Pending"
  | 'ERROR';          // Critical errors/conflicts → "Research Error - Manual Review Required"

/**
 * Result of a single checklist step
 */
export type ChecklistResult = 'found' | 'not_found' | 'error' | 'skipped';

/**
 * Individual checklist item tracking
 */
export interface ChecklistItem {
  /** Whether the step was fully completed */
  completed: boolean;
  /** Whether the step was at least attempted */
  attempted: boolean;
  /** When this step was executed */
  timestamp?: Date;
  /** Result of the step */
  result?: ChecklistResult;
  /** Where the data was found (if applicable) */
  source?: string;
  /** Confidence level 0-100 */
  confidence?: number;
  /** Additional notes about the search */
  notes?: string;
  /** Error message if step failed */
  errorMessage?: string;
  /** Number of items checked in this step */
  itemsChecked?: number;
  /** Value found (if any) */
  valueFound?: string | number | boolean;
}

/**
 * Raw SF Data Review step details
 */
export interface RawDataReviewItem extends ChecklistItem {
  /** Fields searched */
  fieldsSearched?: string[];
  /** Synonyms attempted */
  synonymsChecked?: string[];
  /** Total search attempts */
  searchAttempts?: number;
}

/**
 * URL Scraping step details
 */
export interface UrlScrapingItem extends ChecklistItem {
  /** URLs that were checked */
  urlsChecked?: string[];
  /** Number of URLs processed */
  urlCount?: number;
  /** URLs that failed to load */
  failedUrls?: string[];
  /** Content types found */
  contentTypesFound?: string[];
}

/**
 * AI Analysis Review step details
 */
export interface AIAnalysisReviewItem extends ChecklistItem {
  /** Which AI provider */
  provider?: 'openai' | 'xai' | 'claude';
  /** AI's confidence score */
  aiConfidence?: number;
  /** AI's reasoning */
  reasoning?: string;
  /** Value suggested by AI */
  suggestedValue?: string | number | boolean;
}

/**
 * Smart Inference step details
 */
export interface SmartInferenceItem extends ChecklistItem {
  /** Aliases that were checked */
  aliasesChecked?: string[];
  /** Total alias count */
  aliasCount?: number;
  /** Unit conversions attempted */
  unitConversions?: string[];
  /** Patterns matched */
  patternsMatched?: string[];
}

/**
 * Image Analysis step details
 */
export interface ImageAnalysisItem extends ChecklistItem {
  /** Images that were processed */
  imagesProcessed?: number;
  /** Image URLs analyzed */
  imageUrls?: string[];
  /** OCR text extracted */
  ocrTextExtracted?: boolean;
  /** Spec sheets found */
  specSheetsAnalyzed?: number;
  /** Labels/badges read */
  labelsRead?: number;
}

/**
 * Cross-Reference Validation step details
 */
export interface CrossReferenceItem extends ChecklistItem {
  /** Sources compared */
  sourcesCompared?: string[];
  /** Total source count */
  sourceCount?: number;
  /** Were there conflicts? */
  conflictsFound?: boolean;
  /** Conflict details */
  conflictDetails?: string[];
  /** Consistency score 0-100 */
  consistencyScore?: number;
}

/**
 * Final Verification step details
 */
export interface FinalVerificationItem extends ChecklistItem {
  /** All steps verified? */
  allStepsVerified?: boolean;
  /** Steps that failed */
  failedSteps?: string[];
  /** Attestation timestamp */
  attestationTimestamp?: Date;
  /** Can the AI honestly attest? */
  canAttest?: boolean;
}

/**
 * Complete 8-step research checklist
 */
export interface ResearchChecklist {
  /** Step 1: Raw SF Data Review */
  rawDataReview: RawDataReviewItem;
  /** Step 2: URL Website Scraping */
  urlScraping: UrlScrapingItem;
  /** Step 3: OpenAI Analysis Review */
  openAIReview: AIAnalysisReviewItem;
  /** Step 4: xAI Analysis Review */
  xAIReview: AIAnalysisReviewItem;
  /** Step 5: Smart Field Inference */
  smartInference: SmartInferenceItem;
  /** Step 6: External Image Analysis */
  imageAnalysis: ImageAnalysisItem;
  /** Step 7: Cross-Reference Validation */
  crossReference: CrossReferenceItem;
  /** Step 8: Final Verification */
  finalVerification: FinalVerificationItem;
}

/**
 * Full research attestation for a single field
 */
export interface ResearchAttestation {
  /** Field name being researched */
  fieldName: string;
  
  /** Final value or status code */
  fieldValue: string | number | boolean | null;
  
  /** Research status */
  status: ResearchStatus;
  
  /** Human-readable status message */
  statusMessage: string;
  
  /** Complete checklist tracking */
  checklist: ResearchChecklist;
  
  /** Number of completed steps (0-8) */
  completedSteps: number;
  
  /** Total required steps */
  totalSteps: 8;
  
  /** Completion percentage */
  completionRate: number;
  
  /** Which AI performed the research */
  attestedBy: string;
  
  /** When attestation was completed */
  attestedAt: Date;
  
  /** Can AI honestly attest all steps were completed? */
  canAttest: boolean;
  
  /** Reasons for incomplete research (if applicable) */
  incompleteReasons?: string[];
  
  /** Error reasons (if applicable) */
  errorReasons?: string[];
  
  /** Does this require human review? */
  requiresHumanReview?: boolean;
  
  /** Source where value was found (if found) */
  foundSource?: string;
  
  /** Step where value was found (if found) */
  foundAtStep?: string;
  
  /** Confidence in the found value (0-100) */
  foundConfidence?: number;
  
  /** Which sources validated the found value */
  validatedBy?: string[];
}

/**
 * Status code constants for field values
 */
export const FIELD_STATUS_CODES = {
  /** Data not found after complete research */
  PROCUREMENT_NO_RESULTS: 'Procurement No Results',
  /** Research could not be completed */
  RESEARCH_INCOMPLETE: 'Research Incomplete - Pending',
  /** Critical errors require human review */
  RESEARCH_ERROR: 'Research Error - Manual Review Required',
} as const;

/**
 * Checklist step names
 */
export const CHECKLIST_STEPS = [
  'rawDataReview',
  'urlScraping',
  'openAIReview',
  'xAIReview',
  'smartInference',
  'imageAnalysis',
  'crossReference',
  'finalVerification',
] as const;

export type ChecklistStepName = typeof CHECKLIST_STEPS[number];

/**
 * Create an empty checklist item
 */
export function createEmptyChecklistItem(): ChecklistItem {
  return {
    completed: false,
    attempted: false,
  };
}

/**
 * Create an empty research checklist
 */
export function createEmptyChecklist(): ResearchChecklist {
  return {
    rawDataReview: createEmptyChecklistItem() as RawDataReviewItem,
    urlScraping: createEmptyChecklistItem() as UrlScrapingItem,
    openAIReview: createEmptyChecklistItem() as AIAnalysisReviewItem,
    xAIReview: createEmptyChecklistItem() as AIAnalysisReviewItem,
    smartInference: createEmptyChecklistItem() as SmartInferenceItem,
    imageAnalysis: createEmptyChecklistItem() as ImageAnalysisItem,
    crossReference: createEmptyChecklistItem() as CrossReferenceItem,
    finalVerification: createEmptyChecklistItem() as FinalVerificationItem,
  };
}

/**
 * Batch attestation result for multiple fields
 */
export interface BatchResearchAttestation {
  /** Product ID being researched */
  productId: string;
  
  /** Session/Job ID */
  sessionId: string;
  
  /** Total fields researched */
  totalFields: number;
  
  /** Fields with actual values found */
  foundCount: number;
  
  /** Fields marked as "Procurement No Results" */
  notFoundCount: number;
  
  /** Fields with incomplete research */
  incompleteCount: number;
  
  /** Fields with errors requiring review */
  errorCount: number;
  
  /** Individual field attestations */
  fieldAttestations: ResearchAttestation[];
  
  /** Overall completion rate */
  overallCompletionRate: number;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Fields requiring human review */
  humanReviewQueue: string[];
}

/**
 * Summary statistics for attestation
 */
export interface AttestationSummary {
  found: number;
  fullyResearched: number;
  incomplete: number;
  error: number;
  total: number;
  completionRate: number;
}
