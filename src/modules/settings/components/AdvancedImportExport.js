// src/modules/settings/components/AdvancedImportExport.js
import React, { useState, useRef } from 'react';
import {
  DocumentPlusIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import DatabaseService from '../../../services/DatabaseService';
import ImportExportTable from './ImportExportTable';

const AdvancedImportExport = ({ onDataImported }) => {
  const [backupFile, setBackupFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showBackupInfo, setShowBackupInfo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Exporter une sauvegarde complète (JSON)
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      await DatabaseService.saveToFile('contrat-manager-backup.json');
      
      setSuccess('Sauvegarde exportée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'export de la sauvegarde :', error);
      setError(`Erreur lors de l'export : ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Gérer la sélection du fichier d'import
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackupFile(file);
      setError('');
    }
  };

  // Importer une sauvegarde complète (JSON)
  const handleImportBackup = async () => {
    if (!backupFile) {
      setError('Veuillez sélectionner un fichier de sauvegarde');
      return;
    }
    
    if (!backupFile.name.endsWith('.json')) {
      setError('Le fichier doit être au format JSON');
      return;
    }
    
    try {
      setIsImporting(true);
      setError('');
      
      const result = await DatabaseService.loadFromFile(backupFile);
      
      if (result.success) {
        setSuccess('Sauvegarde importée avec succès');
        setTimeout(() => setSuccess(''), 3000);
        setBackupFile(null);
        
        // Réinitialiser l'input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Notification pour actualiser les données
        if (onDataImported) {
          onDataImported();
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'import de la sauvegarde :', error);
      setError(`Erreur lors de l'import : ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section de sauvegarde complète */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-700">Sauvegarde complète (JSON)</h3>
          <button 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            onClick={() => setShowBackupInfo(!showBackupInfo)}
          >
            <InformationCircleIcon className="h-4 w-4 mr-1" />
            {showBackupInfo ? 'Masquer les infos' : 'Afficher les infos'}
          </button>
        </div>
        
        {showBackupInfo && (
          <div className="mb-4 text-sm bg-blue-50 p-3 rounded border border-blue-200 text-blue-800">
            <p>La sauvegarde complète contient toutes vos données :</p>
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>Employés</li>
              <li>Clients</li>
              <li>Contrats</li>
              <li>Tous les paramètres</li>
            </ul>
            <p className="mt-1">Utilisez cette option pour transférer toutes vos données vers une autre installation de l'application.</p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className={`flex items-center px-4 py-2 rounded-md ${
              isExporting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            {isExporting ? 'Exportation...' : 'Exporter une sauvegarde complète'}
          </button>
          
          <div className="flex-1 flex items-center space-x-2">
            <label 
              htmlFor="backup-file"
              className={`cursor-pointer flex items-center px-4 py-2 rounded-md ${
                isImporting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <DocumentPlusIcon className="h-5 w-5 mr-2" />
              <span className="text-white">Sélectionner un fichier</span>
            </label>
            <input
              id="backup-file"
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isImporting}
              className="hidden"
            />
            
            {backupFile && (
              <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded border border-gray-300">
                <span className="text-sm text-gray-700 truncate max-w-xs">{backupFile.name}</span>
                <button 
                  onClick={() => {
                    setBackupFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <button
              onClick={handleImportBackup}
              disabled={isImporting || !backupFile}
              className={`flex items-center px-4 py-2 rounded-md ${
                isImporting || !backupFile
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-700 text-white hover:bg-green-800'
              }`}
            >
              {isImporting ? 'Importation...' : 'Importer'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 flex items-center text-red-600 bg-red-50 p-2 rounded">
            <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mt-3 flex items-center text-green-600 bg-green-50 p-2 rounded">
            <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>
      
      {/* Section d'import/export CSV par entité */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Import/Export CSV par entité</h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Vous pouvez importer ou exporter des données par entité au format CSV pour les utiliser dans Excel ou d'autres applications.
          </p>
          
          {/* Table d'entités */}
          <ImportExportTable onImportComplete={onDataImported} />
          
          <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
            <p className="flex items-center font-medium text-yellow-700">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              Important
            </p>
            <ul className="mt-1 list-disc list-inside ml-2">
              <li>Lors de l'import CSV, assurez-vous que les colonnes correspondent au format attendu.</li>
              <li>Pour des modifications en masse, exportez d'abord les données, modifiez-les, puis importez-les.</li>
              <li>Les imports CSV écrasent les données existantes avec le même ID.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedImportExport;