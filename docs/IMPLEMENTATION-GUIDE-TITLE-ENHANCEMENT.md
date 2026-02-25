# Title Enhancement Implementation Guide
## Code Changes & Testing Strategy - February 25, 2026

---

## Executive Summary

**Objective**: Fix AI-generated titles to include critical attributes missing from 60% of titles.

**Root Cause**: Schemas were excellent, but data wasn't flowing through the pipeline (AI → Mapping → Title Generator).

**Solution**: 3-phase fix:
1. ✅ Added missing fields to SEOTitleInput interface
2. ✅ Added attribute mappings (Place Settings, Control Type, Basin Count, Burner Count)
3. ✅ Added data extraction for CFM, GPM, BTU, Place Settings, Control Type, Basin Count
4. ✅ Enhanced AI prompt to emphasize critical attribute extraction

---

## Phase 1: Code Changes Made

### File 1: `src/services/seo-title-generator.service.ts`

#### Change 1.1: Added Missing Fields to SEOTitleInput Interface

**Location**: Lines ~35-100

**Added**:
```typescript
export interface SEOTitleInput {
  // ... existing fields ...
  
  numberOfBurners?: string | number;
  burnerCount?: string | number; // Alias for numberOfBurners ⭐ NEW
  placeSettings?: string | number; // For dishwashers ⭐ NEW
  
  // Type/Configuration
  type?: string;
  configuration?: string;
  installationType?: string;
  controlType?: string; // For dishwashers (Top Control, Front Control) ⭐ NEW
  basinCount?: string; // For sinks (Single Basin, Double Basin) ⭐ NEW
  // ... rest of fields ...
}
```

**Why**: These fields are critical for proper title generation but were missing from the interface.

---

#### Change 1.2: Added Attribute Mappings

**Location**: Lines ~110-180 (ATTRIBUTE_TO_FIELD)

**Added**:
```typescript
const ATTRIBUTE_TO_FIELD: Record<string, keyof SEOTitleInput | string> = {
  // ... existing mappings ...
  
  'Place Settings': 'placeSettings',  // ⭐ NEW
  'Burner Count': 'burnerCount',  // ⭐ NEW
  'Number of Burners': 'numberOfBurners',  // ⭐ EXISTING (now referenced)
  'Control Type': 'controlType',  // ⭐ NEW
  'Basin Count': 'basinCount',  // ⭐ NEW
  
  // ... rest of mappings ...
};
```

**Why**: Schema attributes need to map to input fields for the title generator to access them.

---

### File 2: `src/services/dual-ai-verification.service.ts`

#### Change 2.1: Added Data Extraction for Critical Attributes

**Location**: Lines 6730-6870 (seoTitleInput object)

**Added**:
```typescript
const seoTitleInput: SEOTitleInput = {
  // ... existing fields ...
  
  burnerCount: preferAIValue(
    consensus.agreedPrimaryAttributes.number_of_burners,
    openaiResult.primaryAttributes.number_of_burners,
    xaiResult.primaryAttributes.number_of_burners,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ),
  
  // Critical attributes often missing from AI extraction
  cfm: preferAIValue(
    consensus.agreedTop15Attributes?.cfm,
    openaiResult.top15Attributes?.cfm,
    xaiResult.top15Attributes?.cfm,
    openaiResult.confidence,
    xaiResult.confidence,
    rawProduct.CFM || ''
  ),
  gpm: preferAIValue(
    consensus.agreedTop15Attributes?.gpm,
    openaiResult.top15Attributes?.gpm,
    xaiResult.top15Attributes?.gpm,
    openaiResult.confidence,
    xaiResult.confidence,
    rawProduct.GPM || ''
  ),
  btu: preferAIValue(
    consensus.agreedTop15Attributes?.btu,
    openaiResult.top15Attributes?.btu,
    xaiResult.top15Attributes?.btu,
    openaiResult.confidence,
    xaiResult.confidence,
    rawProduct.BTU || ''
  ),
  placeSettings: preferAIValue(
    consensus.agreedTop15Attributes?.place_settings,
    openaiResult.top15Attributes?.place_settings,
    xaiResult.top15Attributes?.place_settings,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ),
  controlType: preferAIValue(
    consensus.agreedTop15Attributes?.control_type,
    openaiResult.top15Attributes?.control_type,
    xaiResult.top15Attributes?.control_type,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ),
  basinCount: preferAIValue(
    consensus.agreedTop15Attributes?.basin_count,
    openaiResult.top15Attributes?.basin_count,
    xaiResult.top15Attributes?.basin_count,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ),
  collection: preferAIValue(
    consensus.agreedTop15Attributes?.collection,
    openaiResult.top15Attributes?.collection,
    xaiResult.top15Attributes?.collection,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ),
  installationType: preferAIValue(
    consensus.agreedTop15Attributes?.installation_type || consensus.agreedPrimaryAttributes.installation_type,
    openaiResult.top15Attributes?.installation_type || openaiResult.primaryAttributes.installation_type,
    xaiResult.top15Attributes?.installation_type || xaiResult.primaryAttributes.installation_type,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ),
  
  // ... rest of fields ...
};
```

