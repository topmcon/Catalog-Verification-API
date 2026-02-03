/**
 * Test Phase 6 Web Search with a real API call
 */

const https = require('https');

const testPayload = {
  SF_Catalog_Id: "TEST-PHASE6-001",
  SF_Catalog_Name: "1225",
  Ferguson_Brand: "Moen",
  Ferguson_Title: "Moen 1225 Single-Handle Replacement Cartridge",
  Ferguson_URL: "https://www.build.com/moen-1225/s1234567",
  Product_Title_Web_Retailer: "Moen 1225 Single Handle Replacement Cartridge",
  Brand_Web_Retailer: "Moen",
  Model_Number_Web_Retailer: "1225",
  MSRP: "",
  Weight: "",
  UPC_GTIN: "",
  Ferguson_Attributes: [
    { name: "Brand", value: "Moen" },
    { name: "Model", value: "1225" },
    { name: "Product Type", value: "Faucet Cartridge" }
  ],
  Web_Retailer_Specs: [
    { name: "Brand", value: "Moen" },
    { name: "Model", value: "1225" },
    { name: "Category", value: "Plumbing Parts" }
  ],
  Documents: [],
  Stock_Images: []
};

const postData = JSON.stringify(testPayload);

const options = {
  hostname: 'verify.cxc-ai.com',
  port: 443,
  path: '/api/verify/salesforce',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-api-key': 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd'
  }
};

console.log('Sending test request to trigger Phase 6 web search...');
console.log('Product: Moen 1225 (Famous replacement cartridge)');
console.log('Missing fields: MSRP, Weight, UPC_GTIN');
console.log('\nWaiting for response (this may take 30-60 seconds)...\n');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    try {
      const result = JSON.parse(data);
      console.log('\n=== Primary Attributes ===');
      console.log('Brand:', result.primary_attributes?.brand);
      console.log('MSRP:', result.primary_attributes?.msrp);
      console.log('Weight:', result.primary_attributes?.weight);
      console.log('UPC/GTIN:', result.primary_attributes?.upc_gtin);
      console.log('Product Style:', result.primary_attributes?.product_style);
      console.log('Color:', result.primary_attributes?.color);
      console.log('Finish:', result.primary_attributes?.finish);
      
      console.log('\n=== Category ===');
      console.log('Category:', result.category?.category || result.category);
      console.log('Subcategory:', result.category?.subcategory);
      
      console.log('\n=== Web Search Results ===');
      if (result.research_transparency?.final_web_search) {
        const ws = result.research_transparency.final_web_search;
        console.log('Search Performed:', ws.search_performed ? 'YES' : 'NO');
        console.log('Query:', ws.query);
        console.log('Specs Found:', ws.specs_found);
        console.log('Sources:', ws.sources?.join(', ') || 'None');
      } else {
        console.log('No final_web_search data in response');
      }
      
      console.log('\n=== Missing Fields ===');
      const missing = result.missing_fields?.map(f => f.field || f).join(', ');
      console.log(missing || 'None');
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw response:', data.substring(0, 2000));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();
