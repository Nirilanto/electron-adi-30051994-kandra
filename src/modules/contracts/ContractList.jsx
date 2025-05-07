// src/modules/contracts/ContractList.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ContractService from "./ContractService";
import { formatDateToFrench } from "../../utils/dateUtils";

function ContractList() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'expired'
  const [sortField, setSortField] = useState("contractNumber");
  const [sortDirection, setSortDirection] = useState("desc");

  // Chargement initial des contrats
  useEffect(() => {
    const loadContracts = async () => {
      try {
        setIsLoading(true);
        const contractsData = await ContractService.getAllContracts();
        setContracts(contractsData);
        setFilteredContracts(contractsData);
      } catch (error) {
        console.error("Erreur lors du chargement des contrats:", error);
        toast.error("Erreur lors du chargement des contrats");
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, []);

  // Filtrer et trier les contrats chaque fois que les critères changent
  useEffect(() => {
    let result = [...contracts];

    // Appliquer le filtre de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (contract) =>
          (contract.title &&
            contract.title.toLowerCase().includes(searchLower)) ||
          (contract.description &&
            contract.description.toLowerCase().includes(searchLower)) ||
          (contract.contractNumber &&
            contract.contractNumber.toString().includes(searchLower)) ||
          (contract.client &&
            contract.client.companyName &&
            contract.client.companyName.toLowerCase().includes(searchLower)) ||
          (contract.employee &&
            ((contract.employee.firstName &&
              contract.employee.firstName
                .toLowerCase()
                .includes(searchLower)) ||
              (contract.employee.lastName &&
                contract.employee.lastName
                  .toLowerCase()
                  .includes(searchLower))))
      );
    }

    // Appliquer le filtre de statut
    if (filterStatus !== "all") {
      const today = new Date();
      if (filterStatus === "active") {
        result = result.filter((contract) => {
          const endDate = new Date(contract.endDate);
          return endDate >= today;
        });
      } else if (filterStatus === "expired") {
        result = result.filter((contract) => {
          const endDate = new Date(contract.endDate);
          return endDate < today;
        });
      }
    }

    // Appliquer le tri
    result.sort((a, b) => {
      let valueA, valueB;

      // Déterminer les valeurs à comparer
      switch (sortField) {
        case "contractNumber":
          valueA = a.contractNumber || 0;
          valueB = b.contractNumber || 0;
          break;
        case "title":
          valueA = a.title || "";
          valueB = b.title || "";
          break;
        case "client":
          valueA = a.client?.companyName || "";
          valueB = b.client?.companyName || "";
          break;
        case "employee":
          valueA = `${a.employee?.firstName || ""} ${
            a.employee?.lastName || ""
          }`.trim();
          valueB = `${b.employee?.firstName || ""} ${
            b.employee?.lastName || ""
          }`.trim();
          break;
        case "startDate":
          valueA = new Date(a.startDate || 0);
          valueB = new Date(b.startDate || 0);
          break;
        case "endDate":
          valueA = new Date(a.endDate || 0);
          valueB = new Date(b.endDate || 0);
          break;
        default:
          valueA = a[sortField] || "";
          valueB = b[sortField] || "";
      }

      // Comparer les valeurs
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }
    });

    setFilteredContracts(result);
  }, [contracts, searchTerm, filterStatus, sortField, sortDirection]);

  // Gestionnaire de suppression
  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) {
      try {
        await ContractService.deleteContract(id);
        setContracts((prevContracts) =>
          prevContracts.filter((contract) => contract.id !== id)
        );
        toast.success("Contrat supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression du contrat:", error);
        toast.error("Erreur lors de la suppression du contrat");
      }
    }
  };

  // Gestionnaire de tri
  const handleSort = (field) => {
    if (sortField === field) {
      // Inverser la direction si on clique sur le même champ
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouveau champ de tri
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Déterminer le statut du contrat
  const getContractStatus = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);

    if (end < today) {
      return { label: "Expiré", className: "bg-red-100 text-red-800" };
    } else {
      // Calculer le nombre de jours restants
      const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 7) {
        return {
          label: "Bientôt expiré",
          className: "bg-orange-100 text-orange-800",
        };
      } else {
        return { label: "Actif", className: "bg-green-100 text-green-800" };
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des contrats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contrats</h1>
        <button
          onClick={() => navigate("/contracts/new")}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Nouveau contrat
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="search" className="sr-only">
            Rechercher
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              placeholder="Rechercher un contrat..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="status-filter" className="sr-only">
            Filtrer par statut
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="status-filter"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Contrats actifs</option>
              <option value="expired">Contrats expirés</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setSortField("contractNumber");
              setSortDirection("desc");
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Tableau des contrats */}
      {filteredContracts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th
                  className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("contractNumber")}
                >
                  <div className="flex items-center">
                    <span>N°</span>
                    {sortField === "contractNumber" && (
                      <ArrowsUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center">
                    <span>Titre</span>
                    {sortField === "title" && (
                      <ArrowsUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("client")}
                >
                  <div className="flex items-center">
                    <span>Client</span>
                    {sortField === "client" && (
                      <ArrowsUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("employee")}
                >
                  <div className="flex items-center">
                    <span>Consultant</span>
                    {sortField === "employee" && (
                      <ArrowsUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("startDate")}
                >
                  <div className="flex items-center">
                    <span>Début</span>
                    {sortField === "startDate" && (
                      <ArrowsUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("endDate")}
                >
                  <div className="flex items-center">
                    <span>Fin</span>
                    {sortField === "endDate" && (
                      <ArrowsUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-left">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => {
                const status = getContractStatus(contract.endDate);

                return (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <td className="py-3 px-4 border-b">
                      {contract.contractNumber}
                    </td>
                    <td className="py-3 px-4 border-b">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span>{contract.title || "Sans titre"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b">
                      {contract.client?.companyName || "Non spécifié"}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {contract.employee
                        ? `${contract.employee.firstName || ""} ${
                            contract.employee.lastName || ""
                          }`.trim()
                        : "Non spécifié"}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {contract.startDate
                        ? formatDateToFrench(new Date(contract.startDate))
                        : "Non spécifiée"}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {contract.endDate
                        ? formatDateToFrench(new Date(contract.endDate))
                        : "Non spécifiée"}
                    </td>
                    <td className="py-3 px-4 border-b">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <div
                        className="flex justify-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/contracts/${contract.id}`}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Voir les détails"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        {/* <Link
                          to={`/contracts/${contract.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-800 p-1"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Link> */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(contract.id, e)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucun contrat trouvé
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== "all"
              ? "Essayez de modifier vos critères de recherche ou de filtrage."
              : "Commencez par créer un nouveau contrat."}
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => navigate("/contracts/new")}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nouveau contrat
            </button>
          </div>
        </div>
      )}

      {/* Pagination (option future) */}
      {/* <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Affichage de <span className="font-medium">1</span> à <span className="font-medium">{filteredContracts.length}</span> sur <span className="font-medium">{contracts.length}</span> résultats
        </p>
        <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
          <button
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <span className="sr-only">Précédent</span>
            &laquo;
          </button>
          <button
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            1
          </button>
          <button
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <span className="sr-only">Suivant</span>
            &raquo;
          </button>
        </nav>
      </div> */}

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default ContractList;
