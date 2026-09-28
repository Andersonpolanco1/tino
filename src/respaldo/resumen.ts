import type { AjustesAvisos, Catalogo, FuenteIngreso, Preferencias, Recompensa, ReglaFechaLimite, Tarjeta } from '../tipos/tipos';
import type { EstadoSugerencias } from '../sugerencias/elegir';
import { formatearMoneda } from '../i18n/formato';
import { buscarEmisor, buscarProducto } from '../registro/borrador';
import { resumenFrecuencia } from '../ingresos/borrador';
import { nombrePais } from '../paises/nombre';
import type { ContenidoRespaldo } from './contenido';

// "Ver mis datos" (decisión D62): todo lo que Tino guarda del usuario, en palabras, para cumplir
// el derecho de acceso sin exponer el modelo interno (nombres de campos, identificadores,
// versiones). Cada mapa de campos está tipado con todas las claves de su tipo: un campo nuevo
// que nadie ponga aquí rompe la compilación, así el resumen nunca se queda corto.

export type Traducir = (clave: string, opciones?: Record<string, unknown>) => string;

export interface ContextoResumen {
  t: Traducir;
  idioma: string;
  monedaPrincipal: string;
  monedaSecundaria: string | null;
  catalogo: Catalogo | null;
  identificadorAnalitica: string | null;
  hoy: string;
}

// null: el campo no se muestra porque es técnico o no tiene valor.
type Linea = string | null;
type Campos<T> = { [K in keyof Required<T>]: (valor: T, c: ContextoResumen) => Linea };

