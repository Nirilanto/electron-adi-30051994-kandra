// src/modules/contracts/components/ContractTabNavigation.js
import React from 'react';
import { 
  InformationCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';

const ContractTabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { 
      id: 'details', 
      label: 'Détails', 
      icon: InformationCircleIcon,
      description: 'Informations générales du contrat'
    },
    { 
      id: 'conditions', 
      label: 'Conditions', 
      icon: DocumentTextIcon,
      description: 'Termes et conditions contractuelles'
    },
    { 
      id: 'pointage', 
      label: 'Pointage', 
      icon: ClockIcon,
      description: 'Suivi des heures et présences'
    },
    { 
      id: 'facturation', 
      label: 'Facturation', 
      icon: CurrencyEuroIcon,
      description: 'Tarification et facturation'
    }
  ];

  return (
    <div className="relative">
      {/* Arrière-plan avec effet glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 backdrop-blur-sm"></div>
      
      <div className="relative px-6 py-4">
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center px-6 py-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white shadow-lg text-blue-700 ring-1 ring-blue-200/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Indicateur actif */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"></div>
                )}
                
                {/* Icône avec animation */}
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                }`}>
                  <Icon className={`h-4 w-4 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                </div>
                
                {/* Contenu du tab */}
                <div className="relative text-left">
                  <div className={`font-semibold transition-colors ${
                    isActive ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {tab.label}
                  </div>
                  <div className={`text-xs mt-0.5 transition-colors ${
                    isActive ? 'text-blue-600/80' : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    {tab.description}
                  </div>
                </div>
                
                {/* Effet de survol */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default ContractTabNavigation;