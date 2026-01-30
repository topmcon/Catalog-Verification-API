/**
 * ANALYZE WEBHOOK PAYLOAD
 * Check what's at character position 450 in our webhook payloads
 */

const examplePayload = {
  success: true,
  data: {
    SF_Catalog_Id: "a03aZ00000dmEDWQA2",
    SF_Catalog_Name: "KOES730SPS",
    Primary_Attributes: {
      Brand_Verified: "KitchenAid",
      Brand_Id: null,
      Category_Verified: "Oven",
      Category_Id: "a01Hu000010Q5EmIAK",
      Style_Verified: "Electric Wall Oven",
      Style_Id: "a1IaZ0000018tA1UAI",
      Color_Verified: "Stainless Steel",
      Finish_Verified: "Brushed",
      Product_Title_Verified: "KitchenAid 30\" Smart Electric Wall Oven",
      Model_Number_Verified: "KOES730SPS",
      Depth_Verified: "26.94",
      Width_Verified: "29.75",
      Height_Verified: "28.75",
      Weight_Verified: "167.4",
      MSRP_Verified: "3499",
      Market_Value: 2509,
      Model_Parent: "None Identified",
      Model_Variant_Number: "None Identified",
      Total_Model_Variants: "None Identified"
    },
    Top_Filter_Attributes: {
      fuel_type: "Electric",
      total_capacity: "10.0 cu. ft.",
      convection: "Yes"
    },
    Top_Filter_Attribute_Ids: {
      fuel_type: "a1aaZ000008mBsmQAE",
      total_capacity: "a1aaZ000008mByiQAE",
      convection: "a1aaZ000008mBopQAE"
    }
  },
  sessionId: "87da7453-943b-4e5a-8d15-b736a47747e8",
  processingTimeMs: 213273
};

const jsonString = JSON.stringify(examplePayload);

console.log('═════════════════════════════════════════════════════');
console.log('WEBHOOK PAYLOAD ANALYSIS');
console.log('═════════════════════════════════════════════════════\n');

console.log(`Total Payload Length: ${jsonString.length} characters\n`);

if (jsonString.length >= 450) {
  const contextStart = Math.max(0, 450 - 50);
  const contextEnd = Math.min(jsonString.length, 450 + 50);
  
  console.log('Context around character 450:');
  console.log('─────────────────────────────────────────────────────');
  console.log(jsonString.substring(contextStart, contextEnd));
  console.log('─────────────────────────────────────────────────────\n');
  
  console.log(`Character at position 450: "${jsonString[450]}" (charCode: ${jsonString.charCodeAt(450)})\n`);
  
  // Find which field contains position 450
  let charCount = 0;
  let currentPath = [];
  
  function analyzePosition(obj, path = []) {
    const str = JSON.stringify(obj);
    if (charCount <= 450 && charCount + str.length >= 450) {
      console.log(`Position 450 is within field: ${path.join('.')}`);
      console.log(`Field value: ${typeof obj === 'object' ? JSON.stringify(obj, null, 2) : obj}`);
    }
    charCount += str.length;
  }
  
  // Find exact field
  const findFieldAt450 = (obj, path = '', currentPos = 0) => {
    const json = JSON.stringify(obj);
    
    if (typeof obj !== 'object' || obj === null) {
      return currentPos;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const keyStr = `"${key}":`;
      const beforeKey = currentPos;
      currentPos += keyStr.length;
      
      if (beforeKey <= 450 && currentPos >= 450) {
        console.log(`\n🎯 Character 450 is in the KEY: "${key}"`);
        console.log(`   Path: ${path}${key}`);
        console.log(`   Character range: ${beforeKey} - ${currentPos}`);
      }
      
      const valueStr = JSON.stringify(value);
      const beforeValue = currentPos;
      currentPos += valueStr.length;
      
      if (beforeValue <= 450 && currentPos >= 450) {
        console.log(`\n🎯 Character 450 is in the VALUE of: "${key}"`);
        console.log(`   Path: ${path}${key}`);
        console.log(`   Value: ${valueStr.substring(0, 100)}${valueStr.length > 100 ? '...' : ''}`);
        console.log(`   Character range: ${beforeValue} - ${currentPos}`);
        
        if (typeof value === 'object' && value !== null) {
          findFieldAt450(value, `${path}${key}.`, beforeValue);
        }
        return currentPos;
      }
      
      if (typeof value === 'object' && value !== null) {
        const newPos = findFieldAt450(value, `${path}${key}.`, currentPos);
        if (newPos > currentPos) {
          currentPos = newPos;
        }
      }
      
      // Account for comma/separator
      currentPos += 1;
    }
    
    return currentPos;
  };
  
  findFieldAt450(examplePayload);
  
} else {
  console.log(`⚠️ Payload is only ${jsonString.length} characters long (less than 450)`);
}

console.log('\n═════════════════════════════════════════════════════');
console.log('FORMATTED PAYLOAD:');
console.log('═════════════════════════════════════════════════════\n');
console.log(JSON.stringify(examplePayload, null, 2));
