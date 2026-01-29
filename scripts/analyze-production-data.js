const mongoose = require('mongoose');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

async function analyzeProduction() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   PRODUCTION DATABASE ANALYSIS${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   Analyzing: verify.cxc-ai.com MongoDB${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  // Connect via SSH tunnel or directly (if we have access)
  const uri = process.env.PROD_MONGO_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
  
  console.log(`${colors.blue}[INFO]${colors.reset} Connecting to: ${uri}\n`);
  
  try {
    await mongoose.connect(uri);
    console.log(`${colors.green}✓${colors.reset} Connected to MongoDB\n`);
  } catch (err) {
    console.log(`${colors.red}✗ Connection failed: ${err.message}${colors.reset}\n`);
    console.log(`${colors.yellow}💡 To analyze production data, run:${colors.reset}`);
    console.log(`   ssh -i ~/.ssh/cxc_ai_deploy -L 27018:127.0.0.1:27017 root@verify.cxc-ai.com -N &`);
    console.log(`   PROD_MONGO_URI="mongodb://127.0.0.1:27018/catalog-verification" node scripts/analyze-production-data.js\n`);
    process.exit(1);
  }
  
  const VerificationJob = mongoose.model('VerificationJob', new mongoose.Schema({}, { strict: false, collection: 'verificationjobs' }));
  const APITracker = mongoose.model('APITracker', new mongoose.Schema({}, { strict: false, collection: 'apitrackers' }));

  // Get database statistics
  console.log(`${colors.bright}DATABASE STATISTICS${colors.reset}\n`);
  
  const totalJobs = await VerificationJob.countDocuments();
  const completedJobs = await VerificationJob.countDocuments({ status: 'completed' });
  const failedJobs = await VerificationJob.countDocuments({ status: 'failed' });
  const processingJobs = await VerificationJob.countDocuments({ status: 'processing' });
  
  console.log(`  Total Verification Jobs: ${totalJobs}`);
  console.log(`  ${colors.green}Completed: ${completedJobs}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failedJobs}${colors.reset}`);
  console.log(`  ${colors.yellow}Processing: ${processingJobs}${colors.reset}\n`);
  
  const totalTrackers = await APITracker.countDocuments();
  const trackersWithIssues = await APITracker.countDocuments({ 'issues.0': { $exists: true } });
  const trackersWithHealing = await APITracker.countDocuments({ 'selfHealingAttempts.0': { $exists: true } });
  
  console.log(`  Total API Trackers: ${totalTrackers}`);
  console.log(`  ${colors.red}With Issues: ${trackersWithIssues}${colors.reset}`);
  console.log(`  ${colors.cyan}With Self-Healing: ${trackersWithHealing}${colors.reset}\n`);

  // Find recent jobs
  console.log(`${colors.bright}RECENT VERIFICATION JOBS (Last 10)${colors.reset}\n`);
  
  const recentJobs = await VerificationJob.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  
  for (let i = 0; i < recentJobs.length; i++) {
    const job = recentJobs[i];
    const statusColor = job.status === 'completed' ? colors.green : job.status === 'failed' ? colors.red : colors.yellow;
    
    console.log(`${i + 1}. ${statusColor}[${job.status.toUpperCase()}]${colors.reset} ${job._id}`);
    console.log(`   Session: ${job.sessionId || 'N/A'}`);
    console.log(`   Created: ${job.createdAt || 'N/A'}`);
    
    if (job.payload) {
      const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
      console.log(`   Product: ${payload.Product_Name__c?.substring(0, 50) || 'N/A'}`);
    }
    
    if (job.result?.categorizedData) {
      console.log(`   ${colors.green}✓ Data returned${colors.reset}`);
    } else {
      console.log(`   ${colors.red}✗ No data${colors.reset}`);
    }
    console.log('');
  }

  // Analyze self-healing data
  if (trackersWithHealing > 0) {
    console.log(`\n${colors.bright}${colors.cyan}SELF-HEALING ACTIVITY ANALYSIS${colors.reset}\n`);
    
    const healingTrackers = await APITracker.find({ 
      'selfHealingAttempts.0': { $exists: true } 
    }).lean();
    
    console.log(`Found ${healingTrackers.length} trackers with self-healing attempts\n`);
    
    let openaiCount = 0, xaiCount = 0, claudeCount = 0;
    let consensusCount = 0, researchCount = 0;
    
    healingTrackers.forEach(tracker => {
      tracker.selfHealingAttempts?.forEach(attempt => {
        if (attempt.aiDiagnosis?.openai) openaiCount++;
        if (attempt.aiDiagnosis?.xai) xaiCount++;
        if (attempt.aiDiagnosis?.claudeFinalReview) claudeCount++;
        if (attempt.aiDiagnosis?.consensusAchieved) consensusCount++;
        if (attempt.aiDiagnosis?.claudeFinalReview?.independentResearch?.conducted) researchCount++;
      });
    });
    
    console.log(`${colors.bright}AI ENGAGEMENT:${colors.reset}`);
    console.log(`  ${colors.blue}OpenAI analyses: ${openaiCount}${colors.reset}`);
    console.log(`  ${colors.magenta}xAI analyses: ${xaiCount}${colors.reset}`);
    console.log(`  ${colors.cyan}Claude reviews: ${claudeCount}${colors.reset}\n`);
    
    console.log(`${colors.bright}OUTCOMES:${colors.reset}`);
    console.log(`  ${colors.green}Consensus achieved: ${consensusCount}${colors.reset}`);
    console.log(`  ${colors.cyan}Claude independent research: ${researchCount}${colors.reset}\n`);
    
    // Show detailed example if exists
    const exampleWithClaude = healingTrackers.find(t => 
      t.selfHealingAttempts?.some(a => a.aiDiagnosis?.claudeFinalReview)
    );
    
    if (exampleWithClaude) {
      console.log(`${colors.bright}${colors.yellow}EXAMPLE TRI-AI INTERACTION:${colors.reset}\n`);
      const attempt = exampleWithClaude.selfHealingAttempts.find(a => a.aiDiagnosis?.claudeFinalReview);
      
      if (attempt.aiDiagnosis.openai) {
        console.log(`${colors.blue}OpenAI:${colors.reset}`);
        console.log(`  Confidence: ${attempt.aiDiagnosis.openai.confidence}%`);
        console.log(`  Root Cause: ${attempt.aiDiagnosis.openai.rootCause?.substring(0, 80)}...`);
        console.log(` Fix: ${attempt.aiDiagnosis.openai.proposedFix?.fixType}\n`);
      }
      
      if (attempt.aiDiagnosis.xai) {
        console.log(`${colors.magenta}xAI:${colors.reset}`);
        console.log(`  Confidence: ${attempt.aiDiagnosis.xai.confidence}%`);
        console.log(`  Root Cause: ${attempt.aiDiagnosis.xai.rootCause?.substring(0, 80)}...`);
        console.log(`  Fix: ${attempt.aiDiagnosis.xai.proposedFix?.fixType}\n`);
      }
      
      if (attempt.aiDiagnosis.claudeFinalReview) {
        console.log(`${colors.cyan}Claude Final Review:${colors.reset}`);
        console.log(`  Decision: ${attempt.aiDiagnosis.claudeFinalReview.decision}`);
        console.log(`  Approved: ${attempt.aiDiagnosis.claudeFinalReview.finalDeploymentPlan?.approved ? '✅' : '❌'}`);
        
        if (attempt.aiDiagnosis.claudeFinalReview.independentResearch?.conducted) {
          console.log(`  ${colors.bright}🔬 Conducted Independent Research${colors.reset}`);
          console.log(`  Findings: ${attempt.aiDiagnosis.claudeFinalReview.independentResearch.findings?.length || 0}`);
        }
        
        console.log(`  Reasoning:`);
        attempt.aiDiagnosis.claudeFinalReview.reasoning?.forEach((r, i) => {
          console.log(`    ${i + 1}. ${r.substring(0, 100)}...`);
        });
      }
    }
  }

  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  await mongoose.disconnect();
}

analyzeProduction().catch(console.error);
