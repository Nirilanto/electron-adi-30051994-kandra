// src/modules/settings/SettingsService.js
import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../../services/DatabaseService';

class SettingsService {
  constructor() {
    this.db = DatabaseService;
    this.companySettingsKey = 'settings_company';
    this.taxRatesKey = 'settings_tax_rates';
    this.hourTypesKey = 'settings_hour_types';
    this.paymentMethodsKey = 'settings_payment_methods';
    this.transportModesKey = 'settings_transport_modes';
    this.qualificationsKey = 'settings_qualifications';
    this.motifTypesKey = 'settings_motif_types';
    this.justificatifTypesKey = 'settings_justificatif_types';
    this.accessMethodsKey = 'settings_access_methods'; // Nouveau pour les moyens d'accès
    this.securityMeasuresKey = 'settings_security_measures'; // Nouveau pour les mesures de sécurité
  }

  // Paramètres de l'entreprise
  async getCompanySettings() {
    const settings = await this.db.get(this.companySettingsKey);
    return settings || {
      name: 'VOTRE ENTREPRISE',
      address: '123 Rue des Missions',
      zipCode: '75000',
      city: 'Paris',
      phone: '',
      email: '',
      siret: '',
      rcs: '',
      ape: '',
      logo: null
    };
  }

  async saveCompanySettings(settings) {
    return this.db.set(this.companySettingsKey, settings);
  }

  // Taux de TVA
  async getTaxRates() {
    const taxRates = await this.db.get(this.taxRatesKey);
    if (!taxRates || taxRates.length === 0) {
      const defaultTaxRates = [
        { id: 1, title: 'TVA NORMALE', value: 20.00 },
        { id: 2, title: 'TVA REDUIT', value: 5.50 }
      ];
      await this.db.set(this.taxRatesKey, defaultTaxRates);
      return defaultTaxRates;
    }
    return taxRates;
  }

  async saveTaxRate(taxRate) {
    const taxRates = await this.getTaxRates();
    if (taxRate.id) {
      // Mise à jour d'un taux existant
      const index = taxRates.findIndex(t => t.id === taxRate.id);
      if (index !== -1) {
        taxRates[index] = taxRate;
      }
    } else {
      // Nouveau taux
      const newId = Math.max(...taxRates.map(t => t.id), 0) + 1;
      taxRates.push({ ...taxRate, id: newId });
    }
    return this.db.set(this.taxRatesKey, taxRates);
  }

  async deleteTaxRate(id) {
    const taxRates = await this.getTaxRates();
    const filteredRates = taxRates.filter(t => t.id !== id);
    return this.db.set(this.taxRatesKey, filteredRates);
  }

  // Types d'heures
  async getHourTypes() {
    const hourTypes = await this.db.get(this.hourTypesKey);
    if (!hourTypes || hourTypes.length === 0) {
      const defaultHourTypes = [
        { id: 1, title: 'HEURE NORMALE', label: 'HEURE NORMALE', rate: 1 },
        { id: 2, title: 'HEURE SUP 1', label: 'HEURE SUP 1', rate: 1.25 },
        { id: 3, title: 'HEURE SUP 2', label: 'HEURE SUP 2', rate: 1.5 }
      ];
      await this.db.set(this.hourTypesKey, defaultHourTypes);
      return defaultHourTypes;
    }
    return hourTypes;
  }

  async saveHourType(hourType) {
    const hourTypes = await this.getHourTypes();
    if (hourType.id) {
      // Mise à jour d'un type existant
      const index = hourTypes.findIndex(t => t.id === hourType.id);
      if (index !== -1) {
        hourTypes[index] = hourType;
      }
    } else {
      // Nouveau type
      const newId = Math.max(...hourTypes.map(t => t.id), 0) + 1;
      hourTypes.push({ ...hourType, id: newId });
    }
    return this.db.set(this.hourTypesKey, hourTypes);
  }

  async deleteHourType(id) {
    const hourTypes = await this.getHourTypes();
    const filteredTypes = hourTypes.filter(t => t.id !== id);
    return this.db.set(this.hourTypesKey, filteredTypes);
  }

  // Modes de paiement
  async getPaymentMethods() {
    const methods = await this.db.get(this.paymentMethodsKey);
    if (!methods || methods.length === 0) {
      const defaultMethods = [
        { id: 1, title: 'VIRA30JLDE05', label: 'VIREMENT 30 JOURS LE 5 DU MOIS', month: 0, day: 5 },
        { id: 2, title: 'VIRFINMOISDE15', label: 'VIREMENT FIN DE MOIS LE 15', month: 0, day: 15 },
        { id: 4, title: 'VIREMENT', label: 'VIREMENT', month: 1, day: 1 },
        { id: 5, title: 'CHEQUE', label: 'CHEQUE', month: 1, day: 1 }
      ];
      await this.db.set(this.paymentMethodsKey, defaultMethods);
      return defaultMethods;
    }
    return methods;
  }

