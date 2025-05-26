// src/modules/clients/ClientForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CurrencyEuroIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement</h3>
          <p className="text-gray-600">Préparation du formulaire client...</p>
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
                  onClick={() => navigate('/clients')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Retour"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEdit ? 'Modifier le client' : 'Nouveau client'}
                  </h1>
                  {client.clientNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      N° Client: {client.clientNumber}
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
                Identification client
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Numéro client
                  </label>
                  <input
                    type="text"
                    name="clientNumber"
                    value={client.clientNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Généré automatiquement si vide"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date de création
                  </label>
                  <input
                    type="date"
                    name="creationDate"
                    value={client.creationDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Informations de l'entreprise */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations de l'entreprise
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Raison sociale <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={client.companyName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.companyName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nom de l'entreprise"
                    required
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.companyName}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    SIRET
                  </label>
                  <input
                    type="text"
                    name="siret"
                    value={client.siret}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.siret ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123 456 789 12345"
                  />
                  {errors.siret && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.siret}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 flex items-center">
                    <InformationCircleIcon className="h-3 w-3 mr-1" />
                    Format : 14 chiffres
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Code NAF
                  </label>
                  <input
                    type="text"
                    name="nafCode"
                    value={client.nafCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="ex: 4322A"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={client.status}
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
                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations de contact
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Contact principal
                  </label>
                  <input
                    type="text"
                    name="mainContact"
                    value={client.mainContact}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nom du contact principal"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone contact principal
                  </label>
                  <input
                    type="tel"
                    name="mainContactPhone"
                    value={client.mainContactPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="01 23 45 67 89"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone fixe
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={client.phone}
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
                    value={client.mobile}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="06 12 34 56 78"
                  />
                </div>
                
                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={client.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="contact@entreprise.com"
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Numéro et voie
                  </label>
                  <input
                    type="text"
                    name="addressNumber"
                    value={client.addressNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="123 rue de la Paix"
                  />
                </div>
                
                <div className="lg:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Rue / Voie
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={client.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Complément d'adresse"
                  />
                </div>
                
                <div className="lg:col-span-3 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Complément d'adresse
                  </label>
                  <input
                    type="text"
                    name="addressComplement"
                    value={client.addressComplement}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Bâtiment, étage, appartement..."
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={client.postalCode}
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
                    value={client.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Paris"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={client.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="France"
                  />
                </div>
              </div>

              {/* Adresse de facturation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Adresse de facturation (si différente)
                </label>
                <input
                  type="text"
                  name="billingAddress"
                  value={client.billingAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Adresse complète de facturation..."
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <InformationCircleIcon className="h-3 w-3 mr-1" />
                  Laissez vide pour utiliser l'adresse principale
                </p>
              </div>
            </div>
          </div>

          {/* Section Tarifs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CurrencyEuroIcon className="h-5 w-5 mr-2 text-blue-600" />
                Tarifs et frais
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Frais de panier par jour
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      name="basketFees"
                      value={client.basketFees}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      €
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Frais de déplacement par jour
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      name="travelFees"
                      value={client.travelFees}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                Informations supplémentaires
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
                  value={client.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Informations complémentaires, particularités du client..."
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => navigate('/clients')}
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

export default ClientForm;