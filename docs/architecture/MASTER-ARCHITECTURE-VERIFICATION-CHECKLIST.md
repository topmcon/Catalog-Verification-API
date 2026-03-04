# MASTER ARCHITECTURE VERIFICATION CHECKLIST
**Version**: 1.0  
**Created**: March 3, 2026  
**Purpose**: Living ledger for dependency tracking, change validation, and deployment verification  
**Status**: ⚠️ MANDATORY - Check this document before ANY code deployment

---

## 🗺️ VISUAL PROCESS TREES

**Looking for complete system flow diagrams?** See these documents:
- 📁 [COMPLETE-VERIFICATION-PROCESS-TREE.md](COMPLETE-VERIFICATION-PROCESS-TREE.md) - Full end-to-end tree with all 14 steps
- 📁 [../VERIFICATION-ARCHITECTURE-COMPLETE.md](../VERIFICATION-ARCHITECTURE-COMPLETE.md) - 3-stage AI verification flow
- 📁 [COMPLETE-APPLICATION-BLUEPRINT.md](COMPLETE-APPLICATION-BLUEPRINT.md) - System architecture overview

---

## 🎯 DOCUMENT PURPOSE

This document serves as your **ongoing verification ledger** to ensure:
- ✅ No dependencies are broken when files change
- ✅ All integration points are checked before deployment
- ✅ Nothing is overlooked during "Save everything" procedures
- ✅ System integrity is maintained across all changes

**When to use this checklist:**
1. ⚡ **Before deploying any code changes** - Verify dependencies
2. 🔌 **During "Establish Connection"** - Validate system state
3. 💾 **During "Save everything"** - Run pre-deployment checks
4. 🐛 **After debugging issues** - Ensure fixes didn't break dependencies

---

## 📊 QUICK CHANGE IMPACT MATRIX

Use this table to instantly identify what needs checking when you modify a file:

| If You Changed | Must Check These Files | Must Run These Scripts | Risk Level |
|----------------|----------------------|----------------------|------------|
| **Picklist JSON files** | category-matcher.service.ts<br/>brand-matcher.service.ts<br/>style-matcher.service.ts<br/>Constants with hardcoded lists | `regenerate-hardcoded-lists.js --check`<br/>`audit-picklist-fields.js` | 🔴 HIGH |
| **category-type-mapping.json** | type-matcher.service.ts<br/>dual-ai-verification.service.ts prompts<br/>title-schema-by-category.ts | `validate-dependencies.sh`<br/>`bash scripts/pre-deploy-validate-all.sh` | 🔴 HIGH |
| **category-size-classes.ts** | title-generator.service.ts<br/>seo-title-generator.service.ts<br/>title-schema-by-category.ts<br/>dual-ai-verification.service.ts | `validate-size-classes.js`<br/>`test-size-class-rounding.js` | 🟡 MEDIUM |
| **title-schema-by-category.ts** | title-generator.service.ts<br/>seo-title-generator.service.ts<br/>dual-ai-verification.service.ts | `bash scripts/pre-deploy-validate-all.sh` | 🟡 MEDIUM |
| **dual-ai-verification.service.ts** | ALL services (core file)<br/>Response structure in types | `npm run build`<br/>`bash scripts/pre-deploy-validate-all.sh` | 🔴 CRITICAL |
| **salesforce.types.ts** | ALL services using Salesforce interfaces<br/>response-builder.service.ts<br/>salesforce-verification.service.ts | `npm run build` | 🔴 HIGH |
| **Any *.service.ts** | Files importing this service<br/>Controllers using this service | `npm run build`<br/>`grep -r "import.*from.*<service-name>"` | 🟡 MEDIUM |
| **category-filter-attributes.json** | filter-attributes.service.ts<br/>dual-ai-verification.service.ts | `validate-dependencies.sh` | 🟡 MEDIUM |
| **Any AI prompt text** | No direct dependencies<br/>BUT: Test with real data | Manual testing with sample products | 🟢 LOW |

---

## 🔗 CRITICAL DEPENDENCY CHAINS

