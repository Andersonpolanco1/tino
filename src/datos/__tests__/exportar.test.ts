import type { Tarjeta } from '../../tipos/tipos';
import { preferenciasIniciales } from '../preferencias';
import { algunTextoConNumeroDeTarjeta } from '../../validacion/tarjeta';
import { datosParaExportar } from '../exportar';

jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { cache: '' } }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));

const tarjeta: Tarjeta = {
  id: 't1',
  alias: 'Visa Clásica',
  emisorId: 'banreservas',
  productoId: 'banreservas-visa-clasica',
  productoDesconocido: false,
  ultimos4: '4821',
  diaCorte: 5,
  fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
  ajusteDiaNoHabil: 'adelantar',
  compraEnDiaDeCorte: 'entra_en_corte_actual',
  monedaFacturacion: 'doble_balance',
  recompensa: { tipo: 'ninguna' },
  enPausa: false,
  creadaEn: '2026-09-25',
};

test('el archivo exportado lleva formato, fecha, preferencias y tarjetas', () => {
  const preferencias = preferenciasIniciales('DO', 'es-DO');
  const datos = datosParaExportar(preferencias, [tarjeta], new Date('2026-09-25T12:00:00Z'));
  expect(datos).toEqual({ formato: 'tino-exportacion', version: 1, exportadoEn: '2026-09-25T12:00:00.000Z', preferencias, tarjetas: [tarjeta] });
});

test('el archivo exportado no contiene números de tarjeta completos', () => {
  const datos = datosParaExportar(preferenciasIniciales('DO', 'es-DO'), [tarjeta], new Date());
  expect(algunTextoConNumeroDeTarjeta(datos)).toBe(false);
});
