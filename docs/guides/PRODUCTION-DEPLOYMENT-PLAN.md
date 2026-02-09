# Production Deployment & Testing Plan

**Date**: February 9, 2026  
**Purpose**: Deploy critical bug fixes and establish comprehensive audit system  
**Status**: READY FOR EXECUTION

---

## 🚨 Critical Bugs to Fix

### Bug #1: Null Pointer Exception (BLOCKING 100% OF JOBS WITH SOURCE DATA)
**Location**: `src/services/token-management.service.ts:264`  
**Impact**: Complete data loss when categorySchema is null  
**Fix**: Add null safety operator

### Bug #2: Missing Fallback Schema
**Location**: `src/services/dual-ai-verification.service.ts:1808`  
**Impact**: Assumes 'Bath Tub' schema exists (may not)  
**Fix**: Provide safe default object

### Bug #3: JSON.stringify Token Explosion
**Location**: `src/services/token-management.service.ts:135-160`  
**Impact**: 606K tokens (6x over limit) causing crashes  
**Fix**: Summarize instead of stringify

---

## 📋 Phase 1: Pre-Deployment Preparation (30 minutes)

### 1.1 Create Backup Point
```bash
# On production server
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git log -1 --oneline > /tmp/pre-fix-commit.txt"

# Get current commit hash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7"
```

### 1.2 Export Recent Jobs for Comparison
```bash
# Export last 10 completed jobs to compare before/after
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/export-recent-jobs.js > /tmp/jobs-before-fix.json"
```

### 1.3 Document Current Failure Rate
```bash
# Run API Accuracy Report
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js > /tmp/accuracy-before-fix.txt"
```

---

## 🔧 Phase 2: Implement Fixes (Local First)

### 2.1 Fix #1: Null Safety in Token Management
**File**: `src/services/token-management.service.ts`

```typescript
// BEFORE (Line 264)
const isTop15 = categorySchema.top15FilterAttributes.some(attr => {
  const normalizedAttr = attr.toLowerCase().replace(/_/g, ' ');
  return normalizedName.includes(normalizedAttr) || normalizedAttr.includes(normalizedName);
});

// AFTER - Add null safety
const isTop15 = categorySchema?.top15FilterAttributes?.some(attr => {
  const normalizedAttr = attr.toLowerCase().replace(/_/g, ' ');
  return normalizedName.includes(normalizedAttr) || normalizedAttr.includes(normalizedName);
}) || false;
```

### 2.2 Fix #2: Safe Fallback Schema
**File**: `src/services/dual-ai-verification.service.ts`

```typescript
// BEFORE (Line 1808)
const categorySchemaForTokens = getCategoryAttributeSchema(initialCategoryGuess) || getCategoryAttributeSchema('Bath Tub')!;

// AFTER - Safe default
const categorySchemaForTokens = getCategoryAttributeSchema(initialCategoryGuess) 
  || getCategoryAttributeSchema('Bath Tub') 
  || {
    top15FilterAttributes: [],
    primaryDisplayAttributes: [],
    categoryName: 'Unknown',
    categoryId: 'unknown'
  };
```

### 2.3 Fix #3: Summarize Instead of Stringify
**File**: `src/services/token-management.service.ts`

```typescript
// BEFORE (Lines 135-160) - Creates 606K tokens
const webPagesText = researchResult.webPages
  .map(p => `${p.title} ${p.description} ${JSON.stringify(p.specifications)}`)
  .join('\n');

const combinedSpecifications = researchResult.webPages
  .map(p => JSON.stringify(p.specifications || {}))
  .join('\n');

// AFTER - Summarize top 30 specs per page (~2K tokens)
const webPagesText = researchResult.webPages
  .map(p => {
    const topSpecs = Object.entries(p.specifications || {})
      .filter(([k, v]) => v && String(v).trim().length > 0)
      .slice(0, 30)  // Limit to top 30 most important
      .map(([k, v]) => `${k}: ${String(v).substring(0, 100)}`)
      .join('; ');
    return `${p.title} - ${p.description}. Key specs: ${topSpecs}`;
  })
  .join('\n');

// Remove combinedSpecifications entirely - it's duplicated in webPagesText
```

---

## ✅ Phase 3: Local Testing (15 minutes)

### 3.1 Compile TypeScript
```bash
npm run build
```

### 3.2 Run Unit Tests (if available)
```bash
npm test
```

### 3.3 Check for TypeScript Errors
```bash
npx tsc --noEmit
```

