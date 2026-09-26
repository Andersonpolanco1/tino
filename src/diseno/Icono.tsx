import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTema } from './useTema';
import type { RolColor } from './tema';

// Íconos de trazo copiados de las maquetas (rediseño en claude.ai), en una cuadrícula de 24.
const TRAZOS = {
  // Carrito: se reconoce como "comprar" mejor que la bolsa de las maquetas.
  compra: (
    <>
      <Path d="M2.5 3h2.2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L20.8 7H5.6" />
      <Circle cx={9} cy={20} r={1.4} />
      <Circle cx={17} cy={20} r={1.4} />
    </>
  ),
  check: <Path d="M5 12l5 5 9-10" />,
  abajo: <Path d="M6 9l6 6 6-6" />,
  derecha: <Path d="M9 6l6 6-6 6" />,
  atras: <Path d="M15 6l-6 6 6 6" />,
  cerrar: (
    <>
      <Path d="M6 6l12 12" />
      <Path d="M18 6L6 18" />
    </>
  ),
  editar: <Path d="M4 20h4L19 9l-4-4L4 16v4z" />,
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
  calendario: (
    <>
      <Rect x={4} y={5} width={16} height={15} rx={2} />
      <Path d="M4 10h16" />
      <Path d="M9 3v4" />
      <Path d="M15 3v4" />
    </>
  ),
  info: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11v5" />
      <Path d="M12 8h.01" />
    </>
  ),
  menos: <Path d="M6 12h12" />,
  mas: (
    <>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </>
  ),
  pausa: (
    <>
      <Path d="M9 6v12" />
      <Path d="M15 6v12" />
    </>
  ),
  dinero: (
    <>
      <Path d="M12 3v18" />
      <Path d="M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6" />
    </>
  ),
  moneda: (
    <>
      <Circle cx={12} cy={12} r={8} />
      <Path d="M12 8v8" />
      <Path d="M9.5 10.5c0-1 1-1.5 2.5-1.5s2.5.7 2.5 1.7c0 2.3-5 1-5 3.3 0 1 1 1.5 2.5 1.5s2.5-.5 2.5-1.5" />
    </>
  ),
  globo: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M3 12h18" />
      <Path d="M12 3a14 14 0 0 1 0 18" />
      <Path d="M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  descargar: (
    <>
      <Path d="M12 4v11" />
      <Path d="M7 10l5 5 5-5" />
      <Path d="M5 20h14" />
    </>
  ),
  basura: (
    <>
      <Path d="M5 7h14" />
      <Path d="M10 11v6" />
      <Path d="M14 11v6" />
      <Path d="M6 7l1 13h10l1-13" />
      <Path d="M9 7V4h6v3" />
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
} as const;

export type NombreIcono = keyof typeof TRAZOS;

interface Props {
  nombre: NombreIcono;
  color?: RolColor;
  tamano?: number;
  grosor?: number;
}

// Decorativo: el botón o el texto de al lado dice lo mismo, así que el lector de pantalla lo ignora.
export function Icono({ nombre, color = 'texto', tamano, grosor = 2 }: Props) {
  const tema = useTema();
  const lado = tamano ?? tema.espacio.xl;
  return (
    <Svg
      width={lado}
      height={lado}
      viewBox="0 0 24 24"
      fill="none"
      stroke={tema.color[color]}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {TRAZOS[nombre]}
    </Svg>
  );
}
