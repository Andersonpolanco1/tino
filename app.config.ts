import type { ExpoConfig } from 'expo/config';
import tokens from './src/diseno/tokens.json';

// Los colores de arranque salen de los tokens, igual que en las pantallas.
const { claro, oscuro } = tokens.color;

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
        image: './assets/iconos/android-primer-plano.png',
        imageWidth: 200,
        backgroundColor: claro.fondo,
        dark: {
          image: './assets/iconos/android-primer-plano.png',
          backgroundColor: oscuro.fondo,
        },
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
