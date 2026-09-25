import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { repositorioPreferencias, repositorioTarjetas } from '../datos/repositorios';
import type { BaseLocal } from '../datos/base';
import { crearAlmacen, type Almacen, type EstadoApp } from './almacen';

const ContextoAlmacen = createContext<Almacen | null>(null);

// Se monta cuando la base cifrada ya abrió; carga tarjetas y preferencias una vez.
export function ProveedorAlmacen({ base, children }: { base: BaseLocal; children: ReactNode }) {
  const [almacen] = useState(() =>
    crearAlmacen({ tarjetas: repositorioTarjetas(base.db), preferencias: repositorioPreferencias(base.db) }),
  );
  useEffect(() => {
    almacen.getState().cargar();
  }, [almacen]);
  return <ContextoAlmacen.Provider value={almacen}>{children}</ContextoAlmacen.Provider>;
}

// Para pruebas de pantallas: un almacén ya creado.
export function ProveedorAlmacenDePrueba({ almacen, children }: { almacen: Almacen; children: ReactNode }) {
  return <ContextoAlmacen.Provider value={almacen}>{children}</ContextoAlmacen.Provider>;
}

export function useAlmacen<T>(selector: (estado: EstadoApp) => T): T {
  const almacen = useContext(ContextoAlmacen);
  if (!almacen) throw new Error('useAlmacen debe usarse dentro de ProveedorAlmacen');
  return useStore(almacen, selector);
}
