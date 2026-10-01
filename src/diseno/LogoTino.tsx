import Svg, { Rect } from 'react-native-svg';
import { useTema } from './useTema';

// El ícono de Tino sin su fondo verde (decisión D94; geometría de herramientas/iconos/generar_iconos.py):
// tres tarjetas en abanico, en el mismo estilo que el ícono de las tiendas. Al frente, blanca y con su
// chip, la tarjeta que Tino elige; detrás, las demás en jade vivo. Se lee en claro y en oscuro.
const TARJETA = { x: 138, y: 212, width: 236, height: 149, rx: 22 };
const PIVOTE = '168 352';

export function LogoTino({ tamano = 64 }: { tamano?: number }) {
  const tema = useTema();
  return (
    <Svg width={tamano} height={tamano} viewBox="83 110 300 300" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect {...TARJETA} fill={tema.color.logoAtras} fillOpacity={0.45} transform={`rotate(-20 ${PIVOTE})`} />
      <Rect {...TARJETA} fill={tema.color.logoAtras} fillOpacity={0.8} transform={`rotate(-10 ${PIVOTE})`} />
      {/* Sombra en dos capas: los filtros de react-native-svg no se dibujan bien en Android. */}
      <Rect {...TARJETA} y={TARJETA.y + 10} fill={tema.color.velo} fillOpacity={0.08} />
      <Rect {...TARJETA} y={TARJETA.y + 5} fill={tema.color.velo} fillOpacity={0.12} />
      <Rect {...TARJETA} fill={tema.color.fondoLogo} />
      <Rect x={164} y={270} width={42} height={32} rx={7} fill={tema.color.logoChip} />
    </Svg>
  );
}
