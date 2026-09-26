import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrar } from '../../datos/migraciones';
import { repositorioPreferencias, repositorioTarjetas } from '../../datos/repositorios';
import { preferenciasIniciales } from '../../datos/preferencias';
import { basePrueba } from '../../pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '../../estado';
import { catalogoIncluido, ProveedorCatalogoDePrueba } from '../../catalogo';
import { ProveedorPais, type RegionDispositivo } from '../../paises';
import { FormularioTarjeta } from '../FormularioTarjeta';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'id-nueva' }));

const rd: RegionDispositivo = { regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' };
const mx: RegionDispositivo = { regionCode: 'MX', currencyCode: 'MXN', languageTag: 'es-MX' };

async function preparar(region: RegionDispositivo = rd) {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), preferencias: repositorioPreferencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias(preferenciasIniciales(region.regionCode!, 'es-DO'));
  return almacen;
}

function envolver(almacen: Almacen, region: RegionDispositivo, hijos: ReactNode) {
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProveedorPais regiones={[region]}>
        <ProveedorAlmacenDePrueba almacen={almacen}>
          <ProveedorCatalogoDePrueba catalogo={region === rd ? catalogoIncluido('DO') : null}>{hijos}</ProveedorCatalogoDePrueba>
        </ProveedorAlmacenDePrueba>
      </ProveedorPais>
    </SafeAreaProvider>
  );
}

// Guardar es asíncrono (escribe en la base); se espera a que termine antes de seguir.
async function guardar() {
  await fireEvent.press(screen.getByText('Guardar'));
  await act(async () => {});
}

async function escribirFechas() {
  await fireEvent.changeText(screen.getByLabelText('Día de corte'), '5');
  await fireEvent.changeText(screen.getByLabelText('Día'), '25');
}

test('registra una tarjeta del catálogo en pocos toques y pide la pregunta de dólares', async () => {
  const almacen = await preparar();
  const onListo = jest.fn();
  await render(envolver(almacen, rd, <FormularioTarjeta onListo={onListo} />));

  await fireEvent.press(screen.getByText('BHD'));
  await fireEvent.press(screen.getByText('Visa Clásica'));
  expect(screen.getByDisplayValue('Visa Clásica BHD')).toBeOnTheScreen();

  await escribirFechas();
  await guardar();

  expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ alias: 'Visa Clásica BHD', monedaFacturacion: 'doble_balance' }), true);
  expect(almacen.getState().tarjetas).toHaveLength(1);
});

test('"Mi tarjeta no está en la lista" pregunta por el balance en dólares y luego guarda (criterio 14.1)', async () => {
  const almacen = await preparar();
  const onListo = jest.fn();
  await render(envolver(almacen, rd, <FormularioTarjeta onListo={onListo} />));

  await fireEvent.press(screen.getByText('Banreservas'));
  await fireEvent.press(screen.getByText('Mi tarjeta no está en la lista'));
  await escribirFechas();
  await guardar();
  expect(screen.getByText('Responde si tu estado de cuenta trae un balance en dólares aparte.')).toBeOnTheScreen();
  expect(onListo).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByText('No'));
  await guardar();
  expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ productoId: null, alias: 'Tarjeta Banreservas' }), false);
});

test('un número de tarjeta en el alias no se guarda (criterio 14.1)', async () => {
  const almacen = await preparar();
  const onListo = jest.fn();
  await render(envolver(almacen, rd, <FormularioTarjeta onListo={onListo} />));

  await fireEvent.press(screen.getByText('Banreservas'));
  await fireEvent.press(screen.getByText('No sé el tipo'));
  await fireEvent.changeText(screen.getByLabelText('Nombre en Tino'), '4111 1111 1111 1111');
  await escribirFechas();
  await fireEvent.press(screen.getByText('No'));
  await guardar();

  expect(screen.getByText('Parece un número de tarjeta. Nunca lo escribas en Tino.')).toBeOnTheScreen();
  expect(onListo).not.toHaveBeenCalled();
  expect(almacen.getState().tarjetas).toEqual([]);
});

test('fuera de RD: banco a mano, sin pregunta de dólares y facturación normal (criterio 18.6)', async () => {
  const almacen = await preparar(mx);
  const onListo = jest.fn();
  await render(envolver(almacen, mx, <FormularioTarjeta onListo={onListo} />));

  expect(screen.queryByText('¿Tu estado de cuenta trae un balance en dólares aparte?')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Nombre en Tino'), 'Mi tarjeta');
  await escribirFechas();
  await guardar();

  expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ emisorId: null, alias: 'Mi tarjeta', monedaFacturacion: 'solo_principal' }), false);
});

test('la compra el día del corte ya no se pregunta y entra en ese corte', async () => {
  const almacen = await preparar();
  const onListo = jest.fn();
  await render(envolver(almacen, rd, <FormularioTarjeta onListo={onListo} />));
  await fireEvent.press(screen.getByText('BHD'));
  await fireEvent.press(screen.getByText('Visa Clásica'));
  await fireEvent.press(screen.getByText('Más opciones'));
  expect(screen.queryByText('Una compra el mismo día del corte')).toBeNull();
  await escribirFechas();
  await guardar();
  expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ compraEnDiaDeCorte: 'entra_en_corte_actual' }), true);
});

test('editar una tarjeta conserva sus datos y permite pausarla', async () => {
  const almacen = await preparar();
  const onListo = jest.fn();
  await render(envolver(almacen, rd, <FormularioTarjeta onListo={onListo} />));
  await fireEvent.press(screen.getByText('BHD'));
  await fireEvent.press(screen.getByText('Visa Clásica'));
  await escribirFechas();
  await guardar();
  const [tarjeta] = almacen.getState().tarjetas;

  await screen.unmount();
  const onEditada = jest.fn();
  await render(envolver(almacen, rd, <FormularioTarjeta tarjeta={tarjeta} onListo={onEditada} />));
  expect(screen.getByDisplayValue('Visa Clásica BHD')).toBeOnTheScreen();
  await fireEvent(screen.getByLabelText('En pausa'), 'change', { nativeEvent: { value: true } });
  await guardar();

  expect(onEditada).toHaveBeenCalledWith(expect.objectContaining({ id: tarjeta.id, enPausa: true }), true);
  expect(almacen.getState().tarjetas).toHaveLength(1);
});
