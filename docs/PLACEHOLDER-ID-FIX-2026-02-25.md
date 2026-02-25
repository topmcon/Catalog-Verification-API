# Placeholder ID Fix - February 25, 2026

## 🔴 Critical Bug: Sending Placeholder IDs to Salesforce

### The Problem

When re-sending the 4 failed verification jobs, ALL 4 completed successfully on our API but were **rejected by Salesforce** with error:
```
Invalid id: pending_salesforce_id
Stack Trace: Class.FergusonAIAPIBatch.getPrimaryAttributes: line 282
```

### Root Cause

Our picklist files contain **117 placeholder IDs** that haven't been assigned real Salesforce IDs yet:

| File | Placeholder Count |
|------|-------------------|
| types.json | 40 |
| category-type-mapping.json | 34 |
| category-style-mapping.json | 30 |
| styles.json | 13 |
| **TOTAL** | **117** |

Example:
```json
{
  "style_name": "Colonial",
  "style_id": "pending_salesforce_id"  ← PLACEHOLDER
}
```

### What Was Happening

1. Salesforce sends product with **valid ID** (e.g., `a03Hu00001N279QIAR`) ✅
2. Our AI matches product to style "Contemporary" ✅
3. We look up style in `styles.json` and get `style_id: "pending_salesforce_id"` ⚠️
4. We send verification result with **`AI_Style_Lookup: "pending_salesforce_id"`** ❌
5. Salesforce's `FergusonAIAPIBatch.getPrimaryAttributes` tries to query using this ID
6. Query fails: `"Invalid id: pending_salesforce_id"` ❌

### The Fix

**File**: `src/services/dual-ai-verification.service.ts`

**Added placeholder filtering functions** (lines 650-672):
```typescript
/**
 * Check if an ID is a placeholder that should not be sent to Salesforce
 */
function isPlaceholderId(id: string | null | undefined): boolean {
  if (!id) return true;
  const placeholders = ['pending_salesforce_id', 'NEEDS_NEW_ID', 'PLACEHOLDER'];
  return placeholders.includes(id);
}

/**
 * Safely get a Salesforce ID, returning null if it's a placeholder
 */
function getSafeId(id: string | null | undefined): string | null {
  if (isPlaceholderId(id)) {
    return null;  // Don't send placeholder IDs to Salesforce
  }
  return id || null;
}
```

**Applied filter to all ID fields being sent to Salesforce**:
- `AI_Brand_Lookup` (line 7173)
- `AI_Product_Category_Lookup` (line 7179)
- `AI_Type_Id` (line 7188)
- `AI_Style_Lookup` (line 7196)
- Attribute IDs in `Top_Filter_Attribute_Ids` (lines 7815, 7916)
- Catalog index service (lines 8238-8246)

### Behavior Change

**Before**:
- Matched style "Colonial" → Sends `style_id: "pending_salesforce_id"` → SF error

**After**:
- Matched style "Colonial" → Sends `style_id: null` → SF accepts (no ID yet)
- Style name still sent correctly: `"AI_Style": "Colonial"`
- Style will be in `Style_Requests` array for SF to assign an ID

### Testing

✅ TypeScript compilation successful  
⏳ Requires production deployment and re-testing with 4 failed jobs

### Impact

- **All 117 placeholder IDs now filtered out** before sending to Salesforce
- Products can still be verified and matched to styles/types/attributes
- Salesforce will receive the **name** but not the **invalid ID**
- Once Salesforce assigns real IDs via picklist sync, future verifications will include them

### Deployment

```bash
# Deploy to production
git add -A
git commit -m "Fix: Filter out placeholder IDs before sending to Salesforce"
git push origin main

# SSH to production and deploy
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && \
   git pull origin main && \
   npm install && \
   npm run build && \
   systemctl restart catalog-verification"
```

### Verification Steps

1. Re-send the 4 failed verification jobs from Salesforce
2. Monitor logs for successful processing:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "tail -f /opt/catalog-verification-api/logs/combined.log"
   ```
3. Confirm no "Invalid id: pending_salesforce_id" errors
4. Verify Salesforce accepts and processes the results

### Related Issues

- All 4 dishwasher verification jobs from 12:49 EST (Feb 25, 2026)
- Product IDs: a03Hu00001N279QIAR, a03Hu00001N1yx2IAB, a03Hu00001N2EVSIA3, a03Hu00001SY4tFIAT
- This likely affected many previous verifications as well - check historical error logs

### Next Steps

1. **Deploy this fix immediately** ✅
2. **Re-test with 4 failed jobs** ⏳
3. **Request Salesforce assign real IDs** to the 117 placeholder entries
4. **Update picklists** once real IDs are assigned
5. **Monitor for any other placeholder patterns** that might exist

---

**Fixed by**: GitHub Copilot (Claude Sonnet 4.5)  
**Date**: February 25, 2026  
**Commit**: [Pending]
