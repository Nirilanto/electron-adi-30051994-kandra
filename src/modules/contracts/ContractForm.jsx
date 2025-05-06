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
    type: "employee", // 'employee' ou 'client'
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
  });

  // États pour les listes déroulantes
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [motifs, setMotifs] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);
  const [transports, setTransports] = useState([]);

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Charger les employés
        const employeesList = await EmployeeService.getAllEmployees();
        setEmployees(employeesList);

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

        // Si on est en mode édition, charger le contrat
        if (isEdit) {
          const contractData = await ContractService.getContractById(id);
          if (contractData) {
            setContract({
              ...contractData,
              startDate: new Date(contractData.startDate),
              endDate: new Date(contractData.endDate),
            });
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
  };

  // Gestionnaire de changement de date
  const handleDateChange = (date, field) => {
    setContract((prev) => ({
      ...prev,
      [field]: date,
    }));
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
      };

      // Enregistrer le contrat
      const savedContract = await ContractService.saveContract(contractData);

      toast.success(`Contrat ${isEdit ? "modifié" : "créé"} avec succès`);

      // Redirection vers la liste des contrats après un court délai
      setTimeout(() => {
        navigate(`/contracts/${savedContract.id}`, { replace: true });
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du contrat :", error);
      toast.error("Erreur lors de l'enregistrement du contrat");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Génération de PDF
  const handleGeneratePDF = async () => {
    try {
      setIsPdfGenerating(true);

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
      };

      let result;
      if (contract.type === "employee") {
        result = await ContractService.generateEmployeeContractPDF(
          contractData
        );
      } else {
        result = await ContractService.generateClientContractPDF(contractData);
      }

      if (result.success) {
        toast.success("PDF généré avec succès");
      } else {
        toast.error("Erreur lors de la génération du PDF");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsPdfGenerating(false);
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
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Modifier le contrat" : "Nouveau contrat"}
        </h1>

        {isEdit && (
          <button
            type="button"
            onClick={handleGeneratePDF}
            disabled={isPdfGenerating}
            className={`flex items-center px-4 py-2 rounded-md ${
              isPdfGenerating
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isPdfGenerating ? "Génération en cours..." : "Générer PDF"}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Type de contrat */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de contrat
          </label>
          <div className="flex">
            <label className="inline-flex items-center mr-6">
              <input
                type="radio"
                name="type"
                value="employee"
                checked={contract.type === "employee"}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">Contrat de mission (salarié)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                value="client"
                checked={contract.type === "client"}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">Contrat client</span>
            </label>
          </div>
        </div>

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
          </div>
        </div>

        {/* Tarification */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BanknotesIcon className="h-5 w-5 mr-2 text-blue-500" />
            Tarification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="hourlyRate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {contract.type === "employee"
                  ? "Taux horaire consultant (€)"
                  : "Taux horaire (€)"}
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

            {contract.type === "employee" && (
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
            )}
          </div>
        </div>

        {/* Employé et client */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contract.type === "employee" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Employé
                </h2>
                <div>
                  <label
                    htmlFor="employeeId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sélectionner un employé
                  </label>
                  <select
                    id="employeeId"
                    name="employeeId"
                    value={contract.employeeId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={contract.type === "employee"}
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
            )}

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

        {/* Options spécifiques au contrat de mission */}
        {contract.type === "employee" && (
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
            </div>
          </div>
        )}

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
            className={`px-6 py-2 rounded-md ${
              isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSubmitting
              ? "Enregistrement..."
              : isEdit
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
