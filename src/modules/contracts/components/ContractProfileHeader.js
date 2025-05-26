// src/modules/contracts/components/ContractProfileHeader.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const ContractProfileHeader = ({ contract, onGenerateClientPDF, onGenerateEmployeePDF, isPdfGenerating }) => {
  const navigate = useNavigate();

  const getStatusConfig = () => {
    if (!contract.endDate) {
      return {
        bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
        text: 'text-white',
        icon: DocumentTextIcon,
        label: 'En cours'
      };
    }

    const today = new Date();
    const endDate = new Date(contract.endDate);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (endDate < today) {
      return {
        bg: 'bg-gradient-to-r from-red-400 to-rose-500',
        text: 'text-white',
        icon: ExclamationTriangleIcon,
        label: 'Expiré'
      };
    } else if (daysLeft <= 7) {
      return {
        bg: 'bg-gradient-to-r from-orange-400 to-amber-500',
        text: 'text-white',
        icon: ClockIcon,
        label: 'Bientôt expiré'
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-green-400 to-emerald-500',
        text: 'text-white',
        icon: CheckBadgeIcon,
        label: 'Actif'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Arrière-plan avec gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
      
      {/* Motif décoratif */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-blue-500"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-purple-500"></div>
      </div>

      <div className="relative px-6 py-8">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-6">
            {/* Bouton retour */}
            <button
              onClick={() => navigate('/contracts')}
              className="group mt-2 p-3 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
              aria-label="Retour"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
            </button>
            
            {/* Avatar et informations */}
            <div className="flex items-start space-x-6">
              {/* Avatar moderne */}
              <div className="relative group">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl ring-4 ring-white/20 backdrop-blur-sm transition-transform group-hover:scale-105">
                  <DocumentTextIcon className="h-12 w-12 text-white" />
                </div>
                {/* Indicateur de statut */}
                <div className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-xl ${statusConfig.bg} flex items-center justify-center shadow-lg ring-3 ring-white`}>
                  <StatusIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              
              {/* Informations principales */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                  {contract.title || 'Contrat sans titre'}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Badge de statut */}
                  {/* <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text} shadow-lg`}>
                    <StatusIcon className="h-4 w-4 mr-1.5" />
                    {statusConfig.label}
                  </span>
                   */}
                  {/* Numéro de contrat */}
                  {contract.contractNumber && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/80 text-gray-700 shadow-md backdrop-blur-sm border border-white/20">
                      N° {contract.contractNumber}
                    </span>
                  )}
                  
                  {/* Durée */}
                  {contract.startDate && contract.endDate && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/80 text-gray-600 shadow-md backdrop-blur-sm border border-white/20">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </span>
                  )}
                </div>
                
                {/* Informations secondaires */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {contract.client?.companyName && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      Client: {contract.client.companyName}
                    </div>
                  )}
                  {contract.employee && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Consultant: {`${contract.employee.firstName || ''} ${contract.employee.lastName || ''}`.trim()}
                    </div>
                  )}
                  {contract.location && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                      {contract.location}
                    </div>
                  )}
                  {contract.billingRate && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                      {formatCurrency(contract.billingRate)}/h
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Boutons d'action modernes */}
          <div className="flex flex-col space-y-3">
            {/* Bouton Modifier */}
            <button
              onClick={() => navigate(`/contracts/${contract.id}/edit`)}
              className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <PencilIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              <span className="font-medium">Modifier</span>
            </button>
            
            {/* Boutons PDF */}
            <div className="flex space-x-2">
              <button
                onClick={onGenerateClientPDF}
                disabled={isPdfGenerating?.client}
                className={`group flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                  isPdfGenerating?.client
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                }`}
                title="Générer PDF Client"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">
                  {isPdfGenerating?.client ? 'Génération...' : 'PDF Client'}
                </span>
              </button>
              
              <button
                onClick={onGenerateEmployeePDF}
                disabled={isPdfGenerating?.employee || !contract.employeeId}
                className={`group flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                  isPdfGenerating?.employee || !contract.employeeId
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                }`}
                title="Générer PDF Employé"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">
                  {isPdfGenerating?.employee ? 'Génération...' : 'PDF Salarié'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractProfileHeader;