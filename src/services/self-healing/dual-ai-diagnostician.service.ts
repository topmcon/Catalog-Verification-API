import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger';

interface DetectedIssue {
  jobId: string;
  sfCatalogId: string;
  issueType: 'missing_data' | 'mapping_failure' | 'logic_error' | 'picklist_mismatch' | 'research_incomplete' | 'research_conflict' | 'salesforce_rejection' | 'field_too_long' | 'required_field_missing' | 'duplicate_record' | 'validation_failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  missingFields: string[];
  wrongFields?: string[];  // Fields that caused errors (too long, wrong format, etc.)
  rawPayload: any;
  currentResponse: any;
  errorLogs: string[];
  affectedCount: number;
  // Salesforce error fields
  salesforceError?: string;
  // Research attestation fields
  failedResearchSteps?: string[];
  researchCompletionRate?: number;
  canRetryResearch?: boolean;
  requiresHumanReview?: boolean;
}

interface AIDiagnosis {
  aiProvider: 'openai' | 'xai' | 'claude';
  rootCause: string;
  evidence: string[];
  proposedFix: {
    type: 'add_alias' | 'update_schema' | 'fix_parsing' | 'add_normalization' | 'fix_logic' | 'retry_research' | 'truncate_field' | 'fix_payload' | 'retry_webhook';
    targetFiles: string[];
    codeChanges: Array<{
      file: string;
      lineNumbers?: string;
      oldCode?: string;
      newCode: string;
      explanation: string;
    }>;
    // For field_too_long issues - specify how to truncate
    fieldTruncation?: {
      fieldName: string;
      maxLength: number;
      truncationStrategy: 'simple' | 'smart' | 'extract_suffix';
    };
    // For research_incomplete issues
    researchStepsToRetry?: string[];
  };
  systemScanRecommendations: {
    filesToScan: string[];
    patternsToLookFor: string[];
    expectedAdditionalFixes: number;
  };
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  reasoningChain: string[];
}

interface ConsensusFix {
  agreed: boolean;
  consensusRootCause: string;
  selectedFix: {
    primary: AIDiagnosis['proposedFix'];
    systemWide: Array<{
      file: string;
      changes: string;
      reason: string;
    }>;
  };
  combinedConfidence: number;
  bothAIsApprove: boolean;
  openaiDiagnosis: AIDiagnosis;
  xaiDiagnosis: AIDiagnosis;
  // NEW: Claude mediation
  claudeMediation?: {
    selectedProvider: 'openai' | 'xai';
    reasoning: string;
    mergedFix: boolean;
    additionalInsights: string[];
  };
  openaiReviewOfXAI: {
    agrees: boolean;
    concerns: string[];
    suggestions: string[];
  };
  xaiReviewOfOpenAI: {
    agrees: boolean;
    concerns: string[];
    suggestions: string[];
  };
}

