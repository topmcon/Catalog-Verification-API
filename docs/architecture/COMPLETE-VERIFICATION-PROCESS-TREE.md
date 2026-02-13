# Complete Verification Process Tree
## End-to-End AI Verification Flow with Decision Points & Source Files

```
════════════════════════════════════════════════════════════════════════════════
                        SALESFORCE → API VERIFICATION FLOW
════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: INCOMING REQUEST FROM SALESFORCE                                    │
│ File: src/controllers/verification.controller.ts                            │
│ Route: POST /api/verify/salesforce                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION: Validate API Key                                                  │
│ File: src/middleware/auth.middleware.ts                                     │
│                                                                              │
│ ❌ Invalid → Return 401 Unauthorized                                        │
│ ✅ Valid → Continue                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: CREATE VERIFICATION JOB                                             │
│ File: src/services/async-verification-processor.service.ts                  │
│ Function: queueVerification()                                               │
│                                                                              │
│ Actions:                                                                     │
│ • Generate unique jobId (UUID)                                              │
│ • Store raw payload in database (VerificationJob model)                     │
│ • Set status: "pending"                                                     │
│ • Return 202 Accepted to Salesforce                                         │
│ • Add job to in-memory queue                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: BACKGROUND PROCESSOR PICKS UP JOB                                   │
│ File: src/services/async-verification-processor.service.ts                  │
│ Function: processQueue()                                                    │
│                                                                              │
│ Concurrency Control:                                                        │
│ • Max concurrent jobs: 100                                                  │
│ • Queue position tracking                                                   │
│ • Update status: "processing"                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION: Check Job Phase                                                   │
│ File: src/services/async-verification-processor.service.ts                  │
│ Function: executeVerification()                                             │
│                                                                              │
│ Phase 0.5 (preResearchTriggered) → Go to Pre-Research                       │
│ Phase 0.9 (tokenManagementTriggered) → Go to Token Management               │
│ Phase 1 (default) → Continue to AI Verification                             │
│ Phase 2+ → Resume from saved state                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: PARSE & SANITIZE SALESFORCE DATA                                    │
│ File: src/services/dual-ai-verification.service.ts                          │
│ Function: sanitizeProductDataForAI()                                        │
│                                                                              │
│ Input: Raw Salesforce payload                                               │
│                                                                              │
│ CRITICAL DATA SANITIZATION:                                                 │
│ ❌ Remove: Prior_Response_Data (entire field)                               │
│ ❌ Remove: AI_* prefixed fields (past outputs)                              │
│ ❌ Remove: *_Verified suffix fields                                         │
│ ❌ Remove: *_Lookup suffix fields                                           │
│                                                                              │
│ ✅ Keep: Ferguson_*, Web_Retailer_*, Legacy_*                               │
│ ✅ Keep: URLs, Model numbers, Specs, Descriptions                           │
│                                                                              │
│ WHY: Prevents circular logic where AI sees its own previous outputs         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: DUAL AI VERIFICATION - INDEPENDENT ANALYSIS                         │
│ File: src/services/dual-ai-verification.service.ts                          │
│ Function: verifyProductWithDualAI()                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
        ┌──────────────────────┐          ┌──────────────────────┐
        │ AI #1: OpenAI GPT-4o │          │ AI #2: xAI Grok      │
        │ Service: openai      │          │ Service: anthropic   │
        └──────────────────────┘          └──────────────────────┘
                    │                                   │
                    │                                   │
        ┌───────────▼──────────────────────────────────▼───────────┐
        │ SHARED: Build Analysis Prompt                            │
        │ File: dual-ai-verification.service.ts                    │
        │ Function: buildAnalysisPrompt()                          │
        │                                                           │
        │ Prompt Structure (order matters for AI attention):       │
        │                                                           │
        │ 1. Role Definition (Line ~2784)                          │
        │    "You are a product data VERIFICATION specialist..."   │
        │                                                           │
        │ 2. ⛔ MANDATORY CHECKPOINT (Line ~2788) - 95% attention  │
        │    • 4 YES/NO questions about appliance parts            │
        │    • IF YES: Use appliance category + Type=Accessory     │
        │    • Example: Café Handle for Range → NOT "Appliance Pull"│
        │    • This is #1 most common error warning                │
        │                                                           │
        │ 3. 🔴 CRITICAL FIELD VALUE RULES (Line ~2820) - 95% attention│
        │    • "Not Found" vs "Not Applicable" vs "Not Available"  │
        │    • When to use each marker                             │
        │                                                           │
        │ 4. Data Trust Hierarchy (Line ~2850)                     │
        │    • Ferguson > Web_Retailer > Research > Legacy         │
        │                                                           │
        │ 5. Model Mismatch Warnings (if applicable)               │
        │                                                           │
        │ 6. Research Context (if Phase 0.5 pre-research done)     │
        │                                                           │
        │ 7. Product Data (SANITIZED) (Line ~2881)                 │
        │    JSON.stringify(cleanProductData)                      │
        │                                                           │
        │ 8. Verification Tasks (priority order)                   │
        │    • Independent verification (search web)               │
        │    • Determine truth (compare sources)                   │
        │    • Exclude incorrect data                              │
        │    • Enrich with discovered data                         │
        │                                                           │
        │ 9. Category Selection Rules (Line ~2500+) - 30% attention│
        │    • Category list from categories.json                  │
        │    • Department mapping logic                            │
        │    • Specialty categories (lighting, shower, etc.)       │
        │                                                           │
        │ 10. Type Selection Rules (Line ~2400+)                   │
        │     • Type validation from category-type mapping         │
        │                                                           │
        │ 11. Style Selection Rules                                │
        │     • Style validation from styles.json                  │
        │                                                           │
        │ 12. Field-Specific Instructions (~22 sections total)     │
        │     • Product Title formula (60-80 chars)                │
        │     • Brand verification                                 │
        │     • Weight formatting (no "lbs" suffix)                │
        │     • Dimensions, Color, Finish instructions             │
        │     • Top 15 filter attributes logic                     │
        └──────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        ┌──────────────────────┐          ┌──────────────────────┐
        │ OpenAI Analyzes      │          │ xAI Analyzes         │
        │ Returns JSON:        │          │ Returns JSON:        │
        │ • category           │          │ • category           │
        │ • categoryConfidence │          │ • categoryConfidence │
        │ • categoryReasoning  │          │ • categoryReasoning  │
        │ • brand              │          │ • brand              │
        │ • product_type       │          │ • product_type       │
        │ • style              │          │ • style              │
        │ • All verified fields│          │ • All verified fields│
        └──────────────────────┘          └──────────────────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: BUILD CONSENSUS                                                     │
│ File: src/services/dual-ai-verification.service.ts                          │
│ Function: buildConsensus()                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION TREE: Category Consensus                                           │
│                                                                              │
│ ┌────────────────────────────────────────┐                                  │
│ │ Do OpenAI & xAI agree on Category?    │                                  │
│ └────────────────────────────────────────┘                                  │
│              │                                                               │
│      ┌───────┴───────┐                                                      │
│      ▼               ▼                                                      │
│    YES              NO                                                      │
│      │               │                                                      │
│      │               ▼                                                      │
│      │         ┌─────────────────────────────────┐                          │
│      │         │ Use Highest Confidence Score    │                          │
│      │         │ openaiConfidence >= xaiConfidence│                         │
│      │         │   ? openai : xai                │                          │
│      │         └─────────────────────────────────┘                          │
│      │               │                                                      │
│      └───────┬───────┘                                                      │
│              ▼                                                               │
│    agreedCategory assigned                                                  │
│              │                                                               │
│              ▼                                                               │
│    Track disagreement in CategoryConfusion model                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION TREE: Type Consensus                                               │
│                                                                              │
│ ┌──────────────────────────────────────────────┐                            │
│ │ Validate Type against Category mapping      │                            │
│ │ File: src/config/category-type-mapping.ts   │                            │
│ └──────────────────────────────────────────────┘                            │
│              │                                                               │
│      ┌───────┴───────┐                                                      │
│      ▼               ▼                                                      │
│  OpenAI Type      xAI Type                                                  │
│  matches valid?   matches valid?                                            │
│      │               │                                                      │
│      ▼               ▼                                                      │
│  Use if valid,    Use if valid,                                             │
│  else fallback    else fallback                                             │
│      │               │                                                      │
│      └───────┬───────┘                                                      │
│              ▼                                                               │
│    agreedType assigned                                                      │
│              │                                                               │
│              ▼                                                               │
│    Log TYPE CROSS-CONTAMINATION if neither matches                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION: Primary Attributes Consensus                                      │
│                                                                              │
│ For each field (brand, style, color, finish, material, etc.):               │
│ • If both AIs agree → Use agreed value                                      │
│ • If disagree → Use value with higher field confidence                      │
│ • Track all disagreements for analytics                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⭐ STEP 7: POST-CONSENSUS VALIDATION (CODE ENFORCEMENT)                     │
│ File: src/services/dual-ai-verification.service.ts                          │
│ Function: validateConsensusCategory()                                       │
│                                                                              │
│ THIS IS OUR SAFETY NET - CATCHES AI MISTAKES                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ VALIDATION DECISION TREE:                                                   │
│                                                                              │
│ ┌────────────────────────────────────────────────────┐                      │
│ │ RULE 1: Appliance-Specific Parts Check            │                      │
│ └────────────────────────────────────────────────────┘                      │
│              │                                                               │
│              ▼                                                               │
│ ┌────────────────────────────────────────────────────┐                      │
│ │ Q1: Is brand an appliance manufacturer?           │                      │
│ │ Check against hardcoded list:                     │                      │
│ │ GE, Café, Monogram, Whirlpool, KitchenAid,        │                      │
│ │ Samsung, LG, Bosch, Thermador, Viking, etc.       │                      │
│ │ (23 brands total)                                  │                      │
│ └────────────────────────────────────────────────────┘                      │
│              │                                                               │
│      ┌───────┴───────┐                                                      │
│      ▼               ▼                                                      │
│     NO              YES                                                     │
│      │               │                                                      │
│      │               ▼                                                      │
│      │    ┌────────────────────────────────────────┐                        │
│      │    │ Q2: Does title/description have       │                        │
│      │    │ "for [appliance]" pattern?            │                        │
│      │    │ Patterns:                              │                        │
│      │    │ • for refrigerator/fridge/range/oven  │                        │
│      │    │ • for [brand] [appliance]             │                        │
│      │    │ • refrigerator handle/knob/part       │                        │
│      │    │ • compatible with [model]             │                        │
│      │    └────────────────────────────────────────┘                        │
│      │               │                                                      │
│      │       ┌───────┴───────┐                                              │
│      │       ▼               ▼                                              │
│      │      NO              YES                                             │
│      │       │               │                                              │
│      │       │               ▼                                              │
│      │       │    ┌────────────────────────────┐                            │
│      │       │    │ Q3: Has model number?     │                            │
│      │       │    └────────────────────────────┘                            │
│      │       │               │                                              │
│      │       │       ┌───────┴───────┐                                      │
│      │       │       ▼               ▼                                      │
│      │       │      NO              YES                                     │
│      │       │       │               │                                      │
│      │       │       │               ▼                                      │
│      │       │       │    ┌──────────────────────────────────┐              │
│      │       │       │    │ Q4: Categorized as generic       │              │
│      │       │       │    │ accessory/hardware?              │              │
│      │       │       │    │ Check if category is:            │              │
│      │       │       │    │ • Appliance Pull                 │              │
│      │       │       │    │ • Refrigerator Pull              │              │
│      │       │       │    │ • Cabinet Pull/Knob              │              │
│      │       │       │    │ • Kitchen Accessory ⭐ NEW!      │              │
│      │       │       │    └──────────────────────────────────┘              │
│      │       │       │               │                                      │
│      │       │       │       ┌───────┴───────┐                              │
│      │       │       │       ▼               ▼                              │
│      │       │       │      NO              YES                             │
│      │       │       │       │               │                              │
│      │       │       │       │               ▼                              │
│      │       │       │       │    ┌─────────────────────────┐               │
│      │       │       │       │    │ ⚠️ VIOLATION DETECTED!  │               │
│      │       │       │       │    └─────────────────────────┘               │
│      │       │       │       │               │                              │
│      │       │       │       │               ▼                              │
│      │       │       │       │    ┌─────────────────────────────────┐       │
│      │       │       │       │    │ Deduce Correct Category from:   │       │
│      │       │       │       │    │ • Title keywords (refrigerator, │       │
│      │       │       │       │    │   range, oven, dishwasher, etc.)│       │
│      │       │       │       │    │ • Description content           │       │
│      │       │       │       │    │ Default: "Range"                │       │
│      │       │       │       │    └─────────────────────────────────┘       │
│      │       │       │       │               │                              │
│      │       │       │       │               ▼                              │
│      │       │       │       │    ┌─────────────────────────────────┐       │
│      │       │       │       │    │ OVERRIDE CATEGORY & TYPE:       │       │
│      │       │       │       │    │ • correctedCategory = [Appliance]│      │
│      │       │       │       │    │ • correctedType = "Accessory"   │       │
│      │       │       │       │    │                                 │       │
│      │       │       │       │    │ LOG WARNING:                    │       │
│      │       │       │       │    │ "Category rule violation        │       │
│      │       │       │       │    │  detected - correcting"         │       │
│      │       │       │       │    │ • wrongCategory                 │       │
│      │       │       │       │    │ • correctCategory               │       │
│      │       │       │       │    │ • violatedRule                  │       │
│      │       │       │       │    │ • reason                        │       │
│      │       │       │       │    └─────────────────────────────────┘       │
│      │       │       │       │               │                              │
│      └───────┴───────┴───────┴───────────────┘                              │
│                              │                                               │
│                              ▼                                               │
│                 Return ValidationResult                                      │
│                 { isValid: true/false,                                       │
│                   correctedCategory?,                                        │
│                   correctedType?,                                            │
│                   reason?,                                                   │
│                   violatedRule? }                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION: Apply Validation Corrections?                                     │
│                                                                              │
│ IF validation.isValid === false:                                            │
│   • Override consensus.agreedCategory with validation.correctedCategory     │
│   • Override consensus.agreedType with validation.correctedType             │
│   • Reload category schema for new category                                 │
│   • Log the correction                                                      │
│                                                                              │
│ ELSE:                                                                        │
│   • Keep consensus results unchanged                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION: Should Cross-Validation Run?                                      │
│                                                                              │
│ Triggers for Cross-Validation (Phase 3):                                    │
│ • Category disagreement between AIs                                         │
│ • Low category confidence (<70%)                                            │
│ • Critical field disagreements (brand, type, etc.)                          │
│ • Picklist mismatches                                                       │
│ • Data coherence warnings                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
         YES              NO (Skip to Step 9)
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 8: CROSS-VALIDATION (Phase 3)                                          │
│ File: src/services/dual-ai-verification.service.ts                          │
│ Function: reanalyzeWithContext()                                            │
│                                                                              │
│ Process:                                                                     │
│ 1. Show disagreeing AI the OTHER AI's results + reasoning                   │
│ 2. Ask to reconsider with new perspective                                   │
│ 3. Re-sanitize data (same sanitization function)                            │
│ 4. Get revised analysis                                                     │
│ 5. Build new consensus from revised results                                 │
│ 6. Run POST-CONSENSUS VALIDATION AGAIN (same validation function)           │
│ 7. Apply corrections if validation fails                                    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION: Did Cross-Validation Resolve Issues?                              │
│                                                                              │
│ Compare original vs revised consensus:                                      │
│ • Did category stabilize?                                                   │
│ • Did confidence improve?                                                   │
│ • Are critical fields now agreed?                                           │
│                                                                              │
│ Update consensus with cross-validated results                               │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 9: FIELD-BY-FIELD PROCESSING                                           │
│ File: src/services/dual-ai-verification.service.ts                          │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9.1: Category & Type Processing                                             │
│ File: src/services/category-matcher.service.ts                              │
│                                                                              │
│ • Normalize category name                                                   │
│ • Map to Salesforce category ID (categories.json)                           │
│ • Validate against picklist                                                 │
│ • Handle aliases (e.g., "Bathtub" → "Tub")                                  │
│ • Determine department from category                                        │
│                                                                              │
│ Type Processing:                                                             │
│ • Match type to category's valid types (category-type-mapping.ts)           │
│ • Generate Type_Request if type not in Salesforce picklist                  │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9.2: Brand Processing                                                       │
│ File: src/services/brand-matcher.service.ts                                 │
│                                                                              │
│ • Match brand to Salesforce picklist (brands.json)                          │
│ • Handle brand aliases/variations                                           │
│ • Fuzzy match if no exact match                                             │
│ • Map to brand_id for Salesforce                                            │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9.3: Style Processing                                                       │
│ File: src/services/style-matcher.service.ts                                 │
│                                                                              │
│ DECISION TREE:                                                               │
│                                                                              │
│ ┌────────────────────────────────────────┐                                  │
│ │ Is this a Shower category?             │                                  │
│ └────────────────────────────────────────┘                                  │
│              │                                                               │
│      ┌───────┴───────┐                                                      │
│      ▼               ▼                                                      │
│     YES              NO                                                     │
│      │               │                                                      │
│      ▼               │                                                      │
│ ┌────────────────────┐│                                                     │
│ │ Special Shower     ││                                                     │
│ │ Style Logic:       ││                                                     │
│ │                    ││                                                     │
│ │ 1. Check Ferguson  ││                                                     │
│ │    Application     ││                                                     │
│ │    field for hints ││                                                     │
│ │                    ││                                                     │
│ │ 2. Validate against││                                                     │
│ │    shower-specific ││                                                     │
│ │    styles          ││                                                     │
│ │                    ││                                                     │
│ │ 3. If ideal not in ││                                                     │
│ │    picklist →      ││                                                     │
│ │    Generate        ││                                                     │
│ │    Style_Request   ││                                                     │
│ └────────────────────┘│                                                     │
│      │               │                                                      │
│      └───────┬───────┘                                                      │
│              ▼                                                               │
│ ┌────────────────────────────────────────┐                                  │
│ │ Match to Salesforce styles picklist    │                                  │
│ │ File: styles.json                      │                                  │
│ │                                        │                                  │
│ │ • Exact match by style_name            │                                  │
│ │ • Fuzzy match if no exact              │                                  │
│ │ • Map to style_id                      │                                  │
│ └────────────────────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9.4: Product Title Generation                                               │
│ File: src/services/dual-ai-verification.service.ts                          │
│                                                                              │
│ Formula: SIZE + BRAND + STYLE + CATEGORY + COLOR + MODEL                    │
│ Target: 60-80 characters                                                    │
│                                                                              │
│ Validation:                                                                  │
│ • Remove duplicate words                                                    │
│ • Capitalize properly                                                       │
│ • Trim to reasonable length                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9.5: Top 15 Filter Attributes                                               │
│ File: src/services/filter-attributes.service.ts                             │
│                                                                              │
│ DECISION TREE:                                                               │
│                                                                              │
│ Step 1: Get category-specific attribute requirements                        │
│         File: category-filter-attributes.json                               │
│                                                                              │
│ Step 2: Extract from AI responses                                           │
│         • OpenAI filterAttributes[]                                          │
│         • xAI filterAttributes[]                                             │
│                                                                              │
│ Step 3: Extract from Ferguson/Web Retailer specs                            │
│                                                                              │
│ Step 4: Validate against attributes.json picklist                           │
│                                                                              │
│ Step 5: Prioritize and select top 15:                                       │
│         • Required attributes first (always include)                         │
│         • AI-suggested next                                                  │
│         • Source-extracted last                                              │
│         • Deduplicate                                                        │
│         • Take first 15                                                      │
│                                                                              │
│ Step 6: Generate Attribute_Request for missing attributes                   │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9.6: Weight & Dimension Validation                                          │
│                                                                              │
│ Weight:                                                                      │
│ • Must be numeric only (remove "lbs", "kg" suffixes)                        │
│ • Validate is valid number                                                  │
│                                                                              │
│ Dimensions:                                                                  │
│ • Format: Width x Depth x Height                                            │
│ • Extract from various formats                                              │
│ • Validate units                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9.7: All Other Fields Processing                                            │
│                                                                              │
│ • Color, Finish, Material                                                   │
│ • Collection, Series                                                        │
│ • URL validation                                                            │
│ • Image URL extraction                                                      │
│ • Manufacturer details                                                      │
│ • Warranty information                                                      │
│ • Certifications                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 10: ASSEMBLE FINAL RESPONSE                                            │
│ File: src/services/dual-ai-verification.service.ts                          │
│                                                                              │
│ Structure:                                                                   │
│ {                                                                            │
│   // Primary Display Attributes                                             │
│   Brand_Verified: "...",                                                    │
│   Brand_Lookup: "brand_id",                                                 │
│   Category_Verified: "...",                                                 │
│   Category_Lookup: "category_id",                                           │
│   Product_Style_Verified: "...",                                            │
│   Style_Lookup: "style_id",                                                 │
│   Product_Type: "...",                                                      │
│   Product_Title_Verified: "...",                                            │
│                                                                              │
│   // All other verified fields...                                           │
│   Color_Verified, Finish_Verified, etc.                                     │
│                                                                              │
│   // Top 15 Filter Attributes                                               │
│   Top_Filter_Attributes: [                                                  │
│     { attribute_name, attribute_value }                                     │
│   ],                                                                         │
│                                                                              │
│   // Picklist Requests (if needed)                                          │
│   Attribute_Request: "...",                                                 │
│   Style_Request: "...",                                                     │
│   Type_Request: "...",                                                      │
│                                                                              │
│   // Metadata                                                                │
│   AI_Input_Data_Source: "Dual/Ferguson/Web Retailer",                      │
│   AI_Verification_Status: "Success",                                        │
│   Processing_Time_Seconds: 123                                              │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 11: STORE ANALYTICS                                                    │
│ File: src/services/analytics.service.ts                                     │
│                                                                              │
│ Store in MongoDB:                                                            │
│ • APITracking collection (request/response metadata)                        │
│ • VerificationResult collection (full AI results)                           │
│ • CategoryConfusion collection (AI disagreements)                           │
│ • ResponseQuality collection (inconclusive responses tracking)              │
│                                                                              │
│ Metrics tracked:                                                             │
│ • Processing time                                                            │
│ • Consensus agreement percentage                                            │
│ • Field-level confidence scores                                             │
│ • Cross-validation triggers                                                 │
│ • Validation corrections                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 12: CATALOG INDEX UPDATE                                               │
│ File: src/services/catalog-index.service.ts                                 │
│                                                                              │
│ Purpose: Fast category/brand/style lookups for analytics                    │
│                                                                              │
│ Store:                                                                       │
│ • sf_catalog_id → category mapping                                          │
│ • sf_catalog_id → brand mapping                                             │
│ • sf_catalog_id → style mapping                                             │
│ • Last verification timestamp                                               │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 13: UPDATE JOB STATUS                                                  │
│ File: src/services/async-verification-processor.service.ts                  │
│                                                                              │
│ Update VerificationJob model:                                               │
│ • status: "completed"                                                       │
│ • result: { full response object }                                          │
│ • completedAt: timestamp                                                    │
│ • processingTimeMs: duration                                                │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 14: SEND WEBHOOK TO SALESFORCE                                         │
│ File: src/services/webhook.service.ts                                       │
│ Function: sendWebhookToSalesforce()                                         │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ WEBHOOK DELIVERY DECISION TREE:                                             │
│                                                                              │
│ Attempt 1: Send to Salesforce webhook URL                                   │
│            POST to webhookUrl from original request                          │
│            Payload: { success: true, data: { ...verified fields } }         │
│            Timeout: 30 seconds                                               │
│            │                                                                 │
│    ┌───────┴───────┐                                                        │
│    ▼               ▼                                                        │
│  Success          Failure                                                   │
│    │               │                                                        │
│    │               ▼                                                        │
│    │         ┌────────────────┐                                             │
│    │         │ Retry Logic:   │                                             │
│    │         │ • Wait 2 sec   │                                             │
│    │         │ • Retry (max 3)│                                             │
│    │         │ • Exponential  │                                             │
│    │         │   backoff      │                                             │
│    │         └────────────────┘                                             │
│    │               │                                                        │
│    │       ┌───────┴────────┐                                               │
│    │       ▼                ▼                                               │
│    │   Success          All Failed                                          │
│    │       │                │                                               │
│    │       │                ▼                                               │
│    │       │         ┌────────────────────┐                                 │
│    │       │         │ Log Error          │                                 │
│    │       │         │ Store failed       │                                 │
│    │       │         │ webhook in DB for  │                                 │
│    │       │         │ manual retry       │                                 │
│    │       │         └────────────────────┘                                 │
│    │       │                │                                               │
│    └───────┴────────────────┘                                               │
│                    │                                                         │
│                    ▼                                                         │
│         Update job: webhookDelivered: true/false                            │
│         Log webhook delivery details                                        │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ OPTIONAL: SELF-HEALING SYSTEM (Currently DISABLED as of Feb 5, 2026)        │
│ Files: src/services/self-healing/*.ts                                       │
│                                                                              │
│ WHY DISABLED:                                                                │
│ • 100% failure rate on Phase 3-4 (dynamic code patching)                    │
│ • Caused queue backups (39 jobs stuck)                                      │
│ • Only detected low-severity issues                                         │
│ • Original verifications had 100% Salesforce acceptance                     │
│                                                                              │
│ Previous Flow (when enabled):                                               │
│ 1. Phase 1: Issue Detection (scan completed jobs)                           │
│ 2. Phase 2: Tri-AI Diagnosis (OpenAI + xAI + Claude)                        │
│ 3. Phase 3: Multi-Attempt Fix (try to patch code)                           │
│ 4. Phase 4: Verification (re-run with fixes)                                │
│                                                                              │
│ Current State: Relies on dual-AI verification quality + validation layer    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ VERIFICATION COMPLETE                                                    │
│                                                                              │
│ Final State:                                                                 │
│ • Job status: "completed"                                                   │
│ • Webhook delivered to Salesforce                                           │
│ • Salesforce updates catalog record                                         │
│ • Analytics stored for reporting                                            │
│ • Processing time: ~2-180 seconds (varies by complexity)                    │
│                                                                              │
│ Logs:                                                                        │
│ • Combined log: /opt/catalog-verification-api/logs/combined.log             │
│ • Error log: /opt/catalog-verification-api/logs/error.log                   │
└─────────────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════════
                              CRITICAL FILES MAP
════════════════════════════════════════════════════════════════════════════════

📁 PICKLIST DATA FILES (Source of Truth from Salesforce)
├── src/config/salesforce-picklists/attributes.json (1812 attributes)
├── src/config/salesforce-picklists/brands.json (385 brands)
├── src/config/salesforce-picklists/categories.json (214 categories)
├── src/config/salesforce-picklists/styles.json (17 styles)
└── src/config/salesforce-picklists/types.json (688 types)

📁 MAPPING & CONFIGURATION FILES
├── src/config/category-type-mapping.ts (181 categories → valid types)
├── src/config/category-filter-attributes.json (required attributes per category)
├── src/config/category-style-mapping.ts (category → valid styles)
└── src/config/constants.ts (CATEGORY_NAME_ALIASES, etc.)

📁 CORE SERVICE FILES
├── src/services/dual-ai-verification.service.ts ⭐ MAIN VERIFICATION LOGIC
│   ├── sanitizeProductDataForAI() - Line 2745
│   ├── buildAnalysisPrompt() - Line 2771
│   ├── validateConsensusCategory() - Line 3055
│   ├── buildConsensus() - Line 3150
│   ├── reanalyzeWithContext() - Line 4100+
│   └── verifyProductWithDualAI() - Line 1340+
│
├── src/services/async-verification-processor.service.ts (Job queue & processing)
├── src/services/webhook.service.ts (Salesforce webhook delivery)
├── src/services/category-matcher.service.ts (Category → ID mapping)
├── src/services/brand-matcher.service.ts (Brand → ID mapping)
├── src/services/style-matcher.service.ts (Style → ID mapping + shower logic)
├── src/services/filter-attributes.service.ts (Top 15 attributes logic)
├── src/services/analytics.service.ts (MongoDB tracking)
└── src/services/catalog-index.service.ts (Fast category lookups)

📁 MODELS (MongoDB Schemas)
├── src/models/verification-job.model.ts (Job tracking)
├── src/models/api-tracking.model.ts (Request/response metadata)
├── src/models/verification-result.model.ts (Full AI results)
├── src/models/category-confusion.model.ts (AI disagreements)
├── src/models/response-quality.model.ts (Inconclusive tracking)
└── src/models/catalog-index.model.ts (Category/brand/style index)

📁 CONTROLLERS & ROUTES
├── src/controllers/verification.controller.ts (API endpoints)
├── src/routes/verification.routes.ts (Route definitions)
└── src/middleware/auth.middleware.ts (API key validation)

📁 TYPES & INTERFACES
├── src/types/salesforce.types.ts (SalesforceIncomingProduct, etc.)
└── src/types/verification.types.ts (AIAnalysisResult, ConsensusResult, etc.)


════════════════════════════════════════════════════════════════════════════════
                           KEY DECISION POINTS SUMMARY
════════════════════════════════════════════════════════════════════════════════

1. DATA SANITIZATION (Line 2780, 4123)
   ✅ Filter AI_* fields to prevent circular logic
   
2. PROMPT STRUCTURE (Line 2788)
   ✅ MANDATORY CHECKPOINT at top for 95% AI attention
   
3. CONSENSUS BUILDING (Line 3150)
   ⚙️ Categories match? YES → Use agreed | NO → Use highest confidence
   
4. POST-CONSENSUS VALIDATION (Line 3055) ⭐ SAFETY NET
   ✅ Appliance manufacturer? YES → Check "for [appliance]" pattern
   ✅ Has model number? YES → Check if misclassified as generic accessory
   ✅ Is decorative hardware category? YES → VIOLATION! Correct to appliance
   
5. CROSS-VALIDATION TRIGGER (Line 1700+)
   ⚙️ Category disagreement OR low confidence → Re-analyze with context
   
6. TYPE VALIDATION (category-type-mapping.ts)
   ⚙️ Type valid for category? NO → Fallback or generate Type_Request
   
7. STYLE VALIDATION - Shower Special Logic (style-matcher.service.ts)
   ⚙️ Is Shower category? YES → Check Ferguson Application field first
   
8. WEBHOOK DELIVERY (webhook.service.ts)
   ⚙️ Success? NO → Retry up to 3 times with exponential backoff


════════════════════════════════════════════════════════════════════════════════
```
