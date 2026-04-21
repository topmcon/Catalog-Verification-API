# AI Cost & Usage Audit — Universal Copilot Prompt
> Drop this file into any project. Fill in the **Application Context** section at the bottom.  
> Everything else is universal — works across any stack, language, or AI provider combination.

---

## How to Use This File

1. Open this file in your Copilot workspace
2. Fill in the fields in the **Application Context** section at the bottom
3. Say to Copilot: *"Read AI_AUDIT_PROMPT.md and execute it against this codebase"*
4. Do not allow Copilot to skip phases or combine changes — the sequence is mandatory

---

## Ground Rules (Enforced for Every Phase)

- **Show current code before changing anything — no exceptions**
- **Every change follows this exact sequence:**
  `see current code → show exact diff → syntax check → get approval → deploy`
- **Never combine changes across multiple files in a single operation**
- **Never restart the service without a clean syntax check first**
- **Never proceed to model changes without a confirmed quality baseline — see Phase 4**
- **Quality degradation is never acceptable. If post-change quality drops below baseline thresholds, revert immediately — do not attempt to tune forward from a degraded state**
- **If any phase produces unexpected output, stop and report — do not proceed**

---

## PHASE 1 — Discovery

Search the entire codebase for every AI API call. Include all providers:
- Anthropic / Claude
- OpenAI / GPT
- xAI / Grok
- Google Gemini / Vertex AI
- Mistral
- Cohere
- Any other LLM or vision API

For each call found, report:
- File name and line number
- Current hardcoded model string
- What the call is actually doing *(OCR, extraction, summarization, classification, reasoning, generation, etc.)*
- Whether a single model handles all tasks or different models are used per task
- Whether any task-type routing exists today

Deliver a single table with these columns:

| File | Function | Current Model | Task Description | Task Complexity |
|------|----------|---------------|------------------|-----------------|
| ... | ... | ... | ... | simple / medium / complex |

Do not proceed to Phase 2 until this table is complete and confirmed.

---

## PHASE 2 — Task Classification

For every AI call in the Phase 1 table, classify complexity using these definitions:

**Simple** — structured extraction, OCR, classification, JSON formatting, short summarization  
→ Cheap models are appropriate. Premium models here are wasted spend.

**Medium** — multi-step reasoning, quality evaluation, comparing options, structured analysis  
→ Mid-tier models appropriate.

**Complex** — open-ended generation, nuanced judgment, long-form reasoning, creative tasks  
→ Premium models justified.

Flag every case where a premium model is assigned to a simple task. These are the cost reduction targets.

If all tasks use the same model regardless of complexity, flag that as a finding — it means the application has no task-aware routing and is overpaying on every simple call.

---

## PHASE 3 — Cost Baseline

Pull the last 100 completed jobs from the database that have AI responses stored.

For each provider:
- Count actual output token sizes from stored responses: `len(response_text) / 4` as estimate if exact counts are not tracked
- Use the actual average input token count if tracked; otherwise use these starting estimates:
  - Anthropic (URL-based image): ~5,000–6,000 input tokens
  - OpenAI with `detail:high` (tiled image): ~25,000–30,000 input tokens
  - OpenAI with `detail:auto` or `detail:low`: ~5,000–8,000 input tokens
  - xAI (URL-based image): ~5,000–6,000 input tokens
  - Text-only calls: estimate from prompt length

Price each provider against:
1. Current models (baseline)
2. Recommended cheaper alternatives (see table below)

**Recommended cheaper alternatives by provider:**

| Provider | Current (Premium) | Cheaper Alternative | Use For |
|----------|-------------------|---------------------|---------|
| Anthropic | claude-sonnet-4, claude-3-5-sonnet | claude-3-haiku-20240307 | simple/medium |
| OpenAI | gpt-4o, gpt-4-turbo | gpt-4o-mini | simple/medium |
| xAI | grok-4 variants | No cheaper vision tier currently | — |
| Google | gemini-1.5-pro, gemini-2.0 | gemini-1.5-flash | simple/medium |
| Mistral | mistral-large | mistral-small | simple/medium |
| Cohere | command-r-plus | command-r | simple/medium |

