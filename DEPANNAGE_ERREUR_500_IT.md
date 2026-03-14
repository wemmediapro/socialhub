# 🔧 Risoluzione dei problemi - Errore 500 durante la creazione di un post

## ❌ Problema
Errore "Request failed with status code 500" durante la creazione di un nuovo post.

## 🔍 Cause possibili

### 1. **MongoDB non è connesso** ⚠️ (Causa più probabile)

**Sintomi** :
- Errore 500 nella console
- Messaggio "Database connection failed" nei log del server

**Soluzione** :
1. Verificare che MongoDB sia avviato :
   ```bash
   # Con Docker
   docker ps
   # Dovresti vedere un contenitore "mongo" in esecuzione
   
   # Se non è avviato :
   docker-compose up -d mongo
   ```

2. Verificare il file `.env` alla radice del progetto :
   ```env
   MONGODB_URI=mongodb://localhost:27017/socialhub
   # O con autenticazione Docker :
   MONGODB_URI=mongodb://admin:admin123@localhost:27017/socialhub?authSource=admin
   MONGODB_USERNAME=admin
   MONGODB_PASSWORD=admin123
   ```

3. Riavviare l'applicazione :
   ```bash
   npm run dev
   ```

---

### 2. **Il projectId "DEMO" non esiste**

**Sintomi** :
- L'errore si verifica solo durante la creazione
- Messaggio "Validation error" o "Database error"

**Soluzione** :
1. Creare un progetto reale nell'applicazione :
   - Andare su `/projects`
   - Cliccare su "Nuovo Progetto"
   - Creare un progetto con un nome

2. OPPURE modificare il codice per utilizzare un projectId esistente :
   - In `src/pages/posts/new.tsx`, il codice carica automaticamente il primo progetto disponibile
   - Se non esiste alcun progetto, creare prima un progetto

---

### 3. **Dati mancanti o non validi**

**Sintomi** :
- Errore di validazione Zod
- Messaggio "Validation error" con dettagli

**Soluzione** :
Verificare che tutti i campi richiesti siano compilati :
- ✅ Almeno un social network selezionato (Instagram, Facebook, TikTok)
- ✅ Tipo di contenuto selezionato (Post, Story, Reel, Carousel)
- ✅ Data di pubblicazione valida
- ✅ ProjectId valido (non "DEMO" se non esiste alcun progetto)

---

### 4. **Problema con il caricamento di file**

**Sintomi** :
- Errore durante il caricamento di un'immagine/video
- Messaggio "Upload failed"

**Soluzione** :
1. Verificare che la cartella `public/uploads` esista :
   ```bash
   # Creare la cartella se non esiste
   mkdir -p public/uploads
   ```

2. Verificare i permessi di scrittura su Windows
3. Verificare la dimensione del file (max 10MB per impostazione predefinita)

---

## 🧪 Test diagnostico

### Passo 1 : Verificare MongoDB
```bash
# Testare la connessione MongoDB
mongosh "mongodb://localhost:27017/socialhub"

# O con Docker
docker exec -it <container_id> mongosh "mongodb://localhost:27017/socialhub"
```

### Passo 2 : Verificare i log del server
Controlla la console del server Next.js (terminale dove hai avviato `npm run dev`) per vedere l'errore esatto.

I nuovi log dovrebbero ora mostrare :
- `"Creating post with data:"` - I dati inviati
- `"Database connection error:"` - Se MongoDB fallisce
- `"Error creating post:"` - L'errore dettagliato

### Passo 3 : Testare l'API direttamente
```bash
# Test con curl (PowerShell)
curl -X POST http://localhost:3000/api/posts `
  -H "Content-Type: application/json" `
  -d '{
    "projectId": "DEMO",
    "networks": ["instagram"],
    "type": "post",
    "caption": "Test",
    "scheduledAt": "2025-11-05T10:00:00Z"
  }'
```

---

## 🛠️ Soluzioni rapide

### Soluzione 1 : Riavviare tutti i servizi
```bash
# Fermare
docker-compose down
npm run dev # Fermare con Ctrl+C

# Riavviare
docker-compose up -d mongo
npm run dev
```

### Soluzione 2 : Verificare il file .env
Assicurati che il file `.env` esista e contenga :
```env
MONGODB_URI=mongodb://localhost:27017/socialhub
```

### Soluzione 3 : Creare prima un progetto
1. Andare su `/projects`
2. Creare un nuovo progetto
3. Tornare su `/posts/new`
4. Il progetto sarà automaticamente selezionato

---

## 📝 Checklist di verifica

- [ ] MongoDB è avviato (`docker ps` o servizio Windows)
- [ ] Il file `.env` esiste alla radice del progetto
- [ ] `MONGODB_URI` è configurato correttamente in `.env`
- [ ] Almeno un progetto esiste nel database
- [ ] La cartella `public/uploads` esiste (se stai caricando file)
- [ ] I log del server sono stati consultati per vedere l'errore esatto
- [ ] L'applicazione è stata riavviata dopo la modifica di `.env`

---

## 🔍 Log da consultare

### Console del server Next.js
Guarda il terminale dove hai avviato `npm run dev`. Dovresti vedere :
- Gli errori di connessione MongoDB
- Gli errori di validazione
- Gli errori di creazione del post

### Console del browser (F12)
Apri gli strumenti di sviluppo (F12) e controlla la scheda "Console" per vedere gli errori lato client.

### Log MongoDB (se Docker)
```bash
docker-compose logs mongo
```

---

## 💡 Miglioramenti apportati

Ho migliorato il codice per :
1. ✅ Migliore gestione degli errori con messaggi dettagliati
2. ✅ Log di debug per identificare il problema
3. ✅ Gestione specifica degli errori MongoDB
4. ✅ Gestione specifica degli errori di validazione Zod
5. ✅ Verifica della connessione MongoDB prima del trattamento

---

## 📞 Se il problema persiste

1. **Controlla i log del server** - Contengono ora più informazioni
2. **Controlla la console del browser** (F12) per vedere gli errori lato client
3. **Verifica che MongoDB funzioni** con `mongosh` o MongoDB Compass
4. **Crea un progetto** prima di creare un post se non ne hai uno

---

## 🎯 Prossimi passi

Dopo aver applicato le correzioni :
1. Riavvia l'applicazione : `npm run dev`
2. Prova a creare un post di nuovo
3. Controlla i log del server per vedere l'errore esatto
4. Condividi i log se il problema persiste