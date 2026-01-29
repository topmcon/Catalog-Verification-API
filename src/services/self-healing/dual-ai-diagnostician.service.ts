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
  aiProvider: 'openai' | 'xai' | 'claude';
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
  claudeFinalReview?: {
    decision: 'approve_consensus' | 'approve_openai' | 'approve_xai' | 'independent_solution' | 'escalate';
    reasoning: string[];
    independentResearch?: {
      conducted: boolean;
      findings: string[];
      alternativeSolution?: AIDiagnosis['proposedFix'];
    };
    finalDeploymentPlan: {
      approved: boolean;
      safetyChecks: string[];
      rollbackPlan: string;
      deploymentSteps: string[];
    };
  };
}

class DualAIDiagnostician {
  private openai: OpenAI;
  private xaiApiKey: string;
  private anthropic: any; // Will be Anthropic client

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.xaiApiKey = process.env.XAI_API_KEY || '';
    
    // Initialize Anthropic (Claude)
    if (process.env.ANTHROPIC_API_KEY) {
      // Lazy load to avoid import if not needed
      const Anthropic = require('@anthropic-ai/sdk');
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Main entry point: Analyze issue with both AIs and build consensus
   */
  async diagnoseWithConsensus(issue: DetectedIssue): Promise<ConsensusFix | null> {
    try {
      logger.info(`Starting tri-AI diagnosis (OpenAI + xAI → Claude judges) for job ${issue.jobId}`);

      // STEP 1: Gather all context
      const context = await this.gatherDiagnosticContext(issue);

      // STEP 2: Independent parallel analysis - OpenAI and xAI work independently
      logger.info(`🤖 OpenAI + xAI analyzing independently in parallel...`);
      const [openaiDiagnosis, xaiDiagnosis] = await Promise.all([
        this.analyzeWithOpenAI(issue, context),
        this.analyzeWithXAI(issue, context)
      ]);

      logger.info(`Independent analysis complete:`);
      logger.info(`  OpenAI: ${openaiDiagnosis.confidence}% confidence - ${openaiDiagnosis.rootCause}`);
      logger.info(`  xAI: ${xaiDiagnosis.confidence}% confidence - ${xaiDiagnosis.rootCause}`);

      // STEP 3: Claude reviews both analyses and makes final consensus decision
      logger.info(`🧠 Claude reviewing both analyses and making final decision...`);
      const claudeJudgment = await this.claudeReviewAndJudge({
        issue,
        context,
        openaiDiagnosis,
        xaiDiagnosis
      });

      // Check Claude's decision
      if (claudeJudgment.decision === 'escalate' || !claudeJudgment.approved) {
        logger.warn(`❌ Claude rejected consensus for job ${issue.jobId}. Escalating to human.`);
        logger.warn(`  Decision: ${claudeJudgment.decision}`);
        logger.warn(`  Reasoning: ${claudeJudgment.reasoning.join('; ')}`);
        return null;
      }

      // Build consensus object from Claude's judgment
      const consensus: ConsensusFix = {
        agreed: true,
        consensusRootCause: claudeJudgment.consensusRootCause,
        selectedFix: {
          primary: claudeJudgment.selectedFix,
          systemWide: []
        },
        combinedConfidence: claudeJudgment.confidence,
        bothAIsApprove: claudeJudgment.bothAnalystsAgree,
        openaiDiagnosis,
        xaiDiagnosis,
        openaiReviewOfXAI: { agrees: true, concerns: [], suggestions: [] },
        xaiReviewOfOpenAI: { agrees: true, concerns: [], suggestions: [] },
        claudeFinalReview: claudeJudgment as any
      };

      // STEP 4: System-wide scanning for similar issues
      logger.info(`✅ Claude approved! Planning system-wide fixes...`);
      const systemWideFixes = await this.planSystemWideFixes(consensus, context);
      consensus.selectedFix.systemWide = systemWideFixes;

      logger.info(`✅ Tri-AI consensus achieved! Decision: ${claudeJudgment.decision}`);
      logger.info(`   Confidence: ${claudeJudgment.confidence}%`);
      logger.info(`   Root cause: ${claudeJudgment.consensusRootCause}`);

      return consensus;

    } catch (error) {
      logger.error('Error in tri-AI diagnosis:', error);
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
          content: `You are an expert software engineer (Analyst #1) providing independent code analysis.

CRITICAL ANALYSIS RULES:
1. Focus on CONTEXTUAL/SEMANTIC understanding, not exact string matching
2. Analyze the SUBSTANCE and MEANING of the data/code, not just literal field names
3. Look for PATTERNS and INTENT, not just exact matches
4. Consider that "Material: Satin Black" contextually contains COLOR and FINISH information
5. Understand that fields can have different names but same semantic meaning
6. Your analysis will be reviewed by a senior architect alongside another analyst
7. Be thorough, independent, and provide clear reasoning chains`
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
   * xAI (Grok-3) independent analysis
   */
  private async analyzeWithXAI(issue: DetectedIssue, context: any): Promise<AIDiagnosis> {
    const prompt = this.buildDiagnosticPrompt(issue, context, 'xai');

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: `You are an expert software engineer (Analyst #2) providing independent code analysis.

CRITICAL ANALYSIS RULES:
1. Focus on CONTEXTUAL/SEMANTIC understanding, not exact string matching
2. Analyze the SUBSTANCE and MEANING of the data/code, not just literal field names  
3. Look for PATTERNS and INTENT, not just exact matches
4. Consider that data can be expressed differently but have same semantic meaning
5. Understand compound values contain multiple extractable fields
6. Your analysis will be reviewed by a senior architect alongside another analyst
7. Be thorough, independent, and provide clear reasoning chains`
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
   * Claude reviews both OpenAI and xAI analyses and makes final consensus decision
   * Acts as expert judge synthesizing both perspectives
   */
  private async claudeReviewAndJudge(params: {
    issue: DetectedIssue;
    context: any;
    openaiDiagnosis: AIDiagnosis;
    xaiDiagnosis: AIDiagnosis;
  }): Promise<{
    decision: 'approve' | 'escalate';
    approved: boolean;
    consensusRootCause: string;
    selectedFix: AIDiagnosis['proposedFix'];
    confidence: number;
    bothAnalystsAgree: boolean;
    reasoning: string[];
  }> {
    const { issue, openaiDiagnosis, xaiDiagnosis } = params;

    if (!this.anthropic) {
      logger.warn('Claude API not configured, defaulting to OpenAI analysis');
      return {
        decision: 'approve',
        approved: true,
        consensusRootCause: openaiDiagnosis.rootCause,
        selectedFix: openaiDiagnosis.proposedFix,
        confidence: openaiDiagnosis.confidence,
        bothAnalystsAgree: false,
        reasoning: ['Claude not available - using OpenAI analysis']
      };
    }

    const reviewPrompt = `You are a senior engineering architect reviewing code fix proposals from two expert AI analysts.

**YOUR ROLE:**
Review both analyses, identify areas of agreement/disagreement, and make the FINAL DECISION on:
1. Whether the diagnoses are correct
2. Which fix to deploy (or create your own)
3. Whether it's safe to proceed or escalate to human

**CRITICAL GUIDELINES:**
- Focus on CONTEXTUAL/SEMANTIC understanding, not exact string matching
- Two different descriptions of the SAME root cause should be recognized as agreement
- Example: "missing color extraction" and "color field not mapped" = SAME ISSUE
- You have final authority - you can approve, modify, or reject both analyses
- Escalate only if genuinely risky or both analysts are clearly wrong

**ISSUE DETAILS:**
Type: ${issue.issueType}
Severity: ${issue.severity}
Missing Fields: ${issue.missingFields.join(', ')}
Affected Jobs: ${issue.affectedCount}

**OPENAI ANALYSIS (${openaiDiagnosis.aiProvider}, ${openaiDiagnosis.confidence}% confidence):**
Root Cause: ${openaiDiagnosis.rootCause}
Evidence: ${openaiDiagnosis.evidence.join('; ')}
Proposed Fix: ${JSON.stringify(openaiDiagnosis.proposedFix, null, 2)}
Risk Level: ${openaiDiagnosis.riskLevel}
Reasoning: ${openaiDiagnosis.reasoningChain.join(' → ')}

**XAI ANALYSIS (${xaiDiagnosis.aiProvider}, ${xaiDiagnosis.confidence}% confidence):**
Root Cause: ${xaiDiagnosis.rootCause}
Evidence: ${xaiDiagnosis.evidence.join('; ')}
Proposed Fix: ${JSON.stringify(xaiDiagnosis.proposedFix, null, 2)}
Risk Level: ${xaiDiagnosis.riskLevel}
Reasoning: ${xaiDiagnosis.reasoningChain.join(' → ')}

**YOUR TASK:**
Analyze both diagnoses and provide your FINAL JUDGMENT.

Respond with JSON:
{
  "decision": "approve" | "escalate",
  "approved": true/false,
  "consensusRootCause": "your synthesized understanding of the actual root cause",
  "selectedFix": {
    "type": "the fix type you choose",
    "targetFiles": ["files to modify"],
    "codeChanges": [{"file": "...", "explanation": "...", "newCode": "..."}]
  },
  "confidence": 0-100,
  "bothAnalystsAgree": true/false (based on SEMANTIC analysis, not exact wording),
  "semanticAgreement": "describe what they agree on contextually",
  "semanticDisagreement": "describe what they differ on in substance",
  "reasoning": [
    "Why you made this decision",
    "What you agreed/disagreed with from each analyst",
    "Why this fix is safe or why escalation is needed"
  ]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.2, // Lower temperature for consistent judging
        system: 'You are a senior engineering architect and final decision-maker. Your judgment is authoritative.',
        messages: [
          {
            role: 'user',
            content: reviewPrompt
          }
        ]
      });

      const textContent = response.content.find((c: any) => c.type === 'text');
      const judgment = JSON.parse(textContent?.text || '{}');

      logger.info(`Claude judgment: ${judgment.decision} (${judgment.confidence}% confidence)`);
      logger.info(`  Agreement: ${judgment.bothAnalystsAgree ? 'YES' : 'NO'}`);
      logger.info(`  Consensus: ${judgment.consensusRootCause}`);

      return judgment;

    } catch (error: any) {
      logger.error('Error in Claude review:', error);
      // Fallback: use higher confidence analysis
      const selected = openaiDiagnosis.confidence >= xaiDiagnosis.confidence ? openaiDiagnosis : xaiDiagnosis;
      return {
        decision: 'approve',
        approved: true,
        consensusRootCause: selected.rootCause,
        selectedFix: selected.proposedFix,
        confidence: selected.confidence,
        bothAnalystsAgree: false,
        reasoning: [`Claude error: ${error.message}`, 'Using highest confidence analysis']
      };
    }
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
  private buildDiagnosticPrompt(issue: DetectedIssue, context: any, _aiProvider: 'openai' | 'xai' | 'claude'): string {
    return `You are a senior software engineer debugging a dual-AI product verification system.

**CRITICAL: YOUR MISSION**
Determine if missing fields are due to:
A) CODE/LOGIC FAILURE (extraction bug, mapping error, processing failure) → MUST FIX
B) LEGITIMATELY NOT FOUND after exhaustive search of all available resources → OK

**AVAILABLE RESOURCES TO EXTRACT DATA:**
1. Raw Salesforce payload (all incoming fields)
2. Specification tables (structured data)
3. Product descriptions and titles (rich text)
4. Ferguson attributes (competitor data)
5. Document URLs (PDFs, manuals, spec sheets)
6. Image URLs (product photos)
7. Web searches (manufacturer sites, retailer listings, review sites)
8. Brand/model cross-reference databases

**CRITICAL QUESTION:**
For each missing field: "Could this data be extracted from ANY of the above resources with better code?"
- If YES → This is a CODE BUG that must be fixed
- If NO (truly doesn't exist anywhere) → Legitimate not-found

**CORE PRINCIPLES:**
1. We ONLY map to: Primary attributes + Category TOP15 attributes (never create new fields)
2. Context matters MORE than exact field name matching
3. One source field can map to MULTIPLE target fields if context indicates it
4. Smart inference: "Material: Satin Black" → Color: Black + Finish: Satin
5. EXHAUSTIVE extraction: Try ALL resources before declaring "not found"

**DEBUGGING MINDSET:**
1. Did our code CHECK ALL available resources? (payload, specs, docs, images, web)
2. Did we miss multi-field mapping? ("30x20x15" → width, depth, height)
3. Is field inference too literal? (matching field name vs understanding content)
4. Did we try web search if data missing from payload?
5. Did we analyze documents/images if URLs provided?
6. How do we fix CODE to be exhaustive and context-aware?

**EXAMPLES OF CODE BUGS TO FIX:**
✅ "Didn't check specification table for dimensions - add spec table parser"
✅ "Missed 'Material: Satin Black' = color + finish - add multi-field extraction"
✅ "No web search fallback when payload missing - add search integration"
✅ "Ignored document URLs - add PDF extraction logic"
✅ "Field inference only 1:1 names - add semantic content analysis"
✅ "Dimensions '30x20x15' not parsed - add pattern recognition"

**EXAMPLES OF LEGITIMATE NOT-FOUND (No Code Change):**
✅ "Searched payload, specs, docs, web - product genuinely lacks this attribute"
✅ "Manufacturer doesn't publish this spec for this product line"
✅ "Field not applicable to this product category"

**EXAMPLES OF BAD DIAGNOSES (REJECT THESE):**
❌ "Add 'Material' field to schema" (we don't create new fields)
❌ "Missing data in picklist" (data fix, not code fix)
❌ "Schema doesn't have field" (missing the context mapping issue)
❌ "Add more aliases" (band-aid, doesn't fix smart inference)

**SYSTEM OVERVIEW:**
- Stack: Node.js/TypeScript, Express, MongoDB
- Purpose: Verify product catalogs with OpenAI GPT-4o + xAI Grok-2
- Integration: Salesforce webhook-based verification
- Research: Can perform web searches, fetch documents, analyze images

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
