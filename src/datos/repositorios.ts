import type { FuenteIngreso, Preferencias, Tarjeta } from '../tipos/tipos';
import { algunTextoConNumeroDeTarjeta } from '../validacion/tarjeta';
import type { ConsultasSql } from './conexion';

export class ErrorDatoProhibido extends Error {}

// Segunda defensa de la sección 6 técnica: aunque un formulario falle, nada con un
// número de tarjeta completo llega a la base.
function aJson(valor: unknown): string {
  if (algunTextoConNumeroDeTarjeta(valor)) throw new ErrorDatoProhibido('Un campo contiene un número de tarjeta completo');
  return JSON.stringify(valor);
}

const leerJson = <T>(filas: { datos: string }[]) => filas.map(f => JSON.parse(f.datos) as T);

// Tablas con una fila por objeto (tarjetas, fuentes_ingreso), guardado como JSON (decisión D4).
function repositorioPorId<T extends { id: string }>(db: ConsultasSql, tabla: 'tarjetas' | 'fuentes_ingreso') {
  return {
    async listar(): Promise<T[]> {
      return leerJson<T>(await db.getAllAsync<{ datos: string }>(`SELECT datos FROM ${tabla} ORDER BY rowid`, []));
    },
    async guardar(objeto: T, ahora: string): Promise<void> {
      await db.runAsync(
        `INSERT INTO ${tabla} (id, datos, actualizadaEn) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET datos = excluded.datos, actualizadaEn = excluded.actualizadaEn`,
        [objeto.id, aJson(objeto), ahora],
      );
    },
    async borrar(id: string): Promise<void> {
      await db.runAsync(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
    },
  };
}

export function repositorioTarjetas(db: ConsultasSql) {
  return repositorioPorId<Tarjeta>(db, 'tarjetas');
}

export function repositorioIngresos(db: ConsultasSql) {
  return repositorioPorId<FuenteIngreso>(db, 'fuentes_ingreso');
}

export function repositorioPreferencias(db: ConsultasSql) {
  return {
    async leer(): Promise<Preferencias | null> {
      const fila = await db.getFirstAsync<{ datos: string }>('SELECT datos FROM preferencias WHERE id = 1', []);
      return fila ? (JSON.parse(fila.datos) as Preferencias) : null;
    },
    async guardar(preferencias: Preferencias, ahora: string): Promise<void> {
      await db.runAsync(
        `INSERT INTO preferencias (id, datos, actualizadaEn) VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET datos = excluded.datos, actualizadaEn = excluded.actualizadaEn`,
        [aJson(preferencias), ahora],
      );
    },
  };
}

export type RepositorioTarjetas = ReturnType<typeof repositorioTarjetas>;
export type RepositorioIngresos = ReturnType<typeof repositorioIngresos>;
export type RepositorioPreferencias = ReturnType<typeof repositorioPreferencias>;
