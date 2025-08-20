const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable the experimental require.context feature
config.transformer.unstable_allowRequireContext = true;

module.exports = config;