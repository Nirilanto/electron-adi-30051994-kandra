// src/modules/timetracking/GlobalTimeTracking.js
import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';

// Services
import TimeTrackingService from './TimeTrackingService';
import ContractService from '../contracts/ContractService';
import EmployeeService from '../employees/EmployeeService';

const GlobalTimeTracking = () => {
  // États principaux
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeContracts, setActiveContracts] = useState([]);
  const [timeEntries, setTimeEntries] = useState({});
  const [employees, setEmployees] = useState({});
  const [clients, setClients] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showValidatedOnly, setShowValidatedOnly] = useState(false);

  // Statistiques du jour
  const [dailyStats, setDailyStats] = useState({
    totalEmployees: 0,
    workingEmployees: 0,
    totalHours: 0,
    validatedEntries: 0,
    pendingEntries: 0
  });

  // Chargement initial des données
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Charger toutes les données nécessaires
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les contrats actifs pour la date sélectionnée
      const contracts = await ContractService.getAllContracts();
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const activeContractsForDate = contracts.filter(contract => {
        const startDate = new Date(contract.startDate);
        const endDate = new Date(contract.endDate);
        const checkDate = new Date(selectedDate);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        checkDate.setHours(0, 0, 0, 0);
        
        return checkDate >= startDate && checkDate <= endDate;
      });

      setActiveContracts(activeContractsForDate);

      // Charger les pointages pour cette date
      const entries = await TimeTrackingService.getTimeEntries({
        startDate: dateStr,
        endDate: dateStr
      });

      // Organiser les pointages par employé et contrat
      const entriesByEmployee = {};
      entries.forEach(entry => {
        const key = `${entry.employeeId}_${entry.contractId}`;
        entriesByEmployee[key] = entry;
      });

      setTimeEntries(entriesByEmployee);

      // Créer les dictionnaires d'employés et clients
      const employeesDict = {};
      const clientsDict = {};
      
      activeContractsForDate.forEach(contract => {
        if (contract.employee) {
          employeesDict[contract.employeeId] = contract.employee;
        }
        if (contract.client) {
          clientsDict[contract.clientId] = contract.client;
        }
      });

      setEmployees(employeesDict);
      setClients(clientsDict);

      // Calculer les statistiques
      calculateDailyStats(activeContractsForDate, entries);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques du jour
  const calculateDailyStats = (contracts, entries) => {
    const stats = {
      totalEmployees: new Set(contracts.map(c => c.employeeId)).size,
      workingEmployees: entries.length,
      totalHours: entries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0),
      validatedEntries: entries.filter(e => e.status === 'validated' || e.status === 'invoiced').length,
      pendingEntries: entries.filter(e => e.status === 'draft').length
    };

    setDailyStats(stats);
  };

  // Navigation entre les dates
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Aller à aujourd'hui
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Sauvegarder un pointage
  const saveTimeEntry = async (contract, hours, notes = '') => {
    if (!hours || hours <= 0) return;

    const employeeContractKey = `${contract.employeeId}_${contract.id}`;
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    setIsSaving(prev => ({ ...prev, [employeeContractKey]: true }));

    try {
      const normalHours = Math.min(hours, 8);
      const overtimeHours = Math.max(hours - 8, 0);

      const timeEntryData = {
        employeeId: contract.employeeId,
        contractId: contract.id,
        clientId: contract.clientId,
        date: dateStr,
        totalHours: parseFloat(hours),
        normalHours,
        overtimeHours,
        hourlyRate: contract.hourlyRate || 0,
        billingRate: contract.billingRate || 0,
        workType: 'normal',
        notes,
        status: 'draft'
      };

      // Vérifier s'il existe déjà un pointage
      const existingEntry = timeEntries[employeeContractKey];

      if (existingEntry) {
        if (existingEntry.status === 'invoiced') {
          toast.error('Impossible de modifier un pointage facturé');
          return;
        }
        await TimeTrackingService.updateTimeEntry(existingEntry.id, timeEntryData);
      } else {
        await TimeTrackingService.createTimeEntry(timeEntryData);
      }

      // Recharger les données
      await loadData();
      toast.success('Pointage sauvegardé');

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(prev => ({ ...prev, [employeeContractKey]: false }));
    }
  };

  // Valider un pointage
  const validateTimeEntry = async (contract) => {
    const employeeContractKey = `${contract.employeeId}_${contract.id}`;
    const entry = timeEntries[employeeContractKey];

    if (!entry) {
      toast.error('Aucun pointage à valider');
      return;
    }

    if (entry.status === 'invoiced') {
      toast.error('Ce pointage est déjà facturé');
      return;
    }

    try {
      await TimeTrackingService.validateTimeEntry(entry.id);
      await loadData();
      toast.success('Pointage validé');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  // Obtenir les heures par défaut depuis le contrat
  const getDefaultHours = (contract) => {
    if (!contract?.workingHours) return 8;

    try {
      const match = contract.workingHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (match) {
        const [, startH, startM, endH, endM] = match;
        const startMinutes = parseInt(startH) * 60 + parseInt(startM);
        const endMinutes = parseInt(endH) * 60 + parseInt(endM);
        const totalMinutes = endMinutes - startMinutes;
        return Math.max(totalMinutes / 60, 0);
      }
    } catch (error) {
      console.error('Erreur lors du parsing des horaires:', error);
    }

    return 8;
  };

  // Filtrer les contrats selon la recherche et les filtres
  const filteredContracts = activeContracts.filter(contract => {
    const employee = employees[contract.employeeId];
    const client = clients[contract.clientId];
    const employeeContractKey = `${contract.employeeId}_${contract.id}`;
    const entry = timeEntries[employeeContractKey];

    // Filtre de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const employeeName = `${employee?.firstName || ''} ${employee?.lastName || ''}`.toLowerCase();
      const clientName = (client?.companyName || '').toLowerCase();
      const contractTitle = (contract.title || '').toLowerCase();

      if (!employeeName.includes(searchLower) && 
          !clientName.includes(searchLower) && 
          !contractTitle.includes(searchLower)) {
        return false;
      }
    }

    // Filtre de statut
    if (statusFilter !== 'all') {
      if (statusFilter === 'with-entry' && !entry) return false;
      if (statusFilter === 'without-entry' && entry) return false;
      if (statusFilter === 'validated' && (!entry || (entry.status !== 'validated' && entry.status !== 'invoiced'))) return false;
      if (statusFilter === 'pending' && (!entry || entry.status !== 'draft')) return false;
    }

    // Filtre "validés seulement"
    if (showValidatedOnly && (!entry || (entry.status !== 'validated' && entry.status !== 'invoiced'))) {
      return false;
    }

    return true;
  });

  // Composant pour une ligne de pointage
  const TimeEntryRow = ({ contract }) => {
    const employee = employees[contract.employeeId];
    const client = clients[contract.clientId];
    const employeeContractKey = `${contract.employeeId}_${contract.id}`;
    const entry = timeEntries[employeeContractKey];
    const defaultHours = getDefaultHours(contract);
    const isSavingEntry = isSaving[employeeContractKey];

    const [hours, setHours] = useState(entry?.totalHours || 0);
    const [notes, setNotes] = useState(entry?.notes || '');

    const getStatusBadge = () => {
      if (!entry) {
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Absent</span>;
      }

      switch (entry.status) {
        case 'validated':
          return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Validé</span>;
        case 'invoiced':
          return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Facturé</span>;
        default:
          return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Brouillon</span>;
      }
    };

    const getStatusIcon = () => {
      if (!entry) return null;
      
      switch (entry.status) {
        case 'validated':
          return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
        case 'invoiced':
          return <DocumentTextIcon className="h-4 w-4 text-blue-600" />;
        default:
          return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
      }
    };

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {getStatusIcon()}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {employee?.firstName} {employee?.lastName}
              </div>
              <div className="text-xs text-gray-500">
                {employee?.skills || 'Aucune compétence'}
              </div>
            </div>
          </div>
        </td>

        <td className="px-4 py-3">
          <div className="text-sm text-gray-900">{client?.companyName || 'Client inconnu'}</div>
          <div className="text-xs text-gray-500">{contract.title}</div>
        </td>

        <td className="px-4 py-3">
          <div className="text-sm text-gray-600">{contract.workingHours || '8h-17h'}</div>
          <div className="text-xs text-gray-500">Défaut: {defaultHours}h</div>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              max="24"
              step="0.5"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={entry?.status === 'invoiced'}
              placeholder="0h"
            />
            <button
              onClick={() => setHours(defaultHours)}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
              disabled={entry?.status === 'invoiced'}
              title={`${defaultHours}h par défaut`}
            >
              {defaultHours}h
            </button>
          </div>
          {hours > 8 && (
            <div className="text-xs text-orange-600 mt-1">
              +{(hours - 8).toFixed(1)}h sup.
            </div>
          )}
        </td>

        <td className="px-4 py-3">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={entry?.status === 'invoiced'}
            placeholder="Notes..."
          />
        </td>

        <td className="px-4 py-3">
          {getStatusBadge()}
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            {entry?.status !== 'invoiced' && (
              <>
                <button
                  onClick={() => saveTimeEntry(contract, hours, notes)}
                  disabled={isSavingEntry || !hours || hours <= 0}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingEntry ? '...' : 'Sauver'}
                </button>

                {entry && entry.status === 'draft' && (
                  <button
                    onClick={() => validateTimeEntry(contract)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    title="Valider"
                  >
                    ✓
                  </button>
                )}
              </>
            )}

            {entry?.status === 'invoiced' && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Facturé
              </span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement des pointages...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
          <ClockIcon className="h-6 w-6 mr-2 text-blue-600" />
          Pointage Global
        </h1>

        {/* Navigation de date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate(-1)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Jour précédent
            </button>

            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <DatePicker
                selected={selectedDate}
                onChange={setSelectedDate}
                dateFormat="dd/MM/yyyy"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => navigateDate(1)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
            >
              Jour suivant
              <ChevronRightIcon className="h-5 w-5 ml-1" />
            </button>

            <button
              onClick={goToToday}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>

          <button
            onClick={loadData}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5 mr-1" />
            Actualiser
          </button>
        </div>

        {/* Statistiques du jour */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-sm text-blue-600">Employés total</div>
            <div className="text-xl font-bold text-blue-700">{dailyStats.totalEmployees}</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-sm text-green-600">Au travail</div>
            <div className="text-xl font-bold text-green-700">{dailyStats.workingEmployees}</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-sm text-purple-600">Total heures</div>
            <div className="text-xl font-bold text-purple-700">{dailyStats.totalHours.toFixed(1)}h</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-sm text-green-600">Validés</div>
            <div className="text-xl font-bold text-green-700">{dailyStats.validatedEntries}</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-sm text-yellow-600">En attente</div>
            <div className="text-xl font-bold text-yellow-700">{dailyStats.pendingEntries}</div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher employé, client..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre de statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="with-entry">Avec pointage</option>
            <option value="without-entry">Sans pointage</option>
            <option value="validated">Validés</option>
            <option value="pending">En attente</option>
          </select>

          {/* Case à cocher pour validés seulement */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showValidatedOnly}
              onChange={(e) => setShowValidatedOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Validés seulement</span>
          </label>

          {/* Info résultats */}
          <div className="text-sm text-gray-600 flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            {filteredContracts.length} contrat(s) affiché(s)
          </div>
        </div>
      </div>

      {/* Tableau des pointages */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client / Mission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horaires
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heures
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Aucun contrat actif trouvé pour cette date
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <TimeEntryRow
                    key={`${contract.employeeId}_${contract.id}`}
                    contract={contract}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GlobalTimeTracking;