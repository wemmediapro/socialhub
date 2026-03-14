# 🎨 Charte Graphique Complète - SocialHub Global V5

## 📋 Vue d'ensemble

Charte graphique moderne et complète basée sur un design system exhaustif avec variables CSS, permettant une maintenance facile, une cohérence parfaite et une évolution future.

**Version**: 2.0  
**Dernière mise à jour**: Novembre 2024

---

## 🎨 Système de Couleurs

### Couleurs Principales

#### Primary (Indigo) - 50 à 900
| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-primary-50` | `#eef2ff` | Backgrounds très légers |
| `--color-primary-100` | `#e0e7ff` | Backgrounds légers |
| `--color-primary-500` | `#6366f1` | **Couleur principale** |
| `--color-primary-600` | `#4f46e5` | États hover, actifs |
| `--color-primary-700` | `#4338ca` | Textes sur fond clair |
| `--color-primary-900` | `#312e81` | Textes très foncés |

#### Secondary (Purple) - 50 à 900
| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-secondary-500` | `#a855f7` | **Couleur secondaire** |
| `--color-secondary-600` | `#9333ea` | États hover |

### Couleurs Fonctionnelles

Chaque couleur fonctionnelle dispose d'une échelle complète de 50 à 900 :

- **Success (Green)**: `#10b981` - Confirmations, validations
- **Warning (Amber)**: `#f59e0b` - Avertissements, états en attente
- **Error (Red)**: `#ef4444` - Erreurs, suppressions
- **Info (Blue)**: `#3b82f6` - Informations, notifications

### Couleurs Neutres

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-white` | `#ffffff` | Backgrounds, cartes |
| `--color-gray-50` | `#f9fafb` | Backgrounds très légers |
| `--color-gray-100` | `#f3f4f6` | Backgrounds de sections |
| `--color-gray-200` | `#e5e7eb` | Bordures légères |
| `--color-gray-500` | `#6b7280` | Textes secondaires |
| `--color-gray-900` | `#111827` | Textes principaux |
| `--color-black` | `#000000` | Textes très importants |

### Couleurs Réseaux Sociaux

| Réseau | Variable | Couleur |
|--------|----------|---------|
| **Facebook** | `--color-facebook` | `#1877f2` |
| **Instagram** | `--color-instagram` | `#e4405f` (gradient disponible) |
| **TikTok** | `--color-tiktok` | `#000000` |
| **Twitter** | `--color-twitter` | `#1da1f2` |
| **LinkedIn** | `--color-linkedin` | `#0077b5` |
| **YouTube** | `--color-youtube` | `#ff0000` |
| **Pinterest** | `--color-pinterest` | `#bd081c` |

---

## 📝 Typographie

### Familles de Polices

- **Sans-serif**: `Inter`, système natif (Segoe UI, Roboto, etc.)
- **Mono**: `JetBrains Mono`, `Fira Code` (code, données)
- **Display**: `Inter` (titres)

### Tailles de Police

| Taille | Variable | Pixels | Usage |
|--------|----------|--------|-------|
| **XS** | `--font-size-xs` | 12px | Labels, badges |
| **SM** | `--font-size-sm` | 14px | Textes secondaires |
| **Base** | `--font-size-base` | 16px | Corps de texte |
| **LG** | `--font-size-lg` | 18px | Sous-titres |
| **XL** | `--font-size-xl` | 20px | Titres de sections |
| **2XL** | `--font-size-2xl` | 24px | Titres moyens |
| **3XL** | `--font-size-3xl` | 30px | Titres grands |
| **4XL** | `--font-size-4xl` | 36px | Titres très grands |
| **5XL** | `--font-size-5xl` | 48px | Hero titles |
| **6XL** | `--font-size-6xl` | 60px | Grands hero |
| **7XL** | `--font-size-7xl` | 72px | Très grands hero |

### Poids de Police

| Poids | Variable | Valeur | Usage |
|-------|----------|--------|-------|
| **Thin** | `--font-weight-thin` | 100 | Très léger |
| **Light** | `--font-weight-light` | 300 | Textes légers |
| **Normal** | `--font-weight-normal` | 400 | Corps de texte |
| **Medium** | `--font-weight-medium` | 500 | Textes moyens |
| **Semibold** | `--font-weight-semibold` | 600 | Titres, boutons |
| **Bold** | `--font-weight-bold` | 700 | Titres principaux |
| **Extrabold** | `--font-weight-extrabold` | 800 | Accents |
| **Black** | `--font-weight-black` | 900 | Hero, très importants |

### Hauteurs de Ligne

