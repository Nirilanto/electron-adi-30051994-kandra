// src/modules/settings/components/CsvExportHelper.js
import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Papa from 'papaparse';
import DatabaseService from '../../../services/DatabaseService';
import SettingsService from '../SettingsService';

const CsvExportHelper = ({ entity, displayName, disabled, className }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Récupérer les données de l'entité
      let data;
      
      switch (entity) {
        case 'employees':
          data = await DatabaseService.getEmployees();
          break;
        case 'clients':
          data = await DatabaseService.getClients();
          break;
        case 'contracts':
          data = await DatabaseService.getContracts();
          break;
        case 'settings':
          // Pour les paramètres, on doit combiner plusieurs types de paramètres
          const taxRates = await SettingsService.getTaxRates() || [];
          const hourTypes = await SettingsService.getHourTypes() || [];
          const paymentMethods = await SettingsService.getPaymentMethods() || [];
          const transportModes = await SettingsService.getTransportModes() || [];
          const qualifications = await SettingsService.getQualifications() || [];
          const motifTypes = await SettingsService.getMotifTypes() || [];
          const justificatifTypes = await SettingsService.getJustificatifTypes() || [];
          const accessMethods = await SettingsService.getAccessMethods() || [];
          const securityMeasures = await SettingsService.getSecurityMeasures() || [];
          
          // On les organise par type
          data = [
            ...taxRates.map(item => ({ ...item, type: 'tax_rate' })),
            ...hourTypes.map(item => ({ ...item, type: 'hour_type' })),
            ...paymentMethods.map(item => ({ ...item, type: 'payment_method' })),
            ...transportModes.map(item => ({ ...item, type: 'transport_mode' })),
            ...qualifications.map(item => ({ ...item, type: 'qualification' })),
            ...motifTypes.map(item => ({ ...item, type: 'motif_type' })),
            ...justificatifTypes.map(item => ({ ...item, type: 'justificatif_type' })),
            ...accessMethods.map(item => ({ ...item, type: 'access_method' })),
            ...securityMeasures.map(item => ({ ...item, type: 'security_measure' }))
          ];
          break;
        default:
          data = [];
      }
      
      // Vérifier si des données existent
      if (!data || data.length === 0) {
        alert(`Aucune donnée ${displayName.toLowerCase()} à exporter`);
        setIsExporting(false);
        return;
      }
      
      // Formatage supplémentaire des données si nécessaire
      if (entity === 'employees') {
        // Convertir les dates pour une meilleure lisibilité dans Excel
        data = data.map(employee => ({
          ...employee,
          birthDate: employee.birthDate ? formatDate(employee.birthDate) : '',
          hireDate: employee.hireDate ? formatDate(employee.hireDate) : '',
          availableDate: employee.availableDate ? formatDate(employee.availableDate) : '',
          idCardIssueDate: employee.idCardIssueDate ? formatDate(employee.idCardIssueDate) : '',
          idCardExpiryDate: employee.idCardExpiryDate ? formatDate(employee.idCardExpiryDate) : ''
        }));
      } else if (entity === 'contracts') {
        // Convertir les dates pour une meilleure lisibilité dans Excel
        data = data.map(contract => ({
          ...contract,
          start_date: contract.start_date ? formatDate(contract.start_date) : '',
          end_date: contract.end_date ? formatDate(contract.end_date) : '',
          created_at: contract.created_at ? formatDate(contract.created_at) : '',
          updated_at: contract.updated_at ? formatDate(contract.updated_at) : ''
        }));
      }
      
      // Convertir en CSV
      const csvData = Papa.unparse(data, {
        quotes: true, // Mettre les champs entre guillemets
        delimiter: ',', // Utiliser la virgule comme séparateur
        header: true, // Inclure les en-têtes
      });
      
      // Télécharger le fichier
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `contrat-manager-${entity}-${formatDateForFilename(new Date())}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error(`Erreur lors de l'export CSV de ${entity} :`, error);
      alert(`Erreur lors de l'export : ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction utilitaire pour formater une date ISO en format lisible
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return dateString;
    }
  };

  // Fonction utilitaire pour formater une date pour un nom de fichier
  const formatDateForFilename = (date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`flex items-center justify-center px-3 py-1 text-sm rounded ${
        disabled || isExporting
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      } ${className || ''}`}
    >
      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
      <span>{isExporting ? 'Exportation...' : `CSV ${displayName}`}</span>
    </button>
  );
};

export default CsvExportHelper;