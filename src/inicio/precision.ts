import type { Recompensa, Tarjeta } from '../tipos/tipos';

// Sección 2.1 de la especificación, con los pesos de la decisión D26.
const PESO_ESENCIAL = 40;
const PESO_VALOR_PUNTO = 25;
const PESO_COBROS = 25;
const PESO_PRODUCTO = 10;

const puntoPorConfirmar = (r?: Recompensa) => r?.tipo === 'puntos' && !r.valorPuntoConfirmado;

export interface ContextoPrecision {
  hayIngresos: boolean;
  catalogoDisponible: boolean;
}

// Qué tan completa está la información de una tarjeta, de 0 a 100.
export function precisionTarjeta(t: Tarjeta, c: ContextoPrecision): number {
  let total = PESO_ESENCIAL; // banco, corte, fecha límite y recompensa son obligatorios
  if (!puntoPorConfirmar(t.recompensa) && !puntoPorConfirmar(t.recompensaUsd)) total += PESO_VALOR_PUNTO;
  if (c.hayIngresos) total += PESO_COBROS;
  // Sin catálogo en el país no hay producto que identificar: no se le resta al usuario.
  if (t.productoId !== null || !c.catalogoDisponible) total += PESO_PRODUCTO;
  return total;
}

// Qué falta para subir la precisión, en orden de peso: el valor del punto, los cobros y, al
// final, el tipo exacto de tarjeta. "completa" cuando no falta nada.
export type PistaPrecision = 'punto' | 'cobros' | 'producto' | 'completa';

export function pistaPrecision(tarjetas: Tarjeta[], c: ContextoPrecision): PistaPrecision {
  if (tarjetas.some(t => puntoPorConfirmar(t.recompensa) || puntoPorConfirmar(t.recompensaUsd))) return 'punto';
  if (!c.hayIngresos) return 'cobros';
  if (c.catalogoDisponible && tarjetas.some(t => t.productoId === null)) return 'producto';
  return 'completa';
}

// Para Ajustes: el promedio de las tarjetas; sin tarjetas no hay precisión que mostrar.
export function precisionGeneral(tarjetas: Tarjeta[], c: ContextoPrecision): number | null {
  if (!tarjetas.length) return null;
  return Math.round(tarjetas.reduce((suma, t) => suma + precisionTarjeta(t, c), 0) / tarjetas.length);
}
