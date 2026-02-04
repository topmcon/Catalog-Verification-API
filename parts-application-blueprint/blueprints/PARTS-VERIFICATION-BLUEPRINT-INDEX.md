# PARTS VERIFICATION API - IMPLEMENTATION BLUEPRINT INDEX

**Complete Guide for Building a Parts Verification API**

---

## 📚 DOCUMENTATION STRUCTURE

This comprehensive blueprint is split into 3 parts to avoid timeout issues:

### **PART 1** - Foundation & Core Systems
📄 **File**: `PARTS-VERIFICATION-IMPLEMENTATION-BLUEPRINT.md`

**Contents**:
1. System Overview
2. Technology Stack
3. Architecture & Data Flow
4. Database Models & Collections
5. AI System Architecture
6. Core Services & Business Logic
7. API Endpoints & Routes
8. Salesforce Integration
9. Picklist System & Sync
10. Self-Healing System

### **PART 2** - External Services & Infrastructure
📄 **File**: `PARTS-VERIFICATION-IMPLEMENTATION-BLUEPRINT-PART2.md`

**Contents**:
11. Research & External Data
12. Analytics & Monitoring
13. Deployment & Infrastructure

### **PART 3** - Configuration & Migration
📄 **File**: `PARTS-VERIFICATION-IMPLEMENTATION-BLUEPRINT-PART3.md`

**Contents**:
14. Environment Configuration
15. Scripts & Utilities
16. Testing Strategy
17. Migration Checklist
18. Quick Start Commands
19. Key Differences: Catalog vs Parts
20. Success Metrics

---

## 🎯 HOW TO USE THIS BLUEPRINT

### For New Implementation (Parts Verification)

1. **Read Part 1** - Understand the complete architecture
2. **Study Part 2** - Learn about external integrations
3. **Follow Part 3** - Execute the migration checklist step-by-step

### For Copilot AI Assistant

Give Copilot this prompt:

```
I want to create a new Parts Verification API for validating replacement parts data.

Please read these three documents in order:
1. PARTS-VERIFICATION-IMPLEMENTATION-BLUEPRINT.md (Part 1)
2. PARTS-VERIFICATION-IMPLEMENTATION-BLUEPRINT-PART2.md (Part 2)
3. PARTS-VERIFICATION-IMPLEMENTATION-BLUEPRINT-PART3.md (Part 3)

After reading, help me:
- Set up the repository structure
- Configure the environment
- Define part categories and attributes
- Implement the dual AI verification
- Deploy to production

Key implementation requirements:
- Use "part" terminology throughout (not "product")
- Define part-specific categories (Compressors, Motors, Filters, Belts, etc.)
- Create part-specific Top 15 filter attributes per category
- Configure picklists with part brands, categories, styles, and compatibility attributes

The architecture includes: AI logic, consensus validation, self-healing, 
research capabilities, and webhook integrations.
```

---

## 📖 QUICK REFERENCE

### Key Concepts

| Concept | Description | Where to Find |
|---------|-------------|---------------|
| **Dual AI Validation** | OpenAI + xAI independently verify, then build consensus | Part 1, Section 5 |
| **Consensus Building** | How AIs cross-validate and resolve disagreements | Part 1, Section 5.3 |
| **Async Processing** | Webhook-based architecture to avoid SF timeouts | Part 1, Section 3 & 6.3 |
| **Self-Healing** | Autonomous error detection and fixing | Part 1, Section 10 |
| **Research System** | Fetch web pages, PDFs, images to fill missing data | Part 2, Section 11 |
| **Picklist Sync** | Salesforce pushes picklist updates, auto-commit to Git | Part 1, Section 9 |
| **Analytics** | Track performance, AI costs, field population | Part 2, Section 12 |

### Critical Files

| File | Purpose | Reference |
|------|---------|-----------|
| `src/services/dual-ai-verification.service.ts` | Main orchestrator | Part 1, Section 6.2 |
| `src/services/async-verification-processor.service.ts` | Background worker | Part 1, Section 6.3 |
| `src/services/self-healing/orchestrator.service.ts` | Self-healing coordinator | Part 1, Section 10.4 |
| `src/models/verification-job.model.ts` | MongoDB job tracking | Part 1, Section 4.1 |
| `.env` | Environment configuration | Part 3, Section 14.1 |
| `deploy.sh` | Production deployment | Part 2, Section 13.5 |

### Essential Commands

```bash
# Development
npm run dev                          # Start dev server
npm test                             # Run tests
npm run build                        # Compile TypeScript

# Production
systemctl status parts-verification  # Check service
tail -f logs/combined.log           # View logs
node scripts/show-session-analytics.js  # View analytics

# Troubleshooting
node scripts/fetch-recent-jobs.js 20    # Recent jobs
node scripts/retry-webhook.js <jobId>   # Retry webhook
node scripts/check-picklist-sync-status.js  # Picklist status
```

---

## 🚀 QUICK START (1-2-3)

### 1️⃣ Clone & Configure
```bash
git clone https://github.com/yourcompany/Parts-Verification-API.git
cd Parts-Verification-API
npm install
cp .env.example .env
# Edit .env with API keys
```

### 2️⃣ Local Development
```bash
docker-compose up -d mongodb
npm run dev
curl http://localhost:3001/health
```

### 3️⃣ Production Deploy
```bash
# On server
cd /opt/parts-verification-api
./deploy.sh
systemctl status parts-verification
```

---

## 📊 SYSTEM AT A GLANCE

### Input (from Salesforce)
```json
{
  "SF_Catalog_Id": "a03...",
  "SF_Catalog_Name": "FILTER-12345",
  "Brand_Web_Retailer": "Honeywell",
  "Product_Title_Web_Retailer": "20x25x4 MERV 11 Filter",
  "Web_Retailer_Specs": [...]
}
```

