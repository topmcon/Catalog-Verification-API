# 📁 Picklist-Master Organization Structure
**Updated:** February 9, 2026  
**Type Hierarchy Integration:** ✅ Complete

## 🎯 NEW Product Hierarchy (5 Levels)
```
Department (10) → Family (8) → Category (640) → TYPE (8,060) → Style (97)
                                                    ⭐ NEW LAYER
```

---

## 📁 Folder Structure (8 Folders)

```
📁 /workspaces/Catalog-Verification-API/src/
│
├── 📁 picklist-master/
│   │
│   ├── 📁 01-brands/
│   │   ├── 📄 brand-config.ts
│   │   └── 📄 README.md
│   │
│   ├── 📁 02-categories/
│   │   ├── 📄 category-config.ts
│   │   ├── 📄 master-category-schema-map.ts
│   │   └── 📄 README.md
│   │
│   ├── 📁 03-types/ ⭐ NEW
│   │   ├── 📄 type-config.ts
│   │   └── 📄 README.md
│   │
│   ├── 📁 04-departments-families/ ⭐ NEW
│   │   ├── 📄 department-family-config.ts
│   │   └── 📄 README.md
│   │
│   ├── 📁 05-styles/
│   │   ├── 📄 style-config.ts
│   │   └── 📄 README.md
│   │
│   ├── 📁 06-attributes/
│   │   ├── 📄 attribute-config.ts
│   │   ├── 📄 category-attributes.ts
│   │   └── 📁 schemas/
│   │       ├── 📄 plumbing-schemas.ts
│   │       ├── 📄 lighting-schemas.ts
│   │       ├── 📄 home-decor-hvac-schemas.ts
│   │       ├── 📄 additional-appliance-schemas.ts
│   │       └── 📄 complete-category-schemas.ts
│   │
│   ├── 📁 07-category-filter-attributes/
│   │   ├── 📄 lookups.ts
│   │   └── 📄 response-builder-config.ts
│   │
│   └── 📁 08-multiple-picklist-files/
│       ├── 📄 dual-ai-verification.service.ts
│       ├── 📄 response-builder.service.ts
│       └── 📄 README.md
│
├── 📁 config/
│   ├── 📁 salesforce-picklists/
│   │   ├── 📄 brands.json ⭐ [SALESFORCE PICKLIST]
│   │   ├── 📄 categories.json ⭐ [SALESFORCE PICKLIST]
│   │   ├── 📄 styles.json ⭐ [SALESFORCE PICKLIST]
│   │   ├── 📄 attributes.json ⭐ [SALESFORCE PICKLIST]
│   │   ├── 📄 category-filter-attributes.json ⭐ [SALESFORCE PICKLIST]
│   │   ├── 📄 types.json ⭐ [SALESFORCE PICKLIST] NEW
│   │   ├── 📄 departments.json ⭐ [SALESFORCE PICKLIST] NEW
│   │   ├── 📄 families.json ⭐ [SALESFORCE PICKLIST] NEW
│   │   ├── 📄 category-type-mapping.json ⭐ [SALESFORCE PICKLIST] NEW
│   │   ├── 📄 category-style-mapping.json ⭐ [SALESFORCE PICKLIST] NEW
│   │   └── 📁 backups/
│   │       └── 📁 pre-type-integration-20260209/
│   │           ├── categories.json
│   │           ├── category-filter-attributes.json
│   │           └── styles.json
│   │
│   ├── 📄 index.ts (Main export hub)
│   ├── 📄 type-prompts.ts ⭐ NEW (AI prompt generation for Types)
│   ├── 📄 category-config.ts
│   ├── 📄 category-attributes.ts
│   ├── 📄 category-style-mapping.ts
│   ├── 📄 constants.ts
│   └── 📄 lookups.ts
│
└── 📁 services/
    ├── 📄 type-matcher.service.ts ⭐ NEW (Type picklist matching)
    ├── 📄 picklist-matcher.service.ts
    ├── 📄 dual-ai-verification.service.ts (Updated for Type)
    ├── 📄 response-builder.service.ts (Updated for Type)
    └── 📄 salesforce-verification.service.ts (Updated for Type)
```

