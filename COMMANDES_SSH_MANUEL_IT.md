# 🔐 Configurazione SSH - Comandi Manuali

## 🔴 Problema

Lo script `setup-ssh-github.sh` non è sul server perché `git pull` fallisce senza SSH configurato.

## ✅ Soluzione: Configurazione Manuale Diretta

Esegui questi comandi **uno per uno** sul server:

### Passo 1: Generare la Chiave SSH

```bash
ssh-keygen -t ed25519 -C "tuo-email@example.com"
```

- Premi **Invio** per accettare il percorso predefinito
- Inserisci una password (o lascia vuoto)
- Conferma la password

### Passo 2: Visualizzare la Chiave Pubblica

```bash
cat ~/.ssh/id_ed25519.pub
```

**📋 COPIA TUTTO IL CONTENUTO** che appare (inizia con `ssh-ed25519` e termina con la tua email).

### Passo 3: Aggiungere la Chiave su GitHub

1. **Apri il tuo browser** e vai su: https://github.com/settings/keys
2. **Clicca su "New SSH key"** (o "Add SSH key")
3. **Titolo**: "Server SocialHub" (o qualsiasi nome)
4. **Incolla la chiave pubblica** che hai copiato
5. **Clicca su "Add SSH key"**

### Passo 4: Testare la Connessione SSH

```bash
ssh -T git@github.com
```

Dovresti vedere:
```
Hi web483! You've successfully authenticated, but GitHub does not provide shell access.
```

✅ Se vedi questo, va bene!

### Passo 5: Configurare Git per Utilizzare SSH

```bash
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git
```

### Passo 6: Testare il Pull

```bash
git pull origin main
```

Ora dovrebbe funzionare! ✅

---

## 📋 Riepilogo dei Comandi (Copia-Incolla)

```bash
# 1. Generare la chiave
ssh-keygen -t ed25519 -C "tuo-email@example.com"
# (Premi Invio 3 volte per accettare i valori predefiniti)

# 2. Visualizzare la chiave pubblica (COPIA TUTTO)
cat ~/.ssh/id_ed25519.pub

# 3. Aggiungi la chiave su https://github.com/settings/keys

# 4. Testare
ssh -T git@github.com

# 5. Configurare Git
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git

# 6. Testare il pull
git pull origin main
```

---

## 🔄 Alternativa: Utilizzare HTTPS Temporaneamente

Se vuoi recuperare lo script prima con HTTPS:

```bash
cd /root/socialhub_global_v5

# Cambiare temporaneamente per HTTPS
git remote set-url origin https://github.com/web483/socialhub_global_v5.git

# Pull con HTTPS (dovrai inserire le tue credenziali GitHub)
git pull origin main

# Ora hai lo script, configura SSH
chmod +x setup-ssh-github.sh
./setup-ssh-github.sh

# Poi ripristina SSH
git remote set-url origin git@github.com:web483/socialhub_global_v5.git
```

---

## ⚠️ Nota

Una volta configurato SSH, potrai utilizzare `git pull` e `./deploy.sh` senza problemi! 🎉