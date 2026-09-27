// Configuración de Metro con los identificadores de depuración de Sentry, para que los
// reportes de fallos muestren el código original (sección 7.3 técnica).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
