# 📧 Configuration des Notifications par Email

## 🎯 Services Email Supportés

### Option 1: Resend (Recommandé)
**Le plus simple et moderne**

```bash
npm install resend
```

Ajoutez dans `.env.local`:
```
RESEND_API_KEY=re_votre_cle_api
```

Obtenez votre clé sur: https://resend.com

### Option 2: SendGrid
**Classique et fiable**

```bash
npm install @sendgrid/mail
```

Ajoutez dans `.env.local`:
```
SENDGRID_API_KEY=SG.votre_cle_api
```

Obtenez votre clé sur: https://sendgrid.com

### Option 3: Nodemailer (SMTP)
**Pour serveur email personnalisé**

```bash
npm install nodemailer
```

Ajoutez dans `.env.local`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app
```

## 🚀 Utilisation

Le système détecte automatiquement quel service est configuré:

1. Si `RESEND_API_KEY` existe → Utilise Resend
2. Sinon si `SENDGRID_API_KEY` existe → Utilise SendGrid
3. Sinon → Log dans la console (mode démo)

## 📧 Templates Email Disponibles

### POST_CREATED
Email envoyé au créateur quand un post lui est assigné
- Icône: 📝
- Couleur: Rose gradient
- Bouton: "Voir le post"

### CONTENT_UPLOADED
Email envoyé au client quand le contenu est uploadé
- Icône: 📤
- Couleur: Vert gradient
- Bouton: "Valider le contenu"

### CLIENT_VALIDATED
Email envoyé au créateur quand le client valide
- Icône: ✅
- Couleur: Vert gradient
- Bouton: "Voir le workflow"

### CLIENT_REJECTED
Email envoyé au créateur quand le client rejette
- Icône: ❌
- Couleur: Rouge gradient
- Bouton: "Voir les corrections"

### POST_PUBLISHED
Email envoyé à tous quand le post est publié
- Icône: 🚀
- Couleur: Bleu gradient
- Bouton: "Voir les statistiques"
- Affiche: Reach, Likes, Engagement

### DEADLINE_APPROACHING
Email envoyé quand la deadline approche
- Icône: ⏰
- Couleur: Orange gradient
- Bouton: "Travailler dessus"

### COMMENT_ADDED
Email envoyé quand quelqu'un commente
- Icône: 💬
- Couleur: Bleu gradient
- Bouton: "Répondre"

### COLLAB_CREATED
Email envoyé à l'influenceur quand une collaboration est créée
- Icône: 🤝
- Couleur: Vert gradient
- Bouton: "Voir la collaboration"

## 🔧 Configuration Recommandée

### Pour le Développement Local

Utilisez **Resend** avec leur plan gratuit:
- 100 emails/jour gratuits
- Très simple à configurer
- Excellente deliverability

```bash
# 1. Créer un compte sur resend.com
# 2. Créer une API key
# 3. Ajouter dans .env.local:
RESEND_API_KEY=re_votre_cle
```

### Pour la Production

Utilisez **SendGrid** ou **Resend Pro**:
- SendGrid: 100 emails/jour gratuits, puis payant
- Resend: Plans flexibles
- Configuration DKIM/SPF pour deliverability

## 🧪 Test des Emails

### Créer une notification de test avec email:

```javascript
// Dans la console F12
fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: "DEMO_USER",
    userRole: "infographiste",
    type: "POST_CREATED",
    title: "Test Email",
    message: "Ceci est un test",
    link: "/workflow",
    priority: "high",
    userEmail: "votre_email@exemple.fr",
    userName: "Votre Nom",
    emailData: {
      postDescription: "Test Post",
      scheduledDate: "20/11/2024"
    }
  })
})
```

## 📊 Statistiques Email

Les emails incluent automatiquement:
- Logo SocialHub
- Gradient de couleurs
- Icônes par type
- Boutons d'action
- Footer avec informations

## ⚙️ Personnalisation

Pour personnaliser les templates, modifiez:
`src/services/emailService.ts`

Exemple:
```typescript
export function getEmailTemplate(type: string, recipientName: string, data: any) {
  // Modifier les templates HTML ici
}
```

## 🔐 Sécurité

⚠️ **Important:**
- Ne commitez JAMAIS votre `.env.local` dans git
- Utilisez des variables d'environnement en production
- Validez les emails avant envoi
- Limitez le rate limiting (max emails/minute)

## 📝 Notes

- Les emails sont envoyés de manière asynchrone
- Si l'envoi échoue, la notification in-app est quand même créée
- Les erreurs sont loggées dans la console
- Mode démo: emails loggés mais non envoyés

