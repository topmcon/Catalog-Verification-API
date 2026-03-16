<!--
╔══════════════════════════════════════════════════════════════════╗
║  VERSIONED ARCHITECTURE SNAPSHOT — DO NOT EDIT                   ║
║  This is a read-only archive. Edit the working copy instead:    ║
║  docs/VERIFICATION-DATA-SOURCES.md                                             ║
╚══════════════════════════════════════════════════════════════════╝

  Version:       v15
  Snapshot Date: 2026-03-16 09:32:14 EDT
  Commit:        e78781f (e78781f4858883dcf861ac23379e6a675d027f08)

  SYSTEM METRICS AT TIME OF SNAPSHOT:
  ─────────────────────────────────────
  dual-ai-verification.service.ts: 13111 lines
  title-schema-by-category.ts:     7215 lines
  Brands:     385
  Categories: 161
  Styles:     30
  Attributes: 1534
  Claude Model: claude-sonnet-4-6

  CHANGE SUMMARY:
  ─────────────────────────────────────
  Lines added: ~0, Lines removed: ~38 (vs v14)

  COMMITS SINCE LAST VERSION:
  ─────────────────────────────────────
  (first version or previous commit unknown)

  RECENT COMMITS (at snapshot time):
  ─────────────────────────────────────
e78781f Medicine Cabinet: add Installation Type + Lighted detection to title schema
4730d9c Universal: always use schema-generated title, never Claude's title rewrite
fab2b00 Override Claude title for mirror categories (prevents Wall Mirror Bathroom Mirror redundancy)
196aa08 Fix title generation: Bathroom Mirror redundancy, dimension rounding, Width×Height gap
01fc20b Session docs: mirror category & title fixes, Finding #041, architecture v14
-->

# Verification Data Sources - Complete Inventory

> **Last Updated**: 2026-03-04 (EST)  
> **Commit**: 092296d  
> **New**: Canadian data config (exchange-rates.ts), Web_Retailer_Key field for CA detection

## 📊 Complete Data Source Count

**Total Data Sources**: 56+

| Type | Count | Examples |
|------|-------|----------|
| **Dynamic JSON Picklists** | 5 | brands.json, categories.json, styles.json, attributes.json, category-filter-attributes.json |
| **Static JSON Files** | 3 | category-type-style-mapping.json, complete-category-data.json, sf-clean-attributes.json |
| **Mapping/Config TS Files** | 16+ | exchange-rates.ts, category-style-mapping.ts, family-category-mapping.ts, etc. |
| **Schema TS Files** | 10+ | category-attributes.ts, plumbing-schemas.ts, lighting-schemas.ts, etc. |
| **Hardcoded Lists** | 10+ | PREMIUM_BRANDS, CATEGORY_NAME_ALIASES, ATTRIBUTE_ALIASES, BRAND_CORRECTIONS, etc. |
| **Service Logic Files** | 6+ | picklist-matcher.service.ts, category-matcher.service.ts, dual-ai-verification.service.ts, etc. |
| **MongoDB Collections** | 7 | CatalogIndex, PicklistSyncLog, VerificationJob, etc. |
| **Environment Config** | 10+ settings | AI models, research toggles, Salesforce endpoints, rate limits, etc. |

---

## Overview
This document catalogs every picklist, mapping file, hardcoded list, and configuration used in the product verification process.

---

## 📋 DYNAMIC PICKLISTS (Salesforce-Synced)

These files are automatically updated when Salesforce pushes changes via `/api/picklists/sync`

### Location: `src/config/salesforce-picklists/`

| File | Description | Fields | Auto-Sync |
|------|-------------|--------|-----------|
| **brands.json** | All valid brand names and IDs | `brand_id`, `brand_name` | ✅ Yes |
| **categories.json** | All product categories with department/family | `category_id`, `category_name`, `department`, `family` | ✅ Yes |
| **styles.json** | Product style/type variations | `style_id`, `style_name` | ✅ Yes |
| **attributes.json** | Category-specific attribute names | `attribute_id`, `attribute_name` | ✅ Yes |
| **category-filter-attributes.json** | Top 15 filter attributes per category (ranked) | `rank`, `category_name`, `category_id`, `attribute_name`, `attribute_id` | ✅ Yes |

**Sync Mechanism**: 
- Salesforce → POST `/api/picklists/sync` → Updates JSON files → Auto-commit to GitHub every 5 min
- Monitoring: `scripts/check-picklist-sync-status.js`
- Manual pull: `scripts/sync-picklists-from-production.js`

---

## 🗺️ CATEGORY MAPPING FILES (Static/Semi-Static)

### Location: `src/config/`

| File | Purpose | Data Structure | Update Frequency |
|------|---------|----------------|------------------|
| **category-style-mapping.ts** | Maps categories → valid styles/types | `CategoryStyleMapping[]` with `values: StyleValue[]` | Manual - regenerate with script |
| **category-type-style-mapping.json** | Source JSON for style mappings | Nested: department → category → styles | Manual edit |
| **category-consolidation-mapping.ts** | Maps removed/deprecated categories → parent categories | `Record<string, CategoryRemapping>` | Manual - when SF changes |
| **family-category-mapping.ts** | Department → Family → Categories hierarchy | `FamilyCategoryMapping[]` | Manual - when SF hierarchy changes |
| **master-category-schema-map.ts** | Maps category names/aliases → schema configs | `Record<string, CategoryAttributeConfig>` | Manual - when new categories added |

---

## 📊 ATTRIBUTE SCHEMA FILES (Static)

### Location: `src/config/` and `src/config/schemas/`

| File | Contains | Categories Covered |
|------|----------|-------------------|
| **category-attributes.ts** | Main attribute schemas | Refrigerator, Dishwasher, Range, Oven, Cooktop, Microwave, Range Hood, Washer, Dryer, Freezer, Kitchen Sink, Kitchen Faucet, Bathroom Faucet, Toilet, Bathtub, Chandelier, Pendant, Ceiling Fan |
| **schemas/plumbing-schemas.ts** | Plumbing category schemas | Bathroom Sink, Bathroom Vanity, Shower, Tub Faucet, Bar Prep Sink, Bar Faucet, Bathroom Hardware |
| **schemas/lighting-schemas.ts** | Lighting category schemas | Ceiling Light, Wall Sconce, Outdoor Lighting, Recessed Lighting, Track Lighting, Under Cabinet, Flush Mount |
| **schemas/home-decor-hvac-schemas.ts** | Home decor & HVAC schemas | Cabinet Hardware, Mirrors, Air Conditioner, Dehumidifier |
| **schemas/additional-appliance-schemas.ts** | Additional appliance schemas | Wine Cooler, Ice Maker, Beverage Refrigerator, etc. |
| **schemas/complete-category-schemas.ts** | Aggregated/master schemas | All of the above |

**Each schema contains**:
- `top15FilterAttributes`: Array of top filter attributes
- `htmlTableAttributes`: Attributes for table display
- `taxonomyTiers`: Hierarchy levels (tier1, tier2, tier3, tier4)

---

## 🔧 HARDCODED LOGIC LISTS

### 📝 Text Normalization (`src/utils/text-cleaner.ts`)

#### BRAND_CORRECTIONS
**Purpose**: Normalize brand name variations to proper format  
**Type**: `Record<string, string>`  
**Examples**:
- `'cafe'`, `'Cafe'`, `'CAFE'` → `'Café'`
- `'kitchenaid'` → `'KitchenAid'`
- `'subzero'`, `'sub zero'` → `'Sub-Zero'`
- ~70+ brand variations

**Used by**: Title generation, brand display formatting

#### ENCODING_FIXES
**Purpose**: Fix special characters and HTML entities  
**Type**: `Record<string, string>`  
**Examples**:
- `'&amp;'` → `'&'`
- `'(TM)'` → `'™'`
- `'&mdash;'` → `'—'`
- ~20+ encoding fixes

**Used by**: Text cleaning, description formatting

---

### 🔀 Attribute Aliases (`src/services/picklist-matcher.service.ts`)

#### ATTRIBUTE_ALIASES
**Purpose**: Maps AI-generated attribute names to Salesforce picklist names  
**Type**: `Record<string, string>`  
**Count**: ~100+ aliases  
**Examples**:
- `'drain position'` → `'drain placement'`
- `'overall width'` → `'width'`
- `'installation type'` → `'mount type'`
- `'light count'` → `'number of lights'`
- `'max wattage'` → `'maximum wattage'`

**Critical**: Prevents duplicate attribute requests, ensures consistent field naming  
**Used by**: `picklist-matcher.service.ts` - attribute matching

#### KNOWN_ATTRIBUTE_VALUES
**Purpose**: Values that should NOT be treated as attribute names  
**Type**: `Set<string>`  
**Count**: ~30+ values  
**Examples**:
- `'single bowl'`, `'double bowl'` (configuration values)
- `'undermount'`, `'drop-in'` (mount type values)
- `'stainless steel'`, `'brushed nickel'` (finish/material values)
- `'french door'`, `'side-by-side'` (style values)

**Critical**: Prevents AI from requesting "single bowl" as a missing attribute  
**Used by**: `picklist-matcher.service.ts` - attribute validation

---

### 🏷️ Brand Tiers (`src/config/constants.ts`)

```typescript
PREMIUM_BRANDS: string[]     // Sub-Zero, Wolf, Thermador, etc. (30 brands)
MID_TIER_BRANDS: string[]    // KitchenAid, Bosch, Samsung, etc. (19 brands)
VALUE_BRANDS: string[]       // Frigidaire, Amana, Hotpoint, etc. (14 brands)
```

**Purpose**: Classification only, NOT for picklist validation  
**Used by**: Title generation, pricing logic, feature highlighting

---

### 📝 Category Aliases (`src/config/constants.ts`)

```typescript
CATEGORY_NAME_ALIASES: Record<string, string[]>
```

Maps plural/variant forms → canonical singular forms from categories.json

**Examples**:
- `'Refrigerator'` → `['Fridge', 'Refrigerators', 'Frig']`
- `'Range'` → `['Stove', 'Ranges', 'Cooking Range']`
- `'Washer'` → `['Washing Machine', 'Washers']`

**Sync Status**: ⚠️ Should match `categories.json` - verify with API Accuracy Report

---

### 🤖 AI Category Aliases (`src/config/constants.ts`)

```typescript
AI_CATEGORY_ALIASES: Record<string, string>
```

Maps AI-generated category variations → schema lookup IDs

**Examples**:
- `'gas range'` → `'range'`
- `'french door refrigerator'` → `'refrigerator'`
- `'wall oven'` → `'oven'`

---

### 🏢 Department Categories (`src/services/category-matcher.service.ts`)

```typescript
DEPARTMENT_CATEGORIES: Record<string, string[]>
```

Maps departments → category lists

**Departments**:
- `Appliances` (17 categories)
- `Plumbing & Bath` (15 categories)
- `Lighting` (15 categories)
- `Home Decor & Fixtures` (3 categories)
- `HVAC` (4 categories)

**Sync Status**: ⚠️ Auto-generated from `categories.json` - should stay in sync

---

### 🎨 Premium Feature Keywords (`src/config/constants.ts`)

```typescript
PREMIUM_FEATURE_KEYWORDS: string[]  // 30+ keywords
```

**Examples**: Built-In, Panel Ready, Smart Home, WiFi, Stainless Steel, Energy Star, Convection, Induction

**Purpose**: Title/description enhancement, premium product detection

---

### 📏 Primary Attributes (`src/config/constants.ts` and others)

```typescript
PRIMARY_ATTRIBUTES: readonly string[]  // 20 universal attributes
```

**Universal fields for ALL products**:
- Brand (Verified)
- Category / Subcategory (Verified)
- Product Family (Verified)
- Product Style (Verified)
- Dimensions (Depth, Width, Height, Weight)
- MSRP, Market Value
- Product Title, Description, Details, Features
- UPC/GTIN, Model Number, Model Variants

**Critical**: These should NEVER be requested from SF attributes picklist

---

### 🚿 Dynamic Shower/Lighting Logic (Removed Hardcoding)

**Previous hardcoded arrays** (now dynamic):
- ❌ ~~`LIGHTING_CATEGORIES`~~ → Now: `getLightingCategories()` from `category-style-mapping.ts`
- ❌ ~~`SHOWER_PLUMBING_CATEGORIES`~~ → Now: `getShowerCategories()` from `category-style-mapping.ts`
- ❌ ~~`VALID_SHOWER_STYLES`~~ → Now: `getValidStylesForCategory('Shower')` from `category-style-mapping.ts`

**Location**: `src/services/dual-ai-verification.service.ts` (comments remain showing old arrays)

---

## 📖 TITLE & DESCRIPTION SCHEMAS

### Location: `src/config/`

| File | Purpose | Content |
|------|---------|---------|
| **title-schema-by-category.ts** | Product title generation rules per category | Formula: BRAND + SPEC + TYPE + CATEGORY + FINISH - MODEL |
| **category-config.ts** | Category schemas from Salesforce data | Loads from `category-filter-attributes.json` |
| **verified-fields.ts** | Required field validation schemas | Field definitions with type, validation, required flags |

---

## ⚙️ ENVIRONMENT CONFIGURATION (`src/config/index.ts`)

Runtime settings controlled by environment variables:

| Category | Settings | Defaults |
|----------|----------|----------|
| **AI Models** | OpenAI: `gpt-4o-mini`, xAI: `grok-3`, Anthropic: `claude-sonnet-4-20250514` | Configurable via env vars |
| **Research** | Max documents: 2, Max images: 1, Timeout: 10s | Can enable/disable web fetch, PDF, images |
| **Consensus** | Threshold: 0.9, Max retries: 3 | AI agreement threshold |
| **Rate Limiting** | Window: 15 min, Max requests: 500 | Protects API from overload |
| **Salesforce** | Webhook URL, Login credentials | Production SF endpoints |
| **Security** | API key header, Webhook secret | Authentication tokens |

**Note**: These are operational parameters, not verification data sources

---

## 🔍 LOOKUP & UTILITY FILES

### Location: `src/config/`

| File | Purpose |
|------|---------|
| **lookups.ts** | Centralized lookup functions for schemas, attributes, mappings |
| **category-aliases.ts** | Additional category name variations and normalization |
| **types.ts** | TypeScript interfaces for all config structures |
| **index.ts** | Exports all config modules |

---

## 🛠️ VERIFICATION SERVICE FILES

### Location: `src/services/`

| Service | Uses These Data Sources |
|---------|-------------------------|
| **picklist-matcher.service.ts** | `brands.json`, `categories.json`, `styles.json`, `attributes.json` |
| **category-matcher.service.ts** | `DEPARTMENT_CATEGORIES`, `CATEGORY_ALIASES`, `categories.json` |
| **dual-ai-verification.service.ts** | All picklists, `category-style-mapping.ts`, schemas, lookups |
| **consensus.service.ts** | All picklists, field schemas, validation rules |
| **title-generator.service.ts** | `PREMIUM_BRANDS`, title schemas, category configs |
| **enrichment.service.ts** | Category schemas, attribute configs, master schema map |

---

## � MONGODB REFERENCE DATA

Dynamic data stored in database collections (not files):

| Collection | Purpose | Updated By |
|------------|---------|------------|
| **CatalogIndex** | Tracks category→style, brand→category patterns | Verification jobs (auto) |
| **PicklistSyncLog** | Audit trail of Salesforce picklist syncs | Picklist sync endpoint |
| **PendingPicklistSync** | Hold bucket for unapproved SF picklist syncs | Picklist sync endpoint |
| **PendingCreationRequest** | Items we've asked SF to create (brand, category, etc.) | dual-ai-verification.service.ts |
| **PicklistMismatch** | Failed brand/category/style matches for review | Verification service |
| **VerificationJob** | Historical verification requests & responses | Every verification |
| **SelfHealingLog** | Self-healing attempts and outcomes | Self-healing system |
| **FailedMatchLog** | Detailed picklist match failures | Picklist matcher |
| **AIUsage** | AI API call tracking (tokens, cost, latency) | AI service wrappers |

**Note**: These are NOT source data for verification, but tracking/analytics collections

---

## 🚨 CRITICAL SYNC POINTS

### ⚠️ These hardcoded lists MUST match Salesforce picklists:

#### 1. **DEPARTMENT_CATEGORIES** (`category-matcher.service.ts`)
**Status**: Auto-generated from `categories.json` (as of 2026-02-08)  
**Validation**: Run API Accuracy Report to check sync

#### 2. **CATEGORY_NAME_ALIASES** (`constants.ts`)
**Status**: Manual sync required  
**Last sync**: 2026-02-08  
**Validation**: Run `scripts/audit-picklist-fields.js`

#### 3. **AI_FALLBACK_ATTRIBUTES** (`constants.ts`)
**Status**: Manual sync required  
**Important**: Attribute names MUST match Salesforce picklist field names exactly  
**Validation**: Run picklist audit script

#### 4. **ATTRIBUTE_ALIASES** (`picklist-matcher.service.ts`)
**Status**: Manual maintenance  
**Important**: Maps AI terms to Salesforce attribute names  
**Validation**: Monitor failed attribute matches in logs

#### 5. **BRAND_CORRECTIONS** (`text-cleaner.ts`)
**Status**: Manual maintenance  
**Important**: Proper brand name capitalization/formatting  
**Validation**: Review brand display in verified titles

---

## 📂 JSON DATA FILES (Root Level)

| File | Purpose | Used By |
|------|---------|---------|
| `category-type-style-mapping.json` | Source data for style mappings | `category-style-mapping.ts` regeneration |
| `sf-clean-attributes.json` | Clean attribute data from Salesforce | Research/debugging |
| `category_attribute_verify.file` | Attribute verification data | Unknown - legacy? |

---

## 🔄 REGENERATION SCRIPTS

When editing source JSON files, regenerate TypeScript files:

```bash
# Regenerate category-style-mapping.ts from JSON
node scripts/regenerate-category-style-mapping.js

# Regenerate title schemas
node scripts/regenerate-title-schemas.js  # (if exists)

# Regenerate hardcoded lists to match Salesforce
node scripts/regenerate-hardcoded-lists.js
```

---

## 📊 MONITORING & VALIDATION

### Check Sync Status
```bash
# Production picklist sync status (detailed)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && node scripts/check-picklist-sync-status.js"

# API verification accuracy
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"

# Picklist field audit
node scripts/audit-picklist-fields.js
```

### What "API Accuracy Report" Checks

- **Hardcoded Lists Sync Status**: Compares TypeScript constants against JSON picklists:
  - `DEPARTMENT_CATEGORIES` vs `categories.json`
  - `CATEGORY_NAME_ALIASES` vs `categories.json`
  - `category-matcher.service.ts`: `DEPARTMENT_CATEGORIES`
  - `dual-ai-verification.service.ts`: ~~Lighting/Shower arrays~~ (now dynamic)
  - `constants.ts`: `CATEGORY_NAME_ALIASES`

- **Field Name Accuracy**: Validates all verified fields match Salesforce schema
- **Picklist Match Rates**: Brand, Category, Style, Attribute matching accuracy

---

## 📋 QUICK REFERENCE: Data Source by Verification Step

### Step 1: Brand Verification
- **Primary Source**: `brands.json` (Salesforce picklist)
- **Fallback Logic**: `PREMIUM_BRANDS`, `MID_TIER_BRANDS`, `VALUE_BRANDS` (classification)
- **Service**: `picklist-matcher.service.ts`

### Step 2: Category Verification
- **Primary Source**: `categories.json` (Salesforce picklist)
- **Remapping**: `category-consolidation-mapping.ts` (deprecated → parent)
- **Aliases**: `CATEGORY_NAME_ALIASES`, `AI_CATEGORY_ALIASES`, `category-aliases.ts`
- **Department Lookup**: `DEPARTMENT_CATEGORIES`
- **Service**: `category-matcher.service.ts`, `picklist-matcher.service.ts`

### Step 3: Style Verification
- **Primary Source**: `styles.json` (Salesforce picklist)
- **Category-Specific**: `category-style-mapping.ts` (generated from JSON)
- **Validation**: `getValidStylesForCategory()`, ~~`VALID_SHOWER_STYLES`~~ (now dynamic)
- **Service**: `dual-ai-verification.service.ts`

### Step 4: Attribute Verification
- **Primary Source**: `attributes.json` (Salesforce picklist)
- **Aliases**: `ATTRIBUTE_ALIASES` (picklist-matcher.service.ts) - maps AI terms to SF terms
- **Value Filtering**: `KNOWN_ATTRIBUTE_VALUES` - prevents values from being treated as attributes
- **Top 15 Filters**: `category-filter-attributes.json`
- **Schemas**: `category-attributes.ts`, `schemas/*.ts`
- **Lookup**: `lookups.ts` → `getOptimizedFilterAttributes()`
- **Service**: `dual-ai-verification.service.ts`, `enrichment.service.ts`

### Step 5: Title Generation
- **Rules**: `title-schema-by-category.ts`
- **Brand Tier**: `PREMIUM_BRANDS`, `MID_TIER_BRANDS`, `VALUE_BRANDS`
- **Features**: `PREMIUM_FEATURE_KEYWORDS`
- **Service**: `title-generator.service.ts`

### Step 5.5: Final Review Stage (Claude)
- **AI Provider**: Anthropic `claude-sonnet-4-20250514` (temp 0.2, max_tokens 4000)
- **Product Context**: Sanitized product data (name, description, features, dimensions)
- **Type Hierarchy**: `getTypeHierarchyExplanation()` — parent/child type relationships
- **Type Selection Guides**: Per-category guidance from type mappings
- **Category Schema**: `getCategorySchema(category)` — top-15 attributes
- **Trust Hierarchy**: Structured data > product name > AI extraction
- **Accessory Rule**: CRITICAL ACCESSORY RULE for parent-appliance classification
- **Valid Picklists**: brands.json, categories.json, styles.json, types from mapping
- **Service**: `dual-ai-verification.service.ts` → `performClaudeReview()` / `executeFinalReviewStage()`
- **Auto-Corrections**: Title corrections auto-applied; category/type/style corrections applied

### Step 6: Field Validation
- **Schema**: `verified-fields.ts`
- **Primary Attributes**: `PRIMARY_ATTRIBUTES`, `PRIMARY_ATTRIBUTE_FIELD_KEYS`
- **Text Cleaning**: `ENCODING_FIXES` - fixes HTML entities and special characters
- **Service**: `consensus.service.ts`

---

## 📄 COMPLETE FILE INVENTORY

### JSON Data Files (Dynamic - Salesforce Synced)
```
src/config/salesforce-picklists/
├── brands.json                     ✅ Auto-synced from Salesforce
├── categories.json                 ✅ Auto-synced from Salesforce
├── styles.json                     ✅ Auto-synced from Salesforce  
├── attributes.json                 ✅ Auto-synced from Salesforce
├── category-filter-attributes.json ✅ Auto-synced from Salesforce
└── backups/                        (Automatic backup on each sync)
```

### JSON Data Files (Static - Manual Edit)
```
Root:
├── category-type-style-mapping.json     Source for category→style mappings
├── sf-clean-attributes.json            Clean attribute reference data

src/config/:
└── complete-category-data.json         Legacy comprehensive category data
```

### TypeScript Config Files (Static - Manual Edit)
```
src/config/
├── constants.ts                    PREMIUM_BRANDS, CATEGORY_NAME_ALIASES, AI_FALLBACK_ATTRIBUTES
├── exchange-rates.ts               Canadian data conversion (CAD→USD 0.73, kg→lbs 2.20462, CA domains)
├── category-style-mapping.ts       Generated from category-type-style-mapping.json
├── category-consolidation-mapping.ts  Deprecated→parent category mappings
├── family-category-mapping.ts      Department→Family→Category hierarchy
├── category-attributes.ts          Main category attribute schemas (18 categories)
├── category-schema.ts              Legacy schema definitions
├── category-config.ts              Schema loader from Salesforce picklists
├── category-aliases.ts             Additional category name variations
├── master-category-schema-map.ts   Complete category→schema mapping
├── title-schema-by-category.ts     Title generation rules (6700+ lines)
├── lookups.ts                      Centralized lookup functions
├── verified-fields.ts              Field validation schemas
├── types.ts                        TypeScript interfaces
└── index.ts                        Config exports

src/config/schemas/
├── plumbing-schemas.ts             Plumbing category schemas (7 categories)
├── lighting-schemas.ts             Lighting category schemas (7 categories)
├── home-decor-hvac-schemas.ts      Home decor & HVAC schemas
├── additional-appliance-schemas.ts More appliance schemas
└── complete-category-schemas.ts    Aggregated schemas
```

### Service Files with Hardcoded Logic
```
src/services/
├── picklist-matcher.service.ts     ATTRIBUTE_ALIASES, KNOWN_ATTRIBUTE_VALUES
├── category-matcher.service.ts     DEPARTMENT_CATEGORIES, CATEGORY_KEYWORDS
└── (other service files use imported config)

src/utils/
└── text-cleaner.ts                 BRAND_CORRECTIONS, ENCODING_FIXES
```

---

## 📄 COMPLETE FILE INVENTORY

### JSON Data Files (Dynamic - Salesforce Synced)
```
src/config/salesforce-picklists/
├── brands.json                     ✅ Auto-synced from Salesforce
├── categories.json                 ✅ Auto-synced from Salesforce
├── styles.json                     ✅ Auto-synced from Salesforce  
├── attributes.json                 ✅ Auto-synced from Salesforce
├── category-filter-attributes.json ✅ Auto-synced from Salesforce
└── backups/                        (Automatic backup on each sync)
```

### JSON Data Files (Static - Manual Edit)
```
Root:
├── category-type-style-mapping.json     Source for category→style mappings
├── sf-clean-attributes.json            Clean attribute reference data

src/config/:
└── complete-category-data.json         Legacy comprehensive category data
```

### TypeScript Config Files (Static - Manual Edit)
```
src/config/
├── constants.ts                    PREMIUM_BRANDS, CATEGORY_NAME_ALIASES, AI_FALLBACK_ATTRIBUTES
├── exchange-rates.ts               Canadian data conversion (CAD→USD 0.73, kg→lbs 2.20462, CA domains)
├── category-style-mapping.ts       Generated from category-type-style-mapping.json
├── category-consolidation-mapping.ts  Deprecated→parent category mappings
├── family-category-mapping.ts      Department→Family→Category hierarchy
├── category-attributes.ts          Main category attribute schemas (18 categories)
├── category-schema.ts              Legacy schema definitions
├── category-config.ts              Schema loader from Salesforce picklists
├── category-aliases.ts             Additional category name variations
├── master-category-schema-map.ts   Complete category→schema mapping
├── title-schema-by-category.ts     Title generation rules (6700+ lines)
├── lookups.ts                      Centralized lookup functions
├── verified-fields.ts              Field validation schemas
├── types.ts                        TypeScript interfaces
└── index.ts                        Config exports

src/config/schemas/
├── plumbing-schemas.ts             Plumbing category schemas (7 categories)
├── lighting-schemas.ts             Lighting category schemas (7 categories)
├── home-decor-hvac-schemas.ts      Home decor & HVAC schemas
├── additional-appliance-schemas.ts More appliance schemas
└── complete-category-schemas.ts    Aggregated schemas
```

