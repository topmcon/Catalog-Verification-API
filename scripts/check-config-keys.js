#!/usr/bin/env node
/**
 * Check if config is loading API keys
 */

require('dotenv').config();
const config = require('../dist/config').default;

console.log('🔍 Checking Configuration...\n');
console.log('Environment variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || '(not set)'}`);
console.log(`  OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
console.log(`  XAI_API_KEY exists: ${!!process.env.XAI_API_KEY}`);
console.log(`  OPENAI_API_KEY length: ${(process.env.OPENAI_API_KEY || '').length}`);
console.log(`  XAI_API_KEY length: ${(process.env.XAI_API_KEY || '').length}`);

console.log('\nConfig object:');
console.log(`  config.openai.apiKey exists: ${!!config.openai?.apiKey}`);
console.log(`  config.xai.apiKey exists: ${!!config.xai?.apiKey}`);
console.log(`  config.openai.apiKey length: ${(config.openai?.apiKey || '').length}`);
console.log(`  config.xai.apiKey length: ${(config.xai?.apiKey || '').length}`);
console.log(`  config.openai.model: ${config.openai?.model || '(not set)'}`);
console.log(`  config.xai.model: ${config.xai?.model || '(not set)'}`);

if (!config.openai?.apiKey) {
  console.log('\n❌ ERROR: OpenAI API key not loaded in config!');
} else {
  console.log('\n✅ OpenAI API key loaded');
}

if (!config.xai?.apiKey) {
  console.log('❌ ERROR: xAI API key not loaded in config!');
} else {
  console.log('✅ xAI API key loaded');
}
