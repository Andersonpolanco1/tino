import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Tarjeta } from '@/tipos/tipos';
import { ProveedorPais } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba } from '@/estado';
import { FilaPago } from '../FilaPago';

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
  const pago = { tarjeta, fecha: '2026-09-30', dias: 4, pagado: true, aviso: null };
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