// Con año: es un documento que se guarda y se puede leer mucho después.
const fecha = (f: string, c: ContextoResumen) =>
  new Intl.DateTimeFormat(c.idioma, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${f.slice(0, 10)}T00:00:00Z`));
const siNo = (v: boolean, c: ContextoResumen) => (v ? c.t('misDatos.si') : c.t('misDatos.no'));

function reglaFecha(r: ReglaFechaLimite, c: ContextoResumen): string {
  return r.tipo === 'dia_del_mes' ? c.t('misDatos.pagoDiaDelMes', { dia: r.dia }) : c.t('misDatos.pagoDiasDespues', { dias: r.dias });
}

function recompensa(r: Recompensa, moneda: string, c: ContextoResumen): string {
  if (r.tipo === 'ninguna') return c.t('misDatos.recompensaNinguna');
  if (r.tipo === 'cashback') return c.t('misDatos.recompensaCashback', { porcentaje: r.porcentaje });
  const regla =
    r.regla.tipo === 'por_monto'
      ? c.t('misDatos.puntosPorMonto', { count: r.regla.puntos, monto: formatearMoneda(r.regla.porCadaMonto, moneda, c.idioma) })
      : r.regla.tipo === 'por_porcentaje'
        ? c.t('misDatos.puntosPorPorcentaje', { porcentaje: r.regla.porcentaje })
        : c.t('misDatos.puntosPorTransaccion', { count: r.regla.puntos });
  const valor = c.t(r.valorPuntoConfirmado ? 'misDatos.valorPuntoConfirmado' : 'misDatos.valorPuntoSinConfirmar', {
    valor: formatearMoneda(r.valorPunto, moneda, c.idioma),
  });
  return `${regla} · ${valor}`;
}

const CAMPOS_TARJETA: Campos<Tarjeta> = {
  id: () => null,
  alias: () => null, // va como título de la tarjeta
  emisorId: (x, c) => (x.emisorId ? c.t('misDatos.banco', { banco: buscarEmisor(c.catalogo, x.emisorId)?.nombreCorto ?? x.emisorId }) : null),
  emisorTextoLibre: (x, c) => (x.emisorTextoLibre ? c.t('misDatos.banco', { banco: x.emisorTextoLibre }) : null),
  productoId: (x, c) =>
    x.productoId
      ? c.t('misDatos.producto', { producto: buscarProducto(c.catalogo, x.emisorId, x.productoId)?.nombre ?? x.productoId })
      : x.productoDesconocido
        ? null
        : c.t('misDatos.producto', { producto: c.t('misDatos.productoOtro') }),
  productoDesconocido: (x, c) => (x.productoDesconocido ? c.t('misDatos.producto', { producto: c.t('misDatos.productoNoSe') }) : null),
  ultimos4: (x, c) => (x.ultimos4 ? c.t('misDatos.ultimos4', { digitos: x.ultimos4 }) : null),
  diaCorte: (x, c) => c.t('misDatos.corte', { dia: x.diaCorte }),
  fechaLimite: (x, c) => reglaFecha(x.fechaLimite, c),
  fechaLimiteUsd: (x, c) => (x.fechaLimiteUsd ? c.t('misDatos.pagoUsd', { regla: reglaFecha(x.fechaLimiteUsd, c) }) : null),
  ajusteDiaNoHabil: (x, c) => c.t(`misDatos.ajustePago.${x.ajusteDiaNoHabil}`),
  compraEnDiaDeCorte: (x, c) => c.t(`misDatos.compraDiaCorte.${x.compraEnDiaDeCorte}`),
  monedaFacturacion: (x, c) => c.t(`misDatos.facturacion.${x.monedaFacturacion}`),
  recompensa: (x, c) => c.t('misDatos.recompensa', { recompensa: recompensa(x.recompensa, c.monedaPrincipal, c) }),
  recompensaUsd: (x, c) =>
    x.recompensaUsd ? c.t('misDatos.recompensaUsd', { recompensa: recompensa(x.recompensaUsd, c.monedaSecundaria ?? c.monedaPrincipal, c) }) : null,
  enPausa: (x, c) => c.t('misDatos.enPausa', { valor: siNo(x.enPausa, c) }),
  creadaEn: (x, c) => c.t('misDatos.registrada', { fecha: fecha(x.creadaEn, c) }),
  pagoHecho: (x, c) => (x.pagoHecho ? c.t('misDatos.pagoHecho', { fecha: fecha(x.pagoHecho, c) }) : null),
};

const CAMPOS_COBRO: Campos<FuenteIngreso> = {
  id: () => null,
  nombre: () => null, // va como título
  frecuencia: (x, c) => {
    const base = resumenFrecuencia(x.frecuencia, c.t);
    if (x.frecuencia.tipo === 'cada_dos_semanas') return `${base} · ${c.t('misDatos.cobroReferencia', { fecha: fecha(x.frecuencia.referencia, c) })}`;
    if (x.frecuencia.tipo !== 'personalizada') return base;
    const fechas = x.frecuencia.fechas.map(f => (f.estimada ? c.t('misDatos.fechaEstimada', { fecha: fecha(f.fecha, c) }) : fecha(f.fecha, c)));
    return `${base}: ${fechas.join(', ')}`;
  },
  ajusteDiaNoHabil: (x, c) => c.t(`misDatos.ajusteCobro.${x.ajusteDiaNoHabil}`),
};

const AVISOS: (keyof AjustesAvisos)[] = ['fechaLimite', 'venceAntesDelCobro', 'vencimiento', 'antesDelCorte', 'cambioTarjeta', 'resumenMensual'];

const CAMPOS_PREFERENCIAS: Campos<Preferencias> = {
  pais: (x, c) => c.t('misDatos.pais', { pais: nombrePais(c.t as never, x.pais) }),
  idioma: (x, c) => c.t('misDatos.idioma', { idioma: x.idioma }),
  enfoque: (x, c) => {
    const modo = c.t('misDatos.enfoque', { enfoque: c.t(`enfoque.${x.enfoque.modo}`) });
    const p = x.enfoque.pesosPersonalizados;
    return p ? `${modo} · ${c.t('misDatos.pesos', { dias: p.dias, puntos: p.puntos, cashback: p.cashback, salud: p.salud })}` : modo;
  },
  pagoBalanceUsd: (x, c) => c.t(`misDatos.pagoBalanceUsd.${x.pagoBalanceUsd ?? 'sin_responder'}`),
  diferencialCambiarioPct: (x, c) => c.t('misDatos.diferencial', { porcentaje: x.diferencialCambiarioPct }),
  umbralCorteCercanoDias: (x, c) => c.t('misDatos.corteCercano', { count: x.umbralCorteCercanoDias }),
  analiticaActiva: (x, c) => c.t('misDatos.analitica', { valor: siNo(x.analiticaActiva, c) }),
  plan: (x, c) => c.t(`misDatos.plan.${x.plan}`),
  tarjetasDelPlan: () => null, // se muestra con los nombres de las tarjetas, más abajo
  finPruebaPro: (x, c) => (x.finPruebaPro ? c.t('misDatos.finPrueba', { fecha: fecha(x.finPruebaPro, c) }) : null),
  avisos: (x, c) =>
    c.t('misDatos.avisos', {
      avisos: AVISOS.map(a => `${c.t(`misDatos.aviso.${a}`)}: ${siNo(x.avisos?.[a] ?? true, c)}`).join(', '),
    }),
  tema: (x, c) => c.t('misDatos.tema', { tema: c.t(`ajustes.temas.${x.tema ?? 'automatico'}`) }),
  consejosVistos: (x, c) => (x.consejosVistos?.length ? c.t('misDatos.consejosVistos', { count: x.consejosVistos.length }) : null),
  respaldoAutomatico: (x, c) => c.t('misDatos.respaldoAutomatico', { valor: siNo(x.respaldoAutomatico ?? false, c) }),
  ultimoRespaldoManual: (x, c) => (x.ultimoRespaldoManual ? c.t('misDatos.ultimoRespaldoManual', { fecha: fecha(x.ultimoRespaldoManual, c) }) : null),
};

const CAMPOS_SUGERENCIAS: Campos<EstadoSugerencias> = {
  activa: (x, c) =>
    x.activa
      ? c.t(x.activa.descartada ? 'misDatos.sugerenciaActivaDescartada' : 'misDatos.sugerenciaActiva', {
          tipo: c.t(`misDatos.sugerencia.${x.activa.tipo}`),
          fecha: fecha(x.activa.desde, c),
        })
      : null,
  descartes: (x, c) => {
    const lineas = Object.entries(x.descartes).map(([tipo, d]) =>
      d ? c.t('misDatos.sugerenciaDescartes', { tipo: c.t(`misDatos.sugerencia.${tipo}`), count: d.veces, fecha: fecha(d.ultimo, c) }) : null,
    );
    return lineas.filter(Boolean).join('\n• ') || null;
  },
};

function lineas<T>(campos: Campos<T>, valor: T, c: ContextoResumen): string[] {
  return (Object.keys(campos) as (keyof T)[]).map(k => campos[k](valor, c)).filter((l): l is string => !!l).map(l => `• ${l}`);
}

export function resumenDeDatos(d: ContenidoRespaldo, c: ContextoResumen): string {
  const { t } = c;
  const partes: string[] = [t('misDatos.titulo'), t('misDatos.generado', { fecha: fecha(c.hoy, c) }), t('misDatos.intro')];

  partes.push(`\n${t('misDatos.seccionTarjetas').toLocaleUpperCase(c.idioma)}`);
  if (!d.tarjetas.length) partes.push(t('misDatos.ninguna'));
  for (const x of d.tarjetas) partes.push(`\n${x.alias}`, ...lineas(CAMPOS_TARJETA, x, c));

  partes.push(`\n${t('misDatos.seccionCobros').toLocaleUpperCase(c.idioma)}`);
  if (!d.ingresos.length) partes.push(t('misDatos.ninguno'));
  for (const x of d.ingresos) partes.push(`\n${x.nombre}`, ...lineas(CAMPOS_COBRO, x, c));

  if (d.preferencias) {
    partes.push(`\n${t('misDatos.seccionPreferencias').toLocaleUpperCase(c.idioma)}`, ...lineas(CAMPOS_PREFERENCIAS, d.preferencias, c));
    const elegidas = d.preferencias.tarjetasDelPlan?.map(id => d.tarjetas.find(x => x.id === id)?.alias).filter(Boolean);
    if (elegidas?.length) partes.push(`• ${t('misDatos.tarjetasDelPlan', { tarjetas: elegidas.join(', ') })}`);
  }

  const sugerencias = d.sugerencias ? lineas(CAMPOS_SUGERENCIAS, d.sugerencias, c) : [];
  if (sugerencias.length) partes.push(`\n${t('misDatos.seccionSugerencias').toLocaleUpperCase(c.idioma)}`, ...sugerencias);

  if (c.identificadorAnalitica) {
    partes.push(`\n${t('misDatos.seccionAnalitica').toLocaleUpperCase(c.idioma)}`, t('misDatos.identificador', { id: c.identificadorAnalitica }));
  }
  partes.push(`\n${t('misDatos.pie')}`);
  return partes.join('\n');
}
