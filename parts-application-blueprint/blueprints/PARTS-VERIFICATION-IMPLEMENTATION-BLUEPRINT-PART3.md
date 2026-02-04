# PARTS VERIFICATION API - IMPLEMENTATION BLUEPRINT (PART 3)

**Continuation of**: PARTS-VERIFICATION-IMPLEMENTATION-BLUEPRINT-PART2.md (Part 2)  
**Sections**: Environment Configuration, Scripts, Testing, Migration Checklist

---

## 14. ENVIRONMENT CONFIGURATION

### 14.1 Environment Variables (.env)

**File**: `.env` (production)

```bash
# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV=production
PORT=3001

# ============================================
# DATABASE
# ============================================
MONGODB_URI=mongodb://admin:password@localhost:27017/parts-verification?authSource=admin
MONGODB_DB_NAME=parts-verification

# ============================================
# AI PROVIDERS
# ============================================

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.1
OPENAI_MAX_TOKENS=4000

# xAI Configuration
XAI_API_KEY=xai-...
XAI_MODEL=grok-2-latest
XAI_TEMPERATURE=0.1
XAI_MAX_TOKENS=4000

# Anthropic Configuration (optional - for tie-breaking)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# ============================================
# SALESFORCE INTEGRATION
# ============================================
SALESFORCE_WEBHOOK_URL=https://your-sf-instance.salesforce.com/services/apexrest/VerificationCallback
SALESFORCE_API_VERSION=v59.0
SALESFORCE_TIMEOUT=120000

# ============================================
# API SECURITY
# ============================================
API_KEY=your-secure-api-key-here
CORS_ORIGIN=https://your-sf-instance.salesforce.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# ASYNC PROCESSING
# ============================================
ASYNC_PROCESSOR_INTERVAL_MS=5000
ASYNC_PROCESSOR_ENABLED=true

# ============================================
# SELF-HEALING
# ============================================
SELF_HEALING_ENABLED=true
SELF_HEALING_DELAY_MS=60000
SELF_HEALING_MAX_ATTEMPTS=3

# ============================================
# RESEARCH CAPABILITIES
# ============================================
RESEARCH_ENABLED=true
RESEARCH_TIMEOUT_MS=15000
RESEARCH_MAX_URLS=5
RESEARCH_MAX_PDFS=3
RESEARCH_MAX_IMAGES=5
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ============================================
# CONSENSUS CONFIGURATION
# ============================================
CONSENSUS_THRESHOLD=85
CONSENSUS_MAX_RETRIES=3
CONSENSUS_RETRY_DELAY_MS=2000

# ============================================
# WEBHOOK CONFIGURATION
# ============================================
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAYS=5000,15000,30000
WEBHOOK_TIMEOUT_MS=10000

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_DIR=./logs
LOG_MAX_FILES=30

# ============================================
# ANALYTICS
# ============================================
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=90

# ============================================
# PICKLIST SYNC
# ============================================
PICKLIST_AUTO_COMMIT_ENABLED=true
PICKLIST_SYNC_CRON=*/5 * * * *

# ============================================
# HEALTH CHECK
# ============================================
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL_MS=30000
```

### 14.2 TypeScript Configuration

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### 14.3 Package Scripts

