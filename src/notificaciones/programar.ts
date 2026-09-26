import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { leer } from '../motor/fechas';
import { HORA_AVISO, type Aviso } from './planificar';

// El puente con el sistema: pedir permiso y reemplazar los avisos programados. En el MVP todo
// es local; no hay notificaciones desde servidor (sección 7.2 técnica).

const CANAL = 'avisos';

// Si llega con la app abierta, también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export type EstadoPermiso = 'concedido' | 'negado' | 'sin_preguntar';

export async function estadoPermiso(): Promise<EstadoPermiso> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'concedido';
  return status === 'denied' && !canAskAgain ? 'negado' : 'sin_preguntar';
}

export async function pedirPermiso(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function prepararCanal(nombre: string) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, { name: nombre, importance: Notifications.AndroidImportance.DEFAULT });
}

// Borra lo programado y vuelve a programar: así un cambio de datos nunca deja avisos viejos.
// Los que ya pasaron de hora se saltan.
export async function programarAvisos(avisos: Aviso[], nombreCanal: string, ahora: Date = new Date()): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if ((await estadoPermiso()) !== 'concedido') return 0;
  await prepararCanal(nombreCanal);
  let programados = 0;
  for (const aviso of avisos) {
    const { anio, mes, dia } = leer(aviso.fecha);
    const cuando = new Date(anio, mes - 1, dia, HORA_AVISO, 0, 0);
    if (cuando <= ahora) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: aviso.id,
      content: { title: aviso.titulo, body: aviso.cuerpo },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: cuando, channelId: CANAL },
    });
    programados++;
  }
  return programados;
}
