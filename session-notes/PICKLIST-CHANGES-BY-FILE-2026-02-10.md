# PICKLIST CHANGES BY FILE
**Date**: February 10, 2026  
**Purpose**: Exact breakdown of removals and additions per picklist file

---

## 📁 FILE 1: categories.json

### ❌ REMOVE: 117 Category Entries

**Phase 1 - Duplicates (Remove 10):**
- a01aZ00000dCejSQAS (Cabinet Hardware - duplicate)
- a01aZ00000dCekAQAS (Fire Pit - duplicate)
- a01aZ00000dCejpQAC (Generator - duplicate)
- a01aZ00000dCek4QAC (Hardscaping - duplicate)
- a01aZ00000dCeksQAC (Lamp - duplicate)
- a01aZ00000dCejrQAC (Outdoor Ceiling Fan - duplicate)
- a01aZ00000dCekNQAS (Outdoor Lighting - duplicate)
- a01aZ00000dCekKQAS (Patio Heater - duplicate)
- a01aZ00000dCekOQAS (Rug - duplicate)
- a01aZ00000dCekGQAS (Tankless Water Heater - duplicate)

**Phase 2 - Price Tier Categories (Remove 9):**
- a01aZ00000dCejQQAS (Affordable Cabinet Knob)
- a01aZ00000dCejfQAC (Luxury Cabinet Knob)
- a01aZ00000dCejRQAS (Affordable Cabinet Pull)
- a01aZ00000dCejgQAC (Luxury Cabinet Pull)
- a01aZ00000dC5F6QAK (Designer Hardware)
- a01aZ00000dCejdQAC (Designer Cabinet Hardware)
- a01aZ00000dC5EGQA0 (Luxury Kitchen)
- a01aZ00000dC5EoQAK (Designer Ceiling Fan)
- a01aZ00000dC5EyQAK (Trending Ceiling Fan)

**Phase 3 - Ceiling Fan Variations (Remove 15):**
- a01aZ00000dC5EkQAK (Ceiling Fan with Light)
- a01aZ00000dC5EmQAK (Ceiling Fan without Light)
- a01aZ00000dC5ElQAK (Ceiling Fan with Remote)
- a01aZ00000dC5EnQAK (DC Motor Ceiling Fan)
- a01aZ00000dC5EpQAK (Dual Ceiling Fan)
- a01aZ00000dC5EsQAK (Indoor Ceiling Fan)
- a01aZ00000dC5EvQAK (Outdoor Ceiling Fan)
- a01aZ00000dC5ErQAK (Hugger Fan)
- a01aZ00000dC5EuQAK (LED Ceiling Fan)
- a01aZ00000dC5EtQAK (Large Ceiling Fan)
- a01aZ00000dC5EwQAK (Small Ceiling Fan)
- a01aZ00000dC5EUQA0 (Lighted Ceiling Fan)
- a01aZ00000dC5ExQAK (Smart Home Fan)
- a01aZ00000dC5EqQAK (Fandelier Ceiling Fan)
- a01aZ00000dC5DwQAK (Tankless Water Heater - second duplicate)

**TOTAL CATEGORIES TO REMOVE: 34** (from this phase breakdown)

### ✅ KEEP: 95 Categories (No Changes)
All other existing categories remain unchanged

---

## 📁 FILE 2: category-type-mapping.json

### ❌ REMOVE: Nothing
This file only gets additions - no deletions needed

### ✅ ADD: 77 New Category Entries + ~280 Type Definitions

Each category getting types needs this structure added:

```json
{
  "department_name": "Department Name",
  "family_name": "Family Name",
  "category_name": "Category Name",
  "category_id": "a01xxxxxxxxxxxxx",
  "filter_label": "Type Label for UI",
  "logic": "What distinguishes these types",
  "types": [
    {
      "type_name": "Type Name",
      "type_id": "a1jxxxxxxxxxxxxx",
      "status": "existing",
      "primary_filter": true
    }
  ]
}
```

**Categories Getting Type Definitions:**

**Faucets (9 categories):**
1. Kitchen Faucet → 9 types
2. Bathroom Faucet → 8 types
3. Tub Faucet → 7 types
4. Shower Faucet → 7 types
5. Bar Faucet → 4 types
6. Bidet Faucet → 4 types
7. Pot Filler Faucet → 3 types
8. Food Service Faucet → 4 types
9. Outdoor Shower Faucet → 3 types

