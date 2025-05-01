import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DatabaseService from '../../services/DatabaseService';

// Icônes
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // État du formulaire
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'France',
    birth_date: '',
    hire_date: '',
    hourly_rate: '',
    skills: '',
    notes: '',
    status: 'active'
  });
  
  // États pour gérer le chargement et les erreurs
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Charger les données de l'employé si on est en mode édition
  useEffect(() => {
    const loadEmployee = async () => {
      if (isEditMode) {
        try {
          const employeeData = await DatabaseService.getEmployeeById(parseInt(id));
          // Mettre à jour les données du formulaire
          setFormData({
            ...formData,
            ...employeeData
          });
        } catch (error) {
          console.error('Erreur lors du chargement de l\'employé:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadEmployee();
  }, [id, isEditMode]);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    // Vérifier les champs obligatoires
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'Le prénom est obligatoire';
    }
    
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Le nom de famille est obligatoire';
    }
    
    // Valider l'email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    
    // Valider le taux horaire
    if (formData.hourly_rate && isNaN(parseFloat(formData.hourly_rate))) {
      newErrors.hourly_rate = 'Le taux horaire doit être un nombre';
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
      const employeeData = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : 0
      };
      
      // Créer ou mettre à jour l'employé
      if (isEditMode) {
        await DatabaseService.updateEmployee(parseInt(id), employeeData);
        setSuccessMessage('Employé mis à jour avec succès');
      } else {
        const newEmployee = await DatabaseService.createEmployee(employeeData);
        setSuccessMessage('Employé créé avec succès');
        
        // Rediriger vers le mode édition après la création
        setTimeout(() => {
          navigate(`/employees/${newEmployee.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'employé:', error);
      setErrors({
        ...errors,
        submit: 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.'
      });
    } finally {
      setSaving(false);
      
      // Faire disparaître le message de succès après quelques secondes
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage('');
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
          <p className="mt-4 text-gray-600">Chargement des données de l'employé...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/employees" className="text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? 'Modifier l\'employé' : 'Nouvel employé'}
          </h1>
        </div>
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

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations personnelles */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Informations personnelles</h2>
          </div>
          
          {/* Prénom */}
          <div>
            <label htmlFor="firstname" className="form-label">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              className={`form-input ${errors.firstname ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              value={formData.firstname}
              onChange={handleChange}
              required
            />
            {errors.firstname && (
              <p className="mt-1 text-sm text-red-500">{errors.firstname}</p>
            )}
          </div>
          
          {/* Nom */}
          <div>
            <label htmlFor="lastname" className="form-label">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              className={`form-input ${errors.lastname ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              value={formData.lastname}
              onChange={handleChange}
              required
            />
            {errors.lastname && (
              <p className="mt-1 text-sm text-red-500">{errors.lastname}</p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          
          {/* Téléphone */}
          <div>
            <label htmlFor="phone" className="form-label">Téléphone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          {/* Date de naissance */}
          <div>
            <label htmlFor="birth_date" className="form-label">Date de naissance</label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              className="form-input"
              value={formData.birth_date}
              onChange={handleChange}
            />
          </div>
          
          {/* Date d'embauche */}
          <div>
            <label htmlFor="hire_date" className="form-label">Date d'embauche</label>
            <input
              type="date"
              id="hire_date"
              name="hire_date"
              className="form-input"
              value={formData.hire_date}
              onChange={handleChange}
            />
          </div>
          
          {/* Adresse */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4 mt-4">Adresse</h2>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="address" className="form-label">Adresse</label>
            <input
              type="text"
              id="address"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="postal_code" className="form-label">Code postal</label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              className="form-input"
              value={formData.postal_code}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="city" className="form-label">Ville</label>
            <input
              type="text"
              id="city"
              name="city"
              className="form-input"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="country" className="form-label">Pays</label>
            <input
              type="text"
              id="country"
              name="country"
              className="form-input"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
          
          {/* Informations professionnelles */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4 mt-4">Informations professionnelles</h2>
          </div>
          
          <div>
            <label htmlFor="hourly_rate" className="form-label">Taux horaire (€)</label>
            <input
              type="number"
              id="hourly_rate"
              name="hourly_rate"
              step="0.01"
              min="0"
              className={`form-input ${errors.hourly_rate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              value={formData.hourly_rate}
              onChange={handleChange}
            />
            {errors.hourly_rate && (
              <p className="mt-1 text-sm text-red-500">{errors.hourly_rate}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="status" className="form-label">Statut</label>
            <select
              id="status"
              name="status"
              className="form-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="skills" className="form-label">Compétences</label>
            <input
              type="text"
              id="skills"
              name="skills"
              className="form-input"
              value={formData.skills}
              onChange={handleChange}
              placeholder="Ex: Développement, Design, Marketing..."
            />
            <p className="mt-1 text-sm text-gray-500">Séparez les compétences par des virgules</p>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              className="form-input"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
        </div>
        
        {/* Boutons */}
        <div className="mt-8 flex justify-end space-x-3">
          <Link to="/employees" className="btn btn-outline">
            Annuler
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;