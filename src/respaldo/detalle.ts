import type { TFunction } from 'i18next';
import type { Preferencias } from '../tipos/tipos';
import { formatearFechaHora } from '../i18n';
import type { EstadoRespaldoAutomatico } from './automatico';

// Estado del respaldo automático en palabras (D81), para su fila y la de "Tus datos" (D83).
export function detalleRespaldoAutomatico(t: TFunction, idioma: string, preferencias: Preferencias | null, respaldo: EstadoRespaldoAutomatico): string {
  if (!preferencias?.respaldoAutomatico) return t('ajustes.respaldoAutomaticoDetalle');
  if (respaldo.fallo) return t('ajustes.respaldoFallo');
  return respaldo.fecha ? t('ajustes.respaldoUltima', { fecha: formatearFechaHora(respaldo.fecha, idioma) }) : t('ajustes.respaldoPendiente');
}
