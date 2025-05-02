import React from 'react';
import { NavLink } from 'react-router-dom';

// Icônes de HeroIcons
import { 
  HomeIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  // Définition des liens de navigation
  const navLinks = [
    {
      to: '/',
      icon: <HomeIcon className="w-5 h-5 mr-3" />,
      label: 'Tableau de bord',
      exact: true,
    },
    {
      to: '/employees',
      icon: <UserGroupIcon className="w-5 h-5 mr-3" />,
      label: 'Employés',
    },
    {
      to: '/clients',
      icon: <BuildingOfficeIcon className="w-5 h-5 mr-3" />,
      label: 'Clients',
    },
    {
      to: '/contracts',
      icon: <DocumentTextIcon className="w-5 h-5 mr-3" />,
      label: 'Contrats',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Logo et titre */}
      <div onClick={()=>{
        console.log(" hahahhahahha !!!!!!!!!!!!!!!!");
        
      }} className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-primary-600">
          <span className="text-primary-500">C</span>ontrat
          <span className="text-primary-500">M</span>anager
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestion des contrats de mission BETA-001
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }
                end={link.exact}
              >
                {link.icon}
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer de la sidebar */}
      <div className="p-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} - Contrat Manager
        </p>
      </div>
    </div>
  );
};

export default Sidebar;