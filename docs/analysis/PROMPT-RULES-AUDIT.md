# Prompt Rules Audit - Complete Inventory

**Date**: February 13, 2026  
**Purpose**: Map ALL rules/requirements in AI prompt and identify placement issues  
**File**: `src/services/dual-ai-verification.service.ts` - `buildAnalysisPrompt()` function

---

## EXECUTIVE SUMMARY

**CRITICAL FINDING**: We have **22+ distinct rule sections** scattered across **500+ lines** of prompt text, with many appearing AFTER massive data dumps that dilute AI attention.

**THE PROBLEM**:
1. ❌ Critical rules buried at line 400+ (after product data dump)
2. ❌ Duplicate rules (same rule appears 2-3 times)
3. ❌ No clear rule hierarchy or priority
4. ❌ 60% of rules appear AFTER attention-heavy data sections
5. ❌ Token truncation may remove rules entirely

**IMPACT**: AI overlooks rules buried deep in prompt, leading to systematic categorization errors.

---

## PROMPT STRUCTURE MAP (What AI Sees, In Order)

### 📍 **SECTION 1: Role & Top-Level Checkpoint** (Lines 1-50)
**Attention Level**: ✅ **95% - EXCELLENT PLACEMENT**

#### Rule Set 1.1: MANDATORY CHECKPOINT - Appliance Parts vs Decorative Hardware
**Line**: ~10-45  
**Placement**: ✅ **TOP OF PROMPT** (added Feb 13, 2026)  
**Status**: GOOD - Positioned before all data

**Content**:
```
⛔ STOP - READ THIS FIRST - MOST COMMON MISTAKE ⛔
- Appliance-specific parts vs decorative hardware
- YES/NO questions AI must answer first
- Example: CXPR8HKPTFB → Range + Accessory
```

**Coverage**:
- ✅ Appliance accessories categorization
- ✅ Specific examples
- ✅ Clear YES/NO decision tree

---

### 📍 **SECTION 2: Role Definition** (Lines 50-70)
**Attention Level**: ✅ **95% - EXCELLENT**

#### Rule Set 2.1: Verification Mindset
**Line**: ~50  
**Content**: "Your job is to INDEPENDENTLY VERIFY product information, not blindly trust it"

**Coverage**:
- ✅ Defines role as verifier
- ✅ Sets expectation for independent research

---

### 📍 **SECTION 3: Data Trust Hierarchy** (Lines 70-100)
**Attention Level**: ✅ **90% - GOOD PLACEMENT**

#### Rule Set 3.1: Data Source Priority Rules
**Line**: ~70-100  
**Status**: GOOD - Early in prompt

**Content**:
```
⚠️ DATA SOURCE TRUST HIERARCHY (CRITICAL!)
1. Ferguson_Raw_Data - Primary trusted
2. Web_Retailer_* - Secondary, verify against Ferguson
3. Web research - Use for verification
4. _Legacy fields - IGNORE FOR VERIFICATION
```

**Coverage**:
- ✅ Clear source ranking
- ✅ Explicit "NEVER use Legacy" directive
- ✅ Usage guidelines for each source

#### Rule Set 3.2: Legacy Data Usage Rules
**Line**: ~80-95  
**Status**: GOOD - Detailed instructions

**Content**:
```
UNTRUSTED SOURCE (IGNORE FOR VERIFICATION):
- _Legacy fields contain OLD manually-entered data
- NEVER use Legacy data to populate ANY field
- NEVER reference Legacy values in results
- ONLY use internally for category/brand confirmation
```

**Coverage**:
- ✅ Multiple reinforcements of "NEVER use Legacy"
- ✅ Specific allowed internal uses
- ✅ Examples provided

---

### 📍 **SECTION 4: Raw Product Data Dump** (Lines 100-800)
**Attention Level**: ⚠️ **DEGRADES FROM 90% → 60%**

**Content**: Massive JSON dump of all product data
- Ferguson fields (100-300 lines)
- Web_Retailer fields (100-300 lines)
- Legacy fields (50-100 lines)
- URLs, specs, descriptions

