# ✅ ACTIVE FILES - Quick Reference

**Generated:** January 29, 2026  
**Purpose:** Identify which files are actively used in production Salesforce verification

---

## 🎯 PRODUCTION VERIFICATION PATH

When Salesforce calls `/api/verify/salesforce`:

```
1. Entry → src/index.ts → src/app.ts
2. Route → src/routes/salesforce-async-verification.routes.ts
3. Controller → src/controllers/salesforce-async-verification.controller.ts
4. Queue → MongoDB (VerificationJob model)
5. Processor → src/services/async-verification-processor.service.ts
6. Verification → src/services/dual-ai-verification.service.ts ⭐ MAIN LOGIC
7. Webhook → src/services/webhook.service.ts
```

---

## ✅ CORE SERVICES (Always Active)

| File | Purpose | Status |
|------|---------|--------|
| `dual-ai-verification.service.ts` | Main verification orchestrator (5726 lines) | ✅ CRITICAL |
| `async-verification-processor.service.ts` | Background queue processor | ✅ CRITICAL |
| `picklist-matcher.service.ts` | Matches to SF picklists | ✅ CRITICAL |
| `smart-field-inference.service.ts` | Infers missing fields | ✅ ACTIVE |
| `research.service.ts` | Web research, PDFs, images | ✅ ACTIVE |
| `webhook.service.ts` | Webhook delivery to SF | ✅ CRITICAL |

---

## 📁 CONFIG FILES (Always Loaded)

### Category Schemas
| File | Purpose | Status |
|------|---------|--------|
| `category-config.ts` | Main schema registry | ✅ CRITICAL |
| `schemas/lighting-schemas.ts` | Lighting categories | ✅ ACTIVE |
| `schemas/plumbing-schemas.ts` | Plumbing categories | ✅ ACTIVE |
| `schemas/home-decor-hvac-schemas.ts` | Home/HVAC | ✅ ACTIVE |
| `schemas/additional-appliance-schemas.ts` | Appliances | ✅ ACTIVE |
| `schemas/complete-category-schemas.ts` | All schemas | ✅ ACTIVE |

### Salesforce Picklist Data
| File | Purpose | Loaded By | Status |
|------|---------|-----------|--------|
| `salesforce-picklists/brands.json` | All SF brands | picklist-matcher | ✅ CRITICAL |
| `salesforce-picklists/categories.json` | All SF categories | picklist-matcher | ✅ CRITICAL |
| `salesforce-picklists/styles.json` | All SF styles | picklist-matcher | ✅ CRITICAL |
| `salesforce-picklists/attributes.json` | All SF attributes | picklist-matcher | ✅ CRITICAL |
| `salesforce-picklists/category-filter-attributes.json` | Top 15 per category | lookups.ts | ✅ CRITICAL |

### Supporting Config
| File | Purpose | Status |
|------|---------|--------|
| `category-aliases.ts` | Category normalization | ✅ ACTIVE |
| `category-style-mapping.ts` | Style validation | ✅ ACTIVE |
| `family-category-mapping.ts` | Family→category map | ✅ ACTIVE |
| `constants.ts` | Field keys, defaults | ✅ ACTIVE |
| `lookups.ts` | Unified lookup functions | ✅ ACTIVE |
| `index.ts` | Main config loader | ✅ CRITICAL |

---

## ⚠️ LEGACY FILES (Not Used in Production)

| File | Status | Recommendation |
|------|--------|----------------|
| `response-builder.service.ts` | ❌ Not called | Safe to remove |
| `salesforce-verification.service.ts` | ⚠️ Exported, not used | Remove if /verify-legacy deprecated |
| `consensus.service.ts` | ⚠️ Exported, not used | Logic moved to dual-ai-verification |
| `verification.controller.ts` | ⚠️ Used by /verify-legacy only | Remove if legacy endpoint not needed |
| `verification.routes.ts` | ⚠️ Mapped to /verify-legacy | Remove if not needed |
| `complete-category-data.json` | ❌ No references | **Safe to delete** |

---

