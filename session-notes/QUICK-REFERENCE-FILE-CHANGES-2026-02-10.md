# QUICK REFERENCE: FILE CHANGES SUMMARY
**Generated**: February 10, 2026

---

## FILE UPDATE CHECKLIST

### ✅ categories.json
**Action**: REMOVE 117 categories (55% reduction: 212 → 95)

**Duplicates to Remove (10):**
```
a01aZ00000dCejSQAS  - Cabinet Hardware (duplicate)
a01aZ00000dCekAQAS  - Fire Pit (duplicate)
a01aZ00000dCejpQAC  - Generator (duplicate)
a01aZ00000dCek4QAC  - Hardscaping (duplicate)
a01aZ00000dCeksQAC  - Lamp (duplicate)
a01aZ00000dCejrQAC  - Outdoor Ceiling Fan (duplicate)
a01aZ00000dCekNQAS  - Outdoor Lighting (duplicate)
a01aZ00000dCekKQAS  - Patio Heater (duplicate)
a01aZ00000dCekOQAS  - Rug (duplicate)
a01aZ00000dCekGQAS  - Tankless Water Heater (duplicate - becomes type ID)
```

**Price Tier Categories to Remove (9):**
```
a01aZ00000dCejQQAS  - Affordable Cabinet Knob
a01aZ00000dCejRQAS  - Affordable Cabinet Pull
a01aZ00000dCejdQAC  - Designer Cabinet Hardware
a01aZ00000dC5EoQAK  - Designer Ceiling Fan
a01aZ00000dC5F6QAK  - Designer Hardware
a01aZ00000dCejfQAC  - Luxury Cabinet Knob
a01aZ00000dCejgQAC  - Luxury Cabinet Pull
a01aZ00000dC5EGQA0  - Luxury Kitchen (vague - just delete)
a01aZ00000dC5EyQAK  - Trending Ceiling Fan
```

**Ceiling Fan Variations to Remove (15):**
```
a01aZ00000dC5EkQAK  - Ceiling Fan with Light → Attribute
a01aZ00000dC5EmQAK  - Ceiling Fan without Light → Attribute
a01aZ00000dC5ElQAK  - Ceiling Fan with Remote → Attribute
a01aZ00000dC5EnQAK  - DC Motor Ceiling Fan → Type
a01aZ00000dC5EpQAK  - Dual Ceiling Fan → Type
a01aZ00000dC5EsQAK  - Indoor Ceiling Fan → Type
a01aZ00000dC5EvQAK  - Outdoor Ceiling Fan → Type
a01aZ00000dC5ErQAK  - Hugger Fan → Type
a01aZ00000dC5EuQAK  - LED Ceiling Fan → Attribute
a01aZ00000dC5EtQAK  - Large Ceiling Fan → Attribute
a01aZ00000dC5EwQAK  - Small Ceiling Fan → Attribute
a01aZ00000dC5EUQA0  - Lighted Ceiling Fan → Attribute
a01aZ00000dC5ExQAK  - Smart Home Fan → Attribute
a01aZ00000dC5EqQAK  - Fandelier Ceiling Fan → Style
```

**Cabinet Hardware to Consolidate (8):**
```
a01aZ00000dCejZQAS  - Cabinet Knob → Type
a01aZ00000dCejcQAC  - Cabinet Pull → Type
[+ 6 more: Hinge, Catch/Latch, Lock, Backplate, Appliance Pull]
```

---

### ✅ category-type-mapping.json
**Action**: ADD 77 new category definitions + ~280 new type entries

**New Type Mappings to ADD:**

#### PRIORITY 1: Faucets (9 categories - 100% missing types)
```json
Kitchen Faucet      (a01aZ00000dC5E9QAK)  → 9 types
Bathroom Faucet     (a01aZ00000dC5DeQAK)  → 8 types
Tub Faucet          (a01aZ00000dC5DzQAK)  → 7 types
Shower Faucet       (a01aZ00000dC5DtQAK)  → 7 types
Bar Faucet          (a01aZ00000dC5E3QAK)  → 4 types
Bidet Faucet        (a01aZ00000dC5DmQAK)  → 4 types
Pot Filler Faucet   (a01aZ00000dC5EHQA0)  → 3 types
Food Service Faucet (a01aZ00000dC5E5QAK)  → 4 types
Outdoor Shower Faucet (a01aZ00000dCejwQAC) → 3 types
```

