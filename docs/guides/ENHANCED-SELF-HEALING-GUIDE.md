# ENHANCED SELF-HEALING SYSTEM - IMPLEMENTATION GUIDE

## 🎯 Overview

This updated self-healing system includes:
- **60-second delay** after SF webhook sent (allows SF processing time)
- **Dual-AI consensus** (OpenAI GPT-4o + xAI Grok-2) for diagnosis and validation
- **Multi-attempt retry** (up to 3 attempts with improving fixes)
- **System-wide scanning** (fix root cause everywhere, not just isolated issue)
- **Comprehensive validation** before sending corrections to Salesforce

---

## 📋 Enhanced Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  VERIFICATION COMPLETE → Webhook Sent to SF                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                   ⏰ WAIT 60 SECONDS
                    (SF processing)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Error Detection (error-detector.service.ts)           │
│  • Scans MongoDB for issues                                     │
│  • Classifies errors                                            │
│  • Prioritizes by frequency/severity                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: Dual-AI Diagnostic (dual-ai-diagnostician.service.ts) │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ INDEPENDENT ANALYSIS (Parallel)                          │  │
│  │                                                           │  │
│  │ OpenAI GPT-4o        │       xAI Grok-2                 │  │
│  │ • Analyzes issue     │       • Analyzes issue           │  │
│  │ • Proposes fix       │       • Proposes fix             │  │
│  │ • Scans for similar  │       • Scans for similar        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CROSS-REVIEW & CONSENSUS                                 │  │
│  │ • OpenAI reviews xAI's diagnosis                         │  │
│  │ • xAI reviews OpenAI's diagnosis                         │  │
│  │ • Both must agree (70%+ confidence)                      │  │
│  │ • Select single best fix                                 │  │
│  │ • Plan system-wide fixes                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: Comprehensive Fix Application                         │
│  (comprehensive-fix-applicator.service.ts)                      │
│  • Apply PRIMARY fix                                            │
│  • Apply SYSTEM-WIDE fixes (prevent recurrence)                 │
│  • Backup all modified files                                    │
│  • Validate syntax + run tests                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: Multi-Attempt Verification                            │
│  (multi-attempt-verifier.service.ts)                            │
│                                                                  │
│  FOR EACH ATTEMPT (max 3):                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1️⃣ Apply Fix                                           │    │
│  │ 2️⃣ Re-process Original Job                             │    │
│  │ 3️⃣ Dual-AI Independent Review                          │    │
│  │    • OpenAI validates results                          │    │
│  │    • xAI validates results                             │    │
│  │ 4️⃣ Check Consensus                                     │    │
│  │    • BOTH approve? → SUCCESS ✅                        │    │
│  │    • EITHER rejects? → Analyze & retry                 │    │
│  │ 5️⃣ Generate Improved Fix (if needed)                   │    │
│  │    • Rollback previous attempt                         │    │
│  │    • Use both AIs' suggestions                         │    │
│  │    • Try again                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  OUTCOMES:                                                       │
│  • ✅ Success (both AIs approve) → Phase 5                      │
│  • ❌ Failed 3 attempts → Escalate to human                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: Comprehensive SF Correction                           │
│  (comprehensive-sf-correction-sender.service.ts)                │
│                                                                  │
│  STEP A: Final System-Wide Validation                           │
│  • Re-run on multiple test cases                                │
│  • Check for regressions                                        │
│  • Verify system-wide fixes work globally                       │
│                                                                  │
│  STEP B: Dual-AI Final Approval Gate                            │
│  • Both AIs review COMPLETE system state                        │
│  • Both must give final ✅ approval                             │
│  • If either rejects → Rollback ALL, escalate                   │
│                                                                  │
│  STEP C: Send Comprehensive Correction to SF                    │
│  • Include before/after values                                  │
│  • Include fix details (primary + system-wide)                  │
│  • Include dual-AI confidence scores                            │
│  • Include attempts taken (1, 2, or 3)                          │
│  • Include validation test results                              │
│                                                                  │
│  STEP D: Monitor SF Confirmation                                │
│  • Track SF acknowledgment                                      │
│  • Log complete outcome                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

