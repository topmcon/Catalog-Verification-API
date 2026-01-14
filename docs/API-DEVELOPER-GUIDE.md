# Catalog Verification API - Developer Guide

**Version:** 2.2.0  
**Base URL:** `https://verify.cxc-ai.com`  
**Last Updated:** January 14, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Quick Start](#quick-start)
3. [Main Verification Endpoint](#main-verification-endpoint)
4. [Picklist Management](#picklist-management)
5. [Analytics & Tracking](#analytics--tracking)
6. [Alerting & Monitoring](#alerting--monitoring)
7. [Session Management](#session-management)
8. [Enrichment Endpoints](#enrichment-endpoints)
9. [Health & Status](#health--status)
10. [Response Structure](#response-structure)
11. [Error Handling](#error-handling)
12. [Rate Limits](#rate-limits)
13. [Examples](#examples)

---

## Authentication

All API endpoints (except `/health`) require API key authentication.

### Header
```
x-api-key: YOUR_API_KEY
```

### Example
```bash
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"SF_Catalog_Id": "...", ...}'
```

---

## Quick Start

### Verify a Single Product

```bash
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "SF_Catalog_Id": "a03aZ00000EXAMPLE",
    "SF_Catalog_Name": "MODEL-123",
    "Ferguson_Brand": "KOHLER",
    "Ferguson_Business_Category": "Bathtubs",
    "Ferguson_Title": "KOHLER Archer 60\" x 32\" Bathtub",
    "Ferguson_Price": 1299,
    "Ferguson_Attributes": [
      {"name": "Material", "value": "Acrylic"},
      {"name": "Installation Type", "value": "Alcove"}
    ]
  }'
```

---

## Main Verification Endpoint

### POST `/api/verify/salesforce`

The primary endpoint for product verification using dual AI consensus (OpenAI + xAI).

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `SF_Catalog_Id` | string | ✅ | Salesforce catalog record ID |
| `SF_Catalog_Name` | string | ✅ | Model number or product identifier |
| `Brand_Web_Retailer` | string | | Web retailer brand name |
| `Model_Number_Web_Retailer` | string | | Web retailer model number |
| `MSRP_Web_Retailer` | string | | Web retailer MSRP |
| `Product_Title_Web_Retailer` | string | | Web retailer product title |
| `Product_Description_Web_Retailer` | string | | Web retailer description |
| `Web_Retailer_Category` | string | | Primary category from web retailer |
| `Web_Retailer_SubCategory` | string | | Subcategory from web retailer |
| `Depth_Web_Retailer` | string | | Product depth |
| `Width_Web_Retailer` | string | | Product width |
| `Height_Web_Retailer` | string | | Product height |
| `Weight_Web_Retailer` | string | | Product weight |
| `Color_Finish_Web_Retailer` | string | | Color/finish from web retailer |
| `Web_Retailer_Specs` | array | | Array of `{name, value}` spec objects |
| `Ferguson_Brand` | string | | Ferguson brand name |
| `Ferguson_Model_Number` | string | | Ferguson model number |
| `Ferguson_Title` | string | | Ferguson product title |
| `Ferguson_Description` | string | | Ferguson description (HTML) |
| `Ferguson_Price` | number | | Ferguson price |
| `Ferguson_Min_Price` | number | | Ferguson minimum price |
| `Ferguson_Max_Price` | number | | Ferguson maximum price |
| `Ferguson_Business_Category` | string | | Ferguson business category |
| `Ferguson_Base_Category` | string | | Ferguson base category |
| `Ferguson_Color` | string | | Ferguson color (hex or name) |
| `Ferguson_Finish` | string | | Ferguson finish |
| `Ferguson_Collection` | string | | Product collection/family |
| `Ferguson_URL` | string | | Ferguson product page URL |
| `Ferguson_Attributes` | array | | Array of `{name, value}` attribute objects |
| `Stock_Images` | array | | Array of `{url}` image objects |
| `Documents` | array | | Array of `{url, name?, type?}` document objects |
| `Reference_URL` | string | | Third-party retailer reference URL |
| `Specification_Table` | string | | HTML specification table |

#### Response Structure

```json
{
  "success": true,
  "data": {
    "SF_Catalog_Id": "a03aZ00000EXAMPLE",
    "SF_Catalog_Name": "MODEL-123",
    "Primary_Attributes": {
      "Brand_Verified": "KOHLER",
      "Brand_Id": "a0MaZ000000ErR3UAK",
      "Category_Verified": "Bathtubs",
      "Category_Id": "a01aZ00000dC5DlQAK",
      "SubCategory_Verified": "Alcove Bathtubs",
      "Product_Family_Verified": "Archer",
      "Product_Style_Verified": "Contemporary",
      "Style_Id": "a02aZ00000StyleXYZ",
      "Color_Verified": "White",
      "Finish_Verified": "Gloss",
      "Depth_Verified": "20",
      "Width_Verified": "32",
      "Height_Verified": "19",
      "Weight_Verified": "65 lbs",
      "MSRP_Verified": "1299.00",
      "Market_Value": 1299,
      "Market_Value_Min": 1099,
      "Market_Value_Max": 1499,
      "Description_Verified": "...",
      "Product_Title_Verified": "KOHLER Archer 60\" x 32\" Alcove Bathtub in White",
      "Features_List_HTML": "<ul>...</ul>",
      "UPC_GTIN_Verified": "",
      "Model_Number_Verified": "K-1946-LA-0",
      "Model_Number_Alias": "K1946LA0",
      "Model_Parent": "K-1946",
      "Model_Variant_Number": "",
      "Total_Model_Variants": ""
    },
    "Top_Filter_Attributes": {
      "material": "Acrylic",
      "installation_type": "Alcove",
      "drain_location": "Left",
      "soaking_depth": "15",
      "gallons_capacity": "55"
    },
    "Additional_Attributes_HTML": "<table>...</table>",
    "Media": {
      "Primary_Image_URL": "https://...",
      "All_Image_URLs": ["https://..."],
      "Image_Count": 3
    },
    "Reference_Links": {
      "Ferguson_URL": "https://...",
      "Web_Retailer_URL": "https://...",
      "Manufacturer_URL": ""
    },
    "Documents": {
      "total_count": 2,
      "recommended_count": 1,
      "documents": [...]
    },
    "Price_Analysis": {
      "msrp_web_retailer": 1299,
      "msrp_ferguson": 1299
    },
    "Field_AI_Reviews": {
      "brand": {
        "openai": {"value": "KOHLER", "agreed": true, "confidence": 95},
        "xai": {"value": "KOHLER", "agreed": true, "confidence": 95},
        "consensus": "agreed",
        "source": "both_agreed",
        "final_value": "KOHLER"
      }
    },
    "AI_Review": {
      "openai": {"reviewed": true, "result": "agreed", "confidence": 92},
      "xai": {"reviewed": true, "result": "agreed", "confidence": 90},
      "consensus": {
        "both_reviewed": true,
        "agreement_status": "full_agreement",
        "agreement_percentage": 95,
        "final_arbiter": "consensus"
      }
    },
    "Verification": {
      "verification_timestamp": "2026-01-14T16:00:00.000Z",
      "verification_session_id": "uuid-here",
      "verification_score": 92,
      "verification_status": "verified",
      "data_sources_used": ["OpenAI", "xAI", "Ferguson"],
      "corrections_made": [...],
      "missing_fields": [],
      "confidence_scores": {
        "openai": 0.92,
        "xai": 0.90,
        "consensus": 0.91,
        "category": 0.95
      },
      "score_breakdown": {
        "ai_confidence_component": 45,
        "agreement_component": 38,
        "category_bonus": 10,
        "fields_agreed": 42,
        "fields_disagreed": 2,
        "total_fields": 44,
        "agreement_percentage": 95,
        "text_fields_excluded": 4,
        "disagreement_details": [...]
      }
    },
    "Status": "success"
  },
  "sessionId": "uuid-here",
  "processingTimeMs": 15234
}
```

### POST `/api/verify/salesforce/batch`

Batch verify multiple products in a single request.

#### Request Body
```json
{
  "products": [
    {"SF_Catalog_Id": "...", ...},
    {"SF_Catalog_Id": "...", ...}
  ],
  "options": {
    "batchSize": 5,
    "continueOnError": true
  }
}
```

---

## Picklist Management

The API maintains Salesforce picklist values for brands, categories, styles, and attributes. AI responses are matched to these exact values.

### Picklist Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/picklists/stats` | GET | Get picklist statistics |
| `/api/picklists/brands` | GET | List all brands |
| `/api/picklists/brands/:id` | GET | Get brand by Salesforce ID |
| `/api/picklists/brands` | POST | Add new brand |
| `/api/picklists/categories` | GET | List all categories |
| `/api/picklists/categories/:id` | GET | Get category by Salesforce ID |
| `/api/picklists/categories` | POST | Add new category |
| `/api/picklists/styles` | GET | List all styles |
| `/api/picklists/styles` | POST | Add new style |
| `/api/picklists/attributes` | GET | List all attributes |
| `/api/picklists/attributes` | POST | Add new attribute |
| `/api/picklists/match/brand` | POST | Test brand matching |
| `/api/picklists/match/category` | POST | Test category matching |
| `/api/picklists/mismatches` | GET | Get logged mismatches |
| `/api/picklists/mismatches/stats` | GET | Get mismatch statistics |
| `/api/picklists/mismatches/:type/:value/resolve` | POST | Resolve a mismatch |
| `/api/picklists/reload` | POST | Reload picklists from disk |

### GET `/api/picklists/stats`

Get picklist statistics and initialization status.

**Response:**
```json
{
  "success": true,
  "data": {
    "brands": 301,
    "categories": 214,
    "styles": 31,
    "attributes": 51,
    "pendingMismatches": 0,
    "initialized": true
  }
}
```

### GET `/api/picklists/brands`

Get all brand picklist entries.

**Response:**
```json
{
  "success": true,
  "count": 301,
  "data": [
    {"brand_id": "a0MaZ000000ErR3UAK", "brand_name": "KOHLER"},
    {"brand_id": "a0MaZ000002bJHaUAM", "brand_name": "AMERICAN STANDARD"},
    ...
  ]
}
```

### GET `/api/picklists/brands/:id`

Get a specific brand by Salesforce ID.

**Request:**
```bash
GET /api/picklists/brands/a0MaZ000000ErR3UAK
```

**Response:**
```json
{
  "success": true,
  "data": {
    "brand_id": "a0MaZ000000ErR3UAK",
    "brand_name": "KOHLER"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Brand not found"
}
```

### GET `/api/picklists/categories`

Get all category picklist entries.

**Response:**
```json
{
  "success": true,
  "count": 214,
  "data": [
    {
      "category_id": "a01aZ00000dC5DlQAK",
      "category_name": "Bathtubs",
      "department": "Plumbing & Bath",
      "family": "Bath"
    },
    ...
  ]
}
```

### GET `/api/picklists/categories/:id`

Get a specific category by Salesforce ID.

**Request:**
```bash
GET /api/picklists/categories/a01aZ00000dC5DlQAK
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category_id": "a01aZ00000dC5DlQAK",
    "category_name": "Bathtubs",
    "department": "Plumbing & Bath",
    "family": "Bath"
  }
}
```

### GET `/api/picklists/styles`

Get all style picklist entries.

### GET `/api/picklists/attributes`

Get all attribute picklist entries.

### POST `/api/picklists/match/brand`

Test brand matching against the picklist.

**Request:**
```json
{"brand": "kohler"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matched": true,
    "original": "kohler",
    "matchedValue": {
      "brand_id": "a0MaZ000000ErR3UAK",
      "brand_name": "KOHLER"
    },
    "similarity": 1.0
  }
}
```

### POST `/api/picklists/match/category`

Test category matching against the picklist.

**Request:**
```json
{"category": "Bathtub"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matched": true,
    "original": "Bathtub",
    "matchedValue": {
      "category_id": "a01aZ00000dC5DlQAK",
      "category_name": "Bathtubs",
      "department": "Plumbing & Bath",
      "family": "Bath"
    },
    "similarity": 0.9,
    "suggestions": [...]
  }
}
```

### GET `/api/picklists/mismatches`

Get logged mismatches for review and analytics.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | | Filter: `brand`, `category`, `style`, `attribute` |
| `resolved` | boolean | | Filter by resolution status |
| `limit` | number | 100 | Max records to return |

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "type": "brand",
      "originalValue": "AMERICAN STNDARD",
      "closestMatches": ["AMERICAN STANDARD", "AMERICAN STANDARD?""],
      "occurrenceCount": 5,
      "similarity": 0.92,
      "firstSeen": "2026-01-10T...",
      "lastSeen": "2026-01-14T...",
      "resolved": false
    }
  ]
}
```

### GET `/api/picklists/mismatches/stats`

Get mismatch statistics summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "unresolved": 23,
    "byType": [
      {"type": "brand", "count": 20, "unresolvedCount": 12},
      {"type": "category", "count": 15, "unresolvedCount": 8},
      {"type": "style", "count": 10, "unresolvedCount": 3}
    ],
    "topUnresolved": [...]
  }
}
```

### POST `/api/picklists/mismatches/:type/:value/resolve`

Resolve a mismatch (mark as handled).

**Request:**
```json
{
  "action": "mapped_to_existing",
  "resolvedValue": "AMERICAN STANDARD",
  "resolvedBy": "admin"
}
```

**Action Options:**
- `added_to_picklist` - Value was added to SF picklist
- `mapped_to_existing` - Value should map to existing picklist item
- `ignored` - Value should be ignored (invalid data)

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "brand",
    "originalValue": "AMERICAN STNDARD",
    "resolved": true,
    "resolution": {
      "action": "mapped_to_existing",
      "resolvedValue": "AMERICAN STANDARD",
      "resolvedBy": "admin",
      "resolvedAt": "2026-01-14T..."
    }
  }
}
```

### POST `/api/picklists/brands`

Add a new brand to the picklist.

**Request:**
```json
{
  "brand_id": "a0MaZ000000NewID",
  "brand_name": "NEW BRAND NAME"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "brand_id": "a0MaZ000000NewID",
    "brand_name": "NEW BRAND NAME"
  },
  "message": "Brand added successfully"
}
```

**Error Response (409 - Duplicate):**
```json
{
  "success": false,
  "error": "Brand ID already exists",
  "existing": {
    "brand_id": "a0MaZ000000NewID",
    "brand_name": "EXISTING BRAND"
  }
}
```

### POST `/api/picklists/categories`

Add a new category to the picklist.

**Request:**
```json
{
  "category_id": "a01aZ00000NewCatID",
  "category_name": "New Category",
  "department": "Plumbing & Bath",
  "family": "Bath"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "category_id": "a01aZ00000NewCatID",
    "category_name": "New Category",
    "department": "Plumbing & Bath",
    "family": "Bath"
  },
  "message": "Category added successfully"
}
```

### POST `/api/picklists/styles`

Add a new style to the picklist.

**Request:**
```json
{
  "style_id": "a02aZ00000StyleID",
  "style_name": "Industrial"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "style_id": "a02aZ00000StyleID",
    "style_name": "Industrial"
  },
  "message": "Style added successfully"
}
```

### POST `/api/picklists/attributes`

Add a new attribute to the picklist.

**Request:**
```json
{
  "attribute_id": "a03aZ00000AttrID",
  "attribute_name": "Water Efficiency Rating"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "attribute_id": "a03aZ00000AttrID",
    "attribute_name": "Water Efficiency Rating"
  },
  "message": "Attribute added successfully"
}
```

### POST `/api/picklists/reload`

Reload picklists from disk (after updating JSON files).

---

## Analytics & Tracking

### GET `/api/analytics/dashboard`

Get full dashboard with all key metrics.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `7d` | Preset: `today`, `24h`, `7d`, `30d`, `90d` |
| `startDate` | string | | Custom start date (ISO 8601) |
| `endDate` | string | | Custom end date (ISO 8601) |

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCalls": 1523,
      "successRate": 94.2,
      "avgScore": 87.3,
      "avgProcessingTime": 12450
    },
    "aiProviders": {...},
    "categories": {...},
    "trends": {...}
  }
}
```

### GET `/api/analytics/performance`

Get overall performance summary.

### GET `/api/analytics/ai-providers`

Get AI provider comparison statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "openai": {
      "totalCalls": 1523,
      "avgConfidence": 0.89,
      "avgResponseTime": 3200
    },
    "xai": {
      "totalCalls": 1523,
      "avgConfidence": 0.87,
      "avgResponseTime": 4100
    },
    "consensus": {
      "agreementRate": 94.5,
      "avgAgreementScore": 0.91
    }
  }
}
```

### GET `/api/analytics/consensus`

Get consensus statistics and trends.

### GET `/api/analytics/categories`

Get category performance breakdown.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Number of categories to return |

### GET `/api/analytics/brands`

Get brand performance breakdown.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Number of brands to return |

### GET `/api/analytics/issues`

Get issue trends and analysis.

### GET `/api/analytics/disagreements`

Get detailed AI disagreement analysis.

### GET `/api/analytics/timeseries`

Get time series data for charts.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `interval` | string | `day` | Aggregation: `hour`, `day`, `week` |

### GET `/api/analytics/failures`

Get recent failures for review.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Number of records |

### GET `/api/analytics/low-confidence`

Get low confidence verifications for manual review.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | number | 0.7 | Confidence threshold |
| `limit` | number | 50 | Number of records |

### GET `/api/analytics/search`

Search and filter API calls.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `success`, `partial`, `failed` |
| `category` | string | Filter by category |
| `brand` | string | Filter by brand (partial match) |
| `catalogId` | string | Filter by SF Catalog ID |
| `minScore` | number | Minimum verification score |
| `maxScore` | number | Maximum verification score |
| `issueType` | string | Filter by issue type |
| `page` | number | Page number (default: 1) |
| `limit` | number | Records per page (default: 50, max: 100) |

### GET `/api/analytics/tracking/:trackingId`

Get specific tracking record by ID.

### GET `/api/analytics/session/:sessionId`

Get all tracking records for a session.

### GET `/api/analytics/catalog/:catalogId`

Get all tracking records for a catalog item.

### GET `/api/analytics/export`

Export tracking data.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `json` | Export format: `json`, `csv` |
| `limit` | number | 1000 | Max records (max: 10000) |

---

## Alerting & Monitoring

Real-time alerting system for monitoring verification quality and performance issues.

### GET `/api/analytics/alerts`

Get current alerts and system health issues.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `severity` | string | | Filter: `critical`, `warning`, `info` |
| `type` | string | | Filter: `low_confidence`, `slow_response`, `consensus_failure`, `high_error_rate` |
| `acknowledged` | boolean | | Filter by acknowledgment status |
| `limit` | number | 100 | Max alerts to return |

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-uuid",
        "type": "low_confidence",
        "severity": "warning",
        "message": "Low confidence verification for catalog TEST-001",
        "details": {
          "catalogId": "TEST-001",
          "confidence": 0.65,
          "threshold": 0.7
        },
        "timestamp": "2026-01-14T16:30:00.000Z",
        "acknowledged": false
      },
      {
        "id": "alert-uuid-2",
        "type": "consensus_failure",
        "severity": "critical",
        "message": "AI consensus failure - OpenAI and xAI disagreed significantly",
        "details": {
          "catalogId": "TEST-002",
          "agreementPercentage": 45,
          "threshold": 70
        },
        "timestamp": "2026-01-14T16:25:00.000Z",
        "acknowledged": false
      }
    ],
    "summary": {
      "total": 15,
      "critical": 2,
      "warning": 8,
      "info": 5,
      "unacknowledged": 10
    }
  }
}
```

### Alert Types

| Type | Severity | Trigger Condition |
|------|----------|-------------------|
| `low_confidence` | warning | AI confidence < 70% |
| `slow_response` | warning | Processing time > 30 seconds |
| `consensus_failure` | critical | AI agreement < 70% |
| `high_error_rate` | critical | Error rate > 10% in last hour |
| `picklist_mismatch` | info | New unmatched picklist value detected |

---

## Session Management

### GET `/api/verify/session/:sessionId`

Get verification session status.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "status": "completed",
    "totalProducts": 10,
    "processedProducts": 10,
    "successCount": 9,
    "failureCount": 1,
    "startTime": "2026-01-14T15:00:00.000Z",
    "endTime": "2026-01-14T15:02:30.000Z"
  }
}
```

### GET `/api/verify/session/:sessionId/products`

Get all products from a verification session.

### GET `/api/verify/session/:sessionId/logs`

Get audit logs for a verification session.

---

## Enrichment Endpoints

### POST `/api/enrich`

Enrich multiple products with category-specific attributes.

**Request:**
```json
{
  "products": [...],
  "options": {
    "skipAI": false,
    "batchSize": 10
  }
}
```

### POST `/api/enrich/single`

Enrich a single product (quick endpoint).

**Request:**
```json
{
  "id": "PROD-123",
  "name": "Product Name",
  "category": "Bathtubs",
  "attributes": {...}
}
```

---

## Health & Status

### GET `/health`

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-14T16:00:00.000Z"
}
```

