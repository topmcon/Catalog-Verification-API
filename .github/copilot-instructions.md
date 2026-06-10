# Copilot Instructions - Catalog Verification API

## 🕐 TIMEZONE & DATE REFERENCE

**⚠️ CRITICAL: User timezone is US Eastern (EST/EDT) - NOT UTC!**
- The system-provided date/time is in **UTC**. ALWAYS convert to Eastern Time before displaying or interpreting.
- **Conversion**: UTC - 5 hours = EST (winter) | UTC - 4 hours = EDT (summer)
- UTC midnight (00:00) = 7:00 PM EST previous day OR 8:00 PM EDT previous day
- **When the system says "March 21, 2026 02:06 UTC", user's local time is "March 20, 2026 10:06 PM EST"**
- **Always state dates and times in Eastern Time** unless asked otherwise
- When naming session files (e.g., `SESSION-SUMMARY-YYYY-MM-DD`), use the **Eastern Time date**
- **Log timestamps**: Production logs show EST/EDT times, but system date string is UTC

**Examples:**
- System says: "March 21, 2026" → User's date: "March 20, 2026" (if evening)
- Log shows: "3/20/2026, 10:01 PM" → This is EST time (just happened)
- System date: "March 21, 2026 02:01 UTC" → EST: "March 20, 2026 10:01 PM"

**Rule of thumb**: If user says "now" or "just happened", check their EST time, not system UTC time!

## ⚠️ CRITICAL: PRODUCTION-FIRST OPERATIONS

**ALWAYS DEFAULT TO PRODUCTION SERVER** unless explicitly told otherwise.

When running commands, checking logs, testing APIs, or gathering data:
- ✅ **DO**: Execute on production server (`verify.cxc-ai.com`) via SSH
- ❌ **DON'T**: Run locally unless specifically requested
- 🔧 **Testing/Development**: Only use local when user says "test locally" or "run dev"

**Examples:**
- "Check logs" → SSH to production, tail production logs
- "Test API" → Test production endpoint `https://verify.cxc-ai.com/api/...`
- "Run verification" → Execute on production database
- "Check recent jobs" → Query production MongoDB
- "View picklists" → SSH and check production files

**Local workspace is for CODE EDITING ONLY**, not execution.

---

## Repository Structure

**IMPORTANT**: This repository follows a strict folder structure. Always place files in the correct location:
- Documentation → `docs/` (organized by type: guides, api, architecture, salesforce, analysis)
- Architecture versions → `docs/architecture-versions/` (auto-generated snapshots — DO NOT edit)
- Session notes → `session-notes/`
- Code examples → `examples/`
- Postman collections → `postman/`
- Audit results/JSON → `audit-results/`
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for complete guidelines

---

## 🔍 Troubleshooting & Debugging Protocol

**⚠️ MANDATORY: Always consult the Audit Findings document when troubleshooting!**

### Before Investigating Any Issue:

1. **Check Audit Findings Registry**: `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md`
   - Search for similar symptoms or patterns
   - Review "Quick Reference Index" for matching issues
   - Check if previous fix patterns apply to current problem
   
2. **Use Decision Trees**: Document contains decision trees for:
   - When to use validation-first logic
   - Schema vs. input update requirements
   - AI selection logic patterns

3. **After Fixing Any Issue**:
   - Update `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` with:
     - New finding details (symptom, root cause, investigation steps)
     - Fix applied (commit hash, files, line numbers, code snippets)
     - Scope (universal vs. limited)
     - Related findings (pattern recognition)
   - Add entry to Quick Reference Index
   - Document lessons learned

**This prevents re-solving the same problem and builds institutional knowledge.**

---

## Quick Reference

When the user says **"Establish Connection"** or **"Connect to production"**, execute these steps:
1. Verify SSH connectivity to production server
2. Compare local, GitHub, and production commits
3. Check production service health
4. **Verify all required ports and processes are running:**
   - Port 3001: Node.js API (catalog-verification service)
   - Port 27017: MongoDB (Docker container)
   - Port 443: HTTPS (nginx)
   - Port 80: HTTP redirect (nginx)
5. Report sync status and system health
6. **Check for recent picklist updates from Salesforce** (last sync, any pending changes)
7. **Find and display the most recent session summary** from `session-notes/` folder
8. Ask user if they want to continue from where we left off

When the user says **"Save everything"** or **"Save all"**, execute these steps:
1. **Create comprehensive handoff session summary** in `session-notes/SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md`:
   
   This document must allow a **cold-start pickup from a different computer** with zero context loss. Include ALL of the following:
   
   - **Context / Why**: What triggered this session's work (user reports, prior session issues, etc.)
   - **Architecture context**: Relevant system architecture needed to understand changes (data flow, file relationships, loading chains)
   - **Detailed work completed**: Every fix/change with **before → after** values, not just summaries
   - **Files modified**: Every file with specific description of what changed
   - **Commits**: All commit hashes and messages from this session
   - **Current system state**: Sync status (local/GitHub/production commits), service health, verification results
   - **Remaining warnings/issues**: Anything not yet resolved, with severity and recommended approach
   - **Next steps**: Specific actionable items for the next session
   - **Key reference files**: Table of important files and their purpose for quick navigation
   
   **Target: 150-250 lines minimum.** The goal is a self-contained document that gives full context without needing to read prior summaries or code.

1a. **⚠️ UPDATE AUDIT FINDINGS DOCUMENT** - If ANY bugs were fixed or issues resolved:
   - Update `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` with:
     - New finding entry with symptom, root cause, investigation steps
     - Fix details (commit hash, files changed, line numbers, code snippets)
     - Scope of fix (universal vs. limited)
     - Related findings for pattern recognition
     - Quick Reference Index entry
   - **This step is CRITICAL** - builds institutional knowledge to prevent re-solving same problems

