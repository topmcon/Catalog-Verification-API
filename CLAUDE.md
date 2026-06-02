# CLAUDE.md — Catalog Verification API

> This file is read by Claude Code at session start. Keep it in sync with `.github/copilot-instructions.md`.
> **Sync rule**: Any procedure, finding, or architectural change added to one file must be added to the other.

---

## 🕐 TIMEZONE & DATE

**User timezone: US Eastern (EST/EDT) — NOT UTC.**
- UTC - 5h = EST (winter) | UTC - 4h = EDT (summer)
- When naming session files (e.g. `SESSION-SUMMARY-YYYY-MM-DD`), use the Eastern Time date
- Production logs show EST times

---

## ⚠️ CRITICAL: PRODUCTION-FIRST OPERATIONS

**ALWAYS DEFAULT TO PRODUCTION SERVER** unless explicitly told otherwise.

- ✅ **DO**: Execute on production via SSH (`ssh mardeys-prod` — see SSH section)
- ❌ **DON'T**: Run locally unless user says "test locally" or "run dev"
- Local workspace is for **CODE EDITING ONLY**, not execution

Examples:
- "Check logs" → SSH to production, tail production logs
- "Test API" → Test `https://verify.cxc-ai.com/api/...`
- "Check recent jobs" → Query production MongoDB

---

## SSH Access

### This Mac (macOS with `~/.ssh/config` alias)

```bash
ssh mardeys-prod "<command>"
```

The `mardeys-prod` alias in `~/.ssh/config` maps to:
- Host: `134.209.123.173` (verify.cxc-ai.com)
- User: `root`
- IdentityFile: `~/.ssh/id_ed25519`

> **Note**: The copilot-instructions.md references `~/.ssh/cxc_ai_deploy` — that key does not exist on this Mac. Use `mardeys-prod` alias instead. In Codespaces/other environments the `cxc_ai_deploy` key may be present.

### Common SSH Commands

| Action | Command |
|--------|---------|
| Check commit | `ssh mardeys-prod "cat /opt/catalog-verification-api/.git/refs/heads/main \| cut -c1-7"` |
| Service status | `ssh mardeys-prod "systemctl status catalog-verification \| head -15"` |
| Restart service | `ssh mardeys-prod "systemctl restart catalog-verification"` |
| View logs | `ssh mardeys-prod "tail -50 /opt/catalog-verification-api/logs/combined.log"` |
| Live log stream | `ssh mardeys-prod "tail -f /opt/catalog-verification-api/logs/combined.log"` |
| Full deploy | `ssh mardeys-prod "cd /opt/catalog-verification-api && git pull origin main && npm install && npm run build && systemctl restart catalog-verification"` |

---

## Quick Reference — Slash Commands

### "Establish Connection"

1. **SSH Connectivity**: `ssh mardeys-prod "echo connected"`
2. **Commit Sync Check**: Compare local / GitHub / production commits
3. **Service Health**: `ssh mardeys-prod "systemctl status catalog-verification | head -15"`
4. **Port Check**: `ssh mardeys-prod "ss -tlnp | grep -E '(3001|27017|443|80)'"` — all 4 must be listening
5. **API Health**: `curl -s https://verify.cxc-ai.com/health` → expect `{"status":"healthy"}`
6. **Session Analytics**: `ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/show-session-analytics.js"`
7. **Pending Picklist Syncs**: `ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/check-pending-picklist-syncs.js"` — never auto-approve CRITICAL severity
8. **Pending Creation Requests**: `ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/check-pending-creation-requests.js"` — report but do NOT auto-action
9. **Most Recent Session Summary**: Display from `session-notes/` folder
10. **Report Status Table** (local / GitHub / production commits, service, API health, pending syncs, creation requests)
11. **Ask**: "Would you like to continue from where we left off?"

**Sync verification command:**
```bash
LOCAL=$(git rev-parse --short HEAD) && \
GITHUB=$(git ls-remote origin main | cut -c1-7) && \
PROD=$(ssh mardeys-prod "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7") && \
echo "LOCAL: $LOCAL | GITHUB: $GITHUB | PROD: $PROD" && \
if [ "$LOCAL" = "$GITHUB" ] && [ "$GITHUB" = "$PROD" ]; then echo "✅ ALL SYNCED"; else echo "⚠️ OUT OF SYNC"; fi
```

