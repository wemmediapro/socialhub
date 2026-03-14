#!/usr/bin/env node
/**
 * Import des influenceurs depuis un fichier Excel (tableau_influenceurs_ahmed2_v2.xlsx).
 * - Analyse le tableau et mappe les colonnes (Nom, Description, URL/contact, plateformes…)
 * - Déjà en base : met à jour les données (nom, description FR/IT, plateformes, email, portfolio) à partir de l’Excel.
 * - Nouveaux : crée la fiche et génère la description en italien (notesIt) via OpenAI.
 * - Dédoublonnage dans le fichier par (nom + contact).
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/import-influencers-excel-openai.mjs
 *   OPENAI_API_KEY=sk-xxx node scripts/import-influencers-excel-openai.mjs --dry-run
 *   node scripts/import-influencers-excel-openai.mjs --file=/path/to/file.xlsx
 */

import fs from 'fs';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import 'dotenv/config';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

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

const DEFAULT_FILE = '/Users/ahmed/Desktop/tableau_influenceurs_ahmed2_v3.xlsx';

function normalize(s) {
  if (s == null) return '';
  const str = typeof s === 'string' ? s : String(s);
  return str.trim();
}

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((str || '').trim());
}

/**
 * Extrait un handle depuis une URL (ex: instagram.com/xxx → xxx).
 */
function handleFromUrl(url, network) {
  const u = (url || '').trim();
  if (!u) return '';
  try {
    const parsed = new URL(u);
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, '');
    const segment = pathname.split('/').filter(Boolean)[0] || '';
    if (network === 'tiktok' && segment.startsWith('@')) return segment.slice(1);
    return segment.replace(/^@/, '') || '';
  } catch {
    return '';
  }
}

function readExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath}`);
  }
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows;
}

/**
 * Transforme une ligne Excel (colonnes du fichier Ahmed) en objet influenceur pour notre schéma.
 * Pas de notesIt ici, sera rempli par OpenAI.
 */
function rowToInfluencer(row, projectId) {
  const name = normalize(row['Nom influenceur'] || row['Nom'] || row['Name']);
  if (!name) return null;

  const description = normalize(row['Description'] || row['Notes']);
  const contact = normalize(row['URL / contact'] || row['Email'] || row['Contact']);

  let email = '';
  let portfolioUrls = [];
  if (contact) {
    if (isEmail(contact)) {
      email = contact;
    } else if (contact.startsWith('http')) {
      portfolioUrls.push(contact);
    }
  }

  const platforms = [];
  const urlKeys = [
    { key: 'URL Instagram', network: 'instagram', countKey: 'Instagram' },
    { key: 'URL TikTok', network: 'tiktok', countKey: 'TikTok' },
    { key: 'URL YouTube', network: 'youtube', countKey: 'YouTube' },
    { key: 'URL Facebook', network: 'facebook', countKey: 'Facebook' },
  ];
  for (const { key, network, countKey } of urlKeys) {
    const url = normalize(row[key]);
    const followers = row[countKey] != null && row[countKey] !== '' ? Number(row[countKey]) : NaN;
    if (url || Number.isFinite(followers)) {
      const handle = handleFromUrl(url, network);
      platforms.push({
        network,
        handle: handle || undefined,
        url: url || undefined,
        ...(Number.isFinite(followers) && followers >= 0 && { followers: Math.round(followers) }),
      });
    }
  }

  return {
    projectId: projectId || undefined,
    name: (name || "").trim().toUpperCase(),
    email: email || undefined,
    phone: undefined,
    platforms,
    niches: [],
    country: undefined,
    city: undefined,
    languages: ['fr'],
    portfolioUrls: portfolioUrls.length ? portfolioUrls : undefined,
    notes: description || undefined,
    notesIt: undefined, // sera rempli par OpenAI
    status: 'active',
  };
}

/**
 * Dédoublonnage dans le fichier : garder une seule entrée par (nom normalisé + email si présent).
 */
function deduplicateRows(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const name = normalize(row['Nom influenceur'] || row['Nom'] || row['Name']);
    const contact = normalize(row['URL / contact'] || row['Email'] || '');
    const key = `${(name || '').toLowerCase()}|${(contact || '').toLowerCase()}`;
    if (!name) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/**
 * Génère notesIt (description en italien) à partir de notes (FR) via OpenAI.
 */
async function generateNotesItWithOpenAI(openai, notesFr, name) {
  if (!notesFr || !notesFr.trim()) {
    return '';
  }
  const prompt = `Traduis la description suivante d'un influenceur en italien. Garde le même ton et la même longueur (2-4 phrases). Réponds UNIQUEMENT par le texte en italien, sans préambule.

