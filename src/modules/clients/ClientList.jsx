// src/modules/clients/ClientList.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DatabaseService from "../../services/DatabaseService";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icônes
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  SparklesIcon,
  GlobeEuropeAfricaIcon,
  UserIcon
} from "@heroicons/react/24/outline";

// Composants de vue
import ViewSelector from '../employees/components/ViewSelector';

// Barre de recherche moderne
const ModernSearchBar = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 p-2">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>
      
      <div className="relative flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500"
              placeholder="Rechercher par entreprise, contact, email ou SIRET..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center bg-white/60 rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50/50 border-r border-gray-200/50">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
            </div>
            <select
              className="px-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 font-medium min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Carte client moderne
const ClientCard = ({ client, onView, onEdit, onDelete }) => {
  const getInitials = () => {
    const companyName = client.companyName || client.company_name || '';
    if (!companyName) return '??';
    return companyName.substring(0, 2).toUpperCase();
  };

  const getStatusConfig = () => {
    switch (client.status) {
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
          icon: BuildingOfficeIcon,
          label: 'Inconnu',
          dot: 'bg-gray-400'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const companyName = client.companyName || client.company_name || 'Entreprise inconnue';

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.bg}`}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-xl font-bold text-white">
                  {getInitials()}
                </span>
              </div>
              <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-lg ${statusConfig.bg} flex items-center justify-center shadow-md`}>
                <StatusIcon className="h-3 w-3 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                {companyName}
              </h3>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot} mr-2`}></div>
                <span className="text-sm font-medium text-gray-600">
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {client.contactName && (
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{client.contactName}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center text-sm text-gray-600">
              <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{client.phone}</span>
            </div>
          )}
          {(client.city || client.address) && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{client.city || client.address}</span>
            </div>
          )}
          {client.siret && (
            <div className="flex items-center text-sm text-gray-600">
              <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-mono text-xs">{client.siret}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200/50">
          <button
            onClick={() => onView(client.id)}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Voir le profil"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Profil
          </button>
          
          <button
            onClick={() => onEdit(client.id)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Modifier
          </button>
          
          <button
            onClick={() => onDelete(client)}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// Vue tableau
const ClientTableView = ({ clients, onView, onEdit, onDelete }) => {
  const getInitials = (client) => {
    const companyName = client.companyName || client.company_name || '';
    if (!companyName) return '??';
    return companyName.substring(0, 2).toUpperCase();
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
          icon: BuildingOfficeIcon,
          label: 'Inconnu',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/20"></div>
      
      <div className="relative overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Entreprise
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Localisation
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                SIRET
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200/30">
            {clients.map((client) => {
              const companyName = client.companyName || client.company_name || 'Entreprise inconnue';
              const statusConfig = getStatusConfig(client.status);
              const StatusIcon = statusConfig.icon;

              return (
                <tr 
                  key={client.id} 
                  className="group hover:bg-white/60 transition-all duration-200 cursor-pointer"
                  onClick={() => onView(client.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <span className="text-sm font-bold text-white">
                          {getInitials(client)}
                        </span>
                      </div>
                      
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {companyName}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {client.contactName || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.email || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.phone || '-'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {client.city || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.country || 'France'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {client.siret || '-'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(client.id);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Voir le profil"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(client.id);
                        }}
                        className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(client);
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

// Vue liste détaillée
const ClientListView = ({ clients, onView, onEdit, onDelete }) => {
  const getInitials = (client) => {
    const companyName = client.companyName || client.company_name || '';
    if (!companyName) return '??';
    return companyName.substring(0, 2).toUpperCase();
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
          icon: BuildingOfficeIcon,
          label: 'Inconnu',
          dot: 'bg-gray-400'
        };
    }
  };

  return (
    <div className="space-y-4">
      {clients.map((client) => {
        const companyName = client.companyName || client.company_name || 'Entreprise inconnue';
        const statusConfig = getStatusConfig(client.status);
        const StatusIcon = statusConfig.icon;

        return (
          <div 
            key={client.id}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-md border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-indigo-50/10 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.bg}`}></div>
            
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-6 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <span className="text-xl font-bold text-white">
                        {getInitials(client)}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-lg ${statusConfig.bg} flex items-center justify-center shadow-md`}>
                      <StatusIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {companyName}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className={`w-2 h-2 rounded-full ${statusConfig.dot} mr-2`}></div>
                          <span className="text-sm font-medium text-gray-600">
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {client.contactName && (
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{client.contactName}</span>
                        </div>
                      )}
                      
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      
                      {(client.city || client.address) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{client.city || client.address}</span>
                        </div>
                      )}
                      
                      {client.siret && (
                        <div className="flex items-center text-sm text-gray-600">
                          <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-mono text-xs">{client.siret}</span>
                        </div>
                      )}
                      
                      {client.country && client.country !== 'France' && (
                        <div className="flex items-center text-sm text-gray-600">
                          <GlobeEuropeAfricaIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{client.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => onView(client.id)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Voir le profil"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Profil
                  </button>
                  
                  <button
                    onClick={() => onEdit(client.id)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Modifier
                  </button>
                  
                  <button
                    onClick={() => onDelete(client)}
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

// État vide
const EmptyState = ({ searchTerm, statusFilter }) => {
  const hasFilters = searchTerm || statusFilter !== 'all';
  
  return (
    <div className="text-center py-16">
      <div className="relative mx-auto w-24 h-24 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl"></div>
        <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
          <BuildingOfficeIcon className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {hasFilters ? 'Aucun client trouvé' : 'Aucun client enregistré'}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {hasFilters 
          ? 'Essayez de modifier vos critères de recherche ou vos filtres.'
          : 'Commencez par ajouter votre premier client pour gérer vos relations commerciales.'
        }
      </p>
      
      {!hasFilters && (
        <Link
          to="/clients/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter le premier client
        </Link>
      )}
    </div>
  );
};

// Modal de suppression
const DeleteModal = ({ client, onConfirm, onCancel }) => {
  if (!client) return null;

  const companyName = client.companyName || client.company_name || 'Client';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full">
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl"></div>
        
        <div className="relative p-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le client{' '}
              <span className="font-semibold text-gray-900">{companyName}</span> ?{' '}
              Cette action est irréversible.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => onConfirm(client.id)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientList = () => {
  const navigate = useNavigate();
  
  // États
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientToDelete, setClientToDelete] = useState(null);
  const [currentView, setCurrentView] = useState('table');

  // Chargement des clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientData = await DatabaseService.getClients();
        setClients(clientData);
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
        toast.error("Erreur lors du chargement des clients");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Filtrage des clients
  const filteredClients = clients.filter((client) => {
    const companyName = client.companyName || client.company_name || '';
    const contactName = client.contactName || '';
    const email = client.email || '';
    const siret = client.siret || '';
    
    // Filtrer par recherche
    const matchesSearch =
      searchTerm === "" ||
      companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siret.includes(searchTerm);

    // Filtrer par statut
    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Gestionnaires d'événements
  const handleView = (id) => {
    navigate(`/clients/${id}/profile`);
  };

  const handleEdit = (id) => {
    navigate(`/clients/${id}/edit`);
  };

  const handleDeleteClient = async (id) => {
    try {
      await DatabaseService.deleteClient(id);
      setClients(clients.filter((client) => client.id !== id));
      setClientToDelete(null);
      toast.success("Client supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      toast.error("Erreur lors de la suppression du client");
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Gestion des clients
              </h1>
              <p className="text-gray-600 mt-1">
                {clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <Link
            to="/clients/new"
            className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Nouveau client
            <SparklesIcon className="h-4 w-4 ml-2 opacity-70" />
          </Link>
        </div>

        {/* Barre de recherche et sélecteur de vue */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <ModernSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>
          <ViewSelector 
            currentView={currentView} 
            onViewChange={setCurrentView} 
          />
        </div>

        {/* Liste des clients selon la vue sélectionnée */}
        <div className="mt-8">
          {filteredClients.length > 0 ? (
            <>
              {currentView === 'table' && (
                <ClientTableView
                  clients={filteredClients}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={setClientToDelete}
                />
              )}
              {currentView === 'list' && (
                <ClientListView
                  clients={filteredClients}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={setClientToDelete}
                />
              )}
              {currentView === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={setClientToDelete}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState searchTerm={searchTerm} statusFilter={statusFilter} />
          )}
        </div>

        {/* Modal de suppression */}
        <DeleteModal
          client={clientToDelete}
          onConfirm={handleDeleteClient}
          onCancel={() => setClientToDelete(null)}
        />

        {/* Notifications */}
        <ToastContainer 
          position="bottom-right"
          toastClassName={() => 
            "relative flex p-1 min-h-10 rounded-lg justify-between overflow-hidden cursor-pointer bg-white shadow-lg border border-gray-200"
          }
          bodyClassName={() => "text-sm font-medium text-gray-800 block p-3"}
          closeButton={false}
          hideProgressBar={false}
          newestOnTop
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
};

export default ClientList;