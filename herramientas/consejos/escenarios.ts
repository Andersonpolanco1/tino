// Escenarios de tarjetas y cobros de la vida real dominicana para revisar los consejos de fechas
// (decisión D73). Los usan la prueba src/consejos/__tests__/escenarios.test.ts y el simulador de
// herramientas/consejos/simular.ts.
import type { ConfigPais, FechaISO, FuenteIngreso, FrecuenciaIngreso, ModoEnfoque, ReglaFechaLimite, Tarjeta } from '../../src/tipos/tipos';
import paisDO from '../../src/paises/do.json';

export const HOY: FechaISO = '2026-09-27';
export const pais = paisDO as unknown as ConfigPais;
export const feriados = new Set(pais.feriados);

// ---------- Tarjetas ----------

interface OpcionesTarjeta {
  plazo?: ReglaFechaLimite;
  usd?: number; // doble balance: días después del corte para el balance en dólares
  ajuste?: Tarjeta['ajusteDiaNoHabil'];
}

function tarjeta(alias: string, diaCorte: number, dias: number, o: OpcionesTarjeta = {}): Tarjeta {
  return {
    id: alias,
    alias,
    emisorId: null,
    productoId: null,
    productoDesconocido: false,
    diaCorte,
    fechaLimite: o.plazo ?? { tipo: 'dias_despues_corte', dias },
    ...(o.usd ? { fechaLimiteUsd: { tipo: 'dias_despues_corte' as const, dias: o.usd } } : {}),
    ajusteDiaNoHabil: o.ajuste ?? 'adelantar',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: o.usd ? 'doble_balance' : 'solo_principal',
    recompensa: { tipo: 'cashback', porcentaje: 1 },
    enPausa: false,
    creadaEn: '2026-01-01',
  };
}

// ---------- Cobros de la vida real dominicana ----------

const fuente = (id: string, frecuencia: FrecuenciaIngreso, ajuste: FuenteIngreso['ajusteDiaNoHabil'] = 'adelantar'): FuenteIngreso => ({
  id,
  nombre: id,
  frecuencia,
  ajusteDiaNoHabil: ajuste,
});
const estimadas = (fechas: string[]) => fechas.map(fecha => ({ fecha, estimada: true }));

const uber = fuente('Uber (martes)', { tipo: 'semanal', diaSemana: 2 }, 'ninguno');
const didi = fuente('Didi (lunes)', { tipo: 'semanal', diaSemana: 1 }, 'ninguno');
const quincenal = fuente('Quincena 15 y 30', { tipo: 'quincenal_dias_fijos', dias: [15, 30] });
const mensual = (dia: number | 'ultimo_dia_habil', nombre = `Mensual ${dia}`) => fuente(nombre, { tipo: 'mensual', dia });
const callCenter = fuente('Call center cada 2 viernes', { tipo: 'cada_dos_semanas', diaSemana: 5, referencia: '2026-09-18' });
const remesa = fuente(
  'Remesa (~5, estimada)',
  { tipo: 'personalizada', fechas: estimadas(['2026-10-05', '2026-11-06', '2026-12-04', '2027-01-07', '2027-02-05', '2027-03-05', '2027-04-06']) },
  'ninguno',
);
const remesa15 = fuente(
  'Remesa (~15, estimada)',
  { tipo: 'personalizada', fechas: estimadas(['2026-10-15', '2026-11-16', '2026-12-15', '2027-01-15', '2027-02-15', '2027-03-15', '2027-04-15']) },
  'ninguno',
);
const independiente = fuente(
  'Independiente (fechas variables)',
  { tipo: 'personalizada', fechas: estimadas(['2026-10-08', '2026-11-12', '2026-12-03', '2027-01-15', '2027-02-10', '2027-03-18', '2027-04-09']) },
  'ninguno',
);

export const COBROS: Record<string, FuenteIngreso[]> = {
  'Uber (martes)': [uber],
  'Didi (lunes)': [didi],
  'Empleado quincenal 15/30': [quincenal],
  'Quincenal + Uber': [quincenal, uber],
  'Empleado mensual 30': [mensual(30)],
  'Mensual 30 + Uber': [mensual(30), uber],
  'Mensual último día hábil': [mensual('ultimo_dia_habil', 'Mensual último día hábil')],
  'Último día hábil + Uber': [mensual('ultimo_dia_habil', 'Mensual último día hábil'), uber],
  'Gobierno mensual 25': [mensual(25, 'Gobierno 25')],
  'Empleado mensual 15': [mensual(15)],
  'Call center cada 2 viernes': [callCenter],
  'Call center + Uber': [callCenter, uber],
  'Pensionado mensual 20': [mensual(20, 'Pensión 20')],
  'Remesa (~5)': [remesa],
  'Comisiones mensual 10': [mensual(10, 'Comisiones 10')],
  'Independiente (variable)': [independiente],
  'Independiente + Uber': [independiente, uber],
  'Dos empleos: quincenal + mensual 5': [quincenal, mensual(5)],
  'Mensual 30 + remesa (~15)': [mensual(30), remesa15],
  'Sin cobros': [],
};
const TODOS = Object.keys(COBROS);

// ---------- Escenarios ----------

export interface Escenario {
  grupo: string;
  nombre: string;
  tarjetas: Tarjeta[];
  cobros: string;
  enfoque: ModoEnfoque;
}

