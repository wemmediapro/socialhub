# 🔍 Vérification Complète du Serveur

## ❌ Problème : Les Modifications Ne Sont Pas Visibles

Si les modifications ne sont pas visibles après `npm install`, il faut vérifier plusieurs choses.

## 📋 Checklist de Vérification

### 1. Vérifier que Git Pull a Bien Fonctionné

```bash
cd ~/socialhub_global_v5

# Vérifier le dernier commit
echo "=== DERNIER COMMIT LOCAL ==="
git log --oneline -1

# Vérifier le dernier commit sur GitHub
echo "=== DERNIER COMMIT SUR GITHUB ==="
git fetch origin
git log origin/main --oneline -1

# Comparer
echo "=== COMPARAISON ==="
git log HEAD..origin/main --oneline
```

**Si des commits s'affichent**, il faut faire `git pull origin main`.

### 2. Vérifier que les Fichiers de Traduction Existent

```bash
cd ~/socialhub_global_v5

# Vérifier l'existence des fichiers
echo "=== FICHIERS DE TRADUCTION ==="
ls -la src/i18n/messages/

# Vérifier le contenu
echo "=== CONTENU FR.JSON (premières lignes) ==="
head -20 src/i18n/messages/fr.json

echo "=== CONTENU IT.JSON (premières lignes) ==="
head -20 src/i18n/messages/it.json
```

### 3. Vérifier que le Calendrier Est dans Index.tsx

```bash
cd ~/socialhub_global_v5

# Chercher le calendrier
echo "=== RECHERCHE CALENDRIER ==="
grep -n "unifiedCalendar\|Calendrier Unifié" src/pages/index.tsx

# Vérifier qu'il y a du contenu
echo "=== LIGNES AUTOUR DU CALENDRIER ==="
grep -A 5 -B 5 "unifiedCalendar" src/pages/index.tsx
```

### 4. Vérifier que le Sélecteur de Langue Est Amélioré

```bash
cd ~/socialhub_global_v5

# Chercher le sélecteur
echo "=== RECHERCHE SÉLECTEUR DE LANGUE ==="
grep -n "setLanguage\|Français\|Italiano" src/components/ModernLayout.tsx

# Vérifier la version améliorée
echo "=== VERSION AMÉLIORÉE ==="
grep -A 10 "Language Selector" src/components/ModernLayout.tsx
```

### 5. Vérifier le Build de Next.js

```bash
cd ~/socialhub_global_v5

# Vérifier si un build est nécessaire
echo "=== VÉRIFICATION BUILD ==="
ls -la .next/

# Si le dossier .next n'existe pas ou est ancien, faire un build
npm run build
```

### 6. Vérifier l'État de PM2

```bash
# Vérifier le statut
pm2 status

# Vérifier les logs pour des erreurs
pm2 logs socialhub-app --lines 100 --err

# Vérifier la configuration
pm2 describe socialhub-app
```

## 🔧 Solution Complète - Étape par Étape

Exécutez ces commandes **dans l'ordre** :

```bash
cd ~/socialhub_global_v5

# ÉTAPE 1 : Vérifier l'état Git
echo "=== ÉTAPE 1 : ÉTAT GIT ==="
git status
git log --oneline -3

# ÉTAPE 2 : Récupérer les modifications
echo "=== ÉTAPE 2 : RÉCUPÉRATION ==="
git fetch origin
git pull origin main

# Si conflit, résoudre :
git checkout -- package-lock.json package.json 2>/dev/null || true
git pull origin main

# ÉTAPE 3 : Vérifier que les fichiers sont présents
echo "=== ÉTAPE 3 : VÉRIFICATION FICHIERS ==="
ls -la src/i18n/messages/fr.json src/i18n/messages/it.json
ls -la src/i18n/TranslationContext.tsx

# ÉTAPE 4 : Installer les dépendances
echo "=== ÉTAPE 4 : INSTALLATION ==="
npm install

# ÉTAPE 5 : Rebuild l'application (IMPORTANT !)
echo "=== ÉTAPE 5 : BUILD ==="
npm run build

# ÉTAPE 6 : Redémarrer l'application
echo "=== ÉTAPE 6 : REDÉMARRAGE ==="
pm2 restart socialhub-app

# ÉTAPE 7 : Vérifier les logs
echo "=== ÉTAPE 7 : LOGS ==="
pm2 logs socialhub-app --lines 50
```

