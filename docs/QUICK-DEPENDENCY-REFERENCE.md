# Quick Dependency Reference Card

## 🎯 When Making Changes - Always Run This

```bash
# The ONE command that checks everything:
bash scripts/validate-dependencies.sh

# For specific category check:
bash scripts/validate-dependencies.sh --check-types Refrigerator
```

---

## 📋 CHANGE TYPE → FILES TO UPDATE

### Adding New Type to Category

**Example**: Adding "Wine Cooler" to Refrigerator

```
✅ Must Update (6 files):
1. category-type-mapping.json .......... Add type with ID
2. type-matcher.service.ts ............. Add keyword mappings
3. dual-ai-verification.service.ts ..... Update AI prompt
4. title-generator.service.ts .......... Add to configurations array
5. category-attributes.ts .............. Update filter descriptions  
6. title-schema-by-category.ts ......... Update seoNotes

✅ Validation:
bash scripts/validate-dependencies.sh --check-types Refrigerator
```

---

### Adding New Category

**Example**: Creating "Smart Lock" category  

```
✅ Must Update (5 files):
1. categories.json ..................... Add category with SF ID
2. title-schema-by-category.ts ......... Create title schema
3. master-category-schema-map.ts ....... Add alias mappings
4. category-attributes.ts .............. Define filter attributes
5. category-type-mapping.json .......... Define valid types

✅ Regenerate:
node scripts/regenerate-hardcoded-lists.js

✅ Validation:
bash scripts/quick-pre-deploy-check.sh
```

---

### Modifying Smart Resolution Logic

**Example**: Adding field to primary attributes

```
✅ Must Update (2 locations in 1 file):
1. dual-ai-verification.service.ts:
   - Line ~2557 (first smart resolution pass)
   - Line ~2856 (final smart resolution pass)

✅ Validation:
npm run build && grep -n "product_type\|your_field" src/services/dual-ai-verification.service.ts | grep 2557 && grep -n "product_type\|your_field" src/services/dual-ai-verification.service.ts | grep 2856
```

---

### Updating Picklist from Salesforce Sync

**Example**: Salesforce adds new Brand/Category/Type

```
✅ Auto-Applied To:
- categories.json / brands.json / types.json (via API sync)

✅ Must Manually Update:
- Add keywords to type-matcher.service.ts (if type change)
- Update AI prompts in dual-ai-verification.service.ts
- Add to title-generator.service.ts configurations (if applicable)

✅ Regenerate:
node scripts/regenerate-hardcoded-lists.js

✅ Validation:
bash scripts/validate-dependencies.sh
```

---

## 🤖 COPILOT COMMAND PHRASES

### During Work:
- **"Check dependencies"** → Runs `validate-dependencies.sh`
- **"Audit changes"** → Runs all validation scripts
- **"What else needs updating?"** → Shows dependency checklist for changed files

### Before Save/Deploy:
- **"Validate everything"** → Comprehensive pre-deploy audit
- **"Pre-deploy check"** → Runs quick-pre-deploy-check.sh + validate-dependencies.sh
- **"Save everything"** → Auto-includes dependency validation

---

## 🔧 MANUAL VALIDATION COMMANDS

```bash
# Full dependency check
bash scripts/validate-dependencies.sh

# Check specific category types
bash scripts/validate-dependencies.sh --check-types Refrigerator

# Verbose output
bash scripts/validate-dependencies.sh --verbose

# Hardcoded lists sync status
node scripts/regenerate-hardcoded-lists.js --check

# Schema coverage audit  
bash scripts/quick-pre-deploy-check.sh

# Picklist field names audit
node scripts/audit-picklist-fields.js

# Build verification
npm run build
```

---

## ✅ PRE-COMMIT CHECKLIST

```bash
# 1. What changed?
git status --short

# 2. Validate dependencies
bash scripts/validate-dependencies.sh

# 3. If picklist changes:
node scripts/audit-picklist-fields.js

# 4. If service logic changes:
node scripts/regenerate-hardcoded-lists.js --check

# 5. If schema changes:
bash scripts/quick-pre-deploy-check.sh

# 6. Verify compilation
npm run build

# 7. All pass? ✅ → Proceed to commit
```

---

## 🚀 INTEGRATED INTO "SAVE EVERYTHING"

The **"Save everything"** procedure now automatically:

1. ✅ Detects what type of changes were made (`git status`)
2. ✅ Runs appropriate validation scripts:
   - Picklist changes → `audit-picklist-fields.js`
   - Service changes → `regenerate-hardcoded-lists.js --check`
   - Schema changes → `quick-pre-deploy-check.sh`
   - **ALL changes** → `validate-dependencies.sh` ⭐
3. ✅ Blocks commit/deploy if ANY audit fails
4. ✅ Shows which files need fixing

**You don't need to remember the commands** - just say **"Save everything"** and validation happens automatically!

---

## 📖 FULL GUIDE

For complete dependency mapping, workflows, and troubleshooting:
→ See [DEPENDENCY-CHECKLIST.md](DEPENDENCY-CHECKLIST.md)

