// src/services/LicenseService.js
class LicenseService {
  constructor() {
    this.licenseKey = 'cm_license_activated';
    this.activationCode = 'CM2025-ATLANTIS-PRO'; // Code d'activation
    this.expirationDate = new Date('2025-12-15'); // Date d'expiration de la version gratuite
  }

  // Vérifier si la licence est requise
  isLicenseRequired() {
    const currentDate = new Date();
    return currentDate >= this.expirationDate;
  }

  // Vérifier si la licence est déjà activée
  isLicenseActivated() {
    return localStorage.getItem(this.licenseKey) === 'true';
  }

  // Activer la licence avec un code
  activateLicense(code) {
    if (code === this.activationCode) {
      localStorage.setItem(this.licenseKey, 'true');
      return { success: true, message: 'Licence activée avec succès!' };
    } else {
      return { success: false, message: 'Code d\'activation invalide.' };
    }
  }

  // Vérifier le statut de la licence
  checkLicense() {
    if (!this.isLicenseRequired()) {
      return { valid: true, message: 'Version gratuite active' };
    }

    if (this.isLicenseActivated()) {
      return { valid: true, message: 'Licence activée' };
    }

    return { valid: false, message: 'Activation requise' };
  }

  // Réinitialiser la licence (pour le développement)
  resetLicense() {
    localStorage.removeItem(this.licenseKey);
  }
}

export default new LicenseService();