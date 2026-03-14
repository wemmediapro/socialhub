# 🔄 Diagramme de flux - SocialHub Global V5

## 📊 Flux complet du workflow

```mermaid
graph TB
    Start([👤 Utilisateur]) --> Login[🔐 Login]
    Login --> Dashboard[📊 Dashboard]
    
    Dashboard --> CreateProject[🏗️ Créer Projet]
    CreateProject --> ProjectConfig[⚙️ Configuration Projet]
    ProjectConfig --> ConnectSocial[🔌 Connecter Réseaux Sociaux]
    
    ConnectSocial --> |Facebook| MetaOAuth[📱 OAuth Meta]
    ConnectSocial --> |Instagram| MetaOAuth
    ConnectSocial --> |TikTok| TikTokOAuth[🎵 OAuth TikTok]
    
    MetaOAuth --> ProjectReady[✅ Projet Configuré]
    TikTokOAuth --> ProjectReady
    
    ProjectReady --> ProposeIdea[💡 Proposer Idée]
    ProposeIdea --> IdeaForm[📝 Formulaire Idée]
    IdeaForm --> |Type, Caption, Visuels| IdeaSaved[💾 Idée Enregistrée]
    
    IdeaSaved --> ClientNotif[📧 Notification Client]
    ClientNotif --> ClientAccess[👤 Accès Client]
    
    ClientAccess --> ClientReview{✅ Validation Client?}
    ClientReview --> |Validé| ProductionStart[🎨 Production Créative]
    ClientReview --> |Commentaires| IdeaModif[✏️ Modifications]
    ClientReview --> |Refusé| IdeaRejected[❌ Idée Rejetée]
    
    IdeaModif --> IdeaSaved
    
    ProductionStart --> CreateVisuals[🖼️ Création Visuels/Vidéos]
    CreateVisuals --> UploadAssets[📤 Upload Cloudinary]
    UploadAssets --> FinalValidation{✅ Validation Finale?}
    
    FinalValidation --> |OK| Schedule[📅 Planification]
    FinalValidation --> |Révisions| CreateVisuals
    
    Schedule --> AddToCalendar[🗓️ Ajout Calendrier]
    AddToCalendar --> QueueJob[⚙️ File d'attente BullMQ]
    
    QueueJob --> Worker[🤖 Worker Publication]
    Worker --> |Facebook| PublishFB[📱 API Meta - Facebook]
    Worker --> |Instagram| PublishIG[📷 API Meta - Instagram]
    Worker --> |TikTok| PublishTT[🎵 API TikTok]
    
    PublishFB --> Published[🚀 Publié]
    PublishIG --> Published
    PublishTT --> Published
    
    Published --> InsightsWorker[📊 Worker Insights]
    InsightsWorker --> |Toutes les heures| FetchMetrics[📈 Récupération Métriques]
    
    FetchMetrics --> |Impressions, Reach, Engagement| StoreInsights[💾 Stockage Insights]
    StoreInsights --> Dashboard
    
    Dashboard --> Reporting[📄 Export Reporting]
    Reporting --> ClientReport[📨 Envoi Client]
    
    style Start fill:#667eea,stroke:#333,stroke-width:4px,color:#fff
    style Published fill:#43e97b,stroke:#333,stroke-width:4px,color:#fff
    style ClientReport fill:#f093fb,stroke:#333,stroke-width:4px,color:#fff
```

---

## 🎯 Détail des étapes

### 1️⃣ Authentification & Setup
```mermaid
graph LR
    A[Login] --> B[Dashboard]
    B --> C[Créer Projet]
    C --> D[Config Réseaux]
    D --> E[OAuth Connexion]
    E --> F[Projet Prêt]
    
    style A fill:#667eea,color:#fff
    style F fill:#43e97b,color:#fff
```

### 2️⃣ Proposition & Validation
```mermaid
graph LR
    A[💡 Idée Proposée] --> B[📧 Notif Client]
    B --> C{Décision Client}
    C -->|✅ Validé| D[🎨 Production]
    C -->|💬 Commentaires| E[✏️ Révision]
    C -->|❌ Refusé| F[❌ Archivé]
    E --> A
    
    style D fill:#43e97b,color:#fff
    style F fill:#dc2626,color:#fff
```

### 3️⃣ Production & Publication
```mermaid
graph LR
    A[🎨 Création] --> B[📤 Upload]
    B --> C[✅ Validation]
    C --> D[📅 Calendrier]
    D --> E[⚙️ Queue]
    E --> F[🚀 Publication]
    F --> G[📊 Insights]
    
    style A fill:#f093fb,color:#fff
    style F fill:#43e97b,color:#fff
```

### 4️⃣ Analytics & Reporting
```mermaid
graph LR
    A[📊 Post Publié] --> B[🔄 Worker Insights]
    B --> C[📈 API Métriques]
    C --> D[💾 Stockage]
    D --> E[📊 Dashboard]
    E --> F[📄 Export Report]
    
    style C fill:#4facfe,color:#fff
    style F fill:#fa709a,color:#fff
```

---

## 🔀 Flux par acteur

