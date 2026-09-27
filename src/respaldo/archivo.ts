import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

// El respaldo se guarda donde el usuario quiera (Drive, Archivos, correo): Tino no lo sube a
// ningún servidor. Va cifrado, así que no importa por dónde viaje.
export async function compartirRespaldo(texto: string, fecha: string, tituloDialogo: string): Promise<void> {
  const archivo = new File(Paths.cache, `tino-respaldo-${fecha}.tino`);
  if (archivo.exists) archivo.delete();
  archivo.create();
  archivo.write(texto);
  try {
    await Sharing.shareAsync(archivo.uri, { mimeType: 'application/octet-stream', dialogTitle: tituloDialogo, UTI: 'public.data' });
  } finally {
    if (archivo.exists) archivo.delete();
  }
}

// null si el usuario cancela. Se acepta cualquier tipo: los sistemas no conocen ".tino".
export async function elegirRespaldo(): Promise<{ nombre: string; texto: string } | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (r.canceled || !r.assets?.length) return null;
  const { uri, name } = r.assets[0];
  const archivo = new File(uri);
  try {
    return { nombre: name, texto: await archivo.text() };
  } finally {
    if (archivo.exists) archivo.delete();
  }
}
