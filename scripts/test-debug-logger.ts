/**
 * test-debug-logger.ts — Smoke test for the AgentDebugLogger pipeline.
 *
 * Exercises every record*() method with realistic data, then calls finalize()
 * to render the 8-section console report. No real AI calls — purely validates
 * the debug instrumentation wiring.
 *
 * Usage:
 *   AGENT_DEBUG=true npx ts-node scripts/test-debug-logger.ts
 */

import path from 'path';

// Load the chandelier test payload
const payloadPath = path.resolve(__dirname, '../test-data/test-payload-1-chandelier.json');
const rawPayload = require(payloadPath);

// Augment with fields the debug system inspects
const product = {
  ...rawPayload,
  SF_Catalog_Name: rawPayload.SF_Catalog_Name || 'TEST-MODEL-1201D32',
  Brand_Legacy: 'Elegant Lighting',
  Category_Legacy: 'Chandelier',
  Web_Retailer_Category: 'Chandeliers',
  Web_Retailer_SubCategory: 'Crystal Chandeliers',
  Web_Retailer_Brand: 'Elegant Lighting',
  Web_Retailer_Title: 'Sydney 17-Light Matte Black Chandelier with Clear Royal Cut Crystal',
  Ferguson_Category: 'Chandeliers',
  Ferguson_Brand: 'Elegant Lighting',
  Ferguson_Title: 'Elegant Lighting 1201D32MB/RC Sydney 17 Light Chandelier',
  Ferguson_Product_Type: 'Chandelier',
  Ferguson_Raw_Data: {
    category: 'Lighting > Chandeliers',
    productType: 'Chandelier',
    title: 'Elegant Lighting 1201D32MB/RC Sydney 17 Light Chandelier',
  },
};

async function main() {
  // Dynamic import to play nice with TypeScript paths
  const { AgentDebugLogger } = await import('../src/agents/debug/AgentDebugLogger');

  // Create with env activation (AGENT_DEBUG=true must be set)
  const debug = AgentDebugLogger.create('test-session-001', product as any);

  if (!debug.isActive) {
    console.error('\n❌  Debug logger is NOT active.');
    console.error('   Run with: AGENT_DEBUG=true npx ts-node scripts/test-debug-logger.ts\n');
    process.exit(1);
  }

  console.log('✅ Debug logger active — recording sections...\n');

  // ─── [1] Payload Health ───────────────────────────────────
  debug.recordPayloadHealth();
  console.log('  [1] Payload health recorded');

  // ─── [2] Ferguson Extraction (before / after snapshot) ────
  debug.snapshotBeforeExtraction();
  // Simulate Phase 0.1A mutation: populate flat fields from nested data
  (product as any).Ferguson_Price = '$1,299.00';
  (product as any).Ferguson_Dimensions = '32"W x 53"H';
  debug.recordFergusonExtraction();
  console.log('  [2] Ferguson extraction recorded (before/after)');

  // ─── [3] Category Input ───────────────────────────────────
  const categoryInput = {
    fergusonCategory: 'Chandeliers',
    fergusonProductType: 'Chandelier',
    fergusonTitle: 'Elegant Lighting 1201D32MB/RC Sydney 17 Light Chandelier',
    fergusonBusinessCategory: 'Lighting > Chandeliers',
    fergusonURL: product.Ferguson_URL || '',
    webRetailerCategory: 'Chandeliers',
    webRetailerSubCategory: 'Crystal Chandeliers',
    webRetailerTitle: 'Sydney 17-Light Matte Black Chandelier with Clear Royal Cut Crystal',
    webRetailerURL: product.Reference_URL || '',
    webRetailerDescription: '',
    sfCatalogId: product.SF_Catalog_Id,
    sfCatalogName: product.SF_Catalog_Name || '',
    legacyCategory: 'Chandelier',
  };
  debug.recordCategoryInput(categoryInput);
  console.log('  [3] Category input recorded');

  // ─── [4] Fast-path HIT (both sources agree) ──────────────
  debug.recordFastPathHit(
    'chandeliers',        // fergusonNormalized
    'Chandelier',         // fergusonPicklistMatch
    'chandeliers',        // webRetailerNormalized
    'Chandelier',         // webRetailerPicklistMatch
  );
  console.log('  [4] Fast-path hit recorded');

  // ─── [5] Chain steps (simulated — would not run after fast-path hit,
  //         but we record them to validate the chain step renderer) ──
  debug.recordChainStep(
    1, 'Department', false,
    { value: 'Lighting', confidence: 95, reasoning: 'Chandelier is Lighting department' },
    { value: 'Lighting', confidence: 92, reasoning: 'Product is a chandelier → Lighting' },
    93, 'Lighting',
  );
  debug.recordChainStep(
    2, 'Family', false,
    { value: 'Decorative Lighting', confidence: 90, reasoning: 'Chandeliers are decorative' },
    { value: 'Decorative Lighting', confidence: 88, reasoning: 'Crystal chandelier → decorative' },
    89, 'Decorative Lighting',
  );
  debug.recordChainStep(
    3, 'Category', false,
    { value: 'Chandelier', confidence: 96, reasoning: 'Exact product type match' },
    { value: 'Chandelier', confidence: 94, reasoning: '17-light crystal chandelier' },
    95, 'Chandelier',
  );
  console.log('  [5] Chain steps recorded (3 steps)');

  // ─── [6] Consensus ───────────────────────────────────────
  debug.recordConsensus({
    agreed: true,
    agreementScore: 92,
    value: {
      department: 'Lighting',
      family: 'Decorative Lighting',
      category: 'Chandelier',
      categoryId: 'CAT-CHAN-001',
      confidence: 92,
      locked: false,
      reasoning: {
        step1Department: 'Both sources agree: Lighting',
        step2Family: 'Both sources agree: Decorative Lighting',
        step3Category: 'Both sources agree: Chandelier',
        departmentMismatch: false,
        fastPathUsed: true,
      },
      provider: 'openai',
      classificationHash: 'test-hash-chandelier',
    },
    discrepancies: [],
    retryAllowed: false,
    source: 'consensus',
  });
  console.log('  [6] Consensus recorded');

  // ─── [7] Orchestrator decision ────────────────────────────
  debug.recordOrchestratorDecision(
    'continue',
    undefined,
    { value: 'Chandelier', confidence: 92, source: 'CategoryClassifierAgent-v1' },
  );
  console.log('  [7] Orchestrator decision recorded');

  // ─── [8] Comparison (agent vs monolith) ───────────────────
  debug.recordComparison(
    'Chandelier',   // agentCategory
    92,             // agentConfidence
    'Chandelier',   // monolithCategory
    true,           // written to pipeline_comparisons
  );
  console.log('  [8] Comparison recorded');

  // ─── Totals ───────────────────────────────────────────────
  debug.recordTotals(1250, 3200, 0.042);
  console.log('  [T] Totals recorded');

  // ─── Finalize: render the full report ─────────────────────
  console.log('\n─── Rendering debug report ───\n');
  debug.finalize();

  console.log('\n✅ Test complete — all 8 sections rendered above.\n');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
