import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { FechaISO } from '../tipos/tipos';
import { hoyLocal } from '../utilidades/fecha';

// Milisegundos hasta la próxima medianoche local.
export function msHastaMedianoche(ahora: Date): number {
  const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
  return manana.getTime() - ahora.getTime();
}

// La fecha de hoy para el motor. Cambia a medianoche y al volver a la app, porque el
// ranking se recalcula cada día (sección 3.3 de la especificación).
export function useHoy(): FechaISO {
  const [hoy, setHoy] = useState(hoyLocal);

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout>;
    const programar = () => {
      temporizador = setTimeout(() => {
        setHoy(hoyLocal());
        programar();
      }, msHastaMedianoche(new Date()) + 1000);
    };
    programar();
    const suscripcion = AppState.addEventListener('change', estado => {
      if (estado === 'active') setHoy(hoyLocal());
    });
    return () => {
      clearTimeout(temporizador);
      suscripcion.remove();
    };
  }, []);

  return hoy;
}
