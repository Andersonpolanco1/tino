import type { Catalogo, CodigoPais } from '../tipos/tipos';
import type { ConsultasSql } from '../datos/conexion';
import { compararVersiones, esquemaIndice, validarCatalogo } from './esquema';
import catalogoDO from '../../datos-publicos/emisores-do.json';

// Copias incluidas en la app, para funcionar sin conexión desde la primera apertura.
const incluidos: Record<string, Catalogo> = {
  DO: catalogoDO as Catalogo,
};

export function catalogoIncluido(pais: CodigoPais): Catalogo | null {
  return incluidos[pais] ?? null;
}

const HORAS_ENTRE_REVISIONES = 24;
const claveCatalogo = (pais: CodigoPais) => `catalogo:${pais}`;
const claveRevision = (pais: CodigoPais) => `revision-catalogo:${pais}`;

export interface DependenciasCatalogo {
  db: ConsultasSql;
  // Dirección base del servidor de datos públicos; vacía = solo la copia incluida.
  urlBase: string | undefined;
  descargar: (url: string) => Promise<unknown>;
  ahora: () => Date;
}

// La copia más nueva entre la incluida y la caché. Una caché más vieja que la copia
// incluida (por ejemplo, tras actualizar la app) se ignora.
export async function catalogoLocal(pais: CodigoPais, db: ConsultasSql): Promise<Catalogo | null> {
  const incluido = catalogoIncluido(pais);
  const fila = await db.getFirstAsync<{ datos: string }>('SELECT datos FROM cache_publica WHERE clave = ?', [claveCatalogo(pais)]);
  const enCache = fila ? validarCatalogo(JSON.parse(fila.datos)) : null;
  if (!enCache) return incluido;
  if (!incluido) return enCache;
  return compararVersiones(enCache.version, incluido.version) > 0 ? enCache : incluido;
}

async function guardarEnCache(db: ConsultasSql, clave: string, version: string, datos: string, ahora: Date) {
  await db.runAsync(
    `INSERT INTO cache_publica (clave, version, datos, descargadoEn) VALUES (?, ?, ?, ?)
     ON CONFLICT(clave) DO UPDATE SET version = excluded.version, datos = excluded.datos, descargadoEn = excluded.descargadoEn`,
    [clave, version, datos, ahora.toISOString()],
  );
}

// Sección 7.1 técnica: si pasaron más de 24 horas, revisa el índice; si hay una versión
// más nueva, la descarga, la valida y solo entonces reemplaza la caché. Cualquier fallo
// deja todo como estaba. Devuelve el catálogo nuevo o null si no cambió.
export async function actualizarCatalogo(pais: CodigoPais, actual: Catalogo | null, deps: DependenciasCatalogo): Promise<Catalogo | null> {
  if (!deps.urlBase) return null;
  const ahora = deps.ahora();
  const revision = await deps.db.getFirstAsync<{ descargadoEn: string }>(
    'SELECT descargadoEn FROM cache_publica WHERE clave = ?',
    [claveRevision(pais)],
  );
  if (revision && ahora.getTime() - new Date(revision.descargadoEn).getTime() < HORAS_ENTRE_REVISIONES * 3_600_000) return null;

  try {
    const indice = esquemaIndice.safeParse(await deps.descargar(`${deps.urlBase}/v1/paises/index.json`));
    await guardarEnCache(deps.db, claveRevision(pais), '-', '', ahora);
    if (!indice.success) return null;
    const version = indice.data.paises.find(p => p.codigo === pais)?.versionCatalogo;
    if (!version || (actual && compararVersiones(version, actual.version) <= 0)) return null;

    const nuevo = validarCatalogo(await deps.descargar(`${deps.urlBase}/v1/catalogos/${pais.toLowerCase()}.json`));
    if (!nuevo || nuevo.pais !== pais || compararVersiones(nuevo.version, version) !== 0) return null;
    await guardarEnCache(deps.db, claveCatalogo(pais), nuevo.version, JSON.stringify(nuevo), ahora);
    return nuevo;
  } catch {
    return null;
  }
}