---

### "Save Everything"

1. **Create session summary** in `session-notes/SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md` (150–250 lines min, cold-start pickup document — include: context/why, architecture context, detailed work, files modified, commits, system state, remaining issues, next steps, key reference files)

2. **⚠️ UPDATE AUDIT FINDINGS** — if any bugs were fixed, update `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md`

3. **Pre-deployment validation** (for all code changes):
   ```bash
   bash scripts/pre-deploy-validate-all.sh
   ```
   9 checks: TypeScript compilation, dependency consistency, feature completeness, title system runtime, title generation, picklist fields, hardcoded lists, field mapping reference, style cross-reference. **DEPLOYMENT BLOCKED** if any critical check fails.

4. **Version architecture docs**:
   ```bash
   bash scripts/version-architecture-docs.sh
   ```

5. `git status` → `git add -A` → commit with descriptive message → `git push origin main`

6. **Deploy to production**:
   ```bash
   ssh mardeys-prod "cd /opt/catalog-verification-api && git pull origin main && npm install && npm run build && systemctl restart catalog-verification"
   ```

7. **Verify all 3 environments synced** (re-run sync verification command above — must show ALL SYNCED before procedure is complete)

8. **Health check**: `curl -s https://verify.cxc-ai.com/health`

9. **Report**: files changed, commit hash, sync status, service health

---

### "Verify Batch"

```bash
ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/verify-batch.js"
```
Auto-detects the most recent contiguous job cluster. Flags: `--size=N`, `--minutes=N`, `--catalog=ID`.
Reports: status breakdown, quality metrics, AI cost breakdown, self-healing activity, per-job issues (CRIT/HIGH/MED/INFO), recommendations.

---

### "Run Live Logger" / "Start Live Logger"

```bash
ssh mardeys-prod "tail -f /opt/catalog-verification-api/logs/combined.log"
```
Run as background terminal. Filter noise: `GET /health`, `Server started`, `MongoDB connected`, `Picklists loaded`, `Puppeteer`, `POST /api/picklists/sync`.

For each job observed, report: incoming call (SF Catalog ID, Brand, Category, Type) → Pipeline decisions → Claude review (PASS/FLAG/FAIL, confidence, corrections) → Final output (schema title vs Claude title, corrections applied, model match, webhook status).

Proactive alerts: 🔴 title duplication, 🔴 FAIL review status, 🔴 webhook failure, 🟡 MISMATCH schema vs Claude title, 🟡 unusually long processing (>300s).

---

### "API Accuracy Report"

```bash
ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"
```
Audits last 300 unique API calls from Salesforce. Checks brand, category, subcategory, style, weight, numeric fields, title length (60-80 chars), ID fields, hardcoded list sync.

---

## System Architecture & AI Pipeline

### High-Level Flow

```
Salesforce Webhook POST /api/verify/salesforce
  → Controller (202 immediately, job saved as pending)
  → Async Processor (polls every 5s, 100 concurrent max)
  → verifyProductWithDualAI()
  → Result POSTed back to Salesforce webhook URL
  → SF confirms via POST /api/verify/salesforce/confirm
```

### Preprocessing (Phase 0)

| Phase | What it does |
|-------|-------------|
| 0.0 | Canadian detection — `Web_Retailer_Key` starts with `CA_` → convert CAD→USD, kg→lbs |
| 0.1A | Unpack `Ferguson_Raw_Data` nested JSON → fill empty flat fields |
| 0.2 | Ferguson priority validation — always US market, flag MSRP discrepancy >30% |
| 0.5 | Pre-research — scrape URLs/PDFs/images if `dataSourceScenario` is `no_sources`, `ferguson_only`, or `web_retailer_only` |
| 0.9 | Token management — smart truncation if medium risk |

**Data source scenarios**: `both_sources` (no research), `web_retailer_only`, `ferguson_only`, `no_sources` (research required).

### Three-Stage AI Analysis (OpenAI + xAI in Parallel)

**Stage 1 — Department**: Both AIs independently determine department. Agreement → use it. Disagreement → prefer OpenAI. Department sets data source priority: Appliances use Web Retailer, all others use Ferguson.

