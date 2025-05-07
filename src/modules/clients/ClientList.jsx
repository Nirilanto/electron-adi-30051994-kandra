import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DatabaseService from '../../services/DatabaseService';

// Icônes
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const ClientList = () => {
  // État pour stocker la liste des clients
  const [clients, setClients] = useState([]);
  
  // État pour gérer le chargement
  const [loading, setLoading] = useState(true);
  
  // État pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // État pour la confirmation de suppression
  const [clientToDelete, setClientToDelete] = useState(null);
  
  // Charger la liste des clients au montage du composant
  useEffect(() => {
    const loadClients = async () => {
      try {
        // Récupérer tous les clients
        const clientData = await DatabaseService.getClients();
        setClients(clientData);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Fonction pour filtrer les clients en fonction de la recherche et des filtres
  const filteredClients = clients.filter(client => {
    // Filtrer par recherche (nom de l'entreprise, contact, email)
    const matchesSearch = 
      (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.contactName && client.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.siret && client.siret.includes(searchTerm));
    
    // Filtrer par statut
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && client.status === 'active') ||
      (statusFilter === 'inactive' && client.status === 'inactive');
    
    return matchesSearch && matchesStatus;
  });

  // Fonction pour supprimer un client
  const handleDeleteClient = async (id) => {
    try {
      await DatabaseService.deleteClient(id);
      
      // Mettre à jour la liste des clients
      setClients(clients.filter(client => client.id !== id));
      
      // Réinitialiser l'état de suppression
      setClientToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
    }
  };

  // Afficher un indicateur de chargement pendant le chargement des données
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Gestion des clients</h1>
        <Link 
          to="/clients/new" 
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nouveau client
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
              placeholder="Rechercher un client..."
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
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SIRET
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
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center">
                          <span className="text-secondary-700 font-medium">
                            {client.companyName ? client.companyName[0].toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.companyName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.contactName || '-'}</div>
                      {client.email &&<div className="text-sm text-gray-500">{client.email || '-'}</div>}
                      {client.phone && <div className="text-sm text-gray-500">{client.phone || '-'}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.city || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {client.country || 'France'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.siret || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/clients/${client.id}`}
                        className="text-primary-500 hover:text-primary-700 mx-2"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </Link>
                      <button
                        onClick={() => setClientToDelete(client)}
                        className="text-red-500 hover:text-red-700 mx-2"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Aucun client trouvé. {searchTerm || statusFilter !== 'all' ? 'Essayez de modifier vos filtres.' : ''}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer le client <span className="font-medium">{clientToDelete.companyName}</span> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="btn btn-outline"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteClient(clientToDelete.id)}
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

export default ClientList;