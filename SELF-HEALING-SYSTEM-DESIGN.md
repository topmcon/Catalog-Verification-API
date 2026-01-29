# 🤖 SELF-HEALING VERIFICATION SYSTEM

**Design Document - Autonomous Error Correction & Learning System**  
**Created:** January 29, 2026  
**Status:** Architecture Design

---

## 🎯 OBJECTIVE

Create an autonomous post-processing system that:
1. **Detects** failures and missing data in API responses
2. **Diagnoses** root causes using AI analysis
3. **Fixes** issues automatically (code, mappings, logic)
4. **Tests** the fix works correctly
5. **Re-processes** failed requests with corrections
6. **Updates** Salesforce with corrected data

**Key Principle:** This runs **AFTER** the main verification flow, analyzing failures asynchronously.

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│  MAIN VERIFICATION FLOW (Existing)                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Salesforce Request → Verification → Response                │
│  2. Save to MongoDB (verification_jobs)                         │
│  3. Send Webhook to Salesforce                                  │
│  4. Wait for SF Acknowledgment (or 60 seconds timeout)          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                 ⏰ WAIT 60 SECONDS (SF processing time)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SELF-HEALING SYSTEM (New - Runs Asynchronously)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PHASE 1: ERROR DETECTION & CLASSIFICATION                  │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ • Monitor MongoDB for completed jobs with issues           │ │
│  │ • Classify error types:                                    │ │
│  │   - Missing data (fields not populated)                    │ │
│  │   - Wrong data (incorrect values)                          │ │
│  │   - Mapping failures (picklist mismatches)                 │ │
│  │   - Logic errors (category determination issues)           │ │
│  │   - Code bugs (exceptions, timeouts)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PHASE 2: DUAL-AI DIAGNOSTIC ENGINE                         │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ STEP 2A: INDEPENDENT ANALYSIS (Parallel)                   │ │
│  │                                                             │ │
│  │ OpenAI (GPT-4o) Analyzes:        xAI (Grok-2) Analyzes:   │ │
│  │ ├─ Original payload              ├─ Original payload       │ │
│  │ ├─ Response data                 ├─ Response data          │ │
│  │ ├─ Code sections                 ├─ Code sections          │ │
│  │ ├─ Category schemas               ├─ Category schemas       │ │
│  │ ├─ Picklist data                 ├─ Picklist data          │ │
│  │ └─ Error logs                    └─ Error logs             │ │
│  │                                                             │ │
│  │ Each AI produces:                                          │ │
│  │ • Root cause hypothesis                                    │ │
│  │ • Evidence supporting diagnosis                            │ │
│  │ • Proposed fix with code changes                           │ │
│  │ • Confidence score (0-100%)                                │ │
│  │ • Risk assessment                                          │ │
│  │ • System-wide scan recommendations                         │ │
│  │                                                             │ │
│  │ STEP 2B: CONSENSUS BUILDING                                │ │
│  │                                                             │ │
│  │ • Share findings between AIs                               │ │
│  │ • OpenAI reviews xAI's diagnosis                           │ │
│  │ • xAI reviews OpenAI's diagnosis                           │ │
│  │ • Both critique each other's proposed fixes                │ │
│  │ • Identify agreements and disagreements                    │ │
│  │ • Resolve conflicts through evidence                       │ │
│  │ • Select SINGLE best fix (consensus required)              │ │
│  │ • Must both agree with 70%+ confidence                     │ │
│  │                                                             │ │
│  │ STEP 2C: SYSTEM-WIDE SCAN PLANNING                         │ │
│  │                                                             │ │
│  │ • Identify similar patterns in other code/config           │ │
│  │ • List all files that may have same issue                  │ │
│  │ • Generate comprehensive fix plan                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PHASE 3: COMPREHENSIVE FIX GENERATION                      │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ CONSENSUS FIX (Agreed by both AIs):                        │ │
│  │                                                             │ │
│  │ Primary Fix (for detected issue):                          │ │
│  │ • Single agreed-upon code change                           │ │
│  │ • Target file(s) identified                                │ │
│  │ • Exact code modifications                                 │ │
│  │                                                             │ │
│  │ System-Wide Fixes (prevent recurrence):                    │ │
│  │ • Scan ALL similar locations                               │ │
│  │ • Fix same issue in other files                            │ │
│  │ • Update all category schemas (not just one)               │ │
│  │ • Add all variations of alias (not just one)               │ │
│  │                                                             │ │
│  │ Example Fix Types:                                         │ │
│  │                                                             │ │
│  │ Fix Type 1: ADD ALIAS (System-Wide)                        │ │
│  │   Primary: Add 'manufacturer' → 'brand'                    │ │
│  │   System: Also add 'mfr', 'maker', 'producer' (variants)   │ │
│  │   Files: smart-field-inference.service.ts                  │ │
│  │                                                             │ │
│  │ Fix Type 2: UPDATE CATEGORY SCHEMA (All Categories)        │ │
│  │   Primary: Add 'soaking_depth' to Bathtub schema           │ │
│  │   System: Check ALL plumbing schemas for similar gaps      │ │
│  │   Files: schemas/plumbing-schemas.ts (all categories)      │ │
│  │                                                             │ │
│  │ Fix Type 3: FIX PARSING LOGIC (All Patterns)               │ │
│  │   Primary: Fix dimension extraction for "60 x 30"          │ │
│  │   System: Update regex to handle all dimension formats     │ │
│  │   Files: dual-ai-verification.service.ts                   │ │
│  │                                                             │ │
│  │ Fix Type 4: ADD NORMALIZATION RULES (All Variations)       │ │
│  │   Primary: Map "Farm Sink" → "Farmhouse Sink"             │ │
│  │   SystemPRIMARY fix                                        │ │
│  │ • Apply SYSTEM-WIDE fixes                                  │ │
│  │ • Create backups of ALL modified files                     │ │
│  │ • Run syntax validation on all changes                     │ │
│  │ • Run unit tests (if applicable)                           │ │
│  │ • Log all changes to audit trail                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PHASE 5: MULTI-ATTEMPT VERIFICATION (Up to 3 tries)        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │ ATTEMPT LOOP (max 3 iterations):                           │ │
│  │                                                             │ │
│  │ 1️⃣ APPLY FIX                                               │ │
│  │    • Implement consensus fix                               │ │
│  │    • Reload modified modules                               │ │
│  │                                                             │ │
│  │ 2️⃣ RE-PROCESS ORIGINAL JOB                                 │ │
│  │    • Re-run verification on failed payload                 │ │
│  │    • Generate new response                                 │ │
│  │                                                             │ │
│  │ 3️⃣ DUAL-AI INDEPENDENT REVIEW                              │ │
│  │    • OpenAI reviews new results (independently)            │ │
│  │    • xAI reviews new results (independently)               │ │
│  │    • Each checks:                                          │ │
│  │      ✓ MisYSTEM-WIDE VALIDATION & SF UPDATE                │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │ STEP 6A: FINAL SYSTEM-WIDE CHECK                           │ │
│  │ • Re-run verification on multiple test cases               │ │
│  │ • Verify no regressions introduced                         │ │
│  │ • Check all related categories/schemas                     │ │
│  │ • Confirm system-wide fixes work globally                  │ │
│  │                                                             │ │
│  │ STEP 6B: DUAL-AI FINAL APPROVAL                            │ │
│  │ • Both AIs review COMPLETE system state                    │ │
│  │ • Check for any remaining issues                           │ │
│  │ • Verify fix didn't create new problems elsewhere          │ │
│  │ • Both must give final ✅ approval                         │ │
│  │                                                             │ │
│  │ STEP 6C: SALESFORCE CORRECTION UPDATE                      │ │
│  │ • Extract ONLY corrected fields from original job          │ │
│  │ • Send correction webhook to Salesforce                    │ │
│  │ • Include comprehensive metadata:                          │ │
│  │   - Original jobId                                         │ │
│  │   - Fields corrected (before/after values)                 │ │
│  │   - Fix type applied (primary + system-wide)               │ │
│  │   - Dual-AI confidence scores                              │ │
│  │   - Attempts taken (1, 2, or 3)                            │ │
│  │   - System-wide improvements made                          │ │
│  │   - Validation test results                                │ │
│  │                                                             │ │
│  │ STEP 6D: MONITOR SALESFORCE CONFIRMATION                   │ │
│  │ • Track SF acknowledgment of correction                    │ │
│  │ • Verify SF processed update successfully                  │ │
│  │ • Log final outcome  → SUCCESS ✅                          │ │
│  │    • If EITHER rejects → Analyze failure                   │ │
│  │                                                             │ │
│  │ 5️⃣ RETRY IF NEEDED                                         │ │
│  │    • If failed: Diagnose why fix didn't work               │ │
│  │    • Generate improved fix (both AIs collaborate)          │ │
│  │    • Rollback previous attempt                             │ │
│  │    • Go to next attempt (max 3 total)                      │ │
│  │                                                             │ │
│  │ OUTCOMES:                                                   │ │
│  │ • ✅ Success (both AIs approve) → Proceed to Phase 6       │ │
│  │ • ❌ Failed 3 attempts → Mark unfixable, escalate to human    │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PHASE 5: RE-PROCESSING & VERIFICATION                      │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ • Reload modified modules (dynamic import)                 │ │
│  │ • Re-run verification on original payload                  │ │
│  │ • Compare old vs new results                               │ │
│  │ • Verify fix resolved the issue                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PHASE 6: SALESFORCE UPDATE                                 │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ • Extract ONLY corrected fields                            │ │
│  │ • Send update webhook to Salesforce                        │ │
│  │ • Include metadata:                                        │ │
│  │   - Original jobId                                         │ │
│  │   - Fields corrected                                       │ │
│  │   - Fix type applied                                       │ │
│  │   - Confidence score                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTATION PLAN