### 👨‍💼 Digital Marketer
```mermaid
sequenceDiagram
    participant DM as Digital Marketer
    participant Sys as Système
    participant Client as Client
    
    DM->>Sys: 1. Propose idée de post
    Sys->>DM: 2. Idée enregistrée
    Sys->>Client: 3. Notification envoyée
    Client->>Sys: 4. Valide l'idée
    Sys->>DM: 5. Notification validation
    DM->>Sys: 6. Créé les visuels
    DM->>Sys: 7. Planifie publication
    Sys->>Sys: 8. Publication auto
    Sys->>DM: 9. Confirmation + Insights
```

### 👤 Client
```mermaid
sequenceDiagram
    participant Client as Client
    participant Sys as Système
    participant Team as Équipe
    
    Sys->>Client: 1. Notification nouvelle idée
    Client->>Sys: 2. Accès espace client
    Client->>Sys: 3. Consulte proposition
    Client->>Sys: 4. Valide/Commente/Refuse
    Sys->>Team: 5. Notification décision
    Team->>Sys: 6. Production si validé
    Sys->>Client: 7. Preview avant publication
    Sys->>Client: 8. Rapport post-publication
```

### 🎨 Créatif
```mermaid
sequenceDiagram
    participant Créatif as Créatif
    participant Sys as Système
    participant DM as Digital Marketer
    participant Client as Client
    
    DM->>Créatif: 1. Brief validé transmis
    Créatif->>Sys: 2. Upload visuels créés
    Sys->>DM: 3. Notification nouveaux assets
    DM->>Sys: 4. Valide les visuels
    Sys->>Client: 5. Prévisualisation finale (optionnel)
    Client->>Sys: 6. Validation finale
    Sys->>Créatif: 7. Confirmation publication
```

---

## 🏗️ Architecture système

```mermaid
graph TB
    subgraph "Frontend"
        UI[Interface Next.js]
        Pages[Pages React]
        Styles[CSS Moderne]
    end
    
    subgraph "Backend"
        API[API Routes]
        Auth[OAuth Handler]
        Validation[Zod Validation]
    end
    
    subgraph "Database"
        Mongo[(MongoDB)]
        Models[Mongoose Models]
    end
    
    subgraph "Queue System"
        Redis[(Redis)]
        BullMQ[BullMQ Queue]
        Worker1[Worker Publish]
        Worker2[Worker Insights]
    end
    
    subgraph "External APIs"
        Meta[Meta Graph API]
        TikTok[TikTok API]
        Cloudinary[Cloudinary]
    end
    
    UI --> API
    API --> Auth
    API --> Validation
    Validation --> Models
    Models --> Mongo
    
    API --> BullMQ
    BullMQ --> Redis
    BullMQ --> Worker1
    BullMQ --> Worker2
    
    Worker1 --> Meta
    Worker1 --> TikTok
    API --> Cloudinary
    Worker2 --> Meta
    
    style UI fill:#667eea,color:#fff
    style Mongo fill:#43e97b,color:#fff
    style Meta fill:#1877f2,color:#fff
    style TikTok fill:#000,color:#fff
```

---

## 📱 Flow de publication automatique

```mermaid
stateDiagram-v2
    [*] --> Brouillon
    Brouillon --> EnAttente : Soumis au client
    EnAttente --> Validé : Client approuve
    EnAttente --> EnRévision : Client commente
    EnAttente --> Refusé : Client refuse
    
    EnRévision --> Brouillon : Modifications
    Refusé --> [*]
    
    Validé --> EnProduction : Équipe créative
    EnProduction --> PrêtÀPublier : Upload visuels
    PrêtÀPublier --> Planifié : Ajout calendrier
    
    Planifié --> EnQueue : À la date prévue
    EnQueue --> EnCours : Worker prend en charge
    EnCours --> Publié : API Success
    EnCours --> Erreur : API Fail
    
    Erreur --> EnQueue : Retry auto
    
    Publié --> Analysé : Insights activés
    Analysé --> [*]
```

---

## 🔄 Cycle de vie d'un post

```mermaid
journey
    title Cycle de vie d'une publication
    section Idéation
      Proposition d'idée: 5: Digital Marketer
      Ajout détails: 4: Digital Marketer
    section Validation
      Consultation: 5: Client
      Décision: 5: Client
    section Production
      Création visuels: 4: Créatif
      Upload assets: 5: Créatif
      Validation finale: 5: Digital Marketer
    section Publication
      Planification: 5: Système
      Publication auto: 5: Worker
      Confirmation: 5: Système
    section Reporting
      Collecte insights: 5: Worker
      Affichage dashboard: 5: Système
      Export rapport: 5: Client
```

---

## 🎯 Points clés du workflow

### ✅ Automatisation
- Publication programmée sans intervention
- Retry automatique en cas d'erreur
- Insights auto-refresh toutes les heures
- Notifications à chaque étape

### 🤝 Collaboration
- Workflow transparent équipe ↔ client
- Historique complet des échanges
- Validation en temps réel
- Commentaires intégrés

### 📊 Suivi
- Statuts en temps réel
- Métriques détaillées
- Reporting automatique
- Export PDF/Excel

---

**Visualisation complète du workflow SocialHub Global V5**


