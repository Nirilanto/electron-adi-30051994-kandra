// src/modules/settings/SettingsService.js
// Paramètres de l'application : entreprise, listes de référence, signatures.
// Les valeurs par défaut sont désormais initialisées par le serveur.
import ApiClient from '../../services/ApiClient';

const KINDS = {
  taxRates: 'tax_rates',
  hourTypes: 'hour_types',
  paymentMethods: 'payment_methods',
  transportModes: 'transport_modes',
  qualifications: 'qualifications',
  motifTypes: 'motif_types',
  justificatifTypes: 'justificatif_types',
  accessMethods: 'access_methods',
  securityMeasures: 'security_measures',
};

class SettingsService {
  constructor() {
    this.kinds = KINDS;
  }

  // ---------------------------------------------------------------- Entreprise

  async getCompanySettings() {
    return ApiClient.get('/settings/company');
  }

  async saveCompanySettings(settings) {
    await ApiClient.put('/settings/company', settings);
    return true;
  }

  // ---------------------------------------------------------------- Listes de référence

  async getList(kind) {
    const items = await ApiClient.get(`/settings/lists/${kind}`);
    return Array.isArray(items) ? items : [];
  }

  async saveListItem(kind, item) {
    await ApiClient.post(`/settings/lists/${kind}`, item);
    return true;
  }

  async deleteListItem(kind, id) {
    await ApiClient.delete(`/settings/lists/${kind}/${encodeURIComponent(id)}`);
    return true;
  }

  /** Remplace entièrement une liste (import CSV). */
  async replaceList(kind, items) {
    await ApiClient.put(`/settings/lists/${kind}`, items);
    return true;
  }

  // Taux de TVA
  getTaxRates() {
    return this.getList(KINDS.taxRates);
  }
  saveTaxRate(taxRate) {
    return this.saveListItem(KINDS.taxRates, taxRate);
  }
  deleteTaxRate(id) {
    return this.deleteListItem(KINDS.taxRates, id);
  }

  // Types d'heures
  getHourTypes() {
    return this.getList(KINDS.hourTypes);
  }
  saveHourType(hourType) {
    return this.saveListItem(KINDS.hourTypes, hourType);
  }
  deleteHourType(id) {
    return this.deleteListItem(KINDS.hourTypes, id);
  }

  // Modes de paiement
  getPaymentMethods() {
    return this.getList(KINDS.paymentMethods);
  }
  savePaymentMethod(method) {
    return this.saveListItem(KINDS.paymentMethods, method);
  }
  deletePaymentMethod(id) {
    return this.deleteListItem(KINDS.paymentMethods, id);
  }

  // Modes de transport
  getTransportModes() {
    return this.getList(KINDS.transportModes);
  }
  saveTransportMode(mode) {
    return this.saveListItem(KINDS.transportModes, mode);
  }
  deleteTransportMode(id) {
    return this.deleteListItem(KINDS.transportModes, id);
  }

  // Qualifications
  getQualifications() {
    return this.getList(KINDS.qualifications);
  }
  saveQualification(qualification) {
    return this.saveListItem(KINDS.qualifications, qualification);
  }
  deleteQualification(id) {
    return this.deleteListItem(KINDS.qualifications, id);
  }

  // Types de motifs
  getMotifTypes() {
    return this.getList(KINDS.motifTypes);
  }
  saveMotifType(motif) {
    return this.saveListItem(KINDS.motifTypes, motif);
  }
  deleteMotifType(id) {
    return this.deleteListItem(KINDS.motifTypes, id);
  }

  // Types de justificatifs
  getJustificatifTypes() {
    return this.getList(KINDS.justificatifTypes);
  }
  saveJustificatifType(justificatif) {
    return this.saveListItem(KINDS.justificatifTypes, justificatif);
  }
  deleteJustificatifType(id) {
    return this.deleteListItem(KINDS.justificatifTypes, id);
  }

  // Moyens d'accès
  getAccessMethods() {
    return this.getList(KINDS.accessMethods);
  }
  saveAccessMethod(method) {
    return this.saveListItem(KINDS.accessMethods, method);
  }
  deleteAccessMethod(id) {
    return this.deleteListItem(KINDS.accessMethods, id);
  }

  // Mesures de sécurité
  getSecurityMeasures() {
    return this.getList(KINDS.securityMeasures);
  }
  saveSecurityMeasure(measure) {
    return this.saveListItem(KINDS.securityMeasures, measure);
  }
  deleteSecurityMeasure(id) {
    return this.deleteListItem(KINDS.securityMeasures, id);
  }

  // ---------------------------------------------------------------- Signatures et tampons

  async getSignatures() {
    const items = await ApiClient.get('/settings/signatures');
    return Array.isArray(items) ? items : [];
  }

  async saveSignature(signature) {
    await ApiClient.post('/settings/signatures', signature);
    return true;
  }

  async deleteSignature(id) {
    await ApiClient.delete(`/settings/signatures/${encodeURIComponent(id)}`);
    return true;
  }
}

export default new SettingsService();
