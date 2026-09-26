import type { ConfigPais, FuenteIngreso, Tarjeta } from '../../tipos/tipos';
import { pagosParaInicio, proximosPagos } from '../pendientes';

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
