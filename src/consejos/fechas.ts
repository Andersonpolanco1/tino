import type { ConfigPais, FechaISO, FuenteIngreso, ModoEnfoque, ReglaFechaLimite, Tarjeta } from '../tipos/tipos';
import { aFecha, fechaLimite, numeroDe, proximoCorte } from '../motor/fechas';
import { cobrosEntre, type Cobro } from '../motor/ingresos';

// Consejos de fechas (decisión D73, reemplaza a D65): cuándo conviene pedirle al banco que mueva
// las fechas de una tarjeta. Tino no sabe qué ciclos ofrece cada banco, así que el consejo dice
// el problema con las fechas del usuario y la dirección del cambio, nunca un día exacto. Por
// dentro se simula un año para dar el consejo solo si existe un cambio que lo arregla sin crear
// otro problema. No toca el ranking: usa las reglas de fechas del motor sin cambiar sus casos.
//
// Dos consejos, calculados en orden (el segundo cuenta con el cambio del primero):
// - pagoLejosDelCobro: en la mitad o más de los próximos 12 estados, el pago cae más de 3
//   semanas después del último cobro. El dinero tiene que durar casi un mes y ahí se cae en
//   mora. Solo con cobros de fecha regular: los de fechas variables no sirven para alinear.
// - cortesJuntos (2 a 4 tarjetas, enfoque Días o Equilibrado): todas cortan a menos de una
//   semana, así que hay días del mes en que ninguna da muchos días para pagar.
// Nada con 5 tarjetas o más: mover una casi siempre desordena otra.

export type TipoConsejoFechas = 'pagoLejosDelCobro' | 'cortesJuntos';

export interface ConsejoFechas {
  tipo: TipoConsejoFechas;
  // La tarjeta cuyas fechas conviene pedir que cambien.
  tarjetaId: string;
  // Identifica la situación (fechas de las tarjetas y cobros): un consejo descartado solo vuelve
  // si cambia (decisión D73).
  huella: string;
  // pagoLejosDelCobro: el día típico en que vence, el del cobro que llega justo después y
  // cuántos días tiene que durar el cobro anterior, en promedio.
  diaPago: number;
  diaCobro: number;
  diasDesdeCobro: number;
  // Si el cobro cae el mismo día del pago o muy poco antes (dentro del margen): el riesgo no es
  // estirar el dinero sino que el cobro se atrase o el pago tarde en llegar (D76).
  cobroJusto: boolean;
  // Con doble balance, si el pago que queda lejos del cobro es el de dólares.
  enDolares: boolean;
  cobroEstimado: boolean;
  // Si el mismo cambio también separa los cortes amontonados.
  separaCortes: boolean;
  // cortesJuntos: los días de corte de hoy y los días para pagar del peor día del año.
  cortes: number[];
  peorDia: number;
  // Si hay cobros registrados (el consejo de cortes recuerda cuidar el pago).
  conCobros: boolean;
  // Tarjetas que también se pagan lejos del cobro y quedan para después (máximo 2 consejos).
  otrasPendientes: number;
}

export interface EntradaConsejos {
  hoy: FechaISO;
  // Solo las que cuentan: activas y dentro del plan.
  tarjetas: Tarjeta[];
  ingresos: FuenteIngreso[];
  pais: ConfigPais;
  enfoque: ModoEnfoque;
}

