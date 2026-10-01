import { aDateLocal, deDateLocal, fechaCompraValida, limiteFechaCompra } from '../fechaCompra';

// Decisión D96: el día de la compra va de hoy al mismo día del mes siguiente.
test('el límite es el mismo día del mes siguiente', () => {
  expect(limiteFechaCompra('2026-10-01')).toBe('2026-11-01');
  expect(limiteFechaCompra('2026-12-15')).toBe('2027-01-15');
});

test('si el mes siguiente es más corto, el límite es su último día', () => {
  expect(limiteFechaCompra('2027-01-31')).toBe('2027-02-28');
  expect(limiteFechaCompra('2028-01-31')).toBe('2028-02-29');
  expect(limiteFechaCompra('2026-10-31')).toBe('2026-11-30');
});

test('una fecha fuera del rango, vacía o mal escrita vuelve a hoy', () => {
  const hoy = '2026-10-06';
  expect(fechaCompraValida(null, hoy)).toBe(hoy);
  expect(fechaCompraValida(undefined, hoy)).toBe(hoy);
  expect(fechaCompraValida('mañana', hoy)).toBe(hoy);
  expect(fechaCompraValida('2026-10-05', hoy)).toBe(hoy);
  expect(fechaCompraValida('2026-11-07', hoy)).toBe(hoy);
  expect(fechaCompraValida('2026-10-09', hoy)).toBe('2026-10-09');
  expect(fechaCompraValida('2026-11-06', hoy)).toBe('2026-11-06');
});

test('las fechas pasan al selector y vuelven sin correrse de día', () => {
  const fecha = aDateLocal('2026-10-31');
  expect([fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), fecha.getHours()]).toEqual([2026, 9, 31, 0]);
  expect(deDateLocal(fecha)).toBe('2026-10-31');
});
