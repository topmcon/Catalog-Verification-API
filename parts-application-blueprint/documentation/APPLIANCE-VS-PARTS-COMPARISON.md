# APPLIANCE vs PARTS - Structural Comparison

**Purpose**: Side-by-side comparison of appliance catalog vs parts catalog structure  
**Date**: February 4, 2026

---

## Quick Reference

| Aspect | Appliance Catalog | Parts Catalog |
|--------|------------------|---------------|
| **Primary Focus** | Complete products | Replacement components |
| **Key Identifier** | Model Number | Part Number + Compatible Models |
| **Brands** | Manufacturers (Sub-Zero, Wolf) | OEM + Aftermarket (Whirlpool + Supco) |
| **Categories** | Product types (Cooktop, Dishwasher) | Component types (Compressor, Drain Pump) |
| **Departments** | Appliances, Plumbing, Lighting | Appliance Parts, HVAC Parts, Electronics Parts |
| **Critical Attributes** | Features (Number Of Burners, Capacity) | Compatibility (Compatible Brand, Compatible Model) |
| **Styles** | Product styles (Contemporary, Traditional) | Part types (OEM, Aftermarket, Universal) |

---

## Categories Comparison

### Appliance Catalog Example
```
Department: Appliances
  Family: Kitchen
    Category: Cooktop
      Attributes: Number Of Burners, Fuel Type, Voltage, Width, Depth, Installation Type
```

### Parts Catalog Example  
```
Department: Appliance Parts
  Family: Refrigerator Parts
    Category: Compressor
      Attributes: Compatible Brand, Compatible Model, Compressor Type, Refrigerant Type, Voltage, BTU
```

---

## Brand Strategy

### Appliance Brands (Finished Products)
- **Focus**: Luxury vs mass market manufacturers
- **Examples**: SUB-ZERO, WOLF, THERMADOR, VIKING (luxury) | WHIRLPOOL, GE, SAMSUNG (mass market)
- **Count**: ~100 brands
- **Naming**: Brand name only (e.g., "WOLF")

### Parts Brands (Components & Manufacturers)
- **Focus**: OEM vs aftermarket vs component suppliers
- **Examples**: WHIRLPOOL (OEM) | SUPCO (aftermarket) | COPELAND (compressor manufacturer)
- **Count**: 85 brands (expandable to 200+)
- **Naming**: Same as OEM for compatibility (e.g., "WHIRLPOOL" parts for Whirlpool appliances)
- **Additional**: Generic brands (Universal Parts, Aftermarket)

---

## Attribute Priorities

### Appliance Catalog - Top Attributes
1. Product features (Number Of Burners, Ice Production Rate)
2. Physical dimensions (Width, Height, Depth)
3. Installation requirements (Installation Type, Voltage)
4. Energy efficiency (Energy Star, Annual Energy Use)
5. Aesthetics (Color, Finish, Style)

### Parts Catalog - Top Attributes
1. **Compatibility** (Compatible Brand, Compatible Model) - CRITICAL
2. **Part identification** (Part Number, OEM Part Number, Replaces Part Numbers)
3. **Electrical specs** (Voltage, Amperage, Wattage) - More detailed
4. **Physical specs** (Length, Width, Diameter, Thread Size) - More precise
5. **Installation info** (Installation Difficulty, Tools Required, Mounting Type)

---

## Unique Parts Requirements

Parts have additional complexity not present in finished products:

### 1. Cross-Reference Data
```json
{
  "part_number": "WPW10348269",
  "oem_part_number": "W10348269",
  "replaces_part_numbers": ["AP6020066", "W10193888", "W10348270"],
  "superseded_by": null,
  "compatible_models": ["WRS325FDAM04", "WRS335FDDM04", "WRS325FDAW04"],
  "compatible_brands": ["WHIRLPOOL", "KITCHENAID", "MAYTAG"],
  "universal_fit": false
}
```

### 2. Model Compatibility Matrix
Parts must specify which appliance models they fit:
- **Exact model numbers**: "WRS325FDAM04"
- **Model series**: "WRS325FDAM*" (all revisions)
- **Year range**: "2015-2020"
- **Brand compatibility**: Works with Whirlpool, KitchenAid, Maytag

### 3. OEM vs Aftermarket Distinction
```
OEM Part:
  - Part Number: W10348269
  - Brand: WHIRLPOOL
  - OEM or Aftermarket: OEM
  - Price: Higher
  - Warranty: Manufacturer warranty

Aftermarket Part:
  - Part Number: ERP-W10348269
  - Brand: ERP (Exact Replacement Parts)
  - OEM or Aftermarket: Aftermarket
  - Compatible with: W10348269
  - Price: Lower
  - Warranty: Aftermarket warranty
```

---

## Picklist File Comparison

### Appliance Picklists (Current)
```
src/config/salesforce-picklists/
├── brands.json          (1,374 lines - 458 brands)
├── categories.json      (1,274 lines - 424 categories)
├── styles.json          (~30 styles - Contemporary, Traditional, Modern, etc.)
├── attributes.json      (~200 attributes - product features)
└── category-filter-attributes.json (17,270 lines - Top 15 per category)
```

### Parts Picklists (New)
```
src/config/parts-picklists/
├── brands.json          (87 lines - 85 brands - OEM, Aftermarket, Component manufacturers)
├── categories.json      (92 lines - 90 categories - Parts by department/family)
├── styles.json          (12 lines - 10 styles - OEM, Aftermarket, Universal, etc.)
├── attributes.json      (152 lines - 150 attributes - compatibility, electrical, physical)
└── category-filter-attributes.json (137 lines - Top 15 for 9 categories so far)
```

---

## Example: Cooktop vs Compressor

### Appliance: Cooktop
```json
{
  "category_name": "Cooktop",
  "department": "Appliances",
  "family": "Kitchen",
  "top_15_attributes": [
    "Number Of Burners",
    "Fuel Type",
    "Voltage",
    "Hot Surface Indicator Lights",
    "Installation Type",
    "Induction",
    "Amperage",
    "Control Type",
    "Material",
    "Griddle",
    "Frequency",
    "Width",
    "Depth",
    "Color",
    "Finish"
  ]
}
```

### Part: Compressor (for Refrigerator)
```json
{
  "category_name": "Compressor",
  "department": "Appliance Parts",
  "family": "Refrigerator Parts",
  "top_15_attributes": [
    "Compatible Brand",           // NEW - Critical for parts
    "Compatible Model",            // NEW - Critical for parts
    "Compressor Type",
    "Refrigerant Type",
    "Cooling Capacity (BTU)",
    "Voltage",
    "Amperage",
    "Mounting Type",
    "Connection Type",
    "Oil Type",
    "OEM or Aftermarket",         // NEW - Parts distinction
    "Warranty Period",
    "Condition",                  // NEW - New vs Refurbished
    "Part Number",                // NEW - Critical identifier
    "Replaces Part Numbers"       // NEW - Cross-reference
  ]
}
```

---

## Search & Discovery Differences

### Appliance Search (User looking to buy an appliance)
**User Query**: "36 inch gas cooktop with 5 burners"  
**Filter By**: Width, Fuel Type, Number Of Burners, Brand, Price  
**Result**: List of complete cooktops matching criteria

### Parts Search (User looking to fix a broken appliance)
**User Query**: "Whirlpool refrigerator compressor for model WRS325FDAM04"  
**Filter By**: Compatible Brand, Compatible Model, Part Type  
**Result**: List of OEM and aftermarket compressors that fit this model

**Alternative Search**: "Part number W10348269"  
**Result**: Exact part + compatible alternatives + superseding parts

---

## AI Verification Differences

### Appliance Verification
```typescript
// Verify product specs match category
const prompt = `
  Verify this cooktop:
  - Number of burners matches description
  - Fuel type is correct (gas/electric)
  - Dimensions are reasonable
  - Features match listed specs
`;
```

### Parts Verification
```typescript
// Verify part compatibility
const prompt = `
  Verify this compressor part:
  - Compatible with stated appliance brands
  - Compatible with listed model numbers
  - Correct refrigerant type for these models
  - Electrical specs match OEM requirements
  - Part number cross-references are valid
  - OEM vs aftermarket designation is accurate
`;
```

---

## Key Takeaways

### Parts Are More Complex Than Products
1. **Compatibility is king** - Most important filter for parts
2. **Part numbers are critical** - Must handle OEM + aftermarket + superseded numbers
3. **Cross-reference data** - Parts replace other parts, must track supersession chain
4. **Installation complexity** - DIY customers need difficulty level and tool requirements
5. **Condition matters** - New vs refurbished affects price and warranty
6. **Multiple brands** - OEM manufacturers + aftermarket suppliers + component manufacturers

### Blueprint Revisions Needed
- Replace appliance examples (Cooktop → Compressor)
- Add compatibility matching logic
- Add part number cross-reference system
- Update AI prompts to check compatibility
- Add OEM/aftermarket distinction logic
- Include installation difficulty assessment

### Database Model Changes
- Add `compatible_models` array field
- Add `compatible_brands` array field
- Add `replaces_part_numbers` array field
- Add `superseded_by` string field
- Add `oem_or_aftermarket` enum field
- Add `installation_difficulty` enum field

---

## Next Steps

1. ✅ Created parts picklists (brands, categories, attributes, styles)
2. ⏳ Revise blueprints to use parts examples instead of appliance examples
3. ⏳ Update AI prompts for parts-specific verification
4. ⏳ Add compatibility matching service
5. ⏳ Add part number cross-reference lookup
6. ⏳ Complete Top 15 mappings for remaining 81 categories

