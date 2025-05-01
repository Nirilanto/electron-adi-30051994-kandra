/**
 * LocalStorage polyfill pour electron-store
 * Utilisé pour le développement lorsque l'application fonctionne dans le navigateur
 */
module.exports = class Store {
    constructor(options = {}) {
      this.name = options.name || 'electron-store';
      this.schema = options.schema || {};
      this.cwd = options.cwd || '';
      
      // Préfixe pour les clés dans le localStorage
      this.prefix = this.cwd ? `${this.cwd}_${this.name}_` : `${this.name}_`;
    }
  
    // Récupérer une valeur
    get(key) {
      try {
        if (key) {
          // Récupérer une clé spécifique
          const data = localStorage.getItem(`${this.prefix}${key}`);
          return data ? JSON.parse(data) : undefined;
        } else {
          // Récupérer toutes les données du store
          const result = {};
          const prefixLength = this.prefix.length;
          
          for (let i = 0; i < localStorage.length; i++) {
            const fullKey = localStorage.key(i);
            if (fullKey.startsWith(this.prefix)) {
              const key = fullKey.substring(prefixLength);
              try {
                result[key] = JSON.parse(localStorage.getItem(fullKey));
              } catch (error) {
                result[key] = localStorage.getItem(fullKey);
              }
            }
          }
          
          return result;
        }
      } catch (error) {
        console.error('Error getting data from localStorage:', error);
        return undefined;
      }
    }
  
    // Définir une valeur
    set(key, value) {
      try {
        // Si la valeur est undefined, supprimer la clé
        if (value === undefined) {
          localStorage.removeItem(`${this.prefix}${key}`);
          return true;
        }
        
        localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Error setting data to localStorage:', error);
        return false;
      }
    }
  
    // Vérifier si une clé existe
    has(key) {
      return localStorage.getItem(`${this.prefix}${key}`) !== null;
    }
  
    // Supprimer une clé
    delete(key) {
      localStorage.removeItem(`${this.prefix}${key}`);
      return true;
    }
  
    // Vider le store
    clear() {
      // Supprimer uniquement les clés qui appartiennent à ce store
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
      return true;
    }
  
    // Définir l'objet store complet
    store = {
      // Accesseur pour obtenir les données complètes
      get: () => {
        return this.get();
      },
      
      // Modificateur pour définir les données complètes
      set: (newData) => {
        // Effacer les données existantes
        this.clear();
        
        // Définir les nouvelles données
        if (typeof newData === 'object' && newData !== null) {
          Object.entries(newData).forEach(([key, value]) => {
            this.set(key, value);
          });
        }
        
        return true;
      }
    }
  
    // Méthode statique pour initialiser le pont avec le processus de rendu
    static initRenderer() {
      // Dans le navigateur, cela ne fait rien
      console.log('Store.initRenderer() appelé dans le navigateur');
      return true;
    }
  
    // Méthode pour migrer les données (simulation)
    migrate() {
      // Dans le navigateur, cela ne fait rien
      console.log('Migration des données dans le navigateur (simulation)');
      return true;
    }
  
    // Récupérer le chemin du store (simulation)
    path = '';
    
    // Récupérer la taille du store (approximation)
    size = () => {
      let size = 0;
      const prefix = this.prefix;
      
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(prefix)) {
          size += localStorage.getItem(key).length;
        }
      });
      
      return size;
    }
  };