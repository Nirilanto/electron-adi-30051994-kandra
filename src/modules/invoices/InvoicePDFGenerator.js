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

      // Préparer les données de la facture pour le PDF
      const invoiceData = this.prepareInvoiceData(invoice, client, company);

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
          // Le billingRate est calculé et stocké dans weekCalculation, pas dans les weekEntries individuelles
          const clientBillingRate = weekCalculation.averageBillingRate || 
                                   weekCalculation.averageHourlyRate ||
                                   27.50; // Valeur par défaut basée sur le modèle
          
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
   * Groupe les lignes de travail par employé pour l'affichage avec tri chronologique et weekGroups
   */
  static groupWorkLinesByEmployee(workLines) {
    // Fonction locale pour formater les montants
    const formatCurrency = (amount) => {
      if (!amount) return "0,00 €";
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Fonction pour convertir une période de semaine en date pour le tri
    const getWeekStartDate = (weekPeriod) => {
      // Format attendu: "08/09/2025 Au 14/09/2025" ou "08/09/2025-14/09/2025"
      const match = weekPeriod.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) {
        const [day, month, year] = match[1].split('/');
        return new Date(year, month - 1, day);
      }
      return new Date(0); // Fallback
    };

    const groups = {};
    
    workLines.forEach(line => {
      if (!groups[line.employeeName]) {
        groups[line.employeeName] = [];
      }
      
      // Ajouter les versions formatées pour le template Handlebars
      const lineWithFormatting = {
        ...line,
        formattedUnitPrice: formatCurrency(line.unitPrice),
        formattedAmount: formatCurrency(line.amount),
        weekStartDate: getWeekStartDate(line.weekPeriod) // Pour le tri
      };
      
      groups[line.employeeName].push(lineWithFormatting);
    });
    
    return Object.entries(groups).map(([employeeName, lines]) => {
      // Trier les lignes par date de début de semaine
      const sortedLines = lines.sort((a, b) => a.weekStartDate - b.weekStartDate);
      
      // Grouper par semaine pour créer les weekGroups avec rowspan
      const weekGroups = {};
      sortedLines.forEach(line => {
        if (!weekGroups[line.weekPeriod]) {
          weekGroups[line.weekPeriod] = [];
        }
        weekGroups[line.weekPeriod].push(line);
      });
      
      // Convertir weekGroups en array trié par date
      const sortedWeekGroups = Object.entries(weekGroups)
        .sort(([weekA], [weekB]) => getWeekStartDate(weekA) - getWeekStartDate(weekB))
        .map(([weekPeriod, weekLines]) => ({
          weekPeriod,
          lines: weekLines.sort((a, b) => {
            // Trier par type d'heure : NORMALE, SUP 1, SUP 2
            const typeOrder = { 'HEURE NORMALE': 1, 'HEURE SUP 1': 2, 'HEURE SUP 2': 3 };
            return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
          })
        }));

      return {
        employeeName,
        lines: sortedLines, // Garde l'ancien format pour compatibilité
        weekGroups: sortedWeekGroups // Nouveau format avec groupement par semaine
      };
    });
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
    <title>Facture ${data.company.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .company-details {
            font-size: 11px;
            line-height: 1.6;
        }
        
        .invoice-number {
            text-align: right;
            font-size: 18px;
            font-weight: bold;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 7px 0;
            font-size: 11px;
        }
        
        .items-table th {
            background: #f8f9fa;
            color: #333;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #dee2e6;
        }
        
        .items-table td {
            padding: 5px;
            border: 1px solid #dee2e6;
            vertical-align: top;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .employee-group {
            background: #fff3cd;
            font-weight: bold;
        }
        
        .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .totals {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 8px 12px;
            border: 1px solid #dee2e6;
        }
        
        .totals-table .label {
            background: #f8f9fa;
            font-weight: bold;
        }
        
        .totals-table .total-final {
            background: #e9ecef;
            color: #333;
            font-weight: bold;
            font-size: 14px;
        }
        
        .items-table td[rowspan] {
            vertical-align: middle;
            border-right: 2px solid #333;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 10px;
            color: #6c757d;
            line-height: 1.6;
        }
        
        .payment-conditions {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-weight: bold;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- En-tête -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">${data.company.name}</div>
                <div class="company-details">
                    ${data.company.address} ${data.company.postalCode} ${data.company.city}<br>
                    ${data.company.siret} - APE : ${data.company.ape}<br>
                    ${data.company.email}
                </div>
            </div>
            <div class="invoice-number">
                FACTURE N°
                <span style="font-size: 32px; color: #007bff;">${data.invoiceNumber}</span><br>
                <div style="font-size: 14px; border: 2px solid #333; padding: 5px;">
                    <strong>${data.client.companyName}</strong><br>
                    ${data.client.address}<br>
                    ${data.client.postalCode} ${data.client.city}
                </div>
            </div>
        </div>
        
        <!-- Informations projet -->
        <div style="border: 2px solid #666; padding: 7px; margin: 7px 0; background: #f1f3f4;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="font-size: 14px;">Chantier : ${data.description || 'Non spécifié'}</strong><br>
                    <span style="color: #555; margin-top: 5px; display: inline-block;">${data.client.city}</span>
                </div>
                <div style="text-align: right;">
                    <strong style="font-size: 14px;">LE ${data.invoiceDate}</strong>
                </div>
            </div>
        </div>
        
        <!-- Tableau des prestations -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Semaine du</th>
                    <th>Type</th>
                    <th>Unité</th>
                    <th>Coéf.</th>
                    <th>P.U. H.T</th>
                    <th>Montant H.T</th>
                </tr>
            </thead>
            <tbody>
                ${data.employeeGroups && data.employeeGroups.length > 0 ? 
                  data.employeeGroups.map((group, groupIndex) => {
                    let html = `<tr class="employee-group">
                        <td colspan="6">${group.employeeName}</td>
                    </tr>`;
                    
                    // Grouper les lignes par semaine pour utiliser rowspan
                    const weekGroups = {};
                    group.lines.forEach(line => {
                      if (!weekGroups[line.weekPeriod]) {
                        weekGroups[line.weekPeriod] = [];
                      }
                      weekGroups[line.weekPeriod].push(line);
                    });
                    
                    Object.entries(weekGroups).forEach(([weekPeriod, weekLines]) => {
                      weekLines.forEach((line, lineIndex) => {
                        html += `<tr>`;
                        if (lineIndex === 0 && weekLines.length > 1) {
                          html += `<td rowspan="${weekLines.length}">${weekPeriod}</td>`;
                        } else if (weekLines.length === 1) {
                          html += `<td>${weekPeriod}</td>`;
                        }
                        html += `
                            <td>${line.type}</td>
                            <td>${Math.round(line.hours)}</td>
                            <td>${line.coefficient.toFixed(2)}</td>
                            <td class="amount">${line.formattedUnitPrice}</td>
                            <td class="amount">${line.formattedAmount}</td>
                        </tr>`;
                      });
                    });
                    
                    // Ajouter séparateur entre employés (sauf le dernier)
                    if (groupIndex < data.employeeGroups.length - 1) {
                      html += `<tr><td colspan="6" style="border: none;"></td></tr>`;
                    }
                    
                    return html;
                  }).join('')
                  : '<tr><td colspan="6">Aucune donnée disponible</td></tr>'
                }
            </tbody>
        </table>
        
        <!-- Totaux -->
        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td class="label">Total H.T (€)</td>
                    <td class="amount">${data.totals.formattedSubtotalHT}</td>
                </tr>
                <tr>
                    <td class="label">TVA (${data.totals.tvaRate.toFixed(2)}%)</td>
                    <td class="amount">${data.totals.formattedTvaAmount}</td>
                </tr>
                <tr>
                    <td class="label">Total T.T.C (€)</td>
                    <td class="amount">${data.totals.formattedTotalTTC}</td>
                </tr>
                <tr class="total-final">
                    <td>NET À PAYER (€)</td>
                    <td class="amount">${data.totals.formattedTotalTTC}</td>
                </tr>
            </table>
        </div>
        
        <!-- Conditions de paiement -->
        <div class="payment-conditions">
            CONDITIONS DE PAIEMENT : CHÈQUE/VIREMENT ÉCHÉANCE ${data.dueDate}
        </div>
        
        <!-- Pied de page -->
        <div class="footer">
            <p><strong>Tous les montants sont en EUROS (€)</strong></p>
            
            <p style="margin-top: 15px;">
                Nos factures sont soumises aux conditions portées sur nos bons d'heures et nos contrats de prestations. 
                Toutes contestations, quels que soient l'origine des ordres et le mode de règlement sont exclusivement 
                de la compétence des tribunaux du lieu de E.T.T. L'acceptation des règlements avec l'émission de nos 
                traites ne modifie pas cette clause attributive de juridiction. Taxe acquittée sur les encaissements.
            </p>
            
            <p style="margin-top: 15px;">
                En cas de retard de paiement, seront exigibles, conformément à l'article L441-6 du code du commerce, 
                une indemnité calculée sur la base de trois fois le taux de l'intérêt légal en vigueur ainsi qu'une 
                indemnité forfaitaire pour frais de recouvrement de 40 euros.
            </p>
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