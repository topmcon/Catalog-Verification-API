const { fetchWebPage } = require('../dist/services/research.service');

/**
 * Use actual research service to demonstrate web scraping
 */
async function demonstrateWebScraping() {
  const url = 'https://www.fergusonhome.com/dacor-dob30m977s/s1530710';
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ACTUAL WEB SCRAPING DEMONSTRATION`);
  console.log(`URL: ${url}`);
  console.log(`Using: production research.service.ts → fetchWebPage()`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    console.log(`⏳ Fetching webpage (this is what causes the 606K tokens)...\n`);
    
    const result = await fetchWebPage(url);
    
    console.log(`📊 SCRAPING RESULTS:\n`);
    console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    
    if (result.success && result.content) {
      const contentLength = result.content.length;
      const estimatedTokens = Math.ceil(contentLength / 4);
      
      console.log(`\n   📏 SIZE METRICS:`);
      console.log(`      Characters: ${contentLength.toLocaleString()}`);
      console.log(`      Estimated Tokens: ${estimatedTokens.toLocaleString()}`);
      console.log(`      Size: ${(contentLength / 1024).toFixed(2)} KB`);
      console.log(`      ⚠️  This is ${(estimatedTokens / 100000 * 100).toFixed(0)}% of the 100K token limit!\n`);
      
      // Content analysis
      console.log(`   🔍 CONTENT BREAKDOWN (what's in those tokens):\n`);
      
      const lowerContent = result.content.toLowerCase();
      
      // Count different types of content
      const navigationKeywords = ['my account', 'sign in', 'cart', 'checkout', 'shop', 'navigation', 'menu'];
      const footerKeywords = ['copyright', 'privacy policy', 'terms', 'contact us', '© 2026'];
      const productKeywords = ['specifications', 'features', 'product details', 'description'];
      const adsKeywords = ['recommended', 'you may also like', 'similar products', 'related items'];
      
      const navMatches = navigationKeywords.filter(kw => lowerContent.includes(kw)).length;
      const footerMatches = footerKeywords.filter(kw => lowerContent.includes(kw)).length;
      const productMatches = productKeywords.filter(kw => lowerContent.includes(kw)).length;
      const adsMatches = adsKeywords.filter(kw => lowerContent.includes(kw)).length;
      
      console.log(`      ${navMatches > 0 ? '🟥' : '✅'} Navigation Content: ${navMatches} keywords found`);
      console.log(`      ${footerMatches > 0 ? '🟥' : '✅'} Footer Content: ${footerMatches} keywords found`);
      console.log(`      ${productMatches > 0 ? '✅' : '🟥'} Product Info: ${productMatches} keywords found`);
      console.log(`      ${adsMatches > 0 ? '🟥' : '✅'} Recommended Products: ${adsMatches} keywords found\n`);
      
      // Show sample
      console.log(`   📄 CONTENT SAMPLE (first 1000 characters):`);
      console.log(`   ${'┄'.repeat(76)}`);
      const sample = result.content.substring(0, 1000)
        .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
        .split('\n')
        .map(line => `   ${line}`)
        .join('\n');
      console.log(sample);
      console.log(`   [...${(contentLength - 1000).toLocaleString()} more characters]`);
      console.log(`   ${'┄'.repeat(76)}\n`);
      
      // Show extracted data
      if (result.specifications && Object.keys(result.specifications).length > 0) {
        console.log(`   ✅ EXTRACTED SPECIFICATIONS: ${Object.keys(result.specifications).length} items`);
        const specs = Object.keys(result.specifications).slice(0, 5);
        specs.forEach(key => {
          console.log(`      • ${key}: ${String(result.specifications[key]).substring(0, 50)}`);
        });
        if (Object.keys(result.specifications).length > 5) {
          console.log(`      [...${Object.keys(result.specifications).length - 5} more]`);
        }
        console.log('');
      }
      
      if (result.features && result.features.length > 0) {
        console.log(`   ✅ EXTRACTED FEATURES: ${result.features.length} items`);
        result.features.slice(0, 3).forEach((f, i) => {
          console.log(`      ${i + 1}. ${f.substring(0, 60)}...`);
        });
        if (result.features.length > 3) {
          console.log(`      [...${result.features.length - 3} more]`);
        }
        console.log('');
      }
    } else if (result.error) {
      console.log(`   ❌ ERROR: ${result.error}\n`);
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`WHERE THIS DATA IS USED`);
    console.log(`${'='.repeat(80)}\n`);
    
    console.log(`   1️⃣  STORAGE LOCATION:`);
    console.log(`       • MongoDB collection: verification_job`);
    console.log(`       • Field path: job.research.webPages[].content`);
    console.log(`       • Retention: Permanent (for debugging)\n`);
    
    console.log(`   2️⃣  INTENDED USE:`);
    console.log(`       • Passed to AI models (OpenAI + xAI) in prompt`);
    console.log(`       • AI extracts: specifications, features, color, finish`);
    console.log(`       • Combined with: product data, PDF specs, image analysis\n`);
    
    console.log(`   3️⃣  ACTUAL RESULT:`);
    console.log(`       • ❌ Token limit exceeded (606K >> 100K)`);
    console.log(`       • ❌ Smart truncation triggered`);
    console.log(`       • ❌ Null pointer exception (Bug #2)`);
    console.log(`       • ❌ Entire verification crashes\n`);
    
    console.log(`   4️⃣  WHAT SALESFORCE RECEIVES:`);
    console.log(`       • ❌ NOT the web content`);
    console.log(`       • ✅ ONLY verified fields:`);
    console.log(`          - Category_Verified`);
    console.log(`          - Brand_Verified`);
    console.log(`          - Color_Verified`);
    console.log(`          - Finish_Verified`);
    console.log(`          - Product_Title_Verified`);
    console.log(`          - etc. (40+ fields)`);
    console.log(`       • Web content is internal processing only\n`);
    
    console.log(`\n💡 THE FIX:\n`);
    console.log(`   Current: Scrape entire page → 606K tokens → CRASH`);
    console.log(`   Fixed:   Scrape product sections only → <10K tokens → SUCCESS\n`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

demonstrateWebScraping();
