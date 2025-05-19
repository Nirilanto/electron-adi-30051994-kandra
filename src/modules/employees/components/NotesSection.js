
// src/modules/employees/components/NotesSection.js
import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const NotesSection = ({ employee, handleChange }) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
        Commentaire diverse
      </h2>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="4"
          value={employee.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
    </div>
  );
};

export default NotesSection;