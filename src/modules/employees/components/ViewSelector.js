// src/modules/employees/components/ViewSelector.js
import React from 'react';
import { 
  ListBulletIcon,
  Squares2X2Icon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

const ViewSelector = ({ currentView, onViewChange }) => {
  const views = [
    {
      id: 'table',
      icon: TableCellsIcon,
      title: 'Vue tableau'
    },
    {
      id: 'list',
      icon: ListBulletIcon,
      title: 'Vue liste'
    },
    {
      id: 'cards',
      icon: Squares2X2Icon,
      title: 'Vue cartes'
    }
  ];

  return (
    <div className="flex flex-col bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/20 p-1">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;
        
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`relative p-1 rounded-lg transition-all duration-300 ${
              isActive
                ? 'bg-blue-600 shadow-md'
                : 'hover:bg-gray-100'
            }`}
            title={view.title}
          >
            <Icon className={`h-5 w-5 transition-all duration-300 ${
              isActive 
                ? 'text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`} />
          </button>
        );
      })}
    </div>
  );
};

export default ViewSelector;