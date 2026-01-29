const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

const testProducts = [
  {
    name: 'Chandelier Test',
    file: 'test-data/test-payload-1-chandelier.json'
  },
  {
    name: 'Refrigerator Test',
    file: 'test-data/test-payload-2-refrigerator.json'
  },
  {
    name: 'Dishwasher Test',
    file: 'test-data/test-payload-3-dishwasher.json'
  }
];

async function liveTriAITest() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   LIVE TRI-AI SYSTEM TEST${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   Real-time monitoring of OpenAI → xAI → Claude${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.yellow}📡 Target: https://verify.cxc-ai.com/api/verify/salesforce${colors.reset}\n`);
  console.log(`${colors.blue}📋 Test Plan:${colors.reset}`);
  console.log(`  1. Send 3 product verification requests`);
  console.log(`  2. Monitor production logs in real-time`);
  console.log(`  3. Track AI decision flow: OpenAI → xAI → Claude`);
  console.log(`  4. Capture consensus/research outcomes\n`);

  for (let i = 0; i < testProducts.length; i++) {
    const test = testProducts[i];
    
    console.log(`${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}TEST ${i + 1}/3: ${test.name}${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Check if test file exists
    if (!fs.existsSync(test.file)) {
      console.log(`${colors.red}✗ Test file not found: ${test.file}${colors.reset}\n`);
      continue;
    }

    const payload = JSON.parse(fs.readFileSync(test.file, 'utf8'));
    
    console.log(`${colors.cyan}📤 Sending verification request...${colors.reset}`);
    console.log(`  Product: ${payload.Product_Name__c}`);
    console.log(`  Category: ${payload.Category__c || 'Not provided'}`);
    console.log(`  Brand: ${payload.Brand__c || 'Not provided'}\n`);

    try {
      const startTime = Date.now();
      
      const response = await axios.post(
        'https://verify.cxc-ai.com/api/verify/salesforce',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      );

      const duration = Date.now() - startTime;
      
      console.log(`${colors.green}✓ Response received (${duration}ms)${colors.reset}\n`);
      
      console.log(`${colors.bright}RESPONSE DATA:${colors.reset}`);
      const data = response.data;
      
      if (data.success) {
        console.log(`  ${colors.green}Status: SUCCESS${colors.reset}`);
        console.log(`  Category: ${data.categorizedData?.Category__c || 'N/A'}`);
        console.log(`  Sub-Category: ${data.categorizedData?.Sub_Category__c || 'N/A'}`);
        console.log(`  Style: ${data.categorizedData?.Style__c || 'N/A'}`);
        console.log(`  Brand: ${data.categorizedData?.Brand__c || 'N/A'}`);
        console.log(`  Model: ${data.categorizedData?.Model_Number__c || 'N/A'}`);
        
        const attributeCount = Object.keys(data.categorizedData || {}).filter(k => k.includes('_c')).length;
        console.log(`  Total Fields: ${attributeCount}`);
      } else {
        console.log(`  ${colors.red}Status: FAILED${colors.reset}`);
        console.log(`  Error: ${data.error || 'Unknown error'}`);
      }

      console.log(`\n${colors.cyan}📊 Checking for self-healing activity...${colors.reset}\n`);
      
      // Give orchestrator time to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check production logs for tri-AI activity
      console.log(`${colors.yellow}📜 Production log snippet (last 100 lines):${colors.reset}\n`);
      
      exec('ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -100 /opt/catalog-verification-api/logs/combined.log | grep -E \'Phase 2|tri-AI|OpenAI|xAI|Claude|consensus|🎯|🔬|📊\'"', 
        (error, stdout, stderr) => {
          if (stdout) {
            const lines = stdout.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
              console.log(`${colors.cyan}Found ${lines.length} tri-AI related log entries:${colors.reset}\n`);
              lines.forEach(line => {
                if (line.includes('Claude')) console.log(`${colors.cyan}${line}${colors.reset}`);
                else if (line.includes('OpenAI')) console.log(`${colors.blue}${line}${colors.reset}`);
                else if (line.includes('xAI')) console.log(`${colors.magenta}${line}${colors.reset}`);
                else console.log(line);
              });
            } else {
              console.log(`${colors.yellow}ℹ️  No tri-AI activity detected in logs${colors.reset}`);
            }
          } else {
            console.log(`${colors.yellow}ℹ️  No self-healing triggered (clean verification)${colors.reset}`);
          }
          console.log('\n');
        }
      );
      
      // Wait for log check to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.log(`${colors.red}✗ Request failed${colors.reset}`);
      console.log(`  Error: ${error.message}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    console.log('');
  }

  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   LIVE TEST COMPLETE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.yellow}💡 To see full production logs:${colors.reset}`);
  console.log(`   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log"\n`);
}

liveTriAITest().catch(console.error);
