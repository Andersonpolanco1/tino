import PostHog from 'posthog-react-native';
import type { Transporte } from './cliente';

// Región de la Unión Europea (sección 7.3 técnica).
const SERVIDOR = 'https://eu.i.posthog.com';

// PostHog configurado para enviar solo la lista cerrada de eventos: nada automático, sin
// grabación de sesiones, sin perfiles de persona ni ubicación por IP. Los datos del teléfono
// se reducen a la versión de la app y del sistema; el nombre del teléfono nunca sale.
export function crearTransportePosthog(clave: string, identificador: string): Transporte {
  const cliente = new PostHog(clave, {
    host: SERVIDOR,
    bootstrap: { distinctId: identificador, isIdentifiedId: false },
    persistence: 'memory',
    personProfiles: 'never',
    disableGeoip: true,
    captureAppLifecycleEvents: false,
    enableSessionReplay: false,
    disableSurveys: true,
    disableRemoteConfig: true,
    preloadFeatureFlags: false,
    flushAt: 5,
    customAppProperties: p => ({
      $app_version: p.$app_version,
      $app_build: p.$app_build,
      $os_name: p.$os_name,
      $os_version: p.$os_version,
    }),
  });
  return {
    capturar: (evento, propiedades) => cliente.capture(evento, propiedades),
    apagar: () => {
      cliente.optOut();
    },
    encender: () => {
      cliente.optIn();
    },
    cerrar: () => {
      cliente.shutdown();
    },
  };
}
