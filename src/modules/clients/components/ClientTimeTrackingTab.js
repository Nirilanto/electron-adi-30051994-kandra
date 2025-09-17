// src/modules/clients/components/ClientTimeTrackingTab.js
import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Services
import TimeTrackingService from '../../timetracking/TimeTrackingService';
import ContractService from '../../contracts/ContractService';
import EmployeeService from '../../employees/EmployeeService';

const ClientTimeTrackingTab = ({ client }) => {
  // États principaux
  const [clientContracts, setClientContracts] = useState([]);
  const [employeesWithContracts, setEmployeesWithContracts] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [weeklyTimeEntries, setWeeklyTimeEntries] = useState({}); // Par employé
  const [expandedEmployees, setExpandedEmployees] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState({});
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' ou 'simple'
  const [editMode, setEditMode] = useState(false); // Mode édition pour le tableau
  const [pendingChanges, setPendingChanges] = useState({}); // Changements en attente

  // Sélecteur de semaine simple
  const [showWeekSelector, setShowWeekSelector] = useState(false);

  // Statistiques globales de la semaine
  const [weeklyStats, setWeeklyStats] = useState({
    totalHours: 0,
    totalEmployees: 0,
    totalContracts: 0,
    validatedDays: 0,
    pendingDays: 0,
    totalCost: 0
  });

  // Chargement initial
  useEffect(() => {
    loadClientData();
  }, [client.id]);

  // Chargement des données quand la semaine change
  useEffect(() => {
    if (currentWeekStart) {
      loadContractsForWeek();
    }
  }, [currentWeekStart]);

  // Charger les contrats et employés pour la semaine en cours
  const loadContractsForWeek = async () => {
    if (!currentWeekStart) return;

    try {
      setIsLoading(true);

      // Calculer la fin de la semaine
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Charger tous les contrats du client
      const allContracts = await ContractService.getAllContracts();
      const clientContracts = allContracts.filter(contract => contract.clientId == client.id);

      // Filtrer les contrats actifs pendant cette semaine
      const activeContractsThisWeek = clientContracts.filter(contract => {
        const contractStart = new Date(contract.startDate);
        const contractEnd = new Date(contract.endDate);

        // Vérifier si le contrat est actif pendant cette semaine
        return contractStart <= weekEnd && contractEnd >= currentWeekStart;
      });

      setClientContracts(activeContractsThisWeek);

      // Charger les employés de ces contrats
      const allEmployees = await EmployeeService.getAllEmployees();
      const employeesWithContractInfo = [];

      for (const contract of activeContractsThisWeek) {
        const employee = allEmployees.find(emp => emp.id == contract.employeeId);
        if (employee) {
          employeesWithContractInfo.push({
            ...employee,
            contractInfo: {
              id: contract.id,
              title: contract.title,
              description: contract.description,
              location: contract.location,
              startDate: contract.startDate,
              endDate: contract.endDate,
              hourlyRate: contract.hourlyRate,
              billingRate: contract.billingRate,
              workingHours: contract.workingHours
            }
          });
        }
      }

      setEmployeesWithContracts(employeesWithContractInfo);

      // Charger les pointages pour cette semaine
      await loadWeeklyTimeEntries();

    } catch (error) {
      console.error('Erreur lors du chargement des contrats pour la semaine:', error);
      toast.error('Erreur lors du chargement des contrats');
    } finally {
      setIsLoading(false);
    }
  };


  // Initialiser la semaine courante
  useEffect(() => {
    const today = new Date();
    setCurrentWeekStart(getWeekStart(today));
  }, []);

  // Charger tous les contrats du client et leurs employés
  const loadClientData = async () => {
    try {
      setIsLoading(true);
      // Les contrats seront chargés par loadContractsForWeek quand currentWeekStart sera défini
    } catch (error) {
      console.error('Erreur lors du chargement initial:', error);
      toast.error('Erreur lors de l\'initialisation');
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

  // Charger les pointages de la semaine pour tous les employés
  const loadWeeklyTimeEntries = async () => {
    try {
      if (clientContracts.length === 0) {
        // Aucun contrat actif pour cette semaine
        setWeeklyTimeEntries({});
        setWeeklyStats({
          totalHours: 0,
          totalEmployees: 0,
          totalContracts: 0,
          validatedDays: 0,
          pendingDays: 0,
          totalCost: 0
        });
        return;
      }

      const weekDays = getWeekDays(currentWeekStart);
      const weekEnd = weekDays[6];

      // Récupérer tous les pointages pour tous les contrats actifs cette semaine
      const contractIds = clientContracts.map(c => c.id);
      const allTimeEntries = [];

      for (const contractId of contractIds) {
        const entries = await TimeTrackingService.getTimeEntries({
          contractId,
          startDate: currentWeekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0]
        });
        allTimeEntries.push(...entries);
      }

      // Organiser par employé puis par date
      const entriesByEmployee = {};
      employeesWithContracts.forEach(emp => {
        entriesByEmployee[emp.id] = {};
      });

      allTimeEntries.forEach(entry => {
        if (!entriesByEmployee[entry.employeeId]) {
          entriesByEmployee[entry.employeeId] = {};
        }
        entriesByEmployee[entry.employeeId][entry.date] = entry;
      });

      setWeeklyTimeEntries(entriesByEmployee);
      calculateWeeklyStats(allTimeEntries);

    } catch (error) {
      console.error('Erreur lors du chargement des pointages:', error);
      toast.error('Erreur lors du chargement des pointages');
    }
  };

  // Calculer les statistiques globales
  const calculateWeeklyStats = (timeEntries) => {
    const stats = timeEntries.reduce((acc, entry) => {
      acc.totalHours += entry.totalHours || 0;
      if (entry.status === 'validated' || entry.status === 'invoiced') {
        acc.validatedDays += 1;
      } else {
        acc.pendingDays += 1;
      }
      if (entry.billingRate) {
        acc.totalCost += (entry.totalHours || 0) * entry.billingRate;
      }
      return acc;
    }, { totalHours: 0, validatedDays: 0, pendingDays: 0, totalCost: 0 });

    stats.totalEmployees = employeesWithContracts.length;
    stats.totalContracts = clientContracts.length;
    setWeeklyStats(stats);
  };

  // Handler pour sauvegarder les pointages depuis le tableau
  const handleSaveTimeEntry = async (employeeId, contractId, date, entryData) => {
    try {
      await saveTimeEntry(employeeId, contractId, date, entryData.totalHours, entryData.notes || '');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  };

  // Gérer les changements en mode édition
  const handlePendingChange = (employeeId, contractId, day, hours) => {
    const dayKey = day.toISOString().split('T')[0];
    const changeKey = `${employeeId}_${contractId}_${dayKey}`;

    setPendingChanges(prev => ({
      ...prev,
      [changeKey]: {
        employeeId,
        contractId,
        day,
        hours: parseFloat(hours) || 0,
        dayKey
      }
    }));
  };

  // Sauvegarder tous les changements en attente
  const savePendingChanges = async () => {
    const changes = Object.values(pendingChanges);
    if (changes.length === 0) {
      toast.info('Aucun changement à sauvegarder');
      return;
    }

    setIsSaving(prev => ({ ...prev, batchSaving: true }));
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const change of changes) {
        try {
          await handleSaveTimeEntry(change.employeeId, change.contractId, change.day, {
            totalHours: change.hours,
            status: 'validated'
          });
          successCount++;
        } catch (error) {
          console.error('Erreur pour un changement:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} modification(s) sauvegardée(s)`);
        setPendingChanges({});
        await loadWeeklyTimeEntries();
      }

      if (errorCount > 0) {
        toast.warning(`${errorCount} erreur(s) lors de la sauvegarde`);
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde en lot:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(prev => ({ ...prev, batchSaving: false }));
    }
  };

  // Annuler tous les changements en attente
  const cancelPendingChanges = () => {
    setPendingChanges({});
    toast.info('Modifications annulées');
  };

  // Entrer/sortir du mode édition
  const toggleEditMode = () => {
    if (editMode && Object.keys(pendingChanges).length > 0) {
      // Demander confirmation si il y a des changements non sauvegardés
      if (window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous les perdre ?')) {
        setPendingChanges({});
        setEditMode(false);
      }
    } else {
      setEditMode(!editMode);
      if (!editMode) {
        setPendingChanges({});
      }
    }
  };

  // Vérifier si une date est dans la période du contrat d'un employé
  const isDateInContractPeriod = (date, contractInfo) => {
    if (!contractInfo) return false;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const contractStart = new Date(contractInfo.startDate);
    contractStart.setHours(0, 0, 0, 0);

    const contractEnd = new Date(contractInfo.endDate);
    contractEnd.setHours(23, 59, 59, 999);

    return checkDate >= contractStart && checkDate <= contractEnd;
  };

  // Sauvegarder les heures d'un employé pour un jour
  const saveTimeEntry = async (employeeId, contractId, date, hours, notes = '') => {
    const dateStr = date.toISOString().split('T')[0];
    const saveKey = `${employeeId}-${dateStr}`;
    setIsSaving(prev => ({ ...prev, [saveKey]: true }));

    try {
      const normalHours = Math.min(hours, 8);
      const overtimeHours = Math.max(hours - 8, 0);

      // Trouver le contrat pour récupérer les taux
      const contract = clientContracts.find(c => c.id === contractId);

      const timeEntryData = {
        employeeId,
        contractId,
        clientId: client.id,
        date: dateStr,
        totalHours: hours,
        normalHours,
        overtimeHours,
        hourlyRate: contract?.hourlyRate || 0,
        billingRate: contract?.billingRate || 0,
        workType: 'normal',
        notes,
        status: 'validated'
      };

      const existingEntry = weeklyTimeEntries[employeeId]?.[dateStr];

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
      setIsSaving(prev => ({ ...prev, [saveKey]: false }));
    }
  };

  // Valider un jour pour un employé
  const validateDay = async (employeeId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = weeklyTimeEntries[employeeId]?.[dateStr];

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

  // Obtenir les heures par défaut depuis un contrat
  const getDefaultHours = (contractInfo) => {
    if (!contractInfo?.workingHours) return 8;

    try {
      const match = contractInfo.workingHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
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

  // Toggle accordéon employé
  const toggleEmployee = (employeeId) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  // Composant pour une journée d'un employé
  const DayEntry = ({ employeeId, contractId, contractInfo, date, entry, isCompact = false }) => {
    const [hours, setHours] = useState(entry?.totalHours || 0);
    const [notes, setNotes] = useState(entry?.notes || '');
    const dateStr = date.toISOString().split('T')[0];
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const isInContractPeriod = isDateInContractPeriod(date, contractInfo);
    const saveKey = `${employeeId}-${dateStr}`;
    const isSavingDay = isSaving[saveKey];
    const defaultHours = getDefaultHours(contractInfo);

    if (!isInContractPeriod) {
      return (
        <div className="p-2 rounded bg-gray-50 border border-gray-200 opacity-50">
          <div className="text-center text-gray-400 text-xs">
            <div className="font-medium">
              {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
            </div>
            <div>{date.toLocaleDateString('fr-FR', { day: 'numeric' })}</div>
            <div className="mt-1">Hors contrat</div>
          </div>
        </div>
      );
    }

    const handleSave = () => {
      if (hours > 0) {
        saveTimeEntry(employeeId, contractId, date, parseFloat(hours), notes);
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
        case 'validated': return <CheckCircleIcon className="h-3 w-3 text-green-600" />;
        case 'invoiced': return <DocumentTextIcon className="h-3 w-3 text-blue-600" />;
        default: return <ExclamationTriangleIcon className="h-3 w-3 text-yellow-600" />;
      }
    };

    return (
      <div className={`p-2 rounded border ${getStatusColor()} ${isToday ? 'ring-1 ring-blue-300' : ''}`}>
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs">
            <div className="font-medium text-gray-900">
              {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
            </div>
            <div className="text-gray-600">
              {date.toLocaleDateString('fr-FR', { day: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            {isToday && <div className="w-1 h-1 bg-blue-500 rounded-full"></div>}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex space-x-1">
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              max="24"
              step="0.5"
              className="flex-1 px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={entry?.status === 'invoiced'}
              placeholder="0h"
            />
            <button
              onClick={handleSetDefault}
              className="px-1 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
              disabled={entry?.status === 'invoiced'}
              title={`${defaultHours}h`}
            >
              {defaultHours}h
            </button>
          </div>

          {hours > 8 && (
            <div className="text-xs text-orange-600 bg-orange-50 px-1 py-0.5 rounded">
              +{(hours - 8).toFixed(1)}h
            </div>
          )}

          {!isCompact && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="1"
              className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              disabled={entry?.status === 'invoiced'}
              placeholder="Notes..."
            />
          )}

          <div className="flex space-x-1">
            {entry?.status !== 'invoiced' && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSavingDay || hours <= 0}
                  className="flex-1 px-1 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingDay ? '...' : 'OK'}
                </button>

                {entry && entry.status === 'draft' && (
                  <button
                    onClick={() => validateDay(employeeId, date)}
                    className="px-1 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    title="Valider"
                  >
                    ✓
                  </button>
                )}
              </>
            )}

            {entry?.status === 'invoiced' && (
              <div className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded w-full text-center">
                Facturé
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Composant ligne pour l'emploi du temps hebdomadaire
  const WeeklyScheduleRow = ({ employee, contract, weekDays, onSave, isSaving }) => {
    const [editingCell, setEditingCell] = useState(null);
    const [tempHours, setTempHours] = useState({});

    const handleCellEdit = (dayIndex, currentHours) => {
      if (editMode) {
        // En mode édition, on n'ouvre pas d'input, on modifie directement la valeur affichée
        return;
      }
      setEditingCell(dayIndex);
      setTempHours({ ...tempHours, [dayIndex]: currentHours || '' });
    };

    const handleSave = async (dayIndex) => {
      const hours = tempHours[dayIndex];
      if (!hours || parseFloat(hours) < 0) {
        toast.error('Veuillez entrer un nombre d\'heures valide');
        return;
      }

      try {
        const hoursNum = parseFloat(hours);
        const day = weekDays[dayIndex];
        await onSave(employee.id, contract.id, day, hoursNum);
        setEditingCell(null);
        toast.success(`Heures sauvegardées pour ${employee.firstName} ${employee.lastName}`);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        toast.error('Erreur lors de la sauvegarde');
      }
    };

    const handleKeyPress = (e, dayIndex) => {
      if (e.key === 'Enter') {
        if (editMode) {
          // En mode édition, ne pas sauvegarder immédiatement
          return;
        }
        handleSave(dayIndex);
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
    };

    const handleEditModeChange = (dayIndex, value) => {
      const day = weekDays[dayIndex];
      handlePendingChange(employee.id, contract.id, day, value);
    };

    const getEntryForDay = (day) => {
      const dayKey = day.toISOString().split('T')[0];
      return weeklyTimeEntries[employee.id]?.[dayKey];
    };

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-3 py-2 border-r border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-xs">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-xs">
                {employee.firstName} {employee.lastName}
              </span>
              <span className="text-xs text-gray-500">
                {contract.title}
              </span>
            </div>
          </div>
        </td>
        {weekDays.map((day, dayIndex) => {
          const entry = getEntryForDay(day);
          const dayKey = day.toISOString().split('T')[0];
          const savingKey = `${employee.id}_${contract.id}_${dayKey}`;
          const cellIsSaving = isSaving[savingKey];
          const isInContractPeriod = isDateInContractPeriod(day, contract);

          // Si la date n'est pas dans la période du contrat, on cache la cellule
          if (!isInContractPeriod) {
            return (
              <td key={dayIndex} className="px-2 py-2 text-center border-r border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-300">-</div>
              </td>
            );
          }

          return (
            <td key={dayIndex} className="px-2 py-2 text-center border-r border-gray-100">
              {editMode ? (
                // Mode édition : input toujours visible
                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={(() => {
                        const changeKey = `${employee.id}_${contract.id}_${dayKey}`;
                        const pendingChange = pendingChanges[changeKey];
                        return pendingChange ? pendingChange.hours : (entry?.totalHours || '');
                      })()}
                      onChange={(e) => handleEditModeChange(dayIndex, e.target.value)}
                      className={`w-12 px-1 py-1 border rounded text-xs text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${pendingChanges[`${employee.id}_${contract.id}_${dayKey}`]
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-gray-300'
                        }`}
                      placeholder="0"
                      step="0.5"
                      min="0"
                    />
                    <button
                      onClick={() => {
                        const currentValue = (() => {
                          const changeKey = `${employee.id}_${contract.id}_${dayKey}`;
                          const pendingChange = pendingChanges[changeKey];
                          return parseFloat(pendingChange ? pendingChange.hours : (entry?.totalHours || 0));
                        })();
                        let newValue;
                        if (currentValue === 4) {
                          newValue = 8;
                        } else {
                          newValue = 4;
                        }
                        handleEditModeChange(dayIndex, newValue);
                      }}
                      className="w-6 h-6 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-xs font-bold flex items-center justify-center"
                      title={(() => {
                        const currentValue = (() => {
                          const changeKey = `${employee.id}_${contract.id}_${dayKey}`;
                          const pendingChange = pendingChanges[changeKey];
                          return parseFloat(pendingChange ? pendingChange.hours : (entry?.totalHours || 0));
                        })();
                        if (currentValue === 4) return "Mettre 8 heures";
                        return "Mettre 4 heures";
                      })()}
                    >
                      {(() => {
                        const currentValue = (() => {
                          const changeKey = `${employee.id}_${contract.id}_${dayKey}`;
                          const pendingChange = pendingChanges[changeKey];
                          return parseFloat(pendingChange ? pendingChange.hours : (entry?.totalHours || 0));
                        })();
                        if (currentValue === 4) return "8";
                        return "4";
                      })()}
                    </button>
                  </div>
                </div>
              ) : (
                // Mode normal : affichage simple seulement (pas d'édition)
                <div className="flex items-center justify-center">
                  <div className={`px-1 py-1 rounded text-xs min-h-[20px] flex items-center justify-center ${entry?.totalHours ? 'font-medium text-blue-700' : 'text-gray-400'
                    } ${cellIsSaving ? 'opacity-50' : ''}`}>
                    {cellIsSaving ? '...' : (entry?.totalHours ? `${entry.totalHours}h` : '-')}
                  </div>
                </div>
              )}
            </td>
          );
        })}
        <td className="px-3 py-2 text-center">
          <div className="text-xs font-medium text-gray-700">
            {weekDays.reduce((total, day) => {
              const entry = getEntryForDay(day);
              return total + (parseFloat(entry?.totalHours) || 0);
            }, 0).toFixed(1)}h
          </div>
        </td>
      </tr>
    );
  };

  // Composant accordéon pour un employé
  const EmployeeAccordion = ({ employee }) => {
    const isExpanded = expandedEmployees.has(employee.id);
    const employeeEntries = weeklyTimeEntries[employee.id] || {};
    const contractInfo = employee.contractInfo;

    // Calculer les stats de cet employé pour la semaine
    const employeeStats = Object.values(employeeEntries).reduce((acc, entry) => {
      acc.totalHours += entry.totalHours || 0;
      acc.workingDays += 1;
      return acc;
    }, { totalHours: 0, workingDays: 0 });

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* En-tête accordéon avec plus d'informations */}
        <button
          onClick={() => toggleEmployee(employee.id)}
          className="w-full px-4 py-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center text-left transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="font-medium text-gray-900">
                  {employee.firstName} {employee.lastName}
                </div>
                <div className="text-sm text-gray-500">•</div>
                <div className="text-sm font-medium text-blue-600">
                  {contractInfo?.title || 'Mission non définie'}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <div className="flex items-center space-x-4">
                  <span>📍 {contractInfo?.location || 'Lieu non défini'}</span>
                  <span>💰 {contractInfo?.billingRate || 0}€/h</span>
                  <span>⏱️ {employeeStats.totalHours.toFixed(1)}h cette semaine</span>
                  <span>📅 {employeeStats.workingDays} jours</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Période: {contractInfo ? new Date(contractInfo.startDate).toLocaleDateString() : ''} - {contractInfo ? new Date(contractInfo.endDate).toLocaleDateString() : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {employeeStats.totalHours.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500">
                {isExpanded ? 'Replier' : 'Déplier'}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Contenu accordéon */}
        {isExpanded && currentWeekStart && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="mb-3 text-sm text-gray-600 bg-blue-50 p-2 rounded">
              <strong>Mission:</strong> {contractInfo?.description || 'Aucune description'}<br />
              <strong>Horaires:</strong> {contractInfo?.workingHours || '8h-17h'} ({getDefaultHours(contractInfo)}h/jour par défaut)
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays(currentWeekStart).map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const entry = employeeEntries[dateStr];

                return (
                  <DayEntry
                    key={`${employee.id}-${dateStr}`}
                    employeeId={employee.id}
                    contractId={contractInfo?.id}
                    contractInfo={contractInfo}
                    date={date}
                    entry={entry}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }; ({ employee }) => {
    const isExpanded = expandedEmployees.has(employee.id);
    const employeeEntries = weeklyTimeEntries[employee.id] || {};

    // Calculer les stats de cet employé pour la semaine
    const employeeStats = Object.values(employeeEntries).reduce((acc, entry) => {
      acc.totalHours += entry.totalHours || 0;
      acc.workingDays += 1;
      return acc;
    }, { totalHours: 0, workingDays: 0 });

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* En-tête accordéon */}
        <button
          onClick={() => toggleEmployee(employee.id)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center text-left transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {employee.firstName} {employee.lastName}
              </div>
              <div className="text-sm text-gray-600">
                {employeeStats.totalHours.toFixed(1)}h cette semaine • {employeeStats.workingDays} jours
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {isExpanded ? 'Replier' : 'Déplier'}
            </span>
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Contenu accordéon */}
        {isExpanded && currentWeekStart && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays(currentWeekStart).map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const entry = employeeEntries[dateStr];

                return (
                  <DayEntry
                    key={`${employee.id}-${dateStr}`}
                    employeeId={employee.id}
                    date={date}
                    entry={entry}
                    defaultHours={getDefaultHours()}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement des contrats...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
          <ClockIcon className="h-6 w-6 mr-2 text-blue-600" />
          Pointage Client - {client.companyName}
        </h2>

        {/* Informations globales */}
        <div className="bg-white rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Contrats actifs</div>
            <div className="font-medium">{clientContracts.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Employés assignés</div>
            <div className="font-medium">{employeesWithContracts.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Période globale</div>
            <div className="font-medium">
              {clientContracts.length > 0 ? (
                <>
                  {new Date(Math.min(...clientContracts.map(c => new Date(c.startDate)))).toLocaleDateString()} - {new Date(Math.max(...clientContracts.map(c => new Date(c.endDate)))).toLocaleDateString()}
                </>
              ) : 'Aucune période'}
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur de semaine simple */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowWeekSelector(!showWeekSelector)}
        >
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Sélection de semaine
          </h3>
          <div className="flex items-center space-x-2">
            {showWeekSelector ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {showWeekSelector && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choisir une date (la semaine sera calculée automatiquement)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="date"
                  value={currentWeekStart ? currentWeekStart.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedDate = new Date(e.target.value);
                      const weekStart = getWeekStart(selectedDate);
                      setCurrentWeekStart(weekStart);
                      // Réinitialiser les données
                      setWeeklyTimeEntries({});
                      setWeeklyStats({
                        totalHours: 0,
                        totalEmployees: 0,
                        totalContracts: 0,
                        validatedDays: 0,
                        pendingDays: 0,
                        totalCost: 0
                      });
                      setClientContracts([]);
                      setEmployeesWithContracts([]);
                      // Recharger les contrats et données pour cette semaine
                      // loadContractsForWeek sera appelé automatiquement par useEffect
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekStart = getWeekStart(today);
                    setCurrentWeekStart(weekStart);
                    setWeeklyTimeEntries({});
                    setWeeklyStats({
                      totalHours: 0,
                      totalEmployees: 0,
                      totalContracts: 0,
                      validatedDays: 0,
                      pendingDays: 0,
                      totalCost: 0
                    });
                    setClientContracts([]);
                    setEmployeesWithContracts([]);
                    // loadContractsForWeek sera appelé automatiquement par useEffect
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Aujourd'hui
                </button>
              </div>

              {currentWeekStart && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-sm text-blue-700">
                    <InformationCircleIcon className="h-4 w-4 mr-2" />
                    Semaine sélectionnée : du {currentWeekStart.toLocaleDateString('fr-FR')} au {
                      (() => {
                        const weekEnd = new Date(currentWeekStart);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        return weekEnd.toLocaleDateString('fr-FR');
                      })()
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation semaine + statistiques - toujours visible */}
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

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-600">Total heures</div>
            <div className="text-xl font-bold text-blue-700">{weeklyStats.totalHours.toFixed(1)}h</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-sm text-purple-600">Employés</div>
            <div className="text-xl font-bold text-purple-700">{weeklyStats.totalEmployees}</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <div className="text-sm text-indigo-600">Contrats</div>
            <div className="text-xl font-bold text-indigo-700">{weeklyStats.totalContracts}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-sm text-green-600">Jours validés</div>
            <div className="text-xl font-bold text-green-700">{weeklyStats.validatedDays}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-sm text-yellow-600">En attente</div>
            <div className="text-xl font-bold text-yellow-700">{weeklyStats.pendingDays}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <div className="text-sm text-emerald-600">Coût estimé</div>
            <div className="text-xl font-bold text-emerald-700">{weeklyStats.totalCost.toFixed(0)}€</div>
          </div>
        </div>
      </div>

      {/* Liste des employés - visible seulement s'il y en a */}
      {employeesWithContracts.length === 0 ? (
        <div className="text-center py-12">
          <InformationCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Aucun employé assigné aux contrats actifs pour cette semaine</p>
          <p className="text-sm text-gray-400 mt-2">
            Essayez de changer de semaine ou vérifiez les périodes des contrats
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Employés et leurs missions ({employeesWithContracts.length})
            </h3>
            <div className="flex space-x-2">
              <div className="flex space-x-2 mr-4">
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-2 text-xs rounded-md transition-colors ${viewMode === 'detailed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Vue détaillée
                </button>
                <button
                  onClick={() => setViewMode('simple')}
                  className={`px-3 py-2 text-xs rounded-md transition-colors ${viewMode === 'simple'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Vue tableau
                </button>
              </div>

              {/* Contrôles du mode édition (uniquement en vue tableau) */}
              {viewMode === 'simple' && (
                <div className="flex space-x-2 mr-4 border-l border-gray-200 pl-4">
                  <button
                    onClick={toggleEditMode}
                    className={`px-3 py-2 text-xs rounded-md transition-colors ${editMode
                        ? 'bg-orange-600 text-white'
                        : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                  >
                    {editMode ? 'Sortir édition' : 'Mode édition'}
                  </button>

                  {editMode && (
                    <>
                      <button
                        onClick={savePendingChanges}
                        disabled={Object.keys(pendingChanges).length === 0 || isSaving.batchSaving}
                        className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                      >
                        {isSaving.batchSaving ? 'Sauvegarde...' : `Sauvegarder (${Object.keys(pendingChanges).length})`}
                      </button>
                      <button
                        onClick={cancelPendingChanges}
                        disabled={Object.keys(pendingChanges).length === 0}
                        className="px-3 py-2 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => setExpandedEmployees(new Set(employeesWithContracts.map(emp => emp.id)))}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Tout déplier
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setExpandedEmployees(new Set())}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Tout replier
              </button>
            </div>
          </div>

          {/* Indicateur du mode édition */}
          {editMode && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-orange-800">
                    Mode édition activé
                  </span>
                  <span className="text-xs text-orange-600">
                    {Object.keys(pendingChanges).length > 0
                      ? `${Object.keys(pendingChanges).length} modification(s) en attente`
                      : 'Aucune modification en attente'
                    }
                  </span>
                </div>
                <div className="text-xs text-orange-600">
                  Modifiez les valeurs et cliquez "Sauvegarder" pour confirmer
                </div>
              </div>
            </div>
          )}

          {viewMode === 'detailed' ? (
            employeesWithContracts.map((employee) => (
              <EmployeeAccordion
                key={employee.id}
                employee={employee}
              />
            ))
          ) : (
            <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${editMode ? 'ring-2 ring-orange-200' : ''
              }`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Employé
                      </th>
                      {getWeekDays(currentWeekStart).map((day, index) => (
                        <th key={index} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-xs">
                              {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </span>
                            <span className="text-xs font-normal text-gray-400">
                              {day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employeesWithContracts.map(employee => {
                      const contract = employee.contractInfo;
                      const weekDays = getWeekDays(currentWeekStart);

                      return (
                        <WeeklyScheduleRow
                          key={employee.id}
                          employee={employee}
                          contract={contract}
                          weekDays={weekDays}
                          onSave={async (employeeId, contractId, day, hours) => {
                            const dayKey = day.toISOString().split('T')[0];
                            const entryKey = `${employeeId}_${contractId}_${dayKey}`;
                            setIsSaving(prev => ({ ...prev, [entryKey]: true }));
                            try {
                              await handleSaveTimeEntry(employeeId, contractId, day, {
                                totalHours: hours,
                                status: 'validated'
                              });
                            } finally {
                              setIsSaving(prev => ({ ...prev, [entryKey]: false }));
                            }
                          }}
                          isSaving={isSaving}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientTimeTrackingTab;