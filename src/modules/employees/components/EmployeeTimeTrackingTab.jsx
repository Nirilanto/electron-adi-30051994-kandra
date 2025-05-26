// src/modules/employees/components/EmployeeTimeTrackingTab.js
import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

// Services
import TimeTrackingService from "../../timetracking/TimeTrackingService";
import ContractService from "../../contracts/ContractService";

const EmployeeTimeTrackingTab = ({ employee }) => {
  // États principaux
  const [selectedMission, setSelectedMission] = useState(null);
  const [activeContracts, setActiveContracts] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [weeklyTimeEntries, setWeeklyTimeEntries] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState({});

  // Statistiques de la semaine
  const [weeklyStats, setWeeklyStats] = useState({
    totalHours: 0,
    validatedDays: 0,
    pendingDays: 0,
  });

  // Chargement initial des contrats
  useEffect(() => {
    loadActiveContracts();
  }, [employee.id]);

  // Chargement des pointages quand mission/semaine change
  useEffect(() => {
    if (selectedMission && currentWeekStart) {
      loadWeeklyTimeEntries();
    }
  }, [selectedMission, currentWeekStart]);

  // Charger les contrats actifs de l'employé
  const loadActiveContracts = async () => {
    try {
      setIsLoading(true);
      const contracts = await ContractService.getAllContracts();
      const employeeContracts = contracts.filter(
        (contract) =>
          contract.employeeId == employee.id &&
          new Date(contract.endDate) >= new Date() // Contrats non expirés
      );
      setActiveContracts(employeeContracts);

      // Auto-sélectionner le premier contrat s'il n'y en a qu'un
      if (employeeContracts.length === 1) {
        handleMissionSelect(employeeContracts[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des contrats:", error);
      toast.error("Erreur lors du chargement des missions");
    } finally {
      setIsLoading(false);
    }
  };

  // Sélectionner une mission
  const handleMissionSelect = (contract) => {
    setSelectedMission(contract);

    // Définir la semaine courante dans la période du contrat
    const contractStart = new Date(contract.startDate);
    const today = new Date();
    const contractEnd = new Date(contract.endDate);

    // Prendre la semaine courante si dans la période, sinon la première semaine du contrat
    let weekStart;
    if (today >= contractStart && today <= contractEnd) {
      weekStart = getWeekStart(today);
    } else {
      weekStart = getWeekStart(contractStart);
    }

    setCurrentWeekStart(weekStart);
  };

  // Obtenir le début de semaine (lundi)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
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
    if (!selectedMission || !currentWeekStart) return;

    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + direction * 7);

    // Permettre la navigation dans toute la période du contrat
    const contractStart = new Date(selectedMission.startDate);
    const contractEnd = new Date(selectedMission.endDate);

    // Vérifier que la semaine intersecte avec la période du contrat
    const weekEnd = new Date(newWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    if (newWeekStart <= contractEnd && weekEnd >= contractStart) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  // Vérifier si la navigation est possible
  const canNavigate = (direction) => {
    if (!selectedMission || !currentWeekStart) return false;

    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + direction * 7);

    const contractStart = new Date(selectedMission.startDate);
    const contractEnd = new Date(selectedMission.endDate);

    // Vérifier que la semaine intersecte avec la période du contrat
    const weekEnd = new Date(newWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return newWeekStart <= contractEnd && weekEnd >= contractStart;
  };

  // Charger les pointages de la semaine
  const loadWeeklyTimeEntries = async () => {
    try {
      const weekDays = getWeekDays(currentWeekStart);
      const weekEnd = weekDays[6];

      const timeEntries = await TimeTrackingService.getTimeEntries({
        employeeId: employee.id,
        contractId: selectedMission.id,
        startDate: currentWeekStart.toISOString().split("T")[0],
        endDate: weekEnd.toISOString().split("T")[0],
      });

      // Organiser par date
      const entriesByDate = {};
      timeEntries.forEach((entry) => {
        entriesByDate[entry.date] = entry;
      });

      setWeeklyTimeEntries(entriesByDate);
      calculateWeeklyStats(entriesByDate);
    } catch (error) {
      console.error("Erreur lors du chargement des pointages:", error);
      toast.error("Erreur lors du chargement des pointages");
    }
  };

  // Calculer les statistiques de la semaine
  const calculateWeeklyStats = (entriesByDate) => {
    const stats = Object.values(entriesByDate).reduce(
      (acc, entry) => {
        acc.totalHours += entry.totalHours || 0;
        if (entry.status === "validated" || entry.status === "invoiced") {
          acc.validatedDays += 1;
        } else {
          acc.pendingDays += 1;
        }
        return acc;
      },
      { totalHours: 0, validatedDays: 0, pendingDays: 0 }
    );

    setWeeklyStats(stats);
  };

  // Sauvegarder les heures d'un jour
  const saveTimeEntry = async (date, hours, notes = "") => {
    if (!selectedMission) return;

    const dateStr = date.toISOString().split("T")[0];
    setIsSaving((prev) => ({ ...prev, [dateStr]: true }));

    try {
      // Calculer les heures normales et supplémentaires
      const normalHours = Math.min(hours, 8);
      const overtimeHours = Math.max(hours - 8, 0);

      const timeEntryData = {
        employeeId: employee.id,
        contractId: selectedMission.id,
        clientId: selectedMission.clientId,
        date: dateStr,
        totalHours: hours,
        normalHours,
        overtimeHours,
        hourlyRate: selectedMission.hourlyRate || 0,
        billingRate: selectedMission.billingRate || 0,
        workType: "normal",
        notes,
        status: "draft",
      };

      // Vérifier s'il existe déjà un pointage pour ce jour
      const existingEntry = weeklyTimeEntries[dateStr];

      if (existingEntry) {
        if (existingEntry.status === "invoiced") {
          toast.error("Impossible de modifier un pointage facturé");
          return;
        }
        await TimeTrackingService.updateTimeEntry(
          existingEntry.id,
          timeEntryData
        );
      } else {
        await TimeTrackingService.createTimeEntry(timeEntryData);
      }

      // Recharger les données
      await loadWeeklyTimeEntries();
      toast.success("Pointage sauvegardé");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving((prev) => ({ ...prev, [dateStr]: false }));
    }
  };

  // Valider un jour
  const validateDay = async (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const entry = weeklyTimeEntries[dateStr];

    if (!entry) {
      toast.error("Aucun pointage à valider pour ce jour");
      return;
    }

    if (entry.status === "invoiced") {
      toast.error("Ce pointage est déjà facturé");
      return;
    }

    try {
      await TimeTrackingService.validateTimeEntry(entry.id);
      await loadWeeklyTimeEntries();
      toast.success("Journée validée");
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      toast.error("Erreur lors de la validation");
    }
  };

  // Obtenir les heures par défaut depuis le contrat
  const getDefaultHours = () => {
    if (!selectedMission?.workingHours) return 8;

    // Parser les horaires du contrat (ex: "08:00 - 17:00")
    try {
      const match = selectedMission.workingHours.match(
        /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/
      );
      if (match) {
        const [, startH, startM, endH, endM] = match;
        const startMinutes = parseInt(startH) * 60 + parseInt(startM);
        const endMinutes = parseInt(endH) * 60 + parseInt(endM);
        const totalMinutes = endMinutes - startMinutes;
        return Math.max(totalMinutes / 60, 0);
      }
    } catch (error) {
      console.error("Erreur lors du parsing des horaires:", error);
    }

    return 8; // Défaut : 8 heures
  };

  // Vérifier si une date est dans la période du contrat
  const isDateInContractPeriod = (date) => {
    if (!selectedMission) return false;
    
    // Normaliser les dates pour comparer seulement les jours (pas les heures)
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const contractStart = new Date(selectedMission.startDate);
    contractStart.setHours(0, 0, 0, 0);
    
    const contractEnd = new Date(selectedMission.endDate);
    contractEnd.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
    
    return checkDate >= contractStart && checkDate <= contractEnd;
  };


  // Composant pour une journée
  const DayEntry = ({ date, entry, defaultHours }) => {
    const [hours, setHours] = useState(entry?.totalHours || 0);
    const [notes, setNotes] = useState(entry?.notes || "");
    const dateStr = date.toISOString().split("T")[0];
    const isToday = dateStr === new Date().toISOString().split("T")[0];
    const isInContractPeriod = isDateInContractPeriod(date);
    const isSavingDay = isSaving[dateStr];

    // Ne pas afficher si hors période du contrat
    if (!isInContractPeriod) {
      return (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-50">
          <div className="text-center text-gray-400">
            <div className="text-sm font-medium">
              {date.toLocaleDateString("fr-FR", { weekday: "short" })}
            </div>
            <div className="text-xs">
              {date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
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
      if (!entry) return "border-gray-200 bg-white";
      switch (entry.status) {
        case "validated":
          return "border-green-300 bg-green-50";
        case "invoiced":
          return "border-blue-300 bg-blue-50";
        default:
          return "border-yellow-300 bg-yellow-50";
      }
    };

    const getStatusIcon = () => {
      if (!entry) return null;
      switch (entry.status) {
        case "validated":
          return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
        case "invoiced":
          return <DocumentTextIcon className="h-4 w-4 text-blue-600" />;
        default:
          return (
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
          );
      }
    };

    return (
      <div
        className={`p-3 rounded-lg border ${getStatusColor()} ${
          isToday ? "ring-1 ring-blue-300" : ""
        }`}
      >
        {/* En-tête compact */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {date.toLocaleDateString("fr-FR", { weekday: "short" })}
            </div>
            <div className="text-xs text-gray-600">
              {date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            {isToday && (
              <div
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                title="Aujourd'hui"
              ></div>
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
              disabled={entry?.status === "invoiced"}
              placeholder="0h"
            />
            <button
              onClick={handleSetDefault}
              className="px-2 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
              disabled={entry?.status === "invoiced"}
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

          {/* Notes compactes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="1"
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            disabled={entry?.status === "invoiced"}
            placeholder="Notes..."
            onFocus={(e) => (e.target.rows = 2)}
            onBlur={(e) => {
              if (!e.target.value) e.target.rows = 1;
            }}
          />

          {/* Actions */}
          <div className="flex space-x-1">
            {entry?.status !== "invoiced" && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSavingDay || hours <= 0}
                  className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingDay ? "..." : "Sauver"}
                </button>

                {entry && entry.status === "draft" && (
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

            {entry?.status === "invoiced" && (
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
        <span className="ml-3 text-gray-600">Chargement des missions...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
          <ClockIcon className="h-6 w-6 mr-2 text-blue-600" />
          Pointage - {employee.firstName} {employee.lastName}
        </h2>

        {/* Sélection de mission */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner une mission
          </label>
          <select
            value={selectedMission?.id || ""}
            onChange={(e) => {
              const contract = activeContracts.find(
                (c) => c.id === e.target.value
              );
              if (contract) handleMissionSelect(contract);
            }}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choisir une mission...</option>
            {activeContracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.title} (
                {new Date(contract.startDate).toLocaleDateString()} -{" "}
                {new Date(contract.endDate).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Informations de la mission */}
        {selectedMission && (
          <div className="bg-white rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Période du contrat</div>
              <div className="font-medium">
                {new Date(selectedMission.startDate).toLocaleDateString()} -{" "}
                {new Date(selectedMission.endDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Horaires de référence</div>
              <div className="font-medium">
                {selectedMission.workingHours || "8h-17h"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Heures par défaut</div>
              <div className="font-medium">{getDefaultHours()}h/jour</div>
            </div>
          </div>
        )}
      </div>

      {!selectedMission ? (
        <div className="text-center py-12">
          <InformationCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">
            Sélectionnez une mission pour commencer le pointage
          </p>
        </div>
      ) : (
        <>
          {/* Navigation semaine + statistiques */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => navigateWeek(-1)}
                disabled={!canNavigate(-1)}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Semaine précédente
              </button>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Semaine du {currentWeekStart?.toLocaleDateString("fr-FR")}
                </h3>
                <div className="text-sm text-gray-600">
                  {currentWeekStart && (
                    <>
                      {currentWeekStart.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      -{" "}
                      {(() => {
                        const weekEnd = new Date(currentWeekStart);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        return weekEnd.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        });
                      })()}
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigateWeek(1)}
                disabled={!canNavigate(1)}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Semaine suivante
                <ChevronRightIcon className="h-5 w-5 ml-1" />
              </button>
            </div>

            {/* Statistiques de la semaine */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-sm text-blue-600">Total heures</div>
                <div className="text-xl font-bold text-blue-700">
                  {weeklyStats.totalHours.toFixed(1)}h
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-sm text-green-600">Jours validés</div>
                <div className="text-xl font-bold text-green-700">
                  {weeklyStats.validatedDays}
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-sm text-yellow-600">En attente</div>
                <div className="text-xl font-bold text-yellow-700">
                  {weeklyStats.pendingDays}
                </div>
              </div>
            </div>
          </div>

          {/* Grille des jours - Design linéaire et compact */}
          {currentWeekStart && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Pointage de la semaine
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                {getWeekDays(currentWeekStart).map((date, index) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const entry = weeklyTimeEntries[dateStr];

                  return (
                    <DayEntry
                      key={dateStr}
                      date={date}
                      entry={entry}
                      defaultHours={getDefaultHours()}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeTimeTrackingTab;