### GET `/`

API info endpoint.

**Response:**
```json
{
  "name": "Catalog Verification & Enrichment API",
  "version": "2.0.0",
  "documentation": "/api/docs",
  "health": "/health",
  "endpoints": {
    "verify": "/api/verify",
    "enrich": "/api/enrich",
    "analytics": "/api/analytics"
  }
}
```

---

## Response Structure

### Success Response
```json
{
  "success": true,
  "data": {...},
  "sessionId": "uuid",
  "processingTimeMs": 12345
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2026-01-14T16:00:00.000Z"
}
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | API key valid but lacks permission |
| `NOT_FOUND` | 404 | Resource or route not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 502 | AI provider unavailable |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/verify/salesforce` | 60 requests/minute |
| `/api/verify/salesforce/batch` | 10 requests/minute |
| `/api/analytics/*` | 120 requests/minute |
| `/api/picklists/*` | 120 requests/minute |

---

## Examples

### cURL - Verify Single Product

```bash
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "SF_Catalog_Id": "a03aZ00000MXAurQAH",
    "SF_Catalog_Name": "U.4776L-STN-2",
    "Ferguson_Brand": "Perrin and Rowe",
    "Ferguson_Business_Category": "Kitchen Faucets",
    "Ferguson_Title": "Edwardian 1.8 GPM Widespread Kitchen Faucet",
    "Ferguson_Price": 2692,
    "Ferguson_Attributes": [
      {"name": "Material", "value": "Brass"},
      {"name": "Finish", "value": "Satin Nickel"},
      {"name": "Flow Rate (GPM)", "value": "1.8"}
    ],
    "Stock_Images": [
      {"url": "https://example.com/image.jpg"}
    ]
  }'
```

