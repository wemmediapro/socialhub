# 📅 Guide : Calendrier et Sélecteur de Langue

## ✅ Où Trouver les Modifications

### 1. 📅 Calendrier dans le Dashboard

**Emplacement :** Page d'accueil (Dashboard) - Section "Calendrier Unifié"

**Comment y accéder :**
1. Connectez-vous à l'application
2. Vous êtes automatiquement sur la page Dashboard (`/`)
3. **Faites défiler vers le bas** après la section "Actions Rapides"
4. Vous verrez la section **"Calendrier Unifié"** avec :
   - Un calendrier mensuel complet
   - Les posts planifiés (indicateur bleu)
   - Les collaborations planifiées (indicateur vert)
   - Possibilité de cliquer sur un jour pour voir les détails

**Fonctionnalités du calendrier :**
- ✅ Navigation mois précédent/suivant (flèches gauche/droite)
- ✅ Affichage des événements planifiés
- ✅ Clic sur un jour pour voir les détails
- ✅ Traductions en français et italien

### 2. 🌐 Sélecteur de Langue (FR/IT)

**Emplacement :** Barre supérieure (header) - En haut à droite

**Comment y accéder :**
1. Dans n'importe quelle page de l'application
2. Regardez la **barre supérieure** (header)
3. À droite, vous verrez :
   - 🔔 Notification (icône cloche)
   - 👤 Profil utilisateur
   - **🌐 Sélecteur de langue** (FR/IT) ← **ICI**
   - 🚪 Bouton Déconnexion

**Apparence du sélecteur :**
- Icône de globe (🌐) à gauche
- Texte : "🇫🇷 Français" ou "🇮🇹 Italiano"
- Bordure violette au survol
- Ombre légère pour la visibilité

**Fonctionnement :**
- Cliquez sur le sélecteur
- Choisissez entre :
  - 🇫🇷 **Français** (FR)
  - 🇮🇹 **Italiano** (IT)
- L'interface change automatiquement de langue

## 🔍 Vérification

### Vérifier le Calendrier

```bash
# 1. Ouvrez l'application
http://localhost:3000 (ou votre URL serveur)

# 2. Connectez-vous
# 3. Vous êtes sur le Dashboard
# 4. Faites défiler vers le bas
# 5. Vous devriez voir "Calendrier Unifié"
```

### Vérifier le Sélecteur de Langue

```bash
# 1. Regardez en haut à droite de l'écran
# 2. Après le profil utilisateur, avant le bouton Déconnexion
# 3. Vous devriez voir un menu déroulant avec "🇫🇷 Français"
# 4. Cliquez dessus pour voir "🇮🇹 Italiano"
```

## 🎨 Améliorations Récentes

### Sélecteur de Langue (Amélioré)
- ✅ Bordure plus visible (2px)
- ✅ Icône de globe plus grande (18px)
- ✅ Texte complet : "Français" / "Italiano" (au lieu de "FR" / "IT")
- ✅ Ombre au survol pour meilleure visibilité
- ✅ Animation au survol

### Calendrier
- ✅ Affichage mensuel complet
- ✅ Indicateurs colorés pour les événements
- ✅ Détails au clic sur un jour
- ✅ Traductions complètes

## 🐛 Si Vous Ne Voyez Pas

### Le Calendrier
1. **Vérifiez que vous êtes sur la page Dashboard** (`/`)
2. **Faites défiler vers le bas** - il est après "Actions Rapides"
3. **Vérifiez la console du navigateur** (F12) pour les erreurs
4. **Rafraîchissez la page** (Ctrl+R ou F5)

### Le Sélecteur de Langue
1. **Vérifiez que la sidebar est ouverte** - la barre supérieure s'ajuste
2. **Regardez la largeur de l'écran** - peut être caché sur petits écrans
3. **Vérifiez la console du navigateur** (F12) pour les erreurs
4. **Redémarrez l'application** si nécessaire

## 📝 Commandes pour Vérifier sur le Serveur

```bash
# Sur le serveur
cd ~/socialhub_global_v5

# Récupérer les dernières modifications
git pull origin main

# Installer les dépendances
npm install

# Redémarrer l'application
pm2 restart socialhub-app

# Vérifier les logs
pm2 logs socialhub-app --lines 50
```

## ✅ Checklist

- [ ] Le calendrier s'affiche sur le Dashboard
- [ ] Le sélecteur de langue est visible en haut à droite
- [ ] Le changement de langue fonctionne (FR ↔ IT)
- [ ] Les traductions s'appliquent correctement
- [ ] Les événements apparaissent dans le calendrier

## 🎯 Prochaines Étapes

1. **Tester le changement de langue** :
   - Cliquez sur le sélecteur
   - Changez de FR à IT
   - Vérifiez que tous les textes changent

2. **Tester le calendrier** :
   - Créez un post planifié
   - Vérifiez qu'il apparaît dans le calendrier
   - Cliquez sur le jour pour voir les détails