### Service Files with Hardcoded Logic
```
src/services/
├── picklist-matcher.service.ts     ATTRIBUTE_ALIASES, KNOWN_ATTRIBUTE_VALUES
├── category-matcher.service.ts     DEPARTMENT_CATEGORIES, CATEGORY_KEYWORDS
└── (other service files use imported config)

src/utils/
└── text-cleaner.ts                 BRAND_CORRECTIONS, ENCODING_FIXES
```

---

## 🏗️ Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    SALESFORCE (Source of Truth)              │
└────────────────┬────────────────────────────────────────────┘
                 │ POST /api/picklists/sync
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          src/config/salesforce-picklists/ (JSON)             │
│  • brands.json                                               │
│  • categories.json                                           │
│  • styles.json                                               │
│  • attributes.json                                           │
│  • category-filter-attributes.json                           │
└────────────┬────────────────────────────────────────────────┘
             │ Auto-commit every 5 min (cron)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
└────────────┬────────────────────────────────────────────────┘
             │ git pull
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Static Mapping Files (TypeScript)               │
│  • constants.ts (CATEGORY_NAME_ALIASES, Brand Tiers)        │
│  • category-matcher.service.ts (DEPARTMENT_CATEGORIES)       │
│  • category-style-mapping.ts (Category → Styles)            │
│  • category-consolidation-mapping.ts (Deprecated → Parent)   │
│  • family-category-mapping.ts (Hierarchy)                    │
│  • category-attributes.ts (Attribute Schemas)                │
│  • title-schema-by-category.ts (Title Rules)                │
└────────────┬────────────────────────────────────────────────┘
             │ imported by
             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Verification Services                        │
│  • picklist-matcher.service.ts                              │
│  • category-matcher.service.ts                              │
│  • dual-ai-verification.service.ts                          │
│  • consensus.service.ts                                      │
│  • title-generator.service.ts                               │
│  • enrichment.service.ts                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Maintenance Checklist

### When Salesforce Adds/Removes Categories:
- [ ] Update `category-consolidation-mapping.ts` (if deprecated)
- [ ] Update `family-category-mapping.ts` (if new family/dept)
- [ ] Update `master-category-schema-map.ts` (add schema mapping)
- [ ] Create new schema in `category-attributes.ts` or `schemas/`
- [ ] Run `scripts/regenerate-hardcoded-lists.js` (if exists)
- [ ] Verify with API Accuracy Report

### When Salesforce Changes Attribute Names:
- [ ] Update `AI_FALLBACK_ATTRIBUTES` in `constants.ts`
- [ ] Update `ATTRIBUTE_ALIASES` in `picklist-matcher.service.ts`
- [ ] Check all schemas in `category-attributes.ts`
- [ ] Run `scripts/audit-picklist-fields.js`
- [ ] Verify with API Accuracy Report

### When Adding New Brands:
- [ ] Add to `brands.json` (via Salesforce sync)
- [ ] Add capitalization to `BRAND_CORRECTIONS` in `text-cleaner.ts`
- [ ] Add to brand tier list if applicable (`PREMIUM_BRANDS`, `MID_TIER_BRANDS`, `VALUE_BRANDS`)

### When Adding New Category-Style Mappings:
- [ ] Edit `category-type-style-mapping.json`
- [ ] Run `node scripts/regenerate-category-style-mapping.js`
- [ ] Test with verification service

### Monthly Sync Check:
- [ ] Run "Establish Connection" procedure
- [ ] Review picklist sync status
- [ ] Run API Accuracy Report
- [ ] Check "Hardcoded Lists Sync Status" section
- [ ] Update any OUT OF SYNC constants

---

## 🔗 Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - File organization & commit guidelines
- [Session Notes](../session-notes/) - Recent changes and session summaries
- [Audit Results](../audit-results/) - Validation reports
- [Copilot Instructions](../.github/copilot-instructions.md) - Development guidelines

---

## 🌳 VERIFICATION FLOW - DATA SOURCE TREE (Start to Finish)

