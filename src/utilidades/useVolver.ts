import { useCallback } from 'react';
import { useRouter } from 'expo-router';

// Atrás y cerrar: vuelve a la pantalla anterior, o a Inicio si la pantalla se abrió directo (un
// aviso o un enlace) y no hay a dónde volver; si no, el botón no haría nada.
export function useVolver() {
  const router = useRouter();
  return useCallback(() => (router.canGoBack() ? router.back() : router.replace('/inicio')), [router]);
}
