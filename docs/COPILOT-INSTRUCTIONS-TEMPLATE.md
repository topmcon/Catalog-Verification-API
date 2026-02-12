# Copilot Instructions Template
**Version:** 1.0  
**Last Updated:** February 12, 2026

> **How to use this template:**
> 1. Copy this file to `.github/copilot-instructions.md` in your target repository
> 2. Replace all `{{PLACEHOLDER}}` values with your actual values
> 3. Remove this instruction block and the Configuration section after setup

---

## Configuration (Replace These Placeholders)

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{PROJECT_NAME}}` | Your project name | `My-API` |
| `{{SERVER_DOMAIN}}` | Production server domain | `api.example.com` |
| `{{SSH_KEY_PATH}}` | Path to SSH private key | `~/.ssh/deploy_key` |
| `{{SSH_USER}}` | SSH username | `root` |
| `{{DEPLOY_PATH}}` | Path on server where code lives | `/opt/my-api` |
| `{{SERVICE_NAME}}` | systemd service name | `my-api` |
| `{{API_PORT}}` | Port your API runs on | `3001` |
| `{{DB_PORT}}` | Database port (if applicable) | `27017` |
| `{{HEALTH_ENDPOINT}}` | Health check endpoint path | `/health` |
| `{{SESSION_NOTES_PATH}}` | Where to save session summaries | `session-notes/` |

---

# Copilot Instructions - {{PROJECT_NAME}}

## ⚠️ CRITICAL: PRODUCTION-FIRST OPERATIONS

**ALWAYS DEFAULT TO PRODUCTION SERVER** unless explicitly told otherwise.

When running commands, checking logs, testing APIs, or gathering data:
- ✅ **DO**: Execute on production server (`{{SERVER_DOMAIN}}`) via SSH
- ❌ **DON'T**: Run locally unless specifically requested
- 🔧 **Testing/Development**: Only use local when user says "test locally" or "run dev"

**Examples:**
- "Check logs" → SSH to production, tail production logs
- "Test API" → Test production endpoint `https://{{SERVER_DOMAIN}}/api/...`
- "Check status" → Query production server

**Local workspace is for CODE EDITING ONLY**, not execution.

---

## Quick Reference

When the user says **"Establish Connection"** or **"Connect to production"**, execute these steps:
1. Verify SSH connectivity to production server
2. Compare local, GitHub, and production commits
3. Check production service health
4. **Verify all required ports and processes are running:**
   - Port {{API_PORT}}: Node.js/Python API ({{SERVICE_NAME}} service)
   - Port {{DB_PORT}}: Database (if applicable)
   - Port 443: HTTPS (nginx)
   - Port 80: HTTP redirect (nginx)
5. Report sync status and system health
6. **Find and display the most recent session summary** from `{{SESSION_NOTES_PATH}}` folder
7. Ask user if they want to continue from where we left off

When the user says **"Save everything"** or **"Save all"**, execute these steps:
1. **Create comprehensive handoff session summary** in `{{SESSION_NOTES_PATH}}SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md`:
   
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
2. Check for any uncommitted changes (`git status`)
3. Stage all changes including session summary (`git add -A`)
4. Commit with descriptive message (ask user or auto-generate based on changed files)
5. Push to GitHub (`git push origin main`)
6. Deploy to production:
   ```bash
   ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} \
     "cd {{DEPLOY_PATH}} && \
      git stash && \
      git pull origin main && \
      npm install && \
      npm run build && \
      systemctl restart {{SERVICE_NAME}}"
   ```
7. **⚠️ CRITICAL: Verify all three environments are synced** - Run this check:
   ```bash
   LOCAL=$(git rev-parse --short HEAD) && \
   GITHUB=$(git ls-remote origin main | cut -c1-7) && \
   PROD=$(ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "cat {{DEPLOY_PATH}}/.git/refs/heads/main | cut -c1-7") && \
   echo "LOCAL: $LOCAL | GITHUB: $GITHUB | PROD: $PROD" && \
   if [ "$LOCAL" = "$GITHUB" ] && [ "$GITHUB" = "$PROD" ]; then echo "✅ ALL SYNCED"; else echo "⚠️ OUT OF SYNC - PROCEDURE NOT COMPLETE"; fi
   ```
   **If OUT OF SYNC: Re-run step 6. Do NOT finish until all 3 match.**
8. Confirm production service is healthy:
   ```bash
   curl -s https://{{SERVER_DOMAIN}}{{HEALTH_ENDPOINT}}
   ```
9. Report summary:
   - Files changed
   - Commit hash (must be same across all 3 environments)
   - Sync status (✅ ALL SYNCED or ⚠️ OUT OF SYNC)
   - Service health

**⚠️ The "Save everything" procedure is NOT complete until step 7 shows ALL SYNCED.**

---

## Required Ports & Processes

### Production Server ({{SERVER_DOMAIN}})

| Port | Service | Process | Check Command |
|------|---------|---------|---------------|
| {{API_PORT}} | API | {{SERVICE_NAME}} | `systemctl is-active {{SERVICE_NAME}}` |
| {{DB_PORT}} | Database | Docker/native | `ss -tlnp \| grep {{DB_PORT}}` |
| 443 | HTTPS | nginx | `systemctl is-active nginx` |
| 80 | HTTP redirect | nginx | `systemctl is-active nginx` |

