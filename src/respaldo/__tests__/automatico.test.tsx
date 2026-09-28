import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Tarjeta } from '@/tipos/tipos';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import { ProveedorPais } from '@/paises';
import { contenidoDe } from '../contenido';
import {
  borrarRespaldoAutomatico,
  guardarRespaldoAutomatico,
  leerRespaldoAutomatico,
  NOMBRE_RESPALDO_AUTOMATICO,
  usarAlmacenamiento,
  type Almacenamiento,
} from '../automatico';
import { ESPERA_RESPALDO_MS, useRespaldoAutomatico } from '../useRespaldoAutomatico';
import Bienvenida from '../../../app/onboarding/index';
import Datos from '../../../app/ajustes/datos';
import { SugerenciaDatos } from '@/sugerencias/SugerenciaDatos';

// Decisión D81: respaldo automático sin contraseña, que viaja con el respaldo del teléfono.
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useRouter: () => mockRouter, useFocusEffect: (efecto: () => void) => require('react').useEffect(efecto, []) }));
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(), deleteDatabaseAsync: jest.fn(), defaultDatabaseDirectory: '' }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
// La bienvenida restaura sobre la base de la prueba.
let mockBase: ReturnType<typeof basePrueba> | null = null;
jest.mock('@/datos', () => ({
  ...jest.requireActual('@/datos'),
  useEstadoDatos: () =>
    mockBase ? { estado: 'lista', base: { db: mockBase, transaccion: (tarea: never) => mockBase!.withExclusiveTransactionAsync(tarea) } } : { estado: 'cargando' },
}));

// Archivos en memoria, con la opción de fallar al escribir (teléfono sin espacio).
function enMemoria() {
  const archivos = new Map<string, string>();
  const a: Almacenamiento & { archivos: Map<string, string>; fallar: boolean } = {
    archivos,
    fallar: false,
    async leer(nombre) {
      return archivos.get(nombre) ?? null;
    },
    async escribir(nombre, texto) {
      if (a.fallar) throw new Error('sin espacio');
      archivos.set(nombre, texto);
    },
    async mover(origen, destino) {
      archivos.set(destino, archivos.get(origen)!);
      archivos.delete(origen);
    },
    async borrar(nombre) {
      archivos.delete(nombre);
    },
  };
  return a;
}

const tarjeta: Tarjeta = {
  id: 't1',
  alias: 'Visa Santa Cruz',
  emisorId: null,
  emisorTextoLibre: 'Banco Santa Cruz',
  productoId: null,
  productoDesconocido: false,
  diaCorte: 19,
  fechaLimite: { tipo: 'dias_despues_corte', dias: 20 },
  ajusteDiaNoHabil: 'adelantar',
  compraEnDiaDeCorte: 'entra_en_siguiente',
  monedaFacturacion: 'solo_principal',
  recompensa: { tipo: 'ninguna' },
  enPausa: false,
  creadaEn: '2026-09-01',
};
const contenido = contenidoDe({ preferencias: preferenciasIniciales('DO', 'es-DO'), tarjetas: [tarjeta], ingresos: [], sugerencias: null }, new Date('2026-09-20T15:40:00Z'));

let memoria: ReturnType<typeof enMemoria>;
beforeEach(() => {
  memoria = enMemoria();
  usarAlmacenamiento(memoria);
  mockBase = null;
  jest.clearAllMocks();
});
afterAll(() => usarAlmacenamiento(null));

describe('la copia', () => {
  test('se guarda y se lee igual, sin dejar el temporal', async () => {
    await guardarRespaldoAutomatico(contenido);
    expect([...memoria.archivos.keys()]).toEqual([NOMBRE_RESPALDO_AUTOMATICO]);
    expect(await leerRespaldoAutomatico()).toEqual(contenido);
  });

  test('una copia dañada, de otra app o de una versión más nueva se ignora sin fallar', async () => {
    for (const texto of ['{no es json', JSON.stringify({ formato: 'otra', version: 1, contenido }), JSON.stringify({ formato: 'tino-respaldo-automatico', version: 99, contenido })]) {
      memoria.archivos.set(NOMBRE_RESPALDO_AUTOMATICO, texto);
      expect(await leerRespaldoAutomatico()).toBeNull();
    }
  });

  test('si el teléfono se apagó antes de mover el temporal, se usa el temporal', async () => {
    await guardarRespaldoAutomatico(contenido);
    const texto = memoria.archivos.get(NOMBRE_RESPALDO_AUTOMATICO)!;
    memoria.archivos.clear();
    memoria.archivos.set(`${NOMBRE_RESPALDO_AUTOMATICO}.tmp`, texto);
    expect(await leerRespaldoAutomatico()).toEqual(contenido);
  });

  test('si no se puede escribir, la copia anterior queda intacta y el error se propaga', async () => {
    await guardarRespaldoAutomatico(contenido);
    memoria.fallar = true;
    await expect(guardarRespaldoAutomatico({ ...contenido, tarjetas: [] })).rejects.toThrow('sin espacio');
    expect(await leerRespaldoAutomatico()).toEqual(contenido);
  });

  test('borrar quita la copia y el temporal', async () => {
    await guardarRespaldoAutomatico(contenido);
    memoria.archivos.set(`${NOMBRE_RESPALDO_AUTOMATICO}.tmp`, 'x');
    await borrarRespaldoAutomatico();
    expect(memoria.archivos.size).toBe(0);
  });
});

async function almacenCon(cambios: Partial<ReturnType<typeof preferenciasIniciales>> = {}, tarjetas: Tarjeta[] = [tarjeta]) {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db), sugerencias: repositorioSugerencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias({ ...preferenciasIniciales('DO', 'es-DO'), ...cambios });
  for (const t of tarjetas) await almacen.getState().guardarTarjeta(t);
  return { almacen, db };
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

describe('mantenerla al día', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const conHook = async (almacen: Almacen) => renderHook(() => useRespaldoAutomatico(), { wrapper: ({ children }) => envolver(almacen, children) });

  test('con Pro y el interruptor encendido, cada cambio reescribe la copia', async () => {
    const { almacen } = await almacenCon({ plan: 'pro', respaldoAutomatico: true });
    await conHook(almacen);
    await act(async () => jest.advanceTimersByTime(ESPERA_RESPALDO_MS));
    expect((await leerRespaldoAutomatico())?.tarjetas).toEqual([tarjeta]);

    await act(async () => almacen.getState().guardarTarjeta({ ...tarjeta, id: 't2', alias: 'Otra' }));
    await act(async () => jest.advanceTimersByTime(ESPERA_RESPALDO_MS));
    expect((await leerRespaldoAutomatico())?.tarjetas).toHaveLength(2);
  });

  test('sin Pro o con el interruptor apagado no se escribe nada', async () => {
    for (const cambios of [{ plan: 'gratis' as const, respaldoAutomatico: true }, { plan: 'pro' as const }]) {
      const { almacen } = await almacenCon(cambios);
      const { unmount } = await conHook(almacen);
      await act(async () => jest.advanceTimersByTime(ESPERA_RESPALDO_MS * 2));
      expect(memoria.archivos.size).toBe(0);
      await unmount();
    }
  });

  test('si Pro vence, la copia deja de actualizarse pero no se borra', async () => {
    const { almacen } = await almacenCon({ plan: 'pro', respaldoAutomatico: true });
    await conHook(almacen);
    await act(async () => jest.advanceTimersByTime(ESPERA_RESPALDO_MS));
    await act(async () => almacen.getState().guardarPreferencias({ ...almacen.getState().preferencias!, plan: 'gratis' }));
    await act(async () => almacen.getState().guardarTarjeta({ ...tarjeta, id: 't2' }));
    await act(async () => jest.advanceTimersByTime(ESPERA_RESPALDO_MS));
    expect((await leerRespaldoAutomatico())?.tarjetas).toEqual([tarjeta]);
  });
});

describe('restaurar en un teléfono nuevo', () => {
  test('la bienvenida ofrece la copia y la restaura', async () => {
    await guardarRespaldoAutomatico(contenido);
    const { almacen, db } = await almacenCon({}, []);
    mockBase = db;
    await render(envolver(almacen, <Bienvenida />));
    expect(await screen.findByText('Encontramos tus datos de tu otro teléfono')).toBeOnTheScreen();
    expect(screen.getByText('Tu respaldo automático tiene 1 tarjeta y se guardó el 20 de septiembre.')).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByText('Restaurar mis datos')));
    expect(almacen.getState().tarjetas).toEqual([tarjeta]);
    expect(mockRouter.replace).toHaveBeenCalledWith('/inicio');
  });

  test('"Empezar de cero" borra la copia y sigue con la bienvenida normal', async () => {
    await guardarRespaldoAutomatico(contenido);
    const { almacen } = await almacenCon({}, []);
    await render(envolver(almacen, <Bienvenida />));
    await act(async () => fireEvent.press(await screen.findByText('Empezar de cero')));
    expect(memoria.archivos.size).toBe(0);
    expect(screen.queryByText('Encontramos tus datos de tu otro teléfono')).toBeNull();
    expect(screen.getByText('Empezar')).toBeOnTheScreen();
  });

  test('sin copia, o sin tarjetas en ella, no ofrece nada', async () => {
    await guardarRespaldoAutomatico({ ...contenido, tarjetas: [] });
    const { almacen } = await almacenCon({}, []);
    await render(envolver(almacen, <Bienvenida />));
    await act(async () => {});
    expect(screen.queryByText('Encontramos tus datos de tu otro teléfono')).toBeNull();
  });
});

describe('Ajustes > Tus datos', () => {
  test('sin Pro, la fila lleva al muro de pago', async () => {
    const { almacen } = await almacenCon();
    await render(envolver(almacen, <Datos />));
    await act(async () => fireEvent.press(screen.getByText('Con Tino Pro, tus datos vuelven solos si cambias de teléfono.')));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/pro', params: { motivo: 'funcion_avanzada' } });
  });

  test('con Pro: encenderlo avisa del respaldo del teléfono; apagarlo pide confirmar y borra la copia', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { almacen } = await almacenCon({ plan: 'pro' });
    await render(envolver(almacen, <Datos />));
    await act(async () => fireEvent.press(screen.getByLabelText('Respaldo automático')));
    expect(almacen.getState().preferencias?.respaldoAutomatico).toBe(true);
    expect(alerta).toHaveBeenCalledWith('Respaldo automático activado', expect.stringMatching(/Copia de seguridad|Respaldo en iCloud/), expect.anything());

    await guardarRespaldoAutomatico(contenido);
    await act(async () => fireEvent.press(screen.getByLabelText('Respaldo automático')));
    const botones = alerta.mock.calls.at(-1)![2]!;
    await act(async () => botones.find(b => b.text === 'Apagar')!.onPress!());
    expect(almacen.getState().preferencias?.respaldoAutomatico).toBeUndefined();
    expect(memoria.archivos.size).toBe(0);
    alerta.mockRestore();
  });

  test('muestra la última copia o, si falló, que se revise el espacio', async () => {
    const { almacen } = await almacenCon({ plan: 'pro', respaldoAutomatico: true });
    await guardarRespaldoAutomatico(contenido);
    await render(envolver(almacen, <Datos />));
    expect(screen.getByText(/^Última copia: 20 de septiembre/)).toBeOnTheScreen();
    memoria.fallar = true;
    await act(async () => guardarRespaldoAutomatico(contenido).catch(() => {}));
    expect(screen.getByText('No se pudo guardar la última copia. Revisa si tu teléfono tiene espacio.')).toBeOnTheScreen();
  });
});

// Decisión D81: pasados 3 meses usando Tino sin un respaldo manual, Inicio lo recuerda.
describe('recordatorio del respaldo manual', () => {
  const cobro = { id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos' as const, dias: [15, 30] as [number, number] }, ajusteDiaNoHabil: 'adelantar' as const };
  const texto = 'Hace más de 3 meses que no guardas un respaldo de Tino. Crea uno y guárdalo donde quieras.';

  test('aparece con tarjetas de hace más de 3 meses y sin respaldo reciente, y lleva a crearlo', async () => {
    const { almacen } = await almacenCon({}, [{ ...tarjeta, creadaEn: '2025-01-01' }]);
    await almacen.getState().guardarIngreso(cobro);
    await render(envolver(almacen, <SugerenciaDatos />));
    expect(screen.getByText(texto)).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByText('Crear respaldo')));
    expect(mockRouter.push).toHaveBeenCalledWith('/respaldo/crear');
  });

  test('no aparece con un respaldo manual reciente ni con tarjetas nuevas', async () => {
    for (const [cambios, creadaEn] of [[{ ultimoRespaldoManual: new Date().toISOString().slice(0, 10) }, '2025-01-01'], [{}, new Date().toISOString().slice(0, 10)]] as const) {
      const { almacen } = await almacenCon(cambios, [{ ...tarjeta, creadaEn }]);
      await almacen.getState().guardarIngreso(cobro);
      const { unmount } = await render(envolver(almacen, <SugerenciaDatos />));
      expect(screen.queryByText(texto)).toBeNull();
      await unmount();
    }
  });
});
