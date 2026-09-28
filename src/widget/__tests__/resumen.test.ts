import { readFileSync } from 'fs';
import { join } from 'path';
import type { ConfigPais, FuenteIngreso, Recompensa, Tarjeta } from '../../tipos/tipos';
import { iniciarI18n } from '../../i18n/i18n';
import { preferenciasIniciales } from '../../datos/preferencias';
import { calcularRanking } from '../../motor';
import type { Traducir } from '../../inicio/vista';
import tokens from '../../diseno/tokens.json';
import textos from '../../i18n/es-DO.json';
import { HORIZONTE_WIDGET, logosDelResumen, mezclar, planificarWidget, VERSION_RESUMEN, type EntradaWidget } from '../resumen';
import { abiertoDesdeWidget } from '../useWidget';

// Hoy es el martes 6 de octubre de 2026, el ejemplo 7.4, como en las pruebas de los avisos.
const t = iniciarI18n('es-DO').t as unknown as Traducir;
const pais: ConfigPais = {
  codigo: 'DO',
  monedaPrincipal: 'DOP',
  monedaSecundaria: 'USD',
  idiomas: ['es-DO'],
  feriados: [],
  catalogoDisponible: true,
  funciones: { dobleBalance: true },
  montoReferencia: 1000,
};

function tarjeta(id: string, diaCorte: number, dia: number, recompensa: Recompensa, extra: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id,
    alias: `Tarjeta ${id}`,
    emisorId: null,
    productoId: null,
    productoDesconocido: false,
    ultimos4: '4821',
    diaCorte,
    fechaLimite: { tipo: 'dia_del_mes', dia },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: 'solo_principal',
    recompensa,
    enPausa: false,
    creadaEn: '2026-09-01',
    ...extra,
  };
}

