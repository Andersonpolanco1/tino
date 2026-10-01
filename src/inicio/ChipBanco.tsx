import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { MarcaBanco, Texto, useTema } from '../diseno';
import { OPACIDAD_INICIALES } from './vista';

// Pequeña tarjeta con el logo del banco o, sin logo, sus iniciales (rediseño y decisión D63).
// Iniciales con "sobreDestacado": translúcida dentro de la tarjeta de hoy; si no, en jade.
export function ChipBanco({
  iniciales,
  logo,
  sobreDestacado = false,
  grande = false,
}: {
  iniciales: string;
  logo?: ImageSourcePropType;
  sobreDestacado?: boolean;
  grande?: boolean;
}) {
  const tema = useTema();
  const [ancho, alto, radio] = grande ? [52, 36, 8] : [44, 30, 7];
  const conIniciales = (
    <View
      style={{
        width: ancho,
        height: alto,
        borderRadius: radio,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: sobreDestacado ? 'transparent' : tema.color.primario,
      }}
    >
      {sobreDestacado ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.color.sobreDestacado, opacity: OPACIDAD_INICIALES[tema.modo] }]} />
      ) : null}
      <Texto variante="etiquetaMayus" color={sobreDestacado ? 'sobreDestacado' : 'sobrePrimario'}>
        {iniciales}
      </Texto>
    </View>
  );
  return <MarcaBanco logo={logo} ancho={ancho} alto={alto} radio={radio} lado={alto - 8} respaldo={conIniciales} />;
}
