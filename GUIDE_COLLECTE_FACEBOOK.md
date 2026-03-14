# 📘 Guide - Collecte de Données Facebook

## ⚠️ Problème : App Access Token vs User Access Token

### Le problème

L'**App Access Token** (généré automatiquement avec `META_APP_ID` et `META_APP_SECRET`) a des **limitations importantes** :
- ❌ Ne peut pas accéder aux données des pages publiques
- ❌ Ne peut pas lire les followers_count des pages
- ✅ Peut seulement accéder aux informations de base de l'app

### La solution

Pour collecter les vraies données des pages Facebook publiques, vous devez utiliser un **User Access Token** obtenu via **OAuth**.

## 🔧 Solution : Connecter un compte via OAuth

### Étape 1 : Connecter votre compte Facebook

1. Visitez dans votre navigateur :
   ```
   http://localhost:3000/api/auth/meta/login
   ```

2. Connectez-vous avec votre compte Facebook

3. Autorisez l'application à accéder à vos pages

4. Les comptes seront automatiquement sauvegardés dans la base de données

### Étape 2 : Vérifier les comptes connectés

Visitez :
```
http://localhost:3000/api/test/facebook
```

Vous devriez voir vos pages Facebook connectées.

### Étape 3 : Utiliser les comptes connectés pour la collecte

Une fois les comptes connectés, le système pourra :
- ✅ Accéder aux données de vos pages
- ✅ Collecter les followers_count
- ✅ Lire les statistiques d'engagement

## 📝 Note importante

**Pour collecter les données d'une page Facebook publique** (comme "Omardizer") :

1. **Option 1 (Recommandée)** : Connecter votre compte Facebook via OAuth
   - Le système pourra alors accéder aux pages que vous gérez
   - Ou aux pages publiques si vous avez les permissions

2. **Option 2** : Saisir les données manuellement
   - Si vous ne pouvez pas connecter de compte
   - Les données peuvent être saisies directement dans le formulaire

## 🔍 Pourquoi l'App Access Token ne fonctionne pas ?

Facebook limite l'accès aux données des pages publiques pour des raisons de sécurité et de respect de la vie privée. Même si une page est publique, l'API nécessite :
- Un User Access Token avec les bonnes permissions
- Ou un Page Access Token si vous gérez la page

## ✅ Prochaines étapes

1. Connectez votre compte Facebook via `/api/auth/meta/login`
2. Testez à nouveau la collecte de données
3. Les données devraient maintenant être collectées correctement


