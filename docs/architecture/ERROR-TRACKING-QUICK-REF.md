# 🚀 ERROR TRACKING - QUICK REFERENCE

**Last Updated:** January 29, 2026

---

## ✅ YES - YOU HAVE COMPLETE ERROR TRACKING!

Every API call with an error is captured in **3 places**:

1. **MongoDB `verification_jobs`** - Full request + error message
2. **MongoDB `api_trackers`** - Detailed analytics + categorized issues
3. **File `logs/error.log`** - Structured error logs

---

## 📊 QUICK QUERIES

### Check Recent Failed Jobs (MongoDB Compass or Shell)
```javascript
db.verification_jobs.find({ 
  status: 'failed' 
}).sort({ createdAt: -1 }).limit(10)
```

### Get Error Rate (Last 24 Hours)
```javascript
db.verification_jobs.aggregate([
  { $match: { 
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
  }},
  { $group: { _id: '$status', count: { $sum: 1 } }}
])
```

### Find Specific Model Number Errors
```javascript
db.verification_jobs.find({ 
  sfCatalogName: 'YOUR-MODEL-NUMBER',
  status: 'failed'
})
```

---

## 🛠️ QUICK COMMANDS

### Run Error Review Script
```bash
# Last 24 hours
node scripts/review-errors.js

# Last 7 days
node scripts/review-errors.js --days 7

# Failed jobs only
node scripts/review-errors.js --failed-only
```

### Check Error Logs
```bash
# View recent errors
tail -50 logs/error.log

# Live error stream
tail -f logs/error.log

# Search for specific error
grep "OpenAI timeout" logs/combined.log
```

### Check Queue Stats (API)
```bash
curl -H "x-api-key: YOUR_KEY" \
  https://verify.cxc-ai.com/api/verify/salesforce/queue/stats
```

---

## 🎯 COMMON ERROR TYPES

| Type | What It Means | Action |
|------|---------------|--------|
| `ai_error` | OpenAI/xAI API failed | Check API keys, rate limits |
| `consensus_failure` | AIs couldn't agree | Review category schema |
| `missing_data` | Required field missing | Check SF payload |
| `category_mismatch` | Invalid category | Update picklist or aliases |
| `low_confidence` | Confidence < threshold | May need research |
| `timeout` | Processing took too long | Optimize or increase timeout |
| `research_failed` | Web scraping failed | URL unreachable |

---

## 🔄 REPLAY FAILED REQUEST

```javascript
// 1. Get failed job
const job = await VerificationJob.findOne({ jobId: 'FAILED-JOB-ID' });

// 2. Extract payload
const payload = job.rawPayload;

// 3. Retry
const result = await verifyProductWithDualAI(payload, newSessionId);
```

---

## 📈 ERROR MONITORING LOCATIONS

### MongoDB Collections
- `verification_jobs` - All jobs with status + errors
- `api_trackers` - Detailed analytics + issue flags
- `failed_match_logs` - Picklist mismatches

### File System
- `logs/error.log` - Error-only log (37KB)
- `logs/combined.log` - All logs (224KB)
- `logs/comparison/` - Before/after analysis

### API Endpoints
- `/api/verify/salesforce/queue/stats` - Queue stats
- `/api/verify/salesforce/status/:jobId` - Job status
- `/api/ai-analytics/dashboard` - AI analytics
- `/api/failed-matches` - Unmatched items

---

## 🚨 WHEN TO INVESTIGATE

**Investigate if:**
- ❌ Error rate > 5%
- ❌ Same error repeating > 10 times
- ❌ Critical severity issues
- ❌ Timeout errors increasing
- ❌ Category consensus failures spiking

**Don't worry if:**
- ✅ Error rate < 2%
- ✅ Errors are diverse (different products/issues)
- ✅ Low severity issues only

---

## 💾 DATA RETENTION

- **MongoDB:** Unlimited (manually purge old data if needed)
- **Logs:** 30 files max, 100MB per file (auto-rotated)
- **Raw Payloads:** Controlled by `TRACK_RAW_PAYLOADS` env var

---

## 🔧 ENABLE/DISABLE FEATURES

### Store Full Payloads
```bash
# .env
TRACK_RAW_PAYLOADS=true  # Store complete request/response in api_trackers
```

**Note:** `verification_jobs` ALWAYS stores `rawPayload` regardless.

---

## 📞 QUICK HELP

**View this guide:**
```bash
cat ERROR-TRACKING-OVERVIEW.md
```

**Run error review:**
```bash
node scripts/review-errors.js
```

**Check logs:**
```bash
tail -f logs/error.log
```

**Query MongoDB:**
```javascript
// Failed jobs
db.verification_jobs.find({ status: 'failed' }).sort({ createdAt: -1 })

// Error patterns
db.api_trackers.find({ overallStatus: 'failed' })
```

---

**✅ Every API error is captured - you can review them all!**
