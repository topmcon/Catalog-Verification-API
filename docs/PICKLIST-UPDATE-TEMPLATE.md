# Picklist Update Template

**Instructions**: Copy this entire document and paste it to Claude/Copilot along with your updated data. Claude will update all JSON files and sync all hardcoded dependencies.

---

## How to Use This Template

1. **Fill in the sections below** with your updated data
2. **Leave sections empty** if no changes for that picklist type
3. **Use "ADD", "REMOVE", or "REPLACE_ALL"** to indicate what action to take
4. **Paste to Claude** with the command: "Update picklists with this data"

---

## CATEGORIES

**Action**: `ADD` | `REMOVE` | `REPLACE_ALL`

```json
{
  "action": "ADD",
  "categories": [
    {
      "family": "Kitchen",
      "department": "Appliances",
      "category_name": "Example Category",
      "category_id": "a01XXXXXXXXXXXXXXX"
    }
  ]
}
```

---

## TYPES

**Action**: `ADD` | `REMOVE` | `REPLACE_ALL`

```json
{
  "action": "ADD",
  "types": [
    {
      "type_name": "Example Type",
      "type_id": "a1jXXXXXXXXXXXXXXXX"
    }
  ]
}
```

---

## STYLES

**Action**: `ADD` | `REMOVE` | `REPLACE_ALL`

```json
{
  "action": "ADD",
  "styles": [
    {
      "style_name": "Example Style",
      "style_id": "a1IXXXXXXXXXXXXXXXXX"
    }
  ]
}
```

---

## CATEGORY-TYPE MAPPING

Maps which types are valid for each category. Use when adding new categories or changing type assignments.

**Action**: `ADD` | `UPDATE` | `REPLACE_ALL`

```json
{
  "action": "UPDATE",
  "mappings": [
    {
      "category_name": "Coffee Maker",
      "category_id": "a01Hu000011kmDGIAY",
      "types": [
        { "type_name": "Built-In", "type_id": "a1jaZ000001lF42QAE" },
        { "type_name": "Countertop", "type_id": "a1jaZ000001lF52QAE" },
        { "type_name": "Drip", "type_id": "a1jaZ000001lF5lQAE" }
      ]
    }
  ]
}
```

---

## CATEGORY-STYLE MAPPING

Usually styles are universal (all 16 apply to all categories). Only fill this in if you're changing the universal styles list.

**Action**: `REPLACE_ALL`

```json
{
  "action": "REPLACE_ALL",
  "universal_styles": [
    { "style_name": "Art Deco", "style_id": "a1IaZ000001TYybUAG" },
    { "style_name": "Bohemian", "style_id": "a1IaZ000001V9EXUA0" },
    { "style_name": "Coastal", "style_id": "a1IaZ000001VAAbUAO" },
    { "style_name": "Contemporary", "style_id": "a1IaZ000001TVZJUA4" },
    { "style_name": "Craftsman", "style_id": "a1IaZ000001VAHaUAO" },
    { "style_name": "Eclectic", "style_id": "a1IaZ000001VAQLUA4" },
    { "style_name": "Farmhouse", "style_id": "a1IaZ000001S93RUAS" },
    { "style_name": "Glam", "style_id": "a1IaZ000001VAT9UAO" },
    { "style_name": "Industrial", "style_id": "a1IaZ000001Sjb7UAC" },
    { "style_name": "Mid-Century Modern", "style_id": "a1IaZ000001VAXfUAO" },
    { "style_name": "Minimalist", "style_id": "a1IaZ000001VAacUAG" },
    { "style_name": "Modern", "style_id": "a1IaZ000001TWAPUA4" },
    { "style_name": "Rustic", "style_id": "a1IaZ000001TVcXUAW" },
    { "style_name": "Traditional", "style_id": "a1IaZ000001TLjdUAG" },
    { "style_name": "Transitional", "style_id": "a1IaZ000001TVXhUAO" },
    { "style_name": "Victorian", "style_id": "a1IaZ000001TVuHUAW" }
  ]
}
```

---

## BRANDS (Optional)

**Action**: `ADD` | `REMOVE` | `REPLACE_ALL`

```json
{
  "action": "ADD",
  "brands": [
    {
      "brand_name": "Example Brand",
      "brand_id": "a09XXXXXXXXXXXXXXXXX"
    }
  ]
}
```

---

## DEPARTMENTS (Optional)

Only change if adding/removing top-level departments.

**Action**: `REPLACE_ALL`

```json
{
  "action": "REPLACE_ALL",
  "departments": [
    { "department_name": "Appliances", "department_id": "..." },
    { "department_name": "Bath", "department_id": "..." },
    { "department_name": "?"  }
  ]
}
```

---

## What Claude Will Do After Receiving This

1. ✅ Update JSON files in `src/config/salesforce-picklists/`
2. ✅ Run `npm run build` to pick up TypeScript import changes
3. ✅ Run `verify-hardcoded-sync.js` to check for mismatches
4. ✅ Run `regenerate-hardcoded-lists.js` to fix hardcoded constants:
   - `DEPARTMENT_CATEGORIES` in category-matcher.service.ts
   - `DEPARTMENTS` in constants.ts
   - Validate `TYPE_ALIASES` in type-matcher.service.ts
5. ✅ Deploy to production and verify sync

---

## Example: Complete Update Request

```
Update picklists with this data:

## CATEGORIES
{
  "action": "ADD",
  "categories": [
    {
      "family": "Kitchen",
      "department": "Appliances", 
      "category_name": "Wine Cooler",
      "category_id": "a01Hu000099XXXXX"
    }
  ]
}

## TYPES
{
  "action": "ADD",
  "types": [
    { "type_name": "Freestanding Wine Cooler", "type_id": "a1jaZ000099YYYYY" },
    { "type_name": "Built-In Wine Cooler", "type_id": "a1jaZ000099ZZZZZ" }
  ]
}

## CATEGORY-TYPE MAPPING
{
  "action": "ADD",
  "mappings": [
    {
      "category_name": "Wine Cooler",
      "category_id": "a01Hu000099XXXXX",
      "types": [
        { "type_name": "Freestanding Wine Cooler", "type_id": "a1jaZ000099YYYYY" },
        { "type_name": "Built-In Wine Cooler", "type_id": "a1jaZ000099ZZZZZ" }
      ]
    }
  ]
}
```

---

## Current Picklist Counts (for reference)

| Picklist | Count |
|----------|-------|
| Categories | ~212 |
| Types | ~648 |
| Styles | 16 |
| Brands | ~402 |
| Attributes | ~945 |
| Departments | 10 |

---

*Last updated: February 11, 2026*