  async savePaymentMethod(method) {
    const methods = await this.getPaymentMethods();
    if (method.id) {
      // Mise à jour d'une méthode existante
      const index = methods.findIndex(m => m.id === method.id);
      if (index !== -1) {
        methods[index] = method;
      }
    } else {
      // Nouvelle méthode
      const newId = Math.max(...methods.map(m => m.id), 0) + 1;
      methods.push({ ...method, id: newId });
    }
    return this.db.set(this.paymentMethodsKey, methods);
  }

  async deletePaymentMethod(id) {
    const methods = await this.getPaymentMethods();
    const filteredMethods = methods.filter(m => m.id !== id);
    return this.db.set(this.paymentMethodsKey, filteredMethods);
  }

  // Modes de transport
  async getTransportModes() {
    const modes = await this.db.get(this.transportModesKey);
    if (!modes || modes.length === 0) {
      const defaultModes = [
        { id: 1, title: 'TC', label: 'TRANSPORT EN COMMUN' },
        { id: 2, title: 'VOITURE', label: 'VOITURE' },
        { id: 3, title: 'PERSONNEL', label: 'PERSONNEL' },
        { id: 4, title: 'SELON MOYENS', label: 'SELON MOYENS' }
      ];
      await this.db.set(this.transportModesKey, defaultModes);
      return defaultModes;
    }
    return modes;
  }

  async saveTransportMode(mode) {
    const modes = await this.getTransportModes();
    if (mode.id) {
      // Mise à jour d'un mode existant
      const index = modes.findIndex(m => m.id === mode.id);
      if (index !== -1) {
        modes[index] = mode;
      }
    } else {
      // Nouveau mode
      const newId = Math.max(...modes.map(m => m.id), 0) + 1;
      modes.push({ ...mode, id: newId });
    }
    return this.db.set(this.transportModesKey, modes);
  }

  async deleteTransportMode(id) {
    const modes = await this.getTransportModes();
    const filteredModes = modes.filter(m => m.id !== id);
    return this.db.set(this.transportModesKey, filteredModes);
  }

  // Qualifications
  async getQualifications() {
    const qualifications = await this.db.get(this.qualificationsKey);
    if (!qualifications || qualifications.length === 0) {
      const defaultQualifications = [
        { id: 11, title: 'CARRELEUR', label: 'MACON CARRELEUR' },
        { id: 12, title: 'CHEF D\'EQUIPE', label: 'CHEF D\'EQUIPE' },
        { id: 13, title: 'GROS ŒUVRES', label: 'GROS ŒUVRES' },
        { id: 14, title: 'GRUTIER', label: 'GRUTIER' },
        { id: 15, title: 'COFFREUR', label: 'COFFREUR' },
        { id: 16, title: 'FERAILLEUR', label: 'FERAILLEUR' },
        { id: 17, title: 'MACON', label: 'MACON' },
        { id: 18, title: 'MANŒUVRE', label: 'MANŒUVRE' },
        { id: 19, title: 'FACADIER BARDEUR', label: 'FACADIER BARDEUR' },
        { id: 20, title: 'CHAUFFEUR', label: 'CHAUFFEUR' }
      ];
      await this.db.set(this.qualificationsKey, defaultQualifications);
      return defaultQualifications;
    }
    return qualifications;
  }

  async saveQualification(qualification) {
    const qualifications = await this.getQualifications();
    if (qualification.id) {
      // Mise à jour d'une qualification existante
      const index = qualifications.findIndex(q => q.id === qualification.id);
      if (index !== -1) {
        qualifications[index] = qualification;
      }
    } else {
      // Nouvelle qualification
      const newId = Math.max(...qualifications.map(q => q.id), 0) + 1;
      qualifications.push({ ...qualification, id: newId });
    }
    return this.db.set(this.qualificationsKey, qualifications);
  }

  async deleteQualification(id) {
    const qualifications = await this.getQualifications();
    const filteredQualifications = qualifications.filter(q => q.id !== id);
    return this.db.set(this.qualificationsKey, filteredQualifications);
  }

  // Types de motifs
  async getMotifTypes() {
    const motifs = await this.db.get(this.motifTypesKey);
    if (!motifs || motifs.length === 0) {
      const defaultMotifs = [
        { id: 1, title: 'DELAIS', label: 'DELAIS DE CHANTIER A RESPECTER' },
        { id: 2, title: 'NOUVEAU', label: 'NOUVEAU CHANTIER' },
        { id: 3, title: 'RENFORT DE PERSONNEL', label: 'RENFORT DE PERSONNEL' }
      ];
      await this.db.set(this.motifTypesKey, defaultMotifs);
      return defaultMotifs;
    }
    return motifs;
  }

  async saveMotifType(motif) {
    const motifs = await this.getMotifTypes();
    if (motif.id) {
      // Mise à jour d'un motif existant
      const index = motifs.findIndex(m => m.id === motif.id);
      if (index !== -1) {
        motifs[index] = motif;
      }
    } else {
      // Nouveau motif
      const newId = Math.max(...motifs.map(m => m.id), 0) + 1;
      motifs.push({ ...motif, id: newId });
    }
    return this.db.set(this.motifTypesKey, motifs);
  }

