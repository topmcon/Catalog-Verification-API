/**
 * Test script to demonstrate new Media, Reference_Links, and Documents response sections
 * Using sample data similar to the two prior API calls (MTI Baths Bathtub & Bathroom Sink)
 */

import { SalesforceIncomingProduct } from './src/types/salesforce.types';
import { 
  buildMediaAssets, 
  buildReferenceLinks, 
  buildDocumentsSection 
} from './src/services/response-builder.service';

// Sample payload 1: MTI Baths Bathtub (similar to actual API call)
const bathtubPayload = {
  SF_Catalog_Id: 'CAT-001-BATHTUB',
  SF_Catalog_Name: 'MTI Baths Andrea 19 Bathtub',
  Model_Number_Web_Retailer: '?"',
  Brand_Web_Retailer: 'MTI Baths',
  Product_Title_Web_Retailer: 'MTI Baths Andrea 19 Freestanding Soaking Bathtub',
  Product_Description_Web_Retailer: 'The Andrea 19 is a stunning freestanding bathtub...',
  MSRP_Web_Retailer: '4,299.00',
  Web_Retailer_Category: 'Bathtubs',
  Web_Retailer_SubCategory: 'Freestanding Bathtubs',
  Depth_Web_Retailer: '23.5"',
  Width_Web_Retailer: '54"',
  Height_Web_Retailer: '22"',
  Weight_Web_Retailer: '85 lbs',
  Color_Finish_Web_Retailer: 'White',
  Ferguson_Brand: 'MTI Baths',
  Ferguson_Model_Number: '?"',
  Ferguson_Title: 'MTI Baths Andrea 19 Freestanding Tub',
  Ferguson_Description: 'Freestanding soaking bathtub with sculpted design',
  Ferguson_Base_Category: 'Bathtubs',
  Ferguson_Product_Type: 'Freestanding Bathtub',
  Ferguson_Price: '3,899.00',
  Ferguson_Min_Price: '3,700.00',
  Ferguson_Max_Price: '4,100.00',
  Ferguson_Color: 'White',
  Ferguson_Finish: 'Gloss',
  Ferguson_Depth: '23.5',
  Ferguson_Width: '54',
  Ferguson_Height: '22',
  Ferguson_URL: 'https://www.ferguson.com/product/mti-baths-andrea-19/_/?"',
  Reference_URL: 'https://www.webretailer.com/bathtubs/mti-andrea-19',
  Stock_Images: [
    { url: 'https://images.retailer.com/mti-andrea-19-front.jpg' },
    { url: 'https://images.retailer.com/mti-andrea-19-side.jpg' },
    { url: 'https://images.retailer.com/mti-andrea-19-installed.jpg' },
    { url: 'https://images.retailer.com/mti-andrea-19-dimensions.jpg' }
  ],
  Documents: [
    { url: 'https://docs.mtibaths.com/andrea-19-spec-sheet.pdf', name: 'Spec Sheet', type: 'specification' },
    { url: 'https://docs.mtibaths.com/andrea-19-install-guide.pdf', name: 'Installation Guide', type: 'installation' },
    { url: 'https://docs.mtibaths.com/andrea-19-warranty.pdf', name: 'Warranty Info', type: 'warranty' },
    { url: 'https://docs.mtibaths.com/care-maintenance.pdf', name: 'Care & Maintenance', type: 'maintenance' }
  ],
  Web_Retailer_Specs: [
    { name: 'Material', value: 'Acrylic' },
    { name: 'Drain Location', value: 'Center' },
    { name: 'Water Capacity', value: '65 gallons' }
  ],
  Ferguson_Attributes: [
    { name: 'Material', value: 'SculptureStone™' },
    { name: 'Drain Position', value: 'Center' },
    { name: 'Soaking Depth', value: '15.5"' }
  ]
};

// Sample payload 2: Bathroom Sink (similar to actual API call)
const sinkPayload = {
  SF_Catalog_Id: 'CAT-002-SINK',
  SF_Catalog_Name: 'Kohler Undermount Bathroom Sink',
  Model_Number_Web_Retailer: 'K-2882-0',
  Brand_Web_Retailer: 'Kohler',
  Product_Title_Web_Retailer: 'Kohler Verticyl Undermount Bathroom Sink',
  Product_Description_Web_Retailer: 'Clean, sophisticated design with an oval shape...',
  MSRP_Web_Retailer: '289.00',
  Web_Retailer_Category: 'Bathroom Sinks',
  Web_Retailer_SubCategory: 'Undermount Sinks',
  Depth_Web_Retailer: '7.25"',
  Width_Web_Retailer: '19.5"',
  Height_Web_Retailer: '15.5"',
  Weight_Web_Retailer: '12 lbs',
  Color_Finish_Web_Retailer: 'White',
  Ferguson_Brand: 'Kohler',
  Ferguson_Model_Number: 'K-2882-0',
  Ferguson_Title: 'Kohler Verticyl Undermount Lavatory Sink',
  Ferguson_Description: 'Oval undermount bathroom sink',
  Ferguson_Base_Category: 'Sinks',
  Ferguson_Product_Type: 'Undermount Sink',
  Ferguson_Price: '259.00',
  Ferguson_Min_Price: '245.00',
  Ferguson_Max_Price: '275.00',
  Ferguson_Color: 'White',
  Ferguson_Finish: 'Vitreous China',
  Ferguson_Depth: '7.25',
  Ferguson_Width: '19.5',
  Ferguson_Height: '15.5',
  Ferguson_URL: 'https://www.ferguson.com/product/kohler-verticyl-k2882/_/K-2882-0',
  Reference_URL: 'https://www.webretailer.com/sinks/kohler-verticyl',
  Stock_Images: [
    { url: 'https://images.kohler.com/k-2882-0-top.jpg' },
    { url: 'https://images.kohler.com/k-2882-0-angle.jpg' }
  ],
  Documents: [
    { url: 'https://www.us.kohler.com/webassets/kpna/specs/K-2882-0.pdf', name: 'Product Specifications', type: 'specification' },
    { url: 'https://www.us.kohler.com/webassets/kpna/install/K-2882-install.pdf', name: 'Installation Instructions', type: 'installation' }
  ],
  Web_Retailer_Specs: [
    { name: 'Shape', value: 'Oval' },
    { name: 'Mounting Type', value: 'Undermount' }
  ],
  Ferguson_Attributes: [
    { name: 'Shape', value: 'Oval' },
    { name: 'Style', value: 'Undermount' },
    { name: 'Material', value: 'Vitreous China' }
  ]
};