**Stage 2 — Category**:
- **Path A (Appliances)**: SF-anchored. Both AIs validate `Web_Retailer_Category`. Both disagree with SF → AI consensus overrides SF. AIs disagree with each other → title tiebreaker → SF as final.
- **Path B (Non-Appliances)**: Unbiased. No anchor. Agreement → use it. Disagreement → title keyword tiebreaker → Ferguson signal → best-guess.
- Post-category corrections: `Mirror` + Plumbing context → `Bathroom Mirror`; lighted mirror in lighting → `Bathroom Mirror`.

**Stage 3 — Detailed Extraction**: Both AIs get confirmed department + category → extract Brand, Type, Style, Color, Finish, Width, Height, Depth, Weight, MSRP, Model Number, Features, UPC, Top-15 filter attributes, additional attributes.

**Post-Stage-3 Type Validation**: One AI valid/one invalid → force both to valid. Both invalid → fuzzy match (0.85) → retry → "Not Found". Both valid/different → prefer `primary_filter` type.

### Consensus Building (Phase 2)

- Exact match → agreed
- Disagree → smart resolution:
  1. Research data match → prefer AI matching research
  2. Ferguson-only fields → "Not Found" if no Ferguson
  3. Text fields → prefer longer (>30% diff) or one with model number
  4. Style → prefer higher picklist similarity
  5. Type → category TYPE_PRIORITY hierarchy
  6. Numeric → within 1% → prefer more precise; otherwise escalate
- Post-consensus: `validateConsensusCategory()` checks category+type business rules (e.g., Icemaker ≠ Freezer type)

**Confidence formula**: `(aiConfidence × 0.3) + (agreement% × 0.4) + (categoryMatch × 0.2) + (researchBonus × 0.1)`

### Cross-validation (Phase 3), Research (Phases 4-5), Final Web Search (Phase 6)

Phase 3: If category disagreement remains, each AI reviews the other's result. Phases 4-5: Up to 3 retries for unresolved fields using external research. Phase 6: Targeted web search with confirmed category+brand+model for any remaining "Not Found" fields.

### Final Review Stage

**Phase A — Automated Validation (always runs)**: Category keyword cross-check, brand validation, dimension sanity, Canadian conversion validation, type/category compatibility, title structure. `requiresAIReview` is hardcoded `true`.

**Phase B — Claude Review**:
- `requiresAIReview && !isAppliancesDept` → **runs Claude review**
- `requiresAIReview && isAppliancesDept` → **SKIPS Claude review** (926ad6b restore — Appliances use pre-Claude pipeline behavior)
- Claude receives full product data, same picklist/schema/business rules as primary AIs, Phase A warnings
- Can propose corrections to: category, department, type, style, title, finish, color, brand, model_number
- Returns: `PASS` / `FLAG` / `FAIL`, confidence, proposed corrections

**⚠️ Known behavior**: When Claude proposes a title correction, the system currently logs `"Claude corrected title but using schema-generated version (preserves formatting rules)"` and uses the schema title regardless. This means Claude's more accurate title (correct width, correct model number) is being overridden by a schema title built from potentially wrong field values. This is an active source of bad responses — see Known Issues below.

### Title Generation

Schema per category loaded from `config/title-schema-by-category.ts`. Slot order: `Brand + Primary_Spec + Configuration/Type + Installation + Category + Finish + Model`.

