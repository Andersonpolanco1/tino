import type { ConfigPais, FechaISO, FuenteIngreso, Preferencias, ResultadoTarjeta, Tarjeta } from '../tipos/tipos';
import { calcularRanking } from '../motor';
import { aFecha, fechaLimite, numeroDe, proximoCorte } from '../motor/fechas';
import { fechaCorta, proximoPago, type Traducir } from '../inicio/vista';
import { estaPagado } from '../pagos/pendientes';
import { DIAS_ANTES_FECHA_LIMITE } from '../notificaciones/planificar';
import tokens from '../diseno/tokens.json';

// Resumen que lee el widget de Android (sección 11 de la especificación y 16.3): la tarjeta de
// hoy con sus días para pagar, la tarjeta a evitar y el próximo pago. Se calcula por adelantado
// para cada día del horizonte, así el widget sigue correcto aunque la app no se abra; cualquier
// cambio de datos lo reemplaza entero. Los textos van ya traducidos y los colores salen de los
// tokens, para que el código nativo no escriba ninguno. Nunca lleva montos ni números de tarjeta.

export const VERSION_RESUMEN = 1;
// Días calculados hacia adelante, como los avisos. Pasado el horizonte sin abrir la app, el
// widget pide abrirla. Cada día es un ranking completo: con 10 tarjetas y cobros, 60 días
// tardan unos 100 ms en una PC.
export const HORIZONTE_WIDGET = 60;

export interface ColoresWidget {
  fondo: string;
  texto: string;
  textoSecundario: string;
  destacado: string;
  sobreDestacado: string;
  alerta: string;
}

export interface DiaWidget {
  fecha: FechaISO;
  alias: string;
  dias: number;
  // "Evita Visa Popular: corta mañana"; solo si otra tarjeta está en rojo.
  evitar: string | null;
  // El pago sin marcar más cercano; urgente en los últimos días, como el aviso de fecha límite.
  pago: { texto: string; urgente: boolean } | null;
  accesible: string;
}

export interface ResumenWidget {
  version: typeof VERSION_RESUMEN;
  estado: 'tarjetas' | 'sinTarjetas' | 'enPausa';
  tema: NonNullable<Preferencias['tema']>;
  // Dirección que abre Inicio al tocar el widget; sin ella se abre la app.
  enlace: string | null;
  colores: { claro: ColoresWidget; oscuro: ColoresWidget };
  textos: { titulo: string; diasParaPagar: string; mensaje: string; abrir: string };
  dias: DiaWidget[];
}

export interface EntradaWidget {
  hoy: FechaISO;
  // Solo las tarjetas del plan (15.2); las pausadas se filtran aquí.
  tarjetas: Tarjeta[];
  ingresos: FuenteIngreso[];
  preferencias: Preferencias;
  pais: ConfigPais;
  t: Traducir;
  idioma: string;
  enlace?: string | null;
  horizonte?: number;
}

function colores(modo: 'claro' | 'oscuro'): ColoresWidget {
  const c = tokens.color[modo];
  return {
    fondo: c.superficie,
    texto: c.texto,
    textoSecundario: c.textoSecundario,
    destacado: c.destacado,
    sobreDestacado: c.sobreDestacado,
    alerta: c.alertaTexto,
  };
}

// La tarjeta a evitar: otra que corta en 3 días o menos (semáforo rojo), la que corta primero.
function tarjetaAEvitar(ranking: ResultadoTarjeta[]): ResultadoTarjeta | null {
  const [, ...otras] = ranking;
  return otras.filter(r => r.semaforo === 'rojo').sort((a, b) => a.diasParaCorte - b.diasParaCorte)[0] ?? null;
}

function textoEvitar(r: ResultadoTarjeta, alias: string, t: Traducir) {
  const dias = r.diasParaCorte;
  if (dias === 0) return t('widget.evitarHoy', { alias });
  if (dias === 1) return t('widget.evitarManana', { alias });
  return t('widget.evitarEnDias', { alias, dias });
}

