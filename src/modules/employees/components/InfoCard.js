// src/modules/employees/components/InfoCard.js
import React from 'react';

const InfoCard = ({ 
  title, 
  icon: Icon, 
  children, 
  gradient = 'from-blue-500 to-indigo-600',
  className = '' 
}) => {
  return (
    <div className={`group relative overflow-hidden ${className}`}>
      {/* Arrière-plan avec effet glassmorphism */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 group-hover:shadow-xl transition-all duration-300"></div>
      
      {/* Effet de gradient subtil */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl`}></div>
      
      {/* Contenu */}
      <div className="relative p-6">
        {/* En-tête avec icône */}
        <div className="flex items-center mb-6">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} shadow-lg mr-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
        </div>
        
        {/* Contenu principal */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
      
      {/* Bordure animée */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

// Composant pour les éléments d'information
const InfoItem = ({ 
  label, 
  value, 
  icon: Icon,
  type = 'default',
  className = '' 
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'highlight':
        return {
          container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4',
          label: 'text-blue-700 font-semibold',
          value: 'text-blue-900 font-bold'
        };
      case 'warning':
        return {
          container: 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-4',
          label: 'text-amber-700 font-semibold',
          value: 'text-amber-900 font-bold'
        };
      case 'success':
        return {
          container: 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4',
          label: 'text-green-700 font-semibold',
          value: 'text-green-900 font-bold'
        };
      default:
        return {
          container: 'bg-gray-50/50 rounded-lg p-4 hover:bg-gray-50 transition-colors',
          label: 'text-gray-600 font-medium',
          value: 'text-gray-900 font-semibold'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`${styles.container} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-1">
            {Icon && (
              <Icon className="h-4 w-4 mr-2 text-gray-500" />
            )}
            <label className={`text-sm ${styles.label}`}>
              {label}
            </label>
          </div>
          <p className={`text-base ${styles.value} break-words`}>
            {value || '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Grid responsive pour organiser les InfoItems
const InfoGrid = ({ children, columns = 2 }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
};

export default InfoCard;
export { InfoItem, InfoGrid };