// src/modules/clients/components/ClientAboutTab.js
import React from 'react';
import { 
  CurrencyEuroIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import InfoCard, { InfoItem, InfoGrid } from '../../employees/components/InfoCard';

const ClientAboutTab = ({ client }) => {
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
      {/* Informations financières */}
      <InfoCard
        title="Informations financières"
        icon={BanknotesIcon}
        gradient="from-green-500 to-teal-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Chiffre d'affaires annuel"
            value={formatCurrency(client.annualRevenue)}
            icon={ChartBarIcon}
            type={client.annualRevenue ? "highlight" : "default"}
          />
          <InfoItem
            label="Capital social"
            value={formatCurrency(client.capital)}
            icon={CurrencyEuroIcon}
            type={client.capital ? "success" : "default"}
          />
          <InfoItem
            label="Conditions de paiement"
            value={client.paymentTerms}
            icon={CalendarIcon}
          />
          <InfoItem
            label="Mode de paiement préféré"
            value={client.preferredPaymentMethod}
            icon={BanknotesIcon}
          />
          <InfoItem
            label="Limite de crédit"
            value={formatCurrency(client.creditLimit)}
            icon={CurrencyEuroIcon}
            type={client.creditLimit ? "warning" : "default"}
          />
          <InfoItem
            label="Délai de paiement moyen"
            value={client.averagePaymentDelay ? `${client.averagePaymentDelay} jours` : null}
            icon={CalendarIcon}
          />
        </InfoGrid>
      </InfoCard>

      {/* Informations commerciales */}
      <InfoCard
        title="Informations commerciales"
        icon={TrophyIcon}
        gradient="from-purple-500 to-indigo-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Date de premier contact"
            value={formatDate(client.firstContactDate)}
            icon={CalendarIcon}
          />
          <InfoItem
            label="Date de premier contrat"
            value={formatDate(client.firstContractDate)}
            icon={CalendarIcon}
          />
          <InfoItem
            label="Commercial responsable"
            value={client.accountManager}
            icon={UserGroupIcon}
            type={client.accountManager ? "highlight" : "default"}
          />
          <InfoItem
            label="Source de prospection"
            value={client.leadSource}
            icon={DocumentTextIcon}
          />
          <InfoItem
            label="Niveau de priorité"
            value={client.priority}
            icon={StarIcon}
            type={client.priority === 'High' ? "warning" : client.priority === 'Medium' ? "highlight" : "default"}
          />
          <InfoItem
            label="Statut commercial"
            value={client.commercialStatus}
            icon={TrophyIcon}
          />
        </InfoGrid>
      </InfoCard>

      {/* Contacts additionnels */}
      {(client.contacts && client.contacts.length > 0) && (
        <InfoCard
          title="Contacts additionnels"
          icon={UserGroupIcon}
          gradient="from-blue-500 to-cyan-600"
        >
          <div className="space-y-4">
            {client.contacts.map((contact, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoItem
                    label="Nom"
                    value={contact.name}
                    type="highlight"
                  />
                  <InfoItem
                    label="Fonction"
                    value={contact.position}
                  />
                  <InfoItem
                    label="Email"
                    value={contact.email}
                    icon={EnvelopeIcon}
                  />
                  <InfoItem
                    label="Téléphone"
                    value={contact.phone}
                    icon={PhoneIcon}
                  />
                  <InfoItem
                    label="Mobile"
                    value={contact.mobile}
                    icon={PhoneIcon}
                  />
                  <InfoItem
                    label="Département"
                    value={contact.department}
                  />
                </div>
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Préférences et besoins */}
      <InfoCard
        title="Préférences et besoins"
        icon={StarIcon}
        gradient="from-indigo-500 to-purple-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Types de services préférés"
            value={client.preferredServices}
            className="md:col-span-2"
          />
          <InfoItem
            label="Budget annuel estimé"
            value={formatCurrency(client.estimatedAnnualBudget)}
            icon={CurrencyEuroIcon}
            type={client.estimatedAnnualBudget ? "highlight" : "default"}
          />
          <InfoItem
            label="Fréquence de commande"
            value={client.orderFrequency}
            icon={CalendarIcon}
          />
          <InfoItem
            label="Jour de commande préféré"
            value={client.preferredOrderDay}
            icon={CalendarIcon}
          />
          <InfoItem
            label="Heure de livraison préférée"
            value={client.preferredDeliveryTime}
            icon={CalendarIcon}
          />
        </InfoGrid>
      </InfoCard>

      {/* Historique et performance */}
      <InfoCard
        title="Historique et performance"
        icon={ChartBarIcon}
        gradient="from-orange-500 to-red-600"
      >
        <InfoGrid columns={3}>
          <InfoItem
            label="Nombre de contrats"
            value={client.contractCount || '0'}
            icon={DocumentTextIcon}
            type="highlight"
          />
          <InfoItem
            label="CA total généré"
            value={formatCurrency(client.totalRevenue)}
            icon={CurrencyEuroIcon}
            type={client.totalRevenue ? "success" : "default"}
          />
          <InfoItem
            label="Note de satisfaction"
            value={client.satisfactionRating ? `${client.satisfactionRating}/5` : null}
            icon={StarIcon}
            type={client.satisfactionRating >= 4 ? "success" : client.satisfactionRating >= 3 ? "highlight" : "warning"}
          />
          <InfoItem
            label="Dernière commande"
            value={formatDate(client.lastOrderDate)}
            icon={CalendarIcon}
          />
          <InfoItem
            label="Prochaine échéance"
            value={formatDate(client.nextRenewalDate)}
            icon={CalendarIcon}
            type={client.nextRenewalDate ? "warning" : "default"}
          />
          <InfoItem
            label="Statut du compte"
            value={client.accountStatus}
            type={client.accountStatus === 'Active' ? "success" : client.accountStatus === 'Pending' ? "warning" : "default"}
          />
        </InfoGrid>
      </InfoCard>

      {/* Notes et commentaires */}
      {client.notes && (
        <InfoCard
          title="Notes et commentaires"
          icon={ClipboardDocumentListIcon}
          gradient="from-gray-500 to-slate-600"
        >
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/50 rounded-xl p-6">
            <div className="flex items-start">
              <ClipboardDocumentListIcon className="h-6 w-6 text-gray-600 mr-3 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-3">Commentaires et observations</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {client.notes}
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

export default ClientAboutTab;