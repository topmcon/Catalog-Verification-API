const { MongoClient } = require('mongodb');

async function analyzeCategoryFieldMismatches() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('catalog-verification');
  const logs = db.collection('inconclusiveresponselogs');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('CATEGORY-FIELD MISMATCH ANALYSIS');
  console.log('Identifying attributes that don\'t belong in categories');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const startOfDay = new Date('2026-02-05T00:00:00.000Z');
  const endOfDay = new Date('2026-02-06T00:00:00.000Z');
  
  // Get category-field breakdown with response types
  const categoryFieldBreakdown = await logs.aggregate([
    {
      $match: {
        timestamp: { $gte: startOfDay, $lt: endOfDay }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          field_name: '$field_name',
          inconclusive_type: '$inconclusive_type'
        },
        count: { $sum: 1 },
        sample_values: { $addToSet: '$inconclusive_value' },
        sample_products: { $addToSet: '$model_number' }
      }
    },
    {
      $group: {
        _id: {
          category: '$_id.category',
          field_name: '$_id.field_name'
        },
        total_issues: { $sum: '$count' },
        response_types: {
          $push: {
            type: '$_id.inconclusive_type',
            count: '$count',
            sample_values: '$sample_values',
            sample_products: '$sample_products'
          }
        }
      }
    },
    {
      $sort: { total_issues: -1 }
    }
  ]).toArray();
  
  // Group by category for better analysis
  const byCategory = {};
  categoryFieldBreakdown.forEach(item => {
    const category = item._id.category;
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(item);
  });
  
  // ANALYSIS 1: Fields that return "Not Applicable" frequently (likely don't belong)
  console.log('═══════════════════════════════════════════════════════');
  console.log('FIELDS THAT DON\'T BELONG (High "Not Applicable" Rate)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const notApplicableFields = categoryFieldBreakdown
    .map(item => {
      const notApplicableCount = item.response_types
        .filter(rt => rt.type === 'not_applicable')
        .reduce((sum, rt) => sum + rt.count, 0);
      
      const notApplicableRate = (notApplicableCount / item.total_issues) * 100;
      
      return {
        category: item._id.category,
        field: item._id.field_name,
        total_issues: item.total_issues,
        not_applicable_count: notApplicableCount,
        not_applicable_rate: notApplicableRate,
        response_types: item.response_types
      };
    })
    .filter(f => f.not_applicable_rate >= 80) // 80%+ Not Applicable = likely doesn't belong
    .sort((a, b) => b.total_issues - a.total_issues);
  
  if (notApplicableFields.length > 0) {
    console.log('🚫 RECOMMENDED REMOVALS (Fields with 80%+ "Not Applicable" responses):\n');
    
    notApplicableFields.forEach((field, i) => {
      console.log(`${i + 1}. ${field.category} → "${field.field}"`);
      console.log(`   Not Applicable: ${field.not_applicable_count}/${field.total_issues} (${field.not_applicable_rate.toFixed(1)}%)`);
      
      // Show sample products
      const sampleProducts = field.response_types
        .flatMap(rt => rt.sample_products)
        .slice(0, 3);
      console.log(`   Sample products: ${sampleProducts.join(', ')}`);
      console.log(`   💡 RECOMMENDATION: Remove this field from ${field.category} validation\n`);
    });
  } else {
    console.log('✅ No fields with consistently high "Not Applicable" rates found.\n');
  }
  
  // ANALYSIS 2: Breakdown by category
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('BREAKDOWN BY CATEGORY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const categories = Object.keys(byCategory).sort();
  
  for (const category of categories) {
    const fields = byCategory[category].sort((a, b) => b.total_issues - a.total_issues);
    const totalIssues = fields.reduce((sum, f) => sum + f.total_issues, 0);
    
    console.log('─'.repeat(60));
    console.log(`📁 ${category.toUpperCase()} (${totalIssues} total issues)`);
    console.log('─'.repeat(60));
    
    // Show top 10 problematic fields
    fields.slice(0, 10).forEach((field, i) => {
      console.log(`\n${i + 1}. ${field._id.field_name} (${field.total_issues} issues)`);
      
      // Show response type breakdown
      field.response_types
        .sort((a, b) => b.count - a.count)
        .forEach(rt => {
          const percent = ((rt.count / field.total_issues) * 100).toFixed(1);
          const icon = rt.type === 'not_applicable' ? '⏭️' : 
                       rt.type === 'not_found' ? '🔍' : 
                       rt.type === 'vague' ? '💭' : '❓';
          
          console.log(`   ${icon} ${rt.type}: ${rt.count} (${percent}%)`);
        });
    });
    
    console.log('\n');
  }
  
  // ANALYSIS 3: Field universality - fields that cause issues across ALL categories
  console.log('═══════════════════════════════════════════════════════');
  console.log('UNIVERSAL PROBLEM FIELDS (Issues across all categories)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const fieldAcrossCategories = {};
  categoryFieldBreakdown.forEach(item => {
    const field = item._id.field_name;
    if (!fieldAcrossCategories[field]) {
      fieldAcrossCategories[field] = {
        categories: new Set(),
        total_issues: 0,
        by_type: {}
      };
    }
    
    fieldAcrossCategories[field].categories.add(item._id.category);
    fieldAcrossCategories[field].total_issues += item.total_issues;
    
    item.response_types.forEach(rt => {
      if (!fieldAcrossCategories[field].by_type[rt.type]) {
        fieldAcrossCategories[field].by_type[rt.type] = 0;
      }
      fieldAcrossCategories[field].by_type[rt.type] += rt.count;
    });
  });
  
  const universalFields = Object.entries(fieldAcrossCategories)
    .filter(([_, data]) => data.categories.size >= 3) // In 3+ categories
    .sort((a, b) => b[1].total_issues - a[1].total_issues)
    .slice(0, 10);
  
  universalFields.forEach(([field, data], i) => {
    console.log(`${i + 1}. ${field}`);
    console.log(`   Affects: ${data.categories.size} categories (${[...data.categories].join(', ')})`);
    console.log(`   Total issues: ${data.total_issues}`);
    
    const typeBreakdown = Object.entries(data.by_type)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type}:${count}`)
      .join(', ');
    console.log(`   Breakdown: ${typeBreakdown}`);
    console.log('');
  });
  
  // ANALYSIS 4: Action items
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎯 ACTIONABLE RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('1. FIELDS TO REMOVE FROM CATEGORY VALIDATION:');
  if (notApplicableFields.length > 0) {
    notApplicableFields.slice(0, 5).forEach(field => {
      console.log(`   ❌ Remove "${field.field}" from "${field.category}"`);
      console.log(`      (${field.not_applicable_rate.toFixed(1)}% always returns "Not Applicable")\n`);
    });
  } else {
    console.log('   ✅ No clear candidates found\n');
  }
  
  console.log('2. FIELDS NEEDING BETTER DATA SOURCES:');
  const notFoundFields = categoryFieldBreakdown
    .map(item => {
      const notFoundCount = item.response_types
        .filter(rt => rt.type === 'not_found')
        .reduce((sum, rt) => sum + rt.count, 0);
      return {
        category: item._id.category,
        field: item._id.field_name,
        not_found_count: notFoundCount,
        total: item.total_issues,
        rate: (notFoundCount / item.total_issues) * 100
      };
    })
    .filter(f => f.rate >= 80 && f.total >= 10)
    .sort((a, b) => b.not_found_count - a.not_found_count)
    .slice(0, 5);
  
  if (notFoundFields.length > 0) {
    notFoundFields.forEach(field => {
      console.log(`   🔍 "${field.field}" in ${field.category}`);
      console.log(`      (${field.rate.toFixed(1)}% data genuinely missing from sources)\n`);
    });
  } else {
    console.log('   ✅ No significant data gaps found\n');
  }
  
  console.log('3. FIELDS WITH VAGUE AI RESPONSES:');
  const vagueFields = categoryFieldBreakdown
    .map(item => {
      const vagueCount = item.response_types
        .filter(rt => rt.type === 'vague')
        .reduce((sum, rt) => sum + rt.count, 0);
      return {
        category: item._id.category,
        field: item._id.field_name,
        vague_count: vagueCount
      };
    })
    .filter(f => f.vague_count > 0)
    .sort((a, b) => b.vague_count - a.vague_count);
  
  if (vagueFields.length > 0) {
    console.log('   💭 Improve AI prompts for these fields:\n');
    vagueFields.forEach(field => {
      console.log(`      - "${field.field}" in ${field.category} (${field.vague_count} vague responses)\n`);
    });
  } else {
    console.log('   ✅ No vague responses detected\n');
  }
  
  await client.close();
  process.exit(0);
}

analyzeCategoryFieldMismatches().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
