# Copilot Instructions - Catalog Verification API

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
- Session notes → `session-notes/`
- Code examples → `examples/`
- Postman collections → `postman/`
- Audit results/JSON → `audit-results/`
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for complete guidelines

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
1. **Create session summary** in `session-notes/SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md`:
   - Document work completed this session
   - List files modified and commits made
   - Include current sync status (local, GitHub, production commits)
   - Note service health and any issues encountered
   - Outline next steps or work in progress
2. Check for any uncommitted changes (`git status`)
3. Stage all changes including session summary (`git add -A`)
4. Commit with descriptive message (ask user or auto-generate based on changed files)
5. Push to GitHub (`git push origin main`)
6. Deploy to production:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && \
      git stash && \
      git pull origin main && \
      npm install && \
      npm run build && \
      systemctl restart catalog-verification"
   ```
7. **⚠️ CRITICAL: Verify all three environments are synced** - Run this check:
   ```bash
   LOCAL=$(git rev-parse --short HEAD) && \
   GITHUB=$(git ls-remote origin main | cut -c1-7) && \
   PROD=$(ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7") && \
   echo "LOCAL: $LOCAL | GITHUB: $GITHUB | PROD: $PROD" && \
   if [ "$LOCAL" = "$GITHUB" ] && [ "$GITHUB" = "$PROD" ]; then echo "✅ ALL SYNCED"; else echo "⚠️ OUT OF SYNC - PROCEDURE NOT COMPLETE"; fi
   ```
   **If OUT OF SYNC: Re-run step 6. Do NOT finish until all 3 match.**
8. Confirm production service is healthy:
   ```bash
   curl -s https://verify.cxc-ai.com/health
   ```
9. Report summary:
   - Files changed
   - Commit hash (must be same across all 3 environments)
   - Sync status (✅ ALL SYNCED or ⚠️ OUT OF SYNC)
   - Service health

**⚠️ The "Save everything" procedure is NOT complete until step 7 shows ALL SYNCED.**

When creating **session summaries**, save to `session-notes/SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md`

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
Host: verify.cxc-ai.com
User: root
Key: ~/.ssh/cxc_ai_deploy
```

### SSH Command Template
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "<command>"
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

## Picklist Sync System

### How Salesforce Updates Our Picklists (Automated)

1. **Salesforce Pushes Updates**: Salesforce calls `POST /api/picklists/sync` with updated picklist data
2. **API Receives & Validates**: Production server validates and processes the sync request
3. **Files Updated**: JSON files in `src/config/salesforce-picklists/` are updated:
   - `attributes.json`
   - `brands.json`
   - `categories.json`
   - `styles.json`
   - `category-filter-attributes.json`
4. **Sync Logged**: Complete audit trail saved to `PicklistSyncLog` collection in MongoDB
5. **Catalog Index Updated**: Internal catalog index marks items as "in Salesforce"
6. **Auto-Commit to GitHub**: Cron job (runs every 5 min) detects changes and commits to GitHub

### Checking for Recent Picklist Updates

When "Establish Connection" is run, use the dedicated script to check:
```bash
# Show detailed picklist sync status with before/after changes
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-picklist-sync-status.js"
```

This displays:
- ✅ When the last sync occurred (EST timezone + time ago)
- ✅ What changed (before/after item counts)
- ✅ Detailed list of items added/removed (up to 10 shown per type)
- ✅ Total changes across all picklist types
- ✅ Sync ID for audit trail lookup

**CRITICAL**: If you see significant changes (many items removed/added), ask the user:
- "These changes look significant. Do they seem correct?"
- "Should we investigate why these items were removed/added?"
- "Do we need to update any automation based on these changes?"

### Picklist Management Tools

#### 0. Check Picklist Sync Status (Monitoring)
**Script**: `scripts/check-picklist-sync-status.js`  
**Run from**: Production server (via SSH)  
**Purpose**: Display detailed information about the most recent picklist sync from Salesforce  
**What it does**:
- Shows when the last sync occurred (EST timezone + time ago)
- Displays before/after item counts for each picklist type
- Lists up to 10 added/removed items per type
- Shows sync ID, processing time, source IP
- Calculates total changes across all picklist types
- **Used by "Establish Connection" procedure**

**Usage**:
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-picklist-sync-status.js"
```

**When to use**:
- During "Establish Connection" (automatic)
- Investigating recent picklist changes
- Monitoring Salesforce sync activity
- Verifying picklist updates were received

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

6. **Picklist Sync Status**: Run dedicated script to show detailed changes:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/check-picklist-sync-status.js"
   ```
   This shows:
   - When last sync occurred (EST time + time ago)
   - What changed (before/after counts)
   - Items added/removed (detailed list up to 10 per type)
   - **CRITICAL**: If significant changes detected, ASK USER:
     - "These changes look significant. Do they seem correct?"
     - "Should we investigate why these items were removed/added?"
     - "Do we need to update any automation based on these changes?"

7. **Report Status Table**:
   - Local commit
   - GitHub commit  
   - Production commit
   - Service status (running/stopped)
   - API health (healthy/unhealthy)
   - Last picklist sync (timestamp, # changes)
   - Session analytics summary (jobs processed, success rate, issues)

8. **Show Most Recent Session Summary**: Display contents from `session-notes/` folder
   - Show key highlights: what was completed, current state, next steps
   - Reference the session summary file by name

9. **Ask**: "Would you like to continue from where we left off?"

---

## Save Everything Procedure

When user says "Save everything", perform these actions:

1. **Create session summary** in `session-notes/SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md`:
   - Document work completed this session
   - List files modified and commits made
   - Include current sync status (local, GitHub, production commits)
   - Note service health and any issues encountered
   - Outline next steps or work in progress
2. **Check for changes**: `git status`
3. **Stage all changes**: `git add -A`
4. **Commit changes**: 
   - Auto-generate message from changed files, OR
   - Ask user for commit message if changes are significant
5. **Push to GitHub**: `git push origin main`
6. **Deploy to production**:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main && npm install && npm run build && systemctl restart catalog-verification"
   ```
7. **Verify sync**: Confirm all three environments have same commit
8. **Health check**: `curl -s https://verify.cxc-ai.com/health`
9. **Report**:
   - Files changed
   - Commit hash
   - Sync status (✅ ALL SYNCED or ⚠️ OUT OF SYNC)
   - Service health