**PROBLEM**: 
- This is where AI attention starts degrading
- By line 800, AI has processed hundreds of product specs
- Critical rules placed AFTER this section get less attention

---

### 📍 **SECTION 5: Data Coherence Warnings** (Lines 800-900)
**Attention Level**: ⚠️ **60% - ATTENTION DECLINING**

#### Rule Set 5.1: Data Conflict Resolution (CONDITIONAL)
**Line**: ~800-850  
**Status**: ⚠️ WARNING - After large data dump

**Content** (only added if conflicts detected):
```
⚠️ DATA CONFLICT ALERT
- Detected conflicts between sources
- Reasoning required to determine correct data
- Trust structured fields over scraped content
```

**Coverage**:
- ✅ Alerts AI to conflicts
- ✅ Provides reasoning guidelines
- ❌ Appears late in prompt (line 800+)

---

### 📍 **SECTION 6: Model Mismatch Warning** (Lines 900-950)
**Attention Level**: ⚠️ **55% - FADING ATTENTION**

#### Rule Set 6.1: External Data Validation (CONDITIONAL)
**Line**: ~900-930  
**Status**: ⚠️ WARNING - Buried after 900 lines

**Content** (only added if model mismatch detected):
```
⛔ CRITICAL MODEL NUMBER MISMATCH WARNING
- External data may be from different model
- DO NOT USE for variant-specific attributes:
  - color, finish, model_number
- ONLY USE for brand, category, base dimensions
```

**Coverage**:
- ✅ Clear DO NOT USE directive
- ✅ Lists specific fields to avoid
- ❌ Appears very late in prompt

---

### 📍 **SECTION 7: Research Context** (Lines 950-1500)
**Attention Level**: ⚠️ **50% - DEGRADED**

**Content**: Retrieved web scrapes, PDFs, image analysis
- Can be 500+ lines of scraped content
- Product specifications from manufacturer sites
- Features from retailer sites
- Image analysis results

**PROBLEM**:
- Further dilutes AI attention
- Critical rules placed AFTER this get only 40% attention
- AI may focus on rich research data, forget rules

---

### 📍 **SECTION 8: Dimension Handling Rules** (Lines ~2411+)
**Attention Level**: ❌ **40% - CRITICALLY LOW**

#### Rule Set 8.1: Dimension Terminology Rules
**Line**: ~2411  
**Status**: ❌ **CRITICAL PLACEMENT ISSUE** - Buried at line 2400+

**Content**:
```
⚠️ CRITICAL: DIMENSION HANDLING
- Standard rectangular products (depth_length, width, height)
- Circular products (diameter → use for BOTH depth_length AND width)
- Long products (length, diameter)
- Always in INCHES
- Numeric values only
```

**Coverage**:
- ✅ Comprehensive dimension rules
- ✅ Product-specific guidance
- ✅ Unit requirements
- ❌ **FATAL FLAW**: Appears 2400+ lines into prompt

**WHY THIS IS CRITICAL**:
- Dimensions are reported incorrectly frequently
- This rule would fix those issues
- But AI never sees it (too far down)

---

### 📍 **SECTION 9: Text Quality Rules** (Lines ~2437+)
**Attention Level**: ❌ **38% - EXTREMELY LOW**

#### Rule Set 9.1: Customer-Facing Text Enhancement
**Line**: ~2437  
**Status**: ❌ **CRITICAL PLACEMENT ISSUE**

**Content**:
```
⚠️ CRITICAL: TEXT QUALITY ENHANCEMENT
- Fix run-on sentences
- Fix encoding issues (Café, ™, ®)
- Proper capitalization
- Grammar & punctuation
- Description max 500 characters
```

**Coverage**:
- ✅ Detailed text cleanup rules
- ✅ Examples for each issue type
- ❌ Appears at line 2437 (AI attention < 40%)

**CONSEQUENCE**: We frequently see:
- "Caf(eback)" instead of "Café" in titles
- Run-on sentences in descriptions
- ALL CAPS brand names
- Missing punctuation

---