Add to `.env`:

```bash
# Self-Healing System
SELF_HEALING_ENABLED=true
SELF_HEALING_DELAY_AFTER_WEBHOOK=60000  # 60 seconds (wait for SF)
SELF_HEALING_MAX_ATTEMPTS=3  # Retry up to 3 times
SELF_HEALING_AUTO_APPROVE_LOW_RISK=false  # Manual approval initially

# Dual-AI Configuration
DUAL_AI_CONSENSUS_REQUIRED=true  # Both AIs must approve
DUAL_AI_MIN_CONFIDENCE=70  # Minimum 70% confidence for consensus

# System-Wide Scanning
SYSTEM_WIDE_FIX_ENABLED=true  # Fix all similar issues, not just one
REGRESSION_TEST_REQUIRED=true  # Run tests before sending to SF

# AI Providers
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...

# Salesforce
SF_WEBHOOK_URL=https://your-sf-instance.com/webhook
SF_API_KEY=your-sf-api-key
```

---

## 📁 New Files Created

### ✅ Phase 1: Error Detection
- `src/services/self-healing/error-detector.service.ts` (already created)
  - **Enhanced**: Now waits 60 seconds after webhook sent before scanning

### ✅ Phase 2: Dual-AI Diagnostician
- `src/services/self-healing/dual-ai-diagnostician.service.ts` ✨ **NEW**
  - Runs OpenAI GPT-4o and xAI Grok-2 in parallel
  - Each AI analyzes independently
  - Cross-review: each AI critiques the other's diagnosis
  - Builds consensus fix (both must agree 70%+)
  - Plans system-wide scanning

### ✅ Phase 3: Comprehensive Fix Applicator
- `src/services/self-healing/comprehensive-fix-applicator.service.ts` ✨ **NEW**
  - Applies primary fix
  - Applies system-wide fixes (prevents recurrence)
  - Creates backups of ALL modified files
  - Validates syntax and runs tests
  - Rolls back if any validation fails

### ✅ Phase 4: Multi-Attempt Verifier
- `src/services/self-healing/multi-attempt-verifier.service.ts` ✨ **NEW**
  - Retry loop: up to 3 attempts
  - Each attempt: apply fix → reprocess → dual-AI review
  - Both AIs must approve to proceed
  - Generates improved fix if attempt fails
  - Escalates to human after 3 failed attempts

### ✅ Phase 5: Comprehensive SF Correction Sender
- `src/services/self-healing/comprehensive-sf-correction-sender.service.ts` ✨ **NEW**
  - Final system-wide validation
  - Dual-AI final approval gate
  - Builds comprehensive correction payload
  - Sends to SF with full metadata
  - Monitors SF confirmation

---

## 🚀 Deployment Steps

### Step 1: Enable in Environment

Update `.env`:
```bash
SELF_HEALING_ENABLED=true
SELF_HEALING_DELAY_AFTER_WEBHOOK=60000
DUAL_AI_CONSENSUS_REQUIRED=true
SYSTEM_WIDE_FIX_ENABLED=true
```

### Step 2: Integrate into Webhook Flow

Update `src/services/webhook.service.ts` to trigger self-healing **60 seconds after** sending webhook to SF:

```typescript
import errorDetector from './self-healing/error-detector.service';

async function sendWebhookToSF(job: any, response: any) {
  // Send webhook
  await axios.post(SF_WEBHOOK_URL, response);
  
  // Schedule self-healing scan for 60 seconds later
  if (process.env.SELF_HEALING_ENABLED === 'true') {
    setTimeout(async () => {
      const issues = await errorDetector.scanForIssuesAfterDelay(job.jobId);
      
      if (issues.length > 0) {
        // Trigger comprehensive self-healing process
        await triggerSelfHealing(issues[0]);
      }
    }, 60000); // 60 seconds
  }
}
```

### Step 3: Create Self-Healing Orchestrator

Create `src/services/self-healing/orchestrator.service.ts`:

