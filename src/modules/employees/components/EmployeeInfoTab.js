// src/modules/employees/components/EmployeeInfoTab.js
import React from 'react';
import { 
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeEuropeAfricaIcon
} from '@heroicons/react/24/outline';
import InfoCard, { InfoItem, InfoGrid } from './InfoCard';

const EmployeeInfoTab = ({ employee }) => {
  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour formater l'adresse complète
  const formatAddress = () => {
    const addressParts = [
      employee.address,
      employee.addressComplement,
      employee.postalCode && employee.city ? `${employee.postalCode} ${employee.city}` : '',
      employee.country !== 'France' ? employee.country : ''
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join('\n') : 'Aucune adresse renseignée';
  };

  return (
    <div className="space-y-8 p-6">
      {/* Informations personnelles */}
      <InfoCard
        title="Informations personnelles"
        icon={UserIcon}
        gradient="from-blue-500 to-indigo-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Civilité"
            value={employee.gender === 'M' ? 'Monsieur' : 'Madame'}
            type="highlight"
          />
          <InfoItem
            label="Nom de jeune fille"
            value={employee.maidenName}
          />
          <InfoItem
            label="Date de naissance"
            value={formatDate(employee.birthDate)}
            icon={UserIcon}
          />
          <InfoItem
            label="Ville de naissance"
            value={employee.birthCity}
            icon={MapPinIcon}
          />
          <InfoItem
            label="Nationalité"
            value={employee.nationality}
            icon={GlobeEuropeAfricaIcon}
          />
          <InfoItem
            label="Situation familiale"
            value={employee.familyStatus}
          />
          <InfoItem
            label="N° sécurité sociale"
            value={employee.socialSecurityNumber}
            type={employee.socialSecurityNumber ? "success" : "default"}
          />
          <InfoItem
            label="Date disponible"
            value={formatDate(employee.availableDate)}
            type={employee.availableDate ? "highlight" : "default"}
          />
        </InfoGrid>
      </InfoCard>

      {/* Informations de contact */}
      <InfoCard
        title="Contact"
        icon={PhoneIcon}
        gradient="from-green-500 to-emerald-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Téléphone fixe"
            value={employee.phone}
            icon={PhoneIcon}
            type={employee.phone ? "success" : "default"}
          />
          <InfoItem
            label="Téléphone mobile"
            value={employee.mobile}
            icon={DevicePhoneMobileIcon}
            type={employee.mobile ? "success" : "default"}
          />
          <InfoItem
            label="Adresse email"
            value={employee.email}
            icon={EnvelopeIcon}
            type={employee.email ? "highlight" : "default"}
            className="md:col-span-2"
          />
        </InfoGrid>
      </InfoCard>

      {/* Adresse */}
      <InfoCard
        title="Adresse postale"
        icon={MapPinIcon}
        gradient="from-purple-500 to-pink-600"
      >
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl p-6">
          <div className="flex items-start">
            <MapPinIcon className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">Adresse complète</h4>
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

export default EmployeeInfoTab;