**File**: `package.json` (scripts section)

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    
    "db:connect": "mongo mongodb://localhost:27017/parts-verification",
    "logs:combined": "tail -f logs/combined.log",
    "logs:error": "tail -f logs/error.log",
    
    "deploy:production": "./deploy.sh",
    "health:check": "curl -s https://verify-parts.yourcompany.com/health",
    "queue:stats": "curl -s https://verify-parts.yourcompany.com/api/verify/salesforce/queue/stats",
    
    "picklists:sync-from-prod": "node scripts/sync-picklists-from-production.js",
    "picklists:check-status": "node scripts/check-picklist-sync-status.js",
    
    "analytics:session": "node scripts/show-session-analytics.js",
    "analytics:dashboard": "curl -s https://verify-parts.yourcompany.com/api/analytics/dashboard"
  }
}
```

---

## 15. SCRIPTS & UTILITIES

### 15.1 Essential Scripts

**All scripts go in**: `scripts/` directory

#### sync-picklists-from-production.js
```javascript
/**
 * Download picklist files from production server to local
 * Usage: node scripts/sync-picklists-from-production.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PRODUCTION_HOST = 'verify-parts.yourcompany.com';
const SSH_KEY = '~/.ssh/parts_verification_deploy';
const REMOTE_PATH = '/opt/parts-verification-api/src/config/salesforce-picklists';
const LOCAL_PATH = path.join(__dirname, '../src/config/salesforce-picklists');

const FILES = [
  'brands.json',
  'categories.json',
  'styles.json',
  'attributes.json',
  'category-filter-attributes.json'
];

console.log('=== Syncing Picklists from Production ===\n');

for (const file of FILES) {
  console.log(`Downloading ${file}...`);
  
  const remoteFile = `${REMOTE_PATH}/${file}`;
  const localFile = path.join(LOCAL_PATH, file);
  
  // Backup existing file
  if (fs.existsSync(localFile)) {
    const backupFile = `${localFile}.backup`;
    fs.copyFileSync(localFile, backupFile);
    console.log(`  Backed up to ${path.basename(backupFile)}`);
  }
  
  // Download from production
  const cmd = `scp -i ${SSH_KEY} root@${PRODUCTION_HOST}:${remoteFile} ${localFile}`;
  execSync(cmd);
  
  console.log(`  ✅ ${file} synced\n`);
}

console.log('All picklists synced successfully!');
```

#### check-picklist-sync-status.js
```javascript
/**
 * Display most recent picklist sync details
 * Usage: node scripts/check-picklist-sync-status.js
 */
const mongoose = require('mongoose');
const { PicklistSyncLog } = require('../dist/models');
const moment = require('moment-timezone');

async function checkStatus() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const latestSync = await PicklistSyncLog.findOne().sort({ timestamp: -1 });
  
  if (!latestSync) {
    console.log('No picklist syncs found');
    process.exit(0);
  }
  
  console.log('\n=== LATEST PICKLIST SYNC ===');
  console.log(`Sync ID: ${latestSync.syncId}`);
  console.log(`Timestamp: ${moment(latestSync.timestamp).tz('America/New_York').format('MMM D, YYYY h:mm:ss A z')}`);
  console.log(`Time Ago: ${moment(latestSync.timestamp).fromNow()}`);
  console.log(`Source: ${latestSync.source}`);
  console.log('\nCHANGES:');
  
  for (const [type, changes] of Object.entries(latestSync.changes)) {
    console.log(`\n${type.toUpperCase()}:`);
    console.log(`  Before: ${changes.beforeCount}, After: ${changes.afterCount}`);
    console.log(`  Added: ${changes.added.length}, Removed: ${changes.removed.length}`);
    
    if (changes.added.length > 0) {
      console.log(`  Items Added: ${changes.added.slice(0, 10).join(', ')}${changes.added.length > 10 ? ` ...and ${changes.added.length - 10} more` : ''}`);
    }
    if (changes.removed.length > 0) {
      console.log(`  Items Removed: ${changes.removed.slice(0, 10).join(', ')}${changes.removed.length > 10 ? ` ...and ${changes.removed.length - 10} more` : ''}`);
    }
  }
  
  console.log(`\nTOTAL CHANGES: ${latestSync.totalChanges}`);
  console.log(`Success: ${latestSync.success ? 'Yes' : 'No'}\n`);
  
  await mongoose.disconnect();
}

checkStatus().catch(console.error);
```

#### show-session-analytics.js
```javascript
/**
 * Display comprehensive system analytics since last connection
 * Usage: node scripts/show-session-analytics.js
 */
