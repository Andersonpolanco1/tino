import type { ResultadoTarjeta } from '../tipos/tipos';

export type OrdenVista = 'recomendado' | 'mas_dias' | 'mas_puntos' | 'mas_cashback';

const valorPorOrden: Record<Exclude<OrdenVista, 'recomendado'>, (r: ResultadoTarjeta) => number> = {
  mas_dias: r => r.diasGracia,
  // El normalizado es proporcional al valor bruto dentro del mismo ranking.
  mas_puntos: r => r.normalizado.puntos,
  mas_cashback: r => r.normalizado.cashback,
};

// Barra de orden (sección 5.4): reordena por el valor bruto de una dimensión, sin pesos,
// y sin tocar el enfoque guardado. En empate se mantiene el orden recomendado.
export function ordenarRanking(ranking: ResultadoTarjeta[], orden: OrdenVista): ResultadoTarjeta[] {
  if (orden === 'recomendado') return ranking;
  const valor = valorPorOrden[orden];
  return [...ranking].sort((a, b) => valor(b) - valor(a));
}
