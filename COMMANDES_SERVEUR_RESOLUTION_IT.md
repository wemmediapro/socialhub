# 📋 Comandi da Eseguire sul Server

## Passo 1: Risolvere il Conflitto Git

Copia e incolla questi comandi uno alla volta nel tuo terminale SSH:

```bash
# Andare nella cartella dell'applicazione
cd /root/socialhub_global_v5

# Sovrascrivere le modifiche locali con la versione remota
git checkout -- backup-mongodb.sh
git checkout -- deploy.sh

# Recuperare le ultime modifiche
git pull origin main

# Rendere gli script eseguibili
chmod +x backup-mongodb.sh deploy.sh fix-git-conflict-serveur.sh
```

## Passo 2: Verificare che Tutto sia Corretto

```bash
# Verificare i percorsi in deploy.sh
grep "APP_DIR" deploy.sh
# Dovrebbe mostrare: APP_DIR="/root/socialhub_global_v5"

# Verificare i percorsi in backup-mongodb.sh
grep "BACKUP_DIR" backup-mongodb.sh
# Dovrebbe mostrare: BACKUP_DIR="/root/backups/mongodb"

# Verificare lo stato Git
git status
# Dovrebbe mostrare: "Your branch is up to date with 'origin/main'"
```

## Passo 3: Testare il Backup (Opzionale ma Raccomandato)

```bash
# Testare lo script di backup
./backup-mongodb.sh
```

Se il backup funziona, vedrai un messaggio di successo con il nome del file di backup creato.

## ✅ È Finito!

Una volta completati questi passaggi, puoi:
- Continuare con la migrazione a v6 (se sei pronto)
- Oppure semplicemente utilizzare gli script corretti

---

## 🔄 Se Vuoi Continuare con la Migrazione V6

Dopo aver risolto il conflitto, sul tuo PC locale:

```powershell
cd D:\Users\Lilia\Desktop\Cursor\socialhub_global_v5
.\migrate-to-v6.ps1
```

Poi sul server:

```bash
cd /root/socialhub_global_v5
git pull origin main
./deploy.sh
```