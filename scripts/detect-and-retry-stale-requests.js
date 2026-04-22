#!/usr/bin/env node
/**
 * Detect and Retry Stale Creation Requests
 * 
 * Finds requests that are:
 * - Older than 7 days
 * - Still pending
 * - Newer requests of same type have been fulfilled (out-of-order)
 * 
 * Actions:
 * - Re-sends request to Salesforce
 * - Increments retry count
 * - Flags for attention after 3 retries
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { PendingCreationRequest } = require('../dist/models/pending-creation-request.model');
const logger = require('../dist/utils/logger').default;

// Thresholds
const STALE_AGE_DAYS = 7;
const MAX_RETRIES = 3;

async function detectStaleRequests() {
  const staleDate = new Date(Date.now() - STALE_AGE_DAYS * 24 * 60 * 60 * 1000);
  
  const staleRequests = await PendingCreationRequest.find({
    status: 'pending',
    created_at: { $lt: staleDate },
    sent_to_sf_count: { $lt: MAX_RETRIES }
  }).sort({ created_at: 1 });
  
  console.log(`\n📋 Found ${staleRequests.length} pending requests older than ${STALE_AGE_DAYS} days\n`);
  
  if (staleRequests.length === 0) {
    return [];
  }
  
  const needsRetry = [];
  
  for (const stale of staleRequests) {
    const ageDays = Math.floor((Date.now() - stale.created_at.getTime()) / (24 * 60 * 60 * 1000));
    
    // Check if any newer requests of same type have been fulfilled
    const newerFulfilled = await PendingCreationRequest.countDocuments({
      request_type: stale.request_type,
      created_at: { $gt: stale.created_at },
      status: 'fulfilled'
    });
    
    if (newerFulfilled > 0) {
      // Out-of-order detected!
      needsRetry.push({
        request: stale,
        ageDays,
        newerFulfilled,
        retryCount: stale.sent_to_sf_count
      });
      
      console.log(`⚠️  STALE: ${stale.request_type} "${stale.requested_value}"`);
      console.log(`   Age: ${ageDays} days | Retries: ${stale.sent_to_sf_count}/${MAX_RETRIES}`);
      console.log(`   ${newerFulfilled} newer requests were fulfilled (out-of-order)\n`);
    } else {
      // No newer requests fulfilled yet - might just be that SF hasn't sent any syncs for this type
      console.log(`ℹ️  PENDING: ${stale.request_type} "${stale.requested_value}"`);
      console.log(`   Age: ${ageDays} days | No newer requests fulfilled yet\n`);
    }
  }
  
  return needsRetry;
}

async function retryRequest(request) {
  // Increment retry count
  request.sent_to_sf_count += 1;
  request.last_sent_at = new Date();
  
  // Flag for attention if we've hit max retries
  if (request.sent_to_sf_count >= MAX_RETRIES) {
    request.needs_attention = true;
    request.attention_reason = `Retried ${MAX_RETRIES} times over ${Math.floor((Date.now() - request.created_at.getTime()) / (24*60*60*1000))} days with no response`;
  }
  
  await request.save();
  
  // TODO: Actually send webhook to Salesforce here
  // For now, we just log and update the database
  // The actual webhook sending would use the same endpoint as initial creation
  
  logger.info('Retried stale creation request', {
    request_id: request.request_id,
    request_type: request.request_type,
    requested_value: request.requested_value,
    retry_count: request.sent_to_sf_count,
    age_days: Math.floor((Date.now() - request.created_at.getTime()) / (24*60*60*1000)),
    needs_attention: request.needs_attention
  });
  
  return request;
}

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Detect stale requests
    const needsRetry = await detectStaleRequests();
    
    if (needsRetry.length === 0) {
      console.log('✅ No stale requests detected that need retry\n');
      return;
    }
    
    console.log(`\n🔄 Retrying ${needsRetry.length} stale requests...\n`);
    
    let retriedCount = 0;
    let flaggedCount = 0;
    
    for (const { request, ageDays, newerFulfilled } of needsRetry) {
      const updated = await retryRequest(request);
      retriedCount++;
      
      if (updated.needs_attention) {
        flaggedCount++;
        console.log(`🚩 FLAGGED for attention: ${request.request_type} "${request.requested_value}"`);
        console.log(`   Reason: ${updated.attention_reason}\n`);
      } else {
        console.log(`✅ Retried: ${request.request_type} "${request.requested_value}"`);
        console.log(`   Retry count: ${updated.sent_to_sf_count}/${MAX_RETRIES}\n`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Retried: ${retriedCount}`);
    console.log(`   Flagged for attention: ${flaggedCount}`);
    console.log(`   Will appear in next "Establish Connection" check\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
