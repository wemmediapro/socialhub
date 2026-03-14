import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'it';

type Translations = {
  [key: string]: string | Translations;
};

type TranslationContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-language');
      return (saved === 'it' || saved === 'fr') ? saved : 'fr';
    }
    return 'fr';
  });
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger les traductions
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        let translationsData: Translations = {};
        
        if (language === 'fr') {
          const frModule = await import('./messages/fr.json');
          translationsData = frModule.default || frModule;
        } else if (language === 'it') {
          const itModule = await import('./messages/it.json');
          translationsData = itModule.default || itModule;
        }
        
        console.log(`[Translation] Chargé ${language}:`, Object.keys(translationsData).length, 'sections');
        setTranslations(translationsData);
      } catch (error) {
        console.error('Erreur lors du chargement des traductions:', error);
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTranslations();
    
    // Sauvegarder la préférence
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', language);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    if (!translations || Object.keys(translations).length === 0) {
      // Si les traductions ne sont pas encore chargées, retourner la clé
      return key;
    }
    
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Si la traduction n'existe pas, retourner la clé
        console.warn(`[Translation] Clé manquante: ${key} (langue: ${language})`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