Nom: ${name}

Description (français):
${notesFr}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });
    const text = completion.choices[0]?.message?.content?.trim() || '';
    return text;
  } catch (e) {
    console.warn('   ⚠️ OpenAI notesIt:', e.message);
    return '';
  }
}

function normalizeForSearch(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Cherche un influenceur déjà en base (par email ou nom). Retourne le document ou null.
 */
async function findExistingInDb(email, name) {
  if (email && email.trim()) {
    const byEmail = await Influencer.findOne({ email: email.trim() }).lean();
    if (byEmail) return byEmail;
  }
  const nameNorm = normalizeForSearch(name);
  if (nameNorm.length < 2) return null;
  const byName = await Influencer.findOne({
    name: new RegExp('^' + nameNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
  }).lean();
  return byName || null;
}

function placeholderAvatarUrl(name) {
  const encoded = encodeURIComponent((name || 'Influencer').trim());
  return `https://ui-avatars.com/api/?name=${encoded}&size=200&background=random`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const fileArg = process.argv.find(a => a.startsWith('--file='));
  const filePath = fileArg ? fileArg.split('=')[1] : DEFAULT_FILE;
  const projectId = process.env.INFLUENCERS_PROJECT_ID || undefined;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY est requis pour générer les descriptions en italien.');
    console.error('Exemple: OPENAI_API_KEY=sk-xxx node scripts/import-influencers-excel-openai.mjs');
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

  console.log('Lecture du fichier:', filePath);
  const rawRows = readExcel(filePath);
  const rows = deduplicateRows(rawRows);
  console.log(`Lignes après dédoublonnage: ${rows.length} (sur ${rawRows.length})\n`);

  await mongoose.connect(uri, {
    authSource: 'admin',
    ...(process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && {
      user: process.env.MONGODB_USERNAME,
      pass: process.env.MONGODB_PASSWORD,
    }),
  });

  console.log('Connecté à MongoDB');
  if (dryRun) console.log('Mode --dry-run: aucune écriture en base.\n');

  let added = 0;
  let updated = 0;
  let skippedEmpty = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const inf = rowToInfluencer(row, projectId);
    if (!inf) {
      skippedEmpty++;
      continue;
    }

    console.log(`[${i + 1}/${rows.length}] ${inf.name}`);

    const existing = await findExistingInDb(inf.email || '', inf.name);
    if (existing) {
      // Mise à jour à partir du fichier Excel
      if (inf.notes && !inf.notesIt) {
        inf.notesIt = await generateNotesItWithOpenAI(openai, inf.notes, inf.name);
        if (inf.notesIt) {
          console.log('   Description (IT):', inf.notesIt.slice(0, 80) + (inf.notesIt.length > 80 ? '…' : ''));
        }
      }
      const update = {
        name: inf.name,
        notes: inf.notes ?? existing.notes,
        notesIt: inf.notesIt ?? existing.notesIt,
        platforms: inf.platforms.length > 0 ? inf.platforms : (existing.platforms || []),
        email: inf.email ?? existing.email,
        portfolioUrls: inf.portfolioUrls?.length ? inf.portfolioUrls : (existing.portfolioUrls || []),
        status: 'active',
      };
      if (projectId) update.projectId = projectId;
      if (!dryRun) {
        await Influencer.findByIdAndUpdate(existing._id, { $set: update });
        console.log('   ✅ Mis à jour en base.');
      } else {
        console.log('   [dry-run] Serait mis à jour:', Object.keys(update).join(', '));
      }
      updated++;
      console.log('');
      continue;
    }

    if (inf.notes && !inf.notesIt) {
      inf.notesIt = await generateNotesItWithOpenAI(openai, inf.notes, inf.name);
      if (inf.notesIt) {
        console.log('   Description (IT):', inf.notesIt.slice(0, 80) + (inf.notesIt.length > 80 ? '…' : ''));
      }
    }

    if (!inf.avatarUrl) {
      inf.avatarUrl = placeholderAvatarUrl(inf.name);
    }

    if (!dryRun) {
      await Influencer.create(inf);
      console.log('   ✅ Ajouté en base.');
      added++;
    } else {
      console.log('   [dry-run] Serait ajouté.');
      added++;
    }
    console.log('');
  }

  console.log('---');
  console.log(`Ajoutés: ${added}, Mis à jour: ${updated}, Ignorés (nom vide): ${skippedEmpty}`);
  console.log('Terminé.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
