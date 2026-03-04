#!/usr/bin/env node

/**
 * Generate Website Filter Reference Document
 * ===========================================
 * 
 * Creates a comprehensive markdown file listing all filterable attributes
 * for each category/type combination to guide website filter implementation.
 * 
 * Output: docs/WEBSITE-FILTER-REFERENCE.md
 */

const fs = require('fs');
const path = require('path');

// Load data
const { getCategorySchema } = require('../dist/config/category-schema.js');
const SIZE_CLASSES = require('../dist/config/category-size-classes.js').CATEGORY_SIZE_CLASSES;
const categories = require('../src/config/salesforce-picklists/categories.json');
const types = require('../src/config/salesforce-picklists/types.json');
const styles = require('../src/config/salesforce-picklists/styles.json');
const brands = require('../src/config/salesforce-picklists/brands.json');
const attributes = require('../src/config/salesforce-picklists/attributes.json');

// Load category-type mapping
const categoryTypeMapping = require('../src/config/salesforce-picklists/category-type-mapping.json');

// Group categories by department
const categoriesByDepartment = {};
categories.forEach(cat => {
  if (!categoriesByDepartment[cat.department]) {
    categoriesByDepartment[cat.department] = [];
  }
  categoriesByDepartment[cat.department].push(cat);
});

// Build type index for quick lookup
const typesByCategory = {};
Object.entries(categoryTypeMapping).forEach(([categoryName, config]) => {
  typesByCategory[categoryName.toLowerCase()] = config.types || [];
});

// Get size class for category
function getSizeClassForCategory(categoryName) {
  return SIZE_CLASSES[categoryName.toLowerCase()];
}

// Generate markdown
let markdown = `# Website Filter Reference Guide
**Generated**: ${new Date().toISOString().split('T')[0]}  
**Purpose**: Reference for implementing category/type filters on website  
**Source**: Catalog Verification API v1.0

---

## Table of Contents

`;

// Generate TOC
const departments = Object.keys(categoriesByDepartment).sort();
departments.forEach(dept => {
  markdown += `- [${dept}](#${dept.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`;
});

markdown += `
---

## Summary Statistics

- **Total Categories**: ${categories.length}
- **Total Types**: ${types.length}
- **Total Styles**: ${styles.length}
- **Total Brands**: ${brands.length}
- **Total Attributes**: ${attributes.length}
- **Categories with Size Classes**: ${Object.keys(SIZE_CLASSES).length}

---

## Global Filters (Apply to ALL Products)

These attributes are available across all categories:

| Filter | Field Name | Values | Notes |
|--------|------------|--------|-------|
| **Brand** | \`AI_Brand\` | ${brands.length} brands | See full list in appendix |
| **Department** | \`department\` | ${departments.length} departments | ${departments.join(', ')} |
| **Family** | \`AI_Product_Family\` | Appliances, Bath, Kitchen, HVAC, Lighting, etc. | Product grouping |
| **Width** | \`AI_Width\` | Numeric (inches) | Exact measurement |
| **Height** | \`AI_Height\` | Numeric (inches) | Exact measurement |
| **Depth** | \`AI_Depth\` | Numeric (inches) | Exact measurement |
| **Color** | \`AI_Color\` | Text | Primary color |
| **Finish** | \`AI_Finish\` | Text | Surface finish |
| **Style** | \`AI_Style\` | ${styles.length} styles | See style list below |

### Style Values (Global - ${styles.length} total)

Styles apply to specific categories (see \`styles_apply\` field):

\`\`\`
${styles.map(s => s.style_name).slice(0, 30).join(', ')}...
\`\`\`

<details>
<summary>View all ${styles.length} styles</summary>

${styles.map(s => `- ${s.style_name} (ID: ${s.style_id})`).join('\n')}

</details>

---

`;

