import type { ConsejoFechas } from './fechas';

// Decisiones D68 y D73: un consejo se identifica por su tipo, su tarjeta y la huella de las
// fechas y cobros que lo producen, sin montos ni fechas legibles. Mientras esas fechas no
// cambien, es el mismo consejo aunque pase el calendario; si cambian, es otro y vuelve a ser nuevo.

export function claveConsejo(c: ConsejoFechas): string {
  return `${c.tipo}:${c.tarjetaId}:${c.huella}`;
}

// Visto: ya no cuenta como nuevo (sin punto en el bombillo), pero sigue en la pantalla de
// consejos mientras el problema exista (D68 y D74).
export function esVisto(c: ConsejoFechas, vistos: readonly string[] | undefined): boolean {
  return (vistos ?? []).includes(claveConsejo(c));
}

// Marca como vistos todos los consejos de hoy. Los que ya no existen se quitan de la lista.
export function marcarVistos(consejos: readonly ConsejoFechas[]): string[] {
  return consejos.map(claveConsejo);
}
