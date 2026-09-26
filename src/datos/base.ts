import { defaultDatabaseDirectory, deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { File } from 'expo-file-system';
import { borrarClaveBase, FORMATO_CLAVE, obtenerClaveBase } from './clave';
import type { ConexionSql } from './conexion';
import { migrar } from './migraciones';

export const NOMBRE_BASE = 'tino.db';

export class ErrorBaseCifrada extends Error {}

export interface BaseLocal {
  db: SQLiteDatabase;
  // Toda transacción exclusiva debe pasar por aquí: expo-sqlite la corre en una
  // conexión nueva, y esa conexión necesita la clave antes de leer la base.
  transaccion: (tarea: (tx: SQLiteDatabase) => Promise<void>) => Promise<void>;
}

// Formato crudo (x'…'): evita pagar la derivación de clave al abrir.
const sentenciaClave = (clave: string) => `PRAGMA key = "x'${clave}'"`;

// Abre la base local cifrada con SQLCipher y la deja en la última versión del esquema.
// Nunca abre ni crea una base sin cifrar.
export async function abrirBase(): Promise<BaseLocal> {
  const clave = await obtenerClaveBase();
  if (!FORMATO_CLAVE.test(clave)) throw new ErrorBaseCifrada('Clave con formato inválido');

  const db = await openDatabaseAsync(NOMBRE_BASE);
  try {
    // La clave debe ser lo primero que se ejecuta sobre la conexión.
    await db.execAsync(sentenciaClave(clave));
    const cifrado = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cifrado?.cipher_version) throw new ErrorBaseCifrada('SQLCipher no está activo en esta compilación');
    // Primera lectura real: falla si la clave no corresponde a la base.
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

    // BEGIN no lee el archivo, así que la clave todavía se puede aplicar dentro de la transacción.
    const transaccion: BaseLocal['transaccion'] = tarea =>
      db.withExclusiveTransactionAsync(async tx => {
        await tx.execAsync(sentenciaClave(clave));
        await tarea(tx);
      });

    const conexion: ConexionSql = {
      execAsync: sql => db.execAsync(sql),
      getFirstAsync: sql => db.getFirstAsync(sql),
      withExclusiveTransactionAsync: transaccion,
    };
    await migrar(conexion);
    return { db, transaccion };
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

// "Borrar todo": cierra la base, la borra junto con sus archivos del registro WAL y borra la
// clave de cifrado. La próxima apertura crea una base y una clave nuevas.
export async function borrarBase(base: BaseLocal): Promise<void> {
  await base.db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)').catch(() => {});
  await base.db.closeAsync();
  await deleteDatabaseAsync(NOMBRE_BASE);
  for (const sufijo of ['-wal', '-shm']) {
    const archivo = new File(defaultDatabaseDirectory, `${NOMBRE_BASE}${sufijo}`);
    if (archivo.exists) archivo.delete();
  }
  await borrarClaveBase();
}
