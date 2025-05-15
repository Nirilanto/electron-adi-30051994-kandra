// src/modules/clients/ClientForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  IdentificationIcon,
  PhoneIcon,
  CalendarIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ClientService from './ClientService';

function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // États pour le formulaire
  const [client, setClient] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    addressNumber: '',
    addressComplement: '',
    postalCode: '',
    city: '',
    country: 'France',
    siret: '',
    notes: '',
    status: 'active',
    clientNumber: '',
    billingAddress: '',
    mainContact: '',
    mainContactPhone: '',
    creationDate: '',
    basketFees: '',
    travelFees: '',
    nafCode: ''
  });

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errors, setErrors] = useState({});

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Si on est en mode édition, charger le client
        if (isEdit) {
          const clientData = await ClientService.getClientById(id);
          if (clientData) {
            setClient(clientData);
            setIsSaved(true);
          } else {
            toast.error('Client non trouvé');
            navigate('/clients');
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
    const { name, value } = e.target;
    
    setClient(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Le client a été modifié, réinitialiser l'état de sauvegarde
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

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    // Vérifier les champs obligatoires
    if (!client.companyName.trim()) {
      newErrors.companyName = 'Le nom de l\'entreprise est obligatoire';
    }
    
    // Valider l'email
    if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    
    // Valider le SIRET
    if (client.siret && !/^\d{14}$/.test(client.siret.replace(/\s/g, ''))) {
      newErrors.siret = 'Le numéro SIRET doit comporter 14 chiffres';
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
      const clientData = {
        ...client,
        // Nettoyer le SIRET
        siret: client.siret ? client.siret.replace(/\s/g, '') : client.siret
      };
      
      // Créer ou mettre à jour le client
      let savedClient;
      if (isEdit) {
        savedClient = await ClientService.updateClient(id, clientData);
        toast.success('Client mis à jour avec succès');
      } else {
        savedClient = await ClientService.createClient(clientData);
        toast.success('Client créé avec succès');
        
        // Rediriger vers la page du client modifié après un court délai
        setTimeout(() => {
          navigate(`/clients/${savedClient.id}`, { replace: true });
        }, 1500);
      }
      
      setIsSaved(true);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client :', error);
      toast.error('Erreur lors de la sauvegarde du client');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du client...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/clients')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier le client' : 'Nouveau client'}
          </h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Numéro Client */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <IdentificationIcon className="h-5 w-5 mr-2 text-blue-500" />
            Identification client
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientNumber" className="block text-sm font-medium text-gray-700 mb-1">
                N° client
              </label>
              <input
                type="text"
                id="clientNumber"
                name="clientNumber"
                value={client.clientNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      
        {/* Informations de l'entreprise */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
            Informations de l'entreprise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Raison sociale <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={client.companyName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.companyName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-1">
                SIRET
              </label>
              <input
                type="text"
                id="siret"
                name="siret"
                value={client.siret}
                onChange={handleChange}
                placeholder="123 456 789 12345"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.siret ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.siret && (
                <p className="mt-1 text-sm text-red-500">{errors.siret}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Format : 14 chiffres</p>
            </div>
            
            <div>
              <label htmlFor="nafCode" className="block text-sm font-medium text-gray-700 mb-1">
                Code NAF
              </label>
              <input
                type="text"
                id="nafCode"
                name="nafCode"
                value={client.nafCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={client.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="creationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date de création
              </label>
              <input
                type="date"
                id="creationDate"
                name="creationDate"
                value={client.creationDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Informations de contact */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
            Informations de contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mainContact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact principal
              </label>
              <input
                type="text"
                id="mainContact"
                name="mainContact"
                value={client.mainContact}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="mainContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Tél contact principal
              </label>
              <input
                type="tel"
                id="mainContactPhone"
                name="mainContactPhone"
                value={client.mainContactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={client.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={client.mobile}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={client.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
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
            <div>
              <label htmlFor="addressNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse numéro voie
              </label>
              <input
                type="text"
                id="addressNumber"
                name="addressNumber"
                value={client.addressNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Rue
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={client.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-3">
              <label htmlFor="addressComplement" className="block text-sm font-medium text-gray-700 mb-1">
                Complément Adr.
              </label>
              <input
                type="text"
                id="addressComplement"
                name="addressComplement"
                value={client.addressComplement}
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
                value={client.postalCode}
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
                value={client.city}
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
                value={client.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse facturation
              </label>
              <input
                type="text"
                id="billingAddress"
                name="billingAddress"
                value={client.billingAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Tarifs */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CurrencyEuroIcon className="h-5 w-5 mr-2 text-blue-500" />
            Tarifs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="basketFees" className="block text-sm font-medium text-gray-700 mb-1">
                Frais de panier/j
              </label>
              <input
                type="number"
                step="0.01"
                id="basketFees"
                name="basketFees"
                value={client.basketFees}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="travelFees" className="block text-sm font-medium text-gray-700 mb-1">
                Frais déplacement/j
              </label>
              <input
                type="number"
                step="0.01"
                id="travelFees"
                name="travelFees"
                value={client.travelFees}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              value={client.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/clients')}
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

export default ClientForm;