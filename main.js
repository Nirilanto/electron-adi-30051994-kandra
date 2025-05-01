const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const Store = require('electron-store');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');

// Configurer electron-store pour stocker les données à un emplacement spécifique
Store.initRenderer();

// S'assurer que le dossier de données existe
const dataPath = path.join(app.getPath('userData'), 'database');
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
      // Demander où enregistrer le fichier
      const result = await dialog.showSaveDialog({
        title: 'Exporter les données',
        defaultPath: path.join(app.getPath('documents'), 'contrat-manager-backup.json'),
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      
      if (result.canceled) {
        return { success: false, reason: 'canceled' };
      }
      
      filePath = result.filePath;
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
    if (!filePath) {
      // Demander quel fichier importer
      const result = await dialog.showOpenDialog({
        title: 'Importer des données',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      
      if (result.canceled) {
        return { success: false, reason: 'canceled' };
      }
      
      filePath = result.filePaths[0];
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
    throw error;
  }
});

// Dialogue pour sélectionner des fichiers
ipcMain.handle('show-save-dialog', async (_, options) => {
  return await dialog.showSaveDialog(options);
});

ipcMain.handle('show-open-dialog', async (_, options) => {
  return await dialog.showOpenDialog(options);
});

// Remplacez cette partie dans main.js
ipcMain.handle('generate-pdf', async (_, args) => {
  try {
    const { type, data, filename } = args;
    
    // Obtenir le chemin complet du fichier
    let outputPath = filename;
    
    // Si le chemin n'est pas absolu, demander où enregistrer le fichier
    if (!path.isAbsolute(filename)) {
      const result = await dialog.showSaveDialog({
        title: 'Enregistrer le PDF',
        defaultPath: path.join(app.getPath('documents'), filename),
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      
      if (result.canceled) {
        return { success: false, reason: 'canceled' };
      }
      
      outputPath = result.filePath;
    }
    
    // Au lieu d'importer depuis le chemin relatif, utiliser le template HTML directement
    let template;
    if (type === 'certificate') {
      template = getCertificateTemplate();
    } else { // contract par défaut
      template = getContractTemplate();
    }
    
    // Compiler le template avec Handlebars
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate(data);
    
    // Lancer Puppeteer pour générer le PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Générer le PDF avec les options appropriées
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    await browser.close();
    
    // Ouvrir le PDF automatiquement après la génération
    const { shell } = require('electron');
    shell.openPath(outputPath);
    
    return { 
      success: true, 
      filePath: outputPath,
      fileName: path.basename(outputPath)
    };
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return { 
      success: false, 
      error: error.message
    };
  }
});

// Ajouter ces fonctions pour obtenir les templates HTML des PDFs
function getContractTemplate() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Contrat de Mission</title>
    <style>
      /* Styles globaux */
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        font-size: 11pt;
      }
      .container {
        padding: 40px;
        max-width: 210mm; /* A4 width */
      }
      /* En-tête */
      .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        align-items: flex-start;
      }
      .logo-placeholder {
        width: 180px;
        height: 60px;
        border: 1px dashed #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
        color: #999;
        font-size: 14px;
      }
      .document-title {
        color: #1a73e8;
        text-align: right;
        font-weight: 600;
        font-size: 24px;
        margin: 0;
      }
      .reference {
        text-align: right;
        color: #666;
        font-size: 14px;
        margin-top: 5px;
      }
      /* Sections */
      h2 {
        color: #1a73e8;
        font-size: 14pt;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 8px;
        margin-top: 30px;
        font-weight: 600;
      }
      .section {
        margin-bottom: 25px;
      }
      .party-info {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 5px;
      }
      .party-box {
        flex: 1;
        min-width: 200px;
        background: #f7f9fc;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .party-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: #1a73e8;
      }
      /* Table des conditions financières */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
      }
      th {
        background-color: #f7f9fc;
        font-weight: 600;
        color: #333;
      }
      tr:hover {
        background-color: #f8f9fa;
      }
      /* Footer */
      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 60px;
        page-break-inside: avoid;
      }
      .signature-box {
        flex: 1;
        max-width: 30%;
        border-top: 1px solid #e0e0e0;
        padding-top: 10px;
        text-align: center;
        margin: 0 15px;
      }
      .footer {
        margin-top: 60px;
        text-align: center;
        color: #999;
        font-size: 9pt;
        page-break-inside: avoid;
      }
      .page-number {
        position: absolute;
        bottom: 20px;
        right: 20px;
        font-size: 9pt;
        color: #999;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- En-tête du document -->
      <div class="header">
        <div>
          <div class="logo-placeholder">LOGO</div>
          <p>Votre Entreprise<br>
             123 Rue des Missions<br>
             75000 Paris</p>
        </div>
        <div>
          <h1 class="document-title">CONTRAT DE MISSION</h1>
          <p class="reference">Réf: {{reference}}</p>
          <p>Date: {{generationDate}}</p>
        </div>
      </div>

      <!-- Parties impliquées -->
      <h2>PARTIES</h2>
      <div class="section">
        <div class="party-info">
          <div class="party-box">
            <div class="party-title">ENTREPRISE DE PORTAGE</div>
            <p>Votre Entreprise<br>
              123 Rue des Missions<br>
              75000 Paris<br>
              SIRET: 123 456 789 00000</p>
          </div>
          
          <div class="party-box">
            <div class="party-title">CONSULTANT</div>
            <p>{{employee.fullName}}<br>
              {{employee.address}}<br>
              Email: {{employee.email}}<br>
              Tél: {{employee.phone}}</p>
          </div>
          
          <div class="party-box">
            <div class="party-title">CLIENT</div>
            <p>{{client.companyName}}<br>
              {{client.address}}<br>
              SIRET: {{client.siret}}<br>
              Contact: {{client.contactName}}</p>
          </div>
        </div>
      </div>

      <!-- Objet de la mission -->
      <h2>OBJET DE LA MISSION</h2>
      <div class="section">
        <h3 style="color: #333; margin-bottom: 10px; font-size: 12pt;">{{title}}</h3>
        <p>{{description}}</p>
      </div>

      <!-- Durée de la mission -->
      <h2>DURÉE DE LA MISSION</h2>
      <div class="section">
        <p><strong>Début:</strong> {{startDate}}</p>
        <p><strong>Fin:</strong> {{endDate}}</p>
        <p><strong>Durée:</strong> {{duration}}</p>
      </div>

      <!-- Lieu et horaires -->
      <h2>LIEU ET HORAIRES</h2>
      <div class="section">
        <p><strong>Lieu d'exécution:</strong> {{location}}</p>
        <p><strong>Horaires de travail:</strong> {{workingHours}}</p>
      </div>

      <!-- Conditions financières -->
      <h2>CONDITIONS FINANCIÈRES</h2>
      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Taux horaire consultant</td>
              <td style="text-align: right;">{{hourlyRate}}</td>
            </tr>
            <tr>
              <td>Taux horaire facturation client</td>
              <td style="text-align: right;">{{billingRate}}</td>
            </tr>
          </tbody>
        </table>
        
        <p><strong>Modalités de paiement:</strong> Facturation mensuelle, paiement à 30 jours fin de mois.</p>
      </div>

      <!-- Engagements -->
      <h2>ENGAGEMENTS DES PARTIES</h2>
      <div class="section">
        <p><strong>L'entreprise de portage</strong> s'engage à :</p>
        <ul>
          <li>Établir les factures correspondant aux prestations effectuées</li>
          <li>Verser la rémunération convenue au consultant selon les modalités définies</li>
          <li>Souscrire les assurances nécessaires pour couvrir l'activité du consultant</li>
        </ul>
        
        <p><strong>Le consultant</strong> s'engage à :</p>
        <ul>
          <li>Réaliser la mission conformément aux conditions définies</li>
          <li>Respecter la confidentialité des informations auxquelles il aura accès</li>
          <li>Fournir mensuellement un compte-rendu de son activité</li>
        </ul>
        
        <p><strong>Le client</strong> s'engage à :</p>
        <ul>
          <li>Permettre au consultant de réaliser sa mission dans de bonnes conditions</li>
          <li>Régler les factures selon les conditions convenues</li>
          <li>Fournir les moyens et informations nécessaires à la réalisation de la mission</li>
        </ul>
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div class="signature-box">
          <p>L'entreprise de portage</p>
          <p style="font-style: italic; color: #999; margin-top: 50px;">Signature et cachet</p>
        </div>
        
        <div class="signature-box">
          <p>Le consultant</p>
          <p style="font-style: italic; color: #999; margin-top: 50px;">Signature</p>
        </div>
        
        <div class="signature-box">
          <p>Le client</p>
          <p style="font-style: italic; color: #999; margin-top: 50px;">Signature et cachet</p>
        </div>
      </div>

      <!-- Pied de page -->
      <div class="footer">
        <p>Document généré par Contrat Manager © {{year}} - Ce document a valeur contractuelle</p>
      </div>
      
      <div class="page-number">Page 1/1</div>
    </div>
  </body>
  </html>`;
}

function getCertificateTemplate() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Certificat de Réalisation de Mission</title>
    <style>
      /* Styles globaux */
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        font-size: 11pt;
      }
      .container {
        padding: 40px;
        max-width: 210mm; /* A4 width */
      }
      /* En-tête */
      .header {
        text-align: center;
        margin-bottom: 40px;
      }
      .logo-placeholder {
        width: 180px;
        height: 60px;
        border: 1px dashed #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px auto;
        color: #999;
        font-size: 14px;
      }
      .document-title {
        color: #1a73e8;
        font-weight: 600;
        font-size: 24px;
        margin: 20px 0;
      }
      /* Contenu */
      .content {
        margin-bottom: 30px;
      }
      .attestation {
        font-size: 14pt;
        margin-bottom: 20px;
        text-align: center;
      }
      .info-section {
        background: #f7f9fc;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .info-label {
        font-weight: 600;
        color: #1a73e8;
        margin-bottom: 5px;
      }
      h2 {
        color: #1a73e8;
        font-size: 14pt;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 8px;
        margin-top: 30px;
        font-weight: 600;
      }
      /* Signature */
      .signature-section {
        margin-top: 60px;
        page-break-inside: avoid;
      }
      .signature-date {
        text-align: right;
        margin-bottom: 10px;
      }
      .signature-box {
        width: 50%;
        margin-left: auto;
        border-top: 1px solid #e0e0e0;
        padding-top: 10px;
        text-align: center;
      }
      /* Footer */
      .footer {
        margin-top: 60px;
        text-align: center;
        color: #999;
        font-size: 9pt;
        page-break-inside: avoid;
      }
      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 100px;
        color: rgba(200, 200, 200, 0.1);
        font-weight: bold;
        z-index: -1;
        pointer-events: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Watermark (optional) -->
      <div class="watermark">CERTIFICAT</div>
      
      <!-- En-tête du document -->
      <div class="header">
        <div class="logo-placeholder">LOGO</div>
        <h1 class="document-title">CERTIFICAT DE RÉALISATION DE MISSION</h1>
      </div>

      <!-- Contenu principal -->
      <div class="content">
        <p class="attestation">
          Je soussigné(e), <strong>[Nom et fonction du signataire]</strong>, représentant la société <strong>{{client.companyName}}</strong>,
          certifie par la présente que :
        </p>
        
        <div class="info-section">
          <div class="info-label">CONSULTANT</div>
          <p><strong>{{employee.fullName}}</strong></p>
        </div>
        
        <h2>A RÉALISÉ LA MISSION SUIVANTE</h2>
        
        <div class="info-section">
          <p><span class="info-label">Intitulé :</span> {{title}}</p>
          <p><span class="info-label">Description :</span> {{description}}</p>
          <p><span class="info-label">Période :</span> Du {{startDate}} au {{endDate}}</p>
          <p><span class="info-label">Durée :</span> {{duration}}</p>
          <p><span class="info-label">Lieu :</span> {{location}}</p>
        </div>
        
        <h2>COMPÉTENCES MISES EN ŒUVRE</h2>
        
        <div class="info-section">
          <p>{{employee.skills}}</p>
        </div>
      </div>
      
      <!-- Signature -->
      <div class="signature-section">
        <p class="signature-date">Fait à ________________, le {{generationDate}}</p>
        
        <div class="signature-box">
          <p><strong>Pour {{client.companyName}}</strong></p>
          <p style="margin-top: 60px; font-style: italic;">Signature et cachet</p>
        </div>
      </div>
      
      <!-- Pied de page -->
      <div class="footer">
        <p>Document généré par Contrat Manager © {{year}}</p>
      </div>
    </div>
  </body>
  </html>`;
}