# Complete Fix Plan - Catalog Verification API Data Issues
**Date**: 2026-02-21  
**Status**: Action Required - Multiple Critical Issues Identified

---

## 📋 EXECUTIVE SUMMARY

**Discovery**: 25% of products (6/24 categories) in audit dataset were assigned non-existent or incorrect categories due to AI seeing wrong category list + no hierarchical validation.

**Root Causes Identified**:
1. ✅ **categories.json contaminated** with 8 entries that are actually types (proven)
2. ✅ **category-filter-attributes.json is correct** - AI should use this as master (proven)
3. ❌ **No hierarchical validation** - AI sees 169 categories from 11 departments at once
4. ❌ **AI analyzes data twice** - Same product data sent in Stage 1 and Stage 2
5. ❌ **No category validation** - System accepts any category AI suggests

**Impact**: 32% semantic violations, 25% non-existent categories, missing critical specs → poor search/customer experience

---

## 🔍 PART 1: WHAT WE DISCOVERED

### Discovery #1: Two Category Files Out of Sync ⚠️ **ROOT CAUSE**

**Files**:
- `src/config/salesforce-picklists/category-filter-attributes.json` - 169 categories ✅ **CORRECT**
- `src/config/salesforce-picklists/categories.json` - 177 categories ❌ **CONTAMINATED**

**Problem**: 
- AI sees categories from category-filter-attributes.json (169)
- System validates against categories.json (177)
- 8 categories exist in validation but NOT in AI prompt

**What's Wrong**:
```
categories.json has 8 EXTRA entries:
1. Wine Cooler       ← TYPE (ID: a1jaZ000001lFDJQA2) mistakenly added as category
2. Beverage Center   ← TYPE (ID: a1jaZ000001lF3gQAE) mistakenly added as category
3. Outdoor Lighting  ← TYPE (ID: a1jaZ000001lF8uQAE) mistakenly added as category
4. Cabinet Hardware  ← Over-specific, should be TYPE under Door Hardware
5. Laundry Sink      ← Over-specific, should be TYPE under Kitchen Sink
6. Utility Sink      ← Over-specific, should be TYPE under Kitchen Sink
7. Carpet            ← Over-specific, should be TYPE under Flooring
8. Home Accents      ← Over-specific, should be types under decor categories
```

**Proof**:
- Wine Cooler, Beverage Center, Outdoor Lighting exist in `types.json` with Salesforce IDs
- category-filter-attributes.json correctly excludes them (they're types, not categories)
- categories.json incorrectly includes them as categories

**Impact**: 
- AI cannot select these 8 categories (not in prompt)
- When products match these categories, AI creates descriptive alternatives
- Example: "Outdoor Lighting" missing → AI creates "Outdoor Wall Lights"
- Validation fails, department assignment breaks

---

### Discovery #2: No Hierarchical Department-First Validation

**Current System**:
```
Stage 1: AI sees ALL 169 categories from ALL 11 departments at once
         ↓
         Choose 1 category from 169 options
```

**Problem**:
- Cognitive overload: 169 categories without department context
- Can pick lighting category for hardware product (wrong domain)
- No filtering by department → cross-domain contamination

**Example**:
- Product: Chandelier
- AI sees: Cabinet Hardware, Door Hardware, Wall Sconce, Chandelier, etc. (all mixed)
- Can mistakenly pick: Cabinet Hardware (wrong department)
- Should see: Lighting dept → then only lighting categories

**Impact**: 32% of jobs have semantic violations (lighting in hardware dept, etc.)

---

### Discovery #3: AI Processes Same Data Twice (Inefficient)

**Current Flow**:
```
Stage 1 (Category):
  buildAnalysisPrompt(rawProduct) → Sends ALL product data
  ↓
  AI analyzes: titles, descriptions, features, specs, images, URLs
  ↓
  Picks category

Stage 2 (Details):
  buildAnalysisPrompt(rawProduct) → Sends ALL product data AGAIN
  ↓
  AI re-analyzes: same titles, descriptions, features, specs, images, URLs
  ↓
  Populates attributes
```

**Problem**:
- Duplicate processing: Same data parsed twice by AI
- AI "reviewing everything before knowing what it's looking for"
- Higher token costs, slower processing

**Should Be**:
```
Stage 0: Build product context once
Stage 1: Send summary → Pick department
Stage 2: Send summary + dept context → Pick category (filtered)
Stage 3: Send full details → Populate attributes (category-specific)
```

---

### Discovery #4: No Category Validation After AI Selection

**Current System**:
```
AI suggests: "Outdoor Wall Lights"
           ↓
System: picklistMatcher.matchCategory("Outdoor Wall Lights")
           ↓
Result: { matched: false }
           ↓
System continues anyway: AI_Product_Category = "Outdoor Wall Lights"
                        AI_Product_Department = "" (empty)
```

**Problem**:
- System accepts ANY category AI suggests
- No validation rejecting non-picklist categories
- No retry or fallback when match fails
- Department assignment breaks when category not found

**Should Be**:
```
AI suggests: "Outdoor Wall Lights"
           ↓
System: picklistMatcher.matchCategory("Outdoor Wall Lights")
           ↓
Result: { matched: false }
           ↓
System tries: fuzzy matching → "Outdoor Lighting" (close match)
           ↓
Still no match: Force AI retry with stricter prompt
           ↓
Or: Escalate to manual review queue
```

---

### Discovery #5: Input Data Has Correct Hints But AI Can't Use Them

**Example from Real Data**:
```
Product: WAC Lighting "6" Cubix 2 Light LED Outdoor Wall Sconce"
Input Hints:
  Ferguson_Categories: "Outdoor Lighting" ✅ (CORRECT!)
  Ferguson_Title: "Outdoor Wall Sconce"
  Category_Legacy: "Wall Sconce"
  
AI Stage 1 Prompt: Shows 169 categories (does NOT include "Outdoor Lighting")
                  ↓
AI searches: Cannot find "Outdoor Lighting"
                  ↓
AI creates: "Outdoor Wall Lights" (descriptive alternative)
                  ↓
Result: Both OpenAI and xAI agree on "Outdoor Wall Lights" (100% consensus)
                  ↓
Validation: NOT in categories.json → Department wrong
```

**Problem**: Even with perfect input hints, AI creates wrong category because correct one not in prompt

---

## 🔧 PART 2: THE FIXES

### Fix #1: Clean categories.json (IMMEDIATE - CRITICAL)

**Action**: Remove 8 contaminated entries from categories.json

**File**: `src/config/salesforce-picklists/categories.json`

**Remove These Entries**:
1. Wine Cooler (Appliances department)
2. Beverage Center (Appliances department)
3. Outdoor Lighting (Lighting & Electrical department)
4. Cabinet Hardware (Hardware department)
5. Laundry Sink (Plumbing & Bath department)
6. Utility Sink (Plumbing & Bath department)
7. Carpet (Flooring department)
8. Home Accents (Home Decor department)

**Verification**:
```bash
# Before: 177 categories
# After: 169 categories (matches category-filter-attributes.json)
```

**Why This Fix**:
- category-filter-attributes.json is correct (proven - no types as categories)
- categories.json has types contaminating category list
- Sync both files to 169 categories

**Expected Impact**:
- AI can now see valid categories in prompt
- "Outdoor Lighting" problem solved (no longer exists as category - it's a type)
- Non-existent categories drop from 25% to near-zero

---

### Fix #2: Verify Types Remain in types.json

**Action**: Confirm these exist as TYPES (not categories) in types.json and category-type-mapping.json

**Verify These Exist as Types**:
```json
// types.json - these should exist:
{ "type_name": "Wine Cooler", "type_id": "a1jaZ000001lFDJQA2" }
{ "type_name": "Beverage Center", "type_id": "a1jaZ000001lF3gQAE" }
{ "type_name": "Outdoor Lighting", "type_id": "a1jaZ000001lF8uQAE" }
```

**Verify Category-Type Mapping**:
- Wine Cooler → TYPE under "Refrigerator" category
- Beverage Center → TYPE under "Refrigerator" category
- Outdoor Lighting → TYPE under appropriate lighting category (Wall Sconce?)

**Create Missing Types** (if needed):
- Cabinet Hardware → Add as TYPE under "Door Hardware" category
- Laundry Sink → Add as TYPE under "Kitchen Sink" category
- Utility Sink → Add as TYPE under "Kitchen Sink" category
- Carpet → Add as TYPE under "Tile" or "Flooring" category

**Why This Fix**:
- Preserve data hierarchy: Department → Category → Type → Style
- Products currently using these can still be typed correctly
- Just not as categories anymore

---

### Fix #3: Add Missing Valid Categories (if needed)

**Analysis Required**: Check if any products in our dataset need NEW legitimate categories

From 50-call audit, these AI-selected categories don't exist anywhere:
1. Laundry Pedestal (3 jobs) - Both AIs agreed
2. Towel Warmer (2 jobs) - Both AIs agreed
3. Warming Drawer (1 job) - Both AIs agreed
4. Washer and Dryer Set Accessories (1 job) - Both AIs agreed
5. Sink Accessories and Parts (1 job) - Both AIs agreed

**Decision Required**:
- Are these legitimate categories that should be added?
- Or should they map to existing categories with Type="Accessory"?

**Recommendation**:
```
Laundry Pedestal → Add as category under Appliances
Towel Warmer → Add as category under Plumbing & Bath OR map to existing
Warming Drawer → Already exists as "Drawer" category - use that + Type
Washer/Dryer Accessories → Map to Washer/Dryer categories + Type="Accessory"
Sink Accessories → Map to Kitchen Sink category + Type="Accessory"
```

**Action**:
- Create these as categories in categories.json AND category-filter-attributes.json
- Get Salesforce IDs for new categories
- Ensure they appear in BOTH files (stay in sync)

---

### Fix #4: Implement Hierarchical Department-First Validation (HIGH PRIORITY)

**Current**: 2-stage system (Category → Details)

**New**: 4-stage hierarchical system

**Stage 0: Department Selection**
```typescript
// Show 4-11 department options only
getCategoryOnlyPrompt() → getDepartmentOnlyPrompt()

Prompt: "Choose department from:
  1. Appliances
  2. Electronics
  3. Flooring
  4. Hardware
  5. Heating & Cooling
  6. Home Décor & Furniture
  7. Industrial & Commercial
  8. Lighting & Electrical
  9. Outdoor
  10. Plumbing & Bath"
```

**Stage 1: Category Selection (Department-Filtered)**
```typescript
// Show ONLY categories from determined department
getCategorySpecificPrompt(determinedDepartment)

Example: If department = "Lighting & Electrical"
Show only: Wall Sconce, Chandelier, Pendant, Ceiling Fan, etc. (20-30 categories)
NOT: Refrigerator, Faucet, Range, Door Hardware (filtered out)
```

**Stage 2: Type/Style Selection (Category-Filtered)**
```typescript
// Existing logic - already works correctly
getCategorySpecificPrompt(determinedCategory)

Show only types/styles for the category
```

**Stage 3: Attribute Population (Category-Filtered)**
```typescript
// Existing logic - already works correctly
Top-15 attributes filtered by category
```

**Why This Fix**:
- Reduces cognitive load: 11 depts → 20-30 cats vs. 169 cats
- Prevents cross-domain contamination
- Forces correct department before category selection
- AI cannot pick lighting category for hardware product

**Expected Impact**:
- Semantic violations drop from 32% to <5%
- More accurate category selection
- Better department alignment

---

### Fix #5: Add Strict Category Validation (HIGH PRIORITY)

**Location**: `src/services/dual-ai-verification.service.ts` (after Stage 1)

**Current Code** (Line ~1640):
```typescript
const determinedCategory = categoryConsensus.agreedCategory || 
                          openaiCategoryResult.determinedCategory || 
                          xaiCategoryResult.determinedCategory;

// No validation - just uses whatever AI suggested
```

**New Code**:
```typescript
const determinedCategory = categoryConsensus.agreedCategory || 
                          openaiCategoryResult.determinedCategory || 
                          xaiCategoryResult.determinedCategory;

// VALIDATION: Check if category exists in picklist
const categoryMatch = picklistMatcher.matchCategory(determinedCategory);

if (!categoryMatch.matched) {
  logger.error('AI selected non-existent category', {
    category: determinedCategory,
    sessionId: verificationSessionId
  });
  
  // Try fuzzy matching to find closest valid category
  const fuzzyMatch = findClosestCategory(determinedCategory, getAllCategories());
  
  if (fuzzyMatch && fuzzyMatch.confidence > 0.85) {
    logger.info('Fuzzy match found', {
      original: determinedCategory,
      matched: fuzzyMatch.category,
      confidence: fuzzyMatch.confidence
    });
    determinedCategory = fuzzyMatch.category;
  } else {
    // Force AI retry with stricter prompt
    logger.warn('No good match found - retrying with strict prompt');
    
    const retryPrompt = `CRITICAL: You must select from the exact category list provided.
    DO NOT create new category names. Your previous choice "${determinedCategory}" is not valid.
    Review the product and select the closest match from the provided categories.`;
    
    // Retry Stage 1 with strict prompt
    const retryResults = await Promise.all([
      analyzeWithOpenAI(processedProduct, verificationSessionId, { 
        ...promptOptions, 
        strictMode: true,
        previousInvalidChoice: determinedCategory 
      }, trackingId, { stage: 'category-only' }),
      analyzeWithXAI(processedProduct, verificationSessionId, { 
        ...promptOptions, 
        strictMode: true,
        previousInvalidChoice: determinedCategory 
      }, trackingId, { stage: 'category-only' })
    ]);
    
    // Use retry result
    determinedCategory = retryResults[0].determinedCategory || retryResults[1].determinedCategory;
    
    // If still no match, escalate
    if (!picklistMatcher.matchCategory(determinedCategory).matched) {
      // Add to manual review queue
      await reviewQueueService.add({
        sessionId: verificationSessionId,
        reason: 'non-existent-category',
        aiSuggested: determinedCategory,
        requiresHumanReview: true
      });
      
      throw new Error(`Category validation failed after retry: ${determinedCategory}`);
    }
  }
}
```

**Helper Function** (new):
```typescript
function findClosestCategory(input: string, validCategories: string[]): { category: string, confidence: number } | null {
  // Fuzzy string matching using Levenshtein distance or similar
  // "Outdoor Wall Lights" → "Outdoor Lighting" (if it existed)
  // "Laundry Pedestal" → "Washer" or "Dryer" (closest match)
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const validCat of validCategories) {
    const score = calculateSimilarity(input.toLowerCase(), validCat.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = validCat;
    }
  }
  
  return bestScore > 0.7 ? { category: bestMatch, confidence: bestScore } : null;
}
```

**Why This Fix**:
- Prevents non-existent categories from passing through
- Auto-corrects close matches
- Forces retry with stricter instructions
- Escalates to manual review if needed

**Expected Impact**:
- Non-existent categories drop to 0%
- Department assignment always valid
- Better error handling

---

### Fix #6: Optimize AI Data Flow (MEDIUM PRIORITY)

**Current Problem**: buildAnalysisPrompt() called twice with same data

**Solution**: Build product context once, reuse across stages

**New Structure**:
```typescript
// ONCE: Build comprehensive product context
const productContext = buildProductContext(rawProduct);

// Stage 0: Department selection (lightweight)
const departmentPrompt = buildDepartmentPrompt(productContext.summary);

// Stage 1: Category selection (medium)
const categoryPrompt = buildCategoryPrompt(
  productContext.summary, 
  determinedDepartment
);

// Stage 2: Attribute population (full context)
const detailsPrompt = buildDetailsPrompt(
  productContext.full, 
  determinedCategory
);
```

**buildProductContext** (new function):
```typescript
function buildProductContext(rawProduct: SalesforceIncomingProduct) {
  const cleaned = sanitizeProductDataForAI(rawProduct);
  
  return {
    // Lightweight summary for early stages
    summary: {
      title: cleaned.Ferguson_Title || cleaned.SF_Catalog_Name,
      brand: cleaned.Ferguson_Brand || cleaned.Brand_Web_Retailer,
      modelNumber: cleaned.SF_Catalog_Name,
      categoryHints: {
        ferguson: cleaned.Ferguson_Categories,
        webRetailer: cleaned.Web_Retailer_Category,
        legacy: cleaned.Category_Legacy
      },
      productType: inferProductType(cleaned)
    },
    
    // Full context for final stage
    full: cleaned,
    
    // Research context (if available)
    research: preResearchContext
  };
}
```

**Why This Fix**:
- Reduces token usage (don't send everything twice)
- Faster processing (AI doesn't re-parse same data)
- Better stage separation (summary → details progression)
- Addresses user's concern: "AI reviewing everything before knowing what it's looking for"

**Expected Impact**:
- 30-40% reduction in token costs
- 20-30% faster processing time
- Cleaner code architecture

---

### Fix #7: Enhance mapToVerifiedCategory for AI Output (LOW PRIORITY)

**Current**: Function only maps INPUT data (Ferguson/Web categories)

**Enhancement**: Also map AI-suggested categories before validation

**Location**: `src/services/response-builder.service.ts` (Line 560)

**Add to categoryMap**:
```typescript
const categoryMap: Record<string, string> = {
  // ... existing mappings ...
  
  // AI output mappings (common alternatives)
  'OUTDOOR WALL LIGHTS': 'Wall Sconce',  // Map to valid category
  'OUTDOOR LIGHTING': 'Wall Sconce',     // It's a type, not category
  'LAUNDRY PEDESTAL': 'Laundry Pedestal', // If we add it as category
  'TOWEL WARMER': 'Towel Warmer',        // If we add it as category
  'WARMING DRAWER': 'Drawer',            // Map to existing category
  'SINK ACCESSORIES': 'Kitchen Sink',    // With Type="Accessory"
  'WINE COOLER': 'Refrigerator',         // It's a type under Refrigerator
  'BEVERAGE CENTER': 'Refrigerator',     // It's a type under Refrigerator
  
  // ... more AI alternative names ...
};
```

**Apply Mapping**:
```typescript
// Before validation
const aiCategory = consensus.agreedCategory || '';
const mappedCategory = mapToVerifiedCategory('', '', aiCategory) || aiCategory;
const categoryMatch = picklistMatcher.matchCategory(mappedCategory);
```

**Why This Fix**:
- Auto-corrects common AI naming variations
- Reduces validation failures
- Maps to valid categories before checking picklist

**Expected Impact**:
- Fewer validation failures
- Better AI output normalization
- Reduced need for retries

---

## ✅ PART 3: DATA VALIDATION & CLEANUP PLAN

### Validation Step 1: Verify File Sync Before Fix

**Script**: Create `scripts/pre-fix-validation.js`

```javascript
const categories = require('./src/config/salesforce-picklists/categories.json');
const filterAttrs = require('./src/config/salesforce-picklists/category-filter-attributes.json');
const types = require('./src/config/salesforce-picklists/types.json');

// 1. Check current state
console.log('BEFORE FIX:');
console.log('  categories.json:', categories.length);
console.log('  category-filter-attributes.json:', Object.keys(filterAttrs.categories).length);

// 2. Identify 8 problem entries
const badOnes = ['Wine Cooler', 'Beverage Center', 'Outdoor Lighting', 
                 'Cabinet Hardware', 'Laundry Sink', 'Utility Sink', 
                 'Carpet', 'Home Accents'];

badOnes.forEach(name => {
  const inCategories = categories.find(c => c.category_name === name);
  const inFilter = filterAttrs.categories[name];
  const inTypes = types.find(t => t.type_name === name);
  
  console.log(`\n${name}:`);
  console.log(`  In categories.json: ${inCategories ? 'YES' : 'NO'}`);
  console.log(`  In category-filter-attributes.json: ${inFilter ? 'YES' : 'NO'}`);
  console.log(`  In types.json: ${inTypes ? 'YES (ID: ' + inTypes.type_id + ')' : 'NO'}`);
});
```

**Run**: `node scripts/pre-fix-validation.js > audit-results/pre-fix-state.txt`

---

### Validation Step 2: Clean categories.json

**Script**: Create `scripts/clean-categories-file.js`

```javascript
const fs = require('fs');
const categories = require('./src/config/salesforce-picklists/categories.json');

// Backup original
fs.writeFileSync(
  './src/config/salesforce-picklists/categories.json.backup',
  JSON.stringify(categories, null, 2)
);

// Remove 8 bad entries
const badOnes = ['Wine Cooler', 'Beverage Center', 'Outdoor Lighting', 
                 'Cabinet Hardware', 'Laundry Sink', 'Utility Sink', 
                 'Carpet', 'Home Accents'];

const cleaned = categories.filter(c => !badOnes.includes(c.category_name));

console.log('BEFORE:', categories.length);
console.log('AFTER:', cleaned.length);
console.log('REMOVED:', categories.length - cleaned.length);

// Write cleaned file
fs.writeFileSync(
  './src/config/salesforce-picklists/categories.json',
  JSON.stringify(cleaned, null, 2)
);

console.log('\n✅ categories.json cleaned and saved');
console.log('✅ Backup saved to categories.json.backup');
```

**Run**: `node scripts/clean-categories-file.js`

---

### Validation Step 3: Verify File Sync After Fix

**Script**: Create `scripts/post-fix-validation.js`

```javascript
const categories = require('./src/config/salesforce-picklists/categories.json');
const filterAttrs = require('./src/config/salesforce-picklists/category-filter-attributes.json');

const categoryNames = categories.map(c => c.category_name).sort();
const filterCats = Object.keys(filterAttrs.categories).sort();

console.log('AFTER FIX:');
console.log('  categories.json:', categoryNames.length);
console.log('  category-filter-attributes.json:', filterCats.length);

// Check if they match
const inCategoriesNotFilter = categoryNames.filter(c => !filterCats.includes(c));
const inFilterNotCategories = filterCats.filter(f => !categoryNames.includes(f));

if (inCategoriesNotFilter.length === 0 && inFilterNotCategories.length === 0) {
  console.log('\n✅ FILES ARE SYNCHRONIZED!');
  console.log('✅ Both have', categoryNames.length, 'categories');
} else {
  console.log('\n❌ FILES STILL OUT OF SYNC!');
  
  if (inCategoriesNotFilter.length > 0) {
    console.log('\n⚠️  In categories.json but NOT in filter:', inCategoriesNotFilter.length);
    inCategoriesNotFilter.forEach(c => console.log('   -', c));
  }
  
  if (inFilterNotCategories.length > 0) {
    console.log('\n⚠️  In filter but NOT in categories.json:', inFilterNotCategories.length);
    inFilterNotCategories.forEach(c => console.log('   -', c));
  }
}
```

**Run**: `node scripts/post-fix-validation.js`

---

### Validation Step 4: Verify Types Still Exist

**Script**: Create `scripts/verify-types-preserved.js`

```javascript
const types = require('./src/config/salesforce-picklists/types.json');

const expectedTypes = [
  { name: 'Wine Cooler', id: 'a1jaZ000001lFDJQA2' },
  { name: 'Beverage Center', id: 'a1jaZ000001lF3gQAE' },
  { name: 'Outdoor Lighting', id: 'a1jaZ000001lF8uQAE' }
];

console.log('VERIFYING TYPES PRESERVED:\n');

expectedTypes.forEach(expected => {
  const found = types.find(t => t.type_name === expected.name);
  
  if (found) {
    if (found.type_id === expected.id) {
      console.log(`✅ ${expected.name}: EXISTS with correct ID (${expected.id})`);
    } else {
      console.log(`⚠️  ${expected.name}: EXISTS but ID mismatch! Expected ${expected.id}, got ${found.type_id}`);
    }
  } else {
    console.log(`❌ ${expected.name}: MISSING from types.json!`);
  }
});
```

**Run**: `node scripts/verify-types-preserved.js`

---

### Validation Step 5: Re-Run 50-Call Audit

**Purpose**: Measure improvement after fixes

**Script**: Use existing `scripts/analyze-sf-50-calls.js`

**Comparison Metrics**:

| Metric | Before Fix | After Fix | Target |
|--------|-----------|-----------|--------|
| Non-existent categories | 25% (6/24) | ??? | 0% |
| Semantic violations | 32% (16/50) | ??? | <5% |
| Wrong department | 12% (6/50) | ??? | 0% |
| Category accuracy | 100% (individual) | ??? | 100% |
| Overall data quality | 68% clean | ??? | >95% |

**Run**: 
```bash
node scripts/analyze-sf-50-calls.js > audit-results/post-fix-50-call-audit.txt
```

**Compare**:
```bash
diff audit-results/pre-fix-state.txt audit-results/post-fix-50-call-audit.txt
```

---

### Validation Step 6: Audit Existing Database Records

**Purpose**: Find and fix any existing records with bad categories

**Script**: Create `scripts/audit-existing-database-records.js`

```javascript
const { MongoClient } = require('mongodb');

const badCategories = ['Wine Cooler', 'Beverage Center', 'Outdoor Lighting', 
                       'Cabinet Hardware', 'Laundry Sink', 'Utility Sink', 
                       'Carpet', 'Home Accents',
                       'Outdoor Wall Lights', 'Laundry Pedestal', 'Towel Warmer',
                       'Warming Drawer', 'Washer and Dryer Set Accessories',
                       'Sink Accessories and Parts'];

async function auditDatabase() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('catalog-verification');
  
  console.log('AUDITING DATABASE FOR BAD CATEGORIES:\n');
  
  for (const badCat of badCategories) {
    const count = await db.collection('verification_jobs').countDocuments({
      'result.Field_AI_Reviews.AI_Product_Category': badCat,
      status: 'completed'
    });
    
    if (count > 0) {
      console.log(`❌ Found ${count} records with category: "${badCat}"`);
      
      // Sample records
      const samples = await db.collection('verification_jobs')
        .find({ 'result.Field_AI_Reviews.AI_Product_Category': badCat })
        .limit(3)
        .toArray();
      
      samples.forEach(job => {
        console.log(`   Job ID: ${job._id}`);
        console.log(`   Product: ${job.product.SF_Catalog_Name}`);
        console.log(`   Department: ${job.result.Field_AI_Reviews.AI_Product_Department || 'NONE'}`);
      });
      console.log('');
    }
  }
  
  await client.close();
}

auditDatabase().catch(console.error);
```

**Run**: 
```bash
node scripts/audit-existing-database-records.js > audit-results/database-bad-categories.txt
```

---

### Validation Step 7: Create Batch Re-Verification Job (If Needed)

**Purpose**: Re-verify products with bad categories

**Script**: Create `scripts/batch-reverify-bad-categories.js`

```javascript
const { MongoClient } = require('mongodb');
const axios = require('axios');

const badCategories = ['Wine Cooler', 'Beverage Center', 'Outdoor Lighting', ...];

async function batchReverify() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('catalog-verification');
  
  // Find all jobs with bad categories
  const jobsToReverify = await db.collection('verification_jobs')
    .find({
      'result.Field_AI_Reviews.AI_Product_Category': { $in: badCategories },
      status: 'completed'
    })
    .toArray();
  
  console.log(`Found ${jobsToReverify.length} jobs to re-verify\n`);
  
  for (const job of jobsToReverify) {
    console.log(`Re-verifying Job ${job._id}...`);
    
    // Call API to re-verify
    try {
      const response = await axios.post('https://verify.cxc-ai.com/api/verify/salesforce', 
        job.product,
        { headers: { 'X-API-Key': 'your-api-key' } }
      );
      
      console.log(`  ✅ Success - New category: ${response.data.verified_fields.AI_Product_Category}`);
    } catch (error) {
      console.log(`  ❌ Failed:`, error.message);
    }
  }
  
  await client.close();
}

batchReverify().catch(console.error);
```

**Run**: 
```bash
node scripts/batch-reverify-bad-categories.js > audit-results/batch-reverify-results.txt
```

---

## 📊 PART 4: IMPLEMENTATION PLAN

### Phase 1: IMMEDIATE FIXES (Today)

**Priority**: CRITICAL - Fixes 25% non-existent categories

**Tasks**:
1. ✅ Run pre-fix validation (`scripts/pre-fix-validation.js`)
2. ✅ Backup categories.json
3. ✅ Clean categories.json - remove 8 entries (`scripts/clean-categories-file.js`)
4. ✅ Verify file sync (`scripts/post-fix-validation.js`)
5. ✅ Verify types preserved (`scripts/verify-types-preserved.js`)
6. ✅ Run post-fix 50-call audit
7. ✅ Commit changes to Git
8. ✅ Deploy to production

**Commands**:
```bash
# Step 1: Validate current state
node scripts/pre-fix-validation.js > audit-results/pre-fix-state.txt

# Step 2: Create and run cleanup script
node scripts/clean-categories-file.js

# Step 3: Verify sync
node scripts/post-fix-validation.js

# Step 4: Verify types preserved
node scripts/verify-types-preserved.js

# Step 5: Re-run audit
node scripts/analyze-sf-50-calls.js > audit-results/post-fix-50-call-audit.txt

# Step 6: Compare results
diff audit-results/pre-fix-state.txt audit-results/post-fix-50-call-audit.txt

# Step 7: Commit
git add src/config/salesforce-picklists/categories.json
git add scripts/*.js
git add audit-results/*
git commit -m "Fix: Remove 8 type-level entries from categories.json

- Remove Wine Cooler, Beverage Center, Outdoor Lighting (types, not categories)
- Remove Cabinet Hardware, Laundry Sink, Utility Sink, Carpet, Home Accents (over-specific)
- Sync categories.json (169) with category-filter-attributes.json (169)
- Preserve types in types.json
- Fixes 'Outdoor Wall Lights' and other non-existent category issues"

# Step 8: Push to GitHub
git push origin main

# Step 9: Deploy to production
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && \
   git pull origin main && \
   npm install && \
   npm run build && \
   systemctl restart catalog-verification"

# Step 10: Verify production
curl -s https://verify.cxc-ai.com/health
```

**Expected Time**: 2-3 hours

---

### Phase 2: ADD VALIDATION (Next Session)

**Priority**: HIGH - Prevents future contamination

**Tasks**:
1. ✅ Implement strict category validation (Fix #5)
2. ✅ Add fuzzy matching fallback
3. ✅ Add retry logic with strict prompt
4. ✅ Create manual review queue service
5. ✅ Add unit tests for validation
6. ✅ Deploy and test

**Files to Modify**:
- `src/services/dual-ai-verification.service.ts` (add validation after Stage 1)
- `src/services/picklist-matcher.service.ts` (add fuzzy matching)
- `src/services/review-queue.service.ts` (new file)

**Expected Time**: 4-6 hours

---

### Phase 3: HIERARCHICAL VALIDATION (Future Sprint)

**Priority**: MEDIUM - Improves accuracy, reduces violations

**Tasks**:
1. ✅ Design 4-stage architecture
2. ✅ Implement getDepartmentOnlyPrompt()
3. ✅ Modify Stage 1 to be department-first
4. ✅ Add department filtering for category list
5. ✅ Update AI prompts
6. ✅ Test with sample products
7. ✅ Deploy and measure improvement

**Files to Modify**:
- `src/services/dual-ai-verification.service.ts` (restructure stages)
- `src/config/category-config.ts` (add department filtering functions)

**Expected Time**: 8-12 hours

---

### Phase 4: OPTIMIZE DATA FLOW (Future)

**Priority**: LOW - Performance optimization

**Tasks**:
1. ✅ Refactor buildAnalysisPrompt() to buildProductContext()
2. ✅ Create summary vs full context separation
3. ✅ Update AI calls to use appropriate context level
4. ✅ Measure token reduction
5. ✅ Measure performance improvement

**Expected Time**: 4-6 hours

---

### Phase 5: AUDIT & CLEANUP DATABASE (After Fixes Deployed)

**Priority**: MEDIUM - Clean up existing bad data

**Tasks**:
1. ✅ Audit database for records with bad categories
2. ✅ Create batch re-verification job
3. ✅ Run batch re-verification (production)
4. ✅ Monitor results
5. ✅ Generate cleanup report

**Expected Time**: 2-3 hours + batch processing time

---

## 📈 PART 5: SUCCESS METRICS

### Metric #1: Category File Synchronization

**Before**:
- categories.json: 177 categories
- category-filter-attributes.json: 169 categories
- Difference: 8 categories (out of sync)

**After**:
- categories.json: 169 categories ✅
- category-filter-attributes.json: 169 categories ✅
- Difference: 0 (synchronized) ✅

**Validation**:
```bash
node scripts/post-fix-validation.js
# Should show: ✅ FILES ARE SYNCHRONIZED!
```

---

### Metric #2: Non-Existent Categories

**Before**: 25% of products (6/24 unique categories) were non-existent

**After Target**: 0% (all categories exist in picklist)

**Measure**:
```bash
node scripts/analyze-sf-50-calls.js | grep "not in categories.json"
# Should show: 0 categories not in picklist
```

---

### Metric #3: Semantic Violations

**Before**: 32% of jobs (16/50) had semantic violations

**After Target**: <5% (with hierarchical validation, <2%)

**Measure**:
```bash
node scripts/audit-semantic-combinations.js
# Should show: <5% jobs with violations
```

---

### Metric #4: Wrong Department Assignments

**Before**: 12% of jobs (6/50) had wrong or empty departments

**After Target**: 0%

**Measure**:
```bash
node scripts/audit-attribute-contamination.js
# Should show: 0% department mismatches
```

---

### Metric #5: Overall Data Quality

**Before**: 68% of jobs had clean data (no violations)

**After Target**: >95% clean

**Measure**:
```bash
# Run comprehensive audit
node scripts/analyze-sf-50-calls.js
node scripts/audit-semantic-combinations.js
node scripts/audit-attribute-contamination.js

# Calculate overall pass rate
```

---

## 🎯 PART 6: ENSURING NO BAD DATA REMAINS

### Check #1: File Integrity Checks (Automated)

**Script**: Create `scripts/continuous-validation.js` (run in CI/CD)

```javascript
const categories = require('./src/config/salesforce-picklists/categories.json');
const filterAttrs = require('./src/config/salesforce-picklists/category-filter-attributes.json');
const types = require('./src/config/salesforce-picklists/types.json');
const styles = require('./src/config/salesforce-picklists/styles.json');

// Check 1: Category files must be in sync
const categoryNames = categories.map(c => c.category_name).sort();
const filterCats = Object.keys(filterAttrs.categories).sort();

if (categoryNames.length !== filterCats.length) {
  console.error('❌ FAIL: Category files out of sync!');
  process.exit(1);
}

// Check 2: No types listed as categories
const typeNames = types.map(t => t.type_name);
const typesAsCategories = categoryNames.filter(c => typeNames.includes(c));

if (typesAsCategories.length > 0) {
  console.error('❌ FAIL: Types listed as categories:', typesAsCategories);
  process.exit(1);
}

// Check 3: No styles listed as categories
const styleNames = styles.map(s => s.style_name);
const stylesAsCategories = categoryNames.filter(c => styleNames.includes(c));

if (stylesAsCategories.length > 0) {
  console.error('❌ FAIL: Styles listed as categories:', stylesAsCategories);
  process.exit(1);
}

// Check 4: All categories have departments
const categoriesWithoutDept = categories.filter(c => !c.department || c.department === '');

if (categoriesWithoutDept.length > 0) {
  console.error('❌ FAIL: Categories without departments:', categoriesWithoutDept.map(c => c.category_name));
  process.exit(1);
}

console.log('✅ All file integrity checks passed');
process.exit(0);
```

**Add to package.json**:
```json
{
  "scripts": {
    "validate-picklists": "node scripts/continuous-validation.js",
    "pre-commit": "npm run validate-picklists"
  }
}
```

**Add to CI/CD** (.github/workflows/ci-cd.yml):
```yaml
- name: Validate Picklist Integrity
  run: npm run validate-picklists
```

---

### Check #2: Pre-Deployment Audit (Manual)

**Before every deployment**, run:

```bash
# Check file sync
node scripts/post-fix-validation.js

# Check types preserved
node scripts/verify-types-preserved.js

# Check no category contamination
node scripts/continuous-validation.js

# Run comprehensive audit on latest data
node scripts/analyze-sf-50-calls.js
node scripts/audit-semantic-combinations.js
node scripts/audit-attribute-contamination.js
```

**If ANY check fails → Fix before deploying**

---

### Check #3: Production Monitoring (Automated)

**Create monitoring script**: `scripts/production-category-monitor.js`

```javascript
// Run every hour in production
const { MongoClient } = require('mongodb');

async function monitorCategories() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('catalog-verification');
  
  // Get last hour's jobs
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentJobs = await db.collection('verification_jobs')
    .find({
      created_at: { $gte: oneHourAgo },
      status: 'completed'
    })
    .toArray();
  
  // Check for non-existent categories
  const categories = require('./src/config/salesforce-picklists/categories.json');
  const validCategories = categories.map(c => c.category_name);
  
  const badCategories = recentJobs.filter(job => {
    const cat = job.result?.Field_AI_Reviews?.AI_Product_Category;
    return cat && !validCategories.includes(cat);
  });
  
  if (badCategories.length > 0) {
    console.error('🚨 ALERT: Non-existent categories detected in last hour!');
    console.error('Count:', badCategories.length,   'of', recentJobs.length);
    
    // Send alert (Slack, email, etc.)
    await sendAlert({
      type: 'non-existent-categories',
      count: badCategories.length,
      examples: badCategories.slice(0, 3).map(j => ({
        jobId: j._id,
        category: j.result.Field_AI_Reviews.AI_Product_Category,
        product: j.product.SF_Catalog_Name
      }))
    });
  } else {
    console.log('✅ No bad categories in last hour');
  }
  
  await client.close();
}

monitorCategories().catch(console.error);
```

**Add to crontab** (production):
```bash
0 * * * * cd /opt/catalog-verification-api && node scripts/production-category-monitor.js >> logs/category-monitor.log 2>&1
```

---

### Check #4: Weekly Audit Report (Automated)

**Create weekly report**: `scripts/weekly-data-quality-report.js`

```javascript
// Run every Monday morning
const { MongoClient } = require('mongodb');

async function generateWeeklyReport() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('catalog-verification');
  
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const weeklyJobs = await db.collection('verification_jobs')
    .find({
      created_at: { $gte: oneWeekAgo },
      status: 'completed'
    })
    .toArray();
  
  // Calculate metrics
  const metrics = {
    totalJobs: weeklyJobs.length,
    uniqueCategories: new Set(weeklyJobs.map(j => j.result?.Field_AI_Reviews?.AI_Product_Category)).size,
    nonExistentCategories: 0,
    emptyDepartments: 0,
    avgConfidence: 0,
    successRate: 0
  };
  
  const categories = require('./src/config/salesforce-picklists/categories.json');
  const validCategories = categories.map(c => c.category_name);
  
  weeklyJobs.forEach(job => {
    const cat = job.result?.Field_AI_Reviews?.AI_Product_Category;
    const dept = job.result?.Field_AI_Reviews?.AI_Product_Department;
    
    if (cat && !validCategories.includes(cat)) metrics.nonExistentCategories++;
    if (!dept || dept === '') metrics.emptyDepartments++;
  });
  
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         WEEKLY DATA QUALITY REPORT                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log('Period:', oneWeekAgo.toISOString(), 'to', new Date().toISOString());
  console.log('Total Jobs:', metrics.totalJobs);
  console.log('Unique Categories:', metrics.uniqueCategories);
  console.log('Non-Existent Categories:', metrics.nonExistentCategories, 
              `(${(metrics.nonExistentCategories/metrics.totalJobs*100).toFixed(2)}%)`);
  console.log('Empty Departments:', metrics.emptyDepartments,
              `(${(metrics.emptyDepartments/metrics.totalJobs*100).toFixed(2)}%)`);
  console.log('\n' + (metrics.nonExistentCategories === 0 && metrics.emptyDepartments === 0 
    ? '✅ DATA QUALITY: EXCELLENT' 
    : '⚠️  DATA QUALITY: NEEDS ATTENTION'));
  
  await client.close();
  
  // Email report to stakeholders
  //await emailReport(metrics);
}

generateWeeklyReport().catch(console.error);
```

---

## 📝 PART 7: FINAL CHECKLIST

### Before Starting Fixes:
- [ ] Backup all picklist files
- [ ] Create feature branch for changes
- [ ] Document current metrics (baseline)
- [ ] Review this document with team

### Phase 1 Checklist (File Cleanup):
- [ ] Run pre-fix validation
- [ ] Clean categories.json (remove 8 entries)
- [ ] Verify files are synchronized (169 categories each)
- [ ] Verify types preserved in types.json
- [ ] Re-run 50-call audit
- [ ] Compare before/after metrics
- [ ] Commit changes
- [ ] Deploy to production
- [ ] Verify production health
- [ ] Monitor for 24 hours

### Phase 2 Checklist (Add Validation):
- [ ] Implement category validation function
- [ ] Add fuzzy matching
- [ ] Add retry logic
- [ ] Create manual review queue
- [ ] Write unit tests
- [ ] Test with sample data
- [ ] Deploy to production
- [ ] Monitor validation failures

### Phase 3 Checklist (Hierarchical):
- [ ] Design 4-stage architecture
- [ ] Implement department-first prompts
- [ ] Update AI service
- [ ] Test with sample products
- [ ] Measure improvement
- [ ] Deploy to production
- [ ] Monitor semantic violations

### Ongoing Monitoring:
- [ ] Set up hourly production monitoring
- [ ] Set up weekly quality reports
- [ ] Add file integrity checks to CI/CD
- [ ] Document all changes in session notes
- [ ] Update copilot instructions

---

## 🎯 EXPECTED OUTCOMES

### After Phase 1 (File Cleanup):
- ✅ Categories synchronized: 169 in both files
- ✅ Non-existent categories: 0% (down from 25%)
- ✅ Types preserved: All 3 confirmed types remain in types.json
- ✅ AI can see correct category list
- ⚠️ Semantic violations may still exist (~20-25% expected)

### After Phase 2 (Add Validation):
- ✅ No invalid categories pass through validation
- ✅ Auto-correction via fuzzy matching
- ✅ Department assignment: 100% valid
- ✅ Manual review queue for edge cases

### After Phase 3 (Hierarchical):
- ✅ Semantic violations: <5% (down from 32%)
- ✅ Department-first selection prevents cross-domain errors
- ✅ Cognitive load reduced for AI
- ✅ Overall data quality: >95%

### After All Phases:
- ✅ Data quality: >95% clean
- ✅ Non-existent categories: 0%
- ✅ Semantic violations: <2%
- ✅ Department accuracy: 100%
- ✅ Automated monitoring in place
- ✅ No bad data in production

---

**Document Status**: Ready for Implementation  
**Next Action**: Run Phase 1 - File Cleanup  
**Estimated Total Time**: Phase 1 (2-3 hours), All Phases (20-30 hours)
