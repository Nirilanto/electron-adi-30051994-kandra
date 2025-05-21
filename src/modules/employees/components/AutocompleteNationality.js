// src/components/AutocompleteNationality.js
import React, { useState, useEffect, useRef } from 'react';

// Nationalités de base (statiques, ne peuvent pas être supprimées)
const DEFAULT_NATIONALITIES = [
  'FRANCAISE',
  'BULGARE',
  'ALLEMANDE',
  'ITALIENNE',
  'ESPAGNOLE',
  'PORTUGAISE',
  'BRITANNIQUE',
  'AUTRE'
];

// Clé pour le localStorage
const LOCAL_STORAGE_KEY = 'app_custom_nationalities';

const AutocompleteNationality = ({ value, onChange }) => {
  // État pour stocker toutes les nationalités (prédéfinies + personnalisées)
  const [nationalities, setNationalities] = useState([...DEFAULT_NATIONALITIES]);
  
  // État pour gérer les suggestions filtrées
  const [suggestions, setSuggestions] = useState([]);
  // État pour gérer l'affichage de la dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  // État pour stocker la valeur d'entrée
  const [inputValue, setInputValue] = useState(value || '');
  
  // Référence pour gérer les clics à l'extérieur
  const wrapperRef = useRef(null);

  // Fonction pour trier les nationalités par ordre alphabétique
  const sortNationalities = (nationalities) => {
    return [...nationalities].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  };

  // Chargement des nationalités personnalisées depuis localStorage au chargement
  useEffect(() => {
    try {
      const storedCustomNationalities = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedCustomNationalities) {
        const customNationalities = JSON.parse(storedCustomNationalities);
        // Fusionner les listes et trier par ordre alphabétique
        setNationalities(sortNationalities([...DEFAULT_NATIONALITIES, ...customNationalities]));
      } else {
        // Même sans données personnalisées, on trie les valeurs par défaut
        setNationalities(sortNationalities([...DEFAULT_NATIONALITIES]));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des nationalités depuis localStorage:", error);
    }
  }, []);

  // Initialisation de l'input avec la valeur existante
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Enregistrer les nationalités personnalisées dans localStorage
  const saveCustomNationalitiesToLocalStorage = (allNationalities) => {
    try {
      // Filtrer pour ne garder que les nationalités personnalisées
      const customNationalities = allNationalities.filter(
        n => !DEFAULT_NATIONALITIES.includes(n)
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customNationalities));
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des nationalités dans localStorage:", error);
    }
  };

  // Vérifier si une nationalité est personnalisée (non présente dans les valeurs par défaut)
  const isCustomNationality = (nationality) => {
    return !DEFAULT_NATIONALITIES.includes(nationality);
  };

  // Gestionnaire pour la suppression d'une nationalité personnalisée
  const handleDeleteNationality = (nationalityToDelete, event) => {
    // Empêcher la propagation pour éviter de sélectionner la nationalité
    event.stopPropagation();
    
    // Ne supprimer que si c'est une nationalité personnalisée
    if (isCustomNationality(nationalityToDelete)) {
      const updatedNationalities = sortNationalities(nationalities.filter(n => n !== nationalityToDelete));
      setNationalities(updatedNationalities);
      
      // Si la valeur actuelle est celle qu'on supprime, réinitialiser
      if (inputValue === nationalityToDelete) {
        setInputValue('');
        onChange({ target: { name: 'nationality', value: '' } });
      }
      
      // Mettre à jour le stockage local
      saveCustomNationalitiesToLocalStorage(updatedNationalities);
      
      // Mettre à jour les suggestions
      const filteredSuggestions = updatedNationalities.filter(
        n => n.toUpperCase().indexOf(inputValue.toUpperCase()) > -1
      );
      setSuggestions(filteredSuggestions);
    }
  };

  // Gestionnaire pour la modification de l'input
  const handleInputChange = (e) => {
    const userInput = e.target.value.toUpperCase();
    setInputValue(userInput);
    
    // Filtrer les suggestions
    const filteredSuggestions = nationalities.filter(
      nationality => nationality.toUpperCase().indexOf(userInput.toUpperCase()) > -1
    );
    
    setSuggestions(filteredSuggestions);
    setShowSuggestions(true);
  };

  // Gestionnaire pour la sélection d'une suggestion
  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ target: { name: 'nationality', value: suggestion } });
  };

  // Gestionnaire pour la touche Entrée et autres touches
  const handleKeyDown = (e) => {
    // Si l'utilisateur appuie sur Entrée
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Vérifier si l'entrée existe déjà dans la liste
      const exists = nationalities.find(
        n => n.toUpperCase() === inputValue.toUpperCase()
      );
      
      // Si elle n'existe pas, l'ajouter à la liste
      if (!exists && inputValue.trim()) {
        const newValue = inputValue.toUpperCase();
        const updatedNationalities = sortNationalities([...nationalities, newValue]);
        setNationalities(updatedNationalities);
        onChange({ target: { name: 'nationality', value: newValue } });
        
        // Mettre à jour le stockage local
        saveCustomNationalitiesToLocalStorage(updatedNationalities);
      } else if (exists) {
        // Si elle existe, sélectionner celle-ci
        onChange({ target: { name: 'nationality', value: exists } });
      }
      
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      // Fermer la liste de suggestions
      setShowSuggestions(false);
    }
  };

  // Afficher/masquer la liste des suggestions lors du clic sur l'input
  const handleInputClick = () => {
    setShowSuggestions(!showSuggestions);
    // Afficher toutes les nationalités lorsqu'on clique sans avoir tapé de texte
    if (inputValue === '') {
      setSuggestions(nationalities);
    }
  };

  // Gérer les clics à l'extérieur pour fermer la dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
        
        // Quand on clique en dehors, si la valeur est valide, on la sauvegarde
        if (inputValue.trim()) {
          // Chercher si l'entrée existe déjà (insensible à la casse)
          const existingValue = nationalities.find(
            n => n.toUpperCase() === inputValue.toUpperCase()
          );
          
          if (!existingValue) {
            // Ajouter la nouvelle valeur à la liste
            const newValue = inputValue.toUpperCase();
            const updatedNationalities = sortNationalities([...nationalities, newValue]);
            setNationalities(updatedNationalities);
            onChange({ target: { name: 'nationality', value: newValue } });
            
            // Mettre à jour le stockage local
            saveCustomNationalitiesToLocalStorage(updatedNationalities);
          } else {
            // Utiliser la valeur existante (avec la casse correcte)
            setInputValue(existingValue);
            onChange({ target: { name: 'nationality', value: existingValue } });
          }
        }
      }
    };
    
    // Ajouter l'écouteur d'événement
    document.addEventListener('mousedown', handleClickOutside);
    
    // Nettoyer l'écouteur
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [nationalities, inputValue, onChange]);

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Saisissez une nationalité"
      />
      
      {/* Icône de flèche vers le bas pour indiquer qu'il s'agit d'un menu déroulant */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      
      {/* Liste des suggestions */}
      {showSuggestions && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
              >
                <span>{suggestion}</span>
                {isCustomNationality(suggestion) && (
                  <button
                    onClick={(e) => handleDeleteNationality(suggestion, e)}
                    className="text-red-500 hover:text-red-700 font-bold"
                    title="Supprimer cette nationalité"
                  >
                    ×
                  </button>
                )}
              </li>
            ))
          ) : inputValue ? (
            <li className="px-3 py-2 text-gray-500">
              Appuyez sur Entrée pour ajouter "{inputValue.toUpperCase()}"
            </li>
          ) : (
            <li className="px-3 py-2 text-gray-500">
              Aucune nationalité disponible
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteNationality;