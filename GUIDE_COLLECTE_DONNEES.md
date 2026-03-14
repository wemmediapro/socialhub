# 📊 Guide de Configuration - Collecte de Données des Réseaux Sociaux

Ce guide explique comment configurer la collecte automatique des vraies données des influenceurs depuis les réseaux sociaux.

## 🎯 Plateformes Supportées

### ✅ YouTube (Recommandé - Gratuit)
- **API** : YouTube Data API v3
- **Coût** : Gratuit (10,000 requêtes/jour)
- **Configuration** : Facile

### ⚠️ Facebook (Nécessite Token)
- **API** : Facebook Graph API
- **Coût** : Gratuit (avec limitations)
- **Configuration** : Moyenne

### ⚠️ Instagram (Limité)
- **API** : Instagram Basic Display API ou RapidAPI
- **Coût** : Variable (RapidAPI payant)
- **Configuration** : Complexe

### ⚠️ TikTok (Limité)
- **API** : TikTok Official API ou RapidAPI
- **Coût** : Variable
- **Configuration** : Complexe

---

## 🔧 Configuration YouTube (Recommandé)

### Étape 1 : Créer un Projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API YouTube Data API v3 :
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "YouTube Data API v3"
   - Cliquez sur "Enable"

### Étape 2 : Créer une Clé API

1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "API Key"
3. Copiez la clé API générée

### Étape 3 : Configurer dans .env

```env
YOUTUBE_API_KEY=votre_clé_api_ici
```

### Étape 4 : Tester

1. Ouvrez la page des influenceurs
2. Ajoutez un lien YouTube (ex: `https://www.youtube.com/@channelname`)
3. Cliquez sur "Collecte..."
4. Les données réelles seront collectées !

---

## 🔧 Configuration Facebook

### Étape 1 : Créer une App Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Créez une nouvelle app
3. Ajoutez le produit "Graph API"

### Étape 2 : Obtenir un Access Token

1. Allez dans "Tools" > "Graph API Explorer"
2. Sélectionnez votre app
3. Générez un token avec les permissions nécessaires :
   - `pages_read_engagement`
   - `pages_read_user_content`
   - `public_profile`

### Étape 3 : Configurer dans .env

```env
FACEBOOK_ACCESS_TOKEN=votre_access_token_ici
```

**Note** : Les tokens Facebook expirent. Pour une solution permanente, utilisez un token de longue durée ou configurez OAuth.

---

## 🔧 Configuration RapidAPI (Instagram, TikTok, etc.)

### Étape 1 : Créer un Compte RapidAPI

1. Allez sur [RapidAPI](https://rapidapi.com/)
2. Créez un compte gratuit
3. Souscrivez aux APIs nécessaires :
   - Instagram Scraper API
   - TikTok Scraper API

### Étape 2 : Obtenir la Clé API

1. Allez dans votre dashboard RapidAPI
2. Copiez votre clé API (X-RapidAPI-Key)

### Étape 3 : Configurer dans .env

```env
RAPIDAPI_KEY=votre_rapidapi_key_ici
```

### Étape 4 : Modifier le Code (si nécessaire)

Le code dans `src/pages/api/influencers/collect.ts` contient des exemples commentés pour utiliser RapidAPI. Décommentez les sections correspondantes.

---

## ⚠️ Limitations et Alternatives

### Instagram
- **Problème** : Instagram limite fortement le scraping
- **Solutions** :
  1. Utiliser RapidAPI (payant mais fiable)
  2. Utiliser Instagram Basic Display API (nécessite OAuth utilisateur)
  3. Saisie manuelle des données

### TikTok
- **Problème** : Pas d'API publique gratuite
- **Solutions** :
  1. Utiliser RapidAPI
  2. Saisie manuelle des données

### Facebook
- **Problème** : Les tokens expirent
- **Solution** : Configurer OAuth pour obtenir des tokens de longue durée

---

## 🧪 Tester la Configuration

### Test YouTube

```bash
curl -X POST http://localhost:3000/api/influencers/collect \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "url": "https://www.youtube.com/@channelname"
  }'
```

### Test Facebook

```bash
curl -X POST http://localhost:3000/api/influencers/collect \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "url": "https://www.facebook.com/pagename"
  }'
```

---

## 📝 Notes Importantes

1. **Respect des ToS** : Assurez-vous de respecter les conditions d'utilisation de chaque plateforme
2. **Rate Limiting** : Les APIs ont des limites de requêtes. Ne faites pas trop de requêtes simultanées.
3. **Données Manuelles** : Si les APIs ne sont pas configurées, vous pouvez toujours saisir les données manuellement dans l'interface.

---

## 🆘 Dépannage

### Erreur "API access required"
- Vérifiez que la clé API est correctement configurée dans `.env`
- Redémarrez l'application après avoir modifié `.env`

### Erreur "Invalid API key"
- Vérifiez que la clé API est valide et active
- Pour YouTube, vérifiez que l'API est activée dans Google Cloud Console

### Données non collectées
- Vérifiez les logs du serveur pour plus de détails
- Assurez-vous que l'URL du profil est correcte
- Certaines plateformes nécessitent des permissions spéciales

---

## 📚 Ressources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [RapidAPI Marketplace](https://rapidapi.com/marketplace)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)


