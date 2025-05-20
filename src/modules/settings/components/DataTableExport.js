// src/modules/settings/components/DataTableExport.js
import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Papa from 'papaparse';

/**
 * Composant pour l'exportation de données tabulaires au format CSV
 * 
 * @param {Object} props
 * @param {Array} props.data - Données à exporter
 * @param {string} props.filename - Nom du fichier d'export
 * @param {string} props.buttonText - Texte du bouton
 * @param {string} props.className - Classes CSS additionnelles
 */
const DataTableExport = ({ data, filename = 'export.csv', buttonText = 'Exporter CSV', className = '' }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    
    // Convertir en CSV
    const csvData = Papa.unparse(data);
    
    // Télécharger le fichier
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <button
      onClick={handleExport}
      className={`flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 ${className}`}
    >
      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
      {buttonText}
    </button>
  );
};

export default DataTableExport;