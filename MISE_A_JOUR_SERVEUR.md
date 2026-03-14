# 🔄 Mise à Jour du Serveur - Récupération des Modifications

## ❌ Problème
La version en ligne (serveur) n'a pas les modifications de la version locale :
- ❌ Pas de calendrier dans le dashboard
- ❌ Sélecteur de langue non amélioré
- ❌ Pas de traductions italiennes

## ✅ Solution : Récupérer les Modifications sur le Serveur

### 📋 Checklist Avant de Commencer

```bash
# Sur le serveur, vérifier l'état actuel
cd ~/socialhub_global_v5
git status
git log --oneline -5
```

### 🔄 Étape 1 : Sauvegarder les Modifications Locales (si nécessaire)

```bash
# Si vous avez des modifications locales à garder
git stash

# Ou si vous voulez écraser les modifications locales
git checkout -- package-lock.json package.json
```

### ⬇️ Étape 2 : Récupérer les Modifications

```bash
# Récupérer toutes les modifications depuis GitHub
git fetch origin

# Voir les différences
git log HEAD..origin/main --oneline

# Faire le pull
git pull origin main
```

### 📦 Étape 3 : Installer les Nouvelles Dépendances

```bash
# Installer les dépendances mises à jour
npm install

# Vérifier qu'il n'y a pas d'erreurs
npm audit
```

### 🔄 Étape 4 : Redémarrer l'Application

```bash
# Si vous utilisez PM2
pm2 restart socialhub-app

# Vérifier les logs
pm2 logs socialhub-app --lines 50

# Vérifier le statut
pm2 status
```

### ✅ Étape 5 : Vérifier que les Modifications Sont Présentes

1. **Vérifier le sélecteur de langue** :
   - Ouvrez l'application dans le navigateur
   - Regardez en haut à droite
   - Vous devriez voir "🇫🇷 Français" ou "🇮🇹 Italiano"

2. **Vérifier le calendrier** :
   - Sur le dashboard, faites défiler vers le bas
   - Vous devriez voir "Calendrier Unifié" avec le calendrier mensuel

3. **Vérifier les traductions** :
   - Changez la langue avec le sélecteur
   - Tous les textes devraient changer

## 🔍 Commandes de Vérification

### Vérifier la Version Locale vs Serveur

```bash
# Sur le serveur, vérifier le dernier commit
git log --oneline -1

# Comparer avec GitHub
git fetch origin
git log origin/main --oneline -1

# Si les commits sont différents, faire le pull
git pull origin main
```

### Vérifier les Fichiers Modifiés

```bash
# Voir les fichiers qui ont changé
git diff HEAD origin/main --name-only

# Voir les différences
git diff HEAD origin/main
```

### Vérifier les Fichiers de Traduction

```bash
# Vérifier que les fichiers de traduction existent
ls -la src/i18n/messages/

# Vérifier le contenu
cat src/i18n/messages/fr.json | head -20
cat src/i18n/messages/it.json | head -20
```

### Vérifier le Calendrier dans le Dashboard

```bash
# Vérifier que le calendrier est dans index.tsx
grep -n "unifiedCalendar\|Calendrier Unifié" src/pages/index.tsx
```

### Vérifier le Sélecteur de Langue

```bash
# Vérifier le sélecteur dans ModernLayout
grep -n "Language\|setLanguage\|Français\|Italiano" src/components/ModernLayout.tsx
```

## 🚨 Si le Pull Échoue

### Problème : Conflit avec package-lock.json

```bash
# Solution 1 : Écraser le fichier local
git checkout -- package-lock.json package.json
git pull origin main
npm install

# Solution 2 : Stash puis pull
git stash
git pull origin main
npm install
```

### Problème : Modifications non commitées

```bash
# Voir les fichiers modifiés
git status

# Si vous voulez les garder
git stash
git pull origin main
git stash pop

# Si vous voulez les écraser
git checkout -- .
git pull origin main
```

## 📝 Script Complet de Mise à Jour

Créez un fichier `update-server.sh` sur le serveur :

```bash
#!/bin/bash
echo "🔄 Mise à jour du serveur..."

cd ~/socialhub_global_v5

echo "📦 Sauvegarde des modifications locales..."
git stash

echo "⬇️  Récupération des modifications..."
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du pull. Résolution des conflits..."
    git checkout -- package-lock.json package.json
    git pull origin main
fi

echo "📦 Installation des dépendances..."
npm install

echo "🔍 Vérification des vulnérabilités..."
npm audit

echo "🔄 Redémarrage de l'application..."
pm2 restart socialhub-app

echo "✅ Mise à jour terminée !"
echo ""
echo "📊 Vérification du statut..."
pm2 status
pm2 logs socialhub-app --lines 20
```

## ✅ Checklist Finale

Après la mise à jour, vérifiez :

- [ ] Le dernier commit correspond à celui de GitHub
- [ ] Les fichiers `src/i18n/messages/fr.json` et `it.json` existent
- [ ] Le fichier `src/components/ModernLayout.tsx` contient le sélecteur amélioré
- [ ] Le fichier `src/pages/index.tsx` contient le calendrier
- [ ] L'application redémarre sans erreur
- [ ] Le sélecteur de langue est visible dans l'interface
- [ ] Le calendrier apparaît dans le dashboard
- [ ] Le changement de langue fonctionne

## 🎯 Commandes Rapides (Tout en Une)

```bash
cd ~/socialhub_global_v5 && \
git stash && \
git pull origin main && \
npm install && \
pm2 restart socialhub-app && \
pm2 logs socialhub-app --lines 30
```





