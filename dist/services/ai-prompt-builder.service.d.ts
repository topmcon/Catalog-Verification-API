/**
 * AI Prompt Builder for Salesforce Verification
 *
 * Creates specialized prompts for OpenAI and xAI to verify product data
 * Each AI receives the same raw data but works INDEPENDENTLY
 * Results are compared for consensus
 */
import { SalesforceIncomingProduct } from '../types/salesforce.types';
import { CategoryAttributeConfig } from '../config/category-attributes';
/**
 * Build the verification prompt for AI providers
 */
export declare function buildVerificationPrompt(rawProduct: SalesforceIncomingProduct, categorySchema: CategoryAttributeConfig, _provider: 'openai' | 'xai', retryContext?: RetryContext): string;
/**
 * Build retry instructions when AIs disagree
 */
interface RetryContext {
    attemptNumber: number;
    discrepancies: Array<{
        field: string;
        yourPreviousValue: string | number | null;
        otherAIValue: string | number | null;
    }>;
}
/**
 * Build research prompt for missing data
 */
export declare function buildResearchPrompt(modelNumber: string, brand: string, category: string, missingFields: string[]): string;
declare const _default: {
    buildVerificationPrompt: typeof buildVerificationPrompt;
    buildResearchPrompt: typeof buildResearchPrompt;
};
export default _default;
//# sourceMappingURL=ai-prompt-builder.service.d.ts.map