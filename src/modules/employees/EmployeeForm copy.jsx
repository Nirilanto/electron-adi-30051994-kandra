// src/modules/employees/EmployeeForm.js - PARTIE 1
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  UserIcon,
  IdentificationIcon,
  MapPinIcon,
  AcademicCapIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  GlobeEuropeAfricaIcon,
  HomeIcon,
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import des services
import EmployeeService from "./EmployeeService";
import SettingsService from "../settings/SettingsService";

function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // États pour le formulaire
  const [employee, setEmployee] = useState({
    firstName: "",
    lastName: "",
    maidenName: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    addressComplement: "",
    postalCode: "",
    city: "",
    country: "France",
    birthDate: null,
    birthCity: "",
    availableDate: null,
    hireDate: null,
    socialSecurityNumber: "",
    nationality: "FRANCAISE",
    familyStatus: "",
    hourlyRate: "",
    skills: "",
    notes: "",
    status: "active",
    employeeNumber: "",
    gender: "M",
    idCardType: "CARTE D'IDENTITÉ",
    idCardNumber: "",
    idCardIssueDate: null,
    idCardExpiryDate: null,
    idCardIssuePlace: "",
    qualification: "MACON",
    paymentMethod: "VIREMENT",
    taxWithholding: 0,
    constructionCard: "",
    urssafNumber: "",
    assedicNumber: "",
    mutualInsurance: false,
  });

  // État pour les listes de paramètres
  const [qualifications, setQualifications] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // État pour le statut de sauvegarde
  const [isSaved, setIsSaved] = useState(false);

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Chargement initial des données et paramètres
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Charger les qualifications depuis le service de paramètres
        const qualificationsData = await SettingsService.getQualifications();
        setQualifications(qualificationsData);

        // Charger les méthodes de paiement depuis le service de paramètres
        const paymentMethodsData = await SettingsService.getPaymentMethods();
        setPaymentMethods(paymentMethodsData);

        // Si on est en mode édition, charger l'employé
        if (isEdit) {
          const employeeData = await EmployeeService.getEmployeeById(id);
          if (employeeData) {
            // Convertir les dates string en objets Date
            const formattedEmployee = {
              ...employeeData,
              birthDate: employeeData.birthDate
                ? new Date(employeeData.birthDate)
                : null,
              hireDate: employeeData.hireDate
                ? new Date(employeeData.hireDate)
                : null,
              availableDate: employeeData.availableDate
                ? new Date(employeeData.availableDate)
                : null,
              idCardIssueDate: employeeData.idCardIssueDate
                ? new Date(employeeData.idCardIssueDate)
                : null,
              idCardExpiryDate: employeeData.idCardExpiryDate
                ? new Date(employeeData.idCardExpiryDate)
                : null,
            };

            setEmployee(formattedEmployee);
            setIsSaved(true);
          } else {
            toast.error("Employé non trouvé");
            navigate("/employees");
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
    const { name, value, type, checked } = e.target;

    setEmployee((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value
            ? parseFloat(value)
            : ""
          : value,
    }));

    // L'employé a été modifié, réinitialiser l'état de sauvegarde
    if (isSaved) {
      setIsSaved(false);
    }

    // Effacer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Gestionnaire de changement de date
  const handleDateChange = (date, field) => {
    setEmployee((prev) => ({
      ...prev,
      [field]: date,
    }));

    // L'employé a été modifié, réinitialiser l'état de sauvegarde
    if (isSaved) {
      setIsSaved(false);
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};

    // Vérifier les champs obligatoires
    if (!employee.firstName.trim()) {
      newErrors.firstName = "Le prénom est obligatoire";
    }

    if (!employee.lastName.trim()) {
      newErrors.lastName = "Le nom de famille est obligatoire";
    }

    // Valider l'email
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    // Valider le taux horaire
    if (employee.hourlyRate && isNaN(parseFloat(employee.hourlyRate))) {
      newErrors.hourlyRate = "Le taux horaire doit être un nombre";
    }

    // Valider le numéro de sécurité sociale
    if (
      employee.socialSecurityNumber &&
      !/^\d{13,15}$/.test(employee.socialSecurityNumber.replace(/\s/g, ""))
    ) {
      newErrors.socialSecurityNumber =
        "Le numéro de sécurité sociale doit contenir 13 à 15 chiffres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Préparer les données pour la soumission
      const employeeData = {
        ...employee,
        birthDate: employee.birthDate ? employee.birthDate.toISOString() : null,
        hireDate: employee.hireDate ? employee.hireDate.toISOString() : null,
        availableDate: employee.availableDate
          ? employee.availableDate.toISOString()
          : null,
        idCardIssueDate: employee.idCardIssueDate
          ? employee.idCardIssueDate.toISOString()
          : null,
        idCardExpiryDate: employee.idCardExpiryDate
          ? employee.idCardExpiryDate.toISOString()
          : null,
      };

      // Créer ou mettre à jour l'employé
      let savedEmployee;
      if (isEdit) {
        savedEmployee = await EmployeeService.updateEmployee(id, employeeData);
        toast.success("Employé mis à jour avec succès");
      } else {
        savedEmployee = await EmployeeService.createEmployee(employeeData);
        toast.success("Employé créé avec succès");

        // Rediriger vers la page de l'employé modifié après un court délai
        setTimeout(() => {
          navigate(`/employees/${savedEmployee.id}`, { replace: true });
        }, 1500);
      }

      setIsSaved(true);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'employé :", error);
      toast.error("Erreur lors de la sauvegarde de l'employé");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement</h3>
          <p className="text-gray-600">Préparation du formulaire employé...</p>
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
                  onClick={() => navigate("/employees")}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Retour"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEdit ? "Modifier l'employé" : "Nouvel employé"}
                  </h1>
                  {employee.employeeNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      N° Employé: {employee.employeeNumber}
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
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Identification */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <IdentificationIcon className="h-5 w-5 mr-2 text-blue-600" />
                Identification
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    N° salarié
                  </label>
                  <input
                    type="text"
                    name="employeeNumber"
                    value={employee.employeeNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Généré automatiquement si vide"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    N° sécurité sociale
                  </label>
                  <input
                    type="text"
                    name="socialSecurityNumber"
                    value={employee.socialSecurityNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.socialSecurityNumber
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="1 23 45 67 890 123 45"
                  />
                  {errors.socialSecurityNumber && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.socialSecurityNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section Informations personnelles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations personnelles
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Civilité
                  </label>
                  <select
                    name="gender"
                    value={employee.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="M">M.</option>
                    <option value="F">Mme</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={employee.lastName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.lastName
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Nom de famille"
                    required
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nom de jeune fille
                  </label>
                  <input
                    type="text"
                    name="maidenName"
                    value={employee.maidenName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Si applicable"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={employee.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.firstName
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Prénom"
                    required
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date de naissance
                  </label>
                  <DatePicker
                    selected={employee.birthDate}
                    onChange={(date) => handleDateChange(date, "birthDate")}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="Sélectionner une date"
                    isClearable
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Ville de naissance
                  </label>
                  <input
                    type="text"
                    name="birthCity"
                    value={employee.birthCity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ville de naissance"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nationalité
                  </label>
                  <select
                    name="nationality"
                    value={employee.nationality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="FRANCAISE">🇫🇷 FRANCAISE</option>
                    <option value="BULGARE">🇧🇬 BULGARE</option>
                    <option value="ALLEMANDE">🇩🇪 ALLEMANDE</option>
                    <option value="ITALIENNE">🇮🇹 ITALIENNE</option>
                    <option value="ESPAGNOLE">🇪🇸 ESPAGNOLE</option>
                    <option value="PORTUGAISE">🇵🇹 PORTUGAISE</option>
                    <option value="BRITANNIQUE">🇬🇧 BRITANNIQUE</option>
                    <option value="AUTRE">🌍 AUTRE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Situation familiale
                  </label>
                  <select
                    name="familyStatus"
                    value={employee.familyStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="CÉLIBATAIRE">CÉLIBATAIRE</option>
                    <option value="MARIÉ(E)">MARIÉ(E)</option>
                    <option value="PACSÉ(E)">PACSÉ(E)</option>
                    <option value="DIVORCÉ(E)">DIVORCÉ(E)</option>
                    <option value="VEUF(VE)">VEUF(VE)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date disponible
                  </label>
                  <DatePicker
                    selected={employee.availableDate}
                    onChange={(date) => handleDateChange(date, "availableDate")}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="Sélectionner une date"
                    isClearable
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={employee.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="active">✅ Actif</option>
                    <option value="inactive">❌ Inactif</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section Contact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations de contact
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={employee.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="01 23 45 67 89"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={employee.mobile}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={employee.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="email@exemple.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section Adresse */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                Adresse
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse numéro voie
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={employee.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="123 rue de la Paix"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Complément adresse
                  </label>
                  <input
                    type="text"
                    name="addressComplement"
                    value={employee.addressComplement}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Bâtiment, étage..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={employee.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="75001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={employee.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Paris"
                  />
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={employee.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="France"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Section Documents d'identité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2 text-blue-600" />
                Documents d'identité
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nat. Titre séjour
                  </label>
                  <select
                    name="idCardType"
                    value={employee.idCardType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="CARTE D'IDENTITÉ">CARTE D'IDENTITÉ</option>
                    <option value="PASSEPORT">PASSEPORT</option>
                    <option value="TITRE DE SÉJOUR">TITRE DE SÉJOUR</option>
                    <option value="CARTE DE RÉSIDENT">CARTE DE RÉSIDENT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    N° Titre Séjour
                  </label>
                  <input
                    type="text"
                    name="idCardNumber"
                    value={employee.idCardNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Numéro du document"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date délivrance
                  </label>
                  <DatePicker
                    selected={employee.idCardIssueDate}
                    onChange={(date) =>
                      handleDateChange(date, "idCardIssueDate")
                    }
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="Sélectionner une date"
                    isClearable
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date fin Tit. Séj.
                  </label>
                  <DatePicker
                    selected={employee.idCardExpiryDate}
                    onChange={(date) =>
                      handleDateChange(date, "idCardExpiryDate")
                    }
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="Sélectionner une date"
                    isClearable
                  />
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Lieu de délivrance
                  </label>
                  <input
                    type="text"
                    name="idCardIssuePlace"
                    value={employee.idCardIssuePlace}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ville ou organisme de délivrance"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Informations professionnelles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations professionnelles
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Qualification
                  </label>
                  <select
                    name="qualification"
                    value={employee.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="MACON">🧱 MACON</option>
                    <option value="CARRELEUR">🔲 CARRELEUR</option>
                    <option value="PLOMBIER">🔧 PLOMBIER</option>
                    <option value="ÉLECTRICIEN">⚡ ÉLECTRICIEN</option>
                    <option value="PEINTRE">🎨 PEINTRE</option>
                    <option value="MENUISIER">🪚 MENUISIER</option>
                    <option value="MANŒUVRE">👷 MANŒUVRE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date d'embauche
                  </label>
                  <DatePicker
                    selected={employee.hireDate}
                    onChange={(date) => handleDateChange(date, "hireDate")}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="Sélectionner une date"
                    isClearable
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Taux horaire
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="hourlyRate"
                      value={employee.hourlyRate}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.hourlyRate
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      €
                    </span>
                  </div>
                  {errors.hourlyRate && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.hourlyRate}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Compétences
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={employee.skills}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ex: Maçonnerie, Carrelage, Plomberie..."
                  />
                  <p className="mt-1 text-xs text-gray-500 flex items-center">
                    <InformationCircleIcon className="h-3 w-3 mr-1" />
                    Séparez les compétences par des virgules
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Paiement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BanknotesIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations de paiement
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Mode de paiement
                  </label>
                  <select
                    name="paymentMethod"
                    value={employee.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="VIREMENT">💳 VIREMENT</option>
                    <option value="CHÈQUE">📄 CHÈQUE</option>
                    <option value="ESPÈCES">💵 ESPÈCES</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Tx prél. source
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="taxWithholding"
                      value={employee.taxWithholding}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="mutualInsurance"
                      checked={employee.mutualInsurance}
                      onChange={handleChange}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    MUTUEL
                  </label>
                  <p className="text-xs text-gray-500 ml-7">
                    Mutuelle d'entreprise
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Administrative */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations administratives
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Carte BTP
                  </label>
                  <input
                    type="text"
                    name="constructionCard"
                    value={employee.constructionCard}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Numéro carte BTP"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    N° URSSAF
                  </label>
                  <input
                    type="text"
                    name="urssafNumber"
                    value={employee.urssafNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Numéro URSSAF"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    N° ASSEDIC
                  </label>
                  <input
                    type="text"
                    name="assedicNumber"
                    value={employee.assedicNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Numéro ASSEDIC"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                Commentaires divers
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Notes et commentaires
                </label>
                <textarea
                  name="notes"
                  rows="4"
                  value={employee.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Informations complémentaires, particularités..."
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => navigate("/employees")}
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

export default EmployeeForm;
