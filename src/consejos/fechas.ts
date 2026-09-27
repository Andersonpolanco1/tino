import type { ConfigPais, FechaISO, FuenteIngreso, ReglaFechaLimite, Tarjeta } from '../tipos/tipos';
import { aFecha, fechaLimite, numeroDe, proximoCorte } from '../motor/fechas';
import { cobrosEntre, type Cobro } from '../motor/ingresos';

// Consejos de fechas (decisión D65): cuándo conviene pedirle al banco otra fecha de corte.
// Se simula un año con las fechas de hoy y con el corte de una sola tarjeta cambiado, para que
// cada consejo pida una sola llamada. No toca el ranking: usa las mismas reglas de fechas del
// motor, pero no cambia sus puntajes ni sus casos.
//
// Tres problemas, en orden de importancia:
// - pagoAntesDelCobro (por tarjeta, con 1 o más): el pago vence sin un cobro antes y empuja a
//   la mora. Se revisa la fecha más temprana (la de dólares en doble balance) y, con cobros
//   estimados, se piden 3 días de margen.
// - mismoCobro (2 o más tarjetas, 2 o más cobros al mes): todos los pagos salen del mismo
//   cobro y otro queda libre.
// - diasSinTarjetaBuena (2 o más): hay días del mes en que ninguna tarjeta da muchos días
//   porque los cortes están amontonados. Se mide con el peor día del año, así que con 4 o más
//   tarjetas repartidas no aparece aunque haya fechas cerca.

export type TipoConsejoFechas = 'pagoAntesDelCobro' | 'mismoCobro' | 'diasSinTarjetaBuena';

export interface ConsejoFechas {
  tipo: TipoConsejoFechas;
  tarjetaId: string;
  corteSugerido: number;
  corteDesde: number;
  corteHasta: number;
  // Ejemplo concreto con el corte sugerido: el próximo pago y el cobro con que se pagaría.
  pagoEjemplo: FechaISO;
  cobroEjemplo?: FechaISO;
  // Con doble balance, si la fecha que vence antes del cobro es la de dólares.
  enDolares: boolean;
  // Si hay cobros estimados (se pidieron 3 días de margen).
  cobroEstimado: boolean;
  // Estados de cuenta revisados de esta tarjeta y cuántos vencen antes del cobro, hoy y después.
  mesesRevisados: number;
  mesesAntes: number;
  mesesDespues: number;
  // El peor día del año (días para pagar de la mejor tarjeta ese día), hoy y después.
  peorDiaAntes: number;
  peorDiaDespues: number;
  // Los días de corte de hoy, en orden.
  cortesActuales: number[];
  // mismoCobro: un ejemplo del cobro que paga todo y del que queda libre.
  cobroCargado?: FechaISO;
  cobroLibre?: FechaISO;
  // mismoCobro: si además mejora el peor día al menos MEJORA_MINIMA_DIAS.
  tambienDias: boolean;
  // Tarjetas que seguirían venciendo antes del cobro después de estos consejos (hay un máximo
  // de 2 a la vez): se revisan cuando el usuario actualice sus fechas.
  otrasConProblemaDeCobro: number;
}

export interface EntradaConsejos {
  hoy: FechaISO;
  // Solo las que cuentan: activas y dentro del plan.
  tarjetas: Tarjeta[];
  ingresos: FuenteIngreso[];
  pais: ConfigPais;
}

const DIAS_SIMULADOS = 365;
const ESTADOS_SIMULADOS = 12;
// Los bancos suelen ofrecer cortes del 1 al 28; así el día existe todos los meses.
const CORTES_POSIBLES = Array.from({ length: 28 }, (_, i) => i + 1);
export const MINIMO_ESTADOS_REVISADOS = 3;
export const MARGEN_COBRO = 1;
export const MARGEN_COBRO_ESTIMADO = 3;
export const MEJORA_MINIMA_DIAS = 7;
export const MAXIMO_CONSEJOS_COBRO = 2;
const TOLERANCIA_DIAS = 3;
const ANCHO_RANGO = 2;

