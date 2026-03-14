# 🚀 Guida Rapida all'Avvio - Windows

## ⚡ Avvio Automatico (Consigliato)

### Metodo 1 : Script PowerShell (Consigliato)

1. **Fai doppio clic su `start.bat`** oppure apri PowerShell ed esegui:
   ```powershell
   .\start.ps1
   ```

2. Lo script avvierà automaticamente:
   - ✅ Controlla Docker
   - ✅ Avvia MongoDB (Docker)
   - ✅ Avvia Redis (Docker)
   - ✅ Controlla la configurazione (.env)
   - ✅ Installa le dipendenze se necessario
   - ✅ Avvia l'applicazione Next.js

3. **Accedi all'applicazione**: http://localhost:3000

### Metodo 2 : Comandi manuali

Se preferisci avviare manualmente:

```powershell
# 1. Avvia MongoDB e Redis
docker-compose up -d

# 2. Controlla che i servizi siano avviati
docker ps

# 3. Avvia l'applicazione
npm run dev
```

---

## 🛑 Arresto dei Servizi

### Metodo 1 : Script automatico

Fai doppio clic su `stop.bat` oppure esegui:
```powershell
.\stop.ps1
```

### Metodo 2 : Manualmente

```powershell
# Arresta i contenitori Docker
docker-compose stop

# Arresta Next.js (Ctrl+C nel terminale)
```

---

## 📋 Requisiti

### 1. Docker Desktop
- Scarica: https://www.docker.com/products/docker-desktop
- Installa e avvia Docker Desktop
- Controlla: `docker --version`

### 2. Node.js (v18 o superiore)
- Scarica: https://nodejs.org/
- Controlla: `node --version`

### 3. File .env
Lo script crea automaticamente `.env` da `env.template` se necessario.

---

## 🔧 Configurazione Iniziale

### 1. Crea il file .env

Se il file non esiste, copia `env.template` in `.env`:

```powershell
Copy-Item env.template .env
```

### 2. Configura MongoDB in .env

```env
# MongoDB (Docker)
MONGODB_URI=mongodb://localhost:27017/socialhub

# Oppure con autenticazione Docker
MONGODB_URI=mongodb://admin:admin123@localhost:27017/socialhub?authSource=admin
MONGODB_USERNAME=admin
MONGODB_PASSWORD=admin123
```

---

## ✅ Verifica

### Controlla che tutto funzioni:

1. **MongoDB** : http://localhost:27017 (o usa MongoDB Compass)
2. **Redis** : Porta 6379 (utilizzata internamente)
3. **Applicazione** : http://localhost:3000

### Comandi di verifica:

```powershell
# Controlla i contenitori Docker
docker ps

# Controlla le porte
netstat -an | findstr "27017"
netstat -an | findstr "6379"
netstat -an | findstr "3000"
```

---

## 🐛 Risoluzione dei Problemi

### Errore : "Docker non è installato"
**Soluzione** : Installa Docker Desktop e riavvia il computer.

### Errore : "MongoDB non è partito"
**Soluzione** :
```powershell
# Controlla i log
docker-compose logs mongo

# Riavvia
docker-compose restart mongo
```

### Errore : "Porta già in uso"
**Soluzione** :
```powershell
# Vedi quale processo utilizza la porta
netstat -ano | findstr "27017"
netstat -ano | findstr "3000"

# Arresta il processo (sostituisci PID)
taskkill /PID <PID> /F
```

### Errore : "MONGODB_URI mancante"
**Soluzione** : Controlla che il file `.env` esista e contenga `MONGODB_URI`.

---

## 📝 Comandi Utili

### Docker
```powershell
# Vedi i contenitori in esecuzione
docker ps

# Vedi i log di MongoDB
docker-compose logs mongo

# Riavvia MongoDB
docker-compose restart mongo

# Arresta tutti i contenitori
docker-compose stop

# Rimuovi e ricrea (⚠️ cancella i dati)
docker-compose down -v
docker-compose up -d
```

### Applicazione
```powershell
# Avvia l'applicazione
npm run dev

# Avvia il worker di pubblicazione
npm run queue

# Avvia il worker insights
npm run insights

# Installa le dipendenze
npm install
```

---

## 🎯 Checklist di Avvio

Prima di avviare, controlla:

- [ ] Docker Desktop è installato e in esecuzione
- [ ] Node.js è installato (v18+)
- [ ] Il file `.env` esiste (o sarà creato automaticamente)
- [ ] Le porte 27017, 6379 e 3000 sono libere
- [ ] Sei nella cartella del progetto

---

## 🚀 Avvio Rapido in 3 Passi

1. **Apri PowerShell** nella cartella del progetto
2. **Esegui** : `.\start.ps1`
3. **Apri** : http://localhost:3000

È tutto! 🎉

---

## 📞 Supporto

Se riscontri problemi:

1. Controlla i log nel terminale
2. Controlla i log di Docker : `docker-compose logs`
3. Consulta `RISOLUZIONE_PROBLEMI_500.md` per errori specifici
4. Consulta `GUIDA_CONNNESSIONE_DB.md` per problemi di database

---

## 💡 Suggerimenti

- **Docker Desktop** deve essere avviato prima di eseguire lo script
- Lo script **aspetta automaticamente** che MongoDB sia pronto
- I **log** vengono visualizzati direttamente nel terminale
- Puoi **tenere aperto Docker Desktop** per vedere lo stato dei contenitori

---

**Buon sviluppo! 🎉**