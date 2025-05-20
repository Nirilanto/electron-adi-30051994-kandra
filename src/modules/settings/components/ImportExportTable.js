// src/modules/settings/components/ImportExportTable.js
import React from 'react';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import CsvExportHelper from './CsvExportHelper';
import CsvImportHelper from './CsvImportHelper';

/**
 * Tableau des entités pour import/export CSV
 * 
 * @param {Object} props
 * @param {Function} props.onImportComplete - Fonction à appeler quand un import est terminé
 */
const ImportExportTable = ({ onImportComplete }) => {
  const entities = [
    {
      id: 'employees',
      label: 'Employés',
      description: 'Fiches des employés avec leurs données personnelles et professionnelles'
    },
    {
      id: 'clients',
      label: 'Clients',
      description: 'Fiches des clients avec leurs coordonnées et informations administratives'
    },
    {
      id: 'contracts',
      label: 'Contrats',
      description: 'Contrats de mission liant un employé à un client avec détails de mission'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      description: 'Tous les paramètres (TVA, heures, qualifications, etc.)'
    }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entité
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entities.map(entity => (
            <tr key={entity.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <TableCellsIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-900">{entity.label}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {entity.description}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="flex justify-end space-x-2">
                  <CsvExportHelper entity={entity.id} displayName={entity.label} />
                  <CsvImportHelper entity={entity.id} displayName={entity.label} onComplete={onImportComplete} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ImportExportTable;