// Generate category sections by department
departments.forEach(dept => {
  markdown += `## ${dept}\n\n`;
  
  const deptCategories = categoriesByDepartment[dept].sort((a, b) => 
    a.category_name.localeCompare(b.category_name)
  );
  
  markdown += `**${deptCategories.length} categories**\n\n`;
  
  deptCategories.forEach(category => {
    const categoryName = category.category_name;
    const schema = getCategorySchema(categoryName);
    const sizeClass = getSizeClassForCategory(categoryName);
    const categoryTypes = typesByCategory[categoryName.toLowerCase()] || [];
    
    markdown += `### ${categoryName}\n\n`;
    markdown += `**Category ID**: \`${category.category_id}\`  \n`;
    markdown += `**Family**: ${category.family}  \n`;
    markdown += `**Subcategory**: ${category.subcategory || 'N/A'}  \n`;
    markdown += `**Styles Apply**: ${category.styles_apply ? '✅ Yes' : '❌ No'}  \n`;
    
    // Types
    if (categoryTypes.length > 0) {
      markdown += `\n**Types (${categoryTypes.length})**:\n`;
      categoryTypes.forEach(type => {
        markdown += `- ${type}\n`;
      });
    } else {
      markdown += `\n**Types**: None specified\n`;
    }
    
    // Size Class
    if (sizeClass) {
      markdown += `\n**Size Class Filter**: ✅ Yes\n`;
      markdown += `- **Field**: \`AI_Product_Filter_Class\`\n`;
      markdown += `- **Dimension**: ${sizeClass.measurement_dimension} (${sizeClass.measurement_unit})\n`;
      markdown += `- **Standard Sizes**: ${sizeClass.classes.join(', ')}\n`;
      markdown += `- **Format**: "${sizeClass.classes[0]}-${sizeClass.measurement_unit === 'inches' ? 'Inch' : sizeClass.measurement_unit}"\n`;
      markdown += `- **Example**: ${sizeClass.classes[1] || sizeClass.classes[0]}-${sizeClass.measurement_unit === 'inches' ? 'Inch' : sizeClass.measurement_unit}\n`;
      markdown += `- **Rounding**: ${sizeClass.rounding_method}\n`;
      if (sizeClass.notes) {
        markdown += `- **Notes**: ${sizeClass.notes}\n`;
      }
    } else {
      markdown += `\n**Size Class Filter**: ❌ No standard size classes\n`;
    }
    
    // Top 15 Filter Attributes
    if (schema && schema.top15FilterAttributes && schema.top15FilterAttributes.length > 0) {
      markdown += `\n**Top Filter Attributes (${schema.top15FilterAttributes.length})**:\n\n`;
      markdown += `| Rank | Attribute Name | Type | Notes |\n`;
      markdown += `|------|----------------|------|-------|\n`;
      
      schema.top15FilterAttributes.forEach((attr, idx) => {
        // Determine type
        let attrType = 'Text';
        const attrLower = attr.toLowerCase();
        if (attrLower.includes('width') || attrLower.includes('height') || attrLower.includes('depth') || 
            attrLower.includes('capacity') || attrLower.includes('gpm') || attrLower.includes('btu') || 
            attrLower.includes('cfm') || attrLower.includes('watt')) {
          attrType = 'Numeric';
        } else if (attrLower.includes('color') || attrLower.includes('finish') || attrLower.includes('material')) {
          attrType = 'Text';
        } else if (attr.includes('Type') || attr.includes('Style') || attr.includes('Configuration')) {
          attrType = 'Picklist';
        }
        
        markdown += `| ${idx + 1} | ${attr} | ${attrType} | |\n`;
      });
    } else {
      markdown += `\n**Top Filter Attributes**: Not configured\n`;
    }
    
    markdown += `\n---\n\n`;
  });
});

// Appendix - Brand List
markdown += `## Appendix A: Complete Brand List\n\n`;
markdown += `**${brands.length} brands available**\n\n`;

// Group brands alphabetically
const brandsByLetter = {};
brands.forEach(brand => {
  const letter = brand.brand_name.charAt(0).toUpperCase();
  if (!brandsByLetter[letter]) {
    brandsByLetter[letter] = [];
  }
  brandsByLetter[letter].push(brand.brand_name);
});

Object.keys(brandsByLetter).sort().forEach(letter => {
  markdown += `### ${letter}\n\n`;
  brandsByLetter[letter].sort().forEach(brand => {
    markdown += `- ${brand}\n`;
  });
  markdown += `\n`;
});

// Appendix - Common Attributes
markdown += `## Appendix B: Common Attribute Names\n\n`;
markdown += `**${attributes.length} total attributes**\n\n`;
markdown += `Sample of frequently used attributes:\n\n`;

const commonAttrs = [
  'Installation Type',
  'Finish',
  'Color',
  'Material',
  'Width',
  'Height',
  'Depth',
  'Capacity',
  'Voltage',
  'Amperage',
  'BTU',
  'CFM',
  'GPM',
  'Number of Doors',
  'Number of Burners',
  'Number of Racks',
  'Smart Home Compatible',
  'Wi-Fi Enabled',
  'Energy Star',
  'ADA Compliant',
  'Water Sense',
];

