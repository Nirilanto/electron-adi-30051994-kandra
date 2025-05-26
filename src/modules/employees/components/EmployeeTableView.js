// src/modules/employees/components/EmployeeTableView.js
import React from 'react';
import { 
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const EmployeeTableView = ({ employees, onView, onEdit, onDelete }) => {
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
          icon: CheckBadgeIcon,
          label: 'Actif',
          className: 'bg-green-100 text-green-800'
        };
      case 'inactive':
        return {
          icon: ExclamationTriangleIcon,
          label: 'Inactif',
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: UserIcon,
          label: 'Inconnu',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
      {/* Arrière-plan décoratif */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/20"></div>
      
      <div className="relative overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50">
          {/* En-tête du tableau */}
          <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Employé
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Qualification
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Taux horaire
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          {/* Corps du tableau */}
          <tbody className="divide-y divide-gray-200/30">
            {employees.map((employee) => {
              const firstName = employee.firstName || employee.firstname || '';
              const lastName = employee.lastName || employee.lastname || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Nom inconnu';
              const statusConfig = getStatusConfig(employee.status);
              const StatusIcon = statusConfig.icon;

              return (
                <tr 
                  key={employee.id} 
                  className="group hover:bg-white/60 transition-all duration-200 cursor-pointer"
                  onClick={() => onView(employee.id)}
                >
                  {/* Colonne Employé */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* Avatar */}
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <span className="text-sm font-bold text-white">
                          {getInitials(employee)}
                        </span>
                      </div>
                      
                      {/* Informations */}
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {fullName}
                        </div>
                        {employee.employeeNumber && (
                          <div className="text-xs text-gray-500">
                            N° {employee.employeeNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Colonne Contact */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.email || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.phone || employee.mobile || '-'}
                    </div>
                  </td>

                  {/* Colonne Qualification */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.qualification ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {employee.qualification}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>

                  {/* Colonne Taux horaire */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.hourlyRate
                        ? new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(employee.hourlyRate)
                        : '-'}
                    </div>
                  </td>

                  {/* Colonne Statut */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </td>

                  {/* Colonne Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(employee.id);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Voir le profil"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(employee.id);
                        }}
                        className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(employee);
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTableView;