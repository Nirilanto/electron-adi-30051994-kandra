const webpack = require('webpack');

module.exports = function override(config, env) {
  // Ajout des polyfills pour les modules Node.js
  config.resolve.fallback = {
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
  };

  // Ajout des plugins pour les variables globales
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
};