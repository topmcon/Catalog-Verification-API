/**
 * Enhanced Research Types
 * Supports comprehensive document analysis with full transparency
 */

export interface AnalyzedResource {
  type: 'webpage' | 'pdf' | 'image' | 'video' | 'spec_sheet' | 'manual' | 'certification' | 'url';
  url: string;
  title: string;
  filename?: string;
  analyzed: boolean;
  success: boolean;
  analysisMethod: 'web-scraping' | 'pdf-extraction' | 'vision-ai' | 'llm-analysis' | 'failed';
  dataExtracted: {
    specifications: Record<string, any>;
    attributes: Record<string, any>;
    textContent?: string;
    imageDescription?: string;
    confidence: number;
  };
  processingTimeMs: number;
  error?: string;
}

export interface ResearchManifest {
  totalResources: number;
  analyzed: number;
  successful: number;
  failed: number;
  resources: AnalyzedResource[];
  researchTriggeredReason: string;
  timestamp: string;
}

export interface EnhancedResearchResult {
  manifest: ResearchManifest;
  discoveredAttributes: Record<string, any>; // All attributes found (beyond schema)
  verifiedSpecifications: Record<string, any>; // Only validated/verified data
  inferredData: Record<string, any>; // Data that was inferred (should be minimal)
  confidenceByField: Record<string, number>; // Confidence per field (0-100)
  researchSummary: string;
}

export interface ResearchConfig {
  requireResearchValidation: boolean; // If true, don't return unverified data
  maxResourcesPerType: number; // Limit resources analyzed per type
  analysisTimeout: number; // Max time for research phase
  enableDynamicAttributes: boolean; // Save discovered attributes not in schema
  minimumConfidenceThreshold: number; // Don't return data below this confidence
}
