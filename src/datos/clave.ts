import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const NOMBRE_CLAVE = 'tino.claveBaseLocal';

// Solo en este teléfono: la clave no viaja en respaldos a otro dispositivo.
// Disponible tras el primer desbloqueo para que los avisos en segundo plano puedan leer la base.
const opciones: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const FORMATO_CLAVE = /^[0-9a-f]{64}$/;

// Clave de 256 bits generada al instalar y guardada en Keychain o Keystore (sección 6).
export async function obtenerClaveBase(): Promise<string> {
  const existente = await SecureStore.getItemAsync(NOMBRE_CLAVE, opciones);
  if (existente) {
    if (!FORMATO_CLAVE.test(existente)) throw new Error('La clave guardada de la base local no es válida');
    return existente;
  }
  const bytes = await Crypto.getRandomBytesAsync(32);
  const clave = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(NOMBRE_CLAVE, clave, opciones);
  return clave;
}
