# Category Size Class Analysis - All Categories Review

**Generated**: 2026-03-03  
**Purpose**: Identify which categories require industry-standard size class rounding for measurements

---

## Executive Summary

Currently, the system uses **mathematical rounding** (`Math.round()`) for ALL dimensional measurements. This causes issues like:
- 47.25" built-in refrigerator → shows "47-Inch" ❌ (should be "48-Inch")
- 35.5" built-in cooktop → shows "36-Inch" ✅ (correct by luck)
- 23.75" dishwasher → shows "24-Inch" ✅ (correct by luck)

**Solution Needed**: Implement **category-aware size class rounding** that understands:
1. Which categories have industry-standard measurement classes
2. What those standard sizes are per category
3. When to round UP vs DOWN vs exact

---

## Categories by Measurement Type

### 📐 APPLIANCES - Width (Inches) - STANDARD SIZE CLASSES

These categories have **established industry-standard widths** based on cabinet cutout dimensions:

#### Kitchen Appliances

| Category | Category ID | Width Standards (Inches) | Installation Context |
|----------|-------------|--------------------------|---------------------|
| **Refrigerator** | a01Hu000010Q5EpIAK | **18, 24, 27, 30, 33, 36, 42, 48, 60, 72** | Built-In requires standard cutouts |
| **Dishwasher** | a01Hu000010Q5EiIAK | **18, 24** | Standard cabinet sizes |
| **Range** | a01Hu000010Q5EnIAK | **20, 24, 30, 36, 48, 60** | Standard kitchen opening |
| **Cooktop** | a01Hu000010Q5EhIAK | **15, 24, 30, 36, 42, 48** | Standard counter cutout |
| **Oven** | a01Hu000010Q5EmIAK | **24, 27, 30, 36** | Wall oven cabinet sizes |
| **Microwave** | a01Hu000010Q5ElIAK | **24, 27, 30** | Over-range must match range |
| **Range Hood** | a01Hu000010Q5EoIAK | **24, 30, 36, 42, 48, 54, 60** | Must match range/cooktop |
| **Freezer** | a01Hu000010Q5EkIAK | **18, 24, 27, 30, 33, 36, 42, 48** | Same as refrigerator |
| **Icemaker** | a01Hu000011kFRfIAM | **15, 18, 24** | Undercounter standard sizes |
| **Drawer** (Warming) | a01Hu000011kpC2IAI | **24, 27, 30, 36** | Matches oven widths |
| **Wine Cooler** | (Part of Refrig) | **15, 18, 24** | Undercounter standard sizes |

**Rounding Logic Required**:
- **Built-In/Undercounter**: Round UP to next standard size (47.25" → 48")
- **Freestanding**: Can use mathematical rounding (29.75" → 30")
- **Detection Method**: Use `Installation Type` attribute

#### Laundry Appliances

| Category | Category ID | Width Standards (Inches) | Installation Context |
|----------|-------------|--------------------------|---------------------|
| **Washer** | a01Hu000010Q5EsIAK | **24, 27, 28, 29** | Standard laundry room |
| **Dryer** | a01Hu000010Q5EjIAK | **24, 27, 28, 29** | Matches washer width |
| **All in One Washer/Dryer** | a01Hu000010Q5EqIAK | **24, 27** | European compact sizes |

**Rounding Logic Required**:
- Washer/Dryer widths are PRECISE for stacking/side-by-side fit
- Use **EXACT MATCH ONLY** - 27.5" should NOT exist (would be 27" or 28")
- If actual width is 27.5", round to nearest (28")

---

### 📏 FLOORING - Plank Width (Inches) - STANDARD WIDTHS

| Category | Category ID | Width Standards (Inches) | Notes |
|----------|-------------|--------------------------|-------|
| **Hardwood Flooring** | a01aZ00000dCekSQAS | **2.25, 3, 3.25, 4, 5, 6, 7, 9** | Plank width standards |
| **Laminate Flooring** | a01aZ00000dCekTQAS | **3, 4, 5, 6, 7, 8** | Standard plank sizes |
| **Luxury Vinyl Flooring** | a01aZ00000dCekRQAS | **4, 6, 7, 8, 9** | LVP standard sizes |