```typescript
import dualAIDiagnostician from './dual-ai-diagnostician.service';
import comprehensiveFixApplicator from './comprehensive-fix-applicator.service';
import multiAttemptVerifier from './multi-attempt-verifier.service';
import comprehensiveSFCorrectionSender from './comprehensive-sf-correction-sender.service';
import logger from '../../utils/logger';

export async function runCompleteSelfHealing(issue: any, originalJob: any) {
  try {
    logger.info(`Starting complete self-healing for job ${originalJob.jobId}`);

    // PHASE 2: Dual-AI Diagnosis
    const consensus = await dualAIDiagnostician.diagnoseWithConsensus(issue);
    
    if (!consensus || !consensus.agreed) {
      logger.warn('No consensus reached. Escalating to human review.');
      return { success: false, reason: 'No AI consensus' };
    }

    // PHASE 3-4: Multi-Attempt Verification with Comprehensive Fixes
    const verificationResult = await multiAttemptVerifier.verifyWithRetry(
      consensus.selectedFix,
      originalJob,
      issue.rawPayload,
      issue.currentResponse
    );

    if (!verificationResult.success) {
      logger.error(`All ${verificationResult.totalAttempts} attempts failed. Escalating.`);
      return { success: false, reason: verificationResult.reason };
    }

    logger.info(`Fix validated after ${verificationResult.finalAttempt} attempt(s)`);

    // PHASE 5: Send Comprehensive Correction to SF
    const sfResult = await comprehensiveSFCorrectionSender.sendComprehensiveCorrection(
      originalJob,
      issue.currentResponse,
      verificationResult.finalResponse,
      verificationResult,
      consensus.selectedFix,
      consensus.selectedFix.systemWide
    );

    if (!sfResult.success) {
      logger.error(`SF correction failed: ${sfResult.reason}`);
      return { success: false, reason: sfResult.reason };
    }

    logger.info(`✅ Complete self-healing successful for job ${originalJob.jobId}`);

    return { success: true };

  } catch (error) {
    logger.error('Self-healing orchestrator error:', error);
    return { success: false, reason: error.message };
  }
}
```

### Step 4: Test the System

```bash
# 1. Start server
npm run dev

# 2. Send a test verification request
curl -X POST http://localhost:3001/api/verify/salesforce \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d @test-data/test-payload-1-chandelier.json

# 3. Wait 60 seconds...

# 4. Check logs for self-healing activity
tail -f logs/combined.log | grep "Self-Healing"

# Expected log output:
# [Self-Healing] Waiting 60 seconds for SF to process webhook...
# [Self-Healing] 60-second delay complete. Starting error scan...
# [Self-Healing] Found 1 issue requiring attention
# [Self-Healing] Starting dual-AI diagnosis...
# [Self-Healing] Dual analysis complete - OpenAI: 92% confidence, xAI: 89% confidence
# [Self-Healing] Consensus achieved with 91% confidence
# [Self-Healing] Applying comprehensive fix (primary + 2 system-wide fixes)...
# [Self-Healing] Attempt 1/3: Applying fix...
# [Self-Healing] OpenAI approval: true (95%), xAI approval: true (93%)
# [Self-Healing] ✅ SUCCESS! Both AIs approved the fix
# [Self-Healing] Running final system-wide validation...
# [Self-Healing] Dual-AI final approval obtained
# [Self-Healing] ✅ Comprehensive correction sent to Salesforce successfully!
```

---

## 📊 Monitoring & Observability

### Database Collections

**self_healing_logs** (create this collection):
```typescript
{
  jobId: string,
  issueType: string,
  detectedAt: Date,
  diagnosisTimestamp: Date,
  consensusAchieved: boolean,
  openaiDiagnosis: object,
  xaiDiagnosis: object,
  selectedFix: object,
  systemWideFixes: array,
  attemptsTaken: number,
  attempts: [
    {
      attemptNumber: number,
      openaiApproval: boolean,
      xaiApproval: boolean,
      timestamp: Date
    }
  ],
  finalOutcome: 'success' | 'failed' | 'escalated',
  sfCorrectionSent: boolean,
  completedAt: Date
}
```

