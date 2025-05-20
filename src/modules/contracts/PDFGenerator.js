// src/modules/contracts/PDFGenerator.js

/**
 * Classe pour la génération de documents PDF de contrats et certificats
 * Compatible avec Electron et le mode web
 */
class PDFGenerator {
  /**
   * Génère un PDF de contrat pour l'employé/consultant
   * @param {Object} contract - Les données du contrat
   * @param {Object} employee - Les données de l'employé
   * @param {Object} client - Les données du client
   * @param {String} customPath - Chemin personnalisé pour enregistrer le PDF (optionnel)
   * @returns {Promise<Object>} Résultat de la génération
   */
  static async generateEmployeeContractPDF(
    contract,
    employee,
    client,
    company,
    customPath = null
  ) {
    try {
      // Vérifier que les données sont présentes
      if (!contract || !employee || !client) {
        throw new Error(
          "Données manquantes pour générer le PDF du contrat employé"
        );
      }

      console.log("Préparation du PDF pour le contrat employé:", contract.id);

      // Préparer les données du contrat pour le PDF
      const contractData = this.prepareContractData(
        contract,
        employee,
        client,
        company
      );

      // Générer un nom de fichier par défaut si aucun chemin personnalisé n'est fourni
      const defaultFileName = `contrat_consultant_${
        contract.contractNumber || contract.id
      }_${new Date().toISOString().split("T")[0].replace(/-/g, "")}.pdf`;

      // Si nous sommes dans Electron, utiliser l'API Electron
      if (window.electron) {
        return await window.electron.generatePDF(
          "employee_contract",
          contractData,
          customPath || defaultFileName
        );
      } else {
        // En mode web, ouvrir une prévisualisation HTML dans une nouvelle fenêtre
        return this.openEmployeeContractPreview(contractData);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la génération du PDF du contrat employé:",
        error
      );
      throw error;
    }
  }

  /**
   * Génère un PDF de contrat pour le client
   * @param {Object} contract - Les données du contrat
   * @param {Object} employee - Les données de l'employé
   * @param {Object} client - Les données du client
   * @param {String} customPath - Chemin personnalisé pour enregistrer le PDF (optionnel)
   * @returns {Promise<Object>} Résultat de la génération
   */
  static async generateClientContractPDF(
    contract,
    employee,
    client,
    company,
    customPath = null
  ) {
    try {
      // Vérifier que les données sont présentes
      if (!contract || !client) {
        throw new Error(
          "Données manquantes pour générer le PDF du contrat client"
        );
      }

      console.log("Préparation du PDF pour le contrat client:", contract.id);

      // Préparer les données du contrat pour le PDF
      const contractData = this.prepareContractData(
        contract,
        employee,
        client,
        company
      );

      // Générer un nom de fichier par défaut si aucun chemin personnalisé n'est fourni
      const defaultFileName = `contrat_client_${
        contract.contractNumber || contract.id
      }_${new Date().toISOString().split("T")[0].replace(/-/g, "")}.pdf`;

      // Si nous sommes dans Electron, utiliser l'API Electron
      if (window.electron) {
        return await window.electron.generatePDF(
          "client_contract",
          contractData,
          customPath || defaultFileName
        );
      } else {
        // En mode web, ouvrir une prévisualisation HTML dans une nouvelle fenêtre
        return this.openClientContractPreview(contractData);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la génération du PDF du contrat client:",
        error
      );
      throw error;
    }
  }

  /**
   * Ouvre une prévisualisation du contrat employé dans une nouvelle fenêtre (mode web)
   */
  static openEmployeeContractPreview(data) {
    try {
      const htmlContent = this.generateEmployeeContractHTML(data);

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        return { success: true, previewOpened: true };
      } else {
        throw new Error(
          "Impossible d'ouvrir la prévisualisation. Vérifiez les bloqueurs de popups."
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'ouverture de la prévisualisation:",
        error
      );
      throw error;
    }
  }

  /**
   * Ouvre une prévisualisation du contrat client dans une nouvelle fenêtre (mode web)
   */
  static openClientContractPreview(data) {
    try {
      const htmlContent = this.generateClientContractHTML(data);

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        return { success: true, previewOpened: true };
      } else {
        throw new Error(
          "Impossible d'ouvrir la prévisualisation. Vérifiez les bloqueurs de popups."
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'ouverture de la prévisualisation:",
        error
      );
      throw error;
    }
  }

