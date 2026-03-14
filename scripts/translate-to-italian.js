/**
 * Script pour traduire automatiquement fr.json vers it.json
 * Utilise l'API gratuite de Google Translate via @vitalets/google-translate-api
 */

const translate = require('@vitalets/google-translate-api');
const fs = require('fs');
const path = require('path');

// Fonction pour traduire un objet récursivement
async function translateObject(obj, delay = 200) {
  const translated = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      try {
        console.log(`Traduction de: "${value.substring(0, 50)}..."`);
        
        // Utiliser la syntaxe correcte de la bibliothèque
        const result = await translate(value, { to: 'it' });
        translated[key] = result.text || value;
        
        // Délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Erreur lors de la traduction de "${value}":`, error.message);
        // Pour les mots simples, utiliser une traduction basique
        translated[key] = getBasicTranslation(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      translated[key] = await translateObject(value, delay);
    } else {
      translated[key] = value;
    }
  }
  
  return translated;
}

// Traductions basiques pour les mots courants (fallback)
function getBasicTranslation(text) {
  const basicTranslations = {
    'Dashboard': 'Dashboard',
    'Posts': 'Post',
    'Projets': 'Progetti',
    'Calendrier': 'Calendario',
    'Workflow': 'Workflow',
    'Paramètres': 'Impostazioni',
    'Déconnexion': 'Disconnetti',
    'Connexion': 'Accesso',
    'Sauvegarder': 'Salva',
    'Annuler': 'Annulla',
    'Supprimer': 'Elimina',
    'Modifier': 'Modifica',
    'Créer': 'Crea',
    'Fermer': 'Chiudi',
    'Rechercher': 'Cerca',
    'Filtrer': 'Filtra',
    'Tous': 'Tutti',
    'Chargement...': 'Caricamento...',
    'Erreur': 'Errore',
    'Succès': 'Successo'
  };
  
  return basicTranslations[text] || text;
}

// Fonction principale
async function main() {
  console.log('🇮🇹 Traduction automatique vers l\'italien...\n');
  
  const frPath = path.join(__dirname, '..', 'src', 'i18n', 'messages', 'fr.json');
  
  if (!fs.existsSync(frPath)) {
    console.error(`❌ Fichier ${frPath} introuvable!`);
    console.log('💡 Créez d\'abord le fichier fr.json avec les traductions françaises.');
    process.exit(1);
  }
  
  const frContent = JSON.parse(fs.readFileSync(frPath, 'utf-8'));
  
  console.log('📖 Lecture du fichier français...');
  console.log(`📊 ${Object.keys(frContent).length} sections trouvées\n`);
  
  console.log('🔄 Traduction en cours (cela peut prendre quelques minutes)...\n');
  
  try {
    const itContent = await translateObject(frContent, 200); // 200ms de délai entre chaque traduction
    
    const itPath = path.join(__dirname, '..', 'src', 'i18n', 'messages', 'it.json');
    fs.writeFileSync(itPath, JSON.stringify(itContent, null, 2), 'utf-8');
    
    console.log(`\n✅ Traduction terminée!`);
    console.log(`📄 Fichier créé: ${itPath}`);
    console.log('\n💡 Note: Vérifiez et corrigez manuellement les traductions si nécessaire.');
  } catch (error) {
    console.error('❌ Erreur lors de la traduction:', error);
    process.exit(1);
  }
}

main();

