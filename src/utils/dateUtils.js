// src/utils/dateUtils.js

/**
 * Formate une date au format français (JJ/MM/AAAA)
 * @param {Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export const formatDateToFrench = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };
  
  /**
   * Ajoute un nombre spécifié de mois à une date
   * @param {Date} date - Date de départ
   * @param {number} months - Nombre de mois à ajouter
   * @returns {Date} - Nouvelle date
   */
  export const addMonths = (date, months) => {
    if (!date) return null;
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (!(date instanceof Date) || isNaN(date)) {
      return null;
    }
    
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    
    // Ajustement pour les cas où le jour du mois n'existe pas dans le mois cible
    // Par exemple, le 31 janvier + 1 mois devrait donner le 28/29 février et non le 3 mars
    const expectedMonth = (date.getMonth() + months) % 12;
    if (result.getMonth() !== expectedMonth) {
      // Si le mois n'est pas celui attendu, on revient au dernier jour du mois attendu
      result.setDate(0);
    }
    
    return result;
  };
  
  /**
   * Calcule la différence en jours entre deux dates
   * @param {Date} startDate - Date de début
   * @param {Date} endDate - Date de fin
   * @returns {number} - Nombre de jours
   */
  export const getDaysDifference = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    if (typeof startDate === 'string') {
      startDate = new Date(startDate);
    }
    
    if (typeof endDate === 'string') {
      endDate = new Date(endDate);
    }
    
    if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate) || isNaN(endDate)) {
      return 0;
    }
    
    // Normaliser les dates (enlever les heures, minutes, secondes)
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Calculer la différence en millisecondes
    const diffTime = Math.abs(end - start);
    // Convertir en jours
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  /**
   * Formate une date au format français avec le jour de la semaine (ex: Lundi 01/01/2025)
   * @param {Date} date - Date à formater
   * @returns {string} - Date formatée
   */
  export const formatDateWithDay = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }
    
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = days[date.getDay()];
    const formattedDate = formatDateToFrench(date);
    
    return `${dayName} ${formattedDate}`;
  };
  
  /**
   * Formate une date au format français long (ex: 1 janvier 2025)
   * @param {Date} date - Date à formater
   * @returns {string} - Date formatée
   */
  export const formatDateLong = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }
    
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };