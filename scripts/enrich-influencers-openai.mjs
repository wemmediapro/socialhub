#!/usr/bin/env node
/**
 * Script d'enrichissement des influenceurs via OpenAI.
 * - Complète les plateformes (Instagram, TikTok, YouTube, etc.) avec handle et URL
 * - Suggère niches, pays, ville, langues à partir du nom et des notes
 * - Photo de profil : placeholder (avatar par initiales) si manquant
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/enrich-influencers-openai.mjs
 *   OPENAI_API_KEY=sk-xxx node scripts/enrich-influencers-openai.mjs --dry-run
 *   OPENAI_API_KEY=sk-xxx node scripts/enrich-influencers-openai.mjs --limit=5
 *   OPENAI_API_KEY=sk-xxx node scripts/enrich-influencers-openai.mjs --missing-only
 */

import mongoose from 'mongoose';
import 'dotenv/config';

const NETWORKS = ['instagram', 'tiktok', 'facebook', 'youtube', 'x', 'snapchat', 'linkedin', 'threads', 'other'];

const InfluencerSchema = new mongoose.Schema({
  projectId: String,
  name: { type: String, required: true },
  avatarUrl: String,
  email: String,
  phone: String,
  platforms: [{
    network: String,
    handle: String,
    url: String,
    followers: Number,
    avgViews: Number,
    avgEngagementRate: Number,
  }],
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

/**
 * Génère une URL d'avatar placeholder à partir du nom (initiales).
 */
function placeholderAvatarUrl(name) {
  const encoded = encodeURIComponent((name || 'Influencer').trim());
  return `https://ui-avatars.com/api/?name=${encoded}&size=200&background=random`;
}

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

/**
 * Appel OpenAI pour enrichir les infos d'un influenceur.
 */
async function enrichWithOpenAI(openai, influencer) {
  const name = influencer.name || '';
  const notes = influencer.notes || '';
  const existingPlatforms = (influencer.platforms || []).map(p => `${p.network}: ${p.handle || p.url || '-'}`).join(', ');
  const existingNiches = (influencer.niches || []).join(', ');
  const country = influencer.country || '';
  const city = influencer.city || '';
  const languages = (influencer.languages || []).join(', ');

  const prompt = `Tu es un assistant qui enrichit des fiches influenceurs.

Données actuelles:
- Nom: ${name}
- Notes: ${notes || '(aucune)'}
- Plateformes déjà renseignées: ${existingPlatforms || '(aucune)'}
- Niches: ${existingNiches || '(aucune)'}
- Pays: ${country || '(non renseigné)'}
- Ville: ${city || '(non renseignée)'}
- Langues: ${languages || '(aucune)'}

À partir du nom et des notes, renvoie UNIQUEMENT un objet JSON valide (pas de markdown, pas de texte autour) avec les champs suivants:
- "platforms": tableau d'objets. Chaque objet a: "network" (un parmi: ${NETWORKS.join(', ')}), "handle" (nom d'utilisateur sans @), "url" (URL complète du profil). Pour CHAQUE plateforme ajoute aussi: "followers" (nombre entier, estimation du nombre de followers — ex: 15000, 100000; 0 si inconnu), "avgEngagementRate" (nombre décimal, taux d'engagement en % — ex: 2.5 pour 2,5%, typiquement entre 1 et 10). Ce sont des estimations plausibles pour un influenceur de cette niche / région si tu n'as pas les vrais chiffres.
- "niches": tableau de chaînes (ex: ["lifestyle", "mode"]) si tu peux les déduire, sinon tableau vide.
- "country": code pays ISO 2 lettres (ex: "FR", "MA", "DZ") ou chaîne vide si inconnu.
- "city": ville si déduisible, sinon chaîne vide.
- "languages": tableau de codes langue (ex: ["fr", "en", "ar"]), ou vide.
- "notes": courte description professionnelle en français (2-4 phrases : type de contenu, audience, style). Si les notes existent déjà, résume-les ou complète. Sinon invente une description plausible à partir du nom et des niches.
- "notesIt": même description en italien (2-4 phrases).

Règles: ne invente pas de données personnelles réelles; pour les handles/URLs, tu peux proposer des formes plausibles à partir du nom. Réponds uniquement par le JSON.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn('   ⚠️ Réponse OpenAI invalide, ignorée:', raw.slice(0, 100));
    return null;
  }

  const result = {
    platforms: [],
    niches: Array.isArray(parsed.niches) ? parsed.niches : [],
    country: typeof parsed.country === 'string' ? parsed.country.trim() : '',
    city: typeof parsed.city === 'string' ? parsed.city.trim() : '',
    languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    notes: typeof parsed.notes === 'string' ? parsed.notes.trim() : '',
    notesIt: typeof parsed.notesIt === 'string' ? parsed.notesIt.trim() : '',
  };

  if (Array.isArray(parsed.platforms)) {
    for (const p of parsed.platforms) {
      const network = (p.network || '').toLowerCase().replace('twitter', 'x');
      if (!NETWORKS.includes(network)) continue;
      let url = (p.url || '').trim();
      const handle = (p.handle || '').replace(/^@/, '').trim();
      if (!url && handle) {
        if (network === 'instagram') url = `https://instagram.com/${handle}`;
        else if (network === 'tiktok') url = `https://tiktok.com/@${handle}`;
        else if (network === 'youtube') url = `https://youtube.com/@${handle}`;
        else if (network === 'x') url = `https://x.com/${handle}`;
        else if (network === 'facebook') url = `https://facebook.com/${handle}`;
        else if (network === 'linkedin') url = `https://linkedin.com/in/${handle}`;
        else if (network === 'snapchat') url = `https://snapchat.com/add/${handle}`;
        else if (network === 'threads') url = `https://threads.net/@${handle}`;
      }
      const followers = typeof p.followers === 'number' && p.followers >= 0 ? Math.round(p.followers) : (parseInt(p.followers, 10));
      const avgEngagementRate = typeof p.avgEngagementRate === 'number' ? Math.min(100, Math.max(0, p.avgEngagementRate)) : (parseFloat(p.avgEngagementRate));
      const avgViews = typeof p.avgViews === 'number' && p.avgViews >= 0 ? Math.round(p.avgViews) : (parseInt(p.avgViews, 10));
      result.platforms.push({
        network,
        handle: handle || undefined,
        url: url || undefined,
        ...(Number.isFinite(followers) && followers >= 0 && { followers }),
        ...(Number.isFinite(avgEngagementRate) && avgEngagementRate >= 0 && { avgEngagementRate }),
        ...(Number.isFinite(avgViews) && avgViews >= 0 && { avgViews }),
      });
    }
  }

  return result;
}

