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
function getEmployeeContractTemplate() {
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrat de mise à disposition GOGO</title>
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
                      {{company.siret}} - APE : {{company.ape}}<br>
                      {{company.email}}
                  </div>
              </div>
              <div class="document-notice">
                  Merci de nous retourner le double du contrat signé dans les deux jours ouvrables suivant la mise à disposition conformément à l'article L.1251-1 et s. du Code du Travail
              </div>
          </div>

          <div class="title-section">
              <div class="title">CONTRAT DE MISE A DISPOSITION</div>
              <div class="subtitle">Du {{startDate}} Au {{endDate}}</div>
              <div class="document-number">N° {{reference}}</div>
          </div>

          <div class="grid">
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
                          <div class="data-label">NAF</div>
                          <div class="data-value">{{client.ape}}</div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">SALARIE TEMPORAIRE</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">NOM, PRENOM</div>
                          <div class="data-value bold">{{employee.fullName}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">N° S.S.</div>
                          <div class="data-value">{{employee.socialSecurityNumber}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">NATIONALITE</div>
                          <div class="data-value">{{employee.nationality}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">ADRESSE</div>
                          <div class="data-value">{{employee.address}}</div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">NATURE ET N° DU TITRE PROFESSIONNEL</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">QUALIFICATION CONTRACTUELLE CONVENUE</div>
                          <div class="data-value mission-tag">{{employee.skills}}</div>
                      </div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">NATURE ET N° DU TITRE SEJOUR</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-value">CARTE D'IDENTITÉ</div>
                          <div class="data-value">{{employee.idNumber}}</div>
                          <div class="data-value">{{employee.idIssueDate}}</div>
                          <div class="data-value">{{employee.idExpiryDate}}</div>
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">PRECISION SUR LE POSTE / FACTURATION</div>
                  <div class="card-body">
                      <div class="data-row">
                          <div class="data-label">Durée de la mission</div>
                          <div class="data-value">Du {{startDate}} Au {{endDate}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">PERIODE(S) NON TRAVAILLEE(S)</div>
                          <div class="data-value"></div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">TERME PRECIS</div>
                          <div class="data-value">X</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">DUREE MINIMALE</div>
                          <div class="data-value"></div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">LIEU DE MISSION</div>
                          <div class="data-value">{{client.location}}</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">MOYEN D'ACCES</div>
                          <div class="data-value">{{transport}}</div>
                      </div>
                     
                      <div class="data-row">
                          <div class="data-label">HORAIRE DE LA MISSION</div>
                          <div class="data-value"></div>
                      </div>
                      <div class="schedule-box">
                          {{#each workingHoursSlots}}
                              <div class="time-slot">De {{this.start}} À {{this.end}}</div>
                          {{/each}}
                      </div>
                      <div class="data-row">
                          <div class="data-label">DUREE HEBDOMADAIRE DE LA MISSION:</div>
                          <div class="data-value bold">{{weeklyHours}} HEURES</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">DUREE COLLECTIVE MOYENNE HEBDOMADAIRE:</div>
                          <div class="data-value bold">{{weeklyHours}} HEURES</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">ORGANISATION PARTICULIERE DU TEMPS DE TRAVAIL:</div>
                          <div class="data-value"></div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">SALAIRE DE REFERENCE /H:</div>
                          <div class="data-value price-tag">{{hourlyRate}} EUR</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">TARIF HORAIRE H.T.</div>
                          <div class="data-value price-tag">{{billingRate}} EUR</div>
                      </div>
                      <div class="data-row">
                          <div class="data-label">MODE DE PAIEMENT</div>
                          <div class="data-value">VIREMENT</div>
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">CARACTERISTIQUES PARTICULIERES DU POSTE DE TRAVAIL</div>
                  <div class="card-body">
                      <div class="risk-section">
                          (s'il y a lieu nature des protections individuelles de sécurité et surveillance médiale spéciale)
                      </div>
                      <div class="compact-section">
                          <div>SECURITE A ASSURER PAR LE CLIENT</div>
                          <div>RESPECT DES CONSIGNES DE SECURITE</div>
                          <div class="bold">PORT DE CHAUSSURE DE SECURITE ET DU CASQUE OBLIGATOIRE</div>
                      </div>
                      <div class="risk-section">
                          <div>Le poste figure-t-il sur la liste des postes de risques prévues à l'article L.4154-2 CT ?</div>
                          <div class="checkbox-container">
                              <div class="checkbox checked"></div>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">MOTIF MISSION JUSTIFICATIF(S) DU RECOURS</div>
                  <div class="card-body">
                      <div class="checkbox-group">
                          <div class="checkbox-container">
                              <div class="checkbox {{#if motifs.accroissementActivite}}checked{{/if}}"></div>
                              <span>ACCROISSEMENT TEMP. D'ACTIVITE</span>
                          </div>
                          <div class="checkbox-container">
                              <div class="checkbox {{#if motifs.renforcementPersonnel}}checked{{/if}}"></div>
                              <span>RENFORT DE PERSONNEL</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="card full-width">
                  <div class="card-header">LEGISLATION</div>
                  <div class="card-body">
                      <div class="notice-box">
                          ** Sous peine de sanctions pénales prévues par l'article L.1254-1 et s. du CT<br>
                          - L'utilisateur soussigné déclare avoir pris connaissance des conditions générales de prestations figurant au verso, qui font partie intégrante du présent contrat, notamment en ce qui concerne la clause attributive de compétence du tribunal du lieu du siège social de l'ETT (paragraphe 8).<br>
                          - Les jours fériés chômés et payés dans l'entreprise utilisatrice sont dûs aux salariés temporaires sans condition d'ancienneté et facturés.<br>
                          - Les informations concernant le motif, la duréé, la rémunération** et les caractéristiques particulières du poste de travail sont données sous la responsabilité de l'utilisateur, seul habilité à les justifier, sans qu'il y ait lieu à mise en demeure préalable de la part de l'ETT.<br>
                          - L'utilisateur prend en charge les frais d'accès aux installations collectives (art L.251-24 CT).
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
          zezezez
   <div class="signature-box">
   zaeaea
        <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 9px;">L'ENTREPRISE DE TRAVAIL TEMPORAIRE</div>
        <div class="zone-signature">
          {{#if (hasImage signature)}}
            <img src="{{signature}}" alt="Signature" class="signature-image">
          {{/if}}
        </div>
    </div>
    <div class="signature-box">
        <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 9px;">L'ENTREPRISE UTILISATRICE</div>
        <div class="petit-texte">
            Nom en capitale du Représentant de l'entreprise Utilisateur qui certifie exactes les dispositions générales de vente stipulées au verso (Cachet et Signature)
        </div>
        <div class="zone-signature">
        hzjahekahejkh
          {{#if (hasImage stamp)}}
            <img src="{{stamp}}" alt="Tampon" class="stamp-image">
          {{/if}}
        </div>
    </div>
          </div>

          <div class="footnote">
              *Le terme de la mission prévu dans le contrat initiale ou dans l'avenant de prolongations peut être aménagé dans les conditions stipulées aux articles L.1251-30 CT et L.1251-31 CT
          </div>

          <div class="date-section">
              <div class="date-item">
                  <div class="date-label">FAIT A</div>
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
                font-size: 9px;
                line-height: 1.3;
                color: #333;
                background-color: #f5f5f5;
                font-weight: 300;
            }
            
            /* Définition format A4 */
            .page {
                width: 210mm;
                height: 297mm;
                padding: 10mm;
                margin: 0 auto;
                background-color: white;
                position: relative;
            }
            
            /* Header restructuré selon demande */
            .entete {
                display: flex;
                justify-content: space-between;
                margin-bottom: 14px;
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
                font-size: 22px;
                font-weight: 700;
                color: #1a1a1a;
                letter-spacing: 1.5px;
                margin-bottom: 4px;
            }
            
            .infos-societe {
                font-size: 8px;
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
            
            /* Sections design épuré */
            .section {
                margin-bottom: 5px;
                border: 1px solid #e0e0e0;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .titre-section {
                background-color: #1a1a1a;
                padding: 5px 10px;
                font-weight: 500;
                font-size: 9px;
                color: white;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            
            .contenu-section {
                padding: 5px 10px;
                background-color: #ffffff;
            }
            
            /* Grilles et mise en page */
            .grille {
                display: grid;
                grid-template-columns: 50% 50%;
                gap: 8px;
            }
            
            .grille-3-cols {
                display: grid;
                grid-template-columns: 33.3% 33.3% 33.3%;
                gap: 5px;
            }
            
            .champ {
                margin-bottom: 6px;
            }
            
            .label {
                font-weight: 600;
                font-size: 8px;
                color: #777;
                margin-bottom: 2px;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            .label-petit {
                font-weight: 400;
                font-size: 8px;
                color: #777;
                font-style: italic;
                margin-top: 2px;
            }
            
            .valeur {
                font-size: 9px;
                color: #333;
                font-weight: 400;
            }
            
            .valeur-importante {
                font-weight: 600;
                color: #1a1a1a;
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
                background-color: #1a1a1a;
                border-color: #1a1a1a;
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
                background-color: #1a1a1a;
                border-radius: 50%;
            }
            
            /* Signature */
            .signature-section {
                display: grid;
                grid-template-columns: 50% 50%;
                margin-top: 2px;
                gap: 10px;
            }
            
            .signature-box {
                padding: 5px 0;
            }
    
            .fait-a {
                text-align: center;
                font-weight: 500;
                font-size: 10px;
                margin: 1px 0 1px 0;
            }
            
            .zone-signature {
                height: 60px;
                border: 1px solid #e0e0e0;
                margin-top: 6px;
                background-color: white;
                border-radius: 2px;
                position: relative;
            }
            
            .zone-signature:before {
                content: "";
                position: absolute;
                bottom: 5px;
                left: 5px;
                right: 5px;
                height: 1px;
                background-color: #e0e0e0;
            }
            
            .petit-texte {
                font-size: 8px;
                color: #242222;
                line-height: 1.3;
            }
            
            /* Législation */
            .legislation {
                font-size: 8px;
                line-height: 1.4;
                color:#1a1a1a;
            }
            
            .legislation-item {
                position: relative;
                padding-left: 10px;
                margin-bottom: 4px;
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
                font-size: 8px;
                color: #999;
                font-weight: 300;
            }
            
            /* Éléments de style modernes */
            .divider {
                height: 1px;
                background-color: #e0e0e0;
                margin: 5px 0;
            }
            
            .tag {
                display: inline-block;
                background-color: #f3f3f3;
                color: #1a1a1a;
                padding: 2px 6px;
                border-radius: 2px;
                font-size: 8px;
                font-weight: 500;
                margin-right: 3px;
                border-left: 2px solid #1a1a1a;
            }
            
            /* Notes de bas de section */
            .note {
                font-size: 8px;
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
            
            /* Signature et tampon images */
            .signature-image {
                max-width: 100%;
                max-height: 50px;
                display: block;
                margin: 5px auto;
            }
            
            .stamp-image {
                max-width: 70%;
                max-height: 50px;
                display: block;
                margin: 5px auto;
                opacity: 0.8;
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
                                <div class="label">Nom, Prénom</div>
                                <div class="valeur valeur-importante">{{employee.lastName}} {{employee.firstName}}</div>
                            </div>
                            <div class="champ">
                                <div class="label">N° S.S.</div>
                                <div class="valeur">{{employee.socialSecurityNumber}}</div>
                            </div>
                            <div class="champ">
                                <div class="label">Adresse</div>
                                <div class="valeur">
                                    {{employee.address}}<br>
                                    {{#if employee.addressComplement}}{{employee.addressComplement}}<br>{{/if}}
                                    {{employee.postalCode}} {{employee.city}}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="champ">
                                <div class="label">Nationalité</div>
                                <div class="valeur">{{employee.nationality}}</div>
                            </div>
                            <div class="champ">
                                <div class="label">Qualification</div>
                                <div class="valeur valeur-importante">{{employee.qualification}}</div>
                            </div>
                            <div class="champ">
                                <div class="label">Nature et N° du Titre Séjour</div>
                                <div class="valeur">{{employee.idType}} {{employee.idNumber}} {{employee.idIssueDate}} {{employee.idExpiryDate}}</div>
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
                                <div class="label">Raison Sociale</div>
                                <div class="valeur valeur-importante">{{client.companyName}}</div>
                            </div>
                            <div class="champ">
                                <div class="label">SIRET</div>
                                <div class="valeur">{{client.siret}}</div>
                            </div>
                        </div>
                        <div>
                            <div class="champ">
                                <div class="label">NAF</div>
                                <div class="valeur">{{client.nafCode}}</div>
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
                </div>
            </div>
    
            <!-- Précisions sur le poste - colonnes équilibrées -->
            <div class="section">
                <div class="titre-section">PRÉCISION SUR LE POSTE / FACTURATION</div>
                <div class="contenu-section">
                    <div class="grille" style="align-items: stretch;">
                        <div class="colonne-gauche">
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
                                    <div class="label">Durée de la Mission</div>
                                    <div class="valeur">Du {{startDate}} Au {{endDate}}</div>
                                </div>
                                
                                <div class="champ">
                                    <div class="label">Période(s) Non Travaillée(s)</div>
                                    <div class="valeur">{{nonWorkingPeriods}}</div>
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
                        
                        <div class="colonne-droite">
                            <div>
                                <div class="champ">
                                    <div class="label">Durée Hebdomadaire de la mission</div>
                                    <div class="valeur valeur-importante">{{weeklyMissionDuration}} HEURES</div>
                                </div>
                                  <div class="champ">
                                    <div class="label">Durée collective moyenne hebdomadaire</div>
                                    <div class="valeur valeur-importante">{{weeklyCollectiveAvgDuration}} HEURES</div>
                                </div>
                                
                                <div class="champ">
                                    <div class="label">Durée Collective Hebdomadaire</div>
                                    <div class="valeur valeur-importante">{{weeklyCollectiveDuration}} HEURES</div>
                                </div>
                                
                                <div class="champ">
                                    <div class="label">Lieu de Mission</div>
                                    <div class="valeur valeur-importante">{{location}}</div>
                                </div>
                            </div>
                            
                            <div>
                                <div class="divider"></div>
                                
                                <div class="champ">
                                    <div class="label">Salaire de Référence /H</div>
                                    <div class="valeur valeur-importante">{{hourlyRate}} €</div>
                                </div>
                                
                                <div class="champ">
                                    <div class="label">Tarif Horaire H.T.</div>
                                    <div class="valeur valeur-importante">{{billingRate}} €</div>
                                </div>
                                
                                <div class="champ">
                                    <div class="label">Mode de Paiement</div>
                                    <div class="valeur valeur-importante">{{paymentMethod}}</div>
                                </div>
                                
                                <div class="champ">
                                    <div class="label">Moyen d'Accès</div>
                                    <div class="valeur valeur-importante">{{accessMethod}}</div>
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
            <div class="fait-a">FAIT A {{location}} LE {{generationDate}}</div>
    
            <!-- Signatures avec images si disponibles -->
            <div class="signature-section">
                <div class="signature-box">
                    <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 9px;">L'ENTREPRISE DE TRAVAIL TEMPORAIRE</div>
                    <div class="zone-signature">
                    {{#if (hasImage signature)}}
                        <img src="{{signature}}" alt="Signature ETT" class="signature-image" style="max-width: 100%; max-height: 50px; display: block; margin: 5px auto;">
                    {{/if}}
                    </div>
                </div>
                <div class="signature-box">
                    <div class="label" style="color: #1a1a1a; font-weight: 700; font-size: 9px;">L'ENTREPRISE UTILISATRICE</div>
                    <div class="petit-texte">
                        Nom en capitale du Représentant de l'entreprise Utilisateur (Cachet et Signature)
                    </div>
                    <div class="zone-signature">
                    {{#if (hasImage stamp)}}
                        <img src="{{stamp}}" alt="Tampon Client" class="stamp-image" style="max-width: 70%; max-height: 50px; display: block; margin: 5px auto; opacity: 0.8;">
                    {{/if}}
                    </div>
                </div>
            </div>
                        
            <div class="page-number">Page 1 sur 2</div>
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
