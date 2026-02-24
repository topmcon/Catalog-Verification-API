# Dependency Checklist

## Purpose
This document ensures that when you modify picklists, schemas, or core logic, ALL dependent files are updated to maintain consistency across the codebase.

---

## 🚨 CRITICAL DEPENDENCIES MAP

### 1. When Updating Picklist JSON Files
**Location**: `src/config/salesforce-picklists/*.json`

| Changed File | Must Also Update | Why |
|--------------|------------------|-----|
| `categories.json` | • `title-schema-by-category.ts`<br>• `master-category-schema-map.ts`<br>• `category-aliases.ts`<br>• Run: `regenerate-hardcoded-lists.js` | Categories drive title generation, schema mapping, and hardcoded category lists |
| `types.json` | • `category-type-mapping.json`<br>• `type-matcher.service.ts` (if new keywords)<br>• `dual-ai-verification.service.ts` (AI prompts)<br>• `title-generator.service.ts` (if refrigerator/range/fan types) | Types must be mapped to categories and AI needs prompt examples |
| `styles.json` | • `dual-ai-verification.service.ts` (AI prompts)<br>• `style-validator.service.ts` (if validation rules)<br>• Run: `regenerate-hardcoded-lists.js` | Styles need validation rules and may need prompt examples |
| `brands.json` | • Run: `regenerate-hardcoded-lists.js` | Brand lists regenerated automatically |
| `category-type-mapping.json` | • `type-matcher.service.ts` (keyword mappings)<br>• `dual-ai-verification.service.ts` (AI type guides)<br>• `title-generator.service.ts` (configurations list)<br>• `category-attributes.ts` (filter descriptions) | Adding types requires keywords, AI guidance, and title templates |

---

### 2. When Updating Title Schemas
**Location**: `src/config/title-schema-by-category.ts`

| Change Type | Must Also Update | Why |
|-------------|------------------|-----|
| Add new category schema | • `master-category-schema-map.ts`<br>• Run: `quick-pre-deploy-check.sh` | Ensure 100% category coverage |
| Change slot attributes | • `category-attributes.ts` (if filter attributes)<br>• `title-generator.service.ts` (if new extractors needed) | Keep filter attributes in sync with title slots |
| Add capacity/dimension slots | • `seo-title-generator.service.ts` (if extraction logic needed) | Ensure title generator can populate new slots |

---

### 3. When Updating AI Verification Logic
**Location**: `src/services/dual-ai-verification.service.ts`

| Change Type | Must Also Update | Why |
|-------------|------------------|-----|
| Add new primary field | • Smart resolution passes (lines ~2557, ~2856)<br>• `buildConsensus()` attribute builders | Ensure smart resolution saves to correct location |
| Change type validation | • `type-matcher.service.ts` (keyword mappings)<br>• `category-type-mapping.json` (valid types) | Keep validation rules and picklists aligned |
| Add category-specific prompts | • `title-schema-by-category.ts` (seoNotes)<br>• `category-attributes.ts` (configuration examples) | Documentation should match AI guidance |

---

### 4. When Updating Type Matching
**Location**: `src/services/type-matcher.service.ts`

| Change Type | Must Also Update | Why |
|-------------|------------------|-----|
| Add keyword mappings | • `category-type-mapping.json` (ensure type exists)<br>• `types.json` (ensure type exists in master list) | Keywords must map to valid types |
| Change fallback logic | • `dual-ai-verification.service.ts` (AI prompts should reduce fallbacks) | AI should be guided to return correct types |

---

### 5. When Updating Hardcoded Constants
**Location**: `src/config/constants.ts`, `src/services/*.service.ts` (hardcoded arrays)

| Change Type | Must Also Update | How to Sync |
|-------------|------------------|-------------|
| Category lists | Run: `regenerate-hardcoded-lists.js` | Auto-regenerates from categories.json |
| Style lists | Run: `regenerate-hardcoded-lists.js` | Auto-regenerates from styles.json |
| Type lists | • `title-generator.service.ts` (REFRIGERATOR_CONFIGURATIONS, etc.)<br>• `category-attributes.ts` (configuration examples) | Manual updates - no auto-regen script yet |

---

## 🔍 VALIDATION SCRIPTS

### Before Every Deployment - Run These:

