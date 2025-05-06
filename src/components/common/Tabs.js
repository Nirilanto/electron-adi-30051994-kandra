// src/components/common/Tabs.js
import React, { useState } from 'react';

/**
 * Composant simple pour remplacer @headlessui/react Tab
 */
export const TabGroup = ({ children, defaultIndex = 0 }) => {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  
  // Passer l'index sélectionné aux enfants
  const childrenWithProps = React.Children.map(children, child => {
    return React.cloneElement(child, { selectedIndex, setSelectedIndex });
  });
  
  return <div className="tab-group">{childrenWithProps}</div>;
};

export const TabList = ({ children, selectedIndex, setSelectedIndex }) => {
  // Ajouter les propriétés nécessaires aux onglets
  const tabs = React.Children.map(children, (child, index) => {
    return React.cloneElement(child, {
      index,
      isSelected: index === selectedIndex,
      onClick: () => setSelectedIndex(index)
    });
  });
  
  return (
    <div className="flex space-x-1 rounded-xl bg-blue-100 p-1">
      {tabs}
    </div>
  );
};

export const Tab = ({ children, index, isSelected, onClick }) => {
  return (
    <button
      className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2
        ${isSelected ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const TabPanels = ({ children, selectedIndex }) => {
  // Afficher uniquement le panel correspondant à l'onglet sélectionné
  const panels = React.Children.map(children, (child, index) => {
    return React.cloneElement(child, {
      index,
      isSelected: index === selectedIndex
    });
  });
  
  return <div className="mt-4">{panels}</div>;
};

export const TabPanel = ({ children, index, isSelected }) => {
  if (!isSelected) return null;
  
  return (
    <div className="rounded-xl bg-white p-3">
      {children}
    </div>
  );
};