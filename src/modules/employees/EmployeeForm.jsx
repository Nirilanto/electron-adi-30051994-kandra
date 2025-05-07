// src/modules/employees/EmployeeForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  UserIcon,
  IdentificationIcon,
  MapPinIcon,
  AcademicCapIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import EmployeeService from './EmployeeService';

function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // États pour le formulaire
  const [employee, setEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    birthDate: null,
    hireDate: null,
    hourlyRate: '',
    skills: '',
    notes: '',
    status: 'active'
  });

  // État pour le statut de sauvegarde
  const [isSaved, setIsSaved] = useState(false);
  
  // État pour le chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Si on est en mode édition, charger l'employé
        if (isEdit) {
          const employeeData = await EmployeeService.getEmployeeById(id);
          if (employeeData) {
            // Convertir les dates string en objets Date
            const formattedEmployee = {
              ...employeeData,
              birthDate: employeeData.birthDate ? new Date(employeeData.birthDate) : null,
              hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : null
            };
            
            setEmployee(formattedEmployee);
            setIsSaved(true);
          } else {
            toast.error('Employé non trouvé');
            navigate('/employees');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEdit, navigate]);

  // Gestionnaire de changement de champ
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setEmployee(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : '') : value
    }));
    
    // L'employé a été modifié, réinitialiser l'état de sauvegarde
    if (isSaved) {
      setIsSaved(false);
    }
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Gestionnaire de changement de date
  const handleDateChange = (date, field) => {
    setEmployee(prev => ({
      ...prev,
      [field]: date
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
      newErrors.firstName = 'Le prénom est obligatoire';
    }
    
    if (!employee.lastName.trim()) {
      newErrors.lastName = 'Le nom de famille est obligatoire';
    }
    
    // Valider l'email
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    
    // Valider le taux horaire
    if (employee.hourlyRate && isNaN(parseFloat(employee.hourlyRate))) {
      newErrors.hourlyRate = 'Le taux horaire doit être un nombre';
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
        hireDate: employee.hireDate ? employee.hireDate.toISOString() : null
      };
      
      // Créer ou mettre à jour l'employé
      let savedEmployee;
      if (isEdit) {
        savedEmployee = await EmployeeService.updateEmployee(id, employeeData);
        toast.success('Employé mis à jour avec succès');
      } else {
        savedEmployee = await EmployeeService.createEmployee(employeeData);
        toast.success('Employé créé avec succès');
        
        // Rediriger vers la page de l'employé modifié après un court délai
        setTimeout(() => {
          navigate(`/employees/${savedEmployee.id}`, { replace: true });
        }, 1500);
      }
      
      setIsSaved(true);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'employé :', error);
      toast.error('Erreur lors de la sauvegarde de l\'employé');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'employé...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/employees')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier l\'employé' : 'Nouvel employé'}
          </h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Informations personnelles */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
            Informations personnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={employee.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={employee.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance
              </label>
              <DatePicker
                id="birthDate"
                selected={employee.birthDate}
                onChange={(date) => handleDateChange(date, 'birthDate')}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                isClearable
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={employee.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Informations de contact */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <IdentificationIcon className="h-5 w-5 mr-2 text-blue-500" />
            Informations de contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={employee.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={employee.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Adresse */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-blue-500" />
            Adresse
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={employee.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Code postal
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={employee.postalCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={employee.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Pays
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={employee.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Informations professionnelles */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-500" />
            Informations professionnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date d'embauche
              </label>
              <DatePicker
                id="hireDate"
                selected={employee.hireDate}
                onChange={(date) => handleDateChange(date, 'hireDate')}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                isClearable
              />
            </div>
            
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Taux horaire (€)
              </label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={employee.hourlyRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hourlyRate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hourlyRate && (
                <p className="mt-1 text-sm text-red-500">{errors.hourlyRate}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                Compétences
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={employee.skills}
                onChange={handleChange}
                placeholder="Ex: Développement, Design, Marketing..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Séparez les compétences par des virgules</p>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
            Informations supplémentaires
          </h2>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              value={employee.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center px-6 py-2 rounded-md ${
              isSubmitting 
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            {isSubmitting 
              ? 'Enregistrement...'
              : isSaved 
                ? 'Mettre à jour'
                : 'Enregistrer'
            }
          </button>
        </div>
      </form>
      
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default EmployeeForm;