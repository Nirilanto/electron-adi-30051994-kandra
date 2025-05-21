// src/modules/employees/components/PersonalInfoSection.js
import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AutocompleteNationality from '../components/AutocompleteNationality';

const PersonalInfoSection = ({ employee, handleChange, handleDateChange, errors }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
        Informations personnelles
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Civilité
          </label>
          <select
            id="gender"
            name="gender"
            value={employee.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="M">M</option>
            <option value="F">Mme</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={employee.lastName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="maidenName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom de jeune fille
          </label>
          <input
            type="text"
            id="maidenName"
            name="maidenName"
            value={employee.maidenName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={employee.firstName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date de naissance
          </label>
          <DatePicker
            id="birthDate"
            selected={employee.birthDate}
            onChange={(date) => handleDateChange(date, 'birthDate')}
            dateFormat="dd/MM/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            isClearable
          />
        </div>
        
        <div>
          <label htmlFor="birthCity" className="block text-sm font-medium text-gray-700 mb-1">
            Ville de naissance
          </label>
          <input
            type="text"
            id="birthCity"
            name="birthCity"
            value={employee.birthCity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
            Nationalité
          </label>
          <AutocompleteNationality 
            value={employee.nationality} 
            onChange={handleChange} 
          />
        </div>
        
        <div>
          <label htmlFor="familyStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Situation familiale
          </label>
          <select
            id="familyStatus"
            name="familyStatus"
            value={employee.familyStatus}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Sélectionner --</option>
            <option value="CÉLIBATAIRE">CÉLIBATAIRE</option>
            <option value="MARIÉ(E)">MARIÉ(E)</option>
            <option value="PACSÉ(E)">PACSÉ(E)</option>
            <option value="DIVORCÉ(E)">DIVORCÉ(E)</option>
            <option value="VEUF(VE)">VEUF(VE)</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="availableDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date Disponible
          </label>
          <DatePicker
            id="availableDate"
            selected={employee.availableDate}
            onChange={(date) => handleDateChange(date, 'availableDate')}
            dateFormat="dd/MM/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            isClearable
          />
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            id="status"
            name="status"
            value={employee.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;