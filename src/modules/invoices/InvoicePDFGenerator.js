// src/modules/invoices/InvoicePDFGenerator.js

/**
 * Classe pour la génération de documents PDF de factures
 * Compatible avec Electron et le mode web
 * Basé sur le style Atlantis existant
 */
class InvoicePDFGenerator {
  /**
   * Génère un PDF de facture
   * @param {Object} invoice - Les données de la facture
   * @param {Object} client - Les données du client
   * @param {Object} company - Les données de l'entreprise
   * @param {String} customPath - Chemin personnalisé pour enregistrer le PDF (optionnel)
   * @returns {Promise<Object>} Résultat de la génération
   */
  static async generateInvoicePDF(
    invoice,
    client,
    company,
    customPath = null
  ) {
    try {
      // Vérifier que les données sont présentes
      if (!invoice || !client) {
        throw new Error(
          "Données manquantes pour générer le PDF de la facture"
        );
      }

      console.log("Préparation du PDF pour la facture: 001", invoice.invoiceNumber, customPath);

      // Préparer les données de la facture pour le PDF
      const invoiceData = this.prepareInvoiceData(invoice, client, company);

      console.log("Préparation du PDF pour la facture invoiceData:", invoiceData);

      // Générer un nom de fichier par défaut si aucun chemin personnalisé n'est fourni
      const defaultFileName = `facture_${
        invoice.invoiceNumber || invoice.id
      }_${new Date().toISOString().split("T")[0].replace(/-/g, "")}.pdf`;

      // Si nous sommes dans Electron, utiliser l'API Electron
      if (window.electron) {
        return await window.electron.generatePDF(
          "invoice",
          invoiceData,
          customPath || defaultFileName
        );
      } else {
        // En mode web, ouvrir une prévisualisation HTML dans une nouvelle fenêtre
        return this.openInvoicePreview(invoiceData);
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF de la facture:", error);
      throw error;
    }
  }

  /**
   * Génère un devis à partir des données de facture
   * @param {Object} invoice - Les données de la facture (en mode devis)
   * @param {Object} client - Les données du client
   * @param {Object} company - Les données de l'entreprise
   * @param {String} customPath - Chemin personnalisé pour enregistrer le PDF (optionnel)
   * @returns {Promise<Object>} Résultat de la génération
   */
  static async generateQuotePDF(
    invoice,
    client,
    company,
    customPath = null
  ) {
    try {
      // Vérifier que les données sont présentes
      if (!invoice || !client) {
        throw new Error(
          "Données manquantes pour générer le PDF du devis"
        );
      }

      console.log("Préparation du PDF pour le devis:", invoice.invoiceNumber);

      // Préparer les données du devis pour le PDF
      const quoteData = this.prepareQuoteData(invoice, client, company);

      // Générer un nom de fichier par défaut
      const defaultFileName = `devis_${
        invoice.invoiceNumber || invoice.id
      }_${new Date().toISOString().split("T")[0].replace(/-/g, "")}.pdf`;

      // Si nous sommes dans Electron, utiliser l'API Electron
      if (window.electron) {
        return await window.electron.generatePDF(
          "quote",
          quoteData,
          customPath || defaultFileName
        );
      } else {
        // En mode web, ouvrir une prévisualisation HTML dans une nouvelle fenêtre
        return this.openQuotePreview(quoteData);
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF du devis:", error);
      throw error;
    }
  }

  /**
   * Ouvre une prévisualisation de la facture dans une nouvelle fenêtre (mode web)
   */
  static openInvoicePreview(data) {
    try {
      const htmlContent = this.generateInvoiceHTML(data);

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
   * Ouvre une prévisualisation du devis dans une nouvelle fenêtre (mode web)
   */
  static openQuotePreview(data) {
    try {
      const htmlContent = this.generateQuoteHTML(data);

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
   * Prépare les données de la facture pour le PDF
   */
  static prepareInvoiceData(invoice, client, company) {
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
      if (!amount) return "0,00 €";
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Préparer les données des employés pour le PDF
    const employeesData = invoice.employeesData || [];
    const workLines = [];

    employeesData.forEach(employeeData => {
      const employeeName = `${employeeData.employee?.firstName || ''} ${employeeData.employee?.lastName || ''}`.trim();
      
      // Pour chaque semaine de l'employé
      Object.entries(employeeData.weeklyData || {})
        .filter(([weekKey, weekData]) => weekData && weekData.weekEntries?.length > 0)
        .sort(([weekKeyA], [weekKeyB]) => weekKeyA.localeCompare(weekKeyB))
        .forEach(([weekKey, weekData]) => {
          const weekCalculation = weekData.weekCalculation || {};
          
          // IMPORTANT: Utiliser le billingRate (taux de facturation CLIENT) 
          // Récupérer le billingRate depuis les données de pointage
          const weekEntries = weekData.weekEntries || [];
          
          // Prendre le billingRate de la première entrée de la semaine (devrait être le même pour toutes)
          const clientBillingRate = weekEntries.length > 0 ? 
                                    (weekEntries[0].billingRate || weekEntries[0].billing_rate) : 
                                    weekCalculation.averageBillingRate ||
                                    27.50; // Valeur par défaut basée sur le modèle
                                   
          console.log('DEBUG - clientBillingRate utilisé:', clientBillingRate, 'pour', employeeName);
          
          // Ligne heures normales
          if (weekCalculation.normalHours > 0) {
            workLines.push({
              employeeName,
              weekPeriod: weekKey,
              type: 'HEURE NORMALE',
              hours: weekCalculation.normalHours,
              coefficient: 1.00,
              unitPrice: clientBillingRate,
              amount: weekCalculation.normalHours * clientBillingRate * 1.00
            });
          }
          
          // Ligne heures sup x1.25  
          if (weekCalculation.overtime125 > 0) {
            workLines.push({
              employeeName,
              weekPeriod: weekKey,
              type: 'HEURE SUP 1',
              hours: weekCalculation.overtime125,
              coefficient: 1.25,
              unitPrice: clientBillingRate,
              amount: weekCalculation.overtime125 * clientBillingRate * 1.25
            });
          }
          
          // Ligne heures sup x1.50
          if (weekCalculation.overtime150 > 0) {
            workLines.push({
              employeeName,
              weekPeriod: weekKey,
              type: 'HEURE SUP 2',
              hours: weekCalculation.overtime150,
              coefficient: 1.50,
              unitPrice: clientBillingRate,
              amount: weekCalculation.overtime150 * clientBillingRate * 1.50
            });
          }
        });
    });

    // Si pas de données employées, utiliser les anciennes workPeriods comme fallback
    if (workLines.length === 0 && invoice.workPeriods) {
      invoice.workPeriods.forEach(period => {
        workLines.push({
          employeeName: period.employeeName || 'Employé',
          weekPeriod: `${formatDate(period.startDate)} Au ${formatDate(period.endDate)}`,
          type: 'HEURE NORMALE',
          hours: period.totalHours || 0,
          coefficient: 1.00,
          unitPrice: period.hourlyRate || 0,
          amount: period.amount || 0
        });
      });
    }

    // Si toujours pas de données, créer une ligne par défaut
    if (workLines.length === 0) {
      workLines.push({
        employeeName: 'Aucune donnée disponible',
        weekPeriod: 'N/A',
        type: 'AUCUNE DONNÉE',
        hours: 0,
        coefficient: 1.00,
        unitPrice: 0,
        amount: 0
      });
    }

    // Calculer les totaux basés sur les taux horaires CLIENT
    const subtotalHT = workLines.reduce((sum, line) => sum + line.amount, 0);
    const tvaRate = 0.20; // 20% de TVA
    const tvaAmount = subtotalHT * tvaRate;
    const totalTTC = subtotalHT + tvaAmount;

    // Calculer les totaux d'heures
    const totalHours = workLines.reduce((sum, line) => sum + line.hours, 0);

    return {
      // Informations de base de la facture
      documentType: "FACTURE",
      invoiceNumber: invoice.invoiceNumber || invoice.invoice_number,
      invoiceDate: formatDate(invoice.invoiceDate || invoice.invoice_date),
      dueDate: formatDate(invoice.dueDate || invoice.due_date),
      periodStart: formatDate(invoice.periodStart || invoice.period_start),
      periodEnd: formatDate(invoice.periodEnd || invoice.period_end),
      description: invoice.description || "",
      status: invoice.status || "draft",

      // Informations sur l'entreprise émettrice
      company: {
        name: company?.name || "ATLANTIS",
        address: company?.address || "221 RUE DE LAFAYETTE",
        postalCode: company?.zipCode || "75010",
        city: company?.city || "PARIS",
        siret: company?.siret || "948 396 973 R.C.S. PARIS",
        ape: company?.ape || "7820Z",
        phone: company?.phone || "",
        email: company?.email || "CONTACTATLANTIS75@GMAIL.COM",
        logo: company?.logo || null,
      },

      // Informations sur le client
      client: {
        companyName: (client?.companyName || client?.company_name || "").toUpperCase(),
        contactName: client?.contactName || client?.contact_name || "",
        address: client?.address || "",
        addressComplement: client?.addressComplement || "",
        postalCode: client?.postalCode || client?.postal_code || "",
        city: client?.city || "",
        country: client?.country || "France",
        siret: client?.siret || "",
        email: client?.email || "",
        phone: client?.phone || "",
      },

      // Lignes de facture - compatible avec le template main.js
      workPeriods: workLines.map(line => ({
        employeeName: line.employeeName,
        description: `${line.weekPeriod} - ${line.type}`,
        startDate: '',
        endDate: '',
        location: '',
        quantity: line.hours,
        unit: "heures",
        unitPrice: line.unitPrice,
        amount: line.amount,
        hourlyRate: line.unitPrice,
        totalHours: line.hours,
        formattedUnitPrice: formatCurrency(line.unitPrice),
        formattedAmount: formatCurrency(line.amount),
      })),

      // Lignes de facture - groupées par employé  
      workLines: workLines,
      employeeGroups: this.groupWorkLinesByEmployee(workLines),

      // Totaux
      totals: {
        totalHours,
        subtotalHT,
        tvaRate: tvaRate * 100, // En pourcentage
        tvaAmount,
        totalTTC,
        formattedSubtotalHT: formatCurrency(subtotalHT),
        formattedTvaAmount: formatCurrency(tvaAmount),
        formattedTotalTTC: formatCurrency(totalTTC),
      },

      // Conditions de paiement
      paymentTerms: "30 jours date de facture",
      paymentMethod: "Virement bancaire",

      // Notes
      notes: invoice.notes || "",

      // Métadonnées
      generationDate: formatDate(new Date()),
      year: new Date().getFullYear(),
    };
  }

  /**
   * Groupe les lignes de travail par employé pour l'affichage
   */
  static groupWorkLinesByEmployee(workLines) {
    const groups = {};
    
    workLines.forEach(line => {
      if (!groups[line.employeeName]) {
        groups[line.employeeName] = [];
      }
      groups[line.employeeName].push(line);
    });
    
    return Object.entries(groups).map(([employeeName, lines]) => ({
      employeeName,
      lines
    }));
  }

  /**
   * Prépare les données du devis pour le PDF
   */
  static prepareQuoteData(invoice, client, company) {
    const invoiceData = this.prepareInvoiceData(invoice, client, company);
    
    // Modifier les informations spécifiques au devis
    return {
      ...invoiceData,
      documentType: "DEVIS",
      validityPeriod: "30 jours",
      quoteNumber: invoiceData.invoiceNumber,
      quoteDate: invoiceData.invoiceDate,
    };
  }

  /**
   * Génère le HTML pour la prévisualisation de la facture
   * Format identique au modèle PDF Atlantis
   */
  static generateInvoiceHTML(data) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.documentType} N° ${data.invoiceNumber}</title>
          <style>
              * {
                  box-sizing: border-box;
                  margin: 0;
                  padding: 0;
              }
              
              body {
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  line-height: 1.2;
                  color: #000;
                  background-color: #fff;
                  padding: 20px;
              }
              
              .container {
                  width: 100%;
                  max-width: 210mm;
                  margin: 0 auto;
              }
              
              .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 20px;
              }
              
              .company-info {
                  font-size: 11px;
                  font-weight: bold;
              }
              
              .invoice-info {
                  text-align: right;
                  border: 1px solid #000;
                  padding: 10px;
                  background-color: #f5f5f5;
              }
              
              .client-info {
                  border: 1px solid #000;
                  padding: 10px;
                  margin: 20px 0;
                  background-color: #f5f5f5;
              }
              
              .chantier-info {
                  border: 1px solid #000;
                  padding: 10px;
                  margin: 10px 0;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }
              
              .work-table {
                  width: 100%;
                  border-collapse: collapse;
                  border: 1px solid #000;
                  margin: 20px 0;
              }
              
              .work-table th,
              .work-table td {
                  border: 1px solid #000;
                  padding: 5px;
                  text-align: center;
                  font-size: 9px;
              }
              
              .work-table th {
                  background-color: #f0f0f0;
                  font-weight: bold;
              }
              
              .employee-name {
                  font-weight: bold;
                  background-color: #e8e8e8;
                  text-align: left;
                  padding-left: 10px;
              }
              
              .week-period {
                  text-align: left;
                  padding-left: 15px;
                  font-size: 8px;
              }
              
              .work-type {
                  text-align: left;
                  padding-left: 20px;
              }
              
              .totals-table {
                  float: right;
                  border-collapse: collapse;
                  border: 1px solid #000;
                  margin: 20px 0;
              }
              
              .totals-table td {
                  border: 1px solid #000;
                  padding: 8px 15px;
                  font-size: 10px;
              }
              
              .totals-table .total-label {
                  text-align: left;
                  font-weight: bold;
              }
              
              .totals-table .total-amount {
                  text-align: right;
                  font-weight: bold;
              }
              
              .payment-conditions {
                  clear: both;
                  margin-top: 40px;
                  text-align: center;
                  font-size: 8px;
                  line-height: 1.3;
              }
              
              .footer-text {
                  font-size: 7px;
                  line-height: 1.2;
                  margin-top: 10px;
                  text-align: justify;
              }
              
              @media print {
                  body {
                      padding: 0;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <!-- Header -->
              <div class="header">
                  <div class="company-info">
                      <strong>${data.company.name}</strong><br>
                      ${data.company.address} ${data.company.postalCode} ${data.company.city}<br>
                      ${data.company.siret} - APE : ${data.company.ape}<br>
                      ${data.company.email}
                  </div>
                  <div class="invoice-info">
                      <strong>FACTURE N° ${data.invoiceNumber}</strong>
                  </div>
              </div>

              <!-- Client Info -->
              <div class="client-info">
                  <strong>${data.client.companyName}</strong><br>
                  ${data.client.address}<br>
                  ${data.client.postalCode} ${data.client.city}
              </div>

              <!-- Chantier Info -->
              <div class="chantier-info">
                  <div>
                      <strong>Chantier : ${data.description || 'Non spécifié'}</strong><br>
                      ${data.client.city}
                  </div>
                  <div>
                      <strong>LE ${data.invoiceDate}</strong>
                  </div>
              </div>

              <!-- Work Table -->
              <!-- DEBUG: employeeGroups = ${JSON.stringify(data.employeeGroups)} -->
              <table class="work-table">
                  <thead>
                      <tr>
                          <th style="width: 20%;">Semaine du</th>
                          <th style="width: 25%;">Type</th>
                          <th style="width: 8%;">Unité</th>
                          <th style="width: 8%;">Coéf.</th>
                          <th style="width: 12%;">P.U. H.T</th>
                          <th style="width: 12%;">Montant H.T</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${data.employeeGroups && data.employeeGroups.length > 0 ? data.employeeGroups.map(group => {
                        return `
                          <tr>
                              <td colspan="6" class="employee-name">${group.employeeName}</td>
                          </tr>
                          ${group.lines.map(line => `
                            <tr>
                                <td class="week-period">${line.weekPeriod}</td>
                                <td class="work-type">${line.type}</td>
                                <td style="text-align: right;">${line.hours.toFixed(0)}</td>
                                <td style="text-align: center;">${line.coefficient.toFixed(2)}</td>
                                <td style="text-align: right;">${line.formattedUnitPrice}</td>
                                <td style="text-align: right;">${line.formattedAmount}</td>
                            </tr>
                          `).join('')}
                        `;
                      }).join('') : '<tr><td colspan="6">Aucune donnée disponible</td></tr>'}
                  </tbody>
              </table>

              <!-- Totals -->
              <table class="totals-table">
                  <tr>
                      <td class="total-label">Total H.T (€)</td>
                      <td class="total-amount">${data.totals.formattedSubtotalHT}</td>
                  </tr>
                  <tr>
                      <td class="total-label">TVA (${data.totals.tvaRate.toFixed(2)}%)</td>
                      <td class="total-amount">${data.totals.formattedTvaAmount}</td>
                  </tr>
                  <tr>
                      <td class="total-label">Total T.T.C (€)</td>
                      <td class="total-amount">${data.totals.formattedTotalTTC}</td>
                  </tr>
                  <tr>
                      <td class="total-label">NET À PAYER (€)</td>
                      <td class="total-amount">${data.totals.formattedTotalTTC}</td>
                  </tr>
              </table>

              <!-- Payment Conditions -->
              <div class="payment-conditions">
                  <strong>CONDITIONS DE PAIEMENT : CHÈQUE/VIREMENT ÉCHÉANCE ${data.dueDate}</strong><br>
                  Tous les montants sont en EUROS (€)
              </div>

              <!-- Footer Text -->
              <div class="footer-text">
                  Nos factures sont soumises aux conditions portées sur nos bons d'heures et nos contrats de prestations. 
                  Toutes contestations, quels que soient l'origine des ordres et le mode de règlement sont exclusivement de la compétence 
                  des tribunaux du lieu de E.T.T. L'acceptation des règlements avec l'émission de nos traites ne modifie pas cette clause 
                  attributive de juridiction. Taxe acquittée sur les encaissements.<br><br>
                  
                  En cas de retard de paiement, seront exigibles, conformément à l'article L441-6 du code du commerce, une indemnité 
                  calculée sur la base de trois fois le taux de l'intérêt légal en vigueur ainsi qu'une indemnité forfaitaire pour frais 
                  de recouvrement de 40 euros.
              </div>
          </div>
      </body>
      </html>`;
  }

  /**
   * Génère le HTML pour la prévisualisation du devis
   * Similaire à la facture mais avec des adaptations pour le devis
   */
  static generateQuoteHTML(data) {
    // Remplacer les références à "facture" par "devis" dans le HTML
    const invoiceHTML = this.generateInvoiceHTML(data);
    
    return invoiceHTML
      .replace(/FACTURE/g, 'DEVIS')
      .replace(/facture/g, 'devis')
      .replace(/FACTURÉ À/g, 'DEVIS POUR')
      .replace(/Date d'échéance/g, 'Valable jusqu\'au')
      .replace(/Conditions de paiement/g, 'Conditions du devis')
      .replace(/Paiement à réception de facture/g, 'Devis valable 30 jours')
      .replace(/En cas de retard de paiement/g, 'En cas d\'acceptation du devis');
  }
}

export default InvoicePDFGenerator;