### Step 1: Error Detection Service

**File:** `src/services/self-healing/error-detector.service.ts`

**Functions:**
- `detectFailuresAndIssues()` - Scan MongoDB for jobs with issues
- `classifyError()` - Categorize error type
- `extractMissingFields()` - Identify what data is missing
- `prioritizeIssues()` - Sort by frequency/severity

**Triggers:**
- Scheduled (every 5 minutes)
- Manual trigger via API endpoint
- Threshold-based (if error rate > 5%)

```typescript
interface DetectedIssue {
  jobId: string;
  sfCatalogId: string;
  sfCatalogName: string;
  issueType: 'missing_data' | 'wrong_data' | 'mapping_failure' | 'logic_error' | 'code_bug';
  severity: 'low' | 'medium' | 'high' | 'critical';
  missingFields: string[];
  wrongFields: Array<{ field: string; expected: any; received: any }>;
  affectedCount: number; // How many jobs have this same issue
  rawPayload: any;
  currentResponse: any;
  errorLogs: string[];
}
```

---

### Step 2: AI Diagnostic Engine

**File:** `src/services/self-healing/ai-diagnostician.service.ts`

**AI Model:** GPT-4o or Claude Opus (needs deep reasoning)

**Prompt Structure:**
```
You are a senior software engineer debugging a product verification system.

CONTEXT:
- System: Dual-AI product verification API (OpenAI + xAI)
- Issue: [ISSUE_TYPE] - [DESCRIPTION]
- Frequency: [X] similar failures

EVIDENCE:
1. Original Request:
   [RAW_PAYLOAD]

2. Current Response:
   [RESPONSE_DATA]
   Missing fields: [MISSING_FIELDS]

3. Relevant Code:
   [CODE_SECTION]

4. Schema/Config:
   [CATEGORY_SCHEMA]

5. Error Logs:
   [ERROR_MESSAGES]

TASK:
Analyze the evidence and determine:
1. ROOT CAUSE: Why did this failure occur?
2. FIX TYPE: What kind of fix is needed?
3. FIX LOCATION: Which file(s) need modification?
4. FIX CODE: Exact code change needed
5. CONFIDENCE: How confident are you (0-100%)
6. RISK: What could go wrong with this fix?

Return JSON:
{
  "rootCause": "string",
  "fixType": "add_alias|add_picklist|update_schema|fix_parsing|add_normalization",
  "targetFile": "path/to/file.ts",
  "codeChange": {
    "type": "insert|replace|append",
    "location": "line number or section",
    "oldCode": "existing code (if replace)",
    "newCode": "new code to add"
  },
  "testStrategy": "how to verify fix works",
  "confidence": 85,
  "risk": "low|medium|high",
  "explanation": "detailed explanation"
}
```

