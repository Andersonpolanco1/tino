import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { ProveedorPais, usarEleccionDePais, type RegionDispositivo } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import Inicio from '../../app/(tabs)/inicio';
import Ajustes from '../../app/(tabs)/ajustes';
import Tarjetas from '../../app/(tabs)/tarjetas';
import Bienvenida from '../../app/onboarding/index';
import Avisos from '../../app/ajustes/avisos';
import Privacidad from '../../app/ajustes/privacidad';
import type { Tarjeta } from '@/tipos/tipos';
import { hoyLocal } from '@/utilidades/fecha';
import { proximoPago } from '@/inicio/vista';
import paisDO from '@/paises/do.json';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useRouter: () => mockRouter, useFocusEffect: (efecto: () => void) => require('react').useEffect(efecto, []) }));
// Ajustes importa la base para "Borrar todo"; en estas pruebas no se abre.
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(), deleteDatabaseAsync: jest.fn(), defaultDatabaseDirectory: '' }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
// Las direcciones de los documentos salen de variables de entorno; aquí, unas de prueba (D88).
jest.mock('@/privacidad/terminos', () => ({
  ...jest.requireActual('@/privacidad/terminos'),
  DOCUMENTOS: { terminos: 'https://prueba.do/terminos', privacidad: 'https://prueba.do/privacidad', soporte: 'https://prueba.do/soporte' },
}));

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

afterEach(() => usarEleccionDePais(null));

test('inicio muestra su título como encabezado', async () => {
  await render(conPais([rd], await almacenCon('DO'), <Inicio />));
  expect(screen.getByRole('header')).toHaveTextContent('Hoy te conviene usar');
});

test('con un teléfono de RD solo hay un país que ofrecer, así que Ajustes no muestra la fila País', async () => {
  usarEleccionDePais(true);
  await render(conPais([rd], await almacenCon('DO'), <Ajustes />));
  expect(screen.queryByText('País')).toBeNull();
});

test('ajustes muestra un país sin catálogo con la moneda del teléfono', async () => {
  usarEleccionDePais(true);
  await render(conPais([mx], await almacenCon('MX'), <Ajustes />));
  expect(screen.getByText('Otro país (MX) · MXN')).toBeOnTheScreen();
});

test('un teléfono con región de EE. UU. puede elegir República Dominicana y queda guardado (criterio 18.6)', async () => {
  usarEleccionDePais(true);
  const almacen = await almacenCon('US');
  await render(conPais([us], almacen, <Ajustes />));
  expect(screen.getByText(/· Dólares$/)).toBeOnTheScreen();

  await fireEvent.press(screen.getByText('País'));
  await fireEvent.press(screen.getByText('República Dominicana'));
  await act(async () => {});

  expect(almacen.getState().preferencias).toMatchObject({ pais: 'DO', idioma: 'es-DO' });
  expect(screen.getByText('República Dominicana · Pesos y dólares')).toBeOnTheScreen();
});

test('Apariencia: sin elegir es Claro (D98), y elegir Oscuro lo guarda en las preferencias (D51)', async () => {
  const almacen = await almacenCon('DO');
  await render(conPais([rd], almacen, <Ajustes />));
  expect(screen.getByText('Claro')).toBeOnTheScreen();
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
  // Según el día en que corra, el estado anterior puede estar vencido (decisión D99).
  expect(screen.getByText(/^(Vence hoy|Vence mañana|Vence el .* · en \d+ días|¿Pagaste el balance al corte\? Vencía el )/)).toBeOnTheScreen();
  expect(screen.getByText(/^Pagado · vence el /)).toBeOnTheScreen();
  expect(screen.queryByText('Próximos pagos')).toBeNull();
});

describe('Ajustes: lo que falta para subir la precisión va dentro de su bloque y lleva a completarlo (decisión D82)', () => {
  const tarjeta: Tarjeta = {
    id: 'A',
    alias: 'Visa A',
    emisorId: null,
    emisorTextoLibre: 'Banco A',
    productoId: 'visa-a',
    productoDesconocido: false,
    diaCorte: 5,
    fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: 'solo_principal',
    recompensa: { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 1, valorPuntoConfirmado: false },
    enPausa: false,
    creadaEn: '2026-09-01',
  };
  const confirmada = { ...tarjeta, recompensa: { tipo: 'cashback' as const, porcentaje: 1 } };
  const nomina = { id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos' as const, dias: [15, 30] as [number, number] }, ajusteDiaNoHabil: 'adelantar' as const };

  beforeEach(() => mockRouter.push.mockClear());

  test('valor del punto: una fila por tarjeta que abre su detalle', async () => {
    const almacen = await almacenCon('DO');
    await almacen.getState().guardarTarjeta(tarjeta);
    await render(conPais([rd], almacen, <Ajustes />));
    expect(screen.getByText('Confirma el valor del punto de esta tarjeta para subirla.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Confirmar el valor del punto'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/tarjeta/[id]', params: { id: 'A' } });
  });

  test('cobros: una fila que abre el registro de un cobro', async () => {
    const almacen = await almacenCon('DO');
    await almacen.getState().guardarTarjeta(confirmada);
    await render(conPais([rd], almacen, <Ajustes />));
    await fireEvent.press(screen.getByText('Agregar tus días de cobro'));
    expect(mockRouter.push).toHaveBeenCalledWith('/cobros/nuevo');
  });

  test('tipo de tarjeta: una fila por tarjeta sin tipo que abre ese paso de la edición', async () => {
    const almacen = await almacenCon('DO');
    await almacen.getState().guardarTarjeta({ ...confirmada, productoId: null, productoDesconocido: true });
    await almacen.getState().guardarIngreso(nomina);
    await render(conPais([rd], almacen, <Ajustes />));
    await fireEvent.press(screen.getByText('Elegir el tipo de tarjeta'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/tarjeta/editar/[id]', params: { id: 'A', seccion: 'tarjeta' } });
  });

  test('con todo completo no hay filas', async () => {
    const almacen = await almacenCon('DO');
    await almacen.getState().guardarTarjeta(confirmada);
    await almacen.getState().guardarIngreso(nomina);
    await render(conPais([rd], almacen, <Ajustes />));
    expect(screen.getByText('Tienes todo lo que Tino necesita para recomendarte bien.')).toBeOnTheScreen();
    expect(screen.queryByText('Confirmar el valor del punto')).toBeNull();
    expect(screen.queryByText('Agregar tus días de cobro')).toBeNull();
    expect(screen.queryByText('Elegir el tipo de tarjeta')).toBeNull();
  });
});

describe('Ajustes: avisos, privacidad y tus datos en pantallas aparte (decisión D83)', () => {
  beforeEach(() => mockRouter.push.mockClear());

  test('cada sección es una fila con su resumen que abre su pantalla', async () => {
    const almacen = await almacenCon('DO');
    await render(conPais([rd], almacen, <Ajustes />));
    await act(async () => {});
    expect(screen.queryByText('Fecha límite próxima')).toBeNull();
    expect(screen.queryByText('Borrar todo')).toBeNull();
    expect(screen.queryByText('Restaurar compras')).toBeNull();
    expect(screen.getByText(/^(\d de \d encendidos|Apagados: Tino necesita tu permiso)$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Datos de uso: (se comparten|no se comparten)$/)).toBeOnTheScreen();
    expect(screen.getByText('Respaldo, ver y borrar tus datos')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Avisos'));
    await fireEvent.press(screen.getByText('Privacidad'));
    await fireEvent.press(screen.getByText('Tus datos'));
    expect(mockRouter.push.mock.calls).toEqual([['/ajustes/avisos'], ['/ajustes/privacidad'], ['/ajustes/datos']]);
  });

  test('Avisos: apagar uno lo guarda y el resumen de Ajustes lo cuenta', async () => {
    const almacen = await almacenCon('DO');
    await render(conPais([rd], almacen, <Avisos />));
    await fireEvent.press(screen.getByLabelText('Resumen del mes'));
    await act(async () => {});
    expect(almacen.getState().preferencias?.avisos?.resumenMensual).toBe(false);
    await render(conPais([rd], almacen, <Ajustes />));
    await act(async () => {});
    expect(screen.getByText(/^(5 de 6 encendidos|Apagados: Tino necesita tu permiso)$/)).toBeOnTheScreen();
  });

  test('Privacidad: el interruptor de datos de uso anónimos lo guarda como decisión (D88)', async () => {
    const almacen = await almacenCon('DO');
    await render(conPais([rd], almacen, <Privacidad />));
    expect(screen.getByText('Son datos anónimos sobre cómo usas la app. Nunca incluyen datos sensibles, como montos, ni nada que te identifique.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Compartir datos de uso'));
    await act(async () => {});
    expect(almacen.getState().preferencias?.analiticaActiva).toBe(true);
    expect(almacen.getState().preferencias?.analiticaDecidida).toBeTruthy();
  });

  test('Ajustes enlaza la ayuda, y Privacidad la política y los términos (D92)', async () => {
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(conPais([rd], await almacenCon('DO'), <Ajustes />));
    expect(screen.queryByText('Política de privacidad')).toBeNull();
    await fireEvent.press(screen.getByText('Ayuda y soporte'));
    screen.unmount();
    await render(conPais([rd], await almacenCon('DO'), <Privacidad />));
    await fireEvent.press(screen.getByText('Política de privacidad'));
    await fireEvent.press(screen.getByText('Términos de uso'));
    expect(abrir.mock.calls.map(c => c[0])).toEqual(['https://prueba.do/soporte', 'https://prueba.do/privacidad', 'https://prueba.do/terminos']);
    abrir.mockRestore();
  });
});

describe('aceptación de los términos (D88)', () => {
  test('la bienvenida la explica y "Empezar" la guarda', async () => {
    const almacen = await almacenCon('DO');
    await render(conPais([rd], almacen, <Bienvenida />));
    await act(async () => {});
    expect(screen.getByText('Al continuar, aceptas los Términos de uso y la Política de privacidad.')).toBeOnTheScreen();
    expect(almacen.getState().preferencias?.terminosAceptados).toBeUndefined();
    await act(async () => fireEvent.press(screen.getByText('Empezar')));
    expect(almacen.getState().preferencias?.terminosAceptados?.version).toBe('2026-09-29');
    expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/tarjetas');
  });
});

describe('un solo país mientras "elegirPais" está apagado (decisión D84)', () => {
  test('Ajustes no muestra la fila País aunque el teléfono sea de otra región', async () => {
    await render(conPais([us], await almacenCon('DO'), <Ajustes />));
    expect(screen.queryByText('País')).toBeNull();
  });

  test('la bienvenida no pregunta dónde vives', async () => {
    await render(conPais([us], await almacenCon('DO'), <Bienvenida />));
    await act(async () => {});
    expect(screen.getByText('Te decimos qué tarjeta usar hoy')).toBeOnTheScreen();
    expect(screen.queryByText('¿Dónde vives?')).toBeNull();
  });
});
