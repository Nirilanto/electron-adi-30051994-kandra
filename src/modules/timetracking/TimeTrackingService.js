// src/modules/timetracking/TimeTrackingService.js
import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../../services/DatabaseService';

class TimeTrackingService {
  constructor() {
    this.db = DatabaseService;
    this.timeEntriesKey = 'time_entries';
  }

  // Initialiser le service
  async initialize() {
    try {
      await this.db.initializeDatabase();
      
      // Vérifier si la collection time_entries existe
      const timeEntries = await this.db.get(this.timeEntriesKey);
      if (!timeEntries) {
        await this.db.set(this.timeEntriesKey, []);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de TimeTrackingService:', error);
      throw error;
    }
  }

  // Créer une nouvelle entrée de pointage
  async createTimeEntry(timeEntryData) {
    try {
      await this.initialize();
      
      // Vérifier qu'il n'y a pas déjà un pointage pour cette date/employé/contrat
      const existingEntry = await this.getTimeEntryByDate(
        timeEntryData.employeeId, 
        timeEntryData.contractId, 
        timeEntryData.date
      );
      
      if (existingEntry) {
        throw new Error('Un pointage existe déjà pour cette date et ce contrat');
      }

      // Préparer les données avec normalisation des types
      const timeEntry = {
        id: uuidv4(),
        ...timeEntryData,
        // Forcer employeeId et clientId en string pour cohérence
        employeeId: String(timeEntryData.employeeId),
        clientId: String(timeEntryData.clientId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: timeEntryData.status || 'draft'
      };

      // Récupérer les entrées existantes
      const timeEntries = await this.db.get(this.timeEntriesKey) || [];
      
      // Ajouter la nouvelle entrée
      timeEntries.push(timeEntry);
      
      // Sauvegarder
      await this.db.set(this.timeEntriesKey, timeEntries);
      
      console.log('Pointage créé:', timeEntry);
      return timeEntry;
      
    } catch (error) {
      console.error('Erreur lors de la création du pointage:', error);
      throw error;
    }
  }

  // Obtenir toutes les entrées avec filtres
  async getTimeEntries(filters = {}) {
    try {
      await this.initialize();
      
      let timeEntries = await this.db.get(this.timeEntriesKey) || [];
      
      // Appliquer les filtres
      if (filters.employeeId) {
        timeEntries = timeEntries.filter(entry => entry.employeeId === filters.employeeId);
      }
      
      if (filters.contractId) {
        timeEntries = timeEntries.filter(entry => entry.contractId === filters.contractId);
      }
      
      if (filters.clientId) {
        timeEntries = timeEntries.filter(entry => entry.clientId === filters.clientId);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        timeEntries = timeEntries.filter(entry => new Date(entry.date) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        timeEntries = timeEntries.filter(entry => new Date(entry.date) <= endDate);
      }
      
      if (filters.status) {
        timeEntries = timeEntries.filter(entry => entry.status === filters.status);
      }
      
      if (filters.workType) {
        timeEntries = timeEntries.filter(entry => entry.workType === filters.workType);
      }
      
      // Trier par date décroissante
      timeEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return timeEntries;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des pointages:', error);
      throw error;
    }
  }

  // Obtenir un pointage par ID
  async getTimeEntryById(id) {
    try {
      await this.initialize();
      
      const timeEntries = await this.db.get(this.timeEntriesKey) || [];
      const timeEntry = timeEntries.find(entry => entry.id === id);
      
      if (!timeEntry) {
        throw new Error(`Pointage non trouvé avec l'ID: ${id}`);
      }
      
      return timeEntry;
      
    } catch (error) {
      console.error('Erreur lors de la récupération du pointage:', error);
      throw error;
    }
  }

  // Obtenir un pointage par date/employé/contrat
  async getTimeEntryByDate(employeeId, contractId, date) {
    try {
      await this.initialize();
      
      const timeEntries = await this.db.get(this.timeEntriesKey) || [];
      return timeEntries.find(entry => 
        entry.employeeId === employeeId && 
        entry.contractId === contractId && 
        entry.date === date
      );
      
    } catch (error) {
      console.error('Erreur lors de la recherche du pointage par date:', error);
      throw error;
    }
  }

  // Mettre à jour un pointage
  async updateTimeEntry(id, updateData) {
    try {
      await this.initialize();
      
      const timeEntries = await this.db.get(this.timeEntriesKey) || [];
      const index = timeEntries.findIndex(entry => entry.id === id);
      
      if (index === -1) {
        throw new Error(`Pointage non trouvé avec l'ID: ${id}`);
      }
      
      // Vérifier que le pointage peut être modifié
      if (timeEntries[index].status === 'invoiced') {
        throw new Error('Impossible de modifier un pointage facturé');
      }
      
      // Mettre à jour les données avec normalisation des types
      const normalizedUpdateData = { ...updateData };
      
      // Forcer employeeId et clientId en string si présents dans updateData
      if (normalizedUpdateData.employeeId) {
        normalizedUpdateData.employeeId = String(normalizedUpdateData.employeeId);
      }
      if (normalizedUpdateData.clientId) {
        normalizedUpdateData.clientId = String(normalizedUpdateData.clientId);
      }
      
      timeEntries[index] = {
        ...timeEntries[index],
        ...normalizedUpdateData,
        updatedAt: new Date().toISOString()
      };
      
      // Sauvegarder
      await this.db.set(this.timeEntriesKey, timeEntries);
      
      console.log('Pointage mis à jour:', timeEntries[index]);
      return timeEntries[index];
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du pointage:', error);
      throw error;
    }
  }

  // Supprimer un pointage
  async deleteTimeEntry(id) {
    try {
      await this.initialize();
      
      const timeEntries = await this.db.get(this.timeEntriesKey) || [];
      const entryToDelete = timeEntries.find(entry => entry.id === id);
      
      if (!entryToDelete) {
        throw new Error(`Pointage non trouvé avec l'ID: ${id}`);
      }
      
      // Vérifier que le pointage peut être supprimé
      if (entryToDelete.status === 'invoiced') {
        throw new Error('Impossible de supprimer un pointage facturé');
      }
      
      // Filtrer pour supprimer l'entrée
      const filteredEntries = timeEntries.filter(entry => entry.id !== id);
      
      // Sauvegarder
      await this.db.set(this.timeEntriesKey, filteredEntries);
      
      console.log('Pointage supprimé:', id);
      return { success: true };
      
    } catch (error) {
      console.error('Erreur lors de la suppression du pointage:', error);
      throw error;
    }
  }

  // Valider un pointage
  async validateTimeEntry(id) {
    try {
      const timeEntry = await this.getTimeEntryById(id);
      
      if (timeEntry.status !== 'draft') {
        throw new Error('Seuls les pointages en brouillon peuvent être validés');
      }
      
      return await this.updateTimeEntry(id, {
        status: 'validated',
        validatedAt: new Date().toISOString(),
        validatedBy: 'admin' // À adapter selon votre système d'authentification
      });
      
    } catch (error) {
      console.error('Erreur lors de la validation du pointage:', error);
      throw error;
    }
  }

  // Marquer un pointage comme facturé
  async markAsInvoiced(id, invoiceId = null) {
    try {
      const timeEntry = await this.getTimeEntryById(id);
      
      if (timeEntry.status !== 'validated') {
        throw new Error('Seuls les pointages validés peuvent être facturés');
      }
      
      return await this.updateTimeEntry(id, {
        status: 'invoiced',
        invoicedAt: new Date().toISOString(),
        invoiceId: invoiceId
      });
      
    } catch (error) {
      console.error('Erreur lors du marquage en facturé:', error);
      throw error;
    }
  }

  // Marquer plusieurs pointages comme facturés
  async markMultipleAsInvoiced(timeEntryIds, invoiceId = null) {
    try {
      const results = [];
      
      for (const id of timeEntryIds) {
        try {
          const result = await this.markAsInvoiced(id, invoiceId);
          results.push({ id, success: true, entry: result });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Erreur lors du marquage multiple en facturé:', error);
      throw error;
    }
  }

  // Obtenir les statistiques d'un employé pour une période
  async getEmployeeStats(employeeId, startDate, endDate) {
    try {
      const timeEntries = await this.getTimeEntries({
        employeeId,
        startDate,
        endDate
      });
      
      const stats = timeEntries.reduce((acc, entry) => {
        acc.totalHours += entry.totalHours || 0;
        acc.normalHours += entry.normalHours || 0;
        acc.overtimeHours += entry.overtimeHours || 0;
        acc.workingDays += 1;
        
        // Grouper par type de travail
        if (!acc.workTypeBreakdown[entry.workType]) {
          acc.workTypeBreakdown[entry.workType] = 0;
        }
        acc.workTypeBreakdown[entry.workType] += entry.totalHours || 0;
        
        return acc;
      }, {
        totalHours: 0,
        normalHours: 0,
        overtimeHours: 0,
        workingDays: 0,
        workTypeBreakdown: {}
      });
      
      stats.averageHoursPerDay = stats.workingDays > 0 ? stats.totalHours / stats.workingDays : 0;
      
      return stats;
      
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques employé:', error);
      throw error;
    }
  }

  // Obtenir les pointages pour facturation (par période et employé)
  async getTimeEntriesForInvoicing(employeeId, startDate, endDate, contractId = null) {
    try {
      const filters = {
        employeeId,
        startDate,
        endDate,
        status: 'validated' // Seuls les pointages validés peuvent être facturés
      };
      
      if (contractId) {
        filters.contractId = contractId;
      }
      
      const timeEntries = await this.getTimeEntries(filters);
      
      // Calculer les totaux pour la facturation
      const totals = timeEntries.reduce((acc, entry) => {
        acc.totalHours += entry.totalHours || 0;
        acc.normalHours += entry.normalHours || 0;
        acc.overtimeHours += entry.overtimeHours || 0;
        acc.workingDays += 1;
        
        // Calculer les montants si les taux sont disponibles
        if (entry.hourlyRate) {
          acc.normalAmount += (entry.normalHours || 0) * entry.hourlyRate;
          acc.overtimeAmount += (entry.overtimeHours || 0) * entry.hourlyRate * 1.25; // 25% de majoration
        }
        
        if (entry.billingRate) {
          acc.billingNormalAmount += (entry.normalHours || 0) * entry.billingRate;
          acc.billingOvertimeAmount += (entry.overtimeHours || 0) * entry.billingRate * 1.25;
        }
        
        return acc;
      }, {
        totalHours: 0,
        normalHours: 0,
        overtimeHours: 0,
        workingDays: 0,
        normalAmount: 0,
        overtimeAmount: 0,
        billingNormalAmount: 0,
        billingOvertimeAmount: 0
      });
      
      totals.totalAmount = totals.normalAmount + totals.overtimeAmount;
      totals.totalBillingAmount = totals.billingNormalAmount + totals.billingOvertimeAmount;
      
      return {
        timeEntries,
        totals,
        period: {
          startDate,
          endDate,
          employeeId,
          contractId
        }
      };
      
    } catch (error) {
      console.error('Erreur lors de la récupération des pointages pour facturation:', error);
      throw error;
    }
  }

  // Obtenir les pointages par contrat pour une période
  async getTimeEntriesByContract(contractId, startDate, endDate) {
    try {
      return await this.getTimeEntries({
        contractId,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des pointages par contrat:', error);
      throw error;
    }
  }

  // Obtenir les pointages par client pour une période
  async getTimeEntriesByClient(clientId, startDate, endDate) {
    try {
      return await this.getTimeEntries({
        clientId,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des pointages par client:', error);
      throw error;
    }
  }

  // Calculer les heures travaillées entre deux heures
  calculateHours(startTime, endTime, breakDuration = 0) {
    try {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      const totalMinutes = endMinutes - startMinutes - breakDuration;
      const totalHours = Math.max(totalMinutes / 60, 0);
      
      // Calculer les heures supplémentaires (au-delà de 8h par jour)
      const normalHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(totalHours - 8, 0);
      
      return {
        totalHours: Math.round(totalHours * 100) / 100,
        normalHours: Math.round(normalHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100
      };
    } catch (error) {
      console.error('Erreur lors du calcul des heures:', error);
      return { totalHours: 0, normalHours: 0, overtimeHours: 0 };
    }
  }

  // Valider les données d'un pointage
  validateTimeEntryData(data) {
    const errors = {};
    
    // Vérifier les champs obligatoires
    if (!data.employeeId) {
      errors.employeeId = 'L\'ID de l\'employé est obligatoire';
    }
    
    if (!data.contractId) {
      errors.contractId = 'L\'ID du contrat est obligatoire';
    }
    
    if (!data.date) {
      errors.date = 'La date est obligatoire';
    }
    
    if (!data.startTime) {
      errors.startTime = 'L\'heure de début est obligatoire';
    }
    
    if (!data.endTime) {
      errors.endTime = 'L\'heure de fin est obligatoire';
    }
    
    // Vérifier la cohérence des heures
    if (data.startTime && data.endTime) {
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        errors.endTime = 'L\'heure de fin doit être postérieure à l\'heure de début';
      }
    }
    
    // Vérifier la durée de pause
    if (data.breakDuration && (data.breakDuration < 0 || data.breakDuration > 480)) {
      errors.breakDuration = 'La durée de pause doit être entre 0 et 480 minutes';
    }
    
    // Vérifier la date (pas dans le futur)
    if (data.date) {
      const entryDate = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (entryDate > today) {
        errors.date = 'La date ne peut pas être dans le futur';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Export des données pour sauvegarde
  async exportTimeEntries() {
    try {
      await this.initialize();
      
      const timeEntries = await this.db.get(this.timeEntriesKey) || [];
      
      return {
        timeEntries,
        exportDate: new Date().toISOString(),
        count: timeEntries.length
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'export des pointages:', error);
      throw error;
    }
  }

  // Import des données depuis une sauvegarde
  async importTimeEntries(importData) {
    try {
      await this.initialize();
      
      if (!importData.timeEntries || !Array.isArray(importData.timeEntries)) {
        throw new Error('Données d\'import invalides');
      }
      
      // Fusionner avec les données existantes (éviter les doublons par ID)
      const existingEntries = await this.db.get(this.timeEntriesKey) || [];
      const existingIds = new Set(existingEntries.map(entry => entry.id));
      
      const newEntries = importData.timeEntries.filter(entry => !existingIds.has(entry.id));
      const mergedEntries = [...existingEntries, ...newEntries];
      
      await this.db.set(this.timeEntriesKey, mergedEntries);
      
      return {
        success: true,
        imported: newEntries.length,
        existing: existingEntries.length,
        total: mergedEntries.length
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'import des pointages:', error);
      throw error;
    }
  }

  // Nettoyer les données (supprimer les pointages orphelins, etc.)
  async cleanupTimeEntries() {
    try {
      await this.initialize();
      
      const timeEntries = await this.db.get(this.timeEntriesKey) || [];
      let cleanedCount = 0;
      
      // Ici, vous pourriez ajouter la logique pour vérifier
      // que les employés et contrats référencés existent encore
      // et supprimer les entrées orphelines
      
      // Pour l'instant, on ne fait qu'un nettoyage basique
      const validEntries = timeEntries.filter(entry => {
        const isValid = entry.id && entry.employeeId && entry.contractId && entry.date;
        if (!isValid) cleanedCount++;
        return isValid;
      });
      
      if (cleanedCount > 0) {
        await this.db.set(this.timeEntriesKey, validEntries);
        console.log(`${cleanedCount} pointages invalides supprimés`);
      }
      
      return {
        success: true,
        cleanedCount,
        remainingCount: validEntries.length
      };
      
    } catch (error) {
      console.error('Erreur lors du nettoyage des pointages:', error);
      throw error;
    }
  }
}

// Exporter une instance unique du service
export default new TimeTrackingService();