#### PRIORITY 2: Ceiling Fan (1 category consolidated)
```json
Ceiling Fan (a01aZ00000dC5EjQAK) → 5 types
  Types: Indoor, Outdoor, Hugger, DC Motor, Dual Motor
  REUSE IDs from removed categories as type IDs
```

#### PRIORITY 3: Major Plumbing Fixtures
```json
Bathtub         (a01aZ00000dC5DlQAK)  → 9 types
Bathroom Sink   (a01aZ00000dC5DiQAK)  → 8 types
Kitchen Sink    (a01aZ00000dC5E9QAK)  → 7 types
Toilet          (a01aZ00000dC5DyQAK)  → 7 types
Shower          (a01aZ00000dC5DuQAK)  → 7 types
Bathroom Vanity (a01aZ00000dC5DjQAK)  → 6 types
```

#### PRIORITY 4: HVAC & Climate Control
```json
Air Conditioner (a01aZ00000dC5E1QAK)  → 5 types
Dehumidifier    (a01aZ00000dC5ENQA0)  → 4 types
Water Heater    (a01aZ00000bI2srQAC)  → 7 types
```

#### PRIORITY 5: Cabinet Hardware
```json
Cabinet Hardware (a01aZ00000dC5F2QAK) → 7 types
  Types: Knob, Pull, Hinge, Catch/Latch, Lock, Backplate, Appliance Pull
  REUSE Cabinet Knob & Cabinet Pull category IDs as type IDs
```

**ID Reuse Strategy:**
When a category becomes a type, reuse its Salesforce ID:
```
OLD: Category "Indoor Ceiling Fan" (a01aZ00000dC5EsQAK)
NEW: Type "Indoor" (type_id: a01aZ00000dC5EsQAK) under Ceiling Fan category
```

---

### ✅ category-filter-attributes.json
**Action**: ADD ~45 new attribute mappings

**New Attributes to ADD:**

#### Ceiling Fan Attributes (7):
```json
{
  category: "Ceiling Fan" (a01aZ00000dC5EjQAK),
  attributes: [
    "Has Light" (boolean),
    "Has Remote" (boolean),
    "LED Lighting" (boolean),
    "Smart Home Compatible" (boolean),
    "Blade Span" (picklist: Small/Medium/Large),
    "Number of Blades" (numeric),
    "Motor Type" (picklist: AC/DC)
  ]
}
```

#### Price Tier Attributes (3 categories):
```json
{
  category: "Cabinet Knob" (a01aZ00000dCejZQAS),
  attribute: "Price Tier" (picklist: Budget/Standard/Premium/Luxury)
}

{
  category: "Cabinet Pull" (a01aZ00000dCejcQAC),
  attribute: "Price Tier" (picklist: Budget/Standard/Premium/Luxury)
}

{
  category: "Cabinet Hardware" (a01aZ00000dC5F2QAK),
  attribute: "Price Tier" (picklist: Budget/Standard/Premium/Luxury/Designer)
}
```

#### Water Heater Attributes (3):
```json
{
  category: "Water Heater" (a01aZ00000bI2srQAC),
  attributes: [
    "Fuel Type" (picklist: Gas/Electric/Solar/Heat Pump),
    "Tank Capacity" (numeric with units: gallons),
    "Energy Factor" (numeric: 0.00-1.00)
  ]
}
```

#### Bathroom Vanity Attributes (2):
```json
{
  category: "Bathroom Vanity" (a01aZ00000dC5DjQAK),
  attributes: [
    "Width" (numeric with units: inches),
    "Number of Drawers" (numeric)
  ]
}
```

---

### ✅ category-style-mapping.json
**Action**: ADD category-specific styles

**Current**: Only universal styles (11 styles apply to all categories)

**ADD**: Category-specific styles section

```json
{
  "category_specific_styles": [
    {
      "category_name": "Ceiling Fan",
      "category_id": "a01aZ00000dC5EjQAK",
      "styles": [
        {
          "style_name": "Fandelier",
          "style_id": "a01aZ00000dC5EqQAK",  // Reuse from removed category
          "status": "existing",
          "description": "Chandelier-style fan with decorative lighting"
        }
      ]
    }
  ]
}
```

