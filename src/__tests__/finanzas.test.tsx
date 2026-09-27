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
import Tarjetas from '../../app/(tabs)/tarjetas';
import ConsejosFechas from '../../app/consejos/fechas';

// Decisión D67: textos que cuidan las finanzas en "Tengo una compra" y en el detalle.
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 'P' }),
  useFocusEffect: (efecto: () => void) => require('react').useEffect(efecto, []),
  Stack: { Screen: () => null },
}));
jest.mock('@/utilidades/fecha', () => ({ hoyLocal: () => '2026-10-06' }));

function tarjeta(id: string, cambios: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id,
    alias: `Tarjeta ${id}`,
    emisorId: null,
    emisorTextoLibre: `Banco ${id}`,
    productoId: null,
    productoDesconocido: false,
    diaCorte: 5,
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
  await almacen.getState().guardarPreferencias(preferenciasIniciales('DO', 'es-DO'));
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

const conversion = /^Esta tarjeta te cobra en pesos con la tasa del banco: puede salirte alrededor de 6% más cara\./;

test('una compra en dólares con una tarjeta que factura en pesos avisa de la conversión', async () => {
  await render(envolver(await almacenCon([tarjeta('P')]), <Compra />));
  await act(async () => fireEvent.changeText(screen.getByLabelText('¿Cuánto vas a gastar?'), '100'));
  expect(screen.queryByText(conversion)).toBeNull();
  await act(async () => fireEvent.press(screen.getByText('Dólares')));
  expect(screen.getByText(conversion)).toBeOnTheScreen();
});

test('con balance en dólares no hay aviso de conversión', async () => {
  await render(envolver(await almacenCon([tarjeta('P', { monedaFacturacion: 'doble_balance' })]), <Compra />));
  await act(async () => fireEvent.changeText(screen.getByLabelText('¿Cuánto vas a gastar?'), '100'));
  await act(async () => fireEvent.press(screen.getByText('Dólares')));
  expect(screen.queryByText(conversion)).toBeNull();
});

test('el detalle explica el corte con el día de la tarjeta, la fecha límite y el pago total', async () => {
  await render(envolver(await almacenCon([tarjeta('P')]), <DetalleTarjeta />));
  expect(screen.getByText('Cómo funciona tu tarjeta')).toBeOnTheScreen();
  await act(async () => fireEvent.press(screen.getByLabelText('Más información sobre ¿Qué es el corte?')));
  expect(screen.getByText(/Tu Tarjeta P corta el día 5 de cada mes\.$/)).toBeOnTheScreen();
  await act(async () => fireEvent.press(screen.getByLabelText('Más información sobre ¿Pago el total o el mínimo?')));
  expect(screen.getByText(/^Si pagas el total del estado de cuenta/)).toBeOnTheScreen();
});

// Decisión D65: dos tarjetas que cortan casi el mismo día.
const juntas = () => [tarjeta('P'), tarjeta('Q', { diaCorte: 6, creadaEn: '2026-09-20' })];

test('Tarjetas muestra el consejo de fechas y lleva a sus pasos', async () => {
  await render(envolver(await almacenCon(juntas()), <Tarjetas />));
  expect(screen.getByText('Consejos para tus fechas')).toBeOnTheScreen();
  expect(screen.getByText('Tarjeta Q y Tarjeta P cortan casi el mismo día')).toBeOnTheScreen();
  expect(screen.getByText(/^Pide que el corte de Tarjeta Q sea (entre el \d+ y el \d+|el día \d+)$/)).toBeOnTheScreen();
  await act(async () => fireEvent.press(screen.getByText('Tarjeta Q y Tarjeta P cortan casi el mismo día')));
  expect(mockRouter.push).toHaveBeenCalledWith('/consejos/fechas');
});

test('sin problemas de fechas no hay sección de consejos', async () => {
  await render(envolver(await almacenCon([tarjeta('P'), tarjeta('Q', { diaCorte: 20 })]), <Tarjetas />));
  expect(screen.queryByText('Consejos para tus fechas')).toBeNull();
});

test('la pantalla de consejos explica qué pedir, cómo y lleva a editar las fechas', async () => {
  await render(envolver(await almacenCon(juntas()), <ConsejosFechas />));
  expect(screen.getByText(/^Por eso hay días del mes en que ninguna de las dos te da más de \d+ días para pagar\./)).toBeOnTheScreen();
  expect(screen.getByText(/^Llama al número que está detrás de tu Tarjeta Q/)).toBeOnTheScreen();
  await act(async () => fireEvent.press(screen.getByText('Actualizar fechas de Tarjeta Q')));
  expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/tarjeta/editar/[id]', params: { id: 'Q', seccion: 'fechas' } });
});
