# Token Management & Smart Truncation System

**Created:** February 9, 2026  
**Issue:** Context length exceeded errors causing AI verification failures for data-rich products  
**Solution:** Intelligent token estimation and prioritization-based truncation

---

## Problem Summary

### The Issue
Products with extensive specifications (140+ attributes) were exceeding AI token limits:
- **OpenAI GPT-4**: 128,000 tokens (~96,000 words)
- **xAI Grok-2**: 131,072 tokens (~98,000 words)

**Example Case** (Session `bddf104b-485b-4990-afcf-5b4ec8c1b1aa`):
- Product: GE Profile Wall Oven with 140 specifications
- Token breakdown:
  - Web_Retailer_Specs: ~30,000 tokens
  - Ferguson_Attributes: ~30,000 tokens
  - Web research pages: ~30,000 tokens
  - PDF documents: ~15,000 tokens
  - Base prompt + metadata: ~18,000 tokens
  - Image analysis: ~3,000 tokens
  - Combined specs (duplicates): ~10,000 tokens
  - **TOTAL**: ~148,000 tokens ❌ **EXCEEDS 128K LIMIT**

Impact: ~1-2% of products affected (high-end appliances, professional equipment)

---

## Solution Architecture

### 1. Token Estimation (Pre-Flight Check)
**File:** `src/services/token-management.service.ts`

**Function:** `estimateTokenCount(rawProduct, categorySchema, researchResult)`

Estimates token count **BEFORE** building AI prompts by analyzing:
- Product metadata (titles, descriptions, brand, model)
- Web_Retailer_Specs count × average token size
- Ferguson_Attributes count × average token size
- Specification_Table HTML size
- Research results (web pages, PDFs, images)

**Formula:** `estimatedTokens = characterCount / 3.5` (rough approximation)

**Risk Levels:**
- 🟢 **LOW** (< 60,000 tokens): No action needed
- 🟡 **MEDIUM** (60,000 - 80,000 tokens): Monitor, consider light truncation
- 🟠 **HIGH** (80,000 - 100,000 tokens): Apply smart truncation
- 🔴 **CRITICAL** (> 100,000 tokens): Aggressive truncation required

---

### 2. Specification Importance Scoring

**Function:** `scoreSpecificationImportance(attrName, attrValue, categorySchema)`

Assigns importance scores (0-100) to each specification based on multiple factors:

#### FACTOR 1: Required Fields (+40 points)
- Brand, Model Number, Category, SubCategory
- Dimensions (Width, Height, Depth, Weight)
- Color, Finish, MSRP

**Why?** These are mandatory for Salesforce record creation and product identification.

#### FACTOR 2: Top 15 Filter Attributes (+35 points)
- Category-specific attributes defined in `category-attributes.ts`
- Used for product filtering in Salesforce
- Critical for product discoverability

**Why?** These drive the shopping experience. Without them, products won't appear in filtered search results.

#### FACTOR 3: Unique Identifiers (+30 points)
- UPC, EAN, GTIN, SKU
- Manufacturer Part Number (MPN)
- Catalog Number, Item Number

**Why?** Enable cross-system product matching and inventory management.

#### FACTOR 4: Technical Specifications (+25 points)
- Voltage, Amperage, Wattage, BTU
- Electrical requirements
- Capacity (gallons, cubic feet)
- Certifications (UL, CSA, Energy Star)

**Why?** Essential for installation, safety compliance, and compatibility verification.

#### FACTOR 5: Physical Attributes (+20 points)
- Material composition
- Finish type (Brushed, Polished, Matte)
- Installation type (Freestanding, Built-in, Wall-mount)
- Style, Design, Configuration

**Why?** Impact purchasing decisions and installation planning.

#### FACTOR 6: Marketing Features (+10 points)
- Technology names (SmartHQ, Wi-Fi, Touch2O)
- Feature descriptions
- Warranty information

**Why?** Enhance product appeal but less critical than technical specs.

#### FACTOR 7: Redundant/Low-Value (−20 points penalty)
- "Prop 65", "Country of Origin: China"
- Shipping dimensions (vs product dimensions)
- Generic features ("High Quality", "Durable")
- Empty or meaningless values (Yes/No/N/A/Unknown)

**Why?** These add noise without providing useful product information.

---