```bash
# 1. Validate picklist field names
node scripts/audit-picklist-fields.js

# 2. Check hardcoded lists are in sync
node scripts/regenerate-hardcoded-lists.js --check

# 3. Verify schema coverage and compilation
bash scripts/quick-pre-deploy-check.sh

# 4. Run dependency validator (comprehensive check)
bash scripts/validate-dependencies.sh
```

### After Picklist Changes:

```bash
# Regenerate ALL hardcoded lists from source picklists
node scripts/regenerate-hardcoded-lists.js
```

---

## 📋 QUICK REFERENCE: CHANGE WORKFLOWS

### Workflow A: Adding New Category Type

**Example**: Adding "Wine Cooler", "Beverage Center", "Kegerator" to Refrigerator

✅ **Checklist:**
1. [ ] Add to `types.json` (verify ID exists)
2. [ ] Add to `category-type-mapping.json` under target category
3. [ ] Add keyword mappings to `type-matcher.service.ts`
4. [ ] Update AI prompt in `dual-ai-verification.service.ts` (typeSelectionGuide)
5. [ ] Update `title-generator.service.ts` configurations list (if applicable)
6. [ ] Update `category-attributes.ts` filter descriptions
7. [ ] Update `title-schema-by-category.ts` seoNotes
8. [ ] Run: `npm run build` (verify compilation)
9. [ ] Run: `bash scripts/validate-dependencies.sh` (verify consistency)

**Validation Command:**
```bash
bash scripts/validate-dependencies.sh --check-types Refrigerator
```

---

### Workflow B: Adding New Category

**Example**: Creating "Smart Lock" category

✅ **Checklist:**
1. [ ] Add to `categories.json` (with ID from Salesforce)
2. [ ] Create schema in `title-schema-by-category.ts`
3. [ ] Add alias in `master-category-schema-map.ts`
4. [ ] Create attribute config in `category-attributes.ts`
5. [ ] Add types to `category-type-mapping.json`
6. [ ] Add category handling in `dual-ai-verification.service.ts` (if special logic needed)
7. [ ] Run: `regenerate-hardcoded-lists.js` (updates DEPARTMENT_CATEGORIES)
8. [ ] Run: `quick-pre-deploy-check.sh` (verify 100% schema coverage)

**Validation Command:**
```bash
bash scripts/quick-pre-deploy-check.sh
```

---

### Workflow C: Modifying Smart Resolution Logic

**Example**: Adding new primary field to smart resolution

✅ **Checklist:**
1. [ ] Update BOTH smart resolution passes (lines ~2557, ~2856)
2. [ ] Verify field exists in `buildConsensus()` attribute builders
3. [ ] Check extraction logic exists in response builder
4. [ ] Run: `npm run build` (verify compilation)
5. [ ] Test with sample job

**Validation Command:**
```bash
npm run build && npm test
```

---

### Workflow D: Updating AI Prompts

**Example**: Adding guidance for new product type

✅ **Checklist:**
1. [ ] Update `dual-ai-verification.service.ts` (typeSelectionGuide or field instructions)
2. [ ] Verify corresponding types exist in `category-type-mapping.json`
3. [ ] Add keyword mappings to `type-matcher.service.ts`
4. [ ] Update documentation in `title-schema-by-category.ts` (seoNotes)
5. [ ] Run: `npm run build`

**Validation Command:**
```bash
bash scripts/validate-dependencies.sh --check-prompts
```

---

## 🤖 COPILOT QUICK COMMANDS

### During Active Work:

**"Check dependencies"** → Runs `validate-dependencies.sh` to find mismatches

**"Audit changes"** → Runs all pre-deployment checks:
- `audit-picklist-fields.js`
- `regenerate-hardcoded-lists.js --check`
- `quick-pre-deploy-check.sh`
- `validate-dependencies.sh`

**"Save everything"** → Now includes automatic dependency validation before commit

---

## 🎯 COMMON SCENARIOS

### Scenario: Salesforce Added New Type to Picklist

**When**: Salesforce syncs new type via API

**Actions**:
1. ✅ Auto-applied to `types.json` and `category-type-mapping.json` (via picklist sync)
2. ⚠️ **MANUAL REQUIRED**:
   - Add keywords to `type-matcher.service.ts`
   - Update AI prompt in `dual-ai-verification.service.ts`
   - Add to configurations in `title-generator.service.ts` (if refrigerator/range/fan)
   - Update `category-attributes.ts` examples

**Validation**: Run `validate-dependencies.sh`

---

### Scenario: Adding Custom Field to Category

