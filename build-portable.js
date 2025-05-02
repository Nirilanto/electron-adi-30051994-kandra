// Enregistrez ce script sous le nom build-portable.js à la racine du projet

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Définition des chemins
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'assets');
const templatesDir = path.join(rootDir, 'templates');

// Créer les dossiers nécessaires s'ils n'existent pas
function createDirectories() {
  console.log('🔧 Création des dossiers nécessaires...');
  
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('✅ Dossier assets créé');
  }
  
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
    console.log('✅ Dossier templates créé');
  }
  
  if (!fs.existsSync(path.join(templatesDir, 'contracts'))) {
    fs.mkdirSync(path.join(templatesDir, 'contracts'), { recursive: true });
    console.log('✅ Dossier templates/contracts créé');
  }
  
  if (!fs.existsSync(path.join(templatesDir, 'certificates'))) {
    fs.mkdirSync(path.join(templatesDir, 'certificates'), { recursive: true });
    console.log('✅ Dossier templates/certificates créé');
  }
}

// Créer ou mettre à jour le fichier portable.txt
function createPortableMarker() {
  console.log('🔧 Création du marqueur de mode portable...');
  
  const portableTxtContent = `Cette application s'exécute en mode portable.
Toutes les données sont stockées localement dans le dossier "data" situé au même emplacement que l'exécutable.
Ne pas supprimer ce fichier, sinon l'application ne fonctionnera pas correctement en mode portable.`;
  
  fs.writeFileSync(path.join(rootDir, 'portable.txt'), portableTxtContent);
  console.log('✅ Fichier portable.txt créé');
}

// Créer les fichiers de templates HTML si nécessaire
function createTemplateFiles() {
  console.log('🔧 Création des fichiers de templates HTML...');
  
  // Récupérer les templates depuis main.js
  let mainJsContent;
  try {
    mainJsContent = fs.readFileSync(path.join(rootDir, 'main.js'), 'utf8');
  } catch (error) {
    console.error('❌ Impossible de lire main.js:', error.message);
    return;
  }
  
  // Extraire le template de contrat
  const contractTemplateMatch = mainJsContent.match(/function getContractTemplate\(\) \{[\s\S]*?return `([\s\S]*?)`;[\s\S]*?\}/);
  if (contractTemplateMatch && contractTemplateMatch[1]) {
    fs.writeFileSync(path.join(templatesDir, 'contracts', 'default.html'), contractTemplateMatch[1].trim());
    console.log('✅ Template de contrat créé');
  } else {
    console.warn('⚠️ Template de contrat non trouvé dans main.js');
  }
  
  // Extraire le template de certificat
  const certificateTemplateMatch = mainJsContent.match(/function getCertificateTemplate\(\) \{[\s\S]*?return `([\s\S]*?)`;[\s\S]*?\}/);
  if (certificateTemplateMatch && certificateTemplateMatch[1]) {
    fs.writeFileSync(path.join(templatesDir, 'certificates', 'default.html'), certificateTemplateMatch[1].trim());
    console.log('✅ Template de certificat créé');
  } else {
    console.warn('⚠️ Template de certificat non trouvé dans main.js');
  }
}

// Créer une icône par défaut si nécessaire
function createDefaultIcon() {
  console.log('🔧 Vérification de l\'icône...');
  
  const iconPath = path.join(assetsDir, 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    console.log('⚠️ Aucune icône trouvée, création d\'une icône par défaut...');
    // Remarque: Dans un cas réel, vous devriez avoir une icône .ico
    // Cette étape est symbolique pour le script
    console.log('ℹ️ Veuillez fournir une icône dans le dossier assets/ nommée icon.ico');
  } else {
    console.log('✅ Icône trouvée');
  }
}

// Construire l'application
function buildApp() {
  console.log('🔨 Construction de l\'application React...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Construction React terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la construction React:', error.message);
    process.exit(1);
  }
  
  console.log('📦 Création de l\'exécutable portable...');
  try {
    // Utiliser npx pour s'assurer que electron-builder est correctement appelé
    execSync('npx electron-builder --win portable', { stdio: 'inherit' });
    console.log('✅ Exécutable portable créé');
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'exécutable:', error.message);
    process.exit(1);
  }
}

// Informations post-compilation
function showCompletionInfo() {
  console.log('\n🎉 Construction terminée!');
  console.log('📂 L\'exécutable portable se trouve dans:', path.join(distDir, 'win-unpacked'));
  console.log('📄 Fichier exécutable:', path.join(distDir, 'ContratManager.exe'));
  console.log('\nPour utiliser l\'application en mode portable:');
  console.log('1. Copiez ContratManager.exe sur votre clé USB');
  console.log('2. Copiez le fichier portable.txt à côté de l\'exécutable');
  console.log('3. Lancez l\'application depuis la clé USB');
  console.log('\nUn dossier "data" sera créé automatiquement pour stocker vos données.');
}

// Exécution principale
function main() {
  console.log('🚀 Début de la construction de l\'application portable...');
  
  createDirectories();
  createPortableMarker();
  createTemplateFiles();
  createDefaultIcon();
  buildApp();
  showCompletionInfo();
}

main();