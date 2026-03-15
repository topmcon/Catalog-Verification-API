#!/usr/bin/env node
/**
 * check-pending-picklist-syncs.js
 * 
 * Script to check for pending Salesforce picklist syncs awaiting review.
 * Used during "Establish Connection" to notify about held syncs.
 * 
 * Now also shows ATTRIBUTE MATCH ANALYSIS:
 * - How many SF attributes match our NEEDS_SF_ID entries (ready for ID update)
 * - How many are completely new (require review)
 * 
 * Usage: node scripts/check-pending-picklist-syncs.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Placeholder constant
const NEEDS_SF_ID = 'NEEDS_SF_ID';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

// Pending sync schema (simplified for script)
const PendingPicklistSyncSchema = new mongoose.Schema({
  pending_id: String,
  created_at: Date,
  expires_at: Date,
  source_ip: String,
  status: String,
  incoming_data: {
    attributes: [{
      attribute_id: String,
      attribute_name: String
    }],
    categories: [{
      category_id: String,
      category_name: String
    }]
  },
  pending_changes: [{
    type: String,
    current_count: Number,
    incoming_count: Number,
    items_to_add: [String],
    items_to_remove: [String],
    custom_fields_at_risk: [String]
  }],
  impact_assessment: {
    severity: String,
    reason: String,
    total_additions: Number,
    total_removals: Number,
    custom_fields_at_risk: Number,
    warnings: [String]
  },
  reviewed_at: Date,
  reviewed_by: String
}, { collection: 'pending_picklist_syncs' });

// Pending creation request schema (for MongoDB queries)
const PendingCreationRequestSchema = new mongoose.Schema({
  request_type: String,
  requested_value: String,
  requested_value_normalized: String,
  status: String,
  sf_id_received: String
}, { collection: 'pending_creation_requests' });

/**
 * Analyze incoming SF attributes against:
 * 1. NEEDS_SF_ID entries in attributes.json
 * 2. Pending attribute requests in MongoDB
 * Returns combined match analysis
 */
async function analyzeAttributeMatches(incomingAttributes, db) {
  try {
    const attributesPath = path.join(process.cwd(), 'src/config/salesforce-picklists/attributes.json');
    const existingAttributes = JSON.parse(fs.readFileSync(attributesPath, 'utf8'));

    // Build maps from attributes.json
    const existingByName = new Map();
    const needsSfIdByName = new Map();
    
    for (const attr of existingAttributes) {
      const nameLower = attr.attribute_name.toLowerCase().trim();
      existingByName.set(nameLower, attr);
      if (attr.attribute_id === NEEDS_SF_ID) {
        needsSfIdByName.set(nameLower, attr);
      }
    }

    // Get pending attribute requests from MongoDB
    const pendingRequests = await db.collection('pending_creation_requests')
      .find({ request_type: 'attribute', status: 'pending' }).toArray();
    
    const pendingByName = new Map();
    for (const req of pendingRequests) {
      pendingByName.set(req.requested_value.toLowerCase().trim(), req);
    }

    const matchesNeedsSfId = [];      // Match NEEDS_SF_ID in JSON
    const matchesPendingRequest = []; // Match pending request in MongoDB
    const newAttributes = [];          // Completely new
    let alreadyHasId = 0;

    // Build SF lookup map
    const sfMap = new Map();
    for (const attr of incomingAttributes || []) {
      sfMap.set(attr.attribute_name.toLowerCase().trim(), attr);
    }

    // De-duplicate incoming
    const seenNames = new Set();
    for (const attr of incomingAttributes || []) {
      const nameLower = attr.attribute_name.toLowerCase().trim();
      if (seenNames.has(nameLower)) continue;
      seenNames.add(nameLower);

      const existingInJson = existingByName.get(nameLower);
      const hasPendingRequest = pendingByName.has(nameLower);
      
      if (needsSfIdByName.has(nameLower)) {
        // Matches a NEEDS_SF_ID entry in JSON
        matchesNeedsSfId.push({
          name: attr.attribute_name,
          incomingId: attr.attribute_id
        });
      } else if (hasPendingRequest && !existingInJson) {
        // Matches pending request in MongoDB (not yet in JSON)
        matchesPendingRequest.push({
          name: attr.attribute_name,
          incomingId: attr.attribute_id
        });
      } else if (existingInJson) {
        // Already exists with an ID
        alreadyHasId++;
      } else {
        // Completely new attribute
        newAttributes.push({
          name: attr.attribute_name,
          incomingId: attr.attribute_id
        });
      }
    }

    return {
      totalIncoming: seenNames.size,
      needsSfIdCount: needsSfIdByName.size,
      pendingRequestCount: pendingRequests.length,
      matchesNeedsSfId,
      matchesPendingRequest,
      newAttributes,
      alreadyHasId
    };

  } catch (error) {
    console.error('Error analyzing attributes:', error.message);
    return {
      totalIncoming: 0,
      needsSfIdCount: 0,
      pendingRequestCount: 0,
      matchesNeedsSfId: [],
      matchesPendingRequest: [],
      newAttributes: [],
      alreadyHasId: 0
    };
  }
}

