import { z } from 'zod';
import type { Catalogo } from '../tipos/tipos';

// Esquema del catálogo publicado (tipo Catalogo de tipos.ts). Un archivo que no lo cumpla
// nunca reemplaza la caché (sección 7.1 técnica).
const monedaFacturacion = z.enum(['solo_principal', 'doble_balance', 'solo_usd', 'solo_local']);

const producto = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nombre: z.string().min(1),
  marca: z.enum(['visa', 'mastercard', 'amex', 'otra']),
  monedaFacturacion: monedaFacturacion.optional(),
  plantilla: z.record(z.string(), z.unknown()).optional(),
});

const emisor = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nombreCorto: z.string().min(1),
  nombreLegal: z.string().min(1),
  tipoEntidad: z.string(),
  grupo: z.union([z.literal(1), z.literal(2)]),
  participacionActivosPct: z.number().nullable(),
  emiteTarjetas: z.enum(['confirmado', 'por_verificar', 'no']),
  productos: z.array(producto),
});

export const esquemaCatalogo = z
  .object({
    pais: z.string().length(2),
    version: z.string().regex(/^\d+(\.\d+)*$/),
    generadoEn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fuente: z.string(),
    emisores: z.array(emisor).min(1),
  })
  .refine(c => new Set(c.emisores.map(e => e.id)).size === c.emisores.length, 'Emisores repetidos')
  .refine(c => {
    const ids = c.emisores.flatMap(e => e.productos.map(p => p.id));
    return new Set(ids).size === ids.length;
  }, 'Productos repetidos');

export function validarCatalogo(datos: unknown): Catalogo | null {
  const resultado = esquemaCatalogo.safeParse(datos);
  return resultado.success ? (datos as Catalogo) : null;
}

// Índice del servidor: /v1/paises/index.json.
export const esquemaIndice = z.object({
  paises: z.array(z.object({ codigo: z.string(), versionCatalogo: z.string().nullable() })),
});

// "2026.09.10" es más nueva que "2026.09.9": se compara por partes numéricas.
export function compararVersiones(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diferencia = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diferencia) return Math.sign(diferencia);
  }
  return 0;
}
