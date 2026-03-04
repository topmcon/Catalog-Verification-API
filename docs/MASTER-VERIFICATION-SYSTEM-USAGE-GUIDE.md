# Master Architecture Verification System - Usage Guide
**Created**: March 3, 2026  
**For**: Catalog Verification API Development Team

---

## 🗺️ VISUAL PROCESS TREES (START HERE)

**Want to see the complete system flow as a tree chart?** Check these documents:

### 1. Complete Verification Process Tree
📁 **[docs/architecture/COMPLETE-VERIFICATION-PROCESS-TREE.md](../architecture/COMPLETE-VERIFICATION-PROCESS-TREE.md)** (805 lines)
- **Full end-to-end flow** from Salesforce request → verification → response
- All 14 verification steps with decision points
- ASCII tree diagrams showing file dependencies
- Detailed function call flows

### 2. Complete Verification Architecture (with OpenAI vs xAI Analysis)
📁 **[docs/VERIFICATION-ARCHITECTURE-COMPLETE.md](../VERIFICATION-ARCHITECTURE-COMPLETE.md)**
- **3-Stage Hierarchical AI Analysis** flow diagram
- Shows parallel OpenAI/xAI execution paths
- Explains validation logic and consensus building
- Useful for debugging AI verification issues

### 3. Master Application Blueprint
📁 **[docs/architecture/COMPLETE-APPLICATION-BLUEPRINT.md](../architecture/COMPLETE-APPLICATION-BLUEPRINT.md)** (991 lines)
- Comprehensive system architecture overview
- All services, controllers, utilities documented
- Data models and database schemas

---

## 🎯 What We've Built

You now have a **comprehensive dependency tracking and verification system** that acts as your ongoing ledger to ensure no changes break the application. This system prevents the "I changed X and didn't realize Y needed updating" problem.

---

## 📁 Files Created

### 1. Master Architecture Verification Checklist
**Location**: `docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md`  
**Purpose**: Your living ledger and dependency reference  
**Size**: 850+ lines

**Contains**:
- ✅ Quick Change Impact Matrix - Instantly see what needs checking when you modify a file
- ✅ Critical Dependency Chains - Visual flow of how files depend on each other
- ✅ Pre-Deployment Verification Checklist - Step-by-step checks before deploying
- ✅ File Dependency Reference - Complete map of which files import/depend on others
- ✅ Validation Scripts Reference - All scripts with descriptions
- ✅ Integration Points - Critical code paths that must work together
- ✅ Troubleshooting Guide - How to diagnose broken dependencies

### 2. Quick Dependency Check Script
**Location**: `scripts/quick-dependency-check.sh`  
**Purpose**: Fast health check of critical dependencies  
**Runtime**: ~5 seconds

**Checks** (28 total):
- Critical file existence (services, configs, picklists)
- Integration points (imports, field definitions)
- Validation script availability
- Documentation files
- Picklist JSON structure

### 3. Updated Copilot Instructions
**Location**: `.github/copilot-instructions.md`  
**Changes**:
- "Establish Connection" procedure now references the checklist
- "Save everything" procedure now references the checklist
- Pre-deployment validation updated to use `pre-deploy-validate-all.sh`

---

## 🚀 How to Use This System

### When Making Code Changes

**Step 1**: Before you start coding, check the Quick Change Impact Matrix

```bash
# Open the checklist
code docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md

# Look up your file in the "Quick Change Impact Matrix" table
# Example: If changing "category-type-mapping.json", you'll see:
# - Must Check: type-matcher.service.ts, dual-ai-verification.service.ts, title-schema-by-category.ts
# - Must Run: validate-dependencies.sh, pre-deploy-validate-all.sh
# - Risk Level: 🔴 HIGH
```

**Step 2**: Make your changes

**Step 3**: Run quick dependency check

```bash
bash scripts/quick-dependency-check.sh
# Takes ~5 seconds
# Checks 28 critical dependencies
# Must show: ✅ ALL PASS before proceeding
```

**Step 4**: Run comprehensive validation (for code changes)

```bash
bash scripts/pre-deploy-validate-all.sh
# Takes ~30 seconds
# Runs all 7 validation checks:
# 1. TypeScript compilation
# 2. Dependency consistency
# 3. Feature completeness
# 4. Title system runtime
# 5. Title generation
# 6. Picklist fields
# 7. Hardcoded lists sync
```

**Step 5**: If all checks pass, proceed with deployment

---

### During "Establish Connection"

When you say **"Establish Connection"**, Copilot will now:

1. Follow the procedure in `.github/copilot-instructions.md`
2. Reference the checklist at `docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md`
3. Run all standard health checks
4. Report system status with checklist compliance

You can also manually reference the checklist:
```bash
# View the "Establish Connection Verification" section
code docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md
# Jump to: "🔌 ESTABLISH CONNECTION VERIFICATION"
```

---

### During "Save Everything"

