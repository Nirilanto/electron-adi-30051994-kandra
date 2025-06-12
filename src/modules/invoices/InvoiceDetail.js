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
    DocumentTextIcon
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
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                                    {getStatusIcon(invoice.status)}
                                    <span className="ml-2">{getStatusText(invoice.status)}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                {/* Actions rapides de statut */}
                                {invoice.status === 'draft' && (
                                    <button
                                        onClick={() => handleStatusChange('sent')}
                                        disabled={isUpdatingStatus}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Marquer comme envoyée
                                    </button>
                                )}

                                {invoice.status === 'sent' && (
                                    <button
                                        onClick={() => handleStatusChange('paid')}
                                        disabled={isUpdatingStatus}
                                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                    >
                                        Marquer comme payée
                                    </button>
                                )}

                                <button
                                    onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Modifier"
                                >
                                    <PencilSquareIcon className="h-5 w-5" />
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

                        {/* Détail des prestations */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Détail des prestations
                                </h2>
                            </div>
                            <div className="p-6">
                                {invoice.workPeriods && invoice.workPeriods.length > 0 ? (
                                    <div className="space-y-4">
                                        {invoice.workPeriods.map((period, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{period.description}</h4>
                                                        <p className="text-sm text-gray-600 flex items-center mt-1">
                                                            <UserIcon className="h-4 w-4 mr-1" />
                                                            {period.employeeName}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                                            {period.location && ` • ${period.location}`}
                                                        </p>
                                                        <div className="mt-2 text-sm text-gray-600">
                                                            <span>{period.totalHours}h × {formatCurrency(period.hourlyRate)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium text-gray-900">
                                                            {formatCurrency(period.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        Aucune prestation détaillée
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
                                        {formatCurrency(invoice.totalAmount || invoice.total_amount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={isGeneratingPDF}
                                    className={`w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                    {isGeneratingPDF ? 'Génération...' : 'Télécharger PDF'}
                                </button>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Changer le statut:</p>
                                    <select
                                        value={invoice.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        disabled={isUpdatingStatus}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="draft">Brouillon</option>
                                        <option value="sent">Envoyée</option>
                                        <option value="paid">Payée</option>
                                        <option value="overdue">En retard</option>
                                        <option value="rejected">Refusée</option>
                                    </select>
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