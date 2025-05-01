const webpack = require('webpack');

module.exports = function override(config, env) {
  // Ajouter les polyfills pour les modules Node.js
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve('path-browserify'),
    fs: false,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url'),
    buffer: require.resolve('buffer'),
    util: require.resolve('util/'),
    process: require.resolve('process/browser'),
    zlib: false,
    net: false,
    tls: false,
    child_process: false,
  };

  // Ajouter les plugins pour les variables globales
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  // Ignorer les warnings pour les modules natifs
  config.ignoreWarnings = [
    ...config.ignoreWarnings || [],
    /Module not found: Error: Can't resolve/,
  ];

  // Ajouter un alias pour les modules qui ne fonctionnent pas bien avec webpack 5
  config.resolve.alias = {
    ...config.resolve.alias,
    'electron-store': 'localstorage-ponyfill',
    'better-sqlite3': false,
  };

  // Pour le localStorage en tant que substitut d'electron-store
  // Créer un fichier src/utils/localstorage-ponyfill.js avec le contenu suivant:
  // 
  // module.exports = class Store {
  //   constructor(options = {}) {
  //     this.name = options.name || 'electron-store';
  //     this.schema = options.schema || {};
  //   }
  //
  //   get(key) {
  //     try {
  //       const data = localStorage.getItem(`${this.name}_${key}`);
  //       return data ? JSON.parse(data) : undefined;
  //     } catch (error) {
  //       console.error('Error getting data from localStorage:', error);
  //       return undefined;
  //     }
  //   }
  //
  //   set(key, value) {
  //     try {
  //       localStorage.setItem(`${this.name}_${key}`, JSON.stringify(value));
  //       return true;
  //     } catch (error) {
  //       console.error('Error setting data to localStorage:', error);
  //       return false;
  //     }
  //   }
  //
  //   has(key) {
  //     return localStorage.getItem(`${this.name}_${key}`) !== null;
  //   }
  //
  //   delete(key) {
  //     localStorage.removeItem(`${this.name}_${key}`);
  //     return true;
  //   }
  //
  //   clear() {
  //     // Supprimer uniquement les clés qui appartiennent à ce store
  //     const prefix = `${this.name}_`;
  //     Object.keys(localStorage).forEach((key) => {
  //       if (key.startsWith(prefix)) {
  //         localStorage.removeItem(key);
  //       }
  //     });
  //     return true;
  //   }
  // };

  return config;
};