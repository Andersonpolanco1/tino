import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props {
  visible: boolean;
  titulo: string;
  onCerrar: () => void;
  // Texto accesible del fondo oscurecido, que también cierra la hoja.
  cerrarEtiqueta: string;
  children: ReactNode;
}

// Hoja deslizable desde abajo (sección 8.3 técnica), sobre el Modal de React Native.
export function Hoja({ visible, titulo, onCerrar, cerrarEtiqueta, children }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <View style={estilos.llenar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cerrarEtiqueta}
          onPress={onCerrar}
          style={[StyleSheet.absoluteFill, { backgroundColor: tema.color.velo, opacity: 0.4 }]}
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: tema.color.superficie,
            borderTopLeftRadius: tema.radio.destacada,
            borderTopRightRadius: tema.radio.destacada,
            padding: tema.espacio.xl,
            paddingBottom: tema.espacio.xl + margenes.bottom,
            gap: tema.espacio.m,
          }}
        >
          <Texto variante="subtitulo" accessibilityRole="header">
            {titulo}
          </Texto>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({ llenar: { flex: 1, justifyContent: 'flex-end' } });