### Chain 1: Picklist System
```
Salesforce
    ↓ (sends picklist updates)
POST /api/picklists/sync
    ↓ (saves to)
src/config/salesforce-picklists/*.json
    ↓ (read by)
category-matcher.service.ts
brand-matcher.service.ts
style-matcher.service.ts
    ↓ (used by)
dual-ai-verification.service.ts
    ↓ (generates)
Verified fields sent back to Salesforce
```

**⚠️ If picklist JSON changes:**
- [ ] Run `node scripts/audit-picklist-fields.js` to verify field names
- [ ] Run `node scripts/regenerate-hardcoded-lists.js --check` to check sync
- [ ] Check if any hardcoded lists in services need updating
- [ ] Verify category-type-mapping.json includes new types
- [ ] Test with real verification request

### Chain 2: Category-Type Mapping
```
category-type-mapping.json
    ↓ (defines valid types per category)
type-matcher.service.ts
    ↓ (validates types)
dual-ai-verification.service.ts
    ↓ (includes in AI prompt)
AI analysis prompt text
    ↓ (returned by AI)
Consensus building
    ↓ (validated against)
category-type-mapping.json (circular validation)
```

**⚠️ If category-type-mapping.json changes:**
- [ ] Update type-matcher.service.ts keywords if new types added
- [ ] Update AI prompt text in dual-ai-verification.service.ts to mention new types
- [ ] Update title-schema-by-category.ts if new category needs title generation
- [ ] Run `bash scripts/validate-dependencies.sh --check-types <Category>`
- [ ] Update category-filter-attributes.json if new attributes needed
- [ ] Test with product from affected category

### Chain 3: Title Generation System
```
category-size-classes.ts (configuration)
    ↓ (provides size classes)
size-class-rounder.ts (utility)
    ↓ (used by)
title-schema-by-category.ts (FORMATTING_RULES.dimension)
    ↓ (used by)
seo-title-generator.service.ts (formatValue)
AND
title-generator.service.ts (getSizeClass)
    ↓ (both called by)
dual-ai-verification.service.ts (AI_Product_Title, AI_Product_Filter_Class)
    ↓ (generates)
Titles sent to Salesforce
```

**⚠️ If size class system changes:**
- [ ] Run `node scripts/validate-size-classes.js` to verify config
- [ ] Run `node scripts/test-size-class-rounding.js` to test rounding
- [ ] Check both title-generator.service.ts AND seo-title-generator.service.ts
- [ ] Verify FORMATTING_RULES.dimension() in title-schema-by-category.ts
- [ ] Test with products that have dimensions (refrigerators, ranges, etc.)
- [ ] Check AI_Product_Filter_Class field calculation in dual-ai-verification.service.ts

### Chain 4: Response Structure
```
salesforce.types.ts (PrimaryDisplayAttributes interface)
    ↓ (defines structure)
dual-ai-verification.service.ts (builds response)
response-builder.service.ts (builds response)
salesforce-verification.service.ts (builds response)
    ↓ (returns to)
verification.controller.ts
    ↓ (sends to)
webhook.service.ts
    ↓ (delivers to)
Salesforce
```

**⚠️ If adding/removing fields in response:**
- [ ] Update PrimaryDisplayAttributes interface in salesforce.types.ts
- [ ] Update dual-ai-verification.service.ts response builder (lines ~8000-8500)
- [ ] Update response-builder.service.ts if used
- [ ] Update salesforce-verification.service.ts if used
- [ ] Add placeholder in error response structure (lines ~700-750 in dual-ai)
- [ ] Test with Salesforce to ensure no null/undefined errors
- [ ] Update Salesforce Apex code to handle new field (external)

### Chain 5: AI Prompt System
```
dual-ai-verification.service.ts
    ↓ buildAnalysisPrompt() ~line 4376
        ↓ includes
category-type-mapping.json (type selection rules)
categories.json (category list)
styles.json (style list)
brands.json (brand list)
    ↓ (prompt structure order)
1. Role definition
2. ⛔ MANDATORY CHECKPOINT (appliance accessory rules)
3. 🔴 CRITICAL FIELD VALUE RULES
4. Data trust hierarchy
5. Product data (sanitized)
6. Category/Type/Style selection rules
7. Field-specific instructions
    ↓ (sent to)
OpenAI + xAI (parallel analysis)
    ↓ (results)
buildConsensus()
    ↓ (validates with)
validateConsensusCategory() - SAFETY NET
```

