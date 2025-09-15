class DatabaseService {
  constructor() {
    this.initialized = false;
    this.storePrefix = "cm_"; // Préfixe pour les clés, CM = Contrat Manager
  }

  // Initialiser la base de données
  async initializeDatabase() {
    try {
      if (this.initialized) {
        return true;
      }

      // Vérifier si les données sont déjà initialisées
      const isInitialized = localStorage.getItem(
        `${this.storePrefix}initialized`
      );

      if (!isInitialized) {
        // Initialiser les compteurs d'ID
        localStorage.setItem(`${this.storePrefix}lastId_employees`, "0");
        localStorage.setItem(`${this.storePrefix}lastId_clients`, "0");
        localStorage.setItem(`${this.storePrefix}lastId_contracts`, "0");

        // Initialiser les collections
        localStorage.setItem(
          `${this.storePrefix}employees`,
          JSON.stringify([])
        );
        localStorage.setItem(`${this.storePrefix}clients`, JSON.stringify([]));
        localStorage.setItem(
          `${this.storePrefix}contracts`,
          JSON.stringify([])
        );

        // Marquer comme initialisé
        localStorage.setItem(`${this.storePrefix}initialized`, "true");
      }

      this.initialized = true;
      console.log("Base de données JSON initialisée avec succès");
      return true;
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation de la base de données JSON:",
        error
      );
      throw error;
    }
  }

  /**
   * Récupère une valeur de la base de données
   * @param {string} key - Clé de la valeur à récupérer
   * @returns {Promise<any>} - Valeur récupérée
   */
  async get(key) {
    try {
      // Ajouter le préfixe à la clé
      const prefixedKey = `${this.storePrefix}${key}`;

      // Utiliser uniquement localStorage
      const value = localStorage.getItem(prefixedKey);
      // console.log(`Récupération de ${prefixedKey}:`, value);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${key}:`, error);
      return null;
    }
  }

  /**
   * Enregistre une valeur dans la base de données
   * @param {string} key - Clé de la valeur à enregistrer
   * @param {any} value - Valeur à enregistrer
   * @returns {Promise<boolean>} - Succès ou échec
   */
  async set(key, value) {
    try {
      // Ajouter le préfixe à la clé
      const prefixedKey = `${this.storePrefix}${key}`;

      // Utiliser uniquement localStorage
      localStorage.setItem(prefixedKey, JSON.stringify(value));
      console.log(`Enregistrement de ${prefixedKey}:`, value);
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprime une valeur de la base de données
   * @param {string} key - Clé de la valeur à supprimer
   * @returns {Promise<boolean>} - Succès ou échec
   */
  async remove(key) {
    try {
      // Ajouter le préfixe à la clé
      const prefixedKey = `${this.storePrefix}${key}`;

      // Utiliser uniquement localStorage
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupère toutes les clés de la base de données
   * @returns {Promise<string[]>} - Liste des clés
   */
  async keys() {
    try {
      // Filtrer les clés qui commencent par le préfixe
      return Object.keys(localStorage).filter(key =>
        key.startsWith(this.storePrefix)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des clés:", error);
      return [];
    }
  }

  /**
   * Enregistre l'historique de génération de PDF
   * @param {string} contractId - ID du contrat
   * @param {string} type - Type de PDF (client ou employee)
   * @param {string} filePath - Chemin du fichier généré
   * @returns {Promise<boolean>} - Succès ou échec
   */
  async savePdfHistory(contractId, type, filePath) {
    try {
      // Récupérer l'historique existant
      const history = (await this.get("pdf_history")) || {};

      // Ajouter l'entrée pour ce contrat
      if (!history[contractId]) {
        history[contractId] = {};
      }

      history[contractId][type] = {
        filePath,
        generatedAt: new Date().toISOString(),
      };

      // Enregistrer l'historique mis à jour
      await this.set("pdf_history", history);
      return true;
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement de l'historique PDF:",
        error
      );
      return false;
    }
  }

  /**
   * Récupère l'historique de génération de PDF pour un contrat
   * @param {string} contractId - ID du contrat
   * @returns {Promise<Object>} - Historique des PDF générés
   */
  async getPdfHistory(contractId) {
    try {
      const history = (await this.get("pdf_history")) || {};
      return history[contractId] || {};
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'historique PDF:",
        error
      );
      return {};
    }
  }

  // Générer un nouvel ID pour une entité
  async getNextId(entity) {
    const lastIdKey = `${this.storePrefix}lastId_${entity}`;
    let lastId = parseInt(localStorage.getItem(lastIdKey) || "0");
    lastId++;
    localStorage.setItem(lastIdKey, lastId.toString());
    return lastId;
  }

  // Méthodes CRUD génériques

  // Créer un nouvel enregistrement
  async create(entity, data) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      // Récupérer les données existantes
      const storeKey = `${this.storePrefix}${entity}`;
      const items = JSON.parse(localStorage.getItem(storeKey) || "[]");

      // Générer un nouvel ID
      const id = await this.getNextId(entity);

      // Ajouter les métadonnées
      const newItem = {
        ...data,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Ajouter le nouvel item
      items.push(newItem);

      // Enregistrer
      localStorage.setItem(storeKey, JSON.stringify(items));
      console.log(`Nouvel élément créé dans ${entity}:`, newItem);

      return newItem;
    } catch (error) {
      console.error(`Erreur lors de la création dans ${entity}:`, error);
      throw error;
    }
  }

  // Lire un enregistrement par ID
  async getById(entity, id) {
    if (!id) {
      throw new Error(`élément vec l'ID Undefined`);
    }
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      const storeKey = `${this.storePrefix}${entity}`;
      const items = JSON.parse(localStorage.getItem(storeKey) || "[]");
      const item = items.find((item) => item.id === Number(id));

      if (!item) {
        throw new Error(`Aucun élément trouvé avec l'ID ${id} dans ${entity}`);
      }

      return item;
    } catch (error) {
      console.error(`Erreur lors de la lecture dans ${entity}:`, error);
      throw error;
    }
  }

  // Mettre à jour un enregistrement
  async update(entity, id, data) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      const storeKey = `${this.storePrefix}${entity}`;
      const items = JSON.parse(localStorage.getItem(storeKey) || "[]");
      const index = items.findIndex((item) => item.id === Number(id));

      if (index === -1) {
        throw new Error(`Aucun élément trouvé avec l'ID ${id} dans ${entity}`);
      }

      // Mettre à jour les données
      const updatedItem = {
        ...items[index],
        ...data,
        id: Number(id), // S'assurer que l'ID reste le même
        updated_at: new Date().toISOString(),
      };

      items[index] = updatedItem;

      // Enregistrer
      localStorage.setItem(storeKey, JSON.stringify(items));
      console.log(`Élément mis à jour dans ${entity}:`, updatedItem);

      return updatedItem;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour dans ${entity}:`, error);
      throw error;
    }
  }

  // Supprimer un enregistrement
  async delete(entity, id) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      const storeKey = `${this.storePrefix}${entity}`;
      const items = JSON.parse(localStorage.getItem(storeKey) || "[]");
      const filteredItems = items.filter((item) => item.id !== Number(id));

      if (filteredItems.length === items.length) {
        throw new Error(`Aucun élément trouvé avec l'ID ${id} dans ${entity}`);
      }

      // Enregistrer
      localStorage.setItem(storeKey, JSON.stringify(filteredItems));
      console.log(`Élément supprimé dans ${entity}: ID ${id}`);

      return { success: true };
    } catch (error) {
      console.error(`Erreur lors de la suppression dans ${entity}:`, error);
      throw error;
    }
  }

  // Lire tous les enregistrements (avec filtres optionnels)
  async getAll(entity, filters = {}, order = "id", direction = "ASC") {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      const storeKey = `${this.storePrefix}${entity}`;
      let items = await JSON.parse(localStorage.getItem(storeKey) || "[]");

      // Appliquer les filtres
      if (Object.keys(filters).length > 0) {
        items = items.filter((item) => {
          return Object.keys(filters).every((key) => {
            return item[key] === filters[key];
          });
        });
      }

      // Trier les résultats
      items.sort((a, b) => {
        if (a[order] < b[order]) return direction === "ASC" ? -1 : 1;
        if (a[order] > b[order]) return direction === "ASC" ? 1 : -1;
        return 0;
      });

      console.log(`Récupération des éléments dans ${entity}:`, items.length);
      return items;
    } catch (error) {
      console.error(`Erreur lors de la récupération dans ${entity}:`, error);
      throw error;
    }
  }

  // Méthodes spécifiques pour chaque entité

  // Employés
  async getEmployees(filters = {}) {
    return this.getAll("employees", filters, "lastname");
  }

  async getEmployeeById(id) {
    return this.getById("employees", id);
  }

  async createEmployee(data) {
    return this.create("employees", data);
  }

  async updateEmployee(id, data) {
    return this.update("employees", id, data);
  }

  async deleteEmployee(id) {
    return this.delete("employees", id);
  }

  // Clients
  async getClients(filters = {}) {
    return this.getAll("clients", filters, "company_name");
  }

  async getClientById(id) {
    return this.getById("clients", id);
  }

  async createClient(data) {
    return this.create("clients", data);
  }

  async updateClient(id, data) {
    return this.update("clients", id, data);
  }

  async deleteClient(id) {
    return this.delete("clients", id);
  }

  // Contrats
  async getContracts(filters = {}) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      // Récupérer tous les contrats
      let contracts = await this.getAll(
        "contracts",
        filters,
        "start_date",
        "DESC"
      );

      // Pour chaque contrat, récupérer les détails de l'employé et du client
      for (let i = 0; i < contracts.length; i++) {
        const contract = contracts[i];

        try {
          // Récupérer l'employé
          if(!contract) return;
          const employee = await this.getEmployeeById(contract.employee_id);
          contract.employee_firstname = employee.firstname;
          contract.employee_lastname = employee.lastname;

          // Récupérer le client
          const client = await this.getClientById(contract.client_id);
          contract.client_company = client.company_name;
        } catch (error) {
          console.log(
            `Impossible de récupérer les détails pour le contrat ${contract.id}:`,
            error
          );
        }
      }

      return contracts;
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats:", error);
      throw error;
    }
  }

  async getContractById(id) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      // Récupérer le contrat
      const contract = await this.getById("contracts", id);

      try {
        // Récupérer l'employé
        const employee = await this.getEmployeeById(contract.employee_id);
        contract.employee_firstname = employee.firstname;
        contract.employee_lastname = employee.lastname;

        // Récupérer le client
        const client = await this.getClientById(contract.client_id);
        contract.client_company = client.company_name;
      } catch (error) {
        console.log(
          `Impossible de récupérer les détails pour le contrat ${contract.id}:`,
          error
        );
      }

      return contract;
    } catch (error) {
      console.error("Erreur lors de la récupération du contrat:", error);
      throw error;
    }
  }

  async createContract(data) {
    return this.create("contracts", data);
  }

  async updateContract(id, data) {
    return this.update("contracts", id, data);
  }

  async deleteContract(id) {
    return this.delete("contracts", id);
  }

  // Méthodes pour le tableau de bord

  // Obtenir les contrats actifs
  async getActiveContracts() {
    return this.getContracts({});
  }

  // Obtenir les contrats qui se terminent bientôt (dans les 30 jours)
  async getEndingSoonContracts() {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      // Récupérer tous les contrats actifs
      const activeContracts = await this.getContracts({});
      // console.log("activeContracts :::::::::::::::::::: ", activeContracts);


      // Filtrer ceux qui se terminent dans les 30 jours
      const endingSoonContracts = activeContracts.filter((contract) => {
        if (!contract.endDate) return false;

        const endDate = new Date(contract.endDate);
        return endDate >= today && endDate <= thirtyDaysLater;
      });

      // Trier par date de fin croissante
      endingSoonContracts.sort((a, b) => {
        return new Date(a.end_date) - new Date(b.end_date);
      });

      return endingSoonContracts;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des contrats qui se terminent bientôt:",
        error
      );
      throw error;
    }
  }

  // src/services/DatabaseService.js - Ajout des méthodes factures
  // Ajouter ces méthodes à votre DatabaseService.js existant

  // Dans la méthode initializeDatabase(), ajouter:
  /*
  localStorage.setItem(`${this.storePrefix}lastId_invoices`, "0");
  localStorage.setItem(`${this.storePrefix}invoices`, JSON.stringify([]));
  */

  // Méthodes pour les factures
  async getInvoices(filters = {}) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      let invoices = await this.getAll("invoices", filters, "invoice_date", "DESC");

      // Enrichir avec les données client
      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];

        try {
          if (invoice.clientId || invoice.client_id) {
            const clientId = invoice.clientId || invoice.client_id;
            const client = await this.getClientById(clientId);
            if (client) {
              invoice.clientName = client.contactName || client.contact_name || '';
              invoice.clientCompany = client.companyName || client.company_name || '';
              invoice.clientEmail = client.email || '';
              invoice.clientPhone = client.phone || '';
              invoice.clientAddress = client.address || '';
              invoice.clientCity = client.city || '';
              invoice.clientPostalCode = client.postalCode || client.postal_code || '';
            }
          }
        } catch (error) {
          console.log(`Impossible de récupérer le client pour la facture ${invoice.id}:`, error);
        }
      }

      return invoices;
    } catch (error) {
      console.error("Erreur lors de la récupération des factures:", error);
      throw error;
    }
  }

  async getInvoiceById(id) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      const invoice = await this.getById("invoices", id);

      // Enrichir avec les données client
      try {
        if (invoice.clientId || invoice.client_id) {
          const clientId = invoice.clientId || invoice.client_id;
          const client = await this.getClientById(clientId);
          if (client) {
            invoice.client = client;
            invoice.clientName = client.contactName || client.contact_name || '';
            invoice.clientCompany = client.companyName || client.company_name || '';
          }
        }
      } catch (error) {
        console.log(`Impossible de récupérer le client pour la facture ${invoice.id}:`, error);
      }

      return invoice;
    } catch (error) {
      console.error("Erreur lors de la récupération de la facture:", error);
      throw error;
    }
  }

  async createInvoice(data) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      // Normaliser les noms de champs
      const normalizedData = {
        ...data,
        client_id: data.clientId || data.client_id,
        invoice_number: data.invoiceNumber || data.invoice_number,
        invoice_date: data.invoiceDate || data.invoice_date,
        due_date: data.dueDate || data.due_date,
        period_start: data.periodStart || data.period_start,
        period_end: data.periodEnd || data.period_end,
        total_amount: data.totalAmount || data.total_amount || 0,
        work_periods: data.workPeriods || data.work_periods || [],
        status: data.status || 'draft'
      };

      return await this.create("invoices", normalizedData);
    } catch (error) {
      console.error("Erreur lors de la création de la facture:", error);
      throw error;
    }
  }

  async updateInvoice(id, data) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      // Normaliser les noms de champs
      const normalizedData = {
        ...data,
        client_id: data.clientId || data.client_id,
        invoice_number: data.invoiceNumber || data.invoice_number,
        invoice_date: data.invoiceDate || data.invoice_date,
        due_date: data.dueDate || data.due_date,
        period_start: data.periodStart || data.period_start,
        period_end: data.periodEnd || data.period_end,
        total_amount: data.totalAmount || data.total_amount || 0,
        work_periods: data.workPeriods || data.work_periods || []
      };

      return await this.update("invoices", id, normalizedData);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la facture:", error);
      throw error;
    }
  }

  async deleteInvoice(id) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      return await this.delete("invoices", id);
    } catch (error) {
      console.error("Erreur lors de la suppression de la facture:", error);
      throw error;
    }
  }

  // Obtenir les factures par client
  async getInvoicesByClient(clientId) {
    try {
      return await this.getInvoices({ client_id: clientId });
    } catch (error) {
      console.error("Erreur lors de la récupération des factures par client:", error);
      throw error;
    }
  }

  // Obtenir les factures par statut
  async getInvoicesByStatus(status) {
    try {
      return await this.getInvoices({ status: status });
    } catch (error) {
      console.error("Erreur lors de la récupération des factures par statut:", error);
      throw error;
    }
  }

  // Obtenir les factures d'une période
  async getInvoicesByPeriod(startDate, endDate) {
    try {
      const invoices = await this.getInvoices();

      return invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date || invoice.invoiceDate);
        return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des factures par période:', error);
      throw error;
    }
  }

  // Obtenir les statistiques des factures
  async getInvoiceStatistics() {
    try {
      const invoices = await this.getInvoices();

      const stats = {
        total: invoices.length,
        draft: invoices.filter(i => i.status === 'draft').length,
        sent: invoices.filter(i => i.status === 'sent').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        overdue: invoices.filter(i => i.status === 'overdue').length,
        rejected: invoices.filter(i => i.status === 'rejected').length,
        totalAmount: invoices.reduce((sum, i) => sum + (parseFloat(i.total_amount || i.totalAmount) || 0), 0),
        paidAmount: invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + (parseFloat(i.total_amount || i.totalAmount) || 0), 0),
        pendingAmount: invoices
          .filter(i => i.status === 'sent' || i.status === 'overdue')
          .reduce((sum, i) => sum + (parseFloat(i.total_amount || i.totalAmount) || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques factures:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'une facture
  async updateInvoiceStatus(id, status) {
    try {
      const invoice = await this.getInvoiceById(id);
      if (!invoice) {
        throw new Error('Facture non trouvée');
      }

      return await this.updateInvoice(id, {
        ...invoice,
        status,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }



  // Obtenir des statistiques pour le tableau de bord
  async getDashboardStats() {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      // Récupérer les données
      const employees = await this.getEmployees();
      const clients = await this.getClients();
      const contracts = await this.getContracts();

      // Calculer les statistiques
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(
        (e) => e.status === "active"
      ).length;

      const totalClients = clients.length;
      const activeClients = clients.filter((c) => c.status === "active").length;

      const totalContracts = contracts.length;
      const activeContracts = contracts.length;

      // Contrats se terminant bientôt
      const endingSoonContracts = await this.getEndingSoonContracts();

      // Contrats du mois courant
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const contractsThisMonth = contracts.filter((contract) => {
        const startDate = new Date(contract.start_date);
        return startDate >= firstDayOfMonth && startDate <= today;
      }).length;

      // Revenu du mois (approximatif basé sur le taux de facturation)
      let revenueThisMonth = 0;
      contracts.forEach((contract) => {
        if (contract.billing_rate) {
          const startDate = new Date(contract.start_date);

          // Si le contrat a commencé ce mois-ci
          if (startDate >= firstDayOfMonth && startDate <= today) {
            const daysActive = Math.ceil(
              (today - startDate) / (1000 * 60 * 60 * 24)
            );
            const workDays = Math.min(daysActive, 22); // Maximum 22 jours ouvrables par mois
            revenueThisMonth +=
              workDays * 7 * parseFloat(contract.billing_rate); // 7 heures par jour
          }
          // Si le contrat était déjà actif avant ce mois-ci
          else if (startDate < firstDayOfMonth) {
            const daysSinceMonthStart = Math.ceil(
              (today - firstDayOfMonth) / (1000 * 60 * 60 * 24)
            );
            const workDays = Math.min(daysSinceMonthStart, 22);
            revenueThisMonth +=
              workDays * 7 * parseFloat(contract.billing_rate);
          }
        }
      });

      return {
        totalEmployees,
        activeEmployees,
        totalClients,
        activeClients,
        totalContracts,
        activeContracts,
        endingSoonContracts: endingSoonContracts.length,
        contractsThisMonth,
        revenueThisMonth,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      throw error;
    }
  }

  // Exporter les données (pour la sauvegarde)
  async exportData() {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      const employees = JSON.parse(
        localStorage.getItem(`${this.storePrefix}employees`) || "[]"
      );
      const clients = JSON.parse(
        localStorage.getItem(`${this.storePrefix}clients`) || "[]"
      );
      const contracts = JSON.parse(
        localStorage.getItem(`${this.storePrefix}contracts`) || "[]"
      );

      // Rassembler toutes les données
      const data = {
        employees,
        clients,
        contracts,
        metadata: {
          lastId_employees: parseInt(
            localStorage.getItem(`${this.storePrefix}lastId_employees`) || "0"
          ),
          lastId_clients: parseInt(
            localStorage.getItem(`${this.storePrefix}lastId_clients`) || "0"
          ),
          lastId_contracts: parseInt(
            localStorage.getItem(`${this.storePrefix}lastId_contracts`) || "0"
          ),
          exportDate: new Date().toISOString(),
        },
      };

      return data;
    } catch (error) {
      console.error("Erreur lors de l'exportation des données:", error);
      throw error;
    }
  }

  // Importer des données (restauration)
  async importData(data) {
    try {
      if (!this.initialized) {
        await this.initializeDatabase();
      }

      // Vérifier que les données sont valides
      if (
        !data.employees ||
        !data.clients ||
        !data.contracts ||
        !data.metadata
      ) {
        throw new Error(
          "Les données importées sont incorrectes ou incomplètes"
        );
      }

      // Importer les données
      localStorage.setItem(
        `${this.storePrefix}employees`,
        JSON.stringify(data.employees)
      );
      localStorage.setItem(
        `${this.storePrefix}clients`,
        JSON.stringify(data.clients)
      );
      localStorage.setItem(
        `${this.storePrefix}contracts`,
        JSON.stringify(data.contracts)
      );

      // Importer les métadonnées
      localStorage.setItem(
        `${this.storePrefix}lastId_employees`,
        data.metadata.lastId_employees.toString()
      );
      localStorage.setItem(
        `${this.storePrefix}lastId_clients`,
        data.metadata.lastId_clients.toString()
      );
      localStorage.setItem(
        `${this.storePrefix}lastId_contracts`,
        data.metadata.lastId_contracts.toString()
      );

      return { success: true };
    } catch (error) {
      console.error("Erreur lors de l'importation des données:", error);
      throw error;
    }
  }

  // Sauvegarde/export vers fichier JSON
  async saveToFile(filename) {
    try {
      const data = await this.exportData();

      // Mode navigateur (pour test), on propose le téléchargement
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = filename || "contrat-manager-backup.json";

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      return { success: true, filename: exportFileDefaultName };
    } catch (error) {
      console.error("Erreur lors de la sauvegarde vers fichier:", error);
      throw error;
    }
  }

  // Importer depuis un fichier JSON
  async loadFromFile(file) {
    try {
      // Mode navigateur (pour test), on lit le fichier
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            this.importData(data)
              .then(() => {
                resolve({ success: true });
              })
              .catch(reject);
          } catch (e) {
            reject(e);
          }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });
    } catch (error) {
      console.error("Erreur lors du chargement depuis fichier:", error);
      throw error;
    }
  }
}

// Exporter une instance unique du service
export default new DatabaseService();