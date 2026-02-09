# Picklist Master - Organized Data Source Structure

## 📋 Purpose

This folder contains all picklist-related files organized by their primary picklist dependency. When Salesforce updates a picklist, you can easily identify which dependent files need manual updates.

## 📁 Folder Structure

- **01-brands/** - Files dependent on brands.json
- **02-categories/** - Files dependent on categories.json
- **03-styles/** - Files dependent on styles.json
- **04-attributes/** - Files dependent on attributes.json
- **05-category-filter-attributes/** - Files dependent on category-filter-attributes.json
- **06-multiple-picklist-files/** - Files that use 2+ picklists

## 🔄 Update Workflow

When a picklist is updated by Salesforce:

1. Navigate to the corresponding folder (e.g., `01-brands/` for brands.json updates)
2. Review all dependent files in that folder
3. Update hardcoded lists/mappings to match the new picklist data
4. Review files in `06-multiple-picklist-files/` for cross-picklist impacts
5. Run verification tests
6. Deploy changes

## 📖 Documentation

See `/docs/VERIFICATION-DATA-SOURCES.md` for complete data lineage and update procedures.
