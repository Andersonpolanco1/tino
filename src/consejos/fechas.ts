import type { ConfigPais, FechaISO, FuenteIngreso, Tarjeta } from '../tipos/tipos';
import { aFecha, fechaLimite, leer, numeroDe, proximoCorte } from '../motor/fechas';
import { cobrosEntre } from '../motor/ingresos';

// Consejos de fechas (decisión D65): cuándo conviene pedirle al banco otra fecha de corte.
// Se simula un año con las fechas de hoy y con la de una sola tarjeta cambiada, para que el
// usuario solo tenga que llamar a un banco. No toca el ranking: usa las mismas reglas de fechas
// del motor, pero no cambia sus puntajes ni sus casos.

export type TipoConsejoFechas = 'pagoAntesDelCobro' | 'cortesJuntos' | 'pagosJuntos';

export interface MedidasFechas {
  // El peor día del año: los días para pagar de la mejor tarjeta ese día.
  peorDia: number;
  // Estados de cuenta, de los próximos 12, sin un cobro entre el corte y el día antes del pago.
  mesesAntesDelCobro: number;
}

export interface ConsejoFechas {
  tipo: TipoConsejoFechas;
  tarjetaId: string;
  // La otra tarjeta del par, en cortes o pagos juntos.
  conTarjetaId?: string;
  corteSugerido: number;
  corteDesde: number;
  corteHasta: number;
  // Ejemplo concreto con el corte sugerido: el próximo pago y, con cobros, el último cobro
  // antes de él.
  pagoEjemplo: FechaISO;
  cobroEjemplo?: FechaISO;
  antes: MedidasFechas;
  despues: MedidasFechas;
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
// Umbrales: "casi siempre" vence antes del cobro, cortes o pagos "juntos" y cuánto tiene que
// mejorar el peor día para que valga la llamada.
export const MESES_PARA_AVISAR = 6;
export const MESES_ACEPTABLES = 2;
export const DIAS_CORTES_JUNTOS = 5;
export const DIAS_PAGOS_JUNTOS = 3;
export const DIAS_PAGOS_SEPARADOS = 7;
export const MEJORA_MINIMA_DIAS = 7;
const TOLERANCIA_DIAS = 3;
const ANCHO_RANGO = 2;

// Distancia entre dos días del mes, dando la vuelta (el 29 y el 2 están a 3 días).
export function distanciaCircular(a: number, b: number): number {
  const d = Math.abs(a - b) % 30;
  return Math.min(d, 30 - d);
}

// Días entre el corte y la fecha límite, sin el ajuste por día no hábil: con otro corte, el
// banco suele mantener el mismo plazo.
function plazoDePago(tarjeta: Tarjeta, hoy: number): number {
  const corte = proximoCorte(hoy, tarjeta);
  return fechaLimite(corte, tarjeta.fechaLimite, 'ninguno', new Set()) - corte;
}

export function conCorte(tarjeta: Tarjeta, diaCorte: number, hoy: number): Tarjeta {
  return { ...tarjeta, diaCorte, fechaLimite: { tipo: 'dias_despues_corte', dias: plazoDePago(tarjeta, hoy) }, fechaLimiteUsd: undefined };
}

interface Simulacion {
  gracia: number[];
  meses: number;
  diaPago: number;
  pagoEjemplo: number;
  cobroEjemplo: number | null;
}

function simular(tarjeta: Tarjeta, hoy: number, feriados: ReadonlySet<FechaISO>, ingresos: FuenteIngreso[]): Simulacion {
  const gracia: number[] = [];
  for (let d = hoy; d < hoy + DIAS_SIMULADOS; d++) {
    gracia.push(fechaLimite(proximoCorte(d, tarjeta), tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados) - d);
  }
  let meses = 0;
  if (ingresos.length) {
    let corte = proximoCorte(hoy, tarjeta);
    for (let k = 0; k < ESTADOS_SIMULADOS; k++) {
      const pago = fechaLimite(corte, tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados);
      // Un cobro el mismo día del pago no alcanza: la transferencia puede no llegar a tiempo.
      if (!cobrosEntre(ingresos, corte + 1, pago - 1, feriados).length) meses++;
      corte = proximoCorte(corte + 1, { diaCorte: tarjeta.diaCorte, compraEnDiaDeCorte: 'entra_en_corte_actual' });
    }
  }
  const corte = proximoCorte(hoy, tarjeta);
  const diaPago = leer(aFecha(fechaLimite(corte, tarjeta.fechaLimite, 'ninguno', feriados))).dia;
  const pagoEjemplo = fechaLimite(corte, tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados);
  const cobros = ingresos.length ? cobrosEntre(ingresos, corte + 1, pagoEjemplo - 1, feriados) : [];
  return { gracia, meses, diaPago, pagoEjemplo, cobroEjemplo: cobros.length ? cobros[cobros.length - 1].dia : null };
}

interface Configuracion {
  peorDia: number;
  meses: Record<string, number>;
  mesesTotal: number;
  distanciaPagos: number;
}

function medir(tarjetas: Tarjeta[], simulaciones: Record<string, Simulacion>): Configuracion {
  let peorDia = Infinity;
  for (let i = 0; i < DIAS_SIMULADOS; i++) {
    peorDia = Math.min(peorDia, Math.max(...tarjetas.map(t => simulaciones[t.id].gracia[i])));
  }
  const meses: Record<string, number> = {};
  for (const t of tarjetas) meses[t.id] = simulaciones[t.id].meses;
  let distanciaPagos = Infinity;
  for (let i = 0; i < tarjetas.length; i++) {
    for (let j = i + 1; j < tarjetas.length; j++) {
      distanciaPagos = Math.min(distanciaPagos, distanciaCircular(simulaciones[tarjetas[i].id].diaPago, simulaciones[tarjetas[j].id].diaPago));
    }
  }
  return { peorDia, meses, mesesTotal: Object.values(meses).reduce((a, b) => a + b, 0), distanciaPagos };
}

interface Candidata {
  corte: number;
  medida: Configuracion;
  diaPago: number;
  simulacion: Simulacion;
}

// Criterio de cada consejo: qué candidata es mejor (negativo = a gana) y cuáles son casi tan
// buenas como la mejor, para dar un rango de días en vez de uno solo.
type Criterio = {
  comparar: (a: Candidata, b: Candidata) => number;
  casiIgual: (c: Candidata, mejor: Candidata) => boolean;
  vale: (mejor: Candidata, actual: Configuracion) => boolean;
};

export function consejosDeFechas(e: EntradaConsejos): ConsejoFechas[] {
  const hoy = numeroDe(e.hoy);
  const feriados = new Set(e.pais.feriados);
  const tarjetas = e.tarjetas;
  if (!tarjetas.length) return [];
  const actuales: Record<string, Simulacion> = {};
  for (const t of tarjetas) actuales[t.id] = simular(t, hoy, feriados, e.ingresos);
  const actual = medir(tarjetas, actuales);

  const candidatas = (tarjeta: Tarjeta): Candidata[] =>
    CORTES_POSIBLES.filter(c => c !== tarjeta.diaCorte).map(corte => {
      const cambiada = conCorte(tarjeta, corte, hoy);
      const simulacion = simular(cambiada, hoy, feriados, e.ingresos);
      return { corte, medida: medir(tarjetas, { ...actuales, [tarjeta.id]: simulacion }), diaPago: simulacion.diaPago, simulacion };
    });

  const cambio = (tarjeta: Tarjeta) => (c: Candidata) => distanciaCircular(c.corte, tarjeta.diaCorte);

  function proponer(tipo: TipoConsejoFechas, tarjeta: Tarjeta, criterio: Criterio, conTarjetaId?: string): ConsejoFechas | null {
    const lista = candidatas(tarjeta);
    const orden = [...lista].sort((a, b) => criterio.comparar(a, b) || cambio(tarjeta)(a) - cambio(tarjeta)(b) || a.corte - b.corte);
    const mejor = orden[0];
    if (!mejor || !criterio.vale(mejor, actual)) return null;
    // Rango: los cortes vecinos casi tan buenos, hasta 2 días a cada lado.
    const bueno = (corte: number) => {
      const c = lista.find(x => x.corte === corte);
      return !!c && criterio.casiIgual(c, mejor);
    };
    let desde = mejor.corte;
    let hasta = mejor.corte;
    while (desde - 1 >= 1 && mejor.corte - (desde - 1) <= ANCHO_RANGO && bueno(desde - 1)) desde--;
    while (hasta + 1 <= 28 && hasta + 1 - mejor.corte <= ANCHO_RANGO && bueno(hasta + 1)) hasta++;
    return {
      tipo,
      tarjetaId: tarjeta.id,
      conTarjetaId,
      corteSugerido: mejor.corte,
      corteDesde: desde,
      corteHasta: hasta,
      pagoEjemplo: aFecha(mejor.simulacion.pagoEjemplo),
      cobroEjemplo: mejor.simulacion.cobroEjemplo === null ? undefined : aFecha(mejor.simulacion.cobroEjemplo),
      antes: { peorDia: actual.peorDia, mesesAntesDelCobro: actual.meses[tarjeta.id] },
      despues: { peorDia: mejor.medida.peorDia, mesesAntesDelCobro: mejor.medida.meses[tarjeta.id] },
    };
  }

  const consejos: ConsejoFechas[] = [];
  const conConsejo = new Set<string>();

  // 1. Vence antes del cobro la mayoría de los meses: es el que puede terminar en mora.
  for (const tarjeta of tarjetas) {
    if (actual.meses[tarjeta.id] < MESES_PARA_AVISAR) continue;
    const id = tarjeta.id;
    const consejo = proponer('pagoAntesDelCobro', tarjeta, {
      comparar: (a, b) => a.medida.meses[id] - b.medida.meses[id] || b.medida.peorDia - a.medida.peorDia || a.medida.mesesTotal - b.medida.mesesTotal,
      casiIgual: (c, m) => c.medida.meses[id] <= MESES_ACEPTABLES && c.medida.peorDia >= m.medida.peorDia - ANCHO_RANGO,
      vale: (m, a) => m.medida.meses[id] <= MESES_ACEPTABLES && m.medida.peorDia >= a.peorDia - TOLERANCIA_DIAS,
    });
    if (consejo) {
      consejos.push(consejo);
      conConsejo.add(id);
    }
  }

  // Pares de tarjetas que cumplen una condición, sin las que ya tienen consejo.
  const pares = (juntas: (a: Tarjeta, b: Tarjeta) => boolean) => {
    const resultado: [Tarjeta, Tarjeta][] = [];
    for (let i = 0; i < tarjetas.length; i++) {
      for (let j = i + 1; j < tarjetas.length; j++) {
        if (juntas(tarjetas[i], tarjetas[j])) resultado.push([tarjetas[i], tarjetas[j]]);
      }
    }
    return resultado;
  };

  // Entre las dos tarjetas del par, propone mover la que da mejor resultado; en empate, la más
  // nueva, que suele ser la más fácil de cambiar.
  function mejorDelPar(tipo: TipoConsejoFechas, par: [Tarjeta, Tarjeta], criterio: Criterio): ConsejoFechas | null {
    const [a, b] = [...par].sort((x, y) => (x.creadaEn < y.creadaEn ? 1 : -1));
    const opciones = [a, b]
      .filter(t => !conConsejo.has(t.id))
      .map(t => ({ t, consejo: proponer(tipo, t, criterio, (t === a ? b : a).id) }))
      .filter((x): x is { t: Tarjeta; consejo: ConsejoFechas } => !!x.consejo);
    opciones.sort((x, y) => y.consejo.despues.peorDia - x.consejo.despues.peorDia);
    return opciones[0]?.consejo ?? null;
  }

  // 2. Cortes juntos: siempre hay días del mes en que ninguna tarjeta da muchos días.
  for (const par of pares((a, b) => distanciaCircular(a.diaCorte, b.diaCorte) <= DIAS_CORTES_JUNTOS)) {
    if (par.some(t => conConsejo.has(t.id))) continue;
    const consejo = mejorDelPar('cortesJuntos', par, {
      comparar: (a, b) => b.medida.peorDia - a.medida.peorDia || a.medida.mesesTotal - b.medida.mesesTotal || b.medida.distanciaPagos - a.medida.distanciaPagos,
      casiIgual: (c, m) => c.medida.peorDia >= m.medida.peorDia - ANCHO_RANGO && c.medida.mesesTotal <= m.medida.mesesTotal,
      vale: (m, a) => m.medida.peorDia >= a.peorDia + MEJORA_MINIMA_DIAS && m.medida.mesesTotal <= a.mesesTotal,
    });
    if (consejo) {
      consejos.push(consejo);
      conConsejo.add(consejo.tarjetaId);
    }
  }

  // 3. Pagos juntos: dos pagos la misma semana, aunque los cortes estén separados.
  const diaPago = (t: Tarjeta) => actuales[t.id].diaPago;
  for (const par of pares((a, b) => distanciaCircular(diaPago(a), diaPago(b)) <= DIAS_PAGOS_JUNTOS)) {
    if (par.some(t => conConsejo.has(t.id))) continue;
    const consejo = mejorDelPar('pagosJuntos', par, {
      comparar: (x, y) => y.medida.distanciaPagos - x.medida.distanciaPagos || x.medida.mesesTotal - y.medida.mesesTotal || y.medida.peorDia - x.medida.peorDia,
      casiIgual: (c, m) => c.medida.distanciaPagos >= Math.min(m.medida.distanciaPagos, DIAS_PAGOS_SEPARADOS) && c.medida.mesesTotal <= m.medida.mesesTotal && c.medida.peorDia >= m.medida.peorDia - ANCHO_RANGO,
      vale: (m, act) => m.medida.distanciaPagos >= DIAS_PAGOS_SEPARADOS && m.medida.mesesTotal <= act.mesesTotal && m.medida.peorDia >= act.peorDia - TOLERANCIA_DIAS,
    });
    if (consejo) {
      consejos.push(consejo);
      conConsejo.add(consejo.tarjetaId);
    }
  }

  return consejos;
}
