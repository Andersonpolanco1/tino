import type { EntradaMotor, FechaISO, ResultadoTarjeta } from '../tipos/tipos';
import { calcularRanking } from '../motor';
import { aFecha, numeroDe } from '../motor/fechas';
import { DIAS_MINIMOS_AL_ESPERAR } from '../notificaciones/planificar';

export interface ConsejoEsperar {
  // Primer día en que conviene comprar: el siguiente a un corte.
  fecha: FechaISO;
  // La mejor tarjeta ese día y sus días para pagar.
  tarjetaId: string;
  dias: number;
  // Los días de la mejor tarjeta si se compra hoy.
  diasHoy: number;
}

// Decisión D103: con dos o más tarjetas y todas por cortar (semáforo rojo), la recomendación de
// hoy es esperar, no una tarjeta. Se prueba el día siguiente a cada corte, del más cercano al más
// lejano, y se elige el primero en que la mejor tarjeta de ese día dé al menos 10 días más que la
// mejor de hoy (el mismo umbral de D66 y D69). Si esperar no gana tanto, no hay consejo y se
// recomienda la mejor de hoy, como siempre. No cambia las reglas del motor.
export function consejoEsperar(entrada: EntradaMotor, ranking: ResultadoTarjeta[]): ConsejoEsperar | null {
  const [mejor] = ranking;
  if (ranking.length < 2 || ranking.some(r => r.semaforo !== 'rojo')) return null;
  const fechas = [...new Set(ranking.map(r => aFecha(numeroDe(r.proximoCorte) + 1)))].sort();
  for (const fecha of fechas) {
    const [luego] = calcularRanking({ ...entrada, hoy: fecha, compra: undefined }).ranking;
    if (luego && luego.diasGracia - mejor.diasGracia >= DIAS_MINIMOS_AL_ESPERAR) {
      return { fecha, tarjetaId: luego.tarjetaId, dias: luego.diasGracia, diasHoy: mejor.diasGracia };
    }
  }
  return null;
}
