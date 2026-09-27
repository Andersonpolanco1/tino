import type { ImageSourcePropType } from 'react-native';
import type { Emisor } from '../tipos/tipos';

// Copias incluidas de los logos del catálogo, para verlos sin conexión (decisión D63).
// Un logo que el catálogo nombra y la app no trae se pide al servidor; si el servidor
// quita el campo "logo" de un emisor, la app vuelve a mostrar sus iniciales.
const incluidos: Record<string, ImageSourcePropType> = {
  'alaver.png': require('../../datos-publicos/logos/alaver.png'),
  'apap.png': require('../../datos-publicos/logos/apap.png'),
  'asociacion-cibao.png': require('../../datos-publicos/logos/asociacion-cibao.png'),
  'asociacion-la-nacional.png': require('../../datos-publicos/logos/asociacion-la-nacional.png'),
  'banco-ademi.png': require('../../datos-publicos/logos/banco-ademi.png'),
  'banco-adopem.png': require('../../datos-publicos/logos/banco-adopem.png'),
  'banco-caribe.png': require('../../datos-publicos/logos/banco-caribe.png'),
  'banco-popular.png': require('../../datos-publicos/logos/banco-popular.png'),
  'banco-santa-cruz.png': require('../../datos-publicos/logos/banco-santa-cruz.png'),
  'banesco.png': require('../../datos-publicos/logos/banesco.png'),
  'banfondesa.png': require('../../datos-publicos/logos/banfondesa.png'),
  'banreservas.png': require('../../datos-publicos/logos/banreservas.png'),
  'bdi.png': require('../../datos-publicos/logos/bdi.png'),
  'bhd.png': require('../../datos-publicos/logos/bhd.png'),
  'citibank.png': require('../../datos-publicos/logos/citibank.png'),
  'lafise.png': require('../../datos-publicos/logos/lafise.png'),
  'lopez-de-haro.png': require('../../datos-publicos/logos/lopez-de-haro.png'),
  'motor-credito.png': require('../../datos-publicos/logos/motor-credito.png'),
  'promerica.png': require('../../datos-publicos/logos/promerica.png'),
  'qik.png': require('../../datos-publicos/logos/qik.png'),
  'scotiabank.png': require('../../datos-publicos/logos/scotiabank.png'),
  'vimenca.png': require('../../datos-publicos/logos/vimenca.png'),
};

export function logoEmisor(
  emisor: Pick<Emisor, 'logo'> | null | undefined,
  urlBase: string | undefined = process.env.EXPO_PUBLIC_URL_DATOS_PUBLICOS,
): ImageSourcePropType | undefined {
  if (!emisor?.logo) return undefined;
  return incluidos[emisor.logo] ?? (urlBase ? { uri: `${urlBase}/v1/logos/${emisor.logo}` } : undefined);
}

export function logoIncluido(archivo: string): boolean {
  return archivo in incluidos;
}
