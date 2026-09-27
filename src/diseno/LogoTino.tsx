import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTema } from './useTema';

// El ícono de Tino sin su fondo verde (fuente: assets/iconos/fuente-icono.svg), con los colores
// del tema para que se lea en claro y oscuro: la tarjeta elegida en jade, las demás detrás.
export function LogoTino({ tamano = 64 }: { tamano?: number }) {
  const tema = useTema();
  return (
    <Svg width={tamano} height={tamano} viewBox="86 96 340 340" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={118} y={126} width={300} height={188} rx={26} fill={tema.color.primario} fillOpacity={0.28} transform="rotate(-9 268 220)" />
      <Rect x={96} y={182} width={320} height={200} rx={28} fill={tema.color.primario} />
      <Rect x={132} y={296} width={62} height={46} rx={11} fill={tema.color.recompensaPunto} />
      <Circle cx={344} cy={248} r={46} fill={tema.color.sobrePrimario} />
      <Path d="M322 249l15 15 30-31" fill="none" stroke={tema.color.primario} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
