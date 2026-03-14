# 🚀 Migration Rapide V5 → V6

## ✅ Étape 1: Backup (DÉJÀ FAIT)

Le backup est déjà fait sur le serveur. ✅

---

## 💻 Étape 2: Migration Locale (Sur Votre PC)

```powershell
# Aller dans le dossier v5
cd D:\Users\Lilia\Desktop\Cursor\socialhub_global_v5

# Exécuter le script de migration
.\migrate-to-v6.ps1
```

**Le script va :**
- Copier tous les fichiers de v6 vers v5
- Préserver votre historique Git
- Vous proposer de commiter et pousser

**Répondez "oui" quand il vous demande de commiter !**

---

## 📤 Étape 3: Push vers Git (Si pas fait automatiquement)

```powershell
git add -A
git commit -m "feat: migration vers v6"
git push origin main
```

---

## 🚀 Étape 4: Déploiement sur le Serveur

### Sur le serveur, exécutez :

```bash
# 1. Aller dans le dossier
cd /root/socialhub_global_v5

# 2. Résoudre les conflits Git (si nécessaire)
git checkout -- backup-mongodb.sh
git pull origin main
chmod +x backup-mongodb.sh deploy.sh

# 3. Déployer
./deploy.sh
```

Le script `deploy.sh` va automatiquement :
- ✅ Faire un backup (sécurité supplémentaire)
- ✅ Récupérer les modifications Git
- ✅ Installer les dépendances
- ✅ Builder l'application
- ✅ Redémarrer les services

---

## ✅ Étape 5: Vérification

```bash
# Vérifier les services
pm2 status

# Vérifier les logs
pm2 logs socialhub-app --lines 20

# Tester l'application
# Ouvrez https://votre-domaine.com dans votre navigateur
```

---

## 🎉 C'est Terminé !

Si tout fonctionne, la migration est réussie ! 🎊

---

## 🔙 En Cas de Problème

Voir le guide complet : `GUIDE_MIGRATION_COMPLETE.md`

