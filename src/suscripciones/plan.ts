import type { FechaISO, Preferencias, Tarjeta } from '../tipos/tipos';

// Sección 15.2 de la especificación: el plan gratis permite 2 tarjetas; Tino Pro, ilimitadas.
// Una tarjeta con doble balance es una sola tarjeta, y las que están en pausa también cuentan.
export const LIMITE_GRATIS = 2;

type Plan = Preferencias['plan'];
type DatosPlan = Pick<Preferencias, 'plan' | 'tarjetasDelPlan'>;

export function puedeAgregarTarjeta(tarjetas: Tarjeta[], plan: Plan): boolean {
  return plan === 'pro' || tarjetas.length < LIMITE_GRATIS;
}

// Las más antiguas primero: si el usuario todavía no eligió, se quedan las que registró antes.
function porAntiguedad(tarjetas: Tarjeta[]): Tarjeta[] {
  return tarjetas.map((t, i) => ({ t, i })).sort((a, b) => a.t.creadaEn.localeCompare(b.t.creadaEn) || a.i - b.i).map(x => x.t);
}

// Las tarjetas que usa Tino (ranking, avisos, sugerencias). Al vencer Pro nunca se borra nada:
// las demás quedan guardadas hasta que renueve (15.2).
export function tarjetasEnPlan(tarjetas: Tarjeta[], datos: DatosPlan): Tarjeta[] {
  if (datos.plan === 'pro' || tarjetas.length <= LIMITE_GRATIS) return tarjetas;
  const elegidas = new Set(datos.tarjetasDelPlan ?? []);
  const primero = tarjetas.filter(t => elegidas.has(t.id));
  // Si una elegida se borró, completa con las más antiguas.
  const resto = porAntiguedad(tarjetas.filter(t => !elegidas.has(t.id)));
  const quedan = new Set([...primero, ...resto].slice(0, LIMITE_GRATIS).map(t => t.id));
  return tarjetas.filter(t => quedan.has(t.id));
}

export function fueraDelPlan(tarjeta: Tarjeta, tarjetas: Tarjeta[], datos: DatosPlan): boolean {
  return !tarjetasEnPlan(tarjetas, datos).includes(tarjeta);
}

// Pro venció con más de 2 tarjetas y el usuario todavía no eligió cuáles siguen activas.
export function necesitaElegir(tarjetas: Tarjeta[], datos: DatosPlan): boolean {
  return datos.plan === 'gratis' && tarjetas.length > LIMITE_GRATIS && !datos.tarjetasDelPlan;
}

// Al volver a Pro se olvida la elección: si vence otra vez, el usuario elige con sus tarjetas de ese momento.
export function conPlan(preferencias: Preferencias, plan: Plan): Preferencias {
  if (plan === preferencias.plan) return preferencias;
  const { tarjetasDelPlan: _elegidas, ...resto } = preferencias;
  return { ...(plan === 'pro' ? resto : preferencias), plan };
}

// Aplica lo que informa la tienda: el plan y, si está en la prueba gratis, cuándo se cobra.
// Sin cambios devuelve el mismo objeto, para no guardar de más.
export function conEstadoPro(preferencias: Preferencias, estado: { pro: boolean; finPrueba: FechaISO | null }): Preferencias {
  const conPro = conPlan(preferencias, estado.pro ? 'pro' : 'gratis');
  const fin = estado.pro ? estado.finPrueba : null;
  if ((conPro.finPruebaPro ?? null) === fin) return conPro;
  const { finPruebaPro: _anterior, ...resto } = conPro;
  return fin ? { ...resto, finPruebaPro: fin } : resto;
}
