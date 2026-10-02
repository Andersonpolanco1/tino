import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import { ProveedorPais } from '@/paises';
import { elegirRespaldo } from '@/respaldo/archivo';
import { descifrarRespaldo } from '@/respaldo/cifrado';
import RestaurarRespaldo from '../../../app/respaldo/restaurar';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useRouter: () => mockRouter }));
jest.mock('@/respaldo/archivo', () => ({ elegirRespaldo: jest.fn() }));
jest.mock('@/respaldo/cifrado', () => ({ ...jest.requireActual('@/respaldo/cifrado'), descifrarRespaldo: jest.fn() }));

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

test('mientras abre el respaldo no se puede cambiar el archivo ni la contraseña', async () => {
  jest.mocked(elegirRespaldo).mockResolvedValue({ nombre: 'tino-respaldo.tino', texto: 'cifrado' });
  // El descifrado queda pendiente para ver la pantalla a mitad de camino.
  let terminar: (e: Error) => void = () => {};
  jest.mocked(descifrarRespaldo).mockReturnValue(new Promise((_, rechazar) => (terminar = rechazar)));
  await render(envolver(await almacenDePrueba(), <RestaurarRespaldo />));
  await act(async () => fireEvent.press(screen.getByText('Elegir archivo')));
  await fireEvent.changeText(screen.getByLabelText('Contraseña del respaldo'), 'una frase larga');
  // act espera a que la acción termine, así que no se espera: la pantalla queda abriendo.
  const abriendo = fireEvent.press(screen.getByText('Abrir respaldo'));
  await new Promise(setImmediate);

  expect(screen.getByLabelText('Contraseña del respaldo')).toHaveProp('editable', false);
  expect(screen.getByRole('button', { name: /tino-respaldo\.tino/ })).toBeDisabled();

  // Al terminar (aquí, con la contraseña equivocada) se puede corregir otra vez.
  terminar(new Error('contraseña'));
  await abriendo;
  expect(screen.getByLabelText('Contraseña del respaldo')).toHaveProp('editable', true);
});
