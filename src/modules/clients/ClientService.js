// src/modules/clients/ClientService.js
import DatabaseService from '../../services/DatabaseService';

class ClientService {
  // Obtenir tous les clients
  async getAllClients(filters = {}) {
    try {
      return await DatabaseService.getClients(filters);
    } catch (error) {
      console.error('Erreur dans ClientService.getAllClients:', error);
      throw error;
    }
  }

  // Obtenir un client par son ID
  async getClientById(id) {
    try {
      return await DatabaseService.getClientById(id);
    } catch (error) {
      console.error(`Erreur dans ClientService.getClientById(${id}):`, error);
      throw error;
    }
  }

  // Créer un nouveau client
  async createClient(clientData) {
    try {
      return await DatabaseService.createClient(clientData);
    } catch (error) {
      console.error('Erreur dans ClientService.createClient:', error);
      throw error;
    }
  }

  // Mettre à jour un client
  async updateClient(id, clientData) {
    try {
      return await DatabaseService.updateClient(id, clientData);
    } catch (error) {
      console.error(`Erreur dans ClientService.updateClient(${id}):`, error);
      throw error;
    }
  }

  // Supprimer un client
  async deleteClient(id) {
    try {
      return await DatabaseService.deleteClient(id);
    } catch (error) {
      console.error(`Erreur dans ClientService.deleteClient(${id}):`, error);
      throw error;
    }
  }

  // Rechercher des clients
  async searchClients(searchTerm, status = 'all') {
    try {
      const clients = await DatabaseService.getClients();
      
      // Filtrer les clients en fonction du terme de recherche et du statut
      return clients.filter(client => {
        // Support des deux formats de noms de champs
        const companyName = client.companyName || client.company_name || '';
        const contactName = client.contactName || client.contact_name || '';
        const email = client.email || '';
        const siret = client.siret || '';
        
        // Vérifier si les critères correspondent au terme de recherche
        const matchesTerm = 
          searchTerm === '' ||
          companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          siret.includes(searchTerm);
        
        // Vérifier si le statut correspond
        const matchesStatus = 
          status === 'all' || 
          client.status === status;
        
        return matchesTerm && matchesStatus;
      });
    } catch (error) {
      console.error('Erreur dans ClientService.searchClients:', error);
      throw error;
    }
  }

  // Obtenir les clients actifs
  async getActiveClients() {
    try {
      return await DatabaseService.getClients({ status: 'active' });
    } catch (error) {
      console.error('Erreur dans ClientService.getActiveClients:', error);
      throw error;
    }
  }

  // Valider les données d'un client
  validateClientData(data) {
    const errors = {};
    
    // Vérifier les champs obligatoires - support des deux formats
    const companyName = data.companyName || data.company_name;
    if (!companyName || companyName.trim() === '') {
      errors.companyName = 'Le nom de l\'entreprise est obligatoire';
      errors.company_name = 'Le nom de l\'entreprise est obligatoire';
    }
    
    // Valider l'email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Adresse email non valide';
    }
    
    // Valider le SIRET (14 chiffres)
    if (data.siret) {
      const siretClean = data.siret.replace(/\s/g, '');
      if (!/^\d{14}$/.test(siretClean)) {
        errors.siret = 'Le numéro SIRET doit comporter 14 chiffres';
      }
    }
    
    // Valider le numéro de TVA
    if (data.vatNumber && data.vatNumber.length > 0) {
      // Format basique pour la TVA intracommunautaire
      const vatRegex = /^[A-Z]{2}[A-Z0-9]+$/;
      if (!vatRegex.test(data.vatNumber.replace(/\s/g, ''))) {
        errors.vatNumber = 'Format de numéro de TVA invalide';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Formatter les données d'un client pour l'affichage
  formatClientForDisplay(client) {
    if (!client) return null;
    
    // Support des deux formats de noms de champs
    const companyName = client.companyName || client.company_name || 'Entreprise inconnue';
    const postalCode = client.postalCode || client.postal_code;
    
    return {
      ...client,
      displayName: companyName,
      formattedSiret: client.siret 
        ? this.formatSiret(client.siret)
        : '-',
      statusText: client.status === 'active' ? 'Actif' : 'Inactif',
      fullAddress: [
        client.address,
        client.addressComplement,
        postalCode && client.city ? `${postalCode} ${client.city}` : '',
        client.country !== 'France' ? client.country : ''
      ].filter(Boolean).join(', ')
    };
  }

  // Formater un numéro SIRET
  formatSiret(siret) {
    if (!siret) return '';
    
    // Nettoyer le SIRET
    const cleanSiret = siret.replace(/\s/g, '');
    
    // Formater le SIRET (XXX XXX XXX XXXXX)
    return cleanSiret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');
  }

  // Obtenir les statistiques d'un client
  async getClientStats(clientId) {
    try {
      const client = await this.getClientById(clientId);
      
      return {
        contractCount: client.contractCount || 0,
        totalRevenue: client.totalRevenue || 0,
        lastOrderDate: client.lastOrderDate || null,
        averageOrderValue: client.averageOrderValue || 0,
        satisfactionRating: client.satisfactionRating || null
      };
    } catch (error) {
      console.error('Erreur dans ClientService.getClientStats:', error);
      throw error;
    }
  }

  // Obtenir l'historique des contrats d'un client
  async getClientContracts(clientId) {
    try {
      // À implémenter quand le module contrats sera prêt
      // return await DatabaseService.getContracts({ client_id: clientId });
      return [];
    } catch (error) {
      console.error('Erreur dans ClientService.getClientContracts:', error);
      throw error;
    }
  }

  // Normaliser les données client pour compatibilité
  normalizeClientData(client) {
    return {
      ...client,
      // Assurer la compatibilité des noms de champs
      companyName: client.companyName || client.company_name,
      company_name: client.company_name || client.companyName,
      contactName: client.contactName || client.contact_name,
      contact_name: client.contact_name || client.contactName,
      postalCode: client.postalCode || client.postal_code,
      postal_code: client.postal_code || client.postalCode
    };
  }
}

// Exporter une instance unique du service
export default new ClientService();