Key slot rules:
- **Configuration slot** (Finding #063): Specific types (French Door, Top-Freezer, Outdoor, etc.) suppress generic configs (Single Door, Combination, Convertible). Distinct sub-products (Wine Cooler, Beverage Center) always use Type.
- **Model slot** (Finding #065): `SF_Catalog_Name` → `AI_Model_Number` → `Ferguson_Model_Number` (SF_Catalog_Name is authoritative — prevents sibling-SKU bleed).
- **Dimension rounding**: Category-aware via `CATEGORY_SIZE_CLASSES` + `roundToStandardSize()`. Built-in appliances round UP to next standard size; freestanding uses nearest; performance ratings (CFM, GPM, BTU) use exact value.

**Model-family overrides** (`config/model-family-overrides.json`): Applied post-consensus, before title generation. Prefix-match on normalized model number overrides `type`, `configuration`, `subcategory`, `style` for persistent AI misclassifications.

### Picklist Matching

6-pass algorithm (exact → normalized → containment → Levenshtein → partial → mismatch log). Match threshold: 0.7+. Below 0.7 → `FailedMatchLog` + pending creation request sent to SF.

**Pending creation requests**: Fire-and-forget to SF immediately on first encounter. "Pending" means SF acknowledged receipt (HTTP 200) but has not yet created the item and sent it back as a picklist sync. Jobs do NOT block on pending creation requests.

**`NEEDS_SF_ID` placeholders**: New attributes are written to `attributes.json` with `attribute_id: "NEEDS_SF_ID"` immediately, allowing them to be used in matching while awaiting a real SF ID.

---

## Known Issues & Active Findings

> These are open issues discovered during system enumeration (June 2026). Update this section as issues are resolved.

### 🔴 Claude Title Override (Active — Source of Bad Responses)
**Issue**: When Claude's Phase B review proposes a title correction, the system always uses the schema-generated title instead ("preserves formatting rules"). This is correct when Claude injects category name noise, but wrong when Claude has better data (e.g., Claude found width=18", schema generated 14").

**Location**: `src/services/dual-ai-verification.service.ts` ~line 12356 — `titleWasCorrectedByClaude` flag + logic that chooses schema title over Claude title.

**Impact**: Bad titles in SF responses for non-appliance products where schema fields were wrong.

**Status**: Open — not yet investigated.

### 🟡 Garbage Attributes in attributes.json (Active)
**Issue**: May 27 cagp-lot batch (no_sources jobs) caused AI to extract spec-sheet metadata as attribute names. 6 garbage entries now in `src/config/salesforce-picklists/attributes.json` with `NEEDS_SF_ID`: `actual_product`, `detected_product`, `image_detected`, `serial_number_example`, `serial_example`, `listing`.

**Impact**: Could fuzzy-match against real products. 33 other NEEDS_SF_ID attributes are legitimate — do not bulk-remove.

**Status**: Open — rejected in MongoDB but still in attributes.json on production.

### 🟡 cagp-lot Batch (763 jobs — SF Rejected All)
**Issue**: May 27 batch of ~763 test jobs completed on our side but SF rejected every webhook response with `"Invalid id: cagp-lot-XXX"`. None of the results were applied in Salesforce.

**Status**: Needs clarification — were these test jobs? Does this batch need to be resubmitted with real SF IDs?

### 🟡 Pending Creation Requests — 49 Stale
**Issue**: 49 pending requests (3 style, 46 attribute). Styles `Freestanding` (72 days, 13 jobs) and `Counter Depth` (72 days, 6 jobs) are highest impact. SF has not responded.

**Status**: SF follow-up needed. Do not auto-reject.

### 🟡 AI_AUDIT_PROMPT.md Inaccuracy
**Issue**: Application context in `AI_AUDIT_PROMPT.md` states Claude is used "in self-healing diagnostics only." Claude actually runs Phase B final review on every non-appliance job. Cost estimates in that document will undercount Claude usage significantly.

**Status**: Document-only fix needed.

### ✅ Finding #066 Fixed (June 2, 2026) — Range "Front Control" vs "Top Control"
**Fix**: FCRG3051BS and similar ranges with `Control Location: Rear` in spec were getting "Front Control" because Phase 2.5 defaulted to OpenAI's legacy-title-anchored value. Fixed via: `extractTypeSpecHints()` helper, Phase 2.5 spec tiebreaker, STEP 6c in smart resolution, "Rear Control"→"Top Control" normalization, Range TYPE CLARIFICATION in AI prompt, "Top Control" added to Range valid types in category-type-mapping.json. Commits: `3113fa8`, `5af2b7e`, `eb3e3b4`, `d4c5ba4`.

### ✅ Finding #067 Fixed (June 2, 2026) — Slide-In Range Type + "Brushed" Finish
**Fix**: WEE750H0HZ and all slide-in ranges were getting "Front Control" type (Slide-In was removed from Range types by Finding #015 but title template has no Installation Type slot). "Brushed" finish was being extracted instead of "Stainless Steel". Fixed via: `extractTypeSpecHints()` extended for Range Configuration/Type fields, Phase 2.5 + STEP 6c handle Slide-In, post-consensus Slide-In override, "Brushed" finish normalization → color value, "Slide-In" added to Range valid types. Commit: `e9e94a1`.

### 🟡 10 Historical Jobs Need Requeue (June 2, 2026)
**Issue**: Jobs processed before Finding #066/#067 fixes have bad type/finish in SF. Identified by `audit-recent-jobs.js` script: WFES5030RZ, WFES3030RB, ZAZE42DS, CGSR366L, AK7136BSBF, INLX35SSV2, WF53BB8900A, Z1C0178, LSIS6338FE, ZRGM90BS.
**Fix**: `ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/audit-recent-jobs.js --size=50 --requeue"`

### 🟡 Pre-Deploy Validation Script Broken on Production
**Issue**: `bash scripts/pre-deploy-validate-all.sh` fails CHECK #1/#2 because `tsc` is not in system PATH on production. `npm run build` works fine. GPM format check also fails (pre-existing).
**Fix needed**: Update validation script to use `./node_modules/.bin/tsc`.

### ✅ Circular Dependency Fixed (June 2026)
**Fix**: `src/utils/logger.ts` was importing `config` from `../config` which re-exported `category-aliases.ts` which imported `logger` → infinite loop on startup. Fixed by removing config import from logger.ts and reading directly from `process.env`.

---

## Environment Definitions

| Environment | Location | URL | Database | Purpose |
|-------------|----------|-----|----------|---------|
| **LOCAL** | `/workspaces/Catalog-Verification-API` | `http://localhost:3001` | MongoDB at `localhost:27017` | Dev/testing |
| **PRODUCTION** | `/opt/catalog-verification-api/` | `https://verify.cxc-ai.com` | MongoDB at `127.0.0.1:27017` | Live |

Production service: `catalog-verification.service` (systemd), port 3001 behind nginx reverse proxy.

---

## Repository Structure

```
/
├── src/
│   ├── controllers/          # Route handlers (salesforce-async-verification.controller.ts)
│   ├── services/             # Business logic
│   │   ├── dual-ai-verification.service.ts    # CORE — ~15,000 lines, full pipeline
│   │   ├── seo-title-generator.service.ts     # Title generation, slot system
│   │   ├── async-verification-processor.service.ts  # Job queue
│   │   ├── picklist-matcher.service.ts        # 6-pass matching algorithm
│   │   ├── pending-creation-request.service.ts
│   │   ├── picklist-reconciliation.service.ts
│   │   └── self-healing/error-detector.service.ts
│   ├── config/
│   │   ├── salesforce-picklists/  # brands.json, categories.json, styles.json, attributes.json, types.json
│   │   ├── model-family-overrides.json    # Per-model type/config overrides
│   │   ├── category-size-classes.ts       # Industry-standard size class rounding
│   │   ├── title-schema-by-category.ts    # Title slot ordering per category
│   │   └── category-attributes.ts         # Top-15 filter attributes per category
│   ├── models/               # MongoDB models (VerificationJob, PendingCreationRequest, etc.)
│   └── utils/
│       └── size-class-rounder.ts          # roundToStandardSize()
├── scripts/                  # Utility scripts (run on production via SSH)
├── docs/
│   └── AUDIT-FINDINGS-AND-SOLUTIONS.md   # ⚠️ ALWAYS update after fixing a bug
├── session-notes/            # Session summaries (cold-start pickup documents)
├── audit-results/
├── .github/
│   └── copilot-instructions.md   # ← Must stay in sync with this file
└── CLAUDE.md                     # ← This file
```

**File placement rules**: Documentation → `docs/`, Session notes → `session-notes/`, Audit results/JSON → `audit-results/`, Postman → `postman/`, Examples → `examples/`.

---

## Deployment Workflow

**ALWAYS use manual deployment** (not CI/CD auto-deploy):

```bash
ssh mardeys-prod "cd /opt/catalog-verification-api && \
  git pull origin main && \
  npm install && \
  npm run build && \
  systemctl restart catalog-verification"
```

⚠️ **CRITICAL**: Always run `npm run build` after pulling — production runs compiled JS from `dist/`, not TypeScript source.

Build script: `npm run build` = `tsc && cp -r src/config/salesforce-picklists dist/config/ && cp src/config/*.json dist/config/`

---

## Required Ports & Processes

| Port | Service | Check |
|------|---------|-------|
| 3001 | Node.js API | `systemctl is-active catalog-verification` |
| 27017 | MongoDB (Docker) | `docker ps \| grep mongodb` |
| 443 | HTTPS (nginx) | `systemctl is-active nginx` |
| 80 | HTTP redirect (nginx) | `systemctl is-active nginx` |

---

## Health Checks & API Endpoints

| Environment | Command |
|-------------|---------|
| Local | `curl -s http://localhost:3001/health` |
| Production | `curl -s https://verify.cxc-ai.com/health` |

Expected: `{"status":"healthy","timestamp":"..."}`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/verify/salesforce` | POST | Main verification endpoint |
| `/api/analytics/dashboard` | GET | Analytics dashboard |
| `/api/picklists/sync` | POST | Receive picklist updates from SF |
| `/api/picklists/sync/pending/{id}/approve` | POST | Approve a held picklist sync |
| `/api/picklists/sync/pending/{id}/reject` | POST | Reject a held picklist sync |

---

## Log Locations

- **Production combined**: `/opt/catalog-verification-api/logs/combined.log`
- **Production errors**: `/opt/catalog-verification-api/logs/error.log`
- **Local**: Console output from `npm run dev`

---

## Database

### Production MongoDB
- Runs on same server at `127.0.0.1:27017`
- Database: `catalog-verification`
- Collections: `verificationjobs`, `pendingcreationrequests`, `pendingpicklistsyncs`, `auditlogs`, `aiusage`

### Local MongoDB
```bash
docker start mongodb 2>/dev/null || docker run -d --name mongodb -p 27017:27017 mongo:7
```

---

## Picklist Sync — Hold Bucket

Salesforce picklist syncs are **held for manual review** before being applied (to protect custom fields like `subcategory`, `styles_apply`).

**Check pending syncs** (always during Establish Connection):
```bash
ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/check-pending-picklist-syncs.js"
```

**Approve**:
```bash
curl -X POST https://verify.cxc-ai.com/api/picklists/sync/pending/{id}/approve \
  -H "Content-Type: application/json" \
  -d '{"reviewed_by": "claude-session", "notes": "Approved after review"}'
```

**Rules**: APPROVE for additions-only / low severity. REJECT for CRITICAL severity or unexpected removals. **NEVER auto-approve CRITICAL**.

---

## Pre-Deployment Validation

```bash
bash scripts/pre-deploy-validate-all.sh
```

| Check | What it catches | Severity |
|-------|----------------|----------|
| 1 — TypeScript compilation | Syntax errors, type mismatches | 🔴 CRITICAL |
| 2 — Dependency consistency | Picklists, types, mappings sync | 🔴 CRITICAL |
| 3 — Feature completeness | Declared but unimplemented features | 🔴 CRITICAL |
| 4 — Title system runtime | Schema lookup, regex bugs | 🔴 CRITICAL |
| 5 — Title generation | Sample data validation | 🔴 CRITICAL |
| 6 — Picklist fields | Field name correctness | 🟡 WARNING |
| 7 — Hardcoded lists | Sync with JSON picklists | 🟡 WARNING |
| 8 — Field mapping reference | Sync with docs/RAW-FIELD-MAPPING-REFERENCE.md | 🟡 WARNING |
| 9 — Style cross-reference | category-style-mapping vs styles.json | 🔴 CRITICAL |

**Skip validation only if**: zero code changes (docs/session notes only).

---

## Troubleshooting Protocol

**⚠️ MANDATORY: Before investigating any issue, check `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` for prior solutions.**

After fixing any issue:
1. Update `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` with finding details, fix, commit hash, scope
2. Update Quick Reference Index in that document
3. Update Known Issues section in this file AND in `.github/copilot-instructions.md`

---

## Terminology

| Term | Meaning |
|------|---------|
| "Production" / "Server" / "Live" | verify.cxc-ai.com |
| "Local" / "Dev" | This workspace (localhost:3001) |
| "Sync" / "Deploy" | Push to GitHub → manual deploy to production |
| "SFDC-Callout" | Salesforce making API call to our service |
| "Picklist Sync" | Salesforce pushing updated picklists to our API |
| "Hold Bucket" | Pending picklist syncs awaiting manual review |
| "Phase A" | Automated rule-based validation (always runs) |
| "Phase B" | Claude review (runs for non-appliances only) |
| "PATH B restore" | Appliances skipping Claude Phase B (926ad6b behavior) |
| "NEEDS_SF_ID" | Attribute added locally before SF assigns a real ID |
| "no_sources" | Job with no Web Retailer or Ferguson data — requires external research |
