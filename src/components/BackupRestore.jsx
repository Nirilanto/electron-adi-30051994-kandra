import React, { useState } from 'react';
import DatabaseService from '../services/DatabaseService';

const BackupRestore = () => {
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.createRef();

  // Exporter les données (sauvegarde complète générée par le serveur)
  const handleBackup = async () => {
    try {
      setLoading(true);
      setBackupStatus('');
      const result = await DatabaseService.saveToFile();
      setBackupStatus(`Sauvegarde réussie : ${result.filename || 'Fichier créé'}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setBackupStatus(`Erreur : ${error.message || 'Échec de la sauvegarde'}`);
    } finally {
      setLoading(false);
    }
  };

  // Importer les données (remplace toutes les données existantes)
  const handleRestore = async () => {
    try {
      setLoading(true);
      setRestoreStatus('');

      if (!fileInputRef.current.files.length) {
        setRestoreStatus('Erreur : Aucun fichier sélectionné');
        return;
      }

      const file = fileInputRef.current.files[0];
      await DatabaseService.loadFromFile(file);
      setRestoreStatus('Restauration réussie !');
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      setRestoreStatus(`Erreur : ${error.message || 'Échec de la restauration'}`);
    } finally {
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
