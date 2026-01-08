/**
 * API Request/Response Types
 */

import { RawProduct, VerifiedProduct } from './product.types';
import { ConsensusResult } from './ai.types';

export interface SalesforceWebhookPayload {
  products: RawProduct[];
  metadata?: {
    batchId?: string;
    timestamp?: string;
    source?: string;
  };
}

export interface VerificationRequest {
  products: RawProduct[];
  options?: {
    skipConsensus?: boolean;
    forceRevalidation?: boolean;
    batchSize?: number;
  };
}

export interface VerificationResponse {
  success: boolean;
  sessionId: string;
  totalProducts: number;
  verifiedCount: number;
  failedCount: number;
  flaggedForReviewCount: number;
  results: VerificationResultItem[];
  processingTimeMs: number;
  timestamp: string;
}

export interface VerificationResultItem {
  productId: string;
  status: 'verified' | 'failed' | 'flagged_for_review';
  verifiedProduct?: VerifiedProduct;
  consensusResult?: ConsensusResult;
  errors?: string[];
}

export interface SalesforceExportPayload {
  records: SalesforceProductRecord[];
  sessionId: string;
  exportedAt: string;
}

export interface SalesforceProductRecord {
  Id?: string;
  Name: string;
  ProductCode: string;
  Description: string;
  Family: string;
  IsActive: boolean;
  Custom_Price__c?: number;
  Custom_Brand__c?: string;
  Custom_Quantity__c?: number;
  Custom_ImageURL__c?: string;
  Custom_Weight__c?: number;
  Custom_AdditionalAttributes__c?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: ServiceStatus;
    openai: ServiceStatus;
    xai: ServiceStatus;
    salesforce: ServiceStatus;
  };
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'unknown';
  latencyMs?: number;
  lastChecked: string;
  error?: string;
}
