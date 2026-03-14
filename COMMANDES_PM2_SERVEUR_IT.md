# 🖥️ Comandi PM2 per il Server

## ✅ La tua Applicazione PM2 si chiama "socialhub-app"

Secondo il tuo file `ecosystem.config.js`, il processo si chiama **"socialhub-app"**.

## 🔄 Riavviare l'Applicazione

```bash
# Riavviare con il nome corretto
pm2 restart socialhub-app

# Oppure riavviare tutti i processi
pm2 restart all
```

## 📊 Controllare lo Stato

```bash
# Vedere tutti i processi PM2
pm2 list

# Vedere i log in tempo reale
pm2 logs socialhub-app

# Vedere le statistiche
pm2 describe socialhub-app

# Monitorare
pm2 monit
```

## 🚀 Se l'Applicazione non è Avviata

```bash
cd ~/socialhub_global_v5

# Build dell'applicazione
npm run build

# Avviare con il file di configurazione
pm2 start ecosystem.config.js

# Salvare la configurazione
pm2 save
```

## 🛑 Arresto

```bash
# Arrestare
pm2 stop socialhub-app

# Arrestare e rimuovere
pm2 delete socialhub-app
```

## 📝 Comandi Completi

```bash
# 1. Andare nella cartella
cd ~/socialhub_global_v5

# 2. Build (se necessario)
npm run build

# 3. Riavviare con PM2
pm2 restart socialhub-app

# 4. Controllare che funzioni
pm2 status
pm2 logs socialhub-app --lines 50
```

## 🔍 Verifica che l'Applicazione Risponda

```bash
# Testare localmente
curl http://localhost:3000

# Oppure con il tuo IP pubblico
curl http://tuo-ip-server:3000
```