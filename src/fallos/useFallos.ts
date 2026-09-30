import { useEffect } from 'react';
import { useAlmacen } from '../estado';
import { estadoAnalitica } from '../privacidad/consentimiento';
import { configurarFallos, usarServicioFallos } from './cliente';

// DSN del proyecto de Sentry, desde un secreto de EAS. Vacío, nada sale del teléfono.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

// Sentry se carga solo si hay DSN, así las pruebas y el desarrollo no lo tocan. Se inicia
// después de leer las preferencias, para respetar el interruptor desde el primer reporte.
async function cargarServicio() {
  const { crearServicioSentry } = await import('./sentry');
  usarServicioFallos(crearServicioSentry(DSN));
}

// Mantiene el reporte de fallos al día con el consentimiento (D88) y el interruptor de Ajustes;
// no dibuja nada. Sin respuesta todavía, Sentry no arranca.
export function useFallos() {
  const activo = useAlmacen(s => estadoAnalitica(s.preferencias) === 'activa');

  useEffect(() => {
    configurarFallos(activo);
  }, [activo]);

  useEffect(() => {
    if (DSN) cargarServicio().catch(() => {});
  }, []);
}
