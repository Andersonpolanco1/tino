// Simulador de consejos de fechas: corre escenarios de tarjetas y cobros de la vida real
// dominicana contra el código real de src/consejos (D73) y lo compara con un prototipo
// independiente de la misma regla.
// Uso: npx jest --testMatch "**/herramientas/consejos/simular.ts"
// Escribe herramientas/consejos/reporte.md y un resumen en la consola.
import { writeFileSync } from 'fs';
import { join } from 'path';
import type { FuenteIngreso, Tarjeta } from '../../src/tipos/tipos';
import { consejosDeFechas, conCorte, distanciaCircular, type ConsejoFechas } from '../../src/consejos/fechas';
import { aFecha, fechaLimite, numeroDe, proximoCorte } from '../../src/motor/fechas';
import { cobrosEntre } from '../../src/motor/ingresos';

import { COBROS, escenarios, feriados, HOY, pais, type Escenario } from './escenarios';

// ---------- Regla propuesta ----------

const DIAS_RIESGO = 21; // más de 3 semanas desde el último cobro hasta el pago
const CORTES_JUNTOS = 7; // todas cortan a menos de una semana
const MEJORA_MINIMA = 7; // separar cortes solo si el peor día sube al menos esto
const MAXIMO_CONSEJOS = 2;
// Un pago desde otro banco tarda 1 o 2 días laborables y las nóminas a veces se atrasan: un cobro
// cuenta si llega al menos 2 días antes del pago (3 si es estimado).
const MARGEN_COBRO = 1;
const MARGEN_ESTIMADO = 3;
// Arreglar el cobro puede costar días de gracia mientras el peor día del año no baje de este piso.
const PISO_PEOR_DIA = 20;
// Un cobro de fechas variables que se mueve más de esto de un mes a otro no sirve para alinear pagos.
const VARIACION_MAXIMA = 5;

interface MedidaTarjeta {
  pagos: string;
  desdeCobro: number[]; // por estado: días desde el último cobro hasta el pago; NaN si no se sabe
  riesgo: boolean;
}

// Cobros con fecha regular: fijos, o personalizados que caen casi el mismo día cada mes.
function cobrosRegulares(ingresos: FuenteIngreso[]): FuenteIngreso[] {
  return ingresos.filter(i => {
    if (i.frecuencia.tipo !== 'personalizada') return true;
    const dias = i.frecuencia.fechas.map(f => Number(f.fecha.slice(8)));
    return dias.every(a => dias.every(b => distanciaCircular(a, b) <= VARIACION_MAXIMA));
  });
}

function medirTarjeta(t: Tarjeta, todos: FuenteIngreso[]): MedidaTarjeta {
  const ingresos = cobrosRegulares(todos);
  const hoy = numeroDe(HOY);
  const cobros = ingresos.length ? cobrosEntre(ingresos, hoy - 62, hoy + 430, feriados) : [];
  // Con fechas anotadas, solo el tramo que cubren todas.
  const tramos = ingresos.flatMap(i => (i.frecuencia.tipo === 'personalizada' ? [i.frecuencia.fechas.map(f => numeroDe(f.fecha))] : []));
  const limite = tramos.length ? Math.min(...tramos.map(d => Math.max(...d))) : Infinity;
  const primero = tramos.length ? Math.max(...tramos.map(d => Math.min(...d))) : -Infinity;
  const desdeCobro: number[] = [];
  const dias: number[] = [];
  let corte = proximoCorte(hoy, t);
  for (let k = 0; k < 12; k++) {
    const principal = fechaLimite(corte, t.fechaLimite, t.ajusteDiaNoHabil, feriados);
    const usd = t.monedaFacturacion === 'doble_balance' && t.fechaLimiteUsd ? fechaLimite(corte, t.fechaLimiteUsd, t.ajusteDiaNoHabil, feriados) : null;
    const pago = usd !== null && usd < principal ? usd : principal;
    dias.push(Number(aFecha(pago).slice(8)));
    const ultimo = cobros.filter(c => c.dia <= pago - (c.estimada ? MARGEN_ESTIMADO : MARGEN_COBRO)).at(-1);
    desdeCobro.push(ingresos.length && pago <= limite && ultimo && ultimo.dia >= primero ? pago - ultimo.dia : NaN);
    corte = proximoCorte(corte + 1, { diaCorte: t.diaCorte, compraEnDiaDeCorte: 'entra_en_corte_actual' });
  }
  const conocidos = desdeCobro.filter(n => !Number.isNaN(n));
  const riesgo = conocidos.length >= 3 && conocidos.filter(n => n > DIAS_RIESGO).length * 2 >= conocidos.length;
  return { pagos: [...new Set(dias)].join('/'), desdeCobro, riesgo };
}

