import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DatabaseService from '../../services/DatabaseService';

// Icônes
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon,
  ClockIcon,
  BanknotesIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  // État pour stocker les données du tableau de bord
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalClients: 0,
    activeClients: 0,
    totalContracts: 0,
    activeContracts: 0,
    endingSoonContracts: 0,
    contractsThisMonth: 0,
    revenueThisMonth: 0
  });
  
  // État pour stocker les contrats qui se terminent bientôt
  const [endingSoonContracts, setEndingSoonContracts] = useState([]);
  
  // État pour gérer le chargement
  const [loading, setLoading] = useState(true);

  // Charger les données du tableau de bord au montage du composant
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Récupérer les statistiques
        const dashboardStats = await DatabaseService.getDashboardStats();
        setStats(dashboardStats);
        
        // Récupérer les contrats qui se terminent bientôt
        const endingContracts = await DatabaseService.getEndingSoonContracts();
        setEndingSoonContracts(endingContracts);
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Afficher un indicateur de chargement pendant le chargement des données
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Formatter les montants en euros
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Formatter les dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculer le nombre de jours restants
  const getDaysRemaining = (endDateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(endDateString);
    endDate.setHours(0, 0, 0, 0);
    
    const differenceInTime = endDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Tableau de bord</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Statistiques des employés */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700">Employés</h2>
            <UserGroupIcon className="w-8 h-8 text-primary-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-semibold">{stats.totalEmployees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-semibold text-green-600">{stats.activeEmployees}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/employees" className="text-primary-500 text-sm hover:underline">
              Voir tous les employés
            </Link>
          </div>
        </div>

        {/* Statistiques des clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700">Clients</h2>
            <BuildingOfficeIcon className="w-8 h-8 text-primary-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-semibold">{stats.totalClients}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-semibold text-green-600">{stats.activeClients}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/clients" className="text-primary-500 text-sm hover:underline">
              Voir tous les clients
            </Link>
          </div>
        </div>

        {/* Statistiques des contrats */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700">Contrats</h2>
            <DocumentTextIcon className="w-8 h-8 text-primary-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-semibold">{stats.totalContracts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-semibold text-green-600">{stats.activeContracts}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/contracts" className="text-primary-500 text-sm hover:underline">
              Voir tous les contrats
            </Link>
          </div>
        </div>

        {/* Contrats ce mois-ci */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700">Ce mois-ci</h2>
            <ClockIcon className="w-8 h-8 text-primary-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Nouveaux contrats</p>
              <p className="text-2xl font-semibold">{stats.contractsThisMonth}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fin prochaine</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.endingSoonContracts}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/contracts" className="text-primary-500 text-sm hover:underline">
              Voir les détails
            </Link>
          </div>
        </div>

        {/* Chiffre d'affaires */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700">Chiffre d'affaires</h2>
            <BanknotesIcon className="w-8 h-8 text-primary-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ce mois-ci</p>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.revenueThisMonth)}</p>
          </div>
          <div className="mt-4">
            <Link to="/contracts" className="text-primary-500 text-sm hover:underline">
              Voir les rapports
            </Link>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700">Actions rapides</h2>
          </div>
          <div className="space-y-2">
            <Link 
              to="/contracts/new" 
              className="block btn btn-primary text-center w-full"
            >
              Nouveau contrat
            </Link>
            <Link 
              to="/employees/new" 
              className="block btn btn-outline text-center w-full"
            >
              Nouvel employé
            </Link>
            <Link 
              to="/clients/new" 
              className="block btn btn-outline text-center w-full"
            >
              Nouveau client
            </Link>
          </div>
        </div>
      </div>

      {/* Contrats se terminant bientôt */}
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-700">Contrats se terminant bientôt</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {endingSoonContracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fin
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jours restants
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {endingSoonContracts.map((contract) => {
                    const daysRemaining = getDaysRemaining(contract.end_date);
                    let daysClass = 'text-green-600';
                    if (daysRemaining < 7) {
                      daysClass = 'text-red-600 font-bold';
                    } else if (daysRemaining < 14) {
                      daysClass = 'text-yellow-600 font-semibold';
                    }
                    
                    return (
                      <tr key={contract.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contract.reference || `CONT-${contract.id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {contract.employee_firstname} {contract.employee_lastname}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {contract.client_company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(contract.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={daysClass}>
                            {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/contracts/${contract.id}`}
                            className="text-primary-500 hover:text-primary-700 mx-2"
                          >
                            Voir
                          </Link>
                          <Link
                            to={`/contracts/${contract.id}`} 
                            className="text-yellow-600 hover:text-yellow-800 mx-2"
                          >
                            Prolonger
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Aucun contrat ne se termine dans les 30 prochains jours.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;