### cURL - Check Picklist Stats

```bash
curl -X GET https://verify.cxc-ai.com/api/picklists/stats \
  -H "x-api-key: YOUR_API_KEY"
```

### cURL - Test Brand Matching

```bash
curl -X POST https://verify.cxc-ai.com/api/picklists/match/brand \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"brand": "American Standard"}'
```

### cURL - Get Brand by ID

```bash
curl -X GET https://verify.cxc-ai.com/api/picklists/brands/a0MaZ000000ErR3UAK \
  -H "x-api-key: YOUR_API_KEY"
```

### cURL - Add New Brand

```bash
curl -X POST https://verify.cxc-ai.com/api/picklists/brands \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"brand_id": "a0MaZ000000NewID", "brand_name": "NEW BRAND"}'
```

### cURL - Add New Category

```bash
curl -X POST https://verify.cxc-ai.com/api/picklists/categories \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "category_id": "a01aZ00000NewCatID",
    "category_name": "Smart Toilets",
    "department": "Plumbing & Bath",
    "family": "Toilets"
  }'
```

### cURL - Get Analytics Dashboard

```bash
curl -X GET "https://verify.cxc-ai.com/api/analytics/dashboard?period=7d" \
  -H "x-api-key: YOUR_API_KEY"
```

### cURL - Search API Calls

