// src/modules/invoices/InvoiceForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CheckIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    DocumentTextIcon,
    BanknotesIcon,
    ClockIcon,
    UserIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import InvoiceService from './InvoiceService';
import ClientService from '../clients/ClientService';
import ContractService from '../contracts/ContractService';
import InvoicePDFGenerator from './InvoicePDFGenerator';
import TimeTrackingService from '../timetracking/TimeTrackingService';
import EmployeeService from '../employees/EmployeeService';

function InvoiceForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    // État du stepper
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // États des données
    const [clients, setClients] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [workPeriods, setWorkPeriods] = useState([]);
    const [selectedWorkPeriods, setSelectedWorkPeriods] = useState([]);
    const [timeEntries, setTimeEntries] = useState([]);
    const [groupedTimeEntries, setGroupedTimeEntries] = useState({});

    // État du formulaire
    const [invoiceData, setInvoiceData] = useState({
        clientId: '',
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Premier jour du mois
        periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // Dernier jour du mois
        description: '',
        status: 'draft',
        invoiceDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 jours
        notes: ''
    });

    // États de l'interface
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    // Chargement initial
    useEffect(() => {
        loadInitialData();
    }, []);

    // Charger les contrats quand le client change
    useEffect(() => {
        if (invoiceData.clientId && currentStep === 2) {
            loadClientContracts();
        }
    }, [invoiceData.clientId, invoiceData.periodStart, invoiceData.periodEnd, currentStep]);

    // Charger les données de pointage pour l'étape 3
    useEffect(() => {
        if (invoiceData.clientId && currentStep === 3) {
            loadTimeTrackingData();
        }
    }, [invoiceData.clientId, invoiceData.periodStart, invoiceData.periodEnd, currentStep]);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);
            const clientsData = await ClientService.getAllClients();
            setClients(clientsData.filter(client => client.status === 'active'));

            // Si on est en mode édition, charger la facture
            if (isEdit) {
                const invoice = await InvoiceService.getInvoiceById(id);
                if (invoice) {
                    setInvoiceData({
                        ...invoice,
                        periodStart: new Date(invoice.periodStart),
                        periodEnd: new Date(invoice.periodEnd),
                        invoiceDate: new Date(invoice.invoiceDate),
                        dueDate: new Date(invoice.dueDate)
                    });
                    // Charger les lignes de facture sélectionnées
                    setSelectedWorkPeriods(invoice.workPeriods || []);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement initial:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setIsLoading(false);
        }
    };

    const loadClientContracts = async () => {
        if (!invoiceData.clientId) return;

        try {
            setIsLoading(true);

            // Récupérer tous les contrats du client
            const allContracts = await ContractService.getAllContracts();
            const clientContracts = allContracts.filter(contract =>
                contract.clientId === invoiceData.clientId &&
                new Date(contract.startDate) <= new Date(invoiceData.periodEnd) &&
                new Date(contract.endDate) >= new Date(invoiceData.periodStart)
            );

            setContracts(clientContracts);

            // Générer les périodes de travail pour la facturation
            const periods = generateWorkPeriods(clientContracts);
            setWorkPeriods(periods);

        } catch (error) {
            console.error('Erreur lors du chargement des contrats:', error);
            toast.error('Erreur lors du chargement des contrats');
        } finally {
            setIsLoading(false);
        }
    };

    const generateWorkPeriods = (contracts) => {
        const periods = [];

        contracts.forEach(contract => {
            if (!contract.employee) return;

            // Calculer les jours travaillés dans la période sélectionnée
            const contractStart = new Date(contract.startDate);
            const contractEnd = new Date(contract.endDate);
            const periodStart = new Date(invoiceData.periodStart);
            const periodEnd = new Date(invoiceData.periodEnd);

            // Déterminer la période effective (intersection)
            const effectiveStart = new Date(Math.max(contractStart.getTime(), periodStart.getTime()));
            const effectiveEnd = new Date(Math.min(contractEnd.getTime(), periodEnd.getTime()));

            if (effectiveStart <= effectiveEnd) {
                // Calculer les jours ouvrés
                const workingDays = calculateWorkingDays(effectiveStart, effectiveEnd);
                const hoursPerDay = 7; // Par défaut 7h/jour
                const totalHours = workingDays * hoursPerDay;

                periods.push({
                    id: `${contract.id}_${effectiveStart.getTime()}`,
                    contractId: contract.id,
                    contractTitle: contract.title,
                    employeeName: `${contract.employee.firstName} ${contract.employee.lastName}`,
                    employeeId: contract.employeeId,
                    startDate: effectiveStart,
                    endDate: effectiveEnd,
                    workingDays,
                    hoursPerDay,
                    totalHours,
                    hourlyRate: contract.billingRate || 0,
                    amount: totalHours * (contract.billingRate || 0),
                    description: `${contract.title} - ${contract.employee.firstName} ${contract.employee.lastName}`,
                    location: contract.location || '',
                    selected: false
                });
            }
        });

        return periods;
    };

    const calculateWorkingDays = (startDate, endDate) => {
        let count = 0;
        let current = new Date(startDate);

        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            // Compter les jours ouvrés (lundi à vendredi)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return count;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({
            ...prev,
            [name]: value
        }));

        // Effacer l'erreur pour ce champ
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleDateChange = (date, field) => {
        setInvoiceData(prev => ({
            ...prev,
            [field]: date
        }));
    };

    const loadTimeTrackingData = async () => {
        if (!invoiceData.clientId) return;

        try {
            setIsLoading(true);

            // Récupérer les pointages pour ce client et cette période
            const timeEntriesData = await TimeTrackingService.getTimeEntriesByClient(
                invoiceData.clientId,
                invoiceData.periodStart.toISOString(),
                invoiceData.periodEnd.toISOString()
            );

            setTimeEntries(timeEntriesData);

            // Filtrer selon l'intervalle sélectionné et grouper par employé
            const filtered = timeEntriesData.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= invoiceData.periodStart && entryDate <= invoiceData.periodEnd;
            });

            const grouped = await groupTimeEntriesByEmployee(filtered, invoiceData.periodStart, invoiceData.periodEnd);
            setGroupedTimeEntries(grouped);

        } catch (error) {
            console.error('Erreur lors du chargement des données de pointage:', error);
            toast.error('Erreur lors du chargement des données de pointage');
        } finally {
            setIsLoading(false);
        }
    };

    const getWeekRange = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi de la semaine
        
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const formatDate = (date) => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };
        
        return {
            monday: new Date(monday),
            sunday: new Date(sunday),
            key: `${formatDate(monday)}-${formatDate(sunday)}`,
            displayKey: `${formatDate(monday)} - ${formatDate(sunday)}`
        };
    };

    const calculateWeeklyOvertime = (weekEntries) => {
        const totalWeekHours = weekEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
        
        let normalHours = 0;
        let overtime125 = 0;
        let overtime150 = 0;

        if (totalWeekHours <= 35) {
            // Toutes les heures sont normales
            normalHours = totalWeekHours;
        } else if (totalWeekHours <= 43) {
            // 35h normales + heures sup à 1.25
            normalHours = 35;
            overtime125 = totalWeekHours - 35;
        } else {
            // 35h normales + 8h sup à 1.25 + reste à 1.50
            normalHours = 35;
            overtime125 = 8; // de 35h à 43h
            overtime150 = totalWeekHours - 43;
        }

        return {
            totalWeekHours,
            normalHours,
            overtime125,
            overtime150
        };
    };

    const groupTimeEntriesByEmployee = async (entries, periodStart, periodEnd) => {
        try {
            const grouped = {};

            // Générer toutes les semaines de la période sélectionnée
            const getAllWeeksInPeriod = (start, end) => {
                const weeks = new Set();
                let current = new Date(start);
                
                while (current <= end) {
                    const weekRange = getWeekRange(current);
                    weeks.add(weekRange.key);
                    current.setDate(current.getDate() + 7); // Passer à la semaine suivante
                }
                
                return Array.from(weeks);
            };

            const allWeeksInPeriod = getAllWeeksInPeriod(periodStart, periodEnd);

            for (const entry of entries) {
                if (!grouped[entry.employeeId]) {
                    // Récupérer les données de l'employé
                    const employee = await EmployeeService.getEmployeeById(entry.employeeId);
                    
                    grouped[entry.employeeId] = {
                        employee: employee,
                        entries: [],
                        weeklyData: {},
                        totals: {
                            totalHours: 0,
                            normalHours: 0,
                            overtime125: 0,
                            overtime150: 0,
                            workingDays: 0
                        }
                    };

                    // Initialiser toutes les semaines de la période
                    allWeeksInPeriod.forEach(weekKey => {
                        grouped[entry.employeeId].weeklyData[weekKey] = [];
                    });
                }

                // Enrichir l'entrée avec les données du contrat
                let enrichedEntry = { ...entry };
                
                if (entry.contractId) {
                    try {
                        const contract = await ContractService.getContractById(entry.contractId);
                        if (contract) {
                            enrichedEntry.contractTitle = contract.title || contract.jobTitle || 'Contrat sans titre';
                            enrichedEntry.contractLocation = contract.location || '';
                        }
                    } catch (error) {
                        console.warn(`Contrat ${entry.contractId} non trouvé:`, error);
                        enrichedEntry.contractTitle = 'Contrat non trouvé';
                    }
                } else {
                    enrichedEntry.contractTitle = 'Aucun contrat associé';
                }

                // Calculer la semaine (lundi-dimanche)
                const entryDate = new Date(entry.date);
                const weekRange = getWeekRange(entryDate);
                const weekKey = weekRange.key;

                // Vérifier que la semaine est dans notre période (peut déborder)
                if (grouped[entry.employeeId].weeklyData[weekKey] !== undefined) {
                    grouped[entry.employeeId].weeklyData[weekKey].push(enrichedEntry);
                }

                // Ajouter l'entrée enrichie avec info de semaine
                enrichedEntry.weekKey = weekKey;
                enrichedEntry.weekDisplayKey = weekRange.displayKey;
                grouped[entry.employeeId].entries.push(enrichedEntry);
                grouped[entry.employeeId].totals.workingDays += 1;
            }

            // Calculer les heures supplémentaires par semaine
            for (const employeeId in grouped) {
                const employeeData = grouped[employeeId];
                let totalNormal = 0;
                let totalOvertime125 = 0;
                let totalOvertime150 = 0;
                let totalHours = 0;

                // Calculer pour chaque semaine (y compris celles vides)
                for (const weekKey in employeeData.weeklyData) {
                    const weekEntries = employeeData.weeklyData[weekKey];
                    
                    if (weekEntries.length === 0) {
                        // Semaine sans pointage
                        continue;
                    }

                    // Filtrer seulement les jours dans l'intervalle sélectionné
                    const filteredWeekEntries = weekEntries.filter(entry => {
                        const entryDate = new Date(entry.date);
                        return entryDate >= periodStart && entryDate <= periodEnd;
                    });

                    if (filteredWeekEntries.length === 0) {
                        continue;
                    }

                    const weekCalculation = calculateWeeklyOvertime(filteredWeekEntries);
                    
                    totalNormal += weekCalculation.normalHours;
                    totalOvertime125 += weekCalculation.overtime125;
                    totalOvertime150 += weekCalculation.overtime150;
                    totalHours += weekCalculation.totalWeekHours;

                    // Enrichir chaque entrée avec les données de semaine
                    weekEntries.forEach(entry => {
                        entry.weekTotalHours = weekCalculation.totalWeekHours;
                        entry.weekNormalHours = weekCalculation.normalHours;
                        entry.weekOvertime125 = weekCalculation.overtime125;
                        entry.weekOvertime150 = weekCalculation.overtime150;
                    });
                }

                // Mettre à jour les totaux
                employeeData.totals.totalHours = totalHours;
                employeeData.totals.normalHours = totalNormal;
                employeeData.totals.overtime125 = totalOvertime125;
                employeeData.totals.overtime150 = totalOvertime150;
            }

            return grouped;
        } catch (error) {
            console.error('Erreur lors du groupement des pointages:', error);
            return {};
        }
    };

    const handleWorkPeriodToggle = (periodId) => {
        setWorkPeriods(prev =>
            prev.map(period =>
                period.id === periodId
                    ? { ...period, selected: !period.selected }
                    : period
            )
        );
    };


    const validateStep = (step) => {
        const newErrors = {};

        switch (step) {
            case 1:
                if (!invoiceData.clientId) {
                    newErrors.clientId = 'Veuillez sélectionner un client';
                }
                if (!invoiceData.periodStart) {
                    newErrors.periodStart = 'La date de début est obligatoire';
                }
                if (!invoiceData.periodEnd) {
                    newErrors.periodEnd = 'La date de fin est obligatoire';
                }
                if (invoiceData.periodStart && invoiceData.periodEnd &&
                    new Date(invoiceData.periodEnd) <= new Date(invoiceData.periodStart)) {
                    newErrors.periodEnd = 'La date de fin doit être après la date de début';
                }
                break;

            case 2:
                const selectedPeriods = workPeriods.filter(p => p.selected);
                if (selectedPeriods.length === 0) {
                    newErrors.workPeriods = 'Veuillez sélectionner au moins une période de travail';
                }
                break;

            case 3:
                // Validation finale optionnelle
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        try {
            setIsSubmitting(true);

            const selectedPeriods = workPeriods.filter(p => p.selected);
            const totalAmount = selectedPeriods.reduce((sum, period) => sum + period.amount, 0);

            const invoicePayload = {
                ...invoiceData,
                workPeriods: selectedPeriods,
                totalAmount,
                clientName: clients.find(c => c.id === invoiceData.clientId)?.contactName || '',
                clientCompany: clients.find(c => c.id === invoiceData.clientId)?.companyName || '',
                periodStart: invoiceData.periodStart.toISOString(),
                periodEnd: invoiceData.periodEnd.toISOString(),
                invoiceDate: invoiceData.invoiceDate.toISOString(),
                dueDate: invoiceData.dueDate.toISOString()
            };

            if (isEdit) {
                await InvoiceService.updateInvoice(id, invoicePayload);
                toast.success('Facture mise à jour avec succès');
            } else {
                await InvoiceService.createInvoice(invoicePayload);
                toast.success('Facture créée avec succès');
            }

            setTimeout(() => {
                navigate('/invoices');
            }, 1500);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            toast.error('Erreur lors de la sauvegarde de la facture');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSelectedTotal = () => {
        return workPeriods
            .filter(p => p.selected)
            .reduce((sum, period) => sum + period.amount, 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('fr-FR');
    };

    const handlePreviewInvoice = async () => {
        try {
            setIsGeneratingPreview(true);

            // Préparer les données de la facture
            const selectedPeriods = workPeriods.filter(p => p.selected);
            const totalAmount = selectedPeriods.reduce((sum, period) => sum + period.amount, 0);
            
            const invoiceForPreview = {
                ...invoiceData,
                workPeriods: selectedPeriods,
                totalAmount,
                clientName: clients.find(c => c.id === invoiceData.clientId)?.contactName || '',
                clientCompany: clients.find(c => c.id === invoiceData.clientId)?.companyName || '',
                periodStart: invoiceData.periodStart.toISOString(),
                periodEnd: invoiceData.periodEnd.toISOString(),
                invoiceDate: invoiceData.invoiceDate.toISOString(),
                dueDate: invoiceData.dueDate.toISOString(),
                invoiceNumber: 'APERCU-' + Date.now() // Numéro temporaire pour l'aperçu
            };

            // Récupérer les données du client complet
            const client = clients.find(c => c.id === invoiceData.clientId);

            // Données de l'entreprise
            const company = {
                name: "ATLANTIS",
                address: "221 RUE DE LAFAYETTE",
                zipCode: "75010",
                city: "PARIS",
                siret: "948 396 973 R.C.S. PARIS",
                ape: "7820Z",
                email: "CONTACTATLANTIS75@GMAIL.COM",
                phone: ""
            };

            // Générer l'aperçu
            const result = await InvoicePDFGenerator.generateInvoicePDF(
                invoiceForPreview,
                client,
                company
            );

            if (result.success) {
                toast.success('Aperçu ouvert avec succès');
            } else {
                toast.error('Erreur lors de la génération de l\'aperçu');
            }
        } catch (error) {
            console.error('Erreur lors de la génération de l\'aperçu:', error);
            toast.error('Erreur lors de la génération de l\'aperçu');
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    if (isLoading && !isEdit) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement</h3>
                    <p className="text-gray-600">Préparation du formulaire...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigate('/invoices')}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {isEdit ? 'Modifier la facture' : 'Nouvelle facture'}
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        Étape {currentStep} sur {totalSteps}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stepper */}
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step < currentStep
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : step === currentStep
                                                ? 'border-blue-600 text-blue-600 bg-blue-50'
                                                : 'border-gray-300 text-gray-400'
                                        }`}>
                                        {step < currentStep ? (
                                            <CheckIcon className="w-6 h-6" />
                                        ) : (
                                            <span className="font-medium">{step}</span>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${step <= currentStep ? 'text-gray-900' : 'text-gray-400'
                                            }`}>
                                            {step === 1 && 'Client et période'}
                                            {step === 2 && 'Sélection des travaux'}
                                            {step === 3 && 'Finalisation'}
                                        </p>
                                    </div>
                                    {step < 3 && (
                                        <ChevronRightIcon className="w-5 h-5 text-gray-400 mx-4" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contenu des étapes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* Étape 1: Client et période */}
                    {currentStep === 1 && (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                                Sélection du client et de la période
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Client <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="clientId"
                                        value={invoiceData.clientId}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.clientId ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Sélectionner un client...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.companyName}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.clientId && (
                                        <p className="text-sm text-red-500 flex items-center mt-1">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                            {errors.clientId}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={invoiceData.description}
                                        onChange={handleInputChange}
                                        placeholder="Description de la facture"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Date de début <span className="text-red-500">*</span>
                                    </label>
                                    <DatePicker
                                        selected={invoiceData.periodStart}
                                        onChange={(date) => handleDateChange(date, 'periodStart')}
                                        dateFormat="dd/MM/yyyy"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.periodStart ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.periodStart && (
                                        <p className="text-sm text-red-500 flex items-center mt-1">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                            {errors.periodStart}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Date de fin <span className="text-red-500">*</span>
                                    </label>
                                    <DatePicker
                                        selected={invoiceData.periodEnd}
                                        onChange={(date) => handleDateChange(date, 'periodEnd')}
                                        dateFormat="dd/MM/yyyy"
                                        minDate={invoiceData.periodStart}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.periodEnd ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.periodEnd && (
                                        <p className="text-sm text-red-500 flex items-center mt-1">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                            {errors.periodEnd}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {invoiceData.clientId && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-medium text-blue-900 mb-2">Client sélectionné</h3>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium">
                                            {clients.find(c => c.id === invoiceData.clientId)?.companyName}
                                        </p>
                                        <p>{clients.find(c => c.id === invoiceData.clientId)?.contactName}</p>
                                        <p className="mt-1">
                                            Période: {formatDate(invoiceData.periodStart)} - {formatDate(invoiceData.periodEnd)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Étape 2: Sélection des travaux */}
                    {currentStep === 2 && (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                                Sélection des travaux à facturer
                            </h2>

                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                                    <p className="text-gray-600">Chargement des contrats...</p>
                                </div>
                            ) : workPeriods.length === 0 ? (
                                <div className="text-center py-8">
                                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun travail trouvé</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Aucun contrat actif trouvé pour ce client sur la période sélectionnée.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {workPeriods.map((period) => (
                                        <div
                                            key={period.id}
                                            className={`border rounded-lg p-4 transition-all ${period.selected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={period.selected}
                                                        onChange={() => handleWorkPeriodToggle(period.id)}
                                                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900">
                                                            {period.contractTitle}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 flex items-center mt-1">
                                                            <UserIcon className="h-4 w-4 mr-1" />
                                                            {period.employeeName}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                                            {period.location && ` • ${period.location}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    ))}

                                    {errors.workPeriods && (
                                        <p className="text-sm text-red-500 flex items-center">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                            {errors.workPeriods}
                                        </p>
                                    )}

                                    {/* Résumé simple */}
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                            <p className="font-medium text-gray-900">
                                                {workPeriods.filter(p => p.selected).length} période(s) sélectionnée(s)
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Les montants seront calculés à l'étape suivante
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Étape 3: Finalisation */}
                    {currentStep === 3 && (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <BanknotesIcon className="h-5 w-5 mr-2 text-blue-600" />
                                Finalisation de la facture
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Date de facture
                                    </label>
                                    <DatePicker
                                        selected={invoiceData.invoiceDate}
                                        onChange={(date) => handleDateChange(date, 'invoiceDate')}
                                        dateFormat="dd/MM/yyyy"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Date d'échéance
                                    </label>
                                    <DatePicker
                                        selected={invoiceData.dueDate}
                                        onChange={(date) => handleDateChange(date, 'dueDate')}
                                        dateFormat="dd/MM/yyyy"
                                        minDate={invoiceData.invoiceDate}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Statut
                                    </label>
                                    <select
                                        name="status"
                                        value={invoiceData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="draft">Brouillon</option>
                                        <option value="sent">Envoyée</option>
                                        <option value="paid">Payée</option>
                                        <option value="rejected">Refusée</option>
                                    </select>
                                </div>

                                <div className="lg:col-span-2 space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        rows="3"
                                        value={invoiceData.notes}
                                        onChange={handleInputChange}
                                        placeholder="Notes additionnelles..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Tableau des heures de pointage */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Heures de travail hebdomadaires
                                </h3>

                                {isLoading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                                        <p className="text-gray-600">Chargement des données de pointage...</p>
                                    </div>
                                ) : Object.keys(groupedTimeEntries).length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun pointage trouvé</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Aucune donnée de pointage pour cette période et ce client.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(groupedTimeEntries).map(([employeeId, employeeData]) => (
                                            <div key={employeeId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                {/* En-tête employé */}
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 flex items-center">
                                                                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                                                                {employeeData.employee?.firstName} {employeeData.employee?.lastName}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {employeeData.totals.workingDays} jour(s) travaillé(s)
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-blue-600">
                                                                {employeeData.totals.totalHours.toFixed(1)}h
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Total
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tableau des pointages */}
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semaine</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates travaillées</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrat(s)</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horaires par jour</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total semaine</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">H. normales (x1.00)</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">H. sup (x1.25)</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">H. sup (x1.50)</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {Object.entries(employeeData.weeklyData)
                                                                .filter(([weekKey, weekEntries]) => weekEntries.length > 0)
                                                                .sort(([weekKeyA], [weekKeyB]) => weekKeyA.localeCompare(weekKeyB))
                                                                .map(([weekKey, weekEntries], weekIndex) => {
                                                                    const weekCalculation = calculateWeeklyOvertime(weekEntries);
                                                                    const firstEntry = weekEntries[0];
                                                                    const weekRange = getWeekRange(new Date(firstEntry.date));
                                                                    
                                                                    return (
                                                                        <tr key={weekKey} className="hover:bg-gray-50">
                                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                                <div className="font-semibold">
                                                                                    {weekRange.displayKey}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    {weekEntries.length} jour(s) travaillé(s)
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                                <div className="space-y-1">
                                                                                    {weekEntries.map((entry, idx) => (
                                                                                        <div key={idx} className="text-xs">
                                                                                            {formatDate(new Date(entry.date))}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                                <div className="space-y-1">
                                                                                    {[...new Set(weekEntries.map(entry => entry.contractTitle))].map((contract, idx) => (
                                                                                        <div key={idx} className="text-xs">
                                                                                            {contract || 'Contrat non trouvé'}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                                <div className="space-y-1">
                                                                                    {weekEntries.map((entry, idx) => (
                                                                                        <div key={idx} className="text-xs">
                                                                                            {entry.startTime && entry.endTime 
                                                                                                ? `${entry.startTime} - ${entry.endTime}`
                                                                                                : 'Non renseigné'
                                                                                            }
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                                <div className="font-semibold">
                                                                                    {weekCalculation.totalWeekHours.toFixed(1)}h
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    Total semaine
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                                <div className="font-semibold">
                                                                                    {weekCalculation.normalHours.toFixed(1)}h
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    x1.00
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right font-medium">
                                                                                <div className="font-bold">
                                                                                    {weekCalculation.overtime125.toFixed(1)}h
                                                                                </div>
                                                                                <div className="text-xs text-orange-500">
                                                                                    x1.25
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                                                                                <div className="font-bold">
                                                                                    {weekCalculation.overtime150.toFixed(1)}h
                                                                                </div>
                                                                                <div className="text-xs text-red-500">
                                                                                    x1.50
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                <div className="space-y-1">
                                                                                    {[...new Set(weekEntries.map(entry => entry.status))].map((status, idx) => (
                                                                                        <span key={idx} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                                            status === 'validated' 
                                                                                                ? 'bg-green-100 text-green-800'
                                                                                                : status === 'invoiced'
                                                                                                ? 'bg-blue-100 text-blue-800'
                                                                                                : 'bg-yellow-100 text-yellow-800'
                                                                                        }`}>
                                                                                            {status === 'validated' ? 'Validé' : 
                                                                                             status === 'invoiced' ? 'Facturé' : 
                                                                                             'Brouillon'}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Résumé employé */}
                                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Heures normales (x1.00):</span>
                                                                <span className="font-medium">{employeeData.totals.normalHours.toFixed(1)}h</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-orange-600">Heures sup. (x1.25):</span>
                                                                <span className="font-medium text-orange-600">{employeeData.totals.overtime125.toFixed(1)}h</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-red-600">Heures sup. (x1.50):</span>
                                                                <span className="font-medium text-red-600">{employeeData.totals.overtime150.toFixed(1)}h</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col justify-center items-end">
                                                            <div className="text-right">
                                                                <span className="text-lg font-bold text-blue-600">
                                                                    {employeeData.totals.totalHours.toFixed(1)}h
                                                                </span>
                                                                <div className="text-xs text-gray-500">Total période</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                                                        <div className="flex justify-between">
                                                            <span>Règle: 35h normales, puis x1.25 jusqu'à 43h, puis x1.50</span>
                                                            <span>{Object.keys(employeeData.weeklyData).length} semaine(s)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bouton d'aperçu */}
                            <div className="mb-6">
                                <button
                                    type="button"
                                    onClick={handlePreviewInvoice}
                                    disabled={isGeneratingPreview || workPeriods.filter(p => p.selected).length === 0}
                                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg border-2 border-dashed transition-colors ${
                                        isGeneratingPreview || workPeriods.filter(p => p.selected).length === 0
                                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                            : 'border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50'
                                    }`}
                                >
                                    {isGeneratingPreview ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-2"></div>
                                            Génération de l'aperçu...
                                        </>
                                    ) : (
                                        <>
                                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                                            Aperçu de la facture
                                        </>
                                    )}
                                </button>
                                {workPeriods.filter(p => p.selected).length === 0 && (
                                    <p className="text-sm text-gray-500 text-center mt-2">
                                        Sélectionnez au moins une prestation pour voir l'aperçu
                                    </p>
                                )}
                            </div>

                            {/* Récapitulatif final */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif de la facture</h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Client:</span>
                                        <span className="font-medium">
                                            {clients.find(c => c.id === invoiceData.clientId)?.companyName}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Période:</span>
                                        <span className="font-medium">
                                            {formatDate(invoiceData.periodStart)} - {formatDate(invoiceData.periodEnd)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nombre de lignes:</span>
                                        <span className="font-medium">
                                            {workPeriods.filter(p => p.selected).length}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total heures:</span>
                                        <span className="font-medium">
                                            {workPeriods.filter(p => p.selected).reduce((sum, p) => sum + p.totalHours, 0).toFixed(1)}h
                                        </span>
                                    </div>

                                    <div className="border-t pt-3 flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-900">Total HT:</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(getSelectedTotal())}
                                        </span>
                                    </div>
                                </div>

                                {/* Détail des lignes */}
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Détail des prestations</h4>
                                    <div className="space-y-2">
                                        {workPeriods.filter(p => p.selected).map(period => (
                                            <div key={period.id} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {period.description} ({period.totalHours}h × {formatCurrency(period.hourlyRate).replace(' €', '€')})
                                                </span>
                                                <span className="font-medium">{formatCurrency(period.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${currentStep === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                                Précédent
                            </button>

                            {currentStep < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Suivant
                                    <ChevronRightIcon className="h-5 w-5 ml-2" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`flex items-center px-8 py-2 rounded-lg transition-colors ${isSubmitting
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <CheckIcon className="h-5 w-5 mr-2" />
                                            {isEdit ? 'Mettre à jour' : 'Créer la facture'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer
                position="bottom-right"
                toastClassName="rounded-lg"
                progressClassName="bg-blue-600"
            />
        </div>
    );
}

export default InvoiceForm;