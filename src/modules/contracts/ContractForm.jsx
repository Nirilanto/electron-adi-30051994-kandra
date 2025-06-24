// src/modules/contracts/ContractForm.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  UserIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ClockIcon,
  FingerPrintIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import ContractService from "./ContractService";
import EmployeeService from "../employees/EmployeeService";
import ClientService from "../clients/ClientService";
import SettingsService from "../settings/SettingsService";

function ContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // États pour le formulaire
  const [contract, setContract] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    location: "",
    nonWorkingPeriods: "",
    nonWorkingPeriodsType: "specific",
    workingHours: "08:00 - 12:00, 13:00 - 17:00",
    hourlyRate: 0,
    billingRate: 0,
    employeeId: "",
    clientId: "",
    motifId: "",
    justificatifId: "",
    transportId: "",
    additionalMotif: "",
    paymentMethodId: "",
    accessMethodId: "",
    weeklyMissionDuration: "35",
    weeklyCollectiveAvgDuration: "35",
    weeklyCollectiveDuration: "35",
    signatureId: "",  // Seulement l'ID, pas l'objet complet
    stampId: "",      // Seulement l'ID, pas l'objet complet
    securityMeasures: [],
  });

  // État pour le statut de sauvegarde
  const [isSaved, setIsSaved] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [securityMeasures, setSecurityMeasures] = useState([]);

  // États pour les listes déroulantes
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [motifs, setMotifs] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);
  const [transports, setTransports] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [accessMethods, setAccessMethods] = useState([]);

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState({
    client: false,
    employee: false,
  });

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Charger toutes les données en parallèle
        const [
          employeesList,
          signaturesList,
          clientsList,
          motifsList,
          justificatifsList,
          transportsList,
          paymentMethodsList,
          accessMethodsList,
          securityMeasuresList,
        ] = await Promise.all([
          EmployeeService.getAllEmployees(),
          SettingsService.getSignatures(),
          ClientService.getAllClients(),
          SettingsService.getMotifTypes(),
          SettingsService.getJustificatifTypes(),
          SettingsService.getTransportModes(),
          SettingsService.getPaymentMethods(),
          SettingsService.getAccessMethods(),
          SettingsService.getSecurityMeasures(),
        ]);

        setEmployees(employeesList);
        setSignatures(signaturesList);
        setClients(clientsList);
        setMotifs(motifsList);
        setJustificatifs(justificatifsList);
        setTransports(transportsList);
        setPaymentMethods(paymentMethodsList);
        setAccessMethods(accessMethodsList);
        setSecurityMeasures(securityMeasuresList);

        // Si on est en mode édition, charger le contrat
        if (isEdit) {
          const contractData = await ContractService.getContractById(id);
          if (contractData) {
            setContract({
              ...contractData,
              startDate: new Date(contractData.startDate),
              endDate: new Date(contractData.endDate),
              // Garder seulement les IDs des signatures, pas les objets complets
              signatureId: contractData.signatureId || "",
              stampId: contractData.stampId || "",
              securityMeasures: contractData.securityMeasures || []
            });
            setIsSaved(true);
          } else {
            toast.error("Contrat non trouvé");
            navigate("/contracts");
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEdit, navigate]);

  // Gestionnaire de changement de champ
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setContract((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));

    if (isSaved) {
      setIsSaved(false);
    }
  };

  // Gestionnaire de changement de date
  const handleDateChange = (date, field) => {
    setContract((prev) => ({
      ...prev,
      [field]: date,
    }));

    if (isSaved) {
      setIsSaved(false);
    }
  };

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Préparer l'objet contrat - OPTIMISÉ : ne stocker que les références
      const contractData = {
        ...contract,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate.toISOString(),
        // Ajouter les objets employé et client pour affichage (récupérés depuis les IDs)
        employee: contract.employeeId
          ? employees.find((e) => e.id === contract.employeeId)
          : null,
        client: contract.clientId
          ? clients.find((c) => c.id === contract.clientId)
          : null,
        // Ajouter les labels pour affichage (récupérés depuis les IDs)
        motif: contract.motifId
          ? motifs.find((m) => m.id === parseInt(contract.motifId))?.title
          : null,
        justificatif: contract.justificatifId
          ? justificatifs.find(
              (j) => j.id === parseInt(contract.justificatifId)
            )?.title
          : null,
        transport: contract.transportId
          ? transports.find((t) => t.id === parseInt(contract.transportId))
              ?.title
          : null,
        paymentMethod: contract.paymentMethodId
          ? paymentMethods.find(
              (p) => p.id === parseInt(contract.paymentMethodId)
            )?.title
          : null,
        accessMethod: contract.accessMethodId
          ? accessMethods.find(
              (a) => a.id === parseInt(contract.accessMethodId)
            )?.title
          : null,
        
        // IMPORTANT : NE PLUS stocker les objets signatures complets
        // Seulement les IDs sont nécessaires
        signatureId: contract.signatureId || "",
        stampId: contract.stampId || "",
        securityMeasures: contract.securityMeasures || []
      };

      // Enregistrer le contrat (le service ne stockera que les IDs)
      const savedContract = await ContractService.saveContract(contractData);

      // Mettre à jour l'ID si c'est un nouveau contrat
      if (!isEdit && savedContract.id) {
        setContract((prev) => ({ ...prev, id: savedContract.id }));
      }

      setIsSaved(true);
      toast.success(`Contrat ${isEdit ? "modifié" : "créé"} avec succès`);

      // Redirection vers la page du contrat modifié après un court délai
      if (!isEdit) {
        setTimeout(() => {
          navigate(`/contracts/${savedContract.id}`, { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du contrat :", error);
      toast.error("Erreur lors de l'enregistrement du contrat");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Génération de PDF client - OPTIMISÉ
  const handleGenerateClientPDF = async () => {
    if (!isSaved) {
      toast.warning(
        "Veuillez d'abord enregistrer le contrat avant de générer le PDF"
      );
      return;
    }

    try {
      setIsPdfGenerating((prev) => ({ ...prev, client: true }));

      // Préparer les données avec uniquement les références (IDs)
      const contractData = {
        ...contract,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate.toISOString(),
        employee: contract.employeeId
          ? employees.find((e) => e.id === contract.employeeId)
          : null,
        client: contract.clientId
          ? clients.find((c) => c.id === contract.clientId)
          : null,
        motif: contract.motifId
          ? motifs.find((m) => m.id === parseInt(contract.motifId))?.title
          : null,
        justificatif: contract.justificatifId
          ? justificatifs.find(
              (j) => j.id === parseInt(contract.justificatifId)
            )?.title
          : null,
        transport: contract.transportId
          ? transports.find((t) => t.id === parseInt(contract.transportId))
              ?.title
          : null,
        paymentMethod: contract.paymentMethodId
          ? paymentMethods.find(
              (p) => p.id === parseInt(contract.paymentMethodId)
            )?.title
          : null,
        accessMethod: contract.accessMethodId
          ? accessMethods.find(
              (a) => a.id === parseInt(contract.accessMethodId)
            )?.title
          : null,
        // Garder seulement les IDs - le service récupérera les signatures
        signatureId: contract.signatureId,
        stampId: contract.stampId,
        securityMeasures: contract.securityMeasures
      };

      const result = await ContractService.generateClientContractPDF(
        contractData
      );

      if (result.success) {
        toast.success("PDF client généré avec succès");
      } else {
        toast.error("Erreur lors de la génération du PDF client");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF client :", error);
      toast.error("Erreur lors de la génération du PDF client");
    } finally {
      setIsPdfGenerating((prev) => ({ ...prev, client: false }));
    }
  };

  // Génération de PDF employé - OPTIMISÉ
  const handleGenerateEmployeePDF = async () => {
    if (!isSaved) {
      toast.warning(
        "Veuillez d'abord enregistrer le contrat avant de générer le PDF"
      );
      return;
    }

    if (!contract.employeeId) {
      toast.warning(
        "Vous devez sélectionner un consultant pour générer le PDF employé"
      );
      return;
    }

    try {
      setIsPdfGenerating((prev) => ({ ...prev, employee: true }));

      // Préparer les données avec uniquement les références (IDs)
      const contractData = {
        ...contract,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate.toISOString(),
        employee: contract.employeeId
          ? employees.find((e) => e.id === contract.employeeId)
          : null,
        client: contract.clientId
          ? clients.find((c) => c.id === contract.clientId)
          : null,
        motif: contract.motifId
          ? motifs.find((m) => m.id === parseInt(contract.motifId))?.title
          : null,
        justificatif: contract.justificatifId
          ? justificatifs.find(
              (j) => j.id === parseInt(contract.justificatifId)
            )?.title
          : null,
        transport: contract.transportId
          ? transports.find((t) => t.id === parseInt(contract.transportId))
              ?.title
          : null,
        paymentMethod: contract.paymentMethodId
          ? paymentMethods.find(
              (p) => p.id === parseInt(contract.paymentMethodId)
            )?.title
          : null,
        accessMethod: contract.accessMethodId
          ? accessMethods.find(
              (a) => a.id === parseInt(contract.accessMethodId)
            )?.title
          : null,
        // Garder seulement les IDs - le service récupérera les signatures
        signatureId: contract.signatureId,
        stampId: contract.stampId,
        securityMeasures: contract.securityMeasures
      };

      const result = await ContractService.generateEmployeeContractPDF(
        contractData
      );

      if (result.success) {
        toast.success("PDF salarié généré avec succès");
      } else {
        toast.error("Erreur lors de la génération du PDF salarié");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF salarié :", error);
      toast.error("Erreur lors de la génération du PDF salarié");
    } finally {
      setIsPdfGenerating((prev) => ({ ...prev, employee: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement</h3>
          <p className="text-gray-600">Préparation du formulaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header moderne */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/contracts")}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Retour"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEdit ? "Modifier le contrat" : "Nouveau contrat"}
                  </h1>
                  {contract.contractNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      Référence: N° {contract.contractNumber}
                    </p>
                  )}
                </div>
                {isSaved && (
                  <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Sauvegardé</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {/* Bouton PDF Client */}
                <button
                  type="button"
                  onClick={handleGenerateClientPDF}
                  disabled={isPdfGenerating.client || !isSaved}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    isPdfGenerating.client
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : !isSaved
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
                  }`}
                  title={
                    !isSaved
                      ? "Sauvegardez d'abord le contrat"
                      : "Générer le PDF client"
                  }
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  {isPdfGenerating.client ? "Génération..." : "PDF Client"}
                </button>

                {/* Bouton PDF Employé */}
                <button
                  type="button"
                  onClick={handleGenerateEmployeePDF}
                  disabled={
                    isPdfGenerating.employee || !isSaved || !contract.employeeId
                  }
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    isPdfGenerating.employee
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : !isSaved || !contract.employeeId
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                  }`}
                  title={
                    !isSaved
                      ? "Sauvegardez d'abord le contrat"
                      : !contract.employeeId
                      ? "Sélectionnez un consultant"
                      : "Générer le PDF employé"
                  }
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  {isPdfGenerating.employee ? "Génération..." : "PDF Salarié"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations générales
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Titre du contrat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={contract.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nom de la mission ou du projet"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Lieu de mission
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={contract.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Adresse ou ville de la mission"
                  />
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description de la mission
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    value={contract.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Décrivez les tâches et responsabilités..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Période et horaires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Période et horaires
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date de début <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={contract.startDate}
                    onChange={(date) => handleDateChange(date, "startDate")}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date de fin <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={contract.endDate}
                    onChange={(date) => handleDateChange(date, "endDate")}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    minDate={contract.startDate}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Horaires de travail
                  </label>
                  <input
                    type="text"
                    name="workingHours"
                    value={contract.workingHours}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="ex: 08:00 - 12:00, 13:00 - 17:00"
                  />
                </div>
              </div>

              {/* Périodes non travaillées */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Période(s) non travaillée(s)
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div>
                    <select
                      name="nonWorkingPeriodsType"
                      value={contract.nonWorkingPeriodsType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="specific">Terme précis</option>
                      <option value="minimum">Durée minimale</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <input
                      type="text"
                      name="nonWorkingPeriods"
                      value={contract.nonWorkingPeriods}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={
                        contract.nonWorkingPeriodsType === "specific"
                          ? "ex: 24/12/2025 au 05/01/2026"
                          : "ex: deux semaines en août 2025"
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 mr-1" />
                  {contract.nonWorkingPeriodsType === "specific"
                    ? "Spécifiez les dates exactes des périodes non travaillées"
                    : "Indiquez la durée minimale des périodes non travaillées"}
                </p>
              </div>
            </div>
          </div>

          {/* Section Durées hebdomadaires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                Durées hebdomadaires
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Durée hebdomadaire de la mission
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="weeklyMissionDuration"
                      value={contract.weeklyMissionDuration}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      heures
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Durée collective moyenne
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="weeklyCollectiveAvgDuration"
                      value={contract.weeklyCollectiveAvgDuration}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      heures
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Durée collective hebdomadaire
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="weeklyCollectiveDuration"
                      value={contract.weeklyCollectiveDuration}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      heures
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Tarification */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BanknotesIcon className="h-5 w-5 mr-2 text-blue-600" />
                Tarification
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Taux horaire consultant
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="hourlyRate"
                      value={contract.hourlyRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      €
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Taux horaire facturation client
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="billingRate"
                      value={contract.billingRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      €
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Mode de paiement
                  </label>
                  <select
                    name="paymentMethodId"
                    value={contract.paymentMethodId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section Employé et Client */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consultant */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Consultant
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Sélectionner un consultant
                  </label>
                  <select
                    name="employeeId"
                    value={contract.employeeId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Choisir un consultant...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {contract.employeeId && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">
                        {employees.find(e => e.id === contract.employeeId)?.firstName} {employees.find(e => e.id === contract.employeeId)?.lastName}
                      </p>
                      <p className="text-blue-700 mt-1">
                        {employees.find(e => e.id === contract.employeeId)?.skills || 'Aucune compétence renseignée'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Client
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Sélectionner un client <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="clientId"
                    value={contract.clientId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Choisir un client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {contract.clientId && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-green-900">
                        {clients.find(c => c.id === contract.clientId)?.companyName}
                      </p>
                      <p className="text-green-700 mt-1">
                        {clients.find(c => c.id === contract.clientId)?.contactName || 'Contact non renseigné'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Informations complémentaires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Informations complémentaires
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Motif
                  </label>
                  <select
                    name="motifId"
                    value={contract.motifId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    {motifs.map((motif) => (
                      <option key={motif.id} value={motif.id}>
                        {motif.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Motif additionnel
                  </label>
                  <input
                    type="text"
                    name="additionalMotif"
                    value={contract.additionalMotif}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Précisions sur le motif"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Justificatif
                  </label>
                  <select
                    name="justificatifId"
                    value={contract.justificatifId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    {justificatifs.map((justificatif) => (
                      <option key={justificatif.id} value={justificatif.id}>
                        {justificatif.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Moyen de transport
                  </label>
                  <select
                    name="transportId"
                    value={contract.transportId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    {transports.map((transport) => (
                      <option key={transport.id} value={transport.id}>
                        {transport.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Moyen d'accès
                  </label>
                  <select
                    name="accessMethodId"
                    value={contract.accessMethodId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    {accessMethods.map((access) => (
                      <option key={access.id} value={access.id}>
                        {access.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mesures de sécurité */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mesures de sécurité requises
                </label>
                {securityMeasures.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {securityMeasures.map((measure) => (
                      <label key={measure.id} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={contract.securityMeasures?.includes(measure.id.toString())}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setContract((prev) => {
                              const currentMeasures = prev.securityMeasures || [];
                              let newMeasures;

                              if (isChecked) {
                                newMeasures = [...currentMeasures, measure.id.toString()];
                              } else {
                                newMeasures = currentMeasures.filter(id => id !== measure.id.toString());
                              }

                              return { ...prev, securityMeasures: newMeasures };
                            });
                          }}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{measure.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Aucune mesure de sécurité configurée</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Signatures - OPTIMISÉE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FingerPrintIcon className="h-5 w-5 mr-2 text-blue-600" />
                Signatures et tampons
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Signature
                  </label>
                  <select
                    name="signatureId"
                    value={contract.signatureId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    {signatures
                      .filter((sig) => sig.type === "signature")
                      .map((signature) => (
                        <option key={signature.id} value={signature.id}>
                          {signature.title}
                        </option>
                      ))}
                  </select>

                  {/* Aperçu de la signature sélectionnée - OPTIMISÉ */}
                  {contract.signatureId && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-600 mb-2">Aperçu :</p>
                      {(() => {
                        const selectedSignature = signatures.find(s => s.id === parseInt(contract.signatureId));
                        return selectedSignature ? (
                          <img
                            src={selectedSignature.imageData}
                            alt="Signature sélectionnée"
                            className="h-16 object-contain mx-auto bg-white rounded border"
                          />
                        ) : (
                          <p className="text-xs text-gray-500">Signature non trouvée</p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => navigate("/contracts")}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center px-8 py-3 rounded-lg font-medium transition-all ${
                  isSubmitting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    {isSaved ? "Mettre à jour" : "Enregistrer"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ToastContainer 
        position="bottom-right"
        toastClassName="rounded-lg"
        progressClassName="bg-blue-600"
      />
    </div>
  );
}

export default ContractForm;