# 🚀 Guida al Deployment - Modifiche sul Server

## 📋 Requisiti

- Accesso SSH al server
- Applicazione già installata sul server
- Git configurato sul server
- PM2 installato e configurato

## 🔄 Fasi di Deployment

### Fase 1 : Connettersi al server

```bash
ssh vostro_utente@vostro_server_ip
# oppure
ssh root@vostro_server_ip
```

### Fase 2 : Navigare nella cartella dell'applicazione

```bash
cd /root/socialhub_global_v5
# oppure a seconda della vostra configurazione:
# cd /home/socialhub/socialhub_global_v5
```

### Fase 3 : Recuperare le ultime modifiche

```bash
# Controllare lo stato attuale
git status

# Recuperare le modifiche da GitHub
git pull origin main
```

**Se avete conflitti o modifiche locali:**
```bash
# Salvare le vostre modifiche locali (se necessario)
git stash

# Poi pull
git pull origin main

# Ripristinare le vostre modifiche (se necessario)
git stash pop
```

### Fase 4 : Installare le nuove dipendenze (se necessario)

```bash
npm install
```

> ⚠️ **Nota**: Se avete aggiunto nuove dipendenze in `package.json`, questo passaggio è obbligatorio.

### Fase 5 : Ricostruire l'applicazione

```bash
npm run build
```

Questo passaggio è **CRITICO** perché Next.js in produzione utilizza un build precompilato. Senza rebuild, le modifiche non verranno prese in considerazione.

### Fase 6 : Riavviare l'applicazione con PM2

```bash
# Riavviare tutti i servizi PM2
pm2 restart ecosystem.config.js

# Oppure riavviare specificamente l'applicazione
pm2 restart socialhub-app

# Controllare lo stato
pm2 status

# Vedere i log per verificare che non ci siano errori
pm2 logs socialhub-app --lines 50
```

### Fase 7 : Verificare che tutto funzioni

```bash
# Verificare che l'applicazione risponda
curl http://localhost:3000

# Controllare i log in tempo reale
pm2 logs socialhub-app
```

## 🎯 Script di Deployment Automatico

Potete utilizzare lo script `deploy.sh` che fa tutto automaticamente:

```bash
cd /root/socialhub_global_v5
chmod +x deploy.sh
./deploy.sh
```

Lo script fa automaticamente:
1. ✅ Recupero delle modifiche Git
2. ✅ Installazione delle dipendenze
3. ✅ Build dell'applicazione
4. ✅ Riavvio PM2

## 📝 Comandi Completi (Copia-Incolla)

```bash
# Connessione e navigazione
cd /root/socialhub_global_v5

# Recupero delle modifiche
git pull origin main

# Installazione delle dipendenze
npm install

# Build dell'applicazione
npm run build

# Riavvio PM2
pm2 restart ecosystem.config.js

# Verifica
pm2 status
pm2 logs socialhub-app --lines 20
```

## 🔍 Verifiche Post-Deployment

### 1. Verificare che l'applicazione sia online

```bash
pm2 status
```

Dovreste vedere `online` per `socialhub-app`.

### 2. Verificare i log per errori

```bash
pm2 logs socialhub-app --err --lines 50
```

### 3. Testare il caricamento di un'immagine

1. Andare sull'applicazione : `https://vostro-dominio.com`
2. Creare o modificare un post
3. Caricare un'immagine
4. Verificare che l'immagine venga visualizzata (nessun errore 404)

### 4. Verificare che gli URL utilizzino `/api/uploads/`

Nei log o nella console del browser, gli URL dovrebbero essere:
- ✅ `https://vostro-dominio.com/api/uploads/filename.png`
- ❌ Nessun `https://vostro-dominio.com/uploads/filename.png` (404)

## 🐛 Risoluzione dei Problemi

### Problema : `git pull` fallisce con "modifiche non confermate"

```bash
# Salvare le modifiche locali
git stash

# Pull
git pull origin main

# Ripristinare (se necessario)
git stash pop
```

### Problema : `npm run build` fallisce

```bash
# Pulire la cache
rm -rf .next
rm -rf node_modules

# Reinstallare
npm install

# Ricostruire
npm run build
```

### Problema : PM2 non riavvia

```bash
# Fermare completamente
pm2 stop all

# Riavviare
pm2 start ecosystem.config.js

# Salvare la configurazione
pm2 save
```

### Problema : Le immagini non vengono ancora visualizzate

1. Verificare che la cartella `public/uploads` esista sul server :
```bash
ls -la public/uploads/
```

2. Verificare i permessi :
```bash
chmod -R 755 public/uploads/
```

3. Verificare che la rotta API funzioni :
```bash
curl https://vostro-dominio.com/api/uploads/nome-file.png
```

4. Verificare i log dell'API :
```bash
pm2 logs socialhub-app | grep uploads
```

## 📊 Checklist di Deployment

- [ ] Connesso al server tramite SSH
- [ ] Navigato nella cartella dell'applicazione
- [ ] Eseguito `git pull origin main`
- [ ] Eseguito `npm install` (se nuove dipendenze)
- [ ] Eseguito `npm run build`
- [ ] Eseguito `pm2 restart ecosystem.config.js`
- [ ] Verificato `pm2 status` → applicazione `online`
- [ ] Testato il caricamento di immagini nell'interfaccia
- [ ] Verificato che le immagini vengano visualizzate (nessun errore 404)
- [ ] Verificato i log per confermare che non ci siano errori

## 🎉 Risultato Atteso

Dopo il deployment, dovreste avere :
- ✅ Modulo di modifica con tutti i campi (progetti, assignedTo, schedule, media)
- ✅ Caricamento di immagini funzionante nel workflow (ruolo grafico)
- ✅ Immagini che vengono visualizzate correttamente (via `/api/uploads/`)
- ✅ Nessun errore 404 per le immagini caricate

## 📞 In Caso di Problema

Se riscontrate problemi :
1. Verificare i log : `pm2 logs socialhub-app`
2. Verificare lo stato : `pm2 status`
3. Verificare che MongoDB e Redis siano attivi : `docker-compose ps`
4. Riavviare tutti i servizi se necessario

---

**Data di creazione** : $(date)
**Ultima modifica** : $(date)