  async deleteMotifType(id) {
    const motifs = await this.getMotifTypes();
    const filteredMotifs = motifs.filter(m => m.id !== id);
    return this.db.set(this.motifTypesKey, filteredMotifs);
  }

  // Types de justificatifs
  async getJustificatifTypes() {
    const justificatifs = await this.db.get(this.justificatifTypesKey);
    if (!justificatifs || justificatifs.length === 0) {
      const defaultJustificatifs = [
        { id: 1, title: 'ACCROISSEMENT TEMP. D\'ACTIVITE', label: 'ACCROISSEMENT TEMP. D\'ACTIVITE' },
        { id: 2, title: 'REMPLACEMENT SALARIE ABSENT', label: 'REMPLACEMENT SALARIE ABSENT' },
        { id: 3, title: 'RENFORT DE PERSONNEL', label: 'RENFORT DE PERSONNEL' }
      ];
      await this.db.set(this.justificatifTypesKey, defaultJustificatifs);
      return defaultJustificatifs;
    }
    return justificatifs;
  }

  async saveJustificatifType(justificatif) {
    const justificatifs = await this.getJustificatifTypes();
    if (justificatif.id) {
      // Mise à jour d'un justificatif existant
      const index = justificatifs.findIndex(j => j.id === justificatif.id);
      if (index !== -1) {
        justificatifs[index] = justificatif;
      }
    } else {
      // Nouveau justificatif
      const newId = Math.max(...justificatifs.map(j => j.id), 0) + 1;
      justificatifs.push({ ...justificatif, id: newId });
    }
    return this.db.set(this.justificatifTypesKey, justificatifs);
  }

  async deleteJustificatifType(id) {
    const justificatifs = await this.getJustificatifTypes();
    const filteredJustificatifs = justificatifs.filter(j => j.id !== id);
    return this.db.set(this.justificatifTypesKey, filteredJustificatifs);
  }

  // Moyens d'accès - Nouveau
  async getAccessMethods() {
    const accessMethods = await this.db.get(this.accessMethodsKey);
    if (!accessMethods || accessMethods.length === 0) {
      const defaultAccessMethods = [
        { id: 1, title: 'BADGE', label: 'BADGE D\'ACCÈS' },
        { id: 2, title: 'CODE', label: 'CODE D\'ACCÈS' },
        { id: 3, title: 'ACCUEIL', label: 'PRÉSENTATION À L\'ACCUEIL' },
        { id: 4, title: 'CONTACT', label: 'CONTACTER RESPONSABLE SUR PLACE' }
      ];
      await this.db.set(this.accessMethodsKey, defaultAccessMethods);
      return defaultAccessMethods;
    }
    return accessMethods;
  }

  async saveAccessMethod(method) {
    const methods = await this.getAccessMethods();
    if (method.id) {
      // Mise à jour d'une méthode existante
      const index = methods.findIndex(m => m.id === method.id);
      if (index !== -1) {
        methods[index] = method;
      }
    } else {
      // Nouvelle méthode
      const newId = Math.max(...methods.map(m => m.id), 0) + 1;
      methods.push({ ...method, id: newId });
    }
    return this.db.set(this.accessMethodsKey, methods);
  }

  async deleteAccessMethod(id) {
    const methods = await this.getAccessMethods();
    const filteredMethods = methods.filter(m => m.id !== id);
    return this.db.set(this.accessMethodsKey, filteredMethods);
  }

  // Mesures de sécurité - Nouveau
  async getSecurityMeasures() {
    const measures = await this.db.get(this.securityMeasuresKey);
    if (!measures || measures.length === 0) {
      const defaultMeasures = [
        { id: 1, title: 'CASQUE', label: 'PORT DU CASQUE OBLIGATOIRE' },
        { id: 2, title: 'CHAUSSURES', label: 'CHAUSSURES DE SÉCURITÉ OBLIGATOIRES' },
        { id: 3, title: 'GANTS', label: 'PORT DES GANTS DE PROTECTION' },
        { id: 4, title: 'GILET', label: 'GILET HAUTE VISIBILITÉ' },
        { id: 5, title: 'HARNAIS', label: 'HARNAIS DE SÉCURITÉ OBLIGATOIRE' }
      ];
      await this.db.set(this.securityMeasuresKey, defaultMeasures);
      return defaultMeasures;
    }
    return measures;
  }

  async saveSecurityMeasure(measure) {
    const measures = await this.getSecurityMeasures();
    if (measure.id) {
      // Mise à jour d'une mesure existante
      const index = measures.findIndex(m => m.id === measure.id);
      if (index !== -1) {
        measures[index] = measure;
      }
    } else {
      // Nouvelle mesure
      const newId = Math.max(...measures.map(m => m.id), 0) + 1;
      measures.push({ ...measure, id: newId });
    }
    return this.db.set(this.securityMeasuresKey, measures);
  }

  async deleteSecurityMeasure(id) {
    const measures = await this.getSecurityMeasures();
    const filteredMeasures = measures.filter(m => m.id !== id);
    return this.db.set(this.securityMeasuresKey, filteredMeasures);
  }
}

export default new SettingsService();