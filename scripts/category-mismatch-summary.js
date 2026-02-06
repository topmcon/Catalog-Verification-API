const { MongoClient } = require('mongodb');

(async () => {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('catalog-verification');
  const logs = db.collection('inconclusiveresponselogs');
  
  const startOfDay = new Date('2026-02-05T00:00:00.000Z');
  const endOfDay = new Date('2026-02-06T00:00:00.000Z');
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎯 ACTIONABLE RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Find fields with high NOT_APPLICABLE rate
  const notApplicable = await logs.aggregate([
    {
      $match: {
        timestamp: { $gte: startOfDay, $lt: endOfDay },
        inconclusive_type: 'not_applicable'
      }
    },
    {
      $group: {
        _id: { category: '$category', field: '$field_name' },
        not_applicable_count: { $sum: 1 }
      }
    }
  ]).toArray();
  
  // Get total counts
  const totals = await logs.aggregate([
    {
      $match: {
        timestamp: { $gte: startOfDay, $lt: endOfDay }
      }
    },
    {
      $group: {
        _id: { category: '$category', field: '$field_name' },
        total_count: { $sum: 1 }
      }
    }
  ]).toArray();
  
  // Calculate percentages
  const removalCandidates = [];
  notApplicable.forEach(na => {
    const total = totals.find(t => 
      t._id.category === na._id.category && 
      t._id.field === na._id.field
    );
    if (total) {
      const percentage = (na.not_applicable_count / total.total_count) * 100;
      if (percentage >= 50) {
        removalCandidates.push({
          category: na._id.category,
          field: na._id.field,
          percentage: percentage.toFixed(1),
          not_applicable: na.not_applicable_count,
          total: total.total_count
        });
      }
    }
  });
  
  removalCandidates.sort((a, b) => b.percentage - a.percentage);
  
  console.log('⚠️  FIELDS TO REMOVE FROM VALIDATION (50%+ "Not Applicable"):\n');
  removalCandidates.forEach((item, i) => {
    console.log(`${i+1}. ${item.category} → "${item.field}"`);
    console.log(`   ${item.percentage}% Not Applicable (${item.not_applicable}/${item.total})\n`);
  });
  
  // Category summary
  const byCategory = await logs.aggregate([
    {
      $match: {
        timestamp: { $gte: startOfDay, $lt: endOfDay }
      }
    },
    {
      $group: {
        _id: { category: '$category', type: '$inconclusive_type' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.category': 1, count: -1 } }
  ]).toArray();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 BY CATEGORY BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const categories = {};
  byCategory.forEach(item => {
    const cat = item._id.category || 'UNKNOWN';
    if (!categories[cat]) {
      categories[cat] = { not_found: 0, not_applicable: 0, vague: 0, total: 0 };
    }
    categories[cat][item._id.type] = item.count;
    categories[cat].total += item.count;
  });
  
  Object.keys(categories).sort().forEach(cat => {
    const data = categories[cat];
    console.log(`${cat}:`);
    console.log(`  Not Found:      ${data.not_found.toString().padStart(3)} (${((data.not_found/data.total)*100).toFixed(1)}%)`);
    console.log(`  Not Applicable: ${data.not_applicable.toString().padStart(3)} (${((data.not_applicable/data.total)*100).toFixed(1)}%)`);
    console.log(`  Vague:          ${data.vague.toString().padStart(3)} (${((data.vague/data.total)*100).toFixed(1)}%)\n`);
  });
  
  client.close();
})();