**Note**: Most categories will use the 11 universal styles. Only add category-specific when needed.

---

### ✅ types.json
**Action**: ADD ~280 new type entries

**Current**: 2,594 type entries  
**After**: ~2,874 type entries (+280)

**Structure**:
```json
{
  "type_name": "Pull-Down",
  "type_id": "NEW_SALESFORCE_ID",
  "status": "active",
  "category_associations": ["Kitchen Faucet"]
}
```

**Salesforce Admin Task**: Create new picklist values in Salesforce first, then add to types.json

---

### ✅ styles.json
**Action**: ADD 1 new style (if not already present)

**New Style**:
```json
{
  "style_name": "Fandelier",
  "style_id": "a01aZ00000dC5EqQAK",  // Reuse from removed Fandelier Ceiling Fan category
  "status": "active"
}
```

**All other styles**: Already covered by 11 universal styles

---

### ✅ brands.json
**Action**: NO CHANGES NEEDED

Brands are independent of category consolidation.

---

### ✅ attributes.json
**Action**: ADD new attribute definitions as needed

**New Attributes to Create in Salesforce**:
1. `Price Tier` (picklist)
2. `Has Light` (boolean)
3. `Has Remote` (boolean)
4. `LED Lighting` (boolean)
5. `Smart Home Compatible` (boolean)
6. `Blade Span` (picklist)
7. `Number of Blades` (number)
8. `Motor Type` (picklist)
9. `Tank Capacity` (number)
10. `Energy Factor` (number)

---

## SALESFORCE ADMIN PRE-WORK REQUIRED

Before updating JSON files, Salesforce admin must:

### 1. Create New Picklist Values
**Type Field** - Add ~280 new values:
```
Kitchen Faucet Types: Pull-Down, Pull-Out, Commercial Pre-Rinse, Single Handle, Double Handle, Wall Mount, Deck Mount, Bridge, Touchless
Bathroom Faucet Types: Centerset 4", Widespread 8", Single Hole, Wall Mount, Vessel Sink, Deck Mount, Waterfall, Touchless
Tub Faucet Types: Wall Mount, Deck Mount, Freestanding, Roman Tub, Tub Filler with Hand Shower, Floor Mount, Waterfall
[... continue for all 280 types]
```

### 2. Create New Attribute Fields
- Price Tier (Picklist: Budget, Standard, Premium, Luxury, Designer)
- Has Light (Checkbox/Boolean)
- Has Remote (Checkbox/Boolean)
- LED Lighting (Checkbox/Boolean)
- Smart Home Compatible (Checkbox/Boolean)
- Blade Span (Picklist: Small <42", Medium 42"-52", Large >52")
- Number of Blades (Number)
- Motor Type (Picklist: AC, DC)
[... etc.]

### 3. Data Migration Scripts
Create Apex scripts or Data Loader jobs to:
1. Move products from removed categories to parent categories
2. Set Type field based on old category
3. Set attribute values based on old category

**Example**:
```apex
// Products in "Affordable Cabinet Knob" → 
// Category = "Cabinet Knob" + 
// Type = "Knob" + 
// Price Tier = "Budget"
```

---

## VALIDATION CHECKLIST

After implementing changes:

- [ ] All 212 original categories accounted for (95 kept, 117 removed)
- [ ] All removed category IDs either:
  - Reused as type IDs, OR
  - Products migrated to parent category
- [ ] All 95 remaining categories have type definitions
- [ ] Zero "Not Applicable" type values in verification results
- [ ] category-type-mapping.json has 95 category entries
- [ ] types.json has ~2,874 type entries
- [ ] category-filter-attributes.json includes all new attributes
- [ ] No orphaned products (all have valid category + type)
- [ ] API verification tests pass with new structure

---

## FILES REQUIRING CODE UPDATES

### TypeScript/JavaScript Files:
1. `src/services/dual-ai-verification.service.ts` - Update type validation logic
2. `src/config/category-type matcher.service.ts` - Update type matching
3. `src/services/category-matcher.service.ts` - Update if hardcoded categories exist
4. Any files with hardcoded category/type lists

### Test Files:
5. Update test data to use new category structure
6. Add tests for consolidated categories

---

**END OF QUICK REFERENCE**
