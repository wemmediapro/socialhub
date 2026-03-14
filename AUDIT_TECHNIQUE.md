# Audit technique – Projet Social v7 (SocialHub Global V5)

**Date :** 8 mars 2025  
**Dernière mise à jour :** 8 mars 2025 – Audit complet et structuré (sans blocage)

**Répertoire :** `/Users/ahmed/Desktop/social v7`  
**Stack :** Next.js 14, React 18, TypeScript, MongoDB, BullMQ, Zod

---

## Comment lancer l'audit via OpenAI

Un script utilise l'API OpenAI pour régénérer un rapport d'audit à partir du code :

```bash
# Clé API requise
export OPENAI_API_KEY=sk-xxx
npm run audit:openai

# Sortie dans un fichier personnalisé
OPENAI_API_KEY=sk-xxx node scripts/audit-technique-openai.mjs --output mon-audit.md

# Simulation sans appel API
npm run audit:openai:dry
```

Le rapport généré est écrit dans `AUDIT_TECHNIQUE_OPENAI.md` (ou le chemin fourni avec `--output`).

---

## 1. Résumé exécutif

| Critère | État | Commentaire |
|--------|------|-------------|
| **Structure** | ✅ Correcte | Organisation Next.js classique (`src/pages`, `api`, `components`, `lib`, `models`, `services`). |
| **TypeScript** | ⚠️ Faible | `strict: false`, usage d'`any` dans de nombreux fichiers (50+ dans `src`). |
| **Sécurité** | ✅ Corrigée | bcrypt pour les mots de passe, migration au premier login. Zod sur auth/login, users, ideas, collaborations/workflow, posts/workflow. |
| **Validation API** | ⚠️ Partielle | Zod sur plusieurs routes ; d'autres consomment `req.body` sans schéma (voir § 3). |
| **Tests** | ✅ Présents | Vitest configuré, tests pour `lib/password` et `lib/schemas/auth`. |
| **Lint / format** | ✅ Présents | ESLint (next/core-web-vitals + react-hooks), Prettier, CI (lint, format check, test, build). |
| **Performance** | ⚠️ À améliorer | Pas de `next/image` (balises `<img>` partout), peu de `next/dynamic`, usage de `moment`. |
| **Stabilité (blocages)** | ⚠️ À surveiller | Timers nettoyés dans collab/workflow ; d'autres composants à vérifier (Toast, NotificationBell, etc.). |
| **Build / CI** | ✅ OK | GitHub Actions : lint, format check, test, build. |

**Points positifs :** pas de `dangerouslySetInnerHTML` ni `eval`, `.env` ignoré par Git, config réseau centralisée (`networkConfig.ts`).

---

## 2. Risques de blocage et stabilité (sans freeze / crash)

### 2.1 Timers (setTimeout / setInterval)

