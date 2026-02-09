const fs = require('fs');
const path = require('path');

/**
 * Comprehensive audit of all category, style, and brand mappings
 * Ensures data integrity across all picklists and mapping files
 */
async function auditMappings() {
  console.log('\n' + '='.repeat(80));
  console.log('CATEGORY/STYLE/BRAND MAPPING INTEGRITY AUDIT');
  console.log('='.repeat(80) + '\n');

  const issues = [];
  const warnings = [];

  try {
    // Load all picklists
    const categories = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../src/config/salesforce-picklists/categories.json'),
      'utf8'
    ));
    const styles = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../src/config/salesforce-picklists/styles.json'),
      'utf8'
    ));
    const brands = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../src/config/salesforce-picklists/brands.json'),
      'utf8'
    ));
    const attributes = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../src/config/salesforce-picklists/attributes.json'),
      'utf8'
    ));
    const categoryFilterAttrs = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../src/config/salesforce-picklists/category-filter-attributes.json'),
      'utf8'
    ));

    // Load mapping file if it exists
    let categoryStyleMapping = {};
    const mappingPath = path.join(__dirname, '../category-type-style-mapping.json');
    if (fs.existsSync(mappingPath)) {
      categoryStyleMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    }

    console.log('📚 PICKLIST STATISTICS:\n');
    console.log(`   Categories: ${Object.keys(categories).length}`);
    console.log(`   Styles: ${Object.keys(styles).length}`);
    console.log(`   Brands: ${Object.keys(brands).length}`);
    console.log(`   Attributes: ${Object.keys(attributes).length}`);
    console.log(`   Category Filter Mappings: ${Object.keys(categoryFilterAttrs).length}\n`);

    // 1. Validate category picklist structure
    console.log('🔍 VALIDATING CATEGORY PICKLIST...\n');
    let categoryCount = 0;
    for (const [key, cat] of Object.entries(categories)) {
      categoryCount++;
      if (!cat.category_name) {
        issues.push(`Category ${key}: Missing category_name`);
      }
      if (!cat.category_id) {
        issues.push(`Category ${key}: Missing category_id`);
      }
      if (!cat.department) {
        warnings.push(`Category ${key} (${cat.category_name}): Missing department`);
      }
    }
    console.log(`   ✅ Validated ${categoryCount} categories`);

    // 2. Validate style picklist structure
    console.log('\n🔍 VALIDATING STYLE PICKLIST...\n');
    let styleCount = 0;
    for (const [key, style] of Object.entries(styles)) {
      styleCount++;
      if (!style.style_name) {
        issues.push(`Style ${key}: Missing style_name`);
      }
      if (!style.style_id) {
        issues.push(`Style ${key}: Missing style_id`);
      }
    }
    console.log(`   ✅ Validated ${styleCount} styles`);

    // 3. Validate brand picklist structure
    console.log('\n🔍 VALIDATING BRAND PICKLIST...\n');
    let brandCount = 0;
    for (const [key, brand] of Object.entries(brands)) {
      brandCount++;
      if (!brand.brand_name) {
        issues.push(`Brand ${key}: Missing brand_name`);
      }
      if (!brand.brand_id) {
        issues.push(`Brand ${key}: Missing brand_id`);
      }
    }
    console.log(`   ✅ Validated ${brandCount} brands`);

    // 4. Validate category filter attributes reference valid categories
    console.log('\n🔍 VALIDATING CATEGORY FILTER ATTRIBUTES...\n');
    const validCategoryNames = Object.values(categories).map(c => c.category_name);
    const validCategoryIds = Object.values(categories).map(c => c.category_id);
    const validAttributeIds = Object.values(attributes).map(a => a.attribute_id);
    
    let filterAttrCount = 0;
    for (const [key, filterAttr] of Object.entries(categoryFilterAttrs)) {
      filterAttrCount++;
      
      if (!validCategoryNames.includes(filterAttr.category_name)) {
        issues.push(`Filter Attr ${key}: Category "${filterAttr.category_name}" not found in categories.json`);
      }
      
      if (!validCategoryIds.includes(filterAttr.category_id)) {
        issues.push(`Filter Attr ${key}: Category ID "${filterAttr.category_id}" not found in categories.json`);
      }
      
      if (!validAttributeIds.includes(filterAttr.attribute_id)) {
        warnings.push(`Filter Attr ${key}: Attribute ID "${filterAttr.attribute_id}" not found in attributes.json`);
      }
      
      if (!filterAttr.rank || filterAttr.rank < 1 || filterAttr.rank > 15) {
        warnings.push(`Filter Attr ${key}: Invalid rank ${filterAttr.rank} (should be 1-15)`);
      }
    }
    console.log(`   ✅ Validated ${filterAttrCount} category filter attributes`);

    // 5. Check for duplicate entries
    console.log('\n🔍 CHECKING FOR DUPLICATES...\n');
    
    const categoryNameCounts = {};
    const categoryIdCounts = {};
    for (const cat of Object.values(categories)) {
      categoryNameCounts[cat.category_name] = (categoryNameCounts[cat.category_name] || 0) + 1;
      categoryIdCounts[cat.category_id] = (categoryIdCounts[cat.category_id] || 0) + 1;
    }
    
    for (const [name, count] of Object.entries(categoryNameCounts)) {
      if (count > 1) {
        issues.push(`Duplicate category name: "${name}" appears ${count} times`);
      }
    }
    
    for (const [id, count] of Object.entries(categoryIdCounts)) {
      if (count > 1) {
        issues.push(`Duplicate category ID: "${id}" appears ${count} times`);
      }
    }
    
    const brandNameCounts = {};
    const brandIdCounts = {};
    for (const brand of Object.values(brands)) {
      brandNameCounts[brand.brand_name] = (brandNameCounts[brand.brand_name] || 0) + 1;
      brandIdCounts[brand.brand_id] = (brandIdCounts[brand.brand_id] || 0) + 1;
    }
    
    for (const [name, count] of Object.entries(brandNameCounts)) {
      if (count > 1) {
        issues.push(`Duplicate brand name: "${name}" appears ${count} times`);
      }
    }
    
    console.log(`   ✅ Duplicate check complete`);

    // 6. Validate category-style mapping (if exists)
    if (Object.keys(categoryStyleMapping).length > 0) {
      console.log('\n🔍 VALIDATING CATEGORY-STYLE MAPPING...\n');
      
      const validStyleNames = Object.values(styles).map(s => s.style_name);
      
      for (const [category, styleData] of Object.entries(categoryStyleMapping)) {
        if (!validCategoryNames.includes(category)) {
          warnings.push(`Mapping: Category "${category}" not found in categories.json`);
        }
        
        if (styleData.Product_Styles) {
          for (const style of styleData.Product_Styles) {
            if (!validStyleNames.includes(style)) {
              warnings.push(`Mapping: Style "${style}" for category "${category}" not found in styles.json`);
            }
          }
        }
      }
      
      console.log(`   ✅ Validated ${Object.keys(categoryStyleMapping).length} category mappings`);
    }

    // Report findings
    console.log('\n' + '='.repeat(80));
    console.log('AUDIT RESULTS');
    console.log('='.repeat(80) + '\n');

    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ ALL CHECKS PASSED - No issues found!\n');
      console.log('   Picklists are properly structured');
      console.log('   All references are valid');
      console.log('   No duplicate entries detected');
    } else {
      if (issues.length > 0) {
        console.log(`🔴 CRITICAL ISSUES FOUND: ${issues.length}\n`);
        issues.forEach((issue, idx) => {
          console.log(`   ${idx + 1}. ${issue}`);
        });
        console.log('');
      }
      
      if (warnings.length > 0) {
        console.log(`🟡 WARNINGS: ${warnings.length}\n`);
        warnings.slice(0, 20).forEach((warning, idx) => {
          console.log(`   ${idx + 1}. ${warning}`);
        });
        if (warnings.length > 20) {
          console.log(`   ... and ${warnings.length - 20} more warnings\n`);
        }
      }
    }

    console.log('\n💡 RECOMMENDATIONS:\n');
    
    if (issues.length > 0) {
      console.log('   🚨 Fix critical issues immediately - these will cause failures');
    }
    
    if (warnings.length > 0) {
      console.log('   ⚠️  Review warnings to prevent future issues');
    }
    
    console.log('   ✅ Run this audit after every picklist sync from Salesforce');
    console.log('   ✅ Keep picklists and mappings synchronized\n');

    process.exit(issues.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ AUDIT FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

auditMappings();
