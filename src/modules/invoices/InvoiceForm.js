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
    InformationCircleIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import InvoiceService from './InvoiceService';
import ClientService from '../clients/ClientService';
import ContractService from '../contracts/ContractService';
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
    const [loadingMessage, setLoadingMessage] = useState('Récupération des données...');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [totalContracts, setTotalContracts] = useState(0);
    const [processedContracts, setProcessedContracts] = useState(0);
    const [isLoadingTimeTracking, setIsLoadingTimeTracking] = useState(false);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [processedEmployees, setProcessedEmployees] = useState(0);

    // État du formulaire
    const [invoiceData, setInvoiceData] = useState({
        clientId: '',
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Premier jour du mois
        periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // Dernier jour du mois
        description: '',
        status: 'draft',
        invoiceDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 jours
        notes: '',
        chantier: 'SARCELLES', // Nouveau champ pour le chantier avec valeur par défaut
        workSiteDate: new Date() // Nouvelle date pour le chantier
    });

    // États de l'interface
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [expandedWeeks, setExpandedWeeks] = useState({});
    const [isFinalized, setIsFinalized] = useState(false);

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
        if (invoiceData.clientId && currentStep === 3 && !isFinalized) {
            console.log('Démarrage du chargement des données de pointage...');
            loadTimeTrackingData();
        }
    }, [invoiceData.clientId, invoiceData.periodStart, invoiceData.periodEnd, currentStep, workPeriods, isFinalized]);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);
            const clientsData = await ClientService.getAllClients();
            setClients(clientsData.filter(client => client.status === 'active'));

            // Si on est en mode édition, charger la facture
            if (isEdit) {
                const invoice = await InvoiceService.getInvoiceById(id);
                if (invoice) {
                    // Vérifier si la facture est finalisée
                    if (invoice.isFinalized) {
                        setIsFinalized(true);
                        toast.info('Affichage des données figées de la facture finalisée');
                        
                        // Charger les données figées au lieu de recalculer
                        if (invoice.employeesData) {
                            // Convertir les données sauvegardées au format attendu par l'interface
                            const convertedGroupedEntries = invoice.employeesData.reduce((acc, empData) => {
                                acc[empData.employeeId] = {
                                    employee: empData.employee,
                                    totals: empData.totals,
                                    weeklyData: empData.weeklyData,
                                    entries: [] // Les entrées détaillées sont dans weeklyData
                                };
                                return acc;
                            }, {});
                            
                            setGroupedTimeEntries(convertedGroupedEntries);
                        }
                        
                        // Charger les work periods sélectionnés
                        if (invoice.selectedWorkPeriods) {
                            setWorkPeriods(invoice.selectedWorkPeriods.map(wp => ({ ...wp, selected: true })));
                        }
                    }
                    
                    setInvoiceData({
                        ...invoice,
                        periodStart: new Date(invoice.periodStart),
                        periodEnd: new Date(invoice.periodEnd),
                        invoiceDate: new Date(invoice.invoiceDate),
                        dueDate: new Date(invoice.dueDate),
                        chantier: invoice.chantier || '',
                        workSiteDate: invoice.workSiteDate ? new Date(invoice.workSiteDate) : new Date()
                    });
                    
                    // Charger les lignes de facture sélectionnées (pour factures non finalisées)
                    if (!invoice.isFinalized) {
                        setSelectedWorkPeriods(invoice.workPeriods || []);
                    }
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
            setLoadingMessage('Récupération des contrats du client...');

            // Récupérer tous les contrats du client
            const allContracts = await ContractService.getAllContracts();
            const clientContracts = allContracts.filter(contract =>
                contract.clientId === invoiceData.clientId &&
                new Date(contract.startDate) <= new Date(invoiceData.periodEnd) &&
                new Date(contract.endDate) >= new Date(invoiceData.periodStart)
            );

            setContracts(clientContracts);
            setLoadingMessage('Génération des périodes de travail...');

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

        console.log('=== DÉBUT CHARGEMENT TIMETRACKING ===');

        try {
            // Utiliser un loading spécifique pour les données de pointage
            setIsLoadingTimeTracking(true);
            setLoadingProgress(10);
            setProcessedContracts(0);

            // Récupérer d'abord les périodes de travail sélectionnées
            const selectedWorkPeriods = workPeriods.filter(p => p.selected);
            console.log('Périodes sélectionnées:', selectedWorkPeriods.length);
            setTotalContracts(selectedWorkPeriods.length);

            setLoadingMessage('Récupération des contrats du client...');
            console.log('Message de chargement défini:', 'Récupération des contrats du client...');

            // Grouper les périodes par contrat pour optimiser le traitement
            const contractGroups = selectedWorkPeriods.reduce((acc, period) => {
                if (!acc[period.contractId]) {
                    acc[period.contractId] = [];
                }
                acc[period.contractId].push(period);
                return acc;
            }, {});

            const allTimeEntries = [];
            const contractIds = Object.keys(contractGroups);

            // Traiter contrat par contrat
            for (let i = 0; i < contractIds.length; i++) {
                const contractId = contractIds[i];
                const contractPeriods = contractGroups[contractId];

                // Mettre à jour AVANT le traitement
                setTimeout(() => {
                    setProcessedContracts(i);
                    const progress = Math.round((i / contractIds.length) * 80) + 10; // 10-90%
                    setLoadingProgress(progress);
                    setLoadingMessage(`Traitement du contrat ${i + 1}/${contractIds.length}...`);
                }, 0);

                console.log(`Traitement contrat ${i + 1}/${contractIds.length}, progress: ${Math.round((i / contractIds.length) * 80) + 10}%`);

                // Pause pour voir la mise à jour
                await new Promise(resolve => setTimeout(resolve, 300));

                // Récupérer les pointages pour ce contrat spécifique
                let contractTimeEntries;
                try {
                    contractTimeEntries = await TimeTrackingService.getTimeEntriesByContract(
                        contractId,
                        invoiceData.periodStart.toISOString(),
                        invoiceData.periodEnd.toISOString()
                    );
                } catch (error) {
                    console.warn(`Erreur lors du chargement du contrat ${contractId}, utilisation de la méthode alternative:`, error);
                    // Fallback vers la méthode client si la méthode par contrat échoue
                    const allClientEntries = await TimeTrackingService.getTimeEntriesByClient(
                        invoiceData.clientId,
                        invoiceData.periodStart.toISOString(),
                        invoiceData.periodEnd.toISOString()
                    );
                    contractTimeEntries = allClientEntries.filter(entry => entry.contractId === contractId);
                }

                // Filtrer selon les employés sélectionnés pour ce contrat
                const employeeIds = contractPeriods.map(p => p.employeeId);
                const filteredEntries = contractTimeEntries.filter(entry => {
                    const entryDate = new Date(entry.date);
                    const dateInRange = entryDate >= invoiceData.periodStart && entryDate <= invoiceData.periodEnd;
                    const employeeMatch = employeeIds.includes(entry.employeeId);
                    return dateInRange && employeeMatch;
                });

                allTimeEntries.push(...filteredEntries);

                // Mettre à jour APRÈS le traitement
                setTimeout(() => {
                    setProcessedContracts(i + 1);
                    const finalProgress = Math.round(((i + 1) / contractIds.length) * 80) + 10;
                    setLoadingProgress(finalProgress);
                }, 0);

                console.log(`Contrat ${i + 1} traité, ${filteredEntries.length} entrées trouvées`);

                // Pause pour permettre à l'UI de se mettre à jour
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            setTimeEntries(allTimeEntries);
            setLoadingProgress(85);
            setLoadingMessage('Groupement des données par employé...');

            // Pause pour montrer le message
            await new Promise(resolve => setTimeout(resolve, 500));

            const grouped = await groupTimeEntriesByEmployee(allTimeEntries, invoiceData.periodStart, invoiceData.periodEnd, (progressInfo) => {
                setLoadingMessage(progressInfo.message);
                setLoadingProgress(progressInfo.progress);
                setProcessedEmployees(progressInfo.processedEmployees);
                setTotalEmployees(progressInfo.totalEmployees);
            });

            setLoadingProgress(95);
            setLoadingMessage('Finalisation des données...');

            // Pause pour montrer le message
            await new Promise(resolve => setTimeout(resolve, 500));

            // Ajouter les employés sélectionnés qui n'ont pas de pointage (avec 0 heures)
            for (const workPeriod of selectedWorkPeriods) {
                if (!grouped[workPeriod.employeeId]) {
                    // Récupérer les données de l'employé
                    const employee = await EmployeeService.getEmployeeById(workPeriod.employeeId);
                    
                    grouped[workPeriod.employeeId] = {
                        employee: employee,
                        entries: [],
                        weeklyData: {},
                        totals: {
                            totalHours: 0,
                            normalHours: 0,
                            overtime125: 0,
                            overtime150: 0,
                            workingDays: 0,
                            totalAmount: 0,
                            normalAmount: 0,
                            overtime125Amount: 0,
                            overtime150Amount: 0
                        }
                    };
                }
            }
            
            setLoadingProgress(100);
            setLoadingMessage('Préparation de l\'affichage...');
            setGroupedTimeEntries(grouped);

        } catch (error) {
            console.error('Erreur lors du chargement des données de pointage:', error);
            toast.error('Erreur lors du chargement des données de pointage');
        } finally {
            setIsLoadingTimeTracking(false);
            setLoadingProgress(0);
            setProcessedContracts(0);
            setTotalContracts(0);
            setProcessedEmployees(0);
            setTotalEmployees(0);
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

    const calculateWeeklyCosts = async (weekEntries) => {
        let totalNormalAmount = 0;
        let totalOvertime125Amount = 0;
        let totalOvertime150Amount = 0;
        let weeklyRates = [];

        // Récupérer les taux de facturation (billingRate) des contrats/entrées
        for (const entry of weekEntries) {
            if (entry.contractId && !weeklyRates.some(r => r.contractId === entry.contractId)) {
                try {
                    // Priorité 1: billingRate depuis l'entrée de pointage
                    let billingRate = entry.billingRate || entry.billing_rate;
                    
                    // Priorité 2: billingRate depuis le contrat
                    if (!billingRate) {
                        const contract = await ContractService.getContractById(entry.contractId);
                        billingRate = contract?.billingRate || contract?.billing_rate;
                    }
                    
                    // Priorité 3: hourlyRate du contrat (fallback)
                    if (!billingRate) {
                        const contract = await ContractService.getContractById(entry.contractId);
                        billingRate = contract?.hourlyRate;
                    }
                    
                    if (billingRate) {
                        weeklyRates.push({
                            contractId: entry.contractId,
                            contractTitle: entry.contractTitle || 'Contrat',
                            billingRate: parseFloat(billingRate) || 0
                        });
                    }
                } catch (error) {
                    console.warn(`Impossible de récupérer le taux du contrat ${entry.contractId}`);
                }
            }
        }

        // Si on a plusieurs contrats dans la semaine, on prend le taux moyen pondéré par les heures
        let averageBillingRate = 0;
        if (weeklyRates.length > 0) {
            const totalHours = weekEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
            let weightedSum = 0;
            
            for (const entry of weekEntries) {
                // Utiliser billingRate depuis l'entrée d'abord, puis depuis weeklyRates
                const entryBillingRate = entry.billingRate || entry.billing_rate;
                const contractRate = weeklyRates.find(r => r.contractId === entry.contractId);
                const billingRate = entryBillingRate || contractRate?.billingRate || 0;
                
                weightedSum += (entry.totalHours || 0) * billingRate;
            }
            
            averageBillingRate = totalHours > 0 ? weightedSum / totalHours : 0;
        }

        const weekCalculation = calculateWeeklyOvertime(weekEntries);

        // Calculer les montants par type d'heures basés sur les taux de facturation CLIENT
        totalNormalAmount = weekCalculation.normalHours * averageBillingRate;
        totalOvertime125Amount = weekCalculation.overtime125 * averageBillingRate * 1.25;
        totalOvertime150Amount = weekCalculation.overtime150 * averageBillingRate * 1.50;

        return {
            ...weekCalculation,
            averageHourlyRate: averageBillingRate, // Garder le même nom pour compatibilité
            averageBillingRate, // Nouveau nom plus explicite
            weeklyRates,
            totalNormalAmount,
            totalOvertime125Amount,
            totalOvertime150Amount,
            totalWeekAmount: totalNormalAmount + totalOvertime125Amount + totalOvertime150Amount
        };
    };

    const groupTimeEntriesByEmployee = async (entries, periodStart, periodEnd, onProgress) => {
        try {
            const grouped = {};

            // Grouper d'abord par employé pour compter
            const employeeGroups = {};
            const uniqueEmployeeIds = new Set();
            const uniqueContractIds = new Set();

            entries.forEach(entry => {
                if (!employeeGroups[entry.employeeId]) {
                    employeeGroups[entry.employeeId] = [];
                }
                employeeGroups[entry.employeeId].push(entry);
                uniqueEmployeeIds.add(entry.employeeId);
                uniqueContractIds.add(entry.contractId);
            });

            const employeeIds = Array.from(uniqueEmployeeIds);
            console.log(`Groupement de ${employeeIds.length} employés...`);

            // OPTIMISATION: Pré-charger tous les employés et contrats en une fois
            if (onProgress) {
                onProgress({
                    message: `Chargement des données employés et contrats...`,
                    progress: 85,
                    processedEmployees: 0,
                    totalEmployees: employeeIds.length
                });
            }

            const employeesMap = {};
            const contractsMap = {};

            // Charger tous les employés en parallèle
            const employeePromises = Array.from(uniqueEmployeeIds).map(async id => {
                try {
                    const employee = await EmployeeService.getEmployeeById(id);
                    employeesMap[id] = employee;
                } catch (error) {
                    console.warn(`Employé ${id} non trouvé:`, error);
                    employeesMap[id] = null;
                }
            });

            // Charger tous les contrats en parallèle
            const contractPromises = Array.from(uniqueContractIds).map(async id => {
                try {
                    const contract = await ContractService.getContractById(id);
                    contractsMap[id] = contract;
                } catch (error) {
                    console.warn(`Contrat ${id} non trouvé:`, error);
                    contractsMap[id] = null;
                }
            });

            // Attendre que tous les chargements soient terminés
            await Promise.all([...employeePromises, ...contractPromises]);

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

            // Traiter toutes les entrées avec les données pré-chargées
            for (const entry of entries) {
                // Mise à jour de la progression
                if (onProgress) {
                    const currentEmployeeIndex = employeeIds.indexOf(entry.employeeId);
                    if (currentEmployeeIndex >= 0) {
                        onProgress({
                            message: `Groupement employé ${currentEmployeeIndex + 1}/${employeeIds.length}...`,
                            progress: 85 + Math.round((currentEmployeeIndex / employeeIds.length) * 10), // 85-95%
                            processedEmployees: currentEmployeeIndex,
                            totalEmployees: employeeIds.length
                        });
                    }
                }

                // Initialiser l'employé s'il n'existe pas encore
                if (!grouped[entry.employeeId]) {
                    const employee = employeesMap[entry.employeeId];

                    grouped[entry.employeeId] = {
                        employee: employee,
                        entries: [],
                        weeklyData: {},
                        totals: {
                            totalHours: 0,
                            normalHours: 0,
                            overtime125: 0,
                            overtime150: 0,
                            workingDays: 0,
                            totalAmount: 0,
                            normalAmount: 0,
                            overtime125Amount: 0,
                            overtime150Amount: 0
                        }
                    };

                    // Initialiser toutes les semaines de la période
                    allWeeksInPeriod.forEach(weekKey => {
                        grouped[entry.employeeId].weeklyData[weekKey] = [];
                    });
                }

                // Enrichir l'entrée avec les données du contrat (OPTIMISÉ)
                let enrichedEntry = { ...entry };

                if (entry.contractId) {
                    const contract = contractsMap[entry.contractId];
                    if (contract) {
                        enrichedEntry.contractTitle = contract.title || contract.jobTitle || 'Contrat sans titre';
                        enrichedEntry.contractLocation = contract.location || '';
                    } else {
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

            // Calculer les heures supplémentaires et coûts par semaine
            for (const employeeId in grouped) {
                const employeeData = grouped[employeeId];
                let totalNormal = 0;
                let totalOvertime125 = 0;
                let totalOvertime150 = 0;
                let totalHours = 0;
                let totalNormalAmount = 0;
                let totalOvertime125Amount = 0;
                let totalOvertime150Amount = 0;
                let totalAmount = 0;

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

                    // Calculer les heures et coûts pour cette semaine
                    const weekCalculation = await calculateWeeklyCosts(filteredWeekEntries);
                    
                    totalNormal += weekCalculation.normalHours;
                    totalOvertime125 += weekCalculation.overtime125;
                    totalOvertime150 += weekCalculation.overtime150;
                    totalHours += weekCalculation.totalWeekHours;
                    
                    totalNormalAmount += weekCalculation.totalNormalAmount;
                    totalOvertime125Amount += weekCalculation.totalOvertime125Amount;
                    totalOvertime150Amount += weekCalculation.totalOvertime150Amount;
                    totalAmount += weekCalculation.totalWeekAmount;

                    // Enrichir chaque entrée avec les données de semaine
                    weekEntries.forEach(entry => {
                        entry.weekTotalHours = weekCalculation.totalWeekHours;
                        entry.weekNormalHours = weekCalculation.normalHours;
                        entry.weekOvertime125 = weekCalculation.overtime125;
                        entry.weekOvertime150 = weekCalculation.overtime150;
                        entry.weekCosts = weekCalculation;
                    });
                }

                // Mettre à jour les totaux
                employeeData.totals.totalHours = totalHours;
                employeeData.totals.normalHours = totalNormal;
                employeeData.totals.overtime125 = totalOvertime125;
                employeeData.totals.overtime150 = totalOvertime150;
                employeeData.totals.totalAmount = totalAmount;
                employeeData.totals.normalAmount = totalNormalAmount;
                employeeData.totals.overtime125Amount = totalOvertime125Amount;
                employeeData.totals.overtime150Amount = totalOvertime150Amount;
            }

            return grouped;
        } catch (error) {
            console.error('Erreur lors du groupement des pointages:', error);
            return {};
        }
    };

    const toggleWeekExpansion = (employeeId, weekKey) => {
        const key = `${employeeId}-${weekKey}`;
        setExpandedWeeks(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
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

    // Toggle sélection/désélection de tous les travaux
    const toggleAllWorkPeriods = () => {
        const allSelected = workPeriods.every(period => period.selected);
        setWorkPeriods(prev =>
            prev.map(period => ({ ...period, selected: !allSelected }))
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

    const nextStep = async () => {
        if (validateStep(currentStep)) {
            // Afficher le loading pendant la transition
            setIsLoading(true);
            
            if (currentStep === 1) {
                setLoadingMessage('Préparation de l\'étape suivante...');
                // Petite pause pour que l'utilisateur voie le message
                await new Promise(resolve => setTimeout(resolve, 500));
            } else if (currentStep === 2) {
                setLoadingMessage('Préparation des données de pointage...');
                // Petite pause pour l'étape 3 qui va charger les données de pointage
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
            setIsLoading(false);
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
            const client = clients.find(c => c.id === invoiceData.clientId);

            // Calculer les totaux globaux à partir des données de pointage
            const globalTotals = Object.values(groupedTimeEntries).reduce((acc, employeeData) => ({
                totalHours: acc.totalHours + (employeeData.totals?.totalHours || 0),
                normalHours: acc.normalHours + (employeeData.totals?.normalHours || 0),
                overtime125: acc.overtime125 + (employeeData.totals?.overtime125 || 0),
                overtime150: acc.overtime150 + (employeeData.totals?.overtime150 || 0),
                totalAmount: acc.totalAmount + (employeeData.totals?.totalAmount || 0),
                normalAmount: acc.normalAmount + (employeeData.totals?.normalAmount || 0),
                overtime125Amount: acc.overtime125Amount + (employeeData.totals?.overtime125Amount || 0),
                overtime150Amount: acc.overtime150Amount + (employeeData.totals?.overtime150Amount || 0)
            }), {
                totalHours: 0, normalHours: 0, overtime125: 0, overtime150: 0,
                totalAmount: 0, normalAmount: 0, overtime125Amount: 0, overtime150Amount: 0
            });

            // Préparer les données détaillées par employé (instantané figé)
            const employeesData = Object.entries(groupedTimeEntries).map(([employeeId, employeeData]) => ({
                employeeId,
                employee: employeeData.employee,
                totals: employeeData.totals,
                weeklyData: Object.entries(employeeData.weeklyData)
                    .filter(([weekKey, weekEntries]) => weekEntries.length > 0)
                    .reduce((acc, [weekKey, weekEntries]) => {
                        // Calculer les coûts pour cette semaine
                        const firstEntry = weekEntries[0];
                        const weekCosts = firstEntry.weekCosts;
                        
                        acc[weekKey] = {
                            weekRange: weekKey,
                            weekEntries: weekEntries.map(entry => ({
                                id: entry.id,
                                date: entry.date,
                                totalHours: entry.totalHours,
                                startTime: entry.startTime,
                                endTime: entry.endTime,
                                contractId: entry.contractId,
                                contractTitle: entry.contractTitle,
                                status: entry.status,
                                notes: entry.notes
                            })),
                            weekCalculation: {
                                totalWeekHours: weekCosts?.totalWeekHours || 0,
                                normalHours: weekCosts?.normalHours || 0,
                                overtime125: weekCosts?.overtime125 || 0,
                                overtime150: weekCosts?.overtime150 || 0,
                                averageHourlyRate: weekCosts?.averageHourlyRate || 0,
                                totalNormalAmount: weekCosts?.totalNormalAmount || 0,
                                totalOvertime125Amount: weekCosts?.totalOvertime125Amount || 0,
                                totalOvertime150Amount: weekCosts?.totalOvertime150Amount || 0,
                                totalWeekAmount: weekCosts?.totalWeekAmount || 0,
                                weeklyRates: weekCosts?.weeklyRates || []
                            }
                        };
                        return acc;
                    }, {})
            }));

            // Payload complet avec toutes les données calculées (instantané figé)
            const invoicePayload = {
                ...invoiceData,
                
                // Informations client figées
                clientId: invoiceData.clientId,
                clientName: client?.contactName || '',
                clientCompany: client?.companyName || '',
                clientAddress: client?.address || '',
                clientZipCode: client?.zipCode || '',
                clientCity: client?.city || '',
                clientEmail: client?.email || '',
                clientPhone: client?.phone || '',
                
                // Périodes sélectionnées
                selectedWorkPeriods: selectedPeriods,
                
                // Totaux globaux calculés
                globalTotals,
                
                // Détails par employé avec calculs
                employeesData,
                
                // Statistiques générales
                stats: {
                    employeeCount: Object.keys(groupedTimeEntries).length,
                    workingDaysTotal: Object.values(groupedTimeEntries).reduce((sum, emp) => sum + emp.totals.workingDays, 0),
                    weeksCount: Object.values(groupedTimeEntries).reduce((total, employeeData) => 
                        total + Object.keys(employeeData.weeklyData || {}).filter(key => employeeData.weeklyData[key].length > 0).length, 0
                    )
                },
                
                // Dates en ISO pour cohérence
                periodStart: invoiceData.periodStart.toISOString(),
                periodEnd: invoiceData.periodEnd.toISOString(),
                invoiceDate: invoiceData.invoiceDate.toISOString(),
                dueDate: invoiceData.dueDate.toISOString(),
                
                // Marquer comme finalisée (non modifiable)
                isFinalized: true,
                finalizedAt: new Date().toISOString()
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
                {/* Bandeau d'information pour les factures existantes */}
                {isEdit && (
                    <div className="mb-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-amber-800 font-medium">
                                        Facture - Mode consultation uniquement
                                    </p>
                                    <p className="text-amber-700 text-sm mt-1">
                                        Cette facture ne peut pas être modifiée.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Sélection des travaux à facturer
                                </h2>

                                {workPeriods.length > 0 && !isLoading && (
                                    <button
                                        type="button"
                                        onClick={toggleAllWorkPeriods}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center ${
                                            workPeriods.every(period => period.selected)
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                    >
                                        <CheckIcon className="h-4 w-4 mr-1" />
                                        {workPeriods.every(period => period.selected)
                                            ? 'Désélectionner tout'
                                            : 'Sélectionner tout'
                                        }
                                    </button>
                                )}
                            </div>

                            {isLoadingTimeTracking ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                                    <p className="text-gray-600 mb-4">{loadingMessage}</p>
                                    {totalContracts > 0 && (
                                        <div className="max-w-md mx-auto">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>
                                                    {totalEmployees > 0
                                                        ? `Employés groupés: ${processedEmployees}/${totalEmployees}`
                                                        : `Contrats traités: ${processedContracts}/${totalContracts}`
                                                    }
                                                </span>
                                                <span>{loadingProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                                    style={{width: `${loadingProgress}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
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

                            {!isLoadingTimeTracking && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                                        Nom du chantier
                                    </label>
                                    <input
                                        type="text"
                                        name="chantier"
                                        value={invoiceData.chantier}
                                        onChange={handleInputChange}
                                        placeholder="Ex: SARCELLES - Chantier principal"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Date du chantier
                                    </label>
                                    <DatePicker
                                        selected={invoiceData.workSiteDate}
                                        onChange={(date) => handleDateChange(date, 'workSiteDate')}
                                        dateFormat="dd/MM/yyyy"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="lg:col-span-3 space-y-1">
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
                            )}

                            {/* Tableau des heures de pointage */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Heures de travail hebdomadaires
                                </h3>

                                {isLoadingTimeTracking ? (
                                    <>
                                        {/* Barre de progression en haut */}
                                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-blue-800 font-medium">{loadingMessage}</p>
                                                <span className="text-blue-600 text-sm font-medium">{loadingProgress}%</span>
                                            </div>
                                            <div className="w-full bg-blue-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                                    style={{width: `${loadingProgress}%`}}
                                                ></div>
                                            </div>
                                            {totalContracts > 0 && (
                                                <div className="flex justify-between text-xs text-blue-600 mt-2">
                                                    <span>
                                                        {totalEmployees > 0
                                                            ? `Employés groupés: ${processedEmployees}/${totalEmployees}`
                                                            : `Contrats traités: ${processedContracts}/${totalContracts}`
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Skeleton du tableau */}
                                        <div className="space-y-4">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center space-x-4 mb-4">
                                                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                                                        <div className="space-y-2">
                                                            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                                                            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-2">
                                                        {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                                            <div key={j} className="space-y-2">
                                                                <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                                                                <div className="w-12 h-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
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
                                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jours</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrat(s)</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total heures</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Normal</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sup x1.25</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sup x1.50</th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant total</th>
                                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {Object.entries(employeeData.weeklyData)
                                                                .filter(([weekKey, weekEntries]) => {
                                                                    if (isFinalized) {
                                                                        // Pour les factures finalisées, toutes les entrées sont valides
                                                                        return weekEntries && (weekEntries.weekEntries?.length > 0 || Array.isArray(weekEntries) && weekEntries.length > 0);
                                                                    } else {
                                                                        // Pour les factures en cours, filtrer normalement
                                                                        return weekEntries.length > 0;
                                                                    }
                                                                })
                                                                .sort(([weekKeyA], [weekKeyB]) => weekKeyA.localeCompare(weekKeyB))
                                                                .map(([weekKey, weekEntries], weekIndex) => {
                                                                    let weekCalculation, weekRange;
                                                                    
                                                                    if (isFinalized && weekEntries.weekCalculation) {
                                                                        // Pour les factures finalisées, utiliser les données sauvegardées
                                                                        weekCalculation = weekEntries.weekCalculation;
                                                                        weekRange = { displayKey: weekEntries.weekRange || weekKey };
                                                                    } else {
                                                                        // Pour les factures en cours, calculer en temps réel
                                                                        const firstEntry = Array.isArray(weekEntries) ? weekEntries[0] : weekEntries.weekEntries[0];
                                                                        if (firstEntry) {
                                                                            weekCalculation = firstEntry.weekCosts || calculateWeeklyOvertime(Array.isArray(weekEntries) ? weekEntries : weekEntries.weekEntries);
                                                                            weekRange = getWeekRange(new Date(firstEntry.date));
                                                                        } else {
                                                                            weekCalculation = { totalWeekHours: 0, normalHours: 0, overtime125: 0, overtime150: 0 };
                                                                            weekRange = { displayKey: weekKey };
                                                                        }
                                                                    }
                                                                    
                                                                    const isExpanded = expandedWeeks[`${employeeData.employee.id}-${weekKey}`];
                                                                    const actualWeekEntries = Array.isArray(weekEntries) ? weekEntries : (weekEntries.weekEntries || []);
                                                                    
                                                                    return (
                                                                        <React.Fragment key={weekKey}>
                                                                            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleWeekExpansion(employeeData.employee.id, weekKey)}>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                                    <div className="font-semibold">
                                                                                        {weekRange.displayKey}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                                        Semaine {weekIndex + 1}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                                                                    <div className="font-semibold text-lg text-blue-600">
                                                                                        {actualWeekEntries.length}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        jour(s)
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                                    <div className="space-y-1">
                                                                                        {[...new Set(actualWeekEntries.map(entry => entry.contractTitle))].map((contract, idx) => (
                                                                                            <div key={idx} className="text-xs truncate max-w-32" title={contract}>
                                                                                                {contract || 'Contrat non trouvé'}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                                    <div className="font-semibold text-lg">
                                                                                        {weekCalculation.totalWeekHours.toFixed(1)}h
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        Total
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
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                                    <div className="font-bold text-lg text-green-600">
                                                                                        {formatCurrency(weekCalculation.totalWeekAmount || 0)}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {weekCalculation.averageHourlyRate ? 
                                                                                            `${formatCurrency(weekCalculation.averageHourlyRate)}/h moy.` : 
                                                                                            'Taux non défini'
                                                                                        }
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                                    <button className="text-blue-600 hover:text-blue-800">
                                                                                        <ChevronDownIcon className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                            {isExpanded && (
                                                                                <tr>
                                                                                    <td colSpan="9" className="px-0 py-0">
                                                                                        <div className="bg-gray-50 border-l-4 border-blue-400">
                                                                                            <div className="px-6 py-4">
                                                                                                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                                                                    <CalendarIcon className="h-4 w-4 mr-2 text-blue-600" />
                                                                                                    Détail des journées - {weekRange.displayKey}
                                                                                                </h4>
                                                                                                <div className="space-y-3">
                                                                                                    {actualWeekEntries
                                                                                                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                                                                                                        .map((entry, idx) => (
                                                                                                        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                                                                                            <div className="flex justify-between items-start">
                                                                                                                <div className="flex-1">
                                                                                                                    <div className="flex items-center space-x-3 mb-2">
                                                                                                                        <span className="font-medium text-gray-900">
                                                                                                                            {formatDate(new Date(entry.date))}
                                                                                                                        </span>
                                                                                                                        <span className="text-sm text-gray-500">
                                                                                                                            {entry.startTime && entry.endTime 
                                                                                                                                ? `${entry.startTime} - ${entry.endTime}`
                                                                                                                                : 'Horaires non renseignés'
                                                                                                                            }
                                                                                                                        </span>
                                                                                                                        <span className="text-sm font-medium text-blue-600">
                                                                                                                            {(entry.totalHours || 0).toFixed(1)}h
                                                                                                                        </span>
                                                                                                                    </div>
                                                                                                                    <div className="text-sm text-gray-600 mb-1">
                                                                                                                        <strong>Contrat:</strong> {entry.contractTitle || 'Non renseigné'}
                                                                                                                    </div>
                                                                                                                    {entry.notes && (
                                                                                                                        <div className="text-sm text-gray-600 bg-gray-100 rounded p-2 mt-2">
                                                                                                                            <strong>Notes:</strong> {entry.notes}
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                                
                                                                                                {/* Résumé simple de la semaine */}
                                                                                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                                                    <div className="flex justify-between items-center text-sm">
                                                                                                        <span className="font-medium text-blue-900">
                                                                                                            Résumé semaine: {weekCalculation.totalWeekHours.toFixed(1)}h travaillées
                                                                                                        </span>
                                                                                                        <div className="flex space-x-3 text-xs">
                                                                                                            <span className="text-gray-700">
                                                                                                                {weekCalculation.normalHours.toFixed(1)}h normales
                                                                                                            </span>
                                                                                                            {weekCalculation.overtime125 > 0 && (
                                                                                                                <span className="text-orange-600">
                                                                                                                    {weekCalculation.overtime125.toFixed(1)}h sup (x1.25)
                                                                                                                </span>
                                                                                                            )}
                                                                                                            {weekCalculation.overtime150 > 0 && (
                                                                                                                <span className="text-red-600">
                                                                                                                    {weekCalculation.overtime150.toFixed(1)}h sup (x1.50)
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </React.Fragment>
                                                                    );
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Résumé employé */}
                                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {/* Heures */}
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2">Heures totales</h4>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Normales (x1.00):</span>
                                                                    <span className="font-medium">{employeeData.totals.normalHours.toFixed(1)}h</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-orange-600">Sup. (x1.25):</span>
                                                                    <span className="font-medium text-orange-600">{employeeData.totals.overtime125.toFixed(1)}h</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-red-600">Sup. (x1.50):</span>
                                                                    <span className="font-medium text-red-600">{employeeData.totals.overtime150.toFixed(1)}h</span>
                                                                </div>
                                                                <div className="pt-2 border-t border-gray-300 flex justify-between">
                                                                    <span className="font-bold">Total:</span>
                                                                    <span className="font-bold text-blue-600">{employeeData.totals.totalHours.toFixed(1)}h</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Montants */}
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2">Montants calculés</h4>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Normal:</span>
                                                                    <span className="font-medium">{formatCurrency(employeeData.totals.normalAmount)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-orange-600">Sup. (x1.25):</span>
                                                                    <span className="font-medium text-orange-600">{formatCurrency(employeeData.totals.overtime125Amount)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-red-600">Sup. (x1.50):</span>
                                                                    <span className="font-medium text-red-600">{formatCurrency(employeeData.totals.overtime150Amount)}</span>
                                                                </div>
                                                                <div className="pt-2 border-t border-gray-300 flex justify-between">
                                                                    <span className="font-bold">Total:</span>
                                                                    <span className="font-bold text-green-600 text-lg">{formatCurrency(employeeData.totals.totalAmount)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Informations */}
                                                        <div className="flex flex-col justify-center">
                                                            <div className="text-center p-3 bg-blue-100 rounded-lg">
                                                                <div className="text-2xl font-bold text-blue-600">
                                                                    {Object.keys(employeeData.weeklyData).filter(key => {
                                                                        const weekData = employeeData.weeklyData[key];
                                                                        if (isFinalized) {
                                                                            return weekData && (weekData.weekEntries?.length > 0 || Array.isArray(weekData) && weekData.length > 0);
                                                                        } else {
                                                                            return weekData.length > 0;
                                                                        }
                                                                    }).length}
                                                                </div>
                                                                <div className="text-xs text-blue-800">semaine(s) travaillée(s)</div>
                                                                <div className="text-xs text-gray-600 mt-1">
                                                                    {employeeData.totals.workingDays} jour(s) au total
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                                                        <div className="flex justify-between items-center">
                                                            <span>Règle: 35h normales/semaine, puis x1.25 jusqu'à 43h, puis x1.50</span>
                                                            <span className="font-medium">Période: {formatDate(invoiceData.periodStart)} - {formatDate(invoiceData.periodEnd)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {/* Récapitulatif final */}
                            {!isLoadingTimeTracking && (
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <BanknotesIcon className="h-5 w-5 mr-2 text-green-600" />
                                    Récapitulatif de la facture
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Informations générales */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Informations générales</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Client:</span>
                                                <span className="font-medium text-gray-900">
                                                    {(() => {
                                                        const client = clients.find(c => c.id === invoiceData.clientId);
                                                        if (!client) return 'Non sélectionné';
                                                        return client.companyName || client.contactName || `Client ${client.id}`;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Période de facturation:</span>
                                                <span className="font-medium text-gray-900">
                                                    {formatDate(invoiceData.periodStart)} - {formatDate(invoiceData.periodEnd)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Employés concernés:</span>
                                                <span className="font-medium text-gray-900">
                                                    {Object.keys(groupedTimeEntries).length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Semaines travaillées:</span>
                                                <span className="font-medium text-gray-900">
                                                    {Object.values(groupedTimeEntries).reduce((total, employeeData) => 
                                                        total + Object.keys(employeeData.weeklyData || {}).filter(key => {
                                                            const weekData = employeeData.weeklyData[key];
                                                            if (isFinalized) {
                                                                return weekData && (weekData.weekEntries?.length > 0 || Array.isArray(weekData) && weekData.length > 0);
                                                            } else {
                                                                return weekData.length > 0;
                                                            }
                                                        }).length, 0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Totaux calculés */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Totaux calculés</h4>
                                        <div className="space-y-2 text-sm">
                                            {(() => {
                                                const totals = Object.values(groupedTimeEntries).reduce((acc, employeeData) => ({
                                                    totalHours: acc.totalHours + (employeeData.totals?.totalHours || 0),
                                                    normalHours: acc.normalHours + (employeeData.totals?.normalHours || 0),
                                                    overtime125: acc.overtime125 + (employeeData.totals?.overtime125 || 0),
                                                    overtime150: acc.overtime150 + (employeeData.totals?.overtime150 || 0),
                                                    totalAmount: acc.totalAmount + (employeeData.totals?.totalAmount || 0),
                                                    normalAmount: acc.normalAmount + (employeeData.totals?.normalAmount || 0),
                                                    overtime125Amount: acc.overtime125Amount + (employeeData.totals?.overtime125Amount || 0),
                                                    overtime150Amount: acc.overtime150Amount + (employeeData.totals?.overtime150Amount || 0)
                                                }), {
                                                    totalHours: 0, normalHours: 0, overtime125: 0, overtime150: 0,
                                                    totalAmount: 0, normalAmount: 0, overtime125Amount: 0, overtime150Amount: 0
                                                });

                                                return (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Heures totales:</span>
                                                            <span className="font-medium text-gray-900">{totals.totalHours.toFixed(1)}h</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">- Heures normales:</span>
                                                            <span className="text-gray-700">{totals.normalHours.toFixed(1)}h</span>
                                                        </div>
                                                        {totals.overtime125 > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-orange-600">- Heures sup (x1.25):</span>
                                                                <span className="text-orange-600">{totals.overtime125.toFixed(1)}h</span>
                                                            </div>
                                                        )}
                                                        {totals.overtime150 > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-red-600">- Heures sup (x1.50):</span>
                                                                <span className="text-red-600">{totals.overtime150.toFixed(1)}h</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-2 border-t border-gray-300">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Montant normal:</span>
                                                                <span className="font-medium">{formatCurrency(totals.normalAmount)}</span>
                                                            </div>
                                                            {totals.overtime125Amount > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-orange-600">Montant sup (x1.25):</span>
                                                                    <span className="text-orange-600 font-medium">{formatCurrency(totals.overtime125Amount)}</span>
                                                                </div>
                                                            )}
                                                            {totals.overtime150Amount > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-red-600">Montant sup (x1.50):</span>
                                                                    <span className="text-red-600 font-medium">{formatCurrency(totals.overtime150Amount)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Total final */}
                                <div className="mt-6 pt-4 border-t border-gray-300">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-gray-900">Montant total de la facture:</span>
                                        <span className="text-2xl font-bold text-green-600">
                                            {formatCurrency(Object.values(groupedTimeEntries).reduce((total, employeeData) => 
                                                total + (employeeData.totals?.totalAmount || 0), 0
                                            ))}
                                        </span>
                                    </div>
                                </div>

                                {/* Informations facture */}
                                <div className="mt-6 pt-4 border-t border-gray-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                        <div>
                                            <p><strong>Numéro de facture:</strong> {invoiceData.invoiceNumber}</p>
                                            <p><strong>Date de facture:</strong> {formatDate(invoiceData.invoiceDate)}</p>
                                        </div>
                                        <div>
                                            <p><strong>Date d'échéance:</strong> {formatDate(invoiceData.dueDate)}</p>
                                            {invoiceData.notes && (
                                                <p><strong>Notes:</strong> {invoiceData.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}
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
                                    disabled={isLoading}
                                    className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
                                        isLoading 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isLoadingTimeTracking ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                                            Chargement...
                                        </>
                                    ) : (
                                        <>
                                            Suivant
                                            <ChevronRightIcon className="h-5 w-5 ml-2" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isLoadingTimeTracking || isEdit}
                                    className={`flex items-center px-8 py-2 rounded-lg transition-colors ${
                                        isSubmitting || isEdit
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {isEdit ? (
                                        <>
                                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                            Facture non modifiable
                                        </>
                                    ) : isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <CheckIcon className="h-5 w-5 mr-2" />
                                            Créer la facture
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