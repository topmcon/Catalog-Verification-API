#!/bin/bash
# Consistency Test Script - Run same calls multiple times

API_URL="https://verify.cxc-ai.com/api/verify/salesforce"
API_KEY="${SALESFORCE_API_KEY:-test-key-123}"

echo "================================================================="
echo "🔄 CONSISTENCY TEST - Running each payload 3 times"
echo "================================================================="
echo ""

# Bathtub Payload
BATHTUB_PAYLOAD='{
  "SF_Catalog_Id": "TEST-BATHTUB-001",
  "SF_Catalog_Name": "MTI Baths Andrea 19 Bathtub",
  "Model_Number_Web_Retailer": "?"',
  "Brand_Web_Retailer": "MTI Baths",
  "Product_Title_Web_Retailer": "MTI Baths Andrea 19 Freestanding Soaking Bathtub",
  "Product_Description_Web_Retailer": "The Andrea 19 is a stunning freestanding bathtub featuring a sculpted design and premium SculptureStone material.",
  "MSRP_Web_Retailer": "4299.00",
  "Web_Retailer_Category": "Bathtubs",
  "Web_Retailer_SubCategory": "Freestanding Bathtubs",
  "Ferguson_Brand": "MTI Baths",
  "Ferguson_Price": "3899.00",
  "Ferguson_URL": "https://www.ferguson.com/product/mti-baths-andrea-19",
  "Reference_URL": "https://www.webretailer.com/bathtubs/mti-andrea-19",
  "Stock_Images": [
    {"url": "https://images.retailer.com/mti-andrea-19-front.jpg"},
    {"url": "https://images.retailer.com/mti-andrea-19-side.jpg"}
  ],
  "Documents": [
    {"url": "https://docs.mtibaths.com/spec-sheet.pdf", "name": "Spec Sheet", "type": "specification"}
  ]
}'

# Sink Payload
SINK_PAYLOAD='{
  "SF_Catalog_Id": "TEST-SINK-001",
  "SF_Catalog_Name": "Kohler Undermount Bathroom Sink",
  "Model_Number_Web_Retailer": "K-2882-0",
  "Brand_Web_Retailer": "Kohler",
  "Product_Title_Web_Retailer": "Kohler Verticyl Undermount Bathroom Sink",
  "Product_Description_Web_Retailer": "Clean sophisticated design with an oval basin shape, perfect for modern bathrooms.",
  "MSRP_Web_Retailer": "289.00",
  "Web_Retailer_Category": "Bathroom Sinks",
  "Ferguson_Brand": "Kohler",
  "Ferguson_Price": "259.00",
  "Ferguson_URL": "https://www.ferguson.com/product/kohler-verticyl-k2882",
  "Reference_URL": "https://www.webretailer.com/sinks/kohler-verticyl",
  "Stock_Images": [
    {"url": "https://images.kohler.com/k-2882-0-top.jpg"}
  ],
  "Documents": [
    {"url": "https://www.kohler.com/specs/K-2882-0.pdf", "name": "Product Specifications", "type": "specification"}
  ]
}'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: MTI Baths Bathtub - 3 consecutive calls"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in 1 2 3; do
  echo ""
  echo "📤 Bathtub Call #$i..."
  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "$BATHTUB_PAYLOAD")
  
  # Extract key fields for comparison
  CATEGORY=$(echo "$RESPONSE" | jq -r '.Primary_Attributes.Category_Verified // "N/A"')
  BRAND=$(echo "$RESPONSE" | jq -r '.Primary_Attributes.Brand_Verified // "N/A"')
  SCORE=$(echo "$RESPONSE" | jq -r '.Verification.verification_score // "N/A"')
  STATUS=$(echo "$RESPONSE" | jq -r '.Status // "N/A"')
  AGREEMENT=$(echo "$RESPONSE" | jq -r '.AI_Review.consensus.agreement_percentage // "N/A"')
  
  echo "   Category: $CATEGORY"
  echo "   Brand: $BRAND"
  echo "   Score: $SCORE"
  echo "   Status: $STATUS"
  echo "   AI Agreement: $AGREEMENT%"
  
  # Save full response for detailed comparison
  echo "$RESPONSE" > "/tmp/bathtub_response_$i.json"
  
  sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Kohler Sink - 3 consecutive calls"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in 1 2 3; do
  echo ""
  echo "📤 Sink Call #$i..."
  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "$SINK_PAYLOAD")
  
  # Extract key fields
  CATEGORY=$(echo "$RESPONSE" | jq -r '.Primary_Attributes.Category_Verified // "N/A"')
  BRAND=$(echo "$RESPONSE" | jq -r '.Primary_Attributes.Brand_Verified // "N/A"')
  SCORE=$(echo "$RESPONSE" | jq -r '.Verification.verification_score // "N/A"')
  STATUS=$(echo "$RESPONSE" | jq -r '.Status // "N/A"')
  AGREEMENT=$(echo "$RESPONSE" | jq -r '.AI_Review.consensus.agreement_percentage // "N/A"')
  
  echo "   Category: $CATEGORY"
  echo "   Brand: $BRAND"
  echo "   Score: $SCORE"
  echo "   Status: $STATUS"
  echo "   AI Agreement: $AGREEMENT%"
  
  echo "$RESPONSE" > "/tmp/sink_response_$i.json"
  
  sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CONSISTENCY ANALYSIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🛁 BATHTUB - Comparing 3 runs:"
