import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTema } from './useTema';

// Contenedor base de cada pantalla: fondo del tema, márgenes seguros y desplazamiento
// para que el texto grande del sistema nunca quede cortado.
export function Pantalla({ children }: { children: ReactNode }) {
  const tema = useTema();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.llenar, { backgroundColor: tema.color.fondo }]}>
      <ScrollView contentContainerStyle={{ padding: tema.espacio.l, gap: tema.espacio.m }}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({ llenar: { flex: 1 } });
