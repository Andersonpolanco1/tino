import type { ConfigPais, Recompensa, ReglaFechaLimite, Tarjeta } from '../tipos/tipos';
import { enMes, fechaLimite, mesSiguiente } from '../motor/fechas';

// Cada error es una clave de i18n bajo "registro.errores".
export type ErrorTarjeta =
  | 'aliasVacio'
  | 'bancoVacio'
  | 'diaCorteInvalido'
  | 'fechaLimiteInvalida'
  | 'fechaLimiteUsdSinDobleBalance'
  | 'fechaLimiteUsdLejana'
  | 'dobleBalanceNoDisponible'
  | 'ultimos4Invalido'
  | 'recompensaInvalida'
  | 'numeroDeTarjeta';

const MAXIMA_DIFERENCIA_USD = 5;

// Sección 6 técnica: ningún campo de texto acepta de 13 a 19 dígitos seguidos, aunque
// vengan separados por espacios, guiones o puntos, para no guardar un número completo.
export function contieneNumeroDeTarjeta(texto: string): boolean {
  return /\d{13,}/.test(texto.replace(/[\s.-]/g, ''));
}

// Revisa todos los textos de un objeto, a cualquier profundidad.
export function algunTextoConNumeroDeTarjeta(valor: unknown): boolean {
  if (typeof valor === 'string') return contieneNumeroDeTarjeta(valor);
  if (Array.isArray(valor)) return valor.some(algunTextoConNumeroDeTarjeta);
  if (valor && typeof valor === 'object') return Object.values(valor).some(algunTextoConNumeroDeTarjeta);
  return false;
}

export function ultimos4Valido(texto: string): boolean {
  return /^\d{4}$/.test(texto);
}

const entero = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;

function reglaValida(regla: ReglaFechaLimite): boolean {
  return regla.tipo === 'dia_del_mes' ? entero(regla.dia, 1, 31) : entero(regla.dias, 1, 60);
}

function recompensaValida(r: Recompensa): boolean {
  const porcentaje = (p: number) => Number.isFinite(p) && p > 0 && p <= 100;
  if (r.tipo === 'ninguna') return true;
  if (r.tipo === 'cashback') return porcentaje(r.porcentaje);
  if (!(Number.isFinite(r.valorPunto) && r.valorPunto > 0)) return false;
  const g = r.regla;
  if (g.tipo === 'por_porcentaje') return porcentaje(g.porcentaje);
  if (g.tipo === 'por_monto') return g.puntos > 0 && g.porCadaMonto > 0;
  return g.puntos > 0;
}

// Sección 4.3: si el banco separa la fecha límite por moneda, la de dólares queda a máximo
// 5 días de la principal. Se compara en 12 cortes seguidos para cubrir meses de 28 a 31 días.
export function fechaLimiteUsdCercana(diaCorte: number, principal: ReglaFechaLimite, usd: ReglaFechaLimite): boolean {
  const sinFeriados = new Set<string>();
  let [anio, mes] = [2027, 1];
  for (let i = 0; i < 12; i++) {
    const corte = enMes(anio, mes, diaCorte);
    const a = fechaLimite(corte, principal, 'ninguno', sinFeriados);
    const b = fechaLimite(corte, usd, 'ninguno', sinFeriados);
    if (Math.abs(a - b) > MAXIMA_DIFERENCIA_USD) return false;
    [anio, mes] = mesSiguiente(anio, mes);
  }
  return true;
}

export function validarTarjeta(t: Tarjeta, pais: ConfigPais): ErrorTarjeta[] {
  const errores: ErrorTarjeta[] = [];
  if (!t.alias.trim()) errores.push('aliasVacio');
  // Con catálogo, el banco es obligatorio: del catálogo o escrito a mano ("Mi banco no está").
  if (pais.catalogoDisponible && !t.emisorId && !t.emisorTextoLibre?.trim()) errores.push('bancoVacio');
  if (!entero(t.diaCorte, 1, 31)) errores.push('diaCorteInvalido');
  if (!reglaValida(t.fechaLimite)) errores.push('fechaLimiteInvalida');
  if (t.monedaFacturacion === 'doble_balance' && !pais.funciones.dobleBalance) errores.push('dobleBalanceNoDisponible');
  if (t.fechaLimiteUsd) {
    if (t.monedaFacturacion !== 'doble_balance') errores.push('fechaLimiteUsdSinDobleBalance');
    else if (!reglaValida(t.fechaLimiteUsd)) errores.push('fechaLimiteInvalida');
    else if (entero(t.diaCorte, 1, 31) && reglaValida(t.fechaLimite) && !fechaLimiteUsdCercana(t.diaCorte, t.fechaLimite, t.fechaLimiteUsd)) {
      errores.push('fechaLimiteUsdLejana');
    }
  }
  if (t.ultimos4 !== undefined && t.ultimos4 !== '' && !ultimos4Valido(t.ultimos4)) errores.push('ultimos4Invalido');
  if (!recompensaValida(t.recompensa) || (t.recompensaUsd && !recompensaValida(t.recompensaUsd))) errores.push('recompensaInvalida');
  if (algunTextoConNumeroDeTarjeta([t.alias, t.emisorTextoLibre])) errores.push('numeroDeTarjeta');
  return [...new Set(errores)];
}
