const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

async function checkImageUsage() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    const cutoffDate = new Date('2026-02-04T19:38:00Z');

    // Check how many verification jobs have image data
    const stats = await VerificationJob.aggregate([
      { $match: { createdAt: { $gte: cutoffDate } } },
      {
        $project: {
          hasImageData: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$research.images', []] } }, 0] },
              1,
              0
            ]
          },
          imageCount: { $size: { $ifNull: ['$research.images', []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          jobsWithImages: { $sum: '$hasImageData' },
          totalImages: { $sum: '$imageCount' }
        }
      }
    ]);

    if (stats.length > 0) {
      const data = stats[0];
      const percentWithImages = ((data.jobsWithImages / data.totalJobs) * 100).toFixed(1);

      console.log('\n=== Image Analysis Impact (Feb 4-9, 2026) ===');
      console.log(`Total verification jobs: ${data.totalJobs.toLocaleString()}`);
      console.log(`Jobs with image analysis: ${data.jobsWithImages.toLocaleString()} (${percentWithImages}%)`);
      console.log(`Total images analyzed: ${data.totalImages.toLocaleString()}`);
      console.log(`Avg images per job (when used): ${(data.totalImages / data.jobsWithImages).toFixed(1)}`);
      console.log(`\n💡 Dual vision would affect ${percentWithImages}% of all verification jobs`);

      // Additional cost calculation
      const currentCostPerDay = 8.65 / 6; // $8.65 over 6 days
      const additionalCostPerDay = 10.13 / 6; // OpenAI would add this
      const totalCostPerMonth = (currentCostPerDay + additionalCostPerDay) * 30;
      
      console.log(`\n=== Cost Impact ===`);
      console.log(`Current (xAI only): $${(currentCostPerDay * 30).toFixed(2)}/month`);
      console.log(`With dual vision: $${totalCostPerMonth.toFixed(2)}/month`);
      console.log(`Additional cost: +$${(additionalCostPerDay * 30).toFixed(2)}/month`);
      console.log(`Cost per image (dual): $${(totalCostPerMonth / (data.totalImages / 6 * 30)).toFixed(4)}`);
    } else {
      console.log('No image data found in verification jobs');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkImageUsage();
