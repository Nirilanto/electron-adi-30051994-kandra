import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DatabaseService from '../../services/DatabaseService';

// Icônes
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // État du formulaire
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'France',
    siret: '',
    notes: '',
    status: 'active'
  });
  
  // États pour gérer le chargement et les erreurs
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Charger les données du client si on est en mode édition
  useEffect(() => {
    const loadClient = async () => {
      if (isEditMode) {
        try {
          const clientData = await DatabaseService.getClientById(parseInt(id));
          // Mettre à jour les données du formulaire
          setFormData({
            ...formData,
            ...clientData
          });
        } catch (error) {
          console.error('Erreur lors du chargement du client:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadClient();
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
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Le nom de l\'entreprise est obligatoire';
    }
    
    // Valider l'email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    
    // Valider le SIRET
    if (formData.siret && !/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
      newErrors.siret = 'Le numéro SIRET doit comporter 14 chiffres';
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
      const clientData = {
        ...formData,
        // Nettoyer le SIRET
        siret: formData.siret ? formData.siret.replace(/\s/g, '') : formData.siret
      };
      
      // Créer ou mettre à jour le client
      if (isEditMode) {
        await DatabaseService.updateClient(parseInt(id), clientData);
        setSuccessMessage('Client mis à jour avec succès');
      } else {
        const newClient = await DatabaseService.createClient(clientData);
        setSuccessMessage('Client créé avec succès');
        
        // Rediriger vers le mode édition après la création
        setTimeout(() => {
          navigate(`/clients/${newClient.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client:', error);
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
          <p className="mt-4 text-gray-600">Chargement des données du client...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/clients" className="text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? 'Modifier le client' : 'Nouveau client'}
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
          {/* Informations de l'entreprise */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Informations de l'entreprise</h2>
          </div>
          
          {/* Nom de l'entreprise */}
          <div className="md:col-span-2">
            <label htmlFor="company_name" className="form-label">
              Nom de l'entreprise <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              className={`form-input ${errors.company_name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              value={formData.company_name}
              onChange={handleChange}
              required
            />
            {errors.company_name && (
              <p className="mt-1 text-sm text-red-500">{errors.company_name}</p>
            )}
          </div>
          
          {/* SIRET */}
          <div className="md:col-span-2">
            <label htmlFor="siret" className="form-label">
              Numéro SIRET
            </label>
            <input
              type="text"
              id="siret"
              name="siret"
              className={`form-input ${errors.siret ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              value={formData.siret}
              onChange={handleChange}
              placeholder="123 456 789 12345"
            />
            {errors.siret && (
              <p className="mt-1 text-sm text-red-500">{errors.siret}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">Format : 14 chiffres sans espaces</p>
          </div>
          
          {/* Informations de contact */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4 mt-4">Informations de contact</h2>
          </div>
          
          {/* Nom du contact */}
          <div>
            <label htmlFor="contact_name" className="form-label">Nom du contact</label>
            <input
              type="text"
              id="contact_name"
              name="contact_name"
              className="form-input"
              value={formData.contact_name}
              onChange={handleChange}
            />
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
          
          {/* Statut */}
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
          
          {/* Notes */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-700 mb-4 mt-4">Informations supplémentaires</h2>
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
          <Link to="/clients" className="btn btn-outline">
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

export default ClientForm;