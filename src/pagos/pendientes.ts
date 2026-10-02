import type { ConfigPais, FechaISO, FuenteIngreso, Tarjeta } from '../tipos/tipos';
import { aFecha, corteAnterior, fechaLimite, numeroDe, proximoCorte } from '../motor/fechas';
import { avisoCobro, proximoPago, type AvisoCobro } from '../inicio/vista';

// Pagos pendientes de cada tarjeta: la fecha límite del estado que ya cortó (o del próximo,
// si esa ya pasó) y si el usuario lo marcó con "Ya pagué" (decisión D45).

// En Inicio solo aparecen los pagos que piden actuar (decisión D44).
export const DIAS_PAGO_EN_INICIO = 7;

export interface PagoPendiente {
  tarjeta: Tarjeta;
  fecha: FechaISO;
  dias: number;
  pagado: boolean;
  // La fecha límite ya pasó y no está marcado (decisión D99).
  vencido: boolean;
  aviso: AvisoCobro | null;
}

export const estaPagado = (tarjeta: Tarjeta, fecha: FechaISO) => tarjeta.pagoHecho === fecha;
// Cubierto: marcado ese pago o uno posterior (quien marcó el de octubre ya pagó el de septiembre).
const cubierto = (tarjeta: Tarjeta, fecha: FechaISO) => !!tarjeta.pagoHecho && tarjeta.pagoHecho >= fecha;

// Decisión D99: el pago que falta. Como proximoPago, pero si la fecha límite del último estado
// ya pasó y no se marcó "Ya pagué", sigue siendo ese hasta el siguiente corte (entonces ese saldo
// ya va en el estado nuevo). Antes saltaba al estado siguiente y el vencido no se podía marcar.
export function pagoPendiente(tarjeta: Tarjeta, hoy: FechaISO, pais: ConfigPais): FechaISO {
  const n = numeroDe(hoy);
  const anterior = corteAnterior(proximoCorte(n, tarjeta), tarjeta.diaCorte);
  const pagoAnterior = aFecha(fechaLimite(anterior, tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, new Set(pais.feriados)));
  return numeroDe(pagoAnterior) < n && !cubierto(tarjeta, pagoAnterior) ? pagoAnterior : proximoPago(tarjeta, hoy, pais);
}

// Decisión D99: una compra en `fecha` puede generar intereses desde el primer día si para
// entonces el estado anterior venció sin marcarse como pagado (casi todos los bancos quitan los
// días sin intereses si no se paga el total). `ya`: venció antes de hoy; si no, vencerá antes
// de esa compra.
export function riesgoIntereses(tarjeta: Tarjeta, fecha: FechaISO, hoy: FechaISO, pais: ConfigPais): { pago: FechaISO; ya: boolean } | null {
  const pago = pagoPendiente(tarjeta, fecha, pais);
  if (numeroDe(pago) >= numeroDe(fecha) || cubierto(tarjeta, pago)) return null;
  return { pago, ya: numeroDe(pago) < numeroDe(hoy) };
}

// Todos los pagos pendientes de las tarjetas activas, del más cercano al más lejano.
export function proximosPagos(tarjetas: Tarjeta[], hoy: FechaISO, ingresos: FuenteIngreso[], pais: ConfigPais): PagoPendiente[] {
  return tarjetas
    .filter(t => !t.enPausa)
    .map(tarjeta => {
      const fecha = pagoPendiente(tarjeta, hoy, pais);
      const dias = numeroDe(fecha) - numeroDe(hoy);
      const pagado = estaPagado(tarjeta, fecha);
      return { tarjeta, fecha, dias, pagado, vencido: dias < 0 && !pagado, aviso: dias < 0 ? null : avisoCobro(fecha, hoy, ingresos, pais) };
    })
    .sort((a, b) => a.dias - b.dias || a.tarjeta.alias.localeCompare(b.tarjeta.alias));
}

// Los de Inicio: sin pagar y que venzan en 7 días o menos, o antes del próximo cobro.
export function pagosParaInicio(pagos: PagoPendiente[]): PagoPendiente[] {
  return pagos.filter(p => !p.pagado && (p.dias <= DIAS_PAGO_EN_INICIO || p.aviso?.tipo === 'antes'));
}
