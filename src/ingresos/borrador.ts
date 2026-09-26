import type { AjusteDiaNoHabil, ConfigPais, FechaISO, FrecuenciaIngreso, FuenteIngreso } from '../tipos/tipos';
import { aFecha, diaSemana, numeroDe } from '../motor/fechas';
import { cobrosEntre } from '../motor/ingresos';
import { contieneNumeroDeTarjeta } from '../validacion/tarjeta';

export type TipoFrecuencia = FrecuenciaIngreso['tipo'];
export type Traducir = (clave: string, opciones?: Record<string, unknown>) => string;

export const TIPOS_FRECUENCIA: TipoFrecuencia[] = ['quincenal_dias_fijos', 'mensual', 'semanal', 'cada_dos_semanas', 'personalizada'];

// Lo que el formulario edita; se convierte en FuenteIngreso al guardar.
export interface BorradorIngreso {
  nombre: string;
  // Si el usuario escribió el nombre, ya no se cambia solo al elegir otra frecuencia.
  nombreEditado: boolean;
  tipo: TipoFrecuencia | null;
  diaSemana: number; // 0 = domingo
  dias: number[]; // quincenal: dos días
  referencia: FechaISO | null; // cada 2 semanas: un día que ya cobró
  diaMes: number | 'ultimo_dia_habil';
  fechas: { fecha: FechaISO; estimada: boolean }[];
  ajuste: AjusteDiaNoHabil;
}

// Valores precargados: la quincena del 15 y el 30 es lo más común en RD; viernes para lo semanal.
// Si el cobro cae en día no hábil, lo usual es que se adelante.
export function borradorNuevo(): BorradorIngreso {
  return { nombre: '', nombreEditado: false, tipo: null, diaSemana: 5, dias: [15, 30], referencia: null, diaMes: 30, fechas: [], ajuste: 'adelantar' };
}

export function borradorDesde(i: FuenteIngreso): BorradorIngreso {
  const b = { ...borradorNuevo(), nombre: i.nombre, nombreEditado: true, tipo: i.frecuencia.tipo, ajuste: i.ajusteDiaNoHabil };
  const f = i.frecuencia;
  if (f.tipo === 'semanal') return { ...b, diaSemana: f.diaSemana };
  if (f.tipo === 'quincenal_dias_fijos') return { ...b, dias: [...f.dias] };
  if (f.tipo === 'cada_dos_semanas') return { ...b, diaSemana: f.diaSemana, referencia: f.referencia };
  if (f.tipo === 'mensual') return { ...b, diaMes: f.dia };
  return { ...b, fechas: [...f.fechas] };
}

// Al elegir la frecuencia se sugiere un nombre, salvo que el usuario ya haya escrito uno.
export function elegirTipo(b: BorradorIngreso, tipo: TipoFrecuencia, t: Traducir): BorradorIngreso {
  const nombre = b.nombreEditado ? b.nombre : t(tipo === 'personalizada' ? 'cobros.nombreCliente' : 'cobros.nombreNomina');
  return { ...b, tipo, nombre };
}

// Quincenal: tocar un día lo agrega o lo quita; con dos elegidos, el nuevo reemplaza al más viejo.
export function tocarDiaQuincena(dias: number[], dia: number): number[] {
  if (dias.includes(dia)) return dias.filter(d => d !== dia);
  return [...dias, dia].slice(-2);
}

// Cada 2 semanas: las dos últimas veces que fue ese día de la semana, hasta hoy incluido.
// Una de las dos fue día de cobro; el usuario elige cuál.
export function ultimasDosVeces(dia: number, hoy: FechaISO): [FechaISO, FechaISO] {
  const h = numeroDe(hoy);
  const ultima = h - ((diaSemana(h) - dia + 7) % 7);
  return [aFecha(ultima), aFecha(ultima - 7)];
}

export type ErrorIngreso = 'nombreVacio' | 'numeroDeTarjeta' | 'sinTipo' | 'diasQuincena' | 'sinReferencia' | 'sinFechas';