async function checkPendingSyncs() {
  console.log(`\n${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}           PENDING PICKLIST SYNCS - HOLD BUCKET STATUS           ${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  try {
    await mongoose.connect(MONGODB_URI);
    
    const PendingSync = mongoose.model('PendingPicklistSync', PendingPicklistSyncSchema);
    const db = mongoose.connection.db;
    
    // Get counts
    const pendingCount = await PendingSync.countDocuments({ status: 'pending' });
    const approvedCount = await PendingSync.countDocuments({ status: 'approved' });
    const rejectedCount = await PendingSync.countDocuments({ status: 'rejected' });
    
    console.log(`${colors.cyan}Hold Bucket Status:${colors.reset}`);
    console.log(`  Pending Review:  ${pendingCount > 0 ? colors.bgYellow + colors.bold + ' ' + pendingCount + ' ' + colors.reset : colors.green + '0' + colors.reset}`);
    console.log(`  Approved:        ${colors.green}${approvedCount}${colors.reset}`);
    console.log(`  Rejected:        ${colors.yellow}${rejectedCount}${colors.reset}`);
    console.log('');
    
    if (pendingCount === 0) {
      console.log(`${colors.green}✅ No pending syncs awaiting review.${colors.reset}\n`);
      await mongoose.disconnect();
      return;
    }
    
    // Get pending syncs
    const pendingSyncs = await PendingSync.find({ status: 'pending' })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();
    
    console.log(`${colors.bgYellow}${colors.bold} ⚠️  ${pendingCount} SYNC(S) AWAITING REVIEW ${colors.reset}\n`);
    
    for (const sync of pendingSyncs) {
      const createdAt = new Date(sync.created_at);
      const expiresAt = new Date(sync.expires_at);
      const now = new Date();
      const ageHours = Math.round((now - createdAt) / (1000 * 60 * 60));
      const ageStr = ageHours < 24 ? `${ageHours} hours ago` : `${Math.round(ageHours / 24)} days ago`;
      
      // Severity color
      let severityColor = colors.green;
      let severityIcon = '🟢';
      if (sync.impact_assessment.severity === 'critical') {
        severityColor = colors.red;
        severityIcon = '🔴';
      } else if (sync.impact_assessment.severity === 'high') {
        severityColor = colors.yellow;
        severityIcon = '🟡';
      } else if (sync.impact_assessment.severity === 'medium') {
        severityColor = colors.yellow;
        severityIcon = '🟠';
      }
      
      console.log(`${colors.bold}───────────────────────────────────────────────────────────────${colors.reset}`);
      console.log(`${colors.bold}Pending ID:${colors.reset} ${sync.pending_id}`);
      console.log(`${colors.bold}Received:${colors.reset}   ${createdAt.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST (${ageStr})`);
      console.log(`${colors.bold}Expires:${colors.reset}    ${expiresAt.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`);
      console.log(`${colors.bold}Source IP:${colors.reset}  ${sync.source_ip || 'unknown'}`);
      console.log('');
      
      // Impact Assessment
      console.log(`${colors.bold}Impact Assessment:${colors.reset}`);
      console.log(`  ${severityIcon} Severity: ${severityColor}${sync.impact_assessment.severity.toUpperCase()}${colors.reset}`);
      console.log(`  Reason: ${sync.impact_assessment.reason}`);
      console.log(`  Additions: ${colors.green}+${sync.impact_assessment.total_additions}${colors.reset}`);
      console.log(`  Removals: ${colors.red}-${sync.impact_assessment.total_removals}${colors.reset}`);
      
      if (sync.impact_assessment.custom_fields_at_risk > 0) {
        console.log(`  ${colors.bgRed}${colors.white} CUSTOM FIELDS AT RISK: ${sync.impact_assessment.custom_fields_at_risk} ${colors.reset}`);
      }
      
      // Warnings
      if (sync.impact_assessment.warnings && sync.impact_assessment.warnings.length > 0) {
        console.log('');
        console.log(`  ${colors.yellow}Warnings:${colors.reset}`);
        for (const warning of sync.impact_assessment.warnings) {
          console.log(`    ${warning}`);
        }
      }
      console.log('');
      
      // Changes by type
      console.log(`${colors.bold}Changes by Picklist Type:${colors.reset}`);
      for (const change of sync.pending_changes) {
        const countChange = change.incoming_count - change.current_count;
        const countChangeStr = countChange >= 0 ? `+${countChange}` : `${countChange}`;
        console.log(`  ${colors.cyan}${change.type}:${colors.reset} ${change.current_count} → ${change.incoming_count} (${countChangeStr})`);
        
        if (change.items_to_add.length > 0) {
          const addPreview = change.items_to_add.slice(0, 5).join(', ');
          const moreAdd = change.items_to_add.length > 5 ? ` +${change.items_to_add.length - 5} more` : '';
          console.log(`    ${colors.green}+ Add:${colors.reset} ${addPreview}${moreAdd}`);
        }
        
        if (change.items_to_remove.length > 0) {
          const removePreview = change.items_to_remove.slice(0, 5).join(', ');
          const moreRemove = change.items_to_remove.length > 5 ? ` +${change.items_to_remove.length - 5} more` : '';
          console.log(`    ${colors.red}- Remove:${colors.reset} ${removePreview}${moreRemove}`);
        }
        
        if (change.custom_fields_at_risk && change.custom_fields_at_risk.length > 0) {
          console.log(`    ${colors.bgRed}${colors.white} ⚠️ CUSTOM FIELDS LOST: ${change.custom_fields_at_risk.join(', ')} ${colors.reset}`);
        }
      }
      console.log('');
      
      // ATTRIBUTE MATCH ANALYSIS - Simplified view
      if (sync.incoming_data && sync.incoming_data.attributes) {
        const analysis = await analyzeAttributeMatches(sync.incoming_data.attributes, db);
        const totalMatches = analysis.matchesNeedsSfId.length + analysis.matchesPendingRequest.length;
        
        console.log(`${colors.bold}📊 ATTRIBUTE SUMMARY:${colors.reset}`);
        console.log(`  Total SF Attributes Received:    ${colors.cyan}${analysis.totalIncoming}${colors.reset}`);
        console.log(`  Our Pending Requests:            ${colors.yellow}${analysis.pendingRequestCount}${colors.reset}`);
        console.log(`  ${colors.green}✅ Match Our Requests:           ${colors.bold}${totalMatches}${colors.reset}`);
        console.log(`  ${colors.yellow}🆕 Do Not Match (new):           ${analysis.newAttributes.length}${colors.reset}`);
        console.log(`  Already Have ID:                 ${analysis.alreadyHasId}`);
        console.log('');
      }
    }
    
    console.log(`${colors.bold}───────────────────────────────────────────────────────────────${colors.reset}`);
    console.log('');
    console.log(`${colors.bold}Actions Available:${colors.reset}`);
    console.log('');
    console.log(`  ${colors.cyan}1. Update Attribute IDs Only (RECOMMENDED):${colors.reset}`);
    console.log(`     Updates NEEDS_SF_ID entries with real SF IDs. Nothing else changes.`);
    console.log(`     POST /api/picklists/sync/pending/{pending_id}/update-attribute-ids`);
    console.log('');
    console.log(`  ${colors.cyan}2. Approve Full Sync:${colors.reset}`);
    console.log(`     Applies ALL changes including categories. ⚠️ May overwrite custom fields.`);
    console.log(`     POST /api/picklists/sync/pending/{pending_id}/approve`);
    console.log('');
    console.log(`  ${colors.cyan}3. Reject Sync:${colors.reset}`);
    console.log(`     Discards sync completely. No changes made.`);
    console.log(`     POST /api/picklists/sync/pending/{pending_id}/reject`);
    console.log('');
    console.log(`  ${colors.green}Curl examples:${colors.reset}`);
    console.log(`  curl -X POST https://verify.cxc-ai.com/api/picklists/sync/pending/{pending_id}/update-attribute-ids`);
    console.log(`  curl -X POST https://verify.cxc-ai.com/api/picklists/sync/pending/{pending_id}/reject`);
    console.log('');
    
    if (pendingSyncs.some(s => s.impact_assessment.severity === 'critical')) {
      console.log(`${colors.bgRed}${colors.white}${colors.bold}`);
      console.log(` ⚠️  CRITICAL: Some pending syncs would OVERWRITE custom fields!          `);
      console.log(` Use "update-attribute-ids" to only update NEEDS_SF_ID entries.           `);
      console.log(` Do NOT use "approve" unless you want category changes too.               `);
      console.log(`${colors.reset}`);
      console.log('');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error(`${colors.red}Error checking pending syncs:${colors.reset}`, error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkPendingSyncs();
