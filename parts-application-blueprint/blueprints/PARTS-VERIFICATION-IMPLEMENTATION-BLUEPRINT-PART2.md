# PARTS VERIFICATION API - IMPLEMENTATION BLUEPRINT (PART 2)

**Continuation of**: PARTS-VERIFICATION-IMPLEMENTATION-BLUEPRINT.md (Part 1)  
**Sections**: Research, Analytics, Deployment, Configuration, Scripts, Testing, Migration

---

## 11. RESEARCH & EXTERNAL DATA

### 11.1 Research Capabilities

The system can autonomously fetch and analyze external data to fill missing fields:

**Supported Data Sources**:
1. **Web Pages** (manufacturer sites, retailer pages)
2. **PDF Documents** (spec sheets, installation manuals)
3. **Images** (product photos for visual analysis)

### 11.2 Web Page Scraping

**File**: `src/services/research.service.ts`

```typescript
interface WebPageContent {
  url: string;
  title: string;
  description: string;
  specifications: Record<string, string>;
  features: string[];
  rawText: string;
  success: boolean;
  error?: string;
}

async function fetchWebPage(url: string): Promise<WebPageContent> {
  
  // 1. Detect if JavaScript rendering required
  const requiresJS = isJavaScriptRequired(url);
  
  if (requiresJS && puppeteer) {
    // Use headless browser for JS-rendered sites
    return await fetchWithPuppeteer(url);
  } else {
    // Use Axios + Cheerio for static sites
    return await fetchWithAxios(url);
  }
}

// Puppeteer-based scraping
async function fetchWithPuppeteer(url: string): Promise<WebPageContent> {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    
    // Wait for specs table to load
    await page.waitForSelector('table, .specs, .specifications', { timeout: 5000 }).catch(() => {});
    
    const content = await page.content();
    return parseHTML(content, url);
    
  } finally {
    await browser.close();
  }
}

// Axios-based scraping
async function fetchWithAxios(url: string): Promise<WebPageContent> {
  const response = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: REQUEST_TIMEOUT
  });
  
  return parseHTML(response.data, url);
}

// Parse HTML content
function parseHTML(html: string, url: string): WebPageContent {
  const $ = cheerio.load(html);
  
  // Extract title
  const title = $('h1').first().text().trim() || $('title').text().trim();
  
  // Extract description
  const description = $('meta[name="description"]').attr('content') || 
                     $('.description').first().text().trim();
  
  // Extract specifications from tables
  const specifications: Record<string, string> = {};
  $('table').each((i, table) => {
    $(table).find('tr').each((j, row) => {
      const cells = $(row).find('td, th');
      if (cells.length >= 2) {
        const key = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();
        if (key && value) {
          specifications[key] = value;
        }
      }
    });
  });
  
  // Extract features from lists
  const features: string[] = [];
  $('ul li, ol li').each((i, li) => {
    const text = $(li).text().trim();
    if (text && text.length < 200) {
      features.push(text);
    }
  });
  
  // Get all text content
  const rawText = $('body').text().replace(/\s+/g, ' ').trim();
  
  return {
    url,
    title,
    description,
    specifications,
    features,
    rawText,
    success: true
  };
}
```

### 11.3 PDF Document Parsing

```typescript
interface PDFContent {
  url: string;
  filename: string;
  text: string;
  pageCount: number;
  specifications: Record<string, string>;
  success: boolean;
  error?: string;
}

async function parsePDF(url: string): Promise<PDFContent> {
  // Download PDF
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: REQUEST_TIMEOUT
  });
  
  const buffer = Buffer.from(response.data);
  
  // Extract text using pdf-parse
  const pdfData = await pdfParse(buffer);
  
  // Parse specifications (look for key-value patterns)
  const specifications = extractSpecsFromText(pdfData.text);
  
  return {
    url,
    filename: url.split('/').pop() || 'document.pdf',
    text: pdfData.text,
    pageCount: pdfData.numpages,
    specifications,
    success: true
  };
}

function extractSpecsFromText(text: string): Record<string, string> {
  const specs: Record<string, string> = {};
  
  // Match patterns like "Filter Size: 20x25x4" or "MERV Rating: 11"
  const patterns = [
    /([A-Z][A-Za-z\s]+):\s*([^\n]+)/g,
    /([A-Z][A-Za-z\s]+)\s+-\s+([^\n]+)/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key.length < 50 && value.length < 200) {
        specs[key] = value;
      }
    }
  }
  
  return specs;
}
```

### 11.4 Image Analysis (Vision AI)

