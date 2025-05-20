// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  Cog6ToothIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import NotificationService from '../services/NotificationService';

const Sidebar = () => {
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Vérifier s'il y a des notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const notifications = await NotificationService.getPendingNotifications();
        setNotificationCount(notifications.length);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
      }
    };
    
    // Vérifier au chargement
    checkNotifications();
    
    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Fonction pour déterminer si un lien est actif
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  // Style pour les liens
  const linkClass = (path) => {
    return `flex items-center px-4 py-3 ${
      isActive(path)
        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
        : 'text-gray-700 hover:bg-gray-100'
    } transition-colors duration-200`;
  };
  
  return (
    <div className="min-h-screen w-64 bg-white border-r border-gray-200 shadow-sm">
      {/* Logo et titre */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
        <div className="flex items-center">
          {/* <img 
            src="/logo.png" 
            alt="Contrat Manager" 
            className="h-8 w-8 mr-2" 
          /> */}
          <h1 className="text-xl font-semibold text-gray-800">ADI Manager</h1>
        </div>
        {/* Icône de notification */}
        {/* <div className="relative">
          <Link to="/notifications" className="p-1 rounded-full hover:bg-gray-100">
            <BellIcon className="h-6 w-6 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>
        </div> */}
      </div>
      
      {/* Navigation */}
      <nav className="mt-4">
        <ul>
          <li>
            <Link to="/" className={linkClass('/')}>
              <HomeIcon className="h-5 w-5 mr-3" />
              Tableau de bord
            </Link>
          </li>
          <li>
            <Link to="/employees" className={linkClass('/employees')}>
              <UserGroupIcon className="h-5 w-5 mr-3" />
              Employés
            </Link>
          </li>
          <li>
            <Link to="/clients" className={linkClass('/clients')}>
              <BuildingOfficeIcon className="h-5 w-5 mr-3" />
              Clients
            </Link>
          </li>
          <li>
            <Link to="/contracts" className={linkClass('/contracts')}>
              <DocumentTextIcon className="h-5 w-5 mr-3" />
              Contrats
            </Link>
          </li>
          <li>
            <Link to="/settings" className={linkClass('/settings')}>
              <Cog6ToothIcon className="h-5 w-5 mr-3" />
              Paramètres
            </Link>
          </li>
        </ul>
      </nav>
      
      {/* Version */}
      {/* <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-gray-500">
        Version 1.0.0
      </div> */}
    </div>
  );
};

export default Sidebar;