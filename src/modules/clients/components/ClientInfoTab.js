// src/modules/clients/components/ClientInfoTab.js
import React from 'react';
import { 
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  UserIcon,
  GlobeEuropeAfricaIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import InfoCard, { InfoItem, InfoGrid } from '../../employees/components/InfoCard';

const ClientInfoTab = ({ client }) => {
  // Fonction pour formater l'adresse complète
  const formatAddress = () => {
    const postalCode = client.postalCode || client.postal_code;
    const addressParts = [
      client.address,
      client.addressComplement,
      postalCode && client.city ? `${postalCode} ${client.city}` : '',
      client.country !== 'France' ? client.country : ''
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join('\n') : 'Aucune adresse renseignée';
  };

  // Support des deux formats de noms de champs
  const companyName = client.companyName || client.company_name || 'Entreprise inconnue';
  const contactName = client.contactName || client.contact_name;

  return (
    <div className="space-y-8 p-6">
      {/* Informations de l'entreprise */}
      <InfoCard
        title="Informations de l'entreprise"
        icon={BuildingOfficeIcon}
        gradient="from-blue-500 to-indigo-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Nom de l'entreprise"
            value={companyName}
            type="highlight"
          />
          <InfoItem
            label="Forme juridique"
            value={client.legalForm || client.companyType}
            icon={BuildingOfficeIcon}
          />
          <InfoItem
            label="Secteur d'activité"
            value={client.sector || client.industry}
            icon={BuildingOfficeIcon}
          />
          <InfoItem
            label="Taille de l'entreprise"
            value={client.companySize}
            icon={UserIcon}
          />
          <InfoItem
            label="Site web"
            value={client.website}
            icon={GlobeEuropeAfricaIcon}
            type={client.website ? "success" : "default"}
          />
          <InfoItem
            label="Date de création"
            value={client.foundedDate ? new Date(client.foundedDate).toLocaleDateString('fr-FR') : null}
          />
        </InfoGrid>
      </InfoCard>

      {/* Informations légales */}
      <InfoCard
        title="Informations légales"
        icon={IdentificationIcon}
        gradient="from-purple-500 to-pink-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="SIRET"
            value={client.siret}
            icon={IdentificationIcon}
            type={client.siret ? "success" : "default"}
          />
          <InfoItem
            label="Code APE"
            value={client.apeCode || client.ape_code}
            icon={IdentificationIcon}
          />
          <InfoItem
            label="N° TVA Intracommunautaire"
            value={client.vatNumber || client.vat_number}
            icon={IdentificationIcon}
          />
          <InfoItem
            label="RCS"
            value={client.rcs}
            icon={IdentificationIcon}
          />
          <InfoItem
            label="Capital social"
            value={client.capital ? `${client.capital}€` : null}
            type={client.capital ? "highlight" : "default"}
          />
          <InfoItem
            label="URSSAF"
            value={client.urssafNumber || client.urssaf_number}
            icon={IdentificationIcon}
          />
        </InfoGrid>
      </InfoCard>

      {/* Contact principal */}
      <InfoCard
        title="Contact principal"
        icon={UserIcon}
        gradient="from-green-500 to-emerald-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Nom du contact"
            value={contactName}
            icon={UserIcon}
            type={contactName ? "highlight" : "default"}
          />
          <InfoItem
            label="Fonction"
            value={client.contactPosition || client.contactTitle || client.contact_title}
            icon={UserIcon}
          />
          <InfoItem
            label="Téléphone"
            value={client.phone}
            icon={PhoneIcon}
            type={client.phone ? "success" : "default"}
          />
          <InfoItem
            label="Mobile"
            value={client.mobile}
            icon={PhoneIcon}
            type={client.mobile ? "success" : "default"}
          />
          <InfoItem
            label="Email"
            value={client.email}
            icon={EnvelopeIcon}
            type={client.email ? "highlight" : "default"}
            className="md:col-span-2"
          />
        </InfoGrid>
      </InfoCard>

      {/* Adresse */}
      <InfoCard
        title="Adresse du siège social"
        icon={MapPinIcon}
        gradient="from-orange-500 to-red-600"
      >
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-xl p-6">
          <div className="flex items-start">
            <MapPinIcon className="h-6 w-6 text-orange-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-orange-900 mb-2">Adresse complète</h4>
              <pre className="text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                {formatAddress()}
              </pre>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );
};

export default ClientInfoTab;