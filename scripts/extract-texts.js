/**
 * Script pour extraire tous les textes de l'application
 * et créer un fichier fr.json avec toutes les chaînes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonctions pour chercher les textes dans les fichiers
function extractTextsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const texts = new Set();
    
    // Chercher les chaînes entre guillemets simples ou doubles
    const stringRegex = /['"`]([^'"`\n]{2,})['"`]/g;
    let match;
    
    while ((match = stringRegex.exec(content)) !== null) {
      const text = match[1];
      // Ignorer les URLs, les chemins, les classes CSS, etc.
      if (
        !text.startsWith('http') &&
        !text.startsWith('/') &&
        !text.startsWith('#') &&
        !text.startsWith('.') &&
        !text.includes('@') &&
        !text.match(/^[a-z]+:/) && // Protocoles
        text.length > 1 &&
        /[a-zA-Z]/.test(text) // Contient au moins une lettre
      ) {
        texts.add(text);
      }
    }
    
    return Array.from(texts);
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}:`, error.message);
    return [];
  }
}

function getAllTsxFiles(dir) {
  const files = [];
  
  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Ignorer node_modules, .next, etc.
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walkDir(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        // Ignorer les fichiers dans node_modules, .next, etc.
        if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walkDir(dir);
  return files;
}

// Fonction principale
function main() {
  console.log('🔍 Extraction des textes de l\'application...\n');
  
  const srcDir = path.join(__dirname, '..', 'src', 'pages');
  const files = getAllTsxFiles(srcDir);
  
  console.log(`📁 ${files.length} fichiers trouvés\n`);
  
  const allTexts = new Set();
  
  files.forEach(file => {
    const texts = extractTextsFromFile(file);
    texts.forEach(text => allTexts.add(text));
  });
  
  // Créer la structure JSON
  const translations = {
    common: {},
    dashboard: {},
    posts: {},
    workflow: {},
    calendar: {}
  };
  
  // Organiser les textes (simplifié - à améliorer)
  Array.from(allTexts).sort().forEach(text => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('dashboard') || lowerText.includes('vue d\'ensemble')) {
      translations.dashboard[text] = text;
    } else if (lowerText.includes('post')) {
      translations.posts[text] = text;
    } else if (lowerText.includes('workflow') || lowerText.includes('cycle')) {
      translations.workflow[text] = text;
    } else if (lowerText.includes('calendrier') || lowerText.includes('calendar')) {
      translations.calendar[text] = text;
    } else {
      translations.common[text] = text;
    }
  });
  
  // Écrire le fichier
  const outputPath = path.join(__dirname, '..', 'src', 'i18n', 'messages', 'fr-extracted.json');
  fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2), 'utf-8');
  
  console.log(`✅ ${allTexts.size} textes extraits dans ${outputPath}`);
  console.log('\n📝 Vous pouvez maintenant utiliser ce fichier comme base pour les traductions.');
}

main();