  /**
   * Prépare les données du contrat pour le PDF
   */
  static prepareContractData(contract, employee, client, company) {
    // Formatage des dates
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    // Formatage des montants
    const formatCurrency = (amount) => {
      if (!amount) return "0,00 EUR";
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
        .format(amount)
        .replace("€", "EUR")
        .replace(" ", " ");
    };

    // Calculer la durée du contrat
    let duration = "";
    if (contract.startDate && contract.endDate) {
      const startDate = new Date(contract.startDate);
      const endDate = new Date(contract.endDate);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;

      if (months > 0) {
        duration += `${months} mois`;
        if (days > 0) {
          duration += ` et ${days} jours`;
        }
      } else {
        duration = `${days} jours`;
      }
    } else {
      duration = "Durée indéterminée";
    }

    // Traiter les horaires de travail
    const parseWorkingHours = (workingHoursStr) => {
      if (!workingHoursStr) {
        return [
          { start: "08:00", end: "12:00" },
          { start: "13:00", end: "17:00" },
        ];
      }

      // Exemple format attendu: "08:00 - 12:00, 13:00 - 17:00"
      const slots = workingHoursStr.split(",").map((slot) => slot.trim());
      return slots.map((slot) => {
        const [start, end] = slot.split("-").map((time) => time.trim());
        return { start, end };
      });
    };

    const idCardExpiryDateVal = employee?.idCardExpiryDate
      ? formatDate(employee?.idCardExpiryDate)
      : "";
    const idCardIssueDateVal = employee?.idCardIssueDate
      ? formatDate(employee?.idCardIssueDate)
      : "";

      const birthDate = employee?.birthDate
      ? formatDate(employee?.birthDate)
      : "";

    const workingHoursSlots = parseWorkingHours(
      contract.workingHours || contract.working_hours
    );

    // Extraire les noms d'employé correctement, quelle que soit la structure
    const employeeFirstName = employee
      ? employee.firstName || employee.firstname || ""
      : "";
    const employeeLastName = employee
      ? employee.lastName || employee.lastname || ""
      : "";
    const employeeFullName = `${employeeLastName.toUpperCase()} ${employeeFirstName.toUpperCase()}`;

    // Détecter si les motifs sont actifs
    const isAccroissementActivite = (contract.motif || "")
      .toUpperCase()
      .includes("ACCROISSEMENT");
    const isRenforcementPersonnel = (contract.motif || "")
      .toUpperCase()
      .includes("RENFORT");

    // Retourner les données structurées pour le PDF
    return {
      // Informations de base du contrat
      reference: contract.contractNumber || contract.id,
      title: "CONTRAT DE MISE À DISPOSITION",
      subtitle: `Du ${formatDate(contract.startDate)} Au ${formatDate(
        contract.endDate
      )}`,
      startDate: formatDate(contract.startDate),
      endDate: formatDate(contract.endDate),
      transport: contract.transport,
      duration: duration,
      description: contract.description || "",
      motif: contract.motif,
      justificatif: contract.justificatif,
      mission: contract.mission,
      paymentMethod: contract.paymentMethod,
      weeklyCollectiveAvgDuration: contract.weeklyCollectiveAvgDuration,
      weeklyCollectiveDuration: contract.weeklyCollectiveAvgDuration,
      nonWorkingPeriods: contract.nonWorkingPeriods,
      weeklyMissionDuration: contract.weeklyMissionDuration,
      location: contract.location,
      securityMeasures: contract.securityMeasuresList,
      // Signature et tampon - S'assurer qu'ils sont bien au format base64
      signature:
        contract.signature?.imageData &&
        typeof contract.signature.imageData === "string"
          ? contract.signature?.imageData
          : null,
      stamp:
        contract.stamp?.imageData && typeof contract.stamp === "string"
          ? companyData.stamp.imageData
          : null,

      // Informations sur l'employé
      employee: {
        fullName: employeeFullName,
        birthDate: birthDate,
        firstName: employeeFirstName,
        idCardIssueDate: idCardIssueDateVal,
        idCardExpiryDate: idCardExpiryDateVal,
        addressComplement: employee?.addressComplement || "",
        socialSecurityNumber: employee?.socialSecurityNumber || "",
        skills: employee?.skills || "",
        idCardType: employee?.idCardType,
        idCardNumber: employee?.idCardNumber,
        lastName: employeeLastName,
        nationality: employee?.nationality || "FRANÇAISE",
        address: employee?.address || "",
        postalCode: employee?.postalCode || employee?.postal_code || "",
        city: employee?.city || "",
        email: employee?.email || "",
        phone: employee?.phone || "",
        skills: (employee?.skills || "CONSULTANT").toUpperCase(),
      },

      // Informations sur le client
      client: {
        companyName: (
          client?.companyName ||
          client?.company_name ||
          ""
        ).toUpperCase(),
        basketFees: client?.basketFees || "",
        travelFees: client?.travelFees || "",
        siret: client?.siret || "",
        address: client?.address || "",
        postalCode: client?.postalCode || client?.postal_code || "",
        city: client?.city || "",
        contactName: client?.contactName || client?.contact_name || "",
        location: contract.location || "IDF",
        nafCode: client?.nafCode,
      },
      company,

      // Informations sur le contrat
      motifs: {
        accroissementActivite: isAccroissementActivite,
        renforcementPersonnel: isRenforcementPersonnel,
      },

      // Horaires et tarification
      workingHours:
        contract.workingHours ||
        contract.working_hours ||
        "08:00 - 12:00, 13:00 - 17:00",
      workingHoursSlots: workingHoursSlots,
      hourlyRate: formatCurrency(contract.hourlyRate || contract.hourly_rate),
      billingRate: formatCurrency(
        contract.billingRate || contract.billing_rate
      ),
      weeklyHours: "35",
      transport: contract.transport || "SELON MOYENS",

      // Métadonnées
      generationDate: formatDate(new Date()),
    };
  }

