// src/modules/contracts/ContractDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  ClockIcon,
  MapPinIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ContractService from './ContractService';
import { formatDateToFrench } from '../../utils/dateUtils';

function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState({
    client: false,
    employee: false
  });

  // Chargement des données du contrat
  useEffect(() => {
    const loadContract = async () => {
      try {
        setIsLoading(true);
        const contractData = await ContractService.getContractById(id);
        if (!contractData) {
          toast.error('Contrat non trouvé');
          navigate('/contracts');
          return;
        }
        setContract(contractData);
      } catch (error) {
        console.error('Erreur lors du chargement du contrat:', error);
        toast.error('Erreur lors du chargement du contrat');
      } finally {
        setIsLoading(false);
      }
    };

    loadContract();
  }, [id, navigate]);

  // Génération du PDF pour l'entreprise cliente
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
      console.error('Erreur lors de la génération du PDF client:', error);
      toast.error('Erreur lors de la génération du PDF client');
    } finally {
      setIsPdfGenerating(prev => ({ ...prev, client: false }));
    }
  };

  // Génération du PDF pour l'entreprise de mission (salariés)
  const handleGenerateEmployeePDF = async () => {
    try {
      setIsPdfGenerating(prev => ({ ...prev, employee: true }));
          // S'assurer que toutes les données nécessaires sont disponibles
    if (!contract.employee || !contract.client) {
      toast.warning('Données d\'employé ou de client manquantes pour générer le PDF');
      return;
    }
      const result = await ContractService.generateEmployeeContractPDF(contract);
      
      if (result.success) {
        toast.success('PDF salarié généré avec succès');
      } else {
        toast.error('Erreur lors de la génération du PDF salarié');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF salarié:', error);
      toast.error('Erreur lors de la génération du PDF salarié');
    } finally {
      setIsPdfGenerating(prev => ({ ...prev, employee: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du contrat...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500">Le contrat n'a pas pu être chargé.</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => navigate('/contracts')}
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/contracts')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {contract.title || 'Contrat de mission'}
          </h1>
          <span className="ml-4 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            N° {contract.contractNumber}
          </span>
        </div>
        
        {/* Boutons de génération PDF */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleGenerateClientPDF}
            disabled={isPdfGenerating.client}
            className={`flex items-center px-4 py-2 rounded-md ${
              isPdfGenerating.client 
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isPdfGenerating.client ? 'Génération...' : 'PDF Client'}
          </button>
          
          <button
            type="button"
            onClick={handleGenerateEmployeePDF}
            disabled={isPdfGenerating.employee}
            className={`flex items-center px-4 py-2 rounded-md ${
              isPdfGenerating.employee 
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isPdfGenerating.employee ? 'Génération...' : 'PDF Salarié'}
          </button>
        </div>
      </div>
      
      {/* Contenu du contrat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne 1: Informations de base */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
            Informations générales
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-gray-800">{contract.description || 'Non spécifié'}</p>
            </div>
            
            <div className="flex items-start">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Période</p>
                <p className="text-gray-800">
                  {contract.startDate && contract.endDate
                    ? `Du ${formatDateToFrench(new Date(contract.startDate))} au ${formatDateToFrench(new Date(contract.endDate))}`
                    : 'Non spécifiée'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Lieu de mission</p>
                <p className="text-gray-800">{contract.location || 'Non spécifié'}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Horaires</p>
                <p className="text-gray-800">{contract.workingHours || 'Non spécifiés'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Colonne 2: Client */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
            Client
          </h2>
          
          {contract.client ? (
            <div className="space-y-3">
              <p className="text-lg font-medium">{contract.client.companyName}</p>
              <p className="text-gray-600">{contract.client.address}</p>
              <div>
                <p className="text-sm font-medium text-gray-500">SIRET</p>
                <p className="text-gray-800">{contract.client.siret || 'Non spécifié'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact</p>
                <p className="text-gray-800">{contract.client.contactName || 'Non spécifié'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Aucun client associé</p>
          )}
        </div>
        
        {/* Colonne 3: Employé (si applicable) */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
            Consultant
          </h2>
          
          {contract.employee ? (
            <div className="space-y-3">
              <p className="text-lg font-medium">{`${contract.employee.firstName || ''} ${contract.employee.lastName || ''}`}</p>
              <p className="text-gray-600">{contract.employee.address || ''}</p>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-800">{contract.employee.email || 'Non spécifié'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Téléphone</p>
                <p className="text-gray-800">{contract.employee.phone || 'Non spécifié'}</p>
              </div>
              {contract.employee.qualification && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Qualification</p>
                  <p className="text-gray-800">{contract.employee.qualification}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">Aucun consultant associé</p>
          )}
        </div>
      </div>
      
      {/* Informations financières */}
      <div className="mt-6 bg-gray-50 p-5 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations financières</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Tarification</p>
            <div className="mt-2">
              <div className="flex justify-between py-2 border-b">
                <span>Taux horaire consultant</span>
                <span className="font-medium">{contract.hourlyRate ? `${contract.hourlyRate} €` : 'Non spécifié'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Taux horaire facturation</span>
                <span className="font-medium">{contract.billingRate ? `${contract.billingRate} €` : 'Non spécifié'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Motif et justificatif</p>
            <div className="mt-2">
              <div className="flex justify-between py-2 border-b">
                <span>Motif</span>
                <span className="font-medium">{contract.motif || 'Non spécifié'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Justificatif</span>
                <span className="font-medium">{contract.justificatif || 'Non spécifié'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Transport</span>
                <span className="font-medium">{contract.transport || 'Non spécifié'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default ContractDetail;