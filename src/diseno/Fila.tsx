import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props {
  titulo: string;
  detalle?: string;
  onPress?: () => void;
  derecha?: ReactNode;
}

// Fila tocable de una lista, sobre la superficie del tema.
export function Fila({ titulo, detalle, onPress, derecha }: Props) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: tema.espacio.m,
        minHeight: tema.toqueMinimo,
        paddingHorizontal: tema.espacio.l,
        paddingVertical: tema.espacio.m,
        backgroundColor: pressed ? tema.color.neutroFondo : tema.color.superficie,
        borderRadius: tema.radio.control,
        borderWidth: 1,
        borderColor: tema.color.borde,
      })}
    >
      <View style={{ flex: 1, gap: tema.espacio.xs }}>
        <Texto variante="cuerpoFuerte">{titulo}</Texto>
        {detalle ? (
          <Texto variante="apoyo" color="textoSecundario">
            {detalle}
          </Texto>
        ) : null}
      </View>
      {derecha}
    </Pressable>
  );
}