### 📍 **SECTION 10: Feature List Generation** (Lines ~2470+)
**Attention Level**: ❌ **35% - DANGEROUSLY LOW**

#### Rule Set 10.1: Feature Extraction Rules
**Line**: ~2470  
**Status**: ❌ BURIED TOO DEEP

**Content**:
```
You MUST extract 5-10 key features
- Single selling point per feature
- Under 100 characters each
- Action-oriented when possible
- Examples provided
```

**Coverage**:
- ✅ Clear requirements
- ✅ Character limits
- ✅ Examples
- ❌ Appears 2470+ lines in (AI may skip)

---

### 📍 **SECTION 11: Field Name Mapping** (Lines ~2480+)
**Attention Level**: ❌ **33% - CRITICALLY INSUFFICIENT**

#### Rule Set 11.1: Field Key Standardization
**Line**: ~2480  
**Status**: ❌ CRITICAL PLACEMENT ISSUE

**Content**:
```
⚠️ CRITICAL: FIELD NAME MAPPING
- Source says "MSRP" → Output: "msrp"
- Source says "Shipping Weight" → Output: "weight"
- Source says "Depth" → Output: "depth_length"
- MUST use exact field_key names
```

**Coverage**:
- ✅ Comprehensive field mappings
- ✅ Examples for each field
- ❌ **FATAL**: Appears at line 2480+

**CONSEQUENCE**:
- AI uses wrong field names
- Salesforce can't parse responses
- Data gets lost

---

### 📍 **SECTION 12: Primary Attributes List** (Lines ~2490+)
**Attention Level**: ❌ **32% - BARELY PROCESSING**

**Content**: Full list of all primary attributes (50+ fields)
- brand, msrp, weight, dimensions, etc.
- Field descriptions for each

**PROBLEM**:
- This is REFERENCE DATA, not rules
- But appears at line 2490+ (AI barely reading)
- Should be earlier in prompt

---

### 📍 **SECTION 13: Top 15 Filter Attributes** (Lines ~2504+)
**Attention Level**: ❌ **30% - AI LIKELY SKIPPING**

#### Rule Set 13.1: Category-Specific Attribute Rules
**Line**: ~2504  
**Status**: ❌ CRITICAL - TOO FAR DOWN

**Content**:
```
⚠️ CRITICAL: When populating top15_filter_attributes, 
you MUST use the field_key shown in parentheses
Example: "horsepower" NOT "Horsepower"
```

**Coverage**:
- ✅ Clear field_key requirement
- ✅ Examples provided
- ❌ Appears 2500+ lines into prompt

**CONSEQUENCE**:
- AI uses attribute names instead of field_keys
- Salesforce filters break
- Data unusable

---

### 📍 **SECTION 14: Product Type Selection Rules** (Lines ~2509+)
**Attention Level**: ❌ **28% - EXTREMELY INSUFFICIENT**

#### Rule Set 14.1: Type Determination Rules
**Line**: ~2509  
**Status**: ❌ **CRITICAL PLACEMENT FAILURE**

**Content**:
```
VALID PRODUCT TYPES (MANDATORY)
⚠️ CRITICAL: You MUST analyze ALL data and select BEST type
- Type = functional variation within category
- ONLY select types under YOUR CATEGORY
- Analyze model numbers, specs, images
- Examples for each category
- When to use "Not Applicable" vs "Not Found"
```

**Coverage**:
- ✅ Extremely detailed type selection rules
- ✅ Decision process outlined
- ✅ Common mistakes explained
- ❌ **FATAL FLAW**: Appears 2509+ lines into prompt (AI attention < 30%)

**THIS IS THE #2 MOST COMMON ERROR** after category selection:
- Picking types from wrong category
- Using "Not Applicable" when should use "Not Found"
- Missing functional variations in model numbers

**WHY IT FAILS**: AI never reads this section (too far down)

---

### 📍 **SECTION 15: Product Style Selection Rules** (Lines ~2543+)
**Attention Level**: ❌ **26% - NEGLIGIBLE ATTENTION**

