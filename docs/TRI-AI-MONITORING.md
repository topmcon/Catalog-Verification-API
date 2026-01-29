# Tri-AI Architecture Monitoring Guide

## Deployment Information
- **Architecture**: OpenAI (Analyst #1) + xAI (Analyst #2) → Claude (Judge)
- **Deployed**: 2026-01-29 18:35:22 UTC
- **Commit**: 4767c00
- **Service PID**: 2471263

## Quick Commands

### Real-Time Monitoring
```bash
# Run comprehensive monitor
./scripts/monitor-tri-ai.sh

# Live log stream (tri-AI only)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "tail -f /opt/catalog-verification-api/logs/combined.log" | \
  grep --line-buffered -E 'tri-AI|OpenAI|xAI|Claude|judge|Decision:'

# Service health
curl -s https://verify.cxc-ai.com/health
```

### Metrics Extraction
```bash
# Count analyst invocations
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -c 'analyzeWithOpenAI' /opt/catalog-verification-api/logs/combined.log"

# Count judge decisions
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -c 'claudeReviewAndJudge' /opt/catalog-verification-api/logs/combined.log"

# Approval vs escalation rate
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -E 'Decision: (approve|escalate)' /opt/catalog-verification-api/logs/combined.log | \
   sort | uniq -c"

# xAI error tracking
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -c 'xAI.*error\|grok-2-latest' /opt/catalog-verification-api/logs/combined.log"
```

## Key Metrics to Track

### 🎯 Success Indicators

| Metric | Target | Description |
|--------|--------|-------------|
| **Consensus Rate** | >70% | OpenAI + xAI agree on root cause |
| **Approval Rate** | >75% | Claude approves deployment |
| **Fix Success Rate** | >90% | Deployed fixes resolve issues |
| **xAI Errors** | 0 | No grok-2-latest 404 errors |
| **Response Time** | <10s | Total tri-AI analysis time |

### 📊 Activity Metrics

| Metric | Log Pattern | Calculation |
|--------|-------------|-------------|
| **OpenAI Analyses** | `analyzeWithOpenAI` | Count occurrences |
| **xAI Analyses** | `analyzeWithXAI` | Count occurrences |
| **Claude Judgments** | `claudeReviewAndJudge` | Count occurrences |
| **Approvals** | `Decision: approve` | Count occurrences |
| **Escalations** | `Decision: escalate` | Count occurrences |
| **Semantic Matches** | `semantic agreement detected` | Count occurrences |

### ⚠️ Error Indicators

| Error Type | Pattern | Expected Count | Action if >0 |
|------------|---------|----------------|--------------|
| **xAI API Errors** | `xAI.*error` | 0 | Check xAI API status |
| **Old Model Usage** | `grok-2-latest` | 0 | Should be using grok-3 |
| **OpenAI Failures** | `OpenAI.*failed` | 0 | Check OpenAI API key |
| **Claude Failures** | `Claude.*failed` | 0 | Check Anthropic API key |

## Architecture Validation Checklist

### ✅ First 24 Hours (Post-Deployment)

- [ ] **Independence Verified**: OpenAI and xAI logs show parallel execution
- [ ] **Judge Role Active**: Claude logs show reviewing both analyses
- [ ] **Model Upgrade**: No `grok-2-latest` in logs, only `grok-3`
- [ ] **Semantic Understanding**: Logs show contextual agreement detection
- [ ] **Decision Authority**: Claude making final approve/escalate calls
- [ ] **No Peer Discussion**: No logs of 3-way collaborative consensus
- [ ] **Confidence Levels**: >80% for analysts, >85% for judge
- [ ] **Zero xAI Errors**: No 404s or API errors from xAI

### 📈 Week 1 Analysis

- [ ] **Consensus Patterns**: Identify common agreement scenarios
- [ ] **Escalation Analysis**: Review what triggers human review
- [ ] **Model Performance**: Compare OpenAI vs xAI accuracy
- [ ] **Claude Validation**: Verify judge decisions match expected outcomes
- [ ] **Cost Analysis**: Calculate per-diagnosis costs
- [ ] **Response Times**: Measure average analysis duration
- [ ] **Fix Deployment**: Track success rate of approved fixes

### 🎯 30-Day Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| xAI Errors | 0 | TBD | 🟡 Monitoring |
| Consensus Rate | >70% | TBD | 🟡 Monitoring |
| Approval Rate | >75% | TBD | 🟡 Monitoring |
| Fix Success | >90% | TBD | 🟡 Monitoring |
| Avg Response | <10s | TBD | 🟡 Monitoring |

## Log Analysis Examples

### Expected Log Flow (Single Verification)

```
[INFO] 🔍 Tri-AI diagnosis starting for verification job abc123
[INFO] OpenAI + xAI analyzing independently in parallel
[INFO] OpenAI (gpt-4o) analysis complete: confidence=85%
[INFO] xAI (grok-3) analysis complete: confidence=82%
[INFO] Claude reviewing both analyses and making final decision
[INFO] Semantic agreement detected: "missing color field" ≈ "color not extracted"
[INFO] Claude (sonnet-4) judgment: Decision=approve, confidence=88%
[INFO] ✅ Tri-AI consensus achieved! Deploying fix...
```

### Error Flow (xAI API Issue)

```
[INFO] OpenAI + xAI analyzing independently in parallel
[INFO] OpenAI (gpt-4o) analysis complete: confidence=85%
[ERROR] xAI analysis failed: 404 model not found (grok-2-latest)
[INFO] Proceeding with OpenAI-only diagnosis
[WARN] Tri-AI degraded mode: Only 1 analyst available
```
**Expected After Fix**: No errors, both analysts complete successfully

### Escalation Flow (Low Confidence)

```
[INFO] Claude reviewing both analyses and making final decision
[INFO] OpenAI confidence=65%, xAI confidence=62%
[WARN] Both analysts below 75% confidence threshold
[INFO] Claude (sonnet-4) judgment: Decision=escalate, confidence=55%
[INFO] 🔴 Escalating to human review: Low analyst confidence
```

## Troubleshooting

### Issue: xAI Errors Persist

**Symptoms**: Logs show `grok-2-latest` or 404 errors

**Resolution**:
```bash
# Check deployed model name
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep 'grok-' /opt/catalog-verification-api/dist/services/dual-ai-diagnostician.service.js"

# Should show: model: 'grok-3'
# If not, rebuild and redeploy
```

### Issue: No Tri-AI Activity

**Symptoms**: No tri-AI logs appearing

**Resolution**:
```bash
# Check if verification jobs are running
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -c 'Starting verification' /opt/catalog-verification-api/logs/combined.log"

# Check service status
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl status catalog-verification"

# Restart if needed
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl restart catalog-verification"
```

### Issue: Low Approval Rate

**Symptoms**: >50% escalations

**Resolution**:
1. Review escalated cases for patterns
2. Check if confidence thresholds too high (analysts: 75%, judge: 80%)
3. Analyze if semantic agreement too strict
4. Consider prompt tuning for specific domain knowledge

## Dashboard Queries

### Daily Summary
```bash
#!/bin/bash
TODAY=$(date +%Y-%m-%d)
LOG="/opt/catalog-verification-api/logs/combined.log"

echo "=== TRI-AI DAILY SUMMARY: $TODAY ==="
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "
  grep '$TODAY' $LOG | {
    echo 'Total Verifications:' \$(grep -c 'Starting verification')
    echo 'Tri-AI Diagnoses:' \$(grep -c 'Tri-AI diagnosis starting')
    echo 'Approvals:' \$(grep -c 'Decision: approve')
    echo 'Escalations:' \$(grep -c 'Decision: escalate')
    echo 'xAI Errors:' \$(grep -c 'xAI.*error')
  }
"
```

### Model Usage Report
```bash
#!/bin/bash
LOG="/opt/catalog-verification-api/logs/combined.log"

echo "=== MODEL USAGE REPORT ==="
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "
  grep -E 'model.*gpt-4o|model.*grok|model.*claude' $LOG | tail -100 | {
    echo 'OpenAI (gpt-4o):' \$(grep -c 'gpt-4o')
    echo 'xAI (grok-3):' \$(grep -c 'grok-3')
    echo 'xAI (grok-2-latest):' \$(grep -c 'grok-2-latest')
    echo 'Claude (sonnet-4):' \$(grep -c 'claude-sonnet-4')
  }
"
```

## Next Steps

### Immediate (Today)
1. ✅ Monitor first 10 verification jobs
2. ✅ Verify no xAI errors (grok-3 working)
3. ✅ Confirm OpenAI + xAI independence
4. ✅ Validate Claude judge role

### This Week
1. Track consensus patterns
2. Analyze escalation triggers
3. Measure response times
4. Calculate cost per diagnosis
5. Review fix deployment success

### This Month
1. Optimize confidence thresholds
2. Tune semantic agreement detection
3. Refine AI prompts based on patterns
4. Document common issue types
5. Consider model upgrades if available

## Success Criteria

**Architecture Correct When**:
- ✅ OpenAI and xAI execute in parallel (not sequential)
- ✅ No cross-contamination between analysts
- ✅ Claude reviews both independently
- ✅ Claude makes final decision (not collaborative vote)
- ✅ Semantic agreement (not exact string matching)
- ✅ Zero xAI errors (grok-3 working)

**Production Ready When**:
- ✅ Consensus rate >70%
- ✅ Approval rate >75%
- ✅ xAI error rate = 0%
- ✅ Response time <10s average
- ✅ Fix success rate >90%

---

**Last Updated**: 2026-01-29 18:36 UTC  
**Status**: 🟢 Deployed and Monitoring  
**Next Review**: 2026-01-30 18:36 UTC (24h post-deployment)
