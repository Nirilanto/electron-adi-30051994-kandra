// src/modules/employees/components/PaymentInfoSection.js
import React from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';

const PaymentInfoSection = ({ 
  employee, 
  handleChange, 
  paymentMethods 
}) => {
  console.log(" paymentMethods ------------------- ", paymentMethods);
  
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <BanknotesIcon className="h-5 w-5 mr-2 text-blue-500" />
        Informations de paiement
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
            Mode de paiement
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={employee.paymentMethod}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ererer
            {paymentMethods?.map((method) => (
              <option key={"paymentMethods_"+method.id} value={method.title}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="taxWithholding" className="block text-sm font-medium text-gray-700 mb-1">
            Tx prél. source
          </label>
          <input
            type="number"
            id="taxWithholding"
            name="taxWithholding"
            value={employee.taxWithholding}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="mutualInsurance" className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <input
              type="checkbox"
              id="mutualInsurance"
              name="mutualInsurance"
              checked={employee.mutualInsurance}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            MUTUEL
          </label>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoSection;