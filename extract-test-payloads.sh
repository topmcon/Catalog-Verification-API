#!/bin/bash
# Extract RAW request payloads from production nginx/app logs

echo "Extracting REQUEST payloads from Salesforce..."

# For the chandelier (most recent)
echo "=== CALL #1: Chandelier a03aZ00000Nk21gQAB ===" > test-data/raw-requests.log

ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "
  # Try to find the actual request body in logs or capture it from recent traffic
  echo 'Note: Request bodies are not logged by default for security'
  echo 'Using catalog index data instead...'
  
  # Get the catalog index data which shows what we received
  docker exec mongodb mongosh catalog-verification --quiet --eval '
    db.categoryindexes.find({sf_catalog_id: \"a03aZ00000Nk21gQAB\"}).limit(1).pretty()
  '
" >> test-data/raw-requests.log

echo "✅ Data extraction complete - see test-data/raw-requests.log"
echo ""
echo "Creating synthetic test payloads from known data..."

# Create test payload files based on what we know from logs
cat > test-data/test-payload-1-chandelier.json << 'EOF'
{
  "SF_Catalog_Id": "a03aZ00000Nk21gQAB",
  "Brand_Web_Retailer": "Elegant Lighting",
  "Model_Number_Web_Retailer": "1201D32-RC",
  "Ferguson_URL": "https://www.fergusonhome.com/elegant-lighting-1201d32-rc/s1729648",
  "Reference_URL": "https://www.elegantlightma.com/brand-elegant/sydney-17-light-matte-black-chandelier-clear-royal-cut-crystal/sku-V758-1201d32mb-rc",
  "Stock_Images": [],
  "Documents": []
}
EOF

cat > test-data/test-payload-2-refrigerator.json << 'EOF'
{
  "SF_Catalog_Id": "a03Hu00001N2EY9IAN",
  "Brand_Web_Retailer": "Café",
  "Model_Number_Web_Retailer": "CGE29DP",
  "Ferguson_URL": "https://www.fergusonhome.com/cafe-cge29dp/s1931707",
  "Reference_URL": null,
  "Stock_Images": [],
  "Documents": []
}
EOF

cat > test-data/test-payload-3-dishwasher.json << 'EOF'
{
  "SF_Catalog_Id": "a03Hu00001N1rXxIAJ",
  "Brand_Web_Retailer": "Bertazzoni",
  "Model_Number_Web_Retailer": "DW24T3IXV",
  "Ferguson_URL": "https://www.fergusonhome.com/bertazzoni-dw24t3iv/s1931611",
  "Reference_URL": "https://us.bertazzoni.com/products/heritage-series/dishwashers/24-inch-dishwasher-tall-tub-with-stainless-steel-panel-and-bar-handle-15-place-settings-42-db-6-wash-cycles-2",
  "Stock_Images": [],
  "Documents": []
}
EOF

echo "✅ Created 3 test payload files"
ls -lh test-data/test-payload-*.json
