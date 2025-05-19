// src/modules/employees/components/AddressSection.js
import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const AddressSection = ({ employee, handleChange }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <MapPinIcon className="h-5 w-5 mr-2 text-blue-500" />
        Adresse
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse numéro voie
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={employee.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="addressComplement" className="block text-sm font-medium text-gray-700 mb-1">
            Complément adres.
          </label>
          <input
            type="text"
            id="addressComplement"
            name="addressComplement"
            value={employee.addressComplement}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
            Code postal
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={employee.postalCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Ville
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={employee.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Pays
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={employee.country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default AddressSection;