### 3.4 Manual Verification
- Verify null safety prevents crashes
- Verify fallback schema exists
- Verify summarized text is <5K tokens (not 606K)

---

## 🚀 Phase 4: Deploy to Production (20 minutes)

### 4.1 Commit Changes Locally
```bash
git add -A
git commit -m "Fix: Critical null pointer + token overflow bugs

- Add null safety in scoreSpecificationImportance() (line 264)
- Provide safe fallback schema in dual-ai-verification
- Replace JSON.stringify with summarized specs (606K → 2K tokens)
- Fixes 100% failure rate on jobs with source attributes"
```

### 4.2 Push to GitHub
```bash
git push origin main
```

### 4.3 Deploy to Production
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main && npm install && npm run build && systemctl restart catalog-verification"
```

### 4.4 Verify Service Started
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl status catalog-verification | head -20"
```

### 4.5 Check Health Endpoint
```bash
curl -s https://verify.cxc-ai.com/health
```

---

## 🧪 Phase 5: Production Testing (30 minutes)

### 5.1 Monitor Live Logs
```bash
# Open in separate terminal - watch for errors
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log"
```

### 5.2 Trigger Test Job from Salesforce
**Action**: Have Salesforce send a product with:
- Ferguson_Attributes or Web_Retailer_Specs (88+ attributes)
- Stock_Images array (3-5 images)
- Documents array (1-2 PDFs)
- Ferguson_URL or Reference_URL

**Expected Outcome**:
- ✅ Job completes successfully (no crash)
- ✅ Additional_Attributes_HTML is populated
- ✅ No "Cannot read properties of null" error
- ✅ Research pipeline executes (images analyzed, PDFs read)

### 5.3 Check Job Result
```bash
# After job completes, check the result
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node -e \"
const mongoose = require('mongoose');
const { VerificationJob } = require('./dist/models/verification-job.model');

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const job = await VerificationJob.findOne().sort({ createdAt: -1 });
  
  console.log('Job ID:', job.jobId);
  console.log('Status:', job.status);
  console.log('Error:', job.error || 'NONE');
  console.log('Attributes Received:', (job.rawPayload?.Web_Retailer_Specs?.length || 0) + (job.rawPayload?.Ferguson_Attributes?.length || 0));
  console.log('Additional HTML:', job.result?.additional_attributes_html ? 'YES' : 'NO');
  console.log('Research Executed:', job.research?.images?.length > 0 || job.research?.webPages?.length > 0);
  
  await mongoose.disconnect();
})();
\""
```

### 5.4 Run Attribute Coverage Report
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/analyze-attribute-coverage.js"
```

**Success Criteria**:
- ✅ Attribute return rate: 90%+ (was 33%)
- ✅ No jobs with 0% coverage
- ✅ Additional HTML table populated

### 5.5 Run API Accuracy Report
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"
```

**Success Criteria**:
- ✅ Pass rate improves from current baseline
- ✅ No "Cannot read properties of null" errors
- ✅ Research data being utilized

---

## 🔍 Phase 6: Comprehensive System Audit (1-2 hours)

### 6.1 Picklist Integrity Audit
```bash
# Verify all picklist files match Salesforce
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/audit-picklist-fields.js"
```

**Check**:
- ✅ All JSON files use correct field names (brand_id, category_name, etc.)
- ✅ No hardcoded lists out of sync with picklists
- ✅ No duplicate entries

### 6.2 Category/Style/Brand Mapping Audit
```bash
# Run comprehensive mapping validation
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/audit-category-mappings.js"
```

**Check**:
- ✅ All categories in mapping exist in categories.json
- ✅ All styles in mapping exist in styles.json
- ✅ All brands referenced exist in brands.json
- ✅ No orphaned mappings

### 6.3 Database Schema Validation
```bash
# Verify MongoDB collections match expected schema
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/validate-db-schema.js"
```

**Check**:
- ✅ verification_job collection has all required fields
- ✅ ai_usage collection tracking correctly
- ✅ picklist_sync_log collection intact
- ✅ self_healing_log collection working

### 6.4 Error Handling Audit
```bash
# Scan codebase for missing error handling
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/audit-error-handling.js"
```

**Check**:
- ✅ All async functions have try/catch
- ✅ All API calls have error handlers
- ✅ All database operations handle failures
- ✅ All null/undefined checks in place

### 6.5 Token Management Audit
```bash
# Verify all token estimates are accurate
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/audit-token-estimates.js"
```