- `--line-height-none`: 1
- `--line-height-tight`: 1.25
- `--line-height-normal`: 1.5
- `--line-height-relaxed`: 1.625
- `--line-height-loose`: 2

### Letter Spacing

- `--letter-spacing-tighter`: -0.05em
- `--letter-spacing-tight`: -0.025em
- `--letter-spacing-normal`: 0
- `--letter-spacing-wide`: 0.025em
- `--letter-spacing-widest`: 0.1em

---

## 📏 Espacements

Système d'espacement basé sur des multiples de 4px, de 0 à 96 (384px) :

| Espacement | Variable | Pixels | Usage |
|------------|----------|--------|-------|
| **0** | `--spacing-0` | 0 | Reset |
| **1** | `--spacing-1` | 4px | Très petits espaces |
| **2** | `--spacing-2` | 8px | Petits espaces |
| **3** | `--spacing-3` | 12px | Espaces moyens |
| **4** | `--spacing-4` | 16px | Espaces standards |
| **6** | `--spacing-6` | 24px | Espaces larges |
| **8** | `--spacing-8` | 32px | Espaces très larges |
| **12** | `--spacing-12` | 48px | Marges de sections |
| **16** | `--spacing-16` | 64px | Marges grandes |
| **24** | `--spacing-24` | 96px | Marges très grandes |
| **96** | `--spacing-96` | 384px | Marges extrêmes |

---

## 🔲 Bordures

### Rayons de Bordure

| Rayon | Variable | Pixels | Usage |
|-------|----------|--------|-------|
| **None** | `--border-radius-none` | 0 | Pas de rayon |
| **SM** | `--border-radius-sm` | 2px | Très petits éléments |
| **Base** | `--border-radius-base` | 4px | Petits éléments |
| **MD** | `--border-radius-md` | 6px | Éléments moyens |
| **LG** | `--border-radius-lg` | 8px | Éléments standards |
| **XL** | `--border-radius-xl` | 12px | Boutons, inputs |
| **2XL** | `--border-radius-2xl` | 16px | Cartes |
| **3XL** | `--border-radius-3xl` | 24px | Grandes cartes |
| **Full** | `--border-radius-full` | 9999px | Badges, avatars |

### Épaisseurs de Bordure

- `--border-width-0`: 0
- `--border-width-1`: 1px
- `--border-width-2`: 2px
- `--border-width-4`: 4px
- `--border-width-8`: 8px

---

## 🌑 Ombres

### Ombres Standards

| Ombre | Variable | Usage |
|-------|----------|-------|
| **XS** | `--shadow-xs` | Éléments très légers |
| **SM** | `--shadow-sm` | Éléments légers |
| **MD** | `--shadow-md` | Éléments standards |
| **LG** | `--shadow-lg` | Cartes, modals |
| **XL** | `--shadow-xl` | Éléments flottants |
| **2XL** | `--shadow-2xl` | Overlays, popovers |
| **Inner** | `--shadow-inner` | Effets enfoncés |
| **None** | `--shadow-none` | Pas d'ombre |

### Ombres Colorées

- `--shadow-primary`: Ombre avec couleur primary
- `--shadow-secondary`: Ombre avec couleur secondary
- `--shadow-success`: Ombre avec couleur success
- `--shadow-warning`: Ombre avec couleur warning
- `--shadow-error`: Ombre avec couleur error
- `--shadow-info`: Ombre avec couleur info

---

## ⚡ Transitions & Animations

### Durées

- `--duration-75`: 75ms
- `--duration-100`: 100ms
- `--duration-150`: 150ms
- `--duration-200`: 200ms
- `--duration-300`: 300ms
- `--duration-500`: 500ms
- `--duration-700`: 700ms
- `--duration-1000`: 1000ms

### Courbes d'Animation

- `--ease-linear`: Linear
- `--ease-in`: Cubic-bezier(0.4, 0, 1, 1)
- `--ease-out`: Cubic-bezier(0, 0, 0.2, 1)
- `--ease-in-out`: Cubic-bezier(0.4, 0, 0.2, 1)
- `--ease-bounce`: Cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Animations Disponibles

- `.animate-fadeIn` / `.animate-fadeOut`
- `.animate-slideUp` / `.animate-slideDown`
- `.animate-slideLeft` / `.animate-slideRight`
- `.animate-scaleIn` / `.animate-scaleOut`
- `.animate-spin`
- `.animate-pulse`
- `.animate-bounce`

---

## 🎭 Dégradés