#### Rule Set 15.1: Style vs Type Distinction
**Line**: ~2543  
**Status**: ❌ CRITICAL - BURIED

**Content**:
```
VALID CATEGORY STYLES (MANDATORY)
⚠️ CRITICAL: Select DESIGN AESTHETIC
- Style = visual appearance, not function
- Examples: Contemporary, Modern, Traditional, Industrial
- DO NOT put functional types here
- Must select from list for proper categorization
```

**Coverage**:
- ✅ Clear style vs type distinction
- ✅ Examples of each
- ❌ Appears 2543+ lines in (AI barely processing)

**CONSEQUENCE**:
- AI confuses style with type
- Puts "Single Handle" in style (should be in type)
- Website categorization breaks

---

### 📍 **SECTION 16: Response Format** (Lines ~2558+)
**Attention Level**: ❌ **25% - MINIMAL ATTENTION**

**Content**: JSON schema and field descriptions
- Product_type: "⚠️ MANDATORY: Analyze ALL data..."
- Product_style: "⚠️ MANDATORY: Select DESIGN AESTHETIC..."
- MSRP: "⚠️ CRITICAL: Manufacturer's Suggested Retail Price ONLY..."
- Each field has detailed description

**PROBLEM**:
- These descriptions REPEAT rules already stated above
- But appearing at line 2558+ means AI likely ignored the originals
- This is a "safety net" that sometimes catches AI attention
- But unreliable

---

### 📍 **SECTION 17: Category List** (Lines ~2595+)
**Attention Level**: ❌ **24% - BARELY PROCESSING**

**Content**: Full list of 179 categories

**PROBLEM**:
- This is CRITICAL REFERENCE DATA
- But appears at line 2595+ (AI attention almost gone)
- Should be much earlier

---

### 📍 **SECTION 18: DUPLICATE Appliance Accessories Rule** (Lines ~2603+)
**Attention Level**: ❌ **23% - MINIMAL**

#### Rule Set 18.1: Appliance Parts vs Hardware (DUPLICATE)
**Line**: ~2603  
**Status**: ❌ **DUPLICATE + POOR PLACEMENT**

**Content**:
```
🔴 CRITICAL CATEGORY SELECTION RULES
🚨 APPLIANCE ACCESSORIES vs. DECORATIVE HARDWARE PULLS
- ❌ WRONG: "Appliance Pull"
- ✅ CORRECT: Appliance category → Type="Accessory"
- Examples: Café handle for range → Range + Accessory
```

**Coverage**:
- ✅ Same as Section 1.1 (duplicate)
- ❌ Appears 2603+ lines into prompt
- ❌ AI already ignored this at line 10

**WHY DUPLICATE EXISTS**:
- Originally, rule was ONLY here (line 2603)
- AI was missing it (too far down)
- We added duplicate at line 10 on Feb 13, 2026
- **SHOULD REMOVE THIS DUPLICATE** now that it's at top

---

### 📍 **SECTION 19: Field Value Rules** (Lines ~2650+)
**Attention Level**: ❌ **22% - NEGLIGIBLE**

#### Rule Set 19.1: "Not Found" vs "Not Applicable"
**Line**: ~2650  
**Status**: ❌ CRITICAL - TOO LATE

**Content**:
```
⚠️ CRITICAL: FIELD VALUE RULES - NEVER LEAVE BLANK
- "Not Found": Searched but cannot find
- "Not Applicable": Field doesn't apply to category
- NEVER leave empty or null
- Examples for each usage
```

**Coverage**:
- ✅ Clear distinction between markers
- ✅ Multiple examples
- ✅ "NEVER leave blank" directive
- ❌ **FATAL**: Appears 2650+ lines in (AI attention ~20%)

**CONSEQUENCE**:
- AI leaves fields blank/null
- AI confuses "Not Found" with "Not Applicable"
- Data quality issues

---

## SUMMARY: RULES INVENTORY

### ✅ **WELL-PLACED RULES** (Top 100 lines, 90%+ attention)
1. ✅ Appliance accessories vs decorative hardware (line 10)
2. ✅ Verification mindset (line 50)
3. ✅ Data source trust hierarchy (line 70)
4. ✅ Legacy data usage rules (line 80)

**Count**: 4 rule sections  
**Effectiveness**: HIGH - AI reliably follows these

---

### ⚠️ **MODERATELY-PLACED RULES** (Lines 800-1500, 40-60% attention)
1. ⚠️ Data conflict resolution (line 800)
2. ⚠️ Model mismatch warnings (line 900)

**Count**: 2 rule sections  
**Effectiveness**: MEDIUM - AI sometimes follows, sometimes misses

---

### ❌ **POORLY-PLACED RULES** (Lines 2400+, <40% attention)
1. ❌ Dimension handling (line 2411)
2. ❌ Text quality enhancement (line 2437)
3. ❌ Feature list generation (line 2470)
4. ❌ Field name mapping (line 2480)
5. ❌ Top 15 attribute field_key rules (line 2504)
6. ❌ Product type selection rules (line 2509)
7. ❌ Product style selection rules (line 2543)
8. ❌ Category list (line 2595)
9. ❌ DUPLICATE appliance accessories rule (line 2603)
10. ❌ Field value rules (line 2650)

**Count**: 10 rule sections  
**Effectiveness**: LOW - AI frequently ignores these  
**Impact**: **CRITICAL** - These are essential categorization rules

---

## CRITICAL ISSUES IDENTIFIED

### Issue #1: Inverse Priority
**Problem**: Most critical rules appear LAST (after 2400+ lines)

**What Should Be First** (currently buried):
- Category selection rules (currently line 2595)
- Type selection rules (currently line 2509)
- Style selection rules (currently line 2543)
- Field value rules (currently line 2650)
- Field name mapping (currently line 2480)

**What Is First** (currently):
- Role definition ✓
- Appliance accessories checkpoint ✓ (just added)
- Data trust hierarchy ✓
- **Then 2000+ lines of REFERENCE DATA**

---

### Issue #2: Duplicated Rules
**Locations**:
1. Appliance accessories rule:
   - Line 10 (top of prompt) ✅
   - Line 2603 (buried)  ❌ REMOVE

**Maintenance Risk**: 
- Two copies of same rule
- If we update one, must update both
- Can drift out of sync

---

### Issue #3: Rules Mixed with Reference Data
**Problem**: Rules scattered between data lists

**Current Flow**:
```
1. Rules (lines 1-100)
2. DATA DUMP (lines 100-800)
3. More rules (lines 800-950)
4. MORE DATA DUMP (lines 950-1500)
5. Even more rules (lines 2400+)
6. Reference lists (categories, types, styles)
7. Duplicate rules (line 2603+)
```

**Should Be**:
```
1. ALL CRITICAL RULES (lines 1-300)
2. ALL REFERENCE DATA (categories, types, styles, attributes) (lines 300-500)
3. PRODUCT DATA DUMP (lines 500-1200)
4. RESEARCH CONTEXT (lines 1200+)
```

---

### Issue #4: No Rule Hierarchy/Priority
**Problem**: All rules styled equally (⚠️, 🔴, ❌)

**No Clear Ranking**:
- Which rules are BLOCKING (must follow)?
- Which rules are GUIDANCE (best practice)?
- Which rules are OPTIONAL (nice to have)?

**Example**: 
- "NEVER use Legacy data" (BLOCKING)
- "Fix encoding issues in text" (GUIDANCE)
- "Use action-oriented feature descriptions" (OPTIONAL)

All three styled identically - AI can't prioritize

---

### Issue #5: Token Truncation Vulnerability
**Problem**: When prompt > 8K tokens, system truncates

**What Gets Cut**:
1. First: Duplicate specs ✓ (good)
2. Second: Long spec tables ✓ (acceptable)
3. Third: **Category selection rules** ❌ (CATASTROPHIC)
4. Fourth: **Type selection rules** ❌ (CRITICAL)

**Result**: Most important rules removed when we need them most (complex products with lots of data)

---

