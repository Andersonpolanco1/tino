import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTema } from './useTema';

interface Props {
  children: ReactNode;
  radio?: number;
  style?: ViewStyle;
}

// Tarjeta blanca con sombra suave, sin bordes (rediseño): la base de listas y bloques.
export function Superficie({ children, radio, style }: Props) {
  const tema = useTema();
  return (
    <View style={[{ backgroundColor: tema.color.superficie, borderRadius: radio ?? tema.radio.lista, boxShadow: tema.sombra.tarjeta }, style]}>
      {children}
    </View>
  );
}
