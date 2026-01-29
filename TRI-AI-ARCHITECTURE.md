# Tri-AI Self-Healing Architecture

## Overview
Enhanced self-healing system with three-tier AI validation:
- **OpenAI GPT-4o** - Junior AI #1
- **xAI Grok-3** - Junior AI #2  
- **Claude Sonnet 4.5** - Senior AI (Final Reviewer & Deployer)

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Issue Detection                                    │
│ - Detect missing fields, mapping failures, logic errors     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ PHASE 2A: Junior AI Analysis (Parallel)                     │
│ ┌─────────────────┐         ┌─────────────────┐            │
│ │  OpenAI GPT-4o  │         │   xAI Grok-3    │            │
│ │                 │         │                 │            │
│ │ - Root cause    │         │ - Root cause    │            │
│ │ - Evidence      │         │ - Evidence      │            │
│ │ - Proposed fix  │         │ - Proposed fix  │            │
│ │ - Confidence    │         │ - Confidence    │            │
│ └────────┬────────┘         └────────┬────────┘            │
│          │                           │                      │
└──────────┼───────────────────────────┼──────────────────────┘
           │                           │
┌──────────▼───────────────────────────▼──────────────────────┐
│ PHASE 2B: Peer Review (Cross-validation)                    │
│                                                              │
│  OpenAI reviews xAI's diagnosis  ←→  xAI reviews OpenAI's  │
│  - Agrees/Disagrees                  - Agrees/Disagrees     │
│  - Concerns                          - Concerns             │
│  - Suggestions                       - Suggestions          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ PHASE 2C: Senior AI Final Review (Claude Sonnet 4.5)        │
│                                                              │
│  Reviews:                                                    │
│  ├─ OpenAI diagnosis + confidence                           │
│  ├─ xAI diagnosis + confidence                              │
│  ├─ Peer review feedback                                    │
│  └─ Preliminary consensus                                   │
│                                                              │
│  Decision Paths:                                            │
│  ┌────────────────────────────────────────────────┐         │
│  │ Strong Consensus (both agree, >85%)            │         │
│  │ → Validate & Approve ✅                         │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │ Agrees with ONE AI                             │         │
│  │ → Choose that solution ✅                       │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │ Minor Concerns (consensus 70-85%)              │         │
│  │ → Approve with added safety checks ⚠️          │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │ DISAGREES WITH BOTH (<70% agreement)           │         │
│  │ → CONDUCT INDEPENDENT RESEARCH 🔬              │         │
│  │                                                 │         │
│  │   Research Steps:                              │         │
│  │   1. Re-analyze raw Salesforce payload         │         │
│  │   2. Deep dive into codebase                   │         │
│  │   3. Search for similar patterns               │         │
│  │   4. Check what data is actually available     │         │
│  │   5. Validate if bug is real or data missing   │         │
│  │   6. Formulate alternative solution            │         │
│  │                                                 │         │
│  │ → Propose Claude's independent solution ✅     │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │ High Risk / Uncertainty                        │         │
│  │ → ESCALATE to human ⛔                          │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  Output:                                                     │
│  ├─ Final decision (approve/escalate)                       │
│  ├─ Deployment plan with safety checks                      │
│  ├─ Rollback procedure                                      │
│  └─ Independent research findings (if conducted)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ PHASE 3-4: Implementation & Verification                    │
│                                                              │
│  ├─ Apply code fixes (selected by Claude)                   │
│  ├─ Multi-attempt verification (retry logic)                │
│  ├─ Test with real Salesforce payload                       │
│  ├─ Validate all fields populated correctly                 │
│  └─ Send corrected data back to Salesforce                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                  ┌────▼────┐
                  │ SUCCESS │
                  └─────────┘
```

---

## Cost Optimization

### Scenario 1: Strong Consensus (75% of cases)
**API Calls:** 2 (OpenAI + xAI)
- OpenAI analysis: ~$0.03
- xAI analysis: ~$0.02
- **Total: ~$0.05**

### Scenario 2: Weak Consensus or Single AI Agreement (15% of cases)
**API Calls:** 3 (OpenAI + xAI + Claude validation)
- OpenAI + xAI: ~$0.05
- Claude review: ~$0.04
- **Total: ~$0.09**

### Scenario 3: Claude Independent Research (10% of cases)
**API Calls:** 3 (OpenAI + xAI + Claude deep dive)
- OpenAI + xAI: ~$0.05
- Claude research: ~$0.08 (larger context)
- **Total: ~$0.13**

**Average cost per self-healing run:** ~$0.06
**Savings vs always-3-AI:** ~60%

---

## Claude's Decision Matrix

| Scenario | Junior AIs Agreement | Claude Action |
|----------|---------------------|---------------|
| **High Consensus** | Both agree (>85% overlap) | Validate safety → Deploy ✅ |
| **Medium Consensus** | Both agree (70-85% overlap) | Add safety checks → Deploy ⚠️ |
| **One AI Better** | Disagree, but one is clearly right | Choose better solution → Deploy ✅ |
| **Both Wrong** | Disagree, Claude finds issues in both | Independent research → New solution 🔬 |
| **High Risk** | Any uncertainty about safety | Escalate to human ⛔ |

---

## Independent Research Triggers

Claude conducts independent research when:
1. ✅ Both AIs propose different solutions (no consensus)
2. ✅ Consensus exists but Claude identifies logical flaws
3. ✅ Proposed fixes have medium-high risk level
4. ✅ Root cause analysis seems incomplete
5. ✅ Evidence doesn't support the proposed fix

**Research Process:**
```typescript
1. Re-analyze raw payload from scratch
   - Check what data is actually available
   - Validate field mappings
   
