import type { ReactNode } from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Recompensa, Tarjeta } from '@/tipos/tipos';
import { ProveedorPais } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioPreferencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import Inicio from '../../app/(tabs)/inicio';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
// Hoy fijo: el ejemplo 7.4 de la especificación.
jest.mock('@/utilidades/fecha', () => ({ hoyLocal: () => '2026-10-06' }));

function tarjeta(id: string, diaCorte: number, dia: number, recompensa: Recompensa): Tarjeta {
  return {
    id,
    alias: `Tarjeta ${id}`,
    emisorId: null,
    emisorTextoLibre: `Banco ${id}`,
    productoId: null,
    productoDesconocido: false,
    diaCorte,
    fechaLimite: { tipo: 'dia_del_mes', dia },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: 'solo_principal',
    recompensa,
    enPausa: false,
    creadaEn: '2026-09-01',
  };
}

const A = tarjeta('A', 5, 25, { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 0.5, valorPuntoConfirmado: true });
const B = tarjeta('B', 20, 10, { tipo: 'puntos', regla: { tipo: 'por_porcentaje', porcentaje: 2 }, valorPunto: 1, valorPuntoConfirmado: true });
const C = tarjeta('C', 1, 21, { tipo: 'cashback', porcentaje: 1 });

async function almacenCon(tarjetas: Tarjeta[]) {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), preferencias: repositorioPreferencias(db) });
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

// La tarjeta destacada es el primer botón cuyo nombre accesible dice "días para pagar".
const destacada = () => screen.getAllByRole('button').find(b => /días para pagar/.test(b.props.accessibilityLabel ?? ''))!;

beforeEach(() => jest.clearAllMocks());

test('muestra la fecha, la tarjeta de hoy y las demás en orden de enfoque (ejemplo 7.4)', async () => {
  await render(envolver(await almacenCon([A, B, C]), <Inicio />));
  expect(screen.getByText('Martes 6 de octubre')).toBeOnTheScreen();
  expect(destacada().props.accessibilityLabel).toMatch(/^Tarjeta C\. 46 días para pagar, se paga el 21 de noviembre/);
  expect(screen.getByText('Tus tarjetas')).toBeOnTheScreen();
  expect(screen.getByText('Tarjeta B')).toBeOnTheScreen();
  expect(screen.getByText('Tarjeta A')).toBeOnTheScreen();
  expect(screen.getByText('RD$10 por RD$1,000')).toBeOnTheScreen();
});

test('el control de enfoque guarda el enfoque al instante y recalcula (decisión D30)', async () => {
  const almacen = await almacenCon([A, B, C]);
  await render(envolver(almacen, <Inicio />));
  expect(screen.getByText('Tu mejor opción entre días para pagar y recompensas')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('radio', { name: 'Puntos' }));
  await act(async () => {});
  expect(almacen.getState().preferencias?.enfoque.modo).toBe('puntos');
  expect(destacada().props.accessibilityLabel).toMatch(/^Tarjeta B\./);
  expect(screen.getByText('Tu mejor opción para acumular puntos')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('radio', { name: 'Días' }));
  await act(async () => {});
  expect(almacen.getState().preferencias?.enfoque.modo).toBe('liquidez');
  expect(destacada().props.accessibilityLabel).toMatch(/^Tarjeta C\./);
});

test('el ícono de información explica el enfoque', async () => {
  await render(envolver(await almacenCon([A, B, C]), <Inicio />));
  await fireEvent.press(screen.getByLabelText('Más información sobre Tus tarjetas'));
  expect(screen.getByText(/Tu enfoque decide qué tarjeta te recomendamos/)).toBeOnTheScreen();
});

test('con una sola tarjeta muestra el semáforo y oculta la barra y el selector (criterio 14.1)', async () => {
  await render(envolver(await almacenCon([A]), <Inicio />));
  expect(screen.getByText('¿Es buen momento?')).toBeOnTheScreen();
  expect(screen.getByLabelText('Buen momento')).toBeOnTheScreen();
  expect(screen.queryByRole('radio', { name: 'Puntos' })).toBeNull();
  expect(screen.getByText('¿Tienes otra tarjeta?')).toBeOnTheScreen();
});

test('una tarjeta en pausa no aparece en el ranking (criterio 14.1)', async () => {
  await render(envolver(await almacenCon([A, { ...B, enPausa: true }, C]), <Inicio />));
  expect(screen.queryByText('Tarjeta B')).toBeNull();
});

test('el lector de pantalla oye el semáforo y las etiquetas en palabras (criterio 16.6)', async () => {
  await render(envolver(await almacenCon([A, B, C]), <Inicio />));
  const fila = screen.getAllByRole('button').find(b => /^Tarjeta A\./.test(b.props.accessibilityLabel ?? ''))!;
  expect(fila.props.accessibilityLabel).toMatch(/Buen momento|Momento normal|Espera/);
  expect(fila.props.accessibilityLabel).toMatch(/pts por RD\$1,000/);
});

test('"Tengo una compra" es un botón con texto que abre la consulta', async () => {
  await render(envolver(await almacenCon([A, B, C]), <Inicio />));
  await fireEvent.press(screen.getByRole('button', { name: 'Tengo una compra' }));
  expect(mockRouter.push).toHaveBeenCalledWith('/compra');
});

test('sin tarjetas invita a agregar la primera', async () => {
  await render(envolver(await almacenCon([]), <Inicio />));
  await fireEvent.press(screen.getByText('Agregar tarjeta'));
  expect(mockRouter.push).toHaveBeenCalledWith('/tarjeta/nueva');
});

test('funciona en modo oscuro', async () => {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
  await render(envolver(await almacenCon([A, B, C]), <Inicio />));
  expect(destacada()).toHaveStyle({ backgroundColor: '#2BD49A' });
  jest.restoreAllMocks();
});
