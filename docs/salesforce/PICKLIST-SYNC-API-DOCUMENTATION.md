
8. CONSENSUS FAILURES 🟡 MEDIUM SEVERITY
Session	Score
Some sessions	0%
Successful sessions	74-97%# Picklist Sync API Documentation

**Version**: 1.0  
**Last Updated**: February 11, 2026  
**Author**: Catalog Verification API Team

---

## Overview

This document describes the API endpoints and payload formats for syncing picklist data between the Catalog Verification API and Salesforce.

---

## API Endpoints

### Base URL
```
Production: https://verify.cxc-ai.com
```

### Authentication
All requests require an API key in the header:
```
x-api-key: <your-api-key>
```

---

## Endpoint: Push Picklists TO Salesforce

When we push picklists TO Salesforce, we call:

```
POST https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify
```

### Request Headers
```http
Content-Type: application/json
x-api-key: 873648276-550e8400
```

---

## Endpoint: Receive Picklists FROM Salesforce

When Salesforce pushes picklists TO us, call:

```
POST https://verify.cxc-ai.com/api/picklists/sync
```

### Request Headers
```http
Content-Type: application/json
x-api-key: <webhook-secret>
```

### Response Codes
| Code | Meaning |
|------|---------|
| `202 Accepted` | Sync received and held for manual review |
| `400 Bad Request` | Invalid payload format |
| `401 Unauthorized` | Missing API key |
| `403 Forbidden` | Invalid API key |

**Note**: As of February 2026, all incoming syncs are **held for manual review** before being applied. This prevents accidental overwrites of custom fields.

---

## Picklist Types & Payload Formats

We sync **7 picklist types**:

| # | Type | Item Count | Description |
|---|------|------------|-------------|
| 1 | departments | 8 | Top-level product departments |
| 2 | families | 8 | Category families within departments |
| 3 | categories | 212 | Product categories with custom fields |
| 4 | types | 688 | Product types (functional classification) |
| 5 | styles | 16 | Aesthetic styles |
| 6 | brands | 402 | Brand master list |
| 7 | attributes | 945 | Filter/specification attributes |

---

## Payload Examples

### 1. Departments