// See full implementation in Section 12.2 above
```

#### auto-sync-picklists.sh
```bash
#!/bin/bash
# Auto-commit picklist changes to GitHub (runs via cron every 5 minutes)

cd /opt/parts-verification-api

# Check for changes
if git diff --quiet src/config/salesforce-picklists/; then
  exit 0  # No changes
fi

# Commit and push
git add src/config/salesforce-picklists/*.json
git commit -m "Auto-sync: Picklist updates from Salesforce ($(date '+%Y-%m-%d %H:%M:%S'))"
git push origin main

echo "[$(date)] Picklists synced to GitHub" >> logs/picklist-sync-to-git.log
```

#### fetch-recent-jobs.js
```javascript
/**
 * Fetch recent verification jobs for debugging
 * Usage: node scripts/fetch-recent-jobs.js [limit]
 */
const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models');

async function fetchRecentJobs(limit = 10) {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const jobs = await VerificationJob.find()
    .sort({ createdAt: -1 })
    .limit(limit);
  
  console.log(`\n=== RECENT ${limit} JOBS ===\n`);
  
  for (const job of jobs) {
    console.log(`Job ID: ${job.jobId}`);
    console.log(`  SF Catalog: ${job.sfCatalogId} | ${job.sfCatalogName}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Created: ${job.createdAt.toISOString()}`);
    if (job.processingTimeMs) {
      console.log(`  Processing Time: ${(job.processingTimeMs / 1000).toFixed(1)}s`);
    }
    if (job.result?.verification_metadata) {
      console.log(`  Verification Score: ${job.result.verification_metadata.verification_score}`);
    }
    console.log(`  Webhook Success: ${job.webhookSuccess ? 'Yes' : 'No'}`);
    console.log('');
  }
  
  await mongoose.disconnect();
}

const limit = parseInt(process.argv[2]) || 10;
fetchRecentJobs(limit).catch(console.error);
```

#### retry-webhook.js
```javascript
/**
 * Retry webhook for a failed job
 * Usage: node scripts/retry-webhook.js <jobId>
 */
const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models');
const webhookService = require('../dist/services/webhook.service');

async function retryWebhook(jobId) {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const job = await VerificationJob.findOne({ jobId });
  
  if (!job) {
    console.error(`Job not found: ${jobId}`);
    process.exit(1);
  }
  
  console.log(`Retrying webhook for job ${jobId}...`);
  
  await webhookService.sendVerificationWebhook(job);
  
  console.log('Webhook retry complete');
  await mongoose.disconnect();
}

const jobId = process.argv[2];
if (!jobId) {
  console.error('Usage: node scripts/retry-webhook.js <jobId>');
  process.exit(1);
}

retryWebhook(jobId).catch(console.error);
```

---

## 16. TESTING STRATEGY

### 16.1 Test Structure

```
src/__tests__/
├── unit/
│   ├── services/
│   │   ├── consensus.service.test.ts
│   │   ├── picklist-matcher.service.test.ts
│   │   ├── category-matcher.service.test.ts
│   │   └── smart-field-inference.service.test.ts
│   ├── utils/
│   │   ├── text-cleaner.test.ts
│   │   ├── json-parser.test.ts
│   │   └── similarity.test.ts
│   └── models/
│       └── verification-job.model.test.ts
├── integration/
│   ├── dual-ai-verification.test.ts
│   ├── research.service.test.ts
│   ├── webhook.service.test.ts
│   └── self-healing.test.ts
└── e2e/
    ├── salesforce-verification-flow.test.ts
    └── picklist-sync-flow.test.ts
```

### 16.2 Example Unit Test

**File**: `src/__tests__/unit/services/consensus.service.test.ts`

```typescript
import { calculateConsensusScore } from '../../../services/consensus.service';
import { AIValidationResult } from '../../../types/ai.types';

