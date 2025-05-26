// src/modules/employees/EmployeeList.js
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
  UserIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyEuroIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

// Composants de vue
import ViewSelector from './components/ViewSelector';
import EmployeeTableView from './components/EmployeeTableView';
import EmployeeListView from './components/EmployeeListView';

// Composants modernes
const ModernSearchBar = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 p-2">
      {/* Arrière-plan décoratif */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>
      
      <div className="relative flex flex-col md:flex-row gap-4">
        {/* Barre de recherche */}
        <div className="flex-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500"
              placeholder="Rechercher par nom, prénom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Filtre de statut */}
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

const EmployeeCard = ({ employee, onView, onEdit, onDelete }) => {
  const getInitials = () => {
    const firstName = employee.firstName || employee.firstname || '';
    const lastName = employee.lastName || employee.lastname || '';
    if (!firstName || !lastName) return '??';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusConfig = () => {
    switch (employee.status) {
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

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const firstName = employee.firstName || employee.firstname || '';
  const lastName = employee.lastName || employee.lastname || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Nom inconnu';

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
      {/* Arrière-plan avec gradient subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Indicateur de statut en haut */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.bg}`}></div>
      
      <div className="relative p-6">
        {/* En-tête avec avatar et statut */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-xl font-bold text-white">
                  {getInitials()}
                </span>
              </div>
              {/* Badge de statut */}
              <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-lg ${statusConfig.bg} flex items-center justify-center shadow-md`}>
                <StatusIcon className="h-3 w-3 text-white" />
              </div>
            </div>
            
            {/* Informations principales */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                {fullName}
              </h3>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot} mr-2`}></div>
                <span className="text-sm font-medium text-gray-600">
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>
          
          {/* Qualification */}
          {employee.qualification && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {employee.qualification}
            </span>
          )}
        </div>

        {/* Informations de contact */}
        <div className="space-y-2 mb-4">
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
        </div>

        {/* Compétences */}
        {employee.skills && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Compétences :</p>
            <p className="text-sm text-gray-700 line-clamp-2">{employee.skills}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200/50">
          <button
            onClick={() => onView(employee.id)}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Voir le profil"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Profil
          </button>
          
          <button
            onClick={() => onEdit(employee.id)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Modifier
          </button>
          
          <button
            onClick={() => onDelete(employee)}
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

const EmptyState = ({ searchTerm, statusFilter }) => {
  const hasFilters = searchTerm || statusFilter !== 'all';
  
  return (
    <div className="text-center py-16">
      <div className="relative mx-auto w-24 h-24 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl"></div>
        <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
          <UsersIcon className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {hasFilters ? 'Aucun employé trouvé' : 'Aucun employé enregistré'}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {hasFilters 
          ? 'Essayez de modifier vos critères de recherche ou vos filtres.'
          : 'Commencez par ajouter votre premier employé pour gérer votre équipe.'
        }
      </p>
      
      {!hasFilters && (
        <Link
          to="/employees/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter le premier employé
        </Link>
      )}
    </div>
  );
};

const DeleteModal = ({ employee, onConfirm, onCancel }) => {
  if (!employee) return null;

  const firstName = employee.firstName || employee.firstname || '';
  const lastName = employee.lastName || employee.lastname || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Employé';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full">
        {/* Arrière-plan avec glassmorphism */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl"></div>
        
        <div className="relative p-6">
          {/* Icône d'alerte */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          
          {/* Contenu */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer l'employé{' '}
              <span className="font-semibold text-gray-900">{fullName}</span> ?{' '}
              Cette action est irréversible.
            </p>
            
            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => onConfirm(employee.id)}
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

const EmployeeList = () => {
  const navigate = useNavigate();
  
  // États
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [currentView, setCurrentView] = useState('table'); // 'table', 'list', 'cards'

  // Chargement des employés
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeeData = await DatabaseService.getEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error("Erreur lors du chargement des employés:", error);
        toast.error("Erreur lors du chargement des employés");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // Filtrage des employés
  const filteredEmployees = employees.filter((employee) => {
    const firstName = employee.firstName || employee.firstname || '';
    const lastName = employee.lastName || employee.lastname || '';
    const email = employee.email || '';
    
    const matchesSearch =
      searchTerm === "" ||
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Gestionnaires d'événements
  const handleView = (id) => {
    navigate(`/employees/${id}/profile`);
  };

  const handleEdit = (id) => {
    navigate(`/employees/${id}/edit`);
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await DatabaseService.deleteEmployee(id);
      setEmployees(employees.filter((emp) => emp.id !== id));
      setEmployeeToDelete(null);
      toast.success("Employé supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'employé:", error);
      toast.error("Erreur lors de la suppression de l'employé");
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
          <p className="mt-6 text-lg text-gray-600 font-medium">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="mx-auto p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Gestion des employés
              </h1>
              <p className="text-gray-600 mt-1">
                {employees.length} employé{employees.length !== 1 ? 's' : ''} enregistré{employees.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <Link
            to="/employees/new"
            className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Nouvel employé
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

        {/* Liste des employés selon la vue sélectionnée */}
        <div className="mt-8">
          {filteredEmployees.length > 0 ? (
            <>
              {currentView === 'table' && (
                <EmployeeTableView
                  employees={filteredEmployees}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={setEmployeeToDelete}
                />
              )}
              {currentView === 'list' && (
                <EmployeeListView
                  employees={filteredEmployees}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={setEmployeeToDelete}
                />
              )}
              {currentView === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEmployees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={setEmployeeToDelete}
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
          employee={employeeToDelete}
          onConfirm={handleDeleteEmployee}
          onCancel={() => setEmployeeToDelete(null)}
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

export default EmployeeList;