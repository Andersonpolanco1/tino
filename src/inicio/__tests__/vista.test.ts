import type { ConfigPais, EntradaMotor, Preferencias, Recompensa, Tarjeta } from '../../tipos/tipos';
import { calcularRanking } from '../../motor';
import { iniciarI18n } from '../../i18n/i18n';
import { precisionGeneral, precisionTarjeta } from '../precision';
import { etiquetasDe, mensajeSemaforo, proximoPago, textoRecompensa, type Traducir } from '../vista';
import { msHastaMedianoche } from '../useHoy';

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

const preferencias: Preferencias = {
  pais: 'DO',
  idioma: 'es-DO',
  enfoque: { modo: 'equilibrado' },
  pagoBalanceUsd: null,
  diferencialCambiarioPct: 6,
  umbralCorteCercanoDias: 3,
  analiticaActiva: true,
  plan: 'gratis',
};

const puntos = (confirmado: boolean): Recompensa => ({
  tipo: 'puntos',
  regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 },
  valorPunto: 0.5,
  valorPuntoConfirmado: confirmado,
});

function tarjeta(cambios: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id: 't1',
    alias: 'Visa Oro',
    emisorId: 'bhd',
    productoId: 'bhd-visa-gold',
    productoDesconocido: false,
    diaCorte: 5,
    fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_corte_actual',
    monedaFacturacion: 'solo_principal',
    recompensa: puntos(true),
    enPausa: false,
    creadaEn: '2026-09-01',
    ...cambios,
  };
}

function resultadoDe(tarjetaPrueba: Tarjeta, hoy = '2026-10-10') {
  const entrada: EntradaMotor = { hoy, tarjetas: [tarjetaPrueba], ingresos: [], preferencias, pais };
  return { entrada, resultado: calcularRanking(entrada).ranking[0] };
}

const contexto = { t, pais, idioma: 'es-DO' };

describe('precisión (decisión D26)', () => {
  const c = { hayIngresos: false, catalogoDisponible: true };

  test('tarjeta del catálogo con el valor del punto sin revisar y sin cobros: 50%', () => {
    expect(precisionTarjeta(tarjeta({ recompensa: puntos(false) }), c)).toBe(50);
  });

  test('con el valor del punto confirmado sube a 75%, y con cobros a 100%', () => {
    expect(precisionTarjeta(tarjeta(), c)).toBe(75);
    expect(precisionTarjeta(tarjeta(), { ...c, hayIngresos: true })).toBe(100);
  });

  test('sin puntos, el valor del punto cuenta como completo', () => {
    expect(precisionTarjeta(tarjeta({ recompensa: { tipo: 'cashback', porcentaje: 1 } }), c)).toBe(75);
  });

  test('producto "Otro" resta, salvo en países sin catálogo', () => {
    expect(precisionTarjeta(tarjeta({ productoId: null }), c)).toBe(65);
    expect(precisionTarjeta(tarjeta({ productoId: null }), { ...c, catalogoDisponible: false })).toBe(75);
  });

  test('en Ajustes, el promedio; sin tarjetas no hay precisión', () => {
    expect(precisionGeneral([tarjeta(), tarjeta({ recompensa: puntos(false) })], c)).toBe(63);
    expect(precisionGeneral([], c)).toBeNull();
  });
});

describe('lo que muestra cada tarjeta', () => {
  test('recompensa en puntos por cada 1,000', () => {
    const t1 = tarjeta();
    expect(textoRecompensa(t1, resultadoDe(t1).resultado, contexto)).toBe('10 pts por RD$1,000');
  });

  test('recompensa en cashback por cada 1,000', () => {
    const t1 = tarjeta({ recompensa: { tipo: 'cashback', porcentaje: 2 } });
    expect(textoRecompensa(t1, resultadoDe(t1).resultado, contexto)).toBe('RD$20 cashback por RD$1,000');
  });

  test('sin recompensa no muestra nada', () => {
    const t1 = tarjeta({ recompensa: { tipo: 'ninguna' } });
    expect(textoRecompensa(t1, resultadoDe(t1).resultado, contexto)).toBeNull();
  });

  test('etiquetas: alerta en coral, moneda y comparación aproximada en neutro', () => {
    const t1 = tarjeta({ monedaFacturacion: 'doble_balance', recompensa: puntos(false) });
    expect(etiquetasDe(t1, resultadoDe(t1, '2026-10-03').resultado, contexto)).toEqual([
      { tipo: 'alerta', texto: 'Corta en 2 días' },
      { tipo: 'neutra', texto: 'Pesos y dólares' },
      { tipo: 'neutra', texto: 'Comparación aproximada' },
    ]);
  });
});

describe('semáforo (sección 3.4)', () => {
  test('verde justo después del corte', () => {
    const t1 = tarjeta();
    const { entrada, resultado } = resultadoDe(t1, '2026-10-06');
    expect(resultado.semaforo).toBe('verde');
    expect(mensajeSemaforo(t1, resultado, entrada, t)).toBe('Buen momento: una compra de hoy se paga en 50 días');
  });

  test('rojo antes del corte sugiere esperar y cuántos días se ganan', () => {
    const t1 = tarjeta();
    const { entrada, resultado } = resultadoDe(t1, '2026-10-03');
    expect(resultado.semaforo).toBe('rojo');
    expect(mensajeSemaforo(t1, resultado, entrada, t)).toBe('Si puedes, espera al día 6: pasarías de 22 a 50 días');
  });
});

describe('próximo pago', () => {
  test('antes de la fecha límite del estado ya cortado, es esa', () => {
    expect(proximoPago(tarjeta(), '2026-10-10', pais)).toBe('2026-10-25');
  });

  test('pasada esa fecha, es la del próximo corte', () => {
    expect(proximoPago(tarjeta(), '2026-10-26', pais)).toBe('2026-11-25');
  });
});

test('milisegundos hasta la medianoche', () => {
  expect(msHastaMedianoche(new Date(2026, 8, 25, 23, 0, 0))).toBe(3_600_000);
});
