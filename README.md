# 🚀 SocialHub Global V5

**Plateforme collaborative de gestion et d'automatisation du contenu digital**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Vue d'ensemble

SocialHub Global centralise **tout le workflow social media** : de la proposition d'idées à la publication automatique, en passant par la validation client et le reporting.

### 🎯 Objectif

Réunir **équipes internes**, **clients** et **créatifs** sur une seule plateforme pour fluidifier le processus de production de contenu digital.

---

## ✨ Fonctionnalités principales

### 🏗️ Gestion de projets
- Création de projets par marque/client/campagne
- Association des réseaux sociaux (Facebook, Instagram, TikTok)
- Calendrier éditorial automatique
- Gestion d'équipe avec rôles

### 💡 Workflow collaboratif
- **Proposition d'idées** par les digital marketers
- **Validation client** via interface dédiée
- **Production créative** avec suivi transparent
- **Commentaires et historique** complets

### 📅 Calendrier éditorial
- Vue drag & drop moderne
- Multi-plateformes (FB, IG, TikTok)
- Filtres avancés (statut, type, plateforme)
- Synchronisation automatique

### 🚀 Publication automatique
- File d'attente intelligente (BullMQ + Redis)
- Publication via API Meta & TikTok
- Retry automatique en cas d'erreur
- Programmation au bon moment

### 📊 Analytics & Reporting
- Insights en temps réel (impressions, reach, engagement)
- Tableaux de bord par projet
- Export PDF/Excel
- Mise à jour automatique

---

## 🔄 Flux de travail

```
1. 🏗️  Création projet → Association réseaux sociaux
2. 💡 Proposition idée → Brief complet avec visuels de référence
3. ✅ Validation client → Approbation/Commentaires/Refus
4. 🎨 Production → Création des visuels/vidéos
5. 📅 Planification → Ajout au calendrier
6. 🚀 Publication → Automatique via API
7. 📊 Reporting → Insights et métriques
```

---

## 🛠️ Stack technique

```
Frontend:    Next.js 14 + React 18 + TypeScript
Backend:     Next.js API Routes + TypeScript
Database:    MongoDB 6.0.16
Queue:       Redis + BullMQ
Workers:     TSX (TypeScript runtime)
Upload:      Cloudinary
APIs:        Meta Graph v19, TikTok Upload API
```

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
# 1. Cloner le repo
git clone [repo-url]

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env

# 4. Démarrer les services
./start.sh
```

### Accès

```
Application:  http://localhost:3000
Login:        http://localhost:3000/login
Projets:      http://localhost:3000/projects
```

**En cas de 404 sur http://localhost:3000/** : un autre processus utilise déjà le port 3000. Soit arrêtez l'autre application (ou `npx kill-port 3000`), puis relancez `npm run dev` ; soit ouvrez l'URL affichée dans le terminal (ex. http://localhost:3002) lorsque Next.js indique « Port 3000 is in use ».

---

## 📁 Structure du projet

```
socialhub_global_v5/
├── src/
│   ├── pages/              # Pages Next.js
│   │   ├── api/           # API routes
│   │   ├── projects/      # Gestion projets
│   │   ├── login.tsx      # Authentification
│   │   └── ...
│   ├── models/            # Schémas MongoDB
│   ├── lib/               # Utilitaires
│   ├── services/          # Services métier
│   └── styles/            # CSS global
├── queue/                 # Workers TypeScript
│   ├── worker.ts         # Publication
│   └── insights.ts       # Analytics
├── start.sh              # Script de démarrage
└── stop.sh               # Script d'arrêt
```

---

## 🎯 Pages principales

| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | Authentification |
| Dashboard | `/` | Vue d'ensemble |
| Projets | `/projects` | Liste des projets |
| Nouveau projet | `/projects/new` | Créer un projet |
| Détail projet | `/projects/[id]` | Gérer un projet |
| Collaborations | `/collab` | Propositions d'idées |
| Posts | `/posts` | Créer un post |
| Calendrier | `/calendar-pro` | Planification |
| Client | `/client?token=...` | Espace client |

---

## 🔑 Variables d'environnement

```env
# Analyse solution (script npm run analyze)
OPENAI_API_KEY=sk-xxx   # Optionnel, pour générer ANALYSE_ERGO_NAV.md

# MongoDB
MONGODB_URI=mongodb://localhost:27017/socialhub

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_UPLOAD_PRESET=xxx

# Meta (Facebook/Instagram)
META_APP_ID=xxx
META_APP_SECRET=xxx
META_REDIRECT_URI=http://localhost:3000/api/auth/meta/callback

# TikTok
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=xxx
TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/tiktok/callback
```

---

## 🧪 Commandes

```bash
# Développement
npm run dev              # Démarrer Next.js
npm run queue           # Worker publication
npm run insights        # Worker analytics

# Analyse solution (ergonomie, mise en page, navigation)
# Définir OPENAI_API_KEY dans .env puis :
npm run analyze         # Génère ANALYSE_ERGO_NAV.md

# Production
npm run build           # Build production
npm start              # Lancer en production

# Utilitaires
./start.sh             # Tout démarrer
./stop.sh              # Tout arrêter
```

---

## 📊 Fonctionnalités avancées

### Gestion multi-projets
- Projets illimités
- Isolation complète des données
- Équipes dédiées par projet

### Automatisation complète
- Publication programmée
- Retry intelligent
- Notifications automatiques
- Insights auto-refresh

### Interface moderne
- Design glassmorphism
- Animations fluides
- 100% responsive
- Dark mode ready

---

## 🔐 Sécurité

- OAuth 2.0 (Meta, TikTok)
- Token-based auth
- Validation Zod
- Historique complet
- HTTPS en production

---

## 📚 Documentation

- [Présentation complète](PROJECT_PRESENTATION.md)
- [Solution technique](SOLUTION_COMPLETE.md)
- [Guide rapide](GUIDE_RAPIDE.md)
- [Objectifs & Réalisation](OBJECTIF_ET_REALISATION.md)

---

## 🤝 Contribuer

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

MIT License - voir [LICENSE](LICENSE)

---

## 👥 Équipe

Développé avec ❤️ pour révolutionner la gestion de contenu digital

---

## 🚀 Roadmap

- [x] Gestion de projets
- [x] Association réseaux sociaux
- [x] Calendrier drag & drop
- [x] Publication automatique
- [x] Analytics & Insights
- [ ] Templates réutilisables
- [ ] IA pour suggestions
- [ ] App mobile
- [ ] API publique

---

**Made with** ⚡ **TypeScript + Next.js + MongoDB**