**When**: Need to track new attribute (e.g., "Bottle Capacity" for Wine Cooler)

**Actions**:
1. Add to `title-schema-by-category.ts` (schema slots)
2. Add to `category-attributes.ts` (top15FilterAttributes if filterable)
3. Update AI prompt in `dual-ai-verification.service.ts` (field instructions)
4. Add extraction logic in response builder (if computed field)
5. Test with sample product

---

## 🛡️ SAFETY CHECKS

### Before Committing:
```bash
git status  # Review changed files
bash scripts/validate-dependencies.sh  # Check consistency
npm run build  # Verify compilation
```

### Before Deploying:
```bash
bash scripts/quick-pre-deploy-check.sh  # Comprehensive audit
node scripts/regenerate-hardcoded-lists.js --check  # Hardcoded lists in sync
git diff --stat  # Review all changes
```

### After Deploying:
```bash
curl -s https://verify.cxc-ai.com/health  # API health
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -50 /opt/catalog-verification-api/logs/combined.log"  # Check for errors
```

---

## 📝 UPDATED "SAVE EVERYTHING" PROCEDURE

**Enhanced Step 2 - Pre-Deployment Audit**:

```bash
# A. Check what type of changes were made
git status --short

# B. Run appropriate audits based on change patterns:

# If picklist JSONs changed:
node scripts/audit-picklist-fields.js

# If type-matcher or dual-ai-verification changed:
node scripts/regenerate-hardcoded-lists.js --check

# If title-schema-by-category changed:
bash scripts/quick-pre-deploy-check.sh

# C. Run comprehensive dependency validator:
bash scripts/validate-dependencies.sh

# D. If ANY audit fails:
#    - Fix all issues
#    - Re-run audits
#    - Document fixes in session summary

# E. Only proceed to commit if ALL audits pass ✅
```

---

## 🎬 EXAMPLE SESSION

**User**: "Add Wine Cooler, Beverage Center, Kegerator to Refrigerator types"

**Copilot**:
1. ✅ Updates `category-type-mapping.json` (adds 3 types)
2. ✅ Updates `type-matcher.service.ts` (adds keywords)
3. ✅ Updates `dual-ai-verification.service.ts` (AI prompt)
4. ✅ Updates `title-generator.service.ts` (configurations)
5. ✅ Updates `category-attributes.ts` (filter descriptions)
6. ✅ Updates `title-schema-by-category.ts` (seoNotes)
7. 🔍 Runs: `bash scripts/validate-dependencies.sh`
8. ✅ Reports: "All 6 files updated and validated"

**User**: "Save everything"

**Copilot**:
1. 🔍 **Pre-Deployment Audit**:
   ```bash
   git status --short  # Detects: M category-type-mapping.json, M type-matcher.service.ts, etc.
   bash scripts/validate-dependencies.sh  # ✅ Pass
   npm run build  # ✅ Pass
   ```
2. ✅ Creates session summary
3. ✅ Commits: "Add Wine Cooler, Beverage Center, Kegerator types to Refrigerator"
4. ✅ Pushes to GitHub
5. ✅ Deploys to production
6. ✅ Verifies sync and health

---

## 🔧 QUICK PROMPTS FOR COPILOT

### During Development:
- **"Check dependencies"** - Validates all related files are in sync
- **"Audit my changes"** - Runs all relevant validation scripts based on changed files
- **"What else needs updating?"** - Shows dependency checklist for current changes

### Before Deployment:
- **"Pre-deploy audit"** - Runs comprehensive checks (compilation, schema coverage, dependencies)
- **"Validate consistency"** - Checks hardcoded lists, imports, field names

### After Changes:
- **"Run dependency check"** - Executes `validate-dependencies.sh`
- **"Save everything"** - Includes automatic dependency validation in workflow

---

## 📊 DEPENDENCY MATRIX

