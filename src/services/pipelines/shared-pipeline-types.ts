/**
 * Shared types for department pipeline routing.
 * 
 * The main dual-ai-verification service determines the department, runs AI analysis,
 * builds consensus, computes primary attributes, and constructs the base finalSeoTitleInput.
 * Then it routes to a department-specific pipeline for POST-PROCESSING ONLY.
 * 
 * This keeps appliance logic completely isolated from non-appliance logic so that
 * changes to one department's post-processing CANNOT break the other.
 */

import { SEOTitleInput } from '../seo-title-generator.service';
import { PrimaryDisplayAttributes, TopFilterAttributes, SalesforceIncomingProduct, ApplianceFeatures } from '../../types/salesforce.types';

/**
 * Context passed from the main service to the department pipeline.
 * The base finalSeoTitleInput is already constructed by the main service.
 * The pipeline only applies department-specific modifications.
 */
export interface PipelineContext {
  /** Base finalSeoTitleInput — already constructed by main service with shared field logic */
  finalSeoTitleInput: SEOTitleInput;

  /** Sanitized attributes after Final Review corrections */
  sanitizedPrimaryAttributes: PrimaryDisplayAttributes;

  /** Sanitized top filter attributes after Final Review corrections */
  sanitizedTopFilterAttributes: TopFilterAttributes;

  /** Raw product data for source-text analysis (reclassification, dimension overrides) */
  rawProduct: SalesforceIncomingProduct;

  /** Department as determined by AI consensus */
  determinedDepartment: string;

  /** Category as determined by AI consensus (may differ from seoTitleInput.category after correction) */
  agreedCategory: string;

  /** Logger session ID for tracing */
  sessionId: string;

  /** Ferguson product name — frequently used for reclassification and dimension extraction */
  fergusonProductName: string;

  /** AI consensus product title — used for dimension extraction fallback (e.g., "72-Inch" in Bathtub titles) */
  consensusProductTitle?: string;
}

/**
 * Result returned by a department pipeline.
 * The main service uses this to generate the final title and build the response.
 */
export interface PipelineResult {
  /** The modified SEO title input after department-specific post-processing */
  finalSeoTitleInput: SEOTitleInput;

  /** Updated primary attributes (category/type may change during reclassification) */
  sanitizedPrimaryAttributes: PrimaryDisplayAttributes;

  /** Appliance features (all false for non-appliances) */
  applianceFeatures: ApplianceFeatures;
}

/**
 * Default appliance features — all false. Used for non-appliance departments.
 */
export function defaultApplianceFeatures(): ApplianceFeatures {
  return {
    built_in: false,
    panel_ready: false,
    counter_depth: false,
    standard_depth: false,
    voltage_120v: false,
    voltage_240v: false,
    fuel_gas: false,
    fuel_electric: false,
  };
}
