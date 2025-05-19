// src/modules/employees/components/IdDocumentsSection.js
import React from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const IdDocumentsSection = ({ employee, handleChange, handleDateChange }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <CreditCardIcon className="h-5 w-5 mr-2 text-blue-500" />
        Documents d'identité
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="idCardType" className="block text-sm font-medium text-gray-700 mb-1">
            Nat.Titre séjour
          </label>
          <select
            id="idCardType"
            name="idCardType"
            value={employee.idCardType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CARTE D'IDENTITÉ">CARTE D'IDENTITÉ</option>
            <option value="PASSEPORT">PASSEPORT</option>
            <option value="TITRE DE SÉJOUR">TITRE DE SÉJOUR</option>
            <option value="CARTE DE RÉSIDENT">CARTE DE RÉSIDENT</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="idCardNumber" className="block text-sm font-medium text-gray-700 mb-1">
            N° Titre Séjour
          </label>
          <input
            type="text"
            id="idCardNumber"
            name="idCardNumber"
            value={employee.idCardNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="idCardIssueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date délivrance
          </label>
          <DatePicker
            id="idCardIssueDate"
            selected={employee.idCardIssueDate}
            onChange={(date) => handleDateChange(date, 'idCardIssueDate')}
            dateFormat="dd/MM/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            isClearable
          />
        </div>
        
        <div>
          <label htmlFor="idCardExpiryDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date fin Tit. Séj.
          </label>
          <DatePicker
            id="idCardExpiryDate"
            selected={employee.idCardExpiryDate}
            onChange={(date) => handleDateChange(date, 'idCardExpiryDate')}
            dateFormat="dd/MM/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            isClearable
          />
        </div>
        
        <div>
          <label htmlFor="idCardIssuePlace" className="block text-sm font-medium text-gray-700 mb-1">
            Lieu de délivrance
          </label>
          <input
            type="text"
            id="idCardIssuePlace"
            name="idCardIssuePlace"
            value={employee.idCardIssuePlace}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default IdDocumentsSection;