import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Catalogo, CodigoPais } from '../tipos/tipos';
import type { ConsultasSql } from '../datos/conexion';
import { actualizarCatalogo, catalogoIncluido, catalogoLocal } from './catalogo';

const ContextoCatalogo = createContext<Catalogo | null>(null);

async function descargarJson(url: string): Promise<unknown> {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.json();
}

// Muestra al instante la copia incluida; después usa la caché y revisa el servidor.
// null = el país no tiene catálogo (modo sin catálogo).
export function ProveedorCatalogo({ pais, db, children }: { pais: CodigoPais; db: ConsultasSql; children: ReactNode }) {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(() => catalogoIncluido(pais));

  useEffect(() => {
    let activo = true;
    (async () => {
      const local = await catalogoLocal(pais, db);
      if (activo) setCatalogo(local);
      const nuevo = await actualizarCatalogo(pais, local, {
        db,
        urlBase: process.env.EXPO_PUBLIC_URL_DATOS_PUBLICOS,
        descargar: descargarJson,
        ahora: () => new Date(),
      });
      if (activo && nuevo) setCatalogo(nuevo);
    })().catch(() => {});
    return () => {
      activo = false;
    };
  }, [pais, db]);

  return <ContextoCatalogo.Provider value={catalogo}>{children}</ContextoCatalogo.Provider>;
}

// Para pruebas de pantallas: un catálogo fijo, sin base ni servidor.
export function ProveedorCatalogoDePrueba({ catalogo, children }: { catalogo: Catalogo | null; children: ReactNode }) {
  return <ContextoCatalogo.Provider value={catalogo}>{children}</ContextoCatalogo.Provider>;
}

export function useCatalogo(): Catalogo | null {
  return useContext(ContextoCatalogo);
}
