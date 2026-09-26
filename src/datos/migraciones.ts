import type { ConexionSql } from './conexion';

// Cada cambio de esquema agrega una migración con la versión siguiente y su prueba.
// Una migración nunca borra datos del usuario (sección 4).
export interface Migracion {
  version: number;
  descripcion: string;
  aplicar: (tx: ConexionSql) => Promise<void>;
}

// Cada entidad guarda su objeto de tipos.ts como JSON; las columnas aparte son
// solo las que se consultan o identifican la fila.
export const migraciones: Migracion[] = [
  {
    version: 1,
    descripcion: 'Tablas iniciales: tarjetas, ingresos, preferencias y caché de datos públicos',
    aplicar: tx =>
      tx.execAsync(`
        CREATE TABLE tarjetas (
          id TEXT PRIMARY KEY NOT NULL,
          datos TEXT NOT NULL,
          actualizadaEn TEXT NOT NULL
        );
        CREATE TABLE fuentes_ingreso (
          id TEXT PRIMARY KEY NOT NULL,
          datos TEXT NOT NULL,
          actualizadaEn TEXT NOT NULL
        );
        CREATE TABLE preferencias (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          datos TEXT NOT NULL,
          actualizadaEn TEXT NOT NULL
        );
        CREATE TABLE cache_publica (
          clave TEXT PRIMARY KEY NOT NULL,
          version TEXT NOT NULL,
          datos TEXT NOT NULL,
          descargadoEn TEXT NOT NULL
        );
      `),
  },
  {
    version: 2,
    descripcion: 'Historial de sugerencias de datos (sección 2.2): cuándo se mostraron y cuántas veces se descartaron',
    aplicar: tx =>
      tx.execAsync(`
        CREATE TABLE sugerencias (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          datos TEXT NOT NULL,
          actualizadaEn TEXT NOT NULL
        );
      `),
  },
];

export const VERSION_ESQUEMA = migraciones[migraciones.length - 1].version;

export class ErrorVersionEsquema extends Error {}

function validarLista(lista: Migracion[]) {
  lista.forEach((m, i) => {
    if (m.version !== i + 1) throw new ErrorVersionEsquema(`Las migraciones deben ir en orden desde 1; la posición ${i} tiene la versión ${m.version}`);
  });
}

// La versión del esquema vive en PRAGMA user_version. Cada migración y su cambio
// de versión van en la misma transacción: si falla, la base queda como estaba.
export async function migrar(db: ConexionSql, lista: Migracion[] = migraciones) {
  validarLista(lista);
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const anterior = fila?.user_version ?? 0;
  const ultima = lista.length;
  if (anterior > ultima) {
    throw new ErrorVersionEsquema(`La base tiene la versión ${anterior} y esta app conoce hasta la ${ultima}`);
  }
  for (const m of lista.slice(anterior)) {
    await db.withExclusiveTransactionAsync(async tx => {
      await m.aplicar(tx);
      await tx.execAsync(`PRAGMA user_version = ${m.version}`);
    });
  }
  return { anterior, actual: Math.max(anterior, ultima) };
}
