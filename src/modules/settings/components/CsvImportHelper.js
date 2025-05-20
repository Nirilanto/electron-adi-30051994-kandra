// src/modules/settings/components/CsvImportHelper.js
import React, { useState, useRef } from 'react';
import { ArrowUpTrayIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Papa from 'papaparse';
import DatabaseService from '../../../services/DatabaseService';
import SettingsService from '../SettingsService';

const CsvImportHelper = ({ entity, displayName, onComplete, className }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier l'extension du fichier
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Le fichier doit être au format CSV.');
      return;
    }

    setIsImporting(true);
    setError('');
    setSuccess('');

    try {
      // Lire le fichier CSV
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (results.errors.length > 0) {
              setError(`Erreur de parsing CSV : ${results.errors[0].message}`);
              setIsImporting(false);
              return;
            }

            // Si aucune donnée n'a été trouvée
            if (results.data.length === 0) {
              setError('Le fichier CSV ne contient aucune donnée.');
              setIsImporting(false);
              return;
            }

            const data = results.data;
            
            // En fonction de l'entité, importer dans la base de données
            switch (entity) {
              case 'employees':
                await importEmployees(data);
                break;
              case 'clients':
                await importClients(data);
                break;
              case 'contracts':
                await importContracts(data);
                break;
              case 'settings':
                await importSettings(data);
                break;
              default:
                throw new Error('Type d\'entité inconnu');
            }

            setSuccess(`${data.length} ${displayName.toLowerCase()} importés avec succès !`);
            
            if (onComplete) {
              onComplete();
            }
            
            // Réinitialiser l'input file
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            
            // Masquer le message de succès après 3 secondes
            setTimeout(() => {
              setSuccess('');
            }, 3000);
          } catch (error) {
            console.error(`Erreur lors de l'import de ${entity} :`, error);
            setError(`Erreur lors de l'import : ${error.message}`);
          } finally {
            setIsImporting(false);
          }
        },
        error: (error) => {
          console.error('Erreur de parsing CSV :', error);
          setError(`Erreur de parsing CSV : ${error.message}`);
          setIsImporting(false);
        }
      });
    } catch (error) {
      console.error(`Erreur lors de l'import de ${entity} :`, error);
      setError(`Erreur lors de l'import : ${error.message}`);
      setIsImporting(false);
    }
  };

  // Fonction pour convertir les dates du format français au format ISO
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Si c'est déjà au format ISO
    if (dateString.includes('T') || dateString.includes('-')) {
      return dateString;
    }
    
    // Essayer de parser le format français (JJ/MM/AAAA)
    try {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Les mois sont 0-indexés en JS
        const year = parseInt(parts[2], 10);
        
        return new Date(year, month, day).toISOString();
      }
    } catch (error) {
      console.error('Erreur de parsing de date :', error);
    }
    
    return dateString;
  };

  // Fonction pour importer les employés
  const importEmployees = async (data) => {
    // Récupérer les employés existants
    const existingEmployees = await DatabaseService.getEmployees();
    
    // Pour chaque employé dans les données CSV
    for (const employee of data) {
      // Formater les dates si elles existent
      const formattedEmployee = {
        ...employee,
        birthDate: employee.birthDate ? parseDate(employee.birthDate) : null,
        hireDate: employee.hireDate ? parseDate(employee.hireDate) : null,
        availableDate: employee.availableDate ? parseDate(employee.availableDate) : null,
        idCardIssueDate: employee.idCardIssueDate ? parseDate(employee.idCardIssueDate) : null,
        idCardExpiryDate: employee.idCardExpiryDate ? parseDate(employee.idCardExpiryDate) : null
      };
      
      // Si l'employé a un ID et qu'il existe déjà, mise à jour
      if (employee.id && existingEmployees.some(e => e.id === employee.id)) {
        await DatabaseService.updateEmployee(employee.id, formattedEmployee);
      }
      // Sinon, création d'un nouvel employé
      else {
        // S'assurer qu'on ne passe pas d'ID pour éviter des conflits
        const { id, ...employeeWithoutId } = formattedEmployee;
        await DatabaseService.createEmployee(employeeWithoutId);
      }
    }
  };

  // Fonction pour importer les clients
  const importClients = async (data) => {
    // Récupérer les clients existants
    const existingClients = await DatabaseService.getClients();
    
    // Pour chaque client dans les données CSV
    for (const client of data) {
      // Si le client a un ID et qu'il existe déjà, mise à jour
      if (client.id && existingClients.some(c => c.id === client.id)) {
        await DatabaseService.updateClient(client.id, client);
      }
      // Sinon, création d'un nouveau client
      else {
        // S'assurer qu'on ne passe pas d'ID pour éviter des conflits
        const { id, ...clientWithoutId } = client;
        await DatabaseService.createClient(clientWithoutId);
      }
    }
  };

  // Fonction pour importer les contrats
  const importContracts = async (data) => {
    // Récupérer les contrats existants
    const existingContracts = await DatabaseService.getContracts();
    
    // Pour chaque contrat dans les données CSV
    for (const contract of data) {
      // Formater les dates si elles existent
      const formattedContract = {
        ...contract,
        start_date: contract.start_date ? parseDate(contract.start_date) : null,
        end_date: contract.end_date ? parseDate(contract.end_date) : null
      };
      
      // Si le contrat a un ID et qu'il existe déjà, mise à jour
      if (contract.id && existingContracts.some(c => c.id === contract.id)) {
        await DatabaseService.updateContract(contract.id, formattedContract);
      }
      // Sinon, création d'un nouveau contrat
      else {
        // S'assurer qu'on ne passe pas d'ID pour éviter des conflits
        const { id, ...contractWithoutId } = formattedContract;
        await DatabaseService.createContract(contractWithoutId);
      }
    }
  };

  // Fonction pour importer les paramètres
  const importSettings = async (data) => {
    // Organiser les données par type
    const taxRates = [];
    const hourTypes = [];
    const paymentMethods = [];
    const transportModes = [];
    const qualifications = [];
    const motifTypes = [];
    const justificatifTypes = [];
    const accessMethods = [];
    const securityMeasures = [];
    
    for (const item of data) {
      // Nettoyer l'objet des propriétés inutiles
      const { type, ...itemWithoutType } = item;
      
      switch (item.type) {
        case 'tax_rate':
          taxRates.push(itemWithoutType);
          break;
        case 'hour_type':
          hourTypes.push(itemWithoutType);
          break;
        case 'payment_method':
          paymentMethods.push(itemWithoutType);
          break;
        case 'transport_mode':
          transportModes.push(itemWithoutType);
          break;
        case 'qualification':
          qualifications.push(itemWithoutType);
          break;
        case 'motif_type':
          motifTypes.push(itemWithoutType);
          break;
        case 'justificatif_type':
          justificatifTypes.push(itemWithoutType);
          break;
        case 'access_method':
          accessMethods.push(itemWithoutType);
          break;
        case 'security_measure':
          securityMeasures.push(itemWithoutType);
          break;
      }
    }
    
    // Importer chaque type de paramètre s'il y a des données
    if (taxRates.length > 0) {
      await DatabaseService.set('settings_tax_rates', taxRates);
    }
    if (hourTypes.length > 0) {
      await DatabaseService.set('settings_hour_types', hourTypes);
    }
    if (paymentMethods.length > 0) {
      await DatabaseService.set('settings_payment_methods', paymentMethods);
    }
    if (transportModes.length > 0) {
      await DatabaseService.set('settings_transport_modes', transportModes);
    }
    if (qualifications.length > 0) {
      await DatabaseService.set('settings_qualifications', qualifications);
    }
    if (motifTypes.length > 0) {
      await DatabaseService.set('settings_motif_types', motifTypes);
    }
    if (justificatifTypes.length > 0) {
      await DatabaseService.set('settings_justificatif_types', justificatifTypes);
    }
    if (accessMethods.length > 0) {
      await DatabaseService.set('settings_access_methods', accessMethods);
    }
    if (securityMeasures.length > 0) {
      await DatabaseService.set('settings_security_measures', securityMeasures);
    }
    
    // Mettre à jour les services correspondants pour recharger les données
    await SettingsService.getTaxRates();
    await SettingsService.getHourTypes();
    await SettingsService.getPaymentMethods();
    await SettingsService.getTransportModes();
    await SettingsService.getQualifications();
    await SettingsService.getMotifTypes();
    await SettingsService.getJustificatifTypes();
    await SettingsService.getAccessMethods();
    await SettingsService.getSecurityMeasures();
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex items-center">
        <label
          htmlFor={`import-${entity}`}
          className={`cursor-pointer flex items-center justify-center px-3 py-1 text-sm rounded ${
            isImporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
          <span>{isImporting ? 'Importation...' : `Importer ${displayName}`}</span>
        </label>
        <input
          id={`import-${entity}`}
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleImport}
          disabled={isImporting}
          className="hidden"
        />
      </div>
      
      {error && (
        <div className="flex items-center text-red-600 bg-red-50 p-2 rounded text-sm">
          <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center text-green-600 bg-green-50 p-2 rounded text-sm">
          <CheckIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};

export default CsvImportHelper;