// Distancia entre dos días del mes, dando la vuelta (el 29 y el 2 están a 3 días).
export function distanciaCircular(a: number, b: number): number {
  const d = Math.abs(a - b) % 30;
  return Math.min(d, 30 - d);
}

// Con otro corte, el banco suele mantener el mismo plazo de pago (sin el ajuste por día no
// hábil), también el del balance en dólares.
function plazo(regla: ReglaFechaLimite, tarjeta: Tarjeta, hoy: number): ReglaFechaLimite {
  const corte = proximoCorte(hoy, tarjeta);
  return { tipo: 'dias_despues_corte', dias: fechaLimite(corte, regla, 'ninguno', new Set()) - corte };
}

export function conCorte(tarjeta: Tarjeta, diaCorte: number, hoy: number): Tarjeta {
  return {
    ...tarjeta,
    diaCorte,
    fechaLimite: plazo(tarjeta.fechaLimite, tarjeta, hoy),
    fechaLimiteUsd: tarjeta.fechaLimiteUsd ? plazo(tarjeta.fechaLimiteUsd, tarjeta, hoy) : undefined,
  };
}

interface Contexto {
  hoy: number;
  feriados: ReadonlySet<FechaISO>;
  cobros: Cobro[];
  // Hasta qué día se conocen los cobros: con solo fechas personalizadas, la última.
  limiteCobros: number;
  cobrosPorMes: number;
}

interface Estado {
  pago: number;
  enDolares: boolean;
  // El cobro con que se paga: el último con margen antes del pago; null si no hay.
  cobro: Cobro | null;
  // Si entra en la revisión de cobros (con cobros conocidos hasta esa fecha).
  revisado: boolean;
}

interface Simulacion {
  gracia: number[];
  estados: Estado[];
}

function cobroPara(ctx: Contexto, corte: number, pago: number): Cobro | null {
  let elegido: Cobro | null = null;
  for (const c of ctx.cobros) {
    if (c.dia <= corte) continue;
    if (c.dia > pago - MARGEN_COBRO) break;
    if (c.dia <= pago - (c.estimada ? MARGEN_COBRO_ESTIMADO : MARGEN_COBRO)) elegido = c;
  }
  return elegido;
}

function simular(tarjeta: Tarjeta, ctx: Contexto): Simulacion {
  const { hoy, feriados } = ctx;
  const gracia: number[] = [];
  for (let d = hoy; d < hoy + DIAS_SIMULADOS; d++) {
    gracia.push(fechaLimite(proximoCorte(d, tarjeta), tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados) - d);
  }
  const estados: Estado[] = [];
  let corte = proximoCorte(hoy, tarjeta);
  for (let k = 0; k < ESTADOS_SIMULADOS; k++) {
    const principal = fechaLimite(corte, tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados);
    const usd =
      tarjeta.monedaFacturacion === 'doble_balance' && tarjeta.fechaLimiteUsd ? fechaLimite(corte, tarjeta.fechaLimiteUsd, tarjeta.ajusteDiaNoHabil, feriados) : null;
    const pago = usd !== null && usd < principal ? usd : principal;
    const revisado = ctx.cobros.length > 0 && pago <= ctx.limiteCobros;
    estados.push({ pago, enDolares: pago !== principal, cobro: revisado ? cobroPara(ctx, corte, pago) : null, revisado });
    corte = proximoCorte(corte + 1, { diaCorte: tarjeta.diaCorte, compraEnDiaDeCorte: 'entra_en_corte_actual' });
  }
  return { gracia, estados };
}

interface Medida {
  peorDia: number;
  // Por tarjeta: estados revisados y cuántos vencen sin cobro antes.
  revisados: Record<string, number>;
  antes: Record<string, number>;
  conProblemaDeCobro: number;
  // Meses en que todos los pagos salen del mismo cobro habiendo otro.
  mesesMismoCobro: number;
}

