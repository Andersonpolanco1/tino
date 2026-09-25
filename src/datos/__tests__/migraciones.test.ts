import { DatabaseSync } from 'node:sqlite';
import type { ConexionSql } from '../conexion';
import { ErrorVersionEsquema, migrar, migraciones, VERSION_ESQUEMA, type Migracion } from '../migraciones';

// SQLite de Node con la misma forma que expo-sqlite.
function conexionDePrueba(): ConexionSql & { sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(':memory:');
  const conexion = {
    sqlite,
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },
    async getFirstAsync<T>(sql: string) {
      return (sqlite.prepare(sql).get() as T | undefined) ?? null;
    },
    async withExclusiveTransactionAsync(tarea: (tx: ConexionSql) => Promise<void>) {
      sqlite.exec('BEGIN EXCLUSIVE');
      try {
        await tarea(conexion);
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return conexion;
}

const version = (db: ReturnType<typeof conexionDePrueba>) =>
  (db.sqlite.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;

const tablas = (db: ReturnType<typeof conexionDePrueba>) =>
  (db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]).map(
    t => t.name,
  );

test('una base nueva queda en la última versión con todas las tablas', async () => {
  const db = conexionDePrueba();
  expect(await migrar(db)).toEqual({ anterior: 0, actual: VERSION_ESQUEMA });
  expect(version(db)).toBe(VERSION_ESQUEMA);
  expect(tablas(db)).toEqual(['cache_publica', 'fuentes_ingreso', 'preferencias', 'tarjetas']);
});

test('migrar otra vez no cambia nada ni pierde datos', async () => {
  const db = conexionDePrueba();
  await migrar(db);
  db.sqlite.exec(`INSERT INTO tarjetas VALUES ('t1', '{"alias":"Visa"}', '2026-09-25')`);
  expect(await migrar(db)).toEqual({ anterior: VERSION_ESQUEMA, actual: VERSION_ESQUEMA });
  expect(db.sqlite.prepare('SELECT datos FROM tarjetas').all()).toEqual([{ datos: '{"alias":"Visa"}' }]);
});

test('solo aplica las migraciones pendientes y conserva los datos', async () => {
  const db = conexionDePrueba();
  await migrar(db);
  db.sqlite.exec(`INSERT INTO tarjetas VALUES ('t1', '{}', '2026-09-25')`);
  const aplicar = jest.fn((tx: ConexionSql) => tx.execAsync('ALTER TABLE tarjetas ADD COLUMN orden INTEGER'));
  const siguiente: Migracion = { version: VERSION_ESQUEMA + 1, descripcion: 'prueba', aplicar };

  await migrar(db, [...migraciones, siguiente]);

  expect(aplicar).toHaveBeenCalledTimes(1);
  expect(version(db)).toBe(VERSION_ESQUEMA + 1);
  expect(db.sqlite.prepare('SELECT id, orden FROM tarjetas').all()).toEqual([{ id: 't1', orden: null }]);
});

test('si una migración falla, la base queda en la versión anterior', async () => {
  const db = conexionDePrueba();
  await migrar(db);
  const rota: Migracion = {
    version: VERSION_ESQUEMA + 1,
    descripcion: 'rota',
    aplicar: async tx => {
      await tx.execAsync('CREATE TABLE temporal (id TEXT)');
      await tx.execAsync('ESTO NO ES SQL');
    },
  };

  await expect(migrar(db, [...migraciones, rota])).rejects.toThrow();
  expect(version(db)).toBe(VERSION_ESQUEMA);
  expect(tablas(db)).not.toContain('temporal');
});

test('no toca una base de una versión más nueva que la app', async () => {
  const db = conexionDePrueba();
  db.sqlite.exec(`PRAGMA user_version = ${VERSION_ESQUEMA + 5}`);
  await expect(migrar(db)).rejects.toThrow(ErrorVersionEsquema);
});

test('rechaza migraciones fuera de orden', async () => {
  const db = conexionDePrueba();
  const saltada: Migracion = { version: 3, descripcion: 'saltada', aplicar: async () => {} };
  await expect(migrar(db, [migraciones[0], saltada])).rejects.toThrow(ErrorVersionEsquema);
});

test('el esquema no tiene columnas para datos prohibidos', async () => {
  const db = conexionDePrueba();
  await migrar(db);
  const esquema = (db.sqlite.prepare('SELECT sql FROM sqlite_master').all() as { sql: string }[])
    .map(f => f.sql)
    .join('\n')
    .toLowerCase();
  for (const prohibido of ['numero', 'cvv', 'vencimiento', 'contrasena', 'password']) {
    expect(esquema).not.toContain(prohibido);
  }
});
