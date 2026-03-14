# 🚀 Guida al Deployment sul Server

## ✅ Metodo 1 : Script Automatico (Consigliato)

### Passaggi :

1. **Connettersi al server via SSH** :
```bash
ssh root@vostra_ip_server
# oppure
ssh vostro_utente@vostra_ip_server
```

2. **Navigare nella cartella dell'applicazione** :
```bash
cd ~/socialhub_global_v5
# oppure a seconda della vostra configurazione:
# cd /home/socialhub/socialhub_global_v5
# cd /root/socialhub_global_v5
```

3. **Eseguire lo script di deployment** :
```bash
chmod +x deploy.sh
./deploy.sh
```

Lo script esegue automaticamente :
- ✅ Recupero delle modifiche Git (`git pull`)
- ✅ Installazione delle dipendenze (`npm install`)
- ✅ Build dell'applicazione (`npm run build`)
- ✅ Riavvio dell'applicazione con PM2
- ✅ Verifica dello stato

---

## ✅ Metodo 2 : Comandi Manuali

Se preferite eseguire i comandi uno alla volta :

### Passaggio 1 : Connettersi e navigare
```bash
ssh root@vostra_ip_server
cd ~/socialhub_global_v5
```

### Passaggio 2 : Salvare le modifiche locali (se necessario)
```bash
git stash
```

### Passaggio 3 : Recuperare le modifiche da GitHub
```bash
git pull origin main
```

Se avete conflitti :
```bash
git checkout -- package-lock.json package.json
git pull origin main
```

### Passaggio 4 : Installare le dipendenze
```bash
npm install
```

### Passaggio 5 : Build dell'applicazione (IMPORTANTE per Next.js)
```bash
npm run build
```

### Passaggio 6 : Riavviare l'applicazione
```bash
# Se utilizzate PM2 con ecosystem.config.js
pm2 restart ecosystem.config.js

# Oppure se utilizzate un nome specifico
pm2 restart socialhub-app

# Verificare lo stato
pm2 status
```

### Passaggio 7 : Verificare i log
```bash
pm2 logs socialhub-app --lines 50
```

---

## 📋 Checklist di Verifica

Dopo il deployment, verificate :

- [ ] L'applicazione risponde all'URL (https://vostro-dominio.com)
- [ ] I log non mostrano errori (`pm2 logs`)
- [ ] Lo stato PM2 è "online" (`pm2 status`)
- [ ] La creazione di collaborazioni funziona
- [ ] Il pulsante "Convalida" nel workflow collab funziona
- [ ] Il messaggio di convalida mostra "assegnato all'influencer"
- [ ] Le collaborazioni pianificate appaiono nel calendario

---

## 🔍 Verifiche Utili

### Verificare l'ultimo commit
```bash
git log --oneline -1
```

### Verificare le modifiche
```bash
git log --oneline -5
```

### Verificare lo stato Git
```bash
git status
```

### Verificare lo stato PM2
```bash
pm2 status
pm2 list
```

### Vedere i log in tempo reale
```bash
pm2 logs socialhub-app
```

### Vedere solo i log di errore
```bash
pm2 logs socialhub-app --err --lines 50
```

---

## 🐛 Risoluzione dei Problemi

### Problema : `git pull` fallisce

```bash
# Salvare le modifiche
git stash

# Forzare il pull
git pull origin main --no-edit

# Oppure sovrascrivere le modifiche locali
git fetch origin
git reset --hard origin/main
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
# Fermare tutti i processi
pm2 stop all

# Eliminare il vecchio processo
pm2 delete socialhub-app

# Riavviare
pm2 start ecosystem.config.js
# oppure
pm2 start npm --name "socialhub-app" -- start

# Salvare la configurazione
pm2 save
```

### Problema : L'applicazione non risponde

```bash
# Verificare che l'applicazione sia in esecuzione
pm2 status

# Verificare i log per errori
pm2 logs socialhub-app --lines 100

# Verificare le porte
netstat -tlnp | grep 3000

# Riavviare completamente
pm2 restart all
```

---

## ⚡ Comandi Rapidi (Tutto in Uno)

```bash
cd ~/socialhub_global_v5 && \
git stash && \
git pull origin main && \
npm install && \
npm run build && \
pm2 restart ecosystem.config.js && \
pm2 logs socialhub-app --lines 20
```

---

## 📝 Note Importanti

1. **Build obbligatorio** : Next.js richiede un rebuild (`npm run build`) per tenere conto delle modifiche in produzione.

2. **PM2** : L'applicazione deve essere riavviata con PM2 per applicare le modifiche.

3. **Docker** : Se utilizzate Docker per MongoDB/Redis, verificate che i servizi siano avviati :
```bash
docker-compose ps
docker-compose up -d
```

4. **Variabili d'ambiente** : Assicuratevi che il file `.env` sia ben configurato sul server.

---

## ✅ Dopo il Deployment

Testate le nuove funzionalità :

1. **Creazione di collaborazione** : Create una nuova collaborazione e verificate che sia creata con lo stato DRAFT.

2. **Workflow** : Convalidate una collaborazione in DRAFT e verificate il messaggio "Collaborazione convalidata e assegnata all'influencer !".

3. **Calendario** : Andate in "Calendario Pubblicazioni Influencer" e verificate che le collaborazioni pianificate (SCHEDULED) appaiano.

---

## 🎯 Riepilogo delle Modifiche Deployate

- ✅ Correzione della creazione di collaborazioni (convalida MongoDB)
- ✅ Correzione del pulsante "Convalida" nel workflow collab
- ✅ Messaggio di convalida aggiornato ("assegnato all'influencer")
- ✅ Aggiunta delle collaborazioni pianificate nel calendario
- ✅ Miglioramento della gestione degli errori e dei log