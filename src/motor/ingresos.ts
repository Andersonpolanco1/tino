import type { FechaISO, FrecuenciaIngreso, FuenteIngreso } from '../tipos/tipos';
import { ajustar, aFecha, diaSemana, enMes, esHabil, leer, numero, numeroDe, ultimoDia } from './fechas';

// Se revisan también los 7 días de cada lado de la ventana, porque el ajuste por día no hábil
// puede meter un cobro en ella (un sábado adelantado al viernes) o sacarlo (igual que motor.py).
const MARGEN = 7;

// Último día hábil del mes (sección 5.1: "mensual, último día hábil").
function ultimoHabil(anio: number, mes: number, feriados: ReadonlySet<FechaISO>): number {
  let d = numero({ anio, mes, dia: ultimoDia(anio, mes) });
  while (!esHabil(d, feriados)) d--;
  return d;
}

// Si la frecuencia tiene un cobro el día d, antes de ajustarlo por día no hábil.
function cobraEl(f: FrecuenciaIngreso, d: number, feriados: ReadonlySet<FechaISO>): boolean {
  const { anio, mes } = leer(aFecha(d));
  switch (f.tipo) {
    case 'quincenal_dias_fijos':
      return f.dias.some(dia => d === enMes(anio, mes, dia));
    case 'mensual':
      return f.dia === 'ultimo_dia_habil' ? d === ultimoHabil(anio, mes, feriados) : d === enMes(anio, mes, f.dia);
    case 'semanal':
      return diaSemana(d) === f.diaSemana;
    case 'cada_dos_semanas':
      return diaSemana(d) === f.diaSemana && (((d - numeroDe(f.referencia)) % 14) + 14) % 14 === 0;
    case 'personalizada':
      return f.fechas.some(x => d === numeroDe(x.fecha));
  }
}

export interface Cobro {
  dia: number;
  ingresoId: string;
  // Solo en la frecuencia personalizada: la fecha es esperada, no confirmada (sección 5.2).
  estimada: boolean;
}

// Cobros entre dos días, ambos incluidos, ya ajustados por día no hábil y en orden.
export function cobrosEntre(ingresos: FuenteIngreso[], desde: number, hasta: number, feriados: ReadonlySet<FechaISO>): Cobro[] {
  const cobros: Cobro[] = [];
  for (let d = desde - MARGEN; d <= hasta + MARGEN; d++) {
    for (const ingreso of ingresos) {
      const f = ingreso.frecuencia;
      if (!cobraEl(f, d, feriados)) continue;
      const dia = ajustar(d, ingreso.ajusteDiaNoHabil ?? 'ninguno', feriados);
      if (dia < desde || dia > hasta) continue;
      const estimada = f.tipo === 'personalizada' && f.fechas.some(x => x.estimada && numeroDe(x.fecha) === d);
      cobros.push({ dia, ingresoId: ingreso.id, estimada });
    }
  }
  return cobros.sort((a, b) => a.dia - b.dia);
}

// Días con cobro entre dos días, como en la referencia: lo usa el ranking para
// "vence antes del cobro".
export function fechasDeCobro(ingresos: FuenteIngreso[], desde: number, hasta: number, feriados: ReadonlySet<FechaISO>): Set<number> {
  return new Set(cobrosEntre(ingresos, desde, hasta, feriados).map(c => c.dia));
}

// Primer cobro desde un día (incluido), buscando hasta 400 días adelante; para los avisos
// "vence el 12 y cobras el 15".
export function proximoCobro(ingresos: FuenteIngreso[], desde: number, feriados: ReadonlySet<FechaISO>): Cobro | null {
  const ventana = 62;
  for (let inicio = desde; inicio < desde + 400; inicio += ventana + 1) {
    const [primero] = cobrosEntre(ingresos, inicio, inicio + ventana, feriados);
    if (primero) return primero;
  }
  return null;
}