**Why**: These attributes need to be passed to the title generator. Even if AI extracts them, they weren't being sent.

---

#### Change 2.2: Enhanced AI Prompt for Critical Attribute Extraction

**Location**: Lines ~3490-3520

**Added** (before existing prompt content):
```typescript
⚠️ CRITICAL ATTRIBUTES FOR TITLE GENERATION:
You MUST extract these attributes from product descriptions based on category:

**APPLIANCES** (Cooktop, Range, Oven, Dishwasher, Refrigerator, Microwave, Washer, Dryer):
- Width (inches): Standard sizes are 24", 27", 30", 36", 48"
- Fuel Type: Gas, Electric, Induction, Dual Fuel (CRITICAL - customers need this!)
- Number of Burners: For cooktops/ranges (4, 5, 6 burners)
- Capacity: Cu. Ft. for refrigerators/ovens/washers/dryers
- Place Settings: For dishwashers (12, 14, 16 place settings)
- Control Type: For dishwashers (Top Control, Front Control)
- Installation Type: Built-In, Freestanding, Slide-In, Drop-In, Counter-Depth

**RANGE HOODS**:
- CFM: Airflow rating (CRITICAL - 100% of competitor titles include this!)
- Width: 30", 36", 48" standard
- Installation Type: Wall Mount, Under Cabinet, Island Mount, Insert

**PLUMBING FIXTURES** (Faucets, Showers, Tub Fillers, Sinks):
- GPM: Gallons Per Minute (1.2, 1.5, 1.8, 2.0, 2.5 GPM)
- Collection Name: For luxury brands (Graff, Kohler, Kallista, Axor)
- Installation Type: Wall Mount, Widespread, Single Hole, Deck Mount, Floor Mount
- Basin Count: For sinks (Single Basin, Double Basin)

**LIGHTING** (All lighting categories):
- Number of Lights: 1-Light, 3-Light, 5-Light, etc.
- Width: For vanity lights, chandeliers, pendants (in inches)
- Mounting Type: Ceiling Mount, Wall Mount, Flush Mount, Semi-Flush

**HEATING/COOKING**:
- BTU: British Thermal Units for heating capacity
```

**Why**: AI needs explicit instructions on what attributes are critical for each category type. This reduces the "guessing" and improves extraction accuracy.

---

## Phase 2: Testing Strategy by Category

### Priority 1: Range Hood (175 items - Highest Volume)

**Critical Attributes**: CFM, Width, Installation Type

**Test Case 1**:
```
Input Product:
  Ferguson_Title: "600 CFM 30 Inch Wide Wall Mounted Low-Profile Range Hood - Stainless Steel"
  Model: HMWB30WS

Expected Output:
  "THERMADOR 600 CFM 30-Inch Wide Wall Mounted Range Hood - Stainless Steel - HMWB30WS"

Validation:
  ✓ CFM present (600 CFM)
  ✓ Width present (30-Inch)
  ✓ Installation Type present (Wall Mounted)
  ✓ Brand first (THERMADOR)
  ✓ Finish at end before model
```

**Test Case 2**:
```
Input Product:
  Ferguson_Title: "400 CFM 36 Inch Wide Under Cabinet Range Hood - Stainless Steel"
  Brand: GE
  Model: PVX7300SJSS

Expected Output:
  "GE 400 CFM 36-Inch Wide Under Cabinet Range Hood - Stainless Steel - PVX7300SJSS"

Validation:
  ✓ CFM present (400 CFM)
  ✓ Width present (36-Inch)
  ✓ Installation Type present (Under Cabinet)
```

**Current Schema** (Already Perfect):
```typescript
"range_hood": {
  "slots": [
    { "position": 1, "attribute": "CFM", "format": "{value} CFM" },
    { "position": 2, "attribute": "Width (Inches)", "format": "{value}-Inch" },
    { "position": 3, "attribute": "Type" }, // Installation Type
    { "position": 4, "attribute": "Brand" },
    { "position": 5, "attribute": "Category" },
    { "position": 6, "attribute": "Finish" }
  ]
}
```

**What Changed**: Now extracts and passes `cfm`, `width`, `installationType` data to title generator.

---

### Priority 2: Dishwasher (78 items)

**Critical Attributes**: Width, Place Settings, Control Type, Installation Type

**Test Case 1**:
```
Input Product:
  Ferguson_Title: "24 Inch Wide 16 Place Setting Top Control Built-In Dishwasher - Stainless Steel"
  Brand: GE
  Model: GDT665SSNSS

Expected Output:
  "GE 24-Inch 16 Place Setting Top Control Built-In Dishwasher - Stainless Steel - GDT665SSNSS"

Validation:
  ✓ Width present (24-Inch)
  ✓ Place Settings present (16 Place Setting)
  ✓ Control Type present (Top Control)
  ✓ Installation Type present (Built-In)
```

**Test Case 2**:
```
Input Product:
  Ferguson_Title: "24 Inch Wide 12 Place Setting Front Control Dishwasher - Black"
  Brand: WHIRLPOOL
  Model: WDF332PAMS

Expected Output:
  "WHIRLPOOL 24-Inch 12 Place Setting Front Control Dishwasher - Black - WDF332PAMS"

Validation:
  ✓ Width present (24-Inch)
  ✓ Place Settings present (12 Place Setting)
  ✓ Control Type present (Front Control)
```

**Current Schema** (Already Perfect):
```typescript
"dishwasher": {
  "slots": [
    { "position": 1, "attribute": "Brand" },
    { "position": 2, "attribute": "Width (Inches)", "format": "{value}-Inch" },
    { "position": 3, "attribute": "Place Settings", "format": "{value} Place Setting" },
    { "position": 4, "attribute": "Control Type" },
    { "position": 5, "attribute": "Type" }, // Installation Type
    { "position": 6, "attribute": "Category" },
    { "position": 7, "attribute": "Finish" }
  ]
}
```

**What Changed**: Now extracts and passes `placeSettings`, `controlType` data to title generator.

---

### Priority 3: Cooktop (59 items) - P0 FUEL TYPE ISSUE

**Critical Attributes**: Width, Burner Count, **Fuel Type** (Gas/Electric/Induction), Installation Type

**Test Case 1**:
```
Input Product:
  Ferguson_Title: "36 Inch Wide 5 Burner Gas Built-In Cooktop - Stainless Steel"
  Brand: GE
  Model: PGP966SETSS

Expected Output:
  "GE 36-Inch 5-Burner Gas Built-In Cooktop - Stainless Steel - PGP966SETSS"

Validation:
  ✓ Width present (36-Inch)
  ✓ Burner Count present (5-Burner)
  ✓ Fuel Type present (Gas) ⚠️ CRITICAL
  ✓ Installation Type present (Built-In)
```

**Test Case 2**:
```
Input Product:
  Ferguson_Title: "30 Inch Wide 4 Burner Induction Cooktop - Black"
  Brand: SAMSUNG
  Model: NZ36K7880US

Expected Output:
  "SAMSUNG 30-Inch 4-Burner Induction Cooktop - Black - NZ36K7880US"

Validation:
  ✓ Width present (30-Inch)
  ✓ Burner Count present (4-Burner)
  ✓ Fuel Type present (Induction) ⚠️ CRITICAL
```

**Current Schema** (Already Perfect):
```typescript
"cooktop": {
  "slots": [
    { "position": 1, "attribute": "Brand" },
    { "position": 2, "attribute": "Width (Inches)", "format": "{value}-Inch" },
    { "position": 3, "attribute": "Burner Count", "format": "{value}-Burner" },
    { "position": 4, "attribute": "Fuel Type" }, // ⚠️ CRITICAL
    { "position": 5, "attribute": "Installation Type" },
    { "position": 6, "attribute": "Category" },
    { "position": 7, "attribute": "Finish" }
  ]
}
```

**What Changed**: Now extracts and passes `fuelType`, `burnerCount`, `installationType` data to title generator.

---

### Priority 4: Dryer (48 items) - P0 FUEL TYPE ISSUE

**Critical Attributes**: Width, Capacity, **Fuel Type** (Gas/Electric/Heat Pump)