## 🚨 Si les Fichiers N'existent Pas

Si les fichiers de traduction n'existent pas après le pull :

```bash
cd ~/socialhub_global_v5

# Vérifier quel commit est actif
git log --oneline -1

# Si le commit n'est pas le bon, forcer la mise à jour
git fetch origin
git reset --hard origin/main

# Installer et builder
npm install
npm run build
pm2 restart socialhub-app
```

## 🔍 Vérification Finale

Après toutes les étapes, vérifiez :

```bash
# 1. Le dernier commit doit être récent
git log --oneline -1
# Devrait afficher : "7cc48ee" ou plus récent

# 2. Les fichiers doivent exister
ls -la src/i18n/messages/*.json
# Devrait afficher : fr.json et it.json

# 3. Le calendrier doit être dans index.tsx
grep -c "unifiedCalendar" src/pages/index.tsx
# Devrait retourner : 1 ou plus

# 4. PM2 doit être actif
pm2 status
# socialhub-app doit être "online"
```

## 📝 Script de Diagnostic Complet

Créez `diagnostic.sh` sur le serveur :

```bash
#!/bin/bash
cd ~/socialhub_global_v5

echo "=========================================="
echo "  DIAGNOSTIC COMPLET DU SERVEUR"
echo "=========================================="
echo ""

echo "1. ÉTAT GIT"
echo "-----------"
git status
echo ""
echo "Dernier commit local :"
git log --oneline -1
echo ""
echo "Dernier commit GitHub :"
git fetch origin -q
git log origin/main --oneline -1
echo ""
echo "Différences :"
git log HEAD..origin/main --oneline
echo ""

echo "2. FICHIERS DE TRADUCTION"
echo "------------------------"
if [ -f "src/i18n/messages/fr.json" ]; then
    echo "✅ fr.json existe"
    echo "   Taille : $(wc -l < src/i18n/messages/fr.json) lignes"
else
    echo "❌ fr.json N'EXISTE PAS"
fi

if [ -f "src/i18n/messages/it.json" ]; then
    echo "✅ it.json existe"
    echo "   Taille : $(wc -l < src/i18n/messages/it.json) lignes"
else
    echo "❌ it.json N'EXISTE PAS"
fi
echo ""

echo "3. CALENDRIER DANS DASHBOARD"
echo "----------------------------"
if grep -q "unifiedCalendar" src/pages/index.tsx; then
    echo "✅ Calendrier trouvé dans index.tsx"
    echo "   Nombre d'occurrences : $(grep -c "unifiedCalendar" src/pages/index.tsx)"
else
    echo "❌ Calendrier NON TROUVÉ dans index.tsx"
fi
echo ""

echo "4. SÉLECTEUR DE LANGUE"
echo "----------------------"
if grep -q "Français\|Italiano" src/components/ModernLayout.tsx; then
    echo "✅ Sélecteur de langue trouvé"
else
    echo "❌ Sélecteur de langue NON TROUVÉ"
fi
echo ""

echo "5. BUILD NEXT.JS"
echo "----------------"
if [ -d ".next" ]; then
    echo "✅ Dossier .next existe"
    echo "   Date de modification : $(stat -c %y .next 2>/dev/null || stat -f %Sm .next)"
else
    echo "❌ Dossier .next N'EXISTE PAS (build nécessaire)"
fi
echo ""

echo "6. PM2"
echo "------"
pm2 status
echo ""

echo "=========================================="
echo "  FIN DU DIAGNOSTIC"
echo "=========================================="
```

Puis exécutez :
```bash
chmod +x diagnostic.sh
./diagnostic.sh
```





