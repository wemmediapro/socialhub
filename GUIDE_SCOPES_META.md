# 📋 Guide des Scopes OAuth Meta (Facebook/Instagram)

## ⚠️ Problème résolu : Scopes invalides

Les scopes suivants étaient invalides et ont été corrigés :
- ❌ `pages_manage_posts` (nécessite App Review)
- ❌ `instagram_basic` (n'existe plus dans Graph API v19)
- ❌ `instagram_content_publish` (nécessite Instagram Graph API avec App Review)
- ❌ `instagram_manage_insights` (nécessite App Review)

## ✅ Scopes valides utilisés maintenant

### Pour le développement (sans App Review)

```
pages_show_list
pages_read_engagement
pages_read_user_content
```

Ces scopes permettent de :
- ✅ Lister les pages Facebook de l'utilisateur
- ✅ Lire les statistiques d'engagement des pages
- ✅ Lire le contenu utilisateur sur les pages
- ✅ Accéder aux comptes Instagram Business connectés aux pages

## 📝 Comment Instagram fonctionne

Instagram utilise l'**Instagram Graph API** qui nécessite :
1. Une **Page Facebook** connectée
2. Un **compte Instagram Business** lié à cette page
3. Les permissions Instagram sont automatiquement accordées via la page Facebook

### Pour publier sur Instagram

Pour publier sur Instagram, vous avez besoin de :
- Une page Facebook avec un compte Instagram Business connecté
- Les permissions de base listées ci-dessus suffisent pour accéder à Instagram via la page

## 🔧 Ajouter des permissions supplémentaires

### Pour la production (nécessite App Review)

Si vous avez besoin de publier sur Facebook ou Instagram, vous devrez :

1. **Demander les permissions dans Facebook App Settings** :
   - Allez dans "App Review" > "Permissions and Features"
   - Demandez les permissions nécessaires :
     - `pages_manage_posts` - Pour publier sur Facebook
     - `instagram_content_publish` - Pour publier sur Instagram
     - `pages_manage_metadata` - Pour gérer les métadonnées

2. **Soumettre votre app à la revue Facebook** :
   - Fournissez une vidéo de démonstration
   - Expliquez l'utilisation de chaque permission
   - Attendez l'approbation (peut prendre plusieurs jours)

### Pour le développement

Les permissions de base suffisent pour :
- ✅ Connecter les comptes Facebook/Instagram
- ✅ Lire les statistiques
- ✅ Accéder aux informations des pages

## 🧪 Tester maintenant

1. Redémarrez l'application si nécessaire
2. Visitez : `http://localhost:3000/api/auth/meta/login`
3. L'autorisation devrait maintenant fonctionner sans erreur de scopes invalides

## 📚 Ressources

- [Facebook Login Permissions](https://developers.facebook.com/docs/facebook-login/permissions)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [App Review Process](https://developers.facebook.com/docs/app-review)


