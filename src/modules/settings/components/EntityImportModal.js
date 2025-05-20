// src/modules/settings/components/EntityImportModal.js
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal pour sélectionner l'entité à importer depuis un CSV
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture de la modal
 * @param {Function} props.onClose - Fonction à appeler pour fermer la modal
 * @param {Function} props.onImport - Fonction à appeler pour importer une entité
 */
const EntityImportModal = ({ isOpen, onClose, onImport }) => {
  if (!isOpen) return null;

  const entities = [
    { id: 'employees', label: 'Employés', description: 'Fiches des employés avec leurs informations personnelles et professionnelles' },
    { id: 'clients', label: 'Clients', description: 'Fiches des clients avec leurs coordonnées et informations administratives' },
    { id: 'contracts', label: 'Contrats', description: 'Contrats de mission liant un employé à un client' },
    { id: 'settings', label: 'Paramètres', description: 'Paramètres divers (TVA, heures, qualifications, etc.)' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Sélectionner le type de données à importer
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">
            Sélectionnez le type de données que contient ce fichier CSV :
          </p>
          
          <div className="space-y-2">
            {entities.map(entity => (
              <button
                key={entity.id}
                onClick={() => onImport(entity.id)}
                className="w-full flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-left"
              >
                <div>
                  <span className="font-medium">{entity.label}</span>
                  <p className="text-xs text-gray-500 mt-1">{entity.description}</p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityImportModal;