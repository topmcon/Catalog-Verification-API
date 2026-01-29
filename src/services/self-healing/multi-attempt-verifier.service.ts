import logger from '../../utils/logger';
import comprehensiveFixApplicator from './comprehensive-fix-applicator.service';
import dualAIVerificationService from '../dual-ai-verification.service';
import OpenAI from 'openai';
import axios from 'axios';

interface AttemptResult {
  attemptNumber: number;
  fixApplied: boolean;
  reprocessed: boolean;
  openaiReview: ValidationReview;
  xaiReview: ValidationReview;
  bothApproved: boolean;
  failureReason?: string;
  timestamp: Date;
}

interface ValidationReview {
  aiProvider: 'openai' | 'xai';
  approved: boolean;
  confidence: number;
  checklist: {
    missingFieldsPopulated: boolean;
    dataAccuracyCorrect: boolean;
    noNewErrorsIntroduced: boolean;
    overallQualityImproved: boolean;
  };
  concerns: string[];
  improvements: string[];
  detailedAnalysis: string;
}

interface MultiAttemptResult {
  success: boolean;
  finalAttempt: number;
  totalAttempts: number;
  attempts: AttemptResult[];
  finalResponse?: any;
  finalValidation?: {
    openaiApproval: ValidationReview;
    xaiApproval: ValidationReview;
  };
  escalateToHuman: boolean;
  reason: string;
}