2. **⚠️ COMPREHENSIVE PRE-DEPLOYMENT VALIDATION** - MANDATORY for ALL code changes:
   ```bash
   # Run comprehensive validation suite (9 checks)
   bash scripts/pre-deploy-validate-all.sh
   ```
   
   **What it validates:**
   
   | Check # | Validation | What It Catches | Severity |
   |---------|------------|-----------------|----------|
   | 1 | TypeScript Compilation | Syntax errors, type mismatches | 🔴 CRITICAL |
   | 2 | Dependency Consistency | Picklists, types, mappings sync | 🔴 CRITICAL |
   | 3 | Feature Completeness | Declared features are implemented | 🔴 CRITICAL |
   | 4 | Title System Runtime | Schema lookup, regex bugs | 🔴 CRITICAL |
   | 5 | Title Generation | Sample data validation | 🔴 CRITICAL |
   | 6 | Picklist Fields | Field name correctness | 🟡 WARNING |
   | 7 | Hardcoded Lists | Sync with JSON picklists | 🟡 WARNING |
   | 8 | Field Mapping Reference | FIELD_ALIASES, extractors, output fields in sync with docs/RAW-FIELD-MAPPING-REFERENCE.md | 🟡 WARNING |
   | 9 | Style Cross-Reference | All styles in category-style-mapping.json exist in styles.json (picklist matcher source) | 🔴 CRITICAL |
   
   **What this PREVENTS** (lessons learned from Feb 25 2026 title system failures):
   - ✅ Regex typos (e.g., `/s+/g` vs `/\s+/g`) - **Check #4 catches**
   - ✅ Declared but unimplemented features (e.g., `slot.format` not applied) - **Check #3 catches**
   - ✅ Schema lookup failures - **Check #4 + #5 catch**
   - ✅ Format template bugs - **Check #5 catches with sample data**
   - ✅ Data structure mismatches - **Check #2 catches**
   - ✅ Hardcoded lists out of sync - **Check #7 catches**
   - ✅ Category-specific styles missing from picklist matcher - **Check #9 catches**
   
   **Individual validation scripts** (if you need to run specific checks):
   ```bash
   # Feature completeness (declared vs implemented)
   node scripts/audit-declared-vs-implemented.js
   
   # Title system comprehensive test (all 177 categories)
   node scripts/audit-title-system.js
   
   # Title generation with sample data
   node scripts/test-title-generation.js
   
   # Dependency consistency (original validator)
   bash scripts/validate-dependencies.sh
   
   # Picklist field validation
   node scripts/audit-picklist-fields.js
   
   # Hardcoded lists sync check
   node scripts/regenerate-hardcoded-lists.js --check
   
   # Field mapping reference sync check
   node scripts/audit-field-mapping-reference.js --check
   
   # Style cross-reference (category-style-mapping vs styles.json)
   node scripts/audit-style-crossref.js
   ```
   
   **If validation fails:**
   - 🚫 **DEPLOYMENT BLOCKED** - Fix critical errors before proceeding
   - Re-run `bash scripts/pre-deploy-validate-all.sh` to confirm fixes
   - Document fixes in session summary
   
   **If NO code changes** (only docs/session notes): Skip validation, proceed to step 3

2b. **📸 VERSION ARCHITECTURE DOCS (Before-After Strategy)** — Create audit trail showing session changes:
   ```bash
   bash scripts/version-architecture-docs.sh
   ```
   
   **What it does:**
   - Creates versioned snapshots of working copies with rich metadata headers
   - Each version includes: commit hash, date, system metrics, change summary vs. previous version
   - Auto-rotates: keeps max 20 versions per document, deletes oldest
   - **Skips** if document content hasn't changed since last version
   
   **Naming convention**: `{DOC_NAME}-v{N}-{YYYY-MM-DD}-{COMMIT}.md`
   
   **⚠️ CRITICAL - Before-After Workflow:**
   
   At **START of session** (during "Establish Connection"):
   - Latest version (e.g., v4) represents "BEFORE" state - snapshot before any work begins
   - This v4 reflects the commit the system was at when session started
   
   **During session:**
   - Update **working copies** with architectural changes as you work:
     * New functions, prompt changes, AI model changes, verification phases → update `VERIFICATION-ARCHITECTURE-COMPLETE.md`
     * New data sources, files, MongoDB collections, config files → update `VERIFICATION-DATA-SOURCES.md`
   - The script versions whatever is in the working copies — if they're outdated, the version will be too
   
   At **END of session** (during "Save everything"):
   - Run versioning script to create next version (e.g., v5)
   - This v5 represents "AFTER" state - snapshot including all session changes
   - **Result**: v4 (before) → work → v5 (after) = clear diff showing session contributions
   
   **What to update in working copies:**
   - ✅ New verification phases (e.g., Phase 0 Canadian detection, Phase 0.2 Ferguson priority)
   - ✅ AI model changes (e.g., Claude 5→40 fields, GPT field expansion, new prompts)
   - ✅ New functions/services (e.g., convertCADtoUSD, detectCanadianData, enrichWithWebSearch)
   - ✅ New config files (e.g., exchange-rates.ts, new picklist files)
   - ✅ New data fields (e.g., Web_Retailer_Key, Appliance_Features, filter_attributes)
   - ✅ Changed data sources (e.g., Ferguson_Price field name corrections, new MongoDB collections)
   - ✅ System metrics (e.g., service file line counts, picklist sizes, data source counts)
   
   **Before-After Audit Trail Example:**
   ```
   v4-2026-03-04-c0f70c9.md  ← BEFORE session (11,267 lines, 55 data sources)
   [Session work: Add Canadian handling + Claude expansion]
   [Update working copies with changes]
   [Run version-architecture-docs.sh]
   v5-2026-03-04-092296d.md  ← AFTER session (11,878 lines, 56 data sources)
   
   Diff v4→v5 shows exactly what this session accomplished:
   - Canadian detection/conversion phases added
   - Claude expanded from 5 to 40+ fields
   - exchange-rates.ts config file added
   ```
   
   **If NO architectural changes** this session: Still run the script (it will auto-skip if no changes)