**Rounding Logic Required**:
- Use **CLOSEST STANDARD** (round up if exactly between)
- 4.75" → 5", 6.25" → 6", 7.5" → 8"

---

### 🚪 HARDWARE - Diameter (Inches) - STANDARD SIZES

| Category | Category ID | Measurement | Standards |
|----------|-------------|-------------|-----------|
| **Cabinet Knob** | a01aZ00000dCejZQAS | Diameter | **1, 1.125, 1.25, 1.375, 1.5, 1.75, 2** |
| **Cabinet Pull** | a01aZ00000dCejcQAC | Length | **3, 4, 5, 6, 8, 10, 12, 14, 16** |
| **Appliance Pull** | a01aZ00000dCejSQAS | Length | **12, 18, 24, 30, 36** |
| **Door Knob** | a01aZ00000dCejBQAS | Diameter | **2, 2.5, 2.75, 3** |
| **Handleset** | a01aZ00000dCejEQAS | Length | **16, 18, 20, 24** |

**Rounding Logic Required**:
- Fractional precision matters (1.125" vs 1.25")
- Use **CLOSEST STANDARD** to 1/8" precision
- Cabinet pulls: round to nearest inch (5.5" → 6")

---

### 🔧 PLUMBING - GPM (Gallons Per Minute) - STANDARD FLOW RATES

| Category | Category ID | Measurement | Standards |
|----------|-------------|-------------|-----------|
| **Kitchen Faucet** | a01aZ00000dC5E9QAK | GPM | **1.5, 1.8, 2.2** |
| **Bathroom Faucet** | a01aZ00000dC5DeQAK | GPM | **1.2, 1.5, 2.2** |
| **Shower Faucet** | a01aZ00000dC5DtQAK | GPM | **1.5, 1.8, 2.0, 2.5** |
| **Tub Faucet** | a01aZ00000dC5DzQAK | GPM | **4, 5, 6, 8** |
| **Bar Faucet** | a01aZ00000dC5E3QAK | GPM | **1.5, 1.8** |
| **Pot Filler Faucet** | a01aZ00000dC5EHQA0 | GPM | **2.2, 2.5, 3.0** |

**Rounding Logic Required**:
- GPM is REGULATORY (WaterSense, EPA standards)
- Use **EXACT VALUE** from spec - DO NOT ROUND
- If value doesn't match standard, show as-is

---

### 💡 LIGHTING - Width/Diameter (Inches) - FLEXIBLE SIZES

| Category | Category ID | Measurement | Rounding |
|----------|-------------|-------------|----------|
| **Vanity Lighting** | a01aZ00000dC5EdQAK | Width | Round to nearest inch |
| **Chandelier** | a01aZ00000dC5ELQA0 | Diameter | Round to nearest inch |
| **Pendant** | a01aZ00000dC5EXQA0 | Diameter | Round to nearest inch |
| **Ceiling Fan** | a01aZ00000dC5EjQAK | Blade Span | **42, 44, 52, 54, 56, 60, 72** |
| **Flush/Semi-Flush** | a01aZ00000dC5ENQA0 | Diameter | Round to nearest inch |

**Rounding Logic Required**:
- Most lighting: **Mathematical rounding** (24.8" → 25")
- **Ceiling Fan Blade Span**: Standard motor sizes - **USE EXACT MATCH** (52.5" → 52")

---

### 🪟 MIRRORS & DÉCOR - Width × Height - FLEXIBLE

| Category | Category ID | Measurement | Rounding |
|----------|-------------|-------------|----------|
| **Bathroom Mirror** | a01aZ00000dC5DhQAK | W × H | Mathematical rounding |
| **Medicine Cabinet** | a01aZ00000dC5DqQAK | W × H | Round to nearest inch |
| **Mirror** (General) | a01aZ00000dCekJQAS | W × H | Mathematical rounding |

**Rounding Logic Required**:
- **Mathematical rounding** for both dimensions (35.75" × 23.5" → 36" × 24")

---

### 🚰 HVAC - CFM/BTU/Tonnage - STANDARD RATINGS

| Category | Category ID | Measurement | Standards |
|----------|-------------|-------------|-----------|
| **Bath Fan** | a01aZ00000dC5DcQAK | CFM | **50, 80, 100, 110, 150** |
| **Exhaust Fan** | a01aZ00000dCek6QAC | CFM | **50, 80, 100, 150, 200** |
| **Ceiling Fan** | a01aZ00000dC5EjQAK | CFM | Varies by model |
| **Range Hood** | a01aZ00000dC5EoIAK | CFM | **300, 400, 600, 900, 1200** |
| **Water Heater** | a01aZ00000bI2srQAC | BTU | **40K, 50K, 75K, 100K, 150K, 199K** |
| **Tankless Water Heater** | a01aZ00000dC5DwQAK | BTU | **140K, 160K, 180K, 199K, 240K** |

**Rounding Logic Required**:
- CFM/BTU are **PERFORMANCE RATINGS** from manufacturer
- Use **EXACT VALUE** - DO NOT ROUND
- Example: 385 CFM stays 385 CFM (not rounded to 400)

---

### 🛁 BATH - Sink/Tub Dimensions - FLEXIBLE

| Category | Category ID | Measurement | Rounding |
|----------|-------------|-------------|----------|
| **Bathroom Sink** | a01aZ00000dC5DiQAK | Width range | 16-48" flexible |
| **Kitchen Sink** | a01aZ00000dC5EDQA0 | Width range | 24-36" flexible |
| **Bathtub** | a01aZ00000dC5DlQAK | Length | **54, 60, 66, 72** |
| **Bathroom Vanity** | a01aZ00000dC5DjQAK | Width | **18, 24, 30, 36, 48, 60, 72** |

**Rounding Logic Required**:
- **Bathtub Length**: Standard alcove sizes - **USE STANDARD**
- **Vanity Width**: Standard cabinet sizes - **USE STANDARD** (47" → 48")
- **Sinks**: Mathematical rounding

---

### 🏡 CATEGORIES WITHOUT SIZE CLASSES (Mathematical Rounding Only)

These categories do NOT have industry-standard size classes - use **Math.round()** as-is:

**Flooring (Non-plank)**:
- Tile (varies by design)
- Carpet (varies)
- Waterproof Flooring (flexible)

**Hardware (Non-dimensional)**:
- Cabinet Hardware accessories
- Hinges
- Locks
- Sliding door hardware

**Outdoor**:
- Fire Pit (diameter flexible)
- Generator (not a critical dimension)
- Mailbox (flexible)
- Hardscaping (varies)

**Heating & Cooling**:
- Thermostat (no dimension)
- Air Filter (custom sizes)
- Dehumidifier (flexible)

**Décor**:
- Rug (flexible, common sizes but not standard)
- Chair (flexible)
- Wall Decor (varies)

---

## Implementation Recommendations

### Phase 1: High-Priority Categories (Production Impact)

**CRITICAL** - These affect sales daily:
1. ✅ **Refrigerator** - 47.25" → 48" issue (reported by user)
2. ✅ **Dishwasher** - Standard 18"/24"
3. ✅ **Range** - Standard kitchen opening sizes
4. ✅ **Cooktop** - Must match range widths
5. ✅ **Oven** - Wall cabinet standard sizes

**Why Priority**: Customers MUST know if appliances fit. Wrong size = order cancellation.

### Phase 2: Medium-Priority (SEO & UX)

6. Range Hood (must match range/cooktop)
7. Freezer (same logic as refrigerator)
8. Bathroom Vanity (standard cabinet sizes)
9. Bathtub (alcove sizes)
10. Washer/Dryer (precise matching required)

### Phase 3: Low-Priority (Quality Improvement)

11. Cabinet Hardware (diameter/length standards)
12. Lighting (mostly flexible, but ceiling fans have standards)
13. Flooring (plank width standards)
14. Icemaker/Wine Cooler (undercounter standards)

### Phase 4: No Action Required

- Categories with flexible dimensions (round mathematically)
- Performance ratings (CFM, BTU, GPM) - use EXACT value
- Categories without dimensions

---

