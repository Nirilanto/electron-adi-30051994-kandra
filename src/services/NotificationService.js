// src/services/NotificationService.js
import { v4 as uuidv4 } from 'uuid';
import DatabaseService from './DatabaseService';
import { addMonths } from '../utils/dateUtils';

class NotificationService {
  constructor() {
    this.db = DatabaseService;
    this.notificationsKey = 'cm_notifications'; 
  }

  /**
   * Récupère toutes les notifications
   * @returns {Promise<Array>} - Liste des notifications
   */
  async getAllNotifications() {
    const notifications = await this.db.get(this.notificationsKey);
    return notifications || [];
  }

  /**
   * Récupère les notifications en attente (non lues)
   * @returns {Promise<Array>} - Liste des notifications en attente
   */
  async getPendingNotifications() {
    const notifications = await this.getAllNotifications();
    return notifications.filter(n => !n.read);
  }

  /**
   * Crée une nouvelle notification
   * @param {Object} notification - Données de la notification
   * @returns {Promise<Object>} - Notification créée
   */
  async createNotification(notification) {
    const notifications = await this.getAllNotifications();
    
    const newNotification = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    notifications.push(newNotification);
    await this.db.set(this.notificationsKey, notifications);
    
    return newNotification;
  }

  /**
   * Marque une notification comme lue
   * @param {string} id - ID de la notification
   * @returns {Promise<boolean>} - Succès ou échec
   */
  async markAsRead(id) {
    const notifications = await this.getAllNotifications();
    const index = notifications.findIndex(n => n.id === id);
    
    if (index === -1) {
      return false;
    }
    
    notifications[index].read = true;
    notifications[index].readAt = new Date().toISOString();
    
    await this.db.set(this.notificationsKey, notifications);
    return true;
  }

  /**
   * Supprime une notification
   * @param {string} id - ID de la notification
   * @returns {Promise<boolean>} - Succès ou échec
   */
  async deleteNotification(id) {
    const notifications = await this.getAllNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    
    if (filtered.length === notifications.length) {
      return false;
    }
    
    await this.db.set(this.notificationsKey, filtered);
    return true;
  }

  /**
   * Vérifie les contrats arrivant à échéance et crée des notifications
   * @returns {Promise<Array>} - Notifications créées
   */
  async checkContractExpirations() {
    try {
      // Récupérer tous les contrats
      const contracts = await this.db.get('contracts') || [];
      const today = new Date();
      const createdNotifications = [];
      
      // Filtrer les contrats actifs qui arrivent à échéance dans 7 jours ou moins
      const expiringContracts = contracts.filter(contract => {
        const endDate = new Date(contract.endDate);
        const daysUntilExpiration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiration >= 0 && daysUntilExpiration <= 7;
      });
      
      // Créer une notification pour chaque contrat expirant
      for (const contract of expiringContracts) {
        // Vérifier si une notification existe déjà pour ce contrat
        const notifications = await this.getAllNotifications();
        const existingNotification = notifications.find(n => 
          n.type === 'contract_expiration' && 
          n.data.contractId === contract.id &&
          !n.read
        );
        
        if (!existingNotification) {
          const endDate = new Date(contract.endDate);
          const daysUntilExpiration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          
          const notification = await this.createNotification({
            type: 'contract_expiration',
            title: 'Contrat arrivant à échéance',
            message: `Le contrat ${contract.title} (#${contract.contractNumber}) arrive à échéance dans ${daysUntilExpiration} jour${daysUntilExpiration > 1 ? 's' : ''}.`,
            priority: daysUntilExpiration <= 3 ? 'high' : 'medium',
            data: {
              contractId: contract.id,
              contractNumber: contract.contractNumber,
              endDate: contract.endDate
            }
          });
          
          createdNotifications.push(notification);
        }
      }
      
      return createdNotifications;
    } catch (error) {
      console.error('Erreur lors de la vérification des contrats à échéance:', error);
      return [];
    }
  }

  /**
   * Vérifie les renouvellements de contrats nécessaires
   * @returns {Promise<Array>} - Notifications créées
   */
  async checkContractRenewals() {
    try {
      // Récupérer tous les contrats
      const contracts = await this.db.get('contracts') || [];
      const today = new Date();
      const oneMonthFromNow = addMonths(today, 1);
      const createdNotifications = [];
      
      // Filtrer les contrats qui arrivent à échéance dans le mois prochain
      const renewalContracts = contracts.filter(contract => {
        const endDate = new Date(contract.endDate);
        return endDate > today && endDate <= oneMonthFromNow;
      });
      
      // Créer une notification pour chaque contrat à renouveler
      for (const contract of renewalContracts) {
        // Vérifier si une notification existe déjà pour ce contrat
        const notifications = await this.getAllNotifications();
        const existingNotification = notifications.find(n => 
          n.type === 'contract_renewal' && 
          n.data.contractId === contract.id &&
          !n.read
        );
        
        if (!existingNotification) {
          const endDate = new Date(contract.endDate);
          const daysUntilExpiration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          
          const notification = await this.createNotification({
            type: 'contract_renewal',
            title: 'Renouvellement de contrat',
            message: `Le contrat ${contract.title} (#${contract.contractNumber}) arrive à échéance dans ${daysUntilExpiration} jours. Envisagez son renouvellement.`,
            priority: 'medium',
            data: {
              contractId: contract.id,
              contractNumber: contract.contractNumber,
              endDate: contract.endDate
            }
          });
          
          createdNotifications.push(notification);
        }
      }
      
      return createdNotifications;
    } catch (error) {
      console.error('Erreur lors de la vérification des renouvellements de contrats:', error);
      return [];
    }
  }
}

export default new NotificationService();