---

## 📄 Salesforce Picklist Files (10 Total)

### Original Picklists (5)
| File | Records | Fields | Sync Method |
|------|---------|--------|-------------|
| **brands.json** | ~85 | brand_id, brand_name | POST /api/picklists/sync |
| **categories.json** | 640 | category_id, category_name, department, family | POST /api/picklists/sync |
| **styles.json** | 97 | style_id, style_name | POST /api/picklists/sync |
| **attributes.json** | ~250 | attribute_id, attribute_name | POST /api/picklists/sync |
| **category-filter-attributes.json** | ~3,800 | rank, category_name, category_id, attribute_name, attribute_id | POST /api/picklists/sync |

### NEW Picklists (5) ⭐
| File | Lines | Fields | Purpose |
|------|-------|--------|---------|
| **types.json** | 8,060 | type_id, type_name, status, applicable_categories | Type variations within categories |
| **departments.json** | 31 | department_name | Top-level hierarchy (10 depts) |
| **families.json** | 33 | family_name, department_name | Product families (8 families) |
| **category-type-mapping.json** | 3,186 | department, family, category, types[], filter_label, logic | Category→Type relationships |
| **category-style-mapping.json** | 94 | category, department, family, styles[] | Category→Style relationships |

---

## 📁 01-Brands/

### 📄 brands.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/brands.json`  
**Structure:**
```json
[
  {
    "brand_id": "a015e000003xxxAAA",
    "brand_name": "Café Appliances"
  }
]
```

### 📝 DEPENDENT FILES (Update when brands.json changes)

#### text-cleaner.ts
**Location:** `src/utils/text-cleaner.ts`  
**Contains:** `BRAND_CORRECTIONS` (~70 mappings)  
**Action when brands.json updates:**
- Add new brand capitalization rules
- Example: `'cafe appliances': 'Café Appliances'`
- Fix encoding issues for special characters

#### constants.ts (Brand Tier Sections)
**Location:** `src/config/constants.ts`  
**Contains:**
- `PREMIUM_BRANDS` (30 brands)
- `MID_TIER_BRANDS` (19 brands)
- `VALUE_BRANDS` (14 brands)

**Action when brands.json updates:**
- Classify new brands into appropriate tier
- Consider price point and market positioning

---

## 📁 02-Categories/

### 📄 categories.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/categories.json`  
**Structure:**
```json
[
  {
    "category_id": "a025e000003xxxAAA",
    "category_name": "Refrigerator",
    "department": "Appliances",
    "family": "Major Appliances"
  }
]
```
**Records:** 640 categories  
**NEW Fields:** `department`, `family` (added in Type integration)

### 📝 DEPENDENT FILES (Update when categories.json changes)

#### category-matcher.service.ts
**Location:** `src/services/category-matcher.service.ts`  
**Contains:** `DEPARTMENT_CATEGORIES` (auto-generated)  
**Action when categories.json updates:**
- ⚠️ **CRITICAL:** Run regeneration script
- Verify department mappings match
- Check for new departments

#### constants.ts (Category Aliases Section)
**Location:** `src/config/constants.ts`  
**Contains:** `CATEGORY_NAME_ALIASES`  
**Action when categories.json updates:**
- Add plural/variant forms for new categories
- Example: `'Wine Cooler': ['Wine Coolers', 'Wine Refrigerator', 'Wine Fridge']`

#### category-consolidation-mapping.ts
**Location:** `src/config/category-consolidation-mapping.ts`  
**Contains:** `CATEGORY_REMAPPING` (deprecated → parent)  
**Action when categories.json updates:**
- If category REMOVED: Add to remapping with parent category
- If category ADDED: Remove from remapping if it was restored
- Example: `'Old Category Name': 'New Parent Category'`