## Proposed Data Structure

```typescript
/**
 * Industry-standard size classes by category
 */
export const CATEGORY_SIZE_CLASSES: Record<string, {
  attribute: string;           // Which attribute (Width, Height, Diameter, etc.)
  unit: string;                // "Inches", "GPM", "CFM", etc.
  standardSizes: number[];     // Array of standard sizes
  roundingMethod: 'UP' | 'NEAREST' | 'EXACT';  // How to round
  installationDependent?: boolean;  // If true, check Installation Type
}> = {
  // APPLIANCES
  'refrigerator': {
    attribute: 'Width (Inches)',
    unit: 'Inches',
    standardSizes: [18, 24, 27, 30, 33, 36, 42, 48, 60, 72],
    roundingMethod: 'UP',  // Built-in: round UP to next standard
    installationDependent: true  // Check if Built-In vs Freestanding
  },
  'dishwasher': {
    attribute: 'Width (Inches)',
    unit: 'Inches',
    standardSizes: [18, 24],
    roundingMethod: 'NEAREST',
    installationDependent: false
  },
  'range': {
    attribute: 'Width (Inches)',
    unit: 'Inches',
    standardSizes: [20, 24, 30, 36, 48, 60],
    roundingMethod: 'NEAREST',
    installationDependent: false
  },
  'cooktop': {
    attribute: 'Width (Inches)',
    unit: 'Inches',
    standardSizes: [15, 24, 30, 36, 42, 48],
    roundingMethod: 'UP',  // All cooktops are built-in
    installationDependent: false
  },
  'oven': {
    attribute: 'Width (Inches)',
    unit: 'Inches',
    standardSizes: [24, 27, 30, 36],
    roundingMethod: 'UP',  // Wall ovens = built-in
    installationDependent: false
  },
  // ... more categories
};
```

---

## Recommended Decision Points

Before implementing, let's decide together:

### Question 1: Scope of Phase 1
- **Option A**: Fix ONLY Refrigerator (the reported issue)
- **Option B**: Fix ALL Major Kitchen Appliances (Refrig, Dishwasher, Range, Cooktop, Oven)
- **Option C**: Fix ALL Appliances (include laundry, range hood, freezer, etc.)

**Recommendation**: **Option B** - Kitchen appliances are highest value, same logic applies

### Question 2: Rounding Method for Built-Ins
- **Option A**: Always round UP (47.25" → 48", 35.5" → 36")
- **Option B**: Round to NEAREST standard (47.25" → 48", 48.5" → 48")
- **Option C**: Smart logic (≤ X.25" stay below, > X.25" round up)

**Recommendation**: **Option A** - Safer for fitment (48" cutout fits 47" appliance, not vice versa)

### Question 3: Freestanding Appliances
- **Option A**: Use standard sizes even for freestanding (consistency)
- **Option B**: Use mathematical rounding for freestanding (accuracy)
- **Option C**: Skip dimension in title for freestanding (capacity only)

**Recommendation**: **Option A** - Consistency across product line

### Question 4: Implementation Timeline
- **Option A**: Implement all at once (1 comprehensive PR)
- **Option B**: Phase 1 → validate → Phase 2 → Phase 3 (incremental)
- **Option C**: Fix refrigerator immediately, plan others later

**Recommendation**: **Option B** - Validate approach with Phase 1 before scaling

---

## Next Steps

1. **Review this document** - User confirms approach
2. **Decide on scope** (Phase 1 categories)
3. **Define standard size arrays** for selected categories
4. **Implement smart rounding function** with configuration
5. **Test with sample data** (refrigerator, dishwasher, range)
6. **Deploy to production** (fix 47" → 48" issue)
7. **Monitor results** before expanding to more categories

---

## Questions for Discussion

1. Do these industry-standard sizes match your Salesforce data? Any missing standards?
2. Should we check Salesforce product database for actual width distribution before finalizing standards?
3. Are there any categories I've marked as "flexible" that actually have industry standards?
4. Do you have vendor spec sheets that show standard cutout sizes we should reference?
5. Should Wine Cooler / Beverage Center be separate from Refrigerator, or same standards?

