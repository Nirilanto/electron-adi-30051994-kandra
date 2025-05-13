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
    workingHours: "08:00 - 12:00, 13:00 - 17:00",
    hourlyRate: 0,
    billingRate: 0,
    employeeId: "",
    clientId: "",
    motifId: "",
    justificatifId: "",
    transportId: "",
    additionalMotif: "", // Nouveau champ motif optionnel
    nonWorkingPeriods: "", // Nouveau champ périodes non travaillées
    paymentMethodId: "", // Référence au mode de paiement
    accessMethodId: "", // Référence au moyen d'accès
    weeklyMissionDuration: "35",
    weeklyCollectiveAvgDuration: "35",
    weeklyCollectiveDuration: "35",
    signatureId: "",
    stampId: "",
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
  const [paymentMethods, setPaymentMethods] = useState([]); // Modes de paiement
  const [accessMethods, setAccessMethods] = useState([]); // Moyens d'accès

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

        // Charger les employés
        const employeesList = await EmployeeService.getAllEmployees();
        setEmployees(employeesList);

        // Charger les signatures et tampons
        const signaturesList = await SettingsService.getSignatures();
        setSignatures(signaturesList);

        // Charger les clients
        const clientsList = await ClientService.getAllClients();
        setClients(clientsList);

        // Charger les paramètres
        const motifsList = await SettingsService.getMotifTypes();
        setMotifs(motifsList);

        const justificatifsList = await SettingsService.getJustificatifTypes();
        setJustificatifs(justificatifsList);

        const transportsList = await SettingsService.getTransportModes();
        setTransports(transportsList);

        // Charger les modes de paiement
        const paymentMethodsList = await SettingsService.getPaymentMethods();
        setPaymentMethods(paymentMethodsList);

        // Charger les moyens d'accès
        const accessMethodsList = await SettingsService.getAccessMethods();
        setAccessMethods(accessMethodsList);

        // Charger les mesures de sécurité
        const securityMeasuresList =
          await SettingsService.getSecurityMeasures();
        setSecurityMeasures(securityMeasuresList);

        // Si on est en mode édition, charger le contrat
        if (isEdit) {
          const contractData = await ContractService.getContractById(id);
          if (contractData) {
            setContract({
              ...contractData,
              startDate: new Date(contractData.startDate),
              endDate: new Date(contractData.endDate),
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

    // Le contrat a été modifié, réinitialiser l'état de sauvegarde
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

    // Le contrat a été modifié, réinitialiser l'état de sauvegarde
    if (isSaved) {
      setIsSaved(false);
    }
  };

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Préparer l'objet contrat
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
        signature: contract.signatureId
          ? signatures.find((s) => s.id === parseInt(contract.signatureId))
          : null,
        stamp: contract.stampId
          ? signatures.find((s) => s.id === parseInt(contract.stampId))
          : null,
        securityMeasuresList: contract.securityMeasures
          ? contract.securityMeasures
              .map((id) => {
                const measure = securityMeasures.find(
                  (m) => m.id === parseInt(id)
                );
                return measure ? measure.title : null;
              })
              .filter(Boolean)
          : [],
      };

      // Enregistrer le contrat
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

  // Génération de PDF client
  const handleGenerateClientPDF = async () => {
    // Vérifier si le contrat est sauvegardé
    if (!isSaved) {
      toast.warning(
        "Veuillez d'abord enregistrer le contrat avant de générer le PDF"
      );
      return;
    }

    try {
      setIsPdfGenerating((prev) => ({ ...prev, client: true }));

      // Préparer l'objet contrat avec les objets complets
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

  // Génération de PDF employé
  const handleGenerateEmployeePDF = async () => {
    // Vérifier si le contrat est sauvegardé
    if (!isSaved) {
      toast.warning(
        "Veuillez d'abord enregistrer le contrat avant de générer le PDF"
      );
      return;
    }

    // Vérifier si un employé est sélectionné
    if (!contract.employeeId) {
      toast.warning(
        "Vous devez sélectionner un consultant pour générer le PDF employé"
      );
      return;
    }

    try {
      setIsPdfGenerating((prev) => ({ ...prev, employee: true }));

      // Préparer l'objet contrat avec les objets complets
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du contrat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/contracts")}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Modifier le contrat" : "Nouveau contrat"}
            {contract.contractNumber && (
              <span className="ml-2 text-sm text-gray-500">
                N° {contract.contractNumber}
              </span>
            )}
          </h1>
        </div>

        <div className="flex space-x-3">
          {/* Bouton pour générer le PDF client */}
          <button
            type="button"
            onClick={handleGenerateClientPDF}
            disabled={isPdfGenerating.client || !isSaved}
            className={`flex items-center px-4 py-2 rounded-md ${
              isPdfGenerating.client
                ? "bg-gray-300 cursor-not-allowed"
                : !isSaved
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            title={
              !isSaved
                ? "Sauvegardez d'abord le contrat"
                : "Générer le PDF client"
            }
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isPdfGenerating.client ? "Génération..." : "PDF Client"}
          </button>

          {/* Bouton pour générer le PDF employé */}
          <button
            type="button"
            onClick={handleGenerateEmployeePDF}
            disabled={
              isPdfGenerating.employee || !isSaved || !contract.employeeId
            }
            className={`flex items-center px-4 py-2 rounded-md ${
              isPdfGenerating.employee
                ? "bg-gray-300 cursor-not-allowed"
                : !isSaved || !contract.employeeId
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            title={
              !isSaved
                ? "Sauvegardez d'abord le contrat"
                : !contract.employeeId
                ? "Sélectionnez un consultant"
                : "Générer le PDF employé"
            }
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isPdfGenerating.employee ? "Génération..." : "PDF Salarié"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Informations générales */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
            Informations générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Titre du contrat
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={contract.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Lieu de mission
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={contract.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={contract.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>
        {/* Période et horaires */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
            Période et horaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date de début
              </label>
              <DatePicker
                id="startDate"
                selected={contract.startDate}
                onChange={(date) => handleDateChange(date, "startDate")}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date de fin
              </label>
              <DatePicker
                id="endDate"
                selected={contract.endDate}
                onChange={(date) => handleDateChange(date, "endDate")}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minDate={contract.startDate}
              />
            </div>

            <div>
              <label
                htmlFor="workingHours"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Horaires de travail
              </label>
              <input
                type="text"
                id="workingHours"
                name="workingHours"
                value={contract.workingHours}
                onChange={handleChange}
                placeholder="ex: 08:00 - 12:00, 13:00 - 17:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="nonWorkingPeriods"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Période(s) non travaillée(s): terme précis ou durée minimale
              </label>
              <textarea
                id="nonWorkingPeriods"
                name="nonWorkingPeriods"
                rows="2"
                value={contract.nonWorkingPeriods}
                onChange={handleChange}
                placeholder="ex: 24/12/2025 au 05/01/2026, deux semaines en août 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-500" />
            Durées hebdomadaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="weeklyMissionDuration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Durée hebdomadaire de la mission
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="weeklyMissionDuration"
                  name="weeklyMissionDuration"
                  value={contract.weeklyMissionDuration}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600">heures</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="weeklyCollectiveAvgDuration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Durée collective moyenne hebdomadaire
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="weeklyCollectiveAvgDuration"
                  name="weeklyCollectiveAvgDuration"
                  value={contract.weeklyCollectiveAvgDuration}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600">heures</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="weeklyCollectiveDuration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Durée collective hebdomadaire
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="weeklyCollectiveDuration"
                  name="weeklyCollectiveDuration"
                  value={contract.weeklyCollectiveDuration}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600">heures</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FingerPrintIcon className="h-5 w-5 mr-2 text-blue-500" />
            Signatures et tampons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="signatureId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Signature
              </label>
              <select
                id="signatureId"
                name="signatureId"
                value={contract.signatureId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {contract.signatureId && (
                <div className="mt-2 p-2 border rounded-md bg-gray-50">
                  <img
                    src={
                      signatures.find(
                        (s) => s.id === parseInt(contract.signatureId)
                      )?.imageData
                    }
                    alt="Signature sélectionnée"
                    className="h-16 object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="stampId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tampon
              </label>
              <select
                id="stampId"
                name="stampId"
                value={contract.stampId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {signatures
                  .filter((sig) => sig.type === "stamp")
                  .map((stamp) => (
                    <option key={stamp.id} value={stamp.id}>
                      {stamp.title}
                    </option>
                  ))}
              </select>

              {contract.stampId && (
                <div className="mt-2 p-2 border rounded-md bg-gray-50">
                  <img
                    src={
                      signatures.find(
                        (s) => s.id === parseInt(contract.stampId)
                      )?.imageData
                    }
                    alt="Tampon sélectionné"
                    className="h-16 object-contain mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tarification */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BanknotesIcon className="h-5 w-5 mr-2 text-blue-500" />
            Tarification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="hourlyRate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Taux horaire consultant (€)
              </label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={contract.hourlyRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="billingRate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Taux horaire facturation client (€)
              </label>
              <input
                type="number"
                id="billingRate"
                name="billingRate"
                value={contract.billingRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="paymentMethodId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mode de paiement
              </label>
              <select
                id="paymentMethodId"
                name="paymentMethodId"
                value={contract.paymentMethodId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Employé et client */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                Consultant
              </h2>
              <div>
                <label
                  htmlFor="employeeId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sélectionner un consultant
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  value={contract.employeeId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner...</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
                Client
              </h2>
              <div>
                <label
                  htmlFor="clientId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sélectionner un client
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  value={contract.clientId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Informations complémentaires */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            Informations complémentaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="motifId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Motif
              </label>
              <select
                id="motifId"
                name="motifId"
                value={contract.motifId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {motifs.map((motif) => (
                  <option key={motif.id} value={motif.id}>
                    {motif.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="additionalMotif"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Motif additionnel (optionnel)
              </label>
              <input
                type="text"
                id="additionalMotif"
                name="additionalMotif"
                value={contract.additionalMotif}
                onChange={handleChange}
                placeholder="Précisions sur le motif"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="justificatifId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Justificatif
              </label>
              <select
                id="justificatifId"
                name="justificatifId"
                value={contract.justificatifId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {justificatifs.map((justificatif) => (
                  <option key={justificatif.id} value={justificatif.id}>
                    {justificatif.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="transportId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Moyen de transport
              </label>
              <select
                id="transportId"
                name="transportId"
                value={contract.transportId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {transports.map((transport) => (
                  <option key={transport.id} value={transport.id}>
                    {transport.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="accessMethodId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Moyen d'accès
              </label>
              <select
                id="accessMethodId"
                name="accessMethodId"
                value={contract.accessMethodId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {accessMethods.map((access) => (
                  <option key={access.id} value={access.id}>
                    {access.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="securityMeasures"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mesures de sécurité requises
              </label>
              <div className="mt-1 border border-gray-300 rounded-md p-2 bg-white max-h-40 overflow-y-auto">
                {securityMeasures.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {securityMeasures.map((measure) => (
                      <div key={measure.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`security-${measure.id}`}
                          name={`security-${measure.id}`}
                          checked={contract.securityMeasures?.includes(
                            measure.id.toString()
                          )}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setContract((prev) => {
                              const currentMeasures =
                                prev.securityMeasures || [];
                              let newMeasures;

                              if (isChecked) {
                                // Ajouter la mesure si elle n'est pas déjà présente
                                newMeasures = [
                                  ...currentMeasures,
                                  measure.id.toString(),
                                ];
                              } else {
                                // Retirer la mesure
                                newMeasures = currentMeasures.filter(
                                  (id) => id !== measure.id.toString()
                                );
                              }

                              return {
                                ...prev,
                                securityMeasures: newMeasures,
                              };
                            });
                          }}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`security-${measure.id}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {measure.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Aucune mesure de sécurité configurée
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Sélectionnez toutes les mesures de sécurité requises pour cette
                mission
              </p>
            </div>
          </div>
        </div>

        {/* Signatures et tampons */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FingerPrintIcon className="h-5 w-5 mr-2 text-blue-500" />
            Signatures et tampons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="signatureId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Signature
              </label>
              <select
                id="signatureId"
                name="signatureId"
                value={contract.signatureId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {contract.signatureId && (
                <div className="mt-2 p-2 border rounded-md bg-gray-50">
                  <img
                    src={
                      signatures.find(
                        (s) => s.id === parseInt(contract.signatureId)
                      )?.imageData
                    }
                    alt="Signature sélectionnée"
                    className="h-16 object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="stampId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tampon
              </label>
              <select
                id="stampId"
                name="stampId"
                value={contract.stampId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {signatures
                  .filter((sig) => sig.type === "stamp")
                  .map((stamp) => (
                    <option key={stamp.id} value={stamp.id}>
                      {stamp.title}
                    </option>
                  ))}
              </select>

              {contract.stampId && (
                <div className="mt-2 p-2 border rounded-md bg-gray-50">
                  <img
                    src={
                      signatures.find(
                        (s) => s.id === parseInt(contract.stampId)
                      )?.imageData
                    }
                    alt="Tampon sélectionné"
                    className="h-16 object-contain mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => navigate("/contracts")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center px-6 py-2 rounded-md ${
              isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            {isSubmitting
              ? "Enregistrement..."
              : isSaved
              ? "Mettre à jour"
              : "Enregistrer"}
          </button>
        </div>
      </form>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default ContractForm;
