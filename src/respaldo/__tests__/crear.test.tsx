import type { ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import { ProveedorPais } from '@/paises';
import { compartirRespaldo, guardarRespaldoEnCarpeta } from '@/respaldo/archivo';
import CrearRespaldo from '../../../app/respaldo/crear';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useRouter: () => mockRouter }));
jest.mock('@/respaldo/archivo', () => ({ compartirRespaldo: jest.fn(), guardarRespaldoEnCarpeta: jest.fn() }));
jest.mock('@/respaldo/cifrado', () => ({ ...jest.requireActual('@/respaldo/cifrado'), cifrarRespaldo: jest.fn(async () => 'cifrado') }));

async function almacenDePrueba() {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db), sugerencias: repositorioSugerencias(db) });
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

async function escribirContrasena() {
  await fireEvent.changeText(screen.getByLabelText('Contraseña del respaldo'), 'una frase larga');
  await fireEvent.changeText(screen.getByLabelText('Repite la contraseña'), 'una frase larga');
}

describe('crear respaldo en Android (D93)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  test('"Guardar en el teléfono" lo guarda en la carpeta elegida y recuerda la fecha', async () => {
    jest.mocked(guardarRespaldoEnCarpeta).mockResolvedValue(true);
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const almacen = await almacenDePrueba();
    await render(envolver(almacen, <CrearRespaldo />));
    await escribirContrasena();
    await act(async () => fireEvent.press(screen.getByText('Guardar en el teléfono')));
    expect(guardarRespaldoEnCarpeta).toHaveBeenCalledWith('cifrado', expect.any(String));
    expect(alerta).toHaveBeenCalledWith('Respaldo guardado', 'Quedó en la carpeta que elegiste.');
    expect(almacen.getState().preferencias?.ultimoRespaldoManual).toBeTruthy();
    alerta.mockRestore();
  });

  test('si cancela la carpeta, no cuenta como respaldo y sigue en la pantalla', async () => {
    jest.mocked(guardarRespaldoEnCarpeta).mockResolvedValue(false);
    const almacen = await almacenDePrueba();
    await render(envolver(almacen, <CrearRespaldo />));
    await escribirContrasena();
    await act(async () => fireEvent.press(screen.getByText('Guardar en el teléfono')));
    expect(almacen.getState().preferencias?.ultimoRespaldoManual).toBeUndefined();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  test('"Enviar a otra app" abre la hoja de compartir', async () => {
    const almacen = await almacenDePrueba();
    await render(envolver(almacen, <CrearRespaldo />));
    await escribirContrasena();
    await act(async () => fireEvent.press(screen.getByText('Enviar a otra app')));
    expect(compartirRespaldo).toHaveBeenCalled();
    expect(guardarRespaldoEnCarpeta).not.toHaveBeenCalled();
  });
});
