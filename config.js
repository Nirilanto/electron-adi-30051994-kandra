// Création d'un fichier config.js pour gérer les chemins de l'application portable
// Enregistrer ce fichier à la racine du projet

const path = require("path");
const { app } = require("electron");
const fs = require("fs");

// Déterminer si l'application est en mode portable
// (exécutée depuis une clé USB ou un dossier portable)
function isPortable() {
  const exePath = app.getPath("exe");
  const exeDir = path.dirname(exePath);

  // Vérifier si un fichier "portable.txt" existe dans le même dossier que l'exécutable
  return fs.existsSync(path.join(exeDir, "portable.txt"));
}

// Configurer les chemins d'accès pour le mode portable
function configurePortablePaths() {
  const exePath = app.getPath("exe");
  const exeDir = path.dirname(exePath);
  const portableDataPath = path.join(exeDir, "data");

  // Créer le dossier data s'il n'existe pas
  if (!fs.existsSync(portableDataPath)) {
    fs.mkdirSync(portableDataPath, { recursive: true });
  }

  // Rediriger les chemins d'accès standards de l'application vers le dossier portable
  app.setPath("userData", portableDataPath);
  app.setPath("appData", path.join(portableDataPath, "appData"));
  app.setPath("logs", path.join(portableDataPath, "logs"));
  app.setPath("temp", path.join(portableDataPath, "temp"));

  return {
    dataPath: portableDataPath,
    databasePath: path.join(portableDataPath, "database"),
    templatesPath: path.join(exeDir, "resources", "templates"),
  };
}

// Configurer les chemins d'accès pour le mode installé
function configureInstalledPaths() {
  const userDataPath = app.getPath("userData");
  const databasePath = path.join(userDataPath, "database");

  // Créer le dossier database s'il n'existe pas
  if (!fs.existsSync(databasePath)) {
    fs.mkdirSync(databasePath, { recursive: true });
  }

  return {
    dataPath: userDataPath,
    databasePath: databasePath,
    templatesPath: path.join(app.getAppPath(), "resources", "templates"),
  };
}

// Exporter la configuration
const appIsPortable = isPortable();
const paths = appIsPortable
  ? configurePortablePaths()
  : configureInstalledPaths();

module.exports = {
  isPortable: appIsPortable,
  paths: paths,
};
