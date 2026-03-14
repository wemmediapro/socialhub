# 🧪 Guide de Test - Configuration Meta (Facebook/Instagram)

Ce guide vous explique comment tester votre configuration `META_APP_ID` et `META_APP_SECRET`.

## 📋 Prérequis

1. ✅ Avoir ajouté `META_APP_ID` et `META_APP_SECRET` dans votre fichier `.env`
2. ✅ Avoir configuré `META_REDIRECT_URI` (ex: `http://localhost:3000/api/auth/meta/callback`)
3. ✅ Avoir redémarré l'application après modification du `.env`

---

## 🧪 Méthode 1 : Test Automatique (Recommandé)

### Étape 1 : Accéder à l'endpoint de test

Ouvrez votre navigateur et allez sur :

```
http://localhost:3000/api/test/meta-config
```

Ou via curl :

```bash
curl http://localhost:3000/api/test/meta-config
```

### Étape 2 : Analyser les résultats

L'endpoint effectue plusieurs tests :

1. **Variables d'environnement** : Vérifie que toutes les variables sont présentes
2. **Format App ID** : Vérifie que l'App ID est au bon format (numérique)
3. **Format App Secret** : Vérifie que l'App Secret est au bon format
4. **Connexion API Facebook** : Teste la connexion avec Facebook Graph API
5. **URL de redirection** : Vérifie que l'URL de redirection est valide

### Exemple de réponse réussie :

```json
{
  "summary": {
    "total": 5,
    "success": 5,
    "errors": 0,
    "warnings": 0,
    "overall": "success"
  },
  "results": [
    {
      "test": "Variables d'environnement",
      "status": "success",
      "message": "✅ Toutes les variables sont configurées"
    },
    {
      "test": "Connexion API Facebook",
      "status": "success",
      "message": "✅ Connexion réussie ! Les credentials sont valides",
      "data": {
        "appName": "Mon App",
        "appCategory": "Business"
      }
    }
  ],
  "nextSteps": [
    "✅ Configuration valide !",
    "Vous pouvez maintenant tester l'authentification OAuth"
  ]
}
```

---

## 🧪 Méthode 2 : Test OAuth Complet

### Étape 1 : Lancer le flux OAuth

Visitez dans votre navigateur :

```
http://localhost:3000/api/auth/meta/login
```

Cela va :
1. Rediriger vers Facebook pour l'autorisation
2. Vous demander de vous connecter avec votre compte Facebook
3. Vous demander les permissions pour accéder à vos pages Facebook et Instagram
4. Rediriger vers `/api/auth/meta/callback` après autorisation

### Étape 2 : Vérifier les comptes connectés

Après l'autorisation, vérifiez que les comptes sont bien connectés :

```
http://localhost:3000/api/test/facebook
```

Cet endpoint affiche :
- Les comptes Facebook connectés
- Les comptes Instagram connectés
- Le statut de chaque compte (actif/erreur)

---

## 🔧 Configuration dans Facebook Developers

### 1. Vérifier l'App ID et App Secret

1. Allez sur [Facebook Developers](https://developers.facebook.com/apps/)
2. Sélectionnez votre application
3. Allez dans "Settings" > "Basic"
4. Vérifiez que :
   - **App ID** correspond à `META_APP_ID` dans votre `.env`
   - **App Secret** correspond à `META_APP_SECRET` dans votre `.env`

### 2. Configurer l'URL de redirection

1. Allez dans "Settings" > "Basic"
2. Dans "Valid OAuth Redirect URIs", ajoutez :
   - Pour développement : `http://localhost:3000/api/auth/meta/callback`
   - Pour production : `https://votredomaine.com/api/auth/meta/callback`

### 3. Ajouter les produits nécessaires

Assurez-vous d'avoir ajouté ces produits dans votre app :
- ✅ Facebook Login
- ✅ Instagram Basic Display
- ✅ Instagram Graph API (si vous voulez publier)

### 4. Configurer les permissions

Dans "App Review" > "Permissions and Features", demandez :
- `pages_show_list` - Pour lister les pages Facebook
- `pages_manage_posts` - Pour publier sur Facebook
- `pages_read_engagement` - Pour lire les statistiques
- `instagram_basic` - Pour accéder à Instagram
- `instagram_content_publish` - Pour publier sur Instagram
- `instagram_manage_insights` - Pour les statistiques Instagram

**Note** : Certaines permissions nécessitent une revue par Facebook. Pour le développement, vous pouvez les tester avec des comptes de test.

---

## 🐛 Dépannage

### Erreur : "Invalid App ID or App Secret"

**Solution** :
1. Vérifiez que `META_APP_ID` et `META_APP_SECRET` sont corrects dans `.env`
2. Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
3. Redémarrez l'application après modification du `.env`

### Erreur : "Redirect URI mismatch"

**Solution** :
1. Vérifiez que `META_REDIRECT_URI` dans `.env` correspond exactement à l'URL configurée dans Facebook App Settings
2. L'URL doit être exactement la même (pas d'espace, pas de slash final si non configuré)

### Erreur : "App not in development mode"

**Solution** :
1. Allez dans Facebook App Settings
2. Changez le mode de l'app en "Development Mode"
3. Ajoutez des utilisateurs de test dans "Roles" > "Test Users"

### Erreur : "Permissions not granted"

**Solution** :
1. Vérifiez que vous avez demandé les bonnes permissions dans Facebook App Settings
2. Pour le développement, utilisez des comptes de test
3. Pour la production, soumettez les permissions à la revue Facebook

---

## ✅ Checklist de Test

- [ ] Variables `META_APP_ID` et `META_APP_SECRET` configurées dans `.env`
- [ ] Variable `META_REDIRECT_URI` configurée dans `.env`
- [ ] Application redémarrée après modification du `.env`
- [ ] Test `/api/test/meta-config` passe avec succès
- [ ] Test OAuth `/api/auth/meta/login` fonctionne
- [ ] Comptes Facebook/Instagram connectés visibles dans `/api/test/facebook`
- [ ] URL de redirection configurée dans Facebook App Settings

---

## 📚 Ressources

- [Facebook Developers Documentation](https://developers.facebook.com/docs/)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [OAuth 2.0 Flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)

---

## 🎯 Prochaines Étapes

Une fois la configuration testée et validée :

1. ✅ Testez la publication sur Facebook
2. ✅ Testez la publication sur Instagram
3. ✅ Configurez les comptes pour la production
4. ✅ Soumettez les permissions à la revue Facebook (si nécessaire)


