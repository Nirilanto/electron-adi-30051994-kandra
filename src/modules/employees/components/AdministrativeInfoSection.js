// src/modules/employees/components/AdministrativeInfoSection.js
import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const AdministrativeInfoSection = ({ employee, handleChange }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
        Informations administratives
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="constructionCard" className="block text-sm font-medium text-gray-700 mb-1">
            Carte BTP
          </label>
          <input
            type="text"
            id="constructionCard"
            name="constructionCard"
            value={employee.constructionCard}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="urssafNumber" className="block text-sm font-medium text-gray-700 mb-1">
            N° URSSAF
          </label>
          <input
            type="text"
            id="urssafNumber"
            name="urssafNumber"
            value={employee.urssafNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="assedicNumber" className="block text-sm font-medium text-gray-700 mb-1">
            N° ASSEDIC
          </label>
          <input
            type="text"
            id="assedicNumber"
            name="assedicNumber"
            value={employee.assedicNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default AdministrativeInfoSection;