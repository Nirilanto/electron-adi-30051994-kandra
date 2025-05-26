// src/modules/contracts/components/ContractDetailsTab.js
import React from 'react';
import { 
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UserIcon,
  IdentificationIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import InfoCard, { InfoItem, InfoGrid } from '../../employees/components/InfoCard';

const ContractDetailsTab = ({ contract }) => {
  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour calculer la durée
  const calculateDuration = () => {
    if (!contract.startDate || !contract.endDate) return '-';
    
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      return `${months} mois${remainingDays > 0 ? ` et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}` : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      const months = Math.floor(remainingDays / 30);
      return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` et ${months} mois` : ''}`;
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Informations générales */}
      <InfoCard
        title="Informations générales"
        icon={DocumentTextIcon}
        gradient="from-blue-500 to-indigo-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Titre du contrat"
            value={contract.title}
            type="highlight"
          />
          <InfoItem
            label="Numéro de contrat"
            value={contract.contractNumber ? `N° ${contract.contractNumber}` : null}
            icon={IdentificationIcon}
            type="success"
          />
          <InfoItem
            label="Lieu de mission"
            value={contract.location}
            icon={MapPinIcon}
          />
          <InfoItem
            label="Statut"
            value={(() => {
              if (!contract.endDate) return 'En cours';
              const today = new Date();
              const endDate = new Date(contract.endDate);
              if (endDate < today) return 'Expiré';
              const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
              return daysLeft <= 7 ? 'Bientôt expiré' : 'Actif';
            })()}
            type={(() => {
              if (!contract.endDate) return 'default';
              const today = new Date();
              const endDate = new Date(contract.endDate);
              if (endDate < today) return 'warning';
              const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
              return daysLeft <= 7 ? 'warning' : 'success';
            })()}
          />
          <InfoItem
            label="Description"
            value={contract.description || 'Aucune description'}
            className="md:col-span-2"
          />
        </InfoGrid>
      </InfoCard>

      {/* Période et durée */}
      <InfoCard
        title="Période et durée"
        icon={CalendarIcon}
        gradient="from-green-500 to-emerald-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Date de début"
            value={formatDate(contract.startDate)}
            icon={CalendarIcon}
            type="highlight"
          />
          <InfoItem
            label="Date de fin"
            value={formatDate(contract.endDate)}
            icon={CalendarIcon}
            type="highlight"
          />
          <InfoItem
            label="Durée totale"
            value={calculateDuration()}
            type="success"
          />
          <InfoItem
            label="Horaires de travail"
            value={contract.workingHours || '08:00 - 12:00, 13:00 - 17:00'}
            icon={ClockIcon}
          />
          <InfoItem
            label="Périodes non travaillées"
            value={contract.nonWorkingPeriods || 'Aucune'}
            className="md:col-span-2"
          />
        </InfoGrid>
      </InfoCard>

      {/* Durées hebdomadaires */}
      <InfoCard
        title="Durées hebdomadaires"
        icon={ClockIcon}
        gradient="from-purple-500 to-pink-600"
      >
        <InfoGrid columns={3}>
          <InfoItem
            label="Durée hebdomadaire de la mission"
            value={contract.weeklyMissionDuration ? `${contract.weeklyMissionDuration}h` : '-'}
            icon={ClockIcon}
            type="highlight"
          />
          <InfoItem
            label="Durée collective moyenne"
            value={contract.weeklyCollectiveAvgDuration ? `${contract.weeklyCollectiveAvgDuration}h` : '-'}
            icon={ClockIcon}
          />
          <InfoItem
            label="Durée collective hebdomadaire"
            value={contract.weeklyCollectiveDuration ? `${contract.weeklyCollectiveDuration}h` : '-'}
            icon={ClockIcon}
          />
        </InfoGrid>
      </InfoCard>

      {/* Intervenants */}
      <InfoCard
        title="Intervenants"
        icon={UserIcon}
        gradient="from-orange-500 to-red-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Client"
            value={contract.client?.companyName || 'Non spécifié'}
            icon={BuildingOfficeIcon}
            type={contract.client ? "success" : "default"}
          />
          <InfoItem
            label="Consultant"
            value={contract.employee 
              ? `${contract.employee.firstName || ''} ${contract.employee.lastName || ''}`.trim()
              : 'Non spécifié'
            }
            icon={UserIcon}
            type={contract.employee ? "success" : "default"}
          />
        </InfoGrid>
      </InfoCard>

      {/* Informations complémentaires */}
      <InfoCard
        title="Informations complémentaires"
        icon={IdentificationIcon}
        gradient="from-cyan-500 to-blue-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Motif"
            value={contract.motif || 'Non spécifié'}
          />
          <InfoItem
            label="Motif additionnel"
            value={contract.additionalMotif || 'Aucun'}
          />
          <InfoItem
            label="Justificatif"
            value={contract.justificatif || 'Non spécifié'}
          />
          <InfoItem
            label="Moyen de transport"
            value={contract.transport || 'Non spécifié'}
            icon={TruckIcon}
          />
          <InfoItem
            label="Moyen d'accès"
            value={contract.accessMethod || 'Non spécifié'}
          />
          <InfoItem
            label="Mode de paiement"
            value={contract.paymentMethod || 'Non spécifié'}
          />
        </InfoGrid>
      </InfoCard>

      {/* Mesures de sécurité */}
      {contract.securityMeasuresList && contract.securityMeasuresList.length > 0 && (
        <InfoCard
          title="Mesures de sécurité"
          icon={IdentificationIcon}
          gradient="from-red-500 to-rose-600"
        >
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contract.securityMeasuresList.map((measure, index) => (
                <div key={index} className="flex items-center p-3 bg-white/60 rounded-lg border border-red-100">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-red-800">{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </InfoCard>
      )}
    </div>
  );
};

export default ContractDetailsTab;