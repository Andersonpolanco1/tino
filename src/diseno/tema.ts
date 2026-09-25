import type { TextStyle } from 'react-native';
import tokens from './tokens.json';
import { nombreFuente } from './fuentes';

export type ModoTema = 'claro' | 'oscuro';
export type RolColor = keyof typeof tokens.color.claro;
export type VarianteTexto = keyof typeof tokens.tipografia.escala;

export interface Tema {
  modo: ModoTema;
  color: Record<RolColor, string>;
  texto: Record<VarianteTexto, TextStyle>;
  espacio: typeof tokens.espacio;
  radio: typeof tokens.radio;
  toqueMinimo: number;
}

function estilosTexto(): Record<VarianteTexto, TextStyle> {
  const escala = tokens.tipografia.escala;
  const estilos = {} as Record<VarianteTexto, TextStyle>;
  for (const variante of Object.keys(escala) as VarianteTexto[]) {
    const { familia, tamano, peso, altoLinea } = escala[variante];
    estilos[variante] = {
      fontFamily: nombreFuente(familia as 'titulos' | 'texto', peso),
      fontSize: tamano,
      lineHeight: Math.round(tamano * altoLinea),
    };
  }
  return estilos;
}

const texto = estilosTexto();

// Las pantallas solo usan los roles semánticos del modo, nunca los colores base.
export const temas: Record<ModoTema, Tema> = {
  claro: { modo: 'claro', color: tokens.color.claro, texto, espacio: tokens.espacio, radio: tokens.radio, toqueMinimo: tokens.toque.minimo },
  oscuro: { modo: 'oscuro', color: tokens.color.oscuro, texto, espacio: tokens.espacio, radio: tokens.radio, toqueMinimo: tokens.toque.minimo },
};

export function temaPara(esquema: string | null | undefined): Tema {
  return esquema === 'dark' ? temas.oscuro : temas.claro;
}