### Processing
1. ✅ Queue job (202 Accepted)
2. 🤖 OpenAI validates independently
3. 🤖 xAI validates independently
4. 🔄 Build consensus (retry if <85% agreement)
5. 🔍 Research missing data (web/PDF/images)
6. ✨ Clean & match to picklists
7. 📝 Generate customer content
8. ↩️ Send webhook to Salesforce

### Output (to Salesforce)
```json
{
  "primary_display_attributes": { ...20 fields... },
  "top_15_filter_attributes": { ...15 category-specific... },
  "additional_attributes_html": "<table>...</table>",
  "verification_metadata": {
    "verification_score": 92,
    "data_sources_used": ["Web_Retailer", "Ferguson", "AI_OpenAI", "AI_xAI"]
  }
}
```

---

## 🎓 LEARNING PATH

### Phase 1: Understanding (1-2 hours)
- [ ] Read Part 1, Sections 1-3 (Overview, Stack, Architecture)
- [ ] Review Part 1, Section 5 (AI System)
- [ ] Skim Part 1, Section 6 (Core Services)

### Phase 2: Setup (2-4 hours)
- [ ] Follow Part 3, Section 17 (Migration Checklist)
- [ ] Set up local development
- [ ] Define your part categories
- [ ] Create category schemas

### Phase 3: Testing (2-3 hours)
- [ ] Test with sample part data
- [ ] Review Part 3, Section 16 (Testing Strategy)
- [ ] Verify dual AI validation works
- [ ] Test webhook delivery

### Phase 4: Deployment (2-4 hours)
- [ ] Follow Part 2, Section 13 (Deployment)
- [ ] Set up production server
- [ ] Deploy application
- [ ] Configure Salesforce integration
- [ ] Monitor first production verifications

**Total Time**: 8-15 hours from zero to production

---

## 🔑 KEY PRINCIPLES

### 1. Product-Agnostic Architecture
**The same code works for appliances, fixtures, lighting, AND parts.**  
Only the configuration changes (categories, attributes, picklists).

### 2. Trust the Dual AI
**Two independent AIs reduce hallucination.**  
If both agree (>85%), data is reliable. Disagreements trigger research or retry.

### 3. Async Everything
**Never block Salesforce's 120-second timeout.**  
Queue job, return 202 Accepted, process in background, send webhook when done.

### 4. Self-Healing by Design
**System fixes itself using AI diagnosis.**  
Detects errors → Dual AI diagnoses → Applies fix → Tests → Sends correction to Salesforce.

### 5. Research When Needed
**Don't guess - go get the data.**  
Scrape manufacturer sites, parse PDFs, analyze images to fill missing fields.

### 6. Version Control Everything
**Picklist changes auto-commit to GitHub.**  
Salesforce syncs picklists → Files update → Cron commits → Full audit trail.

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| Job stuck in "processing" | Check logs, restart service | Part 3, Section 18 |
| Webhook delivery failing | Verify Salesforce endpoint, check firewall | Part 1, Section 8 |
| Low verification scores | Review AI prompts, check source data quality | Part 1, Section 5 |
| Picklist mismatch | Check fuzzy matching threshold, review aliases | Part 1, Section 6.4 |
| MongoDB connection error | Check connection string, verify Docker running | Part 3, Section 14.1 |
| Self-healing not working | Check cron job, verify 60-second delay | Part 1, Section 10.5 |

### Debug Commands

```bash
# Check service status
systemctl status parts-verification

# View real-time logs
tail -f /opt/parts-verification-api/logs/combined.log

# Check MongoDB connection
mongo parts-verification --eval "db.serverStatus()"

# Check queue backlog
curl https://verify-parts.yourcompany.com/api/verify/salesforce/queue/stats

# View recent errors
grep "ERROR" logs/combined.log | tail -20

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 🎉 SUCCESS CRITERIA

### System is Production-Ready When:
- [x] Health check returns 200
- [x] Test job completes end-to-end (<120s)
- [x] Webhook delivers successfully to Salesforce
- [x] Picklist sync from Salesforce works
- [x] Analytics dashboard shows data
- [x] Self-healing detects and fixes an issue
- [x] All tests passing
- [x] Documentation complete

### Data Quality Metrics:
- **Verification Score**: >85 average
- **Field Population**: >95% of primary fields
- **Consensus Rate**: >90% on first attempt
- **Category Accuracy**: >95%

### Performance Metrics:
- **Processing Time**: <75 seconds
- **Throughput**: >50 parts/hour
- **Uptime**: >99.5%
- **Webhook Success**: >95%

---

## 📝 CHANGELOG

**Version 1.0** (February 4, 2026)
- Initial comprehensive blueprint
- Complete implementation guide for parts verification
- 3-part structure for clarity
- Full migration checklist
- Production-ready configurations

---

## 📄 LICENSE

**Internal Use Only**  
This blueprint is proprietary and confidential.

---

## ✍️ AUTHORS

Created as a comprehensive parts industry reference  
Documentation created: February 4, 2026  
Last updated: February 4, 2026

---

## 🙏 ACKNOWLEDGMENTS

This system builds on:
- OpenAI GPT-4o for primary validation
- xAI Grok-2 for secondary validation
- MongoDB for flexible data storage
- Express.js for robust API framework
- TypeScript for type safety
- GitHub Copilot for development assistance

**The architecture is proven, battle-tested, and ready to implement.**

---

**Ready to build? Start with Part 1 → Part 2 → Part 3 → Migration Checklist!** 🚀
