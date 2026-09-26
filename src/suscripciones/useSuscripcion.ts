import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAlmacen } from '../estado';
import { conEstadoPro, tarjetasEnPlan } from './plan';
import { obtenerServicio, type EstadoPro, type OfertaPro, type ResultadoCompra } from './servicio';

// Las tarjetas que usa Tino según el plan: ranking, avisos, sugerencias y pagos (15.2).
export function useTarjetasEnPlan() {
  const tarjetas = useAlmacen(s => s.tarjetas);
  const plan = useAlmacen(s => s.preferencias?.plan ?? 'gratis');
  const elegidas = useAlmacen(s => s.preferencias?.tarjetasDelPlan);
  return useMemo(() => tarjetasEnPlan(tarjetas, { plan, tarjetasDelPlan: elegidas }), [tarjetas, plan, elegidas]);
}

// Guarda el plan que informa la tienda; sin cambios no escribe nada.
function useGuardarPlan() {
  const preferencias = useAlmacen(s => s.preferencias);
  const guardar = useAlmacen(s => s.guardarPreferencias);
  const actual = useRef(preferencias);
  actual.current = preferencias;
  return useCallback(
    (estado: EstadoPro) => {
      const p = actual.current;
      if (!p) return;
      const siguiente = conEstadoPro(p, estado);
      if (siguiente !== p) guardar(siguiente).catch(() => {});
    },
    [guardar],
  );
}

// Mantiene `Preferencias.plan` al día con la tienda. Sin conexión o sin servicio se usa el plan
// guardado, así la app funciona igual sin internet.
export function useSincronizarPlan() {
  const guardarPlan = useGuardarPlan();
  useEffect(() => {
    let vivo = true;
    let dejar = () => {};
    obtenerServicio()
      .then(async servicio => {
        if (!servicio || !vivo) return;
        guardarPlan(await servicio.estado());
        if (vivo) dejar = servicio.alCambiar(guardarPlan);
      })
      .catch(() => {});
    return () => {
      vivo = false;
      dejar();
    };
  }, [guardarPlan]);
}

export type EstadoOfertas = 'cargando' | 'listo' | 'sin_servicio' | 'error';

// Ofertas, compra y restauración para el muro de pago y Ajustes.
export function useComprasPro() {
  const guardarPlan = useGuardarPlan();
  const [estado, setEstado] = useState<EstadoOfertas>('cargando');
  const [ofertas, setOfertas] = useState<OfertaPro[]>([]);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      const servicio = await obtenerServicio();
      const lista = servicio ? await servicio.ofertas() : [];
      setOfertas(lista);
      setEstado(lista.length ? 'listo' : 'sin_servicio');
    } catch {
      setEstado('error');
    }
  }, []);

  const comprar = useCallback(
    async (id: string): Promise<ResultadoCompra> => {
      const servicio = await obtenerServicio();
      if (!servicio) return 'sin_pro';
      const resultado = await servicio.comprar(id);
      if (resultado === 'pro') guardarPlan(await servicio.estado());
      return resultado;
    },
    [guardarPlan],
  );

  // Devuelve si encontró Pro; si no, deja el plan como está.
  const restaurar = useCallback(async (): Promise<boolean> => {
    const servicio = await obtenerServicio();
    if (!servicio) return false;
    const pro = await servicio.restaurar();
    if (pro) guardarPlan(await servicio.estado());
    return pro;
  }, [guardarPlan]);

  const urlGestion = useCallback(async () => (await obtenerServicio())?.urlGestion() ?? null, []);

  return { estado, ofertas, cargar, comprar, restaurar, urlGestion };
}
