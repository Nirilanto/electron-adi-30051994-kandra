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

// Modification à apporter au gestionnaire ipcMain.handle("generate-pdf", async (_, args))
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

    // Déterminer le chemin du template en fonction du type
    let templatePath;
    let template;

    // Sélectionner le type de template approprié
    if (type === "certificate") {
      templatePath = path.join(
        config.paths.templatesPath,
        "certificates",
        "default.html"
      );
    } else if (type === "employee_contract") {
      templatePath = path.join(
        config.paths.templatesPath,
        "contracts",
        "employee.html"
      );
    } else if (type === "client_contract") {
      templatePath = path.join(
        config.paths.templatesPath,
        "contracts",
        "client.html"
      );
    } else {
      // contract par défaut
      templatePath = path.join(
        config.paths.templatesPath,
        "contracts",
        "default.html"
      );
    }

    // Vérifier si le template existe
    if (fs.existsSync(templatePath)) {
      // Utiliser le template depuis le fichier
      template = fs.readFileSync(templatePath, "utf8");
    } else {
      // Utiliser le template intégré dans le code
      if (type === "certificate") {
        template = getCertificateTemplate();
      } else if (type === "employee_contract") {
        template = getEmployeeContractTemplate();
      } else if (type === "client_contract") {
        template = getClientContractTemplate();
      } else {
        template = getContractTemplate();
      }
    }

    // Ajouter la date actuelle et l'année aux données
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${now.getFullYear()}`;
    const enhancedData = {
      ...data,
      generationDate: data.generationDate || formattedDate,
      year: data.year || now.getFullYear(),
    };

    // Compiler le template avec Handlebars
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate(enhancedData);

    // Lancer Puppeteer pour générer le PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

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
function getEmployeeContractTemplate() {
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrat de mise à disposition - {{company.name}}</title>
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
              --hover: #f5f5f5;
          }
          
          * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
          }
          
          body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              line-height: 1.4;
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
              padding: 15px;
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
          
          .document-notice {
              text-align: right;
              font-size: 9px;
              color: var(--secondary);
              max-width: 200px;
          }
          
          .title-section {
              text-align: center;
              margin-bottom: 15px;
          }
          
          .title {
              font-weight: 700;
              font-size: 16px;
              color: var(--primary);
              margin-bottom: 3px;
          }
          
          .subtitle {
              font-size: 12px;
              color: var(--secondary);
              margin-bottom: 3px;
          }
          
          .document-number {
              display: inline-block;
              background-color: var(--light-gray);
              color: var(--primary);
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 10px;
          }
          
          .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
          }
          
          .full-width {
              grid-column: 1 / -1;
          }
          
          .card {
              background-color: var(--white);
              border: 1px solid var(--medium-gray);
              overflow: hidden;
          }
          
          .card-header {
              background-color: var(--dark-gray);
              color: var(--white);
              padding: 4px 8px;
              font-weight: 600;
              font-size: 11px;
          }
          
          .card-body {
              padding: 6px 8px;
          }
          
          .data-row {
              display: flex;
              margin-bottom: 4px;
              align-items: flex-start;
          }
          
          .data-label {
              font-weight: 600;
              min-width: 140px;
              color: var(--secondary);
              font-size: 10px;
          }
          
          .data-value {
              flex: 1;
              color: var(--text);
              font-size: 10px;
          }
          
          .data-value.bold {
              font-weight: 600;
          }
          
          .schedule-box {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 5px;
              margin-top: 2px;
              margin-bottom: 5px;
          }
          
          .time-slot {
              background-color: var(--light-gray);
              padding: 3px 5px;
              text-align: center;
              font-size: 9px;
          }
          
          .checkbox-group {
              margin: 5px 0;
          }
          
          .checkbox-container {
              display: inline-flex;
              align-items: center;
              margin-right: 15px;
          }
          
          .checkbox {
              display: inline-block;
              width: 12px;
              height: 12px;
              border: 1px solid var(--secondary);
              margin-right: 5px;
              position: relative;
          }
          
          .checked::after {
              content: "✓";
              position: absolute;
              color: var(--primary);
              font-weight: bold;
              font-size: 9px;
              top: -1px;
              left: 1px;
          }
          
          .notice-box {
              background-color: var(--light-gray);
              padding: 5px 8px;
              font-size: 8px;
              color: var(--secondary);
              margin-bottom: 5px;
          }
          
          .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 10px;
              margin-bottom: 10px;
          }
          
          .signature-box {
              border: 1px solid var(--medium-gray);
              padding: 5px 8px;
              height: 60px;
          }
          
          .signature-title {
              font-weight: 600;
              margin-bottom: 2px;
              font-size: 9px;
              color: var(--primary);
          }
          
          .signature-notice {
              font-size: 8px;
              color: var(--secondary);
              margin-bottom: 10px;
          }
          
          .date-section {
              margin-top: 10px;
              display: flex;
              gap: 15px;
          }
          
          .date-item {
              display: flex;
              align-items: center;
          }
          
          .date-label {
              font-weight: 600;
              margin-right: 5px;
              color: var(--secondary);
              font-size: 10px;
          }
          
          .date-value {
              padding: 2px 5px;
              background-color: var(--light-gray);
              font-size: 10px;
          }
          
          .footnote {
              margin-top: 5px;
              font-size: 8px;
              color: var(--secondary);
              font-style: italic;
          }
          
          .page-number {
              text-align: right;
              margin-top: 5px;
              color: var(--secondary);
              font-size: 8px;
          }
          
          .mission-tag {
              display: inline-block;
              background-color: var(--light-gray);
              color: var(--primary);
              padding: 2px 5px;
              font-size: 9px;
              font-weight: 500;
          }
          
          .price-tag {
              background-color: var(--light-gray);
              padding: 2px 5px;
              font-weight: 600;
              color: var(--primary);
              font-size: 10px;
          }
          
          .highlight {
              background-color: var(--light-gray);
              padding: 1px 3px;
              font-size: 10px;
          }
          
          .med-section {
              font-size: 9px;
              padding: 4px;
              display: flex;
              justify-content: space-between;
          }
          
          .compact-section {
              margin-bottom: 5px;
          }
          
          .risk-section {
              font-size: 9px;
              margin-top: 3px;
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
                  padding: 10px;
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
                      {{company.email}}<br>
                      {{company.siret}} - APE : {{company.ape}}
                  </div>
              </div>
              <div class="document-notice">
                  Merci de nous retourner le double du contrat signé dans les deux jours ouvrables suivant la mise à disposition (L.1251-1 CT)
              </div>
          </div>

          <div class="title-section">
              <div class="title">CONTRAT DE MISE À DISPOSITION</div>
              <div class="subtitle">Du {{startDate}} Au {{endDate}}</div>
              <div class="document-number">N° {{reference}}</div>
          </div>

          <div class="grid">
              <div class="card">
                  <div class="card-header">SALARIÉ TEMPORAIRE</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">NOM, PRÉNOM</div>
                          <div class="data-value bold">{{employee.fullName}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">NATIONALITÉ</div>
                          <div class="data-value">{{employee.nationality}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">TITRE SÉJOUR</div>
                          <div class="data-value">CARTE D'IDENTITÉ</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">QUALIFICATION</div>
                          <div class="data-value">
                              <div class="mission-tag">{{employee.skills}}</div>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">ENTREPRISE UTILISATRICE</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">RAISON SOCIALE</div>
                          <div class="data-value bold">{{client.companyName}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">SIRET</div>
                          <div class="data-value">{{client.siret}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">ADRESSE</div>
                          <div class="data-value">
                              {{client.address}}<br>
                              {{client.postalCode}} {{client.city}}
                          </div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">LIEU DE MISSION</div>
                          <div class="data-value">{{client.location}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">MOYEN D'ACCÈS</div>
                          <div class="data-value">{{transport}}</div>
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">MOTIF MISSION JUSTIFICATIF(S) DU RECOURS</div>
                  <div class="card-body">
                      <div class="checkbox-group">
                          <div class="checkbox-container">
                              <div class="checkbox {{#if motifs.accroissementActivite}}checked{{/if}}"></div>
                              <span>ACCROISSEMENT TEMP. D'ACTIVITÉ</span>
                          </div>
                          <div class="checkbox-container">
                              <div class="checkbox {{#if motifs.renforcementPersonnel}}checked{{/if}}"></div>
                              <span>RENFORT DE PERSONNEL</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">PRÉCISION SUR LE POSTE / FACTURATION</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">Durée mission</div>
                          <div class="data-value highlight">Du {{startDate}} Au {{endDate}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">TERME PRÉCIS</div>
                          <div class="data-value bold">{{endDate}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">HORAIRE MISSION</div>
                          <div class="data-value"></div>
                      </div>
                      <div class="schedule-box">
                          {{#each workingHoursSlots}}
                              <div class="time-slot">De {{this.start}} À {{this.end}}</div>
                          {{/each}}
                      </div>
                      <div class="data-row">
                          <div class="data-label">DURÉE HEBDO:</div>
                          <div class="data-value bold">{{weeklyHours}} HEURES</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">SALAIRE REF/H:</div>
                          <div class="data-value price-tag">{{hourlyRate}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">TARIF H.T.</div>
                          <div class="data-value price-tag">{{billingRate}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">PAIEMENT</div>
                          <div class="data-value">VIREMENT</div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">CARACTÉRISTIQUES DU POSTE DE TRAVAIL</div>
                  <div class="card-body">
                      <div class="risk-section">
                          (protections individuelles de sécurité et surveillance médicale)
                      </div>
                      <div class="compact-section">
                          <div>SECURITÉ A ASSURER PAR LE CLIENT</div>
                          <div>RESPECT DES CONSIGNES DE SÉCURITÉ</div>
                          <div class="bold">PORT DE CHAUSSURE DE SÉCURITÉ ET DU CASQUE OBLIGATOIRE</div>
                      </div>
                      <div class="risk-section">
                          <div>Poste à risques (L.4154-2 CT) ?</div>
                          <div class="checkbox-container">
                              <div class="checkbox checked"></div>
                          </div>
                      </div>
                      <div class="risk-section">
                          L'embauche à l'issue de la mission n'est pas interdite, sous réserve art. L.1251-36 CT
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">LÉGISLATION</div>
                  <div class="card-body">
                      <div class="notice-box">
                          ** Sous peine de sanctions pénales (L.1254-1 et s. CT). L'utilisateur déclare avoir pris connaissance des conditions générales au verso. Les jours fériés chômés et payés sont dûs aux salariés temporaires sans condition d'ancienneté et facturés. Les informations concernant le motif, la durée, la rémunération** et les caractéristiques du poste sont sous la responsabilité de l'utilisateur. L'utilisateur prend en charge les frais d'accès aux installations collectives (art L.251-24 CT).
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">MÉDECINE DU TRAVAIL</div>
                  <div class="card-body">
                      <div class="med-section">
                          <div>De l'ETT:</div>
                          <div>Coordonnées du centre de Médecine du Travail:</div>
                          <div>De l'Utilisateur:</div>
                      </div>
                  </div>
              </div>
          </div>

          <div class="signatures">
              <div class="signature-box">
                  <div class="signature-title">L'ENTREPRISE DE TRAVAIL TEMPORAIRE</div>
                  <div class="signature-notice">(Cachet et Signature)</div>
              </div>
              <div class="signature-box">
                  <div class="signature-title">L'ENTREPRISE UTILISATRICE</div>
                  <div class="signature-notice">
                      Représentant de l'entreprise qui certifie exactes les dispositions générales stipulées au verso<br>
                      (Cachet et Signature)
                  </div>
              </div>
          </div>

          <div class="footnote">
              *Le terme de la mission prévu peut être aménagé dans les conditions stipulées aux articles L.1251-30 CT et L.1251-31 CT
          </div>

          <div class="date-section">
              <div class="date-item">
                  <div class="date-label">FAIT À</div>
                  <div class="date-value">PARIS</div>
              </div>
              <div class="date-item">
                  <div class="date-label">LE</div>
                  <div class="date-value">{{generationDate}}</div>
              </div>
          </div>

          <div class="page-number">Page 1 sur 2</div>
      </div>
  </body>
  </html>`;
}

