# 🚀 Guide Rapide - SocialHub Global V5

## Démarrage Ultra-Rapide

```bash
# Démarrer tout en une commande
./start.sh
```

Ouvrez votre navigateur: **http://localhost:3000**

## Arrêt

```bash
# Arrêter tous les services
./stop.sh
```

## Commandes Principales

| Commande | Description |
|----------|-------------|
| `./start.sh` | Démarre tous les services |
| `./stop.sh` | Arrête tous les services |
| `npm run dev` | Next.js seulement |
| `npm run queue` | Worker de publication |
| `npm run insights` | Worker analytics |

## Services

- 🌐 **Application**: http://localhost:3000
- 📦 **MongoDB**: localhost:27017
- 🔄 **Redis**: localhost:6379

## Pages Principales

- **Dashboard**: http://localhost:3000
- **Créer un post**: http://localhost:3000/posts
- **Calendrier**: http://localhost:3000/calendar-pro
- **Collaborations**: http://localhost:3000/collab

## Configuration

Éditez `.env` pour configurer:
- Cloudinary (upload)
- Meta/Facebook API
- TikTok API

## Logs

Les logs sont dans `./logs/`:
- `next.log` - Application Next.js
- `queue.log` - Worker de publication
- `mongodb_data/mongo.log` - MongoDB

## Documentation Complète

Voir `SOLUTION_COMPLETE.md` pour la documentation détaillée.

---

**Architecture**: TypeScript + Next.js 14 + MongoDB + Redis + TSX
