// config-overrides.js
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Ajouter les fallbacks pour les polyfills
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "process": require.resolve("process/browser"),
    "buffer": require.resolve("buffer/"),
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "url": require.resolve("url/"),
    "path": require.resolve("path-browserify"),
  };
  
  // Ajouter un plugin pour exposer process
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  );
  
  return config;
}