function peorDia(tarjetas: Tarjeta[]): number {
  const hoy = numeroDe(HOY);
  let peor = Infinity;
  for (let d = hoy; d < hoy + 365; d++) {
    peor = Math.min(peor, Math.max(...tarjetas.map(t => fechaLimite(proximoCorte(d, t), t.fechaLimite, t.ajusteDiaNoHabil, feriados) - d)));
  }
  return peor;
}

function amontonadas(tarjetas: Tarjeta[]): boolean {
  if (tarjetas.length < 2 || tarjetas.length > 4) return false;
  const cortes = tarjetas.map(t => t.diaCorte);
  return cortes.every(a => cortes.every(b => distanciaCircular(a, b) < CORTES_JUNTOS));
}

// El mejor corte para quitarle el riesgo a una tarjeta: sin riesgo propio, sin amontonar los
// cortes y con el peor día más alto. Devuelve cuánto cambia el peor día (negativo = pierde).
function arregloRiesgo(t: Tarjeta, tarjetas: Tarjeta[], ingresos: FuenteIngreso[]): { corte: number; cambio: number } | null {
  const base = peorDia(tarjetas);
  let mejor: { corte: number; cambio: number } | null = null;
  for (let c = 1; c <= 28; c++) {
    if (c === t.diaCorte) continue;
    const movida = conCorte(t, c, numeroDe(HOY));
    if (medirTarjeta(movida, ingresos).riesgo) continue;
    const nuevas = tarjetas.map(x => (x.id === t.id ? movida : x));
    if (tarjetas.length >= 2 && amontonadas(nuevas)) continue;
    const cambio = peorDia(nuevas) - base;
    if (!mejor || cambio > mejor.cambio) mejor = { corte: c, cambio };
  }
  return mejor;
}