function getClientContractTemplate() {
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrat de prestation - Client</title>
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
              --hover: #f5f5f5;
          }
          
          * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
          }
          
          body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              line-height: 1.4;
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
              padding: 15px;
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
          
          .document-notice {
              text-align: right;
              font-size: 9px;
              color: var(--secondary);
              max-width: 200px;
          }
          
          .title-section {
              text-align: center;
              margin-bottom: 15px;
          }
          
          .title {
              font-weight: 700;
              font-size: 16px;
              color: var(--primary);
              margin-bottom: 3px;
          }
          
          .subtitle {
              font-size: 12px;
              color: var(--secondary);
              margin-bottom: 3px;
          }
          
          .document-number {
              display: inline-block;
              background-color: var(--light-gray);
              color: var(--primary);
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 10px;
          }
          
          .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
          }
          
          .full-width {
              grid-column: 1 / -1;
          }
          
          .card {
              background-color: var(--white);
              border: 1px solid var(--medium-gray);
              overflow: hidden;
          }
          
          .card-header {
              background-color: var(--dark-gray);
              color: var(--white);
              padding: 4px 8px;
              font-weight: 600;
              font-size: 11px;
          }
          
          .card-body {
              padding: 6px 8px;
          }
          
          .data-row {
              display: flex;
              margin-bottom: 4px;
              align-items: flex-start;
          }
          
          .data-label {
              font-weight: 600;
              min-width: 140px;
              color: var(--secondary);
              font-size: 10px;
          }
          
          .data-value {
              flex: 1;
              color: var(--text);
              font-size: 10px;
          }
          
          .data-value.bold {
              font-weight: 600;
          }
          
          .schedule-box {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 5px;
              margin-top: 2px;
              margin-bottom: 5px;
          }
          
          .time-slot {
              background-color: var(--light-gray);
              padding: 3px 5px;
              text-align: center;
              font-size: 9px;
          }
          
          .checkbox-group {
              margin: 5px 0;
          }
          
          .checkbox-container {
              display: inline-flex;
              align-items: center;
              margin-right: 15px;
          }
          
          .checkbox {
              display: inline-block;
              width: 12px;
              height: 12px;
              border: 1px solid var(--secondary);
              margin-right: 5px;
              position: relative;
          }
          
          .checked::after {
              content: "✓";
              position: absolute;
              color: var(--primary);
              font-weight: bold;
              font-size: 9px;
              top: -1px;
              left: 1px;
          }
          
          .notice-box {
              background-color: var(--light-gray);
              padding: 5px 8px;
              font-size: 8px;
              color: var(--secondary);
              margin-bottom: 5px;
          }
          
          .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 10px;
              margin-bottom: 10px;
          }
          
          .signature-box {
              border: 1px solid var(--medium-gray);
              padding: 5px 8px;
              height: 60px;
          }
          
          .signature-title {
              font-weight: 600;
              margin-bottom: 2px;
              font-size: 9px;
              color: var(--primary);
          }
          
          .signature-notice {
              font-size: 8px;
              color: var(--secondary);
              margin-bottom: 10px;
          }
          
          .date-section {
              margin-top: 10px;
              display: flex;
              gap: 15px;
          }
          
          .date-item {
              display: flex;
              align-items: center;
          }
          
          .date-label {
              font-weight: 600;
              margin-right: 5px;
              color: var(--secondary);
              font-size: 10px;
          }
          
          .date-value {
              padding: 2px 5px;
              background-color: var(--light-gray);
              font-size: 10px;
          }
          
          .footnote {
              margin-top: 5px;
              font-size: 8px;
              color: var(--secondary);
              font-style: italic;
          }
          
