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
    ['expo-sqlite', { useSQLCipher: true }],
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
