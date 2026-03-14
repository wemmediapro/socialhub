# 🎯 Ergonomie Moderne - SocialHub Global V5

## 📋 Vue d'ensemble

Système d'ergonomie moderne avec composants UX, patterns d'interaction et meilleures pratiques pour une expérience utilisateur optimale.

---

## 🧩 Composants UX Disponibles

### 1. LoadingSpinner

Spinner de chargement moderne avec différentes tailles.

```tsx
import LoadingSpinner from '@/components/LoadingSpinner';

<LoadingSpinner size="sm" />  // Petit
<LoadingSpinner size="md" />  // Moyen (par défaut)
<LoadingSpinner size="lg" />  // Grand
```

### 2. EmptyState

État vide élégant pour les listes vides.

```tsx
import EmptyState from '@/components/EmptyState';
import { Folder } from 'lucide-react';

<EmptyState
  icon={Folder}
  title="Aucun projet"
  description="Créez votre premier projet pour commencer"
  action={<button className="btn btn-primary">Créer un projet</button>}
/>
```

### 3. Breadcrumbs

Navigation hiérarchique pour améliorer l'orientation.

```tsx
import Breadcrumbs from '@/components/Breadcrumbs';

<Breadcrumbs
  items={[
    { label: 'Projets', href: '/projects' },
    { label: 'Mon Projet', href: '/projects/123' },
    { label: 'Détails' }
  ]}
/>
```

### 4. Toast Notifications

Système de notifications toast avec hook personnalisé.

```tsx
import { useToast } from '@/hooks/useToast';

function MyComponent() {
  const { success, error, warning, info, ToastContainer } = useToast();

  const handleSave = () => {
    // ... logique de sauvegarde
    success('Projet sauvegardé', 'Vos modifications ont été enregistrées');
  };

  return (
    <>
      <button onClick={handleSave}>Sauvegarder</button>
      <ToastContainer />
    </>
  );
}
```

### 5. Modal

Modales modernes avec fermeture au clavier et overlay.

```tsx
import Modal from '@/components/Modal';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmer la suppression"
  size="md"
  footer={
    <>
      <button className="btn btn-ghost" onClick={() => setIsOpen(false)}>
        Annuler
      </button>
      <button className="btn btn-error" onClick={handleDelete}>
        Supprimer
      </button>
    </>
  }
>
  <p>Êtes-vous sûr de vouloir supprimer cet élément ?</p>
</Modal>
```

### 6. Tooltip

Infobulles contextuelles.

```tsx
import Tooltip from '@/components/Tooltip';

<Tooltip content="Cliquez pour modifier" position="top">
  <button>Modifier</button>
</Tooltip>
```

### 7. ProgressBar

Barres de progression animées.

```tsx
import ProgressBar from '@/components/ProgressBar';

<ProgressBar
  value={75}
  max={100}
  size="md"
  showLabel={true}
/>
```

---

## 🎨 Patterns UX Disponibles

### Skeleton Loaders

Affichez des placeholders pendant le chargement.

```tsx
<div className="skeleton-card">
  <div className="skeleton skeleton-avatar" />
  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
  <div className="skeleton skeleton-text" style={{ width: '40%' }} />
</div>
```

### Tabs

Navigation par onglets.

```tsx
<div className="tabs">
  <button className="tab active">Onglet 1</button>
  <button className="tab">Onglet 2</button>
  <button className="tab">Onglet 3</button>
</div>

<div className="tab-content active">
  Contenu de l'onglet 1
</div>
```

### Accordion

Sections extensibles/réductibles.

```tsx
<div className="accordion">
  <div className="accordion-item open">
    <div className="accordion-header">
      <span className="accordion-title">Section 1</span>
      <ChevronDown className="accordion-icon" />
    </div>
    <div className="accordion-content">
      <div className="accordion-body">
        Contenu de la section
      </div>
    </div>
  </div>
</div>
```

### Switch / Toggle

Interrupteurs modernes.

```tsx
<label className="switch">
  <input type="checkbox" className="switch-input" />
  <span className="switch-slider" />
</label>
```

### Search Bar

Barre de recherche avec icône.

```tsx
<div className="search-bar">
  <Search className="search-icon" size={20} />
  <input
    type="text"
    className="search-input"
    placeholder="Rechercher..."
  />
  <button className="search-clear">
    <X size={16} />
  </button>
</div>
```

### Dropdown

Menus déroulants.

```tsx
<div className="dropdown open">
  <button>Menu</button>
  <div className="dropdown-menu">
    <button className="dropdown-item">Option 1</button>
    <button className="dropdown-item">Option 2</button>
    <div className="dropdown-divider" />
    <button className="dropdown-item dropdown-item-danger">Supprimer</button>
  </div>
</div>
```