**Test Case 1**:
```
Input Product:
  Ferguson_Title: "27 Inch Wide 7.4 Cu. Ft. Gas Dryer with Steam Sanitize+ - Brushed Black"
  Brand: SAMSUNG
  Model: DVG52A5500V

Expected Output:
  "SAMSUNG 27-Inch Wide 7.4 Cu. Ft. Gas Dryer - Brushed Black - DVG52A5500V"

Validation:
  ✓ Width present (27-Inch)
  ✓ Capacity present (7.4 Cu. Ft.)
  ✓ Fuel Type present (Gas) ⚠️ CRITICAL
```

**Test Case 2**:
```
Input Product:
  Ferguson_Title: "24 Wide 4.2 Cu. Ft. Ventless Electric Dryer with Dual Inverter HeatPump"
  Brand: LG
  Model: DLHC1455W

Expected Output:
  "LG 24-Inch Wide 4.2 Cu. Ft. Ventless Electric Dryer with Dual Inverter HeatPump - White - DLHC1455W"

Validation:
  ✓ Width present (24-Inch)
  ✓ Capacity present (4.2 Cu. Ft.)
  ✓ Fuel Type present (Electric / Heat Pump) ⚠️ CRITICAL
```

**Current Schema** (Already Good):
```typescript
"dryer": {
  "slots": [
    { "position": 1, "attribute": "Brand" },
    { "position": 2, "attribute": "Width (Inches)", "format": "{value}-Inch" },
    { "position": 3, "attribute": "Capacity (Cu. Ft.)" },
    { "position": 4, "attribute": "Type" },
    { "position": 5, "attribute": "Fuel Type" }, // ⚠️ CRITICAL
    { "position": 6, "attribute": "Category" },
    { "position": 7, "attribute": "Finish" }
  ]
}
```

**What Changed**: Now extracts and passes `fuelType` data to title generator.

---

### Priority 5: Kitchen Faucet (28 items)

**Critical Attributes**: Collection, GPM, Installation Type

**Test Case 1**:
```
Input Product:
  Ferguson_Title: "Bolden 1.8 GPM Single Hole Pre-Rinse Pull Down Kitchen Faucet - Spot Free Stainless Steel"
  Brand: Kraus
  Model: KSF-1610SFSMB

Expected Output:
  "Kraus Bolden 1.8 GPM Single Hole Pre-Rinse Pull Down Kitchen Faucet - Spot Free Stainless Steel - KSF-1610SFSMB"

Validation:
  ✓ Collection present (Bolden)
  ✓ GPM present (1.8 GPM)
  ✓ Installation Type present (Single Hole)
  ✓ Type present (Pull Down)
```

**Test Case 2**:
```
Input Product:
  Ferguson_Title: "Edwardian 1.5 GPM Widespread Bridge Kitchen Faucet - Unlacquered Brass"
  Brand: PERRIN & ROWE
  Model: U.4764L-ULB-2

Expected Output:
  "PERRIN & ROWE Edwardian 1.5 GPM Widespread Bridge Kitchen Faucet - Unlacquered Brass - U.4764L-ULB-2"

Validation:
  ✓ Collection present (Edwardian)
  ✓ GPM present (1.5 GPM)
  ✓ Installation Type present (Widespread)
  ✓ Type present (Bridge)
```

**Current Schema** (Already Perfect):
```typescript
"kitchen_faucet": {
  "slots": [
    { "position": 1, "attribute": "Brand" },
    { "position": 2, "attribute": "Collection" },
    { "position": 3, "attribute": "GPM", "format": "{value} GPM" },
    { "position": 4, "attribute": "Installation Type" },
    { "position": 5, "attribute": "Type" },
    { "position": 6, "attribute": "Category" },
    { "position": 7, "attribute": "Finish" }
  ]
}
```

**What Changed**: Now extracts and passes `gpm`, `collection`, `installationType` data to title generator.

---

## Phase 3: Validation Strategy

### Automated Testing

**Script**: Create `scripts/test-title-generation.js`

