const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
// const isDev = false; //require('electron-is-dev');
const isDev = true; //require('electron-is-dev');
const fs = require("fs");
const Store = require("electron-store");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");

// Importer la configuration des chemins d'accès
const config = require("./config");

// Configurer electron-store pour stocker les données à l'emplacement spécifique
Store.initRenderer();

// S'assurer que le dossier de base de données existe
const dataPath = config.paths.databasePath;
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Conserver une référence globale de l'objet window pour éviter que
// la fenêtre soit fermée automatiquement quand l'objet JavaScript est garbage collected.
let mainWindow;

function createWindow() {
  // Créer la fenêtre du navigateur.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Charger l'URL de l'app.
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "./build/index.html")}`
  );

  // Ouvrir les DevTools en mode développement.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Ajouter après la création de la fenêtre
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:",
          ],
        },
      });
    }
  );

  // Émis lorsque la fenêtre est fermée.
  mainWindow.on("closed", () => {
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
app.on("window-all-closed", () => {
  // Sur macOS, il est commun pour une application et leur barre de menu
  // de rester active tant que l'utilisateur ne quitte pas explicitement avec Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // Sur macOS, il est commun de re-créer une fenêtre de l'application quand
  // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres d'ouvertes.
  if (mainWindow === null) {
    createWindow();
  }
});

// Gestionnaires IPC pour communiquer avec le processus de rendu
ipcMain.handle("get-app-path", async () => {
  return app.getPath("userData");
});

ipcMain.handle("get-data-path", async () => {
  return dataPath;
});

ipcMain.handle("get-is-portable", async () => {
  return config.isPortable;
});

ipcMain.handle("get-app-version", async () => {
  return app.getVersion();
});

// Gestion des fichiers
ipcMain.handle("read-file", async (_, filePath) => {
  try {
    return fs.readFileSync(path.resolve(filePath), "utf8");
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier:", error);
    throw error;
  }
});

ipcMain.handle("write-file", async (_, filePath, content) => {
  try {
    fs.writeFileSync(path.resolve(filePath), content, "utf8");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier:", error);
    throw error;
  }
});

// Gérer les exports/imports de données
ipcMain.handle("export-data", async (_, data, filePath) => {
  try {
    if (!filePath) {
      // Demander où enregistrer le fichier
      const result = await dialog.showSaveDialog({
        title: "Exporter les données",
        defaultPath: path.join(
          app.getPath("documents"),
          "contrat-manager-backup.json"
        ),
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (result.canceled) {
        return { success: false, reason: "canceled" };
      }

      filePath = result.filePath;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return { success: true, filePath };
  } catch (error) {
    console.error("Erreur lors de l'export des données:", error);
    throw error;
  }
});

ipcMain.handle("import-data", async (_, filePath) => {
  try {
    if (!filePath) {
      // Demander quel fichier importer
      const result = await dialog.showOpenDialog({
        title: "Importer des données",
        properties: ["openFile"],
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (result.canceled) {
        return { success: false, reason: "canceled" };
      }

      filePath = result.filePaths[0];
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { success: true, data };
  } catch (error) {
    console.error("Erreur lors de l'import des données:", error);
    throw error;
  }
});

// Dialogue pour sélectionner des fichiers
ipcMain.handle("show-save-dialog", async (_, options) => {
  return await dialog.showSaveDialog(options);
});

ipcMain.handle("show-open-dialog", async (_, options) => {
  return await dialog.showOpenDialog(options);
});

// Ajouter les gestionnaires pour le presse-papier
ipcMain.handle("clipboard-write-text", async (_, text) => {
  require("electron").clipboard.writeText(text);
  return { success: true };
});

ipcMain.handle("clipboard-read-text", async () => {
  return require("electron").clipboard.readText();
});

// Ajouter les gestionnaires pour le shell
ipcMain.handle("shell-open-external", async (_, url) => {
  await require("electron").shell.openExternal(url);
  return { success: true };
});

ipcMain.handle("shell-open-path", async (_, path) => {
  await require("electron").shell.openPath(path);
  return { success: true };
});

// Amélioration de la fonction generate-pdf dans main.js

ipcMain.handle("generate-pdf", async (_, args) => {
  try {
    const { type, data, filename } = args;

    // Obtenir le chemin complet du fichier
    let outputPath = filename;

    // Si le chemin n'est pas absolu, demander où enregistrer le fichier
    if (!path.isAbsolute(filename)) {
      const result = await dialog.showSaveDialog({
        title: "Enregistrer le PDF",
        defaultPath: path.join(app.getPath("documents"), filename),
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });

      if (result.canceled) {
        return { success: false, reason: "canceled" };
      }

      outputPath = result.filePath;
    }

    // Déterminer le template à utiliser
    let template;
    if (type === "certificate") {
      template = getCertificateTemplate();
    } else if (type === "employee_contract") {
      template = getEmployeeContractTemplate();
    } else if (type === "client_contract") {
      template = getClientContractTemplate();
    } else {
      template = getClientContractTemplate(); // Par défaut
    }

    // Ajouter la date actuelle et l'année aux données
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${now.getFullYear()}`;

    // Traiter les signatures et tampons en base64
    let enhancedData = {
      ...data,
      generationDate: data.generationDate || formattedDate,
      year: data.year || now.getFullYear(),
    };

    // Vérifier si les images sont bien formatées et présentes
    console.log(
      "Signature:",
      enhancedData.signature
        ? enhancedData.signature.substring(0, 30) + "..."
        : "Aucune"
    );
    console.log(
      "Tampon:",
      enhancedData.stamp ? enhancedData.stamp.substring(0, 30) + "..." : "Aucun"
    );

    // Enregistrer d'helpers Handlebars personnalisés
    handlebars.registerHelper("hasImage", function (value) {
      return typeof value === "string" && value.startsWith("data:image");
    });

    // Compiler le template avec Handlebars
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate(enhancedData);

    // Créer un fichier HTML temporaire pour faciliter le débogage
    const tempHtmlPath = path.join(
      app.getPath("temp"),
      `temp_${Date.now()}.html`
    );
    fs.writeFileSync(tempHtmlPath, html, "utf8");
    console.log(`Fichier HTML temporaire créé: ${tempHtmlPath}`);

    // Lancer Puppeteer pour générer le PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Désactiver la limitation CSP et autoriser les images base64
    await page.setBypassCSP(true);

    // Charger le HTML à partir du fichier temporaire - meilleure approche pour les images base64
    await page.goto(`file://${tempHtmlPath}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Vérifier si les images sont présentes et chargées
    const imagesCheck = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.map((img) => ({
        src: img.src.substring(0, 30) + "...",
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        class: img.className,
      }));
    });
    console.log("Images détectées:", imagesCheck);

    // Générer le PDF avec les options appropriées
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    await browser.close();

    // Supprimer le fichier HTML temporaire après utilisation
    try {
      fs.unlinkSync(tempHtmlPath);
    } catch (error) {
      console.error(
        "Erreur lors de la suppression du fichier temporaire:",
        error
      );
    }

    // Ouvrir le PDF automatiquement après la génération
    const { shell } = require("electron");
    shell.openPath(outputPath);

    return {
      success: true,
      filePath: outputPath,
      fileName: path.basename(outputPath),
    };
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Ajoutez ces nouvelles fonctions pour obtenir les templates HTML des PDFs

function getClientContractTemplate() {
    return `<!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contrat de Mise à Disposition 001</title>
          <style>
              /* Réinitialisation et styles de base */
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 10px; /* Augmenté de 9px à 10px */
                  line-height: 1.3;
                  color: #333;
                  background-color: #f5f5f5;
                  font-weight: 300;
              }
              
              /* Définition format A4 avec espacement réduit en haut */
              .page {
                  width: 210mm;
                  height: 297mm;
                  padding: 3mm 8mm 8mm 8mm; /* Réduit de 5mm à 3mm */
                  margin: 0 auto;
                  background-color: white;
                  position: relative;
              }
              
              /* Header restructuré selon demande */
              .entete {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
              }
              
              .entete-gauche {
                  display: flex;
                  flex-direction: column;
              }
              
              .entete-droite {
                  display: flex;
                  flex-direction: column;
                  align-items: flex-end;
              }
              
              .logo {
                  font-size: 26px; /* Augmenté de 22px à 26px */
                  font-weight: 700;
                  color: #1a1a1a;
                  letter-spacing: 1.5px;
                  margin-bottom: 4px;
              }
              
              .infos-societe {
                  font-size: 9px; /* Augmenté de 8px à 9px */
                  color: #777;
                  letter-spacing: 0.2px;
                  margin-bottom: 2px;
              }
              
              .titre-contrat {
                  font-weight: 800;
                  font-size: 13px;
                  color: #1a1a1a;
                  letter-spacing: 0.5px;
                  text-transform: uppercase;
                  margin-bottom: 6px;
                  text-align: right;
              }
              
              .contrat-dates {
                  display: flex;
                  justify-content: flex-end;
                  align-items: center;
                  font-size: 10px;
                  color: #333;
                  margin-bottom: 5px;
                  font-weight: 600;
              }
              
              .date-item {
                  margin-left: 10px;
              }
              
              .numero-contrat {
                  font-weight: 800;
                  font-size: 13px;
                  color: #1a1a1a;
                  text-align: right;
                  border: 1px solid #1a1a1a;
                  padding: 2px 8px;
                  background-color: #f3f3f3;
                  border-radius: 2px;
              }
              
              /* Section - ajusté avec moins d'espacement */
              .section {
                  margin-bottom: 5px;
                  border: 1px solid #e0e0e0;
                  border-radius: 2px;
                  overflow: hidden;
              }
              
              .titre-section {
                  background-color: #f0f0f0;
                  padding: 4px 10px;
                  font-weight: 600;
                  font-size: 10px; /* Augmenté de 9px à 10px */
                  color: #333;
                  letter-spacing: 0.5px;
                  text-transform: uppercase;
                  border-bottom: 1px solid #cccccc;
              }
              
              .contenu-section {
                  padding: 5px 10px;
                  background-color: #ffffff;
              }
              
              /* Grilles et mise en page - espacement réduit */
              .grille {
                  display: grid;
                  grid-template-columns: 50% 50%;
                  gap: 5px;
              }
              
              .grille-3-cols {
                  display: grid;
                  grid-template-columns: 33.3% 33.3% 33.3%;
                  gap: 5px;
              }
              
              .champ {
                  margin-bottom: 5px;
              }
              
              .label {
                  font-weight: 600;
                  font-size: 9px; /* Augmenté de 8px à 9px */
                  color: #777;
                  margin-bottom: 2px;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
              }
              
              .label-petit {
                  font-weight: 400;
                  font-size: 9px; /* Augmenté de 8px à 9px */
                  color: #777;
                  font-style: italic;
                  margin-top: 2px;
              }
              
              .valeur {
                  font-size: 10px; /* Augmenté de 9px à 10px */
                  color: #333;
                  font-weight: 400;
              }
              
              .valeur-importante {
                  font-weight: 600;
                  color: #1a1a1a;
              }
              
              /* Format pour le titre de séjour - reformaté en 2 lignes */
              .titre-sejour {
                  display: grid;
                  grid-template-columns: 50% 50%;
                  gap: 4px;
                  font-size: 10px;
              }
              
              .titre-sejour-ligne {
                  margin-bottom: 2px;
              }
              
              /* Style pour labels et valeurs sur la même ligne */
              .label-inline {
                  display: inline-block;
                  margin-right: 5px;
              }
              
              .valeur-inline {
                  display: inline-block;
              }
              
              /* Horaires */
              .horaires {
                  display: grid;
                  grid-template-columns: 10% 30% 10% 30%;
                  gap: 2px;
                  align-items: center;
                  margin-bottom: 4px;
                  background-color: #f7f7f7;
                  padding: 4px;
                  border-radius: 2px;
              }
              
              /* Checkbox moderne et minimaliste */
              .checkbox {
                  width: 11px;
                  height: 11px;
                  border: 1px solid #999;
                  border-radius: 2px;
                  display: inline-block;
                  position: relative;
                  vertical-align: middle;
                  margin-right: 4px;
                  background-color: #f7f7f7;
              }
              
              .checkbox.checked {
                  background-color: #333;
                  border-color: #333;
              }
              
              .checkbox.checked:after {
                  content: "";
                  position: absolute;
                  top: 2px;
                  left: 4px;
                  width: 3px;
                  height: 6px;
                  border: solid white;
                  border-width: 0 2px 2px 0;
                  transform: rotate(45deg);
              }
    
              /* Style pour les options avec checkbox - sur la même ligne */
              .options-container {
                  display: flex;
                  align-items: center;
                  gap: 15px;
              }
              
              .option-row {
                  display: flex;
                  align-items: center;
                  margin-bottom: 0;
              }
              
              .option-label {
                  margin-left: 5px;
                  font-size: 10px;
              }
              
              /* Liste modernisée */
              .liste-moderne {
                  list-style: none;
              }
              
              .liste-moderne li {
                  position: relative;
                  padding-left: 10px;
                  margin-bottom: 2px;
                  line-height: 1.4;
              }
              
              .liste-moderne li:before {
                  content: "";
                  position: absolute;
                  left: 0;
                  top: 4px;
                  width: 4px;
                  height: 4px;
                  background-color: #555;
                  border-radius: 50%;
              }
              
              /* Signature - modifié pour alignement gauche/droite */
              .signature-section {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 3px;
                  width: 100%;
              }
              
              .signature-box-left {
                  width: 38%;
                  padding: 3px 0;
                  text-align: left;
              }
              
              .signature-box-right {
                  width: 35%;
                  padding: 3px 0;
                  text-align: right;
              }
          
              .fait-a {
                  text-align: center;
                  font-weight: 500;
                  font-size: 11px;
                  margin: 25px 0 5px 0; /* Réduit de 25px à 15px et 8px à 5px */
              }
              
              /* Company name plus compact */
              .company-name-signature {
                  font-size: 12px; /* Réduit de 13px à 12px */
                  font-weight: 700;
                  color: #1a1a1a;
                  margin: 2px 0; /* Réduit de 5px à 2px */
              }
              
              /* Images de signature et tampon */
              .signature-image {
                  max-width: 100%;
                  max-height: 184px; /* Augmenté de 150px à 180px */
                  display: block;
                  margin: 5px 0;
              }
              
              .petit-texte {
                  font-size: 9px; /* Augmenté de 8px à 9px */
                  color: #242222;
                  line-height: 1.3;
              }
              
              /* Législation plus compacte */
              .legislation {
                  font-size: 9px;
                  line-height: 1.3; /* Réduit de 1.4 à 1.3 */
                  color:#1a1a1a;
              }
              
              .legislation-item {
                  position: relative;
                  padding-left: 10px;
                  margin-bottom: 2px; /* Réduit de 4px à 2px */
              }
              
              .legislation-item:before {
                  content: "-";
                  position: absolute;
                  left: 0;
                  top: 0;
              }
              
              /* Pied de page */
              .page-number {
                  position: absolute;
                  bottom: 7mm;
                  right: 10mm;
                  font-size: 9px; /* Augmenté de 8px à 9px */
                  color: #999;
                  font-weight: 300;
              }
              
              /* Divider plus compact */
              .divider {
                  height: 1px;
                  background-color: #e0e0e0;
                  margin: 3px 0; /* Réduit de 5px à 3px */
              }
              
              .tag {
                  display: inline-block;
                  background-color: #f3f3f3;
                  color: #1a1a1a;
                  padding: 2px 6px;
                  border-radius: 2px;
                  font-size: 9px; /* Augmenté de 8px à 9px */
                  font-weight: 500;
                  margin-right: 3px;
                  border-left: 2px solid #777;
              }
              
              /* Notes de bas de section */
              .note {
                  font-size: 9px; /* Augmenté de 8px à 9px */
                  color: #3b3939;
                  font-style: italic;
                  margin-top: 6px;
                  padding-top: 4px;
                  border-top: 1px dotted #e0e0e0;
              }
              
              /* Précision sur le poste - équilibrage des colonnes */
              .colonne-gauche, .colonne-droite {
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  height: 100%;
              }
              
              /* Styles pour la page 2 - Conditions Générales */
              .page-2 {
                  width: 210mm;
                  height: 297mm;
                  padding: 10mm;
                  margin: 0 auto;
                  background-color: white;
                  position: relative;
                  overflow: hidden;
                  page-break-before: always;
              }
              
              .entete-page-2 {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 8px;
                  border-bottom: 1px solid #e0e0e0;
                  padding-bottom: 5px;
              }
              
              .titre-page-2 {
                  font-weight: 600;
                  font-size: 10px;
                  color: #1a1a1a;
                  text-align: center;
              }
              
              .contenu-page-2 {
                  column-count: 2;
                  column-gap: 15px;
                  text-align: justify;
                  font-size: 7px;
                  line-height: 1.25;
                  color: #444;
              }
              
              .section-page-2 {
                  break-inside: avoid-column;
                  margin-bottom: 6px;
              }
              
              .titre-section-page-2 {
                  font-weight: 700;
                  font-size: 8px;
                  color: #1a1a1a;
                  margin-bottom: 3px;
              }
              
              .paragraphe {
                  margin-bottom: 4px;
                  text-align: justify;
              }
              
              .liste {
                  padding-left: 8px;
                  margin-bottom: 4px;
              }
              
              .liste-item {
                  position: relative;
                  margin-bottom: 2px;
                  padding-left: 6px;
              }
              
              .liste-item:before {
                  content: "·";
                  position: absolute;
                  left: 0;
                  top: -1px;
              }
              
              .colonne-droite-force {
                  break-before: column;
              }
              
              /* Impression */
              @media print {
                  body {
                      background: none;
                  }
                  .page, .page-2 {
                      margin: 0;
                      box-shadow: none;
                  }
                  .page {
                      page-break-after: always;
                  }
              }
          </style>
      </head>
      <body>
          <div class="page">
              <!-- En-tête restructuré selon demande -->
              <div class="entete">
                  <div class="entete-gauche">
                      <div class="logo">{{company.name}}</div>
                      <div class="infos-societe">{{company.address}} {{company.zipCode}} {{company.city}}</div>
                      <div class="infos-societe">SIRET: {{company.siret}} - APE: {{company.ape}}</div>
                      <div class="infos-societe">{{company.email}} - Tél: {{company.phone}}</div>
                  </div>
                  <div class="entete-droite">
                      <div class="titre-contrat">CONTRAT DE MISE À DISPOSITION</div>
                      <div class="contrat-dates">
                          <div class="date-item">Du: {{startDate}}</div>
                          <div class="date-item">Au: {{endDate}}</div>
                      </div>
                      <div class="numero-contrat">N° {{reference}}</div>
                  </div>
              </div>
      
              <!-- Salarié temporaire -->
              <div class="section">
                  <div class="titre-section">SALARIÉ TEMPORAIRE</div>
                  <div class="contenu-section">
                      <div class="grille">
                          <div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Nom, Prénom:</div>
                                  <div class="valeur valeur-importante" style="display: inline-block;">{{employee.lastName}} {{employee.firstName}}</div>
                              </div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">N° S.S.:</div>
                                  <div class="valeur valeur-importante" style="display: inline-block;">{{employee.socialSecurityNumber}}</div>
                              </div>
                              <div class="champ">
                                  <div class="label">Adresse</div>
                                  <div class="valeur valeur-importante">
                                      {{employee.address}}<br>
                                      {{#if employee.addressComplement}}{{employee.addressComplement}}<br>{{/if}}
                                      {{employee.postalCode}} {{employee.city}}
                                  </div>
                              </div>
                          </div>
                          <div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Nationalité:</div>
                                  <div class="valeur valeur-importante" style="display: inline-block;">{{employee.nationality}}</div>
                              </div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Qualification:</div>
                                  <div class="valeur valeur-importante" style="display: inline-block;">{{employee.skills}}</div>
                              </div>
                              <!-- Restructuration de l'affichage du titre de séjour en 2 lignes -->
                              <div class="champ">
                                  <div class="label">Nature et N° du Titre Séjour</div>
                                  <div class="titre-sejour">
                                      <div class="titre-sejour-ligne"><strong>Nature:</strong> {{employee.idCardType}}</div>
                                      <div class="titre-sejour-ligne"><strong>N°:</strong> {{employee.idCardNumber}}</div>
                                      <div class="titre-sejour-ligne"><strong>Date délivrance:</strong> {{employee.idCardIssueDate}}</div>
                                      <div class="titre-sejour-ligne"><strong>Date expiration:</strong> {{employee.idCardExpiryDate}}</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
      
              <!-- Entreprise utilisatrice -->
              <div class="section">
                  <div class="titre-section">ENTREPRISE UTILISATRICE</div>
                  <div class="contenu-section">
                      <div class="grille">
                          <div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Raison Sociale:</div>
                                  <div class="valeur valeur-importante" style="display: inline-block;">{{client.companyName}}</div>
                              </div>
                              <div class="champ">
                                  <div class="label">Adresse</div>
                                  <div class="valeur">
                                      {{client.address}}<br>
                                      {{client.postalCode}} {{client.city}}
                                  </div>
                              </div>
  
                          </div>
                          <div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">SIRET:</div>
                                  <div class="valeur" style="display: inline-block;">{{client.siret}}</div>
                              </div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Code NAF:</div>
                                  <div class="valeur" style="display: inline-block;">{{client.nafCode}}</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
      
              <!-- Précisions sur le poste - colonnes équilibrées -->
              <div class="section">
                  <div class="titre-section" style="padding-top: 6px; padding-bottom: 6px;">PRÉCISION SUR LE POSTE / FACTURATION</div>
                  <div class="contenu-section">
                      <div class="grille" style="align-items: stretch;">
                          <div class="colonne-gauche">
                              <div>
                                  <div class="champ">
                                      <div class="label">Durée de la Mission</div>
                                      <div class="valeur valeur-importante">Du {{startDate}} Au {{endDate}}</div>
                                  </div>
                                  <div class="champ">
                                      <div class="label">Durée collective moyenne hebdomadaire</div>
                                      <div class="valeur valeur-importante">{{weeklyCollectiveAvgDuration}} HEURES</div>
                                  </div>
                                  <div class="champ">
                                      <div class="label">Lieu de Mission</div>
                                      <div class="valeur valeur-importante">{{location}}</div>
                                  </div>
                                  
                                  <div class="divider"></div>
                                  
                                  <div class="champ">
                                      <div class="label" style="display: inline-block; margin-right: 5px;">Salaire de Référence /H:</div>
                                      <div class="valeur valeur-importante" style="display: inline-block;">{{hourlyRate}} €</div>
                                  </div>
                                  
                                  <div class="champ">
                                      <div class="label" style="display: inline-block; margin-right: 5px;">Tarif Horaire H.T.:</div>
                                      <div class="valeur valeur-importante" style="display: inline-block;">{{billingRate}} €</div>
                                  </div>
                                  
                                  <div class="champ">
                                      <div class="label" style="display: inline-block; margin-right: 5px;">Mode de Paiement:</div>
                                      <div class="valeur valeur-importante" style="display: inline-block;">{{paymentMethod}}</div>
                                  </div>
                                  
                                  <div class="champ">
                                      <div class="label" style="display: inline-block; margin-right: 5px;">Moyen d'Accès:</div>
                                      <div class="valeur valeur-importante" style="display: inline-block;">{{transport}}</div>
                                  </div>
                              </div>
                          </div>
                          
                          <div class="colonne-droite">
                              <div>
                                  <div class="champ">
                                      <div class="label">Horaire de la Mission</div>
                                      {{#each workingHoursSlots}}
                                      <div class="horaires">
                                          <div>De</div>
                                          <div>{{this.start}}</div>
                                          <div>À</div>
                                          <div>{{this.end}}</div>
                                      </div>
                                      {{/each}}
                                  </div>
                                  
                                  <div class="divider"></div>
                                  
                                  <div class="champ">
                                      <div class="label">Période(s) Non Travaillée(s)</div>
                                      <div class="options-container">
                                          <div class="option-row">
                                              <div class="checkbox checked"></div>
                                              <div class="option-label">TERME PRECIS</div>
                                          </div>
                                          <div class="option-row">
                                              <div class="checkbox"></div>
                                              <div class="option-label">DUREE MINIMALE</div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              
                              <div>
                                  <div class="divider"></div>
                                  
                                  <div class="champ">
                                      <div class="label">CARACTERISTIQUES PARTICULIERES DU POSTE DE TRAVAIL</div>
                                      <div class="label-petit">(s'il y a lieu nature des protections individuelles de sécurité et surveillance médiale spéciale)</div>
                                      <div class="valeur">
                                          <ul class="liste-moderne">
                                              {{#each securityMeasures}}
                                              <li>{{this}}</li>
                                              {{/each}}
                                          </ul>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div class="divider"></div>
                      
                      <div>
                          <div class="champ" style="display: flex; align-items: center;">
                              <div class="label" style="margin-right: 5px;">Le poste figure-t-il sur la liste des postes de risques prévues à l'article L.4154-2 CT ?</div>
                              <div class="checkbox {{#if isRiskPosition}}checked{{/if}}"></div>
                          </div>
                          
<div class="note" style="border-top: none; margin-top: 3px;">*Le terme de la mission prévu dans le contrat initiale ou dans l'avenant de prolongations peut être aménagé dans les conditions stipulées aux articles L.1251-30 CT et L.1251-31 CT</div>
                      </div>
                  </div>
              </div>
      
              <!-- Législation sans colonnes, format original -->
              <div class="section">
                  <div class="titre-section">LÉGISLATION</div>
                  <div class="contenu-section">
                      <div class="legislation">
                          <div class="legislation-item">L'utilisateur prend en charge les frais d'accès aux installations collectives (art L.251-24 CT)</div>
                          <div class="legislation-item">L'embauche par l'utilisateur à l'issue de la mission n'est pas interdite, sous réserve des interdictions fixées aux articles L.1251-36 du CT</div>
                          <div class="legislation-item">Les informations concernant le motif, la durée, la rémunération** et les caractéristiques particulières du poste de travail sont données sous la responsabilité de l'utilisateur, seul habilité à les justifier, sans qu'il y ait lieu à mise en demeure préalable de la part de l'ETT.</div>
                          <div class="legislation-item">Les jours fériés chômés et payés dans l'entreprise utilisatrice sont dûs aux salariés temporaires sans condition d'ancienneté et facturés.</div>
                          <div class="legislation-item">** Sous peine de sanctions pénales prévues par l'article L.1254-1 et s. du CT</div>
                      </div>
                  </div>
              </div>
      
              <!-- Motif de la mission -->
              <div class="section">
                  <div class="titre-section">MOTIF</div>
                  <div class="contenu-section">
                      <div class="grille-3-cols">
                          <div>
                              <div class="label">Motif</div>
                              <div class="valeur"><span class="tag">{{motif}}</span></div>
                          </div>
                          <div>
                              <div class="label">Motif Additionnel</div>
                              <div class="valeur">{{additionalMotif}}</div>
                          </div>
                          <div>
                              <div class="label">Justificatif du Recours</div>
                              <div class="valeur">{{justificatif}}</div>
                          </div>
                      </div>
                  </div>
              </div>
              <!-- Date et lieu centrés -->
              <div class="fait-a">FAIT A TOURS LE {{startDate}}</div>
      
              <!-- Signatures alignées gauche et droite avec nom de l'entreprise -->
              <div class="signature-section">
                  <div class="signature-box-left" style="padding-left: 0;">
                    <div style="width: 86%;">   
                      <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 10px; text-align: center;">L'ENTREPRISE DE TRAVAIL TEMPORAIRE</div>
                      <div class="company-name-signature" style="text-align: center;">{{company.name}}</div>
                      <div class="petit-texte" style="text-align: center;">
                          (Cachet et Signature)
                      </div>
                     </div>
                      {{#if (hasImage signature)}}
                          <img src="{{signature}}" alt="Signature ETT" class="signature-image" style="margin-left: 0;">
                      {{/if}}
                  </div>
                  <div class="signature-box-right" style="padding-right: 0;">
                      <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 10px; text-align: center;">L'ENTREPRISE UTILISATRICE</div>
                      <div class="company-name-signature" style="text-align: center;">{{client.companyName}}</div>
                      <div class="petit-texte" style="text-align: center;">
                          (Cachet et Signature)
                      </div>
                  </div>
              </div>   
<div class="page-number">Page 1 sur 2</div>          
          </div>
          
          <!-- DÉBUT PAGE 2 - CONDITIONS GÉNÉRALES -->
          <div class="page-2">
              <!-- En-tête -->
              <div class="entete-page-2">
                  <div class="titre-page-2">Conditions générales de prestations</div>
              </div>
              
              <!-- Contenu principal -->
              <div class="contenu-page-2">
                  <div class="section-page-2">
                      <div class="titre-section-page-2">1 - CONTRATS</div>
                      <div class="paragraphe">
                          Cette prestation fait l'objet d'un contrat écrit entre l'utilisateur et l'entreprise de travail temporaire (ETT).
                          L'objet exclusif de ce contrat est l'exécution d'une tâche précise et temporaire dénommée « mission » par la 
                          mise à la disposition de l'utilisateur d'un salarié.
                      </div>
                      <div class="paragraphe">
                          Pour permettre l'établissement du contrat, la demande de prestation écrite devra obligatoirement préciser :
                      </div>
                      <div class="paragraphe">
                          a) Le motif pour lequel il est recouru au salarié intérimaire, cette mention devant être assortie de justifications précises :
                      </div>
                      <div class="liste">
                          <div class="liste-item">1) Remplacement d'un salarié ou du chef d'entreprise (art. L. 1251-6 1°, 4° et 5° CT).</div>
                          <div class="liste-item">2) Accroissement temporaire d'activité (art. L. 1251-6 2° CT).</div>
                          <div class="liste-item">3) Travaux temporaires par nature (art. L. 1251-6 3° CT) : Emplois à caractère saisonnier, Emplois pour lesquels il est d'usage constant de ne pas recourir au contrat à durée indéterminée.</div>
                          <div class="liste-item">4) Lorsque la mission de travail temporaire vise, en application de dispositions législatives ou réglementaires, ou d'un accord de branche étendu, à faciliter l'embauche de personnes sans emploi rencontrant des difficultés sociales et professionnelles particulières (art. L. 1251-7 1° CT).</div>
                          <div class="liste-item">5) Lorsque l'ETT et l'utilisateur s'engagent, pour une durée et dans des conditions fixées par décret ou par accord de branche étendu, à assurer un complément de formation professionnelle au salarié (art. L. 1251-7 2° CT).</div>
                      </div>
                      <div class="paragraphe">
                          Par ailleurs, l'utilisateur déclare que : le salarié intérimaire concerné ne sera pas affecté à des travaux interdits figurant sur la liste prévue à l'article L. 4154-1 CT ou qu'il a obtenu une dérogation de la DIRECCTE; le salarié intérimaire concerné ne remplace pas un salarié dont le contrat est suspendu par suite d'un conflit collectif de travail chez l'utilisateur; le salarié intérimaire concerné ne remplace pas un médecin du travail; le salarié intérimaire concerné ne sera pas affecté sur un poste où il a été procédé à un licenciement pour motif économique, dans les 6 mois qui suivent ce licenciement, si le motif de recours est un accroissement temporaire de l'activité. Cette interdiction ne s'applique pas lorsque la durée du contrat, non susceptible de renouvellement, n'excède pas 3 mois (art. L. 1251-9 CT).
                      </div>
                      <div class="paragraphe">
                          Si une première mission ou un contrat à durée déterminée ont déjà été effectués sur le poste de travail pour lequel le salarié intérimaire est demandé, il ne peut être recouru pour pourvoir ce poste à un contrat de travail temporaire ou à un contrat à durée déterminée avant l'expiration d'un délai de carence calculé de la manière suivante (art. L. 1251-36 CT) : contrat de mission < à 14 jours => la moitié de la durée calendaire du contrat; contrat > ou = à 14 jours => le tiers de la durée calendaire du contrat.
                      </div>
                      <div class="paragraphe">
                          Pour l'application du délai devant séparer les deux contrats, il est fait référence aux jours d'ouverture de l'entreprise ou de l'établissement concerné.
                      </div>
                      <div class="paragraphe">
                          b) La qualification professionnelle exigée, le lieu, l'horaire, les caractéristiques particulières du poste de travail et notamment si ce poste figure sur la liste des postes à risques prévue à l'article L. 4154-2 CT et/ou s'il est soumis à surveillance médicale renforcée.
                      </div>
                      <div class="paragraphe">
                          Dans l'hypothèse où le salarié intérimaire est affecté sur un poste de travail présentant des risques particuliers pour sa santé ou sa sécurité, l'utilisateur s'engage à effectuer la formation à la sécurité renforcée prévue à l'article L. 4154-2 CT. Ces indications permettront d'effectuer une meilleure adéquation au poste et d'améliorer la prévention des accidents du travail et des maladies professionnelles.
                      </div>
                      <div class="paragraphe">
                          c) La nature des équipements de protection individuelle (EPI) que le salarié doit utiliser, en précisant, le cas échéant, s'ils sont fournis par l'ETT (casque et chaussures uniquement).
                      </div>
                      <div class="paragraphe">
                          d) Date de début et de fin de mission. Le non-respect de l'engagement de la durée prévue au contrat de prestation donne lieu à facturation normale jusqu'au terme du contrat initialement prévu.
                      </div>
                      <div class="paragraphe">
                          Pour les motifs de : « remplacement d'un salarié absent », « attente de l'entrée en service effective du salarié recruté par un CDI », « emplois à caractère saisonnier » et « emplois pour lesquels il est d'usage constant de ne pas recourir au CDI », le contrat de travail temporaire peut ne pas comporter de terme précis lors de sa conclusion. Il est alors conclu pour une durée minimale et a pour terme la fin de l'absence du salarié ou la réalisation de l'objet pour lequel il est conclu. En cas de recours au travail temporaire pour d'autres motifs, lorsque la mission comporte un terme fixé avec précision dès sa conclusion, le contrat peut être renouvelé une fois pour une durée déterminée qui, ajoutée à la durée du contrat initial, ne peut excéder par principe 18 mois. Mais, par dérogation, la durée totale du contrat, renouvellement compris, ne peut excéder les durées maximales suivantes : 24 mois pour le motif survenance dans l'entreprise d'une commande exceptionnelle à l'exportation (dans ce cas, la durée ne peut être inférieure à 6 mois) ou dans les cas de départ définitif d'un salarié précédant la suppression de son poste de travail ou lorsque la mission est exécutée à l'étranger; 9 mois pour les motifs d'attente de l'entrée en service effective d'un salarié recruté par contrat à durée indéterminée ou travaux urgents nécessités par des mesures de sécurité.
                      </div>
                      <div class="paragraphe">
                          Les conditions de renouvellement sont précisées dans le contrat initial ou par avenant soumis à l'accord du salarié avant le terme prévu au contrat initial.
                      </div>
                      <div class="paragraphe">
                          Le terme de la mission prévu au contrat ou fixé par avenant peut être avancé ou reporté à raison de 1 jour pour 5 jours travaillés. Cet aménagement du terme de la mission ne peut avoir pour effet ni de réduire la mission initialement prévue de plus de 10 jours travaillés, ni de conduire à un dépassement des durées maximales visées plus haut. Pour les missions inférieures à 10 jours de travail, ce terme peut être avancé ou reporté de 2 jours.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="paragraphe">
                          e) La période d'essai éventuellement prévue, dont la durée ne peut excéder, sauf disposition différente émanant d'une convention ou d'un accord professionnel de branche étendu ou de convention ou d'accord d'entreprise ou d'établissement : 2 jours si le contrat est conclu pour une durée ≤ à 1 mois; 3 jours si le contrat est conclu pour une durée > à 1 mois et ≤ à 2 mois; 5 jours si le contrat est conclu pour une durée > à 2 mois. La facturation afférente à cette période ne pouvant en aucun cas être diminuée.
                      </div>
                      <div class="paragraphe">
                          f) La rémunération que percevait après période d'essai un salarié de qualification équivalente occupant le même poste de travail, avec ses différentes composantes y compris, s'il en existe, les primes et accessoires de salaire.
                      </div>
                      <div class="paragraphe">
                          En cas d'augmentation de la rémunération en cours de mission, la facturation sera proportionnellement modifiée. De même, en cas de rappel de la rémunération due au salarié à la suite d'une indication erronée sur son montant, le remboursement devra être effectué à quelque moment que se situe le versement du rappel.
                      </div>
                      <div class="paragraphe">
                          L'ensemble de ces éléments est fourni sous la responsabilité de l'utilisateur, lequel s'exposerait, en cas d'omission d'un des éléments composant le salaire de référence, tel que défini ci-dessus, aux sanctions pénales de l'article L. 1254-10 CT.
                      </div>
                      <div class="paragraphe">
                          Les jours fériés chômés chez l'utilisateur sont payés au salarié intérimaire sans condition d'ancienneté. Ils seront intégralement facturés à l'utilisateur ainsi que toute journée supplémentaire éventuellement non travaillée que l'ETT devrait payer au salarié intérimaire du fait de l'utilisateur. Le travail de nuit, des jours fériés et du dimanche est payé selon les règles en vigueur chez l'utilisateur.
                      </div>
                      <div class="paragraphe">
                          La facturation est établie au vu du relevé d'heures signé par le représentant de l'utilisateur, aux conditions suivantes : 1) Semaine complète : les majorations pour heures supplémentaires sont calculées sur la base légale ou conventionnelle applicable chez l'utilisateur, si celle-ci est plus favorable, auxquelles s'ajoute éventuellement la rémunération au titre du repos compensateur non pris. 2) Semaine incomplète (moins de 5 jours travaillés) : les heures supplémentaires sont décomptées à la journée.
                      </div>
                  </div>

                  <!-- Contenu déplacé vers la droite -->
                  <div class="colonne-droite-force">
                      <div class="paragraphe">
                          Un supplément pour indemnités ou primes diverses résultant de l'application des lois, décrets, arrêtés ou conventions ayant des incidences directes ou indirectes sur les coûts salariaux peut être prévu.
                      </div>
                      <div class="paragraphe">
                          Ce contrat est établi en double exemplaire, dont l'un doit être impérativement retourné dûment signé à l'ETT dans les deux jours ouvrables suivant la mise à disposition, sous peine des sanctions prévues à l'article L. 1254-10 CT (amende de 3 750 € et en cas de récidive, amende de 7 500 € et emprisonnement de 6 mois).
                      </div>
                      <div class="paragraphe">
                          La signature de l'utilisateur confirme l'exactitude des mentions légales reprises au recto et implique son accord sur les présentes conditions générales de prestations ainsi que sa responsabilité sur l'exactitude de l'ensemble des éléments de rémunération composant le salaire de référence. Toute demande de modification portant sur les conditions d'exécution du détachement telles que prévues initialement au contrat, doivent être adressées par l'utilisateur à l'ETT. Elles ne pourront être mises en application qu'après accord formel et écrit.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">2 - RELEVE D'HEURES</div>
                      <div class="paragraphe">
                          Le contrôle des heures de travail est effectué au moyen du relevé d'heures établi sur une base hebdomadaire. Ce relevé doit mentionner le nombre d'heures effectuées chaque jour, ainsi que le total hebdomadaire. La signature et le cachet de l'utilisateur apposés sur le relevé d'heures certifient l'exactitude des éléments qui y sont consignés et l'exécution satisfaisante du travail confié aux salariés intérimaires détachés. Les modalités de rémunération de la prestation de services sont précisées au recto du présent contrat conformément à la loi.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">3 - REGLEMENT – PENALITES DE RETARD</div>
                      <div class="paragraphe">
                          Les factures émises par l'ETT sont payables au comptant, sauf accord contraire précisé sur la facture. Au tarif horaire hors taxes figurant au présent contrat, s'ajoute la TVA. Toute facture impayée pourra entraîner la suspension des prestations en cours, sans qu'il soit nécessaire de procéder à une mise en demeure.
                      </div>
                      <div class="paragraphe">
                          De convention expresse, le non-respect des conditions de règlement entraîne, sans préjudice de toute autre voie d'action, l'application de plein droit de pénalités de retard d'un montant égal au taux de refinancement de la Banque centrale européenne, majoré de 10 points, conformément à l'article L. 441-6 du code de commerce, prenant effet au lendemain de la date de paiement figurant sur la facture.
                      </div>
                      <div class="paragraphe">
                          Le taux de refinancement applicable pendant le 1er semestre de l'année en cours est le taux en vigueur au 1er janvier de cette même année. Pour le 2nd semestre, le taux en vigueur au 1er juillet s'applique. Les pénalités de retard sont exigibles sans qu'un rappel soit nécessaire. Conformément aux dispositions des articles L. 441-6 et D. 441-5 du code de commerce, tout professionnel en situation de retard de paiement est de plein droit débiteur d'une indemnité forfaitaire pour frais de recouvrement de 40 €.
                      </div>
                      <div class="paragraphe">
                          Lorsque le crédit de l'utilisateur se détériore, l'ETT se réserve le droit, même après le début d'exécution d'une commande, d'exiger de l'utilisateur les garanties qu'elle juge convenables en vue de la bonne exécution des engagements pris. Le refus d'y satisfaire lui donne le droit d'annuler tout ou partie de la commande.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">4 - QUALIFICATION ET EMPLOI DU PERSONNEL</div>
                      <div class="paragraphe">
                          Les salariés intérimaires détachés chez l'utilisateur ne peuvent être affectés qu'à des tâches correspondant au niveau de leur qualification, et qu'aux seules caractéristiques particulières de travail spécifiées dans le contrat de prestation. En particulier, le personnel spécialisé « transport » ne peut conduire que la catégorie de véhicules relevant de la qualification prévue dans le présent contrat. Les salariés intérimaires ne peuvent effectuer aucun transport de fonds, manipulation d'argent ou autres valeurs sans un accord écrit de l'ETT.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">5 - CONDITIONS D'EXECUTION DU TRAVAIL</div>
                      <div class="paragraphe">
                          Conformément à l'article L. 1251-21 CT, pendant la durée de la mission, l'utilisateur est responsable des conditions d'exécution du travail telles qu'elles sont déterminées par celles des mesures législatives réglementaires et conventionnelles qui sont applicables au lieu du travail.
                      </div>
                      <div class="paragraphe">
                          Pour l'application de l'alinéa précédent, les conditions d'exécution du travail comprennent limitativement ce qui a trait à la durée de travail, au travail de nuit, au repos hebdomadaire et des jours fériés, à la santé et la sécurité au travail, au travail des femmes, des enfants et des jeunes travailleurs.
                      </div>
                      <div class="paragraphe">
                          Les EPI sont fournis par l'utilisateur. Toutefois, certains EPI personnalisés, définis par convention ou accord collectif peuvent être fournis par l'ETT (casque et chaussures de sécurité uniquement). Dans cette hypothèse, les équipements sont fournis par l'ETT sous la responsabilité de l'utilisateur, qui doit s'assurer de leur conformité aux règles de sécurité applicables sur le lieu de travail, et de leur utilisation effective par les salariés intérimaires. Les salariés intérimaires ne doivent pas supporter la charge financière des équipements de protection individuelle (art. L. 1251-23 CT).
                      </div>
                      <div class="paragraphe">
                          Aux termes de l'article L. 2313-4 CT, les salariés intérimaires peuvent faire présenter leurs revendications par les délégués du personnel de l'utilisateur concernant la rémunération (art. L. 1251-18 CT), les conditions d'exécution du travail (art. L. 1251-21 à 23 CT) et l'accès aux installations collectives (art. L. 1251-24 CT).
                      </div>
                      <div class="paragraphe">
                          Les salariés intérimaires détachés doivent figurer sur le registre unique du personnel de l'établissement de l'utilisateur (art. D. 1221-23 10° CT). En cas d'accident du travail survenu aux salariés intérimaires détachés, l'utilisateur doit informer l'ETT dans les 24 heures par lettre recommandée en même temps que l'inspecteur du travail et le service de prévention de la CARSAT.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">6 - MEDECINE DU TRAVAIL</div>
                      <div class="paragraphe">
                          Lorsque l'activité exercée par le salarié intérimaire nécessite une surveillance médicale renforcée au sens de la réglementation relative à la santé au travail, celle-ci est à la charge de l'utilisateur (art. L. 1251-22 CT).
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">7 - RESPONSABILITE CIVILE</div>
                      <div class="paragraphe">
                          L'utilisateur est civilement responsable, en tant que commettant des salariés intérimaires placés sous sa direction exclusive, de tous les dommages causés à des tiers sur les lieux ou à l'occasion du travail. L'ETT est dégagée de toute responsabilité quant aux dommages de quelque nature qu'ils soient, de caractère professionnel ou non, causés par les salariés intérimaires et résultant, entre autres, d'une absence ou d'une insuffisance de contrôle ou d'encadrement comme de l'inobservation des règlements.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">8 - COMPÉTENCE</div>
                      <div class="paragraphe">
                          De convention expresse et en cas de contestation, le tribunal du lieu du siège social de l'ETT est seul compétent pour connaître les différends d'interprétation et d'exécution pouvant découler des présentes prestations.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">9 - LUTTE CONTRE LE TRAVAIL DISSIMULE</div>
                      <div class="paragraphe">
                          L'ETT atteste sur l'honneur que les salariés intérimaires qu'elle détache sont employés régulièrement au regard des articles L. 3243-2 CT (remise d'un bulletin de paie), R. 3243-1 CT (mentions du bulletin de paie), L. 1221-10 CT (déclaration préalable à l'embauche), L. 1221-13 CT (registre unique du personnel), R. 5221-41 CT (vérification du titre de travail des étrangers) et D. 8254-5 CT (communication de la liste nominative des étrangers).
                      </div>
                  </div>
              </div>
              
              <div class="page-number">Page 2 sur 2</div>
          </div>
      </body>
      </html>`;}

  function getCertificateTemplate() {
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Attestation de mission - {{employee.fullName}}</title>
      <style>
          :root {
              --primary: #333333;
              --secondary: #666666;
              --light-gray: #e5e5e5;
              --medium-gray: #cccccc;
              --dark-gray: #444444;
              --text: #222222;
              --white: #ffffff;
              --divider: #dddddd;
          }
          
          * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
          }
          
          body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              line-height: 1.5;
              color: var(--text);
              background-color: var(--white);
              padding: 0;
          }
          
          .container {
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
              background-color: var(--white);
              border: 1px solid var(--medium-gray);
              padding: 25px;
              position: relative;
          }
          
          .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid var(--divider);
          }
          
          .logo-container {
              display: flex;
              flex-direction: column;
          }
          
          .logo {
              font-weight: 700;
              font-size: 22px;
              color: var(--primary);
              margin-bottom: 3px;
          }
          
          .company-info {
              font-size: 9px;
              color: var(--secondary);
          }
          
          .certificate-title {
              text-align: center;
              font-weight: 700;
              font-size: 18px;
              color: var(--primary);
              margin: 30px 0 20px;
              text-transform: uppercase;
          }
          
          .certificate-content {
              margin: 0 auto;
              max-width: 90%;
              text-align: justify;
              font-size: 11px;
              line-height: 1.5;
          }
          
          .employee-name {
              text-align: center;
              font-weight: 700;
              font-size: 16px;
              color: var(--primary);
              margin: 20px 0;
              background-color: var(--light-gray);
              padding: 5px;
          }
          
          .mission-details {
              margin: 20px auto;
              border: 1px solid var(--medium-gray);
              padding: 10px;
          }
          
          .detail-row {
              display: flex;
              margin-bottom: 5px;
              border-bottom: 1px dotted var(--light-gray);
              padding-bottom: 5px;
          }
          
          .detail-label {
              font-weight: 600;
              min-width: 120px;
              color: var(--secondary);
          }
          
          .signature-section {
              margin-top: 40px;
              text-align: right;
          }
          
          .signature-box {
              display: inline-block;
              width: 200px;
              text-align: center;
          }
          
          .signature-line {
              border-bottom: 1px solid var(--medium-gray);
              margin-bottom: 5px;
              height: 40px;
          }
          
          .signature-name {
              font-weight: 600;
              margin-bottom: 2px;
              font-size: 10px;
          }
          
          .signature-title {
              font-size: 9px;
              color: var(--secondary);
          }
          
          .date-location {
              text-align: right;
              margin: 15px 40px;
              font-size: 10px;
          }
          
          .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 8px;
              color: var(--secondary);
              border-top: 1px solid var(--light-gray);
              padding-top: 10px;
          }
          
          .document-number {
              display: inline-block;
              background-color: var(--light-gray);
              color: var(--primary);
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 10px;
              margin-top: 10px;
              text-align: center;
          }
          
          @media print {
              body {
                  background-color: white;
                  padding: 0;
              }
              
              .container {
                  box-shadow: none;
                  max-width: none;
                  width: 100%;
                  border: none;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <div class="logo-container">
                  <div class="logo">{{company.name}}</div>
                  <div class="company-info">
                      {{company.address}} {{company.zipCode}} {{company.city}}<br>
                      {{company.siret}} - APE : {{company.ape}}<br>
                      {{company.email}}
                  </div>
              </div>
          </div>
          
          <div class="certificate-title">Attestation de mission</div>
          
          <div class="certificate-content">
              <p>Je soussigné, Directeur des Ressources Humaines de la société {{company.name}}, certifie que :</p>
          </div>
          
          <div class="employee-name">{{employee.fullName}}</div>
          
          <div class="certificate-content">
              <p>A effectué une mission au sein de la société {{client.companyName}}, conformément aux conditions stipulées dans le contrat de mise à disposition.</p>
          </div>
          
          <div class="mission-details">
              <div class="detail-row">
                  <div class="detail-label">N° de contrat :</div>
                  <div>{{reference}}</div>
              </div>
              <div class="detail-row">
                  <div class="detail-label">Période :</div>
                  <div>Du {{startDate}} au {{endDate}}</div>
              </div>
              <div class="detail-row">
                  <div class="detail-label">Qualification :</div>
                  <div>{{employee.skills}}</div>
              </div>
              <div class="detail-row">
                  <div class="detail-label">Lieu de mission :</div>
                  <div>{{client.location}}</div>
              </div>
          </div>
          
          <div class="certificate-content">
              <p>Il peut vous être délivré à votre demande une attestation employeur en fin de mission.</p>
              <p>Ce document est délivré pour faire valoir ce que de droit.</p>
          </div>
          
          <div class="date-location">
              <p>Fait à PARIS, le {{generationDate}}</p>
          </div>
          
          <div class="signature-section">
              <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name">Pour {{company.name}}</div>
                  <div class="signature-title">L'INTERMEDIAIRE</div>
              </div>
          </div>
          
          <div style="text-align: center; margin-top: 15px;">
              <div class="document-number">N° {{reference}}</div>
          </div>
          
          <div class="footer">
              <p>{{company.name}} - {{company.address}} {{company.zipCode}} {{company.city}} - SIRET : {{company.siret}} - APE : {{company.ape}}</p>
          </div>
      </div>
  </body>
  </html>`;
}