.page-number {
              text-align: right;
              margin-top: 5px;
              color: var(--secondary);
              font-size: 8px;
          }
          
          .mission-tag {
              display: inline-block;
              background-color: var(--light-gray);
              color: var(--primary);
              padding: 2px 5px;
              font-size: 9px;
              font-weight: 500;
          }
          
          .price-tag {
              background-color: var(--light-gray);
              padding: 2px 5px;
              font-weight: 600;
              color: var(--primary);
              font-size: 10px;
          }
          
          .highlight {
              background-color: var(--light-gray);
              padding: 1px 3px;
              font-size: 10px;
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
                  padding: 10px;
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
                      {{company.email}}<br>
                      {{company.siret}} - APE : {{company.ape}}
                  </div>
              </div>
              <div class="document-notice">
                  Contrat de prestation - Exemplaire client
              </div>
          </div>

          <div class="title-section">
              <div class="title">CONTRAT DE PRESTATION</div>
              <div class="subtitle">Du {{startDate}} Au {{endDate}}</div>
              <div class="document-number">N° {{reference}}</div>
          </div>

          <div class="grid">
              <div class="card">
                  <div class="card-header">PRESTATAIRE</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">RAISON SOCIALE</div>
                          <div class="data-value bold">{{company.name}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">SIRET</div>
                          <div class="data-value">{{company.siret}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">ADRESSE</div>
                          <div class="data-value">
                              {{company.address}}<br>
                              {{company.zipCode}} {{company.city}}
                          </div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">CONTACT</div>
                          <div class="data-value">{{company.email}}</div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">CLIENT</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">RAISON SOCIALE</div>
                          <div class="data-value bold">{{client.companyName}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">SIRET</div>
                          <div class="data-value">{{client.siret}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">ADRESSE</div>
                          <div class="data-value">
                              {{client.address}}<br>
                              {{client.postalCode}} {{client.city}}
                          </div>
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">OBJET DE LA PRESTATION</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">MISSION</div>
                          <div class="data-value">MISE À DISPOSITION D'UN CONSULTANT</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">QUALIFICATION</div>
                          <div class="data-value">
                              <div class="mission-tag">{{employee.skills}}</div>
                          </div>
                      </div>
                      <div class="checkbox-group">
                          <div class="checkbox-container">
                              <div class="checkbox {{#if motifs.accroissementActivite}}checked{{/if}}"></div>
                              <span>ACCROISSEMENT TEMP. D'ACTIVITÉ</span>
                          </div>
                          <div class="checkbox-container">
                              <div class="checkbox {{#if motifs.renforcementPersonnel}}checked{{/if}}"></div>
                              <span>RENFORT DE PERSONNEL</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">DÉTAILS DE LA PRESTATION</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">PÉRIODE</div>
                          <div class="data-value highlight">Du {{startDate}} Au {{endDate}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">LIEU DE MISSION</div>
                          <div class="data-value">{{client.location}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">HORAIRES</div>
                      </div>
                      <div class="schedule-box">
                          {{#each workingHoursSlots}}
                              <div class="time-slot">De {{this.start}} À {{this.end}}</div>
                          {{/each}}
                      </div>
                      <div class="data-row">
                          <div class="data-label">DURÉE HEBDO:</div>
                          <div class="data-value bold">{{weeklyHours}} HEURES</div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">CONDITIONS FINANCIÈRES</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">TARIF H.T.</div>
                          <div class="data-value price-tag">{{billingRate}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">FACTURATION</div>
                          <div class="data-value">Mensuelle sur relevé d'activité</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">PAIEMENT</div>
                          <div class="data-value">30 jours date de facture</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">MODALITÉ</div>
                          <div class="data-value">VIREMENT</div>
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">LÉGISLATION</div>
                  <div class="card-body">
                      <div class="notice-box">
                          ** Sous peine de sanctions pénales (L.1254-1 et s. CT). L'utilisateur déclare avoir pris connaissance des conditions générales au verso. Les jours fériés chômés et payés sont dûs aux salariés temporaires sans condition d'ancienneté et facturés. Les informations concernant le motif, la durée, la rémunération** et les caractéristiques du poste sont sous la responsabilité de l'utilisateur. L'utilisateur prend en charge les frais d'accès aux installations collectives (art L.251-24 CT).
                      </div>
                  </div>
              </div>
          </div>

          <div class="signatures">
              <div class="signature-box">
                  <div class="signature-title">LE PRESTATAIRE</div>
                  <div class="signature-notice">(Cachet et Signature)</div>
              </div>
              <div class="signature-box">
                  <div class="signature-title">LE CLIENT</div>
                  <div class="signature-notice">
                      Représentant de l'entreprise qui certifie exactes les dispositions stipulées<br>
                      (Cachet et Signature)
                  </div>
              </div>
          </div>

          <div class="date-section">
              <div class="date-item">
                  <div class="date-label">FAIT À</div>
                  <div class="date-value">PARIS</div>
              </div>
              <div class="date-item">
                  <div class="date-label">LE</div>
                  <div class="date-value">{{generationDate}}</div>
              </div>
          </div>

          <div class="footnote">
              *Ce contrat est soumis aux conditions générales de prestation disponibles sur demande.
          </div>

          <div class="page-number">Page 1 sur 1</div>
      </div>
  </body>
  </html>`;
}

// Ajoutez ou remplacez le template du certificat existant
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
                      {{company.email}}<br>
                      {{company.siret}} - APE : {{company.ape}}
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
              <p>Ce document est délivré pour faire valoir ce que de droit.</p>
          </div>
          
          <div class="date-location">
              <p>Fait à PARIS, le {{generationDate}}</p>
          </div>
          
          <div class="signature-section">
              <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name">Pour {{company.name}}</div>
                  <div class="signature-title">Direction des Ressources Humaines</div>
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