```json
{
  "type": "departments",
  "action": "sync_from_api",
  "total_count": 8,
  "departments": [
    {
      "department_name": "Appliances"
    },
    {
      "department_name": "Flooring"
    },
    {
      "department_name": "Hardware"
    },
    {
      "department_name": "Home Décor & Furniture"
    },
    {
      "department_name": "Lighting"
    },
    {
      "department_name": "Outdoor Living"
    },
    {
      "department_name": "Plumbing & Bath"
    },
    {
      "department_name": "Ventilation"
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `department_name` | string | ✅ | Department display name |

---

### 2. Families

```json
{
  "type": "families",
  "action": "sync_from_api",
  "total_count": 8,
  "families": [
    {
      "family_name": "Bath",
      "department_name": "Plumbing & Bath"
    },
    {
      "family_name": "Furniture",
      "department_name": "Home Décor & Furniture"
    },
    {
      "family_name": "Home Décor",
      "department_name": "Home Décor & Furniture"
    },
    {
      "family_name": "Kitchen",
      "department_name": "Plumbing & Bath"
    },
    {
      "family_name": "Laundry",
      "department_name": "Appliances"
    },
    {
      "family_name": "Lighting",
      "department_name": "Lighting"
    },
    {
      "family_name": "Outdoor",
      "department_name": "Outdoor Living"
    },
    {
      "family_name": "Ventilation",
      "department_name": "Ventilation"
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `family_name` | string | ✅ | Family display name |
| `department_name` | string | ✅ | Parent department name |

---

### 3. Categories

```json
{
  "type": "categories",
  "action": "sync_from_api",
  "total_count": 212,
  "categories": [
    {
      "category_id": "a01Hu000010Q5EcIAK",
      "category_name": "Kitchen Appliances",
      "department": "Appliances",
      "family": "Kitchen",
      "subcategory": "Kitchen",
      "styles_apply": true
    },
    {
      "category_id": "a01Hu000010Q5EdIAK",
      "category_name": "Laundry Appliances",
      "department": "Appliances",
      "family": "Laundry",
      "subcategory": "Laundry",
      "styles_apply": true
    },
    {
      "category_id": "a01Hu000010Q5EoIAK",
      "category_name": "Range Hood",
      "department": "Ventilation",
      "family": "Ventilation",
      "subcategory": "Range Hoods",
      "styles_apply": true
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category_id` | string | ✅ | Salesforce ID (18-char) |
| `category_name` | string | ✅ | Category display name |
| `department` | string | ✅ | Parent department name |
| `family` | string | ✅ | Parent family name |
| `subcategory` | string | ⚠️ Custom | Grouping for similar categories (e.g., "Kitchen Faucets") |
| `styles_apply` | boolean | ⚠️ Custom | Whether aesthetic styles apply to this category |

**⚠️ Custom Fields Note:**  
`subcategory` and `styles_apply` are custom fields used by the Verification API for proper categorization. These fields are **critical** and should be preserved during sync operations.

---

### 4. Types

```json
{
  "type": "types",
  "action": "sync_from_api",
  "total_count": 688,
  "types": [
    {
      "type_id": "a1HaZ000001cXyZUAU",
      "type_name": "Single Handle",
      "category_usage": "Faucet",
      "type_group": "Handle Type"
    },
    {
      "type_id": "a1HaZ000001cXyABC",
      "type_name": "Wall Mount",
      "category_usage": "Faucet",
      "type_group": "Mount Type"
    },
    {
      "type_id": "",
      "type_name": "1-Light",
      "category_usage": "Lighting",
      "type_group": "Light Count"
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type_id` | string | ⚠️ Optional | Salesforce ID (may be empty for new types) |
| `type_name` | string | ✅ | Type display name |
| `category_usage` | string | ✅ | Which category/categories this type applies to |
| `type_group` | string | ✅ | Grouping for related types (e.g., "Handle Type") |

**Note:** Types with empty `type_id` are new additions that need Salesforce IDs assigned.

---

### 5. Styles

```json
{
  "type": "styles",
  "action": "sync_from_api",
  "total_count": 16,
  "styles": [
    {
      "style_id": "a1IaZ000001S93RUAS",
      "style_name": "Farmhouse"
    },
    {
      "style_id": "a1IaZ000001Sjb7UAC",
      "style_name": "Industrial"
    },
    {
      "style_id": "a1IaZ000001SjbCUAS",
      "style_name": "Mid-Century Modern"
    },
    {
      "style_id": "a1IaZ000001SjbHUAS",
      "style_name": "Modern"
    },
    {
      "style_id": "a1IaZ000001SjbMUAS",
      "style_name": "Traditional"
    },
    {
      "style_id": "a1IaZ000001SjbRUAS",
      "style_name": "Transitional"
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `style_id` | string | ✅ | Salesforce ID (18-char) |
| `style_name` | string | ✅ | Style display name |

**All 16 Styles:**
- Farmhouse
- Industrial
- Mid-Century Modern
- Modern
- Traditional
- Transitional
- Contemporary
- Rustic
- Coastal
- Bohemian
- Scandinavian
- Art Deco
- Victorian
- Mediterranean
- Minimalist
- Eclectic

---

### 6. Brands

```json
{
  "type": "brands",
  "action": "sync_from_api",
  "total_count": 402,
  "brands": [
    {
      "brand_id": "a0MaZ000000EqV1UAK",
      "brand_name": "LINKASINK"
    },
    {
      "brand_id": "a0MaZ000000EqV2UAK",
      "brand_name": "SUB-ZERO"
    },
    {
      "brand_id": "a0MaZ000000EqV3UAK",
      "brand_name": "WOLF"
    },
    {
      "brand_id": "a0MaZ000000EqV4UAK",
      "brand_name": "KOHLER"
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `brand_id` | string | ✅ | Salesforce ID (18-char) |
| `brand_name` | string | ✅ | Brand display name (usually UPPERCASE) |

---

### 7. Attributes

```json
{
  "type": "attributes",
  "action": "sync_from_api",
  "total_count": 945,
  "attributes": [
    {
      "attribute_id": "a1aaZ000008lz3SQAQ",
      "attribute_name": "120 Degree F Inlet Water Capability"
    },
    {
      "attribute_id": "a1aaZ000008lz3TQAQ",
      "attribute_name": "28 Degree Latch"
    },
    {
      "attribute_id": "a1aaZ000008mBw4QAE",
      "attribute_name": "Outdoor Approved"
    },
    {
      "attribute_id": "a1aaZ000008mBw5QAE",
      "attribute_name": "Energy Star Certified"
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attribute_id` | string | ✅ | Salesforce ID (18-char) |
| `attribute_name` | string | ✅ | Attribute display name |

---

## Sending Picklists FROM Salesforce TO API

When Salesforce wants to update our picklists, send a POST to:

```
POST https://verify.cxc-ai.com/api/picklists/sync
```

### Combined Payload Format

You can send multiple picklist types in a single request:

```json
{
  "brands": [
    {"brand_id": "a0MaZ000000EqV1UAK", "brand_name": "LINKASINK"},
    {"brand_id": "a0MaZ000000EqV2UAK", "brand_name": "SUB-ZERO"}
  ],
  "categories": [
    {
      "category_id": "a01Hu000010Q5EcIAK",
      "category_name": "Kitchen Appliances",
      "department": "Appliances",
      "family": "Kitchen"
    }
  ],
  "styles": [
    {"style_id": "a1IaZ000001S93RUAS", "style_name": "Farmhouse"}
  ],
  "replace_mode": true
}
```

### Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `replace_mode` | boolean | `true` | If true, replaces entire picklist. If false, incremental add/update. |

### Response (202 Accepted)

```json
{
  "success": true,
  "message": "Picklist sync received and HELD FOR REVIEW. Changes will NOT be applied automatically.",
  "pending_id": "d7a27e7a-11c0-4345-bbd2-22799c0ddf3d",
  "status": "pending_review",
  "expires_at": "2026-03-13T13:14:41.917Z",
  "impact_assessment": {
    "severity": "high",
    "reason": "Large number of removals (402 items)",
    "total_additions": 1,
    "total_removals": 402,
    "custom_fields_at_risk": 2,
    "warnings": [
      "subcategory field would be lost for 79 categories",
      "styles_apply field would be lost for 79 categories"
    ]
  },
  "pending_changes": [
    {
      "type": "brands",
      "current_count": 402,
      "incoming_count": 2,
      "items_to_add": ["NEW BRAND"],
      "items_to_remove": ["OLD BRAND 1", "OLD BRAND 2"],
      "custom_fields_at_risk": []
    }
  ],
  "review_url": "/api/picklists/sync/pending/d7a27e7a-...",
  "approve_url": "/api/picklists/sync/pending/d7a27e7a-.../approve",
  "reject_url": "/api/picklists/sync/pending/d7a27e7a-.../reject"
}
```

### Impact Assessment Severity Levels

| Severity | Condition | Action Required |
|----------|-----------|-----------------|
| `critical` | Custom fields at risk OR >50% removals | Manual review required |
| `high` | >20 removals or >50 items changing | Manual review required |
| `medium` | 5-20 items changing | Review recommended |
| `low` | <5 additions, no removals | Safe to approve |

---

## Approving/Rejecting Pending Syncs

### Get Pending Syncs
```http
GET https://verify.cxc-ai.com/api/picklists/sync/pending
x-api-key: <api-key>
```

### Approve Pending Sync
```http
POST https://verify.cxc-ai.com/api/picklists/sync/pending/{pending_id}/approve
Content-Type: application/json
x-api-key: <api-key>

{
  "reviewed_by": "admin@company.com",
  "notes": "Approved after review - changes look correct"
}
```

### Reject Pending Sync
```http
POST https://verify.cxc-ai.com/api/picklists/sync/pending/{pending_id}/reject
Content-Type: application/json
x-api-key: <api-key>

{
  "reviewed_by": "admin@company.com",
  "notes": "Rejected to preserve custom fields"
}
```

---

## cURL Examples

### Push Departments
```bash
curl -X POST \
  'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: 873648276-550e8400' \
  -d '{
    "type": "departments",
    "action": "sync_from_api",
    "total_count": 8,
    "departments": [
      {"department_name": "Appliances"},
      {"department_name": "Lighting"},
      {"department_name": "Plumbing & Bath"}
    ]
  }'
```

### Push Categories
```bash
curl -X POST \
  'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: 873648276-550e8400' \
  -d '{
    "type": "categories",
    "action": "sync_from_api",
    "total_count": 212,
    "categories": [
      {
        "category_id": "a01Hu000010Q5EcIAK",
        "category_name": "Kitchen Appliances",
        "department": "Appliances",
        "family": "Kitchen",
        "subcategory": "Kitchen",
        "styles_apply": true
      }
    ]
  }'
```

### Sync FROM Salesforce TO API
```bash
curl -X POST \
  'https://verify.cxc-ai.com/api/picklists/sync' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: <webhook-secret>' \
  -d '{
    "brands": [
      {"brand_id": "a0MaZ000000EqV1UAK", "brand_name": "LINKASINK"}
    ]
  }'
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid conversion from List<ANY> to Map<String,ANY>` | Categories payload format mismatch | Check categories array structure matches expected format |
| `API key is required` | Missing x-api-key header | Add authentication header |
| `Invalid API key` | Wrong API key value | Use correct API key |

### Categories Error (Known Issue)

When pushing categories to Salesforce, the following error may occur:
```
"Invalid conversion from runtime type List<ANY> to Map<String,ANY>"
```

This is due to the Salesforce Apex handler expecting a different format. The categories payload includes custom fields (`subcategory`, `styles_apply`) that may need to be handled by updated Apex code.

**Workaround Options:**
1. Update Salesforce Apex to accept the new category format
2. Strip custom fields before sending (not recommended - data loss)
3. Send categories in expected Apex format

---

## Contact

For API questions or access requests, contact the Catalog Verification API team.
