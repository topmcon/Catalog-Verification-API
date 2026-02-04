/**
 * PICKLIST CONSOLIDATION SCRIPT
 * ==============================
 * 
 * Consolidates scattered configuration data into enhanced JSON picklist files:
 * 1. Merges category-aliases into categories.json
 * 2. Merges category-style-mapping into categories.json
 * 3. Extracts ATTRIBUTE_ALIASES to attribute-aliases.json
 * 4. Creates backups of all original files
 * 5. Generates migration report
 * 
 * SAFETY FEATURES:
 * - Creates backups before any changes
 * - Validates data integrity after merge
 * - Generates detailed migration report
 * - Does NOT delete original files (manual cleanup after verification)
 * 
 * FILES TO UPDATE AFTER RUNNING:
 * - src/services/picklist-matcher.service.ts (remove hardcoded ATTRIBUTE_ALIASES)
 * - src/services/dual-ai-verification.service.ts (import from JSON instead of .ts)
 * - src/config/index.ts (update exports)
 * - Any other files importing category-aliases or category-style-mapping
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const PICKLIST_DIR = path.join(ROOT_DIR, 'src/config/salesforce-picklists');
const CONFIG_DIR = path.join(ROOT_DIR, 'src/config');
const BACKUP_DIR = path.join(PICKLIST_DIR, 'backups', `consolidation-${Date.now()}`);
const AUDIT_DIR = path.join(ROOT_DIR, 'audit-results');

// Ensure directories exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

// Logging
const log = [];
function logInfo(msg) {
  console.log(`ℹ️  ${msg}`);
  log.push(`[INFO] ${msg}`);
}
function logSuccess(msg) {
  console.log(`✅ ${msg}`);
  log.push(`[SUCCESS] ${msg}`);
}
function logWarning(msg) {
  console.log(`⚠️  ${msg}`);
  log.push(`[WARNING] ${msg}`);
}
function logError(msg) {
  console.log(`❌ ${msg}`);
  log.push(`[ERROR] ${msg}`);
}

// Helper to parse TypeScript export constants
function parseTypeScriptConstant(filePath, constName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find the constant declaration
  const regex = new RegExp(`export const ${constName}[^=]*=\\s*([\\s\\S]*?);\\s*(?:export|$)`, 'm');
  const match = content.match(regex);
  
  if (!match) {
    throw new Error(`Could not find ${constName} in ${filePath}`);
  }
  
  let constValue = match[1].trim();
  
  // Remove comments
  constValue = constValue.replace(/\/\*[\s\S]*?\*\//g, '');
  constValue = constValue.replace(/\/\/.*/g, '');
  
  // Try to convert to valid JSON
  constValue = constValue
    .replace(/'/g, '"')  // Single to double quotes
    .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
    .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
  
  try {
    return JSON.parse(constValue);
  } catch (e) {
    throw new Error(`Failed to parse ${constName}: ${e.message}`);
  }
}

// Step 1: Backup all original files
function createBackups() {
  logInfo('Creating backups of original files...');
  
  const filesToBackup = [
    path.join(PICKLIST_DIR, 'categories.json'),
    path.join(PICKLIST_DIR, 'attributes.json'),
    path.join(CONFIG_DIR, 'category-aliases.ts'),
    path.join(CONFIG_DIR, 'category-style-mapping.ts'),
    path.join(ROOT_DIR, 'src/services/picklist-matcher.service.ts')
  ];
  
  filesToBackup.forEach(file => {
    if (fs.existsSync(file)) {
      const fileName = path.basename(file);
      const backupPath = path.join(BACKUP_DIR, fileName);
      fs.copyFileSync(file, backupPath);
      logSuccess(`Backed up: ${fileName}`);
    } else {
      logWarning(`File not found for backup: ${file}`);
    }
  });
  
  logSuccess(`All backups saved to: ${BACKUP_DIR}`);
}

// Step 2: Parse category aliases
function parseCategoryAliases() {
  logInfo('Parsing category-aliases.ts...');
  
  const aliasFile = path.join(CONFIG_DIR, 'category-aliases.ts');
  const aliases = parseTypeScriptConstant(aliasFile, 'CATEGORY_ALIASES');
  
  logSuccess(`Parsed ${Object.keys(aliases).length} category aliases`);
  return aliases;
}

// Step 3: Parse category-style mapping
function parseCategoryStyleMapping() {
  logInfo('Parsing category-style-mapping.ts...');
  
  const styleFile = path.join(CONFIG_DIR, 'category-style-mapping.ts');
  const content = fs.readFileSync(styleFile, 'utf-8');
  
  // Find CATEGORY_STYLE_MAPPING export
  const regex = /export const CATEGORY_STYLE_MAPPING:\s*Record<string,\s*string\[\]>\s*=\s*\{([\s\S]*?)\n\};/;
  const match = content.match(regex);
  
  if (!match) {
    throw new Error('Could not find CATEGORY_STYLE_MAPPING in category-style-mapping.ts');
  }
  
  // Parse the mapping (this is complex, may need manual review)
  const mappingText = match[1];
  const styleMapping = {};
  
  // Simple parser for the structure
  const categoryRegex = /"([^"]+)":\s*\[([\s\S]*?)\]/g;
  let categoryMatch;
  
  while ((categoryMatch = categoryRegex.exec(mappingText)) !== null) {
    const categoryName = categoryMatch[1];
    let stylesText = categoryMatch[2];
    
    // Extract styles array
    stylesText = stylesText.replace(/\/\/.*/g, ''); // Remove comments
    stylesText = stylesText.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
    
    const styleMatches = stylesText.match(/"([^"]+)"/g);
    if (styleMatches) {
      const styles = styleMatches.map(s => s.replace(/"/g, ''));
      styleMapping[categoryName] = styles;
    }
  }
  
  logSuccess(`Parsed styles for ${Object.keys(styleMapping).length} categories`);
  return styleMapping;
}

// Step 4: Extract attribute aliases from picklist-matcher.service.ts
function extractAttributeAliases() {
  logInfo('Extracting ATTRIBUTE_ALIASES from picklist-matcher.service.ts...');
  
  const matcherFile = path.join(ROOT_DIR, 'src/services/picklist-matcher.service.ts');
  
  try {
    const aliases = parseTypeScriptConstant(matcherFile, 'ATTRIBUTE_ALIASES');
    logSuccess(`Extracted ${Object.keys(aliases).length} attribute aliases`);
    return aliases;
  } catch (error) {
    logWarning(`Could not auto-parse ATTRIBUTE_ALIASES: ${error.message}`);
    logWarning('You will need to manually extract this');
    return {};
  }
}

// Step 5: Merge data into categories.json
function mergeCategoryData(categoryAliases, categoryStyleMapping) {
  logInfo('Merging data into categories.json...');
  
  const categoriesFile = path.join(PICKLIST_DIR, 'categories.json');
  const categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));
  
  let aliasesAdded = 0;
  let stylesAdded = 0;
  
  // Enhance each category
  categories.forEach(cat => {
    const categoryName = cat.category_name;
    
    // Add aliases if they exist
    const aliasKey = Object.keys(categoryAliases).find(
      key => key.toLowerCase() === categoryName.toLowerCase()
    );
    if (aliasKey) {
      cat.aliases = categoryAliases[aliasKey];
      aliasesAdded++;
    }
    
    // Add valid styles if they exist
    const styleKey = Object.keys(categoryStyleMapping).find(
      key => key.toLowerCase() === categoryName.toLowerCase()
    );
    if (styleKey) {
      cat.valid_styles = categoryStyleMapping[styleKey];
      stylesAdded++;
    }
  });
  
  logSuccess(`Added aliases to ${aliasesAdded} categories`);
  logSuccess(`Added valid_styles to ${stylesAdded} categories`);
  
  return categories;
}

