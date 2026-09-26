import type { FechaISO } from '../tipos/tipos';
import { numeroDe } from '../motor/fechas';

// Sección 2.2 de la especificación: sugerencias para completar datos, una por vez, en el momento
// en que el dato aporta. Máximo una por semana; descartada dos veces, no vuelve en 60 días.

export type TipoSugerencia = 'cobros' | 'valorPunto';

export const DIAS_ENTRE_SUGERENCIAS = 7;
export const DIAS_TRAS_DOS_DESCARTES = 60;

export interface EstadoSugerencias {
  // La sugerencia de esta semana y desde cuándo se muestra.
  activa: { tipo: TipoSugerencia; desde: FechaISO; descartada: boolean } | null;
  descartes: Partial<Record<TipoSugerencia, { veces: number; ultimo: FechaISO }>>;
}

export const ESTADO_INICIAL: EstadoSugerencias = { activa: null, descartes: {} };

const dias = (desde: FechaISO, hasta: FechaISO) => numeroDe(hasta) - numeroDe(desde);

function bloqueada(estado: EstadoSugerencias, tipo: TipoSugerencia, hoy: FechaISO): boolean {
  const d = estado.descartes[tipo];
  return !!d && d.veces >= 2 && dias(d.ultimo, hoy) < DIAS_TRAS_DOS_DESCARTES;
}

// Qué sugerencia mostrar hoy, entre las que aplican ahora (en orden de prioridad), y el estado
// con el que queda. La misma se sigue mostrando esa semana hasta que se descarte o se complete.
export function elegirSugerencia(estado: EstadoSugerencias, candidatas: TipoSugerencia[], hoy: FechaISO): { tipo: TipoSugerencia | null; estado: EstadoSugerencias } {
  const { activa } = estado;
  if (activa && dias(activa.desde, hoy) < DIAS_ENTRE_SUGERENCIAS) {
    const sigue = !activa.descartada && candidatas.includes(activa.tipo);
    return { tipo: sigue ? activa.tipo : null, estado };
  }
  const tipo = candidatas.find(c => !bloqueada(estado, c, hoy)) ?? null;
  if (!tipo) return { tipo: null, estado };
  // Pasados los 60 días, una sugerencia bloqueada vuelve con la cuenta en cero.
  const descartes = { ...estado.descartes };
  if (descartes[tipo] && descartes[tipo]!.veces >= 2) delete descartes[tipo];
  return { tipo, estado: { activa: { tipo, desde: hoy, descartada: false }, descartes } };
}

export function descartarSugerencia(estado: EstadoSugerencias, tipo: TipoSugerencia, hoy: FechaISO): EstadoSugerencias {
  const anterior = estado.descartes[tipo];
  return {
    activa: estado.activa && estado.activa.tipo === tipo ? { ...estado.activa, descartada: true } : estado.activa,
    descartes: { ...estado.descartes, [tipo]: { veces: (anterior?.veces ?? 0) + 1, ultimo: hoy } },
  };
}
