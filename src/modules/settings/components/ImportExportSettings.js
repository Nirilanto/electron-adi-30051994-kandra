// src/modules/settings/components/ImportExportSettings.js
import React from 'react';
import { 
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import AdvancedImportExport from './AdvancedImportExport';

const ImportExportSettings = ({ onDataImported }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <CloudArrowUpIcon className="h-6 w-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-800">Importation / Exportation des données</h2>
      </div>
      
      <div className="p-2">
        <AdvancedImportExport onDataImported={onDataImported} />
      </div>
    </div>
  );
};

export default ImportExportSettings;