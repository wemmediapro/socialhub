# 🎨 Carta Grafica Completa - SocialHub Global V5

## 📋 Panoramica

Carta grafica moderna e completa basata su un design system esaustivo con variabili CSS, che consente una facile manutenzione, una coerenza perfetta e un'evoluzione futura.

**Versione**: 2.0  
**Ultimo aggiornamento**: Novembre 2024

---

## 🎨 Sistema di Colori

### Colori Principali

#### Primary (Indigo) - 50 a 900
| Variabile | Hex | Uso |
|-----------|-----|-----|
| `--color-primary-50` | `#eef2ff` | Sfondi molto chiari |
| `--color-primary-100` | `#e0e7ff` | Sfondi chiari |
| `--color-primary-500` | `#6366f1` | **Colore principale** |
| `--color-primary-600` | `#4f46e5` | Stati hover, attivi |
| `--color-primary-700` | `#4338ca` | Testi su sfondo chiaro |
| `--color-primary-900` | `#312e81` | Testi molto scuri |

#### Secondary (Purple) - 50 a 900
| Variabile | Hex | Uso |
|-----------|-----|-----|
| `--color-secondary-500` | `#a855f7` | **Colore secondario** |
| `--color-secondary-600` | `#9333ea` | Stati hover |

### Colori Funzionali

Ogni colore funzionale dispone di una scala completa da 50 a 900:

- **Success (Green)**: `#10b981` - Conferme, validazioni
- **Warning (Amber)**: `#f59e0b` - Avvisi, stati in attesa
- **Error (Red)**: `#ef4444` - Errori, cancellazioni
- **Info (Blue)**: `#3b82f6` - Informazioni, notifiche

### Colori Neutri

| Variabile | Hex | Uso |
|-----------|-----|-----|
| `--color-white` | `#ffffff` | Sfondo, schede |
| `--color-gray-50` | `#f9fafb` | Sfondi molto chiari |
| `--color-gray-100` | `#f3f4f6` | Sfondi di sezioni |
| `--color-gray-200` | `#e5e7eb` | Bordature leggere |
| `--color-gray-500` | `#6b7280` | Testi secondari |
| `--color-gray-900` | `#111827` | Testi principali |
| `--color-black` | `#000000` | Testi molto importanti |

### Colori Social

| Rete | Variabile | Colore |
|------|-----------|--------|
| **Facebook** | `--color-facebook` | `#1877f2` |
| **Instagram** | `--color-instagram` | `#e4405f` (gradiente disponibile) |
| **TikTok** | `--color-tiktok` | `#000000` |
| **Twitter** | `--color-twitter` | `#1da1f2` |
| **LinkedIn** | `--color-linkedin` | `#0077b5` |
| **YouTube** | `--color-youtube` | `#ff0000` |
| **Pinterest** | `--color-pinterest` | `#bd081c` |

---

## 📝 Tipografia

### Famiglie di Font

- **Sans-serif**: `Inter`, sistema nativo (Segoe UI, Roboto, ecc.)
- **Mono**: `JetBrains Mono`, `Fira Code` (codice, dati)
- **Display**: `Inter` (titoli)

### Dimensioni del Font

| Dimensione | Variabile | Pixel | Uso |
|------------|-----------|-------|-----|
| **XS** | `--font-size-xs` | 12px | Etichette, badge |
| **SM** | `--font-size-sm` | 14px | Testi secondari |
| **Base** | `--font-size-base` | 16px | Corpo del testo |
| **LG** | `--font-size-lg` | 18px | Sottotitoli |
| **XL** | `--font-size-xl` | 20px | Titoli di sezioni |
| **2XL** | `--font-size-2xl` | 24px | Titoli medi |
| **3XL** | `--font-size-3xl` | 30px | Titoli grandi |
| **4XL** | `--font-size-4xl` | 36px | Titoli molto grandi |
| **5XL** | `--font-size-5xl` | 48px | Titoli hero |
| **6XL** | `--font-size-6xl` | 60px | Grandi hero |
| **7XL** | `--font-size-7xl` | 72px | Hero molto grandi |

### Pesi del Font

| Peso | Variabile | Valore | Uso |
|------|-----------|--------|-----|
| **Thin** | `--font-weight-thin` | 100 | Molto leggero |
| **Light** | `--font-weight-light` | 300 | Testi leggeri |
| **Normal** | `--font-weight-normal` | 400 | Corpo del testo |
| **Medium** | `--font-weight-medium` | 500 | Testi medi |
| **Semibold** | `--font-weight-semibold` | 600 | Titoli, pulsanti |
| **Bold** | `--font-weight-bold` | 700 | Titoli principali |
| **Extrabold** | `--font-weight-extrabold` | 800 | Accenti |
| **Black** | `--font-weight-black` | 900 | Hero, molto importanti |

