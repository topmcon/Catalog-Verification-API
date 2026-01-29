# 🚀 SELF-HEALING SYSTEM - QUICK START GUIDE

**Status:** Phase 1 Implementation Ready  
**Last Updated:** January 29, 2026

---

## 📋 WHAT YOU HAVE NOW

✅ **Complete Architecture Design** - `SELF-HEALING-SYSTEM-DESIGN.md`  
✅ **Phase 1 Implementation** - Error detection service ready to use  
✅ **Database Models** - Ready to implement  
✅ **API Endpoints** - Defined and ready

---

## 🎯 HOW IT WORKS

```
AUTOMATED FLOW (After Every API Call):

1. Verification completes → Saved to MongoDB
2. Self-Healing Detector scans (every 5 minutes)
3. AI analyzes root cause
4. Fix automatically applied
5. Re-process failed job
6. Send corrected data to Salesforce

TIMELINE: 5-15 minutes from failure to fix
```

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Enable Error Detection (Today - 15 mins)

1. **Add to your environment variables** (`.env`):
```bash
# Self-Healing Configuration
SELF_HEALING_ENABLED=true
SELF_HEALING_SCAN_INTERVAL=300000  # 5 minutes
SELF_HEALING_MIN_ISSUE_FREQUENCY=3  # Fix if seen 3+ times
SELF_HEALING_REQUIRE_APPROVAL=true  # Start with manual approval
```

2. **Start the error detector in your main app**:
```typescript
// src/index.ts (add after database connection)

import selfHealingErrorDetector from './services/self-healing/error-detector.service';

// In main() function, after DB connects:
if (process.env.SELF_HEALING_ENABLED === 'true') {
  const scanInterval = parseInt(process.env.SELF_HEALING_SCAN_INTERVAL || '300000');
  selfHealingErrorDetector.start(scanInterval);
  logger.info('[Self-Healing] Error detector started');
}
```

3. **Test it**:
```bash
# Restart your server
npm run dev

# You'll see in logs:
# [Self-Healing] Starting error detection service
# [Self-Healing] Starting issue scan...
# [Self-Healing] Scan complete { totalIssues: X }
```

---

### Step 2: Add Database Model (Today - 10 mins)

Create `src/models/self-healing-log.model.ts`:

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ISelfHealingLog extends Document {
  logId: string;
  triggeredAt: Date;
  completedAt?: Date;
  status: 'analyzing' | 'fixing' | 'testing' | 'completed' | 'failed' | 'rolled_back';
  
  issue: {
    jobIds: string[];
    issueType: string;
    severity: string;
    description: string;
    frequency: number;
  };
  
  diagnosis?: {
    rootCause: string;
    fixType: string;
    aiConfidence: number;
    aiModel: string;
  };
  
  fix?: {
    targetFile: string;
    backupFile: string;
    codeChange: any;
    appliedAt: Date;
  };
  
  results?: {
    jobsReprocessed: number;
    jobsFixed: number;
    fieldsImproved: number;
  };
}

const SelfHealingLogSchema = new Schema<ISelfHealingLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    triggeredAt: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ['analyzing', 'fixing', 'testing', 'completed', 'failed', 'rolled_back'],
      default: 'analyzing'
    },
    issue: {
      jobIds: [String],
      issueType: String,
      severity: String,
      description: String,
      frequency: Number
    },
    diagnosis: {
      rootCause: String,
      fixType: String,
      aiConfidence: Number,
      aiModel: String
    },
    fix: {
      targetFile: String,
      backupFile: String,
      codeChange: Schema.Types.Mixed,
      appliedAt: Date
    },
    results: {
      jobsReprocessed: Number,
      jobsFixed: Number,
      fieldsImproved: Number
    }
  },
  {
    timestamps: true,
    collection: 'self_healing_logs'
  }
);

export const SelfHealingLog = mongoose.model<ISelfHealingLog>(
  'SelfHealingLog',
  SelfHealingLogSchema
);
```

---

### Step 3: Add API Endpoints (Today - 20 mins)

Create `src/routes/self-healing.routes.ts`:

```typescript
import { Router } from 'express';
import selfHealingErrorDetector from '../services/self-healing/error-detector.service';
import { SelfHealingLog } from '../models/self-healing-log.model';
import { asyncHandler, apiKeyAuth } from '../middleware';

const router = Router();

// Trigger immediate scan
router.post('/trigger', apiKeyAuth, asyncHandler(async (_req, res) => {
  const issues = await selfHealingErrorDetector.triggerScan();
  
  res.json({
    success: true,
    issuesDetected: issues.length,
    issues: issues.slice(0, 10), // First 10
    message: issues.length > 0 
      ? `Detected ${issues.length} issues for analysis` 
      : 'No issues detected'
  });
}));