**⚠️ If modifying AI prompts:**
- [ ] Maintain prompt section order (critical for AI attention)
- [ ] Test with real products, especially edge cases (appliance accessories)
- [ ] Verify MANDATORY CHECKPOINT still at top (95% AI attention)
- [ ] Check if new picklist values mentioned in prompt
- [ ] Validate against picklist JSON files for accuracy
- [ ] Test with products that previously had confusion

---

## ✅ PRE-DEPLOYMENT VERIFICATION CHECKLIST

**Run this EVERY TIME before deploying code:**

### Phase 1: Code Quality (MANDATORY)
- [ ] **TypeScript compilation**: `npm run build` - Must show ZERO errors
- [ ] **Lint check** (if available): `npm run lint`
- [ ] **Git status**: No uncommitted changes to unrelated files
- [ ] **Tests** (if available): All unit tests passing

### Phase 2: Dependency Validation (MANDATORY for specific changes)
Run the checks that apply to your changes:

#### If Changed: Picklists (*.json in salesforce-picklists/)
- [ ] `node scripts/audit-picklist-fields.js` → ✅ PASS required
- [ ] `node scripts/regenerate-hardcoded-lists.js --check` → ✅ IN SYNC required

#### If Changed: Category-Type-Mapping or Types
- [ ] `bash scripts/validate-dependencies.sh` → ✅ 0 critical errors required
- [ ] `bash scripts/validate-dependencies.sh --check-types <Category>` for affected categories

#### If Changed: Size Class System
- [ ] `node scripts/validate-size-classes.js` → ✅ PASS required
- [ ] `node scripts/test-size-class-rounding.js` → ✅ 20/20 tests passing required

#### If Changed: Title System or Schema
- [ ] `bash scripts/pre-deploy-validate-all.sh` → ✅ All 7 checks passing required

#### If Changed: ANYTHING in src/ folder
- [ ] `bash scripts/pre-deploy-validate-all.sh` → ✅ Comprehensive validation

### Phase 3: Manual Verification (RECOMMENDED)
- [ ] Review changes: `git diff` - Ensure all changes are intentional
- [ ] Check for console.log/debug statements
- [ ] Verify no sensitive data in code
- [ ] Check imports are correct (no missing dependencies)
- [ ] Review function signatures haven't broken callers

### Phase 4: Documentation Update (if applicable)
- [ ] Update AUDIT-FINDINGS-AND-SOLUTIONS.md if fixing bugs
- [ ] Update this checklist if adding new dependencies
- [ ] Update architecture docs if changing major flows
- [ ] Update copilot-instructions.md if changing procedures

---

## 🔌 ESTABLISH CONNECTION VERIFICATION

**Run during "Establish Connection" procedure:**

### System Health Checks
```bash
# 1. SSH connectivity
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "echo connected"

# 2. Commit sync verification (all must match)
echo "=== LOCAL ===" && git log -1 --oneline
echo "=== GITHUB ===" && git ls-remote origin main | cut -c1-7
echo "=== PRODUCTION ===" && ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7"

# 3. Service health
systemctl status catalog-verification  # on production
curl -s https://verify.cxc-ai.com/health

# 4. Session analytics
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/show-session-analytics.js"

# 5. Pending picklist syncs (HOLD BUCKET)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-pending-picklist-syncs.js"
```

### Status Checklist
- [ ] ✅ SSH connectivity working
- [ ] ✅ Local = GitHub = Production commit (all must match)
- [ ] ✅ Service status: RUNNING
- [ ] ✅ API health: HEALTHY
- [ ] ✅ No critical errors in logs (last 50 lines)
- [ ] ⚠️ Pending picklist syncs reviewed (if any)
- [ ] ⚠️ Pending creation requests noted (if any)
- [ ] 📊 Session analytics reviewed

---

## 💾 SAVE EVERYTHING PROCEDURE

**Enhanced procedure with verification:**

### Step 1: Pre-Save Validation (NEW - MANDATORY)
```bash
# If ANY code changes, run comprehensive validation
if git status --short | grep -E '^\s*M.*\.(ts|js|json)$'; then
  echo "⚠️ Code changes detected - running pre-deployment validation..."
  bash scripts/pre-deploy-validate-all.sh
  
  # MUST PASS before proceeding
  if [ $? -ne 0 ]; then
    echo "❌ Validation failed - fix errors before deployment"
    exit 1
  fi
fi
```

