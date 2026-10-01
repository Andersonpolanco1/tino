import { Text, type TextProps } from 'react-native';
import { useTema } from './useTema';
import type { RolColor, VarianteTexto } from './tema';

interface Props extends TextProps {
  variante?: VarianteTexto;
  color?: RolColor;
}

// Texto base: tipografía y color desde los tokens; escala con el tamaño de texto del sistema. Las
// cifras y los títulos grandes crecen hasta su tope (crecimientoMaximo); el resto, sin límite.
export function Texto({ variante = 'cuerpo', color = 'texto', style, maxFontSizeMultiplier, ...resto }: Props) {
  const tema = useTema();
  return (
    <Text
      {...resto}
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? tema.crecimientoTexto[variante]}
      style={[tema.texto[variante], { color: tema.color[color] }, style]}
    />
  );
}
