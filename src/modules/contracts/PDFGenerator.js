// src/modules/contracts/PDFGenerator.js pour le web

/**
 * Classe pour la génération de documents PDF de contrats et certificats
 */
class PDFGenerator {
    /**
     * Génère un PDF de contrat 
     * @param {Object} contract - Les données du contrat
     * @param {Object} employee - Les données de l'employé
     * @param {Object} client - Les données du client
     * @param {String} customPath - Chemin personnalisé pour enregistrer le PDF (optionnel)
     * @returns {Promise<Object>} Résultat de la génération
     */
    static async generateContractPDF(contract, employee, client, customPath = null) {
      try {
        // Vérifier que les données sont présentes
        if (!contract || !employee || !client) {
          throw new Error('Données manquantes pour générer le PDF du contrat');
        }
        
        console.log('Préparation du PDF pour le contrat:', contract.id);
        
        // Préparer les données du contrat pour le PDF
        const contractData = this.prepareContractData(contract, employee, client);
        
        // Générer un nom de fichier par défaut si aucun chemin personnalisé n'est fourni
        const defaultFileName = `contrat_${contract.reference || contract.id}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.pdf`;
        
        // Si nous sommes dans Electron, utiliser l'API Electron
        if (window.electron) {
          return await window.electron.generatePDF('contract', contractData, customPath || defaultFileName);
        } else {
          // En mode web, ouvrir une prévisualisation HTML dans une nouvelle fenêtre
          return this.openContractPreview(contract, employee, client);
        }
      } catch (error) {
        console.error('Erreur lors de la génération du PDF du contrat:', error);
        throw error;
      }
    }
    
    /**
     * Ouvre une prévisualisation du contrat dans une nouvelle fenêtre (mode web)
     */
    static openContractPreview(contract, employee, client) {
      try {
        const data = this.prepareContractData(contract, employee, client);
        const htmlContent = this.generateContractHTML(data);
        
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          return { success: true, previewOpened: true };
        } else {
          throw new Error('Impossible d\'ouvrir la prévisualisation. Vérifiez les bloqueurs de popups.');
        }
      } catch (error) {
        console.error('Erreur lors de l\'ouverture de la prévisualisation:', error);
        throw error;
      }
    }
    
    /**
     * Prépare les données du contrat pour le PDF
     */
    static prepareContractData(contract, employee, client) {
      // Formatage des dates
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };
      
      // Formatage des montants
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(amount);
      };
      
      // Calculer la durée du contrat
      let duration = '';
      if (contract.start_date && contract.end_date) {
        const startDate = new Date(contract.start_date);
        const endDate = new Date(contract.end_date);
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
        duration = 'Durée indéterminée';
      }
      
      // Adresse complète de l'employé
      const employeeAddress = [
        employee.address,
        employee.postal_code,
        employee.city,
        employee.country
      ].filter(Boolean).join(', ');
      
      // Adresse complète du client
      const clientAddress = [
        client.address,
        client.postal_code,
        client.city,
        client.country
      ].filter(Boolean).join(', ');
      
      // Retourner les données structurées pour le PDF
      return {
        // Informations de base du contrat
        reference: contract.reference || `CONT-${contract.id}`,
        title: contract.title,
        description: contract.description || 'Aucune description fournie',
        startDate: formatDate(contract.start_date),
        endDate: contract.end_date ? formatDate(contract.end_date) : 'Durée indéterminée',
        duration: duration,
        location: contract.location || 'Non spécifié',
        workingHours: contract.working_hours || 'Non spécifié',
        status: contract.status,
        
        // Informations financières
        hourlyRate: formatCurrency(contract.hourly_rate),
        billingRate: formatCurrency(contract.billing_rate),
        
        // Informations sur l'employé
        employee: {
          id: employee.id,
          firstName: employee.firstname,
          lastName: employee.lastname,
          fullName: `${employee.firstname} ${employee.lastname}`,
          address: employeeAddress,
          email: employee.email || 'Non spécifié',
          phone: employee.phone || 'Non spécifié',
          skills: employee.skills || 'Non spécifié'
        },
        
        // Informations sur le client
        client: {
          id: client.id,
          companyName: client.company_name,
          contactName: client.contact_name || 'Non spécifié',
          address: clientAddress,
          siret: client.siret || 'Non spécifié',
          email: client.email || 'Non spécifié',
          phone: client.phone || 'Non spécifié'
        },
        
        // Métadonnées
        generationDate: formatDate(new Date()),
        year: new Date().getFullYear().toString()
      };
    }
    
    /**
     * Génère le HTML pour la prévisualisation du contrat
     */
    static generateContractHTML(data) {
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
            margin: 0 auto;
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
              <p class="reference">Réf: ${data.reference}</p>
              <p>Date: ${data.generationDate}</p>
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
                <p>${data.employee.fullName}<br>
                  ${data.employee.address}<br>
                  Email: ${data.employee.email}<br>
                  Tél: ${data.employee.phone}</p>
              </div>
              
              <div class="party-box">
                <div class="party-title">CLIENT</div>
                <p>${data.client.companyName}<br>
                  ${data.client.address}<br>
                  SIRET: ${data.client.siret}<br>
                  Contact: ${data.client.contactName}</p>
              </div>
            </div>
          </div>
  
          <!-- Objet de la mission -->
          <h2>OBJET DE LA MISSION</h2>
          <div class="section">
            <h3 style="color: #333; margin-bottom: 10px; font-size: 12pt;">${data.title}</h3>
            <p>${data.description}</p>
          </div>
  
          <!-- Durée de la mission -->
          <h2>DURÉE DE LA MISSION</h2>
          <div class="section">
            <p><strong>Début:</strong> ${data.startDate}</p>
            <p><strong>Fin:</strong> ${data.endDate}</p>
            <p><strong>Durée:</strong> ${data.duration}</p>
          </div>
  
          <!-- Lieu et horaires -->
          <h2>LIEU ET HORAIRES</h2>
          <div class="section">
            <p><strong>Lieu d'exécution:</strong> ${data.location}</p>
            <p><strong>Horaires de travail:</strong> ${data.workingHours}</p>
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
                  <td style="text-align: right;">${data.hourlyRate}</td>
                </tr>
                <tr>
                  <td>Taux horaire facturation client</td>
                  <td style="text-align: right;">${data.billingRate}</td>
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
            <p>Document généré par Contrat Manager © ${data.year} - Ce document a valeur contractuelle</p>
          </div>
          
          <div class="page-number">Page 1/1</div>
        </div>
      </body>
      </html>`;
    }
  }
  
  export default PDFGenerator;