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
import { usarServicioDePrueba, type ServicioSuscripciones } from '@/suscripciones/servicio';
import NuevaTarjeta from '../../app/tarjeta/nueva';
import ElegirTarjetas from '../../app/plan/elegir';
import Inicio from '../../app/(tabs)/inicio';
import Tarjetas from '../../app/(tabs)/tarjetas';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (efecto: () => void) => require('react').useEffect(efecto, []),
  Stack: { Screen: () => null },
}));
jest.mock('@/utilidades/fecha', () => ({ hoyLocal: () => '2026-10-06' }));

function tarjeta(id: string, creadaEn: string): Tarjeta {
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
    creadaEn,
  };
}

const A = tarjeta('A', '2026-09-01');
const B = tarjeta('B', '2026-09-02');
const C = tarjeta('C', '2026-09-03');

async function almacenCon(tarjetas: Tarjeta[], plan: 'gratis' | 'pro' = 'gratis') {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db), sugerencias: repositorioSugerencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias({ ...preferenciasIniciales('DO', 'es-DO'), plan });
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

function servicioFalso(): ServicioSuscripciones & { compras: string[] } {
  const s = {
    compras: [] as string[],
    ofertas: async () => [
      { id: 'lanzamiento', tipo: 'lanzamiento' as const, precio: 'US$14.99', precioPorMes: 'US$1.25', prueba: { unidad: 'mes' as const, cantidad: 1 } },
      { id: '$rc_monthly', tipo: 'mensual' as const, precio: 'US$2.49', precioPorMes: null, prueba: { unidad: 'mes' as const, cantidad: 1 } },
    ],
    comprar: async (id: string) => {
      s.compras.push(id);
      return 'pro' as const;
    },
    restaurar: async () => false,
    tienePro: async () => false,
    alCambiar: () => () => {},
    urlGestion: async () => null,
  };
  return s;
}

beforeEach(() => {
  jest.clearAllMocks();
  usarServicioDePrueba(null);
});

describe('3.ª tarjeta en el plan gratis (15.5)', () => {
  it('muestra la oferta de Pro con la prueba gratis en vez del registro', async () => {
    const servicio = servicioFalso();
    usarServicioDePrueba(servicio);
    const almacen = await almacenCon([A, B]);
    await render(envolver(almacen, <NuevaTarjeta />));
    expect(await screen.findByText('Registra todas tus tarjetas')).toBeOnTheScreen();
    expect(screen.getByText(/Tus 2 tarjetas siguen funcionando igual/)).toBeOnTheScreen();
    expect(await screen.findByText('Anual de lanzamiento')).toBeOnTheScreen();
    expect(screen.getAllByText(/1 mes gratis/)).toHaveLength(2);

    await act(async () => fireEvent.press(screen.getByText('Empezar prueba gratis')));
    expect(servicio.compras).toEqual(['lanzamiento']);
    expect(almacen.getState().preferencias?.plan).toBe('pro');
    // Con Pro activo sigue el registro de la tarjeta.
    expect(screen.queryByText('Registra todas tus tarjetas')).toBeNull();
  });

  it('sin plataforma de compras lo dice y no deja comprar', async () => {
    const almacen = await almacenCon([A, B]);
    await render(envolver(almacen, <NuevaTarjeta />));
    expect(await screen.findByText(/Las compras no están disponibles/)).toBeOnTheScreen();
    expect(screen.queryByText('Empezar prueba gratis')).toBeNull();
  });

  it('las 2 tarjetas existentes siguen en el ranking', async () => {
    const almacen = await almacenCon([A, B]);
    await render(envolver(almacen, <Inicio />));
    expect(screen.getAllByText(/Tarjeta A|Tarjeta B/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/Tu Tino Pro terminó/)).toBeNull();
  });
});

describe('al vencer Pro (15.5)', () => {
  it('no borra nada, pide elegir y deja fuera del ranking la tarjeta sobrante', async () => {
    const almacen = await almacenCon([A, B, C]);
    await render(envolver(almacen, <Inicio />));
    expect(screen.getByText(/Tu Tino Pro terminó/)).toBeOnTheScreen();
    expect(screen.queryByText('Tarjeta C')).toBeNull();
    expect(almacen.getState().tarjetas).toHaveLength(3);
  });

  it('en Tarjetas, la sobrante aparece guardada fuera del plan', async () => {
    const almacen = await almacenCon([A, B, C]);
    await render(envolver(almacen, <Tarjetas />));
    expect(screen.getByText('Tarjeta C')).toBeOnTheScreen();
    expect(screen.getByText('Guardada · fuera del plan gratis')).toBeOnTheScreen();
  });

  it('el usuario elige qué 2 tarjetas quedan activas', async () => {
    const almacen = await almacenCon([A, B, C]);
    await render(envolver(almacen, <ElegirTarjetas />));
    expect(screen.getByText('2 de 2 elegidas')).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByText('Tarjeta A')));
    expect(screen.getByText('1 de 2 elegidas')).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByText('Tarjeta C')));
    await act(async () => fireEvent.press(screen.getByText('Usar estas 2')));
    expect(almacen.getState().preferencias?.tarjetasDelPlan).toEqual(['B', 'C']);
    expect(almacen.getState().tarjetas).toHaveLength(3);
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
