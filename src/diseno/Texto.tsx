import { Text, type TextProps } from 'react-native';
import { useTema } from './useTema';
import type { RolColor, VarianteTexto } from './tema';

interface Props extends TextProps {
  variante?: VarianteTexto;
  color?: RolColor;
}

// Texto base: tipografía y color desde los tokens; escala con el tamaño de texto del sistema.
export function Texto({ variante = 'cuerpo', color = 'texto', style, ...resto }: Props) {
  const tema = useTema();
  return <Text {...resto} allowFontScaling style={[tema.texto[variante], { color: tema.color[color] }, style]} />;
}
