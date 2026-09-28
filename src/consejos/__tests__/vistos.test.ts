import type { ConsejoFechas } from '../fechas';
import { claveConsejo, esVisto, marcarVistos } from '../vistos';

// Decisiones D68, D73 y D74: vistos, pero a la vista mientras el problema exista.
const consejo = (c: Partial<ConsejoFechas> = {}) => ({ tipo: 'cortesJuntos', tarjetaId: 'B', huella: 'abc', ...c }) as ConsejoFechas;

test('la clave es tipo, tarjeta y huella, sin fechas ni montos', () => {
  expect(claveConsejo(consejo())).toBe('cortesJuntos:B:abc');
});

test('visto mientras sea el mismo consejo; otra tarjeta, otro tipo u otras fechas es nuevo', () => {
  const vistos = marcarVistos([consejo()]);
  expect(esVisto(consejo(), vistos)).toBe(true);
  expect(esVisto(consejo({ tarjetaId: 'A' }), vistos)).toBe(false);
  expect(esVisto(consejo({ tipo: 'pagoLejosDelCobro' }), vistos)).toBe(false);
  expect(esVisto(consejo({ huella: 'otra' }), vistos)).toBe(false);
  expect(esVisto(consejo(), undefined)).toBe(false);
});

test('marcar guarda solo los consejos de hoy: los resueltos salen de la lista', () => {
  expect(marcarVistos([consejo(), consejo({ tipo: 'pagoLejosDelCobro', tarjetaId: 'A' })])).toEqual(['cortesJuntos:B:abc', 'pagoLejosDelCobro:A:abc']);
});