const DIAS_SIMULADOS = 365;
const ESTADOS_SIMULADOS = 12;
// Los bancos suelen ofrecer cortes del 1 al 28; así el día existe todos los meses.
const CORTES_POSIBLES = Array.from({ length: 28 }, (_, i) => i + 1);
export const MINIMO_ESTADOS_REVISADOS = 3;
// Más de 3 semanas desde el último cobro hasta el pago.
export const DIAS_LEJOS_DEL_COBRO = 21;
// Un pago desde otro banco tarda 1 o 2 días laborables y las nóminas a veces se atrasan: un
// cobro cuenta si llega al menos 2 días antes del pago (3 si es estimado).
export const MARGEN_COBRO = 2;
export const MARGEN_COBRO_ESTIMADO = 3;
// Un cobro de fechas variables que se mueve más de esto de un mes a otro no sirve para alinear.
export const VARIACION_MAXIMA_COBRO = 5;
export const CORTES_JUNTOS = 7;
export const MEJORA_MINIMA_DIAS = 7;
// Evitar la mora pesa más que unos días de gracia: el arreglo del cobro puede costar días
// mientras el peor día del año no baje de este piso.
export const PISO_PEOR_DIA = 20;
export const MAXIMO_CONSEJOS = 2;
export const MAXIMO_TARJETAS = 4;

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

// Cobros de fecha regular: los fijos, y los personalizados que caen casi el mismo día cada mes.
export function cobrosRegulares(ingresos: FuenteIngreso[]): FuenteIngreso[] {
  return ingresos.filter(i => {
    if (i.frecuencia.tipo !== 'personalizada') return true;
    const dias = i.frecuencia.fechas.map(f => Number(f.fecha.slice(8)));
    return dias.every(a => dias.every(b => distanciaCircular(a, b) <= VARIACION_MAXIMA_COBRO));
  });
}

interface Contexto {
  hoy: number;
  feriados: ReadonlySet<FechaISO>;
  cobros: Cobro[];
  // Qué días se conocen: si hay cobros con fechas anotadas (personalizados), solo el tramo que
  // cubren todos; fuera de él Tino no sabe si siguen llegando y no juzga esos meses.
  primerCobro: number;
  ultimoCobro: number;
}

interface Estado {
  pago: number;
  enDolares: boolean;
  // Días desde el último cobro (con margen) hasta el pago; null si no se sabe.
  desdeCobro: number | null;
  // Un cobro que llega el mismo día del pago o dentro del margen, y el que llega después.
  justo: number | null;
  siguiente: number | null;
}

interface Simulacion {
  gracia: number[];
  estados: Estado[];
  lejos: boolean;
}

function simular(tarjeta: Tarjeta, ctx: Contexto): Simulacion {
  const { hoy, feriados, cobros } = ctx;
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
    let ultimo: Cobro | undefined;
    let justo: Cobro | undefined;
    let siguiente: Cobro | undefined;
    for (const c of cobros) {
      if (c.dia <= pago - (c.estimada ? MARGEN_COBRO_ESTIMADO : MARGEN_COBRO)) ultimo = c;
      else if (c.dia <= pago) justo = c;
      else {
        siguiente = c;
        break;
      }
    }
    const conocido = !!ultimo && ultimo.dia >= ctx.primerCobro && pago <= ctx.ultimoCobro;
    estados.push({ pago, enDolares: pago !== principal, desdeCobro: conocido ? pago - ultimo!.dia : null, justo: justo?.dia ?? null, siguiente: siguiente?.dia ?? null });
    corte = proximoCorte(corte + 1, { diaCorte: tarjeta.diaCorte, compraEnDiaDeCorte: 'entra_en_corte_actual' });
  }
  const conocidos = estados.filter(x => x.desdeCobro !== null);
  const lejos = conocidos.length >= MINIMO_ESTADOS_REVISADOS && conocidos.filter(x => x.desdeCobro! > DIAS_LEJOS_DEL_COBRO).length * 2 >= conocidos.length;
  return { gracia, estados, lejos };
}

// Días para pagar de la mejor tarjeta el peor día del año.
function peorDia(tarjetas: Tarjeta[], sims: Record<string, Simulacion>): number {
  let peor = Infinity;
  for (let i = 0; i < DIAS_SIMULADOS; i++) peor = Math.min(peor, Math.max(...tarjetas.map(t => sims[t.id].gracia[i])));
  return peor;
}

function amontonadas(tarjetas: Tarjeta[]): boolean {
  if (tarjetas.length < 2) return false;
  return tarjetas.every(a => tarjetas.every(b => distanciaCircular(a.diaCorte, b.diaCorte) < CORTES_JUNTOS));
}

// El valor más repetido (el día típico del mes).
function moda(valores: number[]): number {
  const cuenta = new Map<number, number>();
  for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 0;
}
const diaDelMes = (n: number) => Number(aFecha(n).slice(8));

// Una huella corta y estable de las fechas que importan: si cambia, es otra situación.
function huellaDe(partes: unknown): string {
  const texto = JSON.stringify(partes);
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
const fechasDe = (t: Tarjeta) => [t.id, t.diaCorte, t.fechaLimite, t.fechaLimiteUsd ?? null, t.ajusteDiaNoHabil];

interface Movida {
  tarjeta: Tarjeta;
  simulacion: Simulacion;
  peor: number;
}

export function consejosDeFechas(e: EntradaConsejos): ConsejoFechas[] {
  if (!e.tarjetas.length || e.tarjetas.length > MAXIMO_TARJETAS) return [];
  const hoy = numeroDe(e.hoy);
  const feriados = new Set(e.pais.feriados);
  const regulares = cobrosRegulares(e.ingresos);
  const cobros = regulares.length ? cobrosEntre(regulares, hoy - 62, hoy + DIAS_SIMULADOS + 62, feriados) : [];
  const tramos = regulares.flatMap(i => (i.frecuencia.tipo === 'personalizada' ? [i.frecuencia.fechas.map(f => numeroDe(f.fecha))] : []));
  const ctx: Contexto = {
    hoy,
    feriados,
    cobros,
    primerCobro: tramos.length ? Math.max(...tramos.map(d => Math.min(...d))) : -Infinity,
    ultimoCobro: tramos.length ? Math.min(...tramos.map(d => Math.max(...d))) : Infinity,
  };
  const cobroEstimado = cobros.some(c => c.estimada);
  const huellaCobros = regulares.map(i => [i.frecuencia, i.ajusteDiaNoHabil]);

  // La configuración avanza con cada consejo aceptado.
  let tarjetas = e.tarjetas;
  const sims: Record<string, Simulacion> = {};
  for (const t of tarjetas) sims[t.id] = simular(t, ctx);
  const cortesJuntosHoy = amontonadas(tarjetas) && (e.enfoque === 'liquidez' || e.enfoque === 'equilibrado');
  const peorHoy = peorDia(tarjetas, sims);
  const consejos: ConsejoFechas[] = [];
  let separadas = !cortesJuntosHoy;
  let otrasPendientes = 0;

  // Todas las formas de mover el corte de una tarjeta, con cómo queda el año.
  const movidas = (tarjeta: Tarjeta): Movida[] =>
    CORTES_POSIBLES.filter(c => c !== tarjeta.diaCorte).map(corte => {
      const movida = conCorte(tarjeta, corte, hoy);
      const simulacion = simular(movida, ctx);
      const nuevas = tarjetas.map(t => (t.id === tarjeta.id ? movida : t));
      return { tarjeta: movida, simulacion, peor: peorDia(nuevas, { ...sims, [tarjeta.id]: simulacion }) };
    });
  const aceptar = (m: Movida) => {
    tarjetas = tarjetas.map(t => (t.id === m.tarjeta.id ? m.tarjeta : t));
    sims[m.tarjeta.id] = m.simulacion;
  };
  const base = {
    diaPago: 0,
    diaCobro: 0,
    diasDesdeCobro: 0,
    cobroJusto: false,
    enDolares: false,
    cobroEstimado,
    separaCortes: false,
    cortes: e.tarjetas.map(t => t.diaCorte).sort((a, b) => a - b),
    peorDia: peorHoy,
    conCobros: cobros.length > 0,
  };

  // 1. Pago lejos del cobro: primero la que estira más el cobro.
  const promedio = (s: Simulacion) => {
    const v = s.estados.filter(x => x.desdeCobro !== null).map(x => x.desdeCobro!);
    return v.reduce((a, b) => a + b, 0) / v.length;
  };
  const lejos = e.tarjetas.filter(t => sims[t.id].lejos).sort((a, b) => promedio(sims[b.id]) - promedio(sims[a.id]));
  for (const original of lejos) {
    // Pasado el máximo, las demás siguen lejos del cobro: se cuentan para decírselo al usuario.
    if (consejos.length >= MAXIMO_CONSEJOS) {
      otrasPendientes++;
      continue;
    }
    const tarjeta = tarjetas.find(t => t.id === original.id)!;
    const antes = peorDia(tarjetas, sims);
    const [mejor] = movidas(tarjeta)
      .filter(m => !m.simulacion.lejos && !amontonadas(tarjetas.map(t => (t.id === tarjeta.id ? m.tarjeta : t))) && m.peor >= Math.min(antes, PISO_PEOR_DIA))
      .sort((a, b) => b.peor - a.peor || distanciaCircular(a.tarjeta.diaCorte, tarjeta.diaCorte) - distanciaCircular(b.tarjeta.diaCorte, tarjeta.diaCorte));
    if (!mejor) continue;
    const sim = sims[tarjeta.id];
    const revisados = sim.estados.filter(x => x.desdeCobro !== null);
    const lejanos = revisados.filter(x => x.desdeCobro! > DIAS_LEJOS_DEL_COBRO);
    const justos = lejanos.filter(x => x.justo !== null);
    const separa = !separadas && mejor.peor >= peorHoy + MEJORA_MINIMA_DIAS;
    if (separa) separadas = true;
    consejos.push({
      ...base,
      tipo: 'pagoLejosDelCobro',
      tarjetaId: tarjeta.id,
      huella: huellaDe([fechasDe(original), huellaCobros]),
      diaPago: moda(lejanos.map(x => diaDelMes(x.pago))),
      diaCobro: justos.length * 2 > lejanos.length ? moda(justos.map(x => diaDelMes(x.justo!))) : moda(lejanos.filter(x => x.siguiente !== null).map(x => diaDelMes(x.siguiente!))),
      cobroJusto: justos.length * 2 > lejanos.length,
      diasDesdeCobro: Math.round(promedio(sim)),
      enDolares: lejanos.filter(x => x.enDolares).length * 2 > lejanos.length,
      separaCortes: separa,
      otrasPendientes: 0,
    });
    aceptar(mejor);
  }

  // 2. Cortes juntos: entre las tarjetas que se pueden mover sin quedar lejos del cobro, la más
  // nueva (suele ser la más fácil de cambiar) y, en empate, siempre la misma. No se elige por
  // cuántos días gana: esos empates cambian con el calendario y el consejo saltaría de tarjeta.
  if (!separadas && consejos.length < MAXIMO_CONSEJOS) {
    const actual = peorDia(tarjetas, sims);
    const opciones = tarjetas
      .flatMap(tarjeta => movidas(tarjeta).map(m => ({ original: tarjeta, m })))
      .filter(({ m }) => !m.simulacion.lejos && m.peor >= actual + MEJORA_MINIMA_DIAS)
      .sort((a, b) => (a.original.creadaEn < b.original.creadaEn ? 1 : a.original.creadaEn > b.original.creadaEn ? -1 : 0) || (a.original.id < b.original.id ? -1 : a.original.id > b.original.id ? 1 : 0));
    const [opcion] = opciones;
    if (opcion) {
      consejos.push({
        ...base,
        tipo: 'cortesJuntos',
        tarjetaId: opcion.original.id,
        huella: huellaDe([e.tarjetas.map(fechasDe), huellaCobros]),
        otrasPendientes: 0,
      });
    }
  }

  return consejos.map(c => ({ ...c, otrasPendientes }));
}