export function tieneProblemaDeCobro(revisados: number, antes: number): boolean {
  return revisados >= MINIMO_ESTADOS_REVISADOS && antes * 2 >= revisados;
}

function medir(tarjetas: Tarjeta[], sims: Record<string, Simulacion>, ctx: Contexto): Medida {
  let peorDia = Infinity;
  for (let i = 0; i < DIAS_SIMULADOS; i++) peorDia = Math.min(peorDia, Math.max(...tarjetas.map(t => sims[t.id].gracia[i])));
  const revisados: Record<string, number> = {};
  const antes: Record<string, number> = {};
  let conProblemaDeCobro = 0;
  for (const t of tarjetas) {
    const estados = sims[t.id].estados.filter(x => x.revisado);
    revisados[t.id] = estados.length;
    antes[t.id] = estados.filter(x => !x.cobro).length;
    if (tieneProblemaDeCobro(revisados[t.id], antes[t.id])) conProblemaDeCobro++;
  }
  // Mismo cobro: solo con 2 o más tarjetas y 2 o más cobros al mes. Se agrupan los pagos por
  // mes del calendario (los estados de cuenta de tarjetas con cortes distintos van desfasados).
  let mesesMismoCobro = 0;
  if (tarjetas.length >= 2 && ctx.cobrosPorMes >= 2) {
    const mesDe = (n: number) => aFecha(n).slice(0, 7);
    const meses = new Set(tarjetas.flatMap(t => sims[t.id].estados.map(x => mesDe(x.pago))));
    for (const mes of meses) {
      const estados = tarjetas.map(t => sims[t.id].estados.find(x => mesDe(x.pago) === mes));
      if (estados.some(x => !x || !x.revisado || !x.cobro)) continue;
      const usados = new Set(estados.map(x => x!.cobro!.dia));
      const ultimo = Math.max(...estados.map(x => x!.pago));
      const disponibles = ctx.cobros.filter(c => c.dia > ultimo - 30 && c.dia <= ultimo).length;
      if (usados.size === 1 && disponibles >= 2) mesesMismoCobro++;
    }
  }
  return { peorDia, revisados, antes, conProblemaDeCobro, mesesMismoCobro };
}

interface Candidata {
  corte: number;
  medida: Medida;
  simulacion: Simulacion;
}

interface Criterio {
  // Negativo = a es mejor.
  comparar: (a: Candidata, b: Candidata) => number;
  // Qué candidatas resuelven el problema sin crear otro; la mejor y sus vecinas forman el rango.
  sirve: (c: Candidata) => boolean;
}

interface Propuesta {
  mejor: Candidata;
  desde: number;
  hasta: number;
}

