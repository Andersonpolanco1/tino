import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esDO from './es-DO.json';

export const recursos = {
  'es-DO': { translation: esDO },
} as const;

export type Idioma = keyof typeof recursos;
export const IDIOMA_PREDETERMINADO: Idioma = 'es-DO';

// Primer idioma del país que tenga textos; si no, uno del mismo idioma base; si no, el predeterminado.
export function elegirIdioma(candidatos: string[]): Idioma {
  const disponibles = Object.keys(recursos) as Idioma[];
  for (const c of candidatos) {
    const exacto = disponibles.find(d => d.toLowerCase() === c.toLowerCase());
    if (exacto) return exacto;
  }
  for (const c of candidatos) {
    const base = c.split('-')[0].toLowerCase();
    const mismoIdioma = disponibles.find(d => d.split('-')[0].toLowerCase() === base);
    if (mismoIdioma) return mismoIdioma;
  }
  return IDIOMA_PREDETERMINADO;
}

export function iniciarI18n(idioma: Idioma = IDIOMA_PREDETERMINADO) {
  if (i18n.isInitialized) {
    if (i18n.language !== idioma) i18n.changeLanguage(idioma);
    return i18n;
  }
  i18n.use(initReactI18next).init({
    resources: recursos,
    lng: idioma,
    fallbackLng: IDIOMA_PREDETERMINADO,
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return i18n;
}

export { i18n };