## ❌ ROOT JSON FILES (Not Loaded)

These are **analysis output only**, not used in runtime:

- ❌ `recommended-missing-top15-attributes.json`
- ❌ `picklist-audit-results.json`
- ❌ `missing-styles-for-sf.json`
- ❌ `missing-styles-for-sf-CORRECTED.json`

**Safe to delete** - they are documentation/analysis artifacts.

---

## 🔒 FILES TO NEVER MODIFY

**DO NOT touch these without careful review:**

### Services
```
✅ dual-ai-verification.service.ts
✅ async-verification-processor.service.ts
✅ picklist-matcher.service.ts
✅ smart-field-inference.service.ts
✅ research.service.ts
✅ webhook.service.ts
```

### Config
```
✅ category-config.ts
✅ schemas/*.ts (all schema files)
✅ category-aliases.ts
✅ category-style-mapping.ts
✅ constants.ts
✅ lookups.ts
```

### Salesforce Picklists
```
✅ salesforce-picklists/brands.json
✅ salesforce-picklists/categories.json
✅ salesforce-picklists/styles.json
✅ salesforce-picklists/attributes.json
✅ salesforce-picklists/category-filter-attributes.json
```

---

## 🧹 CLEANUP CHECKLIST

### Phase 1: Safe to Delete (No Impact)
- [ ] Delete `src/config/complete-category-data.json`
- [ ] Delete `recommended-missing-top15-attributes.json`
- [ ] Delete `picklist-audit-results.json`
- [ ] Delete `missing-styles-for-sf.json`
- [ ] Delete `missing-styles-for-sf-CORRECTED.json`

### Phase 2: Verify /api/verify-legacy Usage
- [ ] Check if `/api/verify-legacy` endpoint is used by any clients
- [ ] If NO: Remove `src/routes/verification.routes.ts`
- [ ] If NO: Remove `src/controllers/verification.controller.ts`
- [ ] If NO: Remove `src/services/response-builder.service.ts`
- [ ] If NO: Remove `src/services/salesforce-verification.service.ts`
- [ ] If NO: Remove `src/services/consensus.service.ts`
- [ ] If NO: Update `src/routes/index.ts` to remove legacy route

### Phase 3: Document Dependencies (Keep)
- [ ] Add comment to `master-category-schema-map.ts`: "Used by /api/enrich only"
- [ ] Add comment to `category-attributes.ts`: "Referenced by master-category-schema-map.ts"
- [ ] Add comment to `category-schema.ts`: "Referenced by master-category-schema-map.ts"

---

## 📊 DEPENDENCY GRAPH

```
dual-ai-verification.service.ts (MAIN)
├── picklist-matcher.service.ts
│   └── salesforce-picklists/*.json (ALL 5 FILES)
│
├── category-config.ts
│   └── schemas/*.ts (ALL SCHEMA FILES)
│
├── lookups.ts
│   ├── category-filter-attributes.json
│   └── master-category-schema-map.ts (fallback)
│
├── smart-field-inference.service.ts
│   └── FIELD_ALIASES
│
├── research.service.ts
│   ├── Web scraping
│   ├── PDF extraction
│   └── Image analysis
│
├── category-aliases.ts
├── category-style-mapping.ts
├── seo-title-generator.service.ts
├── html-generator.ts
├── text-cleaner.ts
└── json-parser.ts
```

---

## 🚀 PRODUCTION FLOW SUMMARY

**1 Request** → **2 Queue** → **3 Process** → **4 Verify** → **5 Webhook**

```
Request
  ↓
salesforce-async-verification.controller.ts
  ↓
MongoDB (VerificationJob)
  ↓
async-verification-processor.service.ts
  ↓
dual-ai-verification.service.ts
  ├─ OpenAI + xAI (parallel)
  ├─ Consensus resolution
  ├─ Research (if needed)
  ├─ Picklist matching
  ├─ Field inference
  └─ Response building
  ↓
webhook.service.ts → Salesforce
```

---

**Last Updated:** January 29, 2026  
**Verified:** Production flow audited, legacy files identified