| Source File | Depends On | Depended On By |
|-------------|------------|----------------|
| **categories.json** | Salesforce | title-schema-by-category.ts, master-category-schema-map.ts, category-aliases.ts, dual-ai-verification.service.ts |
| **types.json** | Salesforce | category-type-mapping.json, type-matcher.service.ts, dual-ai-verification.service.ts, title-generator.service.ts |
| **styles.json** | Salesforce | style-validator.service.ts, dual-ai-verification.service.ts |
| **brands.json** | Salesforce | category-matcher.service.ts (DEPARTMENT_CATEGORIES) |
| **category-type-mapping.json** | types.json, categories.json | dual-ai-verification.service.ts, type-matcher.service.ts, title-generator.service.ts, category-attributes.ts |
| **title-schema-by-category.ts** | categories.json | seo-title-generator.service.ts, enrichment.service.ts, dual-ai-verification.service.ts |
| **dual-ai-verification.service.ts** | All picklists | (core verification logic - used by all) |
| **type-matcher.service.ts** | types.json, category-type-mapping.json | dual-ai-verification.service.ts (type matching) |
| **title-generator.service.ts** | types.json (configurations) | seo-title-generator.service.ts, enrichment.service.ts |

---

## 🚀 INTEGRATION WITH WORKFLOWS

### "Save Everything" Procedure - Enhanced Step 2

**OLD (Before)**:
```
2. Check for uncommitted changes (git status)
3. Stage all changes (git add -A)
```

**NEW (After)**:
```
2. PRE-DEPLOYMENT AUDIT:
   A. Run git status --short
   B. Run bash scripts/validate-dependencies.sh
   C. If picklist changes: node scripts/audit-picklist-fields.js
   D. If service changes: node scripts/regenerate-hardcoded-lists.js --check
   E. If schema changes: bash scripts/quick-pre-deploy-check.sh
   F. Fix any issues and re-run audits
   G. Only proceed if ALL audits pass ✅
3. Stage all changes (git add -A)
```

---

## 🎓 LEARNING FROM THIS SESSION

**What We Discovered**:
When adding Wine Cooler, Beverage Center, Kegerator types to Refrigerator category, we needed to update:

1. ✅ `category-type-mapping.json` - Added 3 types with IDs
2. ✅ `type-matcher.service.ts` - Added 4 kegerator keyword mappings
3. ✅ `dual-ai-verification.service.ts` - Enhanced AI prompt with specialized refrigeration guidance
4. ✅ `title-generator.service.ts` - Added to REFRIGERATOR_CONFIGURATIONS array
5. ✅ `category-attributes.ts` - Updated Configuration filter description
6. ✅ `title-schema-by-category.ts` - Updated seoNotes with new type examples

**Total Files**: 6 modified across 3 directories

**Without This Checklist**: Easy to miss 3-4 of these files

**With This Checklist**: Systematic validation ensures nothing is missed

---

## 🔄 MAINTENANCE

**This Document Should Be Updated When**:
- New file dependencies are discovered
- New validation scripts are added
- Workflow procedures change
- New picklist types are introduced

**Review Frequency**: After major architecture changes or when dependencies shift

---

## 📞 WHEN THINGS GO WRONG

### Symptom: Types Showing "Not Found" Despite Schema Having Type

**Likely Cause**: Missing dependency update

**Debug Steps**:
1. Check `category-type-mapping.json` - Type exists? ✅ or ❌
2. Check `type-matcher.service.ts` - Keywords exist? ✅ or ❌
3. Check `dual-ai-verification.service.ts` - AI prompt mentions type? ✅ or ❌
4. Run: `bash scripts/validate-dependencies.sh --verbose`

### Symptom: AI Selecting Wrong Type

**Likely Cause**: Prompt doesn't mention new type OR keyword mapping missing

**Debug Steps**:
1. Search `dual-ai-verification.service.ts` for category-specific type guidance → Found? ✅ or ❌
2. Search `type-matcher.service.ts` for product keywords → Mapped? ✅ or ❌
3. Check AI response logs for what AI actually returned
4. If AI returns correct raw value but system changes it → Type matching issue
5. If AI returns wrong value from start → Prompt engineering needed

---

## 🏆 SUCCESS CRITERIA

**All Dependencies Updated When**:
- ✅ `validate-dependencies.sh` passes with no warnings
- ✅ `quick-pre-deploy-check.sh` passes (100% schema coverage)
- ✅ `regenerate-hardcoded-lists.js --check` shows "IN SYNC"
- ✅ `npm run build` compiles with no errors
- ✅ Git diff shows all related files modified together

---

## 📚 RELATED DOCUMENTATION

- [VERIFICATION-DATA-SOURCES.md](../VERIFICATION-DATA-SOURCES.md) - Explains data flow
- [COPILOT-INSTRUCTIONS-TEMPLATE.md](../COPILOT-INSTRUCTIONS-TEMPLATE.md) - Workflow procedures
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - File organization rules

