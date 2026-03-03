# TODO: Complete Mappings for 3 New Plumbing & Bath Categories

**Status**: Categories added to categories.json ✅  
**Commit**: 1700ef7 - "Update Plumbing & Bath categories to align with Salesforce (36 categories)"

## Missing Mappings for New Categories

These 3 categories were just added to Plumbing & Bath department and need complete configuration:

### 1. Pressure Valve
- **Category ID**: `a01aZ00000jncNIQAY`
- **Department**: Plumbing & Bath
- **Family**: TBD (suggest: "Valves" like Rough-In Valve)
- **Subcategory**: TBD (suggest: "Plumbing Parts & Fittings")

**Needs:**
- [ ] **Type Mapping** (category-type-mapping.json)
  - Reference: Rough-In Valve has types: Thermostatic, Pressure Balance, Diverter, Volume Control, Transfer, Accessory
  - Suggested types for Pressure Valve:
    - Pressure Reducing
    - Pressure Relief
    - Backflow Prevention
    - Mixing Valve
    - Balancing Valve
    - Accessory
- [ ] **Style Mapping** (category-style-mapping.json)
  - Determine if styles apply (likely false - functional component)
- [ ] **Filter Attributes** (category-filter-attributes.json)
  - Attributes: connection_type, valve_size, material, finish
- [ ] **Title Schema** (title-schema-by-category.ts)
  - Title format: `[Brand] [Type] Pressure Valve [Connection Size] [Material]`

---

### 2. Shower Accessory
- **Category ID**: `a01aZ00000dC5DsQAK`
- **Department**: Plumbing & Bath
- **Family**: TBD (suggest: "Bath" or "Showers")
- **Subcategory**: TBD (suggest: "Shower Components" or "Bathroom Accessories")

**Needs:**
- [ ] **Type Mapping** (category-type-mapping.json)
  - Reference: Bathroom Hardware and Accessories has types: Towel Bar, Towel Ring, Robe Hook, Toilet Paper Holder, Shelf, Grab Bar, Set, Accessory
  - Reference: Shower has type "Accessory" included
  - Suggested types for Shower Accessory:
    - Shower Shelf
    - Shower Caddy
    - Shower Door
    - Shower Panel
    - Shower Head
    - Shower Handle
    - Grab Bar
    - Soap Dish
    - Accessory
- [ ] **Style Mapping** (category-style-mapping.json)
  - Likely true - decorative items can have styles
  - Use universal styles (Contemporary, Traditional, Modern, etc.)
- [ ] **Filter Attributes** (category-filter-attributes.json)
  - Attributes: accessory_type, material, finish, mounting_type
- [ ] **Title Schema** (title-schema-by-category.ts)
  - Title format: `[Brand] [Type] Shower Accessory [Material] [Finish] [Style]`

---

### 3. Tub and Shower Accessory
- **Category ID**: `a01aZ00000dDnKlQAK`
- **Department**: Plumbing & Bath
- **Family**: TBD (suggest: "Bath")
- **Subcategory**: TBD (suggest: "Bath" or "Bathroom Accessories")

**Needs:**
- [ ] **Type Mapping** (category-type-mapping.json)
  - Similar to Shower Accessory but for tub/shower combo parts
  - Suggested types for Tub and Shower Accessory:
    - Drain Cover
    - Overflow Plate
    - Trim Kit
    - Enclosure Part
    - Faucet Trim
    - Spout
    - Diverter
    - Handle
    - Accessory
- [ ] **Style Mapping** (category-style-mapping.json)
  - Likely true - decorative trim items
  - Use universal styles
- [ ] **Filter Attributes** (category-filter-attributes.json)
  - Attributes: accessory_type, material, finish, installation_type
- [ ] **Title Schema** (title-schema-by-category.ts)
  - Title format: `[Brand] [Type] Tub and Shower Accessory [Material] [Finish]`

---

## Implementation Steps

### Step 1: Research Salesforce Data (RECOMMENDED FIRST)
Before creating mappings, pull actual data from Salesforce to see what values exist in production:
```bash
# Check if Salesforce has existing products in these categories
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/query-sf-category-products.js 'Pressure Valve'"
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/query-sf-category-products.js 'Shower Accessory'"
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/query-sf-category-products.js 'Tub and Shower Accessory'"
```