#### category-aliases.ts
**Location:** `src/config/category-aliases.ts`  
**Contains:** `CATEGORY_ALIASES` (variant names)  
**Action when categories.json updates:**
- Add common variations for new categories
- Include misspellings, abbreviations, trade names

#### family-category-mapping.ts
**Location:** `src/config/family-category-mapping.ts`  
**Contains:** `FAMILY_CATEGORY_MAPPINGS`  
**Structure:** `Department → Family → Categories[]`  
**Action when categories.json updates:**
- Update hierarchy if department/family changed
- Verify family relationships

#### master-category-schema-map.ts
**Location:** `src/picklist-master/02-categories/master-category-schema-map.ts`  
**Contains:** All category name → schema mappings (881 lines)  
**Action when categories.json updates:**
- Add new category with all name variations
- Map to appropriate attribute schema
- Include aliases in mapping

---

## 📁 03-Types/ ⭐ NEW

### 📄 types.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/types.json`  
**Structure:**
```json
[
  {
    "type_name": "4-Door Flex",
    "type_id": "a035e000003xxxAAA",
    "status": "existing",
    "applicable_categories": [
      {
        "department": "Appliances",
        "category_name": "Refrigerator"
      }
    ]
  }
]
```
**Records:** 8,060 type variations  
**Purpose:** Functional variations within categories (middle layer between Category and Style)

### 📄 category-type-mapping.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/category-type-mapping.json`  
**Structure:**
```json
{
  "metadata": {
    "version": "2.0",
    "hierarchy": "Department → Family → Category → Type → Style"
  },
  "mappings": [
    {
      "department_name": "Appliances",
      "family_name": "Major Appliances",
      "category_name": "Refrigerator",
      "category_id": "a025e000003xxxAAA",
      "filter_label": "Refrigerator Configuration",
      "logic": "Structural type of refrigerator",
      "types": [
        {
          "type_name": "French Door",
          "type_id": "a035e000003xxxAAA",
          "status": "existing",
          "primary_filter": true
        }
      ]
    }
  ]
}
```
**Records:** 3,186 lines mapping categories to types

### 📄 type-config.ts
**Location:** `src/picklist-master/03-types/type-config.ts`  
**Purpose:** Type picklist support and helper functions  
**Exports:**
- `TYPES` - All type picklist items
- `CATEGORY_TYPE_MAPPINGS` - Category→Type relationships
- `getTypesForCategory(categoryName)` - Get all types for a category
- `getTypeById(typeId)` - Look up type by ID
- `getTypeByName(typeName)` - Look up type by name
- `getCategoryTypeMapping(categoryName)` - Get mapping for category
- `isValidTypeForCategory(typeName, categoryName)` - Validate type
- `getAllTypeNames()` - Get all type names
- `getPrimaryTypesForCategory(categoryName)` - Get primary filter types
- `getTypeContext(typeName)` - Get dept/family/category for type

### 📝 DEPENDENT FILES (Update when types.json changes)

#### type-prompts.ts
**Location:** `src/config/type-prompts.ts`  
**Contains:** AI prompt generation for Type hierarchy  
**Functions:**
- `getAllCategoriesWithTypesForPrompt()` - Format all types for AI
- `getTypesForCategoryPrompt(categoryName)` - Format types for specific category
- `getTypeHierarchyExplanation()` - Explain Type layer to AI

**Action when types.json updates:**
- Usually auto-updates (loads JSON dynamically)
- Verify prompt formatting still works
- Test AI receives correct type options

#### type-matcher.service.ts
**Location:** `src/services/type-matcher.service.ts`  
**Contains:** Type matching logic (like brand-matcher, style-matcher)  
**Functions:**
- `matchTypeToPicklist(aiType, category)` - Match AI type to SF picklist
- `validateTypeForCategory(typeName, categoryName)` - Validate type

**Action when types.json updates:**
- Usually auto-updates (loads from type-config.ts)
- Adjust fuzzy matching thresholds if needed
- Test matching accuracy

#### dual-ai-verification.service.ts
**Location:** `src/services/dual-ai-verification.service.ts`  
**Updated:** AI prompts now include Type hierarchy  
**Action when types.json updates:**
- Verify AI receives updated type list
- Test AI selects appropriate types
- Check Type_Verified field population

---

## 📁 04-Departments-Families/ ⭐ NEW

### 📄 departments.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/departments.json`  
**Structure:**
```json
[
  {
    "department_name": "Appliances"
  },
  {
    "department_name": "Lighting"
  }
]
```
**Records:** 10 departments (top-level hierarchy)

### 📄 families.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/families.json`  
**Structure:**
```json
[
  {
    "family_name": "Major Appliances",
    "department_name": "Appliances"
  },
  {
    "family_name": "Small Appliances",
    "department_name": "Appliances"
  }
]
```
**Records:** 8 families (second-level hierarchy)

### 📄 department-family-config.ts
**Location:** `src/picklist-master/04-departments-families/department-family-config.ts`  
**Purpose:** Department and Family hierarchy support  
**Exports:**
- `DEPARTMENTS` - All department picklist items
- `FAMILIES` - All family picklist items
- `getAllDepartmentNames()` - Get all 10 departments
- `getAllFamilyNames()` - Get all 8 families
- `getFamiliesForDepartment(departmentName)` - Get families in a department
- `getDepartmentForFamily(familyName)` - Get department containing a family
- `isDepartment(name)` - Check if department exists
- `isFamily(name)` - Check if family exists

### 📝 DEPENDENT FILES
**Action when departments.json or families.json updates:**
- Usually auto-updates (loads JSON dynamically)
- Verify hierarchy relationships maintained
- Update categories.json if new departments/families added

---

## 📁 05-Styles/ (Renumbered from 03)

### 📄 styles.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/styles.json`  
**Structure:**
```json
[
  {
    "style_id": "a045e000003xxxAAA",
    "style_name": "French Door"
  }
]
```
**Records:** 97 styles (was 2,665 - **96% reduction!**)  
**Note:** Massive consolidation through Type hierarchy implementation

### 📄 category-style-mapping.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/category-style-mapping.json`  
**Structure:**
```json
{
  "metadata": {
    "version": "2.0",
    "note": "Category to Style mappings (replaces hardcoded TypeScript)"
  },
  "mappings": [
    {
      "category": "Refrigerator",
      "department": "Appliances",
      "family": "Major Appliances",
      "styles": [
        "French Door",
        "Side-by-Side",
        "Top Freezer"
      ]
    }
  ]
}
```
**Records:** 94 lines  
**Purpose:** Category→Style relationships (replaces TypeScript hardcoded mappings)

### 📝 DEPENDENT FILES (Update when styles.json changes)

#### category-style-mapping.ts
**Location:** `src/config/category-style-mapping.ts`  
**Contains:** Category → Valid Styles mappings  
**Action when styles.json updates:**
- Add new styles to appropriate categories
- **Regenerate using:**
  ```bash
  node scripts/regenerate-category-style-mapping.js
  ```
- Verify UNIVERSAL_DESIGN_STYLES list
- Check LIGHTING_CATEGORIES and SHOWER_PLUMBING_CATEGORIES

#### Constants requiring manual update:
**Location:** `src/services/dual-ai-verification.service.ts`
- `AESTHETIC_STYLES` - Design styles to avoid (synced from UNIVERSAL_DESIGN_STYLES)

---

## 📁 06-Attributes/ (Renumbered from 04)

### 📄 attributes.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/attributes.json`  
**Structure:**
```json
[
  {
    "attribute_id": "a055e000003xxxAAA",
    "attribute_name": "Total Capacity"
  }
]
```
**Records:** ~250 attributes

### 📝 DEPENDENT FILES (Update when attributes.json changes)

#### constants.ts (AI_FALLBACK_ATTRIBUTES Section)
**Location:** `src/config/constants.ts`  
**Contains:** Fallback attribute lists per category  
**Action when attributes.json updates:**
- ⚠️ **CRITICAL:** Attribute names MUST match exactly
- Add new attributes to relevant category arrays
- Remove deprecated attributes
- Verify case-sensitive matching

#### picklist-matcher.service.ts (ATTRIBUTE_ALIASES Section)
**Location:** `src/services/picklist-matcher.service.ts`  
**Contains:** `ATTRIBUTE_ALIASES` (~100+ mappings)  
**Purpose:** AI term → Salesforce attribute name  
**Action when attributes.json updates:**
- Add aliases for new attributes based on AI behavior
- Example: `'drawer size': 'Drawer Capacity'`
- Monitor AI output for new terms needing mapping

#### category-attributes.ts
**Location:** `src/picklist-master/06-attributes/category-attributes.ts`  
**Contains:** Main category schemas (18 categories)  
**Action when attributes.json updates:**
- Update `top15FilterAttributes` arrays
- Update `htmlTableAttributes` arrays
- Add new attributes to relevant categories
- Verify attribute names match exactly

#### schemas/ (Category-Specific Schemas)
**Location:** `src/picklist-master/06-attributes/schemas/`

Files:
- `plumbing-schemas.ts` (7 categories)
- `lighting-schemas.ts` (7 categories)  
- `home-decor-hvac-schemas.ts` (6 categories)
- `additional-appliance-schemas.ts` (8 categories)
- `complete-category-schemas.ts` (25+ categories)

**Action when attributes.json updates:**
- Update attribute lists in each schema
- Ensure attribute names match exactly (case-sensitive)
- Verify top15 vs htmlTable placement

---

## 📁 07-Category-Filter-Attributes/ (Renumbered from 05)

### 📄 category-filter-attributes.json ⭐ [SALESFORCE PICKLIST]
**Location:** `src/config/salesforce-picklists/category-filter-attributes.json`  
**Structure:**
```json
[
  {
    "rank": 1,
    "category_name": "Refrigerator",
    "category_id": "a025e000003xxxAAA",
    "attribute_name": "Total Capacity",
    "attribute_id": "a055e000003xxxAAA"
  }
]
```
**Records:** ~3,800 ranked attribute assignments  
**Size:** 11,467 lines (was 17,100 - **33% reduction!**)

### 📝 DEPENDENT FILES (Update when category-filter-attributes.json changes)

#### lookups.ts
**Location:** `src/picklist-master/07-category-filter-attributes/lookups.ts`  
**Contains:**
- `getOptimizedFilterAttributes(category)` - Get top 15 for category
- `getCategoryConfig(category)` - Get category schema
- `getAllResponseBuilderCategories()` - List all categories

**Action when category-filter-attributes.json updates:**
- Usually auto-updates (loads JSON dynamically)
- Verify loading logic still works
- Test getTop15Attributes() returns correct rankings

#### response-builder-config.ts
**Location:** `src/picklist-master/07-category-filter-attributes/response-builder-config.ts`  
**Contains:** Response builder schema configurations  
**Action when category-filter-attributes.json updates:**
- Usually auto-updates
- Verify schema structure matches

---

## 📁 08-Multiple-Picklist-Files/ (Renumbered from 06)

### 📝 FILES USING 2+ PICKLISTS (Review when ANY picklist changes)

#### picklist-matcher.service.ts
**Location:** `src/services/picklist-matcher.service.ts`  
**Uses:** ALL 10 picklists  
**Contains:**
- Brand matching logic + `BRAND_ALIASES`
- Category matching logic + `CATEGORY_ALIASES`
- Style matching logic
- Attribute matching logic + `ATTRIBUTE_ALIASES`
- Type matching (TODO - not yet implemented)
- `KNOWN_ATTRIBUTE_VALUES` (value normalization)

**Action when picklists update:**
- Update matching thresholds if accuracy drops
- Add new aliases discovered from AI behavior
- Test fuzzy matching with new values

#### dual-ai-verification.service.ts
**Location:** `src/services/dual-ai-verification.service.ts`  
**Size:** 6,898 lines  
**Uses:** brands, categories, types, styles, attributes, category-filter-attributes  
**Contains:**
- AI prompt building with all picklists
- Type hierarchy prompts ⭐ NEW
- Picklist validation logic
- Consensus building

**Recent Changes:**
- Added Type hierarchy to AI prompts
- Added `product_type` to AI JSON response format
- Added Type_Verified and Type_Id to PrimaryDisplayAttributes
- Updated system prompt with Type explanation

**Action when picklists update:**
- Update AI prompts with new options
- Verify AI receives correct picklist data
- Test consensus validation with new values

#### response-builder.service.ts
**Location:** `src/services/response-builder.service.ts`  
**Uses:** categories, attributes, category-filter-attributes, types ⭐ NEW  
**Contains:**
- Primary attributes assembly
- Top 15 filter attributes builder
- Additional attributes HTML table generation

**Recent Changes:**
- Added Type_Verified field (currently 'Not Applicable')
- Added Type_Id field (ready for Type matching)

**Action when picklists update:**
- Verify response structure matches SF expectations
- Test buildTopFilterAttributes() with new attributes
- Check buildPrimaryAttributes() includes new fields

#### salesforce-verification.service.ts
**Location:** `src/services/salesforce-verification.service.ts`  
**Uses:** brands, categories, types ⭐ NEW  
**Contains:**
- Consensus-based verification
- Fallback verification logic
- Primary attributes building

**Recent Changes:**
- Added Type_Verified from `product_type` consensus
- Added Type_Id field (TODO: Add Type picklist matching)

**Action when picklists update:**
- Update consensus value extraction
- Verify fallback logic works with new values

#### consensus.service.ts
**Location:** `src/services/consensus.service.ts`  
**Uses:** ALL 10 picklists  
**Contains:**
- Consensus validation across AIs
- Picklist re-matching
- Disagreement resolution

**Action when picklists update:**
- Verify consensus logic still works
- Test re-matching with updated picklists
- Check threshold calculations

#### title-generator.service.ts
**Location:** `src/services/title-generator.service.ts`  
**Uses:** brands, categories, types ⭐ NEW, styles  
**Contains:** SEO-optimized title generation  
**Action when picklists update:**
- Test title generation with new values
- Verify brand capitalization
- Check category/type/style inclusion

#### openai.service.ts & xai.service.ts
**Location:** `src/services/`  
**Uses:** categories, types ⭐ NEW, styles, attributes (in prompts)  
**Contains:** AI prompt generation  
**Action when picklists update:**
- Update prompt templates
- Verify AI receives correct options
- Test prompt size doesn't exceed limits

#### enrichment.service.ts
**Location:** `src/services/enrichment.service.ts`  
**Uses:** categories, attributes, category-filter-attributes  
**Contains:** Product data enrichment  
**Action when picklists update:**
- Verify enrichment rules work with new categories
- Test attribute mapping logic

---

## 🛠️ Hardcoded Lists Requiring Manual Sync

### ⚠️ CRITICAL: These TypeScript constants MUST match source JSON picklists

| TypeScript File | Constant | Source JSON | Sync Status | Last Check |
|----------------|----------|-------------|-------------|------------|
| `category-matcher.service.ts` | `DEPARTMENT_CATEGORIES` | categories.json | ✅ IN SYNC | 2026-02-09 |
| `dual-ai-verification.service.ts` | `LIGHTING_CATEGORIES` | category-type-mapping.json | ✅ REMOVED (now dynamic) | 2026-02-09 |
| `dual-ai-verification.service.ts` | `SHOWER_PLUMBING_CATEGORIES` | category-type-mapping.json | ✅ REMOVED (now dynamic) | 2026-02-09 |
| `dual-ai-verification.service.ts` | `VALID_SHOWER_STYLES` | category-style-mapping.json | ✅ REMOVED (now dynamic) | 2026-02-09 |
| `constants.ts` | `CATEGORY_NAME_ALIASES` | categories.json | ⚠️ MANUAL SYNC | 2026-02-05 |
| `constants.ts` | `AI_FALLBACK_ATTRIBUTES` | attributes.json | ⚠️ MANUAL SYNC | 2026-02-05 |

**Verification Command:**
```bash
node scripts/verification-api-accuracy-audit.js
```
Checks "Hardcoded Lists Sync Status" section.

**Regeneration Script:**
```bash
node scripts/regenerate-hardcoded-lists.js
```
Updates hardcoded constants from source JSON files.

---

## 📊 Picklist Statistics

| Picklist | Records | Size | Change from Original |
|----------|---------|------|---------------------|
| **brands.json** | ~85 | ~3 KB | Stable |
| **categories.json** | 640 | 46 KB | +department, +family fields |
| **types.json** ⭐ NEW | 8,060 | 504 KB | - |
| **departments.json** ⭐ NEW | 10 | 1 KB | - |
| **families.json** ⭐ NEW | 8 | 1 KB | - |
| **styles.json** | 97 | 4 KB | **-96% (was 2,665)** |
| **attributes.json** | ~250 | ~10 KB | Stable |
| **category-filter-attributes.json** | ~3,800 | 352 KB | **-33% (was 527 KB)** |
| **category-type-mapping.json** ⭐ NEW | 640 mappings | 153 KB | - |
| **category-style-mapping.json** ⭐ NEW | 94 mappings | 4 KB | - |
| **TOTAL** | **13,684 records** | **1.08 MB** | **+8,060 types, cleaned/optimized** |

---

## 🔄 Picklist Sync System

### How Salesforce Updates Our Picklists (Automated)

1. **Salesforce Pushes Updates**: `POST /api/picklists/sync` with updated data
2. **API Receives & Validates**: Production server processes sync request
3. **Files Updated**: JSON files in `src/config/salesforce-picklists/` updated
4. **Sync Logged**: Audit trail saved to `PicklistSyncLog` collection (MongoDB)
5. **Catalog Index Updated**: Internal catalog marks items as "in Salesforce"
6. **Auto-Commit**: Cron job (every 5 min) commits changes to GitHub

### Checking Recent Picklist Updates

```bash
# Show last picklist sync (production server)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && node scripts/check-picklist-sync-status.js"
```

### Picklist Management Tools

| Script | Purpose | Run From |
|--------|---------|----------|
| `check-picklist-sync-status.js` | Show last sync details | Production (SSH) |
| `auto-sync-picklists.sh` | Auto-commit to GitHub (cron: every 5 min) | Production (cron) |
| `sync-picklists-from-production.js` | Download production picklists to local | Local |
| `audit-picklist-fields.js` | Verify field names match code | Local or Production |
| `send-styles-to-salesforce.js` | Push styles TO Salesforce | Admin only |
| `send-category-filters-to-salesforce.js` | Push filters TO Salesforce | Admin only |

---

## 🧪 Testing & Validation

### Build Test
```bash
npm run build
```
**Status:** ✅ PASSING (0 errors)

### Picklist Audit
```bash
node scripts/audit-picklist-fields.js
```
Verifies:
- JSON structure validity
- Field name consistency  
- Code references to picklist fields
- Hardcoded lists sync status

### API Accuracy Report
```bash
# Production server
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"
```
Checks:
- Brand_Verified → brands.json
- Category_Verified → categories.json (singular form)
- Type_Verified → types.json ⭐ NEW
- Product_Style_Verified → styles.json
- Hardcoded lists sync status

---

## 📝 When to Update Each File

### On Salesforce Picklist Sync (Automated)
✅ JSON files auto-update  
✅ Cron auto-commits to GitHub  
⚠️ Manual updates may be needed for TypeScript constants

### When brands.json Updates
1. `text-cleaner.ts` - Add brand capitalization rules
2. `constants.ts` - Classify into brand tiers
3. Test: Title generation, brand matching

### When categories.json Updates
1. ⚠️ **CRITICAL:** Run `regenerate-hardcoded-lists.js`
2. `constants.ts` - Add category aliases
3. `category-consolidation-mapping.ts` - Handle deprecated categories
4. `category-aliases.ts` - Add variant names
5. `family-category-mapping.ts` - Update hierarchy
6. `master-category-schema-map.ts` - Add schema mappings
7. Test: Category matching, attribute selection

### When types.json Updates ⭐ NEW
1. Usually auto-updates (loads JSON dynamically)
2. Verify `type-prompts.ts` generates correct AI prompts
3. Test `type-matcher.service.ts` matching accuracy
4. Test AI selects appropriate types
5. Verify Type_Verified population

### When styles.json Updates
1. ⚠️ **CRITICAL:** Run `regenerate-category-style-mapping.js`
2. `category-style-mapping.ts` - Add to category mappings
3. Test: Style matching, style validation

### When attributes.json Updates
1. ⚠️ **CRITICAL:** Attribute names must match EXACTLY (case-sensitive)
2. `constants.ts` - Update AI_FALLBACK_ATTRIBUTES
3. `picklist-matcher.service.ts` - Add ATTRIBUTE_ALIASES
4. `category-attributes.ts` - Update schemas
5. `schemas/*.ts` - Update category schemas
6. Test: Attribute matching, top 15 selection

### When category-filter-attributes.json Updates
1. Usually auto-updates (loads JSON dynamically)
2. Verify `lookups.ts` still works
3. Test: Top 15 attribute ranking

---

## 🚀 Quick Reference

### Most Important Files to Update Manually
1. `text-cleaner.ts` - Brand corrections
2. `constants.ts` - Aliases, fallbacks, tiers
3. `master-category-schema-map.ts` - Category schemas
4. `category-style-mapping.ts` - Style mappings

### Files That Auto-Update
1. All JSON files in `src/config/salesforce-picklists/`
2. `type-config.ts` (loads types.json)
3. `department-family-config.ts` (loads departments/families)
4. `lookups.ts` (loads category-filter-attributes)

### Critical Regeneration Scripts
```bash
# Regenerate hardcoded TypeScript constants from JSON
node scripts/regenerate-hardcoded-lists.js

# Regenerate category-style mappings
node scripts/regenerate-category-style-mapping.js

# Audit picklist field consistency
node scripts/audit-picklist-fields.js

# Check accuracy (production)
node scripts/verification-api-accuracy-audit.js
```

---

## 📋 Update Checklist

When Salesforce syncs picklists:

- [ ] Verify JSON files updated in `src/config/salesforce-picklists/`
- [ ] Check auto-commit to GitHub succeeded
- [ ] Run `audit-picklist-fields.js` to verify field names
- [ ] Run `regenerate-hardcoded-lists.js` if categories changed
- [ ] Update brand corrections in `text-cleaner.ts` if needed
- [ ] Update category aliases in `constants.ts` if needed
- [ ] Test build: `npm run build`
- [ ] Test API accuracy: Run accuracy audit script
- [ ] Deploy to production if manual changes made
- [ ] Verify hardcoded lists show "IN SYNC" in accuracy report

---

**Last Updated:** February 9, 2026  
**Type Integration:** ✅ Complete  
**Build Status:** ✅ Passing  
**Total Picklists:** 10 (5 original + 5 new)
