# 🚀 ENHANCED SELF-HEALING QUICK START

## ✅ Pre-Deployment Checklist

### Phase 1: Configuration (5 minutes)

- [ ] **Add to `.env`:**
  ```bash
  SELF_HEALING_ENABLED=true
  SELF_HEALING_DELAY_AFTER_WEBHOOK=60000
  SELF_HEALING_MAX_ATTEMPTS=3
  DUAL_AI_CONSENSUS_REQUIRED=true
  DUAL_AI_MIN_CONFIDENCE=70
  SYSTEM_WIDE_FIX_ENABLED=true
  REGRESSION_TEST_REQUIRED=false  # Enable after testing
  OPENAI_API_KEY=sk-...  # Your OpenAI key
  XAI_API_KEY=xai-...    # Your xAI key
  SF_WEBHOOK_URL=https://your-sf-instance.com/webhook
  SF_API_KEY=your-sf-key
  ```

### Phase 2: Code Integration (10 minutes)

- [ ] **Integrate into webhook service:**
  - Open `src/services/webhook.service.ts` (or wherever you send SF webhooks)
  - Add after sending webhook:
    ```typescript
    import selfHealingOrchestrator from './self-healing/orchestrator.service';
    
    // After sending webhook to SF
    if (process.env.SELF_HEALING_ENABLED === 'true') {
      await selfHealingOrchestrator.scheduleAfterWebhook(job.jobId);
    }
    ```

- [ ] **Add API routes (optional):**
  - Create `src/routes/self-healing.routes.ts` (copy from `INTEGRATION-EXAMPLE.ts`)
  - Add to `src/app.ts`:
    ```typescript
    import selfHealingRoutes from './routes/self-healing.routes';
    app.use('/api/self-healing', selfHealingRoutes);
    ```

### Phase 3: Database Setup (5 minutes)

- [ ] **Create SelfHealingLog model** (optional but recommended):
  ```typescript
  // src/models/self-healing-log.model.ts
  import mongoose from 'mongoose';

  const selfHealingLogSchema = new mongoose.Schema({
    jobId: { type: String, required: true, index: true },
    issueType: String,
    detectedAt: Date,
    diagnosisTimestamp: Date,
    consensusAchieved: Boolean,
    openaiDiagnosis: Object,
    xaiDiagnosis: Object,
    selectedFix: Object,
    systemWideFixes: Array,
    attemptsTaken: Number,
    attempts: Array,
    finalOutcome: String, // 'success' | 'failed' | 'escalated'
    sfCorrectionSent: Boolean,
    completedAt: Date
  }, { timestamps: true });

  export const SelfHealingLog = mongoose.model('SelfHealingLog', selfHealingLogSchema);
  ```

### Phase 4: Testing (15 minutes)

- [ ] **Start server:**
  ```bash
  npm run dev
  ```

- [ ] **Find a known failing job:**
  ```bash
  # Query MongoDB for a job with missing data
  db.api_trackers.findOne({ "issues.type": "missing_top15_field" })
  ```

- [ ] **Manually trigger self-healing:**
  ```bash
  curl -X POST http://localhost:3001/api/self-healing/trigger \
    -H "Content-Type: application/json" \
    -H "x-api-key: YOUR_API_KEY" \
    -d '{"jobId": "PASTE_JOB_ID_HERE"}'
  ```

- [ ] **Watch logs in real-time:**
  ```bash
  tail -f logs/combined.log | grep -E "Self-Healing|Phase"
  ```

- [ ] **Expected log output:**
  ```
  [Self-Healing] 🔧 STARTING SELF-HEALING FOR JOB: abc123
  [Phase 1] Detecting issues...
  [Phase 1] ✅ Detected issue: missing_data (medium severity)
  [Phase 2] Starting dual-AI diagnosis...
  [Phase 2] ✅ Consensus achieved!
  [Phase 3-4] Starting multi-attempt verification...
  [Phase 3-4] ✅ Fix validated after 1 attempt(s)!
  [Phase 5] ✅ Comprehensive correction sent to Salesforce successfully!
  [Self-Healing] ✅ SELF-HEALING COMPLETE
  ```

### Phase 5: Validation (10 minutes)

