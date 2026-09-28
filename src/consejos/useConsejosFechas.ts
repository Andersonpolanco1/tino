import { useCallback, useMemo } from 'react';
import { useAlmacen } from '../estado';
import { usePais } from '../paises';
import { useHoy } from '../inicio/useHoy';
import { useTarjetasEnPlan } from '../suscripciones/useSuscripcion';
import { consejosDeFechas, type ConsejoFechas } from './fechas';
import { esVisto, marcarVistos } from './vistos';

// Los consejos de fechas de hoy, con las tarjetas que cuentan (activas y dentro del plan) y el
// enfoque guardado. Siguen a la vista mientras el problema exista (decisiones D68 y D74).
export function useConsejosFechas(): ConsejoFechas[] {
  const hoy = useHoy();
  const { config } = usePais();
  const tarjetas = useTarjetasEnPlan();
  const ingresos = useAlmacen(s => s.ingresos);
  const enfoque = useAlmacen(s => s.preferencias?.enfoque.modo ?? 'equilibrado');
  return useMemo(
    () => consejosDeFechas({ hoy, tarjetas: tarjetas.filter(x => !x.enPausa), ingresos, pais: config, enfoque }),
    [hoy, tarjetas, ingresos, config, enfoque],
  );
}

// Decisión D68: cuáles son nuevos y cómo marcarlos como vistos.
export function useConsejosNuevos() {
  const consejos = useConsejosFechas();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardar = useAlmacen(s => s.guardarPreferencias);
  const vistos = preferencias?.consejosVistos;
  const nuevos = useMemo(() => consejos.filter(c => !esVisto(c, vistos)), [consejos, vistos]);
  const marcar = useCallback(() => {
    if (!preferencias || !nuevos.length) return;
    guardar({ ...preferencias, consejosVistos: marcarVistos(consejos) }).catch(() => {});
  }, [preferencias, nuevos, consejos, guardar]);
  return { consejos, nuevos, marcar };
}