```bash
curl -X GET "https://verify.cxc-ai.com/api/analytics/search?category=Bathtubs&minScore=80&limit=20" \
  -H "x-api-key: YOUR_API_KEY"
```

### cURL - Get Alerts

```bash
curl -X GET "https://verify.cxc-ai.com/api/analytics/alerts?severity=critical" \
  -H "x-api-key: YOUR_API_KEY"
```

### cURL - Get Mismatch Statistics

```bash
curl -X GET https://verify.cxc-ai.com/api/picklists/mismatches/stats \
  -H "x-api-key: YOUR_API_KEY"
```

### cURL - Resolve a Mismatch

```bash
curl -X POST "https://verify.cxc-ai.com/api/picklists/mismatches/brand/AMERICAN%20STNDARD/resolve" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"action": "mapped_to_existing", "resolvedValue": "AMERICAN STANDARD"}'
```

### JavaScript/Node.js

```javascript
const response = await fetch('https://verify.cxc-ai.com/api/verify/salesforce', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    SF_Catalog_Id: 'a03aZ00000EXAMPLE',
    SF_Catalog_Name: 'MODEL-123',
    Ferguson_Brand: 'KOHLER',
    Ferguson_Business_Category: 'Bathtubs',
    Ferguson_Price: 1299
  })
});

const result = await response.json();
console.log(result.data.Primary_Attributes.Brand_Verified);
console.log(result.data.Primary_Attributes.Brand_Id);
console.log(result.data.Verification.verification_score);
```