/**
 * Fusionne les plateformes existantes avec les nouvelles (sans doublon par network).
 * Préserve followers / avgEngagementRate / avgViews existants; complète avec les valeurs suggérées si manquantes.
 */
function mergePlatforms(existing, suggested) {
  const byNetwork = new Map();
  for (const p of existing || []) {
    if (p.network) byNetwork.set(p.network, { ...p });
  }
  for (const p of suggested || []) {
    if (!p.network) continue;
    const existingP = byNetwork.get(p.network);
    if (existingP) {
      byNetwork.set(p.network, {
        ...existingP,
        handle: existingP.handle || p.handle,
        url: existingP.url || p.url,
        followers: existingP.followers != null && existingP.followers > 0 ? existingP.followers : (p.followers ?? existingP.followers),
        avgEngagementRate: existingP.avgEngagementRate != null && existingP.avgEngagementRate > 0 ? existingP.avgEngagementRate : (p.avgEngagementRate ?? existingP.avgEngagementRate),
        avgViews: existingP.avgViews != null && existingP.avgViews > 0 ? existingP.avgViews : (p.avgViews ?? existingP.avgViews),
      });
    } else {
      byNetwork.set(p.network, { ...p });
    }
  }
  return Array.from(byNetwork.values());
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const missingOnly = process.argv.includes('--missing-only');
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY est requis. Exemple: OPENAI_API_KEY=sk-xxx node scripts/enrich-influencers-openai.mjs');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI manquant dans .env');
    process.exit(1);
  }

  let OpenAI;
  try {
    const mod = await import('openai');
    OpenAI = mod.default;
  } catch (e) {
    console.error('Installez le package openai: npm install openai');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  await mongoose.connect(uri, {
    authSource: 'admin',
    ...(process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && {
      user: process.env.MONGODB_USERNAME,
      pass: process.env.MONGODB_PASSWORD,
    }),
  });

  console.log('Connecté à MongoDB');
  if (dryRun) console.log('Mode --dry-run: aucune modification en base.\n');

  let query = {};
  if (missingOnly) {
    query = {
      $or: [
        { avatarUrl: { $in: [null, ''] } },
        { 'platforms.0': { $exists: false } },
        { platforms: { $size: 0 } },
        { niches: { $size: 0 } },
        { country: { $in: [null, ''] } },
      ],
    };
  }

  const influencers = await Influencer.find(query).sort({ createdAt: -1 }).limit(limit || 0).lean();
  console.log(`Influenceurs à traiter: ${influencers.length}\n`);

  for (let i = 0; i < influencers.length; i++) {
    const inf = influencers[i];
    console.log(`[${i + 1}/${influencers.length}] ${inf.name} (${inf._id})`);

    try {
      const enriched = await enrichWithOpenAI(openai, inf);
      if (!enriched) continue;

      const updates = {};

      const mergedPlatforms = mergePlatforms(inf.platforms, enriched.platforms);
      if (mergedPlatforms.length > 0) {
        updates.platforms = mergedPlatforms;
        const summary = mergedPlatforms.map(p => {
          const parts = [p.network + (p.handle ? ` @${p.handle}` : '')];
          if (p.followers != null && p.followers > 0) parts.push(`${formatNum(p.followers)} followers`);
          if (p.avgEngagementRate != null && p.avgEngagementRate > 0) parts.push(`${p.avgEngagementRate}% eng.`);
          return parts.join(' ');
        }).join(' | ');
        console.log(`   Plateformes: ${summary}`);
      }

      if (enriched.niches.length > 0 && (!inf.niches || inf.niches.length === 0)) {
        updates.niches = enriched.niches;
        console.log(`   Niches: ${enriched.niches.join(', ')}`);
      }
      if (enriched.country && !inf.country) {
        updates.country = enriched.country;
        console.log(`   Pays: ${enriched.country}`);
      }
      if (enriched.city && !inf.city) {
        updates.city = enriched.city;
        console.log(`   Ville: ${enriched.city}`);
      }
      if (enriched.languages.length > 0 && (!inf.languages || inf.languages.length === 0)) {
        updates.languages = enriched.languages;
        console.log(`   Langues: ${enriched.languages.join(', ')}`);
      }

      if (enriched.notes && (!inf.notes || !inf.notes.trim())) {
        updates.notes = enriched.notes;
        console.log(`   Description (FR): ${enriched.notes.slice(0, 60)}...`);
      }
      if (enriched.notesIt && (!inf.notesIt || !inf.notesIt.trim())) {
        updates.notesIt = enriched.notesIt;
        console.log(`   Description (IT): ${enriched.notesIt.slice(0, 60)}...`);
      }

      if (!inf.avatarUrl) {
        updates.avatarUrl = placeholderAvatarUrl(inf.name);
        console.log(`   Avatar: placeholder (initiales)`);
      }

      if (Object.keys(updates).length > 0 && !dryRun) {
        await Influencer.findByIdAndUpdate(inf._id, { $set: updates });
        console.log('   ✅ Mis à jour en base.');
      } else if (Object.keys(updates).length > 0 && dryRun) {
        console.log('   [dry-run] Serait mis à jour:', Object.keys(updates).join(', '));
      } else {
        console.log('   Aucun enrichissement à appliquer.');
      }
    } catch (err) {
      console.error('   ❌ Erreur:', err.message);
    }
    console.log('');
  }

  console.log('Terminé.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