Deliver:
- Current $/job and $/month
- Proposed $/job and $/month
- Total projected monthly savings
- Percentage reduction

**Important:** Note whether OpenAI is sending images as base64 or URL. Base64 and `detail:high` inflate input tokens significantly. Flag this if found — switching to URL + `detail:auto` can reduce OpenAI input tokens by 60–80% without accuracy loss on most tasks.

---

## PHASE 4 — Quality Baseline ⚠️ MANDATORY GATE

> **This phase is a hard gate. No model changes are permitted until a quality baseline is established, recorded, and confirmed. The numbers produced here become the revert thresholds used in Phase 8. Skipping this phase means you have no objective way to detect degradation after changes.**

### 4a — Identify quality signals

Search the codebase and database for every field that indicates output quality. Examples:
- Decode tier or confidence tier (e.g. tier 1 = library match, tier 4 = generic fallback)
- Confidence scores on extracted fields
- Consensus agreement rate across providers (when multiple AI providers are used)
- Field completion rate (how many expected output fields were populated vs null)
- Job success/failure rate
- Disputed vs validated field counts in consensus output
- Any human-review, correction, or override flags
- Downstream validation results (e.g. matched against a known catalog or external database)

Report every quality signal found with its current average value across the last 100–500 jobs.

### 4b — Establish the quality baseline

Run these queries against the last 14 days of completed jobs. Adapt table and column names to match this application:

**Job success rate:**
```sql
SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
    ROUND(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as success_pct
FROM jobs
WHERE created_at >= date('now', '-14 days');
```