function arregloAmontonadas(tarjetas: Tarjeta[], ingresos: FuenteIngreso[]): { alias: string; cambio: number } | null {
  const base = peorDia(tarjetas);
  let mejor: { alias: string; cambio: number } | null = null;
  const ordenadas = [...tarjetas].sort((a, b) => (a.creadaEn < b.creadaEn ? 1 : a.creadaEn > b.creadaEn ? -1 : 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const t of ordenadas) {
    for (let c = 1; c <= 28; c++) {
      if (c === t.diaCorte) continue;
      const movida = conCorte(t, c, numeroDe(HOY));
      if (medirTarjeta(movida, ingresos).riesgo) continue;
      const cambio = peorDia(tarjetas.map(x => (x.id === t.id ? movida : x))) - base;
      if (cambio >= MEJORA_MINIMA && (!mejor || cambio > mejor.cambio)) mejor = { alias: t.alias, cambio };
    }
    // La primera tarjeta, por orden fijo (más nueva y luego id), que se puede mover: así el
    // consejo no salta de tarjeta con el calendario.
    if (mejor) return mejor;
  }
  return mejor;
}

const promedio = (xs: number[]) => {
  const v = xs.filter(n => !Number.isNaN(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
};

// Lo que vería el usuario con la regla propuesta. Los consejos se calculan en orden: el segundo
// cuenta con el cambio del primero.
function propuesta(e: Escenario): { consejos: string[]; notas: string[] } {
  const ingresos = COBROS[e.cobros];
  let tarjetas = e.tarjetas;
  const base = peorDia(e.tarjetas);
  const consejos: string[] = [];
  const notas: string[] = [];
  const conRiesgo = e.tarjetas
    .map(t => ({ t, m: medirTarjeta(t, ingresos) }))
    .filter(x => x.m.riesgo)
    .sort((a, b) => promedio(b.m.desdeCobro) - promedio(a.m.desdeCobro));
  const juntas = amontonadas(e.tarjetas);
  let juntasResuelto = !juntas;
  for (const x of conRiesgo) {
    const arreglo = arregloRiesgo(x.t, tarjetas, ingresos);
    const dias = Math.round(promedio(x.m.desdeCobro));
    if (!arreglo) {
      notas.push(`${x.t.alias}: riesgo (~${dias} días) sin arreglo posible`);
      continue;
    }
    const antes = peorDia(tarjetas);
    if (antes + arreglo.cambio < Math.min(antes, PISO_PEOR_DIA)) {
      notas.push(`${x.t.alias}: riesgo (~${dias} días), arreglarlo baja el peor día a ${antes + arreglo.cambio}; se calla`);
      continue;
    }
    if (consejos.length >= MAXIMO_CONSEJOS) {
      notas.push(`${x.t.alias}: riesgo (~${dias} días), queda para después (máximo ${MAXIMO_CONSEJOS})`);
      continue;
    }
    const separa = !juntasResuelto && arreglo.cambio >= MEJORA_MINIMA;
    if (separa) juntasResuelto = true;
    tarjetas = tarjetas.map(t => (t.id === x.t.id ? conCorte(t, arreglo.corte, numeroDe(HOY)) : t));
    const costo = arreglo.cambio < 0 ? `, cuesta ${-arreglo.cambio} días` : arreglo.cambio > 0 ? `, gana ${arreglo.cambio} días` : '';
    consejos.push(`COBRO ${x.t.alias} (paga el ${x.m.pagos}, ~${dias} días desde el cobro${costo})${separa ? ' + separa cortes' : ''}`);
  }
  if (!juntasResuelto) {
    const arreglo = arregloAmontonadas(tarjetas, ingresos);
    if (!arreglo) notas.push('cortes juntos sin arreglo que no cree riesgo');
    else if (consejos.length >= MAXIMO_CONSEJOS) notas.push('cortes juntos, queda para después');
    else consejos.push(`CORTES JUNTOS (mover ${arreglo.alias}, peor día ${base} → ${base + arreglo.cambio})`);
  }
  return { consejos, notas };
}

// ---------- Corrida ----------

// Forma corta para comparar: "cobro:Alias" o "cortes:Alias".
function cortoCodigo(c: ConsejoFechas, porId: Map<string, Tarjeta>): string {
  return `${c.tipo === 'pagoLejosDelCobro' ? 'cobro' : 'cortes'}:${porId.get(c.tarjetaId)!.alias}${c.separaCortes ? '+separa' : ''}`;
}
function cortoPrototipo(texto: string): string {
  const cobro = texto.match(/^COBRO (.+?) \(/);
  if (cobro) return `cobro:${cobro[1]}${texto.includes('+ separa cortes') ? '+separa' : ''}`;
  return `cortes:${texto.match(/mover (.+?),/)![1]}`;
}

test('simular consejos de fechas', () => {
  const lineas: string[] = [
    '# Simulación de consejos de fechas',
    '',
    `Hoy: ${HOY}, feriados de RD. ${escenarios.length} escenarios.`,
    '',
    `Regla (D73): el pago queda lejos del cobro si en la mitad o más de 12 meses cae más de ${DIAS_RIESGO} días después del último cobro que llegó al menos ${MARGEN_COBRO} días antes (${MARGEN_ESTIMADO} si es estimado); los cobros que varían más de ${VARIACION_MAXIMA} días no cuentan. Cortes juntos si todas cortan a menos de ${CORTES_JUNTOS} días (2 a 4 tarjetas). Máximo ${MAXIMO_CONSEJOS} consejos, calculados en orden; un arreglo del cobro no puede amontonar los cortes ni bajar el peor día del año de ${PISO_PEOR_DIA}.`,
    '',
    '| # | Tarjetas | Cobros | Peor día | Días desde el cobro hasta el pago (promedio por tarjeta) | Consejos de la app | Detalle del prototipo |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  let conConsejo = 0;
  const diferencias: string[] = [];
  const consola: string[] = [];
  escenarios.forEach((e, i) => {
    const n = i + 1;
    const ingresos = COBROS[e.cobros];
    const porId = new Map(e.tarjetas.map(t => [t.id, t]));
    const codigo = consejosDeFechas({ hoy: HOY, tarjetas: e.tarjetas, ingresos, pais }).map(c => cortoCodigo(c, porId));
    const prototipo = propuesta(e);
    const esperado = prototipo.consejos.map(cortoPrototipo);
    if (codigo.length) conConsejo++;
    if (codigo.join() !== esperado.join()) diferencias.push(`${n}: app [${codigo.join(', ')}] prototipo [${esperado.join(', ')}]`);
    const promedios = e.tarjetas.map(t => {
      const p = promedio(medirTarjeta(t, ingresos).desdeCobro);
      return `${t.alias} ${Number.isNaN(p) ? '?' : Math.round(p)}`;
    });
    const tarjetas = `${e.grupo}: ${e.nombre}`;
    const detalle = [...prototipo.consejos, ...prototipo.notas].join('; ');
    lineas.push(`| ${n} | ${tarjetas} | ${e.cobros} | ${peorDia(e.tarjetas)} | ${promedios.join(', ')} | ${codigo.join(', ') || '—'} | ${detalle} |`);
    if (codigo.length) consola.push(`${n} | ${tarjetas} | ${e.cobros} | ${codigo.join(', ')}`);
  });
  const resumen = [
    `Escenarios: ${escenarios.length}. Con algún consejo: ${conConsejo}.`,
    `Diferencias entre la app y el prototipo: ${diferencias.length ? '\n' + diferencias.join('\n') : 'ninguna'}`,
  ];
  lineas.splice(4, 0, ...resumen, '');
  writeFileSync(join(__dirname, 'reporte.md'), lineas.join('\n') + '\n');
  console.log([...resumen, '', ...consola].join('\n'));
});
