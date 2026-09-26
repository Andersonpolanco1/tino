import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { ProveedorPais, type RegionDispositivo } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import Inicio from '../../app/(tabs)/inicio';
import Ajustes from '../../app/(tabs)/ajustes';
import Tarjetas from '../../app/(tabs)/tarjetas';
import type { Tarjeta } from '@/tipos/tipos';
import { hoyLocal } from '@/utilidades/fecha';
import { proximoPago } from '@/inicio/vista';
import paisDO from '@/paises/do.json';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
// Ajustes importa la base para "Borrar todo"; en estas pruebas no se abre.
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(), deleteDatabaseAsync: jest.fn(), defaultDatabaseDirectory: '' }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));

const medidas = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function almacenCon(pais: string) {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db), sugerencias: repositorioSugerencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias(preferenciasIniciales(pais, 'es-DO'));
  return almacen;
}

function conPais(regiones: RegionDispositivo[], almacen: Almacen, pantalla: ReactNode) {
  return (
    <SafeAreaProvider initialMetrics={medidas}>
      <ProveedorPais regiones={regiones}>
        <ProveedorAlmacenDePrueba almacen={almacen}>{pantalla}</ProveedorAlmacenDePrueba>
      </ProveedorPais>
    </SafeAreaProvider>
  );
}

const rd: RegionDispositivo = { regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' };
const mx: RegionDispositivo = { regionCode: 'MX', currencyCode: 'MXN', languageTag: 'es-MX' };
const us: RegionDispositivo = { regionCode: 'US', currencyCode: 'USD', languageTag: 'en-US' };

test('inicio muestra su título como encabezado', async () => {
  await render(conPais([rd], await almacenCon('DO'), <Inicio />));
  expect(screen.getByRole('header')).toHaveTextContent('Hoy te conviene usar');
});

test('ajustes muestra el país y las monedas de RD', async () => {
  await render(conPais([rd], await almacenCon('DO'), <Ajustes />));
  // Las monedas van como detalle del país, sin fila propia.
  expect(screen.getByText('República Dominicana · Pesos y dólares')).toBeOnTheScreen();
});

test('ajustes muestra un país sin catálogo con la moneda del teléfono', async () => {
  await render(conPais([mx], await almacenCon('MX'), <Ajustes />));
  expect(screen.getByText('Otro país (MX) · MXN')).toBeOnTheScreen();
});

test('un teléfono con región de EE. UU. puede elegir República Dominicana y queda guardado (criterio 18.6)', async () => {
  const almacen = await almacenCon('US');
  await render(conPais([us], almacen, <Ajustes />));
  expect(screen.getByText(/· Dólares$/)).toBeOnTheScreen();

  await fireEvent.press(screen.getByText('País'));
  await fireEvent.press(screen.getByText('República Dominicana'));
  await act(async () => {});

  expect(almacen.getState().preferencias).toMatchObject({ pais: 'DO', idioma: 'es-DO' });
  expect(screen.getByText('República Dominicana · Pesos y dólares')).toBeOnTheScreen();
});

test('Apariencia: elegir Oscuro lo guarda en las preferencias (decisión D51)', async () => {
  const almacen = await almacenCon('DO');
  await render(conPais([rd], almacen, <Ajustes />));
  expect(screen.getByText('Automático')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Apariencia'));
  await fireEvent.press(screen.getByText('Oscuro'));
  await act(async () => {});
  expect(almacen.getState().preferencias?.tema).toBe('oscuro');
});

test('Tarjetas: cada fila dice el estado de su pago, sin una lista aparte (decisión D54)', async () => {
  const almacen = await almacenCon('DO');
  const base: Tarjeta = {
    id: 'A',
    alias: 'Visa A',
    emisorId: null,
    emisorTextoLibre: 'Banco A',
    productoId: null,
    productoDesconocido: false,
    diaCorte: 5,
    fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: 'solo_principal',
    recompensa: { tipo: 'ninguna' },
    enPausa: false,
    creadaEn: '2026-09-01',
  };
  const pagada = { ...base, id: 'B', alias: 'Visa B' };
  await almacen.getState().guardarTarjeta(base);
  await almacen.getState().guardarTarjeta({ ...pagada, pagoHecho: proximoPago(pagada, hoyLocal(), paisDO as never) });
  await render(conPais([rd], almacen, <Tarjetas />));
  expect(screen.getByText(/^(Vence hoy|Vence mañana|Vence el .* · en \d+ días)/)).toBeOnTheScreen();
  expect(screen.getByText(/^Pagado · vence el /)).toBeOnTheScreen();
  expect(screen.queryByText('Próximos pagos')).toBeNull();
});
