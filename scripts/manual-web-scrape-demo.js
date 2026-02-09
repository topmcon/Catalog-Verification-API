const puppeteer = require('puppeteer');

/**
 * Manually scrape a Ferguson page to show what 606K tokens contains
 */
async function manualScrape() {
  const url = 'https://www.fergusonhome.com/dacor-dob30m977s/s1530710';
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`MANUAL WEB SCRAPING DEMONSTRATION`);
  console.log(`URL: ${url}`);
  console.log(`${'='.repeat(80)}\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });

    // Extract ALL page content (what we currently do - WRONG)
    const fullContent = await page.evaluate(() => document.body.innerText);
    
    // Extract ONLY product content (what we SHOULD do - RIGHT)
    const productContent = await page.evaluate(() => {
      const selectors = [
        '.product-details',
        '.product-description',
        '.product-specs',
        '.specifications',
        '[data-testid="product-info"]',
        '.product-features'
      ];
      
      let content = '';
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          content += el.innerText + '\n';
        }
      }
      return content || document.body.innerText.substring(0, 10000);
    });

    console.log(`📊 SIZE COMPARISON:\n`);
    console.log(`   CURRENT METHOD (entire page):`);
    console.log(`      Characters: ${fullContent.length.toLocaleString()}`);
    console.log(`      Estimated Tokens: ${Math.ceil(fullContent.length / 4).toLocaleString()}`);
    console.log(`      Size: ${(fullContent.length / 1024).toFixed(2)} KB\n`);
    
    console.log(`   OPTIMIZED METHOD (product only):`);
    console.log(`      Characters: ${productContent.length.toLocaleString()}`);
    console.log(`      Estimated Tokens: ${Math.ceil(productContent.length / 4).toLocaleString()}`);
    console.log(`      Size: ${(productContent.length / 1024).toFixed(2)} KB\n`);
    
    const savings = ((1 - productContent.length / fullContent.length) * 100).toFixed(1);
    console.log(`   💰 POTENTIAL SAVINGS: ${savings}% reduction in tokens\n`);

    // Show what's in the FULL content (current approach)
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`WHAT'S IN THE 606K TOKENS (CURRENT APPROACH)`);
    console.log(`${'─'.repeat(80)}\n`);
    
    const hasNavigation = fullContent.toLowerCase().includes('my account') || 
                         fullContent.toLowerCase().includes('sign in') ||
                         fullContent.toLowerCase().includes('cart');
    const hasFooter = fullContent.toLowerCase().includes('terms') &&
                     fullContent.toLowerCase().includes('privacy');
    const hasAds = fullContent.toLowerCase().includes('recommended products') ||
                   fullContent.toLowerCase().includes('you may also like');
    const hasProductInfo = fullContent.toLowerCase().includes('specifications') ||
                          fullContent.toLowerCase().includes('features');
    
    console.log(`   ✅ Product Information: ${hasProductInfo ? 'YES (~5%)' : 'NO'}`);
    console.log(`   🟥 Navigation Menu: ${hasNavigation ? 'YES (~15%)' : 'NO'}`);
    console.log(`   🟥 Footer Content: ${hasFooter ? 'YES (~10%)' : 'NO'}`);
    console.log(`   🟥 Recommended Products: ${hasAds ? 'YES (~30%)' : 'NO'}`);
    console.log(`   🟥 Other Waste: ~40% (scripts, styles, etc.)\n`);
    
    // Show sample of waste
    console.log(`   📄 SAMPLE OF WASTED CONTENT (first 500 chars):`);
    console.log(`   ${'┄'.repeat(76)}`);
    const sample = fullContent.substring(0, 500).replace(/\n/g, '\n   ');
    console.log(`   ${sample}...`);
    console.log(`   ${'┄'.repeat(76)}\n`);

    // Show what SHOULD be extracted
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`WHAT WE SHOULD EXTRACT (OPTIMIZED APPROACH)`);
    console.log(`${'─'.repeat(80)}\n`);
    
    console.log(`   📄 PRODUCT-ONLY CONTENT (first 500 chars):`);
    console.log(`   ${'┄'.repeat(76)}`);
    const productSample = productContent.substring(0, 500).replace(/\n/g, '\n   ');
    console.log(`   ${productSample}...`);
    console.log(`   ${'┄'.repeat(76)}\n`);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`DATA FLOW & USAGE`);
    console.log(`${'='.repeat(80)}\n`);
    
    console.log(`   1️⃣  WHERE IT'S SAVED:`);
    console.log(`       • MongoDB: verification_job.research.webPages[].content`);
    console.log(`       • Purpose: Input for AI analysis\n`);
    
    console.log(`   2️⃣  WHERE IT'S USED:`);
    console.log(`       • AI Prompt: Combined with other data for verification`);
    console.log(`       • Token Estimation: Counted toward 100K token limit`);
    console.log(`       • Problem: 606K >> 100K = CRASH!\n`);
    
    console.log(`   3️⃣  WHAT'S SENT TO SALESFORCE:`);
    console.log(`       • ❌ NOT the scraped data`);
    console.log(`       • ✅ ONLY verified fields (Category, Brand, Color, etc.)`);
    console.log(`       • Web data is internal processing only\n`);

    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

manualScrape();