```
📥 VERIFICATION REQUEST RECEIVED
│
├─ PHASE 1: REQUEST VALIDATION & SETUP
│  ├─ Environment Config (config/index.ts)
│  │  ├─ AI model settings (OpenAI, xAI)
│  │  ├─ Research toggles
│  │  ├─ Timeout limits
│  │  └─ Salesforce endpoints
│  ├─ verified-fields.ts
│  │  └─ Required field schemas
│  └─ PRIMARY_ATTRIBUTES (constants.ts)
│     └─ 20 universal fields list
│
├─ PHASE 2: CATEGORY IDENTIFICATION
│  ├─ category-matcher.service.ts
│  │  ├─ DEPARTMENT_CATEGORIES
│  │  └─ CATEGORY_KEYWORDS
│  ├─ category-consolidation-mapping.ts
│  │  └─ Deprecated → Parent category remapping
│  ├─ CATEGORY_NAME_ALIASES (constants.ts)
│  ├─ AI_CATEGORY_ALIASES (constants.ts)
│  ├─ category-aliases.ts
│  └─ categories.json (Salesforce picklist)
│     └─ Match to: category_id, category_name, department, family
│
├─ PHASE 3: BRAND VERIFICATION
│  ├─ picklist-matcher.service.ts
│  │  └─ Brand matching logic
│  ├─ brands.json (Salesforce picklist)
│  │  └─ Match to: brand_id, brand_name
│  ├─ BRAND_CORRECTIONS (text-cleaner.ts)
│  │  └─ Normalize capitalization (cafe → Café)
│  └─ Brand Tier Classification (constants.ts)
│     ├─ PREMIUM_BRANDS
│     ├─ MID_TIER_BRANDS
│     └─ VALUE_BRANDS
│
├─ PHASE 4: PRODUCT FAMILY VALIDATION
│  └─ family-category-mapping.ts
│     └─ Department → Family → Category hierarchy
│
├─ PHASE 5: STYLE/TYPE VERIFICATION
│  ├─ category-style-mapping.ts
│  │  └─ Category → Valid styles mapping
│  ├─ category-type-style-mapping.json
│  │  └─ Source JSON for style mappings
│  ├─ styles.json (Salesforce picklist)
│  │  └─ Match to: style_id, style_name
│  └─ Dynamic Style Checking (dual-ai-verification.service.ts)
│     ├─ getLightingCategories()
│     ├─ getShowerCategories()
│     └─ getValidStylesForCategory()
│
├─ PHASE 6: SCHEMA LOADING
│  ├─ master-category-schema-map.ts
│  │  └─ Category name → Schema config routing
│  ├─ lookups.ts
│  │  ├─ getCategorySchema()
│  │  ├─ getOptimizedFilterAttributes()
│  │  └─ getTop15Attributes()
│  ├─ category-filter-attributes.json (Salesforce)
│  │  └─ Top 15 ranked attributes per category
│  ├─ Category-Specific Schemas:
│  │  ├─ category-attributes.ts (18 main categories)
│  │  ├─ schemas/plumbing-schemas.ts (7 categories)
│  │  ├─ schemas/lighting-schemas.ts (7 categories)
│  │  ├─ schemas/home-decor-hvac-schemas.ts
│  │  └─ schemas/additional-appliance-schemas.ts
│  └─ AI_FALLBACK_ATTRIBUTES (constants.ts)
│     └─ Fallback if JSON incomplete
│
├─ PHASE 7: AI VERIFICATION (Dual AI)
│  ├─ OpenAI Service (openai.service.ts)
│  │  ├─ Model: gpt-4o-mini (text)
│  │  ├─ Model: gpt-4o (vision)
│  │  └─ Model: gpt-4o-mini-search-preview (web search)
│  ├─ xAI Service (xai.service.ts)
│  │  ├─ Model: grok-3 (text)
│  │  └─ Model: grok-2-vision-1212 (vision) ⚠️ **DEPRECATED/404**
│  ├─ Research Service (research.service.ts)
│  │  ├─ Web scraping (if enabled)
│  │  ├─ PDF extraction (if enabled)
│  │  └─ Image analysis (if enabled)
│  └─ Token Management (token-management.service.ts)
│     └─ Attribute prioritization logic
│
├─ PHASE 7.5: FINAL REVIEW STAGE (Claude Cross-Check)
│  ├─ dual-ai-verification.service.ts
│  │  ├─ executeFinalReviewStage() — orchestrates 3 phases
│  │  └─ performClaudeReview() — Claude API call
│  ├─ Anthropic Claude API
│  │  ├─ Model: claude-sonnet-4-20250514
│  │  ├─ Temperature: 0.2
│  │  └─ Max tokens: 4000
│  ├─ Context Injected (equivalent to primary AIs):
│  │  ├─ Sanitized product data (name, desc, features, dims)
│  │  ├─ Type hierarchy (getTypeHierarchyExplanation())
│  │  ├─ Per-category type selection guides
│  │  ├─ Top-15 attributes (getCategorySchema())
│  │  ├─ Data source trust hierarchy
│  │  ├─ CRITICAL ACCESSORY RULE
│  │  └─ Valid picklist values for corrections
│  ├─ Phase A: Automated validation (no AI cost)
│  ├─ Phase B: Claude cross-check (AI call)
│  └─ Phase C: Auto-correction application
│     ├─ Category/Type/Style corrections applied
│     └─ Title corrections: AUTO-APPLIED
│
├─ PHASE 8: ATTRIBUTE VALIDATION & MATCHING
│  ├─ picklist-matcher.service.ts
│  │  ├─ ATTRIBUTE_ALIASES (~100+ mappings)
│  │  │  └─ AI term → Salesforce term
│  │  ├─ KNOWN_ATTRIBUTE_VALUES (~30+ values)
│  │  │  └─ Filter out non-attribute values
│  │  └─ PRIMARY_ATTRIBUTE_NAMES/KEYS
│  │     └─ Exclude from attribute requests
│  ├─ attributes.json (Salesforce picklist)
│  │  └─ Match to: attribute_id, attribute_name
│  └─ Category-Specific Attribute Lists
│     ├─ top15FilterAttributes
│     ├─ htmlTableAttributes
│     └─ taxonomyTiers
│
├─ PHASE 9: CONSENSUS BUILDING
│  ├─ consensus.service.ts
│  │  ├─ Compare OpenAI vs xAI
│  │  ├─ Threshold: 0.9 (from config)
│  │  └─ Max retries: 3 (from config)
│  ├─ verified-fields.ts
│  │  └─ Field validation rules
│  └─ Picklist Re-matching
│     ├─ brands.json
│     ├─ categories.json
│     ├─ styles.json
│     └─ attributes.json
│
├─ PHASE 10: TITLE GENERATION
│  ├─ title-generator.service.ts
│  ├─ title-schema-by-category.ts
│  │  └─ BRAND + SPEC + TYPE + CATEGORY + FINISH - MODEL
│  ├─ TITLE_ATTRIBUTE_WHITELIST
│  ├─ Brand Tier (for title enhancement)
│  │  ├─ PREMIUM_BRANDS
│  │  ├─ MID_TIER_BRANDS
│  │  └─ VALUE_BRANDS
│  ├─ PREMIUM_FEATURE_KEYWORDS (constants.ts)
│  └─ BRAND_CORRECTIONS (text-cleaner.ts)
│     └─ Final brand formatting
│
├─ PHASE 11: TEXT CLEANING & FORMATTING
│  ├─ text-cleaner.ts
│  │  ├─ BRAND_CORRECTIONS (~70 fixes)
│  │  ├─ ENCODING_FIXES (~20 fixes)
│  │  └─ Remove HTML entities, special chars
│  ├─ data-cleaner.ts
│  │  └─ Field value cleanup
│  └─ html-generator.ts
│     └─ Generate HTML table attributes
│
├─ PHASE 12: RESPONSE ASSEMBLY
│  ├─ response-builder.service.ts
│  │  ├─ Assemble verified fields
│  │  ├─ Format Top_Filter_Attributes
│  │  └─ Generate HTML table
│  ├─ PRIMARY_ATTRIBUTE_FIELD_KEYS (constants.ts)
│  │  └─ Exclude from filter attributes
│  └─ verified-fields.ts
│     └─ Final validation
│
├─ PHASE 13: QUALITY TRACKING (Parallel)
│  ├─ MongoDB Collections (for tracking):
│  │  ├─ VerificationJob
│  │  ├─ PicklistMismatch
│  │  ├─ FailedMatchLog
│  │  ├─ InconclusiveResponseLog
│  │  ├─ SelfHealingLog
│  │  └─ AIUsage
│  └─ CatalogIndex
│     └─ Update category→style patterns
│
└─ PHASE 14: SALESFORCE DELIVERY
   ├─ Salesforce Config (config/index.ts)
   │  └─ Webhook URL endpoint
   └─ salesforce.service.ts
      └─ Send verified response

═══════════════════════════════════════════════════════════

📊 DATA SOURCE USAGE SUMMARY BY PHASE:

CONFIGURATION (Used Throughout):
• Environment Config (config/index.ts)
• verified-fields.ts
• constants.ts (PRIMARY_ATTRIBUTES)

PICKLIST MATCHING (Phases 2-5, 8-9):
• brands.json
• categories.json  
• styles.json
• attributes.json
• category-filter-attributes.json

MAPPING FILES (Phases 2, 4-5):
• category-consolidation-mapping.ts
• family-category-mapping.ts
• category-style-mapping.ts
• category-type-style-mapping.json
• master-category-schema-map.ts

SCHEMA FILES (Phase 6):
• category-attributes.ts
• schemas/plumbing-schemas.ts
• schemas/lighting-schemas.ts
• schemas/home-decor-hvac-schemas.ts
• schemas/additional-appliance-schemas.ts
• title-schema-by-category.ts

HARDCODED LISTS (Phases 2-3, 8, 10-11):
• DEPARTMENT_CATEGORIES
• CATEGORY_NAME_ALIASES / AI_CATEGORY_ALIASES
• PREMIUM_BRANDS / MID_TIER_BRANDS / VALUE_BRANDS
• BRAND_CORRECTIONS
• ATTRIBUTE_ALIASES
• KNOWN_ATTRIBUTE_VALUES
• PREMIUM_FEATURE_KEYWORDS
• ENCODING_FIXES

AI SERVICES (Phase 7):
• openai.service.ts (gpt-4o-mini, gpt-4o)
• xai.service.ts (grok-3, grok-2-vision)
• research.service.ts

UTILITIES (Phases 8-12):
• lookups.ts
• text-cleaner.ts
• data-cleaner.ts
• html-generator.ts
• json-parser.ts

CORE SERVICES (Phases 3-12):
• picklist-matcher.service.ts
• category-matcher.service.ts
• dual-ai-verification.service.ts
• consensus.service.ts
• title-generator.service.ts
• response-builder.service.ts

TRACKING (Phase 13):
• MongoDB Collections (7 collections)
• CatalogIndex

═══════════════════════════════════════════════════════════
```

---

## 🔍 DATA LINEAGE - Where Does Each File's Data Come From?

### 📥 SOURCE 1: SALESFORCE ADMIN (Manual Entry in Salesforce UI)

**What**: Product picklists managed by Salesforce administrators

**Files Generated**:
```
✅ brands.json                     ← Salesforce Admin adds brands in SF UI
✅ categories.json                 ← Salesforce Admin creates categories in SF UI
✅ styles.json                     ← Salesforce Admin defines styles in SF UI
✅ attributes.json                 ← Salesforce Admin creates attributes in SF UI
✅ category-filter-attributes.json ← Salesforce Admin ranks top 15 per category
```

**Data Flow**:
```
Salesforce Admin (Manual Entry)
    ↓
Salesforce Database (Custom Objects/Picklists)
    ↓
Salesforce Apex Trigger/Scheduled Job
    ↓
POST /api/picklists/sync (Webhook to our API)
    ↓
picklist.controller.ts validates & saves
    ↓
JSON files in src/config/salesforce-picklists/
    ↓
Auto-commit to GitHub (cron every 5 min)
```

**Frequency**: Real-time when Salesforce admin makes changes  
**Control**: Salesforce Admin Team  
**Our Role**: Receive and store updates (passive)

---

### 📝 SOURCE 2: DEVELOPER MANUAL CREATION (Code & Config Files)

**What**: Hardcoded logic, mappings, and schemas created by developers

**Files Created**:
```
👨‍💻 constants.ts
   ├─ PREMIUM_BRANDS              ← Developer research: luxury brand classification
   ├─ MID_TIER_BRANDS             ← Developer research: mainstream brands
   ├─ VALUE_BRANDS                ← Developer research: budget brands
   ├─ CATEGORY_NAME_ALIASES       ← Developer maps plural/variants from SF categories
   ├─ AI_CATEGORY_ALIASES         ← Developer maps AI variations to schema IDs
   ├─ PREMIUM_FEATURE_KEYWORDS    ← Developer defines premium-sounding terms
   └─ AI_FALLBACK_ATTRIBUTES      ← Developer manually lists attributes per category

👨‍💻 category-style-mapping.ts
   └─ Generated by script from category-type-style-mapping.json

👨‍💻 category-type-style-mapping.json
   ├─ Manually created by developer
   ├─ Based on: Market research, retail categories, Google Shopping taxonomy
   └─ Defines which styles are valid for each category

👨‍💻 category-consolidation-mapping.ts
   ├─ Manually created when Salesforce removes categories
   └─ Maps deprecated → parent category

👨‍💻 family-category-mapping.ts
   ├─ Manually created from Salesforce hierarchy
   └─ Department → Family → Category relationships

👨‍💻 category-attributes.ts + schemas/*.ts
   ├─ Manually created by analyzing Salesforce data exports
   ├─ Based on: Product catalog analysis, industry standards
   └─ Defines top 15 attributes, HTML table attributes per category

👨‍💻 title-schema-by-category.ts
   ├─ Generated by script from Product_Title_Schema_by_Category_REVISED.json
   └─ JSON manually created from SEO research and Google Shopping requirements

👨‍💻 master-category-schema-map.ts
   ├─ Manually created by developer
   └─ Maps all category name variations to schema objects

👨‍💻 category-aliases.ts
   ├─ Manually created by developer
   └─ Maps category name variations for AI normalization

👨‍💻 verified-fields.ts
   ├─ Manually created by developer
   └─ Defines required fields and validation rules

👨‍💻 text-cleaner.ts
   ├─ BRAND_CORRECTIONS          ← Developer manually maps brand capitalization
   └─ ENCODING_FIXES             ← Developer manually defines HTML entity fixes
```

**Data Flow**:
```
Developer Research/Analysis
    ↓
Manual code creation/editing
    ↓
Committed to GitHub
    ↓
Deployed to production
    ↓
Loaded at runtime by application
```

**Sources for Developer Data**:
- 📊 Salesforce data exports (for schema analysis)
- 🛒 Product catalog research (Home Depot, Lowe's, Ferguson)
- 🔍 Google Shopping taxonomy guidelines
- 📈 SEO best practices
- 🏢 Industry standards (NKBA, NEMA, etc.)
- 🤖 AI behavior observation (what AIs commonly return)
- 📝 Salesforce field naming conventions
- 🐛 Bug reports and failed matches (to add aliases)

**Frequency**: As needed when:
- New categories added to Salesforce
- New brands need capitalization rules
- AI returns new variations needing aliases
- Schema improvements identified
- Bugs found in matching logic

**Control**: Development Team  
**Our Role**: Create, maintain, and update manually

---

### 🔬 SOURCE 3: SALESFORCE DATA ANALYSIS (Scripts & Exports)

**What**: Generated files based on analyzing Salesforce data exports

**Files Generated**:
```
📊 complete-category-data.json
   ├─ Source: Salesforce data export analysis
   ├─ Contains: Global attributes, per-category attributes, taxonomy tiers
   └─ Generated by: Data analysis scripts (legacy)

📊 sf-clean-attributes.json
   ├─ Source: Salesforce attribute export
   ├─ Contains: Clean attribute reference data
   └─ Purpose: Research/debugging

📊 audit-results/*.json
   ├─ Source: Verification job analysis, picklist audits
   └─ Generated by: Audit/analysis scripts
```

**Data Flow**:
```
Salesforce Database
    ↓
Data Export (CSV/Excel)
    ↓
Analysis Script (Python/Node.js)
    ↓
Generated JSON file
    ↓
Committed to repository
    ↓
Referenced by application (or used for research)
```

**Frequency**: Periodic (when deep analysis needed)  
**Control**: Development Team via scripts  
**Our Role**: Analyze and generate insights

---

### 🤖 SOURCE 4: AI MODEL PROVIDERS (External APIs)

**What**: AI model responses and capabilities

**Services Used**:
```
🟢 OpenAI API
   ├─ Models: gpt-4o-mini, gpt-4o, gpt-4o-mini-search-preview
   ├─ Source: OpenAI's trained models
   └─ Config: OPENAI_API_KEY (from .env)

🔵 xAI API
   ├─ Models: grok-3, grok-2-vision-1212 ⚠️ (vision model deprecated/404)
   ├─ Source: xAI's trained models
   └─ Config: XAI_API_KEY (from .env)

🟣 Anthropic API (Final Review Stage)
   ├─ Model: claude-sonnet-4-20250514
   ├─ Source: Anthropic's trained models
   ├─ Used for: Final Review Stage cross-check + auto-corrections
   └─ Config: ANTHROPIC_API_KEY (from .env)
```

**Data Flow**:
```
Verification Request
    ↓
Build AI prompt with:
    ├─ Product data
    ├─ Category schema
    ├─ Picklist options
    └─ Instructions
    ↓
Send to OpenAI + xAI (parallel)
    ↓
AI responses
    ↓
Consensus building
    ↓
Verified data
```

**Frequency**: Every verification request (real-time)  
**Control**: External providers (OpenAI, xAI)  
**Our Role**: Consume API responses

---

### 🌐 SOURCE 5: WEB SCRAPING & RESEARCH (External Websites)

**What**: Product specifications from manufacturer/retailer websites

**Services**:
```
🔍 research.service.ts
   ├─ Web scraping (Puppeteer)
   ├─ PDF extraction
   ├─ Image analysis
   └─ OpenAI web search API
```

**Sources Scraped**:
- Manufacturer websites (product spec pages)
- Retailer sites (Home Depot, Lowe's, Ferguson, etc.)
- PDF manuals and spec sheets
- Product images

**Data Flow**:
```
Missing/Unresolved Fields
    ↓
Generate search query
    ↓
Web fetch OR OpenAI web search
    ↓
Extract specifications
    ↓
AI analysis of scraped content
    ↓
Return found values
```

**Frequency**: When AI cannot resolve from product data  
**Control**: External websites (changing HTML structure)  
**Our Role**: Scrape and extract data

---

### ⚙️ SOURCE 6: ENVIRONMENT CONFIGURATION (DevOps)

**What**: Runtime settings and secrets

**Location**: `.env` file (local) or environment variables (production)

```bash
# Example .env sources:
MONGODB_URI=...                    ← DevOps sets database connection
OPENAI_API_KEY=...                 ← From OpenAI account
XAI_API_KEY=...                    ← From xAI account
SALESFORCE_CLIENT_ID=...           ← From Salesforce Connected App
SALESFORCE_CLIENT_SECRET=...       ← From Salesforce Connected App
SALESFORCE_USERNAME=...            ← Salesforce integration user
SALESFORCE_PASSWORD=...            ← Salesforce integration user password
WEBHOOK_SECRET=...                 ← Generated by DevOps for security
```

**Data Flow**:
```
DevOps/Developer
    ↓
Creates .env file or sets environment variables
    ↓
Application loads at startup (config/index.ts)
    ↓
Used throughout application
```

**Frequency**: Initial setup, when credentials rotate  
**Control**: DevOps Team  
**Our Role**: Load and use configuration

---

### 💾 SOURCE 7: RUNTIME DATABASE (MongoDB Collections)

**What**: Data generated by the application during operation

**Collections**:
```
🗄️ VerificationJob
   └─ Source: Every verification request processed

🗄️ PicklistMismatch
   └─ Source: Failed brand/category/style/attribute matches

🗄️ FailedMatchLog
   └─ Source: Detailed picklist match failures

🗄️ PicklistSyncLog
   └─ Source: Salesforce picklist sync events

🗄️ CatalogIndex
   └─ Source: Category→Style, Brand→Category patterns learned

🗄️ SelfHealingLog
   └─ Source: Self-healing attempts and outcomes

🗄️ AIUsage
   └─ Source: AI API calls tracking (tokens, cost, latency)

🗄️ InconclusiveResponseLog
   └─ Source: AI responses that failed validation

🗄️ CategoryConfusion
   └─ Source: Category disagreements between AIs

🗄️ PendingPicklistSync
   └─ Source: Salesforce picklist syncs awaiting manual review (hold bucket)

🗄️ PendingCreationRequest
   └─ Source: Items we've asked Salesforce to create (new brands, categories, etc.)
```

**Data Flow**:
```
Verification Process
    ↓
Events/Results/Analytics
    ↓
Save to MongoDB
    ↓
Used for:
    ├─ Analytics dashboards
    ├─ Debugging
    ├─ Pattern learning (CatalogIndex)
    └─ Audit trails
```

**Frequency**: Real-time during verification  
**Control**: Application logic  
**Our Role**: Generate and track data

---

## 📊 DATA SOURCE CLASSIFICATION SUMMARY

| Source Type | Data Owner | Update Method | Frequency | Files Affected |
|-------------|------------|---------------|-----------|----------------|
| **Salesforce Admin** | Salesforce Team | Manual entry in SF UI → API sync | Real-time | 5 JSON picklists |
| **Developer Code** | Dev Team | Manual coding/editing | As needed | 15+ TypeScript files |
| **Data Analysis** | Dev Team | Scripts analyzing SF exports | Periodic | 3 JSON files |
| **AI Providers** | OpenAI/xAI | External API responses | Per request | Runtime only |
| **Web Scraping** | External sites | Automated fetching | When needed | Runtime only |
| **Environment Config** | DevOps Team | Manual env var setup | Rarely | Runtime config |
| **Runtime Database** | Application | Auto-generated during operation | Real-time | 9 MongoDB collections |

---

## 🔄 UPDATE PROCEDURES BY SOURCE

### To Update Salesforce Picklists:
```
1. Salesforce Admin logs into Salesforce
2. Navigates to Custom Objects → Brands/Categories/Styles/Attributes
3. Adds/edits/removes entries
4. Salesforce triggers sync to our API
5. Our API receives and saves JSON files
6. Cron job auto-commits to GitHub (every 5 min)
7. Deploy.sh pulls latest and restarts service
```

### To Update Developer Code:
```
1. Developer edits TypeScript/JSON file locally
2. Tests changes with `npm run dev`
3. Commits to GitHub: `git commit -m "Update category aliases"`
4. Push: `git push origin main`
5. Deploy: SSH to production → `./deploy.sh`
6. Service restarts with new code
```

### To Update Environment Config:
```
1. DevOps updates .env file on server
2. Restarts service: `systemctl restart catalog-verification`
3. New config loaded at startup
```

### To Regenerate Generated Files:
```bash
# Regenerate category-style-mapping.ts from JSON
node scripts/regenerate-category-style-mapping.js

# Regenerate hardcoded lists from Salesforce picklists
node scripts/regenerate-hardcoded-lists.js

# Regenerate title schemas
# (Edit Product_Title_Schema_by_Category_REVISED.json first)
node scripts/regenerate-title-schemas.js
```

---

**Last Updated**: 2026-03-04  
**Maintained By**: Development Team  
**Review Frequency**: After each Salesforce picklist sync
