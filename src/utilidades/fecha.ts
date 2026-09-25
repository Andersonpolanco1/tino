import type { FechaISO } from '../tipos/tipos';

// Fecha de hoy en la zona horaria del teléfono, como la usa el modelo de datos ("AAAA-MM-DD").
export function hoyLocal(ahora: Date = new Date()): FechaISO {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
}
