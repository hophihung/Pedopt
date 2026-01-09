const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add domain allowlist for Supabase
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;