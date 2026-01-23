/**
 * Test Script: Analyze Last 10 API Calls for Failed Matches
 * 
 * This script:
 * 1. Retrieves the last 10 verification API calls from the tracker
 * 2. Identifies any failed matches that occurred
 * 3. Shows what the new failed match logger would capture
 * 
 * Run: npx ts-node src/scripts/test-failed-match-logger.ts
 */

import mongoose from 'mongoose';
import config from '../config';
import { APITracker, IAPITracker } from '../models/api-tracker.model';
import { FailedMatchLog } from '../models/failed-match-log.model';
import { PicklistMismatch } from '../models/picklist-mismatch.model';

async function analyzeLastCalls() {
  console.log('='.repeat(80));
  console.log('FAILED MATCH LOGGER TEST - Analyzing Last 10 API Calls');
  console.log('='.repeat(80));
  console.log();

  // Connect to MongoDB
  const mongoUri = config.mongodb?.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
  console.log(`Connecting to MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB\n');

  try {
    // Get last 10 API calls
    const lastCalls = await APITracker.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean() as unknown as IAPITracker[];

    console.log(`Found ${lastCalls.length} recent API calls\n`);

    if (lastCalls.length === 0) {
      console.log('No API calls found in tracker. Run some verifications first.');
      return;
    }

    // Analyze each call
    let totalFailedMatches = 0;
    const failedMatchSummary: any[] = [];

    for (let i = 0; i < lastCalls.length; i++) {
      const call = lastCalls[i];
      console.log('-'.repeat(80));
      console.log(`CALL ${i + 1}: ${call.sessionId}`);
      console.log('-'.repeat(80));
      console.log(`  Product: ${call.request?.SF_Catalog_Name || 'Unknown'}`);
      console.log(`  SF Catalog ID: ${call.request?.SF_Catalog_Id || 'Unknown'}`);
      console.log(`  Timestamp: ${call.createdAt}`);
      console.log(`  Status: ${call.overallStatus || 'Unknown'}`);
      console.log();

      // Check for issues flagged
      if (call.issues && call.issues.length > 0) {
        console.log('  ISSUES FLAGGED:');
        for (const issue of call.issues) {
          console.log(`    - ${issue.type}: ${issue.description}`);
        }
        console.log();
      }

      // Check for attribute requests (these indicate failed matches)
      const response = call.response;
      if (response) {
        const attributeRequests = (response as any).Attribute_Requests || [];
        const brandRequests = (response as any).Brand_Requests || [];
        const categoryRequests = (response as any).Category_Requests || [];
        const styleRequests = (response as any).Style_Requests || [];

        const totalRequests = attributeRequests.length + brandRequests.length + 
                            categoryRequests.length + styleRequests.length;

        if (totalRequests > 0) {
          console.log('  FAILED MATCHES (Requests Generated):');
          
          if (brandRequests.length > 0) {
            console.log(`    BRAND (${brandRequests.length}):`);
            for (const br of brandRequests) {
              console.log(`      • "${br.brand_name}" - ${br.reason?.substring(0, 60)}...`);
              failedMatchSummary.push({
                type: 'brand',
                value: br.brand_name,
                session: call.sessionId,
                product: call.request?.SF_Catalog_Id,
              });
            }
          }
          
          if (categoryRequests.length > 0) {
            console.log(`    CATEGORY (${categoryRequests.length}):`);
            for (const cr of categoryRequests) {
              console.log(`      • "${cr.category_name}" - ${cr.reason?.substring(0, 60)}...`);
              failedMatchSummary.push({
                type: 'category',
                value: cr.category_name,
                session: call.sessionId,
                product: call.request?.SF_Catalog_Id,
              });
            }
          }
          
          if (styleRequests.length > 0) {
            console.log(`    STYLE (${styleRequests.length}):`);
            for (const sr of styleRequests) {
              console.log(`      • "${sr.style_name}" - ${sr.reason?.substring(0, 60)}...`);
              failedMatchSummary.push({
                type: 'style',
                value: sr.style_name,
                session: call.sessionId,
                product: call.request?.SF_Catalog_Id,
              });
            }
          }
          
          if (attributeRequests.length > 0) {
            console.log(`    ATTRIBUTES (${attributeRequests.length}):`);
            for (const ar of attributeRequests) {
              console.log(`      • "${ar.attribute_name}" [${ar.source}] - ${ar.reason?.substring(0, 50)}...`);
              failedMatchSummary.push({
                type: 'attribute',
                value: ar.attribute_name,
                source: ar.source,
                session: call.sessionId,
                product: call.request?.SF_Catalog_Id,
              });
            }
          }

          totalFailedMatches += totalRequests;
          console.log();
        } else {
          console.log('  ✓ No failed matches - all attributes matched successfully\n');
        }
      }
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total API Calls Analyzed: ${lastCalls.length}`);
    console.log(`Total Failed Matches Found: ${totalFailedMatches}`);
    console.log();

    // Group by type
    const byType = failedMatchSummary.reduce((acc: any, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {});

    console.log('Failed Matches by Type:');
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }
    console.log();

    // Show unique failed values
    const uniqueValues = new Map<string, any>();
    for (const m of failedMatchSummary) {
      const key = `${m.type}:${m.value}`;
      if (!uniqueValues.has(key)) {
        uniqueValues.set(key, { ...m, count: 1 });
      } else {
        uniqueValues.get(key).count++;
      }
    }

    if (uniqueValues.size > 0) {
      console.log('Unique Failed Values (candidates for picklist updates):');
      for (const [_, item] of uniqueValues) {
        console.log(`  [${item.type.toUpperCase()}] "${item.value}" - occurred ${item.count} time(s)`);
      }
      console.log();
    }

    // Check what's already in the failed match log
    console.log('-'.repeat(80));
    console.log('EXISTING FAILED MATCH LOG DATA');
    console.log('-'.repeat(80));
    
    const existingLogs = await FailedMatchLog.countDocuments();
    const unresolvedLogs = await FailedMatchLog.countDocuments({ resolved: false });
    
    console.log(`Total logged failed matches: ${existingLogs}`);
    console.log(`Unresolved: ${unresolvedLogs}`);
    
    if (existingLogs > 0) {
      const topUnresolved = await FailedMatchLog.find({ resolved: false })
        .sort({ occurrenceCount: -1 })
        .limit(5)
        .lean();
      
      if (topUnresolved.length > 0) {
        console.log('\nTop 5 Unresolved (by occurrence):');
        for (const log of topUnresolved) {
          console.log(`  [${log.matchType}] "${log.attemptedValue}" - ${log.occurrenceCount} occurrences, ${(log.similarity * 100).toFixed(0)}% similarity`);
          if (log.closestMatches[0]) {
            console.log(`    → Closest: "${log.closestMatches[0].value}"`);
          }
        }
      }
    }
    console.log();

    // Check picklist mismatches (old system)
    const picklistMismatches = await PicklistMismatch.countDocuments({ resolved: false });
    console.log(`Legacy Picklist Mismatches (unresolved): ${picklistMismatches}`);

  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the analysis
analyzeLastCalls().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