```typescript
interface ImageAnalysis {
  url: string;
  description: string;
  detectedColor: string | null;
  detectedFinish: string | null;
  detectedFeatures: string[];
  partType: string | null;
  confidence: number;
  success: boolean;
  error?: string;
}

async function analyzeImage(url: string): Promise<ImageAnalysis> {
  const openai = new OpenAI({ apiKey: config.openai.apiKey });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',  // Vision-capable model
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this product image and extract:
1. Color (if visible)
2. Finish/material (matte, glossy, brushed, etc.)
3. Key features you can see
4. What type of part/product is this?

Return JSON: { "color": "...", "finish": "...", "features": [...], "partType": "...", "confidence": 0-100 }`
          },
          {
            type: 'image_url',
            image_url: { url }
          }
        ]
      }
    ],
    max_tokens: 500
  });
  
  const analysis = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    url,
    description: response.choices[0].message.content || '',
    detectedColor: analysis.color || null,
    detectedFinish: analysis.finish || null,
    detectedFeatures: analysis.features || [],
    partType: analysis.partType || null,
    confidence: analysis.confidence || 0,
    success: true
  };
}
```

### 11.5 Research Orchestration

```typescript
interface ResearchResult {
  webPages: WebPageContent[];
  documents: PDFContent[];
  images: ImageAnalysis[];
  combinedSpecifications: Record<string, string>;
  combinedFeatures: string[];
  researchSummary: string;
}

async function performResearch(
  urls: string[],
  pdfs: string[],
  images: string[]
): Promise<ResearchResult> {
  
  logger.info('Starting research', {
    urls: urls.length,
    pdfs: pdfs.length,
    images: images.length
  });
  
  // Execute all research tasks in parallel
  const [webPageResults, pdfResults, imageResults] = await Promise.all([
    Promise.all(urls.map(url => fetchWebPage(url).catch(err => ({ url, success: false, error: err.message })))),
    Promise.all(pdfs.map(url => parsePDF(url).catch(err => ({ url, success: false, error: err.message })))),
    Promise.all(images.map(url => analyzeImage(url).catch(err => ({ url, success: false, error: err.message }))))
  ]);
  
  // Combine specifications from all sources
  const combinedSpecifications: Record<string, string> = {};
  const combinedFeatures: string[] = [];
  
  for (const page of webPageResults) {
    if (page.success) {
      Object.assign(combinedSpecifications, page.specifications);
      combinedFeatures.push(...page.features);
    }
  }
  
  for (const pdf of pdfResults) {
    if (pdf.success) {
      Object.assign(combinedSpecifications, pdf.specifications);
    }
  }
  
  return {
    webPages: webPageResults,
    documents: pdfResults,
    images: imageResults,
    combinedSpecifications,
    combinedFeatures: [...new Set(combinedFeatures)],
    researchSummary: generateResearchSummary(webPageResults, pdfResults, imageResults)
  };
}
```

---

## 12. ANALYTICS & MONITORING

### 12.1 Analytics Collections

**Key Metrics Tracked**:
1. **Verification Performance**: Processing time, success rate, scores
2. **AI Usage**: Tokens, costs, latency per provider
3. **Field Population**: Which fields are most/least filled
4. **Picklist Matching**: Match success rate per type
5. **Self-Healing**: Issue types, fix success rate
6. **Webhook Delivery**: Success rate, retry frequency

### 12.2 Session Analytics Dashboard

**Script**: `scripts/show-session-analytics.js`

```javascript
const { VerificationJob, AIUsage, SelfHealingLog, Session } = require('../dist/models');

