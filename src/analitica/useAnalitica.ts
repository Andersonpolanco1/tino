import { useEffect } from 'react';
import { useAlmacen } from '../estado';
import { usePais } from '../paises';
import { configurarAnalitica, usarTransporte } from './cliente';
import { leerIdentificador, nuevoIdentificador } from './identificador';

// Clave pública del proyecto de PostHog, desde un secreto de EAS. Vacía, nada sale del teléfono.
const CLAVE = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';

// PostHog se carga solo si hay clave, así las pruebas y el desarrollo no lo tocan.
async function iniciarTransporte(identificador?: string) {
  if (!CLAVE) return;
  const id = identificador ?? (await leerIdentificador());
  const { crearTransportePosthog } = await import('./posthog');
  usarTransporte(crearTransportePosthog(CLAVE, id));
}

// Nuevo identificador anónimo: los eventos siguientes no se pueden unir con los anteriores.
export async function reiniciarIdentificadorAnalitica() {
  const id = await nuevoIdentificador();
  await iniciarTransporte(id);
}

// Mantiene la analítica al día con el interruptor de Ajustes y el país; no dibuja nada.
export function useAnalitica() {
  const activa = useAlmacen(s => s.preferencias?.analiticaActiva ?? false);
  const { config } = usePais();

  useEffect(() => {
    configurarAnalitica({ activa, pais: config.codigo });
  }, [activa, config.codigo]);

  useEffect(() => {
    iniciarTransporte().catch(() => {});
  }, []);
}
