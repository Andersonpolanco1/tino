import { Pressable, StyleSheet } from 'react-native';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'alerta';
  deshabilitado?: boolean;
}

// BotonPrimario de la sección 8.3 técnica y sus variantes.
export function Boton({ titulo, onPress, variante = 'primario', deshabilitado = false }: Props) {
  const tema = useTema();
  const fondo = variante === 'primario' ? tema.color.primario : variante === 'alerta' ? tema.color.alertaFondo : tema.color.neutroFondo;
  const colorTexto = variante === 'primario' ? 'sobrePrimario' : variante === 'alerta' ? 'alertaTexto' : 'texto';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        {
          backgroundColor: fondo,
          minHeight: tema.toqueMinimo,
          borderRadius: tema.radio.control,
          paddingHorizontal: tema.espacio.l,
          paddingVertical: tema.espacio.m,
          opacity: deshabilitado ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Texto variante="cuerpoFuerte" color={colorTexto}>
        {titulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({ boton: { alignItems: 'center', justifyContent: 'center' } });