### Altezze di Riga

- `--line-height-none`: 1
- `--line-height-tight`: 1.25
- `--line-height-normal`: 1.5
- `--line-height-relaxed`: 1.625
- `--line-height-loose`: 2

### Spaziatura delle Lettere

- `--letter-spacing-tighter`: -0.05em
- `--letter-spacing-tight`: -0.025em
- `--letter-spacing-normal`: 0
- `--letter-spacing-wide`: 0.025em
- `--letter-spacing-widest`: 0.1em

---

## 📏 Spaziature

Sistema di spaziatura basato su multipli di 4px, da 0 a 96 (384px):

| Spaziatura | Variabile | Pixel | Uso |
|------------|-----------|-------|-----|
| **0** | `--spacing-0` | 0 | Reset |
| **1** | `--spacing-1` | 4px | Spazi molto piccoli |
| **2** | `--spacing-2` | 8px | Spazi piccoli |
| **3** | `--spacing-3` | 12px | Spazi medi |
| **4** | `--spacing-4` | 16px | Spazi standard |
| **6** | `--spacing-6` | 24px | Spazi ampi |
| **8** | `--spacing-8` | 32px | Spazi molto ampi |
| **12** | `--spacing-12` | 48px | Margini di sezioni |
| **16** | `--spacing-16` | 64px | Margini grandi |
| **24** | `--spacing-24` | 96px | Margini molto grandi |
| **96** | `--spacing-96` | 384px | Margini estremi |

---

## 🔲 Bordure

### Raggi di Bordo

| Raggio | Variabile | Pixel | Uso |
|--------|-----------|-------|-----|
| **None** | `--border-radius-none` | 0 | Nessun raggio |
| **SM** | `--border-radius-sm` | 2px | Elementi molto piccoli |
| **Base** | `--border-radius-base` | 4px | Elementi piccoli |
| **MD** | `--border-radius-md` | 6px | Elementi medi |
| **LG** | `--border-radius-lg` | 8px | Elementi standard |
| **XL** | `--border-radius-xl` | 12px | Pulsanti, input |
| **2XL** | `--border-radius-2xl` | 16px | Schede |
| **3XL** | `--border-radius-3xl` | 24px | Grandi schede |
| **Full** | `--border-radius-full` | 9999px | Badge, avatar |

### Spessori di Bordo

- `--border-width-0`: 0
- `--border-width-1`: 1px
- `--border-width-2`: 2px
- `--border-width-4`: 4px
- `--border-width-8`: 8px

---

## 🌑 Ombre

### Ombre Standard

| Ombra | Variabile | Uso |
|-------|-----------|-----|
| **XS** | `--shadow-xs` | Elementi molto leggeri |
| **SM** | `--shadow-sm` | Elementi leggeri |
| **MD** | `--shadow-md` | Elementi standard |
| **LG** | `--shadow-lg` | Schede, modali |
| **XL** | `--shadow-xl` | Elementi flottanti |
| **2XL** | `--shadow-2xl` | Overlays, popovers |
| **Inner** | `--shadow-inner` | Effetti incassati |
| **None** | `--shadow-none` | Nessun'ombra |

### Ombre Colorate

- `--shadow-primary`: Ombra con colore primario
- `--shadow-secondary`: Ombra con colore secondario
- `--shadow-success`: Ombra con colore di successo
- `--shadow-warning`: Ombra con colore di avviso
- `--shadow-error`: Ombra con colore di errore
- `--shadow-info`: Ombra con colore informativo

---

## ⚡ Transizioni & Animazioni

### Durate

- `--duration-75`: 75ms
- `--duration-100`: 100ms
- `--duration-150`: 150ms
- `--duration-200`: 200ms
- `--duration-300`: 300ms
- `--duration-500`: 500ms
- `--duration-700`: 700ms
- `--duration-1000`: 1000ms

### Curve di Animazione

- `--ease-linear`: Lineare
- `--ease-in`: Cubic-bezier(0.4, 0, 1, 1)
- `--ease-out`: Cubic-bezier(0, 0, 0.2, 1)
- `--ease-in-out`: Cubic-bezier(0.4, 0, 0.2, 1)
- `--ease-bounce`: Cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Animazioni Disponibili

- `.animate-fadeIn` / `.animate-fadeOut`
- `.animate-slideUp` / `.animate-slideDown`
- `.animate-slideLeft` / `.animate-slideRight`
- `.animate-scaleIn` / `.animate-scaleOut`
- `.animate-spin`
- `.animate-pulse`
- `.animate-bounce`

---

## 🎭 Gradienti

