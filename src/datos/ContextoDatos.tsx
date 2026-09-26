import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { abrirBase, type BaseLocal } from './base';

export type EstadoDatos =
  | { estado: 'cargando' }
  | { estado: 'lista'; base: BaseLocal }
  | { estado: 'error'; error: unknown };

interface ValorDatos {
  estado: EstadoDatos;
  // Vuelve a abrir la base; tras "Borrar todo" crea una base y una clave nuevas.
  reabrir: () => void;
}

const ContextoDatos = createContext<ValorDatos>({ estado: { estado: 'cargando' }, reabrir: () => {} });

export function ProveedorDatos({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoDatos>({ estado: 'cargando' });
  const [apertura, setApertura] = useState(0);

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
  }, [apertura]);

  const reabrir = useCallback(() => {
    setEstado({ estado: 'cargando' });
    setApertura(n => n + 1);
  }, []);

  return <ContextoDatos.Provider value={{ estado, reabrir }}>{children}</ContextoDatos.Provider>;
}

export function useEstadoDatos(): EstadoDatos {
  return useContext(ContextoDatos).estado;
}

export function useReabrirDatos(): () => void {
  return useContext(ContextoDatos).reabrir;
}
