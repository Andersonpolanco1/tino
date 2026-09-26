import * as Notifications from 'expo-notifications';
import { programarAvisos } from '../programar';
import type { Aviso } from '../planificar';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const mockNotif = Notifications as jest.Mocked<typeof Notifications>;
const aviso = (id: string, fecha: string): Aviso => ({ id, tipo: 'fechaLimite', fecha, titulo: 't', cuerpo: 'c' });

beforeEach(() => jest.clearAllMocks());

test('borra lo anterior y programa a las 9 de la mañana solo lo que no ha pasado', async () => {
  mockNotif.getPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true } as never);
  const ahora = new Date(2026, 9, 7, 10, 0); // 7 de octubre, 10:00
  const n = await programarAvisos([aviso('a', '2026-10-07'), aviso('b', '2026-10-08')], 'Avisos', ahora);
  expect(mockNotif.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(n).toBe(1);
  expect(mockNotif.scheduleNotificationAsync).toHaveBeenCalledWith({
    identifier: 'b',
    content: { title: 't', body: 'c' },
    trigger: { type: 'date', date: new Date(2026, 9, 8, 9, 0, 0), channelId: 'avisos' },
  });
});

test('sin permiso no programa nada, pero sí borra lo viejo', async () => {
  mockNotif.getPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false } as never);
  expect(await programarAvisos([aviso('b', '2026-10-08')], 'Avisos', new Date(2026, 9, 7))).toBe(0);
  expect(mockNotif.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(mockNotif.scheduleNotificationAsync).not.toHaveBeenCalled();
});