This will show:
- What types already exist in Salesforce for these categories
- What styles are being used
- What attributes are populated
- Real product title patterns

### Step 2: Update categories.json Fields
Add missing fields to the 3 new category entries:
- `family` (currently missing or set to "Plumbing & Bath")
- `subcategory` (currently missing or generic)
- `styles_apply` (true/false based on whether decorative)

### Step 3: Create Type Mappings
Update `src/config/salesforce-picklists/category-type-mapping.json`:
- Add entry to `mappings` array for each category
- Include: department_name, family_name, category_name, category_id, filter_label, logic, types[]
- Each type needs: type_name, status (existing/new), primary_filter (true/false)

### Step 4: Create Style Mappings
Update `src/config/salesforce-picklists/category-style-mapping.json`:
- If styles apply: Add entry to `category_specific_mappings` array
- Include: category_name, category_id, applies_universal_styles (true), style_notes
- OR if functional: Document as styles_apply: false in categories.json

### Step 5: Create Filter Attributes
Update `src/config/salesforce-picklists/category-filter-attributes.json`:
- Add entry to `mappings` array for each category
- Include: department_name, family_name, category_name, category_id, attributes{}
- Each attribute needs: field_name, data_type, required, filter_priority

### Step 6: Create Title Schemas
Update `src/config/title-schema-by-category.ts`:
- Add entry to categoryTitleSchemas for each category
- Define: slots (brand, type, category, attributes), format string, rules
- Test with sample data

### Step 7: Validation
Run comprehensive validation suite:
```bash
bash scripts/pre-deploy-validate-all.sh
```

This checks:
- TypeScript compilation
- Dependency consistency (types, mappings, schemas align)
- Feature completeness (declared features implemented)
- Title system runtime (schema lookups work)
- Title generation (sample data validates)
- Picklist field names
- Hardcoded list sync

### Step 8: Testing
Test with sample products:
```bash
node scripts/test-title-generation.js --category "Pressure Valve"
node scripts/test-title-generation.js --category "Shower Accessory"
node scripts/test-title-generation.js --category "Tub and Shower Accessory"
```

### Step 9: Commit & Deploy
```bash
git add -A
git commit -m "Add type/style/filter mappings and title schemas for 3 new P&B categories"
git push origin main
# Deploy to production (see deploy procedure in copilot-instructions.md)
```

---

## Questions for Salesforce Team / User

1. **Pressure Valve**: What types exist in Salesforce? Should this be merged with Rough-In Valve or kept separate?

2. **Shower Accessory vs Bathroom Hardware and Accessories**: Is there overlap? Should we differentiate by installation location (inside shower vs general bathroom)?

3. **Tub and Shower Accessory**: Is this for combo units? Should it be separated into Tub Accessory and Shower Accessory?

4. **Family/Subcategory assignments**: Confirm proper hierarchy for these 3 categories in the product taxonomy.

---

## Reference: Similar Categories in System

| Category | Types | Styles Apply | Notes |
|----------|-------|--------------|-------|
| Rough-In Valve | Thermostatic, Pressure Balance, Diverter, Volume Control, Transfer, Accessory | false | Functional component, no decorative styles |
| Shower | Alcove, Corner, Neo-Angle, Walk-In, Framed, Frameless, Barrier-Free, Accessory | true | Enclosure has aesthetic styles |
| Bathroom Hardware and Accessories | Towel Bar, Towel Ring, Robe Hook, Toilet Paper Holder, Shelf, Grab Bar, Set, Accessory | true | Decorative items with styles |
| Shower Faucet | Not checked yet | true | Likely has types like Single Handle, Dual Handle, Thermostatic |

---

## Notes

- **Decision**: Waiting for user input on whether to:
  - A) Query Salesforce for existing data
  - B) Create sensible defaults for review
  - C) User provides specific values

- **Current Status**: categories.json updated with 3 new categories, but they don't yet function in verification API because mappings are incomplete

- **Impact**: Any products in these 3 categories sent from Salesforce will:
  - ❌ Fail type verification (no types defined)
  - ❌ Skip style matching (no styles configured)
  - ❌ Miss filter attributes (no attributes defined)
  - ❌ Generate incomplete titles (no schema defined)

- **Priority**: Medium - These categories were just added from Salesforce, so products may start flowing soon

---

**Created**: 2026-03-03  
**Last Updated**: 2026-03-03  
**Owner**: @topmcon