| Fichier | Usage | Nettoyage au démontage |
|---------|--------|-------------------------|
| `src/pages/collab/index.tsx` | `scrollTimeoutRef` + `setTimeout` | ✅ Ref + clearTimeout dans cleanup |
| `src/pages/workflow.tsx` | `scrollTimeoutRef` + `setTimeout` | ✅ Ref + clearTimeout dans cleanup |
| `src/pages/index.tsx` | `setTimeout` (l.154) | ⚠️ Vérifier si annulé au démontage |
| `src/pages/posts/new.tsx` | `setTimeout` (l.133) | ⚠️ Pas de ref/cleanup visible |
| `src/pages/posts/[id]/edit.tsx` | `setTimeout` (l.128) | ⚠️ Idem |
| `src/components/VideoPreviewCard.tsx` | `timeoutRef` + `setTimeout` | ✅ Ref + clearTimeout |
| `src/components/ExampleErgonomie.tsx` | `setInterval` + `setTimeout` | ⚠️ Vérifier cleanup dans useEffect return |
| `src/components/Toast.tsx` | `setTimeout` (auto-dismiss) | ⚠️ S'assurer que le timer est annulé si le composant est démonté |
| `src/components/NotificationBell.tsx` | `setInterval(loadNotifications, 30000)` | 🔴 Cleanup impératif au démontage (retirer l'interval) |
| `src/pages/oauth-simulator.tsx` | `setInterval` (l.25) | ⚠️ Vérifier cleanup |

**Recommandation :** pour tout `setTimeout` / `setInterval` dans un composant React, stocker l'id dans un `useRef` et appeler `clearTimeout` / `clearInterval` dans le return du `useEffect` (ou du cleanup du même effet).

### 2.2 Erreurs réseau / fetch

- **`src/pages/index.tsx`** : des `fetch` utilisent `.catch(() => ({ ... }))` et avalent l'erreur → échecs réseau silencieux. À remplacer par un affichage d'erreur (toast ou message) et éventuellement un retry.

### 2.3 Promesses et réponses API

- Pas de pattern centralisé pour les réponses d'erreur API (format commun pour le front).
- Vérifier qu'aucune route API ne laisse une promesse non gérée (toujours `try/catch` ou `.catch` et `res.status(500).json(...)`).

### 2.4 Fuites mémoire

- Listeners (resize, scroll) dans les pages lourdes : s'assurer qu'ils sont retirés au démontage (comme pour les timers).

---

## 3. Sécurité

### 3.1 Authentification

- ✅ **bcrypt** : hash à la création/mise à jour utilisateur, comparaison au login.
- ✅ Migration automatique des mots de passe en clair au premier login (`lib/password.ts` + `api/auth/login.ts`).
- ✅ Pas de log contenant des mots de passe.

### 3.2 Validation des entrées (API)

**Avec Zod :**  
`auth/login`, `users` (création/mise à jour), `ideas` (création/mise à jour), `collaborations` (création + workflow), `posts` (création + workflow), `upload/local`, `posts/fetch-stats`, `influencers/collect`.

**Sans schéma Zod (à sécuriser) :**

- `api/collaborations/[id].ts` – PATCH avec `req.body` (status, history, contentUploads, etc.)
- `api/posts/[id].ts` – PATCH avec `req.body` (status, insights, postUrl, etc.)
- `api/ideas/[id].ts` – partie non parsée avant `updateIdeaSchema`
- `api/influencers/[id].ts` – `req.body` direct
- `api/permissions/index.ts` – `req.body.matrix`
- `api/notifications/index.ts` – `Notification.create(req.body)`
- `api/notifications/mark-all-read.ts` – `req.body.userId`
- `api/client/validate.ts` – `req.body` (token, postId, action, comment)
- `api/auth/connect-account.ts` – `req.body` (platform, accountName, accessToken, userId)
- `api/influencers/invite.ts` – `req.body` (email, name, projectId, message)
- `api/influencers/merge.ts` – `req.body` (influencerIds, targetProjectId)
- `api/projects/index.ts` – `Project.create(req.body)`
- `api/projects/[id].ts` – `findByIdAndUpdate(..., req.body)`
- `api/collab/thread/post.ts` – `req.body` (collabId, author, text)
- `api/collab/client/decision.ts` – `req.body` (token, collabId, decision, note)
- `api/influencers/index.ts` – `Influencer.create(req.body)`
- `api/publish/enqueue.ts` – `req.body` (postId, runAt)
- `api/posts/fetch-stats.ts` – `req.body` (url, platform) partiellement validé

**Recommandation :** définir un schéma Zod pour chaque route qui lit `req.body` et utiliser `safeParse`/`parse` avant toute logique métier.

---

## 4. TypeScript et qualité de code

- **tsconfig :** `"strict": false` → pas de stricte null check ni typage strict.
- **`any`** : encore présent dans de nombreux fichiers (collab/index, workflow, influencers, calendar, posts, stats, settings, API routes, etc.). Objectif : interfaces/types dédiés (Post, Collaboration, Project, etc.) et suppression progressive des `any`.
- **`src/lib/db.ts`** : typage global Mongoose correct (`declare global { var _mongoose: ... }`), plus de `(global as any)`.
- **Gestion d'erreurs :** centraliser le format des réponses d'erreur API et éviter les `catch` vides côté client.

---

## 5. Performance

- **Images :** aucune utilisation de `next/image` ; de nombreuses balises `<img>` (collab/index, workflow, index, influencers, calendar, posts, Layout, login). Recommandation : remplacer par `next/image` avec `width`/`height` ou `fill` pour optimiser le chargement.
- **Code splitting :** pas de `next/dynamic` pour les grosses pages (ex. `collab/index.tsx`, `workflow.tsx`). Recommandation : charger ces pages en lazy pour réduire le bundle initial.
- **Moment :** préférer `date-fns` ou `dayjs` pour alléger le bundle (recommandation déjà notée dans l'audit précédent).

---

## 6. Plan d'action priorisé

### Priorité 1 – Critique / sécurité

1. Étendre Zod à toutes les routes listées en § 3.2 (collaborations/[id], posts/[id], notifications, projects, collab/thread, etc.).

### Priorité 2 – Haute (stabilité / pas de blocage)

2. Nettoyer tous les timers : `NotificationBell.tsx` (setInterval), `ExampleErgonomie.tsx`, `Toast.tsx`, `oauth-simulator.tsx`, `posts/new.tsx`, `posts/[id]/edit.tsx`, `index.tsx` – ref + clearTimeout/clearInterval dans le cleanup.
3. Améliorer la gestion des erreurs réseau sur le dashboard (`index.tsx`) : ne pas avaler les erreurs dans les `.catch`, afficher un message ou un toast.

### Priorité 3 – Moyenne

4. Activer `strict: true` progressivement et remplacer les `any` par des types/interfaces.
5. Introduire `next/image` sur les pages qui affichent des médias ; ajouter `next/dynamic` pour les pages lourdes (collab, workflow).
6. Remplacer `moment` par `date-fns` ou `dayjs`.

### Priorité 4 – Basse

7. Découper les grosses pages (collab/index, workflow) en sous-composants et hooks pour la maintenabilité.
8. Vérifier que le script `queue/worker.ts` existe et que la commande `npm run queue` est documentée (ou retirer du `package.json` si non utilisé).

---

*Rapport d'audit technique – Projet Social v7. Pour un rapport généré par OpenAI, exécuter `npm run audit:openai` (OPENAI_API_KEY requis).*
