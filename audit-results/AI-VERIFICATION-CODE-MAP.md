# AI Verification System - Comprehensive Code Map

Generated: February 8, 2026
Purpose: Document all logic, lists, and config files used by AI to generate results for Salesforce

---

## Executive Summary

The Catalog Verification API processes product data from Salesforce, uses AI (OpenAI/Anthropic) to verify and enrich product information, and returns validated data. Every field returned MUST match values from Salesforce picklists.

---

## 1. SALESFORCE PICKLISTS (Source of Truth)

All returned values MUST come from these files:

| File | Purpose | Item Count |
|------|---------|------------|
| `src/config/salesforce-picklists/brands.json` | Valid brand names & IDs | 344 brands |
| `src/config/salesforce-picklists/categories.json` | Valid category names & IDs | 212 categories |
| `src/config/salesforce-picklists/styles.json` | Valid style/type names & IDs | 666 styles |
| `src/config/salesforce-picklists/attributes.json` | Valid attribute names & IDs | 944 attributes |
| `src/config/salesforce-picklists/category-filter-attributes.json` | Category-specific attribute filters | Per-category |

### Picklist Structure

**brands.json**:
```json
{
  "brand_id": "a0MaZ000000ErAxUAK",
  "brand_name": "KOHLER"
}
```

**categories.json**:
```json
{
  "Category_Id": "a01aZ00000dC5DuQAK",
  "Category_Name": "Kitchen Faucet",
  "Product_Family": "Kitchen",
  "Department": "Plumbing & Bath",
  "SubCategory": "Kitchen Faucet"
}
```

**styles.json**:
```json
{
  "style_id": "a1IaZ000001UqLZUA0",
  "style_name": "Pull-Down",
  "category_id": "a01aZ00000dC5E4QAK"
}
```

---

## 2. VERIFICATION FLOW

### Main Entry Point
`POST /api/verify/salesforce` → `salesforce-async-verification.routes.ts`

### Processing Pipeline

```
Request → Controller → Async Processor → Dual AI Verification → Response Builder → Webhook to SF
```

| Step | File | Purpose |
|------|------|---------|
| 1 | `salesforce-async-verification.controller.ts` | Receives request, creates job |
| 2 | `async-verification-processor.service.ts` | Processes job queue |
| 3 | `dual-ai-verification.service.ts` | Main AI orchestration (277KB) |
| 4 | `ai-prompt-builder.service.ts` | Builds prompts with picklist data |
| 5 | `picklist-matcher.service.ts` | Validates AI output against picklists |
| 6 | `response-builder.service.ts` | Constructs final SF response |
| 7 | `webhook.service.ts` | Sends results back to Salesforce |

---

## 3. KEY SERVICE FILES

### 3.1 dual-ai-verification.service.ts (277KB)
**The main AI orchestration file.**

Key functions:
- `verifyProduct()` - Main entry, coordinates all verification
- `verifyWithOpenAI()` - Calls OpenAI for verification
- `verifyWithAnthropic()` - Calls Anthropic for verification
- `buildConsensus()` - Combines AI responses when they differ
- `validateAgainstPicklists()` - Ensures all values are from picklists

### 3.2 picklist-matcher.service.ts (57KB)
**Validates all output against Salesforce picklists.**

Key functions:
- `matchBrand()` - Finds exact brand from brands.json
- `matchCategory()` - Finds exact category from categories.json
- `matchStyle()` - Finds style valid for the category from styles.json
- `matchAttribute()` - Validates attribute is allowed for category

### 3.3 response-builder.service.ts (41KB)
**Builds the final response structure for Salesforce.**

Output structure:
```json
{
  "SF_Catalog_Id": "a03...",
  "SF_Catalog_Name": "SKU-123",
  "Primary_Attributes": {
    "Brand_Verified": "KOHLER",
    "Brand_Id": "a0M...",
    "Category_Verified": "Kitchen Faucet",
    "Category_Id": "a01...",
    "Product_Style_Verified": "Pull-Down",
    "Style_Id": "a1I...",
    ...
  }
}
```

### 3.4 seo-title-generator.service.ts (15KB)
**Generates SEO-optimized product titles.**

Rules:
- Max 80 characters
- Format: `{Brand} {Category} {Key Attributes} - {SKU}`
- NO features/benefits text
- Must use values from picklists

### 3.5 ai-prompt-builder.service.ts (22KB)
**Builds prompts for AI with picklist context.**

Includes:
- Valid brands list
- Valid categories list  
- Valid styles for selected category
- Valid attributes for selected category

---

## 4. CONFIG FILES (Mapping & Rules)

### 4.1 Category → Style Mapping
`src/config/category-style-mapping.ts`

Maps which styles are valid for each category:
```typescript
'Kitchen Faucet': {
  values: [
    { name: 'Pull-Down', id: 'a1I...' },
    { name: 'Pull-Out', id: 'a1I...' },
    { name: 'Single Handle', id: 'a1I...' }
  ]
}
```

### 4.2 Category → Title Schema
`src/config/title-schema-by-category.ts`

Defines which attributes to include in SEO titles per category:
```typescript
'kitchen faucet': {
  categoryName: 'Kitchen Faucet',
  priority: ['Finish', 'Mount Type', 'Handle Type'],
  modelNumber: true,
  maxLength: 80
}
```

### 4.3 Category Aliases
`src/config/category-aliases.ts`

Maps alternate category names to canonical names:
```typescript
'Kitchen Faucet': ['Kitchen Sink Faucet', 'Faucets - Kitchen']
```

### 4.4 Category Consolidation
`src/config/category-consolidation-mapping.ts`

Maps deprecated/old categories to current ones:
```typescript
'Bathtub Faucets': {
  parentCategory: 'Bathroom Faucet',
  suggestedType: 'Tub Faucet'
}
```

### 4.5 Category Attributes
`src/config/category-attributes.ts`

Defines which attributes are required/optional per category.

### 4.6 Master Category Schema Map
`src/config/master-category-schema-map.ts`

Flexible lookup supporting multiple input formats.

---

## 5. VALIDATION RULES

### 5.1 Brand Validation
- MUST exist in `brands.json`
- Returns `Brand_Id` and `Brand_Verified`

### 5.2 Category Validation  
- MUST exist in `categories.json`
- Returns `Category_Id`, `Category_Verified`, `SubCategory_Verified`, `Product_Family_Verified`, `Department_Verified`

### 5.3 Style Validation
- MUST exist in `styles.json`
- MUST be valid for the selected category
- Returns `Style_Id` and `Product_Style_Verified`

### 5.4 Attribute Validation
- Color/Finish MUST match allowed values
- Dimensions MUST be numeric
- MSRP MUST be numeric

### 5.5 SEO Title Rules
- Max 80 characters
- NO features or benefits text
- NO "Not Applicable" values
- Format varies by category (see title-schema-by-category.ts)

---

## 6. FIELDS RETURNED TO SALESFORCE

| Field | Source | Validation |
|-------|--------|------------|
| Brand_Verified | AI + picklist match | Must be in brands.json |
| Brand_Id | brands.json | Salesforce ID |
| Category_Verified | AI + picklist match | Must be in categories.json |
| Category_Id | categories.json | Salesforce ID |
| SubCategory_Verified | categories.json | From category record |
| Product_Family_Verified | categories.json | From category record |
| Department_Verified | categories.json | From category record |
| Product_Style_Verified | AI + picklist match | Must be in styles.json for category |
| Style_Id | styles.json | Salesforce ID |
| Color_Verified | AI extraction | Should be from attributes |
| Finish_Verified | AI extraction | Should be from attributes |
| Depth_Verified | AI extraction | Numeric, in inches |
| Width_Verified | AI extraction | Numeric, in inches |
| Height_Verified | AI extraction | Numeric, in inches |
| Weight_Verified | AI extraction | Numeric, in lbs |
| MSRP_Verified | AI extraction | Numeric |
| Description_Verified | AI generated | Max 500 chars |
| Product_Title_Verified | SEO generator | Max 80 chars, formula-based |
| Details_Verified | AI generated | Key product details |
| Features_List_HTML | AI generated | HTML ul/li format |

---

## 7. AUDIT CHECKLIST

For each result sent to Salesforce, verify:

- [ ] `Brand_Verified` exists in brands.json
- [ ] `Brand_Id` is correct for that brand
- [ ] `Category_Verified` exists in categories.json
- [ ] `Category_Id` is correct for that category
- [ ] `SubCategory_Verified` matches category record
- [ ] `Product_Family_Verified` matches category record
- [ ] `Department_Verified` matches category record
- [ ] `Product_Style_Verified` exists in styles.json
- [ ] `Style_Id` is correct for that style
- [ ] Style is valid for the selected category
- [ ] `Product_Title_Verified` is ≤80 characters
- [ ] `Product_Title_Verified` contains NO features text
- [ ] `Product_Title_Verified` contains NO "Not Applicable"
- [ ] Dimensions are numeric values
- [ ] MSRP is numeric

---

## 8. FILES FOR AUDIT SCRIPT

To run a complete audit, these files are needed:

**Picklists (source of truth):**
- `src/config/salesforce-picklists/brands.json`
- `src/config/salesforce-picklists/categories.json`
- `src/config/salesforce-picklists/styles.json`
- `src/config/salesforce-picklists/attributes.json`

**Results file:**
- `audit-results/audit-jobs-since-2-5-2026.json` (997 completed jobs)

**Validation logic:**
- `src/services/picklist-matcher.service.ts`
- `src/services/response-builder.service.ts`
- `src/services/seo-title-generator.service.ts`
