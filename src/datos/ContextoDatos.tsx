import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { abrirBase, type BaseLocal } from './base';

export type EstadoDatos =
  | { estado: 'cargando' }
  | { estado: 'lista'; base: BaseLocal }
  | { estado: 'error'; error: unknown };

const ContextoDatos = createContext<EstadoDatos>({ estado: 'cargando' });

export function ProveedorDatos({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoDatos>({ estado: 'cargando' });

  useEffect(() => {
    let activo = true;
    abrirBase().then(
      base => activo && setEstado({ estado: 'lista', base }),
      error => {
        // Solo en desarrollo; el reporte de fallos llega en la etapa 6.
        if (__DEV__) console.error('No se pudo abrir la base local', error);
        if (activo) setEstado({ estado: 'error', error });
      },
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
