# 🖥️ Comandi da Eseguire sul Server

## 🔧 Risoluzione del Conflitto package-lock.json

Esegui questi comandi **nell'ordine** sul tuo server:

```bash
# 1. Andare nella cartella del progetto
cd ~/socialhub_global_v5

# 2. Sovrascrivere il package-lock.json locale con la versione remota
# (Questo file viene rigenerato automaticamente durante npm install)
git checkout -- package-lock.json

# 3. Recuperare le ultime modifiche
git pull origin main

# 4. Installare le dipendenze (rigenera package-lock.json correttamente)
npm install

# 5. Controllare che non ci siano più vulnerabilità
npm audit

# 6. Riavviare l'applicazione
# Se usi PM2:
pm2 restart socialhub

# Oppure se avvii direttamente:
npm run build
npm start
```

## ✅ Alternativa : Stash poi Pull

Se preferisci salvare le modifiche locali:

```bash
cd ~/socialhub_global_v5

# Salvare le modifiche
git stash

# Recuperare le modifiche
git pull origin main

# Installare le dipendenze
npm install

# Riavviare l'applicazione
pm2 restart socialhub
```

## 📝 Spiegazione

- `package-lock.json` può differire tra gli ambienti
- Questo file viene rigenerato automaticamente da `npm install`
- È sicuro sovrascriverlo con la versione remota
- Dopo `npm install`, sarà sincronizzato con `package.json`

## 🎯 Dopo il Pull

Controlla che i nuovi file siano presenti:

```bash
# Controllare i nuovi file
ls -la start.ps1 start.bat stop.ps1 stop.bat
ls -la src/i18n/messages/it.json
ls -la AVVIO_VELOCE.md RISOLUZIONE_ERRORE_500.md
```

## 🔍 Verifica

```bash
# Controllare la versione di Next.js (deve essere 14.2.33)
grep "next" package.json

# Controllare che non ci siano più vulnerabilità
npm audit

# Controllare lo stato Git
git status
```