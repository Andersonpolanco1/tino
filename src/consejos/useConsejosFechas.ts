import { useMemo } from 'react';
import { useAlmacen } from '../estado';
import { usePais } from '../paises';
import { useHoy } from '../inicio/useHoy';
import { useTarjetasEnPlan } from '../suscripciones/useSuscripcion';
import { consejosDeFechas, type ConsejoFechas } from './fechas';

// Los consejos de fechas de hoy, con las tarjetas que cuentan: activas y dentro del plan.
export function useConsejosFechas(): ConsejoFechas[] {
  const hoy = useHoy();
  const { config } = usePais();
  const tarjetas = useTarjetasEnPlan();
  const ingresos = useAlmacen(s => s.ingresos);
  return useMemo(
    () => consejosDeFechas({ hoy, tarjetas: tarjetas.filter(x => !x.enPausa), ingresos, pais: config }),
    [hoy, tarjetas, ingresos, config],
  );
}
