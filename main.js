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
                  width: 45%;
                  padding: 3px 0;
                  text-align: center;
                  margin-right: auto;
              }
              
              .signature-box-right {
                  width: 45%;
                  padding: 3px 0;
                  text-align: center;
                  margin-left: auto;
              }
          
              .fait-a {
                  text-align: center;
                  font-weight: 500;
                  font-size: 11px;
                  margin: 15px 0 5px 0; /* Réduit de 25px à 15px et 8px à 5px */
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
                  max-height: 180px; /* Augmenté de 150px à 180px */
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
              
              /* Impression */
              @media print {
                  body {
                      background: none;
                  }
                  .page {
                      margin: 0;
                      box-shadow: none;
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
                      <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 10px; text-align: center;">L'ENTREPRISE DE TRAVAIL TEMPORAIRE</div>
                      <div class="company-name-signature" style="text-align: center;">{{company.name}}</div>
                      <div class="petit-texte" style="text-align: center;">
                          (Cachet et Signature)
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
      </body>
      </html>`;
  }
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
              padding-right: 50px;
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
              margin: 15px 0;
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
