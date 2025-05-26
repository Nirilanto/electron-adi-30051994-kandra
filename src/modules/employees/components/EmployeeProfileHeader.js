// src/modules/employees/components/EmployeeProfileHeader.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const EmployeeProfileHeader = ({ employee }) => {
  const navigate = useNavigate();

  const getInitials = () => {
    if (!employee.firstName || !employee.lastName) return '??';
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusConfig = () => {
    switch (employee.status) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-green-400 to-emerald-500',
          text: 'text-white',
          icon: CheckBadgeIcon,
          label: 'Actif'
        };
      case 'inactive':
        return {
          bg: 'bg-gradient-to-r from-red-400 to-rose-500',
          text: 'text-white',
          icon: ExclamationTriangleIcon,
          label: 'Inactif'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: 'text-white',
          icon: UserIcon,
          label: 'Inconnu'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

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
              onClick={() => navigate('/employees')}
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
                  <span className="text-2xl font-bold text-white">
                    {getInitials()}
                  </span>
                </div>
                {/* Indicateur de statut */}
                <div className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-xl ${statusConfig.bg} flex items-center justify-center shadow-lg ring-3 ring-white`}>
                  <StatusIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              
              {/* Informations principales */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                  {employee.firstName} {employee.lastName}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Badge de statut */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text} shadow-lg`}>
                    <StatusIcon className="h-4 w-4 mr-1.5" />
                    {statusConfig.label}
                  </span>
                  
                  {/* Qualification */}
                  {employee.qualification && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/80 text-gray-700 shadow-md backdrop-blur-sm border border-white/20">
                      {employee.qualification}
                    </span>
                  )}
                  
                  {/* Numéro employé */}
                  {employee.employeeNumber && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/80 text-gray-600 shadow-md backdrop-blur-sm border border-white/20">
                      N° {employee.employeeNumber}
                    </span>
                  )}
                </div>
                
                {/* Informations secondaires */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {employee.email && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      {employee.email}
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      {employee.phone}
                    </div>
                  )}
                  {employee.hourlyRate && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      }).format(employee.hourlyRate)}/h
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bouton d'action moderne */}
          <button
            onClick={() => navigate(`/employees/${employee.id}/edit`)}
            className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <PencilIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Modifier</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileHeader;