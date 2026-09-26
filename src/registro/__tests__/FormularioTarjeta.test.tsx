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

// Presionar y esperar a que termine lo asíncrono (guardar escribe en la base).
async function presionar(texto: string) {
  await fireEvent.press(screen.getByText(texto));
  await act(async () => {});
}

async function escribirFechas() {
  await fireEvent.changeText(screen.getByLabelText('Día de corte'), '5');
  await fireEvent.changeText(screen.getByLabelText('Día'), '25');
}

describe('agregar tarjeta paso a paso', () => {
  test('producto con moneda conocida: 3 pasos, sin preguntar por dólares', async () => {
    const almacen = await preparar();
    const onListo = jest.fn();
    await render(envolver(almacen, rd, <FormularioTarjeta onListo={onListo} />));

    await presionar('BHD');
    await presionar('Visa Clásica');
    expect(screen.getByText('Paso 1 de 3')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Visa Clásica BHD')).toBeOnTheScreen();

    await presionar('Siguiente');
    expect(screen.getByText('Paso 2 de 3')).toBeOnTheScreen();
    await presionar('Siguiente');
    expect(screen.getByText('Escribe un día de corte entre 1 y 31.')).toBeOnTheScreen();

    await escribirFechas();
    await presionar('Siguiente');
    expect(screen.getByText('Paso 3 de 3')).toBeOnTheScreen();
    await presionar('Guardar');

    expect(onListo).toHaveBeenCalledWith(
      expect.objectContaining({ alias: 'Visa Clásica BHD', monedaFacturacion: 'doble_balance', compraEnDiaDeCorte: 'entra_en_corte_actual' }),
      true,
    );
    expect(almacen.getState().tarjetas).toHaveLength(1);
  });

  test('"Mi tarjeta no está en la lista" agrega el paso de dólares (criterio 14.1)', async () => {
    const almacen = await preparar();
    const onListo = jest.fn();
    await render(envolver(almacen, rd, <FormularioTarjeta onListo={onListo} />));

    await presionar('Banreservas');
    await presionar('Mi tarjeta no está en la lista');
    expect(screen.getByText('Paso 1 de 4')).toBeOnTheScreen();
    await presionar('Siguiente');

    expect(screen.getByText('¿Tu estado de cuenta trae un balance en dólares aparte?')).toBeOnTheScreen();
    await presionar('Siguiente');
    expect(screen.getByText('Responde si tu estado de cuenta trae un balance en dólares aparte.')).toBeOnTheScreen();
    await presionar('No');
    await presionar('Siguiente');

    await escribirFechas();
    await presionar('Siguiente');
    await presionar('Guardar');
    expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ productoId: null, monedaFacturacion: 'solo_principal' }), false);
  });

  test('un número de tarjeta en el nombre no deja avanzar (criterio 14.1)', async () => {
    const almacen = await preparar();
    await render(envolver(almacen, rd, <FormularioTarjeta onListo={jest.fn()} />));
    await presionar('Banreservas');
    await presionar('No sé el tipo');
    await fireEvent.changeText(screen.getByLabelText('Nombre en Tino'), '4111 1111 1111 1111');
    await presionar('Siguiente');
    expect(screen.getByText('Parece un número de tarjeta. Nunca lo escribas en Tino.')).toBeOnTheScreen();
    expect(screen.getByText('Paso 1 de 4')).toBeOnTheScreen();
  });

  test('"Atrás" vuelve al paso anterior sin perder lo escrito', async () => {
    const almacen = await preparar();
    await render(envolver(almacen, rd, <FormularioTarjeta onListo={jest.fn()} />));
    await presionar('BHD');
    await presionar('Visa Clásica');
    await fireEvent.changeText(screen.getByLabelText('Nombre en Tino'), 'Mi Visa');
    await presionar('Siguiente');
    await presionar('Atrás');
    expect(screen.getByDisplayValue('Mi Visa')).toBeOnTheScreen();
  });

  test('fuera de RD: banco a mano, sin paso de dólares y facturación normal (criterio 18.6)', async () => {
    const almacen = await preparar(mx);
    const onListo = jest.fn();
    await render(envolver(almacen, mx, <FormularioTarjeta onListo={onListo} />));

    expect(screen.getByText('Paso 1 de 3')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Nombre en Tino'), 'Mi tarjeta');
    await presionar('Siguiente');
    await escribirFechas();
    await presionar('Siguiente');
    await presionar('Guardar');

    expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ emisorId: null, alias: 'Mi tarjeta', monedaFacturacion: 'solo_principal' }), false);
  });

  test('el ícono de información explica la opción', async () => {
    const almacen = await preparar();
    await render(envolver(almacen, rd, <FormularioTarjeta onListo={jest.fn()} />));
    await presionar('BHD');
    await presionar('Visa Clásica');
    await presionar('Siguiente');

    expect(screen.queryByText(/Es el día del mes en que el banco cierra/)).toBeNull();
    await fireEvent.press(screen.getByLabelText('Más información sobre Día de corte'));
    expect(screen.getByText(/Es el día del mes en que el banco cierra/)).toBeOnTheScreen();
  });
});

describe('editar tarjeta por secciones', () => {
  async function conTarjeta() {
    const almacen = await preparar();
    await render(envolver(almacen, rd, <FormularioTarjeta onListo={jest.fn()} />));
    await presionar('BHD');
    await presionar('Visa Clásica');
    await presionar('Siguiente');
    await escribirFechas();
    await presionar('Siguiente');
    await presionar('Guardar');
    await screen.unmount();
    return almacen;
  }

  test('muestra el resumen y guarda solo la sección editada', async () => {
    const almacen = await conTarjeta();
    const [tarjeta] = almacen.getState().tarjetas;
    await render(envolver(almacen, rd, <FormularioTarjeta tarjeta={tarjeta} onListo={jest.fn()} />));

    expect(screen.getByText('Corte día 5 · pago día 25')).toBeOnTheScreen();
    await presionar('Fechas');
    await fireEvent.changeText(screen.getByLabelText('Día de corte'), '7');
    await presionar('Guardar');

    expect(screen.getByText('Corte día 7 · pago día 25')).toBeOnTheScreen();
    expect(almacen.getState().tarjetas[0]).toMatchObject({ id: tarjeta.id, diaCorte: 7, alias: 'Visa Clásica BHD' });
  });

  test('cancelar descarta los cambios de la sección', async () => {
    const almacen = await conTarjeta();
    const [tarjeta] = almacen.getState().tarjetas;
    await render(envolver(almacen, rd, <FormularioTarjeta tarjeta={tarjeta} onListo={jest.fn()} />));
    await presionar('Tu tarjeta');
    await fireEvent.changeText(screen.getByLabelText('Nombre en Tino'), 'Otro nombre');
    await presionar('Cancelar');
    expect(screen.getByText('Visa Clásica BHD · Sin últimos 4 dígitos')).toBeOnTheScreen();
    expect(almacen.getState().tarjetas[0].alias).toBe('Visa Clásica BHD');
  });

  test('pausar se guarda al instante', async () => {
    const almacen = await conTarjeta();
    const [tarjeta] = almacen.getState().tarjetas;
    await render(envolver(almacen, rd, <FormularioTarjeta tarjeta={tarjeta} onListo={jest.fn()} />));
    await fireEvent(screen.getByLabelText('En pausa'), 'change', { nativeEvent: { value: true } });
    await act(async () => {});
    expect(almacen.getState().tarjetas[0].enPausa).toBe(true);
  });
});
