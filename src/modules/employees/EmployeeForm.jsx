// src/modules/employees/EmployeeForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import des services
import EmployeeService from './EmployeeService';
import SettingsService from '../settings/SettingsService';

// Import des composants de section
import IdentificationSection from './components/IdentificationSection';
import PersonalInfoSection from './components/PersonalInfoSection';
import ContactInfoSection from './components/ContactInfoSection';
import AddressSection from './components/AddressSection';
import IdDocumentsSection from './components/IdDocumentsSection';
import ProfessionalInfoSection from './components/ProfessionalInfoSection';
import PaymentInfoSection from './components/PaymentInfoSection';
import AdministrativeInfoSection from './components/AdministrativeInfoSection';
import NotesSection from './components/NotesSection';
import FormActions from './components/FormActions';

function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // États pour le formulaire
  const [employee, setEmployee] = useState({
    firstName: '',
    lastName: '',
    maidenName: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    addressComplement: '',
    postalCode: '',
    city: '',
    country: 'France',
    birthDate: null,
    birthCity: '',
    availableDate: null,
    hireDate: null,
    socialSecurityNumber: '',
    nationality: 'FRANCAISE',
    familyStatus: '',
    hourlyRate: '',
    skills: '',
    notes: '',
    status: 'active',
    employeeNumber: '',
    gender: 'M',
    idCardType: 'CARTE D\'IDENTITÉ',
    idCardNumber: '',
    idCardIssueDate: null,
    idCardExpiryDate: null,
    idCardIssuePlace: '',
    qualification: 'MACON',
    paymentMethod: 'VIREMENT',
    taxWithholding: 0,
    constructionCard: '',
    urssafNumber: '',
    assedicNumber: '',
    mutualInsurance: false,
  });

  // État pour les listes de paramètres
  const [qualifications, setQualifications] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // État pour le statut de sauvegarde
  const [isSaved, setIsSaved] = useState(false);
  
  // État pour le chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Chargement initial des données et paramètres
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Charger les qualifications depuis le service de paramètres
        const qualificationsData = await SettingsService.getQualifications();
        setQualifications(qualificationsData);
        
        // Charger les méthodes de paiement depuis le service de paramètres
        const paymentMethodsData = await SettingsService.getPaymentMethods();
        setPaymentMethods(paymentMethodsData);
        
        // Si on est en mode édition, charger l'employé
        if (isEdit) {
          const employeeData = await EmployeeService.getEmployeeById(id);
          if (employeeData) {
            // Convertir les dates string en objets Date
            const formattedEmployee = {
              ...employeeData,
              birthDate: employeeData.birthDate ? new Date(employeeData.birthDate) : null,
              hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : null,
              availableDate: employeeData.availableDate ? new Date(employeeData.availableDate) : null,
              idCardIssueDate: employeeData.idCardIssueDate ? new Date(employeeData.idCardIssueDate) : null,
              idCardExpiryDate: employeeData.idCardExpiryDate ? new Date(employeeData.idCardExpiryDate) : null
            };
            
            setEmployee(formattedEmployee);
            setIsSaved(true);
          } else {
            toast.error('Employé non trouvé');
            navigate('/employees');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEdit, navigate]);

  // Gestionnaire de changement de champ
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEmployee(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value ? parseFloat(value) : '') : value
    }));
    
    // L'employé a été modifié, réinitialiser l'état de sauvegarde
    if (isSaved) {
      setIsSaved(false);
    }
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Gestionnaire de changement de date
  const handleDateChange = (date, field) => {
    setEmployee(prev => ({
      ...prev,
      [field]: date
    }));
    
    // L'employé a été modifié, réinitialiser l'état de sauvegarde
    if (isSaved) {
      setIsSaved(false);
    }
  };

  // Gestionnaire pour les compétences multiples
  const handleSkillsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    
    setEmployee(prev => ({
      ...prev,
      skills: selectedOptions.join(', ')
    }));
    
    if (isSaved) {
      setIsSaved(false);
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    // Vérifier les champs obligatoires
    if (!employee.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire';
    }
    
    if (!employee.lastName.trim()) {
      newErrors.lastName = 'Le nom de famille est obligatoire';
    }
    
    // Valider l'email
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    
    // Valider le taux horaire
    if (employee.hourlyRate && isNaN(parseFloat(employee.hourlyRate))) {
      newErrors.hourlyRate = 'Le taux horaire doit être un nombre';
    }
    
    // Valider le numéro de sécurité sociale
    if (employee.socialSecurityNumber && !/^\d{13,15}$/.test(employee.socialSecurityNumber.replace(/\s/g, ''))) {
      newErrors.socialSecurityNumber = 'Le numéro de sécurité sociale doit contenir 13 à 15 chiffres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Préparer les données pour la soumission
      const employeeData = {
        ...employee,
        birthDate: employee.birthDate ? employee.birthDate.toISOString() : null,
        hireDate: employee.hireDate ? employee.hireDate.toISOString() : null,
        availableDate: employee.availableDate ? employee.availableDate.toISOString() : null,
        idCardIssueDate: employee.idCardIssueDate ? employee.idCardIssueDate.toISOString() : null,
        idCardExpiryDate: employee.idCardExpiryDate ? employee.idCardExpiryDate.toISOString() : null
      };
      
      // Créer ou mettre à jour l'employé
      let savedEmployee;
      if (isEdit) {
        savedEmployee = await EmployeeService.updateEmployee(id, employeeData);
        toast.success('Employé mis à jour avec succès');
      } else {
        savedEmployee = await EmployeeService.createEmployee(employeeData);
        toast.success('Employé créé avec succès');
        
        // Rediriger vers la page de l'employé modifié après un court délai
        setTimeout(() => {
          navigate(`/employees/${savedEmployee.id}`, { replace: true });
        }, 1500);
      }
      
      setIsSaved(true);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'employé :', error);
      toast.error('Erreur lors de la sauvegarde de l\'employé');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'employé...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/employees')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier l\'employé' : 'Nouvel employé'}
          </h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Sections du formulaire */}
        <IdentificationSection 
          employee={employee} 
          handleChange={handleChange} 
          errors={errors} 
        />
        
        <PersonalInfoSection 
          employee={employee} 
          handleChange={handleChange} 
          handleDateChange={handleDateChange} 
          errors={errors} 
        />
        
        <ContactInfoSection 
          employee={employee} 
          handleChange={handleChange} 
          errors={errors} 
        />
        
        <AddressSection 
          employee={employee} 
          handleChange={handleChange} 
        />
        
        <IdDocumentsSection 
          employee={employee} 
          handleChange={handleChange} 
          handleDateChange={handleDateChange} 
        />
        
        <ProfessionalInfoSection 
          employee={employee} 
          handleChange={handleChange} 
          handleDateChange={handleDateChange} 
          handleSkillsChange={handleSkillsChange} 
          qualifications={qualifications}
          errors={errors} 
        />
        
        <PaymentInfoSection 
          employee={employee} 
          handleChange={handleChange} 
          paymentMethods={paymentMethods} 
        />
        
        <AdministrativeInfoSection 
          employee={employee} 
          handleChange={handleChange} 
        />
        
        <NotesSection 
          employee={employee} 
          handleChange={handleChange} 
        />
        
        <FormActions 
          navigate={navigate} 
          isSubmitting={isSubmitting} 
          isSaved={isSaved} 
        />
      </form>
      
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default EmployeeForm;