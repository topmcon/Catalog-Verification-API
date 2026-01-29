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
