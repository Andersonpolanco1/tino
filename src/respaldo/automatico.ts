import { useEffect, useSyncExternalStore } from 'react';
import { validarContenido, type ContenidoRespaldo } from './contenido';

// Respaldo automático (decisión D81, completa D62): una copia de los datos del usuario en la
// carpeta de documentos de Tino, que el respaldo del propio teléfono (Google en Android, iCloud
// en iPhone) lleva a la nube y trae de vuelta a un teléfono nuevo. Tino no la cifra: la protege
// el cifrado del respaldo del sistema, y no guarda datos que permitan robar o suplantar (D25).
// Nunca sale hacia un servidor de Tino.

export const NOMBRE_RESPALDO_AUTOMATICO = 'tino-respaldo-automatico.json';
const TEMPORAL = `${NOMBRE_RESPALDO_AUTOMATICO}.tmp`;
const FORMATO = 'tino-respaldo-automatico';
const VERSION = 1;

interface ArchivoRespaldo {
  formato: typeof FORMATO;
  version: number;
  contenido: ContenidoRespaldo;
}

// Dónde se guardan los archivos; en las pruebas, en memoria.
export interface Almacenamiento {
  leer(nombre: string): Promise<string | null>;
  escribir(nombre: string, texto: string): Promise<void>;
  // Reemplaza "destino" por "origen" (el temporal ya escrito).
  mover(origen: string, destino: string): Promise<void>;
  borrar(nombre: string): Promise<void>;
}

// Carpeta de documentos de la app: en Android se incluye en sus reglas de respaldo
// (plugins/respaldo-android.js); en iPhone, iCloud respalda los documentos.
function almacenamientoDelTelefono(): Almacenamiento {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga diferida, solo en el teléfono
  const { File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  const archivo = (nombre: string) => new File(Paths.document, nombre);
  return {
    async leer(nombre) {
      const f = archivo(nombre);
      return f.exists ? f.text() : null;
    },
    async escribir(nombre, texto) {
      const f = archivo(nombre);
      if (f.exists) f.delete();
      f.create();
      f.write(texto);
    },
    async mover(origen, destino) {
      const d = archivo(destino);
      if (d.exists) d.delete();
      await archivo(origen).move(d);
    },
    async borrar(nombre) {
      const f = archivo(nombre);
      if (f.exists) f.delete();
    },
  };
}

let almacenamiento: Almacenamiento | null = null;
const usar = () => (almacenamiento ??= almacenamientoDelTelefono());

// Solo para las pruebas.
export function usarAlmacenamiento(a: Almacenamiento | null) {
  almacenamiento = a;
  estado = undefined;
}

// Para Ajustes: fecha (ISO) de la última copia guardada y si el último intento de guardarla
// falló (por ejemplo, sin espacio en el teléfono). undefined = todavía no se leyó el archivo.
export interface EstadoRespaldoAutomatico {
  fecha: string | null;
  fallo: boolean;
}
let estado: EstadoRespaldoAutomatico | undefined;
const oyentes = new Set<() => void>();
function avisar(nuevo: EstadoRespaldoAutomatico) {
  estado = nuevo;
  oyentes.forEach(o => o());
}

// Escribe primero un temporal y después lo mueve: si el teléfono se apaga a mitad, queda la
// copia anterior o la nueva completa, nunca una a medias.
export async function guardarRespaldoAutomatico(contenido: ContenidoRespaldo): Promise<void> {
  const a = usar();
  const archivo: ArchivoRespaldo = { formato: FORMATO, version: VERSION, contenido };
  try {
    await a.escribir(TEMPORAL, JSON.stringify(archivo));
    await a.mover(TEMPORAL, NOMBRE_RESPALDO_AUTOMATICO);
  } catch (error) {
    await a.borrar(TEMPORAL).catch(() => {});
    avisar({ fecha: estado?.fecha ?? null, fallo: true });
    throw error;
  }
  avisar({ fecha: contenido.creadoEn, fallo: false });
}

function interpretar(texto: string | null): ContenidoRespaldo | null {
  if (!texto) return null;
  try {
    const archivo = JSON.parse(texto) as Partial<ArchivoRespaldo>;
    if (archivo.formato !== FORMATO || typeof archivo.version !== 'number' || archivo.version > VERSION) return null;
    return validarContenido(archivo.contenido);
  } catch {
    return null;
  }
}

// La copia, validada; null si no hay o no se puede leer. Nunca lanza: una copia dañada o de una
// versión más nueva de Tino se ignora. Si quedó un temporal sin mover, se usa ese.
export async function leerRespaldoAutomatico(): Promise<ContenidoRespaldo | null> {
  const a = usar();
  try {
    const contenido = interpretar(await a.leer(NOMBRE_RESPALDO_AUTOMATICO)) ?? interpretar(await a.leer(TEMPORAL));
    avisar({ fecha: contenido?.creadoEn ?? null, fallo: estado?.fallo ?? false });
    return contenido;
  } catch {
    return null;
  }
}

export async function borrarRespaldoAutomatico(): Promise<void> {
  const a = usar();
  await a.borrar(NOMBRE_RESPALDO_AUTOMATICO).catch(() => {});
  await a.borrar(TEMPORAL).catch(() => {});
  avisar({ fecha: null, fallo: false });
}

const SIN_LEER: EstadoRespaldoAutomatico = { fecha: null, fallo: false };

// Estado de la copia para Ajustes; la lee del archivo la primera vez.
export function useEstadoRespaldoAutomatico(): EstadoRespaldoAutomatico {
  const valor = useSyncExternalStore(
    escuchar => {
      oyentes.add(escuchar);
      return () => oyentes.delete(escuchar);
    },
    () => estado,
  );
  useEffect(() => {
    if (estado === undefined) leerRespaldoAutomatico().catch(() => {});
  }, []);
  return valor ?? SIN_LEER;
}