### API Endpoints

Add to `src/routes/self-healing.routes.ts`:

```typescript
// Manual trigger
POST /api/self-healing/trigger
Body: { jobId: "abc123" }

// View status
GET /api/self-healing/status/:jobId

// View all self-healing activity
GET /api/self-healing/history?limit=50

// View metrics
GET /api/self-healing/metrics
Response: {
  totalIssuesDetected: 45,
  consensusRate: 0.92,
  averageAttempts: 1.3,
  successRate: 0.89,
  escalationRate: 0.11
}
```

---

## 🎯 Success Metrics

Target performance after 1 month:

| Metric | Target | Current |
|--------|--------|---------|
| Consensus Rate | >90% | TBD |
| First-Attempt Success | >70% | TBD |
| Overall Success Rate | >85% | TBD |
| Average Fix Time | <5 minutes | TBD |
| False Positive Rate | <5% | TBD |
| Escalation Rate | <15% | TBD |

---

## 🔄 Retry Logic Example

```
Job #12345 fails with missing "brand" field

T+0s    : Webhook sent to SF
T+60s   : Self-healing scans, finds issue
T+65s   : Dual-AI diagnosis starts
          OpenAI: "Missing alias 'manufacturer' → 'brand'" (92% conf)
          xAI: "Missing alias 'manufacturer' → 'brand'" (89% conf)
T+75s   : Consensus achieved, plan system-wide fix
          Primary: Add 'manufacturer' → 'brand'
          System-Wide: Add 'mfr', 'maker', 'producer' variations
T+80s   : Apply fixes, validate syntax ✅
T+85s   : 🔄 ATTEMPT 1: Re-process job #12345
T+90s   : Dual-AI review:
          OpenAI: Approved (95%)
          xAI: Approved (93%)
T+95s   : ✅ BOTH APPROVED - Attempt 1 succeeded!
T+100s  : Final system validation (test 10 other jobs) ✅
T+105s  : Dual-AI final approval ✅
T+110s  : Send comprehensive correction to SF ✅
T+115s  : SF acknowledges correction ✅

RESULT: Fixed in 1 attempt, 55 seconds total
```

---

## 🚨 Escalation Scenarios

Self-healing escalates to human when:

1. **No AI Consensus** - OpenAI and xAI disagree on root cause (< 70% confidence alignment)
2. **All 3 Attempts Failed** - Could not get both AIs to approve after 3 tries
3. **Final Approval Rejected** - Either AI rejects in final system validation
4. **SF Webhook Fails** - Salesforce does not acknowledge correction
5. **High Risk Fix** - Requires modifying complex logic or multiple critical files

Escalation notification sent to:
- Slack channel: `#self-healing-alerts`
- Email: `dev-team@yourcompany.com`
- Dashboard: Red alert on monitoring page

---

## 📝 Next Steps

1. ✅ Deploy configuration changes
2. ✅ Create orchestrator service
3. ✅ Integrate with webhook flow (60-second delay)
4. ✅ Set up monitoring dashboard
5. ✅ Test with known failing jobs
6. Monitor for 1 week with manual approval required
7. Enable auto-fix for low-risk changes (aliases, simple schema additions)
8. Expand to auto-fix medium-risk changes after validation
9. Keep high-risk changes as manual-approval-only

---

## 🎉 Expected Benefits

- **Reduced Manual Intervention**: 85%+ of simple issues auto-fixed
- **Faster Issue Resolution**: Minutes instead of hours/days
- **Better Data Quality**: System learns and improves continuously
- **Comprehensive Fixes**: Root causes eliminated, not just symptoms
- **Reduced Support Tickets**: Fewer Salesforce users reporting missing data

---

## 📞 Support

Questions? Check:
- `SELF-HEALING-SYSTEM-DESIGN.md` - Complete architecture
- `self_healing_changes.log` - All auto-applied changes
- Logs: `logs/combined.log` with grep filter: `grep "Self-Healing"`
