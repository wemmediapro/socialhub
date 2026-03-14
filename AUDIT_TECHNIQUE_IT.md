# Audit tecnico – Progetto Sociale v7 (SocialHub Global V5)

**Data :** 7 marzo 2025  
**Ultime correzioni :** 7 marzo 2025 (Priorità 1 a 4 parzialmente applicate)

**Directory :** `/Users/ahmed/Desktop/social v7`  
**Stack :** Next.js 14, React 18, TypeScript, MongoDB, BullMQ, Zod

---

## Correzioni applicate (7 marzo 2025)

- **Priorità 1 (sicurezza)** : bcrypt per le password (hash alla creazione/aggiornamento, confronto al login). Migrazione automatica delle password in chiaro al primo login. Zod su auth/login, users (creazione/aggiornamento), ideas (creazione/aggiornamento), collaborations/workflow, posts/workflow. Rimozione dei log contenenti password.
- **Priorità 2 (JS/TS)** : Pulizia dei `setTimeout` in `collab/index.tsx` e `workflow.tsx` (ref + clearTimeout al smontaggio). Tipizzazione globale Mongoose in `lib/db.ts` (niente più `(global as any)`).
- **Priorità 3** : ESLint (next/core-web-vitals + react-hooks/exhaustive-deps), Prettier, `src/lib/networkConfig.ts` (networkColors, networkEmojis, statusColors), utilizzo di `networkColors` in `stats.tsx`. *Resta da fare :* `next/image` e `next/dynamic` sulle pagine pesanti, sostituzione di moment.
- **Priorità 4** : Vitest configurato, test unitari per `lib/password` e `lib/schemas/auth`. CI GitHub Actions (lint, controllo formato, test, build).

---

## 1. Riepilogo esecutivo

| Criterio | Stato | Commento |
|--------|------|-------------|
| **Struttura** | ✅ Corretta | Organizzazione Next.js classica (`src/pages`, `api`, `components`, `lib`, `models`, `services`). |
| **TypeScript** | ⚠️ Basso | `strict: false`, uso massiccio di `any` (80+ occorrenze in `src`). |
| **Sicurezza** | 🔴 Critica | Password in chiaro (confronto diretto, niente bcrypt). Segreti in `.env` (fuori repo tramite `.gitignore`). |
| **Validazione API** | ⚠️ Parziale | Zod solo su `POST /api/posts`, `POST /api/collaborations`; la maggior parte delle rotte consuma `req.body` senza schema. |
| **Test** | 🔴 Assenti | Nessun test unitario/e2e nel codice applicativo. |
| **Lint / formato** | 🔴 Assenti | Nessun ESLint né Prettier alla radice del progetto. |
| **Performance** | ⚠️ Da migliorare | Nessun `next/image` (tag `<img>` ovunque), pochi import dinamici, pagine pesanti (es. `collab/index.tsx`, `workflow.tsx`). |

**Punti positivi :** cleanup dei listener (resize, intervals, timeouts) nei componenti interessati, niente `dangerouslySetInnerHTML`, `.env` ignorato da Git.

---

## 2. Problemi JavaScript / TypeScript

### 3.1 `any` e tipizzazione debole

- **tsconfig** : `"strict": false` → nessun controllo null rigoroso né tipizzazione rigorosa.
- **`any`** : numerose occorrenze in `src` (collab/index.tsx, workflow.tsx, influencers.tsx, calendar.tsx, posts/index.tsx, stats.tsx, index.tsx).
- **`src/lib/db.ts`** : `(global as any)._mongoose` per la cache.

**Raccomandazione :** attivare `strict: true` progressivamente e sostituire gli `any` con tipi/interfacce (Post, Collaboration, Project, ecc.).

### 3.2 Gestione degli errori

- In `index.tsx`, i `fetch` hanno `.catch(() => ({ ... }))` che inghiottono l'errore → errori di rete silenziosi.
- Nessun pattern centralizzato per formattare le risposte di errore API.

### 3.3 Perdite di memoria / pulizia

- **Da correggere :** `collab/index.tsx` e `workflow.tsx` – `setTimeout` senza `clearTimeout` nel return del `useEffect` se il componente può essere smontato prima dell'esecuzione.

### 3.4 Codice duplicato

- **Config ripetute :** `networkIcons`, `networkColors`, `statusConfig` duplicati in più pagine → estrarre in `src/lib/networkConfig.ts`.
- **Pagine molto lunghe :** `collab/index.tsx` e `workflow.tsx` → suddividere in sotto-componenti e hook.

---

## 3. Sicurezza

### 🔴 Critica : autenticazione

- **`src/pages/api/auth/login.ts`** : confronto `user.password !== password` in chiaro.
- **`src/models/User.ts`** : campo `password` memorizzato tale e quale.
- **Raccomandazione :** bcrypt (o argon2) : hash all'iscrizione, `compare()` al login.

### Validazione degli input (API)

- **Con Zod :** `POST /api/posts`, `POST /api/collaborations` solo.
- **Senza schema :** collaborations/[id], posts/[id], workflow, auth/login, ideas, users, notifications, influencers, ecc.

---

## 4. Performance

- **Immagini :** nessun `next/image`; solo `<img>`.
- **Code splitting :** nessun `next/dynamic` per le pagine pesanti.
- **Moment :** preferire `date-fns` o `dayjs`.

---

## 5. Piano d'azione prioritario

### Priorità 1 – Critica (sicurezza)
- Implementare bcrypt per le password.
- Estendere Zod a tutte le rotte che leggono `req.body`.

### Priorità 2 – Alta (JS/TS)
- Attivare `strict: true` e ridurre gli `any`.
- Pulizia dei timer nei useEffect (collab, workflow).
- `useCallback` per le dipendenze dei useEffect.

### Priorità 3 – Media
- ESLint + Prettier; config condivisa `networkConfig.ts`; `next/image`; `next/dynamic`; sostituire moment.

### Priorità 4 – Bassa
- Test (Jest/Vitest); CI (GitHub Actions); suddivisione delle pagine pesanti.

---

*Rapporto generato nell'ambito dell'audit tecnico del progetto Social v7.*