const A = tarjeta('A', 5, 25, { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 0.5, valorPuntoConfirmado: true });
const B = tarjeta('B', 20, 10, { tipo: 'puntos', regla: { tipo: 'por_porcentaje', porcentaje: 2 }, valorPunto: 1, valorPuntoConfirmado: true });
const C = tarjeta('C', 1, 21, { tipo: 'cashback', porcentaje: 1 });
const nomina: FuenteIngreso[] = [{ id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos', dias: [15, 30] }, ajusteDiaNoHabil: 'adelantar' }];

function entrada(cambios: Partial<EntradaWidget> = {}): EntradaWidget {
  return { hoy: '2026-10-06', tarjetas: [A, B, C], ingresos: nomina, preferencias: preferenciasIniciales('DO', 'es-DO'), pais, catalogo: null, t, idioma: 'es-DO', ...cambios };
}
const dia = (fecha: string, e = entrada()) => planificarWidget(e).dias.find(d => d.fecha === fecha)!;

test('un día por fecha, desde hoy y sin huecos, durante todo el horizonte', () => {
  const { estado, dias } = planificarWidget(entrada());
  expect(estado).toBe('tarjetas');
  expect(dias).toHaveLength(HORIZONTE_WIDGET);
  expect(dias[0].fecha).toBe('2026-10-06');
  expect(dias[1].fecha).toBe('2026-10-07');
  expect(dias.at(-1)!.fecha).toBe('2026-12-04');
});

test('cada día muestra la mejor tarjeta del ranking de ese día, con sus días para pagar', () => {
  const e = entrada();
  for (const d of planificarWidget(e).dias) {
    const [mejor] = calcularRanking({ hoy: d.fecha, tarjetas: e.tarjetas, ingresos: e.ingresos, preferencias: e.preferencias, pais }).ranking;
    expect({ fecha: d.fecha, alias: d.alias, dias: d.dias }).toEqual({ fecha: d.fecha, alias: `Tarjeta ${mejor.tarjetaId}`, dias: mejor.diasGracia });
  }
});

test('cambiar el enfoque cambia el widget (criterio 14.1)', () => {
  const conEnfoque = (modo: 'liquidez' | 'puntos') => entrada({ preferencias: { ...preferenciasIniciales('DO', 'es-DO'), enfoque: { modo } } });
  // Ejemplo 7.4: con Puntos gana B; con Días, C.
  expect(dia('2026-10-06', conEnfoque('puntos')).alias).toBe('Tarjeta B');
  expect(dia('2026-10-06', conEnfoque('liquidez')).alias).toBe('Tarjeta C');
});

test('una tarjeta en pausa no aparece en el widget (criterio 14.1)', () => {
  const pausada = { ...B, alias: 'Pausada', enPausa: true };
  const resumen = planificarWidget(entrada({ tarjetas: [A, pausada, C] }));
  expect(JSON.stringify(resumen)).not.toContain('Pausada');
});

test('sin tarjetas o con todas en pausa, el widget muestra un mensaje en vez de días', () => {
  expect(planificarWidget(entrada({ tarjetas: [] }))).toMatchObject({ estado: 'sinTarjetas', dias: [], textos: { mensaje: 'Agrega tu primera tarjeta en Tino.' } });
  const pausadas = [A, B].map(x => ({ ...x, enPausa: true }));
  expect(planificarWidget(entrada({ tarjetas: pausadas }))).toMatchObject({ estado: 'enPausa', dias: [], textos: { mensaje: 'Tus tarjetas están en pausa. Actívalas en Tino.' } });
});

test('solo la tarjeta recomendada: nada de otras tarjetas ni de sus pagos (D72)', () => {
  // El 19 de octubre B corta mañana y vence el pago de C: nada de eso sale en el widget.
  const d = dia('2026-10-19');
  expect(Object.keys(d).sort()).toEqual(['accesible', 'alias', 'banco', 'corta', 'dias', 'fecha', 'hoy', 'pagas', 'recompensa']);
  expect(d.accesible).toBe(`Hoy te conviene usar ${d.alias}: ${d.dias} días para pagar.`);
  const otras = planificarWidget(entrada()).dias.filter(x => x.alias !== 'Tarjeta B').map(x => JSON.stringify(x));
  for (const x of otras) expect(x).not.toContain('Tarjeta B');
});

test('colores de los tokens, tema de Ajustes y enlace', () => {
  const resumen = planificarWidget(entrada({ preferencias: { ...preferenciasIniciales('DO', 'es-DO'), tema: 'oscuro' }, enlace: 'tino://inicio?origen=widget' }));
  expect(resumen.tema).toBe('oscuro');
  expect(resumen.enlace).toBe('tino://inicio?origen=widget');
  for (const modo of ['claro', 'oscuro'] as const) {
    const c = tokens.color[modo];
    expect(resumen.colores[modo]).toEqual({
      destacado: c.destacado,
      sobreDestacado: c.sobreDestacado,
      pista: mezclar(c.destacado, c.sobreDestacado, modo === 'claro' ? 0.22 : 0.15),
      recompensaPunto: c.recompensaPunto,
      fondoLogo: c.fondoLogo,
      fondoIniciales: mezclar(c.destacado, c.sobreDestacado, modo === 'claro' ? 0.18 : 0.12),
    });
  }
  expect(resumen.textos).toEqual({
    titulo: 'Hoy te conviene usar',
    diasParaPagar: 'días para pagar',
    mensaje: 'Agrega tu primera tarjeta en Tino.',
    abrir: 'Abre Tino para actualizar.',
    hitoHoy: 'Hoy',
    hitoCorta: 'Corta',
    hitoPagas: 'Pagas',
  });
});

test('la línea del ciclo y la recompensa, como en la tarjeta de hoy', () => {
  const d = dia('2026-10-06');
  const [mejor] = calcularRanking({ hoy: '2026-10-06', tarjetas: [A, B, C], ingresos: nomina, preferencias: preferenciasIniciales('DO', 'es-DO'), pais }).ranking;
  expect(d).toMatchObject({ hoy: '6 oct.', recompensa: expect.stringContaining('por RD$1,000') });
  expect(mejor.tarjetaId).toBe('C');
  expect(d).toMatchObject({ corta: '1 nov.', pagas: '21 nov.' });
  // Sin recompensa no hay línea.
  const sinRecompensa = [A, B, C].map(x => ({ ...x, recompensa: { tipo: 'ninguna' as const } }));
  expect(dia('2026-10-06', entrada({ tarjetas: sinRecompensa })).recompensa).toBeNull();
});

test('el banco de la tarjeta de hoy: logo del catálogo o iniciales, y solo esos logos', () => {
  const catalogo = require('../../../datos-publicos/emisores-do.json');
  const conBanco = [
    { ...A, emisorId: 'banreservas' },
    { ...B, emisorId: null, emisorTextoLibre: 'Cooperativa Central' },
    { ...C, emisorId: null },
  ];
  // Con Puntos gana A o B según el día; con Días, C. Se revisan los tres en distintos enfoques.
  const banco = (modo: 'puntos' | 'liquidez', alias: string) =>
    planificarWidget(entrada({ tarjetas: conBanco, catalogo, preferencias: { ...preferenciasIniciales('DO', 'es-DO'), enfoque: { modo } } })).dias.find(d => d.alias === alias)?.banco;
  expect(banco('puntos', 'Tarjeta B')).toEqual({ iniciales: 'CC', logo: null });
  expect(banco('liquidez', 'Tarjeta C')).toBeNull();
  const conBanreservas = planificarWidget(entrada({ tarjetas: [conBanco[0]], catalogo }));
  expect(conBanreservas.dias[0].banco).toEqual({ iniciales: expect.any(String), logo: 'banreservas.png' });
  // El widget recibe solo los logos de los bancos que aparecen, no todo el catálogo.
  expect(logosDelResumen(conBanreservas)).toEqual(['banreservas.png']);
  expect(logosDelResumen(planificarWidget(entrada({ catalogo })))).toEqual([]);
});

test('mezcla colores como una opacidad', () => {
  expect(mezclar('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  expect(mezclar('#0E7C5B', '#FFFFFF', 0)).toBe('#0E7C5B');
});

test('el resumen no lleva montos del usuario ni números de tarjeta', () => {
  const resumen = planificarWidget(entrada());
  // Los únicos montos son los de la recompensa por cada RD$1,000 (el monto de referencia del país).
  const sinRecompensa = JSON.stringify({ ...resumen, dias: resumen.dias.map(d => ({ ...d, recompensa: null })) });
  expect(sinRecompensa).not.toMatch(/RD\$|US\$|\d{13,}/);
  for (const d of resumen.dias) expect(d.recompensa).toMatch(/ por RD\$1,000$/);
  const json = JSON.stringify(resumen);
  expect(json).not.toContain('4821');
});

test('reconoce el enlace del widget', () => {
  expect(abiertoDesdeWidget('tino://inicio?origen=widget')).toBe(true);
  expect(abiertoDesdeWidget('tino://inicio')).toBe(false);
  expect(abiertoDesdeWidget(null)).toBe(false);
});

// Android lee estos recursos antes de abrir la app (selector de widgets y primer dibujo), así
// que son copia de los tokens y de los textos; estas pruebas evitan que se desfasen.
describe('recursos nativos del widget', () => {
  const res = join(__dirname, '..', '..', '..', 'modules', 'widget-android', 'android', 'src', 'main', 'res');
  const valores = (archivo: string, etiqueta: string) =>
    Object.fromEntries([...readFileSync(join(res, archivo), 'utf8').matchAll(new RegExp(`<${etiqueta} name="([^"]+)">([^<]*)</${etiqueta}>`, 'g'))].map(m => [m[1], m[2]]));

  test('los colores coinciden con los tokens', () => {
    for (const [carpeta, modo] of [['values', 'claro'], ['values-night', 'oscuro']] as const) {
      const c = tokens.color[modo];
      expect(valores(`${carpeta}/colors.xml`, 'color')).toEqual({ tino_widget_fondo: c.destacado, tino_widget_texto: c.sobreDestacado });
    }
  });

  test('el widget espera la misma versión del resumen', () => {
    const kotlin = readFileSync(join(res, '..', 'java', 'expo', 'modules', 'tinowidget', 'TinoWidgetProvider.kt'), 'utf8');
    expect(kotlin).toContain(`VERSION_RESUMEN = ${VERSION_RESUMEN}`);
  });

  test('los textos coinciden con i18n', () => {
    expect(valores('values/strings.xml', 'string')).toEqual({
      tino_widget_nombre: textos.widget.nombre,
      tino_widget_descripcion: textos.widget.descripcion,
      tino_widget_sin_datos: textos.widget.sinDatos,
    });
  });
});
