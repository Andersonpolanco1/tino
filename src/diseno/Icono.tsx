import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTema } from './useTema';
import type { RolColor } from './tema';

// Íconos de trazo copiados de las maquetas (docs/maquetas), en una cuadrícula de 24.
const TRAZOS = {
  compra: (
    <>
      <Path d="M6 7h12l-1 13H7L6 7z" />
      <Path d="M9 7a3 3 0 0 1 6 0" />
    </>
  ),
  check: <Path d="M5 12l5 5 9-10" />,
  abajo: <Path d="M6 9l6 6 6-6" />,
  derecha: <Path d="M9 6l6 6-6 6" />,
  inicio: (
    <>
      <Path d="M3 11l9-7 9 7" />
      <Path d="M5 10v10h14V10" />
    </>
  ),
  tarjetas: (
    <>
      <Rect x={3} y={6} width={18} height={12} rx={2} />
      <Path d="M3 10h18" />
    </>
  ),
  ajustes: (
    <>
      <Path d="M4 7h10" />
      <Path d="M18 7h2" />
      <Circle cx={16} cy={7} r={2} />
      <Path d="M4 17h4" />
      <Path d="M12 17h8" />
      <Circle cx={10} cy={17} r={2} />
    </>
  ),
  reloj: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  alto: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M8 12h8" />
    </>
  ),
  mas: <Path d="M12 5v14M5 12h14" />,
} as const;

export type NombreIcono = keyof typeof TRAZOS;

interface Props {
  nombre: NombreIcono;
  color?: RolColor;
  tamano?: number;
}

// Decorativo: el texto de al lado dice lo mismo, así que el lector de pantalla lo ignora.
export function Icono({ nombre, color = 'texto', tamano }: Props) {
  const tema = useTema();
  const lado = tamano ?? tema.espacio.xxl;
  return (
    <Svg
      width={lado}
      height={lado}
      viewBox="0 0 24 24"
      fill="none"
      stroke={tema.color[color]}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {TRAZOS[nombre]}
    </Svg>
  );
}