### Step 2: Create Session Summary
- [ ] Document work completed this session
- [ ] List files modified with descriptions
- [ ] Include validation results (if code changed)
- [ ] Note current sync status
- [ ] Outline next steps

### Step 3: Stage and Commit
```bash
git status
git add -A
git commit -m "Descriptive message"
```

### Step 4: Push to GitHub
```bash
git push origin main
```

### Step 5: Deploy to Production
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && \
   git stash && \
   git pull origin main && \
   npm install && \
   npm run build && \
   systemctl restart catalog-verification"
```

### Step 6: Verify Sync (CRITICAL - ALL MUST MATCH)
```bash
LOCAL=$(git rev-parse --short HEAD)
GITHUB=$(git ls-remote origin main | cut -c1-7)
PROD=$(ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7")

echo "LOCAL: $LOCAL | GITHUB: $GITHUB | PROD: $PROD"

# All three must match
if [ "$LOCAL" = "$GITHUB" ] && [ "$GITHUB" = "$PROD" ]; then
  echo "✅ ALL SYNCED"
else
  echo "⚠️ OUT OF SYNC - DEPLOYMENT INCOMPLETE"
  exit 1
fi
```

### Step 7: Post-Deployment Validation
```bash
# Health check
curl -s https://verify.cxc-ai.com/health

# Check for errors in logs
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "tail -50 /opt/catalog-verification-api/logs/error.log"
```

### Step 8: Checklist
- [ ] ✅ Validation passed (if code changed)
- [ ] ✅ Session summary created
- [ ] ✅ All changes committed
- [ ] ✅ Pushed to GitHub
- [ ] ✅ Deployed to production
- [ ] ✅ npm install completed
- [ ] ✅ npm run build completed
- [ ] ✅ Service restarted
- [ ] ✅ ALL THREE ENVIRONMENTS SYNCED (Local = GitHub = Production)
- [ ] ✅ Health check: HEALTHY
- [ ] ✅ No new errors in logs

---

## 🗂️ FILE DEPENDENCY REFERENCE

### Core Service Files

#### dual-ai-verification.service.ts (10,158 lines)
**Dependencies IN** (files this imports):
- `salesforce.types.ts` - SalesforceIncomingProduct, PrimaryDisplayAttributes
- `category-matcher.service.ts` - category ID lookup
- `brand-matcher.service.ts` - brand ID lookup
- `style-matcher.service.ts` - style ID lookup
- `category-type-mapping.json` - type validation
- `categories.json` - category picklist
- `brands.json` - brand picklist
- `styles.json` - style picklist
- `types.json` - type picklist
- `attributes.json` - attribute picklist
- `category-filter-attributes.json` - required attributes per category
- `title-schema-by-category.ts` - title generation rules
- `seo-title-generator.service.ts` - SEO title generation
- `category-size-classes.ts` - size class configurations
- `size-class-rounder.ts` - rounding utilities
- `constants.ts` - aliases and constants

**Dependencies OUT** (files that depend on this):
- `verification.controller.ts` - calls verifyProductWithDualAI()
- `async-verification-processor.service.ts` - processes jobs
- `salesforce-callback.service.ts` - async processing

**Critical Functions**:
- `verifyProductWithDualAI()` - Main entry point (line ~1340)
- `sanitizeProductDataForAI()` - Data cleaning (line 4350)
- `buildAnalysisPrompt()` - Prompt construction (line 4376)
- `validateConsensusCategory()` - Safety net (line 4663)
- `buildConsensus()` - Consensus building (line 4760)
- `reanalyzeWithContext()` - Cross-validation (line 5748)

**Response Fields Generated** (lines 8000-8500):
- Brand_Verified, Brand_Lookup
- Category_Verified, Category_Lookup
- Product_Style_Verified, Style_Lookup
- Product_Type
- Product_Title_Verified
- AI_Product_Filter_Class ⭐ (new field)
- Color_Verified, Finish_Verified, Material_Verified
- AI_Width, AI_Height, AI_Depth_Length, AI_Weight
- Top_Filter_Attributes (array)
- Attribute_Request, Style_Request, Type_Request

#### seo-title-generator.service.ts
**Dependencies IN**:
- `title-schema-by-category.ts` - FORMATTING_RULES, categorySchemas
- `category-size-classes.ts` - getSizeClassConfig
- `size-class-rounder.ts` - roundToStandardSize

**Dependencies OUT**:
- `dual-ai-verification.service.ts` - calls generateSEOTitle()

**Critical Function**:
- `generateSEOTitle(input: SEOTitleInput)` - Main title generation
- `formatValue(attribute, value, input)` - Attribute formatting (line 280)
  - ⚠️ **CRITICAL**: Must pass category + installationType to dimension formatter

#### title-schema-by-category.ts
**Dependencies IN**:
- `category-size-classes.ts` - getSizeClassConfig
- `size-class-rounder.ts` - roundToStandardSize

**Dependencies OUT**:
- `seo-title-generator.service.ts` - imports FORMATTING_RULES
- `title-generator.service.ts` - imports categorySchemas

**Critical Exports**:
- `FORMATTING_RULES` - dimension, capacity, performance, etc.
- `categorySchemas` - title generation rules per category
- `ATTRIBUTE_FORMATTERS` - mapping of attributes to formatters

#### category-size-classes.ts
**Dependencies IN**: None (data configuration)

**Dependencies OUT**:
- `title-schema-by-category.ts` - FORMATTING_RULES.dimension()
- `title-generator.service.ts` - getSizeClass()
- `seo-title-generator.service.ts` - formatValue()
- `dual-ai-verification.service.ts` - AI_Product_Filter_Class calculation

**Critical Exports**:
- `CATEGORY_SIZE_CLASSES_BY_DEPARTMENT` - organized by department
- `CATEGORY_SIZE_CLASSES` - map by category name
- `CATEGORY_SIZE_CLASSES_BY_ID` - map by category ID
- `getSizeClassConfig(categoryIdOrName)` - main lookup function

#### size-class-rounder.ts
**Dependencies IN**: None (utility functions)

**Dependencies OUT**:
- `title-schema-by-category.ts`
- `title-generator.service.ts`
- `seo-title-generator.service.ts`
- `dual-ai-verification.service.ts`

**Critical Exports**:
- `roundToStandardSize(actualValue, config, installationType)` - Main rounding
- `formatSizeClass(value, classes)` - Display formatting
- `parseSizeClass(sizeClass)` - Parse various formats
- `isStandardSize(value, config, tolerance)` - Validation

### Configuration Files

#### salesforce.types.ts
**Critical Interface**: `PrimaryDisplayAttributes`
**Current Fields** (as of 2026-03-03):
- AI_Brand: string
- Brand_Lookup: string
- AI_Product_Category: string
- Category_Lookup: string
- AI_Product_Style: string
- Style_Lookup: string
- AI_Product_Type: string
- AI_Product_Title: string
- AI_Color: string
- AI_Finish: string
- AI_Material: string
- AI_Collection_Series: string
- AI_Width: string
- AI_Height: string
- AI_Depth_Length: string
- AI_Weight: string
- **AI_Product_Filter_Class: string** ⭐ Added 2026-03-03
- AI_MSRP: string
- AI_Description: string
- AI_Features: string
- AI_UPC_GTIN: string
- AI_Model_Number: string
- AI_Manufacturer: string
- AI_Manufacturer_Part_Number: string
- AI_Warranty: string
- AI_Certifications: string
- AI_Country_of_Origin: string
- AI_Assembly_Required: string
- AI_Returnable: string
- AI_Product_Image_URL: string
- AI_Additional_Image_URLs: string[]
- AI_Document_URLs: string[]
- AI_Installation_Guide_URL: string
- AI_Owner_Manual_URL: string
- AI_Spec_Sheet_URL: string
- AI_Video_URL: string
- AI_Ferguson_SKU: string
- AI_Ferguson_Price: string
- AI_Ferguson_Availability: string
- AI_Web_Retailer_Price: string
- AI_Web_Retailer_Availability: string

**⚠️ If modifying this interface:**
- Must update ALL services that build responses:
  - `dual-ai-verification.service.ts` (primary)
  - `response-builder.service.ts`
  - `salesforce-verification.service.ts`
- Must add placeholder in error response structures
- Must coordinate with Salesforce Apex code

---

## 🧪 VALIDATION SCRIPTS REFERENCE

### Comprehensive Validator (⭐ USE THIS FOR ALL CHANGES)
**Script**: `bash scripts/pre-deploy-validate-all.sh`  
**Purpose**: Runs all 7 validation checks in sequence  
**When**: Before EVERY deployment with code changes  
**Checks**:
1. TypeScript compilation
2. Dependency consistency (picklists, types, mappings)
3. Feature completeness (declared vs implemented)
4. Title system runtime validation
5. Title generation with sample data
6. Picklist field name validation
7. Hardcoded list sync check

**Expected Output**: ✅ All 7 checks PASS

### Individual Validators

#### 1. Feature Completeness Audit
**Script**: `node scripts/audit-declared-vs-implemented.js`  
**Checks**: Declared features are actually implemented (slot.format, etc.)  
**When**: After modifying title schemas or formatters

#### 2. Title System Comprehensive Test
**Script**: `node scripts/audit-title-system.js`  
**Checks**: All 177+ categories have title generation logic  
**When**: After modifying title-schema-by-category.ts

#### 3. Title Generation Test
**Script**: `node scripts/test-title-generation.js`  
**Checks**: Sample data produces valid titles (no undefined, correct format)  
**When**: After modifying title generation logic

#### 4. Dependency Consistency Validator
**Script**: `bash scripts/validate-dependencies.sh`  
**Checks**: Picklists, types, schemas, attributes all in sync  
**When**: After modifying picklists or type mappings  
**Advanced**: `bash scripts/validate-dependencies.sh --check-types <Category>`

#### 5. Picklist Field Validator
**Script**: `node scripts/audit-picklist-fields.js`  
**Checks**: Correct field names (brand_id, brand_name, category_id, etc.)  
**When**: After Salesforce picklist sync or manual edits

#### 6. Hardcoded Lists Sync Check
**Script**: `node scripts/regenerate-hardcoded-lists.js --check`  
**Checks**: TypeScript constants match JSON picklists  
**When**: After picklist updates  
**Affected Constants**:
- `DEPARTMENT_CATEGORIES` in category-matcher.service.ts
- `LIGHTING_CATEGORIES` in dual-ai-verification.service.ts
- `SHOWER_PLUMBING_CATEGORIES` in dual-ai-verification.service.ts
- `VALID_SHOWER_STYLES` in dual-ai-verification.service.ts
- `CATEGORY_NAME_ALIASES` in constants.ts

#### 7. Size Class Validator
**Script**: `node scripts/validate-size-classes.js`  
**Checks**: Size class configuration integrity  
**When**: After modifying category-size-classes.ts

#### 8. Size Class Rounding Tests
**Script**: `node scripts/test-size-class-rounding.js`  
**Checks**: 20+ rounding scenarios (NEAREST, EXACT, equidistant, etc.)  
**When**: After modifying size-class-rounder.ts

---

## 🚨 CRITICAL INTEGRATION POINTS

### Integration Point 1: Size Class → Title Generation
**Files Involved**:
1. `category-size-classes.ts` - Configuration
2. `size-class-rounder.ts` - Utility
3. `title-schema-by-category.ts` - FORMATTING_RULES.dimension()
4. `seo-title-generator.service.ts` - formatValue() must pass category
5. `title-generator.service.ts` - getSizeClass()
6. `dual-ai-verification.service.ts` - AI_Product_Filter_Class

**Validation**:
```bash
# Check all integration points exist
grep -r "getSizeClassConfig" src/**/*.ts  # Should show 9 matches
grep -r "roundToStandardSize" src/**/*.ts  # Should show 8 matches

# Test with sample
node scripts/test-size-class-rounding.js  # Must show 20/20 passing
```

**Known Issue**: If `seo-title-generator.service.ts` doesn't pass category to dimension formatter, size classes won't work. **CRITICAL FIX** at lines 299-314.

### Integration Point 2: Picklist Update → Matcher Services
**Files Involved**:
1. `src/config/salesforce-picklists/*.json` - Source data
2. `category-matcher.service.ts` - Reads categories.json
3. `brand-matcher.service.ts` - Reads brands.json
4. `style-matcher.service.ts` - Reads styles.json
5. Hardcoded lists in multiple services

**Validation**:
```bash
# After picklist sync from Salesforce
node scripts/audit-picklist-fields.js  # Verify structure
node scripts/regenerate-hardcoded-lists.js --check  # Check sync

# If OUT OF SYNC, regenerate:
node scripts/regenerate-hardcoded-lists.js  # Updates TypeScript constants
```

### Integration Point 3: Type Update → Multiple Services
**Files Involved**:
1. `types.json` - Source data
2. `category-type-mapping.json` - Valid types per category
3. `type-matcher.service.ts` - Type validation logic
4. `dual-ai-verification.service.ts` - AI prompt includes types

**Validation**:
```bash
# After adding new type
bash scripts/validate-dependencies.sh --check-types <Category>

# Check:
1. types.json has new type
2. category-type-mapping.json includes type for relevant categories
3. type-matcher.service.ts keywords include new type (if applicable)
4. AI prompt mentions new type (if major addition)
```

### Integration Point 4: New Field → Response Structure
**Files Involved**:
1. `salesforce.types.ts` - PrimaryDisplayAttributes interface
2. `dual-ai-verification.service.ts` - Response builder (~8000-8500)
3. `response-builder.service.ts` - Alternative response builder
4. `salesforce-verification.service.ts` - Alternative response builder

**Validation**:
```bash
# After adding field
npm run build  # TypeScript will catch missing implementations

# Manually verify:
1. Interface updated with new field
2. Field populated in main response builder
3. Field has placeholder in error response (~700-750)
4. All alternative response builders updated (if used)
```

---

## 📝 MAINTENANCE LOG

Track major changes to this checklist:

| Date | Change | Reason | Updated By |
|------|--------|--------|------------|
| 2026-03-03 | Initial creation | Needed ongoing verification ledger | GitHub Copilot |
| 2026-03-03 | Added size class integration point | Size class system deployed | GitHub Copilot |
| 2026-03-03 | Added AI_Product_Filter_Class to field list | New field deployed | GitHub Copilot |

---

## 🔄 KEEPING THIS DOCUMENT CURRENT

**This is a LIVING DOCUMENT - Update it when:**

1. ✏️ **New dependency added** → Add to dependency chains section
2. ✏️ **New field added to response** → Update field list in salesforce.types.ts section
3. ✏️ **New integration point** → Add to Critical Integration Points
4. ✏️ **New validation script created** → Add to Validation Scripts Reference
5. ✏️ **Change impacts multiple files** → Update Quick Change Impact Matrix
6. ✏️ **Bug fixed due to missing dependency** → Document in AUDIT-FINDINGS-AND-SOLUTIONS.md AND update this checklist

**Make it a habit**:
- During "Save everything" → Ask: "Should this checklist be updated?"
- After debugging → Ask: "What dependency did I miss that should be documented?"
- Before major refactoring → Review this checklist first

---

## ❓ TROUBLESHOOTING

### "I made a change and something broke - how do I find what I missed?"

1. **Check Quick Change Impact Matrix** - Did you check all required files?
2. **Check Critical Dependency Chains** - Did you follow the full chain?
3. **Run validation scripts** - Which check failed?
4. **Check AUDIT-FINDINGS-AND-SOLUTIONS.md** - Has this happened before?

### "How do I know if I need to update hardcoded lists?"

Run: `node scripts/regenerate-hardcoded-lists.js --check`
- ✅ IN SYNC → No action needed
- ❌ OUT OF SYNC → Run without --check to update

### "I added a new category - what do I need to update?"

1. ✅ `categories.json` - Add category entry
2. ✅ `category-type-mapping.json` - Add valid types for category
3. ✅ `category-filter-attributes.json` - Add required attributes (if applicable)
4. ✅ `title-schema-by-category.ts` - Add title generation rules
5. ✅ `category-size-classes.ts` - Add size classes (if has dimensions)
6. ⚠️ Test with real product from new category

### "How do I verify ALL dependencies before deployment?"

Run this single command:
```bash
bash scripts/pre-deploy-validate-all.sh
```

Must show: ✅ All 7 checks PASS

---

**END OF CHECKLIST**

*Last Updated: March 3, 2026*  
*Version: 1.0*  
*Status: Active*
