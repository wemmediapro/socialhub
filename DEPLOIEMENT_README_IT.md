# 📦 Pacchetto di Distribuzione VPS - SocialHub Global V5

Questo dossier contiene tutti i file necessari per distribuire SocialHub su un VPS Hostinger.

---

## 📁 File di distribuzione

### 📘 Documentazione

| File | Descrizione |
|------|-------------|
| `DEPLOIEMENT_VPS_HOSTINGER.md` | **Guida completa** con tutti i dettagli tecnici |
| `DEPLOIEMENT_RAPIDE.md` | **Guida rapida** per una distribuzione veloce (40 min) |
| `DEPLOIEMENT_README.md` | Questo file - Panoramica del pacchetto |

### 🔧 Script

| File | Descrizione | Uso |
|------|-------------|-----|
| `setup-vps.sh` | Installazione iniziale del VPS | `sudo bash setup-vps.sh` |
| `deploy.sh` | Distribuzione/aggiornamento dell'app | `./deploy.sh` |
| `backup-mongodb.sh` | Backup automatico MongoDB | `./backup-mongodb.sh` |

### ⚙️ Configurazione

| File | Descrizione | Destinazione |
|------|-------------|--------------|
| `ecosystem.config.js` | Configurazione PM2 per i servizi | Radice del progetto |
| `env.template` | Template delle variabili d'ambiente | Copiare in `.env` |
| `nginx-config-example.conf` | Configurazione Nginx | `/etc/nginx/sites-available/socialhub` |

---

## 🚀 Avvio rapido

### Opzione 1: Distribuzione automatica (Consigliata)

```bash
# 1. Connettersi al VPS
ssh root@vostra-ip-vps

# 2. Installare le dipendenze
wget https://raw.githubusercontent.com/vostro-repo/socialhub_global_v5/main/setup-vps.sh
bash setup-vps.sh

# 3. Passare all'utente socialhub
su - socialhub

# 4. Clonare e configurare
git clone https://github.com/vostro-repo/socialhub_global_v5.git
cd socialhub_global_v5
cp env.template .env
nano .env  # Compilare i valori

# 5. Distribuire
./deploy.sh

# 6. Configurare Nginx e SSL
sudo cp nginx-config-example.conf /etc/nginx/sites-available/socialhub
sudo nano /etc/nginx/sites-available/socialhub  # Adattare il dominio
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d socialhub.vostrodomaine.com
```

### Opzione 2: Distribuzione manuale

Seguire la guida completa: `DEPLOIEMENT_VPS_HOSTINGER.md`

---

## 📋 Requisiti

### Server VPS
- **OS**: Ubuntu 20.04 LTS o superiore
- **RAM**: Minimo 2GB (consigliato 4GB)
- **Storage**: Minimo 20GB
- **Accesso**: SSH root

### Servizi esterni
- Account Cloudinary (upload media)
- App Meta/Facebook (API pubblicazione)
- App TikTok (API pubblicazione)
- Dominio configurato

---

## 🎯 Architettura di distribuzione

```
┌─────────────────────────────────────────────────┐
│                   Internet                      │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Nginx (Port 80/443) │  ← SSL/TLS, Reverse Proxy
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Next.js (Port 3000)  │  ← Applicazione Web
        │      [PM2]            │
        └─────┬─────────┬───────┘
              │         │
    ┌─────────┘         └─────────┐
    ▼                             ▼
┌─────────┐                  ┌─────────┐
│ MongoDB │                  │  Redis  │
│ (27017) │                  │ (6379)  │
└─────────┘                  └─────────┘
    │                             │
    └──────────┬──────────────────┘
               │
               ▼
        [Docker Compose]

   ┌──────────────────────────────┐
   │     Workers PM2:             │
   │  • socialhub-queue           │
   │  • socialhub-insights        │
   └──────────────────────────────┘
```

---

## 📦 Servizi distribuiti

### Applicazione Next.js (PM2)
- **Servizio**: `socialhub-app`
- **Porta**: 3000
- **Ruolo**: Interfaccia web e API routes

### Worker Queue (PM2)
- **Servizio**: `socialhub-queue`
- **Ruolo**: Pubblicazione automatica dei post

