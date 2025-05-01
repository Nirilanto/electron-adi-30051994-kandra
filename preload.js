const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Exposer des API protégées au processus de rendu
contextBridge.exposeInMainWorld('electron', {
  // Obtenir les chemins d'accès
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  
  // Fonctions utilitaires pour les chemins
  path: {
    join: (...args) => path.join(...args)
  },
  
  // Méthodes pour les fichiers
  fileSystem: {
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content)
  },
  
  // Méthodes pour l'import/export de données
  data: {
    exportData: (data, filePath) => ipcRenderer.invoke('export-data', data, filePath),
    importData: (filePath) => ipcRenderer.invoke('import-data', filePath)
  }
});

// Cette API sera disponible dans le processus de rendu sous window.electron