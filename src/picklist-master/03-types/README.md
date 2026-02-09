# 03-types - Type Picklist Configuration

## Purpose
Type is the NEW hierarchy layer between Category and Style. Types represent functional variations or configurations within a category.

## Hierarchy Position
```
Department → Family → Category → TYPE ← YOU ARE HERE → Style
```

## Example Flow
```
Appliances → Kitchen → Refrigerator → 4-Door Flex → French Door
```

## Files in this Folder

### type-config.ts
- Imports from `types.json` and `category-type-mapping.json`
- Helper functions for type lookups
- Validation functions for category-type relationships

## Key Functions

- `getTypesForCategory(categoryName)` - Get all valid types for a category
- `getTypeById(typeId)` - Lookup type by Salesforce ID
- `getTypeByName(typeName)` - Lookup type by name
- `getCategoryTypeMapping(categoryName)` - Get mapping for category
- `isValidTypeForCategory(typeName, categoryName)` - Validate type-category relationship
- `getPrimaryTypesForCategory(categoryName)` - Get primary filter types

## Data Sources

- **types.json** (8,060 types) - All type definitions from Salesforce
- **category-type-mapping.json** (3,186 lines) - Category → Type relationships

## Update Workflow

When Salesforce syncs new types:
1. types.json is updated via picklist sync API
2. category-type-mapping.json is updated via picklist sync API
3. TypeScript imports automatically reflect changes
4. No code changes needed unless adding new helper functions
