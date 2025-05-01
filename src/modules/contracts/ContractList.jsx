import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DatabaseService from '../../services/DatabaseService';

// Icônes
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const ContractList = () => {
  // État pour stocker la liste des contrats
  const [contracts, setContracts] = useState([]);
  
  // État pour gérer le chargement
  const [loading, setLoading] = useState(true);
  
  // État pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // État pour la confirmation de suppression
  const [contractToDelete, setContractToDelete] = useState(null);
  
  // Charger la liste des contrats au montage du composant
  useEffect(() => {
    const loadContracts = async () => {
      try {
        // Récupérer tous les contrats
        const contractData = await DatabaseService.getContracts();
        setContracts(contractData);
      } catch (error) {
        console.error('Erreur lors du chargement des contrats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, []);

  // Fonction pour filtrer les contrats en fonction de la recherche et des filtres
  const filteredContracts = contracts.filter(contract => {
    // Filtrer par recherche (titre, référence, employé, client)
    const matchesSearch = 
      (contract.title && contract.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contract.reference && contract.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contract.employee_firstname && contract.employee_firstname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contract.employee_lastname && contract.employee_lastname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contract.client_company && contract.client_company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtrer par statut
    const matchesStatus = 
      statusFilter === 'all' || 
      contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Fonction pour supprimer un contrat
  const handleDeleteContract = async (id) => {
    try {
      await DatabaseService.deleteContract(id);
      
      // Mettre à jour la liste des contrats
      setContracts(contracts.filter(contract => contract.id !== id));
      
      // Réinitialiser l'état de suppression
      setContractToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du contrat:', error);
    }
  };

  // Formatter les dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Générer un badge de statut pour un contrat
  const getStatusBadge = (status) => {
    let classes = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
    let text = status;
    
    switch (status) {
      case 'active':
        classes += 'bg-green-100 text-green-800';
        text = 'Actif';
        break;
      case 'draft':
        classes += 'bg-gray-100 text-gray-800';
        text = 'Brouillon';
        break;
      case 'completed':
        classes += 'bg-blue-100 text-blue-800';
        text = 'Terminé';
        break;
      case 'canceled':
        classes += 'bg-red-100 text-red-800';
        text = 'Annulé';
        break;
      default:
        classes += 'bg-gray-100 text-gray-800';
    }
    
    return <span className={classes}>{text}</span>;
  };

  // Afficher un indicateur de chargement pendant le chargement des données
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des contrats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Gestion des contrats</h1>
        <Link 
          to="/contracts/new" 
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nouveau contrat
        </Link>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Rechercher un contrat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillons</option>
            <option value="active">Actifs</option>
            <option value="completed">Terminés</option>
            <option value="canceled">Annulés</option>
          </select>
        </div>
      </div>

      {/* Liste des contrats */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredContracts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence / Titre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employé
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <DocumentTextIcon className="h-5 w-5 text-primary-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.reference || `CONT-${contract.id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contract.employee_firstname} {contract.employee_lastname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contract.client_company}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(contract.start_date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.end_date ? `→ ${formatDate(contract.end_date)}` : 'Non définie'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/contracts/${contract.id}`}
                        className="text-primary-500 hover:text-primary-700 mx-1"
                        title="Modifier"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </Link>
                      <button
                        onClick={() => setContractToDelete(contract)}
                        className="text-red-500 hover:text-red-700 mx-1"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        className="text-gray-500 hover:text-gray-700 mx-1"
                        title="Télécharger le contrat PDF"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Aucun contrat trouvé. {searchTerm || statusFilter !== 'all' ? 'Essayez de modifier vos filtres.' : ''}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {contractToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer le contrat <span className="font-medium">{contractToDelete.reference || `CONT-${contractToDelete.id}`}</span> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setContractToDelete(null)}
                className="btn btn-outline"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteContract(contractToDelete.id)}
                className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractList;