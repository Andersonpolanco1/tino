import type { FechaISO, Preferencias } from '../tipos/tipos';
import { numeroDe } from '../motor/fechas';

// Decisión D88: los datos de uso (analítica y reporte de fallos) solo salen con el consentimiento
// libre, expreso y consciente del usuario (Ley 172-13, arts. 5.4 y 80). Se pregunta al terminar el
// onboarding y, si dice que no, hasta dos veces más desde Inicio, bien espaciadas.

// Días que esperan el segundo y el tercer intento después de cada "No, gracias".
export const DIAS_ENTRE_PREGUNTAS = [14, 60];
export const MAXIMO_PREGUNTAS = 3;

// 'pendiente': aún no respondió nunca; los eventos esperan en memoria hasta su respuesta.
// 'activa': dijo que sí (o la encendió en Ajustes). 'apagada': dijo que no o la apagó.
export type EstadoAnalitica = 'activa' | 'pendiente' | 'apagada';

export function estadoAnalitica(p: Preferencias | null): EstadoAnalitica {
  if (!p) return 'apagada';
  if (p.analiticaDecidida) return p.analiticaActiva ? 'activa' : 'apagada';
  return p.analiticaPreguntas?.length ? 'apagada' : 'pendiente';
}

// Si hoy toca preguntar: nunca después de una decisión, ni pasados los 3 intentos, ni antes de
// que se cumplan los días desde el último "No". Sin ningún "No", toca de una vez (por ejemplo,
// quien restauró un respaldo sin pasar por el onboarding).
export function tocaPreguntarAnalitica(p: Preferencias | null, hoy: FechaISO): boolean {
  if (!p || p.analiticaDecidida) return false;
  const noes = p.analiticaPreguntas ?? [];
  if (noes.length >= MAXIMO_PREGUNTAS) return false;
  if (!noes.length) return true;
  const ultimo = noes[noes.length - 1];
  return numeroDe(hoy) - numeroDe(ultimo) >= DIAS_ENTRE_PREGUNTAS[noes.length - 1];
}

// "Sí, compartir" decide para siempre; "No, gracias" suma un intento.
export function responderAnalitica(p: Preferencias, si: boolean, hoy: FechaISO): Preferencias {
  if (si) return { ...p, analiticaActiva: true, analiticaDecidida: hoy };
  return { ...p, analiticaActiva: false, analiticaPreguntas: [...(p.analiticaPreguntas ?? []), hoy] };
}

// Tocar el interruptor de Ajustes, en cualquier sentido, es una decisión: no se vuelve a preguntar.
export function decidirAnaliticaEnAjustes(p: Preferencias, activa: boolean, hoy: FechaISO): Preferencias {
  return { ...p, analiticaActiva: activa, analiticaDecidida: hoy };
}