// Get detection status
router.get('/status', apiKeyAuth, asyncHandler(async (_req, res) => {
  const recentLogs = await SelfHealingLog.find()
    .sort({ triggeredAt: -1 })
    .limit(10)
    .lean();
  
  const stats = await SelfHealingLog.aggregate([
    { $group: {
        _id: '$status',
        count: { $sum: 1 }
    }}
  ]);
  
  res.json({
    success: true,
    enabled: process.env.SELF_HEALING_ENABLED === 'true',
    recentActivity: recentLogs,
    stats: stats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {} as Record<string, number>)
  });
}));

// Get issue history
router.get('/history', apiKeyAuth, asyncHandler(async (req, res) => {
  const { limit = 50, status } = req.query;
  
  const query: any = {};
  if (status) query.status = status;
  
  const history = await SelfHealingLog.find(query)
    .sort({ triggeredAt: -1 })
    .limit(parseInt(limit as string))
    .lean();
  
  res.json({
    success: true,
    count: history.length,
    history
  });
}));

export default router;
```

Then add to `src/routes/index.ts`:

```typescript
import selfHealingRoutes from './self-healing.routes';

// Add this line with other routes:
router.use('/api/self-healing', apiKeyAuth, selfHealingRoutes);
```

---

### Step 4: Test Error Detection (Today - 5 mins)

```bash
# Trigger a manual scan
curl -X POST -H "x-api-key: YOUR_KEY" \
  http://localhost:3001/api/self-healing/trigger

# Check status
curl -H "x-api-key: YOUR_KEY" \
  http://localhost:3001/api/self-healing/status

# View history
curl -H "x-api-key: YOUR_KEY" \
  http://localhost:3001/api/self-healing/history
```

Expected output:
```json
{
  "success": true,
  "issuesDetected": 3,
  "issues": [
    {
      "issueType": "missing_data",
      "description": "Fields missing despite data in payload: Brand_Verified,Width_Verified",
      "affectedCount": 5,
      "severity": "medium",
      "priority": 7
    }
  ]
}
```

---

## 📈 NEXT PHASES (Implementation Timeline)

### Phase 2: AI Diagnostic Engine (Week 1)
**Files to Create:**
- `src/services/self-healing/ai-diagnostician.service.ts`
- Integrate GPT-4o to analyze detected issues
- Generate fix recommendations

**Test Command:**
```bash
curl -X POST -H "x-api-key: KEY" \
  http://localhost:3001/api/self-healing/diagnose/:issueId
```

---

### Phase 3: Fix Applicator (Week 2)
**Files to Create:**
- `src/services/self-healing/fix-applicator.service.ts`
- File backup system
- Code modification logic
- Syntax validation

**Test Command:**
```bash
curl -X POST -H "x-api-key: KEY" \
  http://localhost:3001/api/self-healing/apply-fix/:issueId
```

---

### Phase 4: Reprocessor (Week 3)
**Files to Create:**
- `src/services/self-healing/reprocessor.service.ts`
- Re-run verification with fixes
- Result comparison

**Test Command:**
```bash
curl -X POST -H "x-api-key: KEY" \
  http://localhost:3001/api/self-healing/reprocess/:jobId
```

---

### Phase 5: Salesforce Correction Sender (Week 4)
**Files to Create:**
- `src/services/self-healing/sf-correction-sender.service.ts`
- Send only corrected fields to SF
- Track SF acknowledgments

**Salesforce Webhook Format:**
```json
{
  "type": "correction",
  "originalJobId": "uuid-123",
  "SF_Catalog_Id": "12345",
  "fieldsUpdated": ["Brand_Verified"],
  "updates": {
    "Brand_Verified": {
      "old": null,
      "new": "Kohler",
      "confidence": 95
    }
  },
  "fixApplied": {
    "type": "add_alias",
    "description": "Added 'manufacturer' → 'brand' alias"
  }
}
```

---

## 🎛️ CONFIGURATION OPTIONS

```bash
# .env

# Enable/Disable
SELF_HEALING_ENABLED=true

# Detection Settings
SELF_HEALING_SCAN_INTERVAL=300000      # 5 minutes
SELF_HEALING_MIN_ISSUE_FREQUENCY=3     # Fix if seen 3+ times
SELF_HEALING_LOOKBACK_HOURS=24         # Analyze last 24 hours

# AI Diagnostic
SELF_HEALING_AI_MODEL=gpt-4o           # or claude-opus-3
SELF_HEALING_AI_CONFIDENCE_THRESHOLD=75 # Min confidence to apply fix