export const escenarios: Escenario[] = [];
const agregar = (grupo: string, nombre: string, tarjetas: Tarjeta[], cobros: string[], enfoque: ModoEnfoque = 'equilibrado') => {
  for (const c of cobros) escenarios.push({ grupo, nombre, tarjetas, cobros: c, enfoque });
};

// 1 tarjeta: 3 × 20 cobros.
agregar('1 tarjeta', 'Santa Cruz: corta 23, paga 27 días después (~19)', [tarjeta('Santa Cruz', 23, 27)], TODOS);
agregar('1 tarjeta', 'Popular: corta 5, paga 20 días después (~25)', [tarjeta('Popular', 5, 20)], TODOS);
agregar('1 tarjeta', 'BHD: corta 15, paga el día 10', [tarjeta('BHD', 15, 0, { plazo: { tipo: 'dia_del_mes', dia: 10 } })], TODOS);

// 2 tarjetas: 4 × 12 cobros.
const cobros2 = [
  'Uber (martes)',
  'Empleado quincenal 15/30',
  'Quincenal + Uber',
  'Empleado mensual 30',
  'Mensual 30 + Uber',
  'Mensual último día hábil',
  'Call center cada 2 viernes',
  'Pensionado mensual 20',
  'Remesa (~5)',
  'Independiente (variable)',
  'Dos empleos: quincenal + mensual 5',
  'Sin cobros',
];
agregar('2 tarjetas', 'amontonadas: cortan 5 y 8', [tarjeta('A', 5, 20), tarjeta('B', 8, 20)], cobros2);
agregar('2 tarjetas', 'repartidas: cortan 5 y 20', [tarjeta('A', 5, 20), tarjeta('B', 20, 20)], cobros2);
agregar('2 tarjetas', 'las del usuario: 23 (+27) y 8 (+22)', [tarjeta('Santa Cruz', 23, 27), tarjeta('Banreservas', 8, 22)], cobros2);
agregar('2 tarjetas', 'fin y principio de mes: cortan 28 y 1', [tarjeta('Popular', 28, 20), tarjeta('Banreservas', 1, 22)], cobros2);

// 3 tarjetas: 3 × 10 cobros.
const cobros3 = [
  'Uber (martes)',
  'Empleado quincenal 15/30',
  'Quincenal + Uber',
  'Empleado mensual 30',
  'Mensual 30 + Uber',
  'Call center cada 2 viernes',
  'Remesa (~5)',
  'Independiente (variable)',
  'Dos empleos: quincenal + mensual 5',
  'Sin cobros',
];
agregar('3 tarjetas', 'amontonadas: 3, 5 y 7', [tarjeta('A', 3, 20), tarjeta('B', 5, 20), tarjeta('C', 7, 20)], cobros3);
agregar('3 tarjetas', 'repartidas: 5, 15 y 25', [tarjeta('A', 5, 20), tarjeta('B', 15, 20), tarjeta('C', 25, 20)], cobros3);
agregar('3 tarjetas', 'típica: Popular 3, BHD 15, Banreservas 28', [tarjeta('Popular', 3, 20), tarjeta('BHD', 15, 25), tarjeta('Banreservas', 28, 22)], cobros3);

// 4 tarjetas: 3 × 8 cobros.
const cobros4 = [
  'Empleado quincenal 15/30',
  'Quincenal + Uber',
  'Empleado mensual 30',
  'Mensual 30 + Uber',
  'Call center cada 2 viernes',
  'Independiente (variable)',
  'Dos empleos: quincenal + mensual 5',
  'Sin cobros',
];
agregar('4 tarjetas', 'amontonadas: 1, 3, 5 y 7', [tarjeta('A', 1, 20), tarjeta('B', 3, 20), tarjeta('C', 5, 20), tarjeta('D', 7, 20)], cobros4);
agregar('4 tarjetas', 'repartidas: 1, 8, 15 y 22', [tarjeta('A', 1, 20), tarjeta('B', 8, 20), tarjeta('C', 15, 20), tarjeta('D', 22, 20)], cobros4);
agregar('4 tarjetas', 'por pares: 5, 6, 20 y 21', [tarjeta('A', 5, 20), tarjeta('B', 6, 20), tarjeta('C', 20, 20), tarjeta('D', 21, 20)], cobros4);

// Especiales.
agregar('Especiales', 'doble balance: corta 10, pesos a los 20 y dólares a los 15', [tarjeta('Visa doble', 10, 20, { usd: 15 })], ['Empleado mensual 30', 'Empleado quincenal 15/30', 'Uber (martes)']);
agregar('Especiales', 'doble balance + una en pesos: cortan 10 y 25', [tarjeta('Visa doble', 10, 20, { usd: 15 }), tarjeta('Mastercard', 25, 20)], ['Empleado mensual 30', 'Mensual 30 + Uber']);
agregar('Especiales', 'paga el día 28, corta el 3', [tarjeta('Scotiabank', 3, 0, { plazo: { tipo: 'dia_del_mes', dia: 28 } })], ['Empleado mensual 30', 'Mensual último día hábil']);
agregar('Especiales', 'amontonadas 5 y 8 con enfoque Puntos', [tarjeta('A', 5, 20), tarjeta('B', 8, 20)], ['Empleado quincenal 15/30', 'Empleado mensual 30'], 'puntos');
agregar('Especiales', 'amontonadas 5 y 8 con enfoque Días', [tarjeta('A', 5, 20), tarjeta('B', 8, 20)], ['Empleado quincenal 15/30'], 'liquidez');