| Dégradé | Variable | Usage |
|---------|----------|-------|
| **Primary** | `--gradient-primary` | Boutons principaux |
| **Primary Hover** | `--gradient-primary-hover` | États hover |
| **Secondary** | `--gradient-secondary` | Accents |
| **Success** | `--gradient-success` | Confirmations |
| **Warning** | `--gradient-warning` | Avertissements |
| **Error** | `--gradient-error` | Erreurs |
| **Info** | `--gradient-info` | Informations |
| **Dark** | `--gradient-dark` | Éléments sombres |
| **Glass** | `--gradient-glass` | Glassmorphism |
| **Rainbow** | `--gradient-rainbow` | Effets spéciaux |

---

## 🪟 Glassmorphism

Variables disponibles pour les effets glassmorphism :

- `--glass-bg`: Background transparent
- `--glass-bg-strong`: Background plus opaque
- `--glass-border`: Bordure transparente
- `--glass-blur`: Effet de flou (blur)
- `--glass-shadow`: Ombre glassmorphism

---

## 🧩 Composants Prêts à l'Emploi

### Boutons

```css
.btn-primary    /* Gradient primary avec effet shimmer */
.btn-secondary  /* Blanc avec bordure */
.btn-success    /* Vert */
.btn-warning    /* Orange */
.btn-error      /* Rouge */
.btn-ghost      /* Transparent avec bordure */
.btn-glass      /* Glassmorphism */
```

**Tailles**: `.btn-sm`, `.btn-lg`, `.btn-xl`

### Cartes

```css
.card           /* Carte standard avec hover */
.card-glass     /* Carte glassmorphism */
.card-gradient  /* Carte avec gradient */
```

### Inputs

```css
.input          /* Input moderne avec focus */
.input-error    /* Input avec état erreur */
```

### Badges

```css
.badge-primary
.badge-secondary
.badge-success
.badge-warning
.badge-error
.badge-info
```

---

## 🎯 Effets Spéciaux

### Gradient Text

```css
.gradient-text  /* Texte avec gradient */
```

### Gradient Border

```css
.gradient-border        /* Conteneur avec bordure gradient */
.gradient-border-inner  /* Contenu intérieur */
```

### Glow

```css
.glow  /* Effet de lueur colorée */
```

---

## 📱 Responsive

Breakpoints définis :

- **XS**: 0px
- **SM**: 640px
- **MD**: 768px
- **LG**: 1024px
- **XL**: 1280px
- **2XL**: 1536px

---

## 🌙 Mode Sombre

Le design system inclut des variables pour le mode sombre (à activer avec `[data-theme="dark"]`).

Toutes les couleurs sont automatiquement inversées pour un rendu optimal en mode sombre.

---

## 📚 Utilisation

### Dans les composants React

```tsx
<div className="card">
  <h2 className="gradient-text">Titre moderne</h2>
  <button className="btn btn-primary">Action</button>
  <span className="badge badge-success">Nouveau</span>
</div>
```

### En CSS personnalisé

```css
.mon-composant {
  background: var(--color-primary);
  padding: var(--spacing-6);
  border-radius: var(--border-radius-2xl);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-base);
}
```

### Classes utilitaires

```tsx
<div className="flex items-center justify-between gap-4 p-6 rounded-xl shadow-lg">
  <h1 className="text-3xl font-bold text-primary">Titre</h1>
  <button className="btn btn-primary">Action</button>
</div>
```

---

## 🎯 Bonnes Pratiques

1. **Utilisez toujours les variables CSS** au lieu de valeurs codées en dur
2. **Respectez l'espacement** : utilisez les variables `--spacing-*`
3. **Cohérence des couleurs** : utilisez la palette définie (50-900)
4. **Transitions fluides** : utilisez les variables `--transition-*`
5. **Responsive** : testez sur tous les breakpoints
6. **Accessibilité** : respectez les contrastes de couleurs
7. **Performance** : utilisez les animations CSS plutôt que JavaScript

---

## 📖 Fichiers

- `src/styles/design-system.css` - Variables et design system complet (1000+ lignes)
- `src/styles/globals.css` - Styles globaux utilisant le design system
- `src/styles/modern.css` - Effets modernes additionnels

---

## 🔄 Migration

Si vous migrez depuis l'ancienne version :

1. Remplacez les valeurs codées en dur par les variables CSS
2. Utilisez les nouvelles classes de composants (`.btn`, `.card`, etc.)
3. Profitez des nouvelles animations et effets
4. Testez le mode sombre si nécessaire

---

**Dernière mise à jour** : Novembre 2024  
**Version** : 2.0  
**Statut** : Production Ready ✅
