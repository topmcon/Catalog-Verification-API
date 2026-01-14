# Catalog Verification API

A sophisticated catalog verification tool that automates the validation, cleaning, and verification of product catalog data using dual AI validation (OpenAI + xAI) with consensus building.

## 🎯 Overview

This tool addresses key challenges in catalog management:
- **Data Ingestion**: Receive raw catalog data from Salesforce via API
- **Independent AI Validation**: Use OpenAI and xAI to analyze data separately
- **Consensus Building**: Share results post-analysis for agreement; retry if discrepancies arise
- **Data Cleaning**: Standardize data to match predefined "Verified" fields
- **HTML Generation**: Generate HTML tables for non-primary attributes
- **Data Export**: Push cleaned, verified data back to Salesforce

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Salesforce    │────▶│   API Server    │────▶│    MongoDB      │
│    Webhook      │     │   (Express)     │     │    (Atlas)      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌───────▼────┐
              │  OpenAI   │           │    xAI     │
              │   (GPT)   │           │   (Grok)   │
              └─────┬─────┘           └──────┬─────┘
                    │                        │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Consensus Engine   │
                    │  (Similarity Check) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Verified Products  │
                    │  + HTML Tables      │
                    └─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API Key
- xAI API Key (optional)
- Salesforce Connected App (for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/topmcon/Catalog-Verification-API.git
cd Catalog-Verification-API

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Edit .env with your API keys and configuration
nano .env
```

### Configuration

The `.env` file contains all configuration. Update it with your actual API keys:

```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/catalog-verification

# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4-turbo-preview

# xAI (Grok)
XAI_API_KEY=your-xai-key
XAI_API_URL=https://api.x.ai/v1

# Salesforce
SALESFORCE_CLIENT_ID=your-client-id
SALESFORCE_CLIENT_SECRET=your-client-secret
SALESFORCE_USERNAME=your-username
SALESFORCE_PASSWORD=your-password
SALESFORCE_SECURITY_TOKEN=your-token

# Consensus Settings
AI_CONSENSUS_THRESHOLD=0.9
AI_MAX_RETRIES=3

# Debugging & Tracking
TRACK_RAW_PAYLOADS=true  # Store full request/response payloads in MongoDB
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run frontend (in separate terminal)
cd frontend && npm run dev
```

## 📚 API Documentation

### Endpoints

#### Health Check
```
GET /health
GET /health/detailed
GET /health/ready
GET /health/live
```

#### Verification
```
POST /api/verify
GET /api/verify/session/:sessionId
GET /api/verify/session/:sessionId/products
GET /api/verify/session/:sessionId/logs
POST /api/verify/export
```

#### Webhook
```
POST /api/webhook/salesforce
GET /api/webhook/status/:sessionId
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "products": [
      {
        "id": "prod123",
        "name": "Widget X",
        "description": "A high-quality widget.",
        "attributes": {"color": "red", "size": "medium"},
        "category": "Electronics",
        "price": 99.99
      }
    ]
  }'
```

### Response

```json
{
  "success": true,
  "sessionId": "sess-abc123",
  "totalProducts": 1,
  "verifiedCount": 1,
  "failedCount": 0,
  "flaggedForReviewCount": 0,
  "results": [
    {
      "productId": "prod123",
      "status": "verified",
      "verifiedProduct": {
        "ProductName": "Widget X",
        "SKU": "ELE-PROD123-ABC",
        "Price": 99.99,
        "Description": "A high-quality widget.",
        "PrimaryCategory": "Electronics",
        "Status": "active",
        "verificationScore": 95.5,
        "additionalAttributesHtml": "<table>...</table>"
      }
    }
  ],
  "processingTimeMs": 5234
}
```

## 🔧 Verified Fields Schema

The following fields are validated and standardized:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ProductName | string | ✓ | Official product name |
| SKU | string | ✓ | Stock Keeping Unit |
| Price | number | ✓ | Retail price |
| Description | string | ✓ | Product description |
| PrimaryCategory | string | ✓ | Main category |
| Brand | string | | Brand name |
| Quantity | number | | Stock quantity |
| Status | string | ✓ | active/inactive/discontinued/out_of_stock |
| ImageURL | string | | Product image URL |
| Weight | number | | Weight in kg |

## 🤖 AI Consensus Process

1. **Independent Validation**: Both OpenAI and xAI validate the product data independently
2. **Comparison**: Results are compared using similarity metrics (Jaccard, Levenshtein)
3. **Agreement Check**: If agreement > 90% threshold, consensus is reached
4. **Retry on Discrepancy**: If disagreement, both AIs are re-prompted with differences
5. **Max Retries**: After 3 retries, product is flagged for manual review
6. **Merge Results**: Agreed results are merged with higher confidence values preferred

## 📁 Project Structure

```
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── __tests__/        # Test files
│   ├── app.ts            # Express app setup
│   └── index.ts          # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities
│   └── ...
├── .github/
│   └── workflows/        # CI/CD workflows
└── ...
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚢 Deployment

### Vercel

The project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production

Set these in your deployment platform:

- `MONGODB_URI` - MongoDB Atlas connection string
- `OPENAI_API_KEY` - OpenAI API key
- `XAI_API_KEY` - xAI API key
- `SALESFORCE_*` - Salesforce credentials
- `WEBHOOK_SECRET` - Secret for webhook verification

## 📊 Monitoring

- **Logs**: Winston logger with file and console transports
- **Health Checks**: `/health/detailed` for service status
- **Audit Logs**: All operations logged to MongoDB

## 🔒 Security

- API key authentication
- Salesforce webhook signature verification
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and feature requests, please use the GitHub Issues page

# CI/CD test