function getEmployeeContractTemplate() {
    return `<!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contrat de Mission Temporaire</title>
          <style>
              /* Réinitialisation et styles de base */
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 10px;
                  line-height: 1.3;
                  color: #333;
                  background-color: #f5f5f5;
                  font-weight: 300;
              }
              
              /* Définition format A4 avec espacement réduit en haut */
              .page {
                  width: 210mm;
                  height: 297mm;
                  padding: 3mm 8mm 8mm 8mm;
                  margin: 0 auto;
                  background-color: white;
                  position: relative;
              }
              
              /* Header restructuré selon demande */
              .entete {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
              }
              
              .entete-gauche {
                  display: flex;
                  flex-direction: column;
              }
              
              .entete-droite {
                  display: flex;
                  flex-direction: column;
                  align-items: flex-end;
              }
              
              .logo {
                  font-size: 26px;
                  font-weight: 700;
                  color: #1a1a1a;
                  letter-spacing: 1.5px;
                  margin-bottom: 4px;
              }
              
              .infos-societe {
                  font-size: 9px;
                  color: #777;
                  letter-spacing: 0.2px;
                  margin-bottom: 2px;
              }
              
              .titre-contrat {
                  font-weight: 800;
                  font-size: 13px;
                  color: #1a1a1a;
                  letter-spacing: 0.5px;
                  text-transform: uppercase;
                  margin-bottom: 6px;
                  text-align: right;
              }
              
              .contrat-dates {
                  display: flex;
                  justify-content: flex-end;
                  align-items: center;
                  font-size: 10px;
                  color: #333;
                  margin-bottom: 5px;
                  font-weight: 600;
              }
              
              .date-item {
                  margin-left: 10px;
              }
              
              .numero-contrat {
                  font-weight: 800;
                  font-size: 13px;
                  color: #1a1a1a;
                  text-align: right;
                  border: 1px solid #1a1a1a;
                  padding: 2px 8px;
                  background-color: #f3f3f3;
                  border-radius: 2px;
              }
              
              /* Section - ajusté avec moins d'espacement */
              .section {
                  margin-bottom: 5px;
                  border: 1px solid #e0e0e0;
                  border-radius: 2px;
                  overflow: hidden;
              }
              
              .titre-section {
                  background-color: #f0f0f0;
                  padding: 4px 10px;
                  font-weight: 600;
                  font-size: 10px;
                  color: #333;
                  letter-spacing: 0.5px;
                  text-transform: uppercase;
                  border-bottom: 1px solid #cccccc;
              }
              
              .contenu-section {
                  padding: 5px 10px;
                  background-color: #ffffff;
              }
              
              /* Grilles et mise en page - espacement réduit */
              .grille {
                  display: grid;
                  grid-template-columns: 50% 50%;
                  gap: 5px;
              }
              
              .grille-3-cols {
                  display: grid;
                  grid-template-columns: 33.3% 33.3% 33.3%;
                  gap: 5px;
              }
              
              .champ {
                  margin-bottom: 5px;
              }
              
              .label {
                  font-weight: 600;
                  font-size: 9px;
                  color: #777;
                  margin-bottom: 2px;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
              }
              
              .label-petit {
                  font-weight: 400;
                  font-size: 9px;
                  color: #777;
                  font-style: italic;
                  margin-top: 2px;
              }
              
              .valeur {
                  font-size: 10px;
                  color: #333;
                  font-weight: 400;
              }
              
              .valeur-importante {
                  font-weight: 600;
                  color: #1a1a1a;
              }
              
              /* Format pour le titre de séjour */
              .titre-sejour {
                  display: grid;
                  grid-template-columns: 50% 50%;
                  gap: 4px;
                  font-size: 10px;
              }
              
              .titre-sejour-ligne {
                  margin-bottom: 2px;
              }
              
              /* Style pour labels et valeurs sur la même ligne */
              .label-inline {
                  display: inline-block;
                  margin-right: 5px;
              }
              
              .valeur-inline {
                  display: inline-block;
              }
              
              /* Horaires */
              .horaires {
                  display: grid;
                  grid-template-columns: 10% 30% 10% 30%;
                  gap: 2px;
                  align-items: center;
                  margin-bottom: 4px;
                  background-color: #f7f7f7;
                  padding: 4px;
                  border-radius: 2px;
              }
              
              /* Checkbox moderne et minimaliste */
              .checkbox {
                  width: 11px;
                  height: 11px;
                  border: 1px solid #999;
                  border-radius: 2px;
                  display: inline-block;
                  position: relative;
                  vertical-align: middle;
                  margin-right: 4px;
                  background-color: #f7f7f7;
              }
              
              .checkbox.checked {
                  background-color: #333;
                  border-color: #333;
              }
              
              .checkbox.checked:after {
                  content: "";
                  position: absolute;
                  top: 2px;
                  left: 4px;
                  width: 3px;
                  height: 6px;
                  border: solid white;
                  border-width: 0 2px 2px 0;
                  transform: rotate(45deg);
              }
    
              /* Style pour les options avec checkbox - sur la même ligne */
              .options-container {
                  display: flex;
                  align-items: center;
                  gap: 15px;
              }
              
              .option-row {
                  display: flex;
                  align-items: center;
                  margin-bottom: 0;
              }
              
              .option-label {
                  margin-left: 5px;
                  font-size: 10px;
              }
              
              /* Liste modernisée */
              .liste-moderne {
                  list-style: none;
              }
              
              .liste-moderne li {
                  position: relative;
                  padding-left: 10px;
                  margin-bottom: 2px;
                  line-height: 1.4;
              }
              
              .liste-moderne li:before {
                  content: "";
                  position: absolute;
                  left: 0;
                  top: 4px;
                  width: 4px;
                  height: 4px;
                  background-color: #555;
                  border-radius: 50%;
              }
              
              /* Signature - modifié pour alignement gauche/droite */
              .signature-section {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 3px;
                  width: 100%;
              }
              
              .signature-box-left {
                  width: 38%;
                  padding: 3px 0;
                  text-align: left;
              }
              
              .signature-box-right {
                  width: 35%;
                  padding: 3px 0;
                  text-align: right;
              }
          
              .fait-a {
                  text-align: center;
                  font-weight: 500;
                  font-size: 11px;
                  margin: 25px 0 5px 0;
              }
              
              /* Company name plus compact */
              .company-name-signature {
                  font-size: 12px;
                  font-weight: 700;
                  color: #1a1a1a;
                  margin: 2px 0;
              }
              
              /* Images de signature et tampon */
              .signature-image {
                  max-width: 100%;
                  max-height: 184px;
                  display: block;
                  margin: 5px 0;
              }
              
              .petit-texte {
                  font-size: 9px;
                  color: #242222;
                  line-height: 1.3;
              }
              
              /* Législation plus compacte */
              .legislation {
                  font-size: 9px;
                  line-height: 1.3;
                  color:#1a1a1a;
              }
              
              .legislation-item {
                  position: relative;
                  padding-left: 10px;
                  margin-bottom: 2px;
              }
              
              .legislation-item:before {
                  content: "-";
                  position: absolute;
                  left: 0;
                  top: 0;
              }
              
              /* Pied de page */
              .page-number {
                  position: absolute;
                  bottom: 7mm;
                  right: 10mm;
                  font-size: 9px;
                  color: #999;
                  font-weight: 300;
              }
              
              /* Divider plus compact */
              .divider {
                  height: 1px;
                  background-color: #e0e0e0;
                  margin: 3px 0;
              }
              
              .tag {
                  display: inline-block;
                  background-color: #f3f3f3;
                  color: #1a1a1a;
                  padding: 2px 6px;
                  border-radius: 2px;
                  font-size: 9px;
                  font-weight: 500;
                  margin-right: 3px;
                  border-left: 2px solid #777;
              }
              
              /* Notes de bas de section */
              .note {
                  font-size: 9px;
                  color: #3b3939;
                  font-style: italic;
                  margin-top: 6px;
                  padding-top: 4px;
                  border-top: 1px dotted #e0e0e0;
              }
              
              /* Précision sur le poste - équilibrage des colonnes */
              .colonne-gauche, .colonne-droite {
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  height: 100%;
              }
              
              /* Styles pour la page 2 - Conditions Générales */
              .page-2 {
                  width: 210mm;
                  height: 297mm;
                  padding: 10mm;
                  margin: 0 auto;
                  background-color: white;
                  position: relative;
                  overflow: hidden;
                  page-break-before: always;
              }
              
              .entete-page-2 {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 8px;
                  border-bottom: 1px solid #e0e0e0;
                  padding-bottom: 5px;
              }
              
              .titre-page-2 {
                  font-weight: 600;
                  font-size: 10px;
                  color: #1a1a1a;
                  text-align: center;
              }
              
              .contenu-page-2 {
                  column-count: 2;
                  column-gap: 15px;
                  text-align: justify;
                  font-size: 7px;
                  line-height: 1.25;
                  color: #444;
              }
              
              .section-page-2 {
                  break-inside: avoid-column;
                  margin-bottom: 6px;
              }
              
              .titre-section-page-2 {
                  font-weight: 700;
                  font-size: 8px;
                  color: #1a1a1a;
                  margin-bottom: 3px;
              }
              
              .paragraphe {
                  margin-bottom: 4px;
                  text-align: justify;
              }
              
              .liste {
                  padding-left: 8px;
                  margin-bottom: 4px;
              }
              
              .liste-item {
                  position: relative;
                  margin-bottom: 2px;
                  padding-left: 6px;
              }
              
              .liste-item:before {
                  content: "·";
                  position: absolute;
                  left: 0;
                  top: -1px;
              }
              
              .colonne-droite-force {
                  break-before: column;
              }
              
              /* Impression */
              @media print {
                  body {
                      background: none;
                  }
                  .page, .page-2 {
                      margin: 0;
                      box-shadow: none;
                  }
                  .page {
                      page-break-after: always;
                  }
              }
          </style>
      </head>
      <body>
          <div class="page">
              <!-- En-tête restructuré selon demande -->
              <div class="entete">
                  <div class="entete-gauche">
                      <div class="logo">{{company.name}}</div>
                      <div class="infos-societe">{{company.address}} {{company.zipCode}} {{company.city}}</div>
                      <div class="infos-societe">SIRET: {{company.siret}} - APE: {{company.ape}}</div>
                      <div class="infos-societe">{{company.email}} - Tél: {{company.phone}}</div>
                  </div>
                  <div class="entete-droite">
                      <div class="titre-contrat">CONTRAT DE MISSION TEMPORAIRE</div>
                      <div class="contrat-dates">
                          <div class="date-item">Du: {{startDate}}</div>
                          <div class="date-item">Au: {{endDate}}</div>
                      </div>
                      <div class="numero-contrat">N° {{reference}}</div>
                  </div>
              </div>
      
              <!-- CONTRAT DE MISSION TEMPORAIRE -->
              <div class="section">
                  <div class="titre-section">CONTRAT DE MISSION TEMPORAIRE</div>
              </div>
              
              <!-- ENTREPRISE UTILISATRICE -->
              <div class="section">
                  <div class="titre-section">ENTREPRISE UTILISATRICE</div>
                  <div class="contenu-section">
                      <div class="grille">
                          <div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Raison Sociale:</div>
                                  <div class="valeur valeur-importante" style="display: inline-block;">{{client.name}}</div>
                              </div>
                          </div>
                      </div>
                      <div class="champ">
                          <div class="label" style="display: inline-block; margin-right: 5px;">SIRET:</div>
                          <div class="valeur" style="display: inline-block;">{{client.siret}}</div>
                      </div>
                      <div class="champ">
                          <div class="label">Adresse</div>
                          <div class="valeur">
                              {{client.address}}<br>
                              {{client.postalCode}} {{client.city}}
                          </div>
                      </div>
                  </div>
              </div>
              
              <!-- SALARIÉ TEMPORAIRE -->
              <div class="section">
                  <div class="titre-section">SALARIÉ TEMPORAIRE</div>
                  <div class="contenu-section">
                      <div class="grille">
                          <div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Nom, Prénom:</div>
                                  <div class="valeur valeur-importante" style="display: inline-block;">{{employee.lastName}} {{employee.firstName}}</div>
                              </div>
                          </div>
                      </div>
                      <div class="champ">
                          <div class="label" style="display: inline-block; margin-right: 5px;">Né(e) le:</div>
                          <div class="valeur" style="display: inline-block;">{{employee.birthDate}}</div>
                          <div class="label" style="display: inline-block; margin-left: 10px; margin-right: 5px;">N° S.S.:</div>
                          <div class="valeur" style="display: inline-block;">{{employee.socialSecurityNumber}}</div>
                          <div class="label" style="display: inline-block; margin-left: 10px; margin-right: 5px;">Nationalité:</div>
                          <div class="valeur" style="display: inline-block;">{{employee.nationality}}</div>
                      </div>
                      <div class="champ">
                          <div class="label">Adresse</div>
                          <div class="valeur">
                              {{employee.address}}<br>
                              {{employee.postalCode}} {{employee.city}}
                          </div>
                      </div>
                      <div class="champ">
                          <div class="label">Nature et N° du Titre Professionnel</div>
                          <div class="valeur">{{employee.qualification}}</div>
                      </div>
                      <div class="champ">
                          <div class="label">Nature et N° du Titre Séjour</div>
                          <div class="titre-sejour">
                              <div class="titre-sejour-ligne"><strong>{{employee.idCardType}}</strong></div>
                              <div class="titre-sejour-ligne"><strong>{{employee.idCardNumber}}</strong></div>
                              <div class="titre-sejour-ligne"><strong>{{employee.idCardIssueDate}}</strong></div>
                              <div class="titre-sejour-ligne"><strong>{{employee.idCardExpiryDate}}</strong></div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <!-- PRÉCISION SUR LE POSTE -->
              <div class="section">
                  <div class="titre-section">PRECISION SUR LE POSTE</div>
                  <div class="contenu-section">
                      <div class="champ">
                          <div class="label">QUALIFICATION CONTRACTUELLE CONVENUE</div>
                          <div class="valeur valeur-importante">{{employee.qualification}}</div>
                      </div>
                      <div class="champ">
                          <div class="label">Durée de la mission</div>
                          <div class="valeur valeur-importante">Du {{startDate}} Au {{endDate}}</div>
                      </div>
                      <div class="champ">
                          <div class="label">Période(s) Non Travaillée(s)</div>
                          <div class="valeur">{{nonWorkingPeriods}}</div>
                      </div>
                      <div class="options-container">
                          <div class="option-row">
                              <div class="checkbox checked"></div>
                              <div class="option-label">TERME PRECIS</div>
                          </div>
                          <div class="option-row">
                              <div class="checkbox"></div>
                              <div class="option-label">DUREE MINIMALE</div>
                          </div>
                      </div>
                      <div class="champ">
                          <div class="label">CARACTERISTIQUES PARTICULIERES DU POSTE DE TRAVAIL</div>
                          <div class="label-petit">(s'il y a lieu nature des protections individuelles de sécurité et surveillance médiale spéciale)</div>
                          <div class="valeur">
                              <ul class="liste-moderne">
                                  <li>SECURITE A ASSURER PAR LE CLIENT</li>
                                  <li>RESPECT DES CONSIGNES DE SECURITE</li>
                                  <li>PORT DE CHAUSSURE DE SECURITE ET DU CASQUE OBLIGATOIRE</li>
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
              
              <!-- Lieu de mission et horaires -->
              <div class="section">
                  <div class="contenu-section">
                      <div class="grille">
                          <div class="colonne-gauche">
                              <div class="champ">
                                  <div class="label">LIEU DE MISSION</div>
                                  <div class="valeur valeur-importante">{{location}}</div>
                              </div>
                              <div class="champ">
                                  <div class="label">MOYEN D'ACCES</div>
                                  <div class="valeur">{{transport}}</div>
                              </div>
                          </div>
                          <div class="colonne-droite">
                              <div class="champ">
                                  <div class="label">HORAIRE DE LA MISSION</div>
                                  <div class="horaires">
                                      <div>De</div>
                                      <div>{{morningStartHour}}</div>
                                      <div>À</div>
                                      <div>{{morningEndHour}}</div>
                                  </div>
                                  <div class="horaires">
                                      <div>De</div>
                                      <div>{{afternoonStartHour}}</div>
                                      <div>À</div>
                                      <div>{{afternoonEndHour}}</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <!-- Durée du travail -->
              <div class="section">
                  <div class="contenu-section">
                      <div class="champ">
                          <div class="label">DUREE HEBDOMADAIRE DE LA MISSION :</div>
                          <div class="valeur valeur-importante">{{weeklyHours}} HEURES</div>
                      </div>
                      <div class="champ">
                          <div class="label">DUREE COLLECTIVE MOYENNE HEBDOMADAIRE :</div>
                          <div class="valeur">{{averageWeeklyHours}} HEURES</div>
                      </div>
                      <div class="champ">
                          <div class="label">ORGANISATION PARTICULIERE DU TEMPS DE TRAVAIL :</div>
                          <div class="valeur">{{workTimeOrganization}}</div>
                      </div>
                  </div>
              </div>
              
              <!-- Salaire et indemnités -->
              <div class="section">
                  <div class="contenu-section">
                      <div class="grille">
                          <div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">SALAIRE DE REFERENCE /H:</div>
                                  <div class="valeur valeur-importante" style="display: inline-block;">{{hourlyRate}} EUR</div>
                              </div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Frais de panier /j :</div>
                                  <div class="valeur" style="display: inline-block;">{{mealAllowance}} EUR</div>
                              </div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">Indemnité depl./j :</div>
                                  <div class="valeur" style="display: inline-block;">{{travelAllowance}} EUR</div>
                              </div>
                          </div>
                          <div>
                              <div class="champ">
                                  <div class="label" style="display: inline-block; margin-right: 5px;">I.F.M. :</div>
                                  <div class="valeur" style="display: inline-block;">10.00%</div>
                                  <div class="label" style="display: inline-block; margin-left: 10px; margin-right: 5px;">I.C.C.P :</div>
                                  <div class="valeur" style="display: inline-block;">10.00%</div>
                              </div>
                              <div class="champ">
                                  <div class="label">Modalités de versement de la paie et des accompte</div>
                                  <div class="valeur">{{paymentMethod}}</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <!-- MOTIF -->
              <div class="section">
                  <div class="contenu-section">
                      <div class="grille-3-cols">
                          <div>
                              <div class="label">MOTIF</div>
                              <div class="valeur"><span class="tag">ACCROISSEMENT TEMP. D'ACTIVITE</span></div>
                          </div>
                          <div>
                              <div class="label">MISSION</div>
                              <div class="valeur"></div>
                          </div>
                          <div>
                              <div class="label">JUSTIFICATIF (S) DU RECOURS</div>
                              <div class="valeur">RENFORT DE PERSONNEL</div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <!-- LÉGISLATION -->
              <div class="section">
                  <div class="titre-section">LEGISLATION</div>
                  <div class="contenu-section">
                      <div class="legislation">
                          <div class="legislation-item">L'embauche par l'utilisateur à l'issue de la mission n'est pas interdite, sous réserve des interdictions fixées aux articles L.1251-36 du CT</div>
                          <div class="legislation-item">Au cas où la mission s'effectue hors du territoire métropolitain le rapatriement du salarié est à la charge de l'ETT, sauf rupture anticipée du fait du salarié.</div>
                          <div class="legislation-item">Il peut vous être délivré à votre demande une attestation employeur en fin de mission.</div>
                          <div class="legislation-item">Les informations concernant le motif, la durée, la rémunération et les caractéristiques particulières du poste de travail sont données sous la responsabilité de l'utilisateur, seul habilité à les justifier, sans qu'il y ait lieu à mise en demeure préalable de la part de l'ETT.</div>
                      </div>
                  </div>
              </div>
              
              <!-- Date et lieu centrés -->
              <div class="fait-a">FAIT A PARIS LE {{startDate}}</div>
      
              <!-- Signatures alignées gauche et droite -->
              <div class="signature-section">
                  <div class="signature-box-left" style="padding-left: 0;">
                    <div style="width: 86%;">   
                      <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 10px; text-align: center;">L'ENTREPRISE DE TRAVAIL TEMPORAIRE</div>
                      <div class="company-name-signature" style="text-align: center;">{{company.name}}</div>
                      <div class="petit-texte" style="text-align: center;">
                          (Cachet et Signature)
                      </div>
                     </div>
                      {{#if (hasImage signature)}}
                          <img src="{{signature}}" alt="Signature ETT" class="signature-image" style="margin-left: 0;">
                      {{/if}}
                  </div>
                  <div class="signature-box-right" style="padding-right: 0;">
                      <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 10px; text-align: center;">L'INTERIMAIRE</div>
                      <div class="company-name-signature" style="text-align: center;">{{employee.lastName}} {{employee.firstName}}</div>
                      <div class="petit-texte" style="text-align: center;">
                          reconnait avoir pris connaissance du verso du présent contrat et s'engage à le retourner signé dans les 2 jours ouvrables suivant la mise à disposition
                      </div>
                  </div>
              </div>   
              <div class="page-number">Page 1 sur 2</div>          
          </div>
          
          <!-- DÉBUT PAGE 2 - EXTRAITS DU CODE DU TRAVAIL -->
          <div class="page-2">
              <!-- En-tête -->
              <div class="entete-page-2">
                  <div class="titre-page-2">EXTRAITS DU CODE DU TRAVAIL ET PRECISIONS COMPLEMENTAIRE</div>
              </div>
              
              <!-- Contenu principal -->
              <div class="contenu-page-2">
                  <div class="section-page-2">
                      <div class="titre-section-page-2">1. Motif du recours</div>
                      <div class="paragraphe">
                          Un utilisateur ne peut faire appel aux salariés des entreprises de travail temporaire que pour des tâches non 
                          durables dénommées « missions » :
                      </div>
                      <div class="liste">
                          <div class="liste-item">1°) Remplacement d'un salarié ou du chef d'entreprise (art. L. 1251-6 1°, 4° et 5° CT),</div>
                          <div class="liste-item">2°) Accroissement temporaire de l'activité de l'entreprise (art. L. 1251-6 2° CT),</div>
                          <div class="liste-item">3°) Travaux temporaires par nature (art. L. 1251-6 3° CT) :
                              - Emplois à caractère saisonnier,
                              - Emplois pour lesquels il est d'usage constant de ne pas recourir au contrat à durée indéterminée,</div>
                          <div class="liste-item">4°) Faciliter l'embauche de personnes sans emploi rencontrant des difficultés sociales et professionnelles 
                              particulières (art. L. 1251-7 1° CT),</div>
                          <div class="liste-item">5°) Assurer un complément de formation professionnelle (art. L. 1251-7 2° CT).</div>
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">2. Durée de la mission</div>
                      <div class="paragraphe">
                          Art. L. 1251-11 CT
                          Le contrat de mission comporte un terme fixé avec précision dès la conclusion du contrat de mise à disposition.
                          Toutefois, le contrat peut ne pas comporter de terme précis lorsqu'il est conclu dans l'un des cas suivants :
                          1° Remplacement d'un salarié absent ;
                          2° Remplacement d'un salarié dont le contrat de travail est suspendu ;
                          3° Dans l'attente de l'entrée en service effective d'un salarié recruté par contrat à durée indéterminée ;
                          4° Emplois à caractère saisonnier ou pour lesquels, dans certains secteurs d'activité définis par décret ou par voie 
                          de convention ou d'accord collectif étendu, il est d'usage constant de ne pas recourir au contrat
                          de travail à durée indéterminée en raison de la nature de l'activité exercée et du caractère par nature temporaire 
                          de ces emplois ;
                          5° Remplacement de l'une des personnes mentionnées aux 4° et 5° de l'article L. 1251-6 CT.
                      </div>
                      <div class="paragraphe">
                          Le contrat de mission est alors conclu pour une durée minimale. Il a pour terme la fin de l'absence de la personne 
                          remplacée ou la réalisation de l'objet pour lequel il a été conclu.
                      </div>
                      <div class="paragraphe">
                          Art. L. 1251-12 CT
                          La durée totale du contrat de mission ne peut excéder dix-huit mois compte tenu, le cas échéant, du 
                          renouvellement intervenant dans les conditions prévues à l'article L. 1251-35 CT.
                          Cette durée est réduite à neuf mois lorsque le contrat est conclu dans l'attente de l'entrée en service effective 
                          d'un salarié recruté par contrat à durée indéterminée ou lorsque son objet consiste en la réalisation
                          de travaux urgents nécessités par des mesures de sécurité.
                          Elle est portée à vingt-quatre mois :
                          1° Lorsque la mission est exécutée à l'étranger ;
                          2° Lorsque le contrat est conclu dans le cas du départ définitif d'un salarié précédant la suppression de son poste 
                          de travail ;
                          3° Lorsque survient dans l'entreprise, qu'il s'agisse de celle de l'entrepreneur principal ou de celle d'un sous-
                          traitant, une commande exceptionnelle à l'exportation dont l'importance nécessite la mise en oeuvre
                          de moyens quantitativement ou qualitativement exorbitants de ceux que l'entreprise utilise ordinairement. Dans 
                          ce cas, la durée initiale du contrat ne peut être inférieure à six mois.
                      </div>
                      <div class="paragraphe">
                          Art. L. 1251-35 CT
                          Le contrat de mission est renouvelable une fois pour une durée déterminée qui, ajoutée à la durée du contrat 
                          initial, ne peut excéder la durée maximale prévue à l'article L. 1251-12 CT.
                          Les conditions de renouvellement sont stipulées dans le contrat ou font l'objet d'un avenant soumis au salarié 
                          avant le terme initialement prévu.
                      </div>
                  </div>

                  <div class="section-page-2">
                      <div class="titre-section-page-2">3. Aménagement du terme de la mission</div>
                      <div class="paragraphe">
                          Art. L. 1251-30 CT
                          Le terme de la mission prévu au contrat de mise à disposition ou fixé par avenant à ce dernier peut être avancé ou 
                          reporté à raison d'un jour pour cinq jours de travail. Pour les missions inférieures à dix jours de
                          travail, ce terme peut être avancé ou reporté de deux jours.
                          L'aménagement du terme de la mission ne peut avoir pour effet ni de réduire la durée de la mission initialement 
                          prévue de plus de dix jours de travail, ni de conduire à un dépassement de la durée maximale du
                          contrat de mission fixée par l'article L. 1251-12 CT.
                      </div>
                      <div class="paragraphe">
                          Art. L. 1251-13 CT
                          Lorsque le contrat de mission est conclu pour remplacer un salarié temporairement absent ou dont le contrat de 
                          travail est suspendu ou pour un remplacement effectué au titre du 4° et 5° de l'article L. 1251-6
                          CT, il peut prendre effet avant l'absence de la personne à remplacer.
                      </div>
                      <div class="paragraphe">
                          Art. L. 1251-31 CT
                          Lorsque le contrat de mission est conclu pour remplacer un salarié temporairement absent ou dont le contrat de 
                          travail est suspendu ou pour un remplacement effectué au titre des 4° et 5° de l'article L. 1251-6
                          CT, le terme de la mission initialement fixé peut être reporté jusqu'au surlendemain du jour où la personne 
                          remplacée reprend son emploi.
                      </div>
                  </div>
                  
                  <div class="section-page-2">
                      <div class="titre-section-page-2">4. Rupture prématurée du contrat de travail</div>
                      <div class="paragraphe">
                          Art. L. 1251-28 CT
                          La rupture anticipée du contrat de mission qui intervient à l'initiative du salarié ouvre droit pour l'entreprise de 
                          travail temporaire à des dommages et intérêts correspondant au préjudice subi.
                          Ces dispositions ne s'appliquent pas lorsque le salarié justifie de la conclusion d'un contrat de travail à durée 
                          indéterminée.
                      </div>
                  </div>
                  
                  <div class="colonne-droite-force">
                      <div class="section-page-2">
                          <div class="titre-section-page-2">5. Période d'essai</div>
                          <div class="paragraphe">
                              Art. L. 1251-14 CT
                              Le contrat de mission peut comporter une période d'essai dont la durée est fixée par convention ou accord 
                              professionnel de branche étendu ou par convention ou accord d'entreprise ou d'établissement.
                              A défaut de convention ou d'accord, cette durée ne peut excéder :
                              1° Deux jours si le contrat est conclu pour une durée inférieure ou égale à un mois ;
                              2° Trois jours si le contrat est conclu pour une durée supérieure à un mois et inférieure ou égale à deux mois ;
                              3° Cinq jours si le contrat est conclu pour une durée supérieure à deux mois.
                          </div>
                          <div class="paragraphe">
                              Art. L. 1251-15 CT
                              La rémunération correspondant à la période d'essai ne peut être différente de celle qui est prévue par le contrat 
                              de mission.
                          </div>
                      </div>
                      
                      <div class="section-page-2">
                          <div class="titre-section-page-2">6. Indemnité de fin de mission</div>
                          <div class="paragraphe">
                              Art. L. 1251-32 CT
                              Lorsque, à l'issue d'une mission, le salarié ne bénéficie pas immédiatement d'un contrat de travail à durée 
                              indéterminée avec l'entreprise utilisatrice, il a droit, à titre de complément de salaire, à une indemnité de
                              fin de mission destinée à compenser la précarité de sa situation.
                              Cette indemnité est égale à 10 % de la rémunération totale brute due au salarié.
                              L'indemnité s'ajoute à la rémunération totale brute due au salarié. Elle est versée par l'entreprise de travail 
                              temporaire à l'issue de chaque mission effectivement accomplie, en même temps que le dernier salaire
                              dû au titre de celle-ci et figure sur le bulletin de salaire correspondant.
                          </div>
                          <div class="paragraphe">
                              Art. L. 1251-33 CT
                              L'indemnité de fin de mission n'est pas due :
                              1º Lorsque le contrat de mission est conclu au titre du 3° de l'article L. 1251-6 CT (emplois saisonniers et usage 
                              constant) si un accord collectif étendu entre les organisations professionnelles d'employeurs et de
                              salariés de la branche du travail temporaire, ou si une convention ou un accord conclu au sein d'entreprises ou 
                              d'établissements de cette branche le prévoit ;
                              2º Lorsque le contrat de mission est conclu dans le cadre de l'article L. 1251-57 CT (mission-formation) ;
                              3° Lorsque le contrat de mission est conclu dans le cadre d'un contrat d'insertion-revenu minimum d'activité prévu 
                              à l'article L. 5134-82 CT ;
                              4º En cas de rupture anticipée du contrat à l'initiative du salarié, à sa faute grave ou en cas de force majeure.
                          </div>
                      </div>
                      
                      <div class="section-page-2">
                          <div class="titre-section-page-2">7. Indemnité compensatrice de congés payés</div>
                          <div class="paragraphe">
                              Art. L. 1251-19 CT
                              Le salarié temporaire a droit à une indemnité compensatrice de congé payé pour chaque mission qu'il effectue 
                              quelle qu'en ait été la durée.
                              Le montant de l'indemnité est calculé en fonction de la durée de la mission et ne peut être inférieur au dixième de 
                              la rémunération totale brute perçue par le salarié pendant la mission. L'indemnité est versée à la
                              fin de la mission.
                          </div>
                      </div>
                      
                      <div class="section-page-2">
                          <div class="titre-section-page-2">8. Caractéristiques particulières du poste et risques professionnels</div>
                          <div class="paragraphe">
                              Sont mentionnés, la description du poste, les tâches à accomplir, le ou les lieux où elles seront à exécuter, ainsi 
                              que, le cas échéant, la description des risques professionnels qui sont éventuellement attachés au
                              poste :
                              Ces risques peuvent être liés :
                              - à l'utilisation de machines d'outillage,
                              - aux matériaux ou substances manipulés,
                              - aux conditions de travail,
                              - à l'environnement du poste.
                              Y figurent également, s'il y a lieu, les équipements individuels de sécurité que les intérimaires doivent 
                              impérativement utiliser pour assurer leur sécurité.
                              Cette rubrique peut mentionner que le poste figure sur une liste de travaux particulièrement dangereux établie 
                              par l'entreprise utilisatrice. Dans ce cas, l'intérimaire bénéficie d'une formation renforcée à la
                              sécurité par l'entreprise utilisatrice.
                              Certains postes de travail nécessitent une surveillance médicale renforcée, en complément de la visite d'aptitude.
                              Cette précision figure sur le contrat. Ces informations sont les premières indications nécessitées par la sécurité des 
                              intérimaires et auxquelles ils doivent être particulièrement attentifs.
                          </div>
                      </div>
                      
                      <div class="section-page-2">
                          <div class="titre-section-page-2">9. Droit d'accès et de rectification des données personnelles</div>
                          <div class="paragraphe">
                              La loi du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés garantit un droit d'accès et de 
                              rectification des données personnelles enregistrées dans les fichiers informatisés tenus par l'ETT ou
                              l'organisme de protection sociale
                              Sauf accord des parties, le salarié est alors tenu de respecter un préavis dont la durée est calculée à raison d'un 
                              jour par semaine compte tenu :
                              1° De la durée totale du contrat, renouvellement inclus, lorsque celui-ci comporte un terme précis ;
                              2° De la durée accomplie lorsque le contrat ne comporte pas un terme précis.
                              Dans les deux cas, la durée totale du préavis ne peut être inférieure à un jour ni supérieure à deux semaines.
                          </div>
                      </div>
                  </div>
              </div>
              <div class="page-number">Page 2 sur 2</div>
          </div>
      </body>
      </html>`;
}
