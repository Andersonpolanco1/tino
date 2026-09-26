import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from './useTema';

// Alto que ocupa la barra de pestañas flotante, para que el contenido no quede debajo.
export const ALTO_BARRA_PESTANAS = 66 + 20;

interface Props {
  children: ReactNode;
  // Arriba del contenido y fuera del desplazamiento: BarraSuperior.
  arriba?: ReactNode;
  // Fijo abajo: el botón principal de la pantalla (rediseño).
  pie?: ReactNode;
  conPestanas?: boolean;
}

// Contenedor base de cada pantalla: fondo del tema, márgenes seguros y desplazamiento
// para que el texto grande del sistema nunca quede cortado.
export function Pantalla({ children, arriba, pie, conPestanas = false }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const espacioAbajo = conPestanas ? ALTO_BARRA_PESTANAS + tema.espacio.xl : tema.espacio.xxl;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.llenar, { backgroundColor: tema.color.fondo }]}>
      {arriba ? <View style={{ paddingHorizontal: tema.espacio.xl, paddingTop: tema.espacio.l }}>{arriba}</View> : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingHorizontal: tema.espacio.xl, paddingTop: tema.espacio.xl, paddingBottom: espacioAbajo, gap: 18 }}
      >
        {children}
      </ScrollView>
      {pie ? (
        <View style={{ paddingHorizontal: tema.espacio.xl, paddingTop: tema.espacio.s, paddingBottom: Math.max(margenes.bottom, tema.espacio.l) + tema.espacio.s, gap: tema.espacio.s }}>
          {pie}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({ llenar: { flex: 1 } });
