const { MongoClient } = require('mongodb');

(async () => {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('catalog-verification');
  
  const results = await db.collection('verification_jobs').find(
    { status: 'completed' },
    { projection: { 'result.Primary_Attributes': 1 }}
  ).sort({ completedAt: -1 }).limit(300).toArray();
  
  let total = 0, hasFinish = 0, noFinish = 0, suspectFinish = 0;
  const suspects = [];
  const finishValues = {};
  const byCategory = {};
  const colorVsFinish = { same: 0, diff: 0, onlyColor: 0, onlyFinish: 0, neither: 0 };
  
  for (const r of results) {
    if (!r.result || !r.result.Primary_Attributes) continue;
    total++;
    const pa = r.result.Primary_Attributes;
    const finish = pa.AI_Finish || '';
    const color = pa.AI_Color || '';
    const title = pa.AI_Product_Title || '';
    const cat = pa.AI_Product_Category || 'Unknown';
    
    if (!byCategory[cat]) byCategory[cat] = { total: 0, hasFinish: 0, noFinish: 0, suspect: 0 };
    byCategory[cat].total++;
    
    // Track color vs finish relationship
    const fValid = finish && finish !== 'N/A' && !finish.startsWith('Not Specified');
    const cValid = color && color !== 'N/A' && !color.startsWith('Not Specified');
    if (fValid && cValid) {
      if (finish.toLowerCase() === color.toLowerCase()) colorVsFinish.same++;
      else colorVsFinish.diff++;
    } else if (cValid && !fValid) colorVsFinish.onlyColor++;
    else if (fValid && !cValid) colorVsFinish.onlyFinish++;
    else colorVsFinish.neither++;
    
    if (fValid) {
      hasFinish++;
      byCategory[cat].hasFinish++;
      finishValues[finish] = (finishValues[finish] || 0) + 1;
      
      const lower = finish.toLowerCase();
      if (['stainless steel','ceramic','porcelain','plastic','brass','hygieneglaze','cefiontect','sanagloss','vitreous china'].some(s => lower.includes(s))) {
        suspectFinish++;
        byCategory[cat].suspect++;
        suspects.push({ finish, color, cat, title: title ? title.substring(0, 70) : '' });
      }
    } else {
      noFinish++;
      byCategory[cat].noFinish++;
    }
  }
  
  console.log('=== FINISH/COLOR DATA QUALITY (last 200 results) ===\n');
  console.log(`Total: ${total}`);
  console.log(`Has real finish: ${hasFinish} (${Math.round(hasFinish/total*100)}%)`);
  console.log(`No finish/N/A/Not Specified: ${noFinish} (${Math.round(noFinish/total*100)}%)`);
  console.log(`Suspect (material not color): ${suspectFinish} (${Math.round(suspectFinish/total*100)}%)`);
  console.log(`\nReliable finish: ${hasFinish - suspectFinish} (${Math.round((hasFinish-suspectFinish)/total*100)}%)`);
  
  console.log('\n--- COLOR vs FINISH RELATIONSHIP ---');
  console.log(`  Both same value: ${colorVsFinish.same}`);
  console.log(`  Both different values: ${colorVsFinish.diff}`);
  console.log(`  Only Color (no Finish): ${colorVsFinish.onlyColor}`);
  console.log(`  Only Finish (no Color): ${colorVsFinish.onlyFinish}`);
  console.log(`  Neither: ${colorVsFinish.neither}`);
  
  console.log('\n--- TOP 25 FINISH VALUES ---');
  Object.entries(finishValues).sort((a,b) => b[1]-a[1]).slice(0,25).forEach(([k,v]) => console.log(`  ${v}x ${k}`));
  
  console.log('\n--- BY CATEGORY (top 10) ---');
  Object.entries(byCategory).sort((a,b) => b[1].total - a[1].total).slice(0,10).forEach(([cat, d]) => {
    console.log(`  ${cat}: ${d.total} total, ${d.hasFinish} have finish (${d.suspect} suspect), ${d.noFinish} missing`);
  });
  
  console.log('\n--- SUSPECT EXAMPLES (material/coating in finish field) ---');
  suspects.slice(0, 15).forEach(s => console.log(`  [${s.cat}] finish="${s.finish}" color="${s.color}" | ${s.title}`));
  
  // Check title vs finish accuracy
  console.log('\n--- FINISH IN TITLE CHECK ---');
  let titleHasFinish = 0, titleMissingFinish = 0;
  const titleMismatchExamples = [];
  for (const r of results) {
    if (!r.result || !r.result.Primary_Attributes) continue;
    const pa = r.result.Primary_Attributes;
    const f = pa.AI_Finish || '';
    const t = pa.AI_Product_Title || '';
    if (!f || f === 'N/A' || f.startsWith('Not Specified') || !t) continue;
    const firstWord = f.toLowerCase().split(' ')[0];
    if (t.toLowerCase().includes(firstWord)) {
      titleHasFinish++;
    } else {
      titleMissingFinish++;
      if (titleMismatchExamples.length < 10) {
        titleMismatchExamples.push({ finish: f, color: pa.AI_Color, title: t.substring(0, 70) });
      }
    }
  }
  console.log(`  Finish appears in title: ${titleHasFinish}`);
  console.log(`  Finish NOT in title: ${titleMissingFinish}`);
  if (titleHasFinish + titleMissingFinish > 0)
    console.log(`  Match rate: ${Math.round(titleHasFinish/(titleHasFinish+titleMissingFinish)*100)}%`);
  
  console.log('\n--- EXAMPLES: Finish NOT in title ---');
  titleMismatchExamples.forEach(e => console.log(`  finish="${e.finish}" color="${e.color}" | ${e.title}`));
  
  client.close();
})();