---

### Step 3: Fix Application Engine

**File:** `src/services/self-healing/fix-applicator.service.ts`

**Functions:**
- `applyFix()` - Apply code changes
- `backupFile()` - Create backup before modification
- `validateSyntax()` - Check TypeScript syntax
- `reloadModule()` - Dynamic module reload
- `rollbackFix()` - Revert if fix fails

**Safety Mechanisms:**
- Always create backup before modification
- Validate syntax before saving
- Test fix on failed request before applying to all
- Maintain audit log of all changes
- Auto-rollback if new errors introduced

---

### Step 4: Re-processing Service

**File:** `src/services/self-healing/reprocessor.service.ts`

**Functions:**
- `reprocessFailedJob()` - Re-run verification with fix
- `compareResults()` - Old vs new comparison
- `extractCorrectedFields()` - Only changed fields
- `generateCorrectionPayload()` - Salesforce update

---

### Step 5: Salesforce Update Service

**File:** `src/services/self-healing/sf-correction-sender.service.ts`

**Payload Format:**
```json
{
  "type": "correction",
  "originalJobId": "uuid-original",
  "correctionJobId": "uuid-new",
  "SF_Catalog_Id": "12345",
  "correctedAt": "2026-01-29T...",
  "correctionType": "self_healing_auto_fix",
  "fieldsUpdated": ["Brand_Verified", "Category_Verified"],
  "updates": {
    "Brand_Verified": {
      "old": null,
      "new": "Kohler",
      "confidence": 95
    },
    "Category_Verified": {
      "old": "Unknown",
      "new": "Faucet",
      "confidence": 92
    }
  },
  "fixApplied": {
    "type": "add_alias",
    "file": "smart-field-inference.service.ts",
    "description": "Added 'manufacturer' → 'brand' alias"
  },
  "metadata": {
    "aiDiagnosticConfidence": 87,
    "testsPassed": true,
    "similarIssuesFixed": 5
  }
}
```