describe('ConsensusService', () => {
  describe('calculateConsensusScore', () => {
    
    it('should give 100% score for identical results', () => {
      const openaiResult: AIValidationResult = {
        category_determined: 'HVAC Filters',
        primary_attributes: { Brand_Verified: 'Honeywell', Model_Number_Verified: 'FILTER-123' },
        filter_attributes: { Filter_Size: '20x25x4', MERV_Rating: 11 }
      };
      
      const xaiResult: AIValidationResult = {
        category_determined: 'HVAC Filters',
        primary_attributes: { Brand_Verified: 'Honeywell', Model_Number_Verified: 'FILTER-123' },
        filter_attributes: { Filter_Size: '20x25x4', MERV_Rating: 11 }
      };
      
      const metrics = calculateConsensusScore(openaiResult, xaiResult);
      
      expect(metrics.overallScore).toBe(100);
      expect(metrics.categoryMatch).toBe(true);
      expect(metrics.agreementPercentage).toBe(100);
    });
    
    it('should penalize category mismatch', () => {
      const openaiResult: AIValidationResult = {
        category_determined: 'HVAC Filters',
        primary_attributes: { Brand_Verified: 'Honeywell' },
        filter_attributes: {}
      };
      
      const xaiResult: AIValidationResult = {
        category_determined: 'Appliance Knobs',  // Different!
        primary_attributes: { Brand_Verified: 'Honeywell' },
        filter_attributes: {}
      };
      
      const metrics = calculateConsensusScore(openaiResult, xaiResult);
      
      expect(metrics.categoryMatch).toBe(false);
      expect(metrics.overallScore).toBeLessThan(100);
    });
    
    it('should score partial agreement correctly', () => {
      const openaiResult: AIValidationResult = {
        category_determined: 'HVAC Filters',
        primary_attributes: {
          Brand_Verified: 'Honeywell',
          Model_Number_Verified: 'FILTER-123',
          MSRP_Verified: '49.99'
        },
        filter_attributes: { Filter_Size: '20x25x4', MERV_Rating: 11 }
      };
      
      const xaiResult: AIValidationResult = {
        category_determined: 'HVAC Filters',
        primary_attributes: {
          Brand_Verified: 'Honeywell',
          Model_Number_Verified: 'FILTER-123',
          MSRP_Verified: '45.99'  // Different!
        },
        filter_attributes: { Filter_Size: '20x25x4', MERV_Rating: 13 }  // Different!
      };
      
      const metrics = calculateConsensusScore(openaiResult, xaiResult);
      
      expect(metrics.categoryMatch).toBe(true);
      expect(metrics.fieldsAgreed).toBe(3);  // Brand, Model, Filter_Size
      expect(metrics.fieldsDisagreed).toBe(2);  // MSRP, MERV_Rating
      expect(metrics.agreementPercentage).toBe(60);  // 3/5 = 60%
    });
  });
});
```

### 16.3 Example Integration Test

**File**: `src/__tests__/integration/dual-ai-verification.test.ts`

```typescript
import { verifyPartWithDualAI } from '../../services/dual-ai-verification.service';
import { SalesforceIncomingProduct } from '../../types/salesforce.types';

