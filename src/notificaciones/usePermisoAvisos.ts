import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { estadoPermiso, pedirPermiso, type EstadoPermiso } from './programar';

// Estado del permiso de avisos; se vuelve a leer al regresar a la app, por si el usuario lo
// cambió en los ajustes del teléfono.
export function usePermisoAvisos() {
  const [estado, setEstado] = useState<EstadoPermiso | null>(null);
  const leer = useCallback(() => {
    estadoPermiso()
      .then(setEstado)
      .catch(() => setEstado('negado'));
  }, []);

  useEffect(() => {
    leer();
    const sub = AppState.addEventListener('change', e => e === 'active' && leer());
    return () => sub.remove();
  }, [leer]);

  const pedir = useCallback(async () => {
    const concedido = await pedirPermiso().catch(() => false);
    leer();
    return concedido;
  }, [leer]);

  return { estado, pedir };
}