When you say **"Save everything"**, Copilot will now:

1. Create session summary
2. **Run comprehensive pre-deployment validation** (if code changed)
3. Check for uncommitted changes
4. Stage, commit, push
5. Deploy to production
6. **Verify all 3 environments synced** (Local = GitHub = Production)
7. Health check
8. Report status

The procedure now automatically runs `bash scripts/pre-deploy-validate-all.sh` to catch any broken dependencies **before** deployment.

---

## 🔍 Quick Reference Commands

### Fast Health Check (5 seconds)
```bash
bash scripts/quick-dependency-check.sh
```
Use this for: Quick sanity check before committing code

### Comprehensive Validation (30 seconds)
```bash
bash scripts/pre-deploy-validate-all.sh
```
Use this for: Before every deployment with code changes

### Check Specific Dependencies
```bash
# Check if hardcoded lists are in sync
node scripts/regenerate-hardcoded-lists.js --check

# Validate specific category types
bash scripts/validate-dependencies.sh --check-types Refrigerator

# Check picklist field structure
node scripts/audit-picklist-fields.js

# Validate size class configuration
node scripts/validate-size-classes.js

# Test size class rounding
node scripts/test-size-class-rounding.js
```

---

## 📊 Understanding the Change Impact Matrix

The Quick Change Impact Matrix tells you instantly what to check:

**Example 1**: You changed `categories.json` (added new category)

Look up in matrix:
```
| If You Changed | Must Check These Files | Must Run These Scripts | Risk Level |
|----------------|----------------------|----------------------|------------|
| Picklist JSON files | category-matcher.service.ts | regenerate-hardcoded-lists.js --check | 🔴 HIGH |
|                     | brand-matcher.service.ts    | audit-picklist-fields.js              |          |
|                     | Constants with hardcoded    |                                       |          |
```

Action:
1. Check if `category-matcher.service.ts` needs updating (probably not for new category)
2. Run `node scripts/regenerate-hardcoded-lists.js --check` → Might show OUT OF SYNC
3. Run `node scripts/audit-picklist-fields.js` → Verify structure
4. If OUT OF SYNC, run `node scripts/regenerate-hardcoded-lists.js` to fix

**Example 2**: You changed `dual-ai-verification.service.ts`

Look up in matrix:
```
| If You Changed | Must Check These Files | Must Run These Scripts | Risk Level |
|----------------|----------------------|----------------------|------------|
| dual-ai-verification.service.ts | ALL services (core file) | npm run build | 🔴 CRITICAL |
|                                 | Response structure       | pre-deploy-validate-all.sh |       |
```

Action:
1. This is a CRITICAL file - changes affect everything
2. Run `npm run build` → Must compile without errors
3. Run `bash scripts/pre-deploy-validate-all.sh` → All 7 checks must pass
4. Test with sample verification requests
5. Deploy carefully and monitor logs

---

## 🔗 Dependency Chains Explained

The checklist documents **5 critical dependency chains**:

### Chain 1: Picklist System
```
Salesforce → JSON files → Matcher services → dual-AI → Salesforce
```
If any picklist JSON changes, the entire chain must be validated.

### Chain 2: Category-Type Mapping
```
category-type-mapping.json → type-matcher → AI prompts → Validation
```
If types change, AI prompts must mention them and validators must recognize them.

### Chain 3: Title Generation System
```
Size classes → Rounder utility → Formatting rules → Title generators → dual-AI
```
If size classes change, all title generators must be tested.

### Chain 4: Response Structure
```
salesforce.types.ts → Response builders → Controller → Webhook → Salesforce
```
If response structure changes, all builders must be updated.

### Chain 5: AI Prompt System
```
Picklists → AI prompt text → OpenAI/xAI → Consensus → Validation
```
If picklists change, AI prompts may need updating to mention new values.

---

## 💡 Real-World Usage Examples

### Scenario 1: Salesforce Sends New Picklist Sync

**What happened**: Salesforce pushed 5 new categories

**Your workflow**:
```bash
# 1. Check if sync is in HOLD BUCKET (run during Establish Connection)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-pending-picklist-syncs.js"

# 2. Review pending sync
# Shows: 5 additions, 0 removals, Severity: LOW

# 3. Approve sync (if looks good)
curl -X POST https://verify.cxc-ai.com/api/picklists/sync/pending/{id}/approve

# 4. After sync applied, validate
bash scripts/quick-dependency-check.sh
node scripts/audit-picklist-fields.js

# 5. Check if hardcoded lists need updating
node scripts/regenerate-hardcoded-lists.js --check

# 6. If OUT OF SYNC, update
node scripts/regenerate-hardcoded-lists.js

# 7. Run comprehensive validation
bash scripts/pre-deploy-validate-all.sh

# 8. Deploy if all pass
```

### Scenario 2: Adding New Size Class Category

**What you changed**: Added "Water Heater" to `category-size-classes.ts`

**Your workflow**:
```bash
# 1. Check the Impact Matrix in the checklist
# Shows: Must check title generators and run validation scripts

# 2. Validate configuration
node scripts/validate-size-classes.js
# Must show: ✅ PASS

# 3. Test rounding
node scripts/test-size-class-rounding.js
# Must show: 20/20 tests passing

# 4. Check integration points
grep -r "getSizeClassConfig" src/**/*.ts
# Should show 9 matches (no change needed, automatic)

# 5. Run comprehensive validation
bash scripts/pre-deploy-validate-all.sh

# 6. Test with sample water heater product (manual)
# Create test product with dimensions, verify title shows size class

# 7. Deploy
```

### Scenario 3: Modifying AI Prompt

**What you changed**: Updated appliance accessory detection rules in `buildAnalysisPrompt()`

**Your workflow**:
```bash
# 1. Check the Impact Matrix
# Shows: Risk Level: 🟡 MEDIUM - Test with real data

# 2. Compile TypeScript
npm run build
# Must show: ✅ SUCCESS

# 3. Run comprehensive validation
bash scripts/pre-deploy-validate-all.sh

# 4. Test with edge cases (CRITICAL for prompt changes)
# - Test with appliance accessories (GE handle for refrigerator)
# - Test with regular products (standard refrigerator)
# - Test with generic hardware (cabinet knob)
# Check that validation rules still catch misclassifications

# 5. Check logs after deployment for validation corrections
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "grep 'Category rule violation' /opt/catalog-verification-api/logs/combined.log | tail -20"

# 6. Deploy and monitor
```

---

## 📝 Keeping the Checklist Current

**The checklist is a LIVING DOCUMENT - Update it when:**

1. ✏️ You add a new file that other files depend on
2. ✏️ You add a new field to the response structure
3. ✏️ You create a new integration point
4. ✏️ You discover a dependency that wasn't documented
5. ✏️ You fix a bug that was caused by a missed dependency

**How to update**:
```bash
# Open the checklist
code docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md

# Add entry to appropriate section:
# - Quick Change Impact Matrix (if new file type)
# - Critical Dependency Chains (if new chain)
# - File Dependency Reference (if new service/config)
# - Integration Points (if new integration)

# Update Maintenance Log at bottom with change details
```

---

## 🎓 Best Practices

### DO:
- ✅ Check the Quick Change Impact Matrix **before** making changes
- ✅ Run `bash scripts/quick-dependency-check.sh` after every code change
- ✅ Run `bash scripts/pre-deploy-validate-all.sh` before deploying
- ✅ Update the checklist when you discover new dependencies
- ✅ Document fixes in AUDIT-FINDINGS-AND-SOLUTIONS.md
- ✅ Reference the checklist during "Establish Connection"
- ✅ Review dependency chains when debugging

### DON'T:
- ❌ Deploy without running validation scripts
- ❌ Ignore warnings from dependency checks
- ❌ Skip the pre-deployment validation "to save time"
- ❌ Forget to update the checklist after major changes
- ❌ Assume a file change doesn't affect anything else

---

## 🆘 Troubleshooting

### "The quick dependency check failed - what do I do?"

1. Read the error message - it tells you which check failed
2. Look up that component in the checklist's File Dependency Reference
3. Check if the file exists and has correct content
4. Run the comprehensive validation for more details: `bash scripts/pre-deploy-validate-all.sh`
5. Fix the issue
6. Re-run the quick check
7. Must show ✅ ALL PASS before deploying

### "I changed a file and something broke, but I don't know what"

1. Open `docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md`
2. Find your file in the Quick Change Impact Matrix
3. Check all files listed in "Must Check These Files"
4. Run all scripts listed in "Must Run These Scripts"
5. Review the dependency chain for your file type
6. Check `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` for similar past issues

### "Hardcoded lists are OUT OF SYNC - how do I fix?"

```bash
# This regenerates TypeScript constants from JSON picklists
node scripts/regenerate-hardcoded-lists.js

# Then commit the changes
git add src/services/*.ts src/config/constants.ts
git commit -m "Sync hardcoded lists with picklists"
```

---

## 📞 Support

**Primary Reference Documents**:
1. `docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md` - The master ledger (THIS IS YOUR MAIN TOOL)
2. `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` - Past bugs and fixes
3. `docs/architecture/COMPLETE-VERIFICATION-PROCESS-TREE.md` - Step-by-step verification flow
4. `.github/copilot-instructions.md` - Operational procedures

**Quick Commands**:
```bash
# Fast check
bash scripts/quick-dependency-check.sh

# Full validation
bash scripts/pre-deploy-validate-all.sh

# View checklist
code docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md
```

---

**Remember**: The 5 seconds you spend checking dependencies now saves hours of debugging later! 

🎯 **Make the checklist your first stop before any code change.**

---

**Document Version**: 1.0  
**Last Updated**: March 3, 2026  
**Status**: Active