class DualAIDiagnostician {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private xaiApiKey: string;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.xaiApiKey = process.env.XAI_API_KEY || '';
  }

  /**
   * Main entry point: Analyze issue with both AIs, use Claude as mediator
   * 
   * UPDATED: Now uses Tri-AI architecture consistent with verification system:
   * - OpenAI + xAI: Independent analysts
   * - Claude: Mediator/judge who selects best fix
   */
  async diagnoseWithConsensus(issue: DetectedIssue): Promise<ConsensusFix | null> {
    try {
      logger.info(`Starting Tri-AI diagnosis for job ${issue.jobId}`);
      logger.info(`Issue type: ${issue.issueType}, Severity: ${issue.severity}`);

      // Handle research_conflict issues immediately - always escalate
      if (issue.requiresHumanReview || issue.issueType === 'research_conflict') {
        logger.warn(`Issue ${issue.jobId} requires human review - skipping auto-diagnosis`);
        return null;
      }

      // STEP 1: Gather all context
      const context = await this.gatherDiagnosticContext(issue);

      // STEP 2A: Independent parallel analysis (OpenAI + xAI)
      logger.info(`[Phase 2A] Starting independent parallel analysis...`);
      const [openaiDiagnosis, xaiDiagnosis] = await Promise.all([
        this.analyzeWithOpenAI(issue, context),
        this.analyzeWithXAI(issue, context)
      ]);

      logger.info(`Dual analysis complete - OpenAI: ${openaiDiagnosis.confidence}% confidence, xAI: ${xaiDiagnosis.confidence}% confidence`);

      // STEP 2B: Cross-review (each AI reviews the other's diagnosis)
      logger.info(`[Phase 2B] Starting cross-review...`);
      const openaiReview = await this.openAIReviewsXAI(xaiDiagnosis, context);
      const xaiReview = await this.xAIReviewsOpenAI(openaiDiagnosis, context);

      // STEP 2C: Claude Mediation (NEW - consistent with verification system)
      logger.info(`[Phase 2C] Starting Claude mediation...`);
      const claudeMediation = await this.claudeMediatesAndSelectsFix(
        openaiDiagnosis,
        xaiDiagnosis,
        openaiReview,
        xaiReview,
        issue,
        context
      );

      // STEP 2D: Build final consensus with Claude's decision
      const consensus = await this.buildConsensusWithClaude({
        openaiDiagnosis,
        xaiDiagnosis,
        openaiReview,
        xaiReview,
        claudeMediation,
        context
      });

      if (!consensus.agreed) {
        logger.warn(`Tri-AI could not reach consensus on job ${issue.jobId}. Escalating to human review.`);
        return null;
      }

      // STEP 2E: System-wide scanning
      logger.info(`[Phase 2E] Planning system-wide fixes...`);
      const systemWideFixes = await this.planSystemWideFixes(consensus, context);
      consensus.selectedFix.systemWide = systemWideFixes;

      logger.info(`✅ Consensus achieved with ${consensus.combinedConfidence}% confidence (mediated by Claude)`);
      logger.info(`   Selected provider: ${consensus.claudeMediation?.selectedProvider}`);
      logger.info(`   System-wide fixes: ${systemWideFixes.length}`);

      return consensus;

    } catch (error) {
      logger.error('Error in Tri-AI diagnosis:', error);
      throw error;
    }
  }

  /**
   * Claude mediates between OpenAI and xAI diagnoses
   * Selects the best fix approach, similar to verification system
   */
  private async claudeMediatesAndSelectsFix(
    openaiDiagnosis: AIDiagnosis,
    xaiDiagnosis: AIDiagnosis,
    openaiReview: any,
    xaiReview: any,
    issue: DetectedIssue,
    context: any
  ): Promise<{
    selectedProvider: 'openai' | 'xai';
    reasoning: string;
    mergedFix: boolean;
    additionalInsights: string[];
    finalFix: AIDiagnosis['proposedFix'];
    confidence: number;
  }> {
    const prompt = `You are a senior software architect mediating between two AI diagnoses of a self-healing issue.

## YOUR ROLE
You are the JUDGE. OpenAI and xAI have independently analyzed an issue and proposed fixes.
Your job is to:
1. Evaluate both diagnoses
2. Select the BEST fix (or merge the best parts)
3. Provide reasoning for your decision
4. Add any insights they may have missed

## ISSUE DETAILS
- Issue ID: ${issue.jobId}
- Issue Type: ${issue.issueType}
- Severity: ${issue.severity}
- Affected Count: ${issue.affectedCount}
- Missing Fields: ${issue.missingFields?.join(', ') || 'None'}
${issue.failedResearchSteps ? `- Failed Research Steps: ${issue.failedResearchSteps.join(', ')}` : ''}
${issue.researchCompletionRate !== undefined ? `- Research Completion: ${issue.researchCompletionRate}%` : ''}

## OPENAI DIAGNOSIS
Root Cause: ${openaiDiagnosis.rootCause}
Proposed Fix Type: ${openaiDiagnosis.proposedFix.type}
Confidence: ${openaiDiagnosis.confidence}%
Risk Level: ${openaiDiagnosis.riskLevel}
Evidence: ${openaiDiagnosis.evidence.join('; ')}
Code Changes: ${JSON.stringify(openaiDiagnosis.proposedFix.codeChanges, null, 2)}

## XAI DIAGNOSIS
Root Cause: ${xaiDiagnosis.rootCause}
Proposed Fix Type: ${xaiDiagnosis.proposedFix.type}
Confidence: ${xaiDiagnosis.confidence}%
Risk Level: ${xaiDiagnosis.riskLevel}
Evidence: ${xaiDiagnosis.evidence.join('; ')}
Code Changes: ${JSON.stringify(xaiDiagnosis.proposedFix.codeChanges, null, 2)}

## CROSS-REVIEWS
OpenAI agrees with xAI: ${openaiReview.agrees}
OpenAI concerns: ${openaiReview.concerns?.join('; ') || 'None'}

xAI agrees with OpenAI: ${xaiReview.agrees}
xAI concerns: ${xaiReview.concerns?.join('; ') || 'None'}

## CONTEXT
${JSON.stringify(context.missingFields || context.payload, null, 2).substring(0, 2000)}

## YOUR DECISION
Respond with JSON:
{
  "selectedProvider": "openai" | "xai",
  "reasoning": "Why you selected this diagnosis over the other",
  "mergedFix": true | false, // Did you merge elements from both?
  "additionalInsights": ["Any insights neither AI caught"],
  "confidence": 0-100, // Your confidence in the selected fix
  "finalFix": {
    "type": "The fix type to apply",
    "targetFiles": ["Files to modify"],
    "codeChanges": [
      {
        "file": "path/to/file.ts",
        "newCode": "The code to add/modify",
        "explanation": "What this change does"
      }
    ],
    "researchStepsToRetry": ["If applicable, which research steps to retry"]
  }
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON from Claude's response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response');
      }

      const result = JSON.parse(jsonMatch[0]);
      logger.info(`Claude selected ${result.selectedProvider} with ${result.confidence}% confidence`);

      return result;

    } catch (error) {
      logger.error('Error in Claude mediation:', error);
      
      // Fallback: select higher confidence diagnosis
      const selected = openaiDiagnosis.confidence >= xaiDiagnosis.confidence ? 'openai' : 'xai';
      const selectedDiagnosis = selected === 'openai' ? openaiDiagnosis : xaiDiagnosis;
      
      return {
        selectedProvider: selected,
        reasoning: 'Claude mediation failed - defaulting to higher confidence diagnosis',
        mergedFix: false,
        additionalInsights: [],
        finalFix: selectedDiagnosis.proposedFix,
        confidence: selectedDiagnosis.confidence
      };
    }
  }

  /**
   * Build consensus with Claude's mediation decision
   */
  private async buildConsensusWithClaude(data: {
    openaiDiagnosis: AIDiagnosis;
    xaiDiagnosis: AIDiagnosis;
    openaiReview: any;
    xaiReview: any;
    claudeMediation: {
      selectedProvider: 'openai' | 'xai';
      reasoning: string;
      mergedFix: boolean;
      additionalInsights: string[];
      finalFix: AIDiagnosis['proposedFix'];
      confidence: number;
    };
    context: any;
  }): Promise<ConsensusFix> {
    const { openaiDiagnosis, xaiDiagnosis, openaiReview, xaiReview, claudeMediation } = data;

    // With Claude as mediator, consensus is achieved if Claude's confidence is high enough
    const minConfidence = parseInt(process.env.DUAL_AI_MIN_CONFIDENCE || '70');
    const claudeApproves = claudeMediation.confidence >= minConfidence;

    // Also check that at least one of the original AIs had reasonable confidence
    const atLeastOneConfident = openaiDiagnosis.confidence >= minConfidence || xaiDiagnosis.confidence >= minConfidence;

    const agreed = claudeApproves && atLeastOneConfident;

    // Use Claude's selected/merged fix
    const selectedDiagnosis = claudeMediation.selectedProvider === 'openai' ? openaiDiagnosis : xaiDiagnosis;
    const rootCause = selectedDiagnosis.rootCause;

    // Combined confidence: weight Claude's decision heavily
    const combinedConfidence = Math.round(
      (claudeMediation.confidence * 0.5) + 
      (openaiDiagnosis.confidence * 0.25) + 
      (xaiDiagnosis.confidence * 0.25)
    );

    return {
      agreed,
      consensusRootCause: agreed ? rootCause : 'No consensus reached',
      selectedFix: {
        primary: claudeMediation.finalFix,
        systemWide: [] // Will be populated by planSystemWideFixes
      },
      combinedConfidence,
      bothAIsApprove: agreed,
      openaiDiagnosis,
      xaiDiagnosis,
      claudeMediation: {
        selectedProvider: claudeMediation.selectedProvider,
        reasoning: claudeMediation.reasoning,
        mergedFix: claudeMediation.mergedFix,
        additionalInsights: claudeMediation.additionalInsights
      },
      openaiReviewOfXAI: openaiReview,
      xaiReviewOfOpenAI: xaiReview
    };
  }

  /**
   * Gather all relevant context for AI analysis
   */
  private async gatherDiagnosticContext(issue: DetectedIssue) {
    const context: any = {
      payload: issue.rawPayload,
      response: issue.currentResponse,
      missingFields: issue.missingFields,
      errorLogs: issue.errorLogs,
      relevantCode: {},
      schemas: {},
      picklists: {},
      recentSimilarFailures: []
    };

    // Load relevant code files based on issue type
    try {
      // Always load field inference logic
      const inferenceCode = await fs.readFile(
        path.join(process.cwd(), 'src/services/smart-field-inference.service.ts'),
        'utf-8'
      );
      context.relevantCode.fieldInference = this.extractRelevantSections(inferenceCode, ['FIELD_ALIASES', 'inferFieldName']);

      // Load picklist matcher
      const picklistCode = await fs.readFile(
        path.join(process.cwd(), 'src/services/picklist-matcher.service.ts'),
        'utf-8'
      );
      context.relevantCode.picklistMatcher = this.extractRelevantSections(picklistCode, ['matchAttribute', 'calculateSimilarity']);

      // Load category-specific schema if available
      const category = issue.rawPayload?.product_information?.category || issue.currentResponse?.category;
      if (category) {
        context.schemas.category = await this.loadCategorySchema(category);
      }

      // Load relevant picklists
      context.picklists.brands = await this.loadPicklist('brands');
      context.picklists.categories = await this.loadPicklist('categories');
      context.picklists.attributes = await this.loadPicklist('attributes');

    } catch (error) {
      logger.warn('Error gathering context:', error);
    }

    return context;
  }

  /**
   * OpenAI (GPT-4o) independent analysis
   */
  private async analyzeWithOpenAI(issue: DetectedIssue, context: any): Promise<AIDiagnosis> {
    const prompt = this.buildDiagnosticPrompt(issue, context, 'openai');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a senior software engineer with expertise in TypeScript, AI systems, and data verification. Analyze code issues methodically and provide precise fix recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      aiProvider: 'openai',
      rootCause: result.rootCause,
      evidence: result.evidence || [],
      proposedFix: result.proposedFix,
      systemScanRecommendations: result.systemScanRecommendations || {
        filesToScan: [],
        patternsToLookFor: [],
        expectedAdditionalFixes: 0
      },
      confidence: result.confidence || 0,
      riskLevel: result.riskLevel || 'medium',
      reasoningChain: result.reasoningChain || []
    };
  }

  /**
   * xAI (Grok-2) independent analysis
   */
  private async analyzeWithXAI(issue: DetectedIssue, context: any): Promise<AIDiagnosis> {
    const prompt = this.buildDiagnosticPrompt(issue, context, 'xai');

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a senior software engineer with expertise in TypeScript, AI systems, and data verification. Analyze code issues methodically and provide precise fix recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
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
      rootCause: result.rootCause,
      evidence: result.evidence || [],
      proposedFix: result.proposedFix,
      systemScanRecommendations: result.systemScanRecommendations || {
        filesToScan: [],
        patternsToLookFor: [],
        expectedAdditionalFixes: 0
      },
      confidence: result.confidence || 0,
      riskLevel: result.riskLevel || 'medium',
      reasoningChain: result.reasoningChain || []
    };
  }

  /**
   * OpenAI reviews xAI's diagnosis
   */
  private async openAIReviewsXAI(xaiDiagnosis: AIDiagnosis, context: any) {
    const reviewPrompt = `You are reviewing another AI's CODE DEBUGGING diagnosis.

**CRITICAL REVIEW CRITERIA:**
✅ Did xAI identify a CODE/LOGIC bug that prevented smart contextual mapping?
✅ Is the fix making our system CONTEXT-AWARE (not just adding data)?
✅ Will this extract ALL relevant data from compound values?
✅ Does the fix respect our schema (only maps to Primary + TOP15 fields)?
✅ Is the system-wide scan comprehensive enough?

❌ REJECT if xAI suggested: adding picklist entries, creating new schema fields, adding field aliases
✅ APPROVE if xAI suggested: contextual content analysis, multi-field extraction, semantic understanding

**SPECIFIC CHECKS:**
1. Does fix enable extraction from compound values? ("Satin Black" → color + finish)
2. Does fix validate target fields exist in category schema before mapping?
3. Does fix prevent creating fields not in our TOP15 + primary attributes?
4. Will fix work for similar patterns? (dimensions, specs, compound attributes)

**xAI's Diagnosis:**
Root Cause: ${xaiDiagnosis.rootCause}
Proposed Fix: ${JSON.stringify(xaiDiagnosis.proposedFix, null, 2)}
Confidence: ${xaiDiagnosis.confidence}%
Risk: ${xaiDiagnosis.riskLevel}

**Context:**
${JSON.stringify(context, null, 2)}

**Review Questions:**
1. Did xAI correctly identify a CODE bug preventing contextual mapping?
2. Does the fix add INTELLIGENCE not DATA?
3. Will the fix extract data from compound values correctly?
4. Does fix validate against category TOP15 + primary fields only?
5. Are there other mappers that lack contextual awareness?

Return JSON:
{
  "agrees": true/false,
  "concerns": [
    "Still suggesting data fixes instead of intelligent mapping",
    "Didn't validate extraction against category schema",
    "Fix creates new fields not in TOP15 list",
    "Missing compound value parsing (dimensions, specs, multi-attributes)"
  ],
  "suggestions": [
    "Add contextual content analyzer for all field types",
    "Validate extracted fields against category.top15Fields before mapping",
    "Add multi-field extraction for compound values",
    "Scan all mappers for missing semantic understanding"
  ],
  "alternativeApproach": "if you disagree, what contextual mapping logic would you add?",
  "confidence": 0-100,
  "isCodeFix": true/false,
  "addsContextualIntelligence": true/false,
  "respectsSchemaConstraints": true/false,
  "systemWideImpact": "low|medium|high"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: reviewPrompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * xAI reviews OpenAI's diagnosis
   */
  private async xAIReviewsOpenAI(openaiDiagnosis: AIDiagnosis, context: any) {
    const reviewPrompt = `You are reviewing another AI's CODE DEBUGGING diagnosis.

**OpenAI's Diagnosis:**
Root Cause: ${openaiDiagnosis.rootCause}
Proposed Fix: ${JSON.stringify(openaiDiagnosis.proposedFix, null, 2)}
Confidence: ${openaiDiagnosis.confidence}%
Risk: ${openaiDiagnosis.riskLevel}

**Context:**
${JSON.stringify(context, null, 2)}

**CRITICAL REVIEW CRITERIA:****
✅ Did OpenAI identify a CODE/LOGIC bug that prevented smart contextual mapping?
✅ Is the fix making our system CONTEXT-AWARE (not just adding data)?
✅ Will this extract ALL relevant data from compound values?
✅ Does the fix respect our schema (only maps to Primary + TOP15 fields)?
✅ Is the system-wide scan comprehensive enough?

❌ REJECT if OpenAI suggested: adding picklist entries, creating new schema fields, adding field aliases
✅ APPROVE if OpenAI suggested: contextual content analysis, multi-field extraction, semantic understanding

**SPECIFIC CHECKS:**
1. Does fix enable extraction from compound values? ("Satin Black" → color + finish)
2. Does fix validate target fields exist in category schema before mapping?
3. Does fix prevent creating fields not in our TOP15 + primary attributes?
4. Will fix work for similar patterns? (dimensions, specs, compound attributes)

**Review Questions:**
1. Did OpenAI correctly identify a CODE bug preventing contextual mapping?
2. Does the fix add INTELLIGENCE not DATA?
3. Will the fix extract data from compound values correctly?
4. Does fix validate against category TOP15 + primary fields only?
5. Are there other mappers that lack contextual awareness?

Return JSON:
{
  "agrees": true/false,
  "concerns": [
    "Still suggesting data fixes instead of intelligent mapping",
    "Didn't validate extraction against category schema",
    "Fix creates new fields not in TOP15 list",
    "Missing compound value parsing (dimensions, specs, multi-attributes)"
  ],
  "suggestions": [
    "Add contextual content analyzer for all field types",
    "Validate extracted fields against category.top15Fields before mapping",
    "Add multi-field extraction for compound values",
    "Scan all mappers for missing semantic understanding"
  ],
  "alternativeApproach": "if you disagree, what contextual mapping logic would you add?",
  "confidence": 0-100,
  "isCodeFix": true/false,
  "addsContextualIntelligence": true/false,
  "respectsSchemaConstraints": true/false,
  "systemWideImpact": "low|medium|high"
}`;

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: reviewPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.xaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content || '{}');
  }

  /**
   * Plan system-wide fixes to prevent recurrence
   */
  private async planSystemWideFixes(consensus: ConsensusFix, _context: any): Promise<Array<{ file: string; changes: string; reason: string }>> {
    const systemWideFixes: Array<{ file: string; changes: string; reason: string }> = [];

    const primaryFix = consensus.selectedFix.primary;

    // Combine both AIs' scan recommendations
    const allFilesToScan = [
      ...consensus.openaiDiagnosis.systemScanRecommendations.filesToScan,
      ...consensus.xaiDiagnosis.systemScanRecommendations.filesToScan
    ];

    const uniqueFiles = [...new Set(allFilesToScan)];

    // For each recommended file, plan fixes
    for (const file of uniqueFiles) {
      if (primaryFix.type === 'add_alias') {
        systemWideFixes.push({
          file,
          changes: 'Add all variations of alias: manufacturer → brand, mfr → brand, maker → brand, producer → brand',
          reason: 'Prevent similar alias misses for other variations of the same field'
        });
      } else if (primaryFix.type === 'update_schema') {
        systemWideFixes.push({
          file,
          changes: 'Check all schemas in this category family for similar missing attributes',
          reason: 'Ensure all related categories have consistent attribute coverage'
        });
      } else if (primaryFix.type === 'fix_parsing') {
        systemWideFixes.push({
          file,
          changes: 'Update regex/parsing logic to handle all known format variations',
          reason: 'Make parser robust to all input formats, not just the failing case'
        });
      }
    }

    return systemWideFixes;
  }

  /**
   * Build diagnostic prompt for AI analysis
   */
  private buildDiagnosticPrompt(issue: DetectedIssue, context: any, _aiProvider: 'openai' | 'xai'): string {
    return `You are a senior software engineer debugging a dual-AI product verification system.

**CRITICAL: YOUR MISSION**
You are debugging CODE that failed to intelligently map valid input to our schema fields.
DO NOT suggest adding data to picklists or creating new schema fields.
DO suggest fixing the logic/code that failed to understand CONTEXT and map data intelligently.

**CORE PRINCIPLES:**
1. We ONLY map to: Primary attributes + Category TOP15 attributes (never create new fields)
2. Context matters MORE than exact field name matching
3. One source field can map to MULTIPLE target fields if context indicates it
4. Smart inference: "Material: Satin Black" → Color: Black + Finish: Satin

**DEBUGGING MINDSET:**
1. Why did our code FAIL to understand the CONTEXT of valid input?
2. Did we miss a multi-field mapping opportunity? (e.g., "30x20x15" → width, depth, height)
3. Is field inference too literal? (matching "Material" field name vs understanding content)
4. How do we fix the CODE to be context-aware and extract ALL relevant data?

**EXAMPLES OF GOOD DIAGNOSES:**
✅ "Field inference only maps 1:1 field names - should analyze CONTENT contextually"
✅ "Missed 'Material: Satin Black' = color + finish - need multi-field extraction logic"
✅ "Dimensions '30x20x15' not parsed - should extract width/depth/height from pattern"
✅ "Only checking field name match, ignoring semantic content analysis"
✅ "No logic to split compound values into multiple target fields"

**EXAMPLES OF BAD DIAGNOSES:**
❌ "Add 'Material' field to schema" (we don't create new fields)
❌ "Missing data in picklist" (data fix, not code fix)
❌ "Schema doesn't have field" (missing the context mapping issue)
❌ "Add more aliases" (band-aid, doesn't fix smart inference)

**SYSTEM OVERVIEW:**
- Stack: Node.js/TypeScript, Express, MongoDB
- Purpose: Verify product catalogs with OpenAI GPT-4o + xAI Grok-2
- Integration: Salesforce webhook-based verification

**ISSUE DETECTED:**
Type: ${issue.issueType}
Severity: ${issue.severity}
Affected Jobs: ${issue.affectedCount}
Missing Fields: ${issue.missingFields.join(', ')}

**ORIGINAL REQUEST PAYLOAD (Valid Input That We Failed To Process):**
\`\`\`json
${JSON.stringify(issue.rawPayload, null, 2)}
\`\`\`

**CURRENT RESPONSE (Our Code Failed To Populate These Fields):**
\`\`\`json
${JSON.stringify(issue.currentResponse, null, 2)}
\`\`\`

**RELEVANT CODE (Find The Bug Here):**
\`\`\`typescript
// Field Inference Service
${context.relevantCode.fieldInference || 'Not loaded'}

// Picklist Matcher
${context.relevantCode.picklistMatcher || 'Not loaded'}
\`\`\`

**CATEGORY SCHEMA:**
\`\`\`json
${JSON.stringify(context.schemas.category, null, 2)}
\`\`\`

**ERROR LOGS:**
${issue.errorLogs.join('\n')}

**YOUR TASK:**
Debug the CODE failure. Find why smart contextual mapping didn't happen.

**CRITICAL VALIDATION RULES:**
1. ✅ We ONLY map to existing schema fields (Primary + Category TOP15 attributes)
2. ✅ NEVER create new fields or suggest adding fields to schema
3. ✅ Context-aware mapping: "Material: Satin Black" → extract Color + Finish
4. ✅ Multi-field extraction: "30x20x15 inches" → Width + Depth + Height
5. ✅ Semantic understanding over literal field name matching
6. ✅ If source has relevant data for our fields, we MUST extract it

**RESPOND WITH JSON:**
{
  "rootCause": "SPECIFIC code/logic error that prevented contextual mapping (not 'missing data')",
  "evidence": [
    "Line 145: Field inference only does 1:1 field name matching",
    "No logic to analyze content semantically",
    "Missed 'Material: Satin Black' contains color AND finish data",
    "'Dimensions: 30x20x15' not parsed into width/depth/height fields",
    "Field mapper skips fields when name doesn't exact-match our schema"
  ],
  "proposedFix": {
    "type": "fix_logic" | "add_contextual_mapping" | "fix_parsing" | "add_multi_field_extraction",
    "targetFiles": ["field-inference.service.ts", "attribute-mapper.service.ts"],
    "codeChanges": [
      {
        "file": "field-inference.service.ts",
        "lineNumbers": "145-180",
        "oldCode": "if (sourceFieldName === targetFieldName) { map(value); }",
        "newCode": "// Step 1: Try exact field name match\\nif (sourceFieldName === targetFieldName) { map(value); }\\n\\n// Step 2: Contextual content analysis\\nconst extractedFields = analyzeContentContext(fieldName, value);\\nfor (const {targetField, extractedValue} of extractedFields) {\\n  if (isValidTopFieldForCategory(targetField)) {\\n    map(targetField, extractedValue);\\n  }\\n}\\n\\nfunction analyzeContentContext(name, value) {\\n  // Example: 'Material: Satin Black' → [{field:'color',value:'Black'}, {field:'finish',value:'Satin'}]\\n  // Example: 'Dimensions: 30x20x15' → [{field:'width',value:'30'}, {field:'depth',value:'20'}, {field:'height',value:'15'}]\\n  return contextualFieldExtractor.extract(name, value, categoryTop15Fields);\\n}",
        "explanation": "Add contextual content analysis to extract multiple fields from compound values based on semantic understanding, not just field name matching"
      }
    ]
  },
  "systemScanRecommendations": {
    "filesToScan": [
      "All field mapping services",
      "All attribute extraction logic",
      "All parsers that process raw product data",
      "Category-specific field inference"
    ],
    "patternsToLookFor": [
      "1:1 field name matching only",
      "No semantic content analysis",
      "Skipping fields when name doesn't match",
      "Missing multi-value extraction (dimensions, specs, compound attributes)"
    ],
    "expectedAdditionalFixes": 8
  },
  "confidence": 90,
  "riskLevel": "medium",
  "reasoningChain": [
    "1. Input has 'Material: Satin Black' - valid data for our Color + Finish fields",
    "2. Current code only checks if 'Material' === 'Color' or 'Material' === 'Finish' (both false)",
    "3. Code skips the field because name doesn't match",
    "4. This is a LOGIC ERROR - code lacks contextual intelligence",
    "5. Fix: Add semantic content analyzer that understands 'Satin Black' contextually",
    "6. Analyzer should extract: color='Black', finish='Satin' from compound value",
    "7. Validate: Only map to fields that exist in category's TOP15 + primary attributes",
    "8. Scan: All mappers probably lack this contextual awareness",
    "9. This fix enables extraction of ALL relevant data, even when field names differ"
  ]
}`;
  }

  /**
   * Extract relevant code sections
   */
  private extractRelevantSections(code: string, keywords: string[]): string {
    const lines = code.split('\n');
    const relevantLines: string[] = [];
    let inRelevantSection = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line contains any keyword
      if (keywords.some(kw => line.includes(kw))) {
        inRelevantSection = true;
        braceCount = 0;
      }

      if (inRelevantSection) {
        relevantLines.push(lines[i]);
        
        // Track braces to know when section ends
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount <= 0 && line.includes('}')) {
          inRelevantSection = false;
        }
      }
    }

    return relevantLines.join('\n');
  }

  /**
   * Load category schema
   */
  private async loadCategorySchema(category: string): Promise<any> {
    try {
      // Map category to schema file (simplified - you may need better mapping)
      const schemaMap: any = {
        'Chandelier': 'lighting-schemas.ts',
        'Bathtub': 'plumbing-schemas.ts',
        'Refrigerator': 'appliance-schemas.ts',
        'Dishwasher': 'appliance-schemas.ts'
      };

      const schemaFile = schemaMap[category];
      if (!schemaFile) return null;

      const schemaPath = path.join(process.cwd(), 'src/config/schemas', schemaFile);
      const content = await fs.readFile(schemaPath, 'utf-8');
      
      // Extract the relevant schema (this is simplified - you may need better parsing)
      return { file: schemaFile, content: content.substring(0, 2000) };
    } catch (error) {
      return null;
    }
  }

  /**
   * Load picklist data
   */
  private async loadPicklist(type: string): Promise<any> {
    try {
      const picklistPath = path.join(process.cwd(), `src/config/salesforce-picklists/${type}.json`);
      const content = await fs.readFile(picklistPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Return first 50 items to avoid token limits
      return Array.isArray(data) ? data.slice(0, 50) : data;
    } catch (error) {
      return [];
    }
  }
}

export default new DualAIDiagnostician();
