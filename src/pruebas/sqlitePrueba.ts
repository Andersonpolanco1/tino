// Solo para pruebas: SQLite de Node no existe en el teléfono.
import { DatabaseSync } from 'node:sqlite';
import type { ConexionSql, ConsultasSql, ValorSql } from '../datos/conexion';

// SQLite de Node con la misma forma que expo-sqlite, para probar migraciones y repositorios.
export function basePrueba(): ConexionSql & ConsultasSql & { sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(':memory:');
  const conexion = {
    sqlite,
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },
    async getFirstAsync<T>(sql: string, params: ValorSql[] = []) {
      return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, params: ValorSql[] = []) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    async runAsync(sql: string, params: ValorSql[] = []) {
      return sqlite.prepare(sql).run(...params);
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
