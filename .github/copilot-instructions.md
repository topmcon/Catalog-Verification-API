# Copilot Instructions - Catalog Verification API

## Quick Reference

When the user says **"Establish Connection"** or **"Connect to production"**, execute these steps:
1. Verify SSH connectivity to production server
2. Compare local, GitHub, and production commits
3. Check production service health
4. Report sync status

When the user says **"Save everything"** or **"Save all"**, execute these steps:
1. Check for any uncommitted changes (`git status`)
2. Stage all changes (`git add -A`)
3. Commit with descriptive message (ask user or auto-generate based on changed files)
4. Push to GitHub (`git push origin main`)
5. Wait for CI/CD or manually deploy to production
6. Verify all three environments are synced
7. Confirm production service is healthy

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

## Terminology

| Term | Meaning |
|------|---------|
| "Production" / "Server" / "Live" | verify.cxc-ai.com |
| "Local" / "Dev" | This workspace (localhost:3001) |
| "Sync" / "Deploy" | Push code to GitHub → CI/CD deploys to production |
| "SFDC-Callout" | Salesforce making API call to our service |

---

## Establish Connection Procedure

When user says "Establish Connection", perform these checks and report:

1. **SSH Connectivity**: `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "echo connected"`
2. **Commit Sync Check**: Compare commits across local, GitHub, and production
3. **Service Health**: Check `systemctl status catalog-verification`
4. **API Health**: `curl -s https://verify.cxc-ai.com/health`
5. **Report Status Table**:
   - Local commit
   - GitHub commit  
   - Production commit
   - Service status (running/stopped)
   - API health (healthy/unhealthy)

---

## Save Everything Procedure

When user says "Save everything", perform these actions:

1. **Check for changes**: `git status`
2. **Stage all changes**: `git add -A`
3. **Commit changes**: 
   - Auto-generate message from changed files, OR
   - Ask user for commit message if changes are significant
4. **Push to GitHub**: `git push origin main`
5. **Deploy to production**:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main && npm install && systemctl restart catalog-verification"
   ```
6. **Verify sync**: Confirm all three environments have same commit
7. **Health check**: `curl -s https://verify.cxc-ai.com/health`
8. **Report**:
   - Files changed
   - Commit hash
   - Sync status (✅ ALL SYNCED or ⚠️ OUT OF SYNC)
   - Service health