export function frecuenciaDe(b: BorradorIngreso): FrecuenciaIngreso | null {
  switch (b.tipo) {
    case 'semanal':
      return { tipo: 'semanal', diaSemana: b.diaSemana as 0 | 1 | 2 | 3 | 4 | 5 | 6 };
    case 'quincenal_dias_fijos':
      return b.dias.length === 2 ? { tipo: 'quincenal_dias_fijos', dias: [Math.min(...b.dias), Math.max(...b.dias)] } : null;
    case 'cada_dos_semanas':
      return b.referencia ? { tipo: 'cada_dos_semanas', diaSemana: b.diaSemana, referencia: b.referencia } : null;
    case 'mensual':
      return { tipo: 'mensual', dia: b.diaMes };
    case 'personalizada':
      return b.fechas.length ? { tipo: 'personalizada', fechas: [...b.fechas].sort((x, y) => (x.fecha < y.fecha ? -1 : 1)) } : null;
    default:
      return null;
  }
}

// Errores por paso: la frecuencia, sus fechas y el nombre.
export function erroresDe(b: BorradorIngreso): ErrorIngreso[] {
  const errores: ErrorIngreso[] = [];
  if (!b.tipo) errores.push('sinTipo');
  if (b.tipo === 'quincenal_dias_fijos' && b.dias.length !== 2) errores.push('diasQuincena');
  if (b.tipo === 'cada_dos_semanas' && !b.referencia) errores.push('sinReferencia');
  if (b.tipo === 'personalizada' && !b.fechas.length) errores.push('sinFechas');
  if (!b.nombre.trim()) errores.push('nombreVacio');
  else if (contieneNumeroDeTarjeta(b.nombre)) errores.push('numeroDeTarjeta');
  return errores;
}

export type PasoIngreso = 'frecuencia' | 'fechas' | 'nombre';
export const PASOS_INGRESO: PasoIngreso[] = ['frecuencia', 'fechas', 'nombre'];
const ERRORES_POR_PASO: Record<PasoIngreso, ErrorIngreso[]> = {
  frecuencia: ['sinTipo'],
  fechas: ['diasQuincena', 'sinReferencia', 'sinFechas'],
  nombre: ['nombreVacio', 'numeroDeTarjeta'],
};
export const erroresDelPaso = (paso: PasoIngreso, errores: ErrorIngreso[]) => errores.filter(e => ERRORES_POR_PASO[paso].includes(e));

export function aIngreso(b: BorradorIngreso, id: string): { ok: true; ingreso: FuenteIngreso } | { ok: false; errores: ErrorIngreso[] } {
  const errores = erroresDe(b);
  const frecuencia = frecuenciaDe(b);
  if (errores.length || !frecuencia) return { ok: false, errores };
  return { ok: true, ingreso: { id, nombre: b.nombre.trim(), frecuencia, ajusteDiaNoHabil: b.ajuste } };
}

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
export const claveDia = (dia: number) => `cobros.dias.${NOMBRES_DIA[dia]}`;

// "Días 15 y 30", "Cada viernes", "Viernes por medio", "Día 28 de cada mes", "3 fechas".
export function resumenFrecuencia(f: FrecuenciaIngreso, t: Traducir): string {
  switch (f.tipo) {
    case 'semanal':
      return t('cobros.resumenSemanal', { dia: t(claveDia(f.diaSemana)) });
    case 'quincenal_dias_fijos':
      return t('cobros.resumenQuincenal', { a: f.dias[0], b: f.dias[1] });
    case 'cada_dos_semanas':
      return t('cobros.resumenCadaDos', { dia: t(claveDia(f.diaSemana)) });
    case 'mensual':
      return f.dia === 'ultimo_dia_habil' ? t('cobros.resumenUltimoHabil') : t('cobros.resumenMensual', { dia: f.dia });
    case 'personalizada':
      return t('cobros.resumenPersonalizada', { count: f.fechas.length });
  }
}

// Los próximos cobros desde hoy, para la vista previa y la lista.
export function proximosCobros(ingresos: FuenteIngreso[], hoy: FechaISO, pais: ConfigPais, cuantos = 3): { fecha: FechaISO; estimada: boolean }[] {
  const h = numeroDe(hoy);
  return cobrosEntre(ingresos, h, h + 400, new Set(pais.feriados))
    .slice(0, cuantos)
    .map(c => ({ fecha: aFecha(c.dia), estimada: c.estimada }));
}
