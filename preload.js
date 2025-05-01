// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs protégées au processus de rendu (React)
contextBridge.exposeInMainWorld('electron', {
  // Obtenir les chemins d'accès
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  
  // APIs pour la gestion des fichiers
  fileSystem: {
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content)
  },
  
  // APIs pour les dialogues de fichiers
  dialog: {
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options)
  },
  
  // API pour la génération de PDF
  generatePDF: (type, data, filename) => 
    ipcRenderer.invoke('generate-pdf', { type, data, filename }),
  
  // APIs pour l'importation/exportation des données
  data: {
    exportData: (data, filePath) => ipcRenderer.invoke('export-data', data, filePath),
    importData: (filePath) => ipcRenderer.invoke('import-data', filePath)
  },
  
  // Information sur l'environnement
  isElectron: true,
  appVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Utilitaires
  clipboard: {
    writeText: (text) => ipcRenderer.invoke('clipboard-write-text', text),
    readText: () => ipcRenderer.invoke('clipboard-read-text')
  },
  
  // Navigation
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell-open-external', url),
    openPath: (path) => ipcRenderer.invoke('shell-open-path', path)
  }
});

// Ajouter des écouteurs d'événements pour les notifications du processus principal
contextBridge.exposeInMainWorld('electronEvents', {
  onPDFGenerated: (callback) => {
    ipcRenderer.on('pdf-generated', (_, result) => callback(result));
  },
  onDataExported: (callback) => {
    ipcRenderer.on('data-exported', (_, result) => callback(result));
  },
  onDataImported: (callback) => {
    ipcRenderer.on('data-imported', (_, result) => callback(result));
  },
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('pdf-generated');
    ipcRenderer.removeAllListeners('data-exported');
    ipcRenderer.removeAllListeners('data-imported');
  }
});