import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Tarjeta } from '@/tipos/tipos';
import { ProveedorPais } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba } from '@/estado';
import { FilaPago, pagoUrgente } from '../FilaPago';

const tarjeta: Tarjeta = {
  id: 'B',
  alias: 'Visa Banreservas',
  emisorId: null,
  productoId: null,
  productoDesconocido: false,
  diaCorte: 8,
  fechaLimite: { tipo: 'dia_del_mes', dia: 30 },
  ajusteDiaNoHabil: 'ninguno',
  compraEnDiaDeCorte: 'entra_en_siguiente',
  monedaFacturacion: 'solo_principal',
  recompensa: { tipo: 'ninguna' },
  enPausa: false,
  creadaEn: '2026-09-01',
  pagoHecho: '2026-09-30',
};

test('pagado: "Pagado", la fecha y "Deshacer", sin repetir (decisión D52)', async () => {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db), sugerencias: repositorioSugerencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias(preferenciasIniciales('DO', 'es-DO'));
  await almacen.getState().guardarTarjeta(tarjeta);
  const pago = { tarjeta, fecha: '2026-09-30', dias: 4, pagado: true, vencido: false, aviso: null };
  await render(
    <ProveedorPais regiones={[{ regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' }]}>
      <ProveedorAlmacenDePrueba almacen={almacen}>
        <FilaPago pago={pago} conNombre={false} />
      </ProveedorAlmacenDePrueba>
    </ProveedorPais>,
  );
  expect(screen.getByText('Pagado')).toBeOnTheScreen();
  expect(screen.getByText('Vence el 30 de septiembre')).toBeOnTheScreen();
  expect(screen.queryByText('Ya pagué')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Deshacer el pago de Visa Banreservas'));
  await act(async () => {});
  expect(almacen.getState().tarjetas[0].pagoHecho).toBeUndefined();
});

// Decisión D99: vencido, una pregunta con "Ya pagué" a mano, no una alarma.
test('vencido: pregunta si pagó el total y deja marcarlo', async () => {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db), sugerencias: repositorioSugerencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias(preferenciasIniciales('DO', 'es-DO'));
  const { pagoHecho: _, ...sinMarcar } = tarjeta;
  await almacen.getState().guardarTarjeta(sinMarcar);
  const pago = { tarjeta: sinMarcar, fecha: '2026-10-30', dias: -3, pagado: false, vencido: true, aviso: null };
  await render(
    <ProveedorPais regiones={[{ regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' }]}>
      <ProveedorAlmacenDePrueba almacen={almacen}>
        <FilaPago pago={pago} />
      </ProveedorAlmacenDePrueba>
    </ProveedorPais>,
  );
  expect(screen.getByText('¿Pagaste el total? Vencía el 30 de octubre')).toBeOnTheScreen();
  await fireEvent.press(screen.getByLabelText('Ya pagué Visa Banreservas'));
  await act(async () => {});
  expect(almacen.getState().tarjetas[0].pagoHecho).toBe('2026-10-30');
});

test('pagoUrgente: el vencido solo se pinta de alerta si el usuario ya usa "Ya pagué"', () => {
  const vencido = { tarjeta, fecha: '2026-10-30', dias: -3, pagado: false, vencido: true, aviso: null };
  expect(pagoUrgente(vencido, false)).toBe(false);
  expect(pagoUrgente(vencido, true)).toBe(true);
  expect(pagoUrgente({ ...vencido, dias: 2, vencido: false }, false)).toBe(true);
});