```javascript
const { generateSEOTitle } = require('../dist/services/seo-title-generator.service');

const testCases = [
  // Range Hood
  {
    category: 'Range Hood',
    input: {
      brand: 'THERMADOR',
      cfm: 600,
      width: 30,
      type: 'Wall Mount',
      category: 'Range Hood',
      finish: 'Stainless Steel',
      modelNumber: 'HMWB30WS'
    },
    expected: /600 CFM.*30-Inch.*Wall Mount.*THERMADOR.*Range Hood.*Stainless Steel/
  },
  // Dishwasher
  {
    category: 'Dishwasher',
    input: {
      brand: 'GE',
      width: 24,
      placeSettings: 16,
      controlType: 'Top Control',
      type: 'Built-In',
      category: 'Dishwasher',
      finish: 'Stainless Steel',
      modelNumber: 'GDT665SSNSS'
    },
    expected: /24-Inch.*16 Place Setting.*Top Control.*Built-In.*Dishwasher/
  },
  // Cooktop
  {
    category: 'Cooktop',
    input: {
      brand: 'GE',
      width: 36,
      burnerCount: 5,
      fuelType: 'Gas',
      installationType: 'Built-In',
      category: 'Cooktop',
      finish: 'Stainless Steel',
      modelNumber: 'PGP966SETSS'
    },
    expected: /36-Inch.*5-Burner.*Gas.*Built-In.*Cooktop/
  }
];

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = generateSEOTitle(test.input);
  if (test.expected.test(result)) {
    console.log(`✓ Test ${index + 1} (${test.category}): PASSED`);
    console.log(`  Generated: ${result}`);
    passed++;
  } else {
    console.log(`✗ Test ${index + 1} (${test.category}): FAILED`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Generated: ${result}`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

### Manual Testing Checklist

**Before Deployment**:
- [ ] Compile TypeScript without errors (`npm run build`)
- [ ] Run test file with 10+ test cases per priority category
- [ ] Verify CFM appears in 100% of Range Hood test titles
- [ ] Verify Fuel Type appears in 100% of Cooktop/Dryer test titles
- [ ] Verify GPM appears in 90%+ of Faucet test titles
- [ ] Verify Place Settings appears in 90%+ of Dishwasher test titles

**After Production Deployment**:
- [ ] Run API Accuracy Report (`node scripts/verification-api-accuracy-audit.js`)
- [ ] Check title completeness rate (target: 90%+)
- [ ] Verify CFM in Range Hood titles (sample 20 recent jobs)
- [ ] Verify Fuel Type in Cooktop titles (sample 20 recent jobs)
- [ ] Verify Fuel Type in Dryer titles (sample 20 recent jobs)
- [ ] Monitor error logs for 1 hour post-deployment
- [ ] Check webhook delivery success rate (should not drop)

---

## Phase 4: Deployment Plan

### Pre-Deployment

1. **Run Migration Script**:
   ```bash
   bash scripts/migrate-title-enhancements.sh
   ```
   This validates:
   - Changes are applied correctly
   - TypeScript compiles without errors
   - Backups are created

2. **Local Testing**:
   ```bash
   npm run dev
   # Test with sample products from each priority category
   ```

3. **Commit Changes**:
   ```bash
   git add src/services/seo-title-generator.service.ts
   git add src/services/dual-ai-verification.service.ts
   git add scripts/migrate-title-enhancements.sh
   git add docs/IMPLEMENTATION-GUIDE-TITLE-ENHANCEMENT.md
   git commit -m "feat: enhance title generation with critical attributes

   - Added placeSettings, controlType, basinCount fields to SEOTitleInput
   - Added attribute mappings for new fields
   - Enhanced data extraction for CFM, GPM, BTU, Place Settings
   - Updated AI prompt to emphasize critical attribute extraction
   
   Priority Categories:
   - Range Hood: Now extracts CFM, Installation Type
   - Dishwasher: Now extracts Place Settings, Control Type
   - Cooktop: Now extracts Fuel Type, Burner Count
   - Dryer: Now extracts Fuel Type
   - Faucets: Now extracts GPM, Collection, Installation Type
   
   Impact: Expected 50% improvement in title completeness (40% → 90%+)"
   ```

4. **Push to GitHub**:
   ```bash
   git push origin main
   ```

### Production Deployment

5. **Deploy to Production**:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && \
      git pull origin main && \
      npm install && \
      npm run build && \
      systemctl restart catalog-verification"
   ```

6. **Verify Production Health**:
   ```bash
   curl -s https://verify.cxc-ai.com/health
   ```

   Expected response:
   ```json
   {"status":"healthy","timestamp":"..."}
   ```

### Post-Deployment Validation

7. **Monitor Logs** (first 15 minutes):
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "tail -f /opt/catalog-verification-api/logs/combined.log"
   ```

   Watch for:
   - ✓ SEO title generation messages
   - ✓ No TypeScript errors
   - ✓ No "undefined" or "null" in title fields

