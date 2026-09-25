// Parte de la API de expo-sqlite que usan las migraciones. Permite probarlas
// contra SQLite de Node sin el módulo nativo.
export interface ConexionSql {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
  withExclusiveTransactionAsync(tarea: (tx: ConexionSql) => Promise<void>): Promise<void>;
}

export type ValorSql = string | number | null;

// Parte de la API de expo-sqlite que usan los repositorios.
export interface ConsultasSql {
  getAllAsync<T>(sql: string, params: ValorSql[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: ValorSql[]): Promise<T | null>;
  runAsync(sql: string, params: ValorSql[]): Promise<unknown>;
}
