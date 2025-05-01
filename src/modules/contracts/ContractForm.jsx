import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DatabaseService from "../../services/DatabaseService";
import PDFService from "../../services/PDFService";

// Icônes
import {
  ArrowLeftIcon,
  CheckIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyEuroIcon,
} from "@heroicons/react/24/outline";

const ContractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // État du formulaire
  const [formData, setFormData] = useState({
    employee_id: "",
    client_id: "",
    reference: "",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    working_hours: "",
    hourly_rate: "",
    billing_rate: "",
    status: "draft",
    notes: "",
  });

  // États pour les listes déroulantes
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  // États pour gérer le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // État pour la génération de PDF
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Charger les données nécessaires au montage du composant
  useEffect(() => {
    const loadFormData = async () => {
      try {
        // Charger les employés et les clients
        const employeeData = await DatabaseService.getEmployees({
          status: "active",
        });
        const clientData = await DatabaseService.getClients({
          status: "active",
        });

        setEmployees(employeeData);
        setClients(clientData);

        // Si on est en mode édition, charger les données du contrat
        if (isEditMode) {
          const contractData = await DatabaseService.getContractById(
            parseInt(id)
          );

          // Mettre à jour les données du formulaire
          setFormData({
            ...formData,
            ...contractData,
          });
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données du formulaire:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [id, isEditMode]);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Effacer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  // Mettre à jour automatiquement le taux de facturation
  const updateBillingRate = (formDatas, employeeId, hourlyRate) => {
    console.log(" updateBillingRate ", employeeId, hourlyRate);
    // Si un taux horaire est fourni, l'utiliser
    if (hourlyRate) {
      const rate = parseFloat(hourlyRate);
      // Appliquer une marge de 50% par défaut
      const billingRate = (rate * 1.5).toFixed(2);

      setFormData({
        ...formDatas,
        hourly_rate: hourlyRate,
        billing_rate: billingRate,
      });
    }
    // Sinon, rechercher le taux horaire de l'employé
    else if (employeeId) {
      const selectedEmployee = employees.find(
        (emp) => emp.id === parseInt(employeeId)
      );

      console.log(" MANDAL -------------- ", selectedEmployee);

      if (selectedEmployee && selectedEmployee.hourly_rate) {
        const rate = parseFloat(selectedEmployee.hourly_rate);
        // Appliquer une marge de 50% par défaut
        const billingRate = (rate * 1.5).toFixed(2);

        setFormData({
          ...formDatas,
          hourly_rate: selectedEmployee.hourly_rate,
          billing_rate: billingRate,
        });
      }
    }
  };

  console.log("formData ------ ", formData);

// Gérer le changement d'employé
const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    
    // Mettre à jour l'ID de l'employé dans le formulaire
    setFormData({
      ...formData,
      employee_id: employeeId
    });
    
    // Si un employé est sélectionné, mettre à jour le taux horaire
    if (employeeId) {
      const selectedEmployee = employees.find(emp => emp.id === parseInt(employeeId));
      
      if (selectedEmployee && selectedEmployee.hourly_rate) {
        const rate = parseFloat(selectedEmployee.hourly_rate);
        // Appliquer une marge de 50% par défaut
        const billingRate = (rate * 1.5).toFixed(2);
        
        setFormData(prevState => ({
          ...prevState,
          hourly_rate: selectedEmployee.hourly_rate,
          billing_rate: billingRate
        }));
      }
    }
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors.employee_id) {
      setErrors({
        ...errors,
        employee_id: null
      });
    }
  };

  // Gérer le changement du taux horaire
  const handleHourlyRateChange = (e) => {
    const hourlyRate = e.target.value;

    // Mettre à jour le taux de facturation
    updateBillingRate(null, hourlyRate);

    // Effacer l'erreur pour ce champ si elle existe
    if (errors.hourly_rate) {
      setErrors({
        ...errors,
        hourly_rate: null,
      });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};

    // Vérifier les champs obligatoires
    if (!formData.employee_id) {
      newErrors.employee_id = "L'employé est obligatoire";
    }

    if (!formData.client_id) {
      newErrors.client_id = "Le client est obligatoire";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Le titre du contrat est obligatoire";
    }

    if (!formData.start_date) {
      newErrors.start_date = "La date de début est obligatoire";
    }

    // Valider les taux
    if (!formData.hourly_rate) {
      newErrors.hourly_rate = "Le taux horaire est obligatoire";
    } else if (
      isNaN(parseFloat(formData.hourly_rate)) ||
      parseFloat(formData.hourly_rate) <= 0
    ) {
      newErrors.hourly_rate = "Le taux horaire doit être un nombre positif";
    }

    if (!formData.billing_rate) {
      newErrors.billing_rate = "Le taux de facturation est obligatoire";
    } else if (
      isNaN(parseFloat(formData.billing_rate)) ||
      parseFloat(formData.billing_rate) <= 0
    ) {
      newErrors.billing_rate =
        "Le taux de facturation doit être un nombre positif";
    }

    // Vérifier la cohérence des dates
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate < startDate) {
        newErrors.end_date =
          "La date de fin doit être postérieure à la date de début";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Préparer les données pour la soumission
      const contractData = {
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate),
        billing_rate: parseFloat(formData.billing_rate),
        employee_id: parseInt(formData.employee_id),
        client_id: parseInt(formData.client_id),
      };

      // Créer ou mettre à jour le contrat
      if (isEditMode) {
        await DatabaseService.updateContract(parseInt(id), contractData);
        setSuccessMessage("Contrat mis à jour avec succès");
      } else {
        const newContract = await DatabaseService.createContract(contractData);
        setSuccessMessage("Contrat créé avec succès");

        // Rediriger vers le mode édition après la création
        setTimeout(() => {
          navigate(`/contracts/${newContract.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du contrat:", error);
      setErrors({
        ...errors,
        submit:
          "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.",
      });
    } finally {
      setSaving(false);

      // Faire disparaître le message de succès après quelques secondes
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    }
  };

  // Générer un PDF du contrat
  const handleGeneratePDF = async () => {
    if (!isEditMode) {
      // On ne peut pas générer de PDF pour un contrat qui n'a pas encore été créé
      return;
    }

    setGeneratingPDF(true);

    try {
      // Récupérer les informations complètes
      const contract = await DatabaseService.getContractById(parseInt(id));
      const employee = await DatabaseService.getEmployeeById(
        contract.employee_id
      );
      const client = await DatabaseService.getClientById(contract.client_id);

      // Générer le PDF
      const pdf = await PDFService.generateContractPDF(
        contract,
        employee,
        client
      );

      // Dans une vraie application, on ouvrirait le PDF ou proposerait le téléchargement
      console.log("PDF généré:", pdf);

      // Afficher un message de succès
      setSuccessMessage("PDF généré avec succès");
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      setErrors({
        ...errors,
        pdf: "Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.",
      });
    } finally {
      setGeneratingPDF(false);

      // Faire disparaître le message de succès après quelques secondes
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    }
  };

  // Afficher un indicateur de chargement pendant le chargement des données
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Chargement des données du contrat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/contracts"
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? "Modifier le contrat" : "Nouveau contrat"}
          </h1>
        </div>

        {/* Actions pour les contrats existants */}
        {isEditMode && (
          <div>
            <button
              onClick={handleGeneratePDF}
              className="btn btn-outline flex items-center"
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Génération...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  Générer PDF
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Message de succès */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex items-center">
            <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Erreur de soumission */}
      {errors.submit && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <p className="text-red-700">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Erreur de génération de PDF */}
      {errors.pdf && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <p className="text-red-700">{errors.pdf}</p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations principales */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-primary-500" />
              Informations du contrat
            </h2>
          </div>

          {/* Référence */}
          <div>
            <label htmlFor="reference" className="form-label">
              Référence
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              className="form-input"
              value={formData.reference}
              onChange={handleChange}
              placeholder={`CONT-${new Date().getFullYear()}-${
                isEditMode ? id : "XXX"
              }`}
            />
            <p className="mt-1 text-sm text-gray-500">
              Laissez vide pour une référence automatique
            </p>
          </div>

          {/* Titre */}
          <div>
            <label htmlFor="title" className="form-label">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`form-input ${
                errors.title
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              value={formData.title}
              onChange={handleChange}
              required
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Statut */}
          <div>
            <label htmlFor="status" className="form-label">
              Statut
            </label>
            <select
              id="status"
              name="status"
              className="form-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="draft">Brouillon</option>
              <option value="active">Actif</option>
              <option value="completed">Terminé</option>
              <option value="canceled">Annulé</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description du contrat de mission..."
            />
          </div>

          {/* Parties impliquées */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4 mt-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-primary-500" />
              Parties impliquées
            </h2>
          </div>

          {/* Employé */}
          <div>
            <label htmlFor="employee_id" className="form-label">
              Employé <span className="text-red-500">*</span>
            </label>
            <select
              id="employee_id"
              name="employee_id"
              className={`form-input ${
                errors.employee_id
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              value={formData.employee_id}
              onChange={handleEmployeeChange}
              required
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstname} {employee.lastname}{" "}
                  {employee.hourly_rate
                    ? `(${new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(employee.hourly_rate)}/h)`
                    : ""}
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="mt-1 text-sm text-red-500">{errors.employee_id}</p>
            )}
          </div>

          {/* Client */}
          <div>
            <label htmlFor="client_id" className="form-label">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              id="client_id"
              name="client_id"
              className={`form-input ${
                errors.client_id
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              value={formData.client_id}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-500">{errors.client_id}</p>
            )}
          </div>

          {/* Détails de la mission */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4 mt-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-primary-500" />
              Détails de la mission
            </h2>
          </div>

          {/* Date de début */}
          <div>
            <label htmlFor="start_date" className="form-label">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              className={`form-input ${
                errors.start_date
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              value={formData.start_date}
              onChange={handleChange}
              required
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
            )}
          </div>

          {/* Date de fin */}
          <div>
            <label htmlFor="end_date" className="form-label">
              Date de fin
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              className={`form-input ${
                errors.end_date
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              value={formData.end_date}
              onChange={handleChange}
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Laissez vide pour une durée indéterminée
            </p>
          </div>

          {/* Lieu de mission */}
          <div>
            <label htmlFor="location" className="form-label flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1 text-gray-500" />
              Lieu de mission
            </label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-input"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ex: Paris, télétravail, locaux du client..."
            />
          </div>

          {/* Horaires de travail */}
          <div>
            <label
              htmlFor="working_hours"
              className="form-label flex items-center"
            >
              <ClockIcon className="w-4 h-4 mr-1 text-gray-500" />
              Horaires de travail
            </label>
            <input
              type="text"
              id="working_hours"
              name="working_hours"
              className="form-input"
              value={formData.working_hours}
              onChange={handleChange}
              placeholder="Ex: 35h/semaine, temps partiel..."
            />
          </div>

          {/* Informations financières */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4 mt-4 flex items-center">
              <CurrencyEuroIcon className="w-5 h-5 mr-2 text-primary-500" />
              Informations financières
            </h2>
          </div>

          {/* Taux horaire */}
          <div>
            <label htmlFor="hourly_rate" className="form-label">
              Taux horaire (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="hourly_rate"
              name="hourly_rate"
              step="0.01"
              min="0"
              className={`form-input ${
                errors.hourly_rate
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              value={formData.hourly_rate}
              onChange={handleHourlyRateChange}
              required
            />
            {errors.hourly_rate && (
              <p className="mt-1 text-sm text-red-500">{errors.hourly_rate}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Taux horaire versé à l'employé
            </p>
          </div>

          {/* Taux de facturation */}
          <div>
            <label htmlFor="billing_rate" className="form-label">
              Taux de facturation (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="billing_rate"
              name="billing_rate"
              step="0.01"
              min="0"
              className={`form-input ${
                errors.billing_rate
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              value={formData.billing_rate}
              onChange={handleChange}
              required
            />
            {errors.billing_rate && (
              <p className="mt-1 text-sm text-red-500">{errors.billing_rate}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Taux horaire facturé au client
            </p>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label htmlFor="notes" className="form-label">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              className="form-input"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notes ou informations supplémentaires..."
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="mt-8 flex justify-end space-x-3">
          <Link to="/contracts" className="btn btn-outline">
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
