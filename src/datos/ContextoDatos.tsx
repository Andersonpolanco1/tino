import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { abrirBase } from './base';

export type EstadoDatos =
  | { estado: 'cargando' }
  | { estado: 'lista'; db: SQLiteDatabase }
  | { estado: 'error'; error: unknown };

const ContextoDatos = createContext<EstadoDatos>({ estado: 'cargando' });

export function ProveedorDatos({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoDatos>({ estado: 'cargando' });

  useEffect(() => {
    let activo = true;
    abrirBase().then(
      db => activo && setEstado({ estado: 'lista', db }),
      error => activo && setEstado({ estado: 'error', error }),
    );
    return () => {
      activo = false;
    };
  }, []);

  return <ContextoDatos.Provider value={estado}>{children}</ContextoDatos.Provider>;
}

export function useEstadoDatos(): EstadoDatos {
  return useContext(ContextoDatos);
}
