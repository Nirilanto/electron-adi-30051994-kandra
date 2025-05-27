// src/modules/employees/EmployeeProfile.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import des composants modulaires
import EmployeeProfileHeader from "./components/EmployeeProfileHeader";
import ModernTabNavigation from "./components/ModernTabNavigation";
import EmployeeInfoTab from "./components/EmployeeInfoTab";
import EmployeeAboutTab from "./components/EmployeeAboutTab";
import { EmployeeHistoryTab } from "./components/PlaceholderTabs";
import EmployeeTimeTrackingTab from "./components/EmployeeTimeTrackingTab";

// Import du service
import EmployeeService from "./EmployeeService";

function EmployeeProfile() {
  const { id } = useParams();

  // États
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("informations");
  const [isLoading, setIsLoading] = useState(true);

  // Chargement initial des données
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setIsLoading(true);
        const employeeData = await EmployeeService.getEmployeeById(id);
        if (employeeData) {
          setEmployee(employeeData);
        } else {
          toast.error("Employé non trouvé");
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'employé :", error);
        toast.error("Erreur lors du chargement de l'employé");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadEmployee();
    }
  }, [id]);

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    if (!employee) return null;

    switch (activeTab) {
      case "informations":
        return <EmployeeInfoTab employee={employee} />;
      case "apropos":
        return <EmployeeAboutTab employee={employee} />;
      case "historique":
        return <EmployeeHistoryTab employee={employee} />;
      case "pointage":
        return <EmployeeTimeTrackingTab employee={employee} />;
      default:
        return <EmployeeInfoTab employee={employee} />;
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          {/* Spinner moderne */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin mx-auto"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="mt-6 text-lg text-gray-600 font-medium">
            Chargement du profil...
          </p>
          <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  // Employé non trouvé
  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Employé non trouvé
          </h2>
          <p className="text-gray-600">
            L'employé demandé n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Container principal */}
      <div className="mx-auto">
        {/* En-tête du profil */}
        <EmployeeProfileHeader employee={employee} />

        {/* Navigation par onglets */}
        <ModernTabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Contenu principal */}
        <div className="bg-white/60 backdrop-blur-sm">{renderTabContent()}</div>
      </div>

      {/* Notifications */}
      <ToastContainer
        position="bottom-right"
        toastClassName={() =>
          "relative flex p-1 min-h-10 rounded-lg justify-between overflow-hidden cursor-pointer bg-white shadow-lg border border-gray-200"
        }
        bodyClassName={() => "text-sm font-medium text-gray-800 block p-3"}
        closeButton={false}
        hideProgressBar={false}
        newestOnTop
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default EmployeeProfile;
