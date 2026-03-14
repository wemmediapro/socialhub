# 🧪 Guide de Test et Déploiement - Droits Admin Workflow

## ✅ Modifications Locales Effectuées

Toutes les modifications sont **commitées localement** et prêtes à être testées.

### Commits Créés :
1. `9d1c240` - feat: Ajout droits complets admin dans workflow
2. `bb4935b` - docs: Documentation modifications droits admin workflow

## 🧪 Tests à Effectuer AVANT de Pousser sur le Serveur

### Prérequis
```bash
# Démarrer l'application en local
npm run dev
```

### Test 1 : Connexion Admin
1. Se connecter avec un compte admin
2. Aller dans `/workflow`
3. Vérifier que tous les posts sont visibles

### Test 2 : Upload de Médias (Admin)
- [ ] Ouvrir un post en statut `DRAFT`
- [ ] Vérifier que le bouton "Ajouter" (violet) est visible
- [ ] Uploader une photo → Vérifier qu'elle apparaît
- [ ] Ouvrir un post en statut `CLIENT_REVIEW`
- [ ] Vérifier que le bouton "Ajouter" est visible
- [ ] Uploader une photo → Vérifier qu'elle apparaît
- [ ] Répéter pour tous les autres statuts

### Test 3 : Suppression de Médias (Admin)
- [ ] Sur un post avec des médias
- [ ] Vérifier que le bouton X est visible sur chaque média
- [ ] Cliquer sur X → Vérifier que le média est supprimé

### Test 4 : Modification de Posts (Admin)
- [ ] Sur un post `DRAFT` → Vérifier bouton "Modifier"
- [ ] Sur un post `PENDING_GRAPHIC` → Vérifier bouton "Modifier"
- [ ] Sur un post `CLIENT_REVIEW` → Vérifier bouton "Modifier"
- [ ] Sur un post `SCHEDULED` → Vérifier bouton "Modifier"
- [ ] Cliquer sur "Modifier" → Vérifier redirection vers page d'édition

### Test 5 : Suppression de Posts (Admin)
- [ ] Sur un post `DRAFT` → Vérifier bouton "Supprimer"
- [ ] Sur un post `PENDING_GRAPHIC` → Vérifier bouton "Supprimer"
- [ ] Sur un post `CLIENT_REVIEW` → Vérifier bouton "Supprimer"
- [ ] Cliquer sur "Supprimer" → Confirmer → Vérifier suppression

### Test 6 : Actions Workflow (Admin)
- [ ] **Draft** : Vérifier boutons "Modifier" et "Supprimer"
- [ ] **PENDING_GRAPHIC** : Vérifier bouton "Soumettre au Client"
- [ ] **CLIENT_REVIEW** : Vérifier boutons "Approuver" et "Rejeter"
- [ ] **PENDING_CORRECTION** : Vérifier bouton "Resoumettre"
- [ ] **SCHEDULED** : Vérifier boutons "Modifier" et "Supprimer"

### Test 7 : Vérification Autres Rôles
- [ ] Se connecter en tant que **graphiste**
- [ ] Vérifier que les permissions graphistes fonctionnent toujours
- [ ] Se connecter en tant que **client**
- [ ] Vérifier que les permissions client fonctionnent toujours
- [ ] Se connecter en tant que **digital_creative**
- [ ] Vérifier que les permissions digital fonctionnent toujours

## ✅ Checklist Avant Déploiement

- [ ] Tous les tests ci-dessus effectués
- [ ] Aucune erreur dans la console du navigateur
- [ ] Aucune erreur dans la console du serveur
- [ ] Les fonctionnalités admin fonctionnent correctement
- [ ] Les autres rôles ne sont pas affectés
- [ ] Les modifications visuelles sont correctes

## 🚀 Déploiement sur le Serveur

### Étape 1 : Pousser vers GitHub
```bash
# Vérifier l'état
git status

# Pousser les commits
git push origin main
```

### Étape 2 : Sur le Serveur
```bash
# Se connecter au serveur
ssh votre-serveur

# Aller dans le dossier du projet
cd ~/socialhub_global_v5

# Récupérer les modifications
git pull origin main

# Installer les dépendances (si nécessaire)
npm install

# Build l'application
npm run build

# Redémarrer l'application
pm2 restart socialhub-app

# Vérifier les logs
pm2 logs socialhub-app --lines 50
```

### Étape 3 : Vérification sur le Serveur
- [ ] Se connecter en admin sur le serveur
- [ ] Tester l'upload de médias
- [ ] Tester la modification de posts
- [ ] Tester les actions workflow
- [ ] Vérifier qu'il n'y a pas d'erreurs

## 📊 Résumé des Droits Admin

| Action | Admin | Graphiste | Client | Digital |
|--------|-------|-----------|--------|---------|
| Voir tous les posts | ✅ | ❌ (seulement assignés) | ✅ | ✅ |
| Upload médias | ✅ (tous statuts) | ✅ (PENDING_GRAPHIC) | ❌ | ❌ |
| Supprimer médias | ✅ (tous statuts) | ✅ (PENDING_GRAPHIC) | ❌ | ❌ |
| Modifier posts | ✅ (tous statuts) | ❌ | ❌ | ✅ (DRAFT) |
| Supprimer posts | ✅ (tous statuts) | ❌ | ✅ (DRAFT) | ✅ (DRAFT) |
| Valider draft | ✅ | ❌ | ✅ | ❌ |
| Soumettre au client | ✅ | ✅ (PENDING_GRAPHIC) | ❌ | ❌ |
| Approuver/Rejeter | ✅ | ❌ | ✅ (CLIENT_REVIEW) | ❌ |
| Resoumettre | ✅ | ✅ (PENDING_CORRECTION) | ❌ | ❌ |

## ⚠️ Notes Importantes

- Les modifications sont **locales** pour l'instant
- Tester **avant** de pousser sur le serveur
- L'admin a maintenant **tous les droits** dans le workflow
- Les autres rôles conservent leurs permissions normales
- Les boutons admin ont un style distinctif (violet)

## 🐛 En Cas de Problème

Si vous rencontrez des erreurs :
1. Vérifier les logs : `pm2 logs socialhub-app`
2. Vérifier la console du navigateur (F12)
3. Vérifier que tous les fichiers sont bien commités
4. Revenir en arrière si nécessaire : `git reset --hard HEAD~1`





