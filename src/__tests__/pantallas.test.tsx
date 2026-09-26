import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { ProveedorPais, type RegionDispositivo } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioPreferencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import Inicio from '../../app/(tabs)/inicio';
import Ajustes from '../../app/(tabs)/ajustes';

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
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), preferencias: repositorioPreferencias(db) });
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
  expect(screen.getByRole('header')).toHaveTextContent('Tu tarjeta de hoy');
});

test('ajustes muestra el país y las monedas de RD', async () => {
  await render(conPais([rd], await almacenCon('DO'), <Ajustes />));
  expect(screen.getByText('República Dominicana')).toBeOnTheScreen();
  expect(screen.getByText('DOP · USD')).toBeOnTheScreen();
});

test('ajustes muestra un país sin catálogo con la moneda del teléfono', async () => {
  await render(conPais([mx], await almacenCon('MX'), <Ajustes />));
  expect(screen.getByText('Otro país (MX)')).toBeOnTheScreen();
  expect(screen.getByText('MXN')).toBeOnTheScreen();
});

test('un teléfono con región de EE. UU. puede elegir República Dominicana y queda guardado (criterio 18.6)', async () => {
  const almacen = await almacenCon('US');
  await render(conPais([us], almacen, <Ajustes />));
  expect(screen.getByText('USD')).toBeOnTheScreen();

  await fireEvent.press(screen.getByText('República Dominicana'));
  await act(async () => {});

  expect(almacen.getState().preferencias).toMatchObject({ pais: 'DO', idioma: 'es-DO' });
  expect(screen.getByText('DOP · USD')).toBeOnTheScreen();
});