### 3. Smart Truncation Strategy

**Function:** `applySmartTruncation(rawProduct, categorySchema, researchResult, tokenEstimate)`

**When triggered:**
- Risk Level = HIGH or CRITICAL
- Estimated tokens > 80,000

**Truncation Steps (in order):**

#### STEP 1: Truncate Web_Retailer_Specs (if > 50)
- Score all specifications by importance
- Sort by score (highest first)
- **Keep top 50** most important specs
- Remove the rest

**Result:** Retains ALL critical specs while removing redundant data

#### STEP 2: Truncate Ferguson_Attributes (if > 50)
- Same algorithm as Step 1
- **Keep top 50** most important attributes

**Note:** We keep Ferguson and Web Retailer separate because sometimes one source has specs the other doesn't.

#### STEP 3: Truncate Research Results (if still over limit)
- **Web Pages**: Keep Ferguson page + 1 most relevant other (remove rest)
- **PDFs**: Limit text excerpts from 2000 chars → 1000 chars
- **Combined Specs**: Remove entirely (duplicate data already in individual specs)
- **Features**: Limit to top 10 (from unlimited)

**Rationale:** Research data is supplementary. Core product specs are more important.

#### STEP 4: Aggressive Truncation (CRITICAL risk only)
- Further reduce specs to **top 30** (from 50) for each source
- Apply only when Steps 1-3 insufficient

---

### 4. Integration into Verification Flow

**File:** `src/services/dual-ai-verification.service.ts`

**Workflow:**
```
1. Receive rawProduct from Salesforce
2. Validate data coherence
3. Perform external research (if needed)
4. 🆕 ESTIMATE TOKEN COUNT
5. 🆕 APPLY SMART TRUNCATION (if high/critical risk)
6. Send to OpenAI + xAI (with truncated data)
7. Build consensus
8. Return verified response
```

**Code Location:**
```typescript
// PHASE 0.9: TOKEN MANAGEMENT
const tokenEstimate = tokenManagementService.estimateTokenCount(
  rawProduct,
  categorySchemaForTokens,
  preResearchResult
);

if (tokenEstimate.riskLevel === 'high' || tokenEstimate.riskLevel === 'critical') {
  const truncationResult = tokenManagementService.applySmartTruncation(
    rawProduct,
    categorySchemaForTokens,
    preResearchResult,
    tokenEstimate
  );
  
  processedProduct = truncationResult.truncatedProduct;
  processedResearch = truncationResult.truncatedResearch;
}

// Then pass processedProduct to AIs instead of rawProduct
```

---

## Spec Importance Examples

### Example 1: Bath Tub Category

**CRITICAL (Score 75+)**
- `capacity_gallons: 60` → Required + Top 15 + Technical = 40 + 35 + 25 = 100
- `width: 32` → Required + Top 15 = 40 + 35 = 75
- `soaking_depth: 22` → Required + Top 15 = 40 + 35 = 75

**HIGH (Score 50-74)**
- `drain_placement: Left` → Top 15 + Physical = 35 + 20 = 55
- `material: Acrylic` → Top 15 + Physical = 35 + 20 = 55

**MEDIUM (Score 25-49)**
- `number_of_jets: 12` → Top 15 only = 35
- `tub_finish: Gloss` → Physical + Marketing = 20 + 10 = 30

**LOW (Score < 25)**
- `warranty: 5 Year Limited` → Marketing only = 10
- `features: Durable construction` → Marketing - Generic penalty = 10 - 10 = 0

**EXCLUDED (Negative score)**
- `prop_65_warning: Yes` → Low-value penalty = -20
- `country_of_origin: China` → Low-value penalty = -20

---

### Example 2: Refrigerator Category

**CRITICAL**
- `capacity_cubic_feet: 25.5` → 100
- `brand: GE` → 40
- `model_number: GWE25JMLES` → 40

**HIGH**
- `voltage: 115V` → Technical = 25
- `energy_star_certified: true` → Technical = 25
- `refrigerator_type: French Door` → Top 15 + Physical = 55

**MEDIUM**
- `wifi_enabled: true` → Marketing = 10
- `ice_maker: Yes` → Marketing = 10

**LOW**
- `finish: Stainless Steel` → (Already captured in Color field)
- `shipping_weight: 350 lbs` → Low-value penalty = -20

