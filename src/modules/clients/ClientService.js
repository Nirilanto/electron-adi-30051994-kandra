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
        // Vérifier si le nom de l'entreprise, le contact ou l'email correspond au terme de recherche
        const matchesTerm = 
          searchTerm === '' ||
          (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.contact_name && client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.siret && client.siret.includes(searchTerm));
        
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

  // Valider les données d'un client
  validateClientData(data) {
    const errors = {};
    
    // Vérifier les champs obligatoires
    if (!data.company_name || data.company_name.trim() === '') {
      errors.company_name = 'Le nom de l\'entreprise est obligatoire';
    }
    
    // Valider l'email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Adresse email non valide';
    }
    
    // Valider le SIRET
    if (data.siret) {
      const siretClean = data.siret.replace(/\s/g, '');
      if (!/^\d{14}$/.test(siretClean)) {
        errors.siret = 'Le numéro SIRET doit comporter 14 chiffres';
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
    
    return {
      ...client,
      formattedSiret: client.siret 
        ? client.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')
        : '-',
      statusText: client.status === 'active' ? 'Actif' : 'Inactif',
      address: [
        client.address,
        client.postal_code,
        client.city,
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
}

// Exporter une instance unique du service
export default new ClientService();