const mongoose = require('mongoose');
require('dotenv').config();

const InfluencerSchema = new mongoose.Schema({
  projectId: String,
  name: String,
  email: String,
  phone: String,
  platforms: Array,
  niches: Array,
  languages: Array,
  portfolioUrls: Array,
  country: String,
  city: String,
  notes: String,
  avatarUrl: String,
  rates: Object,
  status: String
}, { timestamps: true });

async function mergeInfluencers() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(uri, {
      authSource: 'admin',
      ...(process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && {
        user: process.env.MONGODB_USERNAME,
        pass: process.env.MONGODB_PASSWORD
      })
    });

    console.log('✅ Connected to MongoDB');

    const Influencer = mongoose.model('Influencer', InfluencerSchema);

    // Find duplicate influencers (same name)
    const duplicates = await Influencer.aggregate([
      {
        $group: {
          _id: { $toLower: '$name' },
          count: { $sum: 1 },
          influencers: { $push: '$$ROOT' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`\n📊 Found ${duplicates.length} group(s) of duplicate influencers\n`);

    for (const group of duplicates) {
      const influencers = group.influencers;
      console.log(`🔍 Processing: "${group._id}" (${influencers.length} duplicates)`);

      // Use the first one as base (or the one with most data)
      const baseInfluencer = influencers.reduce((prev, current) => {
        const prevData = (prev.platforms?.length || 0) + (prev.email ? 1 : 0) + (prev.phone ? 1 : 0);
        const currentData = (current.platforms?.length || 0) + (current.email ? 1 : 0) + (current.phone ? 1 : 0);
        return currentData > prevData ? current : prev;
      });

      console.log(`   ✅ Base influencer: ${baseInfluencer._id} (project: ${baseInfluencer.projectId})`);

      // Merge data
      const mergedData = {
        ...baseInfluencer,
        _id: baseInfluencer._id,
        platforms: [],
        niches: [],
        languages: [],
        portfolioUrls: []
      };

      // Collect unique platforms
      const platformMap = new Map();
      influencers.forEach(inf => {
        if (inf.platforms) {
          inf.platforms.forEach(platform => {
            const key = `${platform.network}-${platform.handle || platform.url || ''}`;
            if (!platformMap.has(key)) {
              platformMap.set(key, platform);
            }
          });
        }
      });
      mergedData.platforms = Array.from(platformMap.values());

      // Collect unique niches, languages, portfolioUrls
      const nicheSet = new Set();
      const langSet = new Set();
      const portfolioSet = new Set();

      influencers.forEach(inf => {
        if (inf.niches) inf.niches.forEach(n => nicheSet.add(n));
        if (inf.languages) inf.languages.forEach(l => langSet.add(l));
        if (inf.portfolioUrls) inf.portfolioUrls.forEach(u => portfolioSet.add(u));
        if (inf.email && !mergedData.email) mergedData.email = inf.email;
        if (inf.phone && !mergedData.phone) mergedData.phone = inf.phone;
        if (inf.country && !mergedData.country) mergedData.country = inf.country;
        if (inf.city && !mergedData.city) mergedData.city = inf.city;
        if (inf.notes && !mergedData.notes) mergedData.notes = inf.notes;
        if (inf.avatarUrl && !mergedData.avatarUrl) mergedData.avatarUrl = inf.avatarUrl;
      });

      mergedData.niches = Array.from(nicheSet);
      mergedData.languages = Array.from(langSet);
      mergedData.portfolioUrls = Array.from(portfolioSet);

      // Keep the first projectId (or you can choose a specific one)
      // For "dad dad", we'll use GNV Maroc (6909cbcdbec2a9625ab0070d)
      if (group._id.toLowerCase() === 'dad dad') {
        mergedData.projectId = '6909cbcdbec2a9625ab0070d';
        console.log(`   📌 Project set to: GNV Maroc`);
      }

      // Update base influencer
      await Influencer.findByIdAndUpdate(baseInfluencer._id, mergedData);
      console.log(`   ✅ Updated base influencer with merged data`);

      // Delete other duplicates
      const idsToDelete = influencers
        .filter(inf => inf._id.toString() !== baseInfluencer._id.toString())
        .map(inf => inf._id);

      if (idsToDelete.length > 0) {
        await Influencer.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`   🗑️  Deleted ${idsToDelete.length} duplicate(s)`);
      }

      console.log('');
    }

    console.log('✅ Merge completed!');
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

mergeInfluencers();


