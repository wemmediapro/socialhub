# 🖥️ Avvio dell'Applicazione sul Server

## ✅ Stato Attuale
- ✅ Git pull riuscito
- ✅ npm install riuscito  
- ✅ 0 vulnerabilità rilevata
- ❌ PM2 non trova il processo "socialhub"

## 🔍 Verifica dello Stato PM2

Esegui questi comandi per verificare:

```bash
# Vedi tutti i processi PM2
pm2 list

# Vedi tutti i processi (inclusi quelli fermati)
pm2 list --all

# Vedi i log PM2
pm2 logs
```

## 🚀 Soluzioni per Riavviare l'Applicazione

### Opzione 1 : Se l'applicazione esiste con un altro nome

```bash
# Vedi tutti i processi
pm2 list

# Riavvia con il nome corretto (sostituisci con il nome reale)
pm2 restart <nome-del-processo>
```

### Opzione 2 : Se l'applicazione non esiste in PM2

#### Metodo A : Avviare con PM2 (Consigliato)

```bash
cd ~/socialhub_global_v5

# Build dell'applicazione
npm run build

# Avviare con PM2
pm2 start npm --name "socialhub" -- start

# Salvare la configurazione PM2
pm2 save

# Configurare PM2 per avviarsi all'avvio
pm2 startup
```

#### Metodo B : Avviare direttamente (Sviluppo)

```bash
cd ~/socialhub_global_v5

# Avviare in modalità sviluppo
npm run dev

# O in modalità produzione
npm run build
npm start
```

## 📝 Configurazione PM2 Consigliata

Crea un file `ecosystem.config.js` nella radice del progetto:

```javascript
module.exports = {
  apps: [{
    name: 'socialhub',
    script: 'npm',
    args: 'start',
    cwd: '/root/socialhub_global_v5',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Poi avvia con:

```bash
pm2 start ecosystem.config.js
pm2 save
```

## 🔍 Verifica

```bash
# Verifica che l'applicazione sia avviata
pm2 status

# Vedi i log in tempo reale
pm2 logs socialhub

# Verifica che l'applicazione risponda
curl http://localhost:3000
```

## 🛑 Arresto dell'Applicazione

```bash
# Fermare
pm2 stop socialhub

# Fermare e rimuovere
pm2 delete socialhub
```

## 📊 Monitoraggio

```bash
# Monitorare in tempo reale
pm2 monit

# Vedi le statistiche
pm2 describe socialhub
```