---

## 🗄️ NEW DATABASE MODELS

### 1. Self-Healing Log
```typescript
// src/models/self-healing-log.model.ts

interface ISelfHealingLog {
  logId: string;
  triggeredAt: Date;
  completedAt?: Date;
  status: 'analyzing' | 'fixing' | 'testing' | 'completed' | 'failed' | 'rolled_back';
  
  // Issue detected
  issue: {
    jobIds: string[];  // Affected jobs
    issueType: string;
    severity: string;
    description: string;
    frequency: number;
  };
  
  // AI diagnosis
  diagnosis: {
    rootCause: string;
    fixType: string;
    aiConfidence: number;
    aiModel: string;
    tokensUsed: number;
  };
  
  // Fix applied
  fix: {
    targetFile: string;
    backupFile: string;
    codeChange: any;
    appliedAt: Date;
  };
  
  // Results
  results: {
    jobsReprocessed: number;
    jobsFixed: number;
    jobsStillFailing: number;
    fieldsImproved: number;
  };
  
  // Salesforce updates
  salesforceUpdates: {
    sent: number;
    successful: number;
    failed: number;
  };
  
  // Audit
  createdBy: 'auto' | 'manual';
  reviewedBy?: string;
  approved: boolean;
}
```

### 2. Fix Repository
```typescript
// src/models/fix-repository.model.ts

interface IFixRepository {
  fixId: string;
  fixType: string;
  targetFile: string;
  description: string;
  codeChange: any;
  
  // Effectiveness
  appliedAt: Date;
  issuesFixed: number;
  issuesIntroduced: number;
  effectivenessScore: number; // 0-100
  
  // Status
  status: 'active' | 'reverted' | 'superseded';
  revertedAt?: Date;
  revertReason?: string;
}
```

