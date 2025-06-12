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

    // Calculer les totaux
    const workPeriods = invoice.workPeriods || [];
    const subtotalHT = workPeriods.reduce((sum, period) => sum + (period.amount || 0), 0);
    const tvaRate = 0.20; // 20% de TVA
    const tvaAmount = subtotalHT * tvaRate;
    const totalTTC = subtotalHT + tvaAmount;

    // Calculer les totaux d'heures
    const totalHours = workPeriods.reduce((sum, period) => sum + (period.totalHours || 0), 0);

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

      // Lignes de facture
      workPeriods: workPeriods.map(period => ({
        description: period.description || "",
        employeeName: period.employeeName || "",
        startDate: formatDate(period.startDate),
        endDate: formatDate(period.endDate),
        location: period.location || "",
        quantity: period.totalHours || 0,
        unit: "heures",
        unitPrice: period.hourlyRate || 0,
        amount: period.amount || 0,
        formattedUnitPrice: formatCurrency(period.hourlyRate || 0),
        formattedAmount: formatCurrency(period.amount || 0),
      })),

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
   * Style Atlantis adapté pour les factures
   */
  static generateInvoiceHTML(data) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.documentType} ${data.invoiceNumber}</title>
          <style>
              :root {
                  --primary: #333333;
                  --secondary: #666666;
                  --light-gray: #f8f9fa;
                  --medium-gray: #dee2e6;
                  --dark-gray: #495057;
                  --text: #212529;
                  --white: #ffffff;
                  --blue: #007bff;
                  --green: #28a745;
                  --success: #d4edda;
                  --border: #e9ecef;
              }
              
              * {
                  box-sizing: border-box;
                  margin: 0;
                  padding: 0;
              }
              
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
                  border: 1px solid var(--border);
                  padding: 20px;
              }
              
              .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 20px;
                  padding-bottom: 15px;
                  border-bottom: 2px solid var(--blue);
              }
              
              .logo-section {
                  flex: 1;
              }
              
              .company-logo {
                  font-weight: 700;
                  font-size: 24px;
                  color: var(--blue);
                  margin-bottom: 5px;
              }
              
              .company-info {
                  font-size: 10px;
                  color: var(--secondary);
                  line-height: 1.3;
              }
              
              .document-info {
                  text-align: right;
                  flex: 1;
              }
              
              .document-title {
                  font-size: 28px;
                  font-weight: 700;
                  color: var(--blue);
                  margin-bottom: 5px;
              }
              
              .document-number {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--primary);
                  margin-bottom: 10px;
              }
              
              .document-dates {
                  font-size: 10px;
                  color: var(--secondary);
              }
              
              .parties-section {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 30px;
                  margin-bottom: 25px;
              }
              
              .party-box {
                  border: 1px solid var(--border);
                  border-radius: 5px;
                  overflow: hidden;
              }
              
              .party-header {
                  background-color: var(--light-gray);
                  padding: 8px 12px;
                  font-weight: 600;
                  font-size: 12px;
                  color: var(--primary);
                  border-bottom: 1px solid var(--border);
              }
              
              .party-content {
                  padding: 12px;
              }
              
              .party-name {
                  font-weight: 600;
                  font-size: 12px;
                  color: var(--primary);
                  margin-bottom: 5px;
              }
              
              .party-details {
                  font-size: 10px;
                  color: var(--secondary);
                  line-height: 1.4;
              }
              
              .invoice-details {
                  background-color: var(--light-gray);
                  border: 1px solid var(--border);
                  border-radius: 5px;
                  padding: 15px;
                  margin-bottom: 25px;
              }
              
              .details-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
              }
              
              .detail-item {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }
              
              .detail-label {
                  font-weight: 600;
                  color: var(--secondary);
                  font-size: 10px;
              }
              
              .detail-value {
                  font-weight: 600;
                  color: var(--primary);
                  font-size: 11px;
              }
              
              .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                  border: 1px solid var(--border);
                  border-radius: 5px;
                  overflow: hidden;
              }
              
              .items-table th {
                  background-color: var(--dark-gray);
                  color: var(--white);
                  padding: 10px 8px;
                  text-align: left;
                  font-weight: 600;
                  font-size: 10px;
                  text-transform: uppercase;
              }
              
              .items-table td {
                  padding: 8px;
                  border-bottom: 1px solid var(--border);
                  font-size: 10px;
                  vertical-align: top;
              }
              
              .items-table tr:nth-child(even) {
                  background-color: var(--light-gray);
              }
              
              .items-table tr:last-child td {
                  border-bottom: none;
              }
              
              .text-right {
                  text-align: right;
              }
              
              .text-center {
                  text-align: center;
              }
              
              .font-medium {
                  font-weight: 600;
              }
              
              .totals-section {
                  display: flex;
                  justify-content: flex-end;
                  margin-bottom: 25px;
              }
              
              .totals-table {
                  width: 300px;
                  border-collapse: collapse;
                  border: 1px solid var(--border);
                  border-radius: 5px;
                  overflow: hidden;
              }
              
              .totals-table td {
                  padding: 8px 12px;
                  border-bottom: 1px solid var(--border);
                  font-size: 11px;
              }
              
              .totals-table tr:last-child td {
                  border-bottom: none;
                  background-color: var(--success);
                  font-weight: 700;
                  font-size: 12px;
              }
              
              .payment-conditions {
                  background-color: var(--light-gray);
                  border: 1px solid var(--border);
                  border-radius: 5px;
                  padding: 15px;
                  margin-bottom: 20px;
              }
              
              .conditions-title {
                  font-weight: 600;
                  font-size: 12px;
                  color: var(--primary);
                  margin-bottom: 8px;
              }
              
              .conditions-text {
                  font-size: 10px;
                  color: var(--secondary);
                  line-height: 1.4;
              }
              
              .notes-section {
                  margin-bottom: 20px;
              }
              
              .notes-title {
                  font-weight: 600;
                  font-size: 12px;
                  color: var(--primary);
                  margin-bottom: 8px;
              }
              
              .notes-content {
                  font-size: 10px;
                  color: var(--secondary);
                  line-height: 1.4;
                  padding: 10px;
                  background-color: var(--light-gray);
                  border-radius: 3px;
              }
              
              .footer {
                  text-align: center;
                  font-size: 8px;
                  color: var(--secondary);
                  padding-top: 15px;
                  border-top: 1px solid var(--border);
              }
              
              .status-badge {
                  display: inline-block;
                  padding: 3px 8px;
                  border-radius: 12px;
                  font-size: 9px;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              
              .status-draft {
                  background-color: #f8f9fa;
                  color: #6c757d;
              }
              
              .status-sent {
                  background-color: #cce5ff;
                  color: #0066cc;
              }
              
              .status-paid {
                  background-color: #d4edda;
                  color: #155724;
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
                      padding: 15px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <!-- Header -->
              <div class="header">
                  <div class="logo-section">
                      <div class="company-logo">${data.company.name}</div>
                      <div class="company-info">
                          ${data.company.address}<br>
                          ${data.company.postalCode} ${data.company.city}<br>
                          ${data.company.email}<br>
                          SIRET: ${data.company.siret} - APE: ${data.company.ape}
                      </div>
                  </div>
                  <div class="document-info">
                      <div class="document-title">${data.documentType}</div>
                      <div class="document-number">N° ${data.invoiceNumber}</div>
                      <div class="document-dates">
                          Date: ${data.invoiceDate}<br>
                          Échéance: ${data.dueDate}
                      </div>
                  </div>
              </div>

              <!-- Parties -->
              <div class="parties-section">
                  <div class="party-box">
                      <div class="party-header">VENDEUR</div>
                      <div class="party-content">
                          <div class="party-name">${data.company.name}</div>
                          <div class="party-details">
                              ${data.company.address}<br>
                              ${data.company.postalCode} ${data.company.city}<br>
                              ${data.company.phone ? `Tél: ${data.company.phone}<br>` : ''}
                              Email: ${data.company.email}<br>
                              SIRET: ${data.company.siret}
                          </div>
                      </div>
                  </div>
                  
                  <div class="party-box">
                      <div class="party-header">FACTURÉ À</div>
                      <div class="party-content">
                          <div class="party-name">${data.client.companyName}</div>
                          <div class="party-details">
                              ${data.client.contactName ? `${data.client.contactName}<br>` : ''}
                              ${data.client.address}<br>
                              ${data.client.addressComplement ? `${data.client.addressComplement}<br>` : ''}
                              ${data.client.postalCode} ${data.client.city}<br>
                              ${data.client.country !== 'France' ? `${data.client.country}<br>` : ''}
                              ${data.client.siret ? `SIRET: ${data.client.siret}<br>` : ''}
                              ${data.client.email ? `Email: ${data.client.email}` : ''}
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Détails de la facture -->
              <div class="invoice-details">
                  <div class="details-grid">
                      <div class="detail-item">
                          <span class="detail-label">Période de facturation:</span>
                          <span class="detail-value">${data.periodStart} - ${data.periodEnd}</span>
                      </div>
                      <div class="detail-item">
                          <span class="detail-label">Total heures:</span>
                          <span class="detail-value">${data.totals.totalHours}h</span>
                      </div>
                      <div class="detail-item">
                          <span class="detail-label">Conditions de paiement:</span>
                          <span class="detail-value">${data.paymentTerms}</span>
                      </div>
                      <div class="detail-item">
                          <span class="detail-label">Mode de paiement:</span>
                          <span class="detail-value">${data.paymentMethod}</span>
                      </div>
                  </div>
              </div>

              <!-- Tableau des prestations -->
              <table class="items-table">
                  <thead>
                      <tr>
                          <th style="width: 40%;">Prestation</th>
                          <th style="width: 15%;">Période</th>
                          <th style="width: 10%;" class="text-center">Qté</th>
                          <th style="width: 10%;" class="text-center">Unité</th>
                          <th style="width: 12%;" class="text-right">Prix unit.</th>
                          <th style="width: 13%;" class="text-right">Montant</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${data.workPeriods.map(period => `
                          <tr>
                              <td>
                                  <div class="font-medium">${period.description}</div>
                                  <div style="font-size: 9px; color: var(--secondary); margin-top: 2px;">
                                      ${period.employeeName}${period.location ? ` • ${period.location}` : ''}
                                  </div>
                              </td>
                              <td style="font-size: 9px;">
                                  ${period.startDate}<br>
                                  ${period.endDate}
                              </td>
                              <td class="text-center font-medium">${period.quantity}</td>
                              <td class="text-center">${period.unit}</td>
                              <td class="text-right">${period.formattedUnitPrice}</td>
                              <td class="text-right font-medium">${period.formattedAmount}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>

              <!-- Totaux -->
              <div class="totals-section">
                  <table class="totals-table">
                      <tr>
                          <td>Sous-total HT</td>
                          <td class="text-right font-medium">${data.totals.formattedSubtotalHT}</td>
                      </tr>
                      <tr>
                          <td>TVA (${data.totals.tvaRate}%)</td>
                          <td class="text-right font-medium">${data.totals.formattedTvaAmount}</td>
                      </tr>
                      <tr>
                          <td>TOTAL TTC</td>
                          <td class="text-right">${data.totals.formattedTotalTTC}</td>
                      </tr>
                  </table>
              </div>

              <!-- Conditions de paiement -->
              <div class="payment-conditions">
                  <div class="conditions-title">Conditions de paiement</div>
                  <div class="conditions-text">
                      Paiement à réception de facture par ${data.paymentMethod.toLowerCase()}.<br>
                      Délai de paiement : ${data.paymentTerms}.<br>
                      En cas de retard de paiement, des pénalités de 3 fois le taux de l'intérêt légal seront appliquées.
                  </div>
              </div>

              <!-- Notes -->
              ${data.notes ? `
                  <div class="notes-section">
                      <div class="notes-title">Notes</div>
                      <div class="notes-content">${data.notes}</div>
                  </div>
              ` : ''}

              <!-- Footer -->
              <div class="footer">
                  ${data.company.name} - ${data.company.address}, ${data.company.postalCode} ${data.company.city}<br>
                  SIRET: ${data.company.siret} - APE: ${data.company.ape}<br>
                  Document généré le ${data.generationDate}
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