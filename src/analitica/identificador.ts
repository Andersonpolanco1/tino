import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const NOMBRE = 'tino.identificadorAnalitica';

// Solo en este teléfono: una reinstalación o un teléfono nuevo es otra instalación.
const opciones: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

// Identificador anónimo y aleatorio por instalación (sección 10 técnica), sin vínculo con la persona.
export async function leerIdentificador(): Promise<string> {
  const existente = await SecureStore.getItemAsync(NOMBRE, opciones);
  return existente ?? nuevoIdentificador();
}

// Con "Borrar todo": los eventos siguientes no se pueden unir con los anteriores.
export async function nuevoIdentificador(): Promise<string> {
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(NOMBRE, id, opciones);
  return id;
}
