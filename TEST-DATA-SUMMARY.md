# Test Data Summary - 5 Recent Production Jobs

All jobs from **January 28, 2026** (Yesterday)

---

## **JOB 1: Garbage Disposal** 
**Job ID:** `811a7b79-1149-447b-a9ff-a2ef23955097`
**SF Catalog:** `a03aZ00000AsOWPQA3 - IE101WC`
**Created:** 2026-01-28 22:25:35

### Product Details:
- **Brand:** INSINKERATOR
- **Category:** Garbage Disposals #
- **Model:** IE101WC
- **Name:** 7" Evergrind Continuous Feed Garbage

### Key Data Points:
```
Specification_Table:
  - Material: "Galvanized Steel, Stainless Steel" ← COMPOUND VALUE!
  - Color Finish Name: "Grey"
  - Horsepower: "1/3 hp"
  - Capacity: "26 oz"
  - Depth: "7-2/5 in"
  - Diameter: "6-5/16 in"
  - Height: "11-1/2 in"
  - Weight: "11 lb"
  - Width: "6-31/100 in"
  - Volts: "120V"
```

### Verification Result:
✅ **Successfully extracted:**
- Color: "Gray"
- Finish: "Matte"
- Depth: "7.4"
- Width: "6.31"
- Height: "11.5"
- Weight: "11"

💡 **Good for testing:** Material field splitting, dimension parsing

---

## **JOB 2: Unknown Product**
**Job ID:** `61585327-fd63-4dcc-a9a3-327f169a2803`
**Created:** 2026-01-28 22:16:53
**Result:** ALL NULL FIELDS (complete failure)

⚠️ **Excellent candidate for self-healing diagnosis**

---

## **JOB 3: Unknown Product**
**Job ID:** `42dcac6c-f161-4a21-8d78-4798d3091b1d`
**Created:** 2026-01-28 22:08:22
**Result:** ALL NULL FIELDS (complete failure)

⚠️ **Excellent candidate for self-healing diagnosis**

---

## **JOB 4: Unknown Product**
**Job ID:** `4c9ce914-38e7-4612-a884-d082c82f455a`
**Created:** 2026-01-28 21:20:12
**Result:** ALL NULL FIELDS (complete failure)

⚠️ **Excellent candidate for self-healing diagnosis**

---

## **JOB 5: Large Payload (137KB)**
**Job ID:** `c5c8d18e-a499-469b-b501-0573e8255016`
**Created:** 2026-01-28 20:29:38
**Result:** ALL NULL FIELDS (complete failure)

⚠️ **Excellent candidate for self-healing diagnosis**
💾 **Largest payload - may have rich data**

---

## **Test Plan:**

### 1. **Manual Trigger Self-Healing (Job 2)**
```bash
curl -X POST https://verify.cxc-ai.com/api/self-healing/trigger \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"jobId": "61585327-fd63-4dcc-a9a3-327f169a2803"}'
```

Expected: Dual-AI diagnosis of why ALL fields are null

### 2. **Test Context-Aware Mapping (Job 1)**
Re-run with updated logic to test if:
- Material: "Galvanized Steel, Stainless Steel" → extracts both materials
- Dimensions with fractions properly parsed

### 3. **Backfill Test**
After fixing code from Job 2/3/4, backfill should:
- Scan last 30 days
- Find these 5 jobs
- Re-run with new logic
- Populate missing fields

### 4. **Monitor Logs**
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "tail -f /opt/catalog-verification-api/logs/combined.log | grep -i 'self-healing\\|consensus\\|backfill'"
```

### 5. **Check Self-Healing History**
```bash
curl -s https://verify.cxc-ai.com/api/self-healing/history | jq
curl -s https://verify.cxc-ai.com/api/self-healing/metrics | jq
```

---

## **Expected Self-Healing Behavior:**

### For Job 2 (Complete Failure):
1. **Detection:** All 15 TOP15 fields are null
2. **Dual-AI Diagnosis:** 
   - Root cause: Payload structure not recognized
   - OR: Field mapping logic completely failing
   - OR: Missing data in source
3. **Consensus:** Both AIs must agree on root cause
4. **Fix:** Code changes to handle this payload structure
5. **Validation:** Reprocess to verify fix works
6. **Backfill:** Rerun Jobs 3, 4, 5 with same issue

### For Job 1 (Partial Success):
1. **Detection:** Some fields populated, but could extract more
2. **Diagnosis:** Compound values not being split (Material field)
3. **Fix:** Add multi-field extraction for compound attributes
4. **Validation:** Verify material splits correctly
5. **Backfill:** Find other jobs with Material fields

---

## **Files Available:**
- ✅ `test-data/recent-job-1.json` (36KB) - Garbage Disposal
- ✅ `test-data/recent-job-2.json` (39KB) - Unknown/Failed
- ✅ `test-data/recent-job-3.json` (36KB) - Unknown/Failed
- ✅ `test-data/recent-job-4.json` (29KB) - Unknown/Failed
- ✅ `test-data/recent-job-5.json` (137KB) - Unknown/Failed (Large)

All ready for testing! 🧪
