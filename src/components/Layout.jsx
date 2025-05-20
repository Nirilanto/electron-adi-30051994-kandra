import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="main-layout">
      {/* Sidebar */}
      <div className="sidebar bg-white border-r border-gray-200">
        <Sidebar />
      </div>
      
      {/* Header */}
      {/* <header className="header bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800"></h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Version</span> 1.0.0
          </div>
        </div>
      </header> */}
      
      {/* Main Content */}
      <main className="main-content bg-gray-50">
        {children}
      </main>
    </div>
  );
};

export default Layout;