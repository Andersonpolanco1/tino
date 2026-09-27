import type { ConfigPais, FuenteIngreso, Tarjeta } from '../../tipos/tipos';
import pais from '../../paises/do.json';
import { consejosDeFechas, distanciaCircular, MEJORA_MINIMA_DIAS, type ConsejoFechas } from '../fechas';

// Decisión D65: un caso por cada escenario del análisis, con 1, 2, 3 y 4 tarjetas.
// Hoy fijo: el martes 6 de octubre de 2026, como en las pruebas de Inicio.
const hoy = '2026-10-06';
const config = pais as ConfigPais;

function tarjeta(id: string, diaCorte: number, dia: number, extra: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id,
    alias: `Tarjeta ${id}`,
    emisorId: null,
    productoId: null,
    productoDesconocido: false,
    diaCorte,
    fechaLimite: { tipo: 'dia_del_mes', dia },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: 'solo_principal',
    recompensa: { tipo: 'ninguna' },
    enPausa: false,
    creadaEn: '2026-09-01',
    ...extra,
  };
}

const quincenal: FuenteIngreso = { id: 'q', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos', dias: [15, 30] }, ajusteDiaNoHabil: 'adelantar' };
const mensual: FuenteIngreso = { id: 'm', nombre: 'Sueldo', frecuencia: { tipo: 'mensual', dia: 30 }, ajusteDiaNoHabil: 'adelantar' };
const semanal: FuenteIngreso = { id: 's', nombre: 'Semanal', frecuencia: { tipo: 'semanal', diaSemana: 5 }, ajusteDiaNoHabil: 'adelantar' };

// Cobros estimados el mismo día de cada mes (freelance).
function estimados(dia: number, meses = 14): FuenteIngreso {
  const fechas = Array.from({ length: meses }, (_, i) => ({ fecha: new Date(Date.UTC(2026, 9 + i, dia)).toISOString().slice(0, 10), estimada: true }));
  return { id: 'p', nombre: 'Clientes', frecuencia: { tipo: 'personalizada', fechas }, ajusteDiaNoHabil: 'ninguno' };
}

const consejos = (tarjetas: Tarjeta[], ingresos: FuenteIngreso[] = []) => consejosDeFechas({ hoy, tarjetas, ingresos, pais: config });
const rangoValido = (c: ConsejoFechas) => c.corteDesde <= c.corteSugerido && c.corteSugerido <= c.corteHasta && c.corteHasta - c.corteDesde <= 4;

test('la distancia entre días del mes da la vuelta', () => {
  expect(distanciaCircular(5, 6)).toBe(1);
  expect(distanciaCircular(29, 2)).toBe(3);
  expect(distanciaCircular(5, 20)).toBe(15);
});

describe('una tarjeta', () => {
  test('vence antes del cobro mensual: propone un corte que pague después, con ejemplo', () => {
    const [consejo, ...resto] = consejos([tarjeta('A', 5, 25)], [mensual]);
    expect(resto).toEqual([]);
    expect(consejo).toMatchObject({ tipo: 'pagoAntesDelCobro', tarjetaId: 'A', mesesAntes: 12, mesesRevisados: 12, mesesDespues: 0, enDolares: false });
    expect(rangoValido(consejo)).toBe(true);
    expect(consejo.cobroEjemplo! < consejo.pagoEjemplo).toBe(true);
  });

  test('con cobro quincenal o semanal siempre hay un cobro antes: sin consejo', () => {
    expect(consejos([tarjeta('A', 5, 25)], [quincenal])).toEqual([]);
    expect(consejos([tarjeta('A', 5, 25)], [semanal])).toEqual([]);
  });

  test('sin cobros registrados no habla del cobro', () => {
    expect(consejos([tarjeta('A', 5, 25)])).toEqual([]);
  });

  test('doble balance: revisa la fecha en dólares aunque la de pesos esté bien', () => {
    const doble = tarjeta('A', 5, 25, { monedaFacturacion: 'doble_balance', fechaLimiteUsd: { tipo: 'dia_del_mes', dia: 14 } });
    const [consejo] = consejos([doble], [quincenal]);
    expect(consejo).toMatchObject({ tipo: 'pagoAntesDelCobro', enDolares: true });
    expect(consejo.cobroEjemplo! < consejo.pagoEjemplo).toBe(true);
  });

  test('cobros estimados: pide 3 días de margen entre el cobro y el pago', () => {
    // Cobra alrededor del 20: pagar el 22 no deja margen; el 25 sí.
    expect(consejos([tarjeta('A', 5, 22)], [estimados(20)])[0]).toMatchObject({ tipo: 'pagoAntesDelCobro', cobroEstimado: true });
    expect(consejos([tarjeta('A', 5, 25)], [estimados(20)])).toEqual([]);
  });

  test('con pocas fechas de cobro anotadas no juzga los meses sin datos', () => {
    const pocas: FuenteIngreso = {
      ...estimados(20),
      frecuencia: { tipo: 'personalizada', fechas: [{ fecha: '2026-10-20', estimada: false }, { fecha: '2026-11-20', estimada: false }] },
    };
    expect(consejos([tarjeta('A', 5, 10)], [pocas])).toEqual([]);
  });
});

describe('dos tarjetas', () => {
  test('cortes casi el mismo día: mover la más nueva medio mes, con al menos 7 días más', () => {
    const [consejo, ...resto] = consejos([tarjeta('A', 5, 25), tarjeta('B', 6, 26, { creadaEn: '2026-09-20' })]);
    expect(resto).toEqual([]);
    expect(consejo).toMatchObject({ tipo: 'diasSinTarjetaBuena', tarjetaId: 'B', cortesActuales: [5, 6] });
    expect(distanciaCircular(consejo.corteSugerido, 5)).toBeGreaterThanOrEqual(12);
    expect(consejo.peorDiaDespues).toBeGreaterThanOrEqual(consejo.peorDiaAntes + MEJORA_MINIMA_DIAS);
  });

  test('con quincena y los dos pagos en el mismo cobro: repartirlos, en una sola llamada', () => {
    const lista = consejos([tarjeta('A', 5, 25), tarjeta('B', 8, 28, { creadaEn: '2026-09-20' })], [quincenal]);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ tipo: 'mismoCobro', tarjetaId: 'B', tambienDias: true });
    expect(lista[0].cobroCargado).toBeDefined();
    expect(lista[0].cobroLibre! > lista[0].cobroCargado!).toBe(true);
  });

  test('cortes separados y cada pago con su cobro: sin consejo', () => {
    expect(consejos([tarjeta('A', 5, 25), tarjeta('B', 20, 10)], [quincenal])).toEqual([]);
  });

  test('con cobro mensual los pagos siempre salen del mismo sueldo: no hay consejo de mismo cobro', () => {
    expect(consejos([tarjeta('A', 5, 25), tarjeta('B', 20, 10)], [mensual]).map(c => c.tipo)).not.toContain('mismoCobro');
  });
});

