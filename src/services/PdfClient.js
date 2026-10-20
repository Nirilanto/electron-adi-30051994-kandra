// src/services/PdfClient.js
// Génération des PDF côté serveur (remplace window.electron.generatePDF).
import ApiClient from './ApiClient';

class PdfClient {
  /**
   * Génère un document PDF et l'ouvre dans un nouvel onglet (téléchargement si les
   * fenêtres surgissantes sont bloquées).
   * @param {string} type certificate | employee_contract | client_contract | invoice | quote | payslip
   * @param {Object} data données du template
   * @param {string} filename nom de fichier proposé
   * @returns {Promise<{success: boolean, fileName?: string, error?: string}>}
   */
  async generatePDF(type, data, filename) {
    try {
      const fileName = (filename || `${type}.pdf`).split(/[\\/]/).pop();
      // Ouvrir la fenêtre immédiatement (dans le geste utilisateur) pour éviter les bloqueurs.
      const popup = window.open('', '_blank');
      if (popup) {
        popup.document.title = fileName;
        popup.document.body.innerHTML =
          '<p style="font-family:sans-serif;padding:24px;color:#374151">Génération du PDF en cours...</p>';
      }

      let blob;
      try {
        blob = await ApiClient.postBlob(`/pdf/${encodeURIComponent(type)}`, { data, filename: fileName });
      } catch (error) {
        if (popup) popup.close();
        throw error;
      }

      const url = URL.createObjectURL(blob);
      if (popup) {
        popup.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // Laisser le temps au navigateur de charger le blob avant de libérer l'URL.
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      return { success: true, fileName, filePath: fileName };
    } catch (error) {
      console.error('Erreur lors de la génération du PDF :', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PdfClient();