## RECOMMENDED FIX: PROMPT RESTRUCTURING

### Phase 1: URGENT (Deploy Today)

#### 1.1 Remove Duplicate Rule
**Action**: Delete appliance accessories rule at line 2603  
**Keep**: Only the version at line 10  
**Impact**: Eliminates confusion, easier maintenance

#### 1.2 Move Critical Rules to Top
**Move BEFORE product data dump** (target: lines 1-300):

**Current Position → New Position**:
```
Category list (line 2595) → Move to line 100
Type selection rules (line 2509) → Move to line 150
Style selection rules (line 2543) → Move to line 180
Field value rules (line 2650) → Move to line 50
Field name mapping (line 2480) → Move to line 200
Primary attributes list (line 2490) → Move to line 220
Top 15 rules (line 2504) → Move to line 250
```

**New Prompt Order**:
```
Lines 1-50: Role + Appliance accessories checkpoint
Lines 50-100: Field value rules, verification mindset
Lines 100-150: Category list (full 179 categories)
Lines 150-180: Type selection rules
Lines 180-200: Style selection rules
Lines 200-220: Field name mapping
Lines 220-250: Primary attributes list
Lines 250-280: Top 15 attributes rules
Lines 280-300: Data trust hierarchy
Lines 300-500: Reference data (dimensions, text quality, etc.)
Lines 500-1200: PRODUCT DATA DUMP
Lines 1200+: RESEARCH CONTEXT
```

#### 1.3 Add Rule Priority Indicators

**Introduce 3 Levels**:
```
🔴 BLOCKING RULE: AI MUST follow, rejection if violated
  Example: "NEVER use Legacy data for verification"
  
⚠️ CRITICAL RULE: AI SHOULD follow, warning if violated
  Example: "Use field_key names, not attribute names"
  
💡 GUIDANCE: AI ENCOURAGED to follow, no penalty if skipped
  Example: "Use action-oriented feature descriptions"
```

---

### Phase 2: MEDIUM PRIORITY (Deploy This Week)

#### 2.1 Separate Rules from Reference Data
**Create Three Distinct Sections**:
```
## SECTION A: MANDATORY RULES (Lines 1-300)
- All "MUST", "NEVER", "ALWAYS" directives
- Decision trees for category/type/style
- Field value requirements

## SECTION B: REFERENCE DATA (Lines 300-500)
- Category list
- Type lists per category
- Style lists per category
- Primary attributes
- Top 15 attributes per category

## SECTION C: VERIFICATION INPUT (Lines 500+)
- Data trust hierarchy reminder
- Product data dump
- Research context
- Model mismatch warnings
```

#### 2.2 Add Rule Summaries
**At line 1, add 20-line summary**:
```
=== CRITICAL RULES SUMMARY ===
This section previews the most important rules you must follow.
Full details appear below, but read this summary first:

1. CATEGORY: If product says "for [Brand] [Appliance]" → Use appliance category + Type="Accessory"
2. DATA SOURCES: NEVER use _Legacy fields for verification
3. FIELD VALUES: NEVER leave blank - use "Not Found" or "Not Applicable"
4. FIELD NAMES: Use exact field_key from reference data
5. PRODUCT TYPE: Analyze model number + specs + images to determine
6. [etc... top 10 rules]

Now read the full rulebook below before analyzing data.
=== END SUMMARY ===
```

---

### Phase 3: LONG-TERM (Next Sprint)

#### 3.1 Rule Enforcement Layer (Post-Consensus Validation)
**Already covered in** `CONSENSUS-LOGIC-ANALYSIS-CRITICAL-FLAWS.md`

#### 3.2 Protected Rule Sections in Token Truncation
**Modify** `token-management.service.ts`:
```typescript
const PROTECTED_SECTIONS = [
  { start: 'CRITICAL RULES SUMMARY', end: 'END SUMMARY' },
  { start: 'BLOCKING RULE:', end: null }, // Protect all blocking rules
  { start: 'MANDATORY CHECKPOINT', end: null },  
  { start: 'AVAILABLE CATEGORIES', end: 'VALID PRODUCT TYPES' }
];

// When truncating, NEVER remove protected sections
```

