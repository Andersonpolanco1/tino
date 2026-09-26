import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { FuenteIngreso, Preferencias, Tarjeta } from '../tipos/tipos';

export interface DatosExportados {
  formato: 'tino-exportacion';
  version: 1;
  exportadoEn: string;
  preferencias: Preferencias | null;
  tarjetas: Tarjeta[];
  ingresos: FuenteIngreso[];
}

// Sección 6 técnica: el usuario puede sacar sus datos en un archivo. Nunca incluye nada que
// la app no guarde (no hay números de tarjeta, montos ni claves).
export function datosParaExportar(preferencias: Preferencias | null, tarjetas: Tarjeta[], ingresos: FuenteIngreso[], ahora: Date): DatosExportados {
  return { formato: 'tino-exportacion', version: 1, exportadoEn: ahora.toISOString(), preferencias, tarjetas, ingresos };
}

// Escribe el JSON en la caché y abre el menú de compartir del sistema.
export async function compartirExportacion(datos: DatosExportados, tituloDialogo: string): Promise<void> {
  const archivo = new File(Paths.cache, `tino-${datos.exportadoEn.slice(0, 10)}.json`);
  if (archivo.exists) archivo.delete();
  archivo.create();
  archivo.write(JSON.stringify(datos, null, 2));
  await Sharing.shareAsync(archivo.uri, { mimeType: 'application/json', dialogTitle: tituloDialogo, UTI: 'public.json' });
}
