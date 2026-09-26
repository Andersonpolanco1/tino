import type { TextStyle } from 'react-native';
import tokens from './tokens.json';
import { nombreFuente } from './fuentes';

export type ModoTema = 'claro' | 'oscuro';
export type RolColor = keyof typeof tokens.color.claro;
export type VarianteTexto = keyof typeof tokens.tipografia.escala;

export type NivelSombra = keyof typeof tokens.sombra.claro;

export interface Tema {
  modo: ModoTema;
  color: Record<RolColor, string>;
  texto: Record<VarianteTexto, TextStyle>;
  espacio: typeof tokens.espacio;
  radio: typeof tokens.radio;
  // Valores de boxShadow listos para el estilo; '' = sin sombra en ese modo.
  sombra: Record<NivelSombra, string>;
  toqueMinimo: number;
}

// "#0D1B16" + 0.06 → "rgba(13, 27, 22, 0.06)".
export function conOpacidad(hex: string, opacidad: number): string {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${opacidad})`;
}

function sombras(modo: ModoTema, color: Record<RolColor, string>): Record<NivelSombra, string> {
  const definicion = tokens.sombra[modo];
  const resultado = {} as Record<NivelSombra, string>;
  for (const nivel of Object.keys(definicion) as NivelSombra[]) {
    const { color: rol, capas } = definicion[nivel];
    resultado[nivel] = capas.map(([y, desenfoque, opacidad]) => `0px ${y}px ${desenfoque}px ${conOpacidad(color[rol as RolColor], opacidad)}`).join(', ');
  }
  return resultado;
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
const crear = (modo: ModoTema): Tema => {
  const color = tokens.color[modo] as Record<RolColor, string>;
  return { modo, color, texto, espacio: tokens.espacio, radio: tokens.radio, sombra: sombras(modo, color), toqueMinimo: tokens.toque.minimo };
};

export const temas: Record<ModoTema, Tema> = { claro: crear('claro'), oscuro: crear('oscuro') };

export function temaPara(esquema: string | null | undefined): Tema {
  return esquema === 'dark' ? temas.oscuro : temas.claro;
}
