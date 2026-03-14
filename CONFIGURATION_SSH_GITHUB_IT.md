# 🔐 Configurazione SSH per GitHub

## 🔴 Problema Attuale

Hai questo errore:
```
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

Questo significa che la chiave SSH non è configurata o non è stata aggiunta a GitHub.

## ✅ Soluzione: Configurare la Chiave SSH

### Passo 1: Verificare se Esiste Già una Chiave SSH

```bash
ls -la ~/.ssh
```

Se vedi `id_ed25519` o `id_rsa`, hai già una chiave. Passa al passo 2. Altrimenti, genera una nuova chiave (passo 1b).

### Passo 1b: Generare una Nuova Chiave SSH

```bash
ssh-keygen -t ed25519 -C "tuo-email@example.com"
```

- Premi **Invio** per accettare la posizione predefinita (`/root/.ssh/id_ed25519`)
- Inserisci una **password** (o lascia vuoto per maggiore semplicità)
- Conferma la password

### Passo 2: Visualizzare la Chiave Pubblica

```bash
cat ~/.ssh/id_ed25519.pub
```

**Copia tutto il contenuto** che inizia con `ssh-ed25519` e termina con la tua email.

### Passo 3: Aggiungere la Chiave a GitHub

1. **Vai su GitHub**: https://github.com/settings/keys
2. **Clicca su "New SSH key"** (o "Add SSH key")
3. **Dai un titolo**: "Server SocialHub" (o qualsiasi nome)
4. **Incolla la chiave pubblica** nel campo "Key"
5. **Clicca su "Add SSH key"**

### Passo 4: Testare la Connessione SSH

```bash
ssh -T git@github.com
```

Dovresti vedere:
```
Hi web483! You've successfully authenticated, but GitHub does not provide shell access.
```

Se vedi questo, va bene! ✅

### Passo 5: Configurare Git per Utilizzare SSH

```bash
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git
```

### Passo 6: Testare il Pull

```bash
git pull origin main
```

Dovrebbe funzionare ora! ✅

---

## 🔄 Alternativa: Utilizzare HTTPS con Token

Se preferisci utilizzare HTTPS invece di SSH:

### Passo 1: Creare un Personal Access Token

1. Vai su: https://github.com/settings/tokens
2. Clicca su "Generate new token (classic)"
3. Dai un nome: "Server SocialHub"
4. Seleziona lo scope: `repo` (tutti i diritti)
5. Clicca su "Generate token"
6. **Copia il token** (non potrai più vederlo dopo!)

### Passo 2: Configurare Git con il Token

```bash
cd /root/socialhub_global_v5
git remote set-url origin https://IL_TUO_TOKEN@github.com/web483/socialhub_global_v5.git
```

**Sostituisci `IL_TUO_TOKEN` con il token che hai copiato.**

### Passo 3: Testare

```bash
git pull origin main
```

---

## 🎯 Raccomandazione

**Utilizza SSH** (primo metodo) perché:
- ✅ Più sicuro
- ✅ Non è necessario rigenerare token
- ✅ Funziona a lungo termine
- ✅ Standard per i server

---

## ⚠️ Risoluzione dei Problemi

### Se "Permission denied" persiste dopo aver aggiunto la chiave:

1. **Verifica che la chiave sia stata aggiunta correttamente**:
```bash
cat ~/.ssh/id_ed25519.pub
```
Confronta con ciò che è su GitHub.

2. **Verifica i permessi**:
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

3. **Testa la connessione**:
```bash
ssh -vT git@github.com
```
Il `-v` mostra dettagli di debug.

### Se hai più chiavi SSH:

Crea un file `~/.ssh/config`:
```bash
cat > ~/.ssh/config << EOF
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
EOF

chmod 600 ~/.ssh/config
```

---

## 📝 Riepilogo dei Comandi

```bash
# 1. Generare la chiave (se non già fatto)
ssh-keygen -t ed25519 -C "tuo-email@example.com"

# 2. Visualizzare la chiave pubblica
cat ~/.ssh/id_ed25519.pub
# (Copia e aggiungi su GitHub)

# 3. Testare la connessione
ssh -T git@github.com

# 4. Configurare Git
cd /root/socialhub_global_v5
git remote set-url origin git@github.com:web483/socialhub_global_v5.git

# 5. Testare il pull
git pull origin main
```

Una volta configurato, lo script `deploy.sh` potrà fare pull automatici senza problemi! 🎉