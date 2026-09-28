import { useEffect } from 'react';
import { useAlmacen } from '../estado';
import { contenidoDe } from './contenido';
import { guardarRespaldoAutomatico } from './automatico';

// Espera para agrupar cambios seguidos (por ejemplo, registrar varias tarjetas).
export const ESPERA_RESPALDO_MS = 2000;

// Decisión D81: con Tino Pro y el interruptor encendido, la copia automática se reescribe con
// cada cambio de tarjetas, cobros, preferencias o sugerencias. Si Pro vence, deja de
// actualizarse pero no se borra; apagar el interruptor la borra (en Ajustes). Va en el layout
// raíz; no dibuja nada.
export function useRespaldoAutomatico() {
  const cargado = useAlmacen(s => s.cargado);
  const tarjetas = useAlmacen(s => s.tarjetas);
  const ingresos = useAlmacen(s => s.ingresos);
  const preferencias = useAlmacen(s => s.preferencias);
  const sugerencias = useAlmacen(s => s.sugerencias);
  const activo = cargado && preferencias?.plan === 'pro' && preferencias.respaldoAutomatico === true;

  useEffect(() => {
    if (!activo) return;
    const espera = setTimeout(() => {
      guardarRespaldoAutomatico(contenidoDe({ preferencias, tarjetas, ingresos, sugerencias }, new Date())).catch(() => {
        // Sin espacio en el teléfono u otro fallo: Ajustes lo muestra y se intenta de nuevo con el
        // próximo cambio.
      });
    }, ESPERA_RESPALDO_MS);
    return () => clearTimeout(espera);
  }, [activo, tarjetas, ingresos, preferencias, sugerencias]);
}
