import type { Catalogo } from '../../tipos/tipos';
import datos from '../../../datos-publicos/emisores-do.json';

// Validación mínima del catálogo de RD. La validación por esquema al descargarlo llega en la etapa 3.
const catalogo = datos as Catalogo;
const productos = catalogo.emisores.flatMap(e => e.productos.map(p => ({ emisor: e, producto: p })));

test('los ids de emisores y productos son únicos', () => {
  const emisores = catalogo.emisores.map(e => e.id);
  expect(new Set(emisores).size).toBe(emisores.length);
  const ids = productos.map(({ producto }) => producto.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('cada producto empieza con el id de su emisor', () => {
  for (const { emisor, producto } of productos) {
    expect(producto.id.startsWith(`${emisor.id}-`)).toBe(true);
    expect(producto.id).toMatch(/^[a-z0-9-]+$/);
  }
});

test('marca y moneda de facturación tienen valores permitidos', () => {
  for (const { producto } of productos) {
    expect(['visa', 'mastercard', 'amex', 'otra']).toContain(producto.marca);
    if (producto.monedaFacturacion !== undefined) {
      expect(['solo_principal', 'doble_balance', 'solo_usd', 'solo_local']).toContain(producto.monedaFacturacion);
    }
  }
});

test('solo los emisores confirmados tienen productos', () => {
  for (const emisor of catalogo.emisores) {
    if (emisor.productos.length > 0) expect(emisor.emiteTarjetas).toBe('confirmado');
  }
});

test('ningún producto trae recompensas precargadas todavía (decisión D14)', () => {
  for (const { producto } of productos) {
    expect(producto.plantilla?.recompensa).toBeUndefined();
  }
});
