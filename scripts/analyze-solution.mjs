#!/usr/bin/env node
/**
 * Script d'analyse de la solution SocialHub
 * - Analyse ergonomie et mise en page (avec OpenAI)
 * - Suggestions de nettoyage du code pour une meilleure navigation
 * - Génère un rapport dans ANALYSE_ERGO_NAV.md
 *
 * Utilisation:
 *   OPENAI_API_KEY=sk-xxx node scripts/analyze-solution.mjs
 *   ou définir OPENAI_API_KEY dans .env (chargé si dotenv disponible)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Charger .env si disponible
try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: path.join(root, ".env") });
} catch (_) {}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_LINES_PER_FILE = 400;
const MAX_FILES = 35;

function listFiles(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!e.name.startsWith(".") && e.name !== "node_modules") listFiles(full, ext, out);
    } else if (ext.some((x) => e.name.endsWith(x))) out.push(full);
  }
  return out;
}

function readSnippet(filePath, maxLines) {
  const rel = path.relative(root, filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const slice = lines.length > maxLines ? lines.slice(0, maxLines).join("\n") + "\n// ... (tronqué)\n" : content;
  return `### ${rel}\n\`\`\`\n${slice}\n\`\`\`\n`;
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY manquant. Définissez-le dans .env ou : OPENAI_API_KEY=sk-xxx node scripts/analyze-solution.mjs");
    process.exit(1);
  }

  const src = path.join(root, "src");
  const pages = listFiles(path.join(src, "pages"), [".tsx", ".ts"]).filter((f) => !f.includes("/api/"));
  const components = listFiles(path.join(src, "components"), [".tsx"]);
  const styles = listFiles(path.join(src, "styles"), [".css"]);
  const lib = listFiles(path.join(src, "lib"), [".ts"]);
  const all = [...pages, ...components, ...styles, ...lib].slice(0, MAX_FILES);

  let body = `# Contexte du projet\n\nNext.js 14 (Pages Router), React 18, TypeScript. Routes: dashboard, workflow, calendar, library, posts, collab, ideas, stats, etc.\n\n`;
  body += `## Fichiers analysés (extraits)\n\n`;
  for (const f of all) {
    body += readSnippet(f, MAX_LINES_PER_FILE);
  }

  const systemPrompt = `Tu es un expert UX/UI et architecte front-end. Tu analyses une application Next.js (SocialHub) pour :
1. **Ergonomie et mise en page** : repérer les problèmes d'espacement, hiérarchie visuelle, lisibilité, cohérence des composants (modals, breadcrumbs, empty states), responsive.
2. **Navigation** : clarté du menu, structure des pages, redirections, breadcrumbs, liens internes.
3. **Nettoyage du code** : duplication, composants à extraire, structure des dossiers, nommage, maintenabilité.

Réponds UNIQUEMENT en markdown structuré en français, avec des sections claires et des recommandations actionnables (fichiers concernés quand c'est possible). Pas de préambule hors sujet.`;

  const userPrompt = `Analyse les extraits de code ci-dessous et produis un rapport détaillé (ergonomie, mise en page, navigation, nettoyage code).\n\n${body}`;

  console.log("Appel OpenAI...");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Erreur API OpenAI:", res.status, err);
    process.exit(1);
  }

  const data = await res.json();
  const report = data.choices?.[0]?.message?.content || "Aucune réponse.";
  const outPath = path.join(root, "ANALYSE_ERGO_NAV.md");
  const fullReport = `# Rapport d'analyse – Ergonomie, mise en page, navigation\n\nGénéré le ${new Date().toISOString().slice(0, 10)}\n\n---\n\n${report}`;
  fs.writeFileSync(outPath, fullReport, "utf-8");
  console.log("Rapport écrit dans", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
