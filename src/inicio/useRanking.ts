import { useMemo } from 'react';
import type { EntradaMotor, FechaISO, ResultadoMotor, Tarjeta } from '../tipos/tipos';
import { calcularRanking, ordenarRanking, type OrdenVista } from '../motor';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { useHoy } from './useHoy';
import { useTarjetasEnPlan } from '../suscripciones/useSuscripcion';

interface Opciones {
  orden?: OrdenVista;
  compra?: EntradaMotor['compra'];
  // Solo "Tengo una compra" calcula para otro día (decisión D96); sin ella, hoy.
  fecha?: FechaISO;
}

export interface Ranking {
  entrada: EntradaMotor;
  resultado: ResultadoMotor;
  tarjetaDe: (id: string) => Tarjeta;
}

// El ranking nunca se guarda: se recalcula con el motor a partir de los datos (sección 3 técnica).
// La barra de orden solo reordena la vista; el enfoque guardado no cambia.
export function useRanking({ orden = 'recomendado', compra, fecha }: Opciones = {}): Ranking | null {
  const hoyReal = useHoy();
  const hoy = fecha ?? hoyReal;
  const { config } = usePais();
  // Solo las tarjetas del plan (15.2); las guardadas fuera del plan gratis no compiten.
  const tarjetas = useTarjetasEnPlan();
  const ingresos = useAlmacen(s => s.ingresos);
  const preferencias = useAlmacen(s => s.preferencias);

  return useMemo(() => {
    if (!preferencias) return null;
    const entrada: EntradaMotor = { hoy, tarjetas, ingresos, preferencias, pais: config, ...(compra ? { compra } : {}) };
    const calculado = calcularRanking(entrada);
    const porId = new Map(tarjetas.map(t => [t.id, t]));
    return {
      entrada,
      resultado: { ...calculado, ranking: ordenarRanking(calculado.ranking, orden) },
      tarjetaDe: (id: string) => porId.get(id)!,
    };
  }, [hoy, tarjetas, ingresos, preferencias, config, compra, orden]);
}
