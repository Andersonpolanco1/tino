import { gcm } from '@noble/ciphers/aes.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';

// Respaldo cifrado (decisión D62): la clave sale de una contraseña que elige el usuario, así el
// archivo se puede abrir en otro teléfono, pero sin ella no se lee nada, ni los datos ni cómo
// están organizados. La contraseña no se guarda en ningún lado.

export const FORMATO = 'tino-respaldo';
export const VERSION_FORMATO = 1;
export const LARGO_MINIMO_CONTRASENA = 8;

// scrypt hace lento probar contraseñas a ciegas; N = 2^15 tarda uno o dos segundos en un
// teléfono y usa 32 MB. Los parámetros viajan en el archivo para poder subirlos más adelante.
const KDF = { N: 2 ** 15, r: 8, p: 1 };
const LARGO_SAL = 16;
const LARGO_IV = 12;

export type MotivoError = 'formato' | 'contrasena' | 'version';

export class ErrorRespaldo extends Error {
  constructor(readonly motivo: MotivoError) {
    super(`Respaldo no válido: ${motivo}`);
  }
}

interface Archivo {
  formato: typeof FORMATO;
  version: number;
  kdf: { algoritmo: 'scrypt'; N: number; r: number; p: number; sal: string };
  cifrado: { algoritmo: 'AES-256-GCM'; iv: string; datos: string };
}

// ---------- Bytes, texto y base64 sin depender de APIs que Hermes no tiene ----------

function aUtf8(texto: string): Uint8Array {
  return new TextEncoder().encode(texto);
}

function deUtf8(bytes: Uint8Array): string {
  let texto = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    let cp: number;
    if (b < 0x80) cp = b;
    else if (b < 0xe0) cp = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
    else if (b < 0xf0) cp = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    else cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    texto += String.fromCodePoint(cp);
  }
  return texto;
}

function aBase64(bytes: Uint8Array): string {
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

function deBase64(texto: string): Uint8Array {
  const binario = atob(texto);
  return Uint8Array.from(binario, c => c.charCodeAt(0));
}

// El encabezado también queda autenticado: si alguien cambia los parámetros, el descifrado falla.
const datosAsociados = (version: number, kdf: { N: number; r: number; p: number }) => aUtf8(`${FORMATO}:${version}:${kdf.N}:${kdf.r}:${kdf.p}`);

async function derivarClave(contrasena: string, sal: Uint8Array, kdf: { N: number; r: number; p: number }): Promise<Uint8Array> {
  // La contraseña se normaliza para que "ñ" escrita en otro teclado dé la misma clave.
  return scryptAsync(contrasena.normalize('NFC'), sal, { ...kdf, dkLen: 32 });
}

// Cifra cualquier contenido serializable. `aleatorio` viene del sistema (expo-crypto) en la app.
export async function cifrarRespaldo(contenido: unknown, contrasena: string, aleatorio: (n: number) => Uint8Array): Promise<string> {
  const sal = aleatorio(LARGO_SAL);
  const iv = aleatorio(LARGO_IV);
  const clave = await derivarClave(contrasena, sal, KDF);
  const datos = gcm(clave, iv, datosAsociados(VERSION_FORMATO, KDF)).encrypt(aUtf8(JSON.stringify(contenido)));
  const archivo: Archivo = {
    formato: FORMATO,
    version: VERSION_FORMATO,
    kdf: { algoritmo: 'scrypt', ...KDF, sal: aBase64(sal) },
    cifrado: { algoritmo: 'AES-256-GCM', iv: aBase64(iv), datos: aBase64(datos) },
  };
  return JSON.stringify(archivo);
}

function leerArchivo(texto: string): Archivo {
  let archivo: Archivo;
  try {
    archivo = JSON.parse(texto);
  } catch {
    throw new ErrorRespaldo('formato');
  }
  if (archivo?.formato !== FORMATO || !archivo.kdf || !archivo.cifrado) throw new ErrorRespaldo('formato');
  if (archivo.version > VERSION_FORMATO) throw new ErrorRespaldo('version');
  if (archivo.kdf.algoritmo !== 'scrypt' || archivo.cifrado.algoritmo !== 'AES-256-GCM') throw new ErrorRespaldo('formato');
  return archivo;
}

// Una contraseña equivocada y un archivo alterado se ven igual para AES-GCM: ambos fallan la
// verificación. Se informa como contraseña, que es lo más probable.
export async function descifrarRespaldo(texto: string, contrasena: string): Promise<unknown> {
  const archivo = leerArchivo(texto);
  const { N, r, p } = archivo.kdf;
  let claro: Uint8Array;
  try {
    const clave = await derivarClave(contrasena, deBase64(archivo.kdf.sal), { N, r, p });
    claro = gcm(clave, deBase64(archivo.cifrado.iv), datosAsociados(archivo.version, { N, r, p })).decrypt(deBase64(archivo.cifrado.datos));
  } catch {
    throw new ErrorRespaldo('contrasena');
  }
  try {
    return JSON.parse(deUtf8(claro));
  } catch {
    throw new ErrorRespaldo('formato');
  }
}
