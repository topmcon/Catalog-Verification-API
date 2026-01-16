/**
 * COMPREHENSIVE SYSTEM TEST
 * Tests all newly implemented features:
 * - Error Recovery Service (Circuit Breaker, Retry Logic)
 * - Field Analytics Service
 * - Dashboard Endpoints
 * - Error Monitoring
 */

import axios from 'axios';

const API_BASE = process.env.TEST_PRODUCTION ? 'https://verify.cxc-ai.com' : 'http://localhost:3001';
const API_KEY = process.env.API_KEY || 'your-api-key-here';

// Sample product payload (based on typical incoming data)
const sampleProduct = {
  SF_Catalog_Id: 'TEST-COMPREHENSIVE-001',
  SF_Catalog_Name: 'Kohler Verticyl Undermount Bathroom Sink',
  Model_Number_Web_Retailer: 'K-2882-0',
  Brand_Web_Retailer: 'Kohler',
  Product_Title_Web_Retailer: 'Kohler Verticyl 19-3/16" Undermount Bathroom Sink with Overflow',
  Product_Description_Web_Retailer: 'Clean, sophisticated design with an oval shape and generous basin. Crafted from vitreous china for lasting beauty and durability.',
  MSRP_Web_Retailer: '289.00',
  Web_Retailer_Category: 'Bathroom Sinks',
  Web_Retailer_SubCategory: 'Undermount Sinks',
  Ferguson_Brand: 'Kohler',
  Ferguson_Price: '259.00',
  Ferguson_URL: 'https://www.ferguson.com/product/kohler-verticyl-k2882',
  Reference_URL: 'https://www.build.com/kohler-k-2882',
  Stock_Images: [
    { url: 'https://images.ferguson.com/product/kohler/k-2882-0-1.jpg' },
    { url: 'https://images.ferguson.com/product/kohler/k-2882-0-2.jpg' }
  ],
  Documents: [
    { url: 'https://media.kohler.com/is/content/KohlerDigital/K-2882_spec.pdf', name: 'Spec Sheet', type: 'specification' }
  ]
};

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<any>): Promise<void> {
  const start = Date.now();
  try {
    console.log(`\n🧪 Testing: ${name}...`);
    const result = await fn();
    const duration = Date.now() - start;
    results.push({
      test: name,
      status: 'PASS',
      duration,
      details: result
    });
    console.log(`✅ PASS (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    results.push({
      test: name,
      status: 'FAIL',
      duration,
      error: error instanceof Error ? error.message : String(error)
    });
    console.log(`❌ FAIL (${duration}ms): ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE SYSTEM TEST - All New Features          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nAPI Base: ${API_BASE}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // ===================================
  // 1. SYSTEM HEALTH CHECK
  // ===================================
  await runTest('System Health Check', async () => {
    const response = await axios.get(`${API_BASE}/api/dashboard/health`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    if (response.data.status !== 'healthy' && response.data.status !== 'degraded') {
      throw new Error(`Unexpected health status: ${response.data.status}`);
    }
    
    return {
      status: response.data.status,
      circuitBreakers: response.data.checks?.circuitBreakers
    };
  });

  // ===================================
  // 2. BASIC API HEALTH
  // ===================================
  await runTest('Basic API Health', async () => {
    const response = await axios.get(`${API_BASE}/health`);
    
    if (response.data.status !== 'healthy') {
      throw new Error('API not healthy');
    }
    
    return response.data;
  });

  // ===================================
  // 3. PRODUCT VERIFICATION (Main Flow)
  // ===================================
  await runTest('Product Verification with New Systems', async () => {
    const response = await axios.post(
      `${API_BASE}/api/verify/salesforce`,
      sampleProduct,
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutes
      }
    );

    if (!response.data.verifiedData) {
      throw new Error('No verified data in response');
    }

    return {
      responseQuality: response.data.metadata?.responseQuality,
      category: response.data.verifiedData.category,
      categoryConfidence: response.data.verifiedData.category_confidence,
      fieldsPopulated: Object.keys(response.data.verifiedData.primary_display_attributes || {}).length,
      sessionId: response.data.metadata?.sessionId
    };
  });

  // ===================================
  // 4. DASHBOARD METRICS
  // ===================================
  await runTest('Dashboard Metrics Endpoint', async () => {
    const response = await axios.get(`${API_BASE}/api/dashboard/dashboard?days=1`, {
      headers: { 'x-api-key': API_KEY }
    });

    return {
      period: response.data.period,
      totalProducts: response.data.fieldPopulation?.totalProducts,
      avgPopulationRate: response.data.fieldPopulation?.avgPopulationRate,
      circuitBreakers: response.data.systemHealth?.circuitBreakers
    };
  });

  // ===================================
  // 5. FIELD POPULATION STATS
  // ===================================
  await runTest('Field Population Analytics', async () => {
    const response = await axios.get(
      `${API_BASE}/api/dashboard/fields/population?category=Bathroom%20Sinks`,
      { headers: { 'x-api-key': API_KEY } }
    );

    return {
      category: response.data.category,
      statistics: response.data.statistics
    };
  });

  // ===================================
  // 6. MISSING FIELDS ANALYSIS
  // ===================================
  await runTest('Missing Fields Analysis', async () => {
    const response = await axios.get(
      `${API_BASE}/api/dashboard/fields/missing?category=Bathroom%20Sinks&limit=10`,
      { headers: { 'x-api-key': API_KEY } }
    );

    return {
      category: response.data.category,
      missingFieldsCount: response.data.missingFields?.length
    };
  });

  // ===================================
  // 7. RESEARCH EFFECTIVENESS
  // ===================================
  await runTest('Research Effectiveness Metrics', async () => {
    const response = await axios.get(
      `${API_BASE}/api/dashboard/research/effectiveness?days=7`,
      { headers: { 'x-api-key': API_KEY } }
    );

    return {
      period: response.data.period,
      metrics: response.data.metrics
    };
  });

  // ===================================
  // 8. CATEGORY CONFUSION MATRIX
  // ===================================
  await runTest('Category Confusion Matrix', async () => {
    const response = await axios.get(
      `${API_BASE}/api/dashboard/category/confusion?limit=20`,
      { headers: { 'x-api-key': API_KEY } }
    );

    return {
      totalConfusions: response.data.total,
      sampleSize: response.data.confusions?.length
    };
  });

  // ===================================
  // 9. ERROR TIMELINE
  // ===================================
  await runTest('Error Timeline', async () => {
    const response = await axios.get(
      `${API_BASE}/api/dashboard/errors/timeline?hours=24`,
      { headers: { 'x-api-key': API_KEY } }
    );

    return {
      period: response.data.period,
      timelineAvailable: !!response.data.timeline
    };
  });

  // ===================================
  // 10. CIRCUIT BREAKER STATUS
  // ===================================
  await runTest('Circuit Breaker Status Check', async () => {
    const response = await axios.get(`${API_BASE}/api/dashboard/health`, {
      headers: { 'x-api-key': API_KEY }
    });

    const breakers = response.data.checks?.circuitBreakers;
    
    return {
      openai: breakers?.openai,
      xai: breakers?.xai,
      overallStatus: breakers?.status
    };
  });

  // ===================================
  // RESULTS SUMMARY
  // ===================================
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST RESULTS                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  ❌ ${r.test}: ${r.error}`);
      });
  }

  console.log('\n📊 Detailed Results:');
  results.forEach((r, i) => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${i + 1}. ${icon} ${r.test} (${r.duration}ms)`);
    if (r.details) {
      console.log(`   Details:`, JSON.stringify(r.details, null, 2).split('\n').map(l => '   ' + l).join('\n'));
    }
  });

  const overallSuccess = failed === 0;
  console.log(`\n${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
