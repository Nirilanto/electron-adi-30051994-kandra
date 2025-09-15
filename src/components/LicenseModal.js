// src/components/LicenseModal.js
import React, { useState } from 'react';
import { KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const LicenseModal = ({ isOpen, onActivate }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Veuillez entrer un code d\'activation');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await onActivate(code.trim());
      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      setError('Erreur lors de l\'activation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Activation Requise
          </h2>
          <p className="text-gray-600">
            Votre période d'essai gratuite est terminée.
            Veuillez entrer votre code d'activation pour continuer à utiliser l'application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="activation-code" className="block text-sm font-medium text-gray-700 mb-2">
              Code d'activation
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="activation-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-wider font-mono text-sm"
                placeholder="CM2025-XXXXX-XXX"
                maxLength={50}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Activation en cours...' : 'Activer'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Besoin d'aide ? Contactez le support technique
          </p>
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;