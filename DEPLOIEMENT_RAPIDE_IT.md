# 🚀 Guida al Deployment Veloce - SocialHub VPS Hostinger

Guida condensata per un deployment veloce. Per la versione completa, vedere `DEPLOYMENT_VPS_HOSTINGER.md`.

---

## 📋 Checklist Pre-Deployment

- [ ] VPS Hostinger provisionato (Ubuntu 20.04+, 2GB+ RAM)
- [ ] Nome di dominio configurato (DNS che punta al VPS)
- [ ] Accesso SSH root al VPS
- [ ] Chiavi API pronte (Meta, TikTok, Cloudinary)

---

## ⚡ Deployment in 5 fasi

### Fase 1: Configurazione iniziale del server (10 min)

```bash
# Connettersi al VPS
ssh root@vostra-ip-vps

# Scaricare ed eseguire lo script di setup
wget https://raw.githubusercontent.com/vostro-repo/socialhub_global_v5/main/setup-vps.sh
chmod +x setup-vps.sh
bash setup-vps.sh

# Passare all'utente socialhub
su - socialhub
```

### Fase 2: Deploy dell'applicazione (15 min)

```bash
# Clonare il progetto
cd ~
git clone https://github.com/vostro-username/socialhub_global_v5.git
cd socialhub_global_v5

# Copiare il template di configurazione
cp env.template .env
nano .env  # Compilare con i vostri veri valori

# Avviare MongoDB e Redis
docker-compose up -d

# Installare e costruire
npm install
npm run build

# Creare la cartella logs
mkdir -p logs

# Aggiornare il percorso in ecosystem.config.js
nano ecosystem.config.js
# Sostituire /home/socialhub/socialhub_global_v5 con il percorso reale se diverso

# Avviare con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### Fase 3: Configurare Nginx (5 min)

```bash
# Copiare la configurazione Nginx
sudo cp nginx-config-example.conf /etc/nginx/sites-available/socialhub

# Modificare per inserire il vostro dominio
sudo nano /etc/nginx/sites-available/socialhub
# Sostituire "socialhub.vostrodomaine.com" con il vostro vero dominio

# Attivare la configurazione
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testare e ricaricare
sudo nginx -t
sudo systemctl reload nginx
```

### Fase 4: Configurare SSL (5 min)

```bash
# Installare Certbot
sudo apt install -y certbot python3-certbot-nginx

# Ottenere il certificato SSL
sudo certbot --nginx -d socialhub.vostrodomaine.com --email vostra@email.com --agree-tos --no-eff-email

# Ricaricare Nginx
sudo systemctl reload nginx
```

### Fase 5: Verificare e testare (5 min)

```bash
# Verificare i servizi
pm2 status
docker-compose ps
sudo systemctl status nginx

# Testare l'applicazione
curl -I https://socialhub.vostrodomaine.com

# Vedere i log
pm2 logs --lines 50
```

---

## 🎯 URL dopo il deployment

```
Applicazione:   https://socialhub.vostrodomaine.com
Login:        https://socialhub.vostrodomaine.com/login
Dashboard:    https://socialhub.vostrodomaine.com/
Progetti:      https://socialhub.vostrodomaine.com/projects
Calendario:   https://socialhub.vostrodomaine.com/calendar-pro
```

---

## 🔧 Configurazione .env minima

```env
# Applicazione
NODE_ENV=production
PORT=3000
APP_URL=https://socialhub.vostrodomaine.com

# Database
MONGODB_URI=mongodb://localhost:27017/socialhub
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=vostro_cloud_name
CLOUDINARY_API_KEY=vostro_api_key
CLOUDINARY_API_SECRET=vostro_api_secret
CLOUDINARY_UPLOAD_PRESET=vostro_preset

# Meta
META_APP_ID=vostro_app_id
META_APP_SECRET=vostro_app_secret
META_REDIRECT_URI=https://socialhub.vostrodomaine.com/api/auth/meta/callback

# TikTok
TIKTOK_CLIENT_KEY=vostro_client_key
TIKTOK_CLIENT_SECRET=vostro_client_secret
TIKTOK_REDIRECT_URI=https://socialhub.vostrodomaine.com/api/auth/tiktok/callback
```

---

## 📊 Comandi essenziali

### Gestione PM2
```bash
pm2 status          # Vedere lo stato
pm2 logs            # Vedere i log
pm2 restart all     # Riavviare tutto
pm2 monit          # Monitoraggio in tempo reale
```

### Gestione Docker
```bash
docker-compose ps           # Vedere i contenitori
docker-compose logs         # Vedere i log
docker-compose restart      # Riavviare
```

### Deployment veloce
```bash
cd ~/socialhub_global_v5
./deploy.sh         # Deploy delle nuove modifiche
```

### Backup MongoDB
```bash
cd ~/socialhub_global_v5
./backup-mongodb.sh  # Creare un backup
```

---

## 🆘 Risoluzione rapida dei problemi

### L'applicazione non si avvia
```bash
pm2 logs socialhub-app --lines 100
pm2 restart socialhub-app
```

### MongoDB non si connette
```bash
docker-compose ps
docker-compose restart mongo
docker-compose logs mongo
```

### Errore 502 (Nginx)
```bash
pm2 status
netstat -tuln | grep 3000
sudo systemctl reload nginx
```

### Mancanza di memoria
```bash
free -h
pm2 restart all
# Aggiungere swap se necessario (vedere la guida completa)
```

---

## 📦 Backup automatico (opzionale)

```bash
# Rendere lo script eseguibile
chmod +x ~/socialhub_global_v5/backup-mongodb.sh

# Configurare il cron per backup quotidiano alle 3
crontab -e

# Aggiungere questa riga:
0 3 * * * /home/socialhub/socialhub_global_v5/backup-mongodb.sh >> /home/socialhub/logs/backup.log 2>&1
```

---

## 📚 Documentazione completa

Per ulteriori dettagli, consultare:
- **`DEPLOYMENT_VPS_HOSTINGER.md`** - Guida completa con tutti i dettagli
- **`README.md`** - Documentazione generale del progetto
- **`GUIDE_VELOCE.md`** - Guida utente dell'applicazione

---

## ✅ È tutto!

La vostra applicazione SocialHub è ora distribuita in produzione sul vostro VPS Hostinger!

**Tempo totale stimato:** ~40 minuti

Per gli aggiornamenti futuri: `./deploy.sh`

---

**Supporto:** In caso di problemi, consultare la sezione Risoluzione dei problemi della guida completa.