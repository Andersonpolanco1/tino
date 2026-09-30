import { defaultDatabaseDirectory, deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { File } from 'expo-file-system';
import { borrarClaveBase, claveBase, FORMATO_CLAVE } from './clave';
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

// Apertura en curso: las llamadas simultáneas comparten una sola. En desarrollo React monta dos
// veces el proveedor; sin esto, sin clave todavía (instalación nueva o tras "Borrar todo"), cada
// apertura creaba su propia clave, la segunda pisaba a la primera y la base quedaba ilegible
// ("file is not a database"), además de dejar una conexión abierta sin dueño.
let enCurso: Promise<BaseLocal> | null = null;

// Abre la base local cifrada con SQLCipher y la deja en la última versión del esquema.
// Nunca abre ni crea una base sin cifrar.
export function abrirBase(): Promise<BaseLocal> {
  if (!enCurso) enCurso = abrirSinCompartir().finally(() => (enCurso = null));
  return enCurso;
}

async function abrirSinCompartir(): Promise<BaseLocal> {
  const { clave, nueva } = await claveBase();
  if (!FORMATO_CLAVE.test(clave)) throw new ErrorBaseCifrada('Clave con formato inválido');
  // Decisión D81: el respaldo del teléfono (iCloud) puede traer la base a un teléfono nuevo, pero
  // no su clave, que vive solo en el teléfono donde se creó. Con una clave recién creada esa base
  // no se puede leer nunca: se descarta y se empieza con una limpia (sus datos vuelven con el
  // respaldo automático o el manual). Si la clave ya existía, un fallo no borra nada.
  const heredada = nueva && existeBase();
  try {
    return await abrirCon(clave);
  } catch (error) {
    if (!heredada || error instanceof ErrorBaseCifrada) throw error;
    await eliminarArchivosBase();
    return abrirCon(clave);
  }
}

function existeBase(): boolean {
  try {
    return new File(defaultDatabaseDirectory, NOMBRE_BASE).exists;
  } catch {
    return false;
  }
}

async function eliminarArchivosBase(): Promise<void> {
  await deleteDatabaseAsync(NOMBRE_BASE);
  for (const sufijo of ['-wal', '-shm']) {
    const archivo = new File(defaultDatabaseDirectory, `${NOMBRE_BASE}${sufijo}`);
    if (archivo.exists) archivo.delete();
  }
}

async function abrirCon(clave: string): Promise<BaseLocal> {
  // Conexión nueva siempre: la que expo-sqlite guarda para las recargas en desarrollo puede
  // quedar cerrada del lado nativo y fallar con NullPointerException.
  const db = await openDatabaseAsync(NOMBRE_BASE, { useNewConnection: true });
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

// Espera como máximo `ms` a que termine la promesa; si no, sigue sin ella.
async function conLimite(promesa: Promise<unknown>, ms: number): Promise<void> {
  let espera: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([promesa.catch(() => {}), new Promise<void>(listo => (espera = setTimeout(listo, ms)))]);
  clearTimeout(espera);
}

const ESPERA_CIERRE_MS = 2000;

// "Borrar todo": cierra la base, borra sus archivos (con los del registro WAL) y la clave de
// cifrado. La próxima apertura crea una base y una clave nuevas. Sin `wal_checkpoint(TRUNCATE)`:
// esperaba a que no quedara ninguna lectura abierta y dejaba "Borrar todo" colgado; los archivos
// del registro se borran igual. Cerrar tampoco espera más de 2 segundos: sin la clave, lo que
// quede no se puede leer.
export async function borrarBase(base: BaseLocal): Promise<void> {
  await conLimite(base.db.closeAsync(), ESPERA_CIERRE_MS);
  for (const sufijo of ['', '-wal', '-shm']) {
    try {
      const archivo = new File(defaultDatabaseDirectory, `${NOMBRE_BASE}${sufijo}`);
      if (archivo.exists) archivo.delete();
    } catch {
      // Sigue con los demás: la clave borrada deja ilegible lo que quede.
    }
  }
  await borrarClaveBase();
}
