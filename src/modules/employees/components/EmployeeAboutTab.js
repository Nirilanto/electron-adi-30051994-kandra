// src/modules/employees/components/EmployeeAboutTab.js
import React from 'react';
import { 
  IdentificationIcon,
  AcademicCapIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import InfoCard, { InfoItem, InfoGrid } from './InfoCard';

const EmployeeAboutTab = ({ employee }) => {
  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour formater la monnaie
  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Documents d'identité */}
      <InfoCard
        title="Documents d'identité"
        icon={IdentificationIcon}
        gradient="from-indigo-500 to-purple-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Type de document"
            value={employee.idCardType}
            type="highlight"
          />
          <InfoItem
            label="Numéro de document"
            value={employee.idCardNumber}
            type={employee.idCardNumber ? "success" : "default"}
          />
          <InfoItem
            label="Date de délivrance"
            value={formatDate(employee.idCardIssueDate)}
            icon={CalendarIcon}
          />
          <InfoItem
            label="Date d'expiration"
            value={formatDate(employee.idCardExpiryDate)}
            icon={CalendarIcon}
            type={employee.idCardExpiryDate && new Date(employee.idCardExpiryDate) < new Date() ? "warning" : "default"}
          />
          <InfoItem
            label="Lieu de délivrance"
            value={employee.idCardIssuePlace}
            className="md:col-span-2"
          />
        </InfoGrid>
      </InfoCard>

      {/* Informations professionnelles */}
      <InfoCard
        title="Informations professionnelles"
        icon={AcademicCapIcon}
        gradient="from-blue-500 to-cyan-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Numéro d'employé"
            value={employee.employeeNumber}
            type="highlight"
          />
          <InfoItem
            label="Qualification"
            value={employee.qualification}
            type="success"
          />
          <InfoItem
            label="Date d'embauche"
            value={formatDate(employee.hireDate)}
            icon={CalendarIcon}
          />
          <InfoItem
            label="Taux horaire"
            value={formatCurrency(employee.hourlyRate)}
            icon={CurrencyEuroIcon}
            type="highlight"
          />
          <InfoItem
            label="Compétences"
            value={employee.skills || 'Aucune compétence renseignée'}
            className="md:col-span-2"
          />
        </InfoGrid>
      </InfoCard>

      {/* Informations de paiement */}
      <InfoCard
        title="Informations de paiement"
        icon={BanknotesIcon}
        gradient="from-green-500 to-teal-600"
      >
        <InfoGrid columns={3}>
          <InfoItem
            label="Mode de paiement"
            value={employee.paymentMethod}
            type="highlight"
          />
          <InfoItem
            label="Taux prélèvement source"
            value={employee.taxWithholding ? `${employee.taxWithholding}%` : '-'}
          />
          <InfoItem
            label="Mutuelle"
            value={employee.mutualInsurance ? 'Oui' : 'Non'}
            icon={employee.mutualInsurance ? CheckCircleIcon : XCircleIcon}
            type={employee.mutualInsurance ? "success" : "default"}
          />
        </InfoGrid>
      </InfoCard>

      {/* Informations administratives */}
      <InfoCard
        title="Informations administratives"
        icon={DocumentTextIcon}
        gradient="from-orange-500 to-red-600"
      >
        <InfoGrid columns={3}>
          <InfoItem
            label="Carte BTP"
            value={employee.constructionCard}
            type={employee.constructionCard ? "success" : "default"}
          />
          <InfoItem
            label="Numéro URSSAF"
            value={employee.urssafNumber}
            type={employee.urssafNumber ? "success" : "default"}
          />
          <InfoItem
            label="Numéro ASSEDIC"
            value={employee.assedicNumber}
            type={employee.assedicNumber ? "success" : "default"}
          />
        </InfoGrid>
      </InfoCard>

      {/* Notes */}
      {employee.notes && (
        <InfoCard
          title="Notes et commentaires"
          icon={ClipboardDocumentListIcon}
          gradient="from-gray-500 to-slate-600"
        >
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/50 rounded-xl p-6">
            <div className="flex items-start">
              <ClipboardDocumentListIcon className="h-6 w-6 text-gray-600 mr-3 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-3">Commentaires divers</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {employee.notes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </InfoCard>
      )}
    </div>
  );
};

export default EmployeeAboutTab;