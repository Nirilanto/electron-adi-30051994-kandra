// src/modules/clients/ClientProfile.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import des composants modulaires
import ClientProfileHeader from './components/ClientProfileHeader';
import ClientTabNavigation from './components/ClientTabNavigation';
import ClientInfoTab from './components/ClientInfoTab';
import ClientAboutTab from './components/ClientAboutTab';
import ClientTimeTrackingTab  from './components/ClientTimeTrackingTab';

// Import du service (à créer)
import ClientService from './ClientService';

function ClientProfile() {
  const { id } = useParams();
  
  // États
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('informations');
  const [isLoading, setIsLoading] = useState(true);

  // Chargement initial des données
  useEffect(() => {
    const loadClient = async () => {
      try {
        setIsLoading(true);
        
        // Vous devrez créer ClientService.getClientById() similaire à EmployeeService
        const clientData = await ClientService.getClientById(id);
        if (clientData) {
          setClient(clientData);
        } else {
          toast.error('Client non trouvé');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du client :', error);
        toast.error('Erreur lors du chargement du client');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadClient();
    }
  }, [id]);

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    if (!client) return null;

    switch (activeTab) {
      case 'informations':
        return <ClientInfoTab client={client} />;
      case 'apropos':
        return <ClientAboutTab client={client} />;
      // case 'historique':
      //   return <ClientHistoryTab />;
      case 'pointage':
        return <ClientTimeTrackingTab client={client} />;
      // default:
      //   return <ClientInfoTab client={client} />;
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          {/* Spinner moderne */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Chargement du profil client...</p>
          <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  // Client non trouvé
  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏢</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Client non trouvé</h2>
          <p className="text-gray-600">Le client demandé n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Container principal */}
      <div className="max-w-7xl mx-auto">
        {/* En-tête du profil */}
        <ClientProfileHeader client={client} />

        {/* Navigation par onglets */}
        <ClientTabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* Contenu principal */}
        <div className="bg-white/60 backdrop-blur-sm">
          {renderTabContent()}
        </div>
      </div>

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
  );
}

export default ClientProfile;