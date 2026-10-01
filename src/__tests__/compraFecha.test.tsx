import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Tarjeta } from '@/tipos/tipos';
import { ProveedorPais } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import Compra from '../../app/compra';
import DetalleTarjeta from '../../app/tarjeta/[id]';

// Decisión D96: "Tengo una compra" calcula para el día que elija el usuario, dentro del mes.
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = { id: 'P' };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (efecto: () => void) => require('react').useEffect(efecto, []),
  Stack: { Screen: () => null },
}));
jest.mock('@/utilidades/fecha', () => ({ hoyLocal: () => '2026-10-06' }));
// El selector nativo no existe en las pruebas: se guardan sus props para elegir un día.
const mockSelector: { props: Record<string, unknown> | null } = { props: null };
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockSelector.props = props;
    return null;
  },
  DateTimePickerAndroid: { open: jest.fn() },
}));

function tarjeta(id: string, cambios: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id,
    alias: `Tarjeta ${id}`,
    emisorId: null,
    emisorTextoLibre: `Banco ${id}`,
    productoId: null,
    productoDesconocido: false,
    diaCorte: 8,
    fechaLimite: { tipo: 'dias_despues_corte', dias: 20 },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: 'solo_principal',
    recompensa: { tipo: 'ninguna' },
    enPausa: false,
    creadaEn: '2026-09-01',
    ...cambios,
  };
}

async function almacenCon(tarjetas: Tarjeta[]) {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db), sugerencias: repositorioSugerencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias({ ...preferenciasIniciales('DO', 'es-DO'), analiticaDecidida: '2026-09-01' });
  for (const t of tarjetas) await almacen.getState().guardarTarjeta(t);
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

beforeEach(() => {
  jest.clearAllMocks();
  mockSelector.props = null;
  mockParams = { id: 'P' };
});

async function consultar() {
  await render(envolver(await almacenCon([tarjeta('P')]), <Compra />));
  await act(async () => fireEvent.changeText(screen.getByLabelText('¿Cuánto vas a gastar?'), '5000'));
}

test('la consulta abre con hoy y solo habilita hasta el mismo día del mes siguiente', async () => {
  await consultar();
  expect(screen.getByRole('button', { name: 'Día de la compra: Hoy' })).toBeOnTheScreen();
  expect(screen.getByText('Usa esta tarjeta')).toBeOnTheScreen();
  expect(screen.getByText('22 días')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: /^Día de la compra/ }));
  const { minimumDate, maximumDate } = mockSelector.props as { minimumDate: Date; maximumDate: Date };
  expect(minimumDate.toDateString()).toBe(new Date(2026, 9, 6).toDateString());
  expect(maximumDate.toDateString()).toBe(new Date(2026, 10, 6).toDateString());
});

test('elegir otro día recalcula la tarjeta para ese día', async () => {
  await consultar();
  await fireEvent.press(screen.getByRole('button', { name: /^Día de la compra/ }));
  const onChange = mockSelector.props!.onChange as (evento: unknown, fecha?: Date) => void;
  await act(async () => onChange({ type: 'set' }, new Date(2026, 9, 9)));

  expect(screen.getByText('Úsala el viernes 9')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Día de la compra: Viernes 9 de octubre' })).toBeOnTheScreen();
  expect(screen.getByText('50 días')).toBeOnTheScreen();
  expect(screen.queryByText(/^Si esperas al/)).toBeNull();

  // El detalle se abre para el mismo día.
  await fireEvent.press(screen.getByText('Tarjeta P'));
  expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/tarjeta/[id]', params: { id: 'P', fecha: '2026-10-09' } });
});

test('tocar el consejo de esperar pone ese día en la consulta', async () => {
  await consultar();
  await fireEvent.press(screen.getByRole('button', { name: /^Si esperas al viernes 9/ }));
  expect(screen.getByText('Úsala el viernes 9')).toBeOnTheScreen();
  expect(screen.getByText('50 días')).toBeOnTheScreen();
});

test('el detalle abierto con una fecha dice ese día en vez de hoy', async () => {
  mockParams = { id: 'P', fecha: '2026-10-09' };
  await render(envolver(await almacenCon([tarjeta('P')]), <DetalleTarjeta />));
  expect(screen.getByText('Si la usas el viernes 9')).toBeOnTheScreen();
  expect(screen.getByText('Compra')).toBeOnTheScreen();
  expect(screen.queryByText('Hoy')).toBeNull();
});

test('el detalle ignora una fecha fuera del mes y muestra hoy', async () => {
  mockParams = { id: 'P', fecha: '2026-12-01' };
  await render(envolver(await almacenCon([tarjeta('P')]), <DetalleTarjeta />));
  expect(screen.getByText('Si la usas hoy')).toBeOnTheScreen();
});

test('con otro día, el corte cercano se dice con su fecha y no contando desde hoy', async () => {
  // Q corta el 9: elegido el 9 diría "Corta hoy"; elegido el 7, "Corta en 2 días".
  await render(envolver(await almacenCon([tarjeta('P', { diaCorte: 20 }), tarjeta('Q', { diaCorte: 9, compraEnDiaDeCorte: 'entra_en_corte_actual' })]), <Compra />));
  await act(async () => fireEvent.changeText(screen.getByLabelText('¿Cuánto vas a gastar?'), '5000'));
  expect(screen.getByText('Corta en 3 días')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: /^Día de la compra/ }));
  await act(async () => (mockSelector.props!.onChange as (e: unknown, f?: Date) => void)({ type: 'set' }, new Date(2026, 9, 9)));
  expect(screen.getByText('Corta ese día')).toBeOnTheScreen();
  expect(screen.queryByText('Corta hoy')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: /^Día de la compra/ }));
  await act(async () => (mockSelector.props!.onChange as (e: unknown, f?: Date) => void)({ type: 'set' }, new Date(2026, 9, 7)));
  expect(screen.getByText('Corta el viernes 9')).toBeOnTheScreen();
});
