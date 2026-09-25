import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Tarjeta } from '@/tipos/tipos';
import { migrar } from '@/datos/migraciones';
import { repositorioPreferencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import { ProveedorPais } from '@/paises';
import TarjetasOnboarding from '../../app/onboarding/tarjetas';
import EnfoqueOnboarding from '../../app/onboarding/enfoque';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const tarjeta: Tarjeta = {
  id: 't1',
  alias: 'Visa Clásica BHD',
  emisorId: 'bhd',
  productoId: 'bhd-visa-clasica',
  productoDesconocido: false,
  diaCorte: 5,
  fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
  ajusteDiaNoHabil: 'adelantar',
  compraEnDiaDeCorte: 'entra_en_corte_actual',
  monedaFacturacion: 'doble_balance',
  recompensa: { tipo: 'ninguna' },
  enPausa: false,
  creadaEn: '2026-09-25',
};

async function preparar() {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), preferencias: repositorioPreferencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias(preferenciasIniciales('DO', 'es-DO'));
  return almacen;
}

function envolver(almacen: Almacen, hijos: ReactNode) {
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProveedorPais regiones={[{ regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' }]}>
        <ProveedorAlmacenDePrueba almacen={almacen}>{hijos}</ProveedorAlmacenDePrueba>
      </ProveedorPais>
    </SafeAreaProvider>
  );
}

beforeEach(() => jest.clearAllMocks());

test('sin tarjetas solo se puede agregar la primera; con una, se puede continuar', async () => {
  const almacen = await preparar();
  await render(envolver(almacen, <TarjetasOnboarding />));
  expect(screen.queryByText('Continuar')).toBeNull();
  await fireEvent.press(screen.getByText('Agregar mi primera tarjeta'));
  expect(mockRouter.push).toHaveBeenCalledWith('/tarjeta/nueva');

  await act(() => almacen.getState().guardarTarjeta(tarjeta));
  expect(screen.getByText('Visa Clásica BHD')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Continuar'));
  expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/enfoque');
});

test('elegir el enfoque lo guarda y lleva a inicio en un toque', async () => {
  const almacen = await preparar();
  await render(envolver(almacen, <EnfoqueOnboarding />));
  await fireEvent.press(screen.getByText('Puntos'));
  await act(async () => {});
  expect(almacen.getState().preferencias?.enfoque.modo).toBe('puntos');
  expect(mockRouter.replace).toHaveBeenCalledWith('/inicio');
});
