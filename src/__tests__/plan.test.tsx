import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Tarjeta } from '@/tipos/tipos';
import { ProveedorPais } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import { usarServicioDePrueba, type ResultadoCompra, type ServicioSuscripciones } from '@/suscripciones/servicio';
import NuevaTarjeta from '../../app/tarjeta/nueva';
import ElegirTarjetas from '../../app/plan/elegir';
import Inicio from '../../app/(tabs)/inicio';
import Tarjetas from '../../app/(tabs)/tarjetas';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
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

function servicioFalso(): ServicioSuscripciones & { compras: string[]; resultado: ResultadoCompra } {
  const s = {
    compras: [] as string[],
    ofertas: async () => [
      { id: 'lanzamiento', tipo: 'lanzamiento' as const, precio: 'US$14.99', precioValor: 14.99, precioPorMes: 'US$1.25', prueba: { unidad: 'mes' as const, cantidad: 1 } },
      { id: '$rc_annual', tipo: 'anual' as const, precio: 'US$19.99', precioValor: 19.99, precioPorMes: 'US$1.67', prueba: null },
      { id: '$rc_monthly', tipo: 'mensual' as const, precio: 'US$2.49', precioValor: 2.49, precioPorMes: null, prueba: { unidad: 'mes' as const, cantidad: 1 } },
    ],
    resultado: 'pro' as ResultadoCompra,
    comprar: async (id: string) => {
      if (s.resultado === 'pro') s.compras.push(id);
      return s.resultado;
    },
    restaurar: async () => false,
    estado: async () => ({ pro: s.compras.length > 0, finPrueba: s.compras.length ? '2026-11-06' : null }),
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
    // Lo que se cobra se ve más que la prueba (norma 3.1.2 de Apple), y el ahorro del anual se calcula.
    expect(screen.getByText('US$14.99')).toBeOnTheScreen();
    expect(screen.getByText('1 mes gratis, luego US$14.99 al año')).toBeOnTheScreen();
    expect(screen.getByText('Ahorra 50%')).toBeOnTheScreen();
    expect(screen.getByText('Precio para los primeros usuarios')).toBeOnTheScreen();
    expect(screen.getByText('Ahorra 33%')).toBeOnTheScreen();
    // Cómo funciona la prueba, con el aviso antes del cobro.
    expect(screen.getByText('2 días antes de que termine')).toBeOnTheScreen();
    expect(screen.getByText(/^Se cobra US\$14\.99 al año\. Si cancelas antes en (App Store|Google Play), no pagas nada.$/)).toBeOnTheScreen();

    await act(async () => fireEvent.press(screen.getByText('Empezar prueba gratis')));
    expect(servicio.compras).toEqual(['lanzamiento']);
    expect(almacen.getState().preferencias?.plan).toBe('pro');
    expect(almacen.getState().preferencias?.finPruebaPro).toBe('2026-11-06');
    // Confirmación antes de seguir con el registro.
    expect(screen.getByText('Ya tienes Tino Pro')).toBeOnTheScreen();
    expect(screen.getByText('Tu prueba gratis empezó. Te avisamos 2 días antes de que termine.')).toBeOnTheScreen();
    expect(screen.getByText('Plan Anual de lanzamiento')).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByText('Agregar mi tarjeta')));
    expect(screen.queryByText('Ya tienes Tino Pro')).toBeNull();
    expect(screen.queryByText('Registra todas tus tarjetas')).toBeNull();
  });

  it('sin prueba, el botón dice el precio, no hay línea de tiempo y las condiciones no hablan de prueba', async () => {
    usarServicioDePrueba(servicioFalso());
    const almacen = await almacenCon([A, B]);
    await render(envolver(almacen, <NuevaTarjeta />));
    await act(async () => fireEvent.press(await screen.findByText('Anual')));
    expect(screen.getByRole('radio', { name: /^Anual\. US\$19\.99 al año/ }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByText('Suscribirme por US$19.99 al año')).toBeOnTheScreen();
    expect(screen.queryByText('Cómo funciona la prueba')).toBeNull();
    expect(screen.getByText('equivale a US$1.67 al mes')).toBeOnTheScreen();
    expect(screen.getByText(/^Se cobra en tu cuenta de .* al confirmar/)).toBeOnTheScreen();
  });

  it('un pago pendiente lo explica y no activa Pro', async () => {
    const servicio = servicioFalso();
    servicio.resultado = 'pendiente';
    usarServicioDePrueba(servicio);
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const almacen = await almacenCon([A, B]);
    await render(envolver(almacen, <NuevaTarjeta />));
    await act(async () => fireEvent.press(await screen.findByText('Empezar prueba gratis')));
    expect(alerta).toHaveBeenCalledWith('Tu pago está pendiente', expect.stringMatching(/cuando (App Store|Google Play) confirme el pago/));
    expect(almacen.getState().preferencias?.plan).toBe('gratis');
    alerta.mockRestore();
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

  it('en Tarjetas, la sobrante aparece aparte, en Guardadas, con cómo cambiarla o recuperarla', async () => {
    const almacen = await almacenCon([A, B, C]);
    await render(envolver(almacen, <Tarjetas />));
    expect(screen.getByText('Guardadas')).toBeOnTheScreen();
    expect(screen.getByText(/^Esta tarjeta no entra en tus recomendaciones/)).toBeOnTheScreen();
    expect(screen.getByText('Tarjeta C')).toBeOnTheScreen();
    expect(screen.getByText('Fuera del plan gratis')).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByText('Cambiar mis 2 tarjetas')));
    expect(mockRouter.push).toHaveBeenCalledWith('/plan/elegir');
  });

  it('sin tarjetas guardadas no aparece la sección', async () => {
    const almacen = await almacenCon([A, B]);
    await render(envolver(almacen, <Tarjetas />));
    expect(screen.queryByText('Guardadas')).toBeNull();
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
