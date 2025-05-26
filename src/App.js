import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Composants de layout
import Layout from "./components/Layout";

// Modules
import Dashboard from "./modules/dashboard/Dashboard";
import EmployeeList from "./modules/employees/EmployeeList";
import EmployeeForm from "./modules/employees/EmployeeForm";
import EmployeeProfile from "./modules/employees/EmployeeProfile";
import ClientList from "./modules/clients/ClientList";
import ClientProfile from "./modules/clients/ClientProfile";
import ClientForm from "./modules/clients/ClientForm";
import ContractList from "./modules/contracts/ContractList";
import ContractProfile from "./modules/contracts/ContractProfile";

import ContractForm from "./modules/contracts/ContractForm";
import Settings from "./modules/settings/Settings";

// Services
import DatabaseService from "./services/DatabaseService";

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialiser la base de données au démarrage
  useEffect(() => {
    const initDb = async () => {
      try {
        await DatabaseService.initializeDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation de la base de données:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    initDb();
  }, []);

  // Afficher un écran de chargement pendant l'initialisation
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  // Afficher un message d'erreur si la base de données n'a pas pu être initialisée
  if (!dbInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Erreur d'initialisation
          </h1>
          <p className="text-gray-600 mb-4">
            L'application n'a pas pu initialiser la base de données. Veuillez
            vérifier que l'application dispose des droits nécessaires ou
            contactez le support technique.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Structure principale de l'application
  return (
    <Layout>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Module Employés */}
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/employees/new" element={<EmployeeForm />} />
        <Route path="/employees/:id/profile" element={<EmployeeProfile />} />
        <Route path="/employees/:id/edit" element={<EmployeeForm />} />

        {/* Module Clients */}
        <Route path="/clients" element={<ClientList />} />
        <Route path="/clients/new" element={<ClientForm />} />
        {/* <Route path="/clients/:id" element={<ClientForm />} /> */}
        <Route path="/clients/:id/profile" element={<ClientProfile />} />
        <Route path="/clients/:id/edit" element={<ClientForm />} />

        <Route path="/settings" element={<Settings />} />

        {/* Module Contrats */}
        <Route path="/contracts" element={<ContractList />} />
        <Route path="/contracts/new" element={<ContractForm />} />
        <Route path="/contracts/:id" element={<ContractForm />} />
        <Route path="/contracts/:id/profile" element={<ContractProfile />} />
        <Route path="/contracts/:id/edit" element={<ContractForm />} />

        {/* Redirection pour les routes non définies */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
