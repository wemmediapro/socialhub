# 🌍 Système de Traduction - Guide d'utilisation

## ✅ Installation terminée

Le système de traduction gratuit est maintenant installé et configuré dans votre application !

## 📁 Structure créée

```
src/
├── i18n/
│   ├── TranslationContext.tsx      # Contexte React pour la traduction
│   └── messages/
│       ├── fr.json                 # Traductions françaises
│       └── it.json                  # Traductions italiennes
scripts/
├── extract-texts.js                 # Script pour extraire les textes
└── translate-to-italian.js          # Script de traduction automatique
```

## 🚀 Utilisation

### 1. Utiliser la traduction dans vos composants

```tsx
import { useTranslation } from '@/i18n/TranslationContext';

function MonComposant() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.subtitle')}</p>
      
      {/* Changer la langue */}
      <button onClick={() => setLanguage('it')}>
        Passer en italien
      </button>
    </div>
  );
}
```

### 2. Sélecteur de langue

Un sélecteur de langue a été ajouté dans le header (à côté de l'utilisateur). Les utilisateurs peuvent basculer entre 🇫🇷 FR et 🇮🇹 IT.

### 3. Ajouter de nouvelles traductions

#### Étape 1 : Ajouter dans `fr.json`

```json
{
  "maSection": {
    "monTexte": "Mon texte en français"
  }
}
```

#### Étape 2 : Traduire vers l'italien

**Option A : Traduction manuelle**
- Ajouter directement dans `it.json`

**Option B : Traduction automatique (gratuite)**
```bash
node scripts/translate-to-italian.js
```

### 4. Extraire les textes de l'application

Pour extraire automatiquement tous les textes de vos fichiers :

```bash
node scripts/extract-texts.js
```

Ce script créera `src/i18n/messages/fr-extracted.json` avec tous les textes trouvés.

## 📝 Format des clés de traduction

Les clés suivent une structure hiérarchique avec des points :

```json
{
  "section": {
    "sousSection": {
      "texte": "Valeur"
    }
  }
}
```

Utilisation : `t('section.sousSection.texte')`

## 🌟 Fonctionnalités

- ✅ **100% Gratuit** - Utilise des APIs gratuites
- ✅ **Persistance** - La langue choisie est sauvegardée dans localStorage
- ✅ **Type-safe** - Support TypeScript complet
- ✅ **React Context** - Intégration native avec React
- ✅ **Sélecteur visuel** - Interface intuitive dans le header

## 🔧 Personnalisation

### Changer la langue par défaut

Modifier dans `src/i18n/TranslationContext.tsx` :

```tsx
const [language, setLanguageState] = useState<Language>(() => {
  // Remplacer 'fr' par 'it' pour l'italien par défaut
  return 'fr';
});
```

### Ajouter une nouvelle langue

1. Créer `src/i18n/messages/[code].json` (ex: `es.json` pour l'espagnol)
2. Ajouter l'option dans le sélecteur de `ModernLayout.tsx`
3. Mettre à jour le type `Language` dans `TranslationContext.tsx`

## 📚 Exemples d'utilisation

### Dans les pages

```tsx
import { useTranslation } from '@/i18n/TranslationContext';

export default function MaPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Dans les composants

```tsx
import { useTranslation } from '@/i18n/TranslationContext';

export default function MonBouton() {
  const { t } = useTranslation();
  
  return <button>{t('common.cancel')}</button>;
}
```

## 🎯 Prochaines étapes

1. **Traduire toutes les pages** : Utiliser `t()` au lieu des textes hardcodés
2. **Compléter les fichiers JSON** : Ajouter toutes les traductions manquantes
3. **Tester** : Vérifier que toutes les traductions fonctionnent correctement

## 💡 Astuces

- Utilisez des clés descriptives : `dashboard.stats.projects` au lieu de `text1`
- Organisez par section logique : `posts`, `workflow`, `calendar`, etc.
- Gardez les clés en anglais pour faciliter la maintenance
- Testez régulièrement avec les deux langues

## ⚠️ Notes importantes

- Les traductions sont chargées dynamiquement au changement de langue
- La préférence de langue est sauvegardée dans le navigateur
- Si une traduction manque, la clé est affichée (ex: `dashboard.missingKey`)

## 🆘 Support

Pour ajouter de nouvelles traductions ou corriger des erreurs :
1. Modifier directement les fichiers JSON
2. Ou utiliser le script de traduction automatique
3. Recharger la page pour voir les changements

---

**Fait avec ❤️ pour une application multilingue !**













