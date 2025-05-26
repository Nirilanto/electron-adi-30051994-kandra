// src/modules/employees/components/EmployeeListView.js
import React from 'react';
import { 
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyEuroIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

const EmployeeListView = ({ employees, onView, onEdit, onDelete }) => {
  const getInitials = (employee) => {
    const firstName = employee.firstName || employee.firstname || '';
    const lastName = employee.lastName || employee.lastname || '';
    if (!firstName || !lastName) return '??';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-green-400 to-emerald-500',
          text: 'text-white',
          icon: CheckBadgeIcon,
          label: 'Actif',
          dot: 'bg-green-400'
        };
      case 'inactive':
        return {
          bg: 'bg-gradient-to-r from-red-400 to-rose-500',
          text: 'text-white',
          icon: ExclamationTriangleIcon,
          label: 'Inactif',
          dot: 'bg-red-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: 'text-white',
          icon: UserIcon,
          label: 'Inconnu',
          dot: 'bg-gray-400'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {employees.map((employee) => {
        const firstName = employee.firstName || employee.firstname || '';
        const lastName = employee.lastName || employee.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Nom inconnu';
        const statusConfig = getStatusConfig(employee.status);
        const StatusIcon = statusConfig.icon;

        return (
          <div 
            key={employee.id}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-md border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
          >
            {/* Arrière-plan avec gradient subtil */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-indigo-50/10 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Indicateur de statut */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.bg}`}></div>
            
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                {/* Section principale */}
                <div className="flex items-start space-x-6 flex-1">
                  {/* Avatar et statut */}
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <span className="text-xl font-bold text-white">
                        {getInitials(employee)}
                      </span>
                    </div>
                    {/* Badge de statut */}
                    <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-lg ${statusConfig.bg} flex items-center justify-center shadow-md`}>
                      <StatusIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  {/* Informations principales */}
                  <div className="flex-1 min-w-0">
                    {/* Nom et statut */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {fullName}
                        </h3>
                        <div className="flex items-center mt-1 space-x-3">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${statusConfig.dot} mr-2`}></div>
                            <span className="text-sm font-medium text-gray-600">
                              {statusConfig.label}
                            </span>
                          </div>
                          {employee.employeeNumber && (
                            <span className="text-sm text-gray-500">
                              N° {employee.employeeNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Qualification */}
                      {employee.qualification && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {employee.qualification}
                        </span>
                      )}
                    </div>

                    {/* Grille d'informations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Contact */}
                      {employee.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}
                      
                      {(employee.phone || employee.mobile) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{employee.phone || employee.mobile}</span>
                        </div>
                      )}
                      
                      {/* Taux horaire */}
                      {employee.hourlyRate && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CurrencyEuroIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-medium">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(employee.hourlyRate)}/h
                          </span>
                        </div>
                      )}
                      
                      {/* Date d'embauche */}
                      {employee.hireDate && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Embauché le {formatDate(employee.hireDate)}</span>
                        </div>
                      )}
                      
                      {/* Adresse */}
                      {(employee.city || employee.address) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">
                            {employee.city || employee.address}
                          </span>
                        </div>
                      )}
                      
                      {/* Nationalité */}
                      {employee.nationality && employee.nationality !== 'FRANCAISE' && (
                        <div className="flex items-center text-sm text-gray-600">
                          <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{employee.nationality}</span>
                        </div>
                      )}
                    </div>

                    {/* Compétences */}
                    {employee.skills && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Compétences :</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{employee.skills}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => onView(employee.id)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Voir le profil"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Profil
                  </button>
                  
                  <button
                    onClick={() => onEdit(employee.id)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Modifier
                  </button>
                  
                  <button
                    onClick={() => onDelete(employee)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Supprimer"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeListView;