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
import Inicio from '../../app/(tabs)/inicio';
import { BarraPestanas } from '@/diseno';

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

const conversion = /^Te cobra en pesos con la tasa del banco: sale cerca de 6% más caro\./;

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
  expect(screen.getByText(/Tu Tarjeta P corta el 5 de cada mes\.$/)).toBeOnTheScreen();
  await act(async () => fireEvent.press(screen.getByLabelText('Más información sobre ¿Pago el total o el mínimo?')));
  expect(screen.getByText(/^Si pagas el total antes de la fecha límite/)).toBeOnTheScreen();
});

// Decisión D73: dos tarjetas que cortan casi el mismo día.
const juntas = () => [tarjeta('P'), tarjeta('Q', { diaCorte: 6, creadaEn: '2026-09-20' })];

// Decisión D74: los consejos viven detrás del bombillo de Tarjetas, con un punto mientras haya
// alguno sin ver; no se ocultan y se van solos cuando el problema se resuelve.
test('Tarjetas muestra el bombillo con punto y lleva a los consejos, sin listarlos', async () => {
  await render(envolver(await almacenCon(juntas()), <Tarjetas />));
  expect(screen.getByLabelText('Consejos para tus fechas, 1 nuevo')).toBeOnTheScreen();
  expect(screen.getByTestId('consejos-aviso')).toBeOnTheScreen();
  expect(screen.queryByText('Tus tarjetas cortan muy cerca')).toBeNull();
  await act(async () => fireEvent.press(screen.getByTestId('consejos')));
  expect(mockRouter.push).toHaveBeenCalledWith('/consejos/fechas');
});

test('sin problemas de fechas no hay bombillo', async () => {
  await render(envolver(await almacenCon([tarjeta('P'), tarjeta('Q', { diaCorte: 20 })]), <Tarjetas />));
  expect(screen.queryByTestId('consejos')).toBeNull();
});

test('la pantalla de consejos dice qué pasa y qué hacer, breve, y lleva a editar las fechas', async () => {
  await render(envolver(await almacenCon(juntas()), <ConsejosFechas />));
  expect(screen.getByText('Tus tarjetas cortan muy cerca')).toBeOnTheScreen();
  expect(screen.getByText(/^Cortan los días 5 y 6, así que hay días del mes en que ninguna te da más de \d+ días para pagar\.$/)).toBeOnTheScreen();
  expect(screen.getByText('Qué hacer')).toBeOnTheScreen();
  expect(screen.getByText('Llama al banco de tu Tarjeta Q y pide mover su fecha de corte unas dos semanas.')).toBeOnTheScreen();
  expect(screen.queryByText('Mientras tanto')).toBeNull();
  await act(async () => fireEvent.press(screen.getByText('Actualizar fechas de Tarjeta Q')));
  expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/tarjeta/editar/[id]', params: { id: 'Q', seccion: 'fechas' } });
});

test('abrir los consejos los marca vistos: el bombillo sigue, pero sin punto', async () => {
  const almacen = await almacenCon(juntas());
  await render(envolver(almacen, <ConsejosFechas />));
  expect(almacen.getState().preferencias?.consejosVistos).toHaveLength(1);
  expect(screen.queryByText('Ya lo sé, no mostrar más')).toBeNull();
  await screen.unmount();
  await render(envolver(almacen, <Tarjetas />));
  expect(screen.getByLabelText('Consejos para tus fechas')).toBeOnTheScreen();
  expect(screen.queryByTestId('consejos-aviso')).toBeNull();
});

test('el consejo se va cuando el problema se resuelve: otra fecha de corte o la tarjeta en pausa', async () => {
  const almacen = await almacenCon(juntas());
  await render(envolver(almacen, <Tarjetas />));
  await act(async () => almacen.getState().guardarTarjeta(tarjeta('Q', { diaCorte: 20, creadaEn: '2026-09-20' })));
  expect(screen.queryByTestId('consejos')).toBeNull();
  await act(async () => almacen.getState().guardarTarjeta(tarjeta('Q', { diaCorte: 6, creadaEn: '2026-09-20' })));
  expect(screen.getByTestId('consejos')).toBeOnTheScreen();
  await act(async () => almacen.getState().alternarPausa('Q'));
  expect(screen.queryByTestId('consejos')).toBeNull();
});

test('Inicio sugiere el consejo solo mientras es nuevo', async () => {
  const almacen = await almacenCon(juntas());
  await render(envolver(almacen, <Inicio />));
  expect(screen.getByText(/^Tino encontró cómo mejorar tus fechas/)).toBeOnTheScreen();
  await screen.unmount();
  await render(envolver(almacen, <ConsejosFechas />));
  await screen.unmount();
  await render(envolver(almacen, <Inicio />));
  expect(screen.queryByText(/^Tino encontró cómo mejorar tus fechas/)).toBeNull();
});

test('la pestaña con algo nuevo lleva un punto y lo dice al lector de pantalla', async () => {
  const pestanas = [
    { clave: 'inicio', titulo: 'Inicio', icono: 'inicio' as const },
    { clave: 'tarjetas', titulo: 'Tarjetas', icono: 'tarjetas' as const, aviso: 'Tienes consejos nuevos para tus fechas' },
  ];
  await render(envolver(await almacenCon([]), <BarraPestanas pestanas={pestanas} activa={0} onElegir={() => {}} etiqueta="Navegación" />));
  expect(screen.getByTestId('aviso-tarjetas')).toBeOnTheScreen();
  expect(screen.queryByTestId('aviso-inicio')).toBeNull();
  expect(screen.getByLabelText('Tarjetas. Tienes consejos nuevos para tus fechas')).toBeOnTheScreen();
});

// Decisión D69: en "Tengo una compra", si la mejor está por cortar, cuánto da esperar.
test('una compra con la mejor tarjeta por cortar dice cuántos días da esperar', async () => {
  await render(envolver(await almacenCon([tarjeta('P', { diaCorte: 8 })]), <Compra />));
  await act(async () => fireEvent.changeText(screen.getByLabelText('¿Cuánto vas a gastar?'), '5000'));
  expect(screen.getByText('Si esperas al viernes 9, tendrás 50 días para pagar esta compra en vez de 22.')).toBeOnTheScreen();
});

test('recién cortada no sugiere esperar', async () => {
  await render(envolver(await almacenCon([tarjeta('P')]), <Compra />));
  await act(async () => fireEvent.changeText(screen.getByLabelText('¿Cuánto vas a gastar?'), '5000'));
  expect(screen.queryByText(/^Si esperas al/)).toBeNull();
});
