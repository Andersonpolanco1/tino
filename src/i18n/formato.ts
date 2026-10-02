import type { CodigoMoneda, FechaISO } from '../tipos/tipos';

// Montos y fechas con las APIs de internacionalización del sistema (sección 9).
export function formatearMoneda(monto: number, moneda: CodigoMoneda, idioma: string): string {
  const decimales = Number.isInteger(monto) ? 0 : 2;
  return new Intl.NumberFormat(idioma, {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(monto);
}

// Símbolo de la moneda ("RD$", "US$") para escribirlo junto al monto. En iOS, Hermes usa el Intl
// de Apple, que no tiene NumberFormat.formatToParts: ahí se formatea un 0 y se quitan los dígitos.
export function simboloMoneda(moneda: CodigoMoneda, idioma: string): string {
  const formato = new Intl.NumberFormat(idioma, { style: 'currency', currency: moneda });
  if (typeof formato.formatToParts === 'function') {
    return formato.formatToParts(0).find(p => p.type === 'currency')?.value ?? moneda;
  }
  return formato.format(0).replace(/[\d\s.,\u00a0\u202f\u2212-]/g, '') || moneda;
}

// "25 de septiembre". La fecha es un día de calendario, así que se formatea en UTC.
export function formatearFecha(fecha: FechaISO, idioma: string): string {
  return new Intl.DateTimeFormat(idioma, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${fecha}T00:00:00Z`),
  );
}

// Una parte de una fecha de calendario, pedida sola ({ weekday: 'long' }, { month: 'short' }...).
// No se usa formatToParts: en iOS, Hermes usa el Intl de Apple, que no tiene el de números y en
// el de fechas devuelve las partes con otros tipos, y las fechas salían como "22, 20,".
function parteFecha(fecha: FechaISO, idioma: string, opciones: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(idioma, { ...opciones, timeZone: 'UTC' }).format(new Date(`${fecha}T00:00:00Z`));
}

// Partes de una fecha larga ("Viernes", "25", "septiembre") para armarla con una plantilla de i18n.
export function partesFechaLarga(fecha: FechaISO, idioma: string): { diaSemana: string; dia: string; mes: string } {
  const diaSemana = parteFecha(fecha, idioma, { weekday: 'long' });
  return {
    diaSemana: diaSemana.charAt(0).toLocaleUpperCase(idioma) + diaSemana.slice(1),
    dia: String(Number(fecha.slice(8, 10))),
    mes: parteFecha(fecha, idioma, { month: 'long' }).toLocaleLowerCase(idioma),
  };
}

// Mes abreviado sin el punto final ("sept"), para la línea del ciclo.
export function mesCorto(fecha: FechaISO, idioma: string): string {
  return parteFecha(fecha, idioma, { month: 'short' }).toLocaleLowerCase(idioma).replace(/\.$/, '');
}

// Día y hora locales de un instante (ISO), por ejemplo "28 de septiembre, 3:40 p. m.": la última
// copia del respaldo automático (decisión D81).
export function formatearFechaHora(instante: string, idioma: string): string {
  return new Intl.DateTimeFormat(idioma, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(instante));
}
