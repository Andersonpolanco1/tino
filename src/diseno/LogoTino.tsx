import Svg, { G, Rect } from 'react-native-svg';
import { useTema } from './useTema';

// El ícono de Tino tal como se ve en el teléfono (decisión D104; geometría de
// herramientas/iconos/generar_iconos.py): tres tarjetas apiladas de frente sobre el jade, atrás la
// jade, en medio la dorada y al frente la blanca con su chip y la línea del número. Lleva su fondo
// porque la tarjeta blanca, plana y sin sombra, se perdería sobre los fondos claros. Los huecos se
// pintan del color del fondo: react-native-svg no dibuja bien las máscaras en todos los Android.
const ATRAS = { x: 126, y: 102, width: 260, height: 164, rx: 24 };
const MEDIO = { x: 111, y: 152, width: 290, height: 183, rx: 26 };
const FRENTE = { x: 96, y: 210, width: 320, height: 202, rx: 28 };
const HUECOS_FRENTE = [
  { x: 136, y: 268, width: 64, height: 48, rx: 12 },
  { x: 136, y: 350, width: 170, height: 20, rx: 10 },
];
const SEPARACION = 12;
// Igual que AUMENTO_TIENDAS y CENTRO del generador.
const MOVER = 'translate(256 256) scale(1.2) translate(-256 -257)';

type Caja = { x: number; y: number; width: number; height: number; rx: number };
const agrandar = (c: Caja): Caja => ({
  x: c.x - SEPARACION,
  y: c.y - SEPARACION,
  width: c.width + 2 * SEPARACION,
  height: c.height + 2 * SEPARACION,
  rx: c.rx + SEPARACION,
});

export function LogoTino({ tamano = 64 }: { tamano?: number }) {
  const tema = useTema();
  const fondo = tema.color.logoFondo;
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 512 512" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* Esquinas de los iconos de iOS: 22.5% del lado. */}
      <Rect width={512} height={512} rx={115} fill={fondo} />
      <G transform={MOVER}>
        <Rect {...ATRAS} fill={tema.color.logoAtras} />
        <Rect {...agrandar(MEDIO)} fill={fondo} />
        <Rect {...MEDIO} fill={tema.color.logoMedio} />
        <Rect {...agrandar(FRENTE)} fill={fondo} />
        <Rect {...FRENTE} fill={tema.color.logoFrente} />
        {HUECOS_FRENTE.map((h, i) => (
          <Rect key={i} {...h} fill={fondo} />
        ))}
      </G>
    </Svg>
  );
}
