import { useMemo } from 'react';
import type { EntradaMotor, ResultadoMotor, Tarjeta } from '../tipos/tipos';
import { calcularRanking, ordenarRanking, type OrdenVista } from '../motor';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { useHoy } from './useHoy';

interface Opciones {
  orden?: OrdenVista;
  compra?: EntradaMotor['compra'];
}

export interface Ranking {
  entrada: EntradaMotor;
  resultado: ResultadoMotor;
  tarjetaDe: (id: string) => Tarjeta;
}

// El ranking nunca se guarda: se recalcula con el motor a partir de los datos (sección 3 técnica).
// La barra de orden solo reordena la vista; el enfoque guardado no cambia.
export function useRanking({ orden = 'recomendado', compra }: Opciones = {}): Ranking | null {
  const hoy = useHoy();
  const { config } = usePais();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const preferencias = useAlmacen(s => s.preferencias);

  return useMemo(() => {
    if (!preferencias) return null;
    // Los ingresos se registran en la etapa 5; hasta entonces el motor no penaliza por cobros.
    const entrada: EntradaMotor = { hoy, tarjetas, ingresos: [], preferencias, pais: config, ...(compra ? { compra } : {}) };
    const calculado = calcularRanking(entrada);
    const porId = new Map(tarjetas.map(t => [t.id, t]));
    return {
      entrada,
      resultado: { ...calculado, ranking: ordenarRanking(calculado.ranking, orden) },
      tarjetaDe: (id: string) => porId.get(id)!,
    };
  }, [hoy, tarjetas, preferencias, config, compra, orden]);
}
