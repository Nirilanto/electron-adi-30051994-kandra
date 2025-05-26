// src/modules/contracts/ContractProfile.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import des composants modulaires
import ContractProfileHeader from './components/ContractProfileHeader';
import ContractTabNavigation from './components/ContractTabNavigation';
import ContractDetailsTab from './components/ContractDetailsTab';
import ContractConditionsTab from './components/ContractConditionsTab';
import  ContractTimeTrackingTab  from './components/ContractTimeTrackingTab';
import PlaceholderTab from '../employees/components/PlaceholderTabs';

// Import des services
import ContractService from './ContractService';

// Composant placeholder pour la facturation
const ContractBillingTab = () => {
  const features = [
    { name: 'Génération de factures automatique', icon: null },
    { name: 'Suivi des paiements', icon: null },
    { name: 'Rapports financiers', icon: null },
    { name: 'Historique des transactions', icon: null },
    { name: 'Intégration comptable', icon: null },
    { name: 'Notifications d\'échéance', icon: null }
  ];

  return (
    <PlaceholderTab
      title="Facturation et paiements"
      description="Gérez la facturation automatique, suivez les paiements et générez des rapports financiers pour ce contrat. Intégration complète avec votre système comptable."
      icon={require('@heroicons/react/24/outline').CurrencyEuroIcon}
      features={features}
      gradient="from-emerald-500 to-green-600"
    />
  );
};

function ContractProfile() {
  const { id } = useParams();
  
  // États
  const [contract, setContract] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState({
    client: false,
    employee: false,
  });

  // Chargement initial des données
  useEffect(() => {
    const loadContract = async () => {
      try {
        setIsLoading(true);
        const contractData = await ContractService.getContractById(id);
        if (contractData) {
          setContract(contractData);
        } else {
          toast.error('Contrat non trouvé');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du contrat :', error);
        toast.error('Erreur lors du chargement du contrat');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadContract();
    }
  }, [id]);

  // Gestionnaire de génération PDF client
  const handleGenerateClientPDF = async () => {
    try {
      setIsPdfGenerating(prev => ({ ...prev, client: true }));
      
      const result = await ContractService.generateClientContractPDF(contract);
      
      if (result.success) {
        toast.success('PDF client généré avec succès');
      } else {
        toast.error('Erreur lors de la génération du PDF client');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF client :', error);
      toast.error('Erreur lors de la génération du PDF client');
    } finally {
      setIsPdfGenerating(prev => ({ ...prev, client: false }));
    }
  };

  // Gestionnaire de génération PDF employé
  const handleGenerateEmployeePDF = async () => {
    if (!contract.employeeId) {
      toast.warning('Vous devez avoir un consultant assigné pour générer le PDF employé');
      return;
    }

    try {
      setIsPdfGenerating(prev => ({ ...prev, employee: true }));
      
      const result = await ContractService.generateEmployeeContractPDF(contract);
      
      if (result.success) {
        toast.success('PDF salarié généré avec succès');
      } else {
        toast.error('Erreur lors de la génération du PDF salarié');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF salarié :', error);
      toast.error('Erreur lors de la génération du PDF salarié');
    } finally {
      setIsPdfGenerating(prev => ({ ...prev, employee: false }));
    }
  };

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    if (!contract) return null;

    switch (activeTab) {
      case 'details':
        return <ContractDetailsTab contract={contract} />;
      case 'conditions':
        return <ContractConditionsTab contract={contract} />;
      case 'pointage':
        return <ContractTimeTrackingTab contract={contract} />;
      case 'facturation':
        return <ContractBillingTab />;
      default:
        return <ContractDetailsTab contract={contract} />;
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
          <p className="mt-6 text-lg text-gray-600 font-medium">Chargement du contrat...</p>
          <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  // Contrat non trouvé
  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contrat non trouvé</h2>
          <p className="text-gray-600">Le contrat demandé n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Container principal */}
      <div className="max-w-7xl mx-auto">
        {/* En-tête du profil */}
        <ContractProfileHeader 
          contract={contract}
          onGenerateClientPDF={handleGenerateClientPDF}
          onGenerateEmployeePDF={handleGenerateEmployeePDF}
          isPdfGenerating={isPdfGenerating}
        />

        {/* Navigation par onglets */}
        <ContractTabNavigation 
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

export default ContractProfile;