import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DatabaseService from "../../services/DatabaseService";

// Icônes
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const EmployeeList = () => {
  // État pour stocker la liste des employés
  const [employees, setEmployees] = useState([]);

  // État pour gérer le chargement
  const [loading, setLoading] = useState(true);

  // État pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const navigate = useNavigate();
  // État pour la confirmation de suppression
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Charger la listM!e des employés au montage du composant
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        // Récupérer tous les employés
        const employeeData = await DatabaseService.getEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error("Erreur lors du chargement des employés:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // Fonction pour filtrer les employés en fonction de la recherche et des filtres
  const filteredEmployees = employees.filter((employee) => {
    // Filtrer par recherche (nom, prénom, email)
    const matchesSearch =
      searchTerm === "" ||
      (employee.firstname &&
        employee.firstname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.lastname &&
        employee.lastname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.email &&
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtrer par statut
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && employee.status === "active") ||
      (statusFilter === "inactive" && employee.status === "inactive");

    return matchesSearch && matchesStatus;
  });

  // Fonction pour supprimer un employé
  const handleDeleteEmployee = async (id) => {
    try {
      await DatabaseService.deleteEmployee(id);

      // Mettre à jour la liste des employés
      setEmployees(employees.filter((emp) => emp.id !== id));

      // Réinitialiser l'état de suppression
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'employé:", error);
    }
  };

  // Afficher un indicateur de chargement pendant le chargement des données
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Gestion des employés
        </h1>
        <Link to="/employees/new" className="btn btn-primary flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nouvel employé
        </Link>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Liste des employés */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nom
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Taux horaire
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Statut
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      navigate(`/employees/${employee.id}/profile`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 font-medium">
                            {employee.firstName?.[0]}
                            {employee.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.skills || "Aucune compétence spécifiée"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.email || "-"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.hourlyRate
                          ? new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(employee.hourlyRate)
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {employee.status === "active" ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/employees/${employee.id}/profile`}
                        className="text-blue-500 hover:text-blue-700 mx-2"
                        title="Voir le profil"
                      >
                        <UserIcon className="h-5 w-5 inline" />
                      </Link>
                      <Link
                        to={`/employees/${employee.id}/edit`}
                        className="text-primary-500 hover:text-primary-700 mx-2"
                        title="Modifier"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </Link>
                      <button
                        onClick={() => setEmployeeToDelete(employee)}
                        className="text-red-500 hover:text-red-700 mx-2"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Aucun employé trouvé.{" "}
            {searchTerm || statusFilter !== "all"
              ? "Essayez de modifier vos filtres."
              : ""}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer l'employé{" "}
              <span className="font-medium">
                {employeeToDelete.firstname} {employeeToDelete.lastname}
              </span>{" "}
              ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="btn btn-outline"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteEmployee(employeeToDelete.id)}
                className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