- [ ] **Verify fix was applied:**
  ```bash
  # Check if files were modified
  git status
  
  # Should show changes in files like:
  # - src/services/smart-field-inference.service.ts
  # - src/config/schemas/*.ts
  # etc.
  ```

- [ ] **Check backup files exist:**
  ```bash
  ls -la .self-healing-backups/
  
  # Should see backup files with timestamps
  ```

- [ ] **Re-run verification on same payload:**
  ```bash
  # Re-run the original failing job
  # It should now succeed with all fields populated
  ```

- [ ] **Check Salesforce received correction:**
  - Look in SF for the catalog item
  - Verify missing fields are now populated
  - Check metadata shows "correctionType": "dual-ai-self-healing"

### Phase 6: Production Deployment (30 minutes)

- [ ] **Review all changes:**
  ```bash
  git diff
  ```

- [ ] **Commit self-healing fixes:**
  ```bash
  git add -A
  git commit -m "Add enhanced self-healing system with dual-AI consensus"
  git push origin main
  ```

- [ ] **Deploy to production:**
  ```bash
  # See .github/copilot-instructions.md for deploy command
  ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "/opt/catalog-verification-api/deploy.sh"
  ```

- [ ] **Monitor production logs:**
  ```bash
  ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log" | grep "Self-Healing"
  ```

- [ ] **Set up alerts:**
  - Configure Slack webhook for escalations
  - Set up email alerts for failed self-healing attempts
  - Add dashboard monitoring for self-healing metrics

---

## 📊 Success Criteria

After deployment, within 24 hours you should see:

- ✅ **Self-healing triggers automatically** for jobs with missing data
- ✅ **Dual-AI consensus achieved** in 85%+ of cases
- ✅ **First-attempt success** in 70%+ of issues
- ✅ **SF corrections sent** with comprehensive metadata
- ✅ **System-wide improvements** visible in code (multiple aliases added, schemas updated)
- ✅ **Escalations only** for truly complex issues (< 15%)

---

## 🔍 Monitoring Commands

### Check recent self-healing activity:
```bash
grep "Self-Healing" logs/combined.log | tail -20
```

### Count successful vs failed:
```bash
grep "SELF-HEALING COMPLETE" logs/combined.log | wc -l  # Successes
grep "ESCALATING" logs/combined.log | wc -l             # Escalations
```

### View consensus achievements:
```bash
grep "Consensus achieved" logs/combined.log
```

### Check SF corrections sent:
```bash
grep "Comprehensive correction sent to Salesforce" logs/combined.log
```

---

## 🚨 Troubleshooting

### Issue: No self-healing triggers
**Check:**
- Is `SELF_HEALING_ENABLED=true` in `.env`?
- Is orchestrator integrated into webhook service?
- Are there actually failed jobs with issues?

### Issue: No AI consensus
**Check:**
- Are both `OPENAI_API_KEY` and `XAI_API_KEY` valid?
- Is `DUAL_AI_MIN_CONFIDENCE` too high? (try 60 instead of 70)
- Check logs for API errors

### Issue: Fix applied but validation fails
**Check:**
- Are TypeScript compilation errors present? (`npx tsc --noEmit`)
- Are there syntax errors in modified files?
- Is `REGRESSION_TEST_REQUIRED=true` causing test failures?

### Issue: SF correction not received
**Check:**
- Is `SF_WEBHOOK_URL` correct?
- Is `SF_API_KEY` valid?
- Check SF logs for webhook reception
- Verify network connectivity to SF

---

## 📞 Support

- **Documentation**: See `ENHANCED-SELF-HEALING-GUIDE.md`
- **Architecture**: See `SELF-HEALING-SYSTEM-DESIGN.md`
- **Implementation**: See `ENHANCED-IMPLEMENTATION-SUMMARY.md`
- **Integration**: See `INTEGRATION-EXAMPLE.ts`

---

## ⏱️ Total Setup Time

- **Configuration**: 5 min
- **Code Integration**: 10 min
- **Database Setup**: 5 min
- **Testing**: 15 min
- **Validation**: 10 min
- **Production Deploy**: 30 min
- **TOTAL**: ~75 minutes (1.25 hours)

---

**Ready to deploy?** Start with Phase 1 (Configuration) and work through the checklist! 🚀