**Check**:
- ✅ No JSON.stringify creating 500K+ tokens
- ✅ All estimates within 10% accuracy
- ✅ Smart truncation working correctly
- ✅ MAX_SAFE_TOKENS enforced everywhere

---

## 📊 Phase 7: Establish Ongoing Monitoring (30 minutes)

### 7.1 Create Daily Health Check Script
**File**: `scripts/daily-health-check.sh`

```bash
#!/bin/bash
# Daily automated health check - runs via cron at 8am EST

DATE=$(date +%Y-%m-%d)
LOG_FILE="/opt/catalog-verification-api/logs/health-check-$DATE.log"

echo "=== DAILY HEALTH CHECK: $DATE ===" > $LOG_FILE

# Check service status
systemctl is-active catalog-verification >> $LOG_FILE

# Check last 24h job stats
node /opt/catalog-verification-api/scripts/daily-job-stats.js >> $LOG_FILE

# Check error rate
node /opt/catalog-verification-api/scripts/daily-error-rate.js >> $LOG_FILE

# Check attribute coverage
node /opt/catalog-verification-api/scripts/analyze-attribute-coverage.js >> $LOG_FILE

# Check API accuracy
node /opt/catalog-verification-api/scripts/verification-api-accuracy-audit.js >> $LOG_FILE

# Alert if critical issues found
if grep -q "CRITICAL" $LOG_FILE; then
  echo "CRITICAL ISSUES FOUND - CHECK LOG: $LOG_FILE"
  # TODO: Send email/Slack alert
fi
```

### 7.2 Set Up Cron Job
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "crontab -e"

# Add this line:
0 8 * * * /opt/catalog-verification-api/scripts/daily-health-check.sh
```

### 7.3 Create Alerting Thresholds
**File**: `scripts/daily-job-stats.js`

```javascript
// Alert if:
// - Job failure rate > 5%
// - Attribute coverage < 90%
// - API accuracy < 85%
// - Average processing time > 30 seconds
// - Webhook delivery rate < 95%
// - Self-healing failure rate > 10%
```

---

## 📈 Success Metrics

### Before Fixes
- ✅ Attribute return rate: 33%
- ✅ Jobs with source attributes: 100% failure
- ✅ Research pipeline: 0% execution
- ✅ Null pointer errors: Constant

### After Fixes (Target)
- 🎯 Attribute return rate: **95%+**
- 🎯 Jobs with source attributes: **0% failure**
- 🎯 Research pipeline: **95%+ execution**
- 🎯 Null pointer errors: **0**
- 🎯 Vision analysis: **Working**
- 🎯 PDF extraction: **Working**
- 🎯 URL scraping: **Working**

---

## 🔄 Rollback Plan (If Needed)

### If Critical Issues Occur
```bash
# 1. Get backup commit hash
BACKUP_COMMIT=$(ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /tmp/pre-fix-commit.txt")

# 2. Rollback to previous version
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git reset --hard $BACKUP_COMMIT && npm run build && systemctl restart catalog-verification"

# 3. Verify rollback successful
curl -s https://verify.cxc-ai.com/health
```

---

## 📝 Post-Deployment Documentation

### Create Session Summary
**File**: `session-notes/SESSION-SUMMARY-2026-02-09-CRITICAL-BUG-FIXES.md`

Document:
- Bugs fixed
- Testing results
- Before/after metrics
- Lessons learned
- Audit findings
- Next steps

---

## 🚦 Go/No-Go Checklist

**Before Deploying to Production:**
- [ ] All 3 fixes implemented locally
- [ ] TypeScript compiles without errors
- [ ] Backup commit hash saved
- [ ] Current job data exported
- [ ] Rollback plan tested
- [ ] Monitoring in place

**Deployment Approval:**
- [ ] Code reviewed
- [ ] Tests pass
- [ ] GitHub sync verified

**Post-Deployment Verification:**
- [ ] Service running
- [ ] Health check passes
- [ ] Test job succeeds
- [ ] No errors in logs
- [ ] Metrics improving

**Full System Audit:**
- [ ] Picklist integrity verified
- [ ] Mappings validated
- [ ] Error handling complete
- [ ] Token estimates accurate
- [ ] Daily monitoring active

---

## 🎯 Next Steps After Successful Deployment

1. **Monitor for 24 hours** - Watch error rates and job success
2. **Run full audit suite** - Execute all audit scripts
3. **Compare metrics** - Before vs. after analysis
4. **Document learnings** - Update session notes
5. **Plan Phase 2** - Additional optimizations (cost reduction, performance)

