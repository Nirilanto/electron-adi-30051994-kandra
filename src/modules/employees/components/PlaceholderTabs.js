// src/modules/employees/components/PlaceholderTabs.js
import React from 'react';
import { 
  DocumentTextIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const PlaceholderTab = ({ 
  title, 
  description, 
  icon: Icon, 
  features = [], 
  gradient = 'from-blue-500 to-indigo-600',
  comingSoon = true 
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Container principal avec effet glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20">
        
        {/* Arrière-plan décoratif */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`}></div>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-24 -translate-x-24"></div>
        </div>

        <div className="relative p-12 text-center">
          {/* Icône principale animée */}
          <div className="relative mx-auto mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl`}>
              <Icon className="h-12 w-12 text-white animate-pulse" />
            </div>
            
            {/* Badge "Coming Soon" */}
            {comingSoon && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                Bientôt
              </div>
            )}
          </div>

          {/* Titre et description */}
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {title}
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Liste des fonctionnalités à venir */}
          {features.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-6">
                Fonctionnalités prévues :
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-4 bg-white/60 rounded-xl border border-white/40 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 group"
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} mr-3 group-hover:scale-110 transition-transform`}>
                      {feature.icon ? (
                        <feature.icon className="h-4 w-4 text-white" />
                      ) : (
                        <PlusIcon className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="text-gray-700 font-medium">{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message d'encouragement */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6 max-w-lg mx-auto">
            <div className="flex items-center justify-center mb-3">
              <BellIcon className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-blue-800 font-semibold">Notification</span>
            </div>
            <p className="text-blue-700 text-sm">
              Cette fonctionnalité est en cours de développement. 
              Elle sera disponible dans une prochaine mise à jour !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour l'onglet Historique
const EmployeeHistoryTab = () => {
  const features = [
    { name: 'Historique des contrats', icon: DocumentTextIcon },
    { name: 'Missions accomplies', icon: CalendarDaysIcon },
    { name: 'Évaluations de performance', icon: ChartBarIcon },
    { name: 'Documents générés', icon: DocumentTextIcon },
    { name: 'Certificats obtenus', icon: DocumentTextIcon },
    { name: 'Notes de mission', icon: DocumentTextIcon }
  ];

  return (
    <PlaceholderTab
      title="Historique des contrats"
      description="Consultez l'historique complet des contrats, missions et évaluations de cet employé. Accédez facilement aux documents générés et suivez l'évolution professionnelle."
      icon={DocumentTextIcon}
      features={features}
      gradient="from-emerald-500 to-teal-600"
    />
  );
};

// Composant pour l'onglet Pointage
const EmployeeTimeTrackingTab = () => {
  const features = [
    { name: 'Pointage en temps réel', icon: ClockIcon },
    { name: 'Historique des heures', icon: CalendarDaysIcon },
    { name: 'Calcul automatique des heures sup.', icon: ChartBarIcon },
    { name: 'Validation des heures', icon: DocumentTextIcon },
    { name: 'Export des données', icon: ArrowTrendingUpIcon },
    { name: 'Alertes et notifications', icon: BellIcon }
  ];

  return (
    <PlaceholderTab
      title="Système de pointage"
      description="Gérez les pointages et les heures de travail de cet employé. Suivez en temps réel les présences, calculez automatiquement les heures supplémentaires et validez les feuilles de temps."
      icon={ClockIcon}
      features={features}
      gradient="from-purple-500 to-pink-600"
    />
  );
};

export default PlaceholderTab;
export { EmployeeHistoryTab, EmployeeTimeTrackingTab };