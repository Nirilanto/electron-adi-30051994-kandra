// src/modules/timetracking/TimeTrackingService.js
// Pointages : les données sont désormais stockées en base via l'API.
import ApiClient from '../../services/ApiClient';
import DatabaseService from '../../services/DatabaseService';

class TimeTrackingService {
  constructor() {
    this.db = DatabaseService;
    this.timeEntriesKey = 'time_entries';
  }

  // Initialiser le service
  async initialize() {
    return true;
  }

  // Créer une nouvelle entrée de pointage
  async createTimeEntry(timeEntryData) {
    try {
      // Vérifier qu'il n'y a pas déjà un pointage pour cette date/employé/contrat
      const existingEntry = await this.getTimeEntryByDate(
        timeEntryData.employeeId,
        timeEntryData.contractId,
        timeEntryData.date
      );

      if (existingEntry) {
        throw new Error('Un pointage existe déjà pour cette date et ce contrat');
      }

      const timeEntry = await ApiClient.post('/time-entries', {
        ...timeEntryData,
        employeeId: String(timeEntryData.employeeId),
        clientId: String(timeEntryData.clientId),
        status: timeEntryData.status || 'draft',
      });

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
      const params = {};
      ['employeeId', 'contractId', 'clientId', 'startDate', 'endDate', 'status', 'workType'].forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params[key] = filters[key];
        }
      });
      const entries = await ApiClient.get('/time-entries', params);
      return Array.isArray(entries) ? entries : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des pointages:', error);
      throw error;
    }
  }

  // Obtenir un pointage par ID
  async getTimeEntryById(id) {
    try {
      return await ApiClient.get(`/time-entries/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Pointage non trouvé avec l'ID: ${id}`);
      }
      console.error('Erreur lors de la récupération du pointage:', error);
      throw error;
    }
  }

  // Obtenir un pointage par date/employé/contrat
  async getTimeEntryByDate(employeeId, contractId, date) {
    try {
      if (!employeeId || !contractId || !date) return undefined;
      const entry = await ApiClient.get('/time-entries/lookup', { employeeId, contractId, date });
      return entry || undefined;
    } catch (error) {
      console.error('Erreur lors de la recherche du pointage par date:', error);
      throw error;
    }
  }

  // Mettre à jour un pointage
  async updateTimeEntry(id, updateData) {
    try {
      const normalizedUpdateData = { ...updateData };
      if (normalizedUpdateData.employeeId) {
        normalizedUpdateData.employeeId = String(normalizedUpdateData.employeeId);
      }
      if (normalizedUpdateData.clientId) {
        normalizedUpdateData.clientId = String(normalizedUpdateData.clientId);
      }
      const updated = await ApiClient.patch(`/time-entries/${encodeURIComponent(id)}`, normalizedUpdateData);
      console.log('Pointage mis à jour:', updated);
      return updated;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du pointage:', error);
      throw error;
    }
  }

  // Supprimer un pointage
  async deleteTimeEntry(id) {
    try {
      await ApiClient.delete(`/time-entries/${encodeURIComponent(id)}`);
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
        validatedBy: 'admin', // À adapter selon votre système d'authentification
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
        invoiceId: invoiceId,
      });
    } catch (error) {
      console.error('Erreur lors du marquage en facturé:', error);
      throw error;
    }
  }

  // Marquer plusieurs pointages comme facturés
  async markMultipleAsInvoiced(timeEntryIds, invoiceId = null) {
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
  }

  // Obtenir les statistiques d'un employé pour une période
  async getEmployeeStats(employeeId, startDate, endDate) {
    try {
      const timeEntries = await this.getTimeEntries({ employeeId, startDate, endDate });

      const stats = timeEntries.reduce(
        (acc, entry) => {
          acc.totalHours += entry.totalHours || 0;
          acc.normalHours += entry.normalHours || 0;
          acc.overtimeHours += entry.overtimeHours || 0;
          acc.workingDays += 1;
          if (!acc.workTypeBreakdown[entry.workType]) {
            acc.workTypeBreakdown[entry.workType] = 0;
          }
          acc.workTypeBreakdown[entry.workType] += entry.totalHours || 0;
          return acc;
        },
        { totalHours: 0, normalHours: 0, overtimeHours: 0, workingDays: 0, workTypeBreakdown: {} }
      );

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
      const filters = { employeeId, startDate, endDate, status: 'validated' };
      if (contractId) filters.contractId = contractId;

      const timeEntries = await this.getTimeEntries(filters);

      const totals = timeEntries.reduce(
        (acc, entry) => {
          acc.totalHours += entry.totalHours || 0;
          acc.normalHours += entry.normalHours || 0;
          acc.overtimeHours += entry.overtimeHours || 0;
          acc.workingDays += 1;
          if (entry.hourlyRate) {
            acc.normalAmount += (entry.normalHours || 0) * entry.hourlyRate;
            acc.overtimeAmount += (entry.overtimeHours || 0) * entry.hourlyRate * 1.25;
          }
          if (entry.billingRate) {
            acc.billingNormalAmount += (entry.normalHours || 0) * entry.billingRate;
            acc.billingOvertimeAmount += (entry.overtimeHours || 0) * entry.billingRate * 1.25;
          }
          return acc;
        },
        {
          totalHours: 0,
          normalHours: 0,
          overtimeHours: 0,
          workingDays: 0,
          normalAmount: 0,
          overtimeAmount: 0,
          billingNormalAmount: 0,
          billingOvertimeAmount: 0,
        }
      );

      totals.totalAmount = totals.normalAmount + totals.overtimeAmount;
      totals.totalBillingAmount = totals.billingNormalAmount + totals.billingOvertimeAmount;

      return { timeEntries, totals, period: { startDate, endDate, employeeId, contractId } };
    } catch (error) {
      console.error('Erreur lors de la récupération des pointages pour facturation:', error);
      throw error;
    }
  }

  // Obtenir les pointages par contrat pour une période
  async getTimeEntriesByContract(contractId, startDate, endDate) {
    return this.getTimeEntries({ contractId, startDate, endDate });
  }

  // Obtenir les pointages par client pour une période
  async getTimeEntriesByClient(clientId, startDate, endDate) {
    return this.getTimeEntries({ clientId, startDate, endDate });
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

      const normalHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(totalHours - 8, 0);

      return {
        totalHours: Math.round(totalHours * 100) / 100,
        normalHours: Math.round(normalHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des heures:', error);
      return { totalHours: 0, normalHours: 0, overtimeHours: 0 };
    }
  }

  // Valider les données d'un pointage
  validateTimeEntryData(data) {
    const errors = {};

    if (!data.employeeId) errors.employeeId = "L'ID de l'employé est obligatoire";
    if (!data.contractId) errors.contractId = "L'ID du contrat est obligatoire";
    if (!data.date) errors.date = 'La date est obligatoire';
    if (!data.startTime) errors.startTime = "L'heure de début est obligatoire";
    if (!data.endTime) errors.endTime = "L'heure de fin est obligatoire";

    if (data.startTime && data.endTime) {
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      if (endHour * 60 + endMin <= startHour * 60 + startMin) {
        errors.endTime = "L'heure de fin doit être postérieure à l'heure de début";
      }
    }

    if (data.breakDuration && (data.breakDuration < 0 || data.breakDuration > 480)) {
      errors.breakDuration = 'La durée de pause doit être entre 0 et 480 minutes';
    }

    if (data.date) {
      const entryDate = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (entryDate > today) {
        errors.date = 'La date ne peut pas être dans le futur';
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  // Export des données pour sauvegarde
  async exportTimeEntries() {
    const timeEntries = await this.getTimeEntries();
    return { timeEntries, exportDate: new Date().toISOString(), count: timeEntries.length };
  }

  // Import des données depuis une sauvegarde
  async importTimeEntries(importData) {
    if (!importData.timeEntries || !Array.isArray(importData.timeEntries)) {
      throw new Error("Données d'import invalides");
    }
    return ApiClient.post('/time-entries/import', { timeEntries: importData.timeEntries });
  }

  // Nettoyer les données (pointages incomplets)
  async cleanupTimeEntries() {
    return ApiClient.post('/time-entries/cleanup');
  }
}

// Exporter une instance unique du service
export default new TimeTrackingService();