---

## ⌨️ Raccourcis Clavier

Affichage des raccourcis clavier :

```tsx
<span>
  Sauvegarder
  <span className="shortcut-hint">
    <span className="kbd">⌘</span>
    <span className="kbd">S</span>
  </span>
</span>
```

---

## 🎯 Principes d'Ergonomie Appliqués

### 1. Feedback Immédiat

- **Boutons** : États hover, active, disabled visibles
- **Actions** : Confirmations visuelles (toasts)
- **Chargement** : Spinners et skeletons pendant les opérations

### 2. Navigation Claire

- **Breadcrumbs** : Indication de la position dans l'application
- **Menu actif** : Mise en évidence de la page courante
- **Liens** : États hover et focus visibles

### 3. États de Chargement

- **Skeleton loaders** : Placeholders pendant le chargement
- **Spinners** : Indicateurs de progression
- **Progress bars** : Progression des opérations longues

### 4. Gestion des Erreurs

- **Toasts d'erreur** : Messages clairs et actionnables
- **Validation** : Feedback immédiat sur les formulaires
- **États vides** : Messages utiles avec actions suggérées

### 5. Accessibilité

- **ARIA labels** : Attributs pour les lecteurs d'écran
- **Focus visible** : Indicateurs de focus clairs
- **Navigation clavier** : Support complet du clavier
- **Contraste** : Respect des ratios de contraste WCAG

### 6. Responsive Design

- **Breakpoints** : Adaptation à toutes les tailles d'écran
- **Touch targets** : Zones de toucher suffisamment grandes
- **Layout flexible** : Grilles adaptatives

### 7. Micro-interactions

- **Transitions fluides** : Animations subtiles
- **Hover effects** : Feedback visuel au survol
- **Loading states** : Indicateurs de progression

---

## 📱 Responsive

Tous les composants sont responsive :

- **Mobile** (< 768px) : Layout adapté, modales pleine largeur
- **Tablet** (768px - 1024px) : Layout intermédiaire
- **Desktop** (> 1024px) : Layout complet

---

## 🎨 Personnalisation

Tous les composants utilisent les variables CSS du design system, permettant une personnalisation facile via les variables :

```css
/* Personnaliser les toasts */
.toast {
  --toast-bg: var(--color-white);
  --toast-border: var(--color-gray-200);
}
```

---

## 📚 Exemples d'Utilisation

### Page avec chargement

```tsx
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

if (loading) {
  return <LoadingSpinner size="lg" />;
}

if (!data || data.length === 0) {
  return (
    <EmptyState
      icon={Folder}
      title="Aucune donnée"
      description="Les données seront disponibles bientôt"
    />
  );
}

return <div>{/* Contenu */}</div>;
```

### Formulaire avec validation

```tsx
const { error, success } = useToast();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await saveData();
    success('Données sauvegardées', 'Vos modifications ont été enregistrées');
  } catch (err) {
    error('Erreur', 'Une erreur est survenue lors de la sauvegarde');
  }
};
```

### Navigation avec breadcrumbs

```tsx
<Breadcrumbs
  items={[
    { label: 'Dashboard', href: '/' },
    { label: 'Projets', href: '/projects' },
    { label: project.name, href: `/projects/${project.id}` },
    { label: 'Modifier' }
  ]}
/>
```

---

## 🚀 Bonnes Pratiques

1. **Utilisez les composants** au lieu de créer vos propres versions
2. **Feedback immédiat** : Toujours donner un retour visuel aux actions
3. **États de chargement** : Affichez des skeletons pendant le chargement
4. **Gestion d'erreurs** : Utilisez les toasts pour les erreurs
5. **Accessibilité** : Respectez les standards ARIA
6. **Performance** : Utilisez les animations CSS plutôt que JS
7. **Responsive** : Testez sur toutes les tailles d'écran

---

## 📖 Fichiers

- `src/styles/ergonomie.css` - Styles ergonomiques complets
- `src/components/LoadingSpinner.tsx` - Spinner de chargement
- `src/components/EmptyState.tsx` - États vides
- `src/components/Breadcrumbs.tsx` - Navigation hiérarchique
- `src/components/Toast.tsx` - Notifications toast
- `src/components/Modal.tsx` - Modales
- `src/components/Tooltip.tsx` - Infobulles
- `src/components/ProgressBar.tsx` - Barres de progression
- `src/hooks/useToast.ts` - Hook pour les toasts

---

**Dernière mise à jour** : Novembre 2024  
**Version** : 1.0  
**Statut** : Production Ready ✅


