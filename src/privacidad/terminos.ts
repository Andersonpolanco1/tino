import type { FechaISO, Preferencias } from '../tipos/tipos';

// Decisión D88: fecha de "Última actualización" de los términos y la política publicados en
// polancolabs.com. Se cambia junto con esos textos cuando cambien.
export const VERSION_TERMINOS = '2026-09-29';

// Direcciones de los documentos, desde las variables de entorno (secretos de EAS). Vacías, la app
// no muestra el enlace.
export const DOCUMENTOS = {
  terminos: process.env.EXPO_PUBLIC_URL_TERMINOS ?? '',
  privacidad: process.env.EXPO_PUBLIC_URL_PRIVACIDAD ?? '',
  soporte: process.env.EXPO_PUBLIC_URL_SOPORTE ?? '',
};

// Al tocar "Empezar" o restaurar desde la bienvenida (Ley 358-05, art. 83: aceptación expresa).
export function aceptarTerminos(p: Preferencias, hoy: FechaISO): Preferencias {
  return { ...p, terminosAceptados: { version: VERSION_TERMINOS, fecha: hoy } };
}

// Un respaldo trae las preferencias de otro teléfono: la aceptación que vale es la de este.
export function conservarAceptacion(restauradas: Preferencias, actuales: Preferencias | null): Preferencias {
  const aceptacion = actuales?.terminosAceptados ?? restauradas.terminosAceptados;
  return aceptacion ? { ...restauradas, terminosAceptados: aceptacion } : restauradas;
}
