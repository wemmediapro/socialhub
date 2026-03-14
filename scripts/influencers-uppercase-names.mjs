#!/usr/bin/env node
/**
 * Met à jour tous les noms d'influenceurs en majuscules en base.
 * À exécuter une fois : node scripts/influencers-uppercase-names.mjs
 * Mode dry-run : node scripts/influencers-uppercase-names.mjs --dry-run
 */

import mongoose from 'mongoose';
import 'dotenv/config';

const InfluencerSchema = new mongoose.Schema({
  projectId: String,
  name: { type: String, required: true },
  avatarUrl: String,
  email: String,
  phone: String,
  platforms: Array,
  niches: [String],
  country: String,
  city: String,
  languages: [String],
  rates: Object,
  portfolioUrls: [String],
  notes: String,
  notesIt: String,
  status: String,
  invitedAt: Date,
  invitedToProjectId: String,
}, { timestamps: true });

const Influencer = mongoose.models?.Influencer || mongoose.model('Influencer', InfluencerSchema);

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI manquant dans .env');
    process.exit(1);
  }

  await mongoose.connect(uri, {
    authSource: 'admin',
    ...(process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && {
      user: process.env.MONGODB_USERNAME,
      pass: process.env.MONGODB_PASSWORD,
    }),
  });

  const list = await Influencer.find({}).lean();
  let updated = 0;
  for (const doc of list) {
    const current = (doc.name || '').trim();
    const upper = current.toUpperCase();
    if (current !== upper) {
      console.log(`  ${current} → ${upper}`);
      if (!dryRun) {
        await Influencer.findByIdAndUpdate(doc._id, { $set: { name: upper } });
      }
      updated++;
    }
  }

  console.log(dryRun ? `[dry-run] ${updated} influenceur(s) seraient mis à jour.` : `${updated} influenceur(s) mis à jour.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
