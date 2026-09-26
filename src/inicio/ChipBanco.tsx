import { StyleSheet, View } from 'react-native';
import { Texto, useTema } from '../diseno';

// Pequeña tarjeta con las iniciales del banco (rediseño). "sobreDestacado": translúcida
// dentro de la tarjeta de hoy; si no, en jade.
export function ChipBanco({ iniciales, sobreDestacado = false, grande = false }: { iniciales: string; sobreDestacado?: boolean; grande?: boolean }) {
  const tema = useTema();
  return (
    <View
      style={{
        width: grande ? 52 : 44,
        height: grande ? 36 : 30,
        borderRadius: grande ? 8 : 7,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: sobreDestacado ? 'transparent' : tema.color.primario,
      }}
    >
      {sobreDestacado ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.color.sobreDestacado, opacity: tema.modo === 'oscuro' ? 0.12 : 0.18 }]} />
      ) : null}
      <Texto variante="etiqueta" color={sobreDestacado ? 'sobreDestacado' : 'sobrePrimario'} style={{ fontSize: grande ? 12 : 11, letterSpacing: 0.5 }}>
        {iniciales}
      </Texto>
    </View>
  );
}
