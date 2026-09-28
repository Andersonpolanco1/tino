import { requireOptionalNativeModule } from 'expo';

// Puente con el widget nativo de Android (sección 16.3 de la especificación). En iOS, en la web
// y en las pruebas el módulo no existe y las funciones no hacen nada.
interface ModuloWidget {
  guardarResumen(json: string): void;
  guardarLogos(rutas: Record<string, string>): void;
  widgetsInstalados(): number;
}

const modulo = requireOptionalNativeModule<ModuloWidget>('TinoWidget');

export function widgetDisponible(): boolean {
  return modulo !== null;
}

// Guarda el resumen en el almacenamiento privado de la app y redibuja los widgets.
export function guardarResumen(json: string) {
  modulo?.guardarResumen(json);
}

// Copia los logos (archivo del catálogo -> archivo local) a la carpeta del widget y borra los
// que ya no usa ninguna tarjeta.
export function guardarLogos(rutas: Record<string, string>) {
  modulo?.guardarLogos(rutas);
}

export function widgetsInstalados(): number {
  return modulo?.widgetsInstalados() ?? 0;
}