export function consejosDeFechas(e: EntradaConsejos): ConsejoFechas[] {
  if (!e.tarjetas.length) return [];
  const hoy = numeroDe(e.hoy);
  const feriados = new Set(e.pais.feriados);
  const soloPersonalizadas = e.ingresos.length > 0 && e.ingresos.every(i => i.frecuencia.tipo === 'personalizada');
  const cobros = e.ingresos.length ? cobrosEntre(e.ingresos, hoy - 62, hoy + DIAS_SIMULADOS + 62, feriados) : [];
  const limiteCobros = soloPersonalizadas ? Math.max(-Infinity, ...cobros.map(c => c.dia)) : Infinity;
  const cobrosPorMes = e.ingresos.length ? cobrosEntre(e.ingresos, hoy, hoy + 364, feriados).length / 12 : 0;
  const ctx: Contexto = { hoy, feriados, cobros, limiteCobros, cobrosPorMes };

  // La configuración avanza con cada consejo aceptado: el siguiente ya cuenta con él, así dos
  // consejos nunca mandan dos tarjetas al mismo lugar.
  let tarjetas = e.tarjetas;
  const sims: Record<string, Simulacion> = {};
  for (const t of tarjetas) sims[t.id] = simular(t, ctx);
  let actual = medir(tarjetas, sims, ctx);
  const cortesActuales = e.tarjetas.map(t => t.diaCorte).sort((a, b) => a - b);
  const conConsejo = new Set<string>();
  const consejos: ConsejoFechas[] = [];

  function proponer(tarjeta: Tarjeta, criterio: Criterio): Propuesta | null {
    const lista = CORTES_POSIBLES.filter(c => c !== tarjeta.diaCorte).map(corte => {
      const simulacion = simular(conCorte(tarjeta, corte, hoy), ctx);
      return { corte, simulacion, medida: medir(tarjetas, { ...sims, [tarjeta.id]: simulacion }, ctx) };
    });
    const cambio = (c: Candidata) => distanciaCircular(c.corte, tarjeta.diaCorte);
    const [mejor] = lista.filter(criterio.sirve).sort((a, b) => criterio.comparar(a, b) || cambio(a) - cambio(b) || a.corte - b.corte);
    if (!mejor) return null;
    // Rango: los cortes vecinos que también sirven y no son mucho peores, hasta 2 días a cada lado.
    const vecinoBueno = (corte: number) => {
      const c = lista.find(x => x.corte === corte);
      return !!c && criterio.sirve(c) && c.medida.peorDia >= mejor.medida.peorDia - ANCHO_RANGO;
    };
    let desde = mejor.corte;
    let hasta = mejor.corte;
    while (desde > 1 && mejor.corte - (desde - 1) <= ANCHO_RANGO && vecinoBueno(desde - 1)) desde--;
    while (hasta < 28 && hasta + 1 - mejor.corte <= ANCHO_RANGO && vecinoBueno(hasta + 1)) hasta++;
    return { mejor, desde, hasta };
  }

  function aceptar(tipo: TipoConsejoFechas, tarjeta: Tarjeta, p: Propuesta, extra: Partial<ConsejoFechas> = {}) {
    const ejemplo = p.mejor.simulacion.estados[0];
    consejos.push({
      tipo,
      tarjetaId: tarjeta.id,
      corteSugerido: p.mejor.corte,
      corteDesde: p.desde,
      corteHasta: p.hasta,
      pagoEjemplo: aFecha(ejemplo.pago),
      cobroEjemplo: ejemplo.cobro ? aFecha(ejemplo.cobro.dia) : undefined,
      enDolares: sims[tarjeta.id].estados.some(x => x.revisado && !x.cobro && x.enDolares),
      cobroEstimado: cobros.some(c => c.estimada),
      mesesRevisados: actual.revisados[tarjeta.id],
      mesesAntes: actual.antes[tarjeta.id],
      mesesDespues: p.mejor.medida.antes[tarjeta.id],
      peorDiaAntes: actual.peorDia,
      peorDiaDespues: p.mejor.medida.peorDia,
      cortesActuales,
      tambienDias: false,
      otrasConProblemaDeCobro: 0,
      ...extra,
    });
    conConsejo.add(tarjeta.id);
    tarjetas = tarjetas.map(t => (t.id === tarjeta.id ? conCorte(tarjeta, p.mejor.corte, hoy) : t));
    sims[tarjeta.id] = p.mejor.simulacion;
    actual = p.mejor.medida;
  }

  // Entre las tarjetas sin consejo, la que da mejor resultado al moverla; en empate, la más
  // nueva, que suele ser la más fácil de cambiar.
  function mejorEntreTarjetas(criterio: Criterio) {
    const opciones = tarjetas
      .filter(t => !conConsejo.has(t.id))
      .map(t => ({ t, p: proponer(t, criterio) }))
      .filter((x): x is { t: Tarjeta; p: Propuesta } => !!x.p);
    opciones.sort((a, b) => criterio.comparar(a.p.mejor, b.p.mejor) || (a.t.creadaEn < b.t.creadaEn ? 1 : a.t.creadaEn > b.t.creadaEn ? -1 : 0));
    return opciones[0] ?? null;
  }

  // 1. Pago antes del cobro: hasta 2, primero las que fallan más meses. Tiene que quedar en 2
  // de 12 o menos, sin que otra tarjeta pase a pagar antes del cobro.
  const conProblema = e.tarjetas
    .filter(t => tieneProblemaDeCobro(actual.revisados[t.id], actual.antes[t.id]))
    .sort((a, b) => actual.antes[b.id] - actual.antes[a.id])
    .slice(0, MAXIMO_CONSEJOS_COBRO);
  for (const { id } of conProblema) {
    const tarjeta = tarjetas.find(t => t.id === id)!;
    const p = proponer(tarjeta, {
      comparar: (a, b) => a.medida.antes[id] - b.medida.antes[id] || a.medida.mesesMismoCobro - b.medida.mesesMismoCobro || b.medida.peorDia - a.medida.peorDia,
      sirve: c =>
        c.medida.antes[id] * 6 <= c.medida.revisados[id] &&
        c.medida.conProblemaDeCobro < actual.conProblemaDeCobro &&
        c.medida.peorDia >= actual.peorDia - TOLERANCIA_DIAS,
    });
    if (p) aceptar('pagoAntesDelCobro', tarjeta, p);
  }
  const otras = actual.conProblemaDeCobro;
  const conOtras = () => consejos.map(c => ({ ...c, otrasConProblemaDeCobro: otras }));

  if (tarjetas.length < 2) return conOtras();

  // 2. Todos los pagos con el mismo cobro en 6 o más meses: mover una tarjeta para repartirlos.
  // Tiene que quedar en 2 de 12 o menos.
  if (actual.mesesMismoCobro * 2 >= ESTADOS_SIMULADOS) {
    const diasAntes = actual.peorDia;
    const opcion = mejorEntreTarjetas({
      comparar: (a, b) => a.medida.mesesMismoCobro - b.medida.mesesMismoCobro || b.medida.peorDia - a.medida.peorDia,
      sirve: c =>
        c.medida.mesesMismoCobro * 6 <= ESTADOS_SIMULADOS &&
        c.medida.conProblemaDeCobro <= actual.conProblemaDeCobro &&
        c.medida.peorDia >= actual.peorDia - TOLERANCIA_DIAS,
    });
    if (opcion) {
      const cargado = sims[opcion.t.id].estados.find(x => x.cobro)?.cobro?.dia;
      const libre = cargado === undefined ? undefined : cobros.find(c => c.dia > cargado)?.dia;
      aceptar('mismoCobro', opcion.t, opcion.p, {
        cobroCargado: cargado === undefined ? undefined : aFecha(cargado),
        cobroLibre: libre === undefined ? undefined : aFecha(libre),
        tambienDias: opcion.p.mejor.medida.peorDia >= diasAntes + MEJORA_MINIMA_DIAS,
      });
      // Una sola llamada para repartir pagos o días: no se suma el consejo de días.
      return conOtras();
    }
  }

  // 3. Días sin tarjeta buena: mover una tarjeta si el peor día mejora al menos 7, sin crear
  // otro problema.
  const opcion = mejorEntreTarjetas({
    comparar: (a, b) => b.medida.peorDia - a.medida.peorDia || a.medida.mesesMismoCobro - b.medida.mesesMismoCobro,
    sirve: c =>
      c.medida.peorDia >= actual.peorDia + MEJORA_MINIMA_DIAS &&
      c.medida.conProblemaDeCobro <= actual.conProblemaDeCobro &&
      c.medida.mesesMismoCobro <= actual.mesesMismoCobro,
  });
  if (opcion) aceptar('diasSinTarjetaBuena', opcion.t, opcion.p);

  return conOtras();
}
