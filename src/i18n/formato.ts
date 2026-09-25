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

// "25 de septiembre". La fecha es un día de calendario, así que se formatea en UTC.
export function formatearFecha(fecha: FechaISO, idioma: string): string {
  return new Intl.DateTimeFormat(idioma, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${fecha}T00:00:00Z`),
  );
}
