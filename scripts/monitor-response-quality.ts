#!/usr/bin/env node

/**
 * Real-Time Response Quality Monitor
 * Watch inconclusive responses as they're tracked in real-time
 */

import mongoose from 'mongoose';
import '../src/models/inconclusive-response-log.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
const InconclusiveResponseLog = mongoose.model('InconclusiveResponseLog');

let lastCount = 0;
let sessionStart = new Date();
let recentLogs: any[] = [];

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('🔗 Connected to MongoDB');
  console.log('📊 Monitoring inconclusive responses in real-time...\n');
}

async function getStats() {
  const now = new Date();
  
  // Total inconclusive responses
  const total = await InconclusiveResponseLog.countDocuments();
  
  // This session (since script started)
  const thisSession = await InconclusiveResponseLog.countDocuments({
    timestamp: { $gte: sessionStart }
  });
  
  // Last minute
  const lastMinute = await InconclusiveResponseLog.countDocuments({
    timestamp: { $gte: new Date(now.getTime() - 60000) }
  });
  
  // Breakdown by type (this session)
  const typeBreakdown = await InconclusiveResponseLog.aggregate([
    { $match: { timestamp: { $gte: sessionStart } } },
    { $group: { _id: '$inconclusive_type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Breakdown by AI provider (this session)
  const aiBreakdown = await InconclusiveResponseLog.aggregate([
    { $match: { timestamp: { $gte: sessionStart } } },
    { $group: { _id: '$ai_provider', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Top problematic fields (this session)
  const topFields = await InconclusiveResponseLog.aggregate([
    { $match: { timestamp: { $gte: sessionStart } } },
    { $group: { 
        _id: { field: '$field_name', type: '$inconclusive_type' },
        count: { $sum: 1 },
        categories: { $addToSet: '$category' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Get most recent 5 logs
  const recent = await InconclusiveResponseLog.find()
    .sort({ timestamp: -1 })
    .limit(5)
    .lean();
  
  return {
    total,
    thisSession,
    lastMinute,
    typeBreakdown,
    aiBreakdown,
    topFields,
    recent,
    newSinceLastCheck: total - lastCount
  };
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleTimeString();
}

function clearScreen() {
  console.clear();
  console.log('\x1b[H\x1b[2J'); // Alternative clear
}

function displayDashboard(stats: any) {
  clearScreen();
  
  const uptime = Math.floor((Date.now() - sessionStart.getTime()) / 1000);
  const uptimeStr = uptime < 60 ? `${uptime}s` : `${Math.floor(uptime / 60)}m ${uptime % 60}s`;
  
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📊 RESPONSE QUALITY ANALYTICS - REAL-TIME MONITOR');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`⏱️  Monitoring for: ${uptimeStr} | 🔄 Refresh: 2s | ⌨️  Ctrl+C to exit\n`);
  
  // Summary Stats
  console.log('📈 SUMMARY STATISTICS');
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log(`Total Inconclusive Responses:     ${stats.total.toString().padStart(6)}`);
  console.log(`This Session:                     ${stats.thisSession.toString().padStart(6)} ${stats.newSinceLastCheck > 0 ? `(+${stats.newSinceLastCheck} new)` : ''}`);
  console.log(`Last Minute:                      ${stats.lastMinute.toString().padStart(6)}`);
  console.log();
  
  // Type Breakdown
  if (stats.typeBreakdown.length > 0) {
    console.log('🏷️  BY INCONCLUSIVE TYPE (This Session)');
    console.log('───────────────────────────────────────────────────────────────────────');
    for (const item of stats.typeBreakdown) {
      const type = item._id || 'unknown';
      const bar = '█'.repeat(Math.min(30, item.count));
      console.log(`${type.padEnd(20)} ${item.count.toString().padStart(4)} ${bar}`);
    }
    console.log();
  }
  
  // AI Provider Breakdown
  if (stats.aiBreakdown.length > 0) {
    console.log('🤖 BY AI PROVIDER (This Session)');
    console.log('───────────────────────────────────────────────────────────────────────');
    for (const item of stats.aiBreakdown) {
      const provider = item._id || 'unknown';
      const emoji = provider === 'both' ? '⚠️' : provider === 'openai' ? '🟢' : '🔵';
      console.log(`${emoji} ${provider.padEnd(10)} ${item.count.toString().padStart(4)}`);
    }
    console.log();
  }
  
  // Top Problematic Fields
  if (stats.topFields.length > 0) {
    console.log('🔴 TOP PROBLEMATIC FIELDS (This Session)');
    console.log('───────────────────────────────────────────────────────────────────────');
    for (const item of stats.topFields.slice(0, 5)) {
      const field = item._id.field.substring(0, 35).padEnd(35);
      const type = item._id.type.substring(0, 15).padEnd(15);
      const categories = item.categories.join(', ').substring(0, 20);
      console.log(`${field} | ${type} | x${item.count.toString().padStart(2)} | ${categories}`);
    }
    console.log();
  }
  
  // Recent Activity
  if (stats.recent.length > 0) {
    console.log('🔔 RECENT ACTIVITY (Last 5)');
    console.log('───────────────────────────────────────────────────────────────────────');
    for (const log of stats.recent) {
      const time = formatTimestamp(log.timestamp);
      const field = log.field_name.substring(0, 25).padEnd(25);
      const value = (log.inconclusive_value || '').substring(0, 15).padEnd(15);
      const type = log.inconclusive_type.substring(0, 12);
      const ai = log.ai_provider === 'both' ? '⚠️' : log.ai_provider === 'openai' ? '🟢' : '🔵';
      const category = log.category.substring(0, 12);
      
      console.log(`${time.padEnd(10)} ${ai} ${field} | "${value}" | ${type} | ${category}`);
    }
  } else if (stats.total === 0) {
    console.log('🔔 RECENT ACTIVITY');
    console.log('───────────────────────────────────────────────────────────────────────');
    console.log('⏳ Waiting for first Salesforce verification...');
    console.log('   No inconclusive responses tracked yet.');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════════');
}

async function monitor() {
  try {
    const stats = await getStats();
    lastCount = stats.total;
    displayDashboard(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

async function main() {
  try {
    await connectDB();
    
    // Initial display
    await monitor();
    
    // Refresh every 2 seconds
    const interval = setInterval(monitor, 2000);
    
    // Cleanup on exit
    process.on('SIGINT', async () => {
      clearInterval(interval);
      console.log('\n\n👋 Monitoring stopped. Final stats saved above.');
      await mongoose.disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start monitor:', error);
    process.exit(1);
  }
}

main();