### Python

```python
import requests

response = requests.post(
    'https://verify.cxc-ai.com/api/verify/salesforce',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY'
    },
    json={
        'SF_Catalog_Id': 'a03aZ00000EXAMPLE',
        'SF_Catalog_Name': 'MODEL-123',
        'Ferguson_Brand': 'KOHLER',
        'Ferguson_Business_Category': 'Bathtubs',
        'Ferguson_Price': 1299
    }
)

result = response.json()
print(f"Brand: {result['data']['Primary_Attributes']['Brand_Verified']}")
print(f"Brand ID: {result['data']['Primary_Attributes']['Brand_Id']}")
print(f"Score: {result['data']['Verification']['verification_score']}")
```

---

## Verification Score Breakdown

The verification score (0-100) is calculated as follows:

| Component | Max Points | Description |
|-----------|------------|-------------|
| AI Confidence | 50 | Average of OpenAI and xAI confidence scores |
| Field Agreement | 40 | Percentage of fields where both AIs agreed |
| Category Bonus | 10 | Awarded if both AIs agree on category (after cross-validation) |

**Note:** Text fields (description, title, features) are excluded from agreement scoring since they're generated content, not factual data.

---

## Support

For API issues or questions:
- **Email:** support@cxc-ai.com
- **Documentation:** https://verify.cxc-ai.com/api/docs

---

*© 2026 CXC AI - Catalog Verification API*