**Plumbing Fixtures (6 categories):**
10. Bathtub → 9 types
11. Bathroom Sink → 8 types
12. Kitchen Sink → 7 types
13. Toilet → 7 types
14. Shower → 7 types
15. Bathroom Vanity → 6 types

**Lighting (1 category):**
16. Ceiling Fan → 5 types

**HVAC/Water (3 categories):**
17. Water Heater → 7 types
18. Air Conditioner → 5 types
19. Dehumidifier → 4 types

**Hardware (categories TBD in phases 6-9)**
- Door Hardware categories
- Cabinet Hardware (if not fully consolidated)
- Others TBD

**EXAMPLE - Kitchen Faucet Addition:**
```json
{
  "department_name": "Plumbing & Bath",
  "family_name": "Kitchen",
  "category_name": "Kitchen Faucet",
  "category_id": "a01aZ00000dC5E9QAK",
  "filter_label": "Kitchen Faucet Type",
  "logic": "Installation and handle configuration",
  "types": [
    {
      "type_name": "Pull-Down",
      "type_id": "a1jaZ000001lF9iQAE",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Pull-Out",
      "type_id": "a1jaZ000001lF9jQAE",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Pre-Rinse",
      "type_id": "a1jaZ000001lF9XQAU",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Single Handle",
      "type_id": "a1jaZ000001lFAmQAM",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Double Handle",
      "type_id": "NEW_ID_FROM_SALESFORCE",
      "status": "new",
      "primary_filter": true
    },
    {
      "type_name": "Wall Mount",
      "type_id": "a1jaZ000001lFCxQAM",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Deck Mount",
      "type_id": "a1jaZ000001lF5IQAU",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Bridge",
      "type_id": "a1jaZ000001lF3zQAE",
      "status": "existing",
      "primary_filter": true
    },
    {
      "type_name": "Touchless",
      "type_id": "a1jaZ000001lFCAQA2",
      "status": "existing",
      "primary_filter": true
    }
  ]
}
```

---

## 📁 FILE 3: types.json

### ❌ REMOVE: Nothing
All existing types stay (648 current types remain)

### ✅ ADD: ~25 New Type Records

Each new type needs this structure:

```json
{
  "type_name": "Type Name",
  "type_id": "a1jxxxxxxxxxxxxx"
}
```

**New Types to Add (after Salesforce creates them):**

**Faucet Types:**
1. Double Handle
2. Dual Handle
3. Tub Filler with Hand Shower
4. Dual Function (Shower + Hand Shower)
5. Multi-Function (3+ outlets)
6. Rain Shower
7. Articulating Arm
8. Swing Spout

**Plumbing Types:**
9. Japanese Soaking
10. Triple Bowl
11. Wall-Hung
12. Comfort Height
13. Shower Stall Kit
14. Shower Pan
15. Shower Enclosure
16. Corner Shower

**Ceiling Fan Types:**
17. DC Motor
18. Dual Motor

**Water Heater Types:**
19. Tank Storage (Gas)
20. Tank Storage (Electric)
21. Heat Pump
22. Solar

**Others TBD from Phases 6-9:**
23-25. Additional types from door/cabinet hardware sections

**EXAMPLE Addition:**
```json
{
  "type_name": "Double Handle",
  "type_id": "a1jNewIDFromSF001"
},
{
  "type_name": "Rain Shower",
  "type_id": "a1jNewIDFromSF002"
}
```

---

## 📁 FILE 4: category-filter-attributes.json

### ❌ REMOVE: Nothing
Existing 1,434 attribute mappings stay unchanged

### ✅ ADD: ~45 New Attribute Mappings

Structure for each addition:

```json
{
  "rank": 1,
  "category_name": "Category Name",
  "category_id": "a01xxxxxxxxxxxxx",
  "attribute_name": "Attribute Name",
  "attribute_id": "NEW_ID_FROM_SALESFORCE"
}
```

**New Attributes Needed:**

**For Ceiling Fan (7 attributes):**
1. Has Light (boolean)
2. Has Remote (boolean)
3. LED Lighting (boolean)
4. Smart Home Compatible (boolean)
5. Blade Span (picklist: Small/Medium/Large)
6. Number of Blades (numeric)
7. Motor Type (picklist: AC/DC)

**For Cabinet Knob & Cabinet Pull (1 attribute each = 2):**
8. Price Tier (picklist: Budget/Standard/Premium/Luxury)

**For Cabinet Hardware Consolidated (if applicable):**
9. Price Tier (same as above)

**For Water Heater:**
10. Tank Capacity (numeric)
11. Energy Factor (numeric)
12. Fuel Type (picklist: Gas/Electric/Solar/Heat Pump)

**For Faucets (various):**
13. Flow Rate (numeric)
14. Number of Handles (numeric)
15. Spout Reach (numeric)
16. Spout Height (numeric)

**EXAMPLE - Ceiling Fan Attributes:**
```json
[
  {
    "rank": 1,
    "category_name": "Ceiling Fan",
    "category_id": "a01aZ00000dC5EjQAK",
    "attribute_name": "Has Light",
    "attribute_id": "a12NewIDFromSF001"
  },
  {
    "rank": 2,
    "category_name": "Ceiling Fan",
    "category_id": "a01aZ00000dC5EjQAK",
    "attribute_name": "Has Remote",
    "attribute_id": "a12NewIDFromSF002"
  },
  {
    "rank": 3,
    "category_name": "Ceiling Fan",
    "category_id": "a01aZ00000dC5EjQAK",
    "attribute_name": "LED Lighting",
    "attribute_id": "a12NewIDFromSF003"
  }
]
```

---

## 📁 FILE 5: category-style-mapping.json

### ❌ REMOVE: Nothing
Existing styles remain unchanged

### ✅ ADD: 1 Category-Specific Style

**For Ceiling Fan:**
```json
{
  "department_name": "Lighting & Electrical",
  "family_name": "Ceiling Fans",
  "category_name": "Ceiling Fan",
  "category_id": "a01aZ00000dC5EjQAK",
  "styles": [
    {
      "style_name": "Fandelier",
      "style_id": "a01aZ00000dC5EqQAK",
      "status": "existing",
      "description": "Chandelier-style fan with decorative lighting"
    }
  ]
}
```

Plus all universal styles (Modern, Traditional, Industrial, etc.) already apply

---

## 📁 FILE 6: styles.json

### ❌ REMOVE: Nothing

### ✅ ADD: Check if "Fandelier" exists
If not already there, add:
```json
{
  "style_name": "Fandelier",
  "style_id": "a01aZ00000dC5EqQAK"
}
```

---

## 📊 SUMMARY BY ACTION

### REMOVALS (Only from categories.json):
- **117 category entries** removed
- NO removals from other files

### ADDITIONS:

| File | What to Add | Quantity |
|------|-------------|----------|
| **category-type-mapping.json** | Category + type definitions | 77 categories, ~280 type entries |
| **types.json** | New type records | ~25 types |
| **category-filter-attributes.json** | Attribute mappings | ~45 attributes |
| **category-style-mapping.json** | Category-specific styles | 1 style mapping |
| **styles.json** | Fandelier style (if missing) | 1 style (maybe) |

---

## 🔄 WORKFLOW

### Step 1: Salesforce Admin Creates New Picklist Values
**In Salesforce**, create these new picklist values and capture their IDs:

1. **Type Picklist**: Add ~25 new type values
2. **Attribute Fields**: Create new attribute fields for categories
3. **Style Picklist**: Verify "Fandelier" exists

### Step 2: Update JSON Files with New IDs

Once Salesforce generates IDs, update:

1. **category-type-mapping.json**: Replace "NEW_ID_FROM_SALESFORCE" with actual IDs
2. **types.json**: Add 25 new type records with actual IDs
3. **category-filter-attributes.json**: Add attribute mappings with actual IDs

### Step 3: Remove Categories

1. **categories.json**: Delete 117 category entries

### Step 4: Data Migration in Salesforce

Migrate products from removed categories to consolidated categories with proper type/attribute values

---

## 📝 NEXT ACTIONS

1. **Review Phase 6-9** in master plan to finalize door/cabinet hardware changes
2. **Get exact count** of all categories being removed (currently shows 34, target is 117)
3. **Generate actual JSON snippets** ready to copy/paste for each file
4. **Create migration scripts** for moving products between categories
5. **Test in Salesforce sandbox** before production deployment

---

## 📁 REFERENCE

- Full Master Plan: [MASTER-CATEGORY-CONSOLIDATION-PLAN-2026-02-10.md](./MASTER-CATEGORY-CONSOLIDATION-PLAN-2026-02-10.md)
- Type ID Mapping: [TYPE-ID-MAPPING-2026-02-10.md](./TYPE-ID-MAPPING-2026-02-10.md)
