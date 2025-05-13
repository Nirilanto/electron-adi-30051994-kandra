// src/modules/settings/components/SignaturesSettings.js
import React, { useState, useRef } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';

function SignaturesSettings({ signatures, onSave, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [newSignature, setNewSignature] = useState({ id: null, title: '', type: 'signature', imageData: null });
  const [editingId, setEditingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  
  // Initialiser le formulaire d'édition avec les données de la signature sélectionnée
  const handleEdit = (signature) => {
    setEditingId(signature.id);
    setNewSignature({ 
      ...signature,
      imageData: signature.imageData || null 
    });
    setPreviewUrl(signature.imageData);
    setEditMode(true);
  };
  
  // Annuler l'édition
  const handleCancel = () => {
    setEditMode(false);
    setEditingId(null);
    setNewSignature({ id: null, title: '', type: 'signature', imageData: null });
    setPreviewUrl(null);
  };
  
  // Enregistrer la signature
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newSignature.imageData) {
      alert('Veuillez sélectionner une image');
      return;
    }
    onSave(newSignature);
    handleCancel();
  };
  
  // Supprimer une signature
  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette signature/tampon ?')) {
      onDelete(id);
    }
  };
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewSignature(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer le téléchargement de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type de fichier (uniquement images)
    if (!file.type.match('image.*')) {
      alert('Veuillez sélectionner un fichier image (jpg, png, jpeg)');
      return;
    }
    
    // Lire le fichier et convertir en base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setNewSignature(prev => ({ ...prev, imageData }));
      setPreviewUrl(imageData);
    };
    reader.readAsDataURL(file);
  };
  
  // Cliquer sur le bouton "Parcourir" pour ouvrir le sélecteur de fichier
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Signatures et tampons</h2>
        
        {!editMode && (
          <button
            type="button"
            onClick={() => {
              setEditMode(true);
              setEditingId(null);
              setNewSignature({ id: null, title: '', type: 'signature', imageData: null });
              setPreviewUrl(null);
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
            {editingId ? 'Modifier la signature/tampon' : 'Ajouter une signature/tampon'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={newSignature.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Ex: Signature Directeur, Tampon Entreprise"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={newSignature.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="signature">Signature</option>
                <option value="stamp">Tampon</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            
            <div className="mt-1 flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={handleBrowseClick}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                Parcourir...
              </button>
              
              <span className="ml-3 text-sm text-gray-500">
                {previewUrl ? 'Image sélectionnée' : 'JPG, JPEG ou PNG'}
              </span>
            </div>
            
            {previewUrl && (
              <div className="mt-4 border p-2 rounded-md bg-white">
                <p className="text-sm text-gray-500 mb-2">Aperçu :</p>
                <img 
                  src={previewUrl}
                  alt="Aperçu" 
                  className="max-h-40 max-w-full object-contain border border-gray-200"
                />
              </div>
            )}
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
              disabled={!previewUrl}
            >
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}
      
      {/* Tableau des signatures et tampons */}
      {signatures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signatures.map(signature => (
            <div key={signature.id} className="border rounded-md p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{signature.title}</h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(signature)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Modifier"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleDelete(signature.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Supprimer"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-2">
                Type: {signature.type === 'signature' ? 'Signature' : 'Tampon'}
              </p>
              
              <div className="border p-2 rounded bg-gray-50">
                <img 
                  src={signature.imageData}
                  alt={signature.title} 
                  className="h-32 w-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Aucune signature ou tampon configuré</p>
          {!editMode && (
            <button
              type="button"
              onClick={() => {
                setEditMode(true);
                setEditingId(null);
              }}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Ajouter une signature ou un tampon
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SignaturesSettings;