---

## Logging & Monitoring

### Token Estimation Logs
```
INFO: TOKEN ESTIMATE {
  sessionId: 'bddf104b-485b-4990-afcf-5b4ec8c1b1aa',
  estimatedTokens: 148000,
  riskLevel: 'critical',
  exceedsLimit: true,
  breakdown: {
    basePrompt: 5000,
    webRetailerSpecs: 30000,
    fergusonAttributes: 30000,
    webResearch: 30000,
    ...
  },
  recommendation: 'CRITICAL: Will exceed token limit. Apply aggressive truncation.'
}
```

### Truncation Application Logs
```
WARN: ⚠️ HIGH TOKEN COUNT DETECTED - Applying smart truncation {
  sessionId: 'bddf104b-485b-4990-afcf-5b4ec8c1b1aa',
  estimatedTokens: 148000,
  riskLevel: 'critical',
  productId: 'a0C8d00000XYZ123',
  modelNumber: 'JJW3430LM'
}

INFO: ✅ Smart truncation applied successfully {
  sessionId: 'bddf104b-485b-4990-afcf-5b4ec8c1b1aa',
  originalTokens: 148000,
  finalTokens: 95000,
  tokensSaved: 53000,
  truncatedSections: ['Web_Retailer_Specs', 'Ferguson_Attributes', 'Research_Results'],
  retainedSpecsCount: 100,
  removedSpecsCount: 180
}
```

---

## Testing & Validation

### Test Cases

#### 1. Low-Risk Product (< 60K tokens)
- **Input:** Standard product with 20-30 specs
- **Expected:** No truncation, all specs retained
- **Verify:** `truncated: false`, `tokensSaved: 0`

#### 2. Medium-Risk Product (60K-80K tokens)
- **Input:** Product with 60-80 specs
- **Expected:** Light monitoring, possibly no truncation
- **Verify:** Log warning but process normally

#### 3. High-Risk Product (80K-100K tokens)
- **Input:** Product with 100-120 specs
- **Expected:** Smart truncation to top 50 specs per source
- **Verify:** `truncated: true`, retains most important specs

#### 4. Critical-Risk Product (> 100K tokens)
- **Input:** Product with 140+ specs (like Wall Oven case)
- **Expected:** Aggressive truncation + research reduction
- **Verify:** Final tokens < 100K, critical specs retained

### Manual Test Script

```bash
# Test with known high-spec product
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @test-data/high-spec-wall-oven.json

# Check logs for token management
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "tail -100 /opt/catalog-verification-api/logs/combined.log | grep 'TOKEN ESTIMATE\|Smart truncation'"
```

---

## Future Enhancements

### 1. Dynamic Truncation Thresholds
Instead of hardcoded 50/30 limits, calculate optimal cutoff based on:
- Token budget remaining
- Category requirements
- AI model capabilities

### 2. Chunked Processing (For Extreme Cases)
For products with 200+ specs that can't fit even with truncation:
1. Split specs into 2-3 chunks
2. Process each chunk independently
3. Merge results with consensus

### 3. Adaptive Context Window
Detect AI model capabilities dynamically:
- Claude 3: 200K tokens
- Gemini Pro: 1M tokens
- Adjust truncation strategy based on available model

### 4. Spec Popularity Analytics
Track which specs are actually used in Salesforce:
- Fields viewed in product pages
- Attributes used in filters
- Update importance scoring based on real usage

---

## Summary

**What we built:**
- ✅ Pre-flight token estimation (before expensive AI calls)
- ✅ Multi-factor importance scoring for specifications
- ✅ Intelligent truncation prioritizing critical data
- ✅ Graceful degradation for extreme cases

**Impact:**
- ✅ Prevents context_length_exceeded errors
- ✅ Maintains data quality by keeping most important specs
- ✅ Reduces API costs (fewer retry attempts)
- ✅ Enables processing of complex products (appliances, industrial equipment)

**Trade-offs:**
- Some low-value specs are excluded (Prop 65 warnings, shipping info)
- Research data may be limited for high-spec products
- Still relies on estimation (not exact token count)

**Success Criteria:**
- All products should process successfully (no token overflow errors)
- Critical specs (required fields, Top 15 attributes) always retained
- Final token count < 100,000 for all requests
