import type { TextStyle } from 'react-native';
import tokens from './tokens.json';
import { nombreFuente } from './fuentes';
import type { TemaApp } from '../tipos/tipos';

// Apariencia mientras el usuario no elija otra en Ajustes (decisión D98): claro, no la del sistema.
export const TEMA_PREDETERMINADO: TemaApp = 'claro';

export type ModoTema = 'claro' | 'oscuro';
export type RolColor = keyof typeof tokens.color.claro;
export type VarianteTexto = keyof typeof tokens.tipografia.escala;

export type NivelSombra = keyof typeof tokens.sombra.claro;

export interface Tema {
  modo: ModoTema;
  color: Record<RolColor, string>;
  texto: Record<VarianteTexto, TextStyle>;
  // Cuánto puede crecer cada variante con el tamaño de texto del sistema; 0 = sin tope.
  crecimientoTexto: Record<VarianteTexto, number>;
  crecimientoBarras: number;
  espacio: typeof tokens.espacio;
  radio: typeof tokens.radio;
  opacidad: typeof tokens.opacidad;
  desenfoque: typeof tokens.desenfoque;
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

interface DefinicionTexto {
  familia: string;
  tamano: number;
  peso: number;
  altoLinea: number;
  espaciado?: number;
  mayusculas?: boolean;
  crecimientoMaximo?: number;
  cifrasFijas?: boolean;
}

const escala = tokens.tipografia.escala as Record<VarianteTexto, DefinicionTexto>;

function estilosTexto(): Record<VarianteTexto, TextStyle> {
  const estilos = {} as Record<VarianteTexto, TextStyle>;
  for (const variante of Object.keys(escala) as VarianteTexto[]) {
    const { familia, tamano, peso, altoLinea, espaciado, mayusculas, cifrasFijas } = escala[variante];
    estilos[variante] = {
      fontFamily: nombreFuente(familia as 'titulos' | 'texto', peso),
      fontSize: tamano,
      lineHeight: Math.round(tamano * altoLinea),
      // Android suma espacio de la fuente arriba y abajo (en Bricolage, 1.56 em frente a 1.2 en iOS),
      // y las cifras quedaban corridas hacia abajo. En iOS no tiene efecto.
      includeFontPadding: false,
      ...(espaciado ? { letterSpacing: espaciado } : {}),
      ...(mayusculas ? { textTransform: 'uppercase' as const } : {}),
      // Cifras de ancho fijo: los números no se mueven de lado al cambiar.
      ...(cifrasFijas ? { fontVariant: ['tabular-nums' as const] } : {}),
    };
  }
  return estilos;
}

function crecimientos(): Record<VarianteTexto, number> {
  const resultado = {} as Record<VarianteTexto, number>;
  for (const variante of Object.keys(escala) as VarianteTexto[]) resultado[variante] = escala[variante].crecimientoMaximo ?? 0;
  return resultado;
}

const texto = estilosTexto();
const crecimientoTexto = crecimientos();

// Las pantallas solo usan los roles semánticos del modo, nunca los colores base.
const crear = (modo: ModoTema): Tema => {
  const color = tokens.color[modo] as Record<RolColor, string>;
  return { modo, color, texto, crecimientoTexto, crecimientoBarras: tokens.tipografia.crecimientoBarras, espacio: tokens.espacio, radio: tokens.radio, opacidad: tokens.opacidad, desenfoque: tokens.desenfoque, sombra: sombras(modo, color), toqueMinimo: tokens.toque.minimo };
};

export const temas: Record<ModoTema, Tema> = { claro: crear('claro'), oscuro: crear('oscuro') };

export function temaPara(esquema: string | null | undefined): Tema {
  return esquema === 'dark' ? temas.oscuro : temas.claro;
}
