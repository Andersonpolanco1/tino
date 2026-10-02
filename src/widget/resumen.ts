import type { Catalogo, ConfigPais, FechaISO, FuenteIngreso, Preferencias, Tarjeta } from '../tipos/tipos';
import { calcularRanking } from '../motor';
import { aFecha, numeroDe } from '../motor/fechas';
import { fechaMesCorto, inicialesBanco, OPACIDAD_INICIALES, OPACIDAD_PISTA, textoRecompensa, type Traducir } from '../inicio/vista';
import { buscarEmisor } from '../registro/borrador';
import tokens from '../diseno/tokens.json';
import { TEMA_PREDETERMINADO } from '../diseno/tema';

// Resumen que lee el widget de Android (sección 16.3 de la especificación): solo la tarjeta
// recomendada de cada día, como la tarjeta de hoy de Inicio (decisión D72). Se calcula por
// adelantado para cada día del horizonte, así el widget sigue correcto aunque la app no se
// abra; cualquier cambio de datos lo reemplaza entero. Los textos van ya traducidos y los
// colores salen de los tokens, para que el código nativo no escriba ninguno. Nunca lleva
// montos del usuario ni números de tarjeta.

// Sube cuando cambian los campos; el widget ignora un resumen de otra versión y pide abrir la
// app (VERSION_RESUMEN en TinoWidgetProvider.kt, que una prueba compara).
export const VERSION_RESUMEN = 4;
// Días calculados hacia adelante, como los avisos. Pasado el horizonte sin abrir la app, el
// widget pide abrirla. Cada día es un ranking completo: con 10 tarjetas y cobros, 60 días
// tardan unos 100 ms en una PC.
export const HORIZONTE_WIDGET = 60;

// El widget entero es la tarjeta verde de hoy.
export interface ColoresWidget {
  destacado: string;
  sobreDestacado: string;
  // Línea del ciclo: la pista es el texto sobre el verde con la opacidad de la tarjeta de hoy.
  pista: string;
  recompensaPunto: string;
  // Recuadro del banco: blanco con logo (D63) o translúcido con las iniciales, como ChipBanco.
  fondoLogo: string;
  fondoIniciales: string;
}

// Banco de la tarjeta de hoy: el logo es el archivo del catálogo (el widget lo recibe aparte,
// ver useWidget); sin logo, las iniciales. Null si la tarjeta no tiene banco.
export interface BancoWidget {
  iniciales: string;
  logo: string | null;
}

export interface DiaWidget {
  fecha: FechaISO;
  alias: string;
  banco: BancoWidget | null;
  dias: number;
  // Línea del ciclo, como en la tarjeta de hoy (D35 y D43): "27 sept.", "23 oct." y "19 nov.".
  hoy: string;
  corta: string;
  pagas: string;
  // "10 pts por RD$1,000", sobre el monto de referencia del país; nunca un monto del usuario.
  recompensa: string | null;
  accesible: string;
}

export interface ResumenWidget {
  version: typeof VERSION_RESUMEN;
  estado: 'tarjetas' | 'sinTarjetas' | 'enPausa';
  tema: NonNullable<Preferencias['tema']>;
  // Dirección que abre Inicio al tocar el widget; sin ella se abre la app.
  enlace: string | null;
  colores: { claro: ColoresWidget; oscuro: ColoresWidget };
  textos: { titulo: string; diasParaPagar: string; mensaje: string; abrir: string; hitoHoy: string; hitoCorta: string; hitoPagas: string };
  dias: DiaWidget[];
}

export interface EntradaWidget {
  hoy: FechaISO;
  // Solo las tarjetas del plan (15.2); las pausadas se filtran aquí.
  tarjetas: Tarjeta[];
  ingresos: FuenteIngreso[];
  preferencias: Preferencias;
  pais: ConfigPais;
  catalogo: Catalogo | null;
  t: Traducir;
  idioma: string;
  enlace?: string | null;
  horizonte?: number;
}

