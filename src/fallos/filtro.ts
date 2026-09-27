// Filtro de cada reporte antes de salir del teléfono (sección 7.3 técnica): sin migas, sin
// datos de la persona y sin nada que parezca un número de tarjeta.

// De 13 dígitos en adelante, aunque vengan separados por espacios, puntos o guiones, igual
// que la validación de los campos de texto (sección 6 técnica).
const NUMERO_TARJETA = /\d(?:[\s.-]?\d){12,}/g;
const REEMPLAZO = '[filtrado]';

// Migas (qué tocó y qué vio antes del fallo), persona, petición y datos extra.
const CAMPOS_QUITADOS = ['breadcrumbs', 'user', 'request', 'extra', 'server_name'];

// Identificadores y direcciones que el servicio necesita intactos: son hexadecimales o
// técnicos, nunca datos del usuario, y una racha de dígitos los rompería.
const CAMPOS_TECNICOS = new Set([
  'event_id',
  'trace_id',
  'span_id',
  'parent_span_id',
  'debug_id',
  'debug_meta',
  'sdk',
  'timestamp',
  'start_timestamp',
  'release',
  'dist',
  'instruction_addr',
  'image_addr',
  'symbol_addr',
]);

export function limpiarTexto(texto: string): string {
  return texto.replace(NUMERO_TARJETA, REEMPLAZO);
}

function limpiarValor(valor: unknown): unknown {
  if (typeof valor === 'string') return limpiarTexto(valor);
  if (Array.isArray(valor)) return valor.map(limpiarValor);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, v]) => [clave, CAMPOS_TECNICOS.has(clave) ? v : limpiarValor(v)]),
    );
  }
  return valor;
}

export function limpiarEvento<T extends object>(evento: T): T {
  const copia = { ...evento } as Record<string, unknown>;
  for (const campo of CAMPOS_QUITADOS) delete copia[campo];
  return limpiarValor(copia) as T;
}
