// src/modules/settings/components/TaxRatesSettings.js
import React, { useState } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

function TaxRatesSettings({ taxRates, onSave, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [newTaxRate, setNewTaxRate] = useState({ title: '', value: 0 });
  const [editingId, setEditingId] = useState(null);
  
  // Initialiser le formulaire d'édition avec les données du taux sélectionné
  const handleEdit = (taxRate) => {
    setEditingId(taxRate.id);
    setNewTaxRate({ ...taxRate });
    setEditMode(true);
  };
  
  // Annuler l'édition
  const handleCancel = () => {
    setEditMode(false);
    setEditingId(null);
    setNewTaxRate({ title: '', value: 0 });
  };
  
  // Enregistrer le taux de TVA
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(newTaxRate);
    handleCancel();
  };
  
  // Supprimer un taux de TVA
  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce taux de TVA ?')) {
      onDelete(id);
    }
  };
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTaxRate(prev => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) : value
    }));
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Taux de TVA</h2>
        
        {!editMode && (
          <button
            type="button"
            onClick={() => {
              setEditMode(true);
              setEditingId(null);
              setNewTaxRate({ title: '', value: 0 });
            }}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Ajouter
          </button>
        )}
      </div>
      
      {/* Formulaire d'ajout/édition */}
      {editMode && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {editingId ? 'Modifier le taux de TVA' : 'Ajouter un taux de TVA'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Intitulé
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTaxRate.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Valeur (%)
              </label>
              <input
                type="number"
                id="value"
                name="value"
                value={newTaxRate.value}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}
      
      {/* Tableau des taux de TVA */}
      {taxRates.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-3 px-4 text-left text-sm font-semibold border-b">ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold border-b">Intitulé</th>
                <th className="py-3 px-4 text-right text-sm font-semibold border-b">Valeur (%)</th>
                <th className="py-3 px-4 text-center text-sm font-semibold border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxRates.map(taxRate => (
                <tr key={taxRate.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{taxRate.id}</td>
                  <td className="py-3 px-4 border-b">{taxRate.title}</td>
                  <td className="py-3 px-4 text-right border-b">{taxRate.value.toFixed(2)}</td>
                  <td className="py-3 px-4 border-b text-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(taxRate)}
                      className="text-blue-600 hover:text-blue-800 mx-1"
                      title="Modifier"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDelete(taxRate.id)}
                      className="text-red-600 hover:text-red-800 mx-1"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-500">Aucun taux de TVA configuré</p>
          {!editMode && (
            <button
              type="button"
              onClick={() => {
                setEditMode(true);
                setEditingId(null);
              }}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Ajouter un taux de TVA
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default TaxRatesSettings;