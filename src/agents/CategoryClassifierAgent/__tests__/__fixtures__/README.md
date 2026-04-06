# Test Fixtures - CategoryClassifierAgent

## Overview

This directory contains test fixtures for CategoryClassifierAgent unit tests. Each fixture represents a real-world classification scenario based on production patterns observed in the Catalog Verification API.

## Fixture Provenance

### Data Sources
- **Category Picklist**: `src/config/salesforce-picklists/categories.json` (177 categories across 3 departments)
- **Brand Picklist**: `src/config/salesforce-picklists/brands.json`
- **Production Patterns**: Cross-department conflicts documented in:
  - Session notes (March 2026): Ferguson=Lighting vs WebRetailer=Plumbing edge cases
  - Architecture docs: `VERIFICATION-ARCHITECTURE-COMPLETE.md` - Phase 0.2 Ferguson priority logic
  - Audit findings: `AUDIT-FINDINGS-AND-SOLUTIONS.md` - Category matching failures

### Fixture Creation Date
- **Created**: April 6, 2026
- **Category Picklist Version**: Synced from Salesforce on March 20, 2026
- **Purpose**: Test 5 core scenarios for agent-based category classification

## Fixture Catalog

### 1. `fast-path-exact-match.json`
**Scenario**: Both sources normalize to identical picklist entry

**Why This Matters**: Fast-path optimization should skip the 3-step AI chain when both Ferguson and web retailer agree on exact category after normalization. This represents 60-70% of production traffic.

**Expected Behavior**:
- Fast-path returns success
- Confidence: 92% (high but not 100 due to no AI validation)
- Zero AI calls made
- Processing time: <10ms

**Source**: Pattern observed in production where exact matches (e.g., "Refrigerator" from both sources) skip expensive AI processing.

---

### 2. `fast-path-miss-chain-resolves.json`
**Scenario**: Different source strings, but chain resolves to same category

**Why This Matters**: Tests fallback to 3-step chain when fast-path normalization doesn't find exact match (e.g., Ferguson="REFRIGERATORS" vs WebRetailer="French Door Refrigerator").

**Expected Behavior**:
- Fast-path returns null (no exact match)
- Chain executes all 3 steps (Department → Family → Category)
- Both AIs agree on final category
- Confidence: 75-85% (weighted from 3 steps)
- 3 AI calls made per provider (6 total for consensus)

**Source**: Common pattern for products with verbose/marketing-heavy web retailer descriptions.

---

### 3. `cross-dept-conflict-ais-agree.json`
**Scenario**: Ferguson mapped to Lighting, web retailer to Plumbing — both AIs independently choose same department

**Why This Matters**: Tests cross-department conflict detection and resolution. Critical for products like "Bathroom Vanity Light" where distributor might categorize as Lighting, retailer as Bath.

**Expected Behavior**:
- Fast-path returns null (different departments)
- Chain step 1 (Department) detects cross-department conflict
- Both AIs agree on correct department (e.g., Lighting)
- Reasoning includes `departmentMismatch: true`
- Reasoning includes `conflictResolution: "Chose Lighting based on..."`
- Moderate confidence penalty (10-15% reduction) due to source disagreement

**Source**: 
- **Production Pattern**: Documented in Architecture docs (Phase 0.2 Ferguson Priority)
- **Real Examples**: Bathroom Sconce (Ferguson=Lighting, Home Depot=Bath Hardware)
- **Fix Date**: March 4, 2026 - Added cross-department conflict detection to Step 1 prompt

---

### 4. `cross-dept-conflict-ais-disagree.json`
**Scenario**: Same source conflict, but OpenAI and xAI choose different departments

**Why This Matters**: Tests consensus failure at critical level (department mismatch). Should trigger retry with cross-context enrichment.

**Expected Behavior**:
- Fast-path returns null
- Chain executes, both AIs complete 3 steps
- Consensus builder detects department disagreement (critical severity)
- `agreed: false`
- `agreementScore: 0`
- `retryAllowed: true`
- RetryContext includes both AI perspectives and source data references

**Source**:
- **Production Edge Case**: Products with ambiguous function (e.g., "LED Mirror" - Lighting or Bath Accessories?)
- **Documented**: Consensus architecture FAQ - hierarchical disagreement handling

---

### 5. `asymmetric-confidence.json`
**Scenario**: Both AIs agree on category but with high confidence disparity (>25 points)

**Why This Matters**: Tests weak consensus detection. Both AIs returning "Refrigerator" is NOT the same if one is 94% confident and the other is 61% confident.

**Expected Behavior**:
- Fast-path returns null (different source strings)
- Chain executes, both AIs choose same category
- Confidence disparity calculation: `|94 - 61| = 33 > 25`
- Consensus builder flags `weakConsensus: true`
- Merged confidence: `max(94, 61) - 10 = 84%` (10-point penalty)
- `agreementScore: 85` (not perfect 100)
- `retryAllowed: true`

**Source**:
- **Architecture Decision**: External Claude guidance (April 6, 2026)
- **Use Case**: Downstream soft-lock logic needs to know when agreement is shaky
- **Analytics Value**: Track weak consensus rate to identify borderline categories

---

## Fixture Structure

Each fixture contains:

```typescript
{
  // Input to CategoryClassifierAgent
  input: CategoryClassifierInput,
  
  // Mocked AI responses (for both OpenAI and xAI)
  mockedAIResponses: {
    step1Department: { openai: {...}, xai: {...} },
    step2Family: { openai: {...}, xai: {...} },
    step3Category: { openai: {...}, xai: {...} }
  },
  
  // Expected output
  expected: {
    fastPathResult: FastPathResult | null,
    chainResult: CategoryClassifierOutput | null,
    consensusResult: AgentConsensus<CategoryClassifierOutput>
  },
  
  // Test metadata
  metadata: {
    scenario: string,
    primaryAssertion: string,
    edgeCaseCovered: string
  }
}
```

## Maintenance Guidelines

### When to Update Fixtures

1. **Picklist Changes**: If Salesforce category picklist is updated with new categories or departments, regenerate fixtures
2. **Algorithm Changes**: If fast-path normalization logic changes, verify fixtures still trigger correct paths
3. **Prompt Changes**: If any of the 3-step prompts are modified, re-run tests and update expected AI responses if needed
4. **Production Anomalies**: If new cross-department conflict patterns emerge in production, add new fixtures

### Validation Checklist

Before committing fixture changes:
- [ ] All category IDs exist in current `categories.json`
- [ ] Brand names exist in current `brands.json`
- [ ] Ferguson/WebRetailer category strings match real-world patterns
- [ ] Expected confidence scores align with current weighted calculation (20% dept, 30% family, 50% category)
- [ ] Mocked AI responses follow current prompt response formats

### Fixture Staleness Detection

If tests start failing unexpectedly:
1. Check picklist sync: `node scripts/check-picklist-sync-status.js`
2. Compare fixture category IDs against current `categories.json`
3. Review recent prompt changes in git history: `git log --oneline src/agents/CategoryClassifierAgent/prompts/`
4. Check if confidence weighting changed in `CategoryClassifierAgent.ts::calculateWeightedConfidence()`

## References

- **CategoryClassifierAgent Schema**: `../schema.ts`
- **Prompt Templates**: `../prompts/step1-department.prompt.ts`, `step2-family.prompt.ts`, `step3-category.prompt.ts`
- **Consensus Logic**: `../consensus.ts`
- **Production Picklists**: `src/config/salesforce-picklists/`
