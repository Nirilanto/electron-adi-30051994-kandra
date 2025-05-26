// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  ClockIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  const [timeTrackingAlert, setTimeTrackingAlert] = useState(0);
  
  // Vérifier les alertes de pointage
  useEffect(() => {
    const checkTimeTrackingAlerts = async () => {
      try {
        const TimeTrackingService = (await import('../modules/timetracking/TimeTrackingService')).default;
        const today = new Date().toISOString().split('T')[0];
        const entries = await TimeTrackingService.getTimeEntries({
          startDate: today,
          endDate: today,
          status: 'draft'
        });
        setTimeTrackingAlert(entries.length);
      } catch (error) {
        console.error('Erreur lors de la vérification des alertes de pointage:', error);
      }
    };
    
    checkTimeTrackingAlerts();
    const interval = setInterval(checkTimeTrackingAlerts, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Fonction pour déterminer si un lien est actif
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  // Configuration des menus
  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: HomeIcon,
      current: isActive('/')
    },
    {
      name: 'Employés',
      href: '/employees',
      icon: UserGroupIcon,
      current: isActive('/employees')
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: BuildingOfficeIcon,
      current: isActive('/clients')
    },
    {
      name: 'Contrats',
      href: '/contracts',
      icon: DocumentTextIcon,
      current: isActive('/contracts')
    },
    {
      name: 'Pointage',
      href: '/timetracking',
      icon: ClockIcon,
      current: isActive('/timetracking'),
      badge: timeTrackingAlert > 0 ? timeTrackingAlert : null
    },
    {
      name: 'Paramètres',
      href: '/settings',
      icon: Cog6ToothIcon,
      current: isActive('/settings')
    }
  ];
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-900 to-blue-800">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-blue-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-white">ADI Manager</h1>
            <p className="text-xs text-blue-100">Gestion des contrats</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out ${
                item.current
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <Icon
                className={`flex-shrink-0 h-5 w-5 mr-3 transition-colors ${
                  item.current
                    ? 'text-blue-600'
                    : 'text-blue-200 group-hover:text-white'
                }`}
              />
              <span className="flex-1">{item.name}</span>
              
              {/* Badge pour les notifications */}
              {item.badge && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse shadow-sm">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Alerte rapide pour pointage */}
      {timeTrackingAlert > 0 && !isActive('/timetracking') && (
        <div className="flex-shrink-0 p-3 border-t border-blue-700">
          <Link 
            to="/timetracking"
            className="block bg-yellow-400 text-blue-900 rounded-lg p-3 hover:bg-yellow-300 transition-all duration-200 shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-blue-900" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {timeTrackingAlert} pointage{timeTrackingAlert > 1 ? 's' : ''} à valider
                </p>
                <p className="text-xs text-blue-800">
                  Cliquez pour gérer →
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}
      
      {/* Badge validation en cours */}
      {timeTrackingAlert > 0 && isActive('/timetracking') && (
        <div className="flex-shrink-0 p-3 border-t border-blue-700">
          <div className="bg-green-400 text-blue-900 text-xs font-medium px-3 py-2 rounded-lg text-center shadow-md">
            ✨ {timeTrackingAlert} validation{timeTrackingAlert > 1 ? 's' : ''} en attente
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;