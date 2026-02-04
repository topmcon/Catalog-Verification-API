# PARTS PICKLISTS - QUICK START GUIDE

**For**: New Parts Verification API Repository  
**Date**: February 4, 2026

---

## 📋 What You Have

Complete parts industry taxonomy ready to use:

✅ **85 Brands** - OEM, Aftermarket, Component manufacturers  
✅ **90 Categories** - Organized by Department → Family → Category  
✅ **150 Attributes** - Compatibility, electrical, physical, installation  
✅ **10 Styles** - OEM, Aftermarket, Universal, etc.  
✅ **9 Categories Mapped** - Top 15 attributes defined  
✅ **Documentation** - Complete taxonomy research + usage guide

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Copy Picklist Files
```bash
# Copy parts picklists to your new repo
cp -r src/config/parts-picklists/* /path/to/new-repo/src/config/salesforce-picklists/
```

### Step 2: Replace Placeholder IDs
Before deploying, replace ALL placeholder IDs with real Salesforce IDs:

**Current (Placeholder)**:
```json
{"brand_id": "PARTS_BRAND_001", "brand_name": "WHIRLPOOL"}
{"category_id": "PARTS_CAT_001", "category_name": "Compressor"}
{"attribute_id": "ATTR_001", "attribute_name": "Compatible Brand"}
```

**Production (Real Salesforce IDs)**:
```json
{"brand_id": "a0M8c00000XAbCDEFG", "brand_name": "WHIRLPOOL"}
{"category_id": "a018c00000YBcDEFGH", "category_name": "Compressor"}
{"attribute_id": "a028c00000ZCdEFGHI", "attribute_name": "Compatible Brand"}
```

**How to Get Real IDs**:
1. Create Brand, Category, Attribute objects in Salesforce
2. Query: `SELECT Id, Name FROM Brand__c ORDER BY Name`
3. Use Node.js script to bulk update JSON files with real IDs

### Step 3: Complete Top 15 Mappings
Currently only 9 of 90 categories have Top 15 attributes mapped. Complete the rest:

```javascript
// category-filter-attributes.json
// Add 15 entries per category (rank 1-15)
{
  "category_id": "PARTS_CAT_002",  // Evaporator Fan Motor
  "category_name": "Evaporator Fan Motor",
  "attribute_id": "ATTR_001",
  "attribute_name": "Compatible Brand",
  "rank": "1"
},
// ... 14 more attributes
```

**Categories Still Needing Top 15**:
- 81 categories (see [categories.json](../../../src/config/parts-picklists/categories.json) for full list)

### Step 4: Add More Brands
Expand from 85 to 200+ brands based on your inventory:

```json
// Add to brands.json
{"brand_id": "PARTS_BRAND_086", "brand_name": "DOMETIC"},
{"brand_id": "PARTS_BRAND_087", "brand_name": "NORCOLD"},
{"brand_id": "PARTS_BRAND_088", "brand_name": "SUBURBAN"}
```

### Step 5: Test with Real Data
Validate picklists against actual parts in your database:

```bash
# Test picklist matcher
node scripts/test-picklist-matching.js --data test-data/sample-parts.json
```

---

## 📊 Understanding the Structure

### Hierarchy
```
Department (7 total)
└── Family (20+ total)
    └── Category (90 total)
        └── Top 15 Attributes (9 mapped, 81 to go)
```

### Example: HVAC Air Filter
```
Department: HVAC Parts
  Family: Ventilation Parts
    Category: Air Filter (PARTS_CAT_057)
      Top 15 Attributes:
        1. Filter Size
        2. MERV Rating
        3. Filter Type
        4. Filter Material
        5. Frame Material
        6. Nominal Thickness
        7. Nominal Width
        8. Nominal Height
        9. Replacement Interval
        10. Airflow Resistance
        11. Particle Capture Rate
        12. Filter Application
        13. Compatible Systems
        14. Pack Quantity
        15. Part Number
```

---

## 🔍 Using in Your Code

### Loading Picklists
```typescript
// src/services/PicklistLoader.ts
import brands from '@/config/salesforce-picklists/brands.json';
import categories from '@/config/salesforce-picklists/categories.json';
import attributes from '@/config/salesforce-picklists/attributes.json';
import styles from '@/config/salesforce-picklists/styles.json';
import categoryFilterAttributes from '@/config/salesforce-picklists/category-filter-attributes.json';

export class PicklistLoader {
  static getBrands() { return brands; }
  static getCategories() { return categories; }
  static getAttributes() { return attributes; }
  static getStyles() { return styles; }
  static getCategoryAttributes(categoryId: string) {
    return categoryFilterAttributes.filter(a => a.category_id === categoryId);
  }
}
```

### Matching Parts to Categories
```typescript
// src/services/PartsMatcher.ts
export class PartsMatcher {
  matchCategory(partDescription: string, partType: string): string {
    // Use AI to match part description to category
    const categories = PicklistLoader.getCategories();
    
    // Example: "compressor for refrigerator" → PARTS_CAT_001 (Compressor)
    // Use OpenAI/Claude to semantically match
  }
  
  extractCompatibility(partData: any): CompatibilityData {
    // Extract Compatible Brand, Compatible Model from description
    return {
      compatible_brands: ["WHIRLPOOL", "KITCHENAID"],
      compatible_models: ["WRS325FDAM04", "WRS335FDDM04"],
      replaces_part_numbers: ["W10348269", "AP6020066"]
    };
  }
}
```

### Verifying Part Attributes
```typescript
// src/services/PartsVerification.ts
export class PartsVerification {
  async verifyPart(partData: PartData): Promise<VerificationResult> {
    const category = this.matchCategory(partData);
    const top15 = PicklistLoader.getCategoryAttributes(category.category_id);
    
    // Verify part has all critical attributes
    const criticalAttributes = top15.slice(0, 5); // Top 5 are most important
    const missingCritical = criticalAttributes.filter(attr => 
      !partData.hasOwnProperty(attr.attribute_name.toLowerCase().replace(/ /g, '_'))
    );
    
    if (missingCritical.length > 0) {
      return {
        status: 'incomplete',
        missing: missingCritical.map(a => a.attribute_name)
      };
    }
    
    // Use AI to verify compatibility claims
    const aiVerification = await this.verifyCompatibility(partData);
    
    return aiVerification;
  }
}
```

---

## 🧪 Testing Checklist

### Before Production
- [ ] All IDs replaced with real Salesforce IDs
- [ ] All 90 categories have Top 15 attributes defined
- [ ] Brands list covers your inventory (200+ brands recommended)
- [ ] Attributes match your data schema
- [ ] Picklist matcher tested with 100+ sample parts
- [ ] AI verification prompts updated for parts compatibility
- [ ] Cross-reference lookup tested (replaces_part_numbers)

### Test Cases
```javascript
// Test 1: OEM Part Matching
const testPart1 = {
  title: "Whirlpool Refrigerator Compressor W10348269",
  brand: "WHIRLPOOL",
  part_number: "W10348269",
  compatible_models: ["WRS325FDAM04"]
};
// Expected: PARTS_CAT_001 (Compressor), Top 15 attributes extracted

// Test 2: Aftermarket Part Matching
const testPart2 = {
  title: "Universal Air Filter 20x25x4 MERV 13",
  brand: "UNIVERSAL PARTS",
  filter_size: "20x25x4",
  merv_rating: "13"
};
// Expected: PARTS_CAT_057 (Air Filter), universal_fit = true

// Test 3: Model Compatibility
const testPart3 = {
  part_number: "ERP-W10348269",
  replaces: ["W10348269", "AP6020066"],
  fits_brands: ["WHIRLPOOL", "KITCHENAID", "MAYTAG"]
};
// Expected: Compatibility verification passes
```

---

## 📚 Reference Documents

### Essential Reading
1. **[PARTS-TAXONOMY-RESEARCH.md](PARTS-TAXONOMY-RESEARCH.md)** - Complete industry structure
2. **[PARTS-PICKLISTS-SUMMARY.md](PARTS-PICKLISTS-SUMMARY.md)** - What was created and why
3. **[APPLIANCE-VS-PARTS-COMPARISON.md](APPLIANCE-VS-PARTS-COMPARISON.md)** - Key differences

### Picklist Files
4. **[brands.json](../../../src/config/parts-picklists/brands.json)** - 85 brands
5. **[categories.json](../../../src/config/parts-picklists/categories.json)** - 90 categories
6. **[attributes.json](../../../src/config/parts-picklists/attributes.json)** - 150 attributes
7. **[category-filter-attributes.json](../../../src/config/parts-picklists/category-filter-attributes.json)** - Top 15 mappings

### Blueprints
8. **[PARTS-VERIFICATION-BLUEPRINT-INDEX.md](../../PARTS-VERIFICATION-BLUEPRINT-INDEX.md)** - Start here
9. **Parts Verification Implementation Blueprint** (Parts 1-3) - Complete implementation guide

---

## 🆘 Common Issues

### Issue: "Category not found"
**Cause**: Part description doesn't match any category name  
**Solution**: Use semantic matching (AI) instead of exact string match

### Issue: "Missing critical attributes"
**Cause**: Top 15 not defined for this category  
**Solution**: Complete Top 15 mappings for all 90 categories

### Issue: "Invalid Salesforce ID"
**Cause**: Still using placeholder IDs (PARTS_BRAND_001, etc.)  
**Solution**: Replace with real IDs from Salesforce: `a0M8c00000XAbCDEFG`

### Issue: "Compatibility verification fails"
**Cause**: Part claims compatibility with models it doesn't fit  
**Solution**: Cross-reference with OEM compatibility data or use AI research

---

## 🎯 Next Actions

### Immediate (This Week)
1. Copy picklists to new repo
2. Set up Salesforce objects (Brand__c, Category__c, Attribute__c)
3. Get real Salesforce IDs
4. Replace placeholder IDs in JSON files

### Short-term (This Month)
1. Complete Top 15 for all 90 categories
2. Expand brands list to 200+
3. Build picklist matcher service
4. Test with 1,000 sample parts

### Long-term (This Quarter)
1. Set up Salesforce sync endpoint
2. Implement auto-sync cron job
3. Build compatibility verification AI
4. Deploy to production

---

## 📞 Support

**Questions?**
- Check [PARTS-TAXONOMY-RESEARCH.md](PARTS-TAXONOMY-RESEARCH.md) for structure details
- Review [APPLIANCE-VS-PARTS-COMPARISON.md](APPLIANCE-VS-PARTS-COMPARISON.md) for key differences
- Read the Parts Verification Blueprint for complete implementation guide

**Need More Categories?**
- Analyze your inventory data
- Research parts marketplaces (marcone.com, encompass.com)
- Add new categories following existing structure

**Missing Attributes?**
- Check [attributes.json](../../../src/config/parts-picklists/attributes.json) (150 attributes)
- Add new attributes as needed
- Update Top 15 mappings

