// src/modules/settings/components/AccessMethodsSettings.js
import React, { useState } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

function AccessMethodsSettings({ accessMethods, onSave, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [newAccessMethod, setNewAccessMethod] = useState({ title: '', label: '' });
  const [editingId, setEditingId] = useState(null);
  
  // Initialiser le formulaire d'édition avec les données du moyen d'accès sélectionné
  const handleEdit = (method) => {
    setEditingId(method.id);
    setNewAccessMethod({ ...method });
    setEditMode(true);
  };
  
  // Annuler l'édition
  const handleCancel = () => {
    setEditMode(false);
    setEditingId(null);
    setNewAccessMethod({ title: '', label: '' });
  };
  
  // Enregistrer le moyen d'accès
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(newAccessMethod);
    handleCancel();
  };
  
  // Supprimer un moyen d'accès
  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce moyen d\'accès ?')) {
      onDelete(id);
    }
  };
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAccessMethod(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Mettre à jour automatiquement le libellé s'il est vide ou identique au titre précédent
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setNewAccessMethod(prev => {
      // Si le libellé est vide ou égal au titre précédent, on le met à jour
      if (!prev.label || prev.label === prev.title) {
        return { ...prev, title: newTitle, label: newTitle };
      }
      // Sinon, on ne met à jour que le titre
      return { ...prev, title: newTitle };
    });
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Moyens d'accès</h2>
        
        {!editMode && (
          <button
            type="button"
            onClick={() => {
              setEditMode(true);
              setEditingId(null);
              setNewAccessMethod({ title: '', label: '' });
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
            {editingId ? 'Modifier le moyen d\'accès' : 'Ajouter un moyen d\'accès'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={newAccessMethod.title}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                Libellé
              </label>
              <input
                type="text"
                id="label"
                name="label"
                value={newAccessMethod.label}
                onChange={handleChange}
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
      
      {/* Tableau des moyens d'accès */}
      {accessMethods.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-3 px-4 text-left text-sm font-semibold border-b">ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold border-b">Code</th>
                <th className="py-3 px-4 text-left text-sm font-semibold border-b">Libellé</th>
                <th className="py-3 px-4 text-center text-sm font-semibold border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accessMethods.map(method => (
                <tr key={method.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{method.id}</td>
                  <td className="py-3 px-4 border-b">{method.title}</td>
                  <td className="py-3 px-4 border-b">{method.label}</td>
                  <td className="py-3 px-4 border-b text-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(method)}
                      className="text-blue-600 hover:text-blue-800 mx-1"
                      title="Modifier"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDelete(method.id)}
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
          <p className="text-gray-500">Aucun moyen d'accès configuré</p>
          {!editMode && (
            <button
              type="button"
              onClick={() => {
                setEditMode(true);
                setEditingId(null);
              }}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Ajouter un moyen d'accès
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AccessMethodsSettings;