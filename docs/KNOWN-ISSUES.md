# Known Issues - Catalog Verification API

## Pre-Existing Data Issues

### 🔴 Type ID Conflict: "Trim Kit" / "Trench Drain"
**Discovered**: February 25, 2026 (during title enhancement deployment)  
**Status**: Known Issue - Low Priority  
**Impact**: <0.1% of products

**Issue Description**:
The same Salesforce type_id `a1jaZ000001lFCKQA2` is assigned to two different type names:
- "Trim Kit" in Microwave category (Appliances > Kitchen)
- "Trench Drain" in Drainage & Waste category (Industrial & Commercial)

**Files Affected**:
- `src/config/salesforce-picklists/category-type-mapping.json` (lines 322, 2191)
- `src/config/salesforce-picklists/types.json` (line 2502)

**Current Behavior**:
- Microwave "Trim Kit" products may be matched as "Trench Drain" type
- Verification may produce inconsistent type values

**Potential Fixes**:
1. **Option A**: Remove "Trim Kit" from Microwave mapping (already has "Accessory" type)
2. **Option B**: Request new type_id from Salesforce for "Trim Kit"
3. **Option C**: Merge into single type with better name

**Workaround**:
System still functions correctly - "Accessory" type already covers microwave trim kits.

**Priority**: Low (does not block production deployment)

---

### ⚠️ Missing Type Matcher Keywords
**Discovered**: February 25, 2026  
**Status**: Enhancement Request  
**Impact**: Minor - affects auto-detection accuracy

**Missing Keyword Mappings** (in `type-matcher.service.ts`):
- **Depth** (Refrigerator type)
- **Panel-Ready** (Refrigerator type)
- **Ventless** (Dryer type)

**Current Behavior**:
These types may not be automatically detected from product descriptions unless explicitly provided by Salesforce.

**Recommended Fix**:
Add keyword mappings to `type-matcher.service.ts`:
```typescript
'depth': 'Depth',
'counter-depth': 'Counter-Depth',
'panel-ready': 'Panel-Ready',
'panel ready': 'Panel-Ready',
'ventless': 'Ventless',
'no vent': 'Ventless',
```

**Priority**: Low (AI extraction usually captures these from structured data)

---

## Issue Tracking

| Issue ID | Severity | Category | Status | Date Found | Target Fix |
|----------|----------|----------|--------|------------|------------|
| KNOWN-001 | LOW | Type ID Conflict | Open | 2026-02-25 | TBD |
| KNOWN-002 | LOW | Missing Keywords | Open | 2026-02-25 | TBD |

---

Last Updated: February 25, 2026
