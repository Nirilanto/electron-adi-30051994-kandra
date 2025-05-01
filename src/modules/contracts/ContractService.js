import DatabaseService from '../../services/DatabaseService';
import PDFService from '../../services/PDFService';

class ContractService {
  // Obtenir tous les contrats
  async getAllContracts(filters = {}) {
    try {
      return await DatabaseService.getContracts(filters);
    } catch (error) {
      console.error('Erreur dans ContractService.getAllContracts:', error);
      throw error;
    }
  }

  // Obtenir un contrat par son ID
  async getContractById(id) {
    try {
      return await DatabaseService.getContractById(id);
    } catch (error) {
      console.error(`Erreur dans ContractService.getContractById(${id}):`, error);
      throw error;
    }
  }

  // Créer un nouveau contrat
  async createContract(contractData) {
    try {
      // Générer une référence si elle n'est pas fournie
      if (!contractData.reference) {
        contractData.reference = await this.generateContractReference();
      }
      
      return await DatabaseService.createContract(contractData);
    } catch (error) {
      console.error('Erreur dans ContractService.createContract:', error);
      throw error;
    }
  }

  // Mettre à jour un contrat
  async updateContract(id, contractData) {
    try {
      return await DatabaseService.updateContract(id, contractData);
    } catch (error) {
      console.error(`Erreur dans ContractService.updateContract(${id}):`, error);
      throw error;
    }
  }

  // Supprimer un contrat
  async deleteContract(id) {
    try {
      return await DatabaseService.deleteContract(id);
    } catch (error) {
      console.error(`Erreur dans ContractService.deleteContract(${id}):`, error);
      throw error;
    }
  }

