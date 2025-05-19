// src/modules/employees/components/IdentificationSection.js
import React from 'react';
import { IdentificationIcon } from '@heroicons/react/24/outline';

const IdentificationSection = ({ employee, handleChange, errors }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <IdentificationIcon className="h-5 w-5 mr-2 text-blue-500" />
        Identification
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-1">
            N° salarié
          </label>
          <input
            type="text"
            id="employeeNumber"
            name="employeeNumber"
            value={employee.employeeNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="socialSecurityNumber" className="block text-sm font-medium text-gray-700 mb-1">
            N° sécurité sociale
          </label>
          <input
            type="text"
            id="socialSecurityNumber"
            name="socialSecurityNumber"
            value={employee.socialSecurityNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.socialSecurityNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.socialSecurityNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.socialSecurityNumber}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentificationSection;