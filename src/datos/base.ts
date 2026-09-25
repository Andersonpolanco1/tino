import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { FORMATO_CLAVE, obtenerClaveBase } from './clave';
import { migrar } from './migraciones';

export const NOMBRE_BASE = 'tino.db';

export class ErrorBaseCifrada extends Error {}

// Abre la base local cifrada con SQLCipher y la deja en la última versión del esquema.
// Nunca abre ni crea una base sin cifrar.
export async function abrirBase(): Promise<SQLiteDatabase> {
  const clave = await obtenerClaveBase();
  if (!FORMATO_CLAVE.test(clave)) throw new ErrorBaseCifrada('Clave con formato inválido');

  const db = await openDatabaseAsync(NOMBRE_BASE);
  try {
    // La clave debe ser lo primero que se ejecuta sobre la conexión. Se usa en
    // formato crudo (x'…') para no pagar la derivación de clave al abrir.
    await db.execAsync(`PRAGMA key = "x'${clave}'"`);
    const cifrado = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cifrado?.cipher_version) throw new ErrorBaseCifrada('SQLCipher no está activo en esta compilación');
    // Primera lectura real: falla si la clave no corresponde a la base.
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await migrar(db);
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}
