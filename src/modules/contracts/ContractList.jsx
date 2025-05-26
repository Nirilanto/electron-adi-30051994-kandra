// src/modules/contracts/ContractList.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PlusIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import ContractService from "./ContractService";
import { formatDateToFrench } from "../../utils/dateUtils";
import ViewSelector from "../employees/components/ViewSelector";

// Composant de recherche moderne
const ModernSearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="w-full pl-12 pr-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500"
        placeholder="Rechercher par titre, client, consultant, numéro..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

// Composant de filtres en collapse
const AdvancedFilters = ({
  isOpen,
  onToggle,
  filterStatus,
  setFilterStatus,
  dateFilters,
  setDateFilters,
  onReset,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>

      <div className="relative">
        {/* En-tête du collapse */}
        <button
          onClick={onToggle}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/40 transition-colors"
        >
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-blue-600 mr-3" />
            <span className="font-semibold text-gray-800">Filtres avancés</span>
            <span className="ml-2 text-sm text-gray-500">
              (
              {Object.values(dateFilters).filter(Boolean).length +
                (filterStatus !== "all" ? 1 : 0)}{" "}
              actif
              {Object.values(dateFilters).filter(Boolean).length +
                (filterStatus !== "all" ? 1 : 0) >
              1
                ? "s"
                : ""}
              )
            </span>
          </div>
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Contenu du collapse */}
        {isOpen && (
          <div className="px-6 pb-6 border-t border-gray-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Filtre de statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Contrats actifs</option>
                  <option value="expired">Contrats expirés</option>
                  <option value="ending_soon">Bientôt expirés</option>
                </select>
              </div>

              {/* Date de création */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de création (début)
                </label>
                <DatePicker
                  selected={dateFilters.createdFrom}
                  onChange={(date) =>
                    setDateFilters((prev) => ({ ...prev, createdFrom: date }))
                  }
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Sélectionner..."
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de création (fin)
                </label>
                <DatePicker
                  selected={dateFilters.createdTo}
                  onChange={(date) =>
                    setDateFilters((prev) => ({ ...prev, createdTo: date }))
                  }
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Sélectionner..."
                  isClearable
                  minDate={dateFilters.createdFrom}
                />
              </div>

              {/* Date de début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début (début)
                </label>
                <DatePicker
                  selected={dateFilters.startFrom}
                  onChange={(date) =>
                    setDateFilters((prev) => ({ ...prev, startFrom: date }))
                  }
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Sélectionner..."
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début (fin)
                </label>
                <DatePicker
                  selected={dateFilters.startTo}
                  onChange={(date) =>
                    setDateFilters((prev) => ({ ...prev, startTo: date }))
                  }
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Sélectionner..."
                  isClearable
                  minDate={dateFilters.startFrom}
                />
              </div>

              {/* Date de fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin (début)
                </label>
                <DatePicker
                  selected={dateFilters.endFrom}
                  onChange={(date) =>
                    setDateFilters((prev) => ({ ...prev, endFrom: date }))
                  }
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Sélectionner..."
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin (fin)
                </label>
                <DatePicker
                  selected={dateFilters.endTo}
                  onChange={(date) =>
                    setDateFilters((prev) => ({ ...prev, endTo: date }))
                  }
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Sélectionner..."
                  isClearable
                  minDate={dateFilters.endFrom}
                />
              </div>

              {/* Bouton de réinitialisation */}
              <div className="flex items-end">
                <button
                  onClick={onReset}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant carte de contrat
const ContractCard = ({ contract, onView, onEdit, onDuplicate, onDelete }) => {
  const getStatusConfig = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (end < today) {
      return {
        label: "Expiré",
        className: "bg-red-100 text-red-800",
        icon: ExclamationTriangleIcon,
        dot: "bg-red-400",
      };
    } else if (daysLeft <= 7) {
      return {
        label: "Bientôt expiré",
        className: "bg-orange-100 text-orange-800",
        icon: ClockIcon,
        dot: "bg-orange-400",
      };
    } else {
      return {
        label: "Actif",
        className: "bg-green-100 text-green-800",
        icon: CheckBadgeIcon,
        dot: "bg-green-400",
      };
    }
  };

  const status = getStatusConfig(contract.endDate);
  const StatusIcon = status.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${status.dot.replace(
          "bg-",
          "bg-gradient-to-r from-"
        )} to-${status.dot.replace("bg-", "")}`}
      ></div>

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                {contract.title || "Sans titre"}
              </h3>
              <div className="flex items-center mt-1">
                <span className="text-sm font-medium text-gray-600">
                  N° {contract.contractNumber}
                </span>
              </div>
            </div>
          </div>

          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {contract.client?.companyName && (
            <div className="flex items-center text-sm text-gray-600">
              <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{contract.client.companyName}</span>
            </div>
          )}

          {contract.employee && (
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>
                {`${contract.employee.firstName || ""} ${
                  contract.employee.lastName || ""
                }`.trim() || "Non spécifié"}
              </span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {contract.startDate
                ? formatDateToFrench(new Date(contract.startDate))
                : "Non spécifiée"}{" "}
              -{" "}
              {contract.endDate
                ? formatDateToFrench(new Date(contract.endDate))
                : "Non spécifiée"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200/50">
          <button
            onClick={() => onView(contract.id)}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Voir les détails"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Voir
          </button>

          <button
            onClick={() => onDuplicate(contract.id)}
            className="flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            title="Dupliquer"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Dupliquer
          </button>

          <button
            onClick={() => onDelete(contract.id)}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant vue tableau
const ContractTableView = ({
  contracts,
  onSort,
  sortField,
  sortDirection,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const getStatusConfig = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (end < today) {
      return { label: "Expiré", className: "bg-red-100 text-red-800" };
    } else if (daysLeft <= 7) {
      return {
        label: "Bientôt expiré",
        className: "bg-orange-100 text-orange-800",
      };
    } else {
      return { label: "Actif", className: "bg-green-100 text-green-800" };
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/20"></div>

      <div className="relative overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
            <tr>
              {[
                { key: "contractNumber", label: "N°" },
                { key: "title", label: "Titre" },
                { key: "client", label: "Client" },
                { key: "employee", label: "Consultant" },
                { key: "startDate", label: "Début" },
                { key: "endDate", label: "Fin" },
                { key: null, label: "Statut" },
                { key: null, label: "Actions" },
              ].map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    column.key ? "cursor-pointer hover:bg-gray-200/50" : ""
                  }`}
                  onClick={column.key ? () => onSort(column.key) : undefined}
                >
                  <div className="flex items-center">
                    <span>{column.label}</span>
                    {column.key && sortField === column.key && (
                      <ArrowsUpDownIcon
                        className={`h-4 w-4 ml-1 transition-transform ${
                          sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200/30">
            {contracts.map((contract) => {
              const status = getStatusConfig(contract.endDate);

              return (
                <tr
                  key={contract.id}
                  className="group hover:bg-white/60 transition-all duration-200 cursor-pointer"
                  onClick={() => onView(contract.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.contractNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {contract.title || "Sans titre"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.client?.companyName || "Non spécifié"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.employee
                      ? `${contract.employee.firstName || ""} ${
                          contract.employee.lastName || ""
                        }`.trim()
                      : "Non spécifié"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.startDate
                      ? formatDateToFrench(new Date(contract.startDate))
                      : "Non spécifiée"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.endDate
                      ? formatDateToFrench(new Date(contract.endDate))
                      : "Non spécifiée"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div
                      className="flex items-center justify-end space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onView(contract.id)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDuplicate(contract.id)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                        title="Dupliquer"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDelete(contract.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// État vide
const EmptyState = ({ hasFilters, onReset, onCreateNew }) => {
  return (
    <div className="text-center py-16">
      <div className="relative mx-auto w-24 h-24 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl"></div>
        <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
          <DocumentTextIcon className="h-12 w-12 text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {hasFilters ? "Aucun contrat trouvé" : "Aucun contrat enregistré"}
      </h3>

      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Essayez de modifier vos critères de recherche ou vos filtres."
          : "Commencez par créer votre premier contrat pour gérer vos missions."}
      </p>

      <div className="flex justify-center space-x-4">
        {hasFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </button>
        )}

        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {hasFilters ? "Nouveau contrat" : "Créer le premier contrat"}
        </button>
      </div>
    </div>
  );
};

function ContractList() {
  const navigate = useNavigate();

  // États principaux
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("table");

  // États de recherche et filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [dateFilters, setDateFilters] = useState({
    createdFrom: null,
    createdTo: null,
    startFrom: null,
    startTo: null,
    endFrom: null,
    endTo: null,
  });

  // États de tri
  const [sortField, setSortField] = useState("contractNumber");
  const [sortDirection, setSortDirection] = useState("desc");

  // Chargement initial
  useEffect(() => {
    const loadContracts = async () => {
      try {
        setIsLoading(true);
        const contractsData = await ContractService.getAllContracts();
        setContracts(contractsData);
      } catch (error) {
        console.error("Erreur lors du chargement des contrats:", error);
        toast.error("Erreur lors du chargement des contrats");
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, []);

  // Filtrage et tri
  useEffect(() => {
    let result = [...contracts];

    // Filtre de recherche
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
          (contract.client?.companyName &&
            contract.client.companyName.toLowerCase().includes(searchLower)) ||
          (contract.employee?.firstName &&
            contract.employee.firstName.toLowerCase().includes(searchLower)) ||
          (contract.employee?.lastName &&
            contract.employee.lastName.toLowerCase().includes(searchLower))
      );
    }

    // Filtre de statut
    if (filterStatus !== "all") {
      const today = new Date();
      result = result.filter((contract) => {
        const endDate = new Date(contract.endDate);
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        switch (filterStatus) {
          case "active":
            return endDate >= today;
          case "expired":
            return endDate < today;
          case "ending_soon":
            return endDate >= today && daysLeft <= 7;
          default:
            return true;
        }
      });
    }

    // Filtres de dates
    Object.entries(dateFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((contract) => {
          let contractDate;

          if (key.includes("created")) {
            contractDate = new Date(contract.createdAt);
          } else if (key.includes("start")) {
            contractDate = new Date(contract.startDate);
          } else if (key.includes("end")) {
            contractDate = new Date(contract.endDate);
          }

          if (key.includes("From")) {
            return contractDate >= value;
          } else if (key.includes("To")) {
            return contractDate <= value;
          }

          return true;
        });
      }
    });

    // Tri
    result.sort((a, b) => {
      let valueA, valueB;

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
        case "endDate":
          valueA = new Date(a[sortField] || 0);
          valueB = new Date(b[sortField] || 0);
          break;
        default:
          valueA = a[sortField] || "";
          valueB = b[sortField] || "";
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }
    });

    setFilteredContracts(result);
  }, [
    contracts,
    searchTerm,
    filterStatus,
    dateFilters,
    sortField,
    sortDirection,
  ]);

  // Gestionnaires d'événements
  const handleView = (id) => {
    navigate(`/contracts/${id}/profile`);
  };

  const handleEdit = (id) => {
    navigate(`/contracts/${id}/edit`);
  };

  const handleDuplicate = async (id) => {
    try {
      const contractToDuplicate = await ContractService.getContractById(id);
      if (!contractToDuplicate) {
        toast.error("Contrat introuvable");
        return;
      }

      const duplicatedContract = {
        ...contractToDuplicate,
        id: null,
        contractNumber: null,
        title: `${contractToDuplicate.title || "Sans titre"} (copie)`,
        createdAt: null,
        updatedAt: null,
      };

      const savedContract = await ContractService.saveContract(
        duplicatedContract
      );
      setContracts((prev) => [...prev, savedContract]);
      toast.success("Contrat dupliqué avec succès");
    } catch (error) {
      console.error("Erreur lors de la duplication:", error);
      toast.error("Erreur lors de la duplication du contrat");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) {
      try {
        await ContractService.deleteContract(id);
        setContracts((prev) => prev.filter((contract) => contract.id !== id));
        toast.success("Contrat supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Erreur lors de la suppression du contrat");
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setDateFilters({
      createdFrom: null,
      createdTo: null,
      startFrom: null,
      startTo: null,
      endFrom: null,
      endTo: null,
    });
    setSortField("contractNumber");
    setSortDirection("desc");
  };

  const hasActiveFilters = () => {
    return (
      searchTerm ||
      filterStatus !== "all" ||
      Object.values(dateFilters).some(Boolean)
    );
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
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
            Chargement des contrats...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Gestion des contrats
              </h1>
              <p className="text-gray-600 mt-1">
                {contracts.length} contrat{contracts.length !== 1 ? "s" : ""}{" "}
                enregistré{contracts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/contracts/new")}
            className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Nouveau contrat
            <SparklesIcon className="h-4 w-4 ml-2 opacity-70" />
          </button>
        </div>

        {/* Barre de recherche, sélecteur de vue et filtres - Une seule ligne */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>

            <div className="relative p-2">
              {/* Ligne principale : Recherche + Vue + Filtres */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Barre de recherche */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500"
                      placeholder="Rechercher par titre, client, consultant, numéro..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Bouton filtres avancés */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                      isFiltersOpen
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white/60 text-gray-700 hover:bg-white border border-gray-200/50"
                    }`}
                  >
                    <FunnelIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">Filtres</span>
                    {hasActiveFilters() && (
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          isFiltersOpen
                            ? "bg-blue-400 text-white"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {Object.values(dateFilters).filter(Boolean).length +
                          (filterStatus !== "all" ? 1 : 0)}
                      </span>
                    )}
                    {isFiltersOpen ? (
                      <ChevronUpIcon className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 ml-2" />
                    )}
                  </button>
                </div>

                {/* Sélecteur de vue */}
                <div className="flex-shrink-0">
                  <ViewSelector
                    currentView={currentView}
                    onViewChange={setCurrentView}
                  />
                </div>
              </div>

              {/* Panel de filtres en collapse */}
              {isFiltersOpen && (
                <div className="mt-6 pt-6 border-t border-gray-200/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20 mt-20">
                    {/* Filtre de statut */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Contrats actifs</option>
                        <option value="expired">Contrats expirés</option>
                        <option value="ending_soon">Bientôt expirés</option>
                      </select>
                    </div>

                    {/* Date de création */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de création (début)
                      </label>
                      <div className="relative z-50">
                        <DatePicker
                          selected={dateFilters.createdFrom}
                          onChange={(date) =>
                            setDateFilters((prev) => ({
                              ...prev,
                              createdFrom: date,
                            }))
                          }
                          dateFormat="dd/MM/yyyy"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholderText="Sélectionner..."
                          isClearable
                          popperProps={{
                            strategy: "fixed",
                            modifiers: [
                              {
                                name: "offset",
                                options: {
                                  offset: [0, 10],
                                },
                              },
                              {
                                name: "preventOverflow",
                                options: {
                                  rootBoundary: "viewport",
                                  tether: false,
                                  altAxis: true,
                                },
                              },
                            ],
                          }}
                          popperContainer={({ children }) => (
                            <div style={{ zIndex: 9999 }}>{children}</div>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de création (fin)
                      </label>
                      <div className="relative z-40">
                        <DatePicker
                          selected={dateFilters.createdTo}
                          onChange={(date) =>
                            setDateFilters((prev) => ({
                              ...prev,
                              createdTo: date,
                            }))
                          }
                          dateFormat="dd/MM/yyyy"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholderText="Sélectionner..."
                          isClearable
                          minDate={dateFilters.createdFrom}
                          popperProps={{
                            strategy: "fixed",
                            modifiers: [
                              {
                                name: "offset",
                                options: {
                                  offset: [0, 10],
                                },
                              },
                              {
                                name: "preventOverflow",
                                options: {
                                  rootBoundary: "viewport",
                                  tether: false,
                                  altAxis: true,
                                },
                              },
                            ],
                          }}
                          popperContainer={({ children }) => (
                            <div style={{ zIndex: 9999 }}>{children}</div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Date de début */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début (début)
                      </label>
                      <div className="relative z-30">
                        <DatePicker
                          selected={dateFilters.startFrom}
                          onChange={(date) =>
                            setDateFilters((prev) => ({
                              ...prev,
                              startFrom: date,
                            }))
                          }
                          dateFormat="dd/MM/yyyy"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholderText="Sélectionner..."
                          isClearable
                          popperProps={{
                            strategy: "fixed",
                            modifiers: [
                              {
                                name: "offset",
                                options: {
                                  offset: [0, 10],
                                },
                              },
                              {
                                name: "preventOverflow",
                                options: {
                                  rootBoundary: "viewport",
                                  tether: false,
                                  altAxis: true,
                                },
                              },
                            ],
                          }}
                          popperContainer={({ children }) => (
                            <div style={{ zIndex: 9999 }}>{children}</div>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début (fin)
                      </label>
                      <div className="relative z-20">
                        <DatePicker
                          selected={dateFilters.startTo}
                          onChange={(date) =>
                            setDateFilters((prev) => ({
                              ...prev,
                              startTo: date,
                            }))
                          }
                          dateFormat="dd/MM/yyyy"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholderText="Sélectionner..."
                          isClearable
                          minDate={dateFilters.startFrom}
                          popperProps={{
                            strategy: "fixed",
                            modifiers: [
                              {
                                name: "offset",
                                options: {
                                  offset: [0, 10],
                                },
                              },
                              {
                                name: "preventOverflow",
                                options: {
                                  rootBoundary: "viewport",
                                  tether: false,
                                  altAxis: true,
                                },
                              },
                            ],
                          }}
                          popperContainer={({ children }) => (
                            <div style={{ zIndex: 9999 }}>{children}</div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Date de fin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin (début)
                      </label>
                      <div className="relative z-10">
                        <DatePicker
                          selected={dateFilters.endFrom}
                          onChange={(date) =>
                            setDateFilters((prev) => ({
                              ...prev,
                              endFrom: date,
                            }))
                          }
                          dateFormat="dd/MM/yyyy"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholderText="Sélectionner..."
                          isClearable
                          popperProps={{
                            strategy: "fixed",
                            modifiers: [
                              {
                                name: "offset",
                                options: {
                                  offset: [0, 10],
                                },
                              },
                              {
                                name: "preventOverflow",
                                options: {
                                  rootBoundary: "viewport",
                                  tether: false,
                                  altAxis: true,
                                },
                              },
                            ],
                          }}
                          popperContainer={({ children }) => (
                            <div style={{ zIndex: 9999 }}>{children}</div>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin (fin)
                      </label>
                      <div className="relative z-10">
                        <DatePicker
                          selected={dateFilters.endTo}
                          onChange={(date) =>
                            setDateFilters((prev) => ({ ...prev, endTo: date }))
                          }
                          dateFormat="dd/MM/yyyy"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholderText="Sélectionner..."
                          isClearable
                          minDate={dateFilters.endFrom}
                          popperProps={{
                            strategy: "fixed",
                            modifiers: [
                              {
                                name: "offset",
                                options: {
                                  offset: [0, 10],
                                },
                              },
                              {
                                name: "preventOverflow",
                                options: {
                                  rootBoundary: "viewport",
                                  tether: false,
                                  altAxis: true,
                                },
                              },
                            ],
                          }}
                          popperContainer={({ children }) => (
                            <div style={{ zIndex: 9999 }}>{children}</div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Bouton de réinitialisation */}
                    <div className="flex items-end">
                      <button
                        onClick={handleResetFilters}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Indicateur de résultats */}
        {hasActiveFilters() && (
          <div className="mb-6 flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {filteredContracts.length} résultat
              {filteredContracts.length !== 1 ? "s" : ""} trouvé
              {filteredContracts.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Liste des contrats */}
        <div className="mt-8">
          {filteredContracts.length > 0 ? (
            <>
              {currentView === "table" && (
                <ContractTableView
                  contracts={filteredContracts}
                  onSort={handleSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              )}
              {(currentView === "list" || currentView === "cards") && (
                <div
                  className={`grid gap-6 ${
                    currentView === "cards"
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1"
                  }`}
                >
                  {filteredContracts.map((contract) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              hasFilters={hasActiveFilters()}
              onReset={handleResetFilters}
              onCreateNew={() => navigate("/contracts/new")}
            />
          )}
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
    </div>
  );
}

export default ContractList;
