import { z } from 'zod';
import type { FuenteIngreso, Preferencias, Tarjeta } from '../tipos/tipos';
import type { EstadoSugerencias } from '../sugerencias/elegir';
import type { ConsultasSql } from '../datos/conexion';
import { VERSION_ESQUEMA } from '../datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '../datos/repositorios';
import { ErrorRespaldo } from './cifrado';

// Todo lo que el usuario guardó en Tino. No incluye la clave de la base (nunca sale del
// teléfono), el identificador de analítica (un teléfono nuevo recibe uno nuevo) ni la compra de
// Pro (vive en la cuenta de la tienda y vuelve con "Restaurar compras").
export interface ContenidoRespaldo {
  esquema: number;
  creadoEn: string;
  preferencias: Preferencias | null;
  tarjetas: Tarjeta[];
  ingresos: FuenteIngreso[];
  sugerencias: EstadoSugerencias | null;
}

export function contenidoDe(datos: Omit<ContenidoRespaldo, 'esquema' | 'creadoEn'>, ahora: Date): ContenidoRespaldo {
  return { esquema: VERSION_ESQUEMA, creadoEn: ahora.toISOString(), ...datos };
}

// Comprobación de la forma, sin exigir cada campo opcional: los objetos se guardan tal cual
// (decisión D4) y los repositorios vuelven a rechazar números de tarjeta completos.
const tarjeta = z.looseObject({
  id: z.string().min(1),
  alias: z.string(),
  diaCorte: z.number().int().min(1).max(31),
  fechaLimite: z.looseObject({ tipo: z.enum(['dia_del_mes', 'dias_despues_corte']) }),
  monedaFacturacion: z.string(),
  recompensa: z.looseObject({ tipo: z.enum(['ninguna', 'puntos', 'cashback']) }),
  enPausa: z.boolean(),
  creadaEn: z.string(),
});
const ingreso = z.looseObject({ id: z.string().min(1), nombre: z.string(), frecuencia: z.looseObject({ tipo: z.string() }), ajusteDiaNoHabil: z.string() });
const preferencias = z.looseObject({ pais: z.string(), idioma: z.string(), enfoque: z.looseObject({ modo: z.string() }), plan: z.enum(['gratis', 'pro']) });
const sugerencias = z.looseObject({ activa: z.unknown(), descartes: z.record(z.string(), z.unknown()) });
const esquema = z.object({
  esquema: z.number().int().min(1),
  creadoEn: z.string(),
  preferencias: preferencias.nullable(),
  tarjetas: z.array(tarjeta),
  ingresos: z.array(ingreso),
  sugerencias: sugerencias.nullable(),
});

export function validarContenido(valor: unknown): ContenidoRespaldo {
  const r = esquema.safeParse(valor);
  if (!r.success) throw new ErrorRespaldo('formato');
  // Un respaldo de una versión más nueva de Tino puede traer datos que esta no entiende.
  if (r.data.esquema > VERSION_ESQUEMA) throw new ErrorRespaldo('version');
  return r.data as unknown as ContenidoRespaldo;
}

// Reemplaza todos los datos del usuario en una sola transacción: si algo falla, no cambia nada.
export async function reemplazarDatos(
  enTransaccion: (tarea: (tx: ConsultasSql) => Promise<void>) => Promise<void>,
  contenido: ContenidoRespaldo,
  ahora: string,
): Promise<void> {
  await enTransaccion(async tx => {
    for (const tabla of ['tarjetas', 'fuentes_ingreso', 'preferencias', 'sugerencias']) await tx.runAsync(`DELETE FROM ${tabla}`, []);
    const tarjetas = repositorioTarjetas(tx);
    for (const t of contenido.tarjetas) await tarjetas.guardar(t, ahora);
    const ingresos = repositorioIngresos(tx);
    for (const i of contenido.ingresos) await ingresos.guardar(i, ahora);
    if (contenido.preferencias) await repositorioPreferencias(tx).guardar(contenido.preferencias, ahora);
    if (contenido.sugerencias) await repositorioSugerencias(tx).guardar(contenido.sugerencias, ahora);
  });
}
