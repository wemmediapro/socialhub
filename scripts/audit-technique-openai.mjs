#!/usr/bin/env node
/**
 * Audit technique complet et structuré via l'API OpenAI.
 * Analyse le code source (structure, sécurité, perf, stabilité) et produit un rapport.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/audit-technique-openai.mjs
 *   OPENAI_API_KEY=sk-xxx node scripts/audit-technique-openai.mjs --output rapport-audit.md
 *   OPENAI_API_KEY=sk-xxx node scripts/audit-technique-openai.mjs --dry-run
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");
const MAX_FILE_LINES = 120;
const MAX_TOTAL_CHARS = 80000;

function collectFiles(dir, ext, out = []) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!e.name.startsWith(".") && e.name !== "node_modules") collectFiles(full, ext, out);
      } else if (ext.some((x) => e.name.endsWith(x))) out.push(full);
    }
  } catch (_) {}
  return out;
}

function readSnippet(path, maxLines = MAX_FILE_LINES) {
  try {
    const raw = readFileSync(path, "utf-8");
    const lines = raw.split("\n");
    const slice = lines.length > maxLines ? lines.slice(0, maxLines).join("\n") + "\n// ... (tronqué) " + (lines.length - maxLines) + " lignes" : raw;
    return slice;
  } catch {
    return "(lecture impossible)";
  }
}

function buildContext() {
  const sections = [];
  let totalChars = 0;

  const apiFiles = collectFiles(join(SRC, "pages", "api"), [".ts"]).filter((f) => !f.includes(".d.ts"));
  const libFiles = collectFiles(join(SRC, "lib"), [".ts"]);
  const modelFiles = collectFiles(join(SRC, "models"), [".ts"]);
  const keyPages = ["index.tsx", "login.tsx", "_app.tsx", "workflow.tsx"].map((p) => join(SRC, "pages", p)).filter((p) => {
    try { statSync(p); return true; } catch { return false; }
  });

  const all = [...apiFiles.slice(0, 25), ...libFiles.slice(0, 15), ...modelFiles.slice(0, 10), ...keyPages.slice(0, 4)];
  for (const f of all) {
    if (totalChars >= MAX_TOTAL_CHARS) break;
    const rel = f.replace(ROOT + "/", "");
    const content = readSnippet(f);
    const block = `\n### ${rel}\n\`\`\`\n${content}\n\`\`\`\n`;
    if (totalChars + block.length > MAX_TOTAL_CHARS) break;
    sections.push(block);
    totalChars += block.length;
  }

  return {
    summary: `
- API routes (échantillon): ${apiFiles.length} fichiers
- lib: ${libFiles.length}, models: ${modelFiles.length}
- Pages clés: index, login, _app, workflow
`,
    codeBlocks: sections.join("\n"),
  };
}

const SYSTEM_PROMPT = `Tu es un auditeur technique senior. Tu analyses un projet Next.js 14 (React 18, TypeScript, MongoDB, BullMQ, Zod) pour produire un audit technique COMPLET et STRUCTURÉ.

Objectifs:
1. Que l'application tourne SANS BLOCAGE (pas de freeze, pas de crash, pas de fuites mémoire).
2. Vérifier TOUS les aspects techniques: structure, typage, sécurité, validation API, performance, tests, CI, erreurs non gérées, timers/listeners, dépendances.

Tu dois répondre UNIQUEMENT en français, en Markdown, avec les sections suivantes (conserver les titres exacts):

## 1. Résumé exécutif (tableau)
Tableau avec colonnes: Critère | État (✅ / ⚠️ / 🔴) | Commentaire

Critères obligatoires: Structure, TypeScript, Sécurité, Validation API, Tests, Lint/Format, Performance, Stabilité (blocages/fuites), Build/CI.

## 2. Risques de blocage et stabilité
- Timers (setTimeout/setInterval) non nettoyés au démontage.
- Listeners (resize, scroll) non retirés.
- Erreurs réseau/fetch avalées (catch vides).
- Promesses non gérées (unhandled rejection).
- Boucles ou traitements bloquants côté client/serveur.

Pour chaque point: fichier/ligne si possible, gravité, recommandation.

## 3. Sécurité
- Authentification (bcrypt, sessions).
- Validation des entrées (Zod) sur toutes les routes qui lisent req.body.
- Injection, XSS, exposition de données.

## 4. TypeScript et qualité de code
- strict mode, usage de any, typage des modèles et des réponses API.

## 5. Performance
- next/image vs <img>, next/dynamic pour grosses pages, moment vs date-fns/dayjs.

## 6. Plan d'action priorisé
Liste numérotée par priorité (1 = critique) avec actions concrètes et fichiers concernés.`;

async function runAudit(openai, context) {
  const userContent = `
Contexte du projet:
${context.summary}

Extraits de code (fichiers principaux):
${context.codeBlocks}

Produis l'audit technique complet et structuré comme demandé dans le system prompt. Réponds uniquement par le contenu du rapport en Markdown, sans préambule.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    max_tokens: 8000,
  });

  const text = completion.choices[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("Réponse OpenAI vide");
  return text;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const outIdx = process.argv.indexOf("--output");
  const outputPath = outIdx >= 0 && process.argv[outIdx + 1]
    ? process.argv[outIdx + 1]
    : join(ROOT, "AUDIT_TECHNIQUE_OPENAI.md");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error("OPENAI_API_KEY est requis. Exemple: OPENAI_API_KEY=sk-xxx node scripts/audit-technique-openai.mjs");
    process.exit(1);
  }

  console.log("Collecte du contexte (src/)...");
  const context = buildContext();
  console.log("Contexte prêt (~" + context.codeBlocks.length + " caractères).");

  if (dryRun) {
    console.log("Mode dry-run: pas d'appel API. Sortie prévue:", outputPath);
    process.exit(0);
  }

  let OpenAI;
  try {
    const mod = await import("openai");
    OpenAI = mod.default;
  } catch (e) {
    console.error("Installez le package openai: npm install openai");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });
  console.log("Appel API OpenAI (gpt-4o)...");

  try {
    const report = await runAudit(openai, context);
    const fullReport = `# Audit technique – Généré par OpenAI\n\n**Date :** ${new Date().toISOString().slice(0, 10)}\n\n---\n\n${report}`;
    writeFileSync(outputPath, fullReport, "utf-8");
    console.log("Rapport écrit:", outputPath);
  } catch (err) {
    console.error("Erreur:", err.message);
    process.exit(1);
  }
}

main();
