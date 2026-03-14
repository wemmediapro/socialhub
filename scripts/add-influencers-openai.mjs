#!/usr/bin/env node
/**
 * Script d'ajout d'influenceurs via OpenAI.
 * - Vérifie si chaque influenceur existe déjà (par nom ou handle) → on ne l'ajoute pas
 * - Sinon crée une fiche et utilise OpenAI pour enrichir (plateformes, niches, pays, etc.)
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/add-influencers-openai.mjs
 *   OPENAI_API_KEY=sk-xxx node scripts/add-influencers-openai.mjs --dry-run
 */

import mongoose from 'mongoose';
import 'dotenv/config';

const NETWORKS = ['instagram', 'tiktok', 'facebook', 'youtube', 'x', 'snapchat', 'linkedin', 'other'];

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

/** Liste des influenceurs à ajouter (nom affiché, handle optionnel extrait) */
const TO_ADD = [
  'La3ziz DZ',
  'Momo Trip (@momotrip3)',
  'Salwa Anlouf (@salwaanlouff)',
  'lailazaouiofficiel',
  'KENZA BELLA',
  'SAHAR ZEROUALI',
  'ZINEB SNIHJI',
];

/**
 * Parse une entrée "Nom (@handle)" ou "handle" en { name, handle }.
 */
function parseInput(input) {
  const raw = (input || '').trim();
  const match = raw.match(/^(.+?)\s*\(@([\w.]+)\)\s*$/);
  if (match) {
    return { name: match[1].trim(), handle: match[2].trim().toLowerCase() };
  }
  return { name: raw, handle: raw.replace(/^@/, '').trim().toLowerCase() || null };
}

/**
 * Normalise une chaîne pour la recherche (minuscules, sans @).
 */
function normalizeForSearch(s) {
  return (s || '').toLowerCase().replace(/^@/, '').trim().replace(/\s+/g, ' ');
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Vérifie si un influenceur existe déjà (par nom ou par handle sur une plateforme).
 */
async function existsAlready(InfluencerModel, { name, handle }) {
  const conditions = [];
  const nameNorm = normalizeForSearch(name);
  if (nameNorm.length >= 2) {
    conditions.push({ name: new RegExp(escapeRegex(nameNorm), 'i') });
  }
  if (handle && handle.length >= 2) {
    conditions.push({ 'platforms.handle': new RegExp(escapeRegex(handle), 'i') });
  }
  if (conditions.length === 0) return false;
  const found = await InfluencerModel.findOne({ $or: conditions }).lean();
  return !!found;
}

function placeholderAvatarUrl(name) {
  const encoded = encodeURIComponent((name || 'Influencer').trim());
  return `https://ui-avatars.com/api/?name=${encoded}&size=200&background=random`;
}

/**
 * Appel OpenAI pour créer une fiche influenceur à partir du nom et d'un handle optionnel.
 */
async function buildProfileWithOpenAI(openai, { name, handle }) {
  const handleHint = handle ? `Handle Instagram ou TikTok connu: ${handle}` : '';
  const prompt = `Tu es un assistant qui crée des fiches influenceurs pour une base de données.

Entrée:
- Nom ou pseudo: ${name}
${handleHint}

Ces influenceurs sont probablement algériens (DZ) ou du Maghreb, créateurs de contenu (lifestyle, voyage, mode, etc.).

Renvoie UNIQUEMENT un objet JSON valide (pas de markdown, pas de texte autour) avec:
- "name": le nom d'affichage (celui fourni, bien orthographié)
- "platforms": tableau d'objets. Chaque objet a: "network" (un parmi: ${NETWORKS.join(', ')}), "handle" (sans @), "url" (URL complète du profil). Inclure au moins Instagram; si un handle a été fourni, l'utiliser pour Instagram et/ou TikTok.
- "niches": tableau de chaînes (ex: ["lifestyle", "mode", "voyage"])
- "country": "DZ" si algérien/maghrébin, sinon code ISO 2 lettres ou ""
- "city": ville si déduisible, sinon ""
- "languages": ["fr", "ar"] ou ["fr"] selon le contexte

Règles: ne pas inventer de données personnelles réelles; pour les handles/URLs, utiliser le handle fourni si présent, sinon une forme plausible à partir du nom. Réponds uniquement par le JSON.`;

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
    console.warn('   ⚠️ Réponse OpenAI invalide:', raw.slice(0, 100));
    return null;
  }

  const result = {
    name: (parsed.name || name).trim(),
    avatarUrl: placeholderAvatarUrl(parsed.name || name),
    platforms: [],
    niches: Array.isArray(parsed.niches) ? parsed.niches : [],
    country: typeof parsed.country === 'string' ? parsed.country.trim() : 'DZ',
    city: typeof parsed.city === 'string' ? parsed.city.trim() : '',
    languages: Array.isArray(parsed.languages) ? parsed.languages : ['fr'],
    status: 'active',
  };

  if (Array.isArray(parsed.platforms)) {
    for (const p of parsed.platforms) {
      const network = (p.network || 'instagram').toLowerCase().replace('twitter', 'x');
      if (!NETWORKS.includes(network)) continue;
      let url = (p.url || '').trim();
      let h = (p.handle || '').replace(/^@/, '').trim();
      if (handle && !h) h = handle;
      if (!url && h) {
        if (network === 'instagram') url = `https://instagram.com/${h}`;
        else if (network === 'tiktok') url = `https://tiktok.com/@${h}`;
        else if (network === 'youtube') url = `https://youtube.com/@${h}`;
        else if (network === 'x') url = `https://x.com/${h}`;
        else if (network === 'facebook') url = `https://facebook.com/${h}`;
        else if (network === 'linkedin') url = `https://linkedin.com/in/${h}`;
        else if (network === 'snapchat') url = `https://snapchat.com/add/${h}`;
      }
      result.platforms.push({
        network,
        handle: h || undefined,
        url: url || undefined,
      });
    }
  }

  if (result.platforms.length === 0 && handle) {
    result.platforms.push({
      network: 'instagram',
      handle,
      url: `https://instagram.com/${handle}`,
    });
  }

  return result;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY est requis. Exemple: OPENAI_API_KEY=sk-xxx node scripts/add-influencers-openai.mjs');
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
  if (dryRun) console.log('Mode --dry-run: aucune écriture en base.\n');
  console.log(`Influenceurs à traiter: ${TO_ADD.length}\n`);

  for (let i = 0; i < TO_ADD.length; i++) {
    const input = TO_ADD[i];
    const { name, handle } = parseInput(input);
    console.log(`[${i + 1}/${TO_ADD.length}] ${input}`);

    try {
      const exists = await existsAlready(Influencer, { name, handle });
      if (exists) {
        console.log('   ⏭️  Déjà présent en base, ignoré.\n');
        continue;
      }

      const profile = await buildProfileWithOpenAI(openai, { name, handle });
      if (!profile) {
        console.log('   ❌ Échec enrichissement OpenAI, ignoré.\n');
        continue;
      }

      console.log(`   Nom: ${profile.name}`);
      console.log(`   Plateformes: ${profile.platforms.map(p => p.network + (p.handle ? ` @${p.handle}` : '')).join(', ')}`);
      console.log(`   Niches: ${(profile.niches || []).join(', ') || '-'}`);
      console.log(`   Pays: ${profile.country || '-'}`);

      if (!dryRun) {
        await Influencer.create(profile);
        console.log('   ✅ Ajouté en base.');
      } else {
        console.log('   [dry-run] Serait ajouté.');
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
