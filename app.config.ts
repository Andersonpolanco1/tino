import type { ExpoConfig } from 'expo/config';
import tokens from './src/diseno/tokens.json';

// Los colores de arranque salen de los tokens, igual que en las pantallas.
const { base, claro } = tokens.color;

const config: ExpoConfig = {
  name: 'Tino',
  slug: 'tino',
  scheme: 'tino',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/iconos/app-store-1024.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: claro.fondo,
  ios: {
    bundleIdentifier: 'com.polanco.tino',
    supportsTablet: false,
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: 'com.polanco.tino',
    adaptiveIcon: {
      foregroundImage: './assets/iconos/android-primer-plano.png',
      backgroundImage: './assets/iconos/android-fondo.png',
      monochromeImage: './assets/iconos/android-monocromo.png',
    },
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-localization',
    'expo-secure-store',
    // Respaldo de Google: solo la copia automática y las preferencias (decisión D81). Va después
    // de expo-secure-store para reemplazar sus reglas.
    './plugins/respaldo-android',
    ['expo-sqlite', { useSQLCipher: true }],
    // Reporte de fallos (sección 7.3 técnica). Organización, proyecto y SENTRY_AUTH_TOKEN
    // vienen de los secretos de EAS y solo sirven para subir los mapas de código al compilar.
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        url: 'https://de.sentry.io/',
      },
    ],
    // Avisos locales programados en el teléfono (sección 11); el color sale del tema.
    ['expo-notifications', { color: claro.primario }],
    [
      'expo-splash-screen',
      {
        // Pantalla completa en jade con las tarjetas del icono al centro, igual en claro y oscuro.
        image: './assets/iconos/splash.png',
        // 288 dp es todo el lienzo del icono de Android 12+; la imagen ya trae el margen para su círculo.
        imageWidth: 288,
        backgroundColor: base.jadeTino,
        dark: {
          image: './assets/iconos/splash.png',
          backgroundColor: base.jadeTino,
        },
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
