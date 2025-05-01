import React, { useState } from 'react';
import DatabaseService from '../services/DatabaseService';

const BackupRestore = () => {
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.createRef();

  // Exporter les données
  const handleBackup = async () => {
    try {
      setLoading(true);
      setBackupStatus('');
      
      // Exporter toutes les données
      const data = await DatabaseService.exportData();
      
      // En environnement Electron, utiliser les APIs natives
      if (window.electron) {
        const result = await DatabaseService.saveToFile();
        setBackupStatus(`Sauvegarde réussie : ${result.filePath || 'Fichier créé'}`);
      } else {
        // Sinon, créer un lien de téléchargement
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'contrat-manager-backup.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        setBackupStatus('Sauvegarde réussie. Téléchargement en cours...');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setBackupStatus(`Erreur : ${error.message || 'Échec de la sauvegarde'}`);
    } finally {
      setLoading(false);
    }
  };

  // Importer les données
  const handleRestore = async () => {
    try {
      setLoading(true);
      setRestoreStatus('');
      
      // Vérifier si un fichier a été sélectionné
      if (!fileInputRef.current.files.length) {
        setRestoreStatus('Erreur : Aucun fichier sélectionné');
        return;
      }
      
      const file = fileInputRef.current.files[0];
      
      // En environnement Electron, utiliser les APIs natives
      if (window.electron) {
        // Note: Dans une vraie application, vous utiliseriez une boîte de dialogue
        // pour sélectionner le fichier via Electron
        const result = await DatabaseService.loadFromFile(file);
        setRestoreStatus('Restauration réussie !');
      } else {
        // Sinon, lire le fichier dans le navigateur
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target.result);
            await DatabaseService.importData(data);
            setRestoreStatus('Restauration réussie !');
          } catch (error) {
            console.error('Erreur lors de la restauration:', error);
            setRestoreStatus(`Erreur : ${error.message || 'Échec de la restauration'}`);
          } finally {
            setLoading(false);
          }
        };
        
        reader.onerror = (error) => {
          setRestoreStatus(`Erreur : ${error.message || 'Échec de la lecture du fichier'}`);
          setLoading(false);
        };
        
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      setRestoreStatus(`Erreur : ${error.message || 'Échec de la restauration'}`);
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-medium text-gray-700 mb-4">Sauvegarde et restauration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sauvegarde */}
        <div>
          <h3 className="text-md font-medium text-gray-600 mb-2">Exporter les données</h3>
          <p className="text-sm text-gray-500 mb-4">
            Sauvegarder toutes les données dans un fichier JSON.
          </p>
          <button 
            onClick={handleBackup} 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Exportation...' : 'Exporter les données'}
          </button>
          
          {backupStatus && (
            <p className={`mt-2 text-sm ${backupStatus.includes('Erreur') ? 'text-red-500' : 'text-green-500'}`}>
              {backupStatus}
            </p>
          )}
        </div>
        
        {/* Restauration */}
        <div>
          <h3 className="text-md font-medium text-gray-600 mb-2">Importer les données</h3>
          <p className="text-sm text-gray-500 mb-4">
            Restaurer les données à partir d'un fichier de sauvegarde.
          </p>
          <div className="flex flex-col space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="form-input text-sm"
            />
            <button 
              onClick={handleRestore} 
              className="btn btn-outline"
              disabled={loading}
            >
              {loading ? 'Importation...' : 'Importer les données'}
            </button>
          </div>
          
          {restoreStatus && (
            <p className={`mt-2 text-sm ${restoreStatus.includes('Erreur') ? 'text-red-500' : 'text-green-500'}`}>
              {restoreStatus}
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
        <p className="text-sm">
          <strong>Important :</strong> L'importation de données remplacera toutes les données existantes. 
          Assurez-vous de faire une sauvegarde avant d'importer de nouvelles données.
        </p>
      </div>
    </div>
  );
};

export default BackupRestore;