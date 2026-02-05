# System-Wide Attribute Validation Report

**Generated:** 2026-02-05T14:30:42.159Z  
**Status:** ✅ PASSED

## Executive Summary

- **Total Files Scanned:** 187
- **Total Picklist Entries:** 1959
- **Entries with SF IDs:** 1845 (94.2%)
- **Entries awaiting IDs:** 114 (5.8%)
- **Filter Attributes Validated:** 374

## Phase Results

### Phase 1: TypeScript Files
- Status: PASS
- Files Scanned: 127
- Missing Attributes: 0

### Phase 2: Picklist Validation
- Status: PASS
- Filter Attributes: 374 of 374
- Duplicates: 20

### Phase 3: Configuration Files
- Status: PASS
- Files Scanned: 5
- Missing Attributes: 0

### Phase 4: Tests & Scripts
- Status: FAIL
- Files Scanned: 55
- Test Mocks: 2

## Critical Findings

✅ No critical issues found

## Warnings

- ⚠️  20 duplicate picklist entries found (same name, different IDs)
- ⚠️  114 picklist entries awaiting Salesforce IDs
- ⚠️  2 attribute references in test files (likely test mocks)

## Recommendations

1. 1. Request Salesforce IDs for 114 picklist entries
2. 2. Resolve 20 duplicate picklist entries
3. 3. Update test fixtures to use valid attribute names

## Next Steps

1. Request Salesforce IDs for 114 null-ID attributes
2. Apply received IDs to attributes.json
3. Deploy updated picklist to production