const foundAttrs = attributes.filter(a => 
  commonAttrs.some(common => a.attribute_name.toLowerCase().includes(common.toLowerCase()))
);

foundAttrs.slice(0, 50).forEach(attr => {
  markdown += `- ${attr.attribute_name} (\`${attr.attribute_id}\`)\n`;
});

markdown += `\n<details>\n<summary>View all ${attributes.length} attributes</summary>\n\n`;
attributes.forEach(attr => {
  markdown += `- ${attr.attribute_name}\n`;
});
markdown += `\n</details>\n\n`;

// Implementation guidance
markdown += `---

## Implementation Guide

### 1. Category Page Filters

When a user visits a category page (e.g., /refrigerators), display:

**Required Filters**:
- Brand (dropdown/checkboxes)
- Price Range (slider)

**Dynamic Filters** (based on category):
- If category has Size Class: Show size filter (e.g., "30-Inch", "36-Inch", "48-Inch")
- If category has Types: Show type filter (e.g., "French Door", "Side-by-Side")
- If \`styles_apply = true\`: Show style filter
- Show Top 15 Filter Attributes for that category

**Example - Refrigerator Page**:
\`\`\`
Filters:
☑️ Brand: [All Brands ▼]
☑️ Size: [○ 30-Inch ○ 36-Inch ○ 42-Inch ○ 48-Inch]
☑️ Type: [○ French Door ○ Side-by-Side ○ Top Freezer ○ Bottom Freezer]
☑️ Installation: [○ Built-In ○ Counter-Depth ○ Freestanding]
☑️ Finish: [Stainless Steel ▼]
☑️ Price: [$500 ────●──── $10,000]
☑️ Capacity: [10 cu ft ───●─── 30 cu ft]
☑️ Energy Star: [○ Yes]
☑️ Ice Maker: [○ Yes]
\`\`\`

### 2. Search Results Filters

When users search across categories, show:
- Department filter (Appliances, Plumbing, Lighting, etc.)
- Brand filter
- Price range
- Size filter (if applicable to results)

### 3. API Fields to Use

| Filter Type | API Field | Data Type |
|-------------|-----------|-----------|
| Brand | \`AI_Brand\` | String |
| Category | \`AI_Product_Category\` | String |
| Type | \`AI_Type\` | String |
| Style | \`AI_Style\` | String |
| Size Class | \`AI_Product_Filter_Class\` | String (e.g., "48-Inch") |
| Width (exact) | \`AI_Width\` | Numeric (inches) |
| Height (exact) | \`AI_Height\` | Numeric (inches) |
| Depth (exact) | \`AI_Depth\` | Numeric (inches) |
| Color | \`AI_Color\` | String |
| Finish | \`AI_Finish\` | String |
| Top Filters | See category schema | Varies |

### 4. Query Examples

**Get all 30-inch ranges**:
\`\`\`
GET /products?category=Range&filter_class=30-Inch
\`\`\`

**Get all French Door refrigerators with ice makers**:
\`\`\`
GET /products?category=Refrigerator&type=French-Door&ice_maker=Yes
\`\`\`

**Get all stainless steel dishwashers under $1000**:
\`\`\`
GET /products?category=Dishwasher&finish=Stainless-Steel&max_price=1000
\`\`\`

---

## Update Frequency

This reference is based on Salesforce picklists that sync via API:

- **Categories**: Updated when SF syncs new categories
- **Types**: Updated when SF sends type changes
- **Brands**: Updated automatically (945+ brands)
- **Attributes**: Updated automatically (2,159+ attributes)
- **Size Classes**: Static configuration (rarely changes)

**Last Updated**: ${new Date().toISOString().split('T')[0]}  
**Next Review**: Update when major categories are added

`;

// Write file
const outputPath = path.join(__dirname, '..', 'docs', 'WEBSITE-FILTER-REFERENCE.md');
fs.writeFileSync(outputPath, markdown);

console.log('✅ Website Filter Reference generated successfully!');
console.log(`📄 Location: ${outputPath}`);
console.log(`📊 Statistics:`);
console.log(`   - Departments: ${departments.length}`);
console.log(`   - Categories: ${categories.length}`);
console.log(`   - Types: ${types.length}`);
console.log(`   - Brands: ${brands.length}`);
console.log(`   - Attributes: ${attributes.length}`);
console.log(`   - Size Class Categories: ${Object.keys(SIZE_CLASSES).length}`);