### Worker Insights (PM2)
- **Servizio**: `socialhub-insights`
- **Ruolo**: Recupero delle analytics

### MongoDB (Docker)
- **Porta**: 27017
- **Ruolo**: Database principale

### Redis (Docker)
- **Porta**: 6379
- **Ruolo**: Coda (BullMQ)

### Nginx
- **Porte**: 80 (HTTP), 443 (HTTPS)
- **Ruolo**: Reverse proxy, SSL termination

---

## 🔒 Sicurezza

### Firewall (UFW)
```bash
# Porte aperte
22   → SSH
80   → HTTP
443  → HTTPS
```

### SSL/TLS
- Certificato Let's Encrypt
- Rinnovo automatico tramite Certbot
- Reindirizzamento HTTP → HTTPS

### Isolamento
- Applicazione in esecuzione sotto utente `socialhub` (non-root)
- Servizi Docker isolati
- Variabili sensibili in `.env` (non versionato)

---

## 📊 Monitoraggio

### Log PM2
```bash
pm2 logs                    # Tutti i log
pm2 logs socialhub-app      # Solo app
pm2 monit                   # Monitoraggio in tempo reale
```

### Log Docker
```bash
docker-compose logs mongo   # MongoDB
docker-compose logs redis   # Redis
```

### Log Nginx
```bash
sudo tail -f /var/log/nginx/socialhub-access.log
sudo tail -f /var/log/nginx/socialhub-error.log
```

### Risorse di sistema
```bash
htop                        # CPU, RAM, processi
df -h                      # Spazio disco
free -h                    # Memoria
netstat -tuln              # Porte in ascolto
```

---

## 🔄 Workflow di distribuzione

### Prima distribuzione
1. `setup-vps.sh` → Configura il server
2. Configurazione manuale → .env, Nginx
3. `deploy.sh` → Distribuzione iniziale
4. SSL → Certbot

### Aggiornamenti
1. Commit/Push codice
2. SSH verso VPS
3. `./deploy.sh` → Distribuisce automaticamente

### Backup
- Automatico tramite cron (giornaliero alle 3)
- Manuale: `./backup-mongodb.sh`

---

## 🆘 Supporto e troubleshooting

### Problema di avvio
```bash
pm2 logs --lines 100
pm2 restart all
```

### Errore 502
```bash
pm2 status
sudo systemctl reload nginx
netstat -tuln | grep 3000
```

### Database
```bash
docker-compose ps
docker-compose restart mongo
docker exec -it socialhub_global_v5-mongo-1 mongosh
```

### Spazio disco pieno
```bash
df -h
docker system prune -a
pm2 flush
```

---

## 📚 Documentazione aggiuntiva

- **Guida utente**: `GUIDE_RAPIDE.md`
- **Documentazione progetto**: `README.md`
- **Presentazione completa**: `PROJECT_PRESENTATION.md`
- **Soluzione tecnica**: `SOLUTION_COMPLETE.md`

---

## ✅ Checklist post-distribuzione

- [ ] Applicazione accessibile tramite HTTPS
- [ ] Connessione login funzionante
- [ ] MongoDB connesso
- [ ] Redis connesso
- [ ] Workers PM2 attivi
- [ ] SSL valido (lucchetto verde)
- [ ] Backup automatico configurato
- [ ] Monitoraggio attivo
- [ ] Firewall configurato
- [ ] DNS correttamente configurato

---

## 🎉 Distribuzione riuscita!

La tua applicazione SocialHub Global V5 è ora in produzione sul tuo VPS Hostinger.

**Tempo totale stimato**: 40-60 minuti

**URL**:
- Applicazione: `https://socialhub.vostrodomaine.com`
- Login: `https://socialhub.vostrodomaine.com/login`

**Comandi essenziali**:
```bash
pm2 status              # Stato dei servizi
pm2 logs               # Log in tempo reale
./deploy.sh            # Distribuire un aggiornamento
./backup-mongodb.sh    # Creare un backup
```

---

**Sviluppato con ❤️ per rivoluzionare la gestione dei contenuti digitali**

🚀 **SocialHub Global V5** - Pronto per la produzione