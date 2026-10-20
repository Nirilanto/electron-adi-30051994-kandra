// src/services/DatabaseService.js
// Façade d'accès aux données. Conserve l'API historique (utilisée par tous les
// modules) mais délègue désormais au serveur NestJS / PostgreSQL via ApiClient.
import ApiClient from './ApiClient';

const ENTITY_PATHS = {
  employees: '/employees',
  clients: '/clients',
  contracts: '/contracts',
  invoices: '/invoices',
  payslips: '/payslips',
  time_entries: '/time-entries',
};

function entityPath(entity) {
  const path = ENTITY_PATHS[entity];
  if (!path) {
    throw new Error(`Entité inconnue : ${entity}`);
  }
  return path;
}

class DatabaseService {
  constructor() {
    this.initialized = false;
    this.storePrefix = 'cm_'; // conservé pour compatibilité
  }

  // Vérifie que l'API répond
  async initializeDatabase() {
    if (this.initialized) return true;
    const health = await ApiClient.request('GET', '/health', undefined, { skipAuthHandling: true });
    if (!health || health.database !== 'ok') {
      throw new Error('La base de données du serveur est indisponible');
    }
    this.initialized = true;
    return true;
  }

  // ---------------------------------------------------------------- Clé / valeur générique

  async get(key) {
    try {
      const result = await ApiClient.get(`/kv/${encodeURIComponent(key)}`);
      return result ? result.value : null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${key}:`, error);
      return null;
    }
  }

  async set(key, value) {
    try {
      await ApiClient.put(`/kv/${encodeURIComponent(key)}`, { value });
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de ${key}:`, error);
      return false;
    }
  }

  async remove(key) {
    try {
      await ApiClient.delete(`/kv/${encodeURIComponent(key)}`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
      return false;
    }
  }

  async keys() {
    try {
      const result = await ApiClient.get('/kv');
      return (result && result.keys) || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des clés:', error);
      return [];
    }
  }

  async savePdfHistory(contractId, type, filePath) {
    try {
      const history = (await this.get('pdf_history')) || {};
      if (!history[contractId]) history[contractId] = {};
      history[contractId][type] = { filePath, generatedAt: new Date().toISOString() };
      await this.set('pdf_history', history);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'historique PDF:", error);
      return false;
    }
  }

  async getPdfHistory(contractId) {
    try {
      const history = (await this.get('pdf_history')) || {};
      return history[contractId] || {};
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique PDF:", error);
      return {};
    }
  }

  // ---------------------------------------------------------------- CRUD générique

  async create(entity, data) {
    return ApiClient.post(entityPath(entity), data);
  }

  async getById(entity, id) {
    if (!id) {
      throw new Error("élément avec l'ID Undefined");
    }
    return ApiClient.get(`${entityPath(entity)}/${encodeURIComponent(id)}`);
  }

  async update(entity, id, data) {
    return ApiClient.patch(`${entityPath(entity)}/${encodeURIComponent(id)}`, data);
  }

  async delete(entity, id) {
    return ApiClient.delete(`${entityPath(entity)}/${encodeURIComponent(id)}`);
  }

  async getAll(entity, filters = {}, order = 'id', direction = 'ASC') {
    const params = { ...(filters || {}) };
    if (order && order !== 'id') {
      params.order = order;
      params.direction = direction;
    }
    const items = await ApiClient.get(entityPath(entity), params);
    return Array.isArray(items) ? items : [];
  }

  // ---------------------------------------------------------------- Employés

  async getEmployees(filters = {}) {
    return this.getAll('employees', filters);
  }

  async getEmployeeById(id) {
    return this.getById('employees', id);
  }

  async createEmployee(data) {
    return this.create('employees', data);
  }

  async updateEmployee(id, data) {
    return this.update('employees', id, data);
  }

  async deleteEmployee(id) {
    return this.delete('employees', id);
  }

  // ---------------------------------------------------------------- Clients

  async getClients(filters = {}) {
    return this.getAll('clients', filters);
  }

  async getClientById(id) {
    return this.getById('clients', id);
  }

  async createClient(data) {
    return this.create('clients', data);
  }

  async updateClient(id, data) {
    return this.update('clients', id, data);
  }

  async deleteClient(id) {
    return this.delete('clients', id);
  }

  // ---------------------------------------------------------------- Contrats

  async getContracts(filters = {}) {
    return this.getAll('contracts', filters);
  }

  async getContractById(id) {
    return this.getById('contracts', id);
  }

  async createContract(data) {
    return this.create('contracts', data);
  }

  async updateContract(id, data) {
    return this.update('contracts', id, data);
  }

  /** Remplacement complet d'un contrat (sémantique de ContractService.saveContract). */
  async replaceContract(id, data) {
    return ApiClient.put(`/contracts/${encodeURIComponent(id)}`, data);
  }

  async deleteContract(id) {
    return this.delete('contracts', id);
  }

  async cleanupContracts() {
    return ApiClient.post('/contracts/cleanup');
  }

  async getNextContractNumber() {
    const result = await ApiClient.post('/contracts/next-number');
    return result.contractNumber;
  }

  // ---------------------------------------------------------------- Tableau de bord

  async getActiveContracts() {
    return this.getContracts({});
  }

  async getEndingSoonContracts() {
    const items = await ApiClient.get('/dashboard/ending-soon');
    return Array.isArray(items) ? items : [];
  }

  async getDashboardStats() {
    return ApiClient.get('/dashboard/stats');
  }

  // ---------------------------------------------------------------- Factures

  async getInvoices(filters = {}) {
    return this.getAll('invoices', filters);
  }

  async getInvoiceById(id) {
    return this.getById('invoices', id);
  }

  async createInvoice(data) {
    return this.create('invoices', data);
  }

  async updateInvoice(id, data) {
    return this.update('invoices', id, data);
  }

  async deleteInvoice(id) {
    return this.delete('invoices', id);
  }

  async getInvoicesByClient(clientId) {
    return this.getInvoices({ client_id: clientId });
  }

  async getInvoicesByStatus(status) {
    return this.getInvoices({ status });
  }

  async getInvoicesByPeriod(startDate, endDate) {
    const invoices = await this.getInvoices();
    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoice_date || invoice.invoiceDate);
      return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
    });
  }

  async getInvoiceStatistics() {
    return ApiClient.get('/invoices/statistics');
  }

  async updateInvoiceStatus(id, status) {
    return ApiClient.patch(`/invoices/${encodeURIComponent(id)}/status`, { status });
  }

  async getNextInvoiceNumber() {
    const result = await ApiClient.post('/invoices/next-number');
    return result.invoiceNumber;
  }

  // ---------------------------------------------------------------- Sauvegarde / restauration

  /** Export complet de toutes les données (employés, clients, contrats, pointages, factures, bulletins, paramètres). */
  async exportData() {
    return ApiClient.get('/backup/export');
  }

  /** Restauration complète : remplace toutes les données existantes. */
  async importData(data) {
    if (!data || !data.employees || !data.clients || !data.contracts) {
      throw new Error('Les données importées sont incorrectes ou incomplètes');
    }
    return ApiClient.post('/backup/import', data);
  }

  async saveToFile(filename) {
    const data = await this.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const exportFileDefaultName = filename || 'contrat-manager-backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return { success: true, filename: exportFileDefaultName, filePath: exportFileDefaultName };
  }

  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          this.importData(data)
            .then(() => resolve({ success: true }))
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }
}

export default new DatabaseService();