describe('tres o más tarjetas', () => {
  test('tres cortes iguales: una sola llamada', () => {
    const lista = consejos([tarjeta('A', 5, 25), tarjeta('B', 5, 25, { creadaEn: '2026-09-02' }), tarjeta('C', 5, 25, { creadaEn: '2026-09-03' })]);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ tipo: 'diasSinTarjetaBuena', tarjetaId: 'C' });
  });

  test('cuatro tarjetas amontonadas del 1 al 8: mover una al otro lado del mes', () => {
    const lista = consejos([tarjeta('A', 1, 21), tarjeta('B', 3, 23), tarjeta('C', 5, 25), tarjeta('D', 8, 28)]);
    expect(lista).toHaveLength(1);
    expect(lista[0].tipo).toBe('diasSinTarjetaBuena');
    expect(lista[0].corteSugerido).toBeGreaterThanOrEqual(14);
  });

  test('cuatro tarjetas repartidas: fechas cerca, pero sin consejo', () => {
    expect(consejos([tarjeta('A', 1, 21), tarjeta('B', 8, 28), tarjeta('C', 15, 5), tarjeta('D', 22, 12)], [quincenal])).toEqual([]);
  });

  test('tres pagos con el mismo cobro de la quincena: mover una para usar el otro cobro', () => {
    const lista = consejos([tarjeta('A', 1, 21), tarjeta('B', 3, 23), tarjeta('C', 5, 25)], [quincenal]);
    expect(lista).toHaveLength(1);
    expect(lista[0].tipo).toBe('mismoCobro');
  });

  test('cuatro tarjetas antes del cobro: como máximo 2 consejos, en lugares distintos, y avisa de las otras', () => {
    const cuatro = ['A', 'B', 'C', 'D'].map(id => tarjeta(id, 5, 25));
    const lista = consejos(cuatro, [mensual]);
    expect(lista.map(c => c.tipo)).toEqual(['pagoAntesDelCobro', 'pagoAntesDelCobro']);
    expect(new Set(lista.map(c => c.tarjetaId)).size).toBe(2);
    expect(lista[0].corteSugerido).not.toBe(lista[1].corteSugerido);
    expect(lista[0].otrasConProblemaDeCobro).toBe(2);
  });
});

test('una tarjeta con consejo nunca recibe otro, y el consejo de cobro deja 2 de 12 meses o menos', () => {
  const lista = consejos([tarjeta('A', 5, 25), tarjeta('B', 6, 26, { creadaEn: '2026-09-20' })], [mensual]);
  const ids = lista.map(c => c.tarjetaId);
  expect(new Set(ids).size).toBe(ids.length);
  expect(lista[0].tipo).toBe('pagoAntesDelCobro');
  for (const c of lista.filter(x => x.tipo === 'pagoAntesDelCobro')) expect(c.mesesDespues * 6).toBeLessThanOrEqual(c.mesesRevisados);
});
