import type { AjusteDiaNoHabil, FechaISO, ReglaFechaLimite, Tarjeta } from '../tipos/tipos';

// Las fechas se manejan como días de calendario, sin hora ni zona horaria:
// un número de días desde 1970-01-01 o un trío año, mes (1..12) y día.
const MS_POR_DIA = 86_400_000;

export interface Dia {
  anio: number;
  mes: number;
  dia: number;
}

export function leer(fecha: FechaISO): Dia {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return { anio, mes, dia };
}

export function numero({ anio, mes, dia }: Dia): number {
  return Date.UTC(anio, mes - 1, dia) / MS_POR_DIA;
}

export function aFecha(n: number): FechaISO {
  return new Date(n * MS_POR_DIA).toISOString().slice(0, 10);
}

export function numeroDe(fecha: FechaISO): number {
  return numero(leer(fecha));
}

export function ultimoDia(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

// Día del mes; si el mes es más corto, su último día (corte 31 en febrero = 28 o 29).
export function enMes(anio: number, mes: number, dia: number): number {
  return numero({ anio, mes, dia: Math.min(dia, ultimoDia(anio, mes)) });
}

export function mesSiguiente(anio: number, mes: number): [number, number] {
  return mes === 12 ? [anio + 1, 1] : [anio, mes + 1];
}

export function mesAnterior(anio: number, mes: number): [number, number] {
  return mes === 1 ? [anio - 1, 12] : [anio, mes - 1];
}

// 0 = domingo … 6 = sábado. El 1 de enero de 1970 fue jueves.
export function diaSemana(n: number): number {
  return (((n + 4) % 7) + 7) % 7;
}

export function esHabil(n: number, feriados: ReadonlySet<FechaISO>): boolean {
  const semana = diaSemana(n);
  return semana !== 0 && semana !== 6 && !feriados.has(aFecha(n));
}

// Sección 5.1, paso 4: mueve una fecha no hábil al día hábil anterior o siguiente.
export function ajustar(n: number, modo: AjusteDiaNoHabil, feriados: ReadonlySet<FechaISO>): number {
  if (modo === 'ninguno') return n;
  const paso = modo === 'adelantar' ? -1 : 1;
  let d = n;
  while (!esHabil(d, feriados)) d += paso;
  return d;
}

// Sección 5.1, paso 2.
export function proximoCorte(hoy: number, tarjeta: Pick<Tarjeta, 'diaCorte' | 'compraEnDiaDeCorte'>): number {
  const { anio, mes } = leer(aFecha(hoy));
  const corte = enMes(anio, mes, tarjeta.diaCorte);
  if (hoy < corte || (hoy === corte && tarjeta.compraEnDiaDeCorte === 'entra_en_corte_actual')) return corte;
  const [a, m] = mesSiguiente(anio, mes);
  return enMes(a, m, tarjeta.diaCorte);
}

export function corteAnterior(corte: number, diaCorte: number): number {
  const { anio, mes } = leer(aFecha(corte));
  const [a, m] = mesAnterior(anio, mes);
  return enMes(a, m, diaCorte);
}

// Sección 5.1, pasos 3 y 4. "Día del mes" = primera fecha con ese día posterior al corte.
export function fechaLimite(
  corte: number,
  regla: ReglaFechaLimite,
  modo: AjusteDiaNoHabil,
  feriados: ReadonlySet<FechaISO>,
): number {
  let limite: number;
  if (regla.tipo === 'dia_del_mes') {
    const { anio, mes } = leer(aFecha(corte));
    limite = enMes(anio, mes, regla.dia);
    if (limite <= corte) {
      const [a, m] = mesSiguiente(anio, mes);
      limite = enMes(a, m, regla.dia);
    }
  } else {
    limite = corte + regla.dias;
  }
  return ajustar(limite, modo, feriados);
}
