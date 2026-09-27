import type { ConfigPais, FuenteIngreso, Tarjeta } from '../../tipos/tipos';
import pais from '../../paises/do.json';
import { consejosDeFechas, distanciaCircular, MEJORA_MINIMA_DIAS, MESES_ACEPTABLES } from '../fechas';

// Decisión D65. Hoy fijo: el 6 de octubre de 2026, como en las pruebas de Inicio.
const hoy = '2026-10-06';
const config = pais as ConfigPais;

function tarjeta(id: string, diaCorte: number, dia: number, creadaEn = '2026-09-01'): Tarjeta {
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
    creadaEn,
  };
}

const quincenal: FuenteIngreso = { id: 'q', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos', dias: [15, 30] }, ajusteDiaNoHabil: 'adelantar' };
const mensual: FuenteIngreso = { id: 'm', nombre: 'Sueldo', frecuencia: { tipo: 'mensual', dia: 30 }, ajusteDiaNoHabil: 'adelantar' };

const consejos = (tarjetas: Tarjeta[], ingresos: FuenteIngreso[] = []) => consejosDeFechas({ hoy, tarjetas, ingresos, pais: config });

test('la distancia entre días del mes da la vuelta', () => {
  expect(distanciaCircular(5, 6)).toBe(1);
  expect(distanciaCircular(29, 2)).toBe(3);
  expect(distanciaCircular(5, 20)).toBe(15);
});

test('dos tarjetas que cortan casi el mismo día: propone mover la más nueva unos 15 días', () => {
  const [consejo, ...resto] = consejos([tarjeta('A', 5, 25), tarjeta('B', 6, 26, '2026-09-20')]);
  expect(resto).toEqual([]);
  expect(consejo).toMatchObject({ tipo: 'cortesJuntos', tarjetaId: 'B', conTarjetaId: 'A' });
  expect(consejo.corteDesde).toBeLessThanOrEqual(consejo.corteSugerido);
  expect(consejo.corteHasta).toBeGreaterThanOrEqual(consejo.corteSugerido);
  expect(distanciaCircular(consejo.corteSugerido, 5)).toBeGreaterThanOrEqual(12);
  expect(consejo.despues.peorDia).toBeGreaterThanOrEqual(consejo.antes.peorDia + MEJORA_MINIMA_DIAS);
});

test('un pago que vence antes del cobro casi todos los meses: propone un corte que pague después', () => {
  const [consejo] = consejos([tarjeta('A', 5, 25)], [mensual]);
  expect(consejo).toMatchObject({ tipo: 'pagoAntesDelCobro', tarjetaId: 'A' });
  expect(consejo.antes.mesesAntesDelCobro).toBe(12);
  expect(consejo.despues.mesesAntesDelCobro).toBeLessThanOrEqual(MESES_ACEPTABLES);
  expect(consejo.cobroEjemplo! < consejo.pagoEjemplo).toBe(true);
  expect(consejo.despues.peorDia).toBeGreaterThanOrEqual(consejo.antes.peorDia - 3);
});

test('sin cobros registrados no habla del cobro', () => {
  expect(consejos([tarjeta('A', 5, 25)])).toEqual([]);
});

test('dos pagos la misma semana, aunque los cortes estén separados', () => {
  const [consejo] = consejos([tarjeta('A', 5, 25), tarjeta('B', 15, 27)]);
  expect(consejo).toMatchObject({ tipo: 'pagosJuntos' });
  expect(consejo.despues.peorDia).toBeGreaterThanOrEqual(consejo.antes.peorDia - 3);
});

test('con cortes separados y pagos después del cobro no hay consejo', () => {
  expect(consejos([tarjeta('A', 5, 25), tarjeta('B', 20, 10)], [quincenal])).toEqual([]);
});

test('una tarjeta con consejo de cobro no recibe también el de cortes juntos', () => {
  const lista = consejos([tarjeta('A', 5, 25), tarjeta('B', 6, 26, '2026-09-20')], [mensual]);
  const ids = lista.map(c => c.tarjetaId);
  expect(new Set(ids).size).toBe(ids.length);
  expect(lista[0].tipo).toBe('pagoAntesDelCobro');
});
