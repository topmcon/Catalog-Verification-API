const fs = require('fs');
const https = require('https');

const API_KEY = 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd';
const API_URL = 'verify.cxc-ai.com';

// Read the jobs with raw payloads
const rawData = fs.readFileSync('/tmp/jobs-with-payloads.json', 'utf8');
const allJobs = JSON.parse(rawData);

// Get jobs with raw payloads
const testJobs = allJobs.filter(j => j.rawPayload).slice(0, 10);

console.log('='.repeat(70));
console.log('RE-RUNNING 10 VERIFICATIONS WITH UPDATED CODE');
console.log('='.repeat(70));
console.log('Jobs to test:');
testJobs.forEach((j, i) => {
  console.log(`  ${i + 1}. ${j.sfCatalogId} | ${j.rawPayload.Ferguson_Brand || j.rawPayload.Brand_Web_Retailer || 'Unknown'} | ${j.sfCatalogName}`);
});
console.log('');

async function runVerification(job, index) {
  return new Promise((resolve, reject) => {
    // Add a unique suffix to SF_Catalog_Id to avoid duplicate key errors
    const modifiedPayload = {
      ...job.rawPayload,
      SF_Catalog_Id: job.rawPayload.SF_Catalog_Id + '-rerun-' + Date.now()
    };
    const payload = JSON.stringify(modifiedPayload);
    
    const options = {
      hostname: API_URL,
      port: 443,
      path: '/api/verify/salesforce',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const brand = job.rawPayload.Ferguson_Brand || job.rawPayload.Brand_Web_Retailer || 'Unknown';
    console.log(`[${index + 1}/10] Starting: ${job.sfCatalogId} (${brand})...`);
    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        try {
          const result = JSON.parse(data);
          if (result.success) {
            const score = result.data?.verificationScore || result.data?.verification_score || 'N/A';
            console.log(`    ✅ Success in ${duration}s | Score: ${score}`);
            resolve({
              job,
              success: true,
              duration,
              newScore: score,
              newStatus: result.data?.verificationStatus || result.data?.verification_status,
              result: result.data
            });
          } else {
            console.log(`    ❌ Failed in ${duration}s | Error: ${result.error?.message || JSON.stringify(result.error) || 'Unknown'}`);
            resolve({
              job,
              success: false,
              duration,
              error: result.error?.message || JSON.stringify(result.error)
            });
          }
        } catch (e) {
          console.log(`    ❌ Parse error in ${duration}s: ${e.message}`);
          console.log(`    Response: ${data.substring(0, 200)}`);
          resolve({
            job,
            success: false,
            duration,
            error: 'Failed to parse response: ' + e.message
          });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`    ❌ Request error: ${e.message}`);
      resolve({
        job,
        success: false,
        error: e.message
      });
    });

    req.setTimeout(180000, () => {
      req.destroy();
      console.log(`    ❌ Timeout after 180s`);
      resolve({
        job,
        success: false,
        error: 'Timeout'
      });
    });

    req.write(payload);
    req.end();
  });
}

async function runAllTests() {
  const results = [];
  
  // Run sequentially to avoid overwhelming the server
  for (let i = 0; i < testJobs.length; i++) {
    const result = await runVerification(testJobs[i], i);
    results.push(result);
    
    // Small delay between requests
    if (i < testJobs.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Summary
  console.log('');
  console.log('='.repeat(70));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  console.log('Product ID                 | Brand           | Status    | Score | Duration');
  console.log('-'.repeat(80));
  
  let successCount = 0;
  let totalScore = 0;
  
  for (const r of results) {
    const brand = r.job.rawPayload.Ferguson_Brand || r.job.rawPayload.Brand_Web_Retailer || 'Unknown';
    if (r.success) {
      successCount++;
      const score = typeof r.newScore === 'number' ? r.newScore : parseInt(r.newScore) || 0;
      totalScore += score;
      console.log(`${r.job.sfCatalogId.substring(0, 24).padEnd(25)} | ${brand.substring(0, 14).padEnd(15)} | ✅ Success | ${String(r.newScore).padEnd(5)} | ${r.duration}s`);
    } else {
      console.log(`${r.job.sfCatalogId.substring(0, 24).padEnd(25)} | ${brand.substring(0, 14).padEnd(15)} | ❌ Failed  |       | ${r.error?.substring(0, 20) || 'Unknown'}`);
    }
  }
  
  console.log('-'.repeat(80));
  console.log(`Total: ${results.length} | Success: ${successCount} | Failed: ${results.length - successCount} | Avg Score: ${successCount > 0 ? (totalScore / successCount).toFixed(1) : 'N/A'}`);
  console.log('='.repeat(70));
  
  // Save detailed results
  fs.writeFileSync('/tmp/rerun-results.json', JSON.stringify(results, null, 2));
  console.log('\nDetailed results saved to /tmp/rerun-results.json');
}

runAllTests().catch(console.error);