# Safety
SELF_HEALING_REQUIRE_APPROVAL=true     # Manual approval required
SELF_HEALING_MAX_FIXES_PER_HOUR=10     # Rate limit
SELF_HEALING_AUTO_ROLLBACK=true        # Rollback on new errors
SELF_HEALING_TEST_BEFORE_APPLY=true    # Test fix before applying

# Salesforce Updates
SELF_HEALING_SEND_CORRECTIONS=true
SF_CORRECTION_WEBHOOK_URL=https://salesforce.com/api/corrections

# Notifications
SELF_HEALING_NOTIFY_ON_FIX=true
ADMIN_EMAIL=admin@example.com
```

---

## 🔍 MONITORING

### Dashboard Metrics (to build)
- Issues detected per day
- Auto-fix success rate
- Average time to resolution
- Top issue types
- Fields improved over time

### Alerts
Set up alerts for:
- ✅ Fix applied successfully
- ⚠️ Fix failed validation
- 🔄 Fix rolled back
- 📊 High-priority issue detected
- 📈 Error rate increased after fix

---

## 📊 EXAMPLE WORKFLOW

### Scenario: Missing Brand Field

**11:00 AM** - API call completes, Brand_Verified is null despite "Manufacturer: Kohler" in payload

**11:05 AM** - Error detector scans, finds 5 jobs with same issue

**11:06 AM** - AI diagnoses: "Field 'Manufacturer' not mapped to Brand_Verified. Need alias."

**11:07 AM** - Fix generated: Add `'manufacturer': 'brand'` to FIELD_ALIASES

**11:08 AM** (Manual Mode) - Admin reviews fix, approves

**11:09 AM** - Fix applied, file backed up

**11:10 AM** - Re-process 5 failed jobs with new alias

**11:11 AM** - All 5 jobs now have Brand_Verified = "Kohler"

**11:12 AM** - Send corrections to Salesforce

**11:15 AM** - Salesforce updates records, acknowledges corrections

**Result:** Issue detected and resolved in 15 minutes, all affected records corrected!

---

## 🚦 DEPLOYMENT CHECKLIST

### Development (Now)
- [x] Architecture designed
- [x] Error detector implemented
- [ ] Database models created
- [ ] API endpoints added
- [ ] Tested on local environment

### Staging (Week 1)
- [ ] AI diagnostic engine integrated
- [ ] Fix applicator implemented
- [ ] Manual approval UI created
- [ ] Tested with real failures

### Production (Week 4)
- [ ] All phases complete
- [ ] Full end-to-end testing
- [ ] Monitoring dashboard live
- [ ] SF correction webhook tested
- [ ] Auto-fix enabled (with approval)

### Full Automation (Month 2)
- [ ] 2+ weeks of successful fixes
- [ ] False positive rate <2%
- [ ] Auto-approval for low-risk fixes
- [ ] Human approval for complex fixes only

---

## 💡 QUICK WINS (Week 1)

Even before full automation, you can use the error detector to:

1. **Identify patterns** - What fields are consistently missing?
2. **Manual fixes** - See the diagnosis, apply fixes manually
3. **Prioritize work** - Focus on high-frequency issues first
4. **Track improvements** - Measure field population rates over time

---

## 🎯 SUCCESS METRICS

**Track these KPIs:**
- **Detection Rate:** % of fixable issues detected
- **Fix Success Rate:** % of fixes that resolve the issue
- **Time to Resolution:** Average hours from detection to fix
- **Field Improvement:** % increase in field population
- **SF Update Success:** % of corrections accepted by SF
- **False Positives:** % of fixes that caused new issues

**Target Goals (Month 3):**
- Detection rate: >90%
- Fix success rate: >95%
- Time to resolution: <30 minutes
- Field improvement: +15% populated fields
- SF update success: >98%
- False positives: <2%

---

## 📞 SUPPORT & NEXT STEPS

**Ready to Start?**
1. Enable error detection (Step 1) today
2. Monitor for 24 hours to see patterns
3. Review detected issues
4. Plan Phase 2 (AI diagnostic) implementation

**Need Help?**
- Check `SELF-HEALING-SYSTEM-DESIGN.md` for full architecture
- Review `src/services/self-healing/error-detector.service.ts` for code
- Run `node scripts/review-errors.js` to see current errors

**Questions?**
- How many issues are detected daily?
- What are the most common patterns?
- Should we prioritize certain fix types?
- When to enable auto-fix without approval?

---

**🚀 You're ready to start! Enable Phase 1 today and watch it detect issues automatically.**
