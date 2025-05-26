// src/modules/contracts/components/ContractTimeTrackingTab.js
import React, { useState, useEffect } from 'react';
import { 
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Services
import TimeTrackingService from '../../timetracking/TimeTrackingService';
import EmployeeService from '../../employees/EmployeeService';
import ClientService from '../../clients/ClientService';

const ContractTimeTrackingTab = ({ contract }) => {
  // États principaux
  const [contractEmployee, setContractEmployee] = useState(null);
  const [contractClient, setContractClient] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [weeklyTimeEntries, setWeeklyTimeEntries] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState({});

  // Statistiques de la semaine pour ce contrat
  const [weeklyStats, setWeeklyStats] = useState({
    totalHours: 0,
    validatedDays: 0,
    pendingDays: 0,
    totalCost: 0,
    totalRevenue: 0,
    workingDays: 0
  });

  // Chargement initial
  useEffect(() => {
    loadContractDetails();
  }, [contract.id]);

  // Chargement des données quand la semaine change
  useEffect(() => {
    if (currentWeekStart && contractEmployee) {
      loadWeeklyTimeEntries();
    }
  }, [currentWeekStart, contractEmployee]);

  // Initialiser la semaine courante
  useEffect(() => {
    const today = new Date();
    setCurrentWeekStart(getWeekStart(today));
  }, []);

  // Charger les détails du contrat (employé + client)
  const loadContractDetails = async () => {
    try {
      setIsLoading(true);
      
      // Charger l'employé du contrat
      if (contract.employeeId) {
        const employee = await EmployeeService.getEmployeeById(contract.employeeId);
        setContractEmployee(employee);
      }
      
      // Charger le client du contrat
      if (contract.clientId) {
        const client = await ClientService.getClientById(contract.clientId);
        setContractClient(client);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir le début de semaine (lundi)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Obtenir les 7 jours de la semaine
  const getWeekDays = (weekStart) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Navigation entre les semaines
  const navigateWeek = (direction) => {
    if (!currentWeekStart) return;
    
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newWeekStart);
  };

  // Charger les pointages de la semaine pour ce contrat
  const loadWeeklyTimeEntries = async () => {
    try {
      if (!contractEmployee) return;
      
      const weekDays = getWeekDays(currentWeekStart);
      const weekEnd = weekDays[6];
      
      // Récupérer les pointages pour ce contrat uniquement
      const timeEntries = await TimeTrackingService.getTimeEntries({
        contractId: contract.id,
        employeeId: contractEmployee.id,
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      });
      
      // Organiser par date
      const entriesByDate = {};
      timeEntries.forEach(entry => {
        entriesByDate[entry.date] = entry;
      });
      
      setWeeklyTimeEntries(entriesByDate);
      calculateWeeklyStats(timeEntries);
      
    } catch (error) {
      console.error('Erreur lors du chargement des pointages:', error);
      toast.error('Erreur lors du chargement des pointages');
    }
  };

  // Calculer les statistiques de la semaine
  const calculateWeeklyStats = (timeEntries) => {
    const stats = timeEntries.reduce((acc, entry) => {
      acc.totalHours += entry.totalHours || 0;
      acc.workingDays += 1;
      
      if (entry.status === 'validated' || entry.status === 'invoiced') {
        acc.validatedDays += 1;
      } else {
        acc.pendingDays += 1;
      }
      
      // Coût employé
      if (entry.hourlyRate) {
        acc.totalCost += (entry.totalHours || 0) * entry.hourlyRate;
      }
      
      // Revenus client
      if (entry.billingRate) {
        acc.totalRevenue += (entry.totalHours || 0) * entry.billingRate;
      }
      
      return acc;
    }, { 
      totalHours: 0, 
      workingDays: 0, 
      validatedDays: 0, 
      pendingDays: 0, 
      totalCost: 0, 
      totalRevenue: 0 
    });
    
    setWeeklyStats(stats);
  };

  // Vérifier si une date est dans la période du contrat
  const isDateInContractPeriod = (date) => {
    if (!contract) return false;
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const contractStart = new Date(contract.startDate);
    contractStart.setHours(0, 0, 0, 0);
    
    const contractEnd = new Date(contract.endDate);
    contractEnd.setHours(23, 59, 59, 999);
    
    return checkDate >= contractStart && checkDate <= contractEnd;
  };

  // Sauvegarder les heures pour un jour
  const saveTimeEntry = async (date, hours, notes = '') => {
    if (!contractEmployee) return;
    
    const dateStr = date.toISOString().split('T')[0];
    setIsSaving(prev => ({ ...prev, [dateStr]: true }));
    
    try {
      const normalHours = Math.min(hours, 8);
      const overtimeHours = Math.max(hours - 8, 0);
      
      const timeEntryData = {
        employeeId: contractEmployee.id,
        contractId: contract.id,
        clientId: contract.clientId,
        date: dateStr,
        totalHours: hours,
        normalHours,
        overtimeHours,
        hourlyRate: contract.hourlyRate || 0,
        billingRate: contract.billingRate || 0,
        workType: 'normal',
        notes,
        status: 'draft'
      };
      
      const existingEntry = weeklyTimeEntries[dateStr];
      
      if (existingEntry) {
        if (existingEntry.status === 'invoiced') {
          toast.error('Impossible de modifier un pointage facturé');
          return;
        }
        await TimeTrackingService.updateTimeEntry(existingEntry.id, timeEntryData);
      } else {
        await TimeTrackingService.createTimeEntry(timeEntryData);
      }
      
      await loadWeeklyTimeEntries();
      toast.success('Pointage sauvegardé');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(prev => ({ ...prev, [dateStr]: false }));
    }
  };

  // Valider un jour
  const validateDay = async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = weeklyTimeEntries[dateStr];
    
    if (!entry) {
      toast.error('Aucun pointage à valider pour ce jour');
      return;
    }
    
    if (entry.status === 'invoiced') {
      toast.error('Ce pointage est déjà facturé');
      return;
    }
    
    try {
      await TimeTrackingService.validateTimeEntry(entry.id);
      await loadWeeklyTimeEntries();
      toast.success('Journée validée');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  // Obtenir les heures par défaut depuis le contrat
  const getDefaultHours = () => {
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

  // Composant pour une journée
  const DayEntry = ({ date, entry }) => {
    const [hours, setHours] = useState(entry?.totalHours || 0);
    const [notes, setNotes] = useState(entry?.notes || '');
    const dateStr = date.toISOString().split('T')[0];
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const isInContractPeriod = isDateInContractPeriod(date);
    const isSavingDay = isSaving[dateStr];
    const defaultHours = getDefaultHours();
    
    if (!isInContractPeriod) {
      return (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-50">
          <div className="text-center text-gray-400">
            <div className="text-sm font-medium">
              {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
            </div>
            <div className="text-xs">
              {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
            <div className="text-xs mt-2">Hors contrat</div>
          </div>
        </div>
      );
    }
    
    const handleSave = () => {
      if (hours > 0) {
        saveTimeEntry(date, parseFloat(hours), notes);
      }
    };
    
    const handleSetDefault = () => {
      setHours(defaultHours);
    };
    
    const getStatusColor = () => {
      if (!entry) return 'border-gray-200 bg-white';
      switch (entry.status) {
        case 'validated': return 'border-green-300 bg-green-50';
        case 'invoiced': return 'border-blue-300 bg-blue-50';
        default: return 'border-yellow-300 bg-yellow-50';
      }
    };
    
    const getStatusIcon = () => {
      if (!entry) return null;
      switch (entry.status) {
        case 'validated': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
        case 'invoiced': return <DocumentTextIcon className="h-4 w-4 text-blue-600" />;
        default: return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
      }
    };
    
    return (
      <div className={`p-3 rounded-lg border ${getStatusColor()} ${isToday ? 'ring-1 ring-blue-300' : ''}`}>
        {/* En-tête du jour */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
            </div>
            <div className="text-xs text-gray-600">
              {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            {isToday && (
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Aujourd'hui"></div>
            )}
          </div>
        </div>
        
        {/* Saisie heures */}
        <div className="space-y-2">
          <div className="flex space-x-1">
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              max="24"
              step="0.5"
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={entry?.status === 'invoiced'}
              placeholder="0h"
            />
            <button
              onClick={handleSetDefault}
              className="px-2 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
              disabled={entry?.status === 'invoiced'}
              title={`${defaultHours}h par défaut`}
            >
              {defaultHours}h
            </button>
          </div>
          
          {/* Heures supplémentaires */}
          {hours > 8 && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              +{(hours - 8).toFixed(1)}h sup.
            </div>
          )}
          
          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="1"
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            disabled={entry?.status === 'invoiced'}
            placeholder="Notes..."
            onFocus={(e) => e.target.rows = 2}
            onBlur={(e) => { if (!e.target.value) e.target.rows = 1; }}
          />
          
          {/* Actions */}
          <div className="flex space-x-1">
            {entry?.status !== 'invoiced' && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSavingDay || hours <= 0}
                  className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingDay ? '...' : 'Sauver'}
                </button>
                
                {entry && entry.status === 'draft' && (
                  <button
                    onClick={() => validateDay(date)}
                    className="px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    title="Valider"
                  >
                    ✓
                  </button>
                )}
              </>
            )}
            
            {entry?.status === 'invoiced' && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-full text-center">
                Facturé
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement du contrat...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête du contrat */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
          <ClockIcon className="h-6 w-6 mr-2 text-indigo-600" />
          Pointage - {contract.title}
        </h2>
        
        {/* Informations du contrat */}
        <div className="bg-white rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Consultant</div>
            <div className="font-medium">
              {contractEmployee ? `${contractEmployee.firstName} ${contractEmployee.lastName}` : 'Non assigné'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Client</div>
            <div className="font-medium">{contractClient?.companyName || 'Non défini'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Période</div>
            <div className="font-medium">
              {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Lieu</div>
            <div className="font-medium">{contract.location || 'Non défini'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Horaires</div>
            <div className="font-medium">{contract.workingHours || '8h-17h'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Taux consultant</div>
            <div className="font-medium">{contract.hourlyRate || 0}€/h</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Taux facturation</div>
            <div className="font-medium">{contract.billingRate || 0}€/h</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Heures par défaut</div>
            <div className="font-medium">{getDefaultHours()}h/jour</div>
          </div>
        </div>
        
        {/* Description */}
        {contract.description && (
          <div className="mt-4 bg-white rounded-lg p-3">
            <div className="text-sm text-gray-600">Description de la mission</div>
            <div className="text-gray-900">{contract.description}</div>
          </div>
        )}
      </div>
      
      {!contractEmployee ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Aucun consultant assigné à ce contrat</p>
        </div>
      ) : (
        <>
          {/* Navigation semaine + statistiques */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => navigateWeek(-1)}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Semaine précédente
              </button>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Semaine du {currentWeekStart?.toLocaleDateString('fr-FR')}
                </h3>
                <div className="text-sm text-gray-600">
                  {currentWeekStart && (
                    <>
                      {currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {
                        (() => {
                          const weekEnd = new Date(currentWeekStart);
                          weekEnd.setDate(weekEnd.getDate() + 6);
                          return weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                        })()
                      }
                    </>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => navigateWeek(1)}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Semaine suivante
                <ChevronRightIcon className="h-5 w-5 ml-1" />
              </button>
            </div>
            
            {/* Statistiques de la semaine */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-sm text-blue-600">Total heures</div>
                <div className="text-xl font-bold text-blue-700">{weeklyStats.totalHours.toFixed(1)}h</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-sm text-purple-600">Jours travaillés</div>
                <div className="text-xl font-bold text-purple-700">{weeklyStats.workingDays}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-sm text-green-600">Jours validés</div>
                <div className="text-xl font-bold text-green-700">{weeklyStats.validatedDays}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-sm text-yellow-600">En attente</div>
                <div className="text-xl font-bold text-yellow-700">{weeklyStats.pendingDays}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-sm text-orange-600">Coût</div>
                <div className="text-xl font-bold text-orange-700">{weeklyStats.totalCost.toFixed(0)}€</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-sm text-emerald-600">Revenus</div>
                <div className="text-xl font-bold text-emerald-700">{weeklyStats.totalRevenue.toFixed(0)}€</div>
              </div>
            </div>
          </div>
          
          {/* Grille des jours */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Pointage de {contractEmployee.firstName} {contractEmployee.lastName}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {getWeekDays(currentWeekStart).map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const entry = weeklyTimeEntries[dateStr];
                
                return (
                  <DayEntry
                    key={dateStr}
                    date={date}
                    entry={entry}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContractTimeTrackingTab;