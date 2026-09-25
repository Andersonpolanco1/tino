import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTema } from './useTema';

interface Props {
  children: ReactNode;
  // Con encabezado de navegación arriba, el margen superior ya lo pone el encabezado.
  conEncabezado?: boolean;
}

// Contenedor base de cada pantalla: fondo del tema, márgenes seguros y desplazamiento
// para que el texto grande del sistema nunca quede cortado.
export function Pantalla({ children, conEncabezado = false }: Props) {
  const tema = useTema();
  return (
    <SafeAreaView
      edges={conEncabezado ? ['left', 'right', 'bottom'] : ['top', 'left', 'right']}
      style={[estilos.llenar, { backgroundColor: tema.color.fondo }]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ padding: tema.espacio.l, gap: tema.espacio.l }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({ llenar: { flex: 1 } });