describe('DualAIVerification Integration', () => {
  
  it('should verify a part with full data', async () => {
    const partData: SalesforceIncomingProduct = {
      SF_Catalog_Id: 'test_123',
      SF_Catalog_Name: 'FILTER-12345',
      Brand_Web_Retailer: 'Honeywell',
      Model_Number_Web_Retailer: 'FILTER-12345',
      MSRP_Web_Retailer: '49.99',
      Product_Title_Web_Retailer: 'Honeywell 20x25x4 MERV 11 Filter',
      Web_Retailer_Category: 'HVAC',
      Web_Retailer_SubCategory: 'Air Filters',
      Web_Retailer_Specs: [
        { name: 'Filter Size', value: '20x25x4' },
        { name: 'MERV Rating', value: '11' }
      ],
      Ferguson_Title: 'Honeywell MERV 11 Filter',
      Ferguson_Brand: 'Honeywell',
      Ferguson_Price: '45.99'
    };
    
    const result = await verifyPartWithDualAI(partData, 'test_session');
    
    expect(result).toBeDefined();
    expect(result.primary_display_attributes.Brand_Verified).toBe('Honeywell');
    expect(result.primary_display_attributes.Category_Verified).toContain('Filter');
    expect(result.verification_metadata.verification_score).toBeGreaterThan(70);
    expect(result.verification_metadata.data_sources_used).toContain('AI_OpenAI');
    expect(result.verification_metadata.data_sources_used).toContain('AI_xAI');
  }, 60000);  // 60 second timeout
  
  it('should handle missing data gracefully', async () => {
    const partData: SalesforceIncomingProduct = {
      SF_Catalog_Id: 'test_456',
      SF_Catalog_Name: 'UNKNOWN-PART',
      Brand_Web_Retailer: '',
      Model_Number_Web_Retailer: 'UNKNOWN-PART'
    };
    
    const result = await verifyPartWithDualAI(partData, 'test_session');
    
    expect(result).toBeDefined();
    expect(result.verification_metadata.missing_fields.length).toBeGreaterThan(0);
    expect(result.verification_metadata.verification_status).toMatch(/needs_review|failed/);
  }, 60000);
});
```

### 16.4 Jest Configuration

**File**: `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/types/**',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000
};
```

---

## 17. MIGRATION CHECKLIST

### 17.1 Pre-Migration Preparation

- [ ] **Review Parts Domain**: Understand parts industry requirements
- [ ] **Define Part Categories**: List all part types (HVAC, Appliance, Electronic, etc.)
- [ ] **Map Category Attributes**: For each category, define Top 15 filter attributes
- [ ] **Gather Sample Data**: Collect 20-50 real part records for testing
- [ ] **Salesforce Custom Fields**: Create all required fields in Salesforce
- [ ] **API Keys**: Obtain OpenAI, xAI API keys
- [ ] **Server Access**: Provision production server (Ubuntu, 8GB RAM, 50GB disk)

### 17.2 Repository Setup

- [ ] Create new repository: `Parts-Verification-API`
- [ ] Create folder structure per blueprint guidance
- [ ] Update `package.json` name and description
- [ ] Update `README.md` with parts-specific info
- [ ] Create `.env.example` template
- [ ] Set up GitHub Actions for CI/CD

### 17.3 Configuration Updates

**Product → Parts Terminology**:
- [ ] Rename references: "product" → "part"
- [ ] Update logging messages
- [ ] Update API documentation
- [ ] Update Postman collections

**Category Schemas**:
- [ ] Create `src/config/schemas/hvac-schemas.ts`
- [ ] Create `src/config/schemas/appliance-parts-schemas.ts`
- [ ] Create `src/config/schemas/electronic-parts-schemas.ts`
- [ ] Map each category to Top 15 attributes
- [ ] Update `category-config.ts` with part categories

**Picklists**:
- [ ] Create initial `brands.json` (part manufacturers)
- [ ] Create initial `categories.json` (part categories)
- [ ] Create initial `styles.json` (part styles)
- [ ] Create initial `attributes.json` (part attributes)
- [ ] Create `category-filter-attributes.json` (Top 15 per category)

### 17.4 Salesforce Setup

**Custom Object/Fields**:
- [ ] Create Parts custom object (or use Product2)
- [ ] Add 20 Primary Attribute fields
- [ ] Add 15 Filter Attribute fields (category-specific)
- [ ] Add Additional Specifications HTML field
- [ ] Add Verification Metadata fields

**Apex Code**:
- [ ] Create `PartVerificationTrigger.trigger`
- [ ] Create `PartVerificationService.cls`
- [ ] Create `VerificationCallbackService.cls` (REST endpoint)
- [ ] Create Named Credential for API authentication
- [ ] Test trigger on sandbox environment

**Picklist Management**:
- [ ] Create Apex scheduled job for picklist sync (optional)
- [ ] Or manual admin page for triggering sync

### 17.5 Local Development Setup

- [ ] Clone repository
- [ ] `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in API keys, MongoDB connection
- [ ] Start MongoDB: `docker-compose up -d`
- [ ] Run `npm run dev`
- [ ] Test health check: `curl http://localhost:3001/health`

### 17.6 Testing Phase

**Unit Tests**:
- [ ] Test consensus algorithm
- [ ] Test picklist matching
- [ ] Test category determination
- [ ] Test field extraction
- [ ] Run: `npm test`

**Integration Tests**:
- [ ] Test dual AI verification with sample part
- [ ] Test research service (web scraping, PDF)
- [ ] Test webhook delivery
- [ ] Test picklist sync endpoint

**End-to-End Tests**:
- [ ] Send test request from Postman (mimics Salesforce)
- [ ] Verify background processing works
- [ ] Verify webhook callback received
- [ ] Verify data quality in response

### 17.7 Production Deployment

**Server Setup**:
- [ ] Provision Ubuntu server (8GB RAM, 50GB disk)
- [ ] Install Node.js 18+
- [ ] Install MongoDB (Docker recommended)
- [ ] Install nginx
- [ ] Configure firewall (ports 80, 443, 22)
- [ ] Set up SSL certificate (Let's Encrypt)

**Application Deployment**:
- [ ] SSH to server
- [ ] Clone repository to `/opt/parts-verification-api`
- [ ] Copy `.env` with production values
- [ ] `npm install --production`
- [ ] `npm run build`
- [ ] Create systemd service
- [ ] Start service: `systemctl start parts-verification`
- [ ] Enable on boot: `systemctl enable parts-verification`

**nginx Configuration**:
- [ ] Create nginx config for reverse proxy
- [ ] Enable site: `ln -s /etc/nginx/sites-available/parts-verification /etc/nginx/sites-enabled/`
- [ ] Test config: `nginx -t`
- [ ] Reload nginx: `systemctl reload nginx`

**Cron Jobs**:
- [ ] Set up picklist auto-commit: `*/5 * * * *`
- [ ] Set up self-healing: `*/5 * * * *`
- [ ] Set up log rotation

### 17.8 Salesforce Integration

**Webhooks**:
- [ ] Update Salesforce webhook URL to production
- [ ] Test trigger from Salesforce sandbox
- [ ] Verify webhook delivery to production API
- [ ] Verify acknowledgment callback works
- [ ] Monitor logs for errors

**Picklist Sync**:
- [ ] Test picklist sync from Salesforce
- [ ] Verify files updated in API
- [ ] Verify auto-commit to GitHub works
- [ ] Check picklist sync logs in MongoDB

### 17.9 Monitoring & Maintenance

**Health Checks**:
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure alerts for downtime
- [ ] Set up error alerts (email, Slack)

**Analytics**:
- [ ] Run session analytics script
- [ ] Review verification scores
- [ ] Check AI costs
- [ ] Monitor self-healing activity

**Backups**:
- [ ] Set up MongoDB backups (daily)
- [ ] Set up code backups (GitHub already)
- [ ] Test restore procedure

### 17.10 Go-Live Checklist

**Final Verification**:
- [ ] All tests passing
- [ ] Production health check: ✅
- [ ] Salesforce webhook working
- [ ] Picklist sync working
- [ ] Self-healing enabled
- [ ] Analytics dashboard functional
- [ ] Error monitoring active

**Documentation**:
- [ ] API documentation complete
- [ ] Salesforce integration guide written
- [ ] Admin runbook created
- [ ] Troubleshooting guide available

**Handoff**:
- [ ] Train team on system
- [ ] Provide access credentials
- [ ] Share monitoring dashboards
- [ ] Establish support process

---

## 18. QUICK START COMMANDS

### Development
```bash
# Clone and setup
git clone https://github.com/yourcompany/Parts-Verification-API.git
cd Parts-Verification-API
npm install
cp .env.example .env
# Edit .env with your API keys

