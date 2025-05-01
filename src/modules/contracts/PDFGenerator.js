import PDFService from '../../services/PDFService';

class PDFGenerator {
  // Générer un PDF de contrat
  static async generateContractPDF(contract, employee, client) {
    try {
      // Vérifier que toutes les données nécessaires sont présentes
      if (!contract || !employee || !client) {
        throw new Error('Données manquantes pour générer le PDF du contrat');
      }
      
      // Dans une vraie application, nous utiliserions PDFKit pour créer le document
      // avec une mise en page professionnelle, logos, etc.
      
      console.log('Génération du PDF pour le contrat:', contract.id);
      
      // Appeler le service PDF pour générer le document
      return await PDFService.generateContractPDF(contract, employee, client);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF du contrat:', error);
      throw error;
    }
  }

  // Générer un certificat de mission
  static async generateMissionCertificatePDF(contract, employee, client) {
    try {
      // Vérifier que toutes les données nécessaires sont présentes
      if (!contract || !employee || !client) {
        throw new Error('Données manquantes pour générer le certificat de mission');
      }
      
      console.log('Génération du certificat pour le contrat:', contract.id);
      
      // Appeler le service PDF pour générer le document
      return await PDFService.generateMissionCertificatePDF(contract, employee, client);
    } catch (error) {
      console.error('Erreur lors de la génération du certificat de mission:', error);
      throw error;
    }
  }

  // Créer un aperçu du PDF du contrat
  static async createContractPreview(contract, employee, client) {
    try {
      // Dans une vraie application, nous générerions une image d'aperçu du PDF
      
      // Pour le moment, simuler un aperçu
      return {
        previewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'aperçu du contrat:', error);
      throw error;
    }
  }

  // Construire le contenu du PDF du contrat
  static buildContractContent(contract, employee, client) {
    // Cette fonction simule la construction du contenu du PDF
    // Dans une vraie application, nous utiliserions PDFKit pour créer des sections,
    // des paragraphes, des tableaux, etc.
    
    // Exemple de structure du contenu
    return {
      title: `CONTRAT DE MISSION - ${contract.reference || `CONT-${contract.id}`}`,
      sections: [
        {
          title: 'PARTIES',
          content: [
            {
              subtitle: 'Entreprise de portage',
              text: 'Notre Entreprise, représentée par [Nom du représentant]'
            },
            {
              subtitle: 'Consultant',
              text: `${employee.firstname} ${employee.lastname}, résidant au ${employee.address}`
            },
            {
              subtitle: 'Client',
              text: `${client.company_name}, SIRET: ${client.siret}, représenté par ${client.contact_name || '[Contact client]'}`
            }
          ]
        },
        {
          title: 'OBJET DE LA MISSION',
          content: [
            {
              text: contract.title
            },
            {
              text: contract.description || 'Aucune description fournie'
            }
          ]
        },
        {
          title: 'DURÉE DE LA MISSION',
          content: [
            {
              text: `Début : ${new Date(contract.start_date).toLocaleDateString('fr-FR')}`
            },
            {
              text: contract.end_date 
                ? `Fin : ${new Date(contract.end_date).toLocaleDateString('fr-FR')}` 
                : 'Durée indéterminée'
            }
          ]
        },
        {
          title: 'LIEU DE LA MISSION',
          content: [
            {
              text: contract.location || 'Non spécifié'
            }
          ]
        },
        {
          title: 'CONDITIONS FINANCIÈRES',
          content: [
            {
              text: `Taux horaire consultant : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.hourly_rate)} / heure`
            },
            {
              text: `Taux horaire client : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.billing_rate)} / heure`
            },
            {
              text: `Modalités de paiement : [À définir]`
            }
          ]
        },
        {
          title: 'SIGNATURES',
          content: [
            {
              text: 'Fait à [Lieu], le [Date]'
            },
            {
              text: 'Pour l\'entreprise :'
            },
            {
              text: 'Le consultant :'
            },
            {
              text: 'Le client :'
            }
          ]
        }
      ]
    };
  }

  // Construire le contenu du certificat de mission
  static buildCertificateContent(contract, employee, client) {
    // Cette fonction simule la construction du contenu du certificat
    
    // Calculer la durée de la mission
    let duration = '';
    if (contract.start_date && contract.end_date) {
      const startDate = new Date(contract.start_date);
      const endDate = new Date(contract.end_date);
      const differenceInTime = endDate.getTime() - startDate.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
      
      // Convertir en mois/jours
      const months = Math.floor(differenceInDays / 30);
      const days = differenceInDays % 30;
      
      if (months > 0) {
        duration += `${months} mois`;
      }
      
      if (days > 0) {
        duration += months > 0 ? ` et ${days} jours` : `${days} jours`;
      }
    } else {
      duration = 'Durée indéterminée';
    }
    
    // Exemple de structure du contenu
    return {
      title: 'CERTIFICAT DE RÉALISATION DE MISSION',
      sections: [
        {
          title: 'ATTESTATION',
          content: [
            {
              text: `Je soussigné, [Nom du signataire], représentant la société ${client.company_name}, certifie que :`
            }
          ]
        },
        {
          title: 'CONSULTANT',
          content: [
            {
              text: `${employee.firstname} ${employee.lastname}`
            }
          ]
        },
        {
          title: 'A RÉALISÉ LA MISSION SUIVANTE',
          content: [
            {
              subtitle: 'Intitulé',
              text: contract.title
            },
            {
              subtitle: 'Description',
              text: contract.description || 'Aucune description fournie'
            },
            {
              subtitle: 'Période',
              text: `Du ${new Date(contract.start_date).toLocaleDateString('fr-FR')}${
                contract.end_date ? ` au ${new Date(contract.end_date).toLocaleDateString('fr-FR')}` : ''
              }`
            },
            {
              subtitle: 'Durée',
              text: duration
            },
            {
              subtitle: 'Lieu',
              text: contract.location || 'Non spécifié'
            }
          ]
        },
        {
          title: 'COMPÉTENCES MISES EN ŒUVRE',
          content: [
            {
              text: employee.skills || 'Non spécifiées'
            }
          ]
        },
        {
          title: 'SIGNATURE',
          content: [
            {
              text: `Fait à [Lieu], le ${new Date().toLocaleDateString('fr-FR')}`
            },
            {
              text: 'Signature et cachet :'
            }
          ]
        }
      ]
    };
  }
}

export default PDFGenerator;