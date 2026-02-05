# Real-Time Response Quality Monitor

Monitor inconclusive AI responses as they happen during Salesforce verifications.

## Quick Start

### On Production Server:
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com
cd /opt/catalog-verification-api
npm run monitor-response-quality
```

### Local Development:
```bash
npm run monitor-response-quality
```

## What You'll See

The monitor refreshes every 2 seconds and shows:

### 📈 Summary Statistics
- Total inconclusive responses (all time)
- This session (since monitor started)
- Last minute activity
- New responses since last refresh

### 🏷️ Breakdown by Type
Live bar charts showing:
- `not_applicable` - "N/A", "Not Applicable"
- `unknown` - "Unknown", "Not Specified"
- `not_found` - "Product not found"
- `empty` - Empty values
- `vague` - "See Description", "Varies"
- `error` - Error responses

### 🤖 Breakdown by AI Provider
- 🟢 `openai` - Only OpenAI returned inconclusive
- 🔵 `xai` - Only xAI returned inconclusive
- ⚠️ `both` - **Both AIs failed** (most concerning)

### 🔴 Top Problematic Fields
Shows which fields are failing most often this session

### 🔔 Recent Activity (Last 5)
Live stream of the most recent inconclusive responses with:
- Timestamp
- Field name
- Actual value returned ("N/A", "Unknown", etc.)
- Inconclusive type
- Product category

## Example Output

```
═══════════════════════════════════════════════════════════════════════
📊 RESPONSE QUALITY ANALYTICS - REAL-TIME MONITOR
═══════════════════════════════════════════════════════════════════════
⏱️  Monitoring for: 2m 34s | 🔄 Refresh: 2s | ⌨️  Ctrl+C to exit

📈 SUMMARY STATISTICS
───────────────────────────────────────────────────────────────────────
Total Inconclusive Responses:         47
This Session:                         12 (+3 new)
Last Minute:                           5

🏷️  BY INCONCLUSIVE TYPE (This Session)
───────────────────────────────────────────────────────────────────────
not_applicable            7 ███████
unknown                   3 ███
vague                     2 ██

🤖 BY AI PROVIDER (This Session)
───────────────────────────────────────────────────────────────────────
⚠️ both                    5
🟢 openai                  4
🔵 xai                     3

🔴 TOP PROBLEMATIC FIELDS (This Session)
───────────────────────────────────────────────────────────────────────
dryer_steam_option          | not_applicable  | x3 | Dryer
refrigerator_ice_type       | unknown         | x2 | Refrigerator
dishwasher_third_rack       | not_applicable  | x2 | Dishwasher

🔔 RECENT ACTIVITY (Last 5)
───────────────────────────────────────────────────────────────────────
3s ago     ⚠️ dryer_steam_option        | "Not Applicable" | not_applicable | Dryer
15s ago    🟢 refrigerator_ice_type     | "Unknown"        | unknown        | Refrigerator
28s ago    🔵 dishwasher_rinse_aid      | "N/A"            | not_applicable | Dishwasher
41s ago    ⚠️ oven_self_clean_type      | "See Descripti"  | vague          | Oven
54s ago    🟢 washer_load_type          | "Not Found"      | not_found      | Washer

═══════════════════════════════════════════════════════════════════════
```

## Interpreting Results

### 🟢 Good Signs
- Low "both" provider failures (AIs usually agree)
- Vague responses are rare
- Most failures are "not_applicable" (field genuinely doesn't apply)

### 🟡 Warning Signs
- High "unknown" rate (>30%) - AI can't determine value
- Many "vague" responses - Prompts need refinement
- Same fields appearing repeatedly

### 🔴 Action Required
- **High "both" failures** - Both AIs consistently fail on certain fields
  - **Action:** Remove field or add better data sources
- **Same field >70% inconclusive** - Field is too broad for category
  - **Action:** Remove from top-15 filters
- **Many "not_found" responses** - Missing data in sources
  - **Action:** Add more data sources or improve web scraping

## Tips

### Watch During Peak Testing
Run this monitor while making 10-20 Salesforce verification calls to see real-time patterns.

### Multi-Category Testing
Test different categories (Dryers, Refrigerators, Ovens) and watch which fields fail per category.

### Identify Patterns Quickly
Within 5 minutes of testing, you'll know:
- Which fields to remove
- Which categories have quality issues
- Whether both AIs are struggling with the same data

## Stopping the Monitor

Press `Ctrl+C` to stop. Final stats will be displayed.

## Production Monitoring

### Run in Background (tmux)
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com
tmux new -s monitor
cd /opt/catalog-verification-api
npm run monitor-response-quality
# Press Ctrl+B then D to detach
```

### Reconnect Later
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com
tmux attach -t monitor
```

## After Monitoring

Use the static analysis tool to get detailed recommendations:
```bash
npm run view-response-quality recommendations Dryer
```

This gives actionable insights:
- 🔴 Fields to remove (>70% N/A)
- 🟡 Fields needing better data (>50% unknown)
- 🟠 Fields needing prompt refinement (>30% vague)