### Quick Health Check Command
```bash
ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "ss -tlnp | grep -E '({{API_PORT}}|{{DB_PORT}}|443|80)'"
```

---

## Environment Definitions

### LOCAL
- **Location**: Your workspace directory
- **URL**: `http://localhost:{{API_PORT}}`
- **Purpose**: Development and testing
- **Start Command**: `npm run dev` (or your start command)

### PRODUCTION
- **Server**: `{{SERVER_DOMAIN}}`
- **URL**: `https://{{SERVER_DOMAIN}}`
- **Deploy Path**: `{{DEPLOY_PATH}}`
- **Service**: `{{SERVICE_NAME}}.service` (systemd)
- **Port**: {{API_PORT}} (behind nginx reverse proxy)

---

## SSH Access

### Connection Details
```
Host: {{SERVER_DOMAIN}}
User: {{SSH_USER}}
Key: {{SSH_KEY_PATH}}
```

### SSH Command Template
```bash
ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "<command>"
```

### Common SSH Commands

| Action | Command |
|--------|---------|
| **Check commit** | `ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "cd {{DEPLOY_PATH}} && cat .git/refs/heads/main \| cut -c1-7"` |
| **Service status** | `ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "systemctl status {{SERVICE_NAME}} \| head -15"` |
| **Restart service** | `ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "systemctl restart {{SERVICE_NAME}}"` |
| **View logs** | `ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "tail -50 {{DEPLOY_PATH}}/logs/combined.log"` |
| **Live log stream** | `ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "tail -f {{DEPLOY_PATH}}/logs/combined.log"` |
| **Pull latest code** | `ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "cd {{DEPLOY_PATH}} && git pull origin main"` |
| **Full deploy** | `ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "cd {{DEPLOY_PATH}} && git pull origin main && npm install && npm run build && systemctl restart {{SERVICE_NAME}}"` |

---

## Deployment Workflow

### Manual Deployment
```bash
ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "cd {{DEPLOY_PATH}} && git pull origin main && npm install && npm run build && systemctl restart {{SERVICE_NAME}}"
```

**⚠️ CRITICAL:** Always run `npm run build` after pulling code if using TypeScript! Production runs compiled JavaScript from `dist/` folder, not TypeScript source.

---

## Sync Verification Command

To verify all environments are synced, run:
```bash
echo "=== LOCAL ===" && git log -1 --oneline && \
echo "=== GITHUB ===" && git ls-remote origin main | cut -c1-7 && \
echo "=== PRODUCTION ===" && ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "cat {{DEPLOY_PATH}}/.git/refs/heads/main | cut -c1-7"
```

---

## Health Checks

| Environment | Command |
|-------------|---------|
| Local | `curl -s http://localhost:{{API_PORT}}{{HEALTH_ENDPOINT}}` |
| Production | `curl -s https://{{SERVER_DOMAIN}}{{HEALTH_ENDPOINT}}` |

Expected response: `{"status":"healthy","timestamp":"..."}`

---

## Log Locations

### Local
- Console output from `npm run dev`

### Production
- Combined: `{{DEPLOY_PATH}}/logs/combined.log`
- Errors: `{{DEPLOY_PATH}}/logs/error.log`

---

## Terminology

| Term | Meaning |
|------|---------|
| "Production" / "Server" / "Live" | {{SERVER_DOMAIN}} |
| "Local" / "Dev" | This workspace (localhost:{{API_PORT}}) |
| "Sync" / "Deploy" | Push code to GitHub → Deploy to production |

---

## Establish Connection Procedure

When user says "Establish Connection", perform these checks and report:

1. **SSH Connectivity**: `ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "echo connected"`

2. **Commit Sync Check**: Compare commits across local, GitHub, and production

3. **Service Health**: Check `systemctl status {{SERVICE_NAME}}`

4. **API Health**: `curl -s https://{{SERVER_DOMAIN}}{{HEALTH_ENDPOINT}}`

5. **Report Status Table**:
   - Local commit
   - GitHub commit  
   - Production commit
   - Service status (running/stopped)
   - API health (healthy/unhealthy)

6. **Show Most Recent Session Summary**: Display contents from `{{SESSION_NOTES_PATH}}` folder
   - Show key highlights: what was completed, current state, next steps
   - Reference the session summary file by name

7. **Ask**: "Would you like to continue from where we left off?"

---

## Save Everything Procedure

When user says "Save everything", perform these actions:

1. **Create session summary** in `{{SESSION_NOTES_PATH}}SESSION-SUMMARY-YYYY-MM-DD[-DESCRIPTOR].md`:
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
   ssh -i {{SSH_KEY_PATH}} {{SSH_USER}}@{{SERVER_DOMAIN}} "cd {{DEPLOY_PATH}} && git pull origin main && npm install && npm run build && systemctl restart {{SERVICE_NAME}}"
   ```
7. **Verify sync**: Confirm all three environments have same commit
8. **Health check**: `curl -s https://{{SERVER_DOMAIN}}{{HEALTH_ENDPOINT}}`
9. **Report**:
   - Files changed
   - Commit hash
   - Sync status (✅ ALL SYNCED or ⚠️ OUT OF SYNC)
   - Service health
