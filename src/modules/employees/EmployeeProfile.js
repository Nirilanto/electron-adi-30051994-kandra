// src/modules/employees/EmployeeProfile.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  InformationCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  IdentificationIcon,
  BanknotesIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import EmployeeService from './EmployeeService';

function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('informations');
  const [isLoading, setIsLoading] = useState(true);

  // Chargement initial des données
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setIsLoading(true);
        const employeeData = await EmployeeService.getEmployeeById(id);
        if (employeeData) {
          setEmployee(employeeData);
        } else {
          toast.error('Employé non trouvé');
          navigate('/employees');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'employé :', error);
        toast.error('Erreur lors du chargement de l\'employé');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadEmployee();
    }
  }, [id, navigate]);

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Fonction pour formater la monnaie
  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Employé non trouvé</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'informations', label: 'Informations', icon: InformationCircleIcon },
    { id: 'apropos', label: 'À propos', icon: UserIcon },
    { id: 'historique', label: 'Historique', icon: DocumentTextIcon },
    { id: 'pointage', label: 'Pointage', icon: ClockIcon }
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      {/* En-tête du profil */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/employees')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
              aria-label="Retour"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <div className="flex items-center mt-1 space-x-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                  {employee.qualification && (
                    <span className="text-sm text-gray-600">
                      {employee.qualification}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate(`/employees/${id}/edit`)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifier
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="p-6">
        {activeTab === 'informations' && (
          <div className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Civilité</label>
                  <p className="text-gray-900">{employee.gender === 'M' ? 'M.' : 'Mme'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom de jeune fille</label>
                  <p className="text-gray-900">{employee.maidenName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de naissance</label>
                  <p className="text-gray-900">{formatDate(employee.birthDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Ville de naissance</label>
                  <p className="text-gray-900">{employee.birthCity || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Nationalité</label>
                  <p className="text-gray-900">{employee.nationality || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Situation familiale</label>
                  <p className="text-gray-900">{employee.familyStatus || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">N° sécurité sociale</label>
                  <p className="text-gray-900">{employee.socialSecurityNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date disponible</label>
                  <p className="text-gray-900">{formatDate(employee.availableDate)}</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2 text-blue-500" />
                Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <p className="text-gray-900">{employee.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Mobile</label>
                  <p className="text-gray-900">{employee.mobile || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{employee.email || '-'}</p>
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-blue-500" />
                Adresse
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">
                  {[
                    employee.address,
                    employee.addressComplement,
                    employee.postalCode && employee.city ? `${employee.postalCode} ${employee.city}` : '',
                    employee.country !== 'France' ? employee.country : ''
                  ].filter(Boolean).join(', ') || 'Aucune adresse renseignée'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apropos' && (
          <div className="space-y-6">
            {/* Documents d'identité */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <IdentificationIcon className="h-5 w-5 mr-2 text-blue-500" />
                Documents d'identité
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Type de document</label>
                  <p className="text-gray-900">{employee.idCardType || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Numéro</label>
                  <p className="text-gray-900">{employee.idCardNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de délivrance</label>
                  <p className="text-gray-900">{formatDate(employee.idCardIssueDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date d'expiration</label>
                  <p className="text-gray-900">{formatDate(employee.idCardExpiryDate)}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Lieu de délivrance</label>
                  <p className="text-gray-900">{employee.idCardIssuePlace || '-'}</p>
                </div>
              </div>
            </div>

            {/* Informations professionnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-500" />
                Informations professionnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">N° employé</label>
                  <p className="text-gray-900">{employee.employeeNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Qualification</label>
                  <p className="text-gray-900">{employee.qualification || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date d'embauche</label>
                  <p className="text-gray-900">{formatDate(employee.hireDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Taux horaire</label>
                  <p className="text-gray-900">{formatCurrency(employee.hourlyRate)}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Compétences</label>
                  <p className="text-gray-900">{employee.skills || 'Aucune compétence renseignée'}</p>
                </div>
              </div>
            </div>

            {/* Informations de paiement */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <BanknotesIcon className="h-5 w-5 mr-2 text-blue-500" />
                Informations de paiement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Mode de paiement</label>
                  <p className="text-gray-900">{employee.paymentMethod || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Taux prélèvement source</label>
                  <p className="text-gray-900">{employee.taxWithholding ? `${employee.taxWithholding}%` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Mutuelle</label>
                  <p className="text-gray-900">{employee.mutualInsurance ? 'Oui' : 'Non'}</p>
                </div>
              </div>
            </div>

            {/* Informations administratives */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
                Informations administratives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Carte BTP</label>
                  <p className="text-gray-900">{employee.constructionCard || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">N° URSSAF</label>
                  <p className="text-gray-900">{employee.urssafNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">N° ASSEDIC</label>
                  <p className="text-gray-900">{employee.assedicNumber || '-'}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {employee.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{employee.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'historique' && (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Historique des contrats</h3>
            <p className="text-gray-500">
              Cette section affichera l'historique des contrats de l'employé.
            </p>
            <p className="text-sm text-gray-400 mt-2">Fonctionnalité à venir...</p>
          </div>
        )}

        {activeTab === 'pointage' && (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Système de pointage</h3>
            <p className="text-gray-500">
              Cette section permettra de gérer les pointages et les heures de travail.
            </p>
            <p className="text-sm text-gray-400 mt-2">Fonctionnalité à venir...</p>
          </div>
        )}
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default EmployeeProfile;