# Start MongoDB
docker-compose up -d mongodb

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Production
```bash
# On production server
cd /opt/parts-verification-api
git pull origin main
npm install --production
npm run build
systemctl restart parts-verification

# Check status
systemctl status parts-verification
curl https://verify-parts.yourcompany.com/health

# View logs
tail -f logs/combined.log
journalctl -u parts-verification -f

# Check queue
curl https://verify-parts.yourcompany.com/api/verify/salesforce/queue/stats

# View analytics
node scripts/show-session-analytics.js
```

### Troubleshooting
```bash
# Check recent jobs
node scripts/fetch-recent-jobs.js 20

# Retry failed webhook
node scripts/retry-webhook.js <jobId>

# Check picklist sync
node scripts/check-picklist-sync-status.js

# Sync picklists from production to local
node scripts/sync-picklists-from-production.js

# View self-healing logs
mongo parts-verification --eval "db.self_healing_logs.find().sort({timestamp:-1}).limit(10).pretty()"
```

---

## 19. KEY DIFFERENCES: CATALOG vs PARTS

### What Stays the Same
✅ **Dual AI validation logic** - identical  
✅ **Consensus algorithm** - identical  
✅ **Research capabilities** - identical  
✅ **Self-healing system** - identical  
✅ **Async processing** - identical  
✅ **Webhook architecture** - identical  
✅ **Picklist sync mechanism** - identical  
✅ **Analytics & monitoring** - identical  

