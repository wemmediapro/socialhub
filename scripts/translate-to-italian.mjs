#!/usr/bin/env node
/**
 * Traduit tout le contenu existant en italien via l'API OpenAI :
 * 1. Messages i18n : fr.json → it.json (toutes les clés manquantes ou --full pour tout réécrire)
 * 2. Fichiers .md à la racine du projet → *_IT.md
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/translate-to-italian.mjs
 *   OPENAI_API_KEY=sk-xxx node scripts/translate-to-italian.mjs --full
 *   OPENAI_API_KEY=sk-xxx node scripts/translate-to-italian.mjs --dry-run
 *   OPENAI_API_KEY=sk-xxx node scripts/translate-to-italian.mjs --i18n-only
 *   OPENAI_API_KEY=sk-xxx node scripts/translate-to-italian.mjs --md-only
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MESSAGES_DIR = join(ROOT, 'src', 'i18n', 'messages');

function getNested(obj, path) {
  const keys = path.split('.');
  let v = obj;
  for (const k of keys) {
    if (v == null || typeof v !== 'object') return undefined;
    v = v[k];
  }
  return v;
}

function setNested(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in o) || typeof o[k] !== 'object') o[k] = {};
    o = o[k];
  }
  o[keys[keys.length - 1]] = value;
}

function flattenKeys(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenKeys(v, path));
    } else if (typeof v === 'string') {
      out.push({ key: path, value: v });
    }
  }
  return out;
}

async function translateWithOpenAI(text, fromLang, toLang, openai, options = {}) {
  const from = fromLang === 'fr' ? 'français' : 'italien';
  const to = toLang === 'it' ? 'italien' : 'français';
  const preservePlaceholders = options.preservePlaceholders !== false;
  let prompt = `Traduis le texte suivant du ${from} vers le ${to}.`;
  if (preservePlaceholders) {
    prompt += `\nConserve exactement les placeholders tels quels: {name}, {email}, {count}, {plural}, etc.`;
  }
  prompt += `\nConserve les emojis et la ponctuation.
Réponds UNIQUEMENT par la traduction, sans guillemets ni explication.

Texte:\n${text}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
  let result = completion.choices[0]?.message?.content?.trim() || text;
  result = result.replace(/^["']|["']$/g, '');
  return result;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const full = process.argv.includes('--full');
  const i18nOnly = process.argv.includes('--i18n-only');
  const mdOnly = process.argv.includes('--md-only');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('OPENAI_API_KEY est requis. Exemple: OPENAI_API_KEY=sk-xxx node scripts/translate-to-italian.mjs');
    process.exit(1);
  }

  let OpenAI;
  if (!dryRun) {
    try {
      const mod = await import('openai');
      OpenAI = mod.default;
    } catch (e) {
      console.error('Installez le package openai: npm install openai');
      process.exit(1);
    }
  }

  const openai = !dryRun && apiKey ? new OpenAI({ apiKey }) : null;

  // ---- 1. i18n : fr.json → it.json ----
  if (!mdOnly) {
    const frPath = join(MESSAGES_DIR, 'fr.json');
    const itPath = join(MESSAGES_DIR, 'it.json');
    const fr = JSON.parse(readFileSync(frPath, 'utf-8'));
    let it = {};
    try {
      it = JSON.parse(readFileSync(itPath, 'utf-8'));
    } catch (_) {
      // it.json absent ou invalide
    }

    const entries = flattenKeys(fr, '');
    const toTranslate = full
      ? entries
      : entries.filter((e) => getNested(it, e.key) === undefined);

    console.log('i18n: clés totales FR:', entries.length);
    console.log('i18n: clés à traduire FR→IT:', toTranslate.length);

    for (let i = 0; i < toTranslate.length; i++) {
      const { key, value } = toTranslate[i];
      if (dryRun) {
        console.log('[DRY-RUN] FR→IT:', key, ':', value.slice(0, 50) + (value.length > 50 ? '...' : ''));
        continue;
      }
      try {
        const translated = await translateWithOpenAI(value, 'fr', 'it', openai);
        setNested(it, key, translated);
        console.log(`[${i + 1}/${toTranslate.length}] OK: ${key}`);
      } catch (err) {
        console.error('Erreur traduction', key, err.message);
      }
      await sleep(200);
    }

    if (!dryRun && toTranslate.length > 0) {
      writeFileSync(itPath, JSON.stringify(it, null, 2) + '\n', 'utf-8');
      console.log('Écrit:', itPath);
    }
  }

  // ---- 2. Fichiers .md à la racine (hors node_modules) ----
  if (!i18nOnly) {
    const rootMdFiles = readdirSync(ROOT)
      .filter((f) => f.endsWith('.md') && !f.endsWith('_IT.md'))
      .map((f) => join(ROOT, f))
      .filter((p) => statSync(p).isFile());

    console.log('\nMarkdown à la racine:', rootMdFiles.length, 'fichier(s)');

    for (const mdPath of rootMdFiles) {
      const base = mdPath.replace(/\.md$/, '');
      const outPath = base + '_IT.md';
      const content = readFileSync(mdPath, 'utf-8');
      if (!content.trim()) {
        console.log('Ignoré (vide):', mdPath);
        continue;
      }

      if (dryRun) {
        console.log('[DRY-RUN] MD→IT:', mdPath, '→', outPath);
        continue;
      }

      try {
        const translated = await translateWithOpenAI(content, 'fr', 'it', openai, {
          preservePlaceholders: false,
        });
        writeFileSync(outPath, translated, 'utf-8');
        console.log('Écrit:', outPath);
      } catch (err) {
        console.error('Erreur traduction MD', mdPath, err.message);
      }
      await sleep(300);
    }
  }

  console.log('\nTerminé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