// Mezcla un color encima de otro con una opacidad, porque el widget no tiene transparencias.
export function mezclar(fondo: string, encima: string, opacidad: number): string {
  const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const mezcla = [0, 1, 2].map(i => Math.round(canal(fondo, i) * (1 - opacidad) + canal(encima, i) * opacidad));
  return `#${mezcla.map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function colores(modo: 'claro' | 'oscuro'): ColoresWidget {
  const c = tokens.color[modo];
  return {
    destacado: c.destacado,
    sobreDestacado: c.sobreDestacado,
    pista: mezclar(c.destacado, c.sobreDestacado, OPACIDAD_PISTA[modo]),
    recompensaPunto: c.recompensaPunto,
    fondoLogo: c.fondoLogo,
    fondoIniciales: mezclar(c.destacado, c.sobreDestacado, OPACIDAD_INICIALES[modo]),
  };
}

function bancoDe(tarjeta: Tarjeta, catalogo: Catalogo | null): BancoWidget | null {
  const emisor = buscarEmisor(catalogo, tarjeta.emisorId);
  const iniciales = inicialesBanco(emisor?.nombreCorto ?? tarjeta.emisorTextoLibre ?? '');
  return iniciales ? { iniciales, logo: emisor?.logo ?? null } : null;
}

// Logos que usa el resumen, para que el widget tenga solo los de las tarjetas del usuario.
export function logosDelResumen(resumen: ResumenWidget): string[] {
  return [...new Set(resumen.dias.flatMap(d => (d.banco?.logo ? [d.banco.logo] : [])))];
}

export function planificarWidget(e: EntradaWidget): ResumenWidget {
  const { t } = e;
  const activas = e.tarjetas.filter(x => !x.enPausa);
  const estado: ResumenWidget['estado'] = e.tarjetas.length === 0 ? 'sinTarjetas' : activas.length === 0 ? 'enPausa' : 'tarjetas';
  const porId = new Map(activas.map(x => [x.id, x]));
  const hoy = numeroDe(e.hoy);
  const corto = (f: FechaISO) => fechaMesCorto(f, e.idioma, t);
  const dias: DiaWidget[] = [];

  if (estado === 'tarjetas') {
    for (let d = 0; d < (e.horizonte ?? HORIZONTE_WIDGET); d++) {
      const fecha = aFecha(hoy + d);
      const [mejor] = calcularRanking({ hoy: fecha, tarjetas: activas, ingresos: e.ingresos, preferencias: e.preferencias, pais: e.pais }).ranking;
      if (!mejor) continue;
      const tarjeta = porId.get(mejor.tarjetaId)!;
      dias.push({
        fecha,
        alias: tarjeta.alias,
        banco: bancoDe(tarjeta, e.catalogo),
        dias: mejor.diasGracia,
        hoy: corto(fecha),
        corta: corto(mejor.proximoCorte),
        pagas: corto(mejor.fechaPago),
        recompensa: textoRecompensa(tarjeta, mejor, { t, pais: e.pais, idioma: e.idioma }, undefined, true),
        accesible: t('widget.accesible', { alias: tarjeta.alias, dias: mejor.diasGracia }),
      });
    }
  }

  return {
    version: VERSION_RESUMEN,
    estado,
    tema: e.preferencias.tema ?? TEMA_PREDETERMINADO,
    enlace: e.enlace ?? null,
    colores: { claro: colores('claro'), oscuro: colores('oscuro') },
    textos: {
      titulo: t('widget.titulo'),
      diasParaPagar: t('inicio.diasParaPagar'),
      mensaje: estado === 'enPausa' ? t('widget.enPausa') : t('widget.sinTarjetas'),
      abrir: t('widget.abrir'),
      hitoHoy: t('detalle.hitoHoy'),
      hitoCorta: t('detalle.hitoCorta'),
      hitoPagas: t('detalle.hitoPagas'),
    },
    dias,
  };
}
