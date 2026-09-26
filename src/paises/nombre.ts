import type { CodigoPais } from '../tipos/tipos';

type Traducir = (clave: string, opciones?: Record<string, unknown>) => string;

// Nombre del país desde i18n; si no hay texto propio, "Otro país (XX)".
export function nombrePais(t: Traducir, codigo: CodigoPais): string {
  return t(`paises.${codigo}`, { defaultValue: t('paises.otro', { codigo }) });
}