| Gradiente | Variabile | Uso |
|-----------|-----------|-----|
| **Primary** | `--gradient-primary` | Pulsanti principali |
| **Primary Hover** | `--gradient-primary-hover` | Stati hover |
| **Secondary** | `--gradient-secondary` | Accenti |
| **Success** | `--gradient-success` | Conferme |
| **Warning** | `--gradient-warning` | Avvisi |
| **Error** | `--gradient-error` | Errori |
| **Info** | `--gradient-info` | Informazioni |
| **Dark** | `--gradient-dark` | Elementi scuri |
| **Glass** | `--gradient-glass` | Glassmorphism |
| **Rainbow** | `--gradient-rainbow` | Effetti speciali |

---

## 🪟 Glassmorphism

Variabili disponibili per gli effetti glassmorphism:

- `--glass-bg`: Sfondo trasparente
- `--glass-bg-strong`: Sfondo più opaco
- `--glass-border`: Bordo trasparente
- `--glass-blur`: Effetto di sfocatura (blur)
- `--glass-shadow`: Ombra glassmorphism

---

## 🧩 Componenti Pronti all'Uso

### Pulsanti

```css
.btn-primary    /* Gradiente primario con effetto shimmer */
.btn-secondary  /* Bianco con bordo */
.btn-success    /* Verde */
.btn-warning    /* Arancione */
.btn-error      /* Rosso */
.btn-ghost      /* Trasparente con bordo */
.btn-glass      /* Glassmorphism */
```

**Dimensioni**: `.btn-sm`, `.btn-lg`, `.btn-xl`

### Schede

```css
.card           /* Scheda standard con hover */
.card-glass     /* Scheda glassmorphism */
.card-gradient  /* Scheda con gradiente */
```

### Input

```css
.input          /* Input moderno con focus */
.input-error    /* Input con stato errore */
```

### Badge

```css
.badge-primary
.badge-secondary
.badge-success
.badge-warning
.badge-error
.badge-info
```

---

## 🎯 Effetti Speciali

### Testo Gradiente

```css
.gradient-text  /* Testo con gradiente */
```

### Bordo Gradiente

```css
.gradient-border        /* Contenitore con bordo gradiente */
.gradient-border-inner  /* Contenuto interno */
```

### Luce

```css
.glow  /* Effetto di luce colorata */
```

---

## 📱 Responsive

Breakpoints definiti:

- **XS**: 0px
- **SM**: 640px
- **MD**: 768px
- **LG**: 1024px
- **XL**: 1280px
- **2XL**: 1536px

---

## 🌙 Modalità Scura

Il design system include variabili per la modalità scura (da attivare con `[data-theme="dark"]`).

Tutti i colori sono automaticamente invertiti per una resa ottimale in modalità scura.

---

## 📚 Utilizzo

### Nei componenti React

```tsx
<div className="card">
  <h2 className="gradient-text">Titolo moderno</h2>
  <button className="btn btn-primary">Azione</button>
  <span className="badge badge-success">Nuovo</span>
</div>
```

### In CSS personalizzato

```css
.mio-componente {
  background: var(--color-primary);
  padding: var(--spacing-6);
  border-radius: var(--border-radius-2xl);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-base);
}
```

### Classi utilitarie

```tsx
<div className="flex items-center justify-between gap-4 p-6 rounded-xl shadow-lg">
  <h1 className="text-3xl font-bold text-primary">Titolo</h1>
  <button className="btn btn-primary">Azione</button>
</div>
```

---

## 🎯 Buone Pratiche

1. **Utilizzare sempre le variabili CSS** invece di valori hardcoded
2. **Rispettare la spaziatura**: utilizzare le variabili `--spacing-*`
3. **Coerenza dei colori**: utilizzare la palette definita (50-900)
4. **Transizioni fluide**: utilizzare le variabili `--transition-*`
5. **Responsive**: testare su tutti i breakpoints
6. **Accessibilità**: rispettare i contrasti di colore
7. **Performance**: utilizzare le animazioni CSS piuttosto che JavaScript

---

## 📖 File

- `src/styles/design-system.css` - Variabili e design system completo (1000+ righe)
- `src/styles/globals.css` - Stili globali che utilizzano il design system
- `src/styles/modern.css` - Effetti moderni aggiuntivi

---

## 🔄 Migrazione

Se stai migrando dalla vecchia versione:

1. Sostituisci i valori hardcoded con le variabili CSS
2. Utilizza le nuove classi di componenti (`.btn`, `.card`, ecc.)
3. Approfitta delle nuove animazioni e effetti
4. Testa la modalità scura se necessario

---

**Ultimo aggiornamento**: Novembre 2024  
**Versione**: 2.0  
**Stato**: Produzione Pronta ✅