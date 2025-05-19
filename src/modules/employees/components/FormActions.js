
// src/modules/employees/components/FormActions.js
import React from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

const FormActions = ({ navigate, isSubmitting, isSaved }) => {
  return (
    <div className="flex justify-end space-x-4 mt-8">
      <button
        type="button"
        onClick={() => navigate('/employees')}
        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`flex items-center px-6 py-2 rounded-md ${
          isSubmitting 
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <PaperAirplaneIcon className="h-5 w-5 mr-2" />
        {isSubmitting 
          ? 'Enregistrement...'
          : isSaved 
            ? 'Mettre à jour'
            : 'Enregistrer'
        }
      </button>
    </div>
  );
};

export default FormActions;