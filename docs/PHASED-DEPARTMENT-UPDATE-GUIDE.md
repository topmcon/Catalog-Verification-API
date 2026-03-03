# Phased Department Update Guide
## How to Add/Update Departments, Categories, Types, and Styles

**Date:** March 3, 2026  
**Focus:** Plumbing & Bath Department Updates  
**Reference Model:** Appliances Department

---

## 📋 TABLE OF CONTENTS

1. [How Appliances Verification Works (Reference Model)](#reference-model)
2. [8 Files That Need Updates](#files-to-update)
3. [Verification Data Flow](#verification-flow)
4. [Phased Update Plan for Plumbing & Bath](#phased-plan)
5. [Update Checklist Per Category](#checklist)

---

## 1. HOW APPLIANCES VERIFICATION WORKS (Reference Model) {#reference-model}

### Current Appliances Setup

**Department:** Appliances  
**Categories:** 17 categories  
**All have:** Type mappings, Title schemas, Filter attributes

### Example: Refrigerator Verification Flow

```
STEP 1: SALESFORCE SENDS DATA
├─ Web_Retailer_Category: "REFRIGERATORS"
├─ Ferguson_Product_Type: "FRENCH DOOR"
├─ Model_Number: "RF23DB9900QP"
└─ Brand: "Samsung"

STEP 2: CATEGORY MATCHING (response-builder.service.ts)
├─ mapToVerifiedCategory() → "Refrigerator"
├─ Lookup in categories.json:
│   {
│     "category_id": "a01Hu000011kmDLIAY",
│     "category_name": "Refrigerator",
│     "department": "Appliances",
│     "family": "Kitchen"
│   }
└─ Returns: Category_Verified="Refrigerator", Department="Appliances"

STEP 3: TYPE VALIDATION (category-type-mapping.json)
├─ Get valid types for "Refrigerator":
│   ["French Door", "Side by Side", "Top Freezer", "Bottom Freezer",
│    "Drawer", "Wine Cooler", "Beverage Center", "Column",
│    "Built-In", "Panel Ready", "Counter Depth", "Accessory"]
├─ AI suggests: "French Door"
├─ Validate: ✅ "French Door" IS in valid types list
└─ Returns: Type_Verified="French Door", Type_Id="a12..."

STEP 4: STYLE VALIDATION (category-style-mapping.json)
├─ Check if category has specific styles: NO (uses universal)
├─ Universal styles: ["Contemporary", "Modern", "Traditional"...]
├─ AI suggests: "Contemporary"
├─ Validate: ✅ "Contemporary" IS in styles.json
└─ Returns: Product_Style_Verified="Contemporary", Style_Id="a1I..."

STEP 5: FILTER ATTRIBUTES (category-filter-attributes.json)
├─ Get schema for "Refrigerator":
│   primary_attributes: ["Brand", "Type", "Width", "Capacity"]
│   top_5_filters: ["Type", "Width (Inches)", "Finish", "Ice Maker", "Water Dispenser"]
│   top_15_filters: [All top_5 + "Energy Star", "Depth", "Height"...]
├─ AI extracts attributes from product data
└─ Returns: Structured attribute data

STEP 6: TITLE GENERATION (title-schema-by-category.ts)
├─ Get title schema for "Refrigerator":
│   slots: [Brand, Width, Type, Category, Finish, Model]
│   template: "{Brand} {Width}-Inch {Type} {Category} {Finish} - {Model}"
├─ Apply formatters (dimension, capacity, etc.)
├─ Generate: "Samsung 36-Inch French Door Refrigerator Stainless Steel - RF23DB9900QP"
└─ Returns: Product_Title_Verified
```

---

## 2. 8 FILES THAT NEED UPDATES {#files-to-update}

### File Dependency Matrix

| # | File Path | Purpose | When Updated | Impact |
|---|-----------|---------|--------------|--------|
| 1 | `src/config/salesforce-picklists/departments.json` | Master department list | Add new departments | Category validation |
| 2 | `src/config/salesforce-picklists/categories.json` | Master category list with dept/family/IDs | Add/update categories | Core verification |
| 3 | `src/config/salesforce-picklists/types.json` | Master type list with IDs | Add new types | Type validation |
| 4 | `src/config/salesforce-picklists/styles.json` | Master style list with IDs | Add new styles | Style validation |
| 5 | `src/config/salesforce-picklists/category-type-mapping.json` | Maps categories → valid types | Each new category | AI type selection |
| 6 | `src/config/salesforce-picklists/category-style-mapping.json` | Maps categories → valid styles | Category-specific styles | AI style selection |
| 7 | `src/config/salesforce-picklists/category-filter-attributes.json` | Defines filter attributes per category | Each new category | Attribute extraction |
| 8 | `src/config/title-schema-by-category.ts` | Title generation schemas per category | Each new category | Title generation |

---

## 3. VERIFICATION DATA FLOW {#verification-flow}

### How Files Are Used in Verification

```
┌─────────────────────────────────────────────────────────────┐
│  SALESFORCE POST /api/verify/salesforce                    │
│  { SF_Catalog_Id, Brand, Model, Category, Type, ... }      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Category Determination                             │
│  File: response-builder.service.ts                          │
│  Uses: categories.json, category-aliases.ts                 │
│  Output: Category_Verified, Department_Verified             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Get Category Schema                                │
│  File: category-config.ts                                   │
│  Uses: category-filter-attributes.json                      │
│  Output: Primary, Top5, Top15, Additional attributes        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Dual AI Verification (OpenAI + xAI)                │
│  File: dual-ai-verification.service.ts                      │
│  Uses: category-type-mapping.json (for AI prompt)           │
│        category-style-mapping.json (for AI prompt)          │
│  Output: AI consensus on all fields                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Validate AI Outputs                                │
│  Files: type-matcher.service.ts, style-validator.service.ts │
│  Uses: types.json, styles.json                              │
│        category-type-mapping.json, category-style-mapping   │
│  Output: Validated Type_Verified, Product_Style_Verified    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Generate SEO Title                                 │
│  File: seo-title-generator.service.ts                       │
│  Uses: title-schema-by-category.ts                          │
│  Output: Product_Title_Verified (60-80 chars)               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Build Response & Send to Salesforce                │
│  File: response-builder.service.ts                          │
│  Output: Complete SalesforceVerificationResponse            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. PHASED UPDATE PLAN FOR PLUMBING & BATH {#phased-plan}

### Current State vs Target State

| Metric | Current (Repo) | Salesforce | Gap |
|--------|----------------|------------|-----|
| **Categories** | 37 | 46 | +10 new categories |
| **Type Mappings** | 42 categories | Need validation | Add for 10 new |
| **Style Mappings** | 0 (universal only) | Need review | Category-specific? |
| **Title Schemas** | ~30 categories | Expand | Add for new categories |

### NEW Categories in Salesforce (Need to Add)

1. **Bathroom Cabinet Hardware** (moved from Hardware dept)
2. **Bathroom Lighting** (standalone, not "(Bathroom)")
3. **Cabinet Hardware** (in Plumbing context)
4. **Flush and Semi-Flush** (lighting, moved from Lighting dept)
5. **Kitchen Tile** (moved from Flooring dept)
6. **Luxury Kitchen** (NEW category)
7. **Pressure Valve** (NEW category)
8. **Shower Accessory** (NEW category)
9. **Tankless Water Heater** (moved from Heating & Cooling)
10. **Tub and Shower Accessory** (NEW category)

### MOVED/DEPRECATED Categories

- **❌ Drainage & Waste** → Moved to Industrial & Commercial dept

---

## 5. PHASED ROLLOUT STRATEGY

### Phase 0: Preparation (Do This First)

**Goal:** Understand current state, identify dependencies

**Tasks:**
1. ✅ Run audit script (DONE)
2. ✅ Identify files needing updates (DONE)
3. Create backup of all picklist files
4. Document current Plumbing & Bath categories working correctly

**Command:**
```bash
# Backup current picklists
cp -r src/config/salesforce-picklists src/config/salesforce-picklists.backup-2026-03-03
```

---

### Phase 1: Add New Departments

**Goal:** Add 3 missing departments to departments.json

**Files to Update:**
- `src/config/salesforce-picklists/departments.json`

**Changes:**
```json
// ADD these 3 departments:
{
  "department_id": "TBD_FROM_SF",
  "department_name": "Electronics"
},
{
  "department_id": "TBD_FROM_SF",
  "department_name": "Industrial & Commercial"
},
{
  "department_id": "TBD_FROM_SF",
  "department_name": "Not Applicable Department"
}
```

**Validation:**
```bash
node scripts/audit-sf-vs-repo-categories.js
# Should show 0 missing departments
```

---

### Phase 2: Update Plumbing & Bath Categories (By Priority)

**Goal:** Add 10 new Plumbing & Bath categories, one at a time  
**Order:** By verification volume (most-used categories first)

#### Priority Order (Recommended)

| Priority | Category | Rationale |
|----------|----------|-----------|
| 1 | **Bathroom Lighting** | High volume, moved from Lighting dept |
| 2 | **Tankless Water Heater** | High volume, moved from Heating & Cooling |
| 3 | **Kitchen Tile** | Moderate volume, moved from Flooring |
| 4 | **Shower Accessory** | New, likely high volume |
| 5 | **Tub and Shower Accessory** | New, likely high volume |
| 6 | **Pressure Valve** | New, plumbing essential |
| 7 | **Bathroom Cabinet Hardware** | Moved from Hardware |
| 8 | **Cabinet Hardware** | Duplicate issue to resolve |
| 9 | **Flush and Semi-Flush** | Lighting, moved |
| 10 | **Luxury Kitchen** | New, niche category |

---

### Phase 2 Workflow (Per Category)

For EACH category, complete ALL 6 steps before moving to next:

#### Step 1: Add to categories.json

**File:** `src/config/salesforce-picklists/categories.json`

**Template:**
```json
{
  "category_id": "GET_FROM_SALESFORCE",
  "category_name": "Bathroom Lighting",
  "category": "Bathroom Lighting",
  "department": "Plumbing & Bath",
  "department_name": "Plumbing & Bath",
  "family": "Bath",
  "family_name": "Bath",
  "subcategory": "Bathroom Lighting",
  "product_group": "Lighting"
}
```

**Where to get IDs:** From Salesforce Category picklist or pending sync data

---

#### Step 2: Add Type Mapping (if types exist)

**File:** `src/config/salesforce-picklists/category-type-mapping.json`

**Template:**
```json
{
  "department_name": "Plumbing & Bath",
  "family_name": "Bath",
  "category_name": "Bathroom Lighting",
  "category_id": "GET_FROM_SALESFORCE",
  "filter_label": "Bathroom Lighting Type",
  "logic": "Fixture type/mounting",
  "types": [
    {
      "type_name": "Vanity Light",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Sconce",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Ceiling Mount",
      "status": "existing",
      "primary_filter": true
    }
  ]
}
```

**If types DON'T exist yet:**
```json
{
  "category_name": "Luxury Kitchen",
  "category_id": "GET_FROM_SALESFORCE",
  "filter_label": "Luxury Kitchen Type",
  "logic": "Product type TBD",
  "types": []
}
```

---

#### Step 3: Add Style Mapping (if category-specific)

**File:** `src/config/salesforce-picklists/category-style-mapping.json`

**Most Plumbing & Bath categories use UNIVERSAL styles only:**
```json
// NO ENTRY NEEDED - uses universal_styles by default
```

**If category needs specific styles (rare):**
```json
{
  "department_name": "Plumbing & Bath",
  "family_name": "Bath",
  "category_name": "Luxury Kitchen",
  "styles": [
    {
      "style_name": "High-End Contemporary",
      "style_id": "GET_FROM_SF",
      "status": "existing"
    }
  ]
}
```

---

#### Step 4: Add Filter Attributes Schema

**File:** `src/config/salesforce-picklists/category-filter-attributes.json`

**Template for Bathroom Lighting:**
```json
{
  "category": "Bathroom Lighting",
  "primary_attributes": [
    "Brand",
    "Type",
    "Finish",
    "Width (Inches)"
  ],
  "top_5_filters": [
    "Type",
    "Finish",
    "Width (Inches)",
    "Number of Lights",
    "Style"
  ],
  "top_15_filters": [
    "Type",
    "Finish",
    "Width (Inches)",
    "Number of Lights",
    "Style",
    "Height (Inches)",
    "Bulb Type",
    "Wattage",
    "Voltage",
    "Dimmable",
    "Color Temperature",
    "Lumens",
    "Energy Star",
    "UL Listed",
    "Installation Type"
  ],
  "additional_attributes": [
    "Shade Material",
    "Backplate Dimensions",
    "Extension",
    "Weight (lbs)"
  ]
}
```

**Guidelines:**
- **primary_attributes:** 3-5 most important (always displayed)
- **top_5_filters:** Most commonly filtered attributes
- **top_15_filters:** Includes top_5 + next 10 most useful
- **additional_attributes:** Everything else relevant

---

#### Step 5: Add Title Generation Schema

**File:** `src/config/title-schema-by-category.ts`

**Template for Bathroom Lighting:**
```typescript
'Bathroom Lighting': {
  categoryName: 'Bathroom Lighting',
  slots: [
    { position: 1, attribute: 'Brand', required: true },
    { position: 2, attribute: 'Width (Inches)', required: false, format: '{value}-Inch' },
    { position: 3, attribute: 'Number of Lights', required: false, format: '{value}-Light' },
    { position: 4, attribute: 'Type', required: false },
    { position: 5, attribute: 'Category', required: true },
    { position: 6, attribute: 'Finish', required: false },
    { position: 7, attribute: 'Model Number', required: false }
  ],
  template: '{Brand} {Width (Inches)} {Number of Lights} {Type} {Category} {Finish} - {Model Number}',
  seoNotes: 'Bathroom lighting titles emphasize width and light count for shopping',
  examples: [
    'Minka Lavery 24-Inch 3-Light Vanity Light Bathroom Lighting Chrome - 6103-77',
    'Progress Lighting 18-Inch 2-Light Sconce Bathroom Lighting Brushed Nickel - P300078'
  ]
},
```

**Title Requirements:**
- Target length: 60-80 characters
- Include: Brand, key dimension, type, category, finish, model
- Use formatters for dimensions: `'Width (Inches)': 'dimension'` in ATTRIBUTE_FORMATTERS

---

#### Step 6: Validate & Test

**Run These Checks:**

```bash
# 1. TypeScript compilation
npm run build

# 2. Dependency validation
bash scripts/validate-dependencies.sh

# 3. Title system test
node scripts/audit-title-system.js

# 4. Picklist field validation
node scripts/audit-picklist-fields.js

# 5. SF vs Repo audit
node scripts/audit-sf-vs-repo-categories.js
```

**If validation passes:**
✅ Category is ready  
✅ Move to next category in priority list  
✅ Commit changes with descriptive message

**If validation fails:**
❌ Fix errors before proceeding  
❌ Re-run validation  
❌ Do NOT move to next category

---

## 6. UPDATE CHECKLIST (Per Category) {#checklist}

Use this checklist for EACH new category:

### Category: ___________________________

- [ ] **Step 0: Get Salesforce IDs**
  - [ ] Category ID from SF
  - [ ] Type IDs (if types exist)
  - [ ] Style IDs (if category-specific)

- [ ] **Step 1: categories.json**
  - [ ] Added category entry
  - [ ] Correct department assignment
  - [ ] Correct family assignment
  - [ ] Has category_id from SF

- [ ] **Step 2: category-type-mapping.json**
  - [ ] Added mapping entry (or empty types array)
  - [ ] Listed all valid types for category
  - [ ] Set primary_filter flags correctly

- [ ] **Step 3: category-style-mapping.json**
  - [ ] Confirmed uses universal styles (most common)
  - [ ] OR added category-specific styles (if needed)

- [ ] **Step 4: category-filter-attributes.json**
  - [ ] Defined primary_attributes (3-5)
  - [ ] Defined top_5_filters
  - [ ] Defined top_15_filters (includes top_5)
  - [ ] Listed additional_attributes

- [ ] **Step 5: title-schema-by-category.ts**
  - [ ] Added category schema
  - [ ] Defined slots with position/required/format
  - [ ] Created template matching slots
  - [ ] Added 2+ example titles
  - [ ] Verified examples are 60-80 chars

- [ ] **Step 6: Validation**
  - [ ] `npm run build` passes
  - [ ] `bash scripts/validate-dependencies.sh` passes
  - [ ] `node scripts/audit-title-system.js` passes (shows category)
  - [ ] `node scripts/audit-picklist-fields.js` passes
  - [ ] SF vs Repo audit shows category added

- [ ] **Step 7: Commit**
  - [ ] Committed with message: `feat(plumbing): Add [Category Name] category support`
  - [ ] Pushed to GitHub

---

## 7. EXAMPLE: Adding "Bathroom Lighting" (Complete Walkthrough)

### Step-by-Step Implementation

#### 1. Add to categories.json

```json
{
  "category_id": "a01Hu000012xyzABC",
  "category_name": "Bathroom Lighting",
  "category": "Bathroom Lighting",
  "department": "Plumbing & Bath",
  "department_name": "Plumbing & Bath",
  "family": "Bath",
  "family_name": "Bath",
  "subcategory": "Bathroom Lighting",
  "product_group": "Lighting"
}
```

#### 2. Add to category-type-mapping.json

```json
{
  "department_name": "Plumbing & Bath",
  "family_name": "Bath",
  "category_name": "Bathroom Lighting",
  "category_id": "a01Hu000012xyzABC",
  "filter_label": "Bathroom Lighting Type",
  "logic": "Mounting type and fixture style",
  "types": [
    { "type_name": "Vanity Light", "status": "existing", "primary_filter": true },
    { "type_name": "Sconce", "status": "existing", "primary_filter": true },
    { "type_name": "Ceiling Mount", "status": "existing", "primary_filter": true },
    { "type_name": "Pendant", "status": "existing", "primary_filter": true },
    { "type_name": "Mirror Light", "status": "existing", "primary_filter": true },
    { "type_name": "Accessory", "status": "existing", "primary_filter": false }
  ]
}
```

#### 3. Skip category-style-mapping.json (uses universal)

No entry needed - Bathroom Lighting uses universal styles.

#### 4. Add to category-filter-attributes.json

```json
{
  "category": "Bathroom Lighting",
  "primary_attributes": ["Brand", "Type", "Finish", "Width (Inches)"],
  "top_5_filters": ["Type", "Finish", "Width (Inches)", "Number of Lights", "Style"],
  "top_15_filters": [
    "Type", "Finish", "Width (Inches)", "Number of Lights", "Style",
    "Height (Inches)", "Bulb Type", "Wattage", "Voltage", "Dimmable",
    "Color Temperature", "Lumens", "Energy Star", "UL Listed", "Installation Type"
  ],
  "additional_attributes": ["Shade Material", "Backplate Dimensions", "Extension", "Weight (lbs)"]
}
```

#### 5. Add to title-schema-by-category.ts

```typescript
'Bathroom Lighting': {
  categoryName: 'Bathroom Lighting',
  slots: [
    { position: 1, attribute: 'Brand', required: true },
    { position: 2, attribute: 'Width (Inches)', required: false, format: '{value}-Inch' },
    { position: 3, attribute: 'Number of Lights', required: false, format: '{value}-Light' },
    { position: 4, attribute: 'Type', required: false },
    { position: 5, attribute: 'Category', required: true },
    { position: 6, attribute: 'Finish', required: false },
    { position: 7, attribute: 'Model Number', required: false }
  ],
  template: '{Brand} {Width (Inches)} {Number of Lights} {Type} {Category} {Finish} - {Model Number}',
  seoNotes: 'Bathroom lighting emphasizes dimensions and light count',
  examples: [
    'Minka Lavery 24-Inch 3-Light Vanity Light Bathroom Lighting Chrome - 6103-77',
    'Progress Lighting 18-Inch 2-Light Sconce Bathroom Lighting Brushed Nickel - P300058'
  ]
},
```

#### 6. Run Validation

```bash
npm run build && \
bash scripts/validate-dependencies.sh && \
node scripts/audit-title-system.js | grep "Bathroom Lighting" && \
node scripts/audit-sf-vs-repo-categories.js
```

#### 7. Commit

```bash
git add src/config/salesforce-picklists/categories.json \
        src/config/salesforce-picklists/category-type-mapping.json \
        src/config/salesforce-picklists/category-filter-attributes.json \
        src/config/title-schema-by-category.ts

git commit -m "feat(plumbing): Add Bathroom Lighting category support

- Added Bathroom Lighting to categories.json (Plumbing & Bath dept)
- Mapped 6 types: Vanity Light, Sconce, Ceiling Mount, Pendant, Mirror Light, Accessory
- Defined filter attributes (15 top filters)
- Created title schema with width and light count emphasis
- Validation: All checks passing"

git push origin main
```

---

## 8. CRITICAL NOTES

### ⚠️ Things That Will Break Verification

1. **Missing category_id** → Category validation fails
2. **Type not in types.json** → Type validation fails, generates Type_Request
3. **No title schema** → Title generation fails, uses fallback
4. **No filter attributes** → Attribute extraction incomplete
5. **Wrong department assignment** → Department_Verified incorrect

### ✅ Best Practices

1. **Work one category at a time** - don't update multiple simultaneously
2. **Validate after each category** - catch issues early
3. **Test with real Salesforce data** - send test products through verification
4. **Document as you go** - update this guide with lessons learned
5. **Backup before changes** - always have rollback option

### 🔄 Rollback Plan

If an update breaks verification:

```bash
# 1. Revert to backup
cp -r src/config/salesforce-picklists.backup-2026-03-03/* src/config/salesforce-picklists/

# 2. Rebuild TypeScript
npm run build

# 3. Restart service (if on production)
systemctl restart catalog-verification

# 4. Fix the issue locally
# 5. Re-validate
# 6. Try again
```

---

## 9. NEXT STEPS

**Immediate Actions:**

1. Review this document with team
2. Decide on category priority order for Plumbing & Bath
3. Get Salesforce Category/Type/Style IDs for new items
4. Start with Phase 1 (Add departments)
5. Begin Phase 2 with highest-priority category

**Questions to Answer Before Starting:**

- [ ] Do we have Salesforce IDs for all new categories?
- [ ] Do we have type lists for new categories?
- [ ] Do we want to tackle all 10 Plumbing categories or start with 3-5?
- [ ] Should we resolve duplicate categories (Cabinet Hardware, etc.) first?
- [ ] Do we need to coordinate with SF team on data quality issues?

---

**Document Version:** 1.0  
**Last Updated:** March 3, 2026  
**Maintained By:** Copilot AI Assistant