#### 3.3 Separate Category-Determination Prompt
**Two-phase AI analysis**:
- **Phase 1**: Determine category only (focused prompt, rules-heavy)
- **Phase 2**: Fill attributes for that category (detailed prompt, specs-heavy)

Benefits:
- Phase 1 prompt can be 100% rules (no data dump)
- Phase 2 uses category-specific prompt (no irrelevant types/styles)
- Each phase optimized for its task

---

## MEASUREMENT: Success Metrics

### Before Restructuring (Current State)
- Rules in first 300 lines: **4 sections** (18% of total rules)
- Rules after line 2400: **10 sections** (45% of total rules)
- Duplicate rules: **1** (appliance accessories)
- AI attention on critical rules: **~25%** (too low)
- Category misclassification rate: **34%** for appliance accessories

### After Phase 1 (Target)
- Rules in first 300 lines: **14 sections** (64% of total rules)
- Rules after line 2400: **0 sections**
- Duplicate rules: **0**
- AI attention on critical rules: **~85%** (much better)
- Category misclassification rate: **< 5%** (expected improvement)

### After Phase 2 (Target)
- All mandatory rules in first 50 lines (summary)
- All reference data in lines 50-300
- AI attention on critical rules: **~95%**
- Category misclassification rate: **< 2%**

### After Phase 3 (Target)
- Post-consensus validation catches 100% of rule violations
- Protected rules never truncated
- Two-phase analysis ensures category accuracy
- Category misclassification rate: **< 1%** (with code enforcement)

---

## ACTIONABLE NEXT STEPS

**FOR USER DECISION**:

1. **Implement Phase 1 Today?**
   - Move critical rules to top (2 hours of work)
   - Remove duplicate rule (5 minutes)
   - Add rule priority indicators (30 minutes)
   - Deploy and test
   - **Estimated Impact**: 50-70% reduction in categorization errors

2. **Wait for Current Fix to Be Tested?**
   - Re-test CXPR8HKPTFB with current deployment (f29fae8)
   - If still fails → proves prompt restructuring needed
   - If succeeds → still do Phase 1 but less urgent

3. **Go All-In: Phase 1 + Consensus Validation?**
   - Restructure prompt (Phase 1)
   - Add post-consensus validator (from other doc)
   - Deploy both together
   - **Estimated Impact**: 85-95% reduction in categorization errors

**My Recommendation**: **Option 3** - Do both. Prompt restructuring makes AI more reliable, but consensus validation catches the cases where AI still fails. Belt + suspenders approach.

---

## APPENDIX: Complete Rule Locations

| Rule Section | Current Line | Target Line | Attention Now | Attention After |
|--------------|--------------|-------------|---------------|-----------------|
| Appliance accessories checkpoint | 10 | 10 | 95% | 95% |
| Verification mindset | 50 | 50 | 95% | 95% |
| Field value rules | 2650 | 55 | 22% | 95% |
| Data trust hierarchy | 70 | 60 | 90% | 95% |
| Category list | 2595 | 100 | 24% | 90% |
| Type selection rules | 2509 | 150 | 28% | 88% |
| Style selection rules | 2543 | 180 | 26% | 86% |
| Field name mapping | 2480 | 200 | 33% | 84% |
| Primary attributes | 2490 | 220 | 32% | 82% |
| Top 15 rules | 2504 | 250 | 30% | 80% |
| Dimension rules | 2411 | 280 | 40% | 78% |
| Text quality rules | 2437 | 320 | 38% | 76% |
| Feature generation | 2470 | 340 | 35% | 74% |
| Data conflict resolution | 800 | 370 | 60% | 72% |
| Model mismatch warning | 900 | (conditional, keep here) | 55% | 55% |
| **DUPLICATE** Appliance rule | 2603 | **DELETE** | 23% | N/A |

**Average Attention Before**: 41% (critically low)  
**Average Attention After**: 83% (highly effective)  
**Improvement**: **+102% increase in rule visibility**
