import type { ConsejoFechas } from '../fechas';
import { claveConsejo, descartar, esVisto, estaDescartado, marcarVistos } from '../vistos';

// Decisiones D68 y D73: vistos (siguen a la vista) y ocultos con "Ya lo sé" (no vuelven mientras
// las fechas y cobros sigan iguales).
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

test('ocultar: sin repetir, y vuelve si cambian las fechas o los cobros', () => {
  const ocultos = descartar(consejo(), descartar(consejo(), undefined));
  expect(ocultos).toEqual(['cortesJuntos:B:abc']);
  expect(estaDescartado(consejo(), ocultos)).toBe(true);
  expect(estaDescartado(consejo({ huella: 'otra' }), ocultos)).toBe(false);
});
