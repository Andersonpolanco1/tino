import { readFileSync } from 'fs';
import { join } from 'path';
import type { ConfigPais, FuenteIngreso, Recompensa, Tarjeta } from '../../tipos/tipos';
import { iniciarI18n } from '../../i18n/i18n';
import { preferenciasIniciales } from '../../datos/preferencias';
import { calcularRanking } from '../../motor';
import type { Traducir } from '../../inicio/vista';
import tokens from '../../diseno/tokens.json';
import textos from '../../i18n/es-DO.json';
import { HORIZONTE_WIDGET, planificarWidget, type EntradaWidget } from '../resumen';
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
  return { hoy: '2026-10-06', tarjetas: [A, B, C], ingresos: nomina, preferencias: preferenciasIniciales('DO', 'es-DO'), pais, t, idioma: 'es-DO', ...cambios };
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

test('la tarjeta a evitar es otra que corta en 3 días o menos', () => {
  // B corta el 20 de octubre.
  expect(dia('2026-10-16').evitar).toBeNull();
  expect(dia('2026-10-17').evitar).toBe('Evita Tarjeta B: corta en 3 días');
  expect(dia('2026-10-19').evitar).toBe('Evita Tarjeta B: corta mañana');
  // El día del corte, lo que se compra entra en el estado siguiente: ya no hay que evitarla.
  expect(dia('2026-10-20').evitar).toBeNull();
  // Si el banco la mete en el estado que corta ese día, todavía conviene evitarla.
  const entraHoy = { ...B, compraEnDiaDeCorte: 'entra_en_corte_actual' as const };
  expect(dia('2026-10-20', entrada({ tarjetas: [A, entraHoy, C] })).evitar).toBe('Evita Tarjeta B: corta hoy');
  // Nunca se pide evitar la tarjeta recomendada.
  for (const d of planificarWidget(entrada()).dias) {
    if (d.evitar) expect(d.evitar).not.toContain(d.alias + ':');
  }
});

test('el próximo pago sin marcar, urgente en los últimos 3 días', () => {
  expect(dia('2026-10-06').pago).toEqual({ texto: 'Tarjeta B vence el 10 de octubre', urgente: false });
  expect(dia('2026-10-07').pago).toEqual({ texto: 'Tarjeta B vence el 10 de octubre', urgente: true });
  expect(dia('2026-10-09').pago).toEqual({ texto: 'Tarjeta B vence mañana', urgente: true });
  expect(dia('2026-10-10').pago).toEqual({ texto: 'Tarjeta B vence hoy', urgente: true });
  // "Ya pagué" (D45): pasa al siguiente pago.
  const pagada = { ...B, pagoHecho: '2026-10-10' };
  expect(dia('2026-10-06', entrada({ tarjetas: [A, pagada, C] })).pago).toEqual({ texto: 'Tarjeta C vence el 21 de octubre', urgente: false });
  // Con todo pagado, la fecha límite siguiente de cada tarjeta: B vuelve a vencer el 10 de noviembre.
  const todoPagado = [{ ...A, pagoHecho: '2026-10-25' }, pagada, { ...C, pagoHecho: '2026-10-21' }];
  expect(dia('2026-10-06', entrada({ tarjetas: todoPagado })).pago).toEqual({ texto: 'Tarjeta B vence el 10 de noviembre', urgente: false });
});

test('lo que anuncia el lector de pantalla junta todo en palabras', () => {
  const d = dia('2026-10-19');
  expect(d.accesible).toBe(`Hoy te conviene usar ${d.alias}: ${d.dias} días para pagar. Evita Tarjeta B: corta mañana ${d.pago!.texto}`);
});

test('colores de los tokens, tema de Ajustes y enlace', () => {
  const resumen = planificarWidget(entrada({ preferencias: { ...preferenciasIniciales('DO', 'es-DO'), tema: 'oscuro' }, enlace: 'tino://inicio?origen=widget' }));
  expect(resumen.tema).toBe('oscuro');
  expect(resumen.enlace).toBe('tino://inicio?origen=widget');
  for (const modo of ['claro', 'oscuro'] as const) {
    const c = tokens.color[modo];
    expect(resumen.colores[modo]).toEqual({
      fondo: c.superficie,
      texto: c.texto,
      textoSecundario: c.textoSecundario,
      destacado: c.destacado,
      sobreDestacado: c.sobreDestacado,
      alerta: c.alertaTexto,
    });
  }
  expect(resumen.textos).toEqual({ titulo: 'Hoy te conviene usar', diasParaPagar: 'días para pagar', mensaje: 'Agrega tu primera tarjeta en Tino.', abrir: 'Abre Tino para actualizar.' });
});

test('el resumen no lleva montos ni números de tarjeta', () => {
  const json = JSON.stringify(planificarWidget(entrada()));
  expect(json).not.toMatch(/RD\$|US\$|\d{13,}/);
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
      expect(valores(`${carpeta}/colors.xml`, 'color')).toEqual({ tino_widget_fondo: c.superficie, tino_widget_texto: c.texto, tino_widget_destacado: c.destacado });
    }
  });

  test('los textos coinciden con i18n', () => {
    expect(valores('values/strings.xml', 'string')).toEqual({
      tino_widget_nombre: textos.widget.nombre,
      tino_widget_descripcion: textos.widget.descripcion,
      tino_widget_sin_datos: textos.widget.sinDatos,
    });
  });
});