**Primary quality metric distribution** (adapt to this app's quality signal):
```sql
SELECT
    quality_tier,
    COUNT(*) as jobs,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pct
FROM jobs
WHERE created_at >= date('now', '-14 days')
  AND quality_tier IS NOT NULL
GROUP BY quality_tier
ORDER BY quality_tier;
```

**Field extraction completeness:**
```sql
SELECT
    ROUND(AVG(CASE WHEN primary_field IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as primary_field_pct,
    ROUND(AVG(CASE WHEN secondary_field IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as secondary_field_pct
FROM jobs
WHERE status = 'COMPLETED'
  AND created_at >= date('now', '-14 days');
```

**Processing time:**
```sql
SELECT
    ROUND(AVG(processing_time_seconds), 1) as avg_sec,
    MIN(processing_time_seconds) as min_sec,
    MAX(processing_time_seconds) as max_sec
FROM jobs
WHERE status = 'COMPLETED'
  AND created_at >= date('now', '-14 days');
```

### 4c — Record the baseline and set revert thresholds

Produce this table and confirm it before any model changes proceed:

| Metric | Current Baseline | Revert Threshold | Notes |
|--------|-----------------|------------------|-------|
| Job success rate | e.g. 98.7% | ≥ 97.0% | Hard floor |
| Primary quality tier 1+2 | e.g. 81.0% | ≥ 75.0% | Hard floor |
| Primary field extraction | e.g. 100% | ≥ 95.0% | Hard floor |
| Secondary field extraction | e.g. 97.4% | ≥ 92.0% | Hard floor |
| Avg processing time | e.g. 45.6s | ≤ 90s | Soft ceiling |

**Revert threshold rule:** Set each threshold at 5 percentage points below the current baseline, or at the minimum acceptable business level — whichever is higher. If the minimum acceptable level is unknown, ask before proceeding.

### 4d — Check for confounding changes

Before proceeding, confirm whether any other changes are planned or recently deployed that could affect quality metrics — library updates, prompt changes, pipeline logic changes, database migrations, upstream data format changes. Document these. If other changes are actively in flight, complete and stabilize them before running this audit. Mixing model changes with other simultaneous changes makes it impossible to correctly attribute quality shifts.

---

## PHASE 5 — Usage Tracking

Check whether token and cost tracking exists. Look for any table or service tracking:
`provider, model, input_tokens, output_tokens, cost, job_id, created_at`

**If tracking does not exist, create it.**

### 5a — Create the tracking table

```sql
CREATE TABLE IF NOT EXISTS ai_usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    estimated_cost_microdollars INTEGER DEFAULT 0,
    task_type TEXT DEFAULT 'extraction',
    success BOOLEAN DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> **Why microdollars?** Storing cost as `dollars * 1,000,000` avoids integer truncation on sub-cent values. A call costing $0.000023 stores as `23` — readable and lossless. Divide by 1,000,000 to get dollars in queries.

### 5b — Add tracking after every AI response

Add this block immediately after each provider's response parsing. Wrap in `try/except` — tracking must never block or fail a job.

**Pattern (adapt field names per provider):**

```python
try:
    ai_usage_log_insert(
        job_id=job_id,
        provider="anthropic",           # or "openai", "xai", "google", etc.
        model=_model,
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
        estimated_cost_microdollars=round((
            (response.usage.input_tokens / 1_000_000 * INPUT_PRICE) +
            (response.usage.output_tokens / 1_000_000 * OUTPUT_PRICE)
        ) * 1_000_000),
        task_type=task_type,
        success=True,
    )
except Exception:
    pass  # never block the job
```

**Token field names by provider:**

| Provider | Input Tokens | Output Tokens |
|----------|-------------|---------------|
| Anthropic | `response.usage.input_tokens` | `response.usage.output_tokens` |
| OpenAI | `response.usage.prompt_tokens` | `response.usage.completion_tokens` |
| xAI | `result["usage"]["prompt_tokens"]` | `result["usage"]["completion_tokens"]` |
| Google Gemini | `response.usage_metadata.prompt_token_count` | `response.usage_metadata.candidates_token_count` |
| Mistral | `response.usage.prompt_tokens` | `response.usage.completion_tokens` |

### 5c — Add a reporting query

Create a script `cost_report.py` (or equivalent) that produces a daily cost breakdown:

```sql
SELECT
    date(created_at) as date,
    provider,
    model,
    COUNT(*) as calls,
    SUM(input_tokens) as total_input,
    SUM(output_tokens) as total_output,
    ROUND(SUM(estimated_cost_microdollars) / 1000000.0, 4) as cost_usd
FROM ai_usage_log
WHERE created_at >= date('now', '-14 days')
GROUP BY date(created_at), provider, model
ORDER BY date DESC, cost_usd DESC;
```

---

## PHASE 6 — Model Optimization

For every provider class where a single model handles all tasks, implement task-aware model selection.

### 6a — Replace single model with two-tier model config

```python
# BEFORE
self.model = "premium-model-name"

# AFTER
self.model_extraction = "cheaper-model-name"   # simple/medium tasks
self.model_reasoning  = "premium-model-name"   # complex tasks only
```

### 6b — Add task_type parameter to the call method

```python
# BEFORE
async def analyze(self, image_url: str, prompt: str) -> Dict:

# AFTER
async def analyze(self, image_url: str, prompt: str, task_type: str = "extraction") -> Dict:
    _model = self.model_reasoning if task_type == "reasoning" else self.model_extraction
```

**The default must be `"extraction"`** so all existing callers continue working without any changes. Only calls that explicitly need the premium model pass `task_type="reasoning"`.

### 6c — Update callers only if necessary

If the method signature change requires caller updates (e.g. a base class enforces it), update callers to pass `task_type="extraction"` explicitly. This makes the intent visible in the code.

Do not update callers that already work via the default — unnecessary churn.

### 6d — Check image delivery method for OpenAI

If OpenAI is sending images as base64:
```python
# Likely expensive — downloads image, encodes, sends inline
image_data = base64.b64encode(img_bytes).decode()
{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
```

Switch to URL delivery with `detail:auto`:
```python
# Cheaper — OpenAI fetches directly, uses appropriate detail level
{"type": "image_url", "image_url": {"url": image_url, "detail": "auto"}}
```

> **Note:** `detail:low` forces 85 tokens regardless of image size but may hurt accuracy on small text. `detail:auto` lets the API decide — usually the right tradeoff for label/document images.

---

## PHASE 7 — Deployment Validation

After **every individual file change**, run all of the following before moving to the next change.

### Syntax check
```bash
python3 -m py_compile path/to/modified_file.py && echo "SYNTAX OK"
```
Must return `SYNTAX OK`. Fix before proceeding if it fails.

### Service restart and health check
```bash
systemctl restart [SERVICE_NAME]
sleep 4
curl -s http://localhost:[PORT]/health
```
Must return healthy. If the service fails to start, check logs immediately — do not proceed.

### Provider instantiation check
```python
from app.ai.provider import Provider
p = Provider("test")
print("extraction:", p.model_extraction)
print("reasoning: ", p.model_reasoning)
```
Must print the expected model strings for both tiers.

### Live job validation
Watch logs for the next 3–5 real jobs:
```bash
tail -n 0 -f logs/app.log | grep -E "completed successfully|ERROR|404" --line-buffered
```
All providers must show `completed successfully`. Any `404` or model error means a wrong model string — fix immediately before any more jobs run.

### Cost tracking validation
After the first job completes post-change:
```sql
SELECT provider, model, input_tokens, output_tokens,
    ROUND(estimated_cost_microdollars/1000000.0, 6) as cost_usd
FROM ai_usage_log
ORDER BY created_at DESC
LIMIT 9;
```
Expect one row per provider per job. All values must be non-zero.

### Cost comparison
Re-run the cost baseline script and compare to the Phase 3 number. Confirm the per-job cost dropped as expected.

---

## PHASE 8 — Quality Verification ⚠️ MANDATORY POST-CHANGE GATE

> **This phase runs after every model change without exception. Results are compared against the Phase 4 baseline. Any metric below its revert threshold triggers an immediate rollback — no debate, no waiting to see if it improves.**

### 8a — Wait for sufficient sample size

Do not run quality verification until at least 50 jobs have completed under the new models. For high-volume applications, wait for 200+ jobs. Check job count since the change:

```sql
SELECT COUNT(*) as jobs_since_change
FROM jobs
WHERE created_at >= '[TIMESTAMP_OF_CHANGE]'
  AND status = 'COMPLETED';
```

If volume is low and it will take more than 48 hours to reach 50 jobs, run a preliminary check at 20 jobs and flag any early warning signs.

### 8b — Run quality comparison

Re-run every query from Phase 4b using the post-change time window. Produce a side-by-side comparison:

| Metric | Phase 4 Baseline | Post-Change | Delta | Threshold | Status |
|--------|-----------------|-------------|-------|-----------|--------|
| Job success rate | 98.7% | ? | ? | ≥ 97.0% | ✅ / ❌ |
| Primary quality tier 1+2 | 81.0% | ? | ? | ≥ 75.0% | ✅ / ❌ |
| Primary field extraction | 100% | ? | ? | ≥ 95.0% | ✅ / ❌ |
| Secondary field extraction | 97.4% | ? | ? | ≥ 92.0% | ✅ / ❌ |
| Avg processing time | 45.6s | ? | ? | ≤ 90s | ✅ / ❌ |

### 8c — Decision rule

**All metrics ✅** → Change confirmed. Proceed to Phase 9.

**Any metric ❌** → Stop immediately. Do not attempt to tune forward from a degraded state.

Execute rollback:
```python
# Revert model strings to pre-change values
self.model_extraction = "[ORIGINAL_MODEL]"
self.model_reasoning  = "[ORIGINAL_MODEL]"
```
Restart service → confirm health → confirm quality metrics return to baseline → report which metric failed, by how much, and the likely cause before attempting any further changes.

### 8d — Separating model effects from other changes

Quality shifts observed post-model-change may not be caused by the model. Before attributing a change to the model swap, confirm:
- No other code was deployed in the same window
- No upstream data changes occurred (new image types, new input formats, schema changes)
- The sample is large enough (50+ jobs minimum, 200+ preferred)

If confounding changes exist, document them. Do not block a clean model change because of an unrelated quality shift — but do not dismiss a real regression because another change was also in flight.

---

## PHASE 9 — Final Report

Produce a complete summary once all phases are confirmed clean.

### Model changes
| Provider | Old Model | New Model | Old $/job | New $/job | Monthly Savings |
|----------|-----------|-----------|-----------|-----------|-----------------|
| ... | ... | ... | ... | ... | ... |

### Quality confirmation
| Metric | Baseline | Post-Change | Delta | Status |
|--------|----------|-------------|-------|--------|
| ... | ... | ... | ... | ✅ |

### Completion checklist
- [ ] All provider classes have `model_extraction` and `model_reasoning` attributes
- [ ] `task_type="extraction"` default set — no existing callers broken
- [ ] `ai_usage_log` populating on every real job with non-zero token counts
- [ ] `estimated_cost_microdollars` non-zero (confirms no integer truncation)
- [ ] Syntax check passed on all modified files
- [ ] Service healthy after restart
- [ ] Live jobs confirmed clean in logs (no 404s, no model errors)
- [ ] Quality verification passed — all metrics above revert thresholds
- [ ] Phase 4 baseline and Phase 8 comparison table saved for future reference
- [ ] Git committed with descriptive message
- [ ] Production and git repo in sync
- [ ] Cost report script updated with real validated token averages

### Token averages — update after first real batch
Once 50+ jobs have run through the new models:
```sql
SELECT provider,
    ROUND(AVG(input_tokens)) as avg_input,
    ROUND(AVG(output_tokens)) as avg_output
FROM ai_usage_log
GROUP BY provider;
```
Update the cost report script with these real numbers — they replace the Phase 3 estimates.

---

## Ongoing Monitoring

### Weekly cost check
```sql
SELECT
    date(created_at) as date,
    provider,
    COUNT(*) as calls,
    ROUND(SUM(estimated_cost_microdollars)/1000000.0, 4) as cost_usd,
    ROUND(AVG(input_tokens)) as avg_input,
    ROUND(AVG(output_tokens)) as avg_output
FROM ai_usage_log
WHERE created_at >= date('now', '-7 days')
GROUP BY date(created_at), provider
ORDER BY date DESC;
```

### Weekly quality check
```sql
SELECT
    quality_tier,
    COUNT(*) as jobs,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pct
FROM jobs
WHERE created_at >= date('now', '-7 days')
  AND quality_tier IS NOT NULL
GROUP BY quality_tier
ORDER BY quality_tier;
```

### After any provider pricing change
Re-run Phase 3 cost baseline with current token averages from `ai_usage_log`. Update cost report script if pricing changed.

### After any model deprecation notice
Re-run Phase 4 quality baseline → Phase 6 model optimization targeting the replacement model → Phase 8 quality verification. Same process, same gates, every time.

---

## Application Context
*(Filled in for Catalog Verification API — VERIFIED Apr 21, 2026)*

```
Stack:                  Express.js (plain, not NestJS)
Language:               TypeScript (Node.js 20+)
Database:               MongoDB (Docker container, localhost:27017)
AI providers in use:    OpenAI (GPT-4.1) + xAI (Grok-3/4) — primary dual-AI verification
                        Anthropic (Claude Sonnet 4-6) — used in self-healing diagnostics only
Primary AI task:        Dual-AI product catalog verification (OpenAI + xAI consensus),
                        category classification, attribute extraction, web search enrichment,
                        self-healing diagnostics (Claude + GPT)
Production server:      ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com
Service name:           systemctl: catalog-verification.service
Health endpoint:        https://verify.cxc-ai.com/health
App directory:          /opt/catalog-verification-api
Primary quality signal: consensusAchieved (boolean) in self-healing logs,
                        verification job status (completed/failed),
                        webhook delivery success rate to Salesforce
Minimum quality floor:  Job success rate >= 97%, webhook delivery >= 98%,
                        consensus achievement >= 70% (dual-AI agreement)

EXISTING INFRASTRUCTURE (verified Apr 21, 2026):
- ✅ AIUsage model exists: src/models/ai-usage.model.ts
- ✅ MODEL_PRICING table exists with current rates for all providers
- ✅ TaskType enum defined (verification, cross-validation, research, image-analysis, etc.)
- ❓ TODO: Audit whether usage tracking is actually being called after every AI request
- ❓ TODO: Verify data is being persisted to MongoDB ai_usage collection
```

---

*Generated from a validated production implementation — Image Verification API, April 2026.*  
*Tested against: FastAPI + SQLite + Anthropic + OpenAI + xAI on Ubuntu 24 with uvicorn.*  
*Quality gate pattern validated: model change from premium to cheaper models with zero quality  
degradation confirmed across 300+ jobs and all Phase 8 thresholds passing.*