8. **Run API Accuracy Report** (after 1 hour):
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"
   ```

   Compare metrics:
   - Title completeness rate (before vs after)
   - Critical attribute presence rates
   - Pass rates by category

9. **Spot Check Recent Jobs** (after 2 hours):
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && node scripts/check-recent-jobs.js --limit 50 --category 'Range Hood'"
   ```

   Validate:
   - CFM present in Range Hood titles
   - Fuel Type present in Cooktop/Dryer titles
   - GPM present in Faucet titles

---

## Phase 5: Rollback Plan (If Needed)

### Indicators for Rollback

🚨 **Rollback immediately if**:
- Error rate increases by >10%
- Service health check fails
- Webhook delivery rate drops >5%
- TypeScript runtime errors in logs

⚠️ **Consider rollback if**:
- Title completeness rate doesn't improve
- New attribute values are consistently "undefined"
- AI extraction accuracy drops

### Rollback Procedure

1. **Restore from Backup**:
   ```bash
   # Find backup directory created by migration script
   ls -lt backup-* | head -1
   BACKUP_DIR="backup-YYYYMMDD-HHMMSS"  # Use actual directory name
   
   cp $BACKUP_DIR/seo-title-generator.service.ts src/services/
   cp $BACKUP_DIR/dual-ai-verification.service.ts src/services/
   ```

2. **Rebuild**:
   ```bash
   npm run build
   ```

3. **Redeploy to Production**:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && \
      git stash && \
      npm run build && \
      systemctl restart catalog-verification"
   ```

4. **Verify Rollback**:
   ```bash
   curl -s https://verify.cxc-ai.com/health
   ```

5. **Investigate Root Cause** before re-attempting deployment.

---

## Success Metrics

### Target Improvements

| Metric | Before | Target | Timeframe |
|--------|--------|--------|-----------|
| **Title Completeness** | ~40% | 90%+ | Immediate |
| **CFM in Range Hood** | ~10% | 100% | Immediate |
| **Fuel Type in Cooktop** | ~0% | 100% | Immediate |
| **Fuel Type in Dryer** | ~0% | 100% | Immediate |
| **GPM in Faucets** | ~15% | 90%+ | Immediate |
| **Place Settings in Dishwasher** | ~5% | 90%+ | Immediate |
| **Overall API Accuracy** | Baseline | +10-15pts | 24 hours |

### Monitoring Dashboard

Track these metrics for 7 days post-deployment:

1. **Daily title completeness rate trend**
2. **Critical attribute presence by category**
3. **API call success rate**
4. **Webhook delivery success rate**
5. **Self-healing system activity** (should not increase)

---

## Support & Troubleshooting

### Common Issues

**Issue 1**: Titles still missing attributes after deployment

**Diagnosis**:
```bash
# Check if AI is extracting the attributes
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -A 50 'agreedTop15Attributes' /opt/catalog-verification-api/logs/combined.log | tail -100"
```

**Solution**: If attributes are in AI response but not in titles, check attribute mapping in ATTRIBUTE_TO_FIELD.

---

**Issue 2**: TypeScript compilation errors

**Diagnosis**:
```bash
npm run build 2>&1 | tee /tmp/build-errors.txt
```

**Solution**: Check for typos in interface definitions or missing imports.

---

**Issue 3**: AI not extracting expected attributes

**Diagnosis**: Check AI prompt received the updates.

**Solution**: Verify prompt changes in dual-ai-verification.service.ts (lines ~3490-3520). AI may need more explicit extraction instructions for specific categories.

---

## Next Steps After Success

1. **Expand to Additional Categories**:
   - Oven (55 items)
   - Refrigerator (91 items)
   - Bathroom Faucet (50 items)
   - Microwave (28 items)

2. **Fine-Tune AI Prompts**:
   - Add category-specific extraction examples
   - Emphasize unit formatting (30" vs 30-Inch)

3. **Create Monitoring Alerts**:
   - Alert if title completeness drops below 85%
   - Alert if critical attributes missing >10% of time

4. **Document Patterns**:
   - Create category-specific extraction guides
   - Build library of common attribute patterns

---

## Conclusion

This implementation fixes the title generation data pipeline by ensuring critical attributes flow from AI extraction through to the title generator. The schemas were already excellent; we just needed to connect the dots.

**Expected Impact**: Title completeness improves from 40% to 90%+, with critical attributes (CFM, Fuel Type, GPM, Place Settings) present in 90-100% of titles for priority categories.

**Timeline**: Changes take effect immediately upon deployment. Full validation within 24 hours.

---

**Document Version**: 1.0  
**Last Updated**: February 25, 2026  
**Next Review**: After 7 days in production
