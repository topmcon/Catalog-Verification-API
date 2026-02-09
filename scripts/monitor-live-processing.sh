#!/bin/bash
# Live monitoring script for Salesforce batch processing

echo "🚀 LIVE PROCESSING MONITOR - SALESFORCE BATCH"
echo "=============================================="
echo ""

while true; do
    clear
    echo "📊 CATALOG VERIFICATION API - LIVE STATS"
    echo "========================================"
    echo "$(date '+%Y-%m-%d %H:%M:%S EST')"
    echo ""
    
    # Get job counts from MongoDB
    PENDING=$(docker exec mongodb mongosh catalog-verification --quiet --eval 'db.verificationjobs.countDocuments({status: "pending"})' 2>/dev/null || echo "?")
    PROCESSING=$(docker exec mongodb mongosh catalog-verification --quiet --eval 'db.verificationjobs.countDocuments({status: "processing"})' 2>/dev/null || echo "?")
    COMPLETED=$(docker exec mongodb mongosh catalog-verification --quiet --eval 'db.verificationjobs.countDocuments({status: "completed"})' 2>/dev/null || echo "?")
    FAILED=$(docker exec mongodb mongosh catalog-verification --quiet --eval 'db.verificationjobs.countDocuments({status: "failed"})' 2>/dev/null || echo "?")
    TOTAL=$(docker exec mongodb mongosh catalog-verification --quiet --eval 'db.verificationjobs.countDocuments({})' 2>/dev/null || echo "?")
    
    echo "📋 QUEUE STATUS"
    echo "---------------"
    echo "⏳ Pending:     $PENDING jobs"
    echo "⚙️  Processing:  $PROCESSING jobs (max: 100)"
    echo "✅ Completed:   $COMPLETED jobs"
    echo "❌ Failed:      $FAILED jobs"
    echo "📊 Total Jobs:  $TOTAL"
    echo ""
    
    # Get recent jobs (last 5 seconds)
    RECENT=$(docker exec mongodb mongosh catalog-verification --quiet --eval 'db.verificationjobs.countDocuments({createdAt: {$gte: new Date(Date.now() - 5000)}})' 2>/dev/null || echo "?")
    echo "🔥 Recent Activity (last 5s): $RECENT new jobs"
    echo ""
    
    # Get average processing time for last 10 completed jobs
    AVG_TIME=$(docker exec mongodb mongosh catalog-verification --quiet --eval '
        const jobs = db.verificationjobs.find({status: "completed", completedAt: {$exists: true}}).sort({completedAt: -1}).limit(10).toArray();
        if (jobs.length > 0) {
            const avgMs = jobs.reduce((acc, job) => {
                if (job.processingTime) return acc + job.processingTime;
                return acc + (new Date(job.completedAt) - new Date(job.createdAt));
            }, 0) / jobs.length;
            print(Math.round(avgMs / 1000) + "s");
        } else {
            print("N/A");
        }
    ' 2>/dev/null || echo "?")
    echo "⏱️  Avg Processing Time: $AVG_TIME"
    echo ""
    
    # Memory usage
    MEM=$(free -h | grep Mem | awk '{print "Used: " $3 " / " $2 " (Available: " $7 ")"}')
    echo "💾 Memory: $MEM"
    echo ""
    
    # Recent errors
    ERROR_COUNT=$(tail -100 /opt/catalog-verification-api/logs/combined.log | grep -c ERROR || echo "0")
    echo "⚠️  Recent errors (last 100 lines): $ERROR_COUNT"
    echo ""
    
    echo "Press Ctrl+C to stop monitoring..."
    sleep 2
done
