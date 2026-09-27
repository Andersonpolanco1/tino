import type { ConsejoFechas } from '../fechas';
import { claveConsejo, esVisto, marcarVistos } from '../vistos';

// Decisión D68: vistos, pero a la vista hasta que el problema se resuelva.
const consejo = (c: Partial<ConsejoFechas> = {}) => ({ tipo: 'diasSinTarjetaBuena', tarjetaId: 'B', corteDesde: 17, corteHasta: 21, ...c }) as ConsejoFechas;

test('la clave es tipo, tarjeta y rango, sin fechas ni montos', () => {
  expect(claveConsejo(consejo())).toBe('diasSinTarjetaBuena:B:17-21');
});

test('sigue visto si el rango se mueve un día con el calendario', () => {
  expect(esVisto(consejo({ corteDesde: 18, corteHasta: 22 }), ['diasSinTarjetaBuena:B:17-21'])).toBe(true);
});

test('vuelve a ser nuevo si cambia de verdad: otro rango, otra tarjeta u otro problema', () => {
  const vistos = ['diasSinTarjetaBuena:B:17-21'];
  expect(esVisto(consejo({ corteDesde: 10, corteHasta: 12 }), vistos)).toBe(false);
  expect(esVisto(consejo({ tarjetaId: 'C' }), vistos)).toBe(false);
  expect(esVisto(consejo({ tipo: 'mismoCobro' }), vistos)).toBe(false);
  expect(esVisto(consejo(), undefined)).toBe(false);
});

test('marcar guarda solo los consejos de hoy: los resueltos salen de la lista', () => {
  expect(marcarVistos([consejo(), consejo({ tipo: 'pagoAntesDelCobro', tarjetaId: 'A', corteDesde: 11, corteHasta: 13 })])).toEqual([
    'diasSinTarjetaBuena:B:17-21',
    'pagoAntesDelCobro:A:11-13',
  ]);
});
