import type { ConfigPais, FechaISO, FuenteIngreso, Tarjeta } from '../tipos/tipos';
import { numeroDe } from '../motor/fechas';
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
  aviso: AvisoCobro | null;
}

export const estaPagado = (tarjeta: Tarjeta, fecha: FechaISO) => tarjeta.pagoHecho === fecha;

// Todos los pagos pendientes de las tarjetas activas, del más cercano al más lejano.
export function proximosPagos(tarjetas: Tarjeta[], hoy: FechaISO, ingresos: FuenteIngreso[], pais: ConfigPais): PagoPendiente[] {
  return tarjetas
    .filter(t => !t.enPausa)
    .map(tarjeta => {
      const fecha = proximoPago(tarjeta, hoy, pais);
      return { tarjeta, fecha, dias: numeroDe(fecha) - numeroDe(hoy), pagado: estaPagado(tarjeta, fecha), aviso: avisoCobro(fecha, hoy, ingresos, pais) };
    })
    .sort((a, b) => a.dias - b.dias || a.tarjeta.alias.localeCompare(b.tarjeta.alias));
}

// Los de Inicio: sin pagar y que venzan en 7 días o menos, o antes del próximo cobro.
export function pagosParaInicio(pagos: PagoPendiente[]): PagoPendiente[] {
  return pagos.filter(p => !p.pagado && (p.dias <= DIAS_PAGO_EN_INICIO || p.aviso?.tipo === 'antes'));
}
