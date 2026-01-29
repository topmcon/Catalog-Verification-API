import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger';

interface DetectedIssue {
  jobId: string;
  sfCatalogId: string;
  issueType: 'missing_data' | 'mapping_failure' | 'logic_error' | 'picklist_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  missingFields: string[];
  rawPayload: any;
  currentResponse: any;
  errorLogs: string[];
  affectedCount: number;
}

interface AIDiagnosis {
  aiProvider: 'openai' | 'xai';
  rootCause: string;
  evidence: string[];
  proposedFix: {
    type: 'add_alias' | 'update_schema' | 'fix_parsing' | 'add_normalization' | 'fix_logic';
    targetFiles: string[];
    codeChanges: Array<{
      file: string;
      lineNumbers?: string;
      oldCode?: string;
      newCode: string;
      explanation: string;
    }>;
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
  private xaiApiKey: string;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.xaiApiKey = process.env.XAI_API_KEY || '';
  }

  /**
   * Main entry point: Analyze issue with both AIs and build consensus
   */
  async diagnoseWithConsensus(issue: DetectedIssue): Promise<ConsensusFix | null> {
    try {
      logger.info(`Starting dual-AI diagnosis for job ${issue.jobId}`);

      // STEP 1: Gather all context
      const context = await this.gatherDiagnosticContext(issue);

      // STEP 2A: Independent parallel analysis
      const [openaiDiagnosis, xaiDiagnosis] = await Promise.all([
        this.analyzeWithOpenAI(issue, context),
        this.analyzeWithXAI(issue, context)
      ]);

      logger.info(`Dual analysis complete - OpenAI: ${openaiDiagnosis.confidence}% confidence, xAI: ${xaiDiagnosis.confidence}% confidence`);

      // STEP 2B: Cross-review
      const openaiReview = await this.openAIReviewsXAI(xaiDiagnosis, context);
      const xaiReview = await this.xAIReviewsOpenAI(openaiDiagnosis, context);

      // STEP 2C: Build consensus
      const consensus = await this.buildConsensus({
        openaiDiagnosis,
        xaiDiagnosis,
        openaiReview,
        xaiReview,
        context
      });

      if (!consensus.agreed) {
        logger.warn(`AIs could not reach consensus on job ${issue.jobId}. Escalating to human review.`);
        return null;
      }

      // STEP 2D: System-wide scanning
      const systemWideFixes = await this.planSystemWideFixes(consensus, context);
      consensus.selectedFix.systemWide = systemWideFixes;

      logger.info(`Consensus achieved with ${consensus.combinedConfidence}% confidence. System-wide fixes: ${systemWideFixes.length}`);

      return consensus;

    } catch (error) {
      logger.error('Error in dual-AI diagnosis:', error);
      throw error;
    }
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
    const reviewPrompt = `You are reviewing another AI's diagnosis of a code issue.

**xAI's Diagnosis:**
Root Cause: ${xaiDiagnosis.rootCause}
Proposed Fix: ${JSON.stringify(xaiDiagnosis.proposedFix, null, 2)}
Confidence: ${xaiDiagnosis.confidence}%
Risk: ${xaiDiagnosis.riskLevel}

**Context:**
${JSON.stringify(context, null, 2)}

Analyze xAI's diagnosis critically:
1. Do you agree with the root cause analysis?
2. Is the proposed fix correct and complete?
3. Are there any concerns or edge cases missed?
4. Any suggestions for improvement?

Return JSON:
{
  "agrees": true/false,
  "concerns": ["concern 1", "concern 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "alternativeApproach": "if you disagree, what would you do instead?",
  "confidence": 0-100
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
    const reviewPrompt = `You are reviewing another AI's diagnosis of a code issue.

**OpenAI's Diagnosis:**
Root Cause: ${openaiDiagnosis.rootCause}
Proposed Fix: ${JSON.stringify(openaiDiagnosis.proposedFix, null, 2)}
Confidence: ${openaiDiagnosis.confidence}%
Risk: ${openaiDiagnosis.riskLevel}

**Context:**
${JSON.stringify(context, null, 2)}

Analyze OpenAI's diagnosis critically:
1. Do you agree with the root cause analysis?
2. Is the proposed fix correct and complete?
3. Are there any concerns or edge cases missed?
4. Any suggestions for improvement?

Return JSON:
{
  "agrees": true/false,
  "concerns": ["concern 1", "concern 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "alternativeApproach": "if you disagree, what would you do instead?",
  "confidence": 0-100
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
   * Build consensus from both diagnoses and reviews
   */
  private async buildConsensus(data: {
    openaiDiagnosis: AIDiagnosis;
    xaiDiagnosis: AIDiagnosis;
    openaiReview: any;
    xaiReview: any;
    context: any;
  }): Promise<ConsensusFix> {
    const { openaiDiagnosis, xaiDiagnosis, openaiReview, xaiReview } = data;

    // Check if both AIs agree on root cause
    const rootCauseSimilarity = this.calculateStringSimilarity(
      openaiDiagnosis.rootCause.toLowerCase(),
      xaiDiagnosis.rootCause.toLowerCase()
    );

    const minConfidence = parseInt(process.env.DUAL_AI_MIN_CONFIDENCE || '70');
    const bothConfident = openaiDiagnosis.confidence >= minConfidence && xaiDiagnosis.confidence >= minConfidence;
    const bothReviewsAgree = openaiReview.agrees && xaiReview.agrees;
    const rootCausesAlign = rootCauseSimilarity > 0.6;

    const agreed = bothConfident && bothReviewsAgree && rootCausesAlign;

    // Select best fix (highest combined confidence)
    const selectedFix = openaiDiagnosis.confidence >= xaiDiagnosis.confidence
      ? openaiDiagnosis.proposedFix
      : xaiDiagnosis.proposedFix;

    const combinedConfidence = Math.round((openaiDiagnosis.confidence + xaiDiagnosis.confidence) / 2);

    return {
      agreed,
      consensusRootCause: agreed ? openaiDiagnosis.rootCause : 'No consensus reached',
      selectedFix: {
        primary: selectedFix,
        systemWide: [] // Will be populated by planSystemWideFixes
      },
      combinedConfidence,
      bothAIsApprove: agreed,
      openaiDiagnosis,
      xaiDiagnosis,
      openaiReviewOfXAI: openaiReview,
      xaiReviewOfOpenAI: xaiReview
    };
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

**SYSTEM OVERVIEW:**
- Stack: Node.js/TypeScript, Express, MongoDB
- Purpose: Verify product catalogs with OpenAI GPT-4o + xAI Grok-2
- Integration: Salesforce webhook-based verification

**ISSUE DETECTED:**
Type: ${issue.issueType}
Severity: ${issue.severity}
Affected Jobs: ${issue.affectedCount}
Missing Fields: ${issue.missingFields.join(', ')}

**ORIGINAL REQUEST PAYLOAD:**
\`\`\`json
${JSON.stringify(issue.rawPayload, null, 2)}
\`\`\`

**CURRENT RESPONSE (INCOMPLETE):**
\`\`\`json
${JSON.stringify(issue.currentResponse, null, 2)}
\`\`\`

**RELEVANT CODE:**
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
Analyze this failure and provide a comprehensive diagnosis.

**RESPOND WITH JSON:**
{
  "rootCause": "Clear explanation of why this failure occurred",
  "evidence": ["evidence point 1", "evidence point 2", "evidence point 3"],
  "proposedFix": {
    "type": "add_alias" | "update_schema" | "fix_parsing" | "add_normalization" | "fix_logic",
    "targetFiles": ["file1.ts", "file2.ts"],
    "codeChanges": [
      {
        "file": "filename.ts",
        "lineNumbers": "123-145",
        "oldCode": "existing code snippet",
        "newCode": "corrected code snippet",
        "explanation": "why this change fixes the issue"
      }
    ]
  },
  "systemScanRecommendations": {
    "filesToScan": ["files that may have similar issues"],
    "patternsToLookFor": ["code patterns to search for"],
    "expectedAdditionalFixes": 3
  },
  "confidence": 85,
  "riskLevel": "low" | "medium" | "high",
  "reasoningChain": ["step 1 of analysis", "step 2", "step 3", "conclusion"]
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

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  private calculateStringSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }
}

export default new DualAIDiagnostician();
