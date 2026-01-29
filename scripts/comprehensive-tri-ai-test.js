const mongoose = require('mongoose');
require('dotenv').config();

// ANSI colors for terminal
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

async function comprehensiveTriAITest() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   TRI-AI SELF-HEALING COMPREHENSIVE TEST${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   Testing: OpenAI + xAI → Claude Final Review${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification');
  
  const APITracker = mongoose.model('APITracker', new mongoose.Schema({}, { strict: false, collection: 'apitrackers' }));
  const VerificationJob = mongoose.model('VerificationJob', new mongoose.Schema({}, { strict: false, collection: 'verificationjobs' }));

  console.log(`${colors.blue}[STEP 1]${colors.reset} Fetching last 5 successful verification calls...\n`);
  
  // Find last 5 successful jobs that returned data to Salesforce
  const successfulJobs = await VerificationJob.find({
    status: 'completed',
    'result.success': true,
    'result.categorizedData': { $exists: true }
  })
  .sort({ completedAt: -1 })
  .limit(5)
  .lean();

  console.log(`${colors.green}✓${colors.reset} Found ${successfulJobs.length} successful verification jobs\n`);

  for (let i = 0; i < successfulJobs.length; i++) {
    const job = successfulJobs[i];
    
    console.log(`\n${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}TEST ${i + 1} of ${successfulJobs.length}${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.cyan}Job ID:${colors.reset} ${job._id}`);
    console.log(`${colors.cyan}Session ID:${colors.reset} ${job.sessionId || 'N/A'}`);
    console.log(`${colors.cyan}Completed:${colors.reset} ${job.completedAt}`);
    console.log(`${colors.cyan}Original Status:${colors.reset} ${job.status}\n`);

    // Display original input
    console.log(`${colors.yellow}┌─ ORIGINAL INPUT ─────────────────────────────────────────┐${colors.reset}`);
    if (job.payload) {
      const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
      console.log(`${colors.yellow}│${colors.reset} Product Name: ${payload.Product_Name__c || 'N/A'}`);
      console.log(`${colors.yellow}│${colors.reset} Brand: ${payload.Brand__c || 'N/A'}`);
      console.log(`${colors.yellow}│${colors.reset} Category: ${payload.Category__c || 'N/A'}`);
      console.log(`${colors.yellow}│${colors.reset} HTML Length: ${payload.HTML__c?.length || 0} chars`);
    }
    console.log(`${colors.yellow}└──────────────────────────────────────────────────────────┘${colors.reset}\n`);

    // Display original results
    console.log(`${colors.green}┌─ ORIGINAL RESULTS ───────────────────────────────────────┐${colors.reset}`);
    if (job.result?.categorizedData) {
      const data = job.result.categorizedData;
      console.log(`${colors.green}│${colors.reset} Category: ${data.Category__c || 'N/A'}`);
      console.log(`${colors.green}│${colors.reset} Sub-Category: ${data.Sub_Category__c || 'N/A'}`);
      console.log(`${colors.green}│${colors.reset} Style: ${data.Style__c || 'N/A'}`);
      console.log(`${colors.green}│${colors.reset} Brand: ${data.Brand__c || 'N/A'}`);
      console.log(`${colors.green}│${colors.reset} Model Number: ${data.Model_Number__c || 'N/A'}`);
      console.log(`${colors.green}│${colors.reset} Attributes Extracted: ${Object.keys(data).filter(k => k.includes('_c')).length}`);
    }
    console.log(`${colors.green}└──────────────────────────────────────────────────────────┘${colors.reset}\n`);

    // Check if there were any issues with this job
    console.log(`${colors.blue}[STEP 2]${colors.reset} Checking for logged issues...\n`);
    
    const tracker = await APITracker.findOne({ sessionId: job.sessionId });
    
    if (tracker?.issues && tracker.issues.length > 0) {
      console.log(`${colors.red}⚠️  Found ${tracker.issues.length} issues in tracker:${colors.reset}\n`);
      
      tracker.issues.forEach((issue, idx) => {
        console.log(`${colors.red}Issue ${idx + 1}:${colors.reset}`);
        console.log(`  Type: ${issue.issueType}`);
        console.log(`  Field: ${issue.fieldName}`);
        console.log(`  Message: ${issue.message}`);
        console.log(`  Expected: ${issue.expectedValue || 'N/A'}`);
        console.log(`  Actual: ${issue.actualValue || 'N/A'}\n`);
      });

      // Check for self-healing attempts
      if (tracker.selfHealingAttempts && tracker.selfHealingAttempts.length > 0) {
        console.log(`${colors.cyan}🔧 Self-healing attempts found: ${tracker.selfHealingAttempts.length}${colors.reset}\n`);
        
        tracker.selfHealingAttempts.forEach((attempt, idx) => {
          console.log(`${colors.cyan}Attempt ${idx + 1}:${colors.reset}`);
          console.log(`  Timestamp: ${attempt.timestamp}`);
          console.log(`  Status: ${attempt.status}`);
          
          if (attempt.aiDiagnosis) {
            console.log(`\n  ${colors.bright}AI DIAGNOSIS:${colors.reset}`);
            
            if (attempt.aiDiagnosis.openai) {
              console.log(`  ${colors.blue}┌─ OpenAI Analysis ─────────────────────────────┐${colors.reset}`);
              console.log(`  ${colors.blue}│${colors.reset} Confidence: ${attempt.aiDiagnosis.openai.confidence}%`);
              console.log(`  ${colors.blue}│${colors.reset} Root Cause: ${attempt.aiDiagnosis.openai.rootCause?.substring(0, 60)}...`);
              console.log(`  ${colors.blue}│${colors.reset} Fix Type: ${attempt.aiDiagnosis.openai.proposedFix?.fixType}`);
              console.log(`  ${colors.blue}└───────────────────────────────────────────────┘${colors.reset}`);
            }

            if (attempt.aiDiagnosis.xai) {
              console.log(`  ${colors.magenta}┌─ xAI Analysis ────────────────────────────────┐${colors.reset}`);
              console.log(`  ${colors.magenta}│${colors.reset} Confidence: ${attempt.aiDiagnosis.xai.confidence}%`);
              console.log(`  ${colors.magenta}│${colors.reset} Root Cause: ${attempt.aiDiagnosis.xai.rootCause?.substring(0, 60)}...`);
              console.log(`  ${colors.magenta}│${colors.reset} Fix Type: ${attempt.aiDiagnosis.xai.proposedFix?.fixType}`);
              console.log(`  ${colors.magenta}└───────────────────────────────────────────────┘${colors.reset}`);
            }

            if (attempt.aiDiagnosis.claudeFinalReview) {
              console.log(`  ${colors.cyan}┌─ Claude Final Review ─────────────────────────┐${colors.reset}`);
              console.log(`  ${colors.cyan}│${colors.reset} Decision: ${attempt.aiDiagnosis.claudeFinalReview.decision}`);
              console.log(`  ${colors.cyan}│${colors.reset} Approved: ${attempt.aiDiagnosis.claudeFinalReview.finalDeploymentPlan?.approved ? '✅' : '❌'}`);
              
              if (attempt.aiDiagnosis.claudeFinalReview.independentResearch?.conducted) {
                console.log(`  ${colors.cyan}│${colors.reset} ${colors.bright}🔬 Independent Research Conducted${colors.reset}`);
                console.log(`  ${colors.cyan}│${colors.reset} Findings: ${attempt.aiDiagnosis.claudeFinalReview.independentResearch.findings?.length || 0}`);
              }
              
              console.log(`  ${colors.cyan}│${colors.reset} Reasoning: ${attempt.aiDiagnosis.claudeFinalReview.reasoning?.[0]?.substring(0, 50)}...`);
              console.log(`  ${colors.cyan}└───────────────────────────────────────────────┘${colors.reset}`);
            }

            if (attempt.aiDiagnosis.consensusAchieved) {
              console.log(`  ${colors.green}✓ Consensus Achieved${colors.reset}`);
            } else {
              console.log(`  ${colors.red}✗ No Consensus${colors.reset}`);
            }
          }

          if (attempt.codeChanges && attempt.codeChanges.length > 0) {
            console.log(`\n  ${colors.bright}CODE CHANGES APPLIED:${colors.reset}`);
            attempt.codeChanges.forEach((change, cidx) => {
              console.log(`    ${cidx + 1}. ${change.file}`);
              console.log(`       Type: ${change.changeType}`);
              console.log(`       Lines: ${change.linesChanged || 'N/A'}`);
            });
          }

          if (attempt.verificationResult) {
            console.log(`\n  ${colors.bright}VERIFICATION RESULT:${colors.reset}`);
            console.log(`    Success: ${attempt.verificationResult.success ? '✅' : '❌'}`);
            console.log(`    Issues Resolved: ${attempt.verificationResult.issuesResolved?.length || 0}`);
            console.log(`    Issues Remaining: ${attempt.verificationResult.issuesRemaining?.length || 0}`);
          }

          console.log('');
        });
      } else {
        console.log(`${colors.yellow}ℹ️  No self-healing attempts recorded${colors.reset}\n`);
      }
    } else {
      console.log(`${colors.green}✓ No issues found - clean verification${colors.reset}\n`);
    }

    // Summary for this job
    console.log(`${colors.bright}SUMMARY:${colors.reset}`);
    console.log(`  Original Status: ${job.status === 'completed' ? colors.green + '✓ Completed' : colors.red + '✗ Failed'}${colors.reset}`);
    console.log(`  Data Quality: ${job.result?.categorizedData ? colors.green + '✓ Data returned' : colors.red + '✗ No data'}${colors.reset}`);
    console.log(`  Issues Logged: ${tracker?.issues?.length || 0}`);
    console.log(`  Self-Healing Runs: ${tracker?.selfHealingAttempts?.length || 0}`);
    console.log(`  Tri-AI Analysis: ${tracker?.selfHealingAttempts?.some(a => a.aiDiagnosis?.claudeFinalReview) ? colors.cyan + '✓ Claude reviewed' : colors.yellow + '⚠️  No Claude review'}${colors.reset}`);
  }

  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   TEST COMPLETE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  await mongoose.disconnect();
}

comprehensiveTriAITest().catch(console.error);