  /**
   * Génère le HTML pour la prévisualisation du contrat employé
   * Reproduction fidèle du template Atlantis
   */
  static generateEmployeeContractHTML(data) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contrat de mise à disposition - Atlantis</title>
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
                      <div class="logo">ATLANTIS pdf generate</div>
                      <div class="company-info">
                          221 RUE DE LAFAYETTE 75010 PARIS<br>
                          CONTACTATLANTIS75@GMAIL.COM<br>
                          948 396 973 R.C.S. PARIS - APE : 7820Z
                      </div>
                  </div>
                  <div class="document-notice">
                      Merci de nous retourner le double du contrat signé dans les deux jours ouvrables suivant la mise à disposition (L.1251-1 CT)
                  </div>
              </div>
  
              <div class="title-section">
                  <div class="title">CONTRAT DE MISE À DISPOSITION</div>
                  <div class="subtitle">Du ${data.startDate} Au ${
      data.endDate
    }</div>
                  <div class="document-number">N° ${data.reference}</div>
              </div>
  
              <div class="grid">
                  <div class="card">
                      <div class="card-header">SALARIÉ TEMPORAIRE</div>
                      <div class="card-body">
                          <div class="data-row">
                              <div class="data-label">NOM, PRÉNOM</div>
                              <div class="data-value bold">${
                                data.employee.fullName
                              }</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">NATIONALITÉ</div>
                              <div class="data-value">${
                                data.employee.nationality
                              }</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">TITRE SÉJOUR</div>
                              <div class="data-value">CARTE D'IDENTITÉ</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">QUALIFICATION</div>
                              <div class="data-value">
                                  <div class="mission-tag">${
                                    data.employee.skills
                                  }</div>
                              </div>
                          </div>
                      </div>
                  </div>
  
                  <div class="card">
                      <div class="card-header">ENTREPRISE UTILISATRICE</div>
                      <div class="card-body">
                          <div class="data-row">
                              <div class="data-label">RAISON SOCIALE</div>
                              <div class="data-value bold">${
                                data.client.companyName
                              }</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">SIRET</div>
                              <div class="data-value">${data.client.siret}</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">ADRESSE</div>
                              <div class="data-value">
                                  ${data.client.address}<br>
                                  ${data.client.postalCode} ${data.client.city}
                              </div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">LIEU DE MISSION</div>
                              <div class="data-value">${
                                data.client.location
                              }</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">MOYEN D'ACCÈS</div>
                              <div class="data-value">${data.transport}</div>
                          </div>
                      </div>
                  </div>
  
