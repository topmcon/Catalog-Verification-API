/**
 * Test Production Type Integration
 * Tests the live production API with real product data to verify Type field integration
 */

const https = require('https');

const productTests = [
  {
    name: "French Door Refrigerator",
    description: "KitchenAid 42 inch Counter Depth French Door Refrigerator with panels Model KBFN502EPA Stainless Steel",
    image_url: "https://example.com/refrigerator.jpg",
    expectedCategory: "Refrigerators",
    expectedType: "French Door" // Type integration test
  },
  {
    name: "Single Handle Faucet",
    description: "Delta Trinsic Single Handle Pull-Down Kitchen Faucet in Chrome Model 9159-DST",
    image_url: "https://example.com/faucet.jpg",
    expectedCategory: "Faucets",
    expectedType: "Single Handle"
  },
  {
    name: "Gas Range",
    description: "GE 30 inch Gas Range with Convection Oven Model JGB735SPSS Stainless Steel",
    image_url: "https://example.com/range.jpg",
    expectedCategory: "Ranges",
    expectedType: "Gas"
  },
  {
    name: "Recessed Lighting",
    description: "Halo 6 inch LED Recessed Downlight Trim White Model RL560WH6935",
    image_url: "https://example.com/light.jpg",
    expectedCategory: "Lighting",
    expectedType: "Recessed"
  },
  {
    name: "Front Control Dishwasher",
    description: "Bosch 800 Series 24 inch Front Control Dishwasher with Stainless Steel Tub Model SHPM88Z75N",
    image_url: "https://example.com/dishwasher.jpg",
    expectedCategory: "Dishwashers",
    expectedType: "Front Control"
  }
];

async function testProductVerification(product) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sfCatalogId: `TEST-${Date.now()}`,
      sfCatalogName: product.name.substring(0, 20).replace(/\s/g, '-'),
      callbackURL: "https://verify.cxc-ai.com/test-callback",
      input: {
        description: product.description,
        image_url: product.image_url
      }
    });

    const options = {
      hostname: 'verify.cxc-ai.com',
      port: 443,
      path: '/api/verify/salesforce',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'X-API-Key': 'test-key-12345' // Production will validate this
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            product: product.name,
            statusCode: res.statusCode,
            response,
            expectedType: product.expectedType
          });
        } catch (error) {
          resolve({
            product: product.name,
            statusCode: res.statusCode,
            error: 'Failed to parse response',
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ product: product.name, error: error.message });
    });

    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('PRODUCTION TYPE INTEGRATION TEST');
  console.log('Testing live production API: https://verify.cxc-ai.com');
  console.log('='.repeat(80));
  console.log('');

  const results = [];
  
  for (const product of productTests) {
    console.log(`Testing: ${product.name}`);
    console.log(`Expected Type: ${product.expectedType}`);
    console.log('-'.repeat(80));
    
    try {
      const result = await testProductVerification(product);
      results.push(result);
      
      console.log(`Status: ${result.statusCode}`);
      console.log(`Response:`, JSON.stringify(result.response, null, 2));
      console.log('');
      
      // Wait 2 seconds between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error testing ${product.name}:`, error);
      results.push({ product: product.name, error });
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    console.log(`\n${result.product}:`);
    console.log(`  Status: ${result.statusCode || 'ERROR'}`);
    if (result.response?.jobId) {
      console.log(`  Job ID: ${result.response.jobId}`);
      console.log(`  Status: ${result.response.status}`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('Note: Jobs are processed asynchronously.');
  console.log('Check job status via GET /api/verify/salesforce/status/:jobId');
  console.log('Or check MongoDB verification_jobs collection');
  console.log('='.repeat(80));
}

runTests().catch(console.error);