class MultiAttemptVerifier {
  private openai: OpenAI;
  private xaiApiKey: string;
  private maxAttempts: number;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.xaiApiKey = process.env.XAI_API_KEY || '';
    this.maxAttempts = parseInt(process.env.SELF_HEALING_MAX_ATTEMPTS || '3');
  }

  /**
   * Main verification loop with up to 3 attempts
   */
  async verifyWithRetry(
    consensusFix: any,
    originalJob: any,
    originalPayload: any,
    originalResponse: any
  ): Promise<MultiAttemptResult> {
    const attempts: AttemptResult[] = [];
    let currentFix = consensusFix;

    logger.info(`Starting multi-attempt verification (max ${this.maxAttempts} attempts) for job ${originalJob.jobId}`);

    for (let attemptNumber = 1; attemptNumber <= this.maxAttempts; attemptNumber++) {
      logger.info(`\n========== ATTEMPT ${attemptNumber}/${this.maxAttempts} ==========`);

      const attemptResult: AttemptResult = {
        attemptNumber,
        fixApplied: false,
        reprocessed: false,
        openaiReview: this.createEmptyReview('openai'),
        xaiReview: this.createEmptyReview('xai'),
        bothApproved: false,
        timestamp: new Date()
      };

      try {
        // 1️⃣ APPLY FIX
        logger.info(`[Attempt ${attemptNumber}] Applying fix...`);
        const fixResult = await comprehensiveFixApplicator.applyComprehensiveFix(currentFix);
        
        if (!fixResult.success) {
          attemptResult.failureReason = `Fix application failed: ${fixResult.reason}`;
          attempts.push(attemptResult);
          
          // Rollback and try again if not last attempt
          if (attemptNumber < this.maxAttempts) {
            await comprehensiveFixApplicator.rollbackAllChanges();
            continue;
          } else {
            break;
          }
        }

        attemptResult.fixApplied = true;
        logger.info(`[Attempt ${attemptNumber}] Fix applied successfully`);

        // 2️⃣ RELOAD CODE
        logger.info(`[Attempt ${attemptNumber}] Reloading modified modules...`);
        await this.reloadModules(fixResult.modifiedFiles);

        // 3️⃣ RE-PROCESS ORIGINAL JOB
        logger.info(`[Attempt ${attemptNumber}] Re-processing original job...`);
        const newResponse = await this.reprocessJob(originalPayload);
        attemptResult.reprocessed = true;

        // 4️⃣ DUAL-AI INDEPENDENT REVIEW
        logger.info(`[Attempt ${attemptNumber}] Starting dual-AI independent review...`);
        
        const [openaiReview, xaiReview] = await Promise.all([
          this.openAIValidatesFix(originalResponse, newResponse, currentFix),
          this.xAIValidatesFix(originalResponse, newResponse, currentFix)
        ]);

        attemptResult.openaiReview = openaiReview;
        attemptResult.xaiReview = xaiReview;

        logger.info(`[Attempt ${attemptNumber}] OpenAI approval: ${openaiReview.approved} (${openaiReview.confidence}%)`);
        logger.info(`[Attempt ${attemptNumber}] xAI approval: ${xaiReview.approved} (${xaiReview.confidence}%)`);

        // 5️⃣ CHECK CONSENSUS
        if (openaiReview.approved && xaiReview.approved) {
          // ✅ BOTH APPROVE - SUCCESS!
          logger.info(`[Attempt ${attemptNumber}] ✅ SUCCESS! Both AIs approved the fix.`);
          attemptResult.bothApproved = true;
          attempts.push(attemptResult);

          return {
            success: true,
            finalAttempt: attemptNumber,
            totalAttempts: this.maxAttempts,
            attempts,
            finalResponse: newResponse,
            finalValidation: {
              openaiApproval: openaiReview,
              xaiApproval: xaiReview
            },
            escalateToHuman: false,
            reason: 'Fix validated and approved by both AIs'
          };
        }

        // 6️⃣ ANALYZE FAILURE
        logger.warn(`[Attempt ${attemptNumber}] Fix not approved by both AIs. Analyzing failure...`);
        const failureAnalysis = await this.analyzeBothReviews(openaiReview, xaiReview, newResponse);
        attemptResult.failureReason = failureAnalysis.summary;
        attempts.push(attemptResult);

        // 7️⃣ GENERATE IMPROVED FIX (if not last attempt)
        if (attemptNumber < this.maxAttempts) {
          logger.info(`[Attempt ${attemptNumber}] Generating improved fix for next attempt...`);
          
          // Rollback current attempt
          await comprehensiveFixApplicator.rollbackAllChanges();
          
          // Generate better fix based on both AIs' feedback
          currentFix = await this.generateImprovedFix({
            previousFix: currentFix,
            failureAnalysis,
            openaiSuggestions: openaiReview.improvements,
            xaiSuggestions: xaiReview.improvements,
            attemptNumber
          });

          logger.info(`[Attempt ${attemptNumber}] Improved fix generated. Proceeding to attempt ${attemptNumber + 1}...`);
        } else {
          // Last attempt failed
          logger.error(`[Attempt ${attemptNumber}] Final attempt failed. Rolling back all changes.`);
          await comprehensiveFixApplicator.rollbackAllChanges();
        }

      } catch (error: any) {
        logger.error(`[Attempt ${attemptNumber}] Error during attempt:`, error);
        attemptResult.failureReason = `Exception: ${error.message}`;
        attempts.push(attemptResult);

        // Rollback and continue if not last attempt
        if (attemptNumber < this.maxAttempts) {
          await comprehensiveFixApplicator.rollbackAllChanges();
        }
      }
    }

    // ❌ FAILED ALL ATTEMPTS
    logger.error(`Failed to fix issue after ${this.maxAttempts} attempts. Escalating to human review.`);

    return {
      success: false,
      finalAttempt: this.maxAttempts,
      totalAttempts: this.maxAttempts,
      attempts,
      escalateToHuman: true,
      reason: `Could not achieve dual-AI consensus after ${this.maxAttempts} attempts`
    };
  }

  /**
   * OpenAI validates the fix results
   */
  private async openAIValidatesFix(
    originalResponse: any,
    newResponse: any,
    expectedFix: any
  ): Promise<ValidationReview> {
    const validationPrompt = `You are validating whether a CODE FIX successfully resolved a processing failure.

**CRITICAL: What You're Validating**
1. Did the CODE CHANGE enable INTELLIGENT, EXHAUSTIVE field extraction?
2. Did we fix the logic to use ALL available resources (payload, specs, docs, URLs, web search)?
3. Was the SAME job that failed now successfully processed with the fix?

**COMPREHENSIVE EXTRACTION VALIDATION:**
1. ✓ Does code now check ALL available resources before declaring "not found"?
   - Raw Salesforce payload
   - Specification tables
   - Product descriptions/titles
   - Document URLs (PDFs, manuals)
   - Image URLs (for visual inspection)
   - Web searches (manufacturer sites, retailers)
2. ✓ Does code extract from compound values? ("Satin Black" → color + finish)
3. ✓ Does code validate fields against category TOP15 + primary attributes?
4. ✓ Does code analyze CONTENT not just field names?
5. ✓ Can code map one source field to multiple target fields when appropriate?
6. ✓ Does code respect schema constraints (no new field creation)?
7. ✓ Did THE SAME JOB that previously failed now succeed?

**RESOURCE UTILIZATION CHECK:**
- If field missing from payload → Did we check spec table?
- If missing from specs → Did we check product description?
- If missing from description → Did we check document URLs?
- If missing from documents → Did we try web search?
- Only declare "not found" after EXHAUSTIVE search of ALL resources

**EXAMPLE GOOD FIX:**
Before: Color field null (didn't check "Material: Satin Black" in description)
After: Color: "Black", Finish: "Satin" (added semantic analysis of description field)
Verification: Re-ran SAME job → Fields now populated ✓

**EXAMPLE EXCELLENT FIX:**
Before: Dimensions null (didn't check spec table)
After: Width/Depth/Height populated (added spec table parser + pattern recognition)
Verification: Re-ran SAME job → All dimension fields populated ✓
Impact: Will work for ALL future jobs with spec tables

**EXAMPLE BAD FIX:**
Before: Field null
After: Added field to picklist (WRONG - data fix, not code fix)
Verification: Only works for THIS specific value, doesn't fix extraction logic

**SAME-JOB VERIFICATION:**
**CRITICAL:** The fix MUST work on the SAME job that originally failed.
- Original job ID should process successfully with new code
- Missing fields should now be populated
- No new errors should be introduced
- This proves the code fix actually resolves the issue

**ORIGINAL RESPONSE (BEFORE CODE FIX):**
\`\`\`json
${JSON.stringify(originalResponse, null, 2)}
\`\`\`

**NEW RESPONSE (AFTER CODE FIX - SAME JOB RE-PROCESSED):**
\`\`\`json
${JSON.stringify(newResponse, null, 2)}
\`\`\`

**CODE FIX APPLIED:**
${JSON.stringify(expectedFix, null, 2)}

**VALIDATION CHECKLIST:**
1. ✓ Did the code fix enable processing of previously-failed input?
2. ✓ Are results now populated because LOGIC improved (not data added)?
3. ✓ Did we add resource checks (specs, docs, web search)?
4. ✓ Was the SAME job re-processed successfully?
5. ✓ Do previously-null fields now have values?
3. ✓ Will this code fix prevent future failures of similar patterns?
4. ✓ No regression - existing working cases still work?
5. ✓ Fix is sustainable (not a band-aid)?

**REJECTION CRITERIA:**
❌ REJECT if: Results only improved because we added data (picklist entry, schema field)
❌ REJECT if: Fix won't prevent similar failures in the future
❌ REJECT if: Code fix broke other functionality

**APPROVAL CRITERIA:**
✅ APPROVE if: Code now processes valid input that it previously failed on
✅ APPROVE if: Logic improvement is systemic and prevents recurrence
✅ APPROVE if: No regressions detected

**RESPOND WITH JSON:**
{
  "approved": true/false,
  "confidence": 0-100,
  "checklist": {
    "codeFix EnabledProcessing": true/false,
    "logicImprovedNotDataAdded": true/false,
    "preventsFutureFailures": true/false,
    "noRegressions": true/false,
    "fixIsSustainable": true/false
  },
  "concerns": [
    "Fix only worked because we added data, not fixed code",
    "Threshold still too strict, will fail on other variations",
    "Didn't fix root cause, just this one symptom"
  ],
  "improvements": [
    "Next attempt: Fix the underlying matcher logic, not just this field",
    "Scan all services for same threshold pattern",
    "Make the fix more comprehensive"
  ],
  "detailedAnalysis": "Analysis of whether code fix solved the underlying logic problem"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: validationPrompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      aiProvider: 'openai',
      approved: result.approved || false,
      confidence: result.confidence || 0,
      checklist: result.checklist || {},
      concerns: result.concerns || [],
      improvements: result.improvements || [],
      detailedAnalysis: result.detailedAnalysis || ''
    };
  }

  /**
   * xAI validates the fix results
   */
  private async xAIValidatesFix(
    originalResponse: any,
    newResponse: any,
    expectedFix: any
  ): Promise<ValidationReview> {
    const validationPrompt = `You are validating whether a CODE FIX successfully resolved a processing failure.

**CRITICAL: What You're Validating**
Did the CODE CHANGE enable INTELLIGENT, CONTEXT-AWARE field mapping?
NOT: Did we add missing data?
YES: Did we fix the logic to extract ALL relevant data using semantic understanding?

**CONTEXT-AWARE MAPPING VALIDATION:**
1. ✓ Does code now extract from compound values? ("Satin Black" → color + finish)
2. ✓ Does code validate fields against category TOP15 + primary attributes?
3. ✓ Does code analyze CONTENT not just field names?
4. ✓ Can code map one source field to multiple target fields when appropriate?
5. ✓ Does code respect schema constraints (no new field creation)?

**EXAMPLE GOOD FIX:**
Before: "Material: Satin Black" → SKIPPED (field name doesn't match)
After: "Material: Satin Black" → color: "Black", finish: "Satin" (context extracted)

**EXAMPLE BAD FIX:**
Before: "Material: Satin Black" → null
After: Added "Material" field to schema (WRONG - creates new field, violates constraints)

**ORIGINAL RESPONSE (BEFORE CODE FIX):**
\`\`\`json
${JSON.stringify(originalResponse, null, 2)}
\`\`\`

**NEW RESPONSE (AFTER CODE FIX):**
\`\`\`json
${JSON.stringify(newResponse, null, 2)}
\`\`\`

**CODE FIX APPLIED:**
${JSON.stringify(expectedFix, null, 2)}

**VALIDATION CHECKLIST:**
1. ✓ Did the code fix enable processing of previously-failed input?
2. ✓ Are results now populated because LOGIC improved (not data added)?
3. ✓ Will this code fix prevent future failures of similar patterns?
4. ✓ No regression - existing working cases still work?
5. ✓ Fix is sustainable (not a band-aid)?

**REJECTION CRITERIA:**
❌ REJECT if: Results only improved because we added data (picklist entry, schema field)
❌ REJECT if: Fix won't prevent similar failures in the future
❌ REJECT if: Code fix broke other functionality

**APPROVAL CRITERIA:**
✅ APPROVE if: Code now processes valid input that it previously failed on
✅ APPROVE if: Logic improvement is systemic and prevents recurrence
✅ APPROVE if: No regressions detected

**RESPOND WITH JSON:**
{
  "approved": true/false,
  "confidence": 0-100,
  "checklist": {
    "codeFixEnabledProcessing": true/false,
    "logicImprovedNotDataAdded": true/false,
    "preventsFutureFailures": true/false,
    "noRegressions": true/false,
    "fixIsSustainable": true/false
  },
  "concerns": [
    "Fix only worked because we added data, not fixed code",
    "Threshold still too strict, will fail on other variations",
    "Didn't fix root cause, just this one symptom"
  ],
  "improvements": [
    "Next attempt: Fix the underlying matcher logic, not just this field",
    "Scan all services for same threshold pattern",
    "Make the fix more comprehensive"
  ],
  "detailedAnalysis": "Analysis of whether code fix solved the underlying logic problem"
}`;

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: validationPrompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.xaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content || '{}');

    return {
      aiProvider: 'xai',
      approved: result.approved || false,
      confidence: result.confidence || 0,
      checklist: result.checklist || {},
      concerns: result.concerns || [],
      improvements: result.improvements || [],
      detailedAnalysis: result.detailedAnalysis || ''
    };
  }

  /**
   * Analyze why both AIs didn't approve
   */
  private async analyzeBothReviews(openaiReview: ValidationReview, xaiReview: ValidationReview, _newResponse: any) {
    const allConcerns = [...openaiReview.concerns, ...xaiReview.concerns];
    const allImprovements = [...openaiReview.improvements, ...xaiReview.improvements];

    return {
      summary: `OpenAI: ${openaiReview.approved ? 'Approved' : 'Rejected'}, xAI: ${xaiReview.approved ? 'Approved' : 'Rejected'}`,
      concerns: allConcerns,
      improvements: allImprovements,
      openaiConfidence: openaiReview.confidence,
      xaiConfidence: xaiReview.confidence,
      commonIssues: this.findCommonIssues(openaiReview.concerns, xaiReview.concerns)
    };
  }

  /**
   * Generate improved fix based on failure analysis
   */
  private async generateImprovedFix(params: {
    previousFix: any;
    failureAnalysis: any;
    openaiSuggestions: string[];
    xaiSuggestions: string[];
    attemptNumber: number;
  }) {
    logger.info('Generating improved fix based on AI feedback...');

    // Use OpenAI to synthesize both AIs' suggestions into an improved fix
    const improvePrompt = `You are improving a code fix that didn't fully resolve the issue.

**PREVIOUS FIX (Attempt ${params.attemptNumber}):**
${JSON.stringify(params.previousFix, null, 2)}

**WHY IT FAILED:**
${JSON.stringify(params.failureAnalysis, null, 2)}

**OPENAI SUGGESTIONS:**
${params.openaiSuggestions.join('\n')}

**XAI SUGGESTIONS:**
${params.xaiSuggestions.join('\n')}

**YOUR TASK:**
Generate an IMPROVED fix that addresses all the concerns and suggestions.

**RESPOND WITH JSON:**
{
  "primary": {
    "type": "add_alias" | "update_schema" | "fix_parsing" | "add_normalization" | "fix_logic",
    "targetFiles": ["file1.ts"],
    "codeChanges": [
      {
        "file": "filename.ts",
        "newCode": "improved code",
        "explanation": "why this is better than previous attempt"
      }
    ]
  },
  "systemWide": [],
  "improvementReason": "explanation of what changed from previous attempt"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: improvePrompt }],
      temperature: 0.4, // Slightly higher for creative improvements
      response_format: { type: 'json_object' }
    });

    const improvedFix = JSON.parse(response.choices[0].message.content || '{}');
    logger.info(`Improved fix generated: ${improvedFix.improvementReason}`);

    return improvedFix;
  }

  /**
   * Re-process original job with modified code
   */
  private async reprocessJob(originalPayload: any): Promise<any> {
    try {
      // Use the dual-AI verification service to re-process
      const result = await dualAIVerificationService.verifyProductWithDualAI(originalPayload);
      return result;
    } catch (error) {
      logger.error('Error reprocessing job:', error);
      throw error;
    }
  }

  /**
   * Reload modified modules (clear cache)
   */
  private async reloadModules(modifiedFiles: string[]) {
    for (const file of modifiedFiles) {
      const modulePath = require.resolve(file);
      delete require.cache[modulePath];
      logger.info(`Cleared cache for: ${file}`);
    }
    
    // Give Node.js a moment to clear caches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Find common issues between AI reviews
   */
  private findCommonIssues(concerns1: string[], concerns2: string[]): string[] {
    const common: string[] = [];
    
    for (const c1 of concerns1) {
      for (const c2 of concerns2) {
        if (this.stringsAreSimilar(c1, c2)) {
          common.push(c1);
          break;
        }
      }
    }
    
    return common;
  }

  /**
   * Check if two strings are similar (simple contains check)
   */
  private stringsAreSimilar(s1: string, s2: string): boolean {
    const lower1 = s1.toLowerCase();
    const lower2 = s2.toLowerCase();
    return lower1.includes(lower2) || lower2.includes(lower1);
  }

  /**
   * Create empty review structure
   */
  private createEmptyReview(provider: 'openai' | 'xai'): ValidationReview {
    return {
      aiProvider: provider,
      approved: false,
      confidence: 0,
      checklist: {
        missingFieldsPopulated: false,
        dataAccuracyCorrect: false,
        noNewErrorsIntroduced: false,
        overallQualityImproved: false
      },
      concerns: [],
      improvements: [],
      detailedAnalysis: ''
    };
  }
}

export default new MultiAttemptVerifier();
