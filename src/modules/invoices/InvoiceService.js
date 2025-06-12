// src/modules/invoices/InvoiceService.js
import DatabaseService from '../../services/DatabaseService';

class InvoiceService {
  constructor() {
    this.db = DatabaseService;
    this.invoicesKey = 'invoices';
    this.lastInvoiceNumberKey = 'last_invoice_number';
  }

  // Obtenir toutes les factures
  async getAllInvoices(filters = {}) {
    try {
      return await this.db.getInvoices(filters);
    } catch (error) {
      console.error('Erreur dans InvoiceService.getAllInvoices:', error);
      throw error;
    }
  }

  // Obtenir une facture par son ID
  async getInvoiceById(id) {
    try {
      return await this.db.getInvoiceById(id);
    } catch (error) {
      console.error(`Erreur dans InvoiceService.getInvoiceById(${id}):`, error);
      throw error;
    }
  }

  // Créer une nouvelle facture
  async createInvoice(invoiceData) {
    try {
      // Générer le numéro de facture si pas fourni
      if (!invoiceData.invoiceNumber) {
        invoiceData.invoiceNumber = await this.generateInvoiceNumber();
      }

      return await this.db.createInvoice(invoiceData);
    } catch (error) {
      console.error('Erreur dans InvoiceService.createInvoice:', error);
      throw error;
    }
  }

  // Mettre à jour une facture
  async updateInvoice(id, invoiceData) {
    try {
      return await this.db.updateInvoice(id, invoiceData);
    } catch (error) {
      console.error(`Erreur dans InvoiceService.updateInvoice(${id}):`, error);
      throw error;
    }
  }

  // Supprimer une facture
  async deleteInvoice(id) {
    try {
      return await this.db.deleteInvoice(id);
    } catch (error) {
      console.error(`Erreur dans InvoiceService.deleteInvoice(${id}):`, error);
      throw error;
    }
  }

  // Générer le prochain numéro de facture
  async generateInvoiceNumber() {
    try {
      const currentYear = new Date().getFullYear();
      const currentYearStr = currentYear.toString();
      
      // Récupérer le dernier numéro
      const lastNumber = await this.db.get(this.lastInvoiceNumberKey) || 0;
      const nextNumber = lastNumber + 1;
      
      // Sauvegarder le nouveau numéro
      await this.db.set(this.lastInvoiceNumberKey, nextNumber);
      
      // Format: FAC-2025-0001
      return `FAC-${currentYearStr}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Erreur lors de la génération du numéro de facture:', error);
      throw error;
    }
  }

  // Rechercher des factures
  async searchInvoices(searchTerm, filters = {}) {
    try {
      const invoices = await this.getAllInvoices();
      
      return invoices.filter(invoice => {
        // Filtre par terme de recherche
        const matchesTerm = 
          searchTerm === '' ||
          invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.clientCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre par statut
        const matchesStatus = 
          !filters.status || 
          filters.status === 'all' || 
          invoice.status === filters.status;
        
        return matchesTerm && matchesStatus;
      });
    } catch (error) {
      console.error('Erreur dans InvoiceService.searchInvoices:', error);
      throw error;
    }
  }

  // Obtenir les factures par statut
  async getInvoicesByStatus(status) {
    try {
      return await this.getAllInvoices({ status });
    } catch (error) {
      console.error('Erreur dans InvoiceService.getInvoicesByStatus:', error);
      throw error;
    }
  }

  // Changer le statut d'une facture
  async updateInvoiceStatus(id, status) {
    try {
      const invoice = await this.getInvoiceById(id);
      if (!invoice) {
        throw new Error('Facture non trouvée');
      }

      return await this.updateInvoice(id, { 
        ...invoice, 
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur dans InvoiceService.updateInvoiceStatus:', error);
      throw error;
    }
  }

  // Calculer le montant total d'une facture
  calculateInvoiceTotal(invoiceLines) {
    if (!invoiceLines || !Array.isArray(invoiceLines)) {
      return 0;
    }

    return invoiceLines.reduce((total, line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const unitPrice = parseFloat(line.unitPrice) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  }

  // Valider les données d'une facture
  validateInvoiceData(data) {
    const errors = {};
    
    // Vérifier les champs obligatoires
    if (!data.clientId) {
      errors.clientId = 'Le client est obligatoire';
    }
    
    if (!data.periodStart) {
      errors.periodStart = 'La date de début de période est obligatoire';
    }
    
    if (!data.periodEnd) {
      errors.periodEnd = 'La date de fin de période est obligatoire';
    }
    
    // Vérifier que la date de fin est après la date de début
    if (data.periodStart && data.periodEnd) {
      const startDate = new Date(data.periodStart);
      const endDate = new Date(data.periodEnd);
      
      if (endDate <= startDate) {
        errors.periodEnd = 'La date de fin doit être après la date de début';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Obtenir les statistiques des factures
  async getInvoiceStats() {
    try {
      const invoices = await this.getAllInvoices();
      
      const stats = {
        total: invoices.length,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        rejected: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
      };

      invoices.forEach(invoice => {
        // Compter par statut
        if (stats.hasOwnProperty(invoice.status)) {
          stats[invoice.status]++;
        }

        // Calculer les montants
        const amount = parseFloat(invoice.totalAmount) || 0;
        stats.totalAmount += amount;

        if (invoice.status === 'paid') {
          stats.paidAmount += amount;
        } else if (invoice.status === 'sent' || invoice.status === 'overdue') {
          stats.pendingAmount += amount;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erreur dans InvoiceService.getInvoiceStats:', error);
      throw error;
    }
  }
}

// Exporter une instance unique du service
export default new InvoiceService();