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

// Partes de una fecha larga ("viernes", "25", "septiembre") para armarla con una plantilla de i18n.
export function partesFechaLarga(fecha: FechaISO, idioma: string): { diaSemana: string; dia: string; mes: string } {
  const partes = new Intl.DateTimeFormat(idioma, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).formatToParts(
    new Date(`${fecha}T00:00:00Z`),
  );
  const parte = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? '';
  const diaSemana = parte('weekday');
  return { diaSemana: diaSemana.charAt(0).toLocaleUpperCase(idioma) + diaSemana.slice(1), dia: parte('day'), mes: parte('month') };
}

// Día y hora locales de un instante (ISO), por ejemplo "28 de septiembre, 3:40 p. m.": la última
// copia del respaldo automático (decisión D81).
export function formatearFechaHora(instante: string, idioma: string): string {
  return new Intl.DateTimeFormat(idioma, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(instante));
}