2. Code analysis
   - Search for similar issues in codebase
   - Check field inference logic
   - Review picklist matchers
   
3. Validate root cause
   - Is it a code bug or legitimately missing data?
   - Are there alternative extraction methods?
   
4. Propose solution
   - Either validate one AI's approach
   - Or create independent solution
   - Or escalate if too uncertain
```

---

## Safety Mechanisms

### 1. Multi-Layer Validation
- Junior AIs must provide evidence
- Peer review catches obvious flaws
- Claude validates all reasoning chains

### 2. Confidence Thresholds
- <70%: Automatic escalation
- 70-85%: Claude adds extra safety checks
- >85%: Standard deployment

### 3. Rollback Plan
- Claude always generates rollback procedure
- Git-based version control
- Health monitoring post-deployment

### 4. Human Escalation
Escalate to human when:
- Claude rejects deployment
- Risk level is HIGH
- Consensus <70%
- Breaking changes detected
- Multiple system-wide fixes needed

---

## API Configuration

```env
# Required for tri-AI system
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Disable Claude (falls back to dual-AI only)
# ANTHROPIC_API_KEY=
```

---

## Logging & Monitoring

**Phase 2 Logs:**
```
[Phase 2] Starting tri-AI diagnosis (OpenAI + xAI → Claude)...
[Phase 2] Junior AI analysis complete - OpenAI: 90%, xAI: 92%
[Phase 2] 🎯 Claude Final Decision: approve_consensus
[Phase 2] ✅ Consensus achieved!
```

**Independent Research Logs:**
```
[Phase 2] 🔬 Claude conducted independent research
[Phase 2] 📊 Findings: 4 key insights
[Phase 2] Claude's alternative solution selected
```

**Rejection Logs:**
```
[Phase 2] ❌ Claude rejected deployment
[Phase 2] Reason: High risk - breaking changes detected
[Phase 2] 🚨 ESCALATING TO HUMAN REVIEW
```

---

## Example Scenarios

### Scenario A: Quick Consensus
```
OpenAI: "Missing field alias 'dB Rating' → add to noise_level aliases"
xAI:    "Missing field alias 'dB Rating' → add to noise_level aliases"
Claude: "✅ Both correct. Simple fix. Low risk. DEPLOY."
Result: Deployed in 15 seconds
```

### Scenario B: One AI Better
```
OpenAI: "Add new field 'Material' to schema"
xAI:    "Map 'Material' field to existing Color+Finish fields"
Claude: "xAI is correct. We don't create new fields. DEPLOY xAI's solution."
Result: Deployed with xAI's approach
```

### Scenario C: Independent Research
```
OpenAI: "Code bug - field inference doesn't check spec table"
xAI:    "Code bug - picklist matcher has wrong threshold"
Claude: "🔬 Let me investigate..."
  → Checks raw payload
  → Finds data exists in 'Specification_Table' HTML
  → Realizes spec table parser isn't called
  → "Both partially right. Root cause: Spec table parser disabled."
  → Proposes: Re-enable spec table parsing + add field aliases
Result: Deployed Claude's comprehensive fix
```

### Scenario D: Escalation
```
OpenAI: "Rewrite entire field inference system"
xAI:    "Rewrite entire picklist matcher"
Claude: "⛔ Both propose breaking changes. Risk too high. ESCALATE."
Result: Human review required
```

---

## Benefits

✅ **Higher accuracy** - 3 AIs catch more bugs than 2
✅ **Independent validation** - Claude can override bad consensus
✅ **Cost efficient** - Only uses Claude when needed
✅ **Safer deployments** - Senior AI validates safety
✅ **Smart escalation** - Knows when to ask humans
✅ **Research capability** - Claude can investigate independently

---

## Next Steps

1. Set `ANTHROPIC_API_KEY` in production environment
2. Deploy updated code
3. Test with real failed jobs
4. Monitor Claude's decision patterns
5. Adjust confidence thresholds based on results
