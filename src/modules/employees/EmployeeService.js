import DatabaseService from '../../services/DatabaseService';

class EmployeeService {
  // Obtenir tous les employés
  async getAllEmployees(filters = {}) {
    try {
      return await DatabaseService.getEmployees(filters);
    } catch (error) {
      console.error('Erreur dans EmployeeService.getAllEmployees:', error);
      throw error;
    }
  }

  // Obtenir un employé par son ID
  async getEmployeeById(id) {
    try {
      return await DatabaseService.getEmployeeById(id);
    } catch (error) {
      console.error(`Erreur dans EmployeeService.getEmployeeById(${id}):`, error);
      throw error;
    }
  }

  // Créer un nouvel employé
  async createEmployee(employeeData) {
    try {
      return await DatabaseService.createEmployee(employeeData);
    } catch (error) {
      console.error('Erreur dans EmployeeService.createEmployee:', error);
      throw error;
    }
  }

  // Mettre à jour un employé
  async updateEmployee(id, employeeData) {
    try {
      return await DatabaseService.updateEmployee(id, employeeData);
    } catch (error) {
      console.error(`Erreur dans EmployeeService.updateEmployee(${id}):`, error);
      throw error;
    }
  }

  // Supprimer un employé
  async deleteEmployee(id) {
    try {
      return await DatabaseService.deleteEmployee(id);
    } catch (error) {
      console.error(`Erreur dans EmployeeService.deleteEmployee(${id}):`, error);
      throw error;
    }
  }

  // Rechercher des employés
  async searchEmployees(searchTerm, status = 'all') {
    try {
      const employees = await DatabaseService.getEmployees();
      
      // Filtrer les employés en fonction du terme de recherche et du statut
      return employees.filter(employee => {
        // Vérifier si le nom ou le prénom correspond au terme de recherche
        const matchesTerm = 
          searchTerm === '' ||
          (employee.firstname && employee.firstname.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (employee.lastname && employee.lastname.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Vérifier si le statut correspond
        const matchesStatus = 
          status === 'all' || 
          employee.status === status;
        
        return matchesTerm && matchesStatus;
      });
    } catch (error) {
      console.error('Erreur dans EmployeeService.searchEmployees:', error);
      throw error;
    }
  }

  // Obtenir les employés disponibles pour une période donnée
  async getAvailableEmployees(startDate, endDate) {
    try {
      // Dans une application réelle, nous ferions une requête spécifique
      // pour obtenir les employés qui ne sont pas déjà affectés à un contrat
      // pendant la période spécifiée
      
      // Pour l'instant, retournons simplement tous les employés actifs
      return await DatabaseService.getEmployees({ status: 'active' });
    } catch (error) {
      console.error('Erreur dans EmployeeService.getAvailableEmployees:', error);
      throw error;
    }
  }

  // Valider les données d'un employé
  validateEmployeeData(data) {
    const errors = {};
    
    // Vérifier les champs obligatoires
    if (!data.firstname || data.firstname.trim() === '') {
      errors.firstname = 'Le prénom est obligatoire';
    }
    
    if (!data.lastname || data.lastname.trim() === '') {
      errors.lastname = 'Le nom de famille est obligatoire';
    }
    
    // Valider l'email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Adresse email non valide';
    }
    
    // Valider le taux horaire
    if (data.hourly_rate !== undefined && data.hourly_rate !== null && data.hourly_rate !== '') {
      const rate = parseFloat(data.hourly_rate);
      if (isNaN(rate) || rate < 0) {
        errors.hourly_rate = 'Le taux horaire doit être un nombre positif';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Formatter les données d'un employé pour l'affichage
  formatEmployeeForDisplay(employee) {
    if (!employee) return null;
    
    return {
      ...employee,
      fullName: `${employee.firstname} ${employee.lastname}`,
      formattedHourlyRate: employee.hourly_rate 
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(employee.hourly_rate)
        : '-',
      statusText: employee.status === 'active' ? 'Actif' : 'Inactif',
      address: [
        employee.address,
        employee.postal_code,
        employee.city,
        employee.country !== 'France' ? employee.country : ''
      ].filter(Boolean).join(', ')
    };
  }
}

// Exporter une instance unique du service
export default new EmployeeService();