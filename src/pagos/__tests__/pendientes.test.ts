import type { ConfigPais, FuenteIngreso, Tarjeta } from '../../tipos/tipos';
import { pagoPendiente, pagosParaInicio, proximosPagos, riesgoIntereses } from '../pendientes';

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

// Hoy: 6 de octubre de 2026. B vence el 10 (en 4 días), A el 25 (en 19) y C el 21 (en 15).
const A = tarjeta('A', 5, 25);
const B = tarjeta('B', 20, 10);
const C = tarjeta('C', 1, 21);
const nomina: FuenteIngreso[] = [{ id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'mensual', dia: 22 }, ajusteDiaNoHabil: 'ninguno' }];

test('próximos pagos de todas las tarjetas activas, en orden de fecha', () => {
  const pagos = proximosPagos([A, B, C, tarjeta('P', 5, 25, { enPausa: true })], '2026-10-06', [], pais);
  expect(pagos.map(p => [p.tarjeta.id, p.fecha, p.dias])).toEqual([
    ['B', '2026-10-10', 4],
    ['C', '2026-10-21', 15],
    ['A', '2026-10-25', 19],
  ]);
});

test('en Inicio solo los que vencen en 7 días o menos (decisión D44)', () => {
  expect(pagosParaInicio(proximosPagos([A, B, C], '2026-10-06', [], pais)).map(p => p.tarjeta.id)).toEqual(['B']);
});

test('también los que vencen antes del próximo cobro, aunque falten más días', () => {
  // Cobra el 22: C (21) vence antes; A (25) vence después del cobro.
  expect(pagosParaInicio(proximosPagos([A, B, C], '2026-10-06', nomina, pais)).map(p => p.tarjeta.id)).toEqual(['B', 'C']);
});

test('"Ya pagué" lo saca de Inicio; con el siguiente estado vuelve solo (decisión D45)', () => {
  const pagada = { ...B, pagoHecho: '2026-10-10' };
  const pagos = proximosPagos([pagada], '2026-10-06', [], pais);
  expect(pagos[0].pagado).toBe(true);
  expect(pagosParaInicio(pagos)).toEqual([]);
  // El 11 de octubre el pendiente es el del 10 de noviembre, que no está pagado.
  const despues = proximosPagos([pagada], '2026-11-04', [], pais);
  expect(despues[0]).toMatchObject({ fecha: '2026-11-10', pagado: false });
});

// Decisión D99: el escenario del usuario. Corta el 8 y paga el 30.
describe('pago vencido sin marcar', () => {
  const T = tarjeta('T', 8, 30);

  test('se queda como pendiente hasta el siguiente corte, en vez de saltar al estado nuevo', () => {
    expect(pagoPendiente(T, '2026-10-29', pais)).toBe('2026-10-30');
    expect(pagoPendiente(T, '2026-10-31', pais)).toBe('2026-10-30');
    expect(pagoPendiente(T, '2026-11-07', pais)).toBe('2026-10-30');
    // Con el corte del 8 de noviembre, ese saldo ya va en el estado nuevo.
    expect(pagoPendiente(T, '2026-11-09', pais)).toBe('2026-11-30');
  });

  test('marcarlo, o marcar un pago posterior, lo resuelve', () => {
    expect(pagoPendiente({ ...T, pagoHecho: '2026-10-30' }, '2026-10-31', pais)).toBe('2026-11-30');
    expect(pagoPendiente({ ...T, pagoHecho: '2026-11-30' }, '2026-10-31', pais)).toBe('2026-11-30');
  });

  test('aparece en Por pagar como vencido, sin aviso de cobro, para poder marcarlo', () => {
    const [pago] = proximosPagos([T], '2026-11-02', nomina, pais);
    expect(pago).toMatchObject({ fecha: '2026-10-30', dias: -3, pagado: false, vencido: true, aviso: null });
    expect(pagosParaInicio([pago])).toHaveLength(1);
  });

  test('riesgo de intereses: ya vencido, por vencer antes de la compra, o ninguno', () => {
    // Compra planeada el 14 de octubre: el pago del 30 todavía no vence.
    expect(riesgoIntereses(T, '2026-10-14', '2026-10-10', pais)).toBeNull();
    // Compra planeada el 2 de noviembre, mirada el 14 de octubre: vencerá antes.
    expect(riesgoIntereses(T, '2026-11-02', '2026-10-14', pais)).toEqual({ pago: '2026-10-30', ya: false });
    // Hoy 2 de noviembre sin marcar: ya venció.
    expect(riesgoIntereses(T, '2026-11-02', '2026-11-02', pais)).toEqual({ pago: '2026-10-30', ya: true });
    // Marcado como pagado: sin riesgo.
    expect(riesgoIntereses({ ...T, pagoHecho: '2026-10-30' }, '2026-11-02', '2026-11-02', pais)).toBeNull();
  });
});

test('el pago de un estado que venció antes de registrar la tarjeta no cuenta como vencido', () => {
  // Registrada el 1 de octubre; su último estado venció el 28 de septiembre.
  const nueva = tarjeta('N', 8, 28, { creadaEn: '2026-10-01' });
  expect(pagoPendiente(nueva, '2026-10-01', pais)).toBe('2026-10-28');
  expect(riesgoIntereses(nueva, '2026-10-01', '2026-10-01', pais)).toBeNull();
  const [pago] = proximosPagos([nueva], '2026-10-01', [], pais);
  expect(pago.vencido).toBe(false);
  // El siguiente sí: se registró antes de su fecha límite.
  expect(pagoPendiente(nueva, '2026-10-30', pais)).toBe('2026-10-28');
});