3. Check for any uncommitted changes (`git status`)
4. Stage all changes including session summary (`git add -A`)
5. Commit with descriptive message (ask user or auto-generate based on changed files)
6. Push to GitHub (`git push origin main`)
7. Deploy to production:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && \
      git stash && \
      git pull origin main && \
      npm install && \
      npm run build && \
      systemctl restart catalog-verification"
   ```
8. **⚠️ CRITICAL: Verify all three environments are synced** - Run this check:
   ```bash
   LOCAL=$(git rev-parse --short HEAD) && \
   GITHUB=$(git ls-remote origin main | cut -c1-7) && \
   PROD=$(ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7") && \
   echo "LOCAL: $LOCAL | GITHUB: $GITHUB | PROD: $PROD" && \
   if [ "$LOCAL" = "$GITHUB" ] && [ "$GITHUB" = "$PROD" ]; then echo "✅ ALL SYNCED"; else echo "⚠️ OUT OF SYNC - PROCEDURE NOT COMPLETE"; fi
   ```
   **If OUT OF SYNC: Re-run step 7. Do NOT finish until all 3 match.**
9. Confirm production service is healthy:
   ```bash
   curl -s https://verify.cxc-ai.com/health
   ```
10. Report summary:
   - Files changed
   - Commit hash (must be same across all 3 environments)
   - Sync status (✅ ALL SYNCED or ⚠️ OUT OF SYNC)
   - Service health

**⚠️ The "Save everything" procedure is NOT complete until step 8 shows ALL SYNCED.**

When creating **session summaries**, save to `session-notes/SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md`

---

When the user says **"verify batch"**, execute these steps:

1. Run the batch quality & cost monitoring script on production:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && node scripts/verify-batch.js"
   ```
2. Auto-detection picks up the most recent contiguous cluster of jobs (gap >5 min ends the cluster). To override:
   - `--size=N` — force the last N jobs
   - `--minutes=N` — all jobs in the last N minutes
   - `--catalog=ALT123` — single job by SF catalog name or id
3. Display the full report covering:
   - Status breakdown (completed / failed / processing / pending) with processing-time stats
   - Quality metrics (manual review, final-review FAIL, empty Category Lookup, title duplication, webhook delivery, SF acknowledgment, average verification score)
   - **AI cost breakdown** (total cost, avg per job/call, by provider, by task type, top 5 most expensive jobs) — sourced from `ai_usage` MongoDB collection
   - Self-healing activity in the batch window
   - Per-job issues with severity tags (CRIT / HIGH / MED / INFO)
   - Recommendations
4. Highlight any **HIGH/CRIT** issues that need follow-up
5. If anomalies are found, suggest investigating specific SF Catalog IDs or running `node scripts/show-session-analytics.js` for broader context

**Script location**: `scripts/verify-batch.js`

---

When the user says **"Run live logger"** or **"Start live logger"**, execute these steps:

1. **Start a background SSH session** streaming filtered production logs:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log" 
   ```
   Run this as a **background terminal** (`isBackground: true`).

2. **Filter mode** — Determine what mode to use based on user context:
   - **Default (full pipeline)**: Show all verification events, filter out health checks, startup, picklist syncs
   - **"Run live logger errors only"**: Only show WARN and ERROR level entries
   - **"Run live logger for [Category]"**: Filter to specific category (e.g., "Tub Filler")
   - **"Run live logger titles"**: Focus on title generation, comparison, and correction events

3. **Active monitoring loop** — After starting, periodically check the terminal output using `get_terminal_output` and analyze what's coming in. For each verification call observed, report:

   **INCOMING CALL:**
   - SF Catalog ID, Brand, Category, Type
   
   **PIPELINE DECISIONS:**
   - Preliminary title generated
   - Type/Style values and how they were determined
   - Any pipeline auto-mappings applied
   
   **CLAUDE REVIEW:**
   - Review status (PASS / FLAG / FAIL)
   - Confidence score
   - Issues found count
   - Corrections proposed (type, style, title, finish, etc.)
   
   **FINAL OUTPUT:**
   - Schema title vs Claude title (highlight differences)
   - Final corrections applied (from → to)
   - Model match status (MATCH vs MISMATCH ⚠️)
   - Processing time
   - Webhook delivery status

4. **Proactive alerting** — Flag these issues immediately when spotted:
   - 🔴 **Title duplication** (e.g., "Tub Filler Tub Filler", "Roman Tub Tub Filler")
   - 🔴 **FAIL review status** — Claude found critical issues
   - 🔴 **Webhook delivery failure** — SF didn't receive results
   - 🟡 **MISMATCH** between schema title and Claude title — may indicate schema/pipeline bug
   - 🟡 **Type/Style corrections by Claude** — may indicate AI prompt or pipeline logic needs fixing
   - 🟡 **Unusually long processing time** (>300 seconds)
   - 🟢 **Clean PASS** — everything worked as expected

5. **Report format** — Present each observed call in a compact summary block:
   ```
   ━━━ LIVE: [Brand] [Category] ([SF Catalog ID]) ━━━
   Type: [value] | Style: [value] | Finish: [value]
   Schema Title: [title]
   Claude Title:  [title]  ← [PASS/FLAG/FAIL] (confidence: X%)
   Corrections: [list or "None"]
   Time: [Xms] | Webhook: ✅/❌
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

6. **Continue monitoring** until user says "stop logger" or moves to another task.

**Key filtering patterns** to exclude noise:
- `GET /health` — health checks (every few seconds)
- `SIGTERM` / `Server started` / `MongoDB connected` — service restarts
- `Picklists loaded` / `Puppeteer` — startup initialization
- `POST /api/picklists/sync` — picklist syncs (separate concern)

---

When the user says **"API Accuracy Report"** or **"Run API Accuracy Report"**, execute these steps:
1. Run the Verification API Accuracy Audit script on production:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"
   ```
2. Display the full output including:
   - Audit Summary (pass/fail rates)
   - Issues by Category (with severity indicators)
   - Examples of each issue type
   - Recommendations for fixes
   - Picklist stats and duplicate warnings
   - **Hardcoded Lists Sync Status** (IN SYNC or OUT OF SYNC)
3. Highlight any **HIGH severity** issues (🔴) that need immediate attention
4. If pass rate is below 90%, suggest investigating the top issues
5. If hardcoded lists are OUT OF SYNC, suggest running:
   ```bash
   node scripts/regenerate-hardcoded-lists.js
   ```
6. Note that the report audits the **last 300 unique API calls** from Salesforce

**What the report checks:**
- Brand_Verified → Must exist in brands.json
- Category_Verified → Must exist in categories.json (singular form)
- SubCategory_Verified → Must match Category_Verified
- Product_Style_Verified → Must exist in styles.json
- Weight_Verified → Must be numeric only (no "lbs" suffix)
- Numeric fields → Must be valid numbers
- Product_Title_Verified → Should be 60-80 characters
- ID fields → Must match picklist IDs
- **Hardcoded Lists** → TypeScript constants must match source JSON picklists:
  - `category-matcher.service.ts`: DEPARTMENT_CATEGORIES
  - `dual-ai-verification.service.ts`: LIGHTING_CATEGORIES, SHOWER_PLUMBING_CATEGORIES, VALID_SHOWER_STYLES
  - `constants.ts`: CATEGORY_NAME_ALIASES

---

## Required Ports & Processes

### Production Server (verify.cxc-ai.com)

| Port | Service | Process | Check Command |
|------|---------|---------|---------------|
| 3001 | Node.js API | catalog-verification | `systemctl is-active catalog-verification` |
| 27017 | MongoDB | Docker container | `docker ps \| grep mongodb` |
| 443 | HTTPS | nginx | `systemctl is-active nginx` |
| 80 | HTTP redirect | nginx | `systemctl is-active nginx` |

### Quick Health Check Command
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "ss -tlnp | grep -E '(3001|27017|443|80)'"
```

---

## Environment Definitions

### LOCAL
- **Location**: `/workspaces/Catalog-Verification-API`
- **URL**: `http://localhost:3001`
- **Database**: MongoDB at `localhost:27017`
- **Purpose**: Development and testing
- **Start Command**: `npm run dev`

### PRODUCTION
- **Server**: `verify.cxc-ai.com`
- **URL**: `https://verify.cxc-ai.com`
- **API Path**: `/opt/catalog-verification-api/`
- **Database**: MongoDB at `127.0.0.1:27017`
- **Service**: `catalog-verification.service` (systemd)
- **Port**: 3001 (behind nginx reverse proxy)

---

## SSH Access

### Connection Details
```
Host: verify.cxc-ai.com  (IP: 134.209.123.173)
User: root
Key: ~/.ssh/cxc_ai_deploy  (Codespaces/Linux)
   OR
Alias: mardeys-prod  (macOS with ~/.ssh/config alias — uses ~/.ssh/id_ed25519)
```

> **macOS note**: If `~/.ssh/cxc_ai_deploy` does not exist, use the `mardeys-prod` host alias from `~/.ssh/config` instead. Both connect to the same server as root.

### SSH Command Template
```bash
# Standard (Codespaces / Linux)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "<command>"

# macOS with mardeys-prod alias
ssh mardeys-prod "<command>"
```

### Common SSH Commands

| Action | Command |
|--------|---------|
| **Check commit** | `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && cat .git/refs/heads/main \| cut -c1-7"` |
| **Service status** | `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl status catalog-verification \| head -15"` |
| **Restart service** | `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl restart catalog-verification"` |
| **View logs** | `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -50 /opt/catalog-verification-api/logs/combined.log"` |
| **Live log stream** | `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log"` |
| **Pull latest code** | `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main"` |
| **Full deploy** | `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main && npm install && systemctl restart catalog-verification"` |

---

## Deployment Workflow

### CI/CD Pipeline
- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/ci-cd.yml`
- **Actions**: Lint → Test → Deploy to production

### Manual Deployment (ALWAYS use this method)
```bash
# From local workspace - run the deployment script
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "/opt/catalog-verification-api/deploy.sh"

# OR manually on production server
cd /opt/catalog-verification-api
git pull origin main
npm install
npm run build          # ⚠️ CRITICAL: Must compile TypeScript → JavaScript
systemctl restart catalog-verification
```

**⚠️ CRITICAL:** Always run `npm run build` after pulling code! Production runs compiled JavaScript from `dist/` folder, not TypeScript source.

---

## Sync Verification Command

To verify all environments are synced, run:
```bash
echo "=== LOCAL ===" && git log -1 --oneline && \
echo "=== GITHUB ===" && git ls-remote origin main | cut -c1-7 && \
echo "=== PRODUCTION ===" && ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7"
```

---

## Health Checks

| Environment | Command |
|-------------|---------|
| Local | `curl -s http://localhost:3001/health` |
| Production | `curl -s https://verify.cxc-ai.com/health` |

Expected response: `{"status":"healthy","timestamp":"..."}`

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/verify/salesforce` | POST | Main Salesforce verification endpoint |
| `/api/analytics/dashboard` | GET | Analytics dashboard data |
| `/api/enrich` | POST | Product enrichment |

---

## Log Locations

### Local
- Console output from `npm run dev`

### Production
- Combined: `/opt/catalog-verification-api/logs/combined.log`
- Errors: `/opt/catalog-verification-api/logs/error.log`

---

## Database

### Local MongoDB
```bash
# Start container if not running
docker start mongodb 2>/dev/null || docker run -d --name mongodb -p 27017:27017 mongo:7
```

### Production MongoDB
- Runs on same server at `127.0.0.1:27017`
- Database name: `catalog-verification`

---

## Picklist Sync System - HOLD BUCKET (Manual Review Required)

### ⚠️ IMPORTANT: Syncs Are NO LONGER Auto-Applied

To prevent accidental overwrite of custom fields (like `subcategory`, `styles_apply`), 
Salesforce picklist syncs are now **HELD for manual review** instead of auto-applied.

### How Salesforce Updates Work Now

1. **Salesforce Pushes Updates**: Salesforce calls `POST /api/picklists/sync` with picklist data
2. **API Receives & Analyzes**: Server validates data and calculates what would change
3. **Changes HELD in Hold Bucket**: Saved to `PendingPicklistSync` MongoDB collection (NOT applied)
4. **Impact Assessment**: System flags severity (low/medium/high/critical) based on:
   - Number of additions/removals
   - **Custom fields at risk** (subcategory, styles_apply would be lost)
5. **Returns 202 Accepted**: Salesforce receives confirmation sync is pending review
6. **Manual Review Required**: During "Establish Connection", pending syncs are displayed for review
7. **Approve or Reject**: User must explicitly approve to apply changes, or reject to discard

### Checking for Pending Syncs (During Establish Connection)

```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-pending-picklist-syncs.js"
```

This displays:
- 🟢 Number of pending syncs awaiting review
- 🟡 Impact assessment (severity, additions, removals)
- 🔴 **CRITICAL warnings** if custom fields would be overwritten
- Detailed list of what would change per picklist type

### Approving or Rejecting Pending Syncs

**Approve (apply the changes):**
```bash
curl -X POST https://verify.cxc-ai.com/api/picklists/sync/pending/{pending_id}/approve \
  -H "Content-Type: application/json" \
  -d '{"reviewed_by": "copilot-session", "notes": "Approved after review"}'
```

**Reject (discard without applying):**
```bash
curl -X POST https://verify.cxc-ai.com/api/picklists/sync/pending/{pending_id}/reject \
  -H "Content-Type: application/json" \
  -d '{"reviewed_by": "copilot-session", "notes": "Rejected to preserve custom fields"}'
```

### When to Approve vs Reject

**APPROVE when:**
- Only additions (no removals)
- Severity is "low" and no custom fields at risk
- User confirms the changes look correct

**REJECT when:**
- 🔴 CRITICAL severity - custom fields at risk
- Unexpected removals that might indicate Salesforce data issue
- User is unsure and wants to investigate first

### Picklist Management Tools

#### 0. Check Pending Syncs (Hold Bucket)
**Script**: `scripts/check-pending-picklist-syncs.js`  
**Run from**: Production server (via SSH)  
**Purpose**: Check for Salesforce picklist syncs awaiting review  
**What it does**:
- Shows count of pending/approved/rejected syncs
- Displays impact assessment and severity
- Lists additions/removals per picklist type
- **Warns if custom fields would be overwritten**
- **Used by "Establish Connection" procedure**

**Usage**:
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-pending-picklist-syncs.js"
```

**When to use**:
- During "Establish Connection" (automatic)
- Before approving any pending syncs
- Investigating why syncs are building up

#### 1. Check Applied Sync History (Audit Log)
**Script**: `scripts/check-picklist-sync-status.js`  
**Run from**: Production server (via SSH)  
**Purpose**: Display information about the most recent APPLIED picklist sync  
**What it does**:
- Shows when the last applied sync occurred
- Displays before/after item counts for each picklist type
- Lists items that were added/removed
- Shows sync ID for audit trail

**Usage**:
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-picklist-sync-status.js"
```

---

## Session Analytics & Monitoring

### Show Session Analytics Dashboard
**Script**: `scripts/show-session-analytics.js`  
**Run from**: Production server (via SSH)  
**Purpose**: Display comprehensive analytics since the last "Establish Connection"  
**What it shows**:

1. **Verification Job Statistics**:
   - Total API calls from Salesforce
   - Status breakdown (pending, processing, completed, failed)
   - Average/min/max processing times

2. **Webhook Delivery Metrics**:
   - Webhooks sent and success rate
   - Salesforce acknowledgments and processing confirmations
   - Recent webhook errors (if any)

3. **Self-Healing System Activity**:
   - Total self-healing attempts
   - Outcomes breakdown (success, failed, escalated)
   - Issue types detected
   - AI consensus achievement rate
   - Corrections sent to Salesforce

4. **Error Patterns & Trends**:
   - Jobs with errors categorized by type
   - Recent error messages for investigation

5. **System Performance Metrics**:
   - Overall success rate
   - Webhook delivery rate
   - Self-healing success rate
   - System throughput (jobs/hour)

6. **Actionable Recommendations**:
   - Automatically detects issues and suggests actions
   - Flags high failure rates, webhook problems, queue backlogs
   - Performance optimization suggestions

**Usage**:
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/show-session-analytics.js"
```

**When to use**:
- During "Establish Connection" (automatic)
- Monitoring system health
- Investigating performance issues
- Generating reports for stakeholders

**Note**: Script tracks time since last connection and provides delta analytics

---

### Picklist Management Tools

#### 1. Auto-Sync to GitHub (Production Only)
**Script**: `scripts/auto-sync-picklists.sh`  
**Location**: Production server  
**Scheduled**: Runs every 5 minutes via cron job  
**Purpose**: Automatically commits and pushes picklist changes to GitHub when Salesforce syncs updates  
**What it does**:
- Detects if picklist files have uncommitted changes
- Commits changes with timestamp
- Pushes to GitHub `main` branch
- Logs all activity to `/opt/catalog-verification-api/logs/picklist-sync-to-git.log`

**Check cron status**:
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "crontab -l | grep auto-sync"
```

**View sync logs**:
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -50 /opt/catalog-verification-api/logs/picklist-sync-to-git.log"
```

#### 2. Sync FROM Production to Local (Development)
**Script**: `scripts/sync-picklists-from-production.js`  
**Run from**: Local workspace  
**Purpose**: Download production picklist files to your local development environment  
**What it does**:
- Downloads all 5 picklist files from production via SCP
- Compares production vs local versions
- Shows differences (added/removed items)
- Creates backups before overwriting
- Asks for confirmation before replacing local files

**Usage**:
```bash
node scripts/sync-picklists-from-production.js
```

**When to use**: 
- Setting up new development environment
- Need latest Salesforce picklists for local testing
- Investigating production picklist state

#### 3. Audit Picklist Field Names
**Script**: `scripts/audit-picklist-fields.js`  
**Run from**: Local or production  
**Purpose**: Verify all code uses correct Salesforce picklist field names  
**What it does**:
- Checks all picklist JSON files for correct structure
- Validates field names: `brand_id`, `brand_name`, `category_id`, etc.
- Scans codebase for incorrect field references
- Reports mismatches and inconsistencies
- Saves full audit report to `audit-results/picklist-audit-results.json`

**Usage**:
```bash
node scripts/audit-picklist-fields.js
```

**When to use**:
- After Salesforce picklist schema changes
- Before major deployments
- Debugging picklist matching issues
- Code quality audits

#### 4. Send Picklists TO Salesforce (Admin Tools)
**Scripts**: 
- `scripts/send-styles-to-salesforce.js` - Push styles picklist to SFDC
- `scripts/send-category-filters-to-salesforce.js` - Push category filters to SFDC

**Purpose**: Manually push our picklist data TO Salesforce (reverse sync)  
**When to use**: Initial setup or when we need to update Salesforce with our data

---

### Picklist API Endpoints (Salesforce Integration)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/picklists/sync` | POST | Receive picklist updates FROM Salesforce |
| `GET /api/picklists/sync/logs` | GET | Get all picklist sync history |
| `GET /api/picklists/sync/logs/:syncId` | GET | Get specific sync details |
| `GET /api/picklists/brands` | GET | Get current brands picklist |
| `GET /api/picklists/categories` | GET | Get current categories picklist |
| `GET /api/picklists/styles` | GET | Get current styles picklist |
| `GET /api/picklists/attributes` | GET | Get current attributes picklist |
| `POST /api/picklists/brands` | POST | Add new brand (admin) |
| `POST /api/picklists/categories` | POST | Add new category (admin) |
| `POST /api/picklists/styles` | POST | Add new style (admin) |
| `POST /api/picklists/attributes` | POST | Add new attribute (admin) |

**Note**: All picklist endpoints require API key authentication.

---

## Terminology

| Term | Meaning |
|------|---------|
| "Production" / "Server" / "Live" | verify.cxc-ai.com |
| "Local" / "Dev" | This workspace (localhost:3001) |
| "Sync" / "Deploy" | Push code to GitHub → CI/CD deploys to production |
| "SFDC-Callout" | Salesforce making API call to our service |
| "Picklist Sync" | Salesforce pushing updated picklists to our API |

---

## Establish Connection Procedure

When user says "Establish Connection", perform these checks and report:

**📋 Reference Document**: [docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md](../docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md) - Follow "Establish Connection Verification" section

1. **SSH Connectivity**: `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "echo connected"`

2. **Commit Sync Check**: Compare commits across local, GitHub, and production

3. **Service Health**: Check `systemctl status catalog-verification`

4. **API Health**: `curl -s https://verify.cxc-ai.com/health`

5. **Session Analytics**: Run comprehensive analytics dashboard:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/show-session-analytics.js"
   ```
   This shows:
   - API calls from Salesforce (total, status breakdown, processing times)
   - Webhook delivery statistics (success rate, SF acknowledgments)
   - Self-healing activity (attempts, outcomes, issues detected)
   - Error patterns and trends (categorized errors, recent messages)
   - System performance metrics (success rates, throughput)
   - **Actionable recommendations** based on detected issues

6. **Pending Picklist Syncs (HOLD BUCKET)**: Check for syncs awaiting review:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-pending-picklist-syncs.js"
   ```
   This shows:
   - Count of pending/approved/rejected syncs
   - Impact assessment (severity, additions, removals)
   - **CRITICAL warnings** if custom fields would be overwritten (subcategory, styles_apply)
   - **If pending syncs exist, ASK USER**:
     - "There are X pending picklist syncs awaiting review. Would you like to review them now?"
     - For each pending sync, show severity and ask: "Approve, Reject, or Skip?"
     - **NEVER auto-approve CRITICAL severity syncs**

7. **Pending Creation Requests (OUTBOUND TO SF)**: Check for items we requested SF to create:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-pending-creation-requests.js"
   ```
   This shows:
   - Count of pending requests by type (brand, category, style, type, attribute)
   - Details of each pending request (value, when first requested, how many jobs need it)
   - Recently fulfilled requests (last 24 hours)
   - **Recommendations** (stale requests, high-volume items)
   - **Report this to user** but **DO NOT auto-action** - visibility only
   - If many requests pending for 7+ days, suggest following up with SF team

8. **Picklist Sync History** (optional): If user wants to see applied syncs:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-picklist-sync-status.js"
   ```

9. **Report Status Table**:
   - Local commit
   - GitHub commit  
   - Production commit
   - Service status (running/stopped)
   - API health (healthy/unhealthy)
   - Pending syncs (count awaiting review)
   - Pending creation requests (count sent to SF)
   - Session analytics summary (jobs processed, success rate, issues)
   - **Current `AUDIT_MODE`** (off / detect / confirm)

10. **Audit Mode Status & Ask**: report the current toggle, then ask whether to enable it:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "grep -E '^AUDIT_MODE=' /opt/catalog-verification-api/.env || echo 'AUDIT_MODE=off (default)'"
   ```
   **Ask the user**: *"Turn Audit Mode ON for this session? `detect` = read-only audit of existing data, `confirm` = re-verify + audit-gate + push-on-pass, `off` = normal verification."* If yes, flip it (see the **Audit Mode** section) and restart. ⚠️ While ON, normal verification is rerouted.

11. **Show Most Recent Session Summary**: Display contents from `session-notes/` folder
   - Show key highlights: what was completed, current state, next steps
   - Reference the session summary file by name

12. **Ask**: "Would you like to continue from where we left off?"

---

## Save Everything Procedure

**📋 Reference Document**: [docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md](../docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md) - Follow "Save Everything Procedure" section

When user says "Save everything", perform these actions:

1. **Create session summary** in `session-notes/SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md`:
   - Document work completed this session
   - List files modified and commits made
   - Include current sync status (local, GitHub, production commits)
   - Note service health and any issues encountered
   - Outline next steps or work in progress
2. **⚠️ PRE-DEPLOYMENT AUDIT** - Check if any code changes require dependent file updates:
   ```bash
   # Check what type of changes were made
   git status --short
   
   # ⭐ NEW (2026-03-03): Run comprehensive validator for ALL code changes
   bash scripts/pre-deploy-validate-all.sh
   # This replaces individual scripts - runs all 9 validation checks
   ```
   
   **Legacy individual validators** (use comprehensive validator above instead):
   ```bash
   bash scripts/validate-dependencies.sh  # Old method
   ```
   **If changes include any of these patterns, run the corresponding audit:**
   
   | Change Pattern | Run Audit | What It Checks |
   |----------------|-----------|----------------|
   | `category-type-mapping.json` or `types.json` | `bash scripts/validate-dependencies.sh --check-types <Category>` | Type keywords, AI prompts, title generators, attributes all in sync |
   | `title-schema-by-category.ts` | `bash scripts/quick-pre-deploy-check.sh` | Schema coverage, title generator imports, enrichment service alignment |
   | `*-matcher.service.ts` or `dual-ai-verification.service.ts` | `node scripts/regenerate-hardcoded-lists.js --check` | Hardcoded lists sync with JSON picklists |
   | `src/config/salesforce-picklists/*.json` | `node scripts/audit-picklist-fields.js` | Correct field names, structure validation |
   | `category-style-mapping.json` or `styles.json` | `node scripts/audit-style-crossref.js` | All category styles exist in global styles.json picklist |
   | Service files (`*.service.ts`) | `npm run build` | TypeScript compilation, no errors |
   | Any `.ts` files | `npm run lint` (if available) | Code quality, imports valid |
   
   **⭐ NEW: Dependency Validation (MANDATORY for ALL picklist/schema/type changes)**:
   - Checks type-matcher keywords match category-type-mapping
   - Verifies AI prompts mention new types
   - Validates title generator configurations include types
   - Ensures category attributes align with schemas
   - See: [docs/QUICK-DEPENDENCY-REFERENCE.md](../docs/QUICK-DEPENDENCY-REFERENCE.md)
   
   **If audit finds issues:**
   - Fix all issues before proceeding
   - Re-run audit to confirm fixes
   - Document fixes in session summary
   
   **If NO code changes** (only docs/session notes): Skip audit, proceed to step 3

2b. **📸 VERSION ARCHITECTURE DOCS** — Snapshot architecture reference documents:
   ```bash
   bash scripts/version-architecture-docs.sh
   ```
   - Creates versioned snapshots in `docs/architecture-versions/`
   - Before running: ensure working copies reflect any architectural changes this session
   - See detailed instructions in the "Save everything" section above

3. **Check for changes**: `git status`
4. **Stage all changes**: `git add -A`
5. **Commit changes**: 
   - Auto-generate message from changed files, OR
   - Ask user for commit message if changes are significant
6. **Push to GitHub**: `git push origin main`
7. **Deploy to production**:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main && npm install && npm run build && systemctl restart catalog-verification"
   ```
8. **Verify sync**: Confirm all three environments have same commit
9. **Health check**: `curl -s https://verify.cxc-ai.com/health`
10. **Audit Mode — ALWAYS ASK**: check `AUDIT_MODE` on prod; if it is **not `off`**, ask the user: *"Audit Mode is currently `<mode>`. Turn it OFF before we finish? (recommended unless an audit session is intentionally in progress)."* If yes, set `AUDIT_MODE=off` in `/opt/catalog-verification-api/.env` and `systemctl restart catalog-verification`. **Never leave Audit Mode on unintentionally** — while on, normal verification is rerouted. See the **Audit Mode** section.
11. **Report**:
   - Files changed
   - Commit hash
   - Sync status (✅ ALL SYNCED or ⚠️ OUT OF SYNC)
   - Service health
   - Current `AUDIT_MODE`

---

## Audit Mode (server-side toggle — NO Salesforce changes)

> Full detail in `CLAUDE.md`. Audits AI-verified products (**Title, Brand, Category, Type, Style, Color, Finish**) against payload evidence (**Web Retailer, Ferguson, Legacy/Verified, Specification_Table**). SF keeps sending normal verification calls; a single server-side env toggle reroutes them. **The audit is the independent gate** — the verification pipeline can't certify its own fix; only a re-audit (with evidence citation) confirms it.

**Toggle** in `/opt/catalog-verification-api/.env` → `AUDIT_MODE`:

| `AUDIT_MODE` | Inbound SF verification call | Writes to SF? |
|--------------|------------------------------|---------------|
| `off` (default) | Normal verification | ✅ normal |
| `detect` | Audits previously-verified data vs fresh evidence; report stored **our side** | ❌ never |
| `confirm` | Re-verify (no push) → audit gate → push corrected output **only if audit passes** | ✅ only audit-passed |

**Flip** (takes effect on restart):
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && sed -i '/^AUDIT_MODE=/d' .env && echo 'AUDIT_MODE=detect' >> .env && systemctl restart catalog-verification"
```
**Review** (results live in `audit_jobs`, not SF): `node scripts/audit-report.js --mismatches` (flags: `--mode=`, `--catalog=`, `--since=`, `--json`).
**Targeted confirm**: `node scripts/audit-confirm.js --catalog=MODEL --execute` (needs `SALESFORCE_API_KEY`=`WEBHOOK_SECRET`).
**Workflow**: `detect` → review → fix + deploy → `confirm` → resend → only fixed push → `off`.
**Endpoint**: `POST /api/verify/salesforce/audit`, `GET /api/verify/salesforce/audit/status/:auditId`. `AUDIT_SEND_TO_SF` stays **false** (SF has no audit branch).

> ⚠️ Always check during **"Establish Connection"** (ask to turn ON) and **"Save Everything"** (always ask to turn OFF).

---

## System Architecture & AI Pipeline

> Full detail in `CLAUDE.md`. This is the condensed reference for Copilot.

### Request Flow
```
SF Webhook POST /api/verify/salesforce
  → Controller (202 immediately, job queued)
  → Async Processor (every 5s, 100 concurrent max in production)
  → verifyProductWithDualAI()
  → Result POSTed back to SF webhook URL
```

### AI Pipeline Phases

| Phase | Description |
|-------|-------------|
| 0.0 | Canadian detection — `CA_` prefix on Web_Retailer_Key → convert CAD→USD, kg→lbs |
| 0.1A | Unpack Ferguson_Raw_Data nested JSON |
| 0.2 | Ferguson priority validation |
| 0.5 | Pre-research — scrape if data missing |
| 1 | Three-stage: Department → Category → Detailed attributes (OpenAI + xAI in parallel) |
| 2 | Build consensus + smart disagreement resolution |
| 3 | Cross-validation if category disagreement |
| 4-5 | Research retries (up to 3) |
| 6 | Final targeted web search |
| Final A | Automated rule-based validation (always runs) |
| Final B | **Claude review — non-appliances only** (Appliances skip — 926ad6b restore) |

### Category Path Logic

- **Appliances**: SF-anchored (`Web_Retailer_Category` as anchor). Both AIs disagree with SF → AI overrides SF.
- **Non-Appliances**: Unbiased. No anchor. Agreement → use it. Disagreement → title keywords → Ferguson signal → best-guess.

### Title Generation

Slot order per category schema: `Brand + Primary_Spec + Configuration/Type + Installation + Category + Finish + Model`

Key rules:
- **Finding #063**: Specific types (French Door, Outdoor, etc.) suppress generic configs (Single Door, Convertible).
- **Finding #065**: `SF_Catalog_Name` is authoritative for model number in title (prevents sibling-SKU bleed).
- **Dimension rounding**: Category-aware (`CATEGORY_SIZE_CLASSES`). Built-ins round UP to next standard. Performance ratings (CFM/GPM/BTU) use exact value.
- **Model-family overrides** (`config/model-family-overrides.json`): Applied post-consensus, before title.

### Important Architecture Note — Claude Phase B Scope

`AI_AUDIT_PROMPT.md` states Claude is used "in self-healing diagnostics only" — **this is incorrect**. Claude (Sonnet 4-6) runs Phase B final review on every non-appliance verification job. This affects cost estimates. Appliances skip Phase B by design.

---

## Platform Audit (whole-platform quality initiative)

**Guide**: `docs/PLATFORM-AUDIT-GUIDE.md` — the standing methodology + execution plan for auditing the ENTIRE
platform (gaps, enhancements, oversight, concerns, waste, inaccuracies). Contains a **Status Board** showing
which phase is active and the exact next action. Any session asked to "audit the platform" or continue the
audit MUST start from that guide. Core rules: deterministic corpus scans before LLM judgment, classify every
finding (pipeline bug / bad data / audit over-strictness) before coding, no live `confirm` loops until the
golden harness exists (Finding #078 lesson). Update the Status Board before ending an audit session.

---

## Known Issues & Active Findings

> Update this section whenever a bug is fixed or a new issue is discovered. Mirror in `CLAUDE.md`.

### 🔴 Claude Title Override (Active — Source of Bad Responses)
**Issue**: When Claude's Phase B proposes a corrected title, the system always uses the schema title instead ("preserves formatting rules"). When schema fields are wrong (e.g., wrong width, wrong model number), Claude has the correct value but gets ignored.

**Location**: `src/services/dual-ai-verification.service.ts` ~line 12356.

**Impact**: Bad titles in SF responses for non-appliance products where schema-generated fields were wrong.

**Status**: Open — not yet investigated.

### ✅ Garbage Attributes in attributes.json (Resolved — verified by Platform Audit Phase 1, June 9 2026)
**Was**: May 27 cagp-lot batch caused 6 garbage `NEEDS_SF_ID` entries in `attributes.json` (plus 33 legitimate ones awaiting SF IDs).

**Resolution**: All NEEDS_SF_ID entries are gone — `grep -c NEEDS_SF_ID` returns **0** on local, GitHub, and production (resolved via `98c17ac`). Confirmed by GAP-04 scan (`audit-results/platform-audit/2026-06-09/scan-gaps.json`). Mirror of CLAUDE.md entry.

### 🟡 cagp-lot Batch (763 Jobs — SF Rejected All Webhooks)
**Issue**: May 27 batch of ~763 jobs completed on our side but SF rejected every webhook with `"Invalid id: cagp-lot-XXX"`. Zero results applied in Salesforce.

**Status**: Needs clarification — were these test jobs? Resubmission needed?

### 🟡 Pending Creation Requests — 49 Stale
**Issue**: `Freestanding` (72 days, 13 jobs waiting) and `Counter Depth` (72 days, 6 jobs waiting) are highest impact. SF follow-up needed.

**Status**: Open.

### ✅ Circular Dependency Fixed (June 2026)
`src/utils/logger.ts` → `config/index.ts` → `category-aliases.ts` → `logger.ts` circular loop. Fixed by removing config import from logger.ts and reading directly from `process.env`.

---

## Sync Note

`CLAUDE.md` (repo root) and `.github/copilot-instructions.md` (this file) must stay in sync.

**Rule**: Any procedure, finding, or architectural change added to one must be added to the other.
