// src/modules/contracts/components/ContractConditionsTab.js
import React from 'react';
import { 
  CurrencyEuroIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
  ClockIcon,
  BanknotesIcon,
  TruckIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import InfoCard, { InfoItem, InfoGrid } from '../../employees/components/InfoCard';

const ContractConditionsTab = ({ contract }) => {
  // Fonction pour formater la monnaie
  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  // Calcul du montant total estimé
  const calculateTotalEstimated = () => {
    if (!contract.startDate || !contract.endDate || !contract.billingRate || !contract.weeklyMissionDuration) {
      return '-';
    }

    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.ceil(totalDays / 7);
    const totalHours = totalWeeks * parseFloat(contract.weeklyMissionDuration);
    const totalAmount = totalHours * parseFloat(contract.billingRate);

    return formatCurrency(totalAmount);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Tarification */}
      <InfoCard
        title="Tarification"
        icon={CurrencyEuroIcon}
        gradient="from-green-500 to-emerald-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Taux horaire consultant"
            value={formatCurrency(contract.hourlyRate)}
            icon={CurrencyEuroIcon}
            type="highlight"
          />
          <InfoItem
            label="Taux horaire facturation client"
            value={formatCurrency(contract.billingRate)}
            icon={CurrencyEuroIcon}
            type="success"
          />
          <InfoItem
            label="Marge horaire"
            value={contract.hourlyRate && contract.billingRate 
              ? formatCurrency(contract.billingRate - contract.hourlyRate)
              : '-'
            }
            type={contract.hourlyRate && contract.billingRate && (contract.billingRate - contract.hourlyRate) > 0 
              ? "success" : "warning"
            }
          />
          <InfoItem
            label="Mode de paiement"
            value={contract.paymentMethod}
            icon={BanknotesIcon}
          />
          <InfoItem
            label="Montant total estimé"
            value={calculateTotalEstimated()}
            type="highlight"
            className="md:col-span-2"
          />
        </InfoGrid>
      </InfoCard>

      {/* Conditions de travail */}
      <InfoCard
        title="Conditions de travail"
        icon={ClockIcon}
        gradient="from-blue-500 to-indigo-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Horaires de travail"
            value={contract.workingHours || '08:00 - 12:00, 13:00 - 17:00'}
            icon={ClockIcon}
          />
          <InfoItem
            label="Durée hebdomadaire"
            value={contract.weeklyMissionDuration ? `${contract.weeklyMissionDuration}h` : '-'}
            icon={ClockIcon}
            type="highlight"
          />
          <InfoItem
            label="Type de périodes non travaillées"
            value={contract.nonWorkingPeriodsType === 'specific' ? 'Terme précis' : 'Durée minimale'}
          />
          <InfoItem
            label="Périodes non travaillées"
            value={contract.nonWorkingPeriods || 'Aucune'}
          />
        </InfoGrid>
      </InfoCard>

      {/* Justifications et motifs */}
      <InfoCard
        title="Justifications et motifs"
        icon={DocumentTextIcon}
        gradient="from-purple-500 to-pink-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Motif principal"
            value={contract.motif || 'Non spécifié'}
            type="highlight"
          />
          <InfoItem
            label="Motif additionnel"
            value={contract.additionalMotif || 'Aucun'}
          />
          <InfoItem
            label="Justificatif"
            value={contract.justificatif || 'Non spécifié'}
            icon={DocumentTextIcon}
          />
          <InfoItem
            label="Type de contrat"
            value="Mission temporaire"
          />
        </InfoGrid>
      </InfoCard>

      {/* Transport et accès */}
      <InfoCard
        title="Transport et accès"
        icon={TruckIcon}
        gradient="from-orange-500 to-red-600"
      >
        <InfoGrid columns={2}>
          <InfoItem
            label="Moyen de transport"
            value={contract.transport || 'Non spécifié'}
            icon={TruckIcon}
          />
          <InfoItem
            label="Moyen d'accès"
            value={contract.accessMethod || 'Non spécifié'}
            icon={KeyIcon}
          />
        </InfoGrid>
      </InfoCard>

      {/* Mesures de sécurité */}
      {contract.securityMeasuresList && contract.securityMeasuresList.length > 0 && (
        <InfoCard
          title="Mesures de sécurité requises"
          icon={ShieldCheckIcon}
          gradient="from-red-500 to-rose-600"
        >
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contract.securityMeasuresList.map((measure, index) => (
                <div key={index} className="flex items-center p-3 bg-white/60 rounded-lg border border-red-100 hover:bg-white/80 transition-colors">
                  <ShieldCheckIcon className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                  <span className="text-sm font-medium text-red-800">{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </InfoCard>
      )}

      {/* Signatures et validation */}
      {contract.signature && (
        <InfoCard
          title="Signatures et validation"
          icon={FingerPrintIcon}
          gradient="from-indigo-500 to-blue-600"
        >
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/50 rounded-xl p-6">
            <div className="flex items-start">
              <FingerPrintIcon className="h-6 w-6 text-indigo-600 mr-3 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-indigo-900 mb-3">Signature électronique</h4>
                {contract.signature?.imageData && (
                  <div className="bg-white/60 p-4 rounded-lg border border-indigo-100">
                    <img
                      src={contract.signature.imageData}
                      alt="Signature du contrat"
                      className="h-16 object-contain mx-auto"
                    />
                    <p className="text-center text-sm text-indigo-700 mt-2">
                      {contract.signature.title || 'Signature'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </InfoCard>
      )}

      {/* Durées détaillées */}
      <InfoCard
        title="Durées détaillées"
        icon={ClockIcon}
        gradient="from-cyan-500 to-teal-600"
      >
        <InfoGrid columns={3}>
          <InfoItem
            label="Durée mission (hebdo)"
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
            label="Durée collective totale"
            value={contract.weeklyCollectiveDuration ? `${contract.weeklyCollectiveDuration}h` : '-'}
            icon={ClockIcon}
          />
        </InfoGrid>
      </InfoCard>
    </div>
  );
};

export default ContractConditionsTab;