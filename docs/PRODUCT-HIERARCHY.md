# Product Hierarchy Reference

## Overview

This document defines the three-level product hierarchy used in the Catalog Verification API:

```
Department → Family → Category → Style
```

## Complete Hierarchy

### Kitchen Department

#### Cooking Family
| Category | Valid Styles |
|----------|-------------|
| **Pizza Oven** | - |
| **Barbeques** | Accessory, Electric, Gas |
| **Coffee Maker** | - |
| **Cooktop** | Gas, Induction, Electric |
| **Microwave** | Over-the-Range, Countertop, Accessory, Single |
| **Oven** | Single, Double Wall, Accessory, Microwave Combo |
| **Range** | Electric, Accessory, Gas, Induction |
| **Range Hood** | Accessory, Wall-Mounted, Insert, Under Cabinet, Island Mount |

#### Kitchen Refrigeration Family
| Category | Valid Styles |
|----------|-------------|
| **Dishwasher** | Undercounter, Accessory |
| **Drawer** | Warming |
| **Freezer** | Undercounter, Column, Chest, Upright, Bottom-Freezer |
| **Icemaker** | Undercounter |
| **Refrigerator** | French Door, Side-by-Side, Wine Cooler, Beverage Center, Column, Drawer, Bottom-Freezer, Top-Freezer, Upright, Undercounter, Kegerator, Accessory |

---

### Laundry Department

#### Laundry Family
| Category | Valid Styles |
|----------|-------------|
| **All in One Washer / Dryer** | Unitized, Front Load |
| **Dryer** | Front Load |
| **Standalone Pedestal** | Standalone |
| **Washer** | Front Load, Top Load |

---

## Implementation

### Configuration Files

1. **[family-category-mapping.ts](../src/config/family-category-mapping.ts)**
   - Department → Family → Category mappings
   - Functions: `getFamilyForCategory()`, `getDepartmentForCategory()`, `getHierarchyForCategory()`

2. **[category-style-mapping.ts](../src/config/category-style-mapping.ts)**
   - Category → Style mappings
   - Functions: `matchStyleToCategory()`, `getValidStylesForCategory()`, `isValidStyleForCategory()`

3. **[master-category-attributes.ts](../src/config/master-category-attributes.ts)**
   - Category → Top 15 Filter Attributes with allowed values
   - Functions: `getCategorySchema()`, `getAllCategoriesWithTop15ForPrompt()`

### Auto-Population Logic

**Product_Family** is auto-derived from Category:
```typescript
Product_Family_Verified = getFamilyForCategory(Category_Verified)
```

**Examples**:
- Category: "Oven" → Family: "Cooking"
- Category: "Refrigerator" → Family: "Kitchen Refrigeration"  
- Category: "Washer" → Family: "Laundry"

---

## Validation Rules

### Family Validation
✅ **Valid**: Category "Oven" with Family "Cooking"  
❌ **Invalid**: Category "Oven" with Family "Laundry"

### Style Validation
✅ **Valid**: Category "Oven" with Style "Microwave Combo"  
❌ **Invalid**: Category "Range" with Style "Microwave Combo"

### Hierarchy Validation
```typescript
// Get complete hierarchy for validation
const hierarchy = getHierarchyForCategory("Oven");
// Returns: { department: "Kitchen", family: "Cooking", category: "Oven" }

// Check if category belongs to family
const isValid = isValidCategoryForFamily("Cooking", "Oven");  // true
const isInvalid = isValidCategoryForFamily("Laundry", "Oven");  // false
```

---

## Query Examples

### Get Family from Category
```typescript
getFamilyForCategory("Oven")  
// Returns: "Cooking"

getFamilyForCategory("Refrigerator")  
// Returns: "Kitchen Refrigeration"

getFamilyForCategory("Washer")  
// Returns: "Laundry"
```

### Get All Categories in a Family
```typescript
getValidCategoriesForFamily("Cooking")
// Returns: ["Pizza Oven", "Barbeques", "Coffee Maker", "Cooktop", "Microwave", "Oven", "Range", "Range Hood"]

getValidCategoriesForFamily("Kitchen Refrigeration")
// Returns: ["Dishwasher", "Drawer", "Freezer", "Icemaker", "Refrigerator"]

getValidCategoriesForFamily("Laundry")
// Returns: ["All in One Washer / Dryer", "Dryer", "Standalone Pedestal", "Washer"]
```

### Get Department from Category
```typescript
getDepartmentForCategory("Oven")
// Returns: "Kitchen"

getDepartmentForCategory("Washer")
// Returns: "Laundry"
```

### Get All Families in Department
```typescript
getFamiliesForDepartment("Kitchen")
// Returns: ["Cooking", "Kitchen Refrigeration"]

getFamiliesForDepartment("Laundry")
// Returns: ["Laundry"]
```

### Get Complete Hierarchy
```typescript
getHierarchyForCategory("Oven")
// Returns: { department: "Kitchen", family: "Cooking", category: "Oven" }

getHierarchyForCategory("Refrigerator")
// Returns: { department: "Kitchen", family: "Kitchen Refrigeration", category: "Refrigerator" }
```

---

## Statistics

| Metric | Count |
|--------|-------|
| **Departments** | 2 |
| **Families** | 3 |
| **Categories** | 17 |
| **Unique Styles** | 36+ |
| **Category-Style Combinations** | 47 |

### Breakdown by Department

**Kitchen Department**: 13 categories
- Cooking: 8 categories
- Kitchen Refrigeration: 5 categories

**Laundry Department**: 4 categories
- Laundry: 4 categories

---

## See Also

- [Category-Style Mapping Configuration](../src/config/category-style-mapping.ts)
- [Family-Category Mapping Configuration](../src/config/family-category-mapping.ts)
- [Master Category Attributes](../src/config/master-category-attributes.ts)
- [Salesforce Picklists](../src/config/salesforce-picklists/)
