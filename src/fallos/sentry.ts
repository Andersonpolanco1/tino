import * as Sentry from '@sentry/react-native';
import { reportesActivos, type ServicioFallos } from './cliente';
import { limpiarEvento } from './filtro';

// Sentry configurado para reportar solo errores y cierres, sin datos de la persona (sección 7.3
// técnica). La región de la Unión Europea la fija la dirección del DSN. Las sesiones quedan
// activas para medir la meta de sesiones sin fallos (99.5%); no llevan datos del usuario.
export function crearServicioSentry(dsn: string): ServicioFallos {
  return {
    iniciar: () => {
      Sentry.init({
        dsn,
        sendDefaultPii: false,
        attachScreenshot: false,
        attachViewHierarchy: false,
        enableUserInteractionTracing: false,
        enableCaptureFailedRequests: false,
        enableAutoSessionTracking: true,
        tracesSampleRate: 0,
        maxBreadcrumbs: 0,
        beforeBreadcrumb: () => null,
        beforeSendTransaction: () => null,
        beforeSend: evento => (reportesActivos() ? limpiarEvento(evento) : null),
      });
    },
    detener: () => {
      Sentry.close().catch(() => {});
    },
  };
}
