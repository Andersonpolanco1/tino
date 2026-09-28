import type { ConsejoFechas } from './fechas';

// Decisiones D68 y D73: un consejo se identifica por su tipo, su tarjeta y la huella de las
// fechas y cobros que lo producen, sin montos ni fechas legibles. Mientras esas fechas no
// cambien, es el mismo consejo aunque pase el calendario; si cambian, es otro.

export function claveConsejo(c: ConsejoFechas): string {
  return `${c.tipo}:${c.tarjetaId}:${c.huella}`;
}

// Visto: ya no cuenta como nuevo, pero sigue en Tarjetas (D68).
export function esVisto(c: ConsejoFechas, vistos: readonly string[] | undefined): boolean {
  return (vistos ?? []).includes(claveConsejo(c));
}

// Descartado con "Ya lo sé": no se muestra más mientras sus fechas y cobros sigan iguales (D73).
export function estaDescartado(c: ConsejoFechas, descartados: readonly string[] | undefined): boolean {
  return (descartados ?? []).includes(claveConsejo(c));
}

// Marca como vistos todos los consejos de hoy. Los que ya no existen se quitan de la lista.
export function marcarVistos(consejos: readonly ConsejoFechas[]): string[] {
  return consejos.map(claveConsejo);
}

// Suma un consejo a los descartados, sin repetir.
export function descartar(c: ConsejoFechas, descartados: readonly string[] | undefined): string[] {
  return [...new Set([...(descartados ?? []), claveConsejo(c)])];
}
