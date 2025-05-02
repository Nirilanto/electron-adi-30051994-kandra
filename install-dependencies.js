// Créez ce fichier install-dependencies.js pour installer les dépendances manquantes
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Vérifier si electron-store est installé
try {
  require.resolve('electron-store');
  console.log('electron-store est déjà installé.');
} catch (e) {
  console.log('Installation de electron-store...');
  execSync('npm install --save electron-store', { stdio: 'inherit' });
}

// Vérifier les autres dépendances importantes
const dependencies = [
  'handlebars',
  'puppeteer',
  'electron-is-dev'
];

for (const dep of dependencies) {
  try {
    require.resolve(dep);
    console.log(`${dep} est déjà installé.`);
  } catch (e) {
    console.log(`Installation de ${dep}...`);
    execSync(`npm install --save ${dep}`, { stdio: 'inherit' });
  }
}

console.log('Toutes les dépendances sont maintenant installées.');

// Créer un script de démarrage simple
const batScript = '@echo off\r\n' +
  'echo Démarrage de Contrat Manager...\r\n' +
  'start "" "%~dp0node_modules\\electron\\dist\\electron.exe" "%~dp0"\r\n';

fs.writeFileSync('start-app.bat', batScript);
console.log('Script de démarrage créé: start-app.bat');