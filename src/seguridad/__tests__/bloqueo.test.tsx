import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, Text, type AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { debeBloquear } from '../bloqueo';
import { ProveedorBloqueo } from '../ProveedorBloqueo';
import { iniciarI18n } from '../../i18n/i18n';

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const auth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

describe('debeBloquear', () => {
  test('al abrir la app siempre bloquea', () => {
    expect(debeBloquear(null, 1000)).toBe(true);
  });

  test('bloquea al volver después de 1 minuto o más en segundo plano', () => {
    expect(debeBloquear(0, 59_999)).toBe(false);
    expect(debeBloquear(0, 60_000)).toBe(true);
  });
});

describe('ProveedorBloqueo', () => {
  let escuchar: (estado: AppStateStatus) => void = () => {};
  let reloj = 0;

  beforeAll(() => iniciarI18n('es-DO'));
  beforeEach(() => {
    jest.clearAllMocks();
    reloj = 0;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_evento, fn) => {
      escuchar = fn as (estado: AppStateStatus) => void;
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    auth.getEnrolledLevelAsync.mockResolvedValue(LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG);
  });

  async function montar() {
    await render(
      <ProveedorBloqueo ahora={() => reloj}>
        <Text>Contenido</Text>
      </ProveedorBloqueo>,
    );
    await act(async () => {});
  }

  test('al abrir pide autenticarse y se libera si tiene éxito', async () => {
    auth.authenticateAsync.mockResolvedValue({ success: true });
    await montar();
    expect(auth.authenticateAsync).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('cubierta-privacidad')).toBeNull();
  });

  test('si se cancela, sigue bloqueada y se puede reintentar', async () => {
    auth.authenticateAsync.mockResolvedValueOnce({ success: false, error: 'user_cancel' }).mockResolvedValueOnce({ success: true });
    await montar();
    expect(screen.getByText('Tino está bloqueado')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Desbloquear'));
    await act(async () => {});
    expect(screen.queryByTestId('cubierta-privacidad')).toBeNull();
  });

  test('sin bloqueo configurado en el teléfono no se puede exigir', async () => {
    auth.getEnrolledLevelAsync.mockResolvedValue(LocalAuthentication.SecurityLevel.NONE);
    await montar();
    expect(auth.authenticateAsync).not.toHaveBeenCalled();
    expect(screen.queryByTestId('cubierta-privacidad')).toBeNull();
  });

  test('en segundo plano cubre la pantalla; al volver antes de 1 minuto no pide nada', async () => {
    auth.authenticateAsync.mockResolvedValue({ success: true });
    await montar();
    await act(async () => escuchar('background'));
    expect(screen.getByTestId('cubierta-privacidad')).toBeOnTheScreen();
    expect(screen.queryByText('Tino está bloqueado')).toBeNull();

    reloj = 30_000;
    await act(async () => escuchar('active'));
    expect(screen.queryByTestId('cubierta-privacidad')).toBeNull();
    expect(auth.authenticateAsync).toHaveBeenCalledTimes(1);
  });

  test('al volver después de 1 minuto vuelve a bloquear', async () => {
    auth.authenticateAsync.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: false, error: 'user_cancel' });
    await montar();
    await act(async () => escuchar('background'));
    reloj = 61_000;
    await act(async () => escuchar('active'));
    await act(async () => {});
    expect(auth.authenticateAsync).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Tino está bloqueado')).toBeOnTheScreen();
  });
});