### What Changes
🔄 **Category schemas** - Define part categories (HVAC Filters, Appliance Knobs, etc.)  
🔄 **Top 15 attributes** - Different per part category  
🔄 **Picklist content** - Part brands, part categories, part styles  
🔄 **Sample data** - Use part data instead of appliance data  
🔄 **Terminology** - "product" → "part" in UI/logs  
🔄 **Documentation** - Update to reference parts  

---

## 20. SUCCESS METRICS

### System Performance
- **Processing Time**: 20-75 seconds per part
- **Success Rate**: >90% verified successfully
- **Consensus Rate**: >85% AI agreement on first attempt
- **Webhook Delivery**: >95% success rate
- **Self-Healing Success**: >70% fixed automatically

### Data Quality
- **Verification Score**: Average >85/100
- **Field Population**: >95% of primary fields filled
- **Picklist Matching**: >90% exact match rate
- **Category Accuracy**: >95% correct category determination

### Cost Efficiency
- **AI Cost per Part**: <$0.50 (OpenAI + xAI combined)
- **Processing Throughput**: 50-100 parts/hour on 8GB server
- **Self-Healing Savings**: 70% fewer manual corrections

---

## CONCLUSION

This blueprint provides everything needed to build a production-ready Parts Verification API. The architecture is **domain-focused** - specifically designed for parts verification with compatibility matching, cross-reference lookups, and OEM/aftermarket distinction.

**Key Principle**: Change the data (categories, attributes, picklists), not the code.

**Next Steps**:
1. Follow the Migration Checklist (Section 17)
2. Set up local development environment
3. Define your part categories and Top 15 attributes
4. Test with sample part data
5. Deploy to production
6. Integrate with Salesforce
7. Monitor and iterate

For questions or issues, refer to:
- Full system documentation in `docs/` folder
- Architecture diagrams in `docs/architecture/`
- API reference in `docs/api/`
- Example integrations in `examples/`

**This is a production-ready, battle-tested system. Trust the architecture.**
