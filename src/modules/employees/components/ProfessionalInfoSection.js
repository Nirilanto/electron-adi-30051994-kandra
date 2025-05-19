// src/modules/employees/components/ProfessionalInfoSection.js
import React from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ProfessionalInfoSection = ({ 
  employee, 
  handleChange, 
  handleDateChange, 
  handleSkillsChange, 
  qualifications,
  errors 
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-500" />
        Informations professionnelles
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">
            Qualification
          </label>
          <select
            id="qualification"
            name="qualification"
            value={employee.qualification}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {qualifications?.map((qualification) => (
              <option key={qualification.id} value={qualification.title}>
                {qualification.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date d'embauche
          </label>
          <DatePicker
            id="hireDate"
            selected={employee.hireDate}
            onChange={(date) => handleDateChange(date, 'hireDate')}
            dateFormat="dd/MM/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            isClearable
          />
        </div>
        
        <div>
          <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
            Taux horaire (€)
          </label>
          <input
            type="number"
            id="hourlyRate"
            name="hourlyRate"
            value={employee.hourlyRate}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.hourlyRate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.hourlyRate && (
            <p className="mt-1 text-sm text-red-500">{errors.hourlyRate}</p>
          )}
        </div>
        
        <div className="md:col-span-3">
          <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
            Compétences
          </label>
          <div className="relative">
            <select
              id="skills"
              name="skills"
              multiple
              value={employee.skills ? employee.skills.split(',')?.map(s => s.trim()) : []}
              onChange={handleSkillsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            >
              {qualifications?.map((qualification) => (
                <option key={qualification.id} value={qualification.title}>
                  {qualification.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Maintenez la touche Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs compétences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalInfoSection;