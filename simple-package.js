// simple-package.js - Version simplifiée qui ne supprime pas le dossier dist
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Définition des chemins avec timestamp pour éviter les conflits
const rootDir = __dirname;
const timestamp = new Date().getTime();
const distDir = path.join(rootDir, `dist-${timestamp}`);
const portableDir = path.join(distDir, 'portable-app');
const resourcesDir = path.join(portableDir, 'resources');
const appDir = path.join(resourcesDir, 'app');
const nodeModulesDir = path.join(appDir, 'node_modules');

// Liste des dépendances à copier
const dependencies = [
  'electron-store',
  'handlebars',
  'puppeteer',
  'electron-is-dev'
];

// Créer les dossiers
console.log('🔧 Création des dossiers nécessaires...');
fs.mkdirSync(portableDir, { recursive: true });
fs.mkdirSync(resourcesDir, { recursive: true });
fs.mkdirSync(appDir, { recursive: true });
fs.mkdirSync(nodeModulesDir, { recursive: true });
fs.mkdirSync(path.join(resourcesDir, 'templates'), { recursive: true });
fs.mkdirSync(path.join(resourcesDir, 'templates', 'contracts'), { recursive: true });
fs.mkdirSync(path.join(resourcesDir, 'templates', 'certificates'), { recursive: true });

// Copier les fichiers principaux
console.log('🔧 Copie des fichiers principaux...');
fs.copyFileSync(path.join(rootDir, 'main.js'), path.join(appDir, 'main.js'));
fs.copyFileSync(path.join(rootDir, 'preload.js'), path.join(appDir, 'preload.js'));
fs.copyFileSync(path.join(rootDir, 'config.js'), path.join(appDir, 'config.js'));

// Créer le fichier portable.txt
fs.writeFileSync(
  path.join(resourcesDir, 'portable.txt'),
  'Cette application s\'exécute en mode portable.\nNe pas supprimer ce fichier.'
);

// Créer un package.json simplifié
console.log('🔧 Création d\'un package.json simplifié...');
const packageJson = {
  name: 'contrat-manager',
  version: '1.0.0',
  description: 'Application de gestion de contrats de mission temporaire',
  main: 'main.js',
  dependencies: {}
};

// Lire le package.json original pour récupérer les versions des dépendances
try {
  const originalPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  
  dependencies.forEach(dep => {
    if (originalPackage.dependencies && originalPackage.dependencies[dep]) {
      packageJson.dependencies[dep] = originalPackage.dependencies[dep];
    }
  });
} catch (error) {
  console.warn('⚠️ Impossible de lire le package.json original:', error.message);
}

// Écrire le package.json simplifié
fs.writeFileSync(
  path.join(appDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Copier le dossier build s'il existe
console.log('🔧 Copie du dossier build...');
if (fs.existsSync(path.join(rootDir, 'build'))) {
  // Utiliser execSync pour copier, car fs.cpSync peut causer des problèmes avec certains fichiers
  if (process.platform === 'win32') {
    execSync(`xcopy "${path.join(rootDir, 'build')}" "${path.join(appDir, 'build')}" /E /I /Y`);
  } else {
    execSync(`cp -R "${path.join(rootDir, 'build')}" "${path.join(appDir, 'build')}"`);
  }
} else {
  console.warn('⚠️ Le dossier build n\'existe pas, il faut d\'abord construire l\'application React.');
}

// Installer les dépendances dans le dossier node_modules
console.log('🔧 Installation des dépendances...');
const currentDir = process.cwd();

try {
  process.chdir(appDir);
  execSync('npm install --only=prod', { stdio: 'inherit' });
  console.log('✅ Dépendances installées');
} catch (error) {
  console.error('❌ Erreur lors de l\'installation des dépendances:', error.message);
} finally {
  process.chdir(currentDir);
}

// Copier les fichiers d'Electron
console.log('🔧 Copie des fichiers Electron...');
const electronPath = path.join(rootDir, 'node_modules', 'electron', 'dist');

if (fs.existsSync(electronPath)) {
  if (process.platform === 'win32') {
    execSync(`xcopy "${electronPath}" "${portableDir}" /E /I /Y`);
  } else {
    execSync(`cp -R "${electronPath}" "${portableDir}"`);
  }
  console.log('✅ Fichiers Electron copiés');
} else {
  console.error('❌ Le dossier Electron n\'a pas été trouvé');
}

// Créer un script de lancement pour Windows
console.log('🔧 Création du script de lancement...');
fs.writeFileSync(
  path.join(distDir, 'ContratManager.bat'),
  '@echo off\r\nstart "" "%~dp0portable-app\\electron.exe" "%~dp0portable-app\\resources\\app"\r\n'
);

console.log('\n✅ Application portable créée avec succès!');
console.log(`📂 L'application se trouve dans: ${portableDir}`);
console.log(`📄 Utilisez le fichier ${path.join(distDir, 'ContratManager.bat')} pour lancer l'application`);