// La próxima fecha límite de la tarjeta; si el pago pendiente ya está hecho ("Ya pagué", D45),
// la del estado siguiente.
function pagoSinHacer(tarjeta: Tarjeta, fecha: FechaISO, pais: ConfigPais): FechaISO | null {
  const pendiente = proximoPago(tarjeta, fecha, pais);
  if (!estaPagado(tarjeta, pendiente)) return pendiente;
  const siguiente = aFecha(fechaLimite(proximoCorte(numeroDe(fecha), tarjeta), tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, new Set(pais.feriados)));
  return siguiente > pendiente && !estaPagado(tarjeta, siguiente) ? siguiente : null;
}

// El mismo orden que "Por pagar": el más cercano y, en empate, por alias.
function pagoDelDia(activas: Tarjeta[], e: EntradaWidget, fecha: FechaISO): DiaWidget['pago'] {
  const [pago] = activas
    .flatMap(tarjeta => {
      const pendiente = pagoSinHacer(tarjeta, fecha, e.pais);
      return pendiente ? [{ tarjeta, fecha: pendiente }] : [];
    })
    .map(p => ({ ...p, dias: numeroDe(p.fecha) - numeroDe(fecha) }))
    .sort((a, b) => a.dias - b.dias || a.tarjeta.alias.localeCompare(b.tarjeta.alias));
  if (!pago) return null;
  const alias = pago.tarjeta.alias;
  const texto =
    pago.dias === 0
      ? e.t('widget.pagoHoy', { alias })
      : pago.dias === 1
        ? e.t('widget.pagoManana', { alias })
        : e.t('widget.pagoEl', { alias, fecha: fechaCorta(pago.fecha, e.idioma, e.t) });
  return { texto, urgente: pago.dias <= DIAS_ANTES_FECHA_LIMITE };
}

export function planificarWidget(e: EntradaWidget): ResumenWidget {
  const { t } = e;
  const activas = e.tarjetas.filter(x => !x.enPausa);
  const estado: ResumenWidget['estado'] = e.tarjetas.length === 0 ? 'sinTarjetas' : activas.length === 0 ? 'enPausa' : 'tarjetas';
  const porId = new Map(activas.map(x => [x.id, x]));
  const hoy = numeroDe(e.hoy);
  const dias: DiaWidget[] = [];

  if (estado === 'tarjetas') {
    for (let d = 0; d < (e.horizonte ?? HORIZONTE_WIDGET); d++) {
      const fecha = aFecha(hoy + d);
      const { ranking } = calcularRanking({ hoy: fecha, tarjetas: activas, ingresos: e.ingresos, preferencias: e.preferencias, pais: e.pais });
      const [mejor] = ranking;
      if (!mejor) continue;
      const alias = porId.get(mejor.tarjetaId)!.alias;
      const evitada = tarjetaAEvitar(ranking);
      const evitar = evitada ? textoEvitar(evitada, porId.get(evitada.tarjetaId)!.alias, t) : null;
      const pago = pagoDelDia(activas, e, fecha);
      const accesible = [t('widget.accesible', { alias, dias: mejor.diasGracia }), evitar, pago?.texto].filter(Boolean).join(' ');
      dias.push({ fecha, alias, dias: mejor.diasGracia, evitar, pago, accesible });
    }
  }

  return {
    version: VERSION_RESUMEN,
    estado,
    tema: e.preferencias.tema ?? 'automatico',
    enlace: e.enlace ?? null,
    colores: { claro: colores('claro'), oscuro: colores('oscuro') },
    textos: {
      titulo: t('widget.titulo'),
      diasParaPagar: t('inicio.diasParaPagar'),
      mensaje: estado === 'enPausa' ? t('widget.enPausa') : t('widget.sinTarjetas'),
      abrir: t('widget.abrir'),
    },
    dias,
  };
}
