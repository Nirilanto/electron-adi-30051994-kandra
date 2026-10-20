import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Composants de layout
import Layout from "./components/Layout";
import LoginPage from "./components/LoginPage";
import { AuthProvider } from "./contexts/AuthContext";

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
import GlobalTimeTracking from "./modules/timetracking/GlobalTimeTracking";
import Settings from "./modules/settings/Settings";

import { InvoiceList, InvoiceForm, InvoiceDetail } from './modules/invoices';
import { PayrollList, PayrollForm, PayrollProfile } from './modules/payroll';

// Services
import DatabaseService from "./services/DatabaseService";
import AuthService from "./services/AuthService";

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState("");
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Vérifier le serveur et restaurer la session au démarrage
  useEffect(() => {
    const initApp = async () => {
      try {
        await DatabaseService.initializeDatabase();
        setDbInitialized(true);

        const status = await AuthService.getStatus();
        setNeedsSetup(!!status.needsSetup);

        const restored = await AuthService.restoreSession();
        if (restored) {
          setUser(restored);
        }
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation de l'application:",
          error
        );
        setInitError(error.message || "");
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Déconnexion (manuelle ou jeton expiré)
  const handleLogout = useCallback(() => {
    AuthService.logout();
    setUser(null);
  }, []);

  useEffect(() => AuthService.onUnauthorized(handleLogout), [handleLogout]);

  const handleAuthenticated = (authenticatedUser) => {
    setUser(authenticatedUser);
    setNeedsSetup(false);
  };

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

  // Afficher un message d'erreur si le serveur n'est pas joignable
  if (!dbInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Erreur d'initialisation
          </h1>
          <p className="text-gray-600 mb-4">
            L'application n'a pas pu contacter le serveur ou sa base de données.
            Vérifiez que le serveur est démarré ou contactez le support technique.
          </p>
          {initError && <p className="text-xs text-gray-400 mb-4">{initError}</p>}
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

  // Connexion requise
  if (!user) {
    return <LoginPage needsSetup={needsSetup} onAuthenticated={handleAuthenticated} />;
  }

  // Structure principale de l'application
  return (
    <AuthProvider user={user} logout={handleLogout}>
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
          <Route path="/clients/:id/profile" element={<ClientProfile />} />
          <Route path="/clients/:id/edit" element={<ClientForm />} />

          <Route path="/settings" element={<Settings />} />

          {/* Module Pointage Global */}
          <Route path="/timetracking" element={<GlobalTimeTracking />} />

          {/* Module Contrats */}
          <Route path="/contracts" element={<ContractList />} />
          <Route path="/contracts/new" element={<ContractForm />} />
          <Route path="/contracts/:id" element={<ContractForm />} />
          <Route path="/contracts/:id/profile" element={<ContractProfile />} />
          <Route path="/contracts/:id/edit" element={<ContractForm />} />

          {/* Module Bulletins de paie */}
          <Route path="/payroll" element={<PayrollList />} />
          <Route path="/payroll/new" element={<PayrollForm />} />
          <Route path="/payroll/:id" element={<PayrollProfile />} />
          <Route path="/payroll/:id/edit" element={<PayrollForm />} />

          {/* Module invoices */}
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/invoices/:id/edit" element={<InvoiceForm />} />

          {/* Redirection pour les routes non définies */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
