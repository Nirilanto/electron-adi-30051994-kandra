// src/modules/invoices/InvoiceDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    DocumentArrowDownIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    BuildingOfficeIcon,
    UserIcon,
    CalendarIcon,
    BanknotesIcon,
    DocumentTextIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import InvoiceService from './InvoiceService';
import InvoicePDFGenerator from './InvoicePDFGenerator';

function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState({});

    useEffect(() => {
        loadInvoice();
    }, [id]);

    const loadInvoice = async () => {
        try {
            setIsLoading(true);
            const invoiceData = await InvoiceService.getInvoiceById(id);
            if (invoiceData) {
                setInvoice(invoiceData);
            } else {
                toast.error('Facture non trouvée');
                navigate('/invoices');
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la facture:', error);
            toast.error('Erreur lors du chargement de la facture');
            navigate('/invoices');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!invoice) return;

        try {
            setIsUpdatingStatus(true);
            await InvoiceService.updateInvoiceStatus(invoice.id, newStatus);
            setInvoice(prev => ({ ...prev, status: newStatus }));
            toast.success('Statut mis à jour avec succès');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
            try {
                await InvoiceService.deleteInvoice(id);
                toast.success('Facture supprimée avec succès');
                navigate('/invoices');
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                toast.error('Erreur lors de la suppression de la facture');
            }
        }
    };

    const handleGeneratePDF = async () => {
        if (!invoice) return;

        try {
            setIsGeneratingPDF(true);

            // Récupérer les données du client si nécessaire
            const client = invoice.client || {
                companyName: invoice.clientCompany,
                contactName: invoice.clientName,
                email: invoice.clientEmail,
                phone: invoice.clientPhone,
                address: invoice.clientAddress,
                city: invoice.clientCity,
                postalCode: invoice.clientPostalCode
            };

            // Données de l'entreprise (à adapter selon vos besoins)
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

            const result = await InvoicePDFGenerator.generateInvoicePDF(
                invoice,
                client,
                company
            );

            if (result.success) {
                toast.success('PDF généré avec succès');
            } else {
                toast.error('Erreur lors de la génération du PDF');
            }
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            toast.error('Erreur lors de la génération du PDF');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800 border-green-200';
            case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
            case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'rejected': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <CheckCircleIcon className="h-5 w-5" />;
            case 'sent': return <ClockIcon className="h-5 w-5" />;
            case 'overdue': return <ExclamationTriangleIcon className="h-5 w-5" />;
            case 'draft': return <DocumentTextIcon className="h-5 w-5" />;
            case 'rejected': return <XCircleIcon className="h-5 w-5" />;
            default: return <DocumentTextIcon className="h-5 w-5" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid': return 'Payée';
            case 'sent': return 'Envoyée';
            case 'overdue': return 'En retard';
            case 'draft': return 'Brouillon';
            case 'rejected': return 'Refusée';
            default: return 'Inconnu';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const toggleWeekExpansion = (employeeId, weekKey) => {
        const key = `${employeeId}-${weekKey}`;
        setExpandedWeeks(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement</h3>
                    <p className="text-gray-600">Récupération de la facture...</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Facture non trouvée</h3>
                    <p className="mt-1 text-gray-500">Cette facture n'existe pas ou a été supprimée.</p>
                    <button
                        onClick={() => navigate('/invoices')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retour aux factures
                    </button>
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
                                        Facture {invoice.invoiceNumber || invoice.invoice_number}
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        {invoice.clientCompany || invoice.client?.companyName}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={isGeneratingPDF}
                                    className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                    {isGeneratingPDF ? 'Génération...' : 'Télécharger PDF'}
                                </button>

                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informations principales */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Informations client */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Informations client
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Entreprise</p>
                                        <p className="text-gray-900 font-medium">
                                            {invoice.clientCompany || invoice.client?.companyName || 'Non renseigné'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Contact</p>
                                        <p className="text-gray-900">
                                            {invoice.clientName || invoice.client?.contactName || 'Non renseigné'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="text-gray-900">
                                            {invoice.clientEmail || invoice.client?.email || 'Non renseigné'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Téléphone</p>
                                        <p className="text-gray-900">
                                            {invoice.clientPhone || invoice.client?.phone || 'Non renseigné'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Heures de travail hebdomadaires */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Heures de travail hebdomadaires
                                </h2>
                            </div>
                            <div className="p-6">
                                {invoice.employeesData && invoice.employeesData.length > 0 ? (
                                    <div className="space-y-6">
                                        {invoice.employeesData.map((employeeData) => (
                                            <div key={employeeData.employeeId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                {/* En-tête employé */}
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 flex items-center">
                                                                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                                                                {employeeData.employee?.firstName} {employeeData.employee?.lastName}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {employeeData.totals?.workingDays} jour(s) travaillé(s)
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-blue-600">
                                                                {employeeData.totals?.totalHours?.toFixed(1)}h
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
                                                            {Object.entries(employeeData.weeklyData || {})
                                                                .filter(([weekKey, weekData]) => weekData && weekData.weekEntries?.length > 0)
                                                                .sort(([weekKeyA], [weekKeyB]) => weekKeyA.localeCompare(weekKeyB))
                                                                .map(([weekKey, weekData], weekIndex) => {
                                                                    const isExpanded = expandedWeeks[`${employeeData.employeeId}-${weekKey}`];
                                                                    const weekCalculation = weekData.weekCalculation || {};
                                                                    const weekEntries = weekData.weekEntries || [];
                                                                    
                                                                    return (
                                                                        <React.Fragment key={weekKey}>
                                                                            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleWeekExpansion(employeeData.employeeId, weekKey)}>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                                    <div className="font-semibold">
                                                                                        {weekKey}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                                        Semaine {weekIndex + 1}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                                                                    <div className="font-semibold text-lg text-blue-600">
                                                                                        {weekEntries.length}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        jour(s)
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                                    <div className="space-y-1">
                                                                                        {[...new Set(weekEntries.map(entry => entry.contractTitle))].map((contract, idx) => (
                                                                                            <div key={idx} className="text-xs truncate max-w-32" title={contract}>
                                                                                                {contract || 'Contrat non trouvé'}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                                    <div className="font-semibold text-lg">
                                                                                        {weekCalculation.totalWeekHours?.toFixed(1) || '0.0'}h
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        Total
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                                    <div className="font-semibold">
                                                                                        {weekCalculation.normalHours?.toFixed(1) || '0.0'}h
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        x1.00
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right font-medium">
                                                                                    <div className="font-bold">
                                                                                        {weekCalculation.overtime125?.toFixed(1) || '0.0'}h
                                                                                    </div>
                                                                                    <div className="text-xs text-orange-500">
                                                                                        x1.25
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                                                                                    <div className="font-bold">
                                                                                        {weekCalculation.overtime150?.toFixed(1) || '0.0'}h
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
                                                                                                    Détail des journées - {weekKey}
                                                                                                </h4>
                                                                                                <div className="space-y-3">
                                                                                                    {weekEntries
                                                                                                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                                                                                                        .map((entry, idx) => (
                                                                                                        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                                                                                            <div className="flex justify-between items-start">
                                                                                                                <div className="flex-1">
                                                                                                                    <div className="flex items-center space-x-3 mb-2">
                                                                                                                        <span className="font-medium text-gray-900">
                                                                                                                            {formatDate(entry.date)}
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
                                                                                                            Résumé semaine: {weekCalculation.totalWeekHours?.toFixed(1) || '0.0'}h travaillées
                                                                                                        </span>
                                                                                                        <div className="flex space-x-3 text-xs">
                                                                                                            <span className="text-gray-700">
                                                                                                                {weekCalculation.normalHours?.toFixed(1) || '0.0'}h normales
                                                                                                            </span>
                                                                                                            {(weekCalculation.overtime125 || 0) > 0 && (
                                                                                                                <span className="text-orange-600">
                                                                                                                    {weekCalculation.overtime125.toFixed(1)}h sup (x1.25)
                                                                                                                </span>
                                                                                                            )}
                                                                                                            {(weekCalculation.overtime150 || 0) > 0 && (
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
                                                                    <span className="font-medium">{employeeData.totals?.normalHours?.toFixed(1) || '0.0'}h</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-orange-600">Sup. (x1.25):</span>
                                                                    <span className="font-medium text-orange-600">{employeeData.totals?.overtime125?.toFixed(1) || '0.0'}h</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-red-600">Sup. (x1.50):</span>
                                                                    <span className="font-medium text-red-600">{employeeData.totals?.overtime150?.toFixed(1) || '0.0'}h</span>
                                                                </div>
                                                                <div className="pt-2 border-t border-gray-300 flex justify-between">
                                                                    <span className="font-bold">Total:</span>
                                                                    <span className="font-bold text-blue-600">{employeeData.totals?.totalHours?.toFixed(1) || '0.0'}h</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Montants */}
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2">Montants calculés</h4>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Normal:</span>
                                                                    <span className="font-medium">{formatCurrency(employeeData.totals?.normalAmount || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-orange-600">Sup. (x1.25):</span>
                                                                    <span className="font-medium text-orange-600">{formatCurrency(employeeData.totals?.overtime125Amount || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-red-600">Sup. (x1.50):</span>
                                                                    <span className="font-medium text-red-600">{formatCurrency(employeeData.totals?.overtime150Amount || 0)}</span>
                                                                </div>
                                                                <div className="pt-2 border-t border-gray-300 flex justify-between">
                                                                    <span className="font-bold">Total:</span>
                                                                    <span className="font-bold text-green-600 text-lg">{formatCurrency(employeeData.totals?.totalAmount || 0)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Informations */}
                                                        <div className="flex flex-col justify-center">
                                                            <div className="text-center p-3 bg-blue-100 rounded-lg">
                                                                <div className="text-2xl font-bold text-blue-600">
                                                                    {Object.keys(employeeData.weeklyData || {}).filter(key => employeeData.weeklyData[key]?.weekEntries?.length > 0).length}
                                                                </div>
                                                                <div className="text-xs text-blue-800">semaine(s) travaillée(s)</div>
                                                                <div className="text-xs text-gray-600 mt-1">
                                                                    {employeeData.totals?.workingDays || 0} jour(s) au total
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                                                        <div className="flex justify-between items-center">
                                                            <span>Règle: 35h normales/semaine, puis x1.25 jusqu'à 43h, puis x1.50</span>
                                                            <span className="font-medium">Période: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        Aucune donnée de pointage disponible
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Informations facture */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <BanknotesIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Informations facture
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Numéro</p>
                                    <p className="text-gray-900 font-medium">
                                        {invoice.invoiceNumber || invoice.invoice_number}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date de facture</p>
                                    <p className="text-gray-900">
                                        {formatDate(invoice.invoiceDate || invoice.invoice_date)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date d'échéance</p>
                                    <p className="text-gray-900">
                                        {formatDate(invoice.dueDate || invoice.due_date)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500">Période</p>
                                    <p className="text-gray-900">
                                        {formatDate(invoice.periodStart || invoice.period_start)} - {formatDate(invoice.periodEnd || invoice.period_end)}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-500">Montant total</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(
                                            invoice.globalTotals?.totalAmount || 
                                            (invoice.employeesData ? 
                                                invoice.employeesData.reduce((sum, emp) => sum + (emp.totals?.totalAmount || 0), 0) :
                                                invoice.totalAmount || invoice.total_amount
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
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

export default InvoiceDetail;