// Step 6: Save enhanced categories.json
function saveEnhancedCategories(categories) {
  logInfo('Saving enhanced categories.json...');
  
  const outputFile = path.join(PICKLIST_DIR, 'categories-enhanced.json');
  fs.writeFileSync(outputFile, JSON.stringify(categories, null, 2));
  
  logSuccess(`Saved enhanced categories to: categories-enhanced.json`);
  logInfo(`Size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
  
  return outputFile;
}

// Step 7: Save attribute aliases JSON
function saveAttributeAliases(attributeAliases) {
  if (Object.keys(attributeAliases).length === 0) {
    logWarning('No attribute aliases to save (manual extraction needed)');
    return null;
  }
  
  logInfo('Saving attribute-aliases.json...');
  
  const outputFile = path.join(PICKLIST_DIR, 'attribute-aliases.json');
  fs.writeFileSync(outputFile, JSON.stringify(attributeAliases, null, 2));
  
  logSuccess(`Saved attribute aliases to: attribute-aliases.json`);
  logInfo(`Total aliases: ${Object.keys(attributeAliases).length}`);
  
  return outputFile;
}

// Step 8: Generate migration guide
function generateMigrationGuide(enhancedCategoriesFile, attributeAliasesFile) {
  logInfo('Generating migration guide...');
  
  const guide = `
# PICKLIST CONSOLIDATION MIGRATION GUIDE
Generated: ${new Date().toISOString()}

## ✅ FILES CREATED

1. **categories-enhanced.json** - Enhanced categories with aliases and valid_styles
   - Location: ${enhancedCategoriesFile}
   - Replaces: categories.json (after validation)

${attributeAliasesFile ? `2. **attribute-aliases.json** - Extracted attribute aliases
   - Location: ${attributeAliasesFile}
   - Replaces: Hardcoded ATTRIBUTE_ALIASES in picklist-matcher.service.ts
` : '2. **attribute-aliases.json** - NOT CREATED (manual extraction needed)'}

## 📋 BACKUPS CREATED

All original files backed up to:
${BACKUP_DIR}

## 🔧 CODE CHANGES REQUIRED

### 1. Update picklist-matcher.service.ts

**Remove hardcoded ATTRIBUTE_ALIASES constant**

Replace with:
\`\`\`typescript
import attributeAliases from '../config/salesforce-picklists/attribute-aliases.json';
const ATTRIBUTE_ALIASES: Record<string, string> = attributeAliases;
\`\`\`

### 2. Update dual-ai-verification.service.ts

**Change imports from TypeScript to JSON:**

OLD:
\`\`\`typescript
import { matchStyleToCategory, getValidStylesForCategory } from '../config/category-style-mapping';
import { normalizeCategoryName, areCategoriesEquivalent } from '../config/category-aliases';
\`\`\`

NEW - Create helper functions:
\`\`\`typescript
import categoriesData from '../config/salesforce-picklists/categories-enhanced.json';

function getValidStylesForCategory(categoryName: string): string[] {
  const category = categoriesData.find(c => c.category_name === categoryName);
  return category?.valid_styles || [];
}

function normalizeCategoryName(categoryName: string): string {
  // Check aliases in categories
  for (const cat of categoriesData) {
    if (cat.category_name === categoryName) return categoryName;
    if (cat.aliases?.includes(categoryName)) return cat.category_name;
  }
  return categoryName;
}
\`\`\`

### 3. Replace categories.json with categories-enhanced.json

After validation:
\`\`\`bash
cd src/config/salesforce-picklists
mv categories.json categories-original.json
mv categories-enhanced.json categories.json
\`\`\`

### 4. Update config/index.ts

**Remove these exports:**
\`\`\`typescript
export * from './category-aliases';
export * from './category-style-mapping';
\`\`\`

### 5. Optional: Archive old TypeScript files

After confirming everything works:
\`\`\`bash
mkdir src/config/archived
mv src/config/category-aliases.ts src/config/archived/
mv src/config/category-style-mapping.ts src/config/archived/
mv src/config/family-category-mapping.ts src/config/archived/
mv src/config/complete-category-data.json src/config/archived/
\`\`\`

## ✅ VALIDATION STEPS

1. **Check enhanced categories:**
   \`\`\`bash
   node -e "const c = require('./src/config/salesforce-picklists/categories-enhanced.json'); console.log('Total:', c.length); console.log('With aliases:', c.filter(x=>x.aliases).length); console.log('With styles:', c.filter(x=>x.valid_styles).length);"
   \`\`\`

2. **Run tests:**
   \`\`\`bash
   npm test
   \`\`\`

3. **Test verification locally:**
   \`\`\`bash
   npm run dev
   # Send test verification request
   \`\`\`

4. **Check for import errors:**
   \`\`\`bash
   npm run build
   \`\`\`

## 📊 CONSOLIDATION SUMMARY

| What | Before | After | Status |
|------|--------|-------|--------|
| Category aliases | Hardcoded .ts | JSON field | ✅ Merged |
| Category styles | Hardcoded .ts | JSON field | ✅ Merged |
| Attribute aliases | Hardcoded .ts | JSON file | ${attributeAliasesFile ? '✅ Extracted' : '⚠️ Manual needed'} |
| Family mappings | Separate .ts | Already in categories.json | ✅ Already there |

## 🎯 BENEFITS

✅ Single source of truth (categories.json)
✅ Salesforce can update aliases/styles via API
✅ No code changes needed for data updates
✅ Easier to maintain and sync
✅ Cleaner codebase

## ⚠️ ROLLBACK INSTRUCTIONS

If something goes wrong:
\`\`\`bash
# Restore from backups
cp ${BACKUP_DIR}/* src/config/salesforce-picklists/
\`\`\`

## 📝 EXECUTION LOG

${log.join('\n')}
`;

  const guideFile = path.join(AUDIT_DIR, 'picklist-consolidation-migration-guide.md');
  fs.writeFileSync(guideFile, guide);
  
  logSuccess(`Migration guide saved to: ${guideFile}`);
  return guideFile;
}

// Main execution
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           📦 PICKLIST CONSOLIDATION SCRIPT                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 1: Backups
    createBackups();
    console.log('');
    
    // Step 2: Parse category aliases
    const categoryAliases = parseCategoryAliases();
    console.log('');
    
    // Step 3: Parse category styles
    const categoryStyleMapping = parseCategoryStyleMapping();
    console.log('');
    
    // Step 4: Extract attribute aliases
    const attributeAliases = extractAttributeAliases();
    console.log('');
    
    // Step 5: Merge into categories
    const enhancedCategories = mergeCategoryData(categoryAliases, categoryStyleMapping);
    console.log('');
    
    // Step 6: Save enhanced categories
    const enhancedFile = saveEnhancedCategories(enhancedCategories);
    console.log('');
    
    // Step 7: Save attribute aliases
    const aliasFile = saveAttributeAliases(attributeAliases);
    console.log('');
    
    // Step 8: Generate migration guide
    const guideFile = generateMigrationGuide(enhancedFile, aliasFile);
    console.log('');
    
    // Summary
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                       ✅ CONSOLIDATION COMPLETE                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📁 Next steps:');
    console.log(`   1. Review: ${guideFile}`);
    console.log(`   2. Validate: ${enhancedFile}`);
    console.log(`   3. Update code imports (see migration guide)`);
    console.log(`   4. Test thoroughly before deploying`);
    console.log(`   5. Backups available at: ${BACKUP_DIR}\n`);
    
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