echo "   Checking if Category matches across all runs..."
B_CAT1=$(jq -r '.Primary_Attributes.Category_Verified' /tmp/bathtub_response_1.json 2>/dev/null)
B_CAT2=$(jq -r '.Primary_Attributes.Category_Verified' /tmp/bathtub_response_2.json 2>/dev/null)
B_CAT3=$(jq -r '.Primary_Attributes.Category_Verified' /tmp/bathtub_response_3.json 2>/dev/null)

if [ "$B_CAT1" = "$B_CAT2" ] && [ "$B_CAT2" = "$B_CAT3" ]; then
  echo "   ✅ Category CONSISTENT: $B_CAT1"
else
  echo "   ⚠️  Category VARIES: $B_CAT1 | $B_CAT2 | $B_CAT3"
fi

B_SCORE1=$(jq -r '.Verification.verification_score' /tmp/bathtub_response_1.json 2>/dev/null)
B_SCORE2=$(jq -r '.Verification.verification_score' /tmp/bathtub_response_2.json 2>/dev/null)
B_SCORE3=$(jq -r '.Verification.verification_score' /tmp/bathtub_response_3.json 2>/dev/null)
echo "   Scores: $B_SCORE1 | $B_SCORE2 | $B_SCORE3"

echo ""
echo "🚰 SINK - Comparing 3 runs:"
S_CAT1=$(jq -r '.Primary_Attributes.Category_Verified' /tmp/sink_response_1.json 2>/dev/null)
S_CAT2=$(jq -r '.Primary_Attributes.Category_Verified' /tmp/sink_response_2.json 2>/dev/null)
S_CAT3=$(jq -r '.Primary_Attributes.Category_Verified' /tmp/sink_response_3.json 2>/dev/null)

if [ "$S_CAT1" = "$S_CAT2" ] && [ "$S_CAT2" = "$S_CAT3" ]; then
  echo "   ✅ Category CONSISTENT: $S_CAT1"
else
  echo "   ⚠️  Category VARIES: $S_CAT1 | $S_CAT2 | $S_CAT3"
fi

S_SCORE1=$(jq -r '.Verification.verification_score' /tmp/sink_response_1.json 2>/dev/null)
S_SCORE2=$(jq -r '.Verification.verification_score' /tmp/sink_response_2.json 2>/dev/null)
S_SCORE3=$(jq -r '.Verification.verification_score' /tmp/sink_response_3.json 2>/dev/null)
echo "   Scores: $S_SCORE1 | $S_SCORE2 | $S_SCORE3"

echo ""
echo "================================================================="
echo "Full responses saved to /tmp/bathtub_response_*.json and /tmp/sink_response_*.json"
echo "================================================================="