---

## 🎛️ CONFIGURATION

**File:** `src/config/self-healing-config.ts`

```typescript
export const SELF_HEALING_CONFIG = {
  enabled: process.env.SELF_HEALING_ENABLED === 'true',
  
  // Detection
  scanIntervalMs: 5 * 60 * 1000, // 5 minutes
  minIssueFrequency: 3, // Fix if seen 3+ times
  
  // AI Diagnostic
  aiModel: 'gpt-4o', // or 'claude-opus-3'
  aiConfidenceThreshold: 75, // Only apply fixes with 75%+ confidence
  
  // Safety
  requireManualApproval: true, // Set false for full automation
  maxFixesPerHour: 10,
  autoRollbackOnNewErrors: true,
  
  // Testing
  testFixBeforeApply: true,
  minTestSuccessRate: 90, // 90% of test cases must pass
  
  // Salesforce Updates
  sendCorrections: true,
  correctionWebhookUrl: process.env.SF_CORRECTION_WEBHOOK_URL,
  
  // File Modification
  allowedFiles: [
    'src/services/smart-field-inference.service.ts',
    'src/config/category-aliases.ts',
    'src/config/schemas/*.ts',
    'src/config/salesforce-picklists/*.json'
  ],
  backupDir: 'backups/self-healing/',
  
  // Logging
  logLevel: 'info',
  notifyOnFix: true,
  notifyEmail: process.env.ADMIN_EMAIL
};
```

---

## 🔧 API ENDPOINTS

### Trigger Self-Healing
```
POST /api/self-healing/trigger
```

### Get Self-Healing Status
```
GET /api/self-healing/status
```

### Review Pending Fixes (Manual Approval)
```
GET /api/self-healing/pending-fixes
POST /api/self-healing/approve/:fixId
POST /api/self-healing/reject/:fixId
```

### Get Fix History
```
GET /api/self-healing/history
```

### Rollback Fix
```
POST /api/self-healing/rollback/:fixId
```

---

## 🔒 SAFETY GUARDRAILS

1. **Human-in-the-Loop (Optional)**
   - If `requireManualApproval: true`, fixes queue for review
   - Admin approves/rejects via dashboard
   - Auto-apply for low-risk fixes only

2. **Testing Before Apply**
   - Test fix on failed job first
   - Verify improvement (missing fields now populated)
   - Check no new errors introduced

3. **Rollback Capability**
   - All changes backed up
   - One-click rollback if issues arise
   - Auto-rollback if error rate increases

4. **Rate Limiting**
   - Max 10 fixes per hour (configurable)
   - Prevent cascading changes

5. **Audit Trail**
   - Every change logged to MongoDB
   - Git commit for code changes (optional)
   - Email notifications to admins

6. **Scope Limits**
   - Only modify allowed files (config, not core logic)
   - No database schema changes
   - No external API changes

---

## 📊 MONITORING & REPORTING

### Dashboard Metrics
- Total issues detected
- Issues auto-fixed
- Success rate of fixes
- Average time to fix
- Fields improved over time
- Fix effectiveness scores

### Alerts
- Fix applied successfully
- Fix failed validation
- Fix rolled back
- High-confidence fix pending approval
- Error rate increased after fix

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [ ] Error detection service
- [ ] Issue classification logic
- [ ] MongoDB models for self-healing logs
- [ ] Basic API endpoints

### Phase 2: AI Diagnostic (Week 2)
- [ ] AI diagnostician service
- [ ] Prompt engineering and testing
- [ ] Root cause analysis logic
- [ ] Fix recommendation engine

### Phase 3: Fix Application (Week 3)
- [ ] File backup system
- [ ] Code modification service
- [ ] Syntax validation
- [ ] Module reloading

