// Enregistrez ce script en tant que package-app.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Définition des chemins
const rootDir = __dirname;
const buildDir = path.join(rootDir, 'build');
const distDir = path.join(rootDir, 'dist');
const portableDir = path.join(distDir, 'portable-app');
const resourcesDir = path.join(portableDir, 'resources');
const appDir = path.join(resourcesDir, 'app');

// Créer la structure de dossiers
function createDirectories() {
  console.log('🔧 Création des dossiers nécessaires...');
  
  // Supprimer le dossier dist s'il existe déjà
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  
  // Créer les dossiers nécessaires
  fs.mkdirSync(portableDir, { recursive: true });
  fs.mkdirSync(resourcesDir, { recursive: true });
  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(path.join(resourcesDir, 'templates'), { recursive: true });
  
  console.log('✅ Structure de dossiers créée');
}

// Créer les fichiers nécessaires
function createFiles() {
  console.log('🔧 Création des fichiers de configuration...');
  
  // Créer le fichier portable.txt
  fs.writeFileSync(
    path.join(resourcesDir, 'portable.txt'),
    'Cette application s\'exécute en mode portable.\nNe pas supprimer ce fichier.'
  );
  
  // Créer un package.json simplifié
  const packageJson = {
    name: 'contrat-manager',
    version: '1.0.0',
    description: 'Application de gestion de contrats de mission temporaire',
    main: 'main.js',
    author: 'Votre Nom',
    license: 'MIT'
  };
  
  fs.writeFileSync(
    path.join(appDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Créer un script de lancement pour Windows
  fs.writeFileSync(
    path.join(distDir, 'ContratManager.bat'),
    '@echo off\r\nstart "" "%~dp0portable-app\\electron.exe" "%~dp0portable-app\\resources\\app"\r\n'
  );
  
  console.log('✅ Fichiers de configuration créés');
}

// Construire l'application React
function buildReactApp() {
  console.log('🔨 Construction de l\'application React...');
  
  try {
    // Créer un fichier .env avec la configuration correcte
    fs.writeFileSync(
      path.join(rootDir, '.env'),
      'PUBLIC_URL=./\nBROWSER=none\n'
    );
    
    // Construire l'application React
    execSync('npm run build', { stdio: 'inherit' });
    
    // Vérifier que le build a été créé
    if (!fs.existsSync(buildDir)) {
      throw new Error('Le dossier build n\'a pas été créé');
    }
    
    console.log('✅ Application React construite avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la construction React:', error.message);
    process.exit(1);
  }
}

// Modifier le fichier index.html pour corriger les chemins
function fixHtmlPaths() {
  console.log('🔧 Correction des chemins dans le fichier HTML...');
  
  const indexHtmlPath = path.join(buildDir, 'index.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Remplacer les chemins absolus par des chemins relatifs
    htmlContent = htmlContent.replace(/href="\//g, 'href="./');
    htmlContent = htmlContent.replace(/src="\//g, 'src="./');
    
    // Ajouter une balise base pour définir le chemin de base
    const baseTag = '<base href="./">';
    htmlContent = htmlContent.replace('<head>', '<head>\n  ' + baseTag);
    
    // Écrire le fichier modifié
    fs.writeFileSync(indexHtmlPath, htmlContent);
    
    console.log('✅ Chemins corrigés dans index.html');
  } else {
    console.error('❌ Le fichier index.html n\'a pas été trouvé');
  }
}

// Copier les fichiers d'application
function copyAppFiles() {
  console.log('🔧 Copie des fichiers d\'application...');
  
  // Copier le build React dans le dossier app
  fs.cpSync(buildDir, path.join(appDir, 'build'), { recursive: true });
  
  // Copier les fichiers principaux
  fs.copyFileSync(path.join(rootDir, 'main.js'), path.join(appDir, 'main.js'));
  fs.copyFileSync(path.join(rootDir, 'preload.js'), path.join(appDir, 'preload.js'));
  fs.copyFileSync(path.join(rootDir, 'config.js'), path.join(appDir, 'config.js'));
  
  // Créer et copier les dossiers templates
  if (fs.existsSync(path.join(rootDir, 'templates'))) {
    fs.cpSync(
      path.join(rootDir, 'templates'),
      path.join(resourcesDir, 'templates'),
      { recursive: true }
    );
  } else {
    // Créer les dossiers de templates s'ils n'existent pas
    fs.mkdirSync(path.join(resourcesDir, 'templates', 'contracts'), { recursive: true });
    fs.mkdirSync(path.join(resourcesDir, 'templates', 'certificates'), { recursive: true });
    
    // Extraire les templates depuis main.js
    try {
      const mainJsContent = fs.readFileSync(path.join(rootDir, 'main.js'), 'utf8');
      
      const contractTemplateMatch = mainJsContent.match(/function getContractTemplate\(\) \{[\s\S]*?return `([\s\S]*?)`;[\s\S]*?\}/);
      if (contractTemplateMatch && contractTemplateMatch[1]) {
        fs.writeFileSync(
          path.join(resourcesDir, 'templates', 'contracts', 'default.html'),
          contractTemplateMatch[1].trim()
        );
      }
      
      const certificateTemplateMatch = mainJsContent.match(/function getCertificateTemplate\(\) \{[\s\S]*?return `([\s\S]*?)`;[\s\S]*?\}/);
      if (certificateTemplateMatch && certificateTemplateMatch[1]) {
        fs.writeFileSync(
          path.join(resourcesDir, 'templates', 'certificates', 'default.html'),
          certificateTemplateMatch[1].trim()
        );
      }
    } catch (error) {
      console.warn('⚠️ Impossible d\'extraire les templates depuis main.js:', error.message);
    }
  }
  
  console.log('✅ Fichiers d\'application copiés');
}

// Modifier le fichier main.js pour corriger les chemins
function fixMainJs() {
  console.log('🔧 Correction des chemins dans main.js...');
  
  const mainJsPath = path.join(appDir, 'main.js');
  
  if (fs.existsSync(mainJsPath)) {
    let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    
    // Ajouter l'import du module protocol
    if (!mainJsContent.includes('protocol')) {
      mainJsContent = mainJsContent.replace(
        /const { app, BrowserWindow, ipcMain, dialog } = require\('electron'\);/,
        "const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');"
      );
    }
    
    // Ajouter le code pour intercepter le protocole file
    const protocolCode = `
// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigateur.
// Certaines APIs peuvent être utilisées uniquement après cet événement.
app.whenReady().then(() => {
  // Intercepter le protocole file pour corriger les chemins des ressources
  protocol.interceptFileProtocol('file', (request, callback) => {
    const url = request.url.substr(7); // Enlever le "file://"
    
    // Pour les chemins absolus (commençant par une lettre de lecteur), les traiter normalement
    if (path.isAbsolute(url)) {
      callback({ path: url });
      return;
    }
    
    // Si c'est un chemin vers un fichier dans le dossier build
    if (url.includes('/static/') || url.endsWith('.js') || url.endsWith('.css')) {
      const resolvedPath = path.normalize(path.join(__dirname, 'build', url));
      callback({ path: resolvedPath });
      return;
    }
    
    // Fallback pour les autres chemins
    callback({ path: url });
  });
  
  createWindow();
});`;
    
    // Remplacer le code existant
    mainJsContent = mainJsContent.replace(
      /app\.whenReady\(\)\.then\(createWindow\);/,
      protocolCode
    );
    
    // Ajouter le code pour corriger les chemins dans la fenêtre
    const windowFixCode = `
  // Injecter un script pour corriger les chemins des ressources
  if (!isDev) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(\`
        // Corriger les chemins absolus dans le HTML
        document.querySelectorAll('link[href^="/"], script[src^="/"]').forEach(el => {
          if (el.href) {
            el.href = el.href.replace(/^\\\//, './');
          }
          if (el.src) {
            el.src = el.src.replace(/^\\\//, './');
          }
        });
      \`);
    });
  }`;
    
    // Insérer le code juste avant la fermeture de la fonction createWindow
    mainJsContent = mainJsContent.replace(
      /(mainWindow\.on\('closed', \(\) => \{[\s\S]*?mainWindow = null;[\s\S]*?\}\);[\s\S]*?})/,
      windowFixCode + '\n\n  $1'
    );
    
    // Modifier le chemin de chargement de l'application
    mainJsContent = mainJsContent.replace(
      /mainWindow\.loadURL\(\s*isDev\s*\?\s*'http:\/\/localhost:3000'\s*:\s*`file:\/\/\${path\.join\(__dirname, '.\/build\/index.html'\)}`\s*\);/,
      "mainWindow.loadURL(\n    isDev\n      ? 'http://localhost:3000'\n      : `file://${path.join(__dirname, 'build', 'index.html')}`\n  );"
    );
    
    // Écrire le fichier modifié
    fs.writeFileSync(mainJsPath, mainJsContent);
    
    console.log('✅ Chemins corrigés dans main.js');
  } else {
    console.error('❌ Le fichier main.js n\'a pas été trouvé');
  }
}

// Copier les fichiers d'Electron
function copyElectronFiles() {
  console.log('🔧 Copie des fichiers Electron...');
  
  try {
    const electronPath = path.join(rootDir, 'node_modules', 'electron', 'dist');
    
    if (fs.existsSync(electronPath)) {
      // Copier tous les fichiers d'Electron
      fs.cpSync(electronPath, portableDir, { recursive: true });
      console.log('✅ Fichiers Electron copiés');
    } else {
      console.error('❌ Le dossier Electron n\'a pas été trouvé');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la copie des fichiers Electron:', error.message);
  }
}

// Fonction principale
function main() {
  console.log('🚀 Début du processus de création de l\'application portable...');
  
  createDirectories();
  createFiles();
  buildReactApp();
  fixHtmlPaths();
  copyAppFiles();
  fixMainJs();
  copyElectronFiles();
  
  console.log('\n✅ Application portable créée avec succès!');
  console.log(`📂 L'application se trouve dans: ${portableDir}`);
  console.log(`📄 Utilisez le fichier ${path.join(distDir, 'ContratManager.bat')} pour lancer l'application`);
}

// Exécuter la fonction principale
main();