  // Rechercher des contrats
  async searchContracts(searchTerm, status = 'all') {
    try {
      const contracts = await DatabaseService.getContracts();
      
      // Filtrer les contrats en fonction du terme de recherche et du statut
      return contracts.filter(contract => {
        // Vérifier si le titre, la référence, l'employé ou le client correspond au terme de recherche
        const matchesTerm = 
          searchTerm === '' ||
          (contract.title && contract.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.reference && contract.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.employee_firstname && contract.employee_firstname.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.employee_lastname && contract.employee_lastname.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.client_company && contract.client_company.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Vérifier si le statut correspond
        const matchesStatus = 
          status === 'all' || 
          contract.status === status;
        
        return matchesTerm && matchesStatus;
      });
    } catch (error) {
      console.error('Erreur dans ContractService.searchContracts:', error);
      throw error;
    }
  }

  // Générer une référence de contrat
  async generateContractReference() {
    try {
      // Récupérer le nombre de contrats pour générer un numéro séquentiel
      const contracts = await DatabaseService.getContracts();
      const nextNumber = contracts.length + 1;
      
      // Format: CONT-ANNÉE-NUMÉRO (ex: CONT-2023-001)
      const year = new Date().getFullYear();
      const paddedNumber = nextNumber.toString().padStart(3, '0');
      
      return `CONT-${year}-${paddedNumber}`;
    } catch (error) {
      console.error('Erreur dans ContractService.generateContractReference:', error);
      // En cas d'erreur, utiliser un timestamp comme référence de secours
      const timestamp = Date.now();
      return `CONT-${timestamp}`;
    }
  }

  // Valider les données d'un contrat
  validateContractData(data) {
    const errors = {};
    
    // Vérifier les champs obligatoires
    if (!data.employee_id) {
      errors.employee_id = 'L\'employé est obligatoire';
    }
    
    if (!data.client_id) {
      errors.client_id = 'Le client est obligatoire';
    }
    
    if (!data.title || data.title.trim() === '') {
      errors.title = 'Le titre du contrat est obligatoire';
    }
    
    if (!data.start_date) {
      errors.start_date = 'La date de début est obligatoire';
    }
    
    // Valider les taux
    if (!data.hourly_rate) {
      errors.hourly_rate = 'Le taux horaire est obligatoire';
    } else if (isNaN(parseFloat(data.hourly_rate)) || parseFloat(data.hourly_rate) <= 0) {
      errors.hourly_rate = 'Le taux horaire doit être un nombre positif';
    }
    
    if (!data.billing_rate) {
      errors.billing_rate = 'Le taux de facturation est obligatoire';
    } else if (isNaN(parseFloat(data.billing_rate)) || parseFloat(data.billing_rate) <= 0) {
      errors.billing_rate = 'Le taux de facturation doit être un nombre positif';
    }
    
    // Vérifier la cohérence des dates
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (endDate < startDate) {
        errors.end_date = 'La date de fin doit être postérieure à la date de début';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Générer un PDF de contrat
  async generateContractPDF(contractId) {
    try {
      // Récupérer les informations nécessaires
      const contract = await this.getContractById(contractId);
      const employee = await DatabaseService.getEmployeeById(contract.employee_id);
      const client = await DatabaseService.getClientById(contract.client_id);
      
      // Générer le PDF
      return await PDFService.generateContractPDF(contract, employee, client);
    } catch (error) {
      console.error(`Erreur dans ContractService.generateContractPDF(${contractId}):`, error);
      throw error;
    }
  }

  // Générer un certificat de mission
  async generateMissionCertificatePDF(contractId) {
    try {
      // Récupérer les informations nécessaires
      const contract = await this.getContractById(contractId);
      const employee = await DatabaseService.getEmployeeById(contract.employee_id);
      const client = await DatabaseService.getClientById(contract.client_id);
      
      // Générer le certificat
      return await PDFService.generateMissionCertificatePDF(contract, employee, client);
    } catch (error) {
      console.error(`Erreur dans ContractService.generateMissionCertificatePDF(${contractId}):`, error);
      throw error;
    }
  }

  // Calculer la durée d'un contrat en jours
  calculateContractDuration(contract) {
    if (!contract.start_date) return null;
    
    const startDate = new Date(contract.start_date);
    let endDate;
    
    if (contract.end_date) {
      endDate = new Date(contract.end_date);
    } else {
      // Si pas de date de fin, utiliser la date actuelle
      endDate = new Date();
    }
    
    // Calculer la différence en jours
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  }

  // Calculer le montant total facturé pour un contrat
  calculateTotalBilling(contract) {
    if (!contract.start_date || !contract.billing_rate) return 0;
    
    // Calculer la durée en jours
    const durationInDays = this.calculateContractDuration(contract);
    if (!durationInDays) return 0;
    
    // Estimer le nombre d'heures travaillées (en supposant une semaine de 5 jours à 7h par jour)
    const workingHoursPerDay = 7;
    const workingDaysPerWeek = 5;
    const weekendDays = Math.floor(durationInDays / 7) * 2;
    const actualWorkingDays = durationInDays - weekendDays;
    const totalHours = actualWorkingDays * workingHoursPerDay;
    
    // Calculer le montant total
    return totalHours * parseFloat(contract.billing_rate);
  }

  // Formatter un contrat pour l'affichage
  formatContractForDisplay(contract) {
    if (!contract) return null;
    
    // Calculer la durée et le montant total
    const durationInDays = this.calculateContractDuration(contract);
    const totalBilling = this.calculateTotalBilling(contract);
    
    // Formatters
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    // Déterminer le statut textuel
    let statusText = '';
    switch (contract.status) {
      case 'draft':
        statusText = 'Brouillon';
        break;
      case 'active':
        statusText = 'Actif';
        break;
      case 'completed':
        statusText = 'Terminé';
        break;
      case 'canceled':
        statusText = 'Annulé';
        break;
      default:
        statusText = contract.status;
    }
    
    // Retourner un objet formaté
    return {
      ...contract,
      durationInDays,
      totalBilling,
      formattedHourlyRate: formatCurrency(contract.hourly_rate),
      formattedBillingRate: formatCurrency(contract.billing_rate),
      formattedTotalBilling: formatCurrency(totalBilling),
      formattedStartDate: formatDate(contract.start_date),
      formattedEndDate: formatDate(contract.end_date),
      statusText,
      displayReference: contract.reference || `CONT-${contract.id}`
    };
  }

  // Obtenir les statistiques des contrats
  async getContractStats() {
    try {
      const contracts = await this.getAllContracts();
      
      // Compteurs par statut
      const countByStatus = {
        draft: 0,
        active: 0,
        completed: 0,
        canceled: 0,
        total: contracts.length
      };
      
      // Montants totaux
      let totalBillingAmount = 0;
      let activeBillingAmount = 0;
      
      // Calculer les statistiques
      contracts.forEach(contract => {
        // Incrémenter le compteur correspondant au statut
        if (countByStatus.hasOwnProperty(contract.status)) {
          countByStatus[contract.status]++;
        }
        
        // Calculer les montants
        const amount = this.calculateTotalBilling(contract);
        totalBillingAmount += amount;
        
        if (contract.status === 'active') {
          activeBillingAmount += amount;
        }
      });
      
      return {
        counts: countByStatus,
        totalBillingAmount,
        activeBillingAmount,
        averageContractValue: countByStatus.total > 0 ? totalBillingAmount / countByStatus.total : 0
      };
    } catch (error) {
      console.error('Erreur dans ContractService.getContractStats:', error);
      throw error;
    }
  }
}