async function showSessionAnalytics() {
  // Get current session (since last "Establish Connection")
  const currentSession = await Session.findOne().sort({ startTime: -1 });
  const sessionStart = currentSession ? currentSession.startTime : new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  console.log(`\n=== SESSION ANALYTICS ===`);
  console.log(`Period: ${sessionStart.toISOString()} to now`);
  console.log(`Duration: ${((Date.now() - sessionStart.getTime()) / 1000 / 60).toFixed(1)} minutes\n`);
  
  // 1. VERIFICATION JOB STATISTICS
  const jobs = await VerificationJob.find({ createdAt: { $gte: sessionStart } });
  const jobStats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    avgProcessingTime: jobs.filter(j => j.processingTimeMs).reduce((sum, j) => sum + j.processingTimeMs, 0) / jobs.filter(j => j.processingTimeMs).length,
    minProcessingTime: Math.min(...jobs.filter(j => j.processingTimeMs).map(j => j.processingTimeMs)),
    maxProcessingTime: Math.max(...jobs.filter(j => j.processingTimeMs).map(j => j.processingTimeMs))
  };
  
  console.log('VERIFICATION JOBS:');
  console.log(`  Total API Calls: ${jobStats.total}`);
  console.log(`  Pending: ${jobStats.pending}`);
  console.log(`  Processing: ${jobStats.processing}`);
  console.log(`  Completed: ${jobStats.completed}`);
  console.log(`  Failed: ${jobStats.failed}`);
  console.log(`  Avg Processing Time: ${(jobStats.avgProcessingTime / 1000).toFixed(1)}s`);
  console.log(`  Min/Max: ${(jobStats.minProcessingTime / 1000).toFixed(1)}s / ${(jobStats.maxProcessingTime / 1000).toFixed(1)}s\n`);
  
  // 2. WEBHOOK DELIVERY METRICS
  const webhookStats = {
    totalAttempts: jobs.reduce((sum, j) => sum + j.webhookAttempts, 0),
    successful: jobs.filter(j => j.webhookSuccess).length,
    failed: jobs.filter(j => j.webhookSuccess === false).length,
    successRate: (jobs.filter(j => j.webhookSuccess).length / jobs.length) * 100,
    sfAcknowledged: jobs.filter(j => j.sfAcknowledgment?.received).length,
    sfProcessingConfirmed: jobs.filter(j => j.sfAcknowledgment?.processingConfirmed).length
  };
  
  console.log('WEBHOOK DELIVERY:');
  console.log(`  Webhooks Sent: ${jobs.length}`);
  console.log(`  Successful: ${webhookStats.successful} (${webhookStats.successRate.toFixed(1)}%)`);
  console.log(`  Failed: ${webhookStats.failed}`);
  console.log(`  Total Attempts: ${webhookStats.totalAttempts}`);
  console.log(`  SF Acknowledged: ${webhookStats.sfAcknowledged}`);
  console.log(`  SF Processing Confirmed: ${webhookStats.sfProcessingConfirmed}\n`);
  
  // 3. SELF-HEALING ACTIVITY
  const healingLogs = await SelfHealingLog.find({ timestamp: { $gte: sessionStart } });
  const healingStats = {
    total: healingLogs.length,
    success: healingLogs.filter(h => h.outcome === 'success').length,
    failed: healingLogs.filter(h => h.outcome === 'failed').length,
    escalated: healingLogs.filter(h => h.outcome === 'escalated').length,
    correctionsSent: healingLogs.filter(h => h.correctionSentToSalesforce).length,
    issueTypes: healingLogs.reduce((acc, h) => {
      const type = h.issueDetected.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  };
  
  console.log('SELF-HEALING:');
  console.log(`  Total Attempts: ${healingStats.total}`);
  console.log(`  Successful: ${healingStats.success}`);
  console.log(`  Failed: ${healingStats.failed}`);
  console.log(`  Escalated to Human: ${healingStats.escalated}`);
  console.log(`  Corrections Sent to SF: ${healingStats.correctionsSent}`);
  console.log(`  Issue Types:`, healingStats.issueTypes, '\n');
  
  // 4. AI USAGE & COSTS
  const aiUsage = await AIUsage.find({ timestamp: { $gte: sessionStart } });
  const aiStats = {
    totalCalls: aiUsage.length,
    openai: aiUsage.filter(a => a.provider === 'openai').length,
    xai: aiUsage.filter(a => a.provider === 'xai').length,
    totalTokens: aiUsage.reduce((sum, a) => sum + a.totalTokens, 0),
    totalCost: aiUsage.reduce((sum, a) => sum + a.cost, 0),
    avgLatency: aiUsage.reduce((sum, a) => sum + a.latencyMs, 0) / aiUsage.length
  };
  
  console.log('AI USAGE:');
  console.log(`  Total API Calls: ${aiStats.totalCalls}`);
  console.log(`  OpenAI: ${aiStats.openai}`);
  console.log(`  xAI: ${aiStats.xai}`);
  console.log(`  Total Tokens: ${aiStats.totalTokens.toLocaleString()}`);
  console.log(`  Total Cost: $${aiStats.totalCost.toFixed(4)}`);
  console.log(`  Avg Latency: ${(aiStats.avgLatency / 1000).toFixed(2)}s\n`);
  
  // 5. SYSTEM PERFORMANCE
  const successRate = (jobStats.completed / jobStats.total) * 100;
  const throughput = jobStats.total / ((Date.now() - sessionStart.getTime()) / 1000 / 60 / 60); // jobs per hour
  
  console.log('SYSTEM PERFORMANCE:');
  console.log(`  Overall Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`  Webhook Delivery Rate: ${webhookStats.successRate.toFixed(1)}%`);
  console.log(`  Self-Healing Success: ${healingStats.total > 0 ? ((healingStats.success / healingStats.total) * 100).toFixed(1) : 0}%`);
  console.log(`  Throughput: ${throughput.toFixed(1)} jobs/hour\n`);
  
  // 6. ACTIONABLE RECOMMENDATIONS
  console.log('ACTIONABLE RECOMMENDATIONS:');
  if (jobStats.failed / jobStats.total > 0.1) {
    console.log(`  ⚠️  High failure rate (${(jobStats.failed / jobStats.total * 100).toFixed(1)}%) - investigate error logs`);
  }
  if (webhookStats.successRate < 95) {
    console.log(`  ⚠️  Webhook delivery below 95% - check Salesforce endpoint health`);
  }
  if (jobStats.pending > 10) {
    console.log(`  ⚠️  Queue backlog (${jobStats.pending} pending) - consider scaling workers`);
  }
  if (aiStats.avgLatency > 30000) {
    console.log(`  ⚠️  High AI latency (${(aiStats.avgLatency / 1000).toFixed(1)}s avg) - check provider status`);
  }
  if (healingStats.escalated > 0) {
    console.log(`  ⚠️  ${healingStats.escalated} issues escalated to human - review and address`);
  }
  console.log('\n');
}

showSessionAnalytics().then(() => process.exit(0)).catch(console.error);
```

---

## 13. DEPLOYMENT & INFRASTRUCTURE

### 13.1 Production Server Setup

**Requirements**:
- Ubuntu 20.04+ LTS
- Node.js 18+
- MongoDB 7.0+
- nginx (reverse proxy)
- systemd (process manager)
- Git (for code deployment)

**Server Structure**:
```
/opt/parts-verification-api/          # Application root
├── dist/                              # Compiled JavaScript
├── node_modules/                      # Dependencies
├── src/                               # Source code
├── logs/                              # Application logs
├── scripts/                           # Utility scripts
├── .env                               # Environment config
├── package.json
└── tsconfig.json
```

### 13.2 systemd Service

**File**: `/etc/systemd/system/parts-verification.service`

```ini
[Unit]
Description=Parts Verification API
After=network.target mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/parts-verification-api
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/parts-verification-api/dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/opt/parts-verification-api/logs/combined.log
StandardError=append:/opt/parts-verification-api/logs/error.log

[Install]
WantedBy=multi-user.target
```

**Service Management**:
```bash
# Start service
systemctl start parts-verification

# Enable on boot
systemctl enable parts-verification

# Check status
systemctl status parts-verification

# View logs
journalctl -u parts-verification -f

# Restart service
systemctl restart parts-verification
```

### 13.3 nginx Configuration

**File**: `/etc/nginx/sites-available/parts-verification`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name verify-parts.yourcompany.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name verify-parts.yourcompany.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/verify-parts.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/verify-parts.yourcompany.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Reverse proxy to Node.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for long-running requests
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Access logs
    access_log /var/log/nginx/parts-verification-access.log;
    error_log /var/log/nginx/parts-verification-error.log;
}
```

### 13.4 MongoDB Setup

**Docker Compose** (recommended):
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    command: mongod --auth

volumes:
  mongodb_data:
  mongodb_config:
```

**Start MongoDB**:
```bash
docker-compose up -d mongodb
```

### 13.5 Deployment Script

**File**: `deploy.sh`

```bash
#!/bin/bash
# Deployment script for Parts Verification API

set -e  # Exit on error

echo "=== Parts Verification API Deployment ==="
echo "Started: $(date)"

# Navigate to app directory
cd /opt/parts-verification-api

# Pull latest code
echo "Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build TypeScript
echo "Compiling TypeScript..."
npm run build

# Restart service
echo "Restarting service..."
systemctl restart parts-verification

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet parts-verification; then
  echo "✅ Service is running"
else
  echo "❌ Service failed to start"
  systemctl status parts-verification
  exit 1
fi

# Health check
echo "Performing health check..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://verify-parts.yourcompany.com/health)
if [ "$RESPONSE" = "200" ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed (HTTP $RESPONSE)"
  exit 1
fi

echo "=== Deployment Complete ==="
echo "Finished: $(date)"
```

---

