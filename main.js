const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const Store = require('electron-store');

// S'assurer que le dossier de données existe
const dataPath = path.join(app.getPath('userData'), 'database');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Configurer electron-store pour stocker les données à un emplacement spécifique
Store.initRenderer();

// Conserver une référence globale de l'objet window pour éviter que
// la fenêtre soit fermée automatiquement quand l'objet JavaScript est garbage collected.
let mainWindow;

function createWindow() {
  // Créer la fenêtre du navigateur.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Charger l'URL de l'app.
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, './build/index.html')}`
  );

  // Ouvrir les DevTools en mode développement.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Émis lorsque la fenêtre est fermée.
  mainWindow.on('closed', () => {
    // Dé-référencer l'objet window, généralement vous stockeriez les fenêtres
    // dans un tableau si votre application prend en charge le multi-fenêtres,
    // c'est le moment où vous devez supprimer l'élément correspondant.
    mainWindow = null;
  });
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigateur.
// Certaines APIs peuvent être utilisées uniquement après cet événement.
app.whenReady().then(createWindow);

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS.
app.on('window-all-closed', () => {
  // Sur macOS, il est commun pour une application et leur barre de menu
  // de rester active tant que l'utilisateur ne quitte pas explicitement avec Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Sur macOS, il est commun de re-créer une fenêtre de l'application quand
  // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres d'ouvertes.
  if (mainWindow === null) {
    createWindow();
  }
});

// Gestionnaires IPC pour communiquer avec le processus de rendu
ipcMain.handle('get-app-path', async () => {
  return app.getPath('userData');
});

ipcMain.handle('get-data-path', async () => {
  return dataPath;
});

// Gestion des fichiers
ipcMain.handle('read-file', async (_, filePath) => {
  try {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    throw error;
  }
});

ipcMain.handle('write-file', async (_, filePath, content) => {
  try {
    fs.writeFileSync(path.resolve(filePath), content, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'écriture du fichier:', error);
    throw error;
  }
});

// Gérer les exports/imports de données
ipcMain.handle('export-data', async (_, data, filePath) => {
  try {
    if (!filePath) {
      filePath = path.join(app.getPath('documents'), 'contrat-manager-backup.json');
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Erreur lors de l\'export des données:', error);
    throw error;
  }
});

ipcMain.handle('import-data', async (_, filePath) => {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
    throw error;
  }
});