                  <div class="card full-width">
                      <div class="card-header">MOTIF MISSION JUSTIFICATIF(S) DU RECOURS</div>
                      <div class="card-body">
                          <div class="checkbox-group">
                              <div class="checkbox-container">
                                  <div class="checkbox ${
                                    data.motifs.accroissementActivite
                                      ? "checked"
                                      : ""
                                  }"></div>
                                  <span>ACCROISSEMENT TEMP. D'ACTIVITÉ</span>
                              </div>
                              <div class="checkbox-container">
                                  <div class="checkbox ${
                                    data.motifs.renforcementPersonnel
                                      ? "checked"
                                      : ""
                                  }"></div>
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
                              <div class="data-value highlight">Du ${
                                data.startDate
                              } Au ${data.endDate}</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">TERME PRÉCIS</div>
                              <div class="data-value bold">${data.endDate}</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">HORAIRE MISSION</div>
                              <div class="data-value"></div>
                          </div>
                          <div class="schedule-box">
                              ${data.workingHoursSlots
                                .map(
                                  (slot) => `
                                  <div class="time-slot">De ${slot.start} À ${slot.end}</div>
                              `
                                )
                                .join("")}
                          </div>
                          <div class="data-row">
                              <div class="data-label">DURÉE HEBDO:</div>
                              <div class="data-value bold">${
                                data.weeklyHours
                              } HEURES</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">SALAIRE REF/H:</div>
                              <div class="data-value price-tag">${
                                data.hourlyRate
                              }</div>
                          </div>
                          <div class="data-row">
                              <div class="data-label">TARIF H.T.</div>
                              <div class="data-value price-tag">${
                                data.billingRate
                              }</div>
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
                      <div class="date-value">${data.generationDate}</div>
                  </div>
              </div>
  
              <div class="page-number">Page 1 sur 2</div>
          </div>
      </body>
      </html>`;
  }

  /**
   * Génère le HTML pour la prévisualisation du contrat client
   * Adaptation du template Atlantis pour la version client
   */
  static generateClientContractHTML(data) {
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
                        <div class="logo">ATLANTIS</div>
                        <div class="company-info">
                            221 RUE DE LAFAYETTE 75010 PARIS<br>
                            CONTACTATLANTIS75@GMAIL.COM<br>
                            948 396 973 R.C.S. PARIS - APE : 7820Z
                        </div>
                    </div>
                    <div class="document-notice">
                        Contrat de prestation - Exemplaire client
                    </div>
                </div>
    
                <div class="title-section">
                    <div class="title">CONTRAT DE PRESTATION</div>
                    <div class="subtitle">Du ${data.startDate} Au ${
      data.endDate
    }</div>
                    <div class="document-number">N° ${data.reference}</div>
                </div>
    
                <div class="grid">
                    <div class="card">
                        <div class="card-header">PRESTATAIRE</div>
                        <div class="card-body">
                            <div class="data-row">
                                <div class="data-label">RAISON SOCIALE</div>
                                <div class="data-value bold">ATLANTIS</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">SIRET</div>
                                <div class="data-value">948 396 973 R.C.S. PARIS</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">ADRESSE</div>
                                <div class="data-value">
                                    221 RUE DE LAFAYETTE<br>
                                    75010 PARIS
                                </div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">CONTACT</div>
                                <div class="data-value">CONTACTATLANTIS75@GMAIL.COM</div>
                            </div>
                        </div>
                    </div>
    
                    <div class="card">
                        <div class="card-header">CLIENT</div>
                        <div class="card-body">
                            <div class="data-row">
                                <div class="data-label">RAISON SOCIALE</div>
                                <div class="data-value bold">${
                                  data.client.companyName
                                }</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">SIRET</div>
                                <div class="data-value">${
                                  data.client.siret
                                }</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">ADRESSE</div>
                                <div class="data-value">
                                    ${data.client.address}<br>
                                    ${data.client.postalCode} ${
      data.client.city
    }
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
                                    <div class="mission-tag">${
                                      data.employee.skills
                                    }</div>
                                </div>
                            </div>
                            <div class="checkbox-group">
                                <div class="checkbox-container">
                                    <div class="checkbox ${
                                      data.motifs.accroissementActivite
                                        ? "checked"
                                        : ""
                                    }"></div>
                                    <span>ACCROISSEMENT TEMP. D'ACTIVITÉ</span>
                                </div>
                                <div class="checkbox-container">
                                    <div class="checkbox ${
                                      data.motifs.renforcementPersonnel
                                        ? "checked"
                                        : ""
                                    }"></div>
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
                                <div class="data-value highlight">Du ${
                                  data.startDate
                                } Au ${data.endDate}</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">LIEU DE MISSION</div>
                                <div class="data-value">${
                                  data.client.location
                                }</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">HORAIRES</div>
                            </div>
                            <div class="schedule-box">
                                ${data.workingHoursSlots
                                  .map(
                                    (slot) => `
                                    <div class="time-slot">De ${slot.start} À ${slot.end}</div>
                                `
                                  )
                                  .join("")}
                            </div>
                            <div class="data-row">
                                <div class="data-label">DURÉE HEBDO:</div>
                                <div class="data-value bold">${
                                  data.weeklyHours
                                } HEURES</div>
                            </div>
                        </div>
                    </div>
    
                    <div class="card">
                        <div class="card-header">CONDITIONS FINANCIÈRES</div>
                        <div class="card-body">
                            <div class="data-row">
                                <div class="data-label">TARIF H.T.</div>
                                <div class="data-value price-tag">${
                                  data.billingRate
                                }</div>
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
                        <div class="date-value">${data.generationDate}</div>
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

  /**
   * Génère un PDF de certificat d'accomplissement pour l'employé
   * @param {Object} contract - Les données du contrat
   * @param {Object} employee - Les données de l'employé
   * @param {Object} client - Les données du client
   * @param {String} customPath - Chemin personnalisé pour enregistrer le PDF (optionnel)
   * @returns {Promise<Object>} Résultat de la génération
   */
  static async generateEmployeeCertificatePDF(
    contract,
    employee,
    client,
    company,
    customPath = null
  ) {
    try {
      // Vérifier que les données sont présentes
      if (!contract || !employee || !client) {
        throw new Error("Données manquantes pour générer le PDF du certificat");
      }

      console.log("Préparation du PDF pour le certificat:", contract.id);

      // Préparer les données du contrat pour le PDF
      const contractData = this.prepareContractData(
        contract,
        employee,
        client,
        company
      );

      // Générer un nom de fichier par défaut si aucun chemin personnalisé n'est fourni
      const defaultFileName = `certificat_${
        contract.contractNumber || contract.id
      }_${new Date().toISOString().split("T")[0].replace(/-/g, "")}.pdf`;

      // Si nous sommes dans Electron, utiliser l'API Electron
      if (window.electron) {
        return await window.electron.generatePDF(
          "certificate",
          contractData,
          customPath || defaultFileName
        );
      } else {
        // En mode web, ouvrir une prévisualisation HTML dans une nouvelle fenêtre
        return this.openCertificatePreview(contractData);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la génération du PDF du certificat:",
        error
      );
      throw error;
    }
  }

  /**
   * Ouvre une prévisualisation du certificat dans une nouvelle fenêtre (mode web)
   */
  static openCertificatePreview(data) {
    try {
      const htmlContent = this.generateCertificateHTML(data);

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        return { success: true, previewOpened: true };
      } else {
        throw new Error(
          "Impossible d'ouvrir la prévisualisation. Vérifiez les bloqueurs de popups."
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'ouverture de la prévisualisation:",
        error
      );
      throw error;
    }
  }

  /**
   * Génère le HTML pour la prévisualisation du certificat
   * Style Atlantis
   */
  static generateCertificateHTML(data) {
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Attestation de mission - ${data.employee.fullName}</title>
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
                        <div class="logo">ATLANTIS</div>
                        <div class="company-info">
                            221 RUE DE LAFAYETTE 75010 PARIS<br>
                            CONTACTATLANTIS75@GMAIL.COM<br>
                            948 396 973 R.C.S. PARIS - APE : 7820Z
                        </div>
                    </div>
                </div>
                
                <div class="certificate-title">Attestation de mission</div>
                
                <div class="certificate-content">
                    <p>Je soussigné, Directeur des Ressources Humaines de la société ATLANTIS, certifie que :</p>
                </div>
                
                <div class="employee-name">${data.employee.fullName}</div>
                
                <div class="certificate-content">
                    <p>A effectué une mission au sein de la société ${data.client.companyName}, conformément aux conditions stipulées dans le contrat de mise à disposition.</p>
                </div>
                
                <div class="mission-details">
                    <div class="detail-row">
                        <div class="detail-label">N° de contrat :</div>
                        <div>${data.reference}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Période :</div>
                        <div>Du ${data.startDate} au ${data.endDate}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Qualification :</div>
                        <div>${data.employee.skills}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Lieu de mission :</div>
                        <div>${data.client.location}</div>
                    </div>
                </div>
                
                <div class="certificate-content">
                    <p>Ce document est délivré pour faire valoir ce que de droit.</p>
                </div>
                
                <div class="date-location">
                    <p>Fait à PARIS, le ${data.generationDate}</p>
                </div>
                
                <div class="signature-section">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-name">Pour ATLANTIS</div>
                        <div class="signature-title">Direction des Ressources Humaines</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 15px;">
                    <div class="document-number">N° ${data.reference}</div>
                </div>
                
                <div class="footer">
                    <p>ATLANTIS - 221 RUE DE LAFAYETTE 75010 PARIS - SIRET : 948 396 973 R.C.S. PARIS - APE : 7820Z</p>
                </div>
            </div>
        </body>
        </html>`;
  }
}

export default PDFGenerator;
