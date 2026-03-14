# 🚀 Guida al Deployment VPS Hostinger - SocialHub Global V5

Guida completa per distribuire l'applicazione SocialHub su un server VPS Hostinger.

---

## 📋 Indice

1. [Requisiti](#requisiti)
2. [Preparazione del VPS](#preparazione-del-vps)
3. [Installazione delle dipendenze](#installazione-delle-dipendenze)
4. [Configurazione dell'applicazione](#configurazione-dellapplicazione)
5. [Configurazione Nginx](#configurazione-nginx)
6. [SSL con Let's Encrypt](#ssl-con-lets-encrypt)
7. [Configurazione dei servizi di sistema](#configurazione-dei-servizi-di-sistema)
8. [Deployment](#deployment)
9. [Manutenzione](#manutenzione)

---

## 🎯 Requisiti

### Sul tuo VPS Hostinger
- Ubuntu 20.04 LTS o superiore
- Minimo 2GB RAM (raccomandato: 4GB+)
- 20GB di spazio su disco
- Accesso root SSH

### Informazioni necessarie
- Nome di dominio (es: `socialhub.iltuodominio.com`)
- DNS configurato per puntare al tuo VPS
- Chiavi API (Meta, TikTok, Cloudinary)

---

## 🖥️ Preparazione del VPS

### 1. Connessione SSH al VPS

```bash
ssh root@il-tuo-ip-vps
```

### 2. Aggiornamento del sistema

```bash
# Aggiornare i pacchetti
apt update && apt upgrade -y

# Installare gli strumenti di base
apt install -y curl wget git vim ufw build-essential
```

### 3. Configurazione del firewall

```bash
# Abilitare UFW
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### 4. Creare un utente per l'applicazione (raccomandato)

```bash
# Creare l'utente
adduser socialhub
usermod -aG sudo socialhub

# Accedere con questo nuovo utente
su - socialhub
```

---

## 📦 Installazione delle dipendenze

### 1. Installare Node.js 18.x

```bash
# Installare NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Ricaricare il terminale
source ~/.bashrc

# Installare Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verificare l'installazione
node --version
npm --version
```

### 2. Installare Docker e Docker Compose

```bash
# Installare Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Aggiungere l'utente al gruppo docker
sudo usermod -aG docker $USER

# Installare Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificare l'installazione
docker --version
docker-compose --version

# Riavviare la sessione per applicare le modifiche di gruppo
exit
# Ricollegarsi in SSH
```

### 3. Installare PM2 (Process Manager)

```bash
npm install -g pm2

# Configurare PM2 per avviarsi all'avvio
pm2 startup
# Eseguire il comando suggerito
```

### 4. Installare Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 🚀 Configurazione dell'applicazione

### 1. Clonare il progetto

```bash
# Posizionarsi nella directory home
cd ~

# Clonare il tuo progetto (dal tuo repository Git)
git clone https://github.com/tuo-username/socialhub_global_v5.git
# O trasferire i file dalla tua macchina locale
# scp -r /percorso/locale/socialhub_global_v5 socialhub@il-tuo-ip:/home/socialhub/

cd socialhub_global_v5
```

### 2. Configurare le variabili d'ambiente

```bash
# Creare il file .env
nano .env
```

**Contenuto del file `.env` (adattare con i tuoi valori):**

```env
# Node Environment
NODE_ENV=production

# Applicazione
PORT=3000
APP_URL=https://socialhub.iltuodominio.com

# MongoDB
MONGODB_URI=mongodb://localhost:27017/socialhub

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=tuo_cloud_name
CLOUDINARY_API_KEY=tuo_api_key
CLOUDINARY_API_SECRET=tuo_api_secret
CLOUDINARY_UPLOAD_PRESET=tuo_preset

# Meta (Facebook/Instagram)
META_APP_ID=tuo_app_id
META_APP_SECRET=tuo_app_secret
META_REDIRECT_URI=https://socialhub.iltuodominio.com/api/auth/meta/callback

# TikTok
TIKTOK_CLIENT_KEY=tuo_client_key
TIKTOK_CLIENT_SECRET=tuo_client_secret
TIKTOK_REDIRECT_URI=https://socialhub.iltuodominio.com/api/auth/tiktok/callback

# Email (opzionale)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuo_email@gmail.com
SMTP_PASS=tuo_mot_de_passe
SMTP_FROM=tuo_email@gmail.com
```

### 3. Avviare MongoDB e Redis con Docker

```bash
# Avviare i servizi
docker-compose up -d

# Verificare che i servizi siano attivi
docker-compose ps
```

### 4. Installare le dipendenze e costruire l'applicazione

```bash
# Installare le dipendenze
npm install

# Costruire l'applicazione Next.js
npm run build
```

---

## 🌐 Configurazione Nginx

### 1. Creare la configurazione Nginx

```bash
sudo nano /etc/nginx/sites-available/socialhub
```

**Contenuto del file:**

```nginx
# Configurazione iniziale (solo HTTP)
server {
    listen 80;
    server_name socialhub.iltuodominio.com;

    # Logs
    access_log /var/log/nginx/socialhub-access.log;
    error_log /var/log/nginx/socialhub-error.log;

    # Limite di dimensione degli upload
    client_max_body_size 100M;

    # Proxy verso Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts per le richieste lunghe
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache per i file statici Next.js
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Attivare la configurazione

```bash
# Creare il link simbolico
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/

# Rimuovere la configurazione predefinita
sudo rm /etc/nginx/sites-enabled/default

# Testare la configurazione
sudo nginx -t

# Ricaricare Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL con Let's Encrypt

### 1. Installare Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Ottenere il certificato SSL

```bash
# Sostituire con il tuo dominio e email
sudo certbot --nginx -d socialhub.iltuodominio.com --email tuo@email.com --agree-tos --no-eff-email
```

### 3. Rinnovo automatico

```bash
# Testare il rinnovo
sudo certbot renew --dry-run

# Il rinnovo automatico è già configurato tramite cron
```

**La tua configurazione Nginx sarà automaticamente aggiornata con SSL. Verifica:**

```bash
sudo nano /etc/nginx/sites-available/socialhub
```

---

## ⚙️ Configurazione dei servizi di sistema

### 1. Configurazione PM2 per l'applicazione Next.js

Creare il file `ecosystem.config.js`:

```bash
nano ~/socialhub_global_v5/ecosystem.config.js
```

**Contenuto:**

```javascript
module.exports = {
  apps: [
    {
      name: 'socialhub-app',
      script: 'npm',
      args: 'start',
      cwd: '/home/socialhub/socialhub_global_v5',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'socialhub-queue',
      script: 'npm',
      args: 'run queue',
      cwd: '/home/socialhub/socialhub_global_v5',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/queue-error.log',
      out_file: './logs/queue-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'socialhub-insights',
      script: 'npm',
      args: 'run insights',
      cwd: '/home/socialhub/socialhub_global_v5',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/insights-error.log',
      out_file: './logs/insights-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
```

### 2. Creare la cartella logs

```bash
mkdir -p ~/socialhub_global_v5/logs
```

### 3. Avviare le applicazioni con PM2

```bash
cd ~/socialhub_global_v5

# Avviare tutte le applicazioni
pm2 start ecosystem.config.js

# Salvare la configurazione PM2
pm2 save

# Verificare lo stato
pm2 status
pm2 logs
```

### 4. Configurazione systemd per Docker Compose (opzionale ma raccomandato)

Creare il servizio systemd per avviare automaticamente MongoDB e Redis:

```bash
sudo nano /etc/systemd/system/socialhub-docker.service
```

**Contenuto:**

```ini
[Unit]
Description=SocialHub Docker Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/socialhub/socialhub_global_v5
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=socialhub

[Install]
WantedBy=multi-user.target
```

**Attivare il servizio:**

```bash
sudo systemctl enable socialhub-docker.service
sudo systemctl start socialhub-docker.service
sudo systemctl status socialhub-docker.service
```

---

## 🎬 Deployment

### Script di deployment automatico

Creare uno script `deploy.sh`:

```bash
nano ~/socialhub_global_v5/deploy.sh
```

**Contenuto:**

```bash
#!/bin/bash

echo "🚀 Inizio del deployment SocialHub..."

# Andare nella directory del progetto
cd /home/socialhub/socialhub_global_v5

# Pull delle ultime modifiche (se utilizzo di Git)
echo "📥 Recupero delle ultime modifiche..."
git pull origin main

# Installare le nuove dipendenze
echo "📦 Installazione delle dipendenze..."
npm install

# Costruire l'applicazione
echo "🏗️ Costruzione dell'applicazione..."
npm run build

# Riavviare i servizi PM2
echo "🔄 Riavvio dei servizi..."
pm2 restart ecosystem.config.js

# Mostrare lo stato
echo "✅ Deployment completato!"
pm2 status

echo ""
echo "📊 Log disponibili con: pm2 logs"
echo "🔍 Stato: pm2 status"
```

**Rendere lo script eseguibile:**

```bash
chmod +x ~/socialhub_global_v5/deploy.sh
```

### Primo deployment

```bash
cd ~/socialhub_global_v5
./deploy.sh
```

### Verifica

```bash
# Verificare i servizi PM2
pm2 status

# Verificare i log
pm2 logs --lines 50

# Verificare Nginx
sudo systemctl status nginx

# Verificare Docker
docker-compose ps

# Testare l'applicazione
curl -I https://socialhub.iltuodominio.com
```

---

## 🔧 Manutenzione

### Comandi utili PM2

```bash
# Stato di tutti i servizi
pm2 status

# Log in tempo reale
pm2 logs

# Log di un'applicazione specifica
pm2 logs socialhub-app
pm2 logs socialhub-queue
pm2 logs socialhub-insights

# Riavviare un'applicazione
pm2 restart socialhub-app

# Riavviare tutte le applicazioni
pm2 restart all

# Fermare un'applicazione
pm2 stop socialhub-app

# Eliminare un'applicazione
pm2 delete socialhub-app

# Monitoraggio in tempo reale
pm2 monit
```

### Comandi Docker

```bash
# Vedere i contenitori attivi
docker-compose ps

# Log MongoDB
docker-compose logs mongo

# Log Redis
docker-compose logs redis

# Riavviare i servizi
docker-compose restart

# Fermare i servizi
docker-compose down

# Avviare i servizi
docker-compose up -d
```

### Pulizia e ottimizzazione

```bash
# Pulire i log PM2
pm2 flush

# Pulire le immagini Docker inutilizzate
docker system prune -a

# Pulire i volumi Docker inutilizzati
docker volume prune

# Verificare lo spazio su disco
df -h

# Verificare l'utilizzo della RAM
free -h
```

### Backup del database

Creare uno script di backup automatico:

```bash
nano ~/backup-mongodb.sh
```

**Contenuto:**

```bash
#!/bin/bash

# Configurazione
BACKUP_DIR="/home/socialhub/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="socialhub_global_v5-mongo-1"

# Creare la directory di backup se non esiste
mkdir -p $BACKUP_DIR

# Creare il backup
echo "🔄 Creazione del backup MongoDB..."
docker exec $CONTAINER_NAME mongodump --out=/tmp/backup

# Copiare il backup fuori dal contenitore
docker cp $CONTAINER_NAME:/tmp/backup $BACKUP_DIR/backup_$TIMESTAMP

# Comprimere il backup
cd $BACKUP_DIR
tar -czf backup_$TIMESTAMP.tar.gz backup_$TIMESTAMP
rm -rf backup_$TIMESTAMP

# Mantenere solo gli ultimi 7 backup
ls -t $BACKUP_DIR/backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "✅ Backup completato: backup_$TIMESTAMP.tar.gz"
```

**Rendere eseguibile e pianificare con cron:**

```bash
chmod +x ~/backup-mongodb.sh

# Modificare il crontab
crontab -e

# Aggiungere questa riga per un backup quotidiano alle 3 del mattino
0 3 * * * /home/socialhub/backup-mongodb.sh >> /home/socialhub/logs/backup.log 2>&1
```

### Ripristino di un backup

```bash
# Decomprimere il backup
cd /home/socialhub/backups/mongodb
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Copiare nel contenitore
docker cp backup_YYYYMMDD_HHMMSS socialhub_global_v5-mongo-1:/tmp/restore

# Ripristinare
docker exec socialhub_global_v5-mongo-1 mongorestore /tmp/restore
```

### Monitoraggio

Installare uno strumento di monitoraggio semplice:

```bash
# Installare htop per monitorare le risorse
sudo apt install -y htop

# Installare netdata (monitoraggio avanzato)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Accedere a Netdata su http://il-tuo-ip:19999
# Configurare Nginx per accedervi tramite sottodominio se necessario
```

### Rotazione dei log Nginx

```bash
# Creare la configurazione di rotazione
sudo nano /etc/logrotate.d/socialhub
```

**Contenuto:**

```
/var/log/nginx/socialhub-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

---

## 🔍 Risoluzione dei problemi

### L'applicazione non si avvia

```bash
# Verificare i log PM2
pm2 logs socialhub-app --lines 100

# Verificare i log della build
cat ~/socialhub_global_v5/logs/app-error.log

# Verificare che MongoDB e Redis siano attivi
docker-compose ps

# Verificare le variabili d'ambiente
cat ~/socialhub_global_v5/.env
```

### Errore di connessione MongoDB

```bash
# Verificare che MongoDB sia attivo
docker-compose ps
docker-compose logs mongo

# Testare la connessione
docker exec -it socialhub_global_v5-mongo-1 mongosh
```

### Errore 502 Bad Gateway (Nginx)

```bash
# Verificare che l'applicazione Next.js sia attiva
pm2 status
pm2 logs socialhub-app

# Verificare i log Nginx
sudo tail -f /var/log/nginx/socialhub-error.log

# Verificare che la porta 3000 sia in ascolto
netstat -tuln | grep 3000
```

### Mancanza di memoria

```bash
# Verificare l'utilizzo della RAM
free -h

# Identificare i processi che consumano risorse
htop

# Riavviare PM2
pm2 restart all

# Aggiungere swap se necessario (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Problema di permessi

```bash
# Verificare i proprietari dei file
ls -la ~/socialhub_global_v5

# Correggere i permessi
sudo chown -R socialhub:socialhub ~/socialhub_global_v5
chmod -R 755 ~/socialhub_global_v5
```

---

## 📊 Checklist di deployment

- [ ] VPS configurato con Ubuntu 20.04+
- [ ] DNS configurato per puntare verso il VPS
- [ ] Node.js 18+ installato
- [ ] Docker e Docker Compose installati
- [ ] PM2 installato globalmente
- [ ] Nginx installato e configurato
- [ ] Firewall (UFW) configurato
- [ ] Progetto clonato sul VPS
- [ ] Variabili d'ambiente configurate (.env)
- [ ] MongoDB e Redis avviati (Docker)
- [ ] Applicazione costruita (`npm run build`)
- [ ] PM2 configurato con ecosystem.config.js
- [ ] Servizi PM2 avviati e salvati
- [ ] SSL configurato con Let's Encrypt
- [ ] Backup automatici configurati
- [ ] Monitoraggio configurato
- [ ] Test dell'applicazione riusciti

---

## 🎯 URL importanti dopo il deployment

```
Applicazione:        https://socialhub.iltuodominio.com
Login:             https://socialhub.iltuodominio.com/login
Dashboard:         https://socialhub.iltuodominio.com/
Progetti:           https://socialhub.iltuodominio.com/projects
Calendario:        https://socialhub.iltuodominio.com/calendar-pro
```

---

## 📞 Supporto

In caso di problemi:

1. Verificare i log: `pm2 logs`
2. Verificare i servizi: `pm2 status` e `docker-compose ps`
3. Consultare i log Nginx: `sudo tail -f /var/log/nginx/socialhub-error.log`
4. Verificare le risorse: `htop` o `free -h`

---

**✅ La tua applicazione SocialHub è ora distribuita in produzione sul tuo VPS Hostinger!**

Per qualsiasi futuro deployment, utilizza semplicemente: `./deploy.sh`