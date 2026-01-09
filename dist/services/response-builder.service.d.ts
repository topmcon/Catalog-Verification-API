/**
 * Salesforce Response Builder Service
 * Transforms verified product data into the structured Salesforce return format
 *
 * OUTPUT STRUCTURE:
 * 1. Primary Attributes (Global - applies to ALL products)
 * 2. Top 15 Filter Attributes (Category-specific)
 * 3. Additional Attributes HTML Table (everything else)
 */
import { SalesforceIncomingProduct, SalesforceVerificationResponse, PrimaryDisplayAttributes, TopFilterAttributes, PriceAnalysis, CorrectionRecord } from '../types/salesforce.types';
/**
 * Build Primary Display Attributes (Global - applies to ALL products)
 */
export declare function buildPrimaryAttributes(incoming: SalesforceIncomingProduct, corrections: CorrectionRecord[]): PrimaryDisplayAttributes;
/**
 * Build Top 15 Filter Attributes (Category-Specific)
 */
export declare function buildTopFilterAttributes(incoming: SalesforceIncomingProduct, category: string): TopFilterAttributes;
/**
 * Build Additional Attributes HTML Table
 * Contains all attributes NOT in Primary or Top 15
 */
export declare function buildAdditionalAttributesHTML(incoming: SalesforceIncomingProduct, _category: string, primaryAttrs: PrimaryDisplayAttributes, topFilterAttrs: TopFilterAttributes): string;
/**
 * Build Price Analysis
 */
export declare function buildPriceAnalysis(incoming: SalesforceIncomingProduct): PriceAnalysis;
/**
 * Build Complete Verification Response
 */
export declare function buildVerificationResponse(incoming: SalesforceIncomingProduct, sessionId: string, corrections?: CorrectionRecord[], dataSources?: string[]): SalesforceVerificationResponse;
declare const _default: {
    buildPrimaryAttributes: typeof buildPrimaryAttributes;
    buildTopFilterAttributes: typeof buildTopFilterAttributes;
    buildAdditionalAttributesHTML: typeof buildAdditionalAttributesHTML;
    buildPriceAnalysis: typeof buildPriceAnalysis;
    buildVerificationResponse: typeof buildVerificationResponse;
};
export default _default;
//# sourceMappingURL=response-builder.service.d.ts.map