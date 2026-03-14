#!/usr/bin/env node
/**
 * Script de synchronisation des traductions FR ↔ IT pour :
 * - Boîte à Idées (ideas)
 * - Workflow Posts (workflow)
 * - Workflow Collab (collab)
 *
 * Utilise l'API OpenAI pour traduire les clés manquantes.
 * Préserve les placeholders {name}, {email}, {count}, etc.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/sync-i18n-openai.mjs
 *   OPENAI_API_KEY=sk-xxx node scripts/sync-i18n-openai.mjs --dry-run
 *   OPENAI_API_KEY=sk-xxx node scripts/sync-i18n-openai.mjs --fr-to-it-only
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MESSAGES_DIR = join(ROOT, 'src', 'i18n', 'messages');

const SECTIONS = ['ideas', 'workflow', 'collab'];
const MENU_KEYS = ['ideas', 'workflowPosts', 'workflowCollab'];
const DASHBOARD_KEYS = ['calendarPost', 'calendarPosts', 'calendarCollab', 'calendarCollabs'];

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

function collectPathsToSync(fr) {
  const paths = [];
  for (const section of SECTIONS) {
    if (fr[section]) {
      for (const { key } of flattenKeys(fr[section], section)) {
        paths.push(key);
      }
    }
  }
  for (const k of MENU_KEYS) {
    if (fr.menu && fr.menu[k] !== undefined) paths.push(`menu.${k}`);
  }
  for (const k of DASHBOARD_KEYS) {
    if (fr.dashboard && fr.dashboard[k] !== undefined) paths.push(`dashboard.${k}`);
  }
  return [...new Set(paths)];
}

function collectPathsFromObj(obj) {
  const paths = [];
  for (const section of SECTIONS) {
    if (obj[section]) {
      for (const { key } of flattenKeys(obj[section], section)) {
        paths.push(key);
      }
    }
  }
  for (const k of MENU_KEYS) {
    if (obj.menu && obj.menu[k] !== undefined) paths.push(`menu.${k}`);
  }
  for (const k of DASHBOARD_KEYS) {
    if (obj.dashboard && obj.dashboard[k] !== undefined) paths.push(`dashboard.${k}`);
  }
  return [...new Set(paths)];
}

function getByPath(obj, path) {
  return getNested(obj, path);
}

async function translateWithOpenAI(text, fromLang, toLang, openai) {
  const from = fromLang === 'fr' ? 'français' : 'italien';
  const to = toLang === 'it' ? 'italien' : 'français';
  const prompt = `Traduis le texte suivant du ${from} vers le ${to}.
Conserve exactement les placeholders tels quels: {name}, {email}, {count}, {plural}, etc.
Conserve les emojis et la ponctuation.
Réponds UNIQUEMENT par la traduction, sans guillemets ni explication.

Texte: ${text}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
  const result = completion.choices[0]?.message?.content?.trim() || text;
  return result.replace(/^["']|["']$/g, '');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const frToItOnly = process.argv.includes('--fr-to-it-only');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('OPENAI_API_KEY est requis. Exemple: OPENAI_API_KEY=sk-xxx node scripts/sync-i18n-openai.mjs');
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

  const frPath = join(MESSAGES_DIR, 'fr.json');
  const itPath = join(MESSAGES_DIR, 'it.json');
  const fr = JSON.parse(readFileSync(frPath, 'utf-8'));
  const it = JSON.parse(readFileSync(itPath, 'utf-8'));

  const paths = collectPathsToSync(fr);
  const pathsIt = collectPathsFromObj(it);
  const missingInIt = paths.filter((p) => getByPath(it, p) === undefined);
  const missingInFr = frToItOnly ? [] : pathsIt.filter((p) => getByPath(fr, p) === undefined);

  console.log('Sections ciblées: ideas, workflow, collab (+ menu & dashboard)');
  console.log('Clés à synchroniser:', paths.length);
  console.log('Clés manquantes en italien:', missingInIt.length);
  if (!frToItOnly) console.log('Clés manquantes en français:', missingInFr.length);

  const openai = !dryRun && apiKey ? new OpenAI({ apiKey }) : null;

  for (const path of missingInIt) {
    const source = getByPath(fr, path);
    if (typeof source !== 'string') continue;
    if (dryRun) {
      console.log('[DRY-RUN] À traduire FR→IT:', path, ':', source.slice(0, 50) + '...');
      continue;
    }
    try {
      const translated = await translateWithOpenAI(source, 'fr', 'it', openai);
      setNested(it, path, translated);
      console.log('OK FR→IT:', path);
    } catch (err) {
      console.error('Erreur traduction', path, err.message);
    }
  }

  for (const path of missingInFr) {
    const source = getByPath(it, path);
    if (typeof source !== 'string') continue;
    if (dryRun) {
      console.log('[DRY-RUN] À traduire IT→FR:', path);
      continue;
    }
    try {
      const translated = await translateWithOpenAI(source, 'it', 'fr', openai);
      setNested(fr, path, translated);
      console.log('OK IT→FR:', path);
    } catch (err) {
      console.error('Erreur traduction', path, err.message);
    }
  }

  if (!dryRun) {
    writeFileSync(itPath, JSON.stringify(it, null, 2) + '\n', 'utf-8');
    console.log('Écrit:', itPath);
    if (missingInFr.length > 0) {
      writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf-8');
      console.log('Écrit:', frPath);
    }
  } else {
    console.log('Mode dry-run: aucun fichier modifié.');
  }

  console.log('\nTerminé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
