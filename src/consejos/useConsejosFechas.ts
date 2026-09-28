import { useCallback, useMemo } from 'react';
import { useAlmacen } from '../estado';
import { usePais } from '../paises';
import { useHoy } from '../inicio/useHoy';
import { useTarjetasEnPlan } from '../suscripciones/useSuscripcion';
import { consejosDeFechas, type ConsejoFechas } from './fechas';
import { descartar, esVisto, estaDescartado, marcarVistos } from './vistos';

// Todos los consejos de fechas de hoy, con las tarjetas que cuentan (activas y dentro del
// plan) y el enfoque guardado, incluidos los que el usuario ocultó.
function useTodosLosConsejos(): ConsejoFechas[] {
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

// Los consejos a la vista: sin los que el usuario ocultó con "Ya lo sé" (decisión D73).
export function useConsejosFechas(): ConsejoFechas[] {
  const todos = useTodosLosConsejos();
  const descartados = useAlmacen(s => s.preferencias?.consejosDescartados);
  return useMemo(() => todos.filter(c => !estaDescartado(c, descartados)), [todos, descartados]);
}

// Decisiones D68 y D73: cuáles son nuevos, cómo marcarlos como vistos y cómo ocultar uno.
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
  const ocultar = useCallback(
    (c: ConsejoFechas) => {
      if (!preferencias) return;
      guardar({ ...preferencias, consejosDescartados: descartar(c, preferencias.consejosDescartados) }).catch(() => {});
    },
    [preferencias, guardar],
  );
  return { consejos, nuevos, marcar, ocultar };
}

// Ajustes: cuántos consejos de hoy están ocultos y cómo volver a mostrarlos.
export function useConsejosOcultos() {
  const todos = useTodosLosConsejos();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardar = useAlmacen(s => s.guardarPreferencias);
  const ocultos = useMemo(() => todos.filter(c => estaDescartado(c, preferencias?.consejosDescartados)).length, [todos, preferencias]);
  const mostrar = useCallback(() => {
    if (!preferencias) return;
    const { consejosDescartados: _ocultos, ...resto } = preferencias;
    guardar(resto).catch(() => {});
  }, [preferencias, guardar]);
  return { ocultos, mostrar };
}
