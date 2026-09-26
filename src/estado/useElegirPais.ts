import { useCallback } from 'react';
import type { CodigoPais } from '../tipos/tipos';
import { usePais } from '../paises';
import { useAlmacen } from './ContextoAlmacen';

// Cambia el país de la app y lo guarda en las preferencias, para que la próxima vez se use
// el que eligió el usuario y no el de la región del teléfono.
export function useElegirPais() {
  const { cambiarPais, idiomaDe } = usePais();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  return useCallback(
    async (pais: CodigoPais) => {
      // Primero se guarda: el layout sincroniza el país con las preferencias guardadas.
      if (preferencias) await guardarPreferencias({ ...preferencias, pais, idioma: idiomaDe(pais) });
      cambiarPais(pais);
    },
    [cambiarPais, idiomaDe, preferencias, guardarPreferencias],
  );
}