### Phase 4: Testing & Validation (Week 4)
- [ ] Reprocessing service
- [ ] Result comparison logic
- [ ] Test harness for fixes
- [ ] Rollback mechanism

### Phase 5: Salesforce Integration (Week 5)
- [ ] Correction payload builder
- [ ] SF update webhook service
- [ ] Tracking SF acknowledgments
- [ ] End-to-end testing

### Phase 6: Dashboard & Monitoring (Week 6)
- [ ] Self-healing dashboard UI
- [ ] Fix approval interface
- [ ] Metrics and analytics
- [ ] Alerting system

---

## 💡 EXAMPLE SCENARIOS

### Scenario 1: Missing Field (Alias Issue)

**Problem:**
- Field "Manufacturer" exists in payload
- Not mapped to "Brand_Verified"
- Brand returned as null to Salesforce

**AI Diagnosis:**
```json
{
  "rootCause": "Field 'Manufacturer' in payload not recognized as brand alias",
  "fixType": "add_alias",
  "targetFile": "src/services/smart-field-inference.service.ts",
  "codeChange": {
    "type": "append",
    "location": "FIELD_ALIASES object",
    "newCode": "'manufacturer': 'brand',"
  },
  "confidence": 92
}
```

**Fix Applied:**
Add to FIELD_ALIASES mapping

**Result:**
Re-process job → Brand now populated → Send correction to SF

---

### Scenario 2: Category Schema Missing Attribute

**Problem:**
- Product is a "Bathtub"
- Has "Soaking Depth" attribute in Ferguson data
- Not in Bathtub category Top 15 schema
- Field ignored, not sent to SF

**AI Diagnosis:**
```json
{
  "rootCause": "Category 'Bathtub' schema missing Top 15 attribute 'soaking_depth'",
  "fixType": "update_schema",
  "targetFile": "src/config/schemas/plumbing-schemas.ts",
  "codeChange": {
    "type": "insert",
    "location": "Bathtub top15Attributes array",
    "newCode": "{ name: 'Soaking Depth', key: 'soaking_depth', required: false, dataType: 'number' },"
  },
  "confidence": 95
}
```

**Fix Applied:**
Update Bathtub schema

**Result:**
Re-process → Soaking depth now in Top 15 → Send correction to SF

---

### Scenario 3: Picklist Mismatch

**Problem:**
- AI extracted style "Farmhouse Sink"
- Not in Salesforce styles picklist
- Style_Verified returned as null
- Attribute_Request generated

**AI Diagnosis:**
```json
{
  "rootCause": "Style 'Farmhouse Sink' valid but not in SF picklist yet",
  "fixType": "add_picklist_pending",
  "targetFile": "src/config/salesforce-picklists/styles.json",
  "action": "wait_for_sf_sync",
  "explanation": "Attribute_Request sent. Self-healing will retry after next picklist sync."
}
```

**Action:**
Queue for retry after next picklist sync (not a code fix)

---

## 🎯 SUCCESS METRICS

- **Auto-fix Rate:** % of issues resolved automatically
- **Time to Fix:** Average time from detection to correction
- **Fix Accuracy:** % of fixes that resolved the issue
- **False Positive Rate:** % of fixes that caused new issues
- **SF Update Success:** % of corrections accepted by Salesforce
- **Issue Recurrence:** % of same issues recurring after fix

**Target Goals:**
- Auto-fix rate: >80% for mapping/alias issues
- Time to fix: <15 minutes
- Fix accuracy: >95%
- False positive rate: <2%

---

## 🔐 SECURITY CONSIDERATIONS

1. **Code Modification Limits**
   - Only touch config files and mapping data
   - Never modify core verification logic without approval
   - Git commit all changes for audit trail

2. **AI Validation**
   - Human review for high-risk changes
   - Syntax validation before apply
   - Test on single job before bulk apply

3. **Access Control**
   - API endpoints require admin role
   - Approval actions logged with user ID
   - Read-only mode for non-admins

---

**Next Steps:** Implement Phase 1 (Foundation) or would you like to see sample code for any component?
