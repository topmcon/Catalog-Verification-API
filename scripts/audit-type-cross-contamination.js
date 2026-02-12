/**
 * TYPE CROSS-CONTAMINATION AUDIT
 * ===============================
 * Find verification jobs where Type_Verified doesn't belong to Category_Verified
 * 
 * This script:
 * 1. Loads category-type-mapping.json to get valid types per category
 * 2. Queries all jobs with both Category_Verified and Type_Verified
 * 3. Validates each Type_Verified is in its category's valid types list
 * 4. Reports cross-contamination cases with details
 * 5. Generates statistics and recommendations
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load category-type-mapping
const categoryTypeMappingPath = path.join(__dirname, '../src/config/salesforce-picklists/category-type-mapping.json');
const categoryTypeMapping = JSON.parse(fs.readFileSync(categoryTypeMappingPath, 'utf8'));

// Build lookup map: category -> valid type names
const categoryToTypesMap = new Map();

for (const mapping of categoryTypeMapping.mappings) {
  const categoryName = mapping.category_name;
  const validTypes = mapping.types.map(t => t.type_name.toLowerCase());
  categoryToTypesMap.set(categoryName.toLowerCase(), {
    categoryName: mapping.category_name,
    department: mapping.department_name,
    family: mapping.family_name,
    validTypes: mapping.types.map(t => t.type_name)
  });
}

console.log(`Loaded ${categoryToTypesMap.size} categories with type mappings\n`);

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
  serverSelectionTimeoutMS: 5000
}).then(async () => {
  console.log('Connected to MongoDB\n');
  
  const db = mongoose.connection.db;
  const jobs = db.collection('verification_jobs');
  
  // Query all jobs with both Category_Verified and Type_Verified set
  const query = {
    'result.Category_Verified': { $exists: true, $ne: null, $ne: '' },
    'result.Type_Verified': { $exists: true, $ne: null, $ne: '', $nin: ['Not Found', 'Not Applicable'] }
  };
  
  const totalJobs = await jobs.countDocuments(query);
  console.log(`Found ${totalJobs} jobs with both Category and Type verified\n`);
  console.log('Analyzing for cross-contamination...\n');
  
  const cursor = jobs.find(query, {
    projection: {
      'rawPayload.SF_Catalog_Id': 1,
      'rawPayload.Model_Number_Web_Retailer': 1,
      'rawPayload.Brand_Web_Retailer': 1,
      'result.Category_Verified': 1,
      'result.Type_Verified': 1,
      'result.Type_Id': 1,
      'result.AI_Type': 1,
      'createdAt': 1
    }
  });
  
  const contaminated = [];
  const byCategory = new Map();
  const byWrongType = new Map();
  let validCount = 0;
  
  for await (const job of cursor) {
    const category = job.result.Category_Verified;
    const type = job.result.Type_Verified;
    
    const categoryInfo = categoryToTypesMap.get(category.toLowerCase());
    
    if (!categoryInfo) {
      // Category not in mapping (might be new or typo)
      continue;
    }
    
    // Check if type is valid for this category
    const isValid = categoryInfo.validTypes.some(validType => 
      validType.toLowerCase() === type.toLowerCase()
    );
    
    if (!isValid) {
      // CROSS-CONTAMINATION DETECTED
      contaminated.push({
        catalogId: job.rawPayload?.SF_Catalog_Id,
        modelNumber: job.rawPayload?.Model_Number_Web_Retailer,
        brand: job.rawPayload?.Brand_Web_Retailer,
        category: category,
        department: categoryInfo.department,
        invalidType: type,
        aiType: job.result?.AI_Type,
        typeId: job.result?.Type_Id,
        createdAt: job.createdAt,
        validTypesForCategory: categoryInfo.validTypes.slice(0, 5) // First 5 for brevity
      });
      
      // Track by category
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category).push(type);
      
      // Track by wrong type
      if (!byWrongType.has(type)) {
        byWrongType.set(type, []);
      }
      byWrongType.get(type).push(category);
    } else {
      validCount++;
    }
  }
  
  // Generate Report
  console.log('═'.repeat(80));
  console.log('TYPE CROSS-CONTAMINATION AUDIT REPORT');
  console.log('═'.repeat(80));
  console.log();
  
  console.log('📊 SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Jobs Analyzed:        ${totalJobs.toLocaleString()}`);
  console.log(`✅ Valid Types:             ${validCount.toLocaleString()} (${((validCount/totalJobs)*100).toFixed(1)}%)`);
  console.log(`🔴 Cross-Contaminated:      ${contaminated.length.toLocaleString()} (${((contaminated.length/totalJobs)*100).toFixed(1)}%)`);
  console.log();
  
  if (contaminated.length === 0) {
    console.log('✅ NO CROSS-CONTAMINATION DETECTED - All types are valid for their categories!');
    mongoose.connection.close();
    process.exit(0);
  }
  
  // Most affected categories
  console.log('📉 TOP 10 AFFECTED CATEGORIES');
  console.log('-'.repeat(80));
  const sortedCategories = Array.from(byCategory.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  for (const [category, types] of sortedCategories) {
    const uniqueTypes = [...new Set(types)];
    console.log(`${category}: ${types.length} jobs with ${uniqueTypes.length} different wrong types`);
    console.log(`  Wrong types: ${uniqueTypes.slice(0, 5).join(', ')}${uniqueTypes.length > 5 ? '...' : ''}`);
  }
  console.log();
  
  // Most common wrong types
  console.log('🔍 TOP 10 MOST COMMON WRONG TYPES (Cross-Contamination Sources)');
  console.log('-'.repeat(80));
  const sortedTypes = Array.from(byWrongType.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  for (const [type, categories] of sortedTypes) {
    const uniqueCategories = [...new Set(categories)];
    console.log(`"${type}": Incorrectly used in ${categories.length} jobs across ${uniqueCategories.length} categories`);
    console.log(`  Wrong categories: ${uniqueCategories.slice(0, 5).join(', ')}${uniqueCategories.length > 5 ? '...' : ''}`);
  }
  console.log();
  
  // Recent examples
  console.log('🔬 RECENT EXAMPLES (Last 10)');
  console.log('-'.repeat(80));
  const recentExamples = contaminated
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  
  for (const example of recentExamples) {
    console.log(`Catalog: ${example.catalogId}`);
    console.log(`  Model: ${example.modelNumber || 'N/A'}`);
    console.log(`  Brand: ${example.brand || 'N/A'}`);
    console.log(`  Category: ${example.category} (${example.department})`);
    console.log(`  ❌ Wrong Type: "${example.invalidType}"`);
    console.log(`  ✅ Valid Types: ${example.validTypesForCategory.join(', ')}...`);
    console.log(`  Date: ${new Date(example.createdAt).toISOString()}`);
    console.log();
  }
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('-'.repeat(80));
  console.log('1. ✅ DEPLOYED: Strict validation now prevents future cross-contamination');
  console.log('2. 🔧 RE-VERIFY: Consider re-running these products through verification');
  console.log('3. 📊 MONITOR: Track if new contamination still occurs (should be 0%)');
  console.log('4. 🧹 CLEANUP: Update Salesforce records with "Not Found" for invalid types');
  console.log();
  
  // Save full report to file
  const reportPath = path.join(__dirname, '../audit-results/type-cross-contamination-audit.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalJobs,
      validCount,
      contaminatedCount: contaminated.length,
      successRate: ((validCount/totalJobs)*100).toFixed(2) + '%',
      contaminationRate: ((contaminated.length/totalJobs)*100).toFixed(2) + '%'
    },
    affectedCategories: Array.from(byCategory.entries()).map(([cat, types]) => ({
      category: cat,
      count: types.length,
      wrongTypes: [...new Set(types)]
    })).sort((a, b) => b.count - a.count),
    commonWrongTypes: Array.from(byWrongType.entries()).map(([type, cats]) => ({
      type,
      count: cats.length,
      wrongCategories: [...new Set(cats)]
    })).sort((a, b) => b.count - a.count),
    contaminatedJobs: contaminated
  }, null, 2));
  
  console.log(`📁 Full report saved to: ${reportPath}`);
  console.log();
  
  mongoose.connection.close();
  process.exit(0);
  
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});