// Simulate AI document evaluation (what AI would return)
const bathtubAIDocEval = [
  { documentIndex: 0, recommendation: 'use' as const, relevanceScore: 95, reason: 'Contains exact dimensions, materials, and certifications', extractedInfo: 'Dimensions: 54"W x 23.5"D x 22"H, Material: SculptureStone™, Weight: 85 lbs' },
  { documentIndex: 1, recommendation: 'use' as const, relevanceScore: 80, reason: 'Installation requirements useful for verification', extractedInfo: 'Requires reinforced floor support, drain connection specs' },
  { documentIndex: 2, recommendation: 'skip' as const, relevanceScore: 20, reason: 'Warranty info not relevant for product verification', extractedInfo: undefined },
  { documentIndex: 3, recommendation: 'review' as const, relevanceScore: 45, reason: 'May contain material composition details', extractedInfo: undefined }
];

const sinkAIDocEval = [
  { documentIndex: 0, recommendation: 'use' as const, relevanceScore: 90, reason: 'Official Kohler spec sheet with verified dimensions', extractedInfo: 'Basin depth: 6.875", Minimum cabinet width: 24"' },
  { documentIndex: 1, recommendation: 'use' as const, relevanceScore: 75, reason: 'Contains cutout template dimensions for verification', extractedInfo: 'Cutout: 18-1/2" x 14-1/2"' }
];

console.log('='.repeat(80));
console.log('TESTING NEW RESPONSE SECTIONS WITH SAMPLE API PAYLOADS');
console.log('='.repeat(80));

// Test Bathtub
console.log('\n📦 PRODUCT 1: MTI Baths Andrea 19 Bathtub');
console.log('-'.repeat(60));

const bathtubMedia = buildMediaAssets(bathtubPayload as SalesforceIncomingProduct);
console.log('\n🖼️  MEDIA SECTION:');
console.log(JSON.stringify(bathtubMedia, null, 2));

const bathtubLinks = buildReferenceLinks(bathtubPayload as SalesforceIncomingProduct);
console.log('\n🔗 REFERENCE_LINKS SECTION:');
console.log(JSON.stringify(bathtubLinks, null, 2));

const bathtubDocs = buildDocumentsSection(bathtubPayload as SalesforceIncomingProduct, bathtubAIDocEval);
console.log('\n📄 DOCUMENTS SECTION (with AI evaluation):');
console.log(JSON.stringify(bathtubDocs, null, 2));

// Test Sink
console.log('\n\n📦 PRODUCT 2: Kohler Verticyl Bathroom Sink');
console.log('-'.repeat(60));

const sinkMedia = buildMediaAssets(sinkPayload as SalesforceIncomingProduct);
console.log('\n🖼️  MEDIA SECTION:');
console.log(JSON.stringify(sinkMedia, null, 2));

const sinkLinks = buildReferenceLinks(sinkPayload as SalesforceIncomingProduct);
console.log('\n🔗 REFERENCE_LINKS SECTION:');
console.log(JSON.stringify(sinkLinks, null, 2));

const sinkDocs = buildDocumentsSection(sinkPayload as SalesforceIncomingProduct, sinkAIDocEval);
console.log('\n📄 DOCUMENTS SECTION (with AI evaluation):');
console.log(JSON.stringify(sinkDocs, null, 2));

// Show what Salesforce would receive
console.log('\n\n' + '='.repeat(80));
console.log('COMPLETE RESPONSE ADDITIONS FOR SALESFORCE');
console.log('='.repeat(80));

console.log('\n📤 BATHTUB - New sections added to Salesforce response:');
console.log(JSON.stringify({
  Media: bathtubMedia,
  Reference_Links: bathtubLinks,
  Documents: bathtubDocs
}, null, 2));

console.log('\n📤 SINK - New sections added to Salesforce response:');
console.log(JSON.stringify({
  Media: sinkMedia,
  Reference_Links: sinkLinks,
